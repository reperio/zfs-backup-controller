const _ = require('lodash');
const moment = require('moment');

class BackupStatus {
    constructor(uow) {
        this.uow = uow;
    }

    async get_statuses(field, filter_field, filter_value) {
        const q = this.get_base_query();

        if (!field) {
            this.uow._logger.error(`Field (${field}) provided to backup status service does not match any known fields`);
            throw new Error(`Field (${field}) provided to backup status service does not match any known fields`);
        }

        if (filter_field && filter_value) {
            q.where(filter_field, 'LIKE', `%${filter_value}%`);
        }
        try {
            const records = await q;
            const status_records = this.get_status_list(records, field);
            return status_records;
        } catch (err) {
            this.uow._logger.error('Failed to fetch status records');
            this.uow._logger.error(err);
            throw err;
        }
    }
    
    get_base_query() {
        const num_failures_sub = this.uow._knex('job_history').sum(this.uow._knex.raw('?? in (??) and `job_id`=??', ['result', [0, 1, 3], 'jobs.id']));
        const num_successes_sub = this.uow._knex('job_history').sum(this.uow._knex.raw('??=?? and `job_id`=??', ['result', 2, 'jobs.id']));
        const last_result_sub = this.uow._knex.select('result').from('job_history').whereRaw('?? = ??', ['job_history.job_id', 'jobs.id']).orderBy('start_date_time', 'desc').limit(1);
        const last_execution_sub = this.uow._knex.select('last_execution').from('job_history').whereRaw('?? = ??', ['job_history.job_id', 'jobs.id']).orderBy('start_date_time', 'desc').limit(1);
        const q = this.uow._knex.column({location: 'virtual_machine_datasets.location'}, {enabled: 'virtual_machine_datasets.enabled'}, {virtual_machine_id: 'virtual_machines.id'}, {host_sdc_id: 'virtual_machines.host_id'}, {job_id: 'jobs.id'}, {job_offset: 'jobs.offset'}, {schedule: 'schedules.name'},
            {num_failures: num_failures_sub}, {num_successes: num_successes_sub}, {last_result: last_result_sub}, {last_execution: last_execution_sub})
            .from('virtual_machine_datasets')
            .leftJoin('virtual_machines', 'virtual_machines.id', 'virtual_machine_datasets.virtual_machine_id')
            .leftJoin('jobs', 'jobs.source_location', 'virtual_machine_datasets.location')
            .leftJoin('hosts', 'hosts.sdc_id', 'virtual_machines.host_id')
            .leftJoin('schedules', 'schedules.id', 'jobs.schedule_id')
            .whereIn('virtual_machines.state', ['running', 'stopped']);

        return q;
    }

    get_status_list(records, field) {
        let id_list = _.map(_.uniqBy(records, field), field);
        let status_list = [];
        _.each(id_list, id => {
            let status_record = { id: id, status: 'good', messages: [] };
            _.each(records, record => {
                if (record[field] === id && status_record.id === id) {
                    status_record.host_sdc_id = record.host_sdc_id;

                    //skip if the dataset is not enabled
                    if (record.enabled === false) {
                        if (status_record.status === 'good') {
                            status_record.status = null;
                        }
                        status_record.messages.push(`Dataset "${record.location}" not enabled`);
                        return true;
                    }

                    //return bad status if no job is defined
                    if (record.job_id === null) {
                        status_record.messages.push(`Dataset "${record.location}" does not have a job`);
                        status_record.status = 'bad';
                        //return true;
                    }

                    status_record.last_execution = record.last_execution;

                    //check successes and failures
                    if (record.num_successes == null || record.num_successes === 0 || record.last_result == null) {
                        status_record.status = 'bad';
                        status_record.messages.push(`Dataset "${record.location}" has no backups`);
                        //return true; // breaks the inner each loop since the status can't get any worse
                    } else if (record.last_result === 1) { // if last job record is started
                        status_record.status = 'warn';
                        status_record.messages.push(`Dataset "${record.location}" currently has a backup in progress`);
                    } else if (record.last_result === 3) { // if last job failed
                        status_record.status = 'warn';
                        status_record.messages.push(`Dataset "${record.location}" failed the last backup`);
                    }

                    // check if the backup ran within the last schedule period that it could have run in
                    if (record.last_execution != null) {
                        switch (record.schedule) {
                            case 'quarter_hour':
                                if (moment(record.last_execution) < moment().utc().subtract(1, 'day')) {
                                    status_record.status = 'warn';
                                    status_record.messages.push(`Dataset "${record.location}" not backed up in last 24 hours`);
                                }
                                break;
                            case 'hourly':
                                if (moment(record.last_execution) < moment().utc().subtract(1, 'day')) {
                                    status_record.status = 'warn';
                                    status_record.messages.push(`Dataset "${record.location}" not backed up in last 24 hours`);
                                }
                                break;
                            case 'daily':
                                if (moment(record.last_execution) < moment().utc().subtract(1, 'day')) {
                                    status_record.status = 'warn';
                                    status_record.messages.push(`Dataset "${record.location}" missed the last backup`);
                                }
                                break;
                            case 'weekly':
                                if (moment(record.last_execution) < moment().utc().subtract(1, 'week')) {
                                    status_record.status = 'warn';
                                    status_record.messages.push(`Dataset "${record.location}" missed the last backup`);
                                }
                                break;
                            case 'monthly':
                                if (moment(record.last_execution) < moment().utc().subtract(1, 'month')) {
                                    status_record.status = 'warn';
                                    status_record.messages.push(`Dataset "${record.location}" missed the last backup`);
                                }
                                break;
                            default:
                                this.uow._logger.error(`Schedule (${record.schedule}) provided to backup status service does not match any known schedules`);
                                throw new Error(`Schedule (${record.schedule}) provided to backup status service does not match any known schedules`);
                        }
                    }
                }
                return true;
            });
            status_list.push(status_record);
            status_record = null;
        });

        return status_list;
    }

    get_schedule(schedule, offset) {
        const now = moment().utc();
        let nowOffset = null;
        let end = null;
        switch (schedule) {
            case 'quarter_hour':
                now.seconds(0);
                const minutes = now.minutes();
                const roundedMinutes = minutes - (minutes % 15);
                now.minutes(roundedMinutes);
                nowOffset = now.clone();
                nowOffset.add(offset, 'minutes');
                if (now > nowOffset) {
                    nowOffset.subtract(15, 'minutes');
                }
                end = nowOffset.clone();
                end.add(15, 'minutes');
                return { start: nowOffset, end: end};
            case 'hourly':
                now.seconds(0);
                now.minutes(0);
                nowOffset = now.clone();
                nowOffset.add(offset, 'minutes');
                if (now > nowOffset) {
                    nowOffset.subtract(1, 'hours');
                }
                end = nowOffset.clone();
                end.add(1, 'hours');
                return { start: nowOffset, end: end};
            case 'daily':
                now.seconds(0);
                now.minutes(0);
                now.hours(0);
                nowOffset = now.clone();
                nowOffset.add(offset, 'minutes');
                if (now > nowOffset) {
                    nowOffset.subtract(24, 'hours');
                }
                end = nowOffset.clone();
                end.add(24, 'hours');
                return { start: nowOffset, end: end};
            case 'weekly':
                now.seconds(0);
                now.minutes(0);
                now.hours(0);
                now = now.startOf('week');
                nowOffset = now.clone();
                nowOffset.add(offset, 'minutes');
                if (now > nowOffset) {
                    nowOffset.subtract(24 * 7, 'hours');
                }
                end = nowOffset.clone();
                end.add(24 * 28, 'hours');
                return { start: nowOffset, end: end};
            case 'monthly':
                now.seconds(0);
                now.minutes(0);
                now.hours(0);
                now.days(0);
                nowOffset = now.clone();
                nowOffset.add(offset, 'minutes');
                if (now > nowOffset) {
                    nowOffset.subtract(24 * 28, 'hours');
                }
                end = nowOffset.clone();
                end.add(24 * 28, 'hours');
                return { start: nowOffset, end: end};
            default:
                this.uow._logger.error(`Schedule (${schedule}) provided to backup status service does not match any known schedules`);
                throw new Error(`Schedule (${schedule}) provided to backup status service does not match any known schedules`);
        }
    }
}

module.exports = BackupStatus;
