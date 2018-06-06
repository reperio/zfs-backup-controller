const Model = require('objection').Model;

class JobHistoryDetail extends Model {
    static get tableName() {
        return 'job_history_details';
    }

    static get jsonSchema() {
        return {
            type: 'object',
            properties: {
                job_name: { type: 'string' },
                source_node_name: { type: 'string' },
                virtual_machine_name: { type: 'string' },
                start_date_time: { type: 'string' },
                end_date_time: { type: 'string' },
                schedule_date_time: { type: 'string' },
                result: { type: 'number' },
                source_host_status: { type: 'number' },
                target_host_status: { type: 'number' }
            }
        };
    }
}

module.exports = JobHistoryDetail;
