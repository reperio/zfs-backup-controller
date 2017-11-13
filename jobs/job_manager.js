const _ = require('lodash');
const moment = require('moment');

class JobManager {
    constructor(logger, db, interval, agentApi) {
        this.logger = logger;
        this.db = db;
        this.agentApi = agentApi;

        this.interval_id = null;
        this.interval = interval;
    }

    //starts the execution loop
    start() {
        this.interval_id = setInterval(() => this.execute(), this.interval);
    }

    //main execution of the job manager, finds and executes jobs
    async execute() {
        this.logger.info('');
        this.logger.info('Job Manager execution started.');

        try {
            const jobs = await this.fetch_jobs();
            const filtered_jobs = this.filter_eligible_jobs(jobs);
            await this.execute_jobs(filtered_jobs);
        } catch(err) {
            this.logger.error(err);
        }

        this.logger.info('Job Manager execution finished.');
    }

    async fetch_jobs() {
        this.logger.info('Fetching jobs');
        const jobs = await this.db.jobs_repository.getAllJobs();
        return jobs;
    }

    filter_eligible_jobs(jobs) {
        this.logger.info(`Filtering ${jobs.length} jobs`);

        return _.filter(jobs, this.should_job_execute.bind(this));
    }

    should_job_execute(job) {
        const current_scheduled_time = this.get_most_recent_schedule_time(job);
        this.logger.debug(`Current Scheduled Execution Time: ${current_scheduled_time}`);

        const last_scheduled_execution = moment(job.last_schedule);
        this.logger.debug(`Last Scheduled Execution Time: ${last_scheduled_execution}`);

        return !last_scheduled_execution.isValid() || current_scheduled_time.isAfter(last_scheduled_execution);
    }

    get_most_recent_schedule_time(job) {
        if (job.schedule.name === 'quarter_hour') {
            /*
                Jump to the beginning of the next hour, subtract 15 minutes until we are earlier than the current time.
            */
            const now = moment();
            let current = moment().add(1, 'hours').startOf('hour');

            while (current.isSameOrAfter(now)) {
                current = current.subtract(15, 'minutes');
            }

            return current;
        } else if (job.schedule.name === 'hourly') {
            return moment().startOf('hour');
        } else if (job.schedule.name === 'daily') {
            return moment().startOf('day');
        } else if (job.schedule.name === 'weekly') {
            return moment().startOf('week');
        } else if (job.schedule.name === 'monthly') {
            return moment().startOf('month');
        }

        throw new Error('Job has invalid schedule');
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
        await job.update({last_execution: start_date_time, last_schedule: schedule_date_time});
        this.logger.info(`  ${job.id} - Job Updated.`);

        const port = JobManager.get_random_port();

        this.logger.info(`  ${job.id} - Creating Job History entry.`);

        //create job history record
        const job_history = await this.db.jobs_repository.create_job_history({
            job_id: job.id,
            start_date_time: start_date_time,
            end_date_time: null,
            schedule_date_time: schedule_date_time,
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

        try {
            //build snapshot
            await this.agentApi.zfs_create_snapshot(job, job_history, snapshot_name, true);
            const snapshot_data = {
                name: snapshot_name,
                host_id: job.source_host_id,
                snapshot_date_time: time_stamp,
                job_history_id: job_history.id
            };

            //add snapshot to snapshots table
            const snapshot = await this.db.snapshots_repository.createSnapshotEntry(job_history, snapshot_data);

            if (!snapshot) {
                throw new Error('Failed to create snapshot');
            }
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - Create snapshot step failed.`);
            await job_history.update({target_message: '', source_result: 3, result: 3});
            throw err;
        }

        try {
            //request zfs receive
            await this.agentApi.zfs_receive(job, job_history, port, true);

            //update job history record
            this.logger.info(`  ${job.id} | ${job_history.id} - Updating job history entry.`);
            await job_history.update({target_message: '', target_result: 1});
            this.logger.info(`  ${job.id} | ${job_history.id} - Job history entry updated.`);
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - ZFS Receive step failed.`);
            await job_history.update({target_message: '', target_result: 3, result: 3});
            throw err;
        }

        try {
            //request zfs send
            let last_snapshot_name = null;

            const most_recent_successful = await this.db.jobs_repository.get_most_recent_successful_job_history(job.id);

            if (most_recent_successful) {
                last_snapshot_name = most_recent_successful.snapshots[0].name;
            }

            await this.agentApi.zfs_send(job, job_history, snapshot_name, port, last_snapshot_name, true, snapshot_name);

            //update job history record
            this.logger.info(`  ${job.id} | ${job_history.id} - Updating job history entry.`);
            await job_history.update({source_message: '', source_result: 1, result: 1});
            this.logger.info(`  ${job.id} | ${job_history.id} - Job history entry updated.`);
        } catch(err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - ZFS Send step failed.`);
            await job_history.update({source_message: '', source_result: 3, result: 3});
            throw err;
        }

        const end_date_time = new Date();
        await job_history.update({end_date_time: end_date_time});
    }
}

module.exports = JobManager;


/* Proposed status codes
* job history: 0 = pending, 1 = started (both receive and send commands executed), 2 = complete (send and receive commands confirmed), 3 = failed
* source_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
* target_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
*/
