const {knex} = require('../connect');

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
        } catch (err) {
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
        } catch (err) { 
            this.uow._logger.error('Failed to create dataset entries');
            this.uow._logger.error(err);
        }
    }

    async get_dataset_backup_statistics(virtual_machine_id) {
        this.uow._logger.info('Fetching dataset backup statistics');

        try {
            const num_failures_sub = knex('job_history').sum(knex.raw('?? in (??) and `job_id`=??', ['result', [0, 1, 3], 'jobs.id']));
            const num_successes_sub = knex('job_history').sum(knex.raw('??=?? and `job_id`=??', ['result', 2, 'jobs.id']));
            const last_result_sub = knex.select('result').from('job_history').whereRaw('?? = ??', ['job_history.job_id', 'jobs.id']).orderBy('end_date_time', 'desc').limit(1);
            const q = knex.column({location: 'virtual_machine_datasets.location'}, {host_id: 'virtual_machines.host_id'}, {job_id: 'jobs.id'},
                {num_failures: num_failures_sub}, {num_successes: num_successes_sub}, {last_result: last_result_sub})
                .from('virtual_machine_datasets')                
                .leftJoin('virtual_machines', 'virtual_machines.id', 'virtual_machine_datasets.virtual_machine_id')
                .leftJoin('jobs', 'jobs.source_location', 'virtual_machine_datasets.location')
                .where('virtual_machine_datasets.enabled', true);

            if (virtual_machine_id) {
                q.where('virtual_machines.sdc_id', virtual_machine_id);
            }

            const result = await q;
            return result;
        } catch (err) {
            this.uow._logger.error('Failed to fetch dataset backup statistics');
            this.uow._logger.error(err);
            throw err;
        }
    }
}

module.exports = VirtualMachineDatasetsRepository;