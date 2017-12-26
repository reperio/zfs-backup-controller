const Model = require('objection').Model;
const guid = require('objection-guid')();

class Schedule extends guid(Model) {
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

    $beforeInsert() {
        this.createdAt = new Date().toISOString();
    }

    $beforeUpdate() {
        this.updatedAt = new Date().toISOString();
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