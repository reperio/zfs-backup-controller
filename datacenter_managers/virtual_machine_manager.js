const _ = require('lodash');

class VirtualMachineManager {
    constructor(uow, vm_api) {
        this.uow = uow;
        this.vm_api = vm_api;

        this.interval_id = null;
    }

    async execute() {
        this.uow._logger.info('');
        this.uow._logger.info('VM Manager execution starting');

        try {
            //retrieve all virtual machines from vm_api
            const virtual_machines_from_api = await this.vm_api.get_all_vm_records();

            //retrieve all virtual machines from the database
            const virtual_machines_from_db = await this.uow.virtual_machines_repository.get_all_virtual_machines();

            //create lists to hold machines that need to be created/deleted
            let virtual_machines_to_create = [];
            let virtual_machines_to_edit = [];

            const now = new Date();

            _(virtual_machines_from_api).each((api_virtual_machine) => {
                let is_in_database = false;
                _(virtual_machines_from_db).each((db_virtual_machine) => {
                    if (api_virtual_machine.sdc_id === db_virtual_machine.sdc_id) {
                        is_in_database = true;
                        const new_virtual_machine_to_edit = {
                            id: db_virtual_machine.id,
                            sdc_id: db_virtual_machine.sdc_id,
                            name: api_virtual_machine.name,
                            enabled: db_virtual_machine.enabled,
                            status: db_virtual_machine.status,
                            host_id: api_virtual_machine.host_id,
                            state: api_virtual_machine.state,
                            last_sync: now,
                            type: api_virtual_machine.brand
                        };
                        virtual_machines_to_edit.push(new_virtual_machine_to_edit);
                    }
                });

                if (!is_in_database) {
                    const new_virtual_machine_to_create = {
                        id: api_virtual_machine.sdc_id,
                        sdc_id: api_virtual_machine.sdc_id,
                        name: api_virtual_machine.name,
                        enabled: true,
                        status: '',
                        host_id: api_virtual_machine.host_id,
                        state: api_virtual_machine.state,
                        lasy_sync: now,
                        type: api_virtual_machine.brand
                    };
                    virtual_machines_to_create.push(new_virtual_machine_to_create);
                }
            });

            //create new virtual machines
            await this.uow.virtual_machines_repository.insert_virtual_machines_bulk(virtual_machines_to_create);

            //update existing machines
            await this.uow.virtual_machines_repository.update_virtual_machines_bulk(virtual_machines_to_edit);

            this.uow._logger.info('VM Manager execution finished');
        } catch(err) {
            this.uow._logger.error('VM Manager execution failed');
            this.uow._logger.error(err);
        }
    }
}

module.exports = VirtualMachineManager;
