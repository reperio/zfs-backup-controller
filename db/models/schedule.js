const Model = require('objection').Model;
const BaseModel = require('./base_model');

class Schedule extends BaseModel {
    static get tableName() { return "schedules"; }

    auto_generated_id() {
        return 'id';
    }

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