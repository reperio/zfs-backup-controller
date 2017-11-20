const _ = require('lodash');
const moment = require('moment');

class JobManager {
    constructor(logger, db, interval, agentApi, retention_manager) {
        this.logger = logger;
        this.db = db;
        this.agentApi = agentApi;
        this.retention_manager = retention_manager;

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
            this.logger.error('Job manager execution failed.');
            this.logger.error(err);
        }

        try {
            await this.cleanup_finished_jobs();
        } catch (err) {
            this.logger.error('Finished job cleanup failed.');
            this.logger.error(err);
        }

        try {
            await this.apply_retention_schedules();
        } catch (err) {
            this.logger.error('Applying retention schedules failed.');
            this.logger.error(err);
        }
        
        this.logger.info('Job Manager execution finished.');
    }

    async apply_retention_schedules() {
        this.logger.info('Applying Retention Schedules.');
        const jobs = await this.fetch_jobs();

        for (let job of jobs) {
            try {
                await this.apply_retention_schedule_for_job(job);
            } catch (err) {
                this.logger.error(`${job.id} - Applying retention schedule failed`);
                this.logger.error(err);
            }
        }
    }

    async apply_retention_schedule_for_job(job) {
        this.logger.info(`${job.id} - Applying retention schedule.`);

        const source_retention_policy = JSON.parse(job.source_retention);
        const target_retention_policy = JSON.parse(job.target_retention);

        const snapshots = await this.db.snapshots_repository.get_active_snapshots_for_job(job.id);

        let source_success = true;

        //process source retention
        try {
            this.logger.info(`${job.id} - Processing source retention`);
            const snapshots_to_delete = this.retention_manager.get_snapshots_to_delete(snapshots, source_retention_policy);
            
            this.logger.info(`${job.id} - Deleting ${snapshots_to_delete.length} snapshots`);
            for (let source_snapshot of snapshots_to_delete) {
                if (source_snapshot.source_host_status !== 1) {
                    this.logger.info(`${job.id} - Skipping delete because source status != created`);
                    continue;
                }

                try {
                    this.logger.info(`${job.id} - Deleting snapshot ${source_snapshot.name} from source ${source_snapshot.source_host.ip_address}`);
                    await this.agentApi.zfs_destroy_snapshot(source_snapshot, job.source_host);
                    await source_snapshot.update({source_host_status: 2});
                } catch (err) {
                    source_success = false;
                    this.logger.error(`${job.id} - Deleting snapshot ${source_snapshot.name} from source ${source_snapshot.source_host.ip_address} failed.`);
                    this.logger.error(err);
                    await source_snapshot.update({source_host_status: 3});
                }
            }
            this.logger.info(`${job.id} - Finished applying source retention schedule`);
        } catch (err) {
            this.logger.error(`${job.id} - Applying source retention schedule failed`);
            this.logger.error(err);
        }

        if (!source_success) {
            return;
        }

        //process target retention
        try {
            this.logger.info(`${job.id} - Processing target retention`);
            const snapshots_to_delete = this.retention_manager.get_snapshots_to_delete(snapshots, target_retention_policy);
            
            this.logger.info(`${job.id} - Deleting ${snapshots_to_delete.length} snapshots`);
            for (let target_snapshot of snapshots_to_delete) {
                if (target_snapshot.target_host_status !== 1 || target_snapshot.source_host_status !== 2) {
                    this.logger.info(`${job.id} - Skipping delete because target status != created or source status != deleted`);
                    continue;
                }

                //delete snapshot at host
                try {
                    this.logger.info(`${job.id} - Deleting snapshot ${target_snapshot.name} from target ${target_snapshot.target_host.ip_address}`);
                    await this.agentApi.zfs_destroy_snapshot(target_snapshot, job.target_host);
                    await target_snapshot.update({target_host_status: 2});
                } catch (err) {
                    this.logger.error(`${job.id} - Deleting snapshot ${target_snapshot.name} from target ${target_snapshot.target_host.ip_address} failed.`);
                    this.logger.error(err);
                    await target_snapshot.update({target_host_status: 3});
                }
            }
            this.logger.info(`${job.id} - Finished applying target retention schedule`);
        } catch (err) {
            this.logger.error(`${job.id} - Applying target retention schedule failed`);
            this.logger.error(err);
        }
    }

    async cleanup_finished_jobs() {
        this.logger.info('Fetching unfinished jobs to clean up');
        const jobs = await this.db.jobs_repository.getUnfinishedJobs();

        for (let job of jobs) {
            try {
                this.logger.info(`${job.job_id} | ${job.id} Checking job.`);
                if (job.source_result === 3 || job.target_result === 3) {
                    this.logger.info(`${job.job_id} | ${job.id} Setting job to failed.`);
                    job.result = 3;
                }

                if (job.source_result === 2 && job.target_result === 2) {
                    this.logger.info(`${job.job_id} | ${job.id} Setting job to successful.`);
                    job.result = 2;
                }

                await job.save();
            } catch(err) {
                this.logger.error(`${job.job_id} | ${job.id} Checking job failed.`);
                this.logger.error(err);
            }
        }
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
            let current = moment().add(1, 'hours').startOf('hour').add(job.offset, 'minutes');

            while (current.isSameOrAfter(now)) {
                current = current.subtract(15, 'minutes');
            }

            return current;
        } else if (job.schedule.name === 'hourly') {
            return moment().startOf('hour').add(job.offset, 'minutes');
        } else if (job.schedule.name === 'daily') {
            return moment().startOf('day').add(job.offset, 'minutes');
        } else if (job.schedule.name === 'weekly') {
            return moment().startOf('week').add(job.offset, 'minutes');
        } else if (job.schedule.name === 'monthly') {
            return moment().startOf('month').add(job.offset, 'minutes');
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
                snapshot_date_time: time_stamp,
                job_history_id: job_history.id,
                job_id: job_history.job_id
            };

            //add snapshot to snapshots table
            snapshot = await this.db.snapshots_repository.createSnapshotEntry(job_history, snapshot_data);

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
                last_snapshot_name = most_recent_successful.snapshot.name;
            }

            await this.agentApi.zfs_send(job, job_history, snapshot_name, port, last_snapshot_name, true);

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
