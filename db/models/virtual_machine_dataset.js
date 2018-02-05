const Mode = require('objection').Model;
const BaseModel = require('./base_model');

class VirtualMachineDataset extends BaseModel {
    static get tableName() {
        return 'virtual_machine_datasets';
    }

    auto_generated_id() {
        return 'id';
    }

    static get jsonSchema() {
        return {
            type: 'Object',
            properties: {
                id: {type: 'string'},
                location: {type: 'string'},
                virtual_machine_id: {type: 'string'}
            }
        };
    }

    static get relationMappings() {
        const VirtualMachine = require('./virtual_machine');

        return {
            virtual_machine: {
                relation: Model.BelongsToOneRelation,
                modelClass: VirtualMachine,
                join: {
                    from: 'virtual_machine_datasets.virtual_machine_id',
                    to: 'virtual_machines.id'
                }
            }
        };
    }
}

module.exports = VirtualMachineDataset;