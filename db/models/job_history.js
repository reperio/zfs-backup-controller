const Model = require('objection').Model;
const guid = require('objection-guid')();

class JobHistory extends guid(Model) {
    static get tableName() { return "job_history"; }

    static get jsonSchema() {
        return {
            type: "object",
            properties: {
                id: { type: "string" },
                job_id: { type: "string" },
                start_date_time: { type: "date" },
                end_date_time: { type: "date" },
                schedule_date_time: { type: "date" },
                result: { type: "integer" },
                source_message: { type: "text" },
                target_message: { type: "text" },
                source_result: { type: "integer" },
                target_result: { type: "integer" },
                port: { type: "integer" }
            }
        }
    }

    static get relationMappings() {
        const Job = require('./job');
        const Snapshot = require('./snapshot');

        return {
            job_history_job: {
                relation: Model.BelongsToOneRelation,
                modelClass: Job,
                join: {
                    from: "job_history.job_id",
                    to: "jobs.id"
                }
            },
            job_history_snapshot: {
                relation: Model.HasOneRelation,
                modelClass: Snapshot,
                join: {
                    from: "job_history.id",
                    to: "snapshots.job_history_id"
                }
            }
        } 
    }
}

module.exports = JobHistory;