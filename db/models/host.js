const Model = require('objection').Model;
const BaseModel = require('./base_model');

class Host extends BaseModel {
    static get tableName() { return "hosts"; }

    static get jsonSchema() {
        return {
            type: "Object",
            properties: {
                id: { type: "string" },
                name: { type: "string" },
                sdc_id: { type: "string" },
                ip_address: { type: "string" },
                port: { type: "integer" }
            }
        }
    }
}

module.exports = Host;