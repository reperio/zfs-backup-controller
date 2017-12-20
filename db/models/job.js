const Model = require('objection').Model;

class Job extends Model {
    static get tableName() { return "jobs"; }

    static get jsonSchema() { 
        return {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                schedule_id: { type: "string" },
                source_retention: { type: "string" },
                target_retention: { type: "string" },
                sdc_vm_id: { type: "string" },
                source_location: { type: "string" },
                target_location: { type: "string" },
                zfs_type: { type: "integer" },
                zfs_size: { type: "integer" },
                source_host_id: { type: "string" },
                target_host_id: { type: "string" },
                last_execution: { type: ["object", "string"] },
                last_schedule: { type: ["object", "string"] },
                enabled: { type: "boolean" },
                offset: { type: "integer" }
            }
        }
    }

    static get relationMappings() {
        const Host = require('./host');
        const Schedule = require('./schedule');
        const JobHistory = require('./job_history');
        const Snapshot = require('./snapshot');

        return {
            job_source_host: {
                relation: Model.BelongsToOneRelation,
                modelClass: Host,
                join: {
                    from: "jobs.source_host_id",
                    to: "hosts.id"
                }
            },
            job_target_host: {
                relation: Model.BelongsToOneRelation,
                modelClass: Host,
                join: {
                    from: "jobs.target_host_id",
                    to: "hosts.id"
                }
            },
            job_schedule: {
                relation: Model.BelongsToOneRelation,
                modelClass: Schedule,
                join: {
                    from: "jobs.schedule_id",
                    to: "schedules.id"
                }
            },
            job_job_history: {
                relation: Model.HasManyRelation,
                modelClass: JobHistory,
                join: {
                    from: "jobs.id",
                    to: "job_history.job_id"
                }
            },
            job_snapshot: {
                relation: Model.HasManyRelation,
                modelClass: Snapshot,
                join: {
                    from: "snapshots.job_id",
                    to: "jobs.id"
                }
            }
        }
    }
}

module.exports = Job;