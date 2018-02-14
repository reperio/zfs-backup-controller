const Model = require('objection').Model;
const BaseModel = require('./base_model');

class VirtualMachine extends BaseModel {
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
                last_sync: {type: 'date'},
                type: {type: 'string'}
            }
        };
    }

    static get relationMappings() {
        const Host = require('./host');
        const Job = require('./job');
        const VirtualMachineDataset = require('./virtual_machine_dataset');

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
            },
            datasets: {
                relation: Model.HasManyRelation,
                modelClass: VirtualMachineDataset,
                join: {
                    from: 'virtual_machines.id',
                    to: 'virtual_machine_datasets.virtual_machine_id'
                }
            }
        };
    }
}

module.exports = VirtualMachine;
