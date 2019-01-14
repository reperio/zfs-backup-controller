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
            const virtual_machines_from_db = await this.uow.virtual_machines_repository.get_all_virtual_machines(null, null, true);
            const db_vm_ids = _.map(virtual_machines_from_db, 'id');

            //retrieve all datasets from the database
            const db_datasets = await this.uow.virtual_machine_datasets_repository.get_all_datasets();
            const db_dataset_ids = _.map(db_datasets, 'location');

            //create lists to hold machines that need to be created/deleted
            let virtual_machines_to_create = [];
            let virtual_machines_to_edit = [];
            let datasets_to_create = [];
            let datasets_to_edit = [];
            
            const now = new Date();

            for (let i = 0; i < virtual_machines_from_api.length; i++) {
                const vm = virtual_machines_from_api[i];
                vm.last_sync = now;

                if (db_vm_ids.includes(vm.id)) {
                    const db_record = _.find(virtual_machines_from_db, (db_vm) => {
                        return db_vm.id === vm.id;
                    });
                    vm.status = db_record.status;
                    vm.enabled = db_record.enabled;

                    virtual_machines_to_edit.push(vm);
                } else {
                    vm.status = '';
                    virtual_machines_to_create.push(vm);
                }

                for(let j = 0; j < virtual_machines_from_api[i].datasets.length; j++) {
                    const dataset = virtual_machines_from_api[i].datasets[j];
                    if (!db_dataset_ids.includes(dataset.location)) {
                        datasets_to_create.push(dataset);
                    } else {
                        const db_dataset = _.find(db_datasets, (db_dataset) => {
                            return db_dataset.location === dataset.location;
                        });
                        dataset.enabled = (typeof db_dataset.enabled === 'undefined' || db_dataset.enabled === null) ? dataset.enabled : db_dataset.enabled;
                        datasets_to_edit.push(dataset);
                    }
                }
            }

            //create new virtual machines
            await this.uow.virtual_machines_repository.insert_virtual_machines_bulk(virtual_machines_to_create);

            //update existing machines
            await this.uow.virtual_machines_repository.update_virtual_machines_bulk(virtual_machines_to_edit);

            //create vm datasets
            await this.uow.virtual_machine_datasets_repository.create_datasets(datasets_to_create);

            //edit vm datasets
            await this.uow.virtual_machine_datasets_repository.update_datasets(datasets_to_edit);

            this.uow._logger.info('VM Manager execution finished');
        } catch(err) {
            this.uow._logger.error('VM Manager execution failed');
            this.uow._logger.error(err);
        }
    }
}

module.exports = VirtualMachineManager;
