const moment = require('moment');
const _ = require('lodash');

class RetentionManager {
    constructor(logger, uow, agentApi, retention_interval) {
        this.logger = logger;
        this.uow = uow;
        this.agentApi = agentApi;
        this.retention_interval_id = null;
        this.retention_interval = retention_interval;
        this.executing = false;
    }

    start() {
        this.retention_interval_id = setInterval(async () => {
            if (!this.executing) {
                this.executing = true;
                await this.apply_retention_schedules();
                this.executing = false;
            }
        }, this.retention_interval);
    }

    async apply_retention_schedules() {
        this.logger.info('Applying Retention Schedules.');
        const jobs = await this.uow.jobs_repository.getAllEnabledJobs();

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
                this.logger.info(`${job.id} - Checking if ${source_snapshot.name} has been created on source`);
                if (source_snapshot.source_host_status !== 1) {
                    this.logger.info(`${job.id} - Skipping delete because snapshot ${source_snapshot.name} hasn't been created on source.`);
                    continue;
                }

                this.logger.info(`${job.id} - Checking if ${source_snapshot.name} has been created on target`);
                if (source_snapshot.target_host_status !== 1) {
                    this.logger.info(`${job.id} - Skipping delete because snapshot ${source_snapshot.name} hasn't been created on target.`);
                    continue;
                }

                try {
                    await this.delete_snapshot(job.id, source_snapshot, source_snapshot.source_host_id);
                } catch (err) {
                    source_success = false;
                    this.logger.error(`${job.id} - Deleting snapshot ${source_snapshot.name} from source ${source_snapshot.snapshot_source_host.ip_address} failed.`);
                    this.logger.error(err);
                    source_snapshot.source_host_status = 3; //TODO do we really want to set a failed status here?
                    await this.uow.snapshots_repository.updateSnapshotEntry(source_snapshot);
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
                this.logger.info(`${job.id} - Checking if ${target_snapshot.name} has been created on target`);
                if (target_snapshot.target_host_status !== 1) {
                    this.logger.info(`${job.id} - Skipping delete because snapshot ${target_snapshot.name} hasn't been created on target.`);
                    continue;
                }

                this.logger.info(`${job.id} - Checking if ${target_snapshot.name} has been deleted on source`);
                if (target_snapshot.source_host_status !== 2) {
                    this.logger.info(`${job.id} - Skipping delete because snapshot ${target_snapshot.name} hasn't been deleted on source.`);
                    continue;
                }

                try {
                    await this.delete_snapshot(job.id, target_snapshot, target_snapshot.target_host_id);
                } catch (err) {
                    this.logger.error(`${job.id} - Deleting snapshot ${target_snapshot.name} from target ${target_snapshot.snapshot_target_host.ip_address} failed.`);
                    this.logger.error(err);
                    target_snapshot.target_host_status = 3; //TODO do we really want to set a failed status here?
                    await this.uow.snapshots_repository.updateSnapshotEntry(target_snapshot);
                }
            }
            this.logger.info(`${job.id} - Finished applying target retention schedule`);
        } catch (err) {
            this.logger.error(`${job.id} - Applying target retention schedule failed`);
            this.logger.error(err);
        }
    }

    async delete_snapshot(job_id, snapshot, host_id) {
        try {
            if (host_id === snapshot.source_host_id) {
                snapshot.source_host_status = 5;
                await this.uow.snapshots_repository.updateSnapshotEntry(snapshot);
                
                this.logger.info(`${job_id} - Deleting snapshot ${snapshot.name} from source ${snapshot.snapshot_source_host.ip_address}`);
                await this.agentApi.zfs_destroy_snapshot(snapshot, snapshot.snapshot_source_host);
            } else if (host_id === snapshot.target_host_id) {
                snapshot.target_host_status = 5;
                await this.uow.snapshots_repository.updateSnapshotEntry(snapshot);
                
                this.logger.info(`${job_id} - Deleting snapshot ${snapshot.name} from target ${snapshot.snapshot_target_host.ip_address}`);
                await this.agentApi.zfs_destroy_snapshot(snapshot, snapshot.snapshot_target_host);
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

module.exports = RetentionManager;

/**
 * {
    retentions: [
        {
            interval: 'quarter_hourly',
            retention: 1
        },
        {
            interval: 'hourly',
            retention: 1
        },
        {
            interval: 'daily',
            retention: 1
        },
        {
            interval: 'weekly',
            retention: 1
        },
        {
            interval: 'monthly',
            retention: 1
        }
    ]
}
 */

