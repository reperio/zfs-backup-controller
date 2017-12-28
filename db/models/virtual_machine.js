const Model = require('objection').Model;
const guid = require('objection-guid')();

class VirtualMachine extends guid(Model) {
    static get tableName() {
        return 'virtual_machines';
    }

    static get jsonSchema() {
        return {
            type: 'Object',
            properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                enabled: { type: 'boolean' },
                status: { type: 'string' },
                host_id: { type: 'string' },
                state: { type: 'string' },
                sdc_id: { type: 'string' }
            }
        };
    }

    static get relationMappings() {
        const Host = require('./host');
        const Job = require('./job');

        return {
            virtual_machine_host: {
                relation: Model.BelongsToOneRelation,
                modelClass: Host,
                join: {
                    from: 'virtual_machines.host_id',
                    to: 'hosts.sdc_id'
                }
            },
            virtual_machine_jobs: {
                relation: Model.HasManyRelation,
                modelClass: Job,
                join: {
                    from: 'virtual_machines.id',
                    to: 'jobs.sdc_vm_id'
                }
            }
        };
    }
}

module.exports = VirtualMachine;
