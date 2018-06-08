const Model = require('objection').Model;
const BaseModel = require('./base_model');

class Host extends BaseModel {
    static get tableName() {
        return 'hosts';
    }

    auto_generated_id() {
        return 'id';
    }

    static get jsonSchema() {
        return {
            type: 'Object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                sdc_id: { type: ['string', 'null'] },
                ip_address: { type: 'string' },
                port: { type: 'integer' },
                max_total_jobs: { type: 'integer' },
                max_backup_jobs: { type: 'integer' },
                max_retention_jobs: { type: 'integer' }
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
