const {knex} = require('../connect');

class VirtualMachinesRepository {
    constructor (uow) {
        this.uow = uow;
    }

    async get_all_virtual_machines(host_id, filter, all) {
        all = all | false;
        this.uow._logger.info('Fetching all virtual machines from database');
        try {
            let q = this.uow._models.VirtualMachine
                .query(this.uow._transaction)
                .eagerAlgorithm(this.uow._models.VirtualMachine.JoinEagerAlgorithm)
                .mergeEager('virtual_machine_host')
                .mergeEager('virtual_machine_jobs');

            if (host_id) {
                q = q.where('host_id', host_id);
            }

            if (filter) {
                q = q.where('virtual_machines.name', 'like', `%${filter}%`);
            }

            if (!all) {
                q.where('state', 'in', ['running', 'stopped']);
            }

            const virtual_machines = await q;

            this.uow._logger.info(`Fetched all ${virtual_machines.length} virtual machines`);
            return virtual_machines;
        } catch (err) {
            this.uow._logger.error('Failed to fetch virtual machines');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async get_all_virtual_machines_by_host_id(id, all) {
        all = all | false;
        this.uow._logger.info(`Fetching all virtual machines from database with host_id ${id}`);
        try {
            const q = this.uow._models.VirtualMachine
                .query(this.uow._transaction)
                .where('host_id', id)
                .orderBy('name', 'asc');

            if (!all) {
                q.where('state', 'in', ['running', 'stopped']);
            }

            const virtual_machines = await q;

            this.uow._logger.info('Fetched all virtual machines');
            return virtual_machines;
        } catch (err) {
            this.uow._logger.error(`Failed to fetch all virtual machines from database with host_id ${id}`);
            this.uow._logger.error(err);
            throw err;
        }
    }

    async create_new_virtual_machine(virtual_machine) {
        if (virtual_machine.state === 'failed') {
            this.uow._logger.info(`Skipping "${virtual_machine.id}" because vm is in a failed state`);
            return null;
        }

        this.uow._logger.info(`Creating new virtual machine "${virtual_machine.id}"`);
        try {
            const virtual_machine_model = this.uow._models.VirtualMachine.fromJson({
                id: virtual_machine.id,
                name: virtual_machine.name || '',
                status: '',
                host_id: virtual_machine.host_id === 'null' ? 'NULL' : virtual_machine.host_id,
                state: virtual_machine.state,
                last_sync: virtual_machine.last_sync,
                type: virtual_machine.type
            });

            const q = this.uow._models.VirtualMachine
                .query(this.uow._transaction)
                .insert(virtual_machine_model)
                .returning('*');

            const new_virtual_machine = await q;
            return new_virtual_machine;
        } catch (err) {
            this.uow._logger.error('Failed to create virtual machine');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async insert_virtual_machines_bulk(virtual_machines) {
        let inserted_virtual_machines = [];
        
        try{
            this.uow._logger.info(`Starting batch insert of ${virtual_machines.length} virtual machine(s)`);

            for (let i= 0; i < virtual_machines.length; i++) {
                const inserted_virtual_machine = await this.create_new_virtual_machine(virtual_machines[i]);
                inserted_virtual_machines.push(inserted_virtual_machine);
            }

            this.uow._logger.info('Finished batch insert');
            return inserted_virtual_machines;
        } catch (err) {
            this.uow._logger.error('Failed batch insert');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_virtual_machine(virtual_machine) {
        this.uow._logger.info(`Updating virtual machine "${virtual_machine.id}"`);
        try {
            const virtual_machine_model = this.uow._models.VirtualMachine.fromJson({
                name: virtual_machine.name || '',
                status: virtual_machine.status,
                host_id: virtual_machine.host_id,
                state: virtual_machine.state,
                last_sync: virtual_machine.last_sync,
                type: virtual_machine.type
            });

            const q = this.uow._models.VirtualMachine
                .query(this.uow._transaction)
                .where('id', virtual_machine.id)
                .patch(virtual_machine_model)
                .returning('*');

            const updated_virtual_machine = await q;
            return updated_virtual_machine;
        } catch (err) {
            this.uow._logger.error('Failed to update virtual machine');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_virtual_machines_bulk(virtual_machines) {
        let updated_virtual_machines = [];
        
        try{
            this.uow._logger.info(`Starting batch update of ${virtual_machines.length} virtual machines`);

            for (let i= 0; i < virtual_machines.length; i++) {
                const updated_virtual_machine = await this.update_virtual_machine(virtual_machines[i]);
                updated_virtual_machines.push(updated_virtual_machine);
            }

            this.uow._logger.info('Finished batch update');
            return updated_virtual_machines;
        } catch (err) {
            this.uow._logger.error('Failed batch update');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async get_virtual_machine_status(sdc_id) {
        this.uow._logger.info('Fetching statuses for virtual machines');
        try {
            const num_failures_sub = knex('job_history').sum(knex.raw('?? in (??) and `job_id`=??', ['result', [0, 1, 3], 'jobs.id']));
            const num_successes_sub = knex('job_history').sum(knex.raw('??=?? and `job_id`=??', ['result', 2, 'jobs.id']));
            const last_result_sub = knex.select('result').from('job_history').whereRaw('?? = ??', ['job_history.job_id', 'jobs.id']).orderBy('end_date_time', 'desc').limit(1);
            const q = knex.column({id: 'virtual_machines.id'},
                {name: 'virtual_machines.name'}, {host_id: "virtual_machines.host_id"}, {job_id: 'jobs.id'}, {job_name: 'jobs.name'},
                {job_enabled: 'jobs.enabled'}, {job_last_execution: 'jobs.last_execution'},
                {num_failures: num_failures_sub}, {num_successes: num_successes_sub}, 
                {last_result: last_result_sub})
                .from('virtual_machines')
                .leftJoin('jobs', 'jobs.sdc_vm_id', 'virtual_machines.id');

            if (sdc_id) {
                q.where('virtual_machines.id', sdc_id);
            }

            const result = await q;
            return result;
        } catch (err) {
            this.uow._logger.error('Failed to fetch statuses for virtual machines');
            this.uow._logger.error(err);
            throw err;
        }
    }
}

module.exports = VirtualMachinesRepository;
