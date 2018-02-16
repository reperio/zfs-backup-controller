const Model = require('objection').Model;
const BaseModel = require('./base_model');

class VirtualMachineDataset extends BaseModel {
    static get tableName() {
        return 'virtual_machine_datasets';
    }

    static get jsonSchema() {
        return {
            type: 'Object',
            properties: {
                location: {type: 'string'},
                name: {type: 'string'},
                virtual_machine_id: {type: 'string'},
                enabled: {type: 'boolean'},
                type: {type: 'string'}
            }
        };
    }

    static get relationMappings() {
        const Job = require('./job');
        const VirtualMachine = require('./virtual_machine');

        return {
            virtual_machine: {
                relation: Model.BelongsToOneRelation,
                modelClass: VirtualMachine,
                join: {
                    from: 'virtual_machine_datasets.virtual_machine_id',
                    to: 'virtual_machines.id'
                }
            },
            job: {
                relation: Model.HasOneRelation,
                modelClass: Job,
                join: {
                    from: 'virtual_machine_datasets.location',
                    to: 'jobs.source_location'
                }
            }
        };
    }
}

module.exports = VirtualMachineDataset;