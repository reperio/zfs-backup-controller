const Model = require('objection').Model;

class Schedule extends Model {
    static get tableName() { return "schedules"; }

    static get jsonSchema() {
        return {
            type: "object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                display_name: { type: "string" }
            }
        }
    }

    static get relationMappings() {
        const Job = require('./job');

        return {
            schedule_job: {
                relation: Model.HasOneRelation,
                modelClass: Job,
                join: {
                    from: "schedules.id",
                    to: "jobs.schedule_id"
                }
            }
        }
    }
}

module.exports = Schedule;