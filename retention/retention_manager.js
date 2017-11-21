const moment = require('moment');
const _ = require('lodash');

class RetentionManager {
    constructor(logger) {
        this.logger = logger || {info: (message) => console.log(message || '')};
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

        let initial_date = start_date ? moment.utc(start_date) : moment.utc();
        for(let retention of retention_policy.retentions) {
            for(let iteration = 0; iteration <= retention.retention; iteration++) {
                let target_date = this.find_retention_target_date(retention.interval, iteration, initial_date, offset);

                this.logger.info();
                this.logger.info(`Interval: ${retention.interval}, iteration: ${iteration}, offset: ${offset}`);
                this.logger.info(`Initial date: ${initial_date}`);
                this.logger.info(`Target date: ${target_date}`);
                this.logger.info();

                const policySnapshot = this.getFirstSnapshotAfterDate(snapshots, target_date);
                
                if (policySnapshot) {
                    //console.log(`KEEPING ${policySnapshot.job_history_id}`);
                    //console.log(policySnapshot);
                    policySnapshot.keep = true;
                    policySnapshot[`keep-${retention.interval}`] = true;
                }
            }
        }

        let snapshotsToDelete = _.filter(snapshots, function(snapshot) {
            return !snapshot.keep;
        });

        this.logger.info();
        this.logger.info(`Found ${snapshotsToDelete.length} snapshots to delete`);
        for (let snap of snapshotsToDelete) {
            this.logger.info(`Name: ${snap.name}, time: ${snap.snapshot_date_time}`);
        }

        // let snapshotsToKeep = _.filter(snapshots, function(snapshot) {
        //     return snapshot.keep;
        // });

        // console.log(snapshotsToKeep);

        return snapshotsToDelete;
    }

    getFirstSnapshotAfterDate (snapshots, date) {
        for (let i = 0; i < snapshots.length; i++) {
            if (moment(snapshots[i].snapshot_date_time).isSameOrAfter(date)) {
                return snapshots[i];
            }
        }

        return null;
    }
    sortSnapshots(snapshots) {
        return _.orderBy(snapshots, function(snapshot) {
            return moment(snapshot.snapshot_date_time).valueOf();
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

