const Model = require('objection').Model;
const BaseModel = require('./base_model');

class Host extends BaseModel {
    static get tableName() {
        return 'hosts';
    }

    static get jsonSchema() {
        return {
            type: 'Object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                sdc_id: { type: 'string' },
                ip_address: { type: 'string' },
                port: { type: 'integer' }
            }
        };
    }

    static get relationMappings() {
        const VirtualMachine = require('./virtual_machine');

        return {
            host_virtual_machines: {
                relation: Model.HasManyRelation,
                modelClass: VirtualMachine,
                join: {
                    from: 'hosts.sdc_id',
                    to: 'virtual_machines.host_id'
                }
            }
        };
    }
}

module.exports = Host;
