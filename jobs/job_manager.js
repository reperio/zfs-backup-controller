const _ = require('lodash');
const moment = require('moment');

class JobManager {
    constructor(logger, uow, agentApi, job_interval) {
        this.logger = logger;
        this.uow = uow;
        this.agentApi = agentApi;

        this.job_interval_id = null;
        this.job_interval = job_interval;
    }

    //starts the execution loop
    start() {
        this.job_interval_id = setInterval(() => this.execute(), this.job_interval);
    }

    //main execution of the job manager, finds and executes jobs
    async execute() {
        this.logger.info('');
        this.logger.info('Job Manager execution started.');

        try {
            const jobs = await this.uow.jobs_repository.getAllEnabledJobs();
            const filtered_jobs = await this.filter_eligible_jobs(jobs);
            await this.execute_jobs(filtered_jobs);
        } catch(err) {
            this.logger.error('Job manager execution failed.');
            this.logger.error(err);
        }

        try {
            await this.cleanup_finished_jobs();
        } catch (err) {
            this.logger.error('Finished job cleanup failed.');
            this.logger.error(err);
        }
        
        this.logger.info('Job Manager execution finished.');
    }

    async cleanup_finished_jobs() {
        this.logger.info('Fetching unfinished jobs to clean up');
        const jobs = await this.uow.job_history_repository.getUnfinishedJobs();

        for (let job of jobs) {
            try {
                let updated = false;
                this.logger.info(`${job.job_id} | ${job.id} Checking job.`);
                if (job.source_result === 3 || job.target_result === 3) {
                    this.logger.info(`${job.job_id} | ${job.id} Setting job to failed.`);
                    job.result = 3;
                    updated = true;
                }

                if (job.source_result === 2 && job.target_result === 2) {
                    this.logger.info(`${job.job_id} | ${job.id} Setting job to successful.`);
                    job.result = 2;
                    updated = true;
                }
                
                if (updated) {
                    const end_date_time = new Date();
                    job.end_date_time = end_date_time;
                    
                    await this.uow.job_history_repository.update_job_history_entry(job);
                }
            } catch(err) {
                this.logger.error(`${job.job_id} | ${job.id} Checking job failed.`);
                this.logger.error(err);
            }
        }
    }

    async filter_eligible_jobs(jobs) {
        this.logger.info(`Filtering ${jobs.length} jobs`);

        const unfinished_job_history_entries = await this.uow.job_history_repository.getUnfinishedJobs();

        const job_ids = unfinished_job_history_entries.map((job_history) => {
            return job_history.job_id;
        });

        this.logger.info(job_ids);

        const jobs_not_currently_executing = _.filter(jobs, (job) => {
            return !_.includes(job_ids, job.id);
        });

        this.logger.info(`Filtering ${jobs_not_currently_executing.length} jobs not already executing`);


        return _.filter(jobs_not_currently_executing, this.should_job_execute.bind(this));
    }

    should_job_execute(job) {
        const current_scheduled_time = this.get_most_recent_schedule_time(job);
        this.logger.debug(`Current Scheduled Execution Time: ${current_scheduled_time}`);

        const last_scheduled_execution = moment(job.last_schedule);
        this.logger.debug(`Last Scheduled Execution Time: ${last_scheduled_execution}`);

        return !last_scheduled_execution.isValid() || current_scheduled_time.isAfter(last_scheduled_execution);
    }

    get_most_recent_schedule_time(job) {
        //quarter hour is special as moment doesn't support finding 15 minute increments
        if (job.job_schedule.name === 'quarter_hour') {
            /*
                Jump to the beginning of the next hour, subtract 15 minutes until we are earlier than the current time.
            */
            const now = moment();
            let current = moment().add(1, 'hours').startOf('hour').add(job.offset, 'minutes');

            while (current.isSameOrAfter(now)) {
                current = current.subtract(15, 'minutes');
            }

            return current;
        }
        
        //mapping schedule names to moment intervals for all schedules other than quarter_hourly
        const schedule_map = {
            hourly: 'hour',
            daily: 'day',
            weekly: 'week',
            monthly: 'month'
        };

        if (!schedule_map[job.job_schedule.name]) {
            throw new Error('Job has invalid schedule');
        }

        const schedule_interval = schedule_map[job.job_schedule.name];
        
        const now = moment();
        const start_of_schedule_period = moment().startOf(schedule_interval);

        //if we are in a new iteration but ~before~ the offset, we need to back up by 1 iteration
        if (now.diff(start_of_schedule_period, 'minutes') < job.offset) {
            start_of_schedule_period.subtract(1, schedule_interval);
        }
        
        //apply the offset
        return start_of_schedule_period.add(job.offset, 'minutes');
    }

    async execute_jobs(jobs) {
        this.logger.info(`Executing ${jobs.length} jobs`);

        for (let index = 0 ; index < jobs.length ; ++index) {
            const current_job = jobs[index];

            try {
                this.logger.info(`${current_job.id} - Job starting.`);
                await this.execute_job(current_job);
                this.logger.info(`${current_job.id} - Job finished.`);
            } catch (err) {
                this.logger.error(`${current_job.id} - Job failed to execute.`);
                this.logger.error(err);
            }
        }
    }

    static get_random_port() {
        //returns a random port between 49152 and 65535
        //TODO maybe put the port range in the config file?
        return Math.floor(Math.random() * 16383) + 49152;
    }

    async execute_job(job) {
        this.logger.info(`  ${job.id} - Executing.`);
        const start_date_time = new Date();

        const schedule_date_time = this.get_most_recent_schedule_time(job);

        //update last execution on job
        this.logger.info(`  ${job.id} - Updating job last execution.`);
        
        job.last_schedule = schedule_date_time.toDate();
        job.last_execution = start_date_time;
        await this.uow.jobs_repository.update_job_entry(job);
        this.logger.info(`  ${job.id} - Job Updated.`);

        const port = JobManager.get_random_port();

        this.logger.info(`  ${job.id} - Creating Job History entry.`);

        //create job history record
        const job_history = await this.uow.job_history_repository.create_job_history({
            job_id: job.id,
            start_date_time: start_date_time,
            end_date_time: null,
            schedule_date_time: schedule_date_time.toDate(),
            result: 0,
            source_message: null,
            target_message: null,
            source_result: 0,
            target_result: 0,
            port: port
        });

        if (!job_history) {
            throw new Error('Failed to create job history entry.');
        }

        const time_stamp = moment().utc();
        const snapshot_name = `${job.source_location}@${time_stamp.format('YYYYMMDDHHmm')}`;

        let snapshot = null;

        try {
            //build snapshot
            await this.agentApi.zfs_create_snapshot(job, job_history, snapshot_name, false);
            const snapshot_data = {
                name: snapshot_name,
                source_host_id: job.source_host_id,
                source_host_status: 1,
                target_host_id: job.target_host_id,
                target_host_status: 0,
                snapshot_date_time: time_stamp.toDate(),
                job_history_id: job_history.id,
                job_id: job_history.job_id
            };

            //add snapshot to snapshots table
            snapshot = await this.uow.snapshots_repository.createSnapshotEntry(job_history, snapshot_data);

            if (!snapshot) {
                throw new Error('Failed to create snapshot');
            }
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - Create snapshot step failed.`);
            job_history.target_message = '';
            job_history.source_result = 3;
            job_history.result = 3;
            await this.uow.job_history_repository.update_job_history_entry(job_history);
            throw err;
        }

        try {
            //request zfs receive
            await this.agentApi.zfs_receive(job, job_history, port, true);

            //update job history record
            this.logger.info(`  ${job.id} | ${job_history.id} - Updating job history entry.`);
            job_history.target_message = '';
            job_history.target_result = 1;
            await this.uow.job_history_repository.update_job_history_entry(job_history);
            this.logger.info(`  ${job.id} | ${job_history.id} - Job history entry updated.`);
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - ZFS Receive step failed.`);
            job_history.target_message = '';
            job_history.target_result = 3;
            job_history.result = 3;
            await this.uow.job_history_repository.update_job_history_entry(job_history);
            throw err;
        }

        try {
            //request zfs send
            let last_snapshot_name = null;

            const most_recent_successful = await this.uow.job_history_repository.get_most_recent_successful_job_history(job.id);

            if (most_recent_successful) {
                last_snapshot_name = most_recent_successful.job_history_snapshot.name;
            }

            await this.agentApi.zfs_send(job, job_history, snapshot_name, port, last_snapshot_name, true);

            //update job history record
            this.logger.info(`  ${job.id} | ${job_history.id} - Updating job history entry.`);
            job_history.source_message = '';
            job_history.source_result = 1;
            await this.uow.job_history_repository.update_job_history_entry(job_history);
            this.logger.info(`  ${job.id} | ${job_history.id} - Job history entry updated.`);
        } catch(err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - ZFS Send step failed.`);
            job_history.source_message = '';
            job_history.source_result = 3;
            job_history.result = 3;
            await this.uow.job_history_repository.update_job_history_entry(job_history);
            throw err;
        }
    }
}

module.exports = JobManager;


/* Proposed status codes
* job history: 0 = pending, 1 = started (both receive and send commands executed), 2 = complete (send and receive commands confirmed), 3 = failed
* source_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
* target_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
*/
