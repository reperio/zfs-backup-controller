const {knex} = require('../connect');

class DatasetStatusRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async get_dataset_status() {
        this.uow._logger.info('Fetching dataset status');

        const q = knex('dataset_status');
        
        const results = await q;
        return results;
    }

    async get_virtual_machine_status() {
        this.uow._logger.info('Fetching virtual machine status');

        const q = knex.column('host_sdc_id', 'host_name', 'virtual_machine_id', 'virtual_machine_name', knex.raw('MAX(status) AS status'))
            .from('dataset_status')
            .groupBy('virtual_machine_id', 'virtual_machine_name', 'host_sdc_id', 'host_name');

        const results = await q;
        return results;
    }

    async get_host_status() {
        this.uow._logger.info('Fetching host status');

        const q = knex.column('host_sdc_id', 'host_name', knex.raw('MAX(status) AS status'))
            .from('dataset_status')
            .groupBy('host_sdc_id', 'host_name');

        const results = await q;
        return results;
    }
}

module.exports = DatasetStatusRepository;
