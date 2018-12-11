const BaseModel = require('./base_model');

class DatasetStatus extends BaseModel {
    static get tableName() {
        return 'dataset_status';
    }

    static get jsonSchema() {
        return {
            type: 'Object',
            properties: {
                host_sdc_id: { type: 'string' },
                host_name: { type: 'string' },
                virtual_machine_id: { type: 'string' },
                virtual_machine_name: { type: 'string' },
                dataset_location: { type: 'string' },
                dataset_name: { type: 'string' },
                dataset_enabled: { type: 'boolean' },
                job_id: { type: 'string' },
                job_name: { type: 'string' },
                job_enabled: { type: 'boolean' },
                schedule_id: { type: 'string' },
                last_execution: { type: 'string' },
                last_successful_backup: { type: 'string' },
                last_result: { type: 'number' },
                num_successful_backups: { type: 'number' },
                ran_within_previous_period: { type: 'boolean' },
                status: { type: 'number'}
            }
        };
    }
}

module.exports = DatasetStatus;
