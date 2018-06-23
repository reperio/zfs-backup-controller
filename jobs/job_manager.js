const _ = require('lodash');
const moment = require('moment');

class JobManager {
    constructor(logger, uow, agentApi, job_interval, retention_enabled) {
        this.logger = logger;
        this.uow = uow;
        this.agentApi = agentApi;

        this.job_interval_id = null;
        this.job_interval = job_interval;
        this.retention_enabled = retention_enabled;
        this.executing = false;
    }

    //starts the execution loop
    start() {
        this.job_interval_id = setInterval(async () => {
            if (!this.executing) {
                this.executing = true;
                await this.execute();
                this.executing = false;
            }
        }, this.job_interval);
    }

    //main execution of the job manager, finds and executes jobs
    async execute() {
        this.logger.info('');
        this.logger.info('Job Manager execution started.');

        try {
            await this.cleanup_finished_jobs();
        } catch (err) {
            this.logger.error('Finished job cleanup failed.');
            this.logger.error(err);
        }

        //get current workload to have object available to jobs and retention
        let current_workload = await this.uow.hosts_repository.get_all_workload_details();
        this.logger.info(`Current workload: ${JSON.stringify(current_workload)}.`);

        try {
            //get current workload, find all enabled jobs, filter to the ones that are ready based on schedule, order them, and filter them by current host workload.
            const runningJobEntries = await this.uow.job_history_repository.getUnfinishedJobs();
            const runningJobIds = _.uniq(_.map(runningJobEntries, 'job_id'));

            const jobs = await this.uow.jobs_repository.getAllEnabledJobs();
            this.logger.info(`Found ${jobs.length} enabled jobs`);

            const jobsScheduledToExecute = _.filter(jobs, this.should_job_execute.bind(this));
            this.logger.info(`Found ${jobsScheduledToExecute.length} jobs scheduled to execute`);

            const jobsScheduledAndNotRunning = _.filter(jobsScheduledToExecute, (job) => {
                return !_.includes(runningJobIds, job.id);
            });
            this.logger.info(`Found ${jobsScheduledAndNotRunning.length} jobs not already running`);

            const ordered_jobs = _.orderBy(jobsScheduledAndNotRunning, ['last_schedule'], ['asc']);
            const jobsToExecute = await this.filterJobsByWorkload(ordered_jobs, current_workload);
            this.logger.info(`Found ${jobsToExecute.length} jobs able to execute based on workload`);

            await this.execute_jobs(jobsToExecute);
        } catch(err) {
            this.logger.error('Job manager execution failed.');
            this.logger.error(err);
        }
        
        this.logger.info('Job Manager execution finished.');

        this.logger.info(`Retention is enabled?: ${JSON.stringify(this.retention_enabled)}.`);

        if (this.retention_enabled) {
            await apply_retention_schedules();
        }

    }

    async cleanup_finished_jobs() {
        this.logger.info('Fetching running jobs to clean up');
        const jobs = await this.uow.job_history_repository.getUnfinishedJobs();

        for (let job of jobs) {
            try {
                let updated = false;
                this.logger.info(`${job.job_id} | ${job.id} Checking job state.`);
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

    async filterJobsByWorkload(jobs, host_workloads) {
        const jobsToExecute = [];

        for (const job of jobs) {
            const source_host_workload = _.find(host_workloads, workload => {
                return workload.id === job.source_host_id;
            });
            
            const target_host_workload = _.find(host_workloads, workload => {
                return workload.id === job.target_host_id;
            });

            let sourceHasRoom = source_host_workload.current_backup_jobs < source_host_workload.max_backup_jobs && source_host_workload.current_backup_jobs + source_host_workload.current_retention_jobs < source_host_workload.max_total_jobs;
            let targetHasRoom = target_host_workload.current_backup_jobs < target_host_workload.max_backup_jobs && target_host_workload.current_backup_jobs + target_host_workload.current_retention_jobs < target_host_workload.max_total_jobs;

            if (sourceHasRoom && targetHasRoom) {
                this.logger.info(`Job ${job.id} allowed to execute based on current workload. source: ${source_host_workload.id}:${source_host_workload} target: ${target_host_workload.id}:${target_host_workload}`);
                jobsToExecute.push(job);
                source_host_workload.current_backup_jobs += 1;
                target_host_workload.current_backup_jobs += 1;
            } else {
                this.logger.info(`Job ${job.id} NOT allowed to execute based on current workload. source: ${source_host_workload.id}:${source_host_workload} target: ${target_host_workload.id}:${target_host_workload}`);
            }
        }

        return jobsToExecute;
    }

    should_job_execute(job) {
        const current_scheduled_time = this.get_most_recent_schedule_time(job);
        this.logger.debug(`${job.id} - Current Scheduled Execution Time: ${current_scheduled_time}`);

        const last_scheduled_execution = moment(job.last_schedule);
        this.logger.debug(`${job.id} - Last Scheduled Execution Time: ${last_scheduled_execution}`);

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

        for (let job of jobs) {
            this.logger.info(`Job: ${job.id}`);
        }

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
            job_history.result = 1;
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
    async apply_retention_schedules() {
        this.logger.info('Applying Retention Schedules.');
        const jobs = await this.uow.jobs_repository.getAllEnabledJobs();
        const workloads = await this.uow.hosts_repository.get_all_workload_details();

        for (let job of jobs) {
            try {
                await this.apply_retention_schedule_for_job(job, workloads);
            } catch (err) {
                this.logger.error(`${job.id} - Applying retention schedule failed`);
                this.logger.error(err);
            }
        }
    }

    async apply_retention_schedule_for_job(job, workloads) {
        this.logger.info(`${job.id} - Applying retention schedule.`);
        const now = moment.utc();

        const source_retention_policy = JSON.parse(job.source_retention);
        const target_retention_policy = JSON.parse(job.target_retention);

        const snapshots = await this.uow.snapshots_repository.get_active_snapshots_for_job(job.id);

        //console.log(JSON.stringify(snapshots));

        this.logger.info(`${job.id} - Found ${snapshots.length} active snapshots for job.`);
        for (let snapshot of snapshots) {
            this.logger.info(`${job.id} - ${snapshot.job_history_id} - ${snapshot.name}`);
        }

        let source_success = true;

        //process source retention
        try {
            this.logger.info(`${job.id} - Processing source retention`);
            const snapshots_to_delete = this.get_snapshots_to_delete(snapshots, source_retention_policy, job.offset, now);

            this.logger.info(`${job.id} - Processing ${snapshots_to_delete.length} snapshots on source`);

            for (let snapshot of snapshots_to_delete) {
                this.logger.info(`${job.id} - ${snapshot.job_history_id} - ${snapshot.name}`);
            }
            
            for (let source_snapshot of snapshots_to_delete) {
                const result = await this.process_snapshot(job, source_snapshot, workloads, true);
                if (!result) {
                    source_success = false;
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
            const snapshots_to_delete = this.get_snapshots_to_delete(snapshots, target_retention_policy, job.offset, now);
            
            this.logger.info(`${job.id} - Processing ${snapshots_to_delete.length} snapshots on target`);

            for (let snapshot of snapshots_to_delete) {
                this.logger.info(`${job.id} - ${snapshot.job_history_id} - ${snapshot.name}`);
            }

            for (let target_snapshot of snapshots_to_delete) {
                await this.process_snapshot(job, target_snapshot, workloads, false);
            }
            this.logger.info(`${job.id} - Finished applying target retention schedule`);
        } catch (err) {
            this.logger.error(`${job.id} - Applying target retention schedule failed`);
            this.logger.error(err);
        }
    }

    async process_snapshot(job, snapshot, workloads, is_source) {
        // check if the snapshot is already deleted on the host
        this.logger.info(`${job.id} - Checking to make sure snapshot ${snapshot.name} has not already been deleted on ${is_source ? 'source' : 'target'} host`);
        if (is_source) {
            if (snapshot.source_host_status !== 1) {
                this.logger.info(`${job.id} - Skipping deletion of snapshot ${snapshot.name} because snapshot has already been deleted on source host`);
                return true;
            }
        } else if (!is_source) {
            if (snapshot.target_host_status !== 1) {
                this.logger.info(`${job.id} - Skipping deletion of snapshot ${snapshot.name} because snapshot has already been deleted on target host`);
                return true;
            }
        }

        const host_workload = _.find(workloads, workload => {
            if (is_source) {
                return workload.id === snapshot.source_host_id;
            }
            return workload.id === snapshot.target_host_id;
        });
        const can_run_retention_job = host_workload.current_retention_jobs < host_workload.max_retention_jobs && host_workload.current_retention_jobs + host_workload.current_backup_jobs < host_workload.max_total_jobs;
        
        this.logger.info(`${job.id} - Checking for space to run retention job on ${is_source ? 'source' : 'target'} host for snapshot ${snapshot.name}`);
        if (!can_run_retention_job) {
            this.logger.info(`${job.id} - Skipping deletion of snapshot ${snapshot.name} because maximum job limits have been reached.`);
            return false;
        }

        if (is_source) { // run source host checks
            this.logger.info(`${job.id} - Checking if ${snapshot.name} has been created on source`);
            if (snapshot.source_host_status !== 1) {
                this.logger.info(`${job.id} - Skipping delete because snapshot ${snapshot.name} hasn't been created on source.`);
                return false;
            }

            this.logger.info(`${job.id} - Checking if ${snapshot.name} has been created on target`);
            if (snapshot.target_host_status !== 1) {
                this.logger.info(`${job.id} - Skipping delete because snapshot ${snapshot.name} hasn't been created on target.`);
                return false;
            }
        } else { // run target host checks
            this.logger.info(`${job.id} - Checking if ${snapshot.name} has been created on target`);
            if (snapshot.target_host_status !== 1) {
                this.logger.info(`${job.id} - Skipping delete because snapshot ${snapshot.name} hasn't been created on target.`);
                return false;
            }

            this.logger.info(`${job.id} - Checking if ${snapshot.name} has been deleted on source`);
            if (snapshot.source_host_status !== 2) {
                this.logger.info(`${job.id} - Skipping delete because snapshot ${snapshot.name} hasn't been deleted on source.`);
                return false;
            }
        }

        try {
            host_workload.current_retention_jobs += 1;
            await this.delete_snapshot(job.id, snapshot, is_source ? snapshot.source_host_id : snapshot.target_host_id);
            return true;
        } catch (err) {
            this.logger.error(`${job.id} - Deleting snapshot ${snapshot.name} from ${is_source ? 'source' : 'target'} ${is_source ? snapshot.snapshot_source_host.ip_address : snapshot.snapshot_target_host.ip_address} failed.`);
            this.logger.error(err);
            snapshot.source_host_status = 3; //TODO do we really want to set a failed status here?
            await this.uow.snapshots_repository.updateSnapshotEntry(snapshot);
            return false;
        }
    }

    async delete_snapshot(job_id, snapshot, host_id) {
        try {
            if (host_id === snapshot.source_host_id) {
                snapshot.source_host_status = 5;
                await this.uow.snapshots_repository.updateSnapshotEntry(snapshot);
                
                this.logger.info(`${job_id} - Deleting snapshot ${snapshot.name} from source ${snapshot.snapshot_source_host.ip_address}`);
                await this.agentApi.zfs_destroy_snapshot(snapshot, snapshot.snapshot_source_host, snapshot.source_host_id);
            } else if (host_id === snapshot.target_host_id) {
                snapshot.target_host_status = 5;
                await this.uow.snapshots_repository.updateSnapshotEntry(snapshot);
                
                this.logger.info(`${job_id} - Deleting snapshot ${snapshot.name} from target ${snapshot.snapshot_target_host.ip_address}`);
                await this.agentApi.zfs_destroy_snapshot(snapshot, snapshot.snapshot_target_host, snapshot.target_host_id);
            }
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    getStartOfQuarterHour (date, iteration) {
        const target = date.clone();
        let current = date.clone().add(1, 'hours').startOf('hour');
        //console.log(target);
        //console.log(current);

        while (current.isAfter(target)) {
            current = current.subtract(15, 'minutes');
        }

        //console.log(current);

        current = current.subtract(iteration * 15, 'minutes');
        
        return current;
    }
    getStartOfHour (date, iteration) {
        return moment(date).startOf('hour').subtract(iteration, 'hours');
    }
    getStartOfDay (date, iteration) {
        return moment(date).startOf('day').subtract(iteration, 'days');
    }
    getStartOfWeek (date, iteration) {
        return moment(date).startOf('week').subtract(iteration, 'weeks');
    }
    getStartOfMonth (date, iteration) {
        return moment(date).startOf('month').subtract(iteration, 'months');
    }

    find_retention_target_date (interval, iteration, initial_date, offset) {
        switch (interval) {
            case 'quarter_hourly':
                return this.getStartOfQuarterHour(initial_date, iteration).add(offset, 'minutes');
            case 'hourly':
                return this.getStartOfHour(initial_date, iteration).add(offset, 'minutes');
            case 'daily':
                return this.getStartOfDay(initial_date, iteration).add(offset, 'minutes');
            case 'weekly':
                return this.getStartOfWeek(initial_date, iteration).add(offset, 'minutes');
            case 'monthly':
                return this.getStartOfMonth(initial_date, iteration).add(offset, 'minutes');
            default:
                throw new Error(`Invalid retention interval: ${interval}`);
        }
    }

    get_snapshots_to_delete (snapshots, retention_policy, job_offset, start_date) {
        const offset = job_offset || 0;
        const sorted_snapshots = this.sortSnapshots(snapshots);

        const snapshots_to_keep = [];

        //always keep the most recent fully successful snapshot
        for (let index = sorted_snapshots.length - 1 ; index >=0 ; --index) {
            const snapshot = sorted_snapshots[index];
            if (snapshot.source_host_status === 1 && snapshot.target_host_status === 1) {
                snapshots_to_keep.push(snapshot.job_history_id);
                break;
            }
        }

        for(let retention of retention_policy.retentions) {
            for(let iteration = 0; iteration < retention.retention; iteration++) {
                let target_date = this.find_retention_target_date(retention.interval, iteration, start_date, offset);

                // this.logger.info();
                // this.logger.info(`Interval: ${retention.interval}, iteration: ${iteration}, offset: ${offset}`);
                // this.logger.info(`Initial date: ${start_date}`);
                // this.logger.info(`Target date: ${target_date}`);
                // this.logger.info();

                let policySnapshot = this.getFirstSnapshotAfterDate(sorted_snapshots, target_date);
                
                if (!policySnapshot) {
                    policySnapshot = this.get_last_snapshot_before_date(sorted_snapshots, target_date);
                }

                if (policySnapshot) {
                    //console.log(`KEEPING ${policySnapshot.job_history_id}`);
                    //console.log(policySnapshot);
                    //console.log(`${retention.interval}`);

                    snapshots_to_keep.push(policySnapshot.job_history_id);
                }
            }
        }

        const snapshots_to_delete = [];
        
        //console.log(snapshots_to_keep);

        for (let snapshot of snapshots) {
            //console.log(snapshot.job_history_id);
            if (!_.includes(snapshots_to_keep, snapshot.job_history_id)) {
                snapshots_to_delete.push(snapshot);
            }
        }

        //this.logger.info();
        //this.logger.info(`Found ${snapshots_to_delete.length} snapshots to delete`);
        // for (let snap of snapshots_to_delete) {
        //     this.logger.info(`Name: ${snap.name}, time: ${snap.snapshot_date_time}`);
        // }

        return snapshots_to_delete;
    }

    getFirstSnapshotAfterDate (snapshots, date) {
        for (let i = 0; i < snapshots.length; ++i) {
            const snapshot_date_time = moment.utc(snapshots[i].snapshot_date_time);
            //this.logger.info(`Comparing snapshot date: ${snapshot_date_time} to target date: ${date}`)
            if (snapshot_date_time.isSameOrAfter(date)) {
                //this.logger.info('MATCH');
                return snapshots[i];
            }
            
            //this.logger.info('NO MATCH');
        }

        return null;
    }

    get_last_snapshot_before_date (snapshots, date) {
        for (let i = snapshots.length - 1; i >= 0; --i) {
            const snapshot_date_time = moment.utc(snapshots[i].snapshot_date_time);
            //this.logger.info(`Comparing snapshot date: ${snapshot_date_time} to target date: ${date}`)
            if (snapshot_date_time.isSameOrBefore(date)) {
                //this.logger.info('MATCH');
                return snapshots[i];
            }
            
            //this.logger.info('NO MATCH');
        }

        return null;
    }

    sortSnapshots(snapshots) {
        return _.orderBy(snapshots, function(snapshot) {
            return moment.utc(snapshot.snapshot_date_time).valueOf();
        }, ['asc']);
    }
}

module.exports = JobManager;


/* Proposed status codes
* job history: 0 = pending, 1 = started (both receive and send commands executed), 2 = complete (send and receive commands confirmed), 3 = failed
* source_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
* target_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
*/
