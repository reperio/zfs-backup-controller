class VirtualMachineDatasetsRepository {
    constructor (uow) {
        this.uow = uow;
    }

    async get_all_datasets() {
        this.uow._logger.info('Fetching all virtual machine dataset records');

        try {
            let q = this.uow._models.VirtualMachineDataset
                .query(this.uow._transaction);

            const datasets = await q;
            return datasets;
        } catch (err) {
            this.uow._logger.error('Failed to fetch all datasets');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async get_all_datasets_for_virtual_machine(virtual_machine_id) {
        this.uow._logger.info(`Fetching all datasets for virtual machine "${virtual_machine_id}"`);
        try {
            let q = this.uow._models.VirtualMachineDataset
                .query(this.uow._transaction)
                .where('virtual_machine_id', virtual_machine_id);

            this.uow._logger.debug(q.toSql());
            const datasets = await q;
            return datasets;
        } catch (err) {
            this.uow._logger.error(`Failed to fetch all datasets for virtual machine "${virtual_machine_id}"`);
            this.uow._logger.error(err);
            throw err;
        }
    }

    async create_dataset(dataset) {
        this.uow._logger.info(`Creating dataset "${dataset.name}" for virtual machine "${dataset.virtual_machine_id}"`);
        try {
            const dataset_model = this.uow._models.VirtualMachineDataset.fromJson({
                location: dataset.location,
                name: dataset.name,
                virtual_machine_id: dataset.virtual_machine_id,
                enabled: dataset.enabled,
                type: dataset.type
            });

            const q = this.uow._models.VirtualMachineDataset
                .query(this.uow._transaction)
                .insert(dataset_model)
                .returning('*');

            this.uow._logger.debug(q.toSql());
            const result = await q;
            return result;
        } catch (err) {
            this.uow._logger.error('Failed to create virtual machine dataset');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async create_datasets(datasets) {
        this.uow._logger.info(`Creating ${datasets.length} dataset entries`);
        try {
            for (let i = 0; i < datasets.length; i++) {
                this.create_dataset(datasets[i]);
            }
        } catch (err){ 
            this.uow._logger.error('Failed to create dataset entries');
            this.uow._logger.error(err);
        }
    }

    async update_dataset(dataset) {
        this.uow._logger.info(`Updating dataset "${dataset.name}" for virtual machine "${dataset.virtual_machine_id}" with data: ${JSON.stringify(dataset)}`);
        try {
            const dataset_model = this.uow._models.VirtualMachineDataset.fromJson({
                name: dataset.name,
                virtual_machine_id: dataset.virtual_machine_id,
                enabled: dataset.enabled,
                type: dataset.type
            });

            const q = this.uow._models.VirtualMachineDataset
                .query(this.uow._transaction)
                .where('location', dataset.location)
                .patch(dataset_model)
                .returning('*');

            this.uow._logger.debug(q.toSql());
            const result = await q;
            return result;
        } catch (err) {
            this.uow._logger.error('Failed to update virtual machine dataset');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_datasets(datasets) {
        this.uow._logger.info(`Updating ${datasets.length} dataset entries`);
        try {
            for (let i = 0; i < datasets.length; i++) {
                this.update_dataset(datasets[i]);
            }
        } catch (err){ 
            this.uow._logger.error('Failed to create dataset entries');
            this.uow._logger.error(err);
        }
    }
}

module.exports = VirtualMachineDatasetsRepository;