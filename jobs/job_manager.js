const _ = require('lodash');
const moment = require('moment');

class JobManager {
    constructor(logger, uow, agentApi, job_interval) {
        this.logger = logger;
        this.uow = uow;
        this.agentApi = agentApi;

        this.job_interval_id = null;
        this.job_interval = job_interval;
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

        try {
            //get current workload, find all enabled jobs, filter to the ones that are ready based on schedule, order them, and filter them by current host workload.
            const runningJobEntries = await this.uow.job_history_repository.getUnfinishedJobs();
            const runningJobIds = _.uniq(_.map(runningJobEntries, 'job_id'));

            const current_workload = await this.uow.hosts_repository.get_all_workload_details();

            //const currentWorkload = await this.getCurrentWorkloadByHost(runningJobEntries);
        
            const hosts = await this.uow.hosts_repository.get_all_hosts();
            const jobs = await this.uow.jobs_repository.getAllEnabledJobs();
            this.logger.info(`Found ${jobs.length} enabled jobs`);

            const jobsScheduledToExecute = _.filter(jobs, this.should_job_execute.bind(this));
            this.logger.info(`Found ${jobsScheduledToExecute.length} jobs scheduled to execute`);

            const jobsScheduledAndNotRunning = _.filter(jobsScheduledToExecute, (job) => {
                return !_.includes(runningJobIds, job.id);
            });
            this.logger.info(`Found ${jobsScheduledAndNotRunning.length} jobs not already running`);

            const ordered_jobs = _.orderBy(jobsScheduledAndNotRunning, ['last_schedule'], ['asc']);

            //const jobsToExecute = await this.filterJobsByWorkload(hosts, ordered_jobs, currentWorkload);
            const jobsToExecute = await this.filterJobsByWorkload(hosts, ordered_jobs, current_workload);
            this.logger.info(`Found ${jobsToExecute.length} jobs able to execute based on workload`);

            await this.execute_jobs(jobsToExecute);
        } catch(err) {
            this.logger.error('Job manager execution failed.');
            this.logger.error(err);
        }
        
        this.logger.info('Job Manager execution finished.');
    }

    // async getCurrentWorkloadByHost(running_job_history_entries) {
    //     this.logger.info(`Found ${running_job_history_entries.length} running job history entries.`);

    //     const jobs_per_host = {}; //will hold host_id:int for how many current jobs are running on a host.

    //     for (let running_job of running_job_history_entries) {
            
    //         const source_host = running_job.job_history_job.source_host_id;
    //         const target_host = running_job.job_history_job.target_host_id;

    //         this.logger.info(`Job: ${running_job.id} source_host: ${source_host} target_host: ${target_host} is currently running.`);

    //         //increment or set the counter for the current source and target host
    //         if (jobs_per_host[source_host]) {
    //             jobs_per_host[source_host] += 1;
    //         } else {
    //             jobs_per_host[source_host] = 1;
    //         }

    //         if (jobs_per_host[target_host]) {
    //             jobs_per_host[target_host] += 1;
    //         } else {
    //             jobs_per_host[target_host] = 1;
    //         }
    //     }

    //     this.logger.info(`Current workload: ${JSON.stringify(jobs_per_host)}`);

    //     return jobs_per_host;
    // }

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

    // async filterJobsByWorkload(hosts, jobs, workload) {
    //     this.logger.info(`Filtering ${jobs.length} jobs using workload: ${JSON.stringify(workload)}.`);

    //     const jobsToExecute = [];

    //     const newWorkload = Object.assign({}, workload);

    //     for (const job of jobs) {
    //         const job_source_host = _.find(hosts, host => {
    //             return host.id === job.source_host_id;
    //         });
            
    //         const job_target_host = _.find(hosts, host => {
    //             return host.id === job.target_host_id;
    //         });

    //         const source_host = job.source_host_id;
    //         const target_host = job.target_host_id;

    //         const currentSourceWorkload = newWorkload[source_host] || 0;
    //         const currentTargetWorkload = newWorkload[target_host] || 0;

    //         let newSourceWorkload = currentSourceWorkload + 1;
    //         let newTargetWorkload = currentTargetWorkload + 1;

    //         let sourceHasRoom = newSourceWorkload < job_source_host.max_total_jobs && newSourceWorkload < job_source_host.max_backup_jobs;
    //         let targetHasRoom = newTargetWorkload < job_target_host.max_total_jobs && newTargetWorkload < job_target_host.max_backup_jobs;

    //         if (sourceHasRoom && targetHasRoom) {
    //             this.logger.info(`Job ${job.id} allowed to execute based on current workload. source: ${source_host}:${currentSourceWorkload} target: ${target_host}:${currentTargetWorkload}`);
    //             jobsToExecute.push(job);
    //             newWorkload[source_host] = newSourceWorkload;
    //             newWorkload[target_host] = newTargetWorkload;
    //         } else {
    //             this.logger.info(`Job ${job.id} NOT allowed to execute based on current workload. source: ${source_host}:${currentSourceWorkload} target: ${target_host}:${currentTargetWorkload}`);
    //         }
    //     }

    //     return jobsToExecute;
    // }

    async filterJobsByWorkload(jobs, host_workloads) {
        this.logger.info(`Filtering ${jobs.length} jobs using workload: ${JSON.stringify(host_workloads)}.`);

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
