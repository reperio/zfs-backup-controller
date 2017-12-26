const Model = require('objection').Model;

class Snapshot extends Model { //don't extend base model as we don't want auto guid ids
    static get tableName() { return "snapshots"; }

    static get jsonSchema() {
        return {
            type: "object",
            properties: {
                job_history_id: { type: "string" },
                name: { type: "string" },
                source_host_id: { type: "string" },
                source_host_status: { type: "integer" },
                target_host_id: { type: "string" },
                target_host_status: { type: "integer" },
                snapshot_date_time: { type: "date" },
                job_id: { type: "string" }
            }
        }
    }

    static get relationMappings() {
        const Host = require('./host');
        const JobHistory = require('./job_history');
        const Job = require('./job');

        return {
            snapshot_source_host: {
                relation: Model.BelongsToOneRelation,
                modelClass: Host,
                join: {
                    from: "snapshots.source_host_id",
                    to: "hosts.id"
                }
            },
            snapshot_target_host: {
                relation: Model.BelongsToOneRelation,
                modelClass: Host,
                join: {
                    from: "snapshots.target_host_id",
                    to: "hosts.id"
                }
            },
            snapshot_job_history: {
                relation: Model.BelongsToOneRelation,
                modelClass: JobHistory,
                join: {
                    from: "snapshots.job_history_id",
                    to: "job_history.id"
                }
            },
            snapshot_job: {
                relation: Model.BelongsToOneRelation,
                modelClass: Job,
                join: {
                    from: "snapshots.job_id",
                    to: "jobs.id"
                }
            }
        }
    }
}

module.exports = Snapshot;