const Model = require('objection').Model;

class JobDetail extends Model {
    static get tableName() {
        return 'job_details';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            properties: {
                job_id: { type: 'string' },
                job_name: { type: 'string' },
                source_host_name: { type: 'string' },
                target_host_name: { type: 'string' },
                dataset_type: { type: 'string' },
                schedule_name: { type: 'string' },
                last_execution: { type: 'string' },
                enabled: { type: 'string' }
            }
        };
    }
}

module.exports = JobDetail;
