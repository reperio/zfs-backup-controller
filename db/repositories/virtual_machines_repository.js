class VirtualMachinesRepository {
    constructor (uow) {
        this.uow = uow;
    }

    async get_all_virtual_machines(host_id, filter) {
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

            this.uow._logger.debug(q.toSql());
            const virtual_machines = await q;

            //TODO this is gross and an extra list traversal, can objectionJS handle boolean <=> bit conversion?
            //convert the numeric boolean values to actual true/false values
            // for (let i = 0; i< virtual_machines.length; i++) {
            //     if (virtual_machines[i].enabled !== null) {
            //         virtual_machines[i].enabled = virtual_machines[i].enabled === 1 ? true : false;
            //     }
            // }

            this.uow._logger.info('Fetched all virtual machines');
            return virtual_machines;
        } catch (err) {
            this.uow._logger.error('Failed to fetch virtual machines');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async get_all_virtual_machines_by_host_id(id) {
        this.uow._logger.info(`Fetching all virtual machines from database with host_id ${id}`);
        try {
            const q = this.uow._models.VirtualMachine
                .query(this.uow._transaction)
                .where('host_id', id);

            this.uow._logger.debug(q.toSql());
            const virtual_machines = await q;

            //convert the numeric boolean values to actual true/false values
            for (let i = 0; i< virtual_machines.length; i++) {
                if (virtual_machines[i].enabled !== null) {
                    virtual_machines[i].enabled = virtual_machines[i].enabled === 1 ? true : false;
                }
            }

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
            this.uow._logger.info(`Skipping "${virtual_machine.sdc_id}" because vm is in a failed state`);
            return null;
        }

        this.uow._logger.info(`Creating new virtual machine "${virtual_machine.sdc_id}"`);
        try {
            const virtual_machine_model = this.uow._models.VirtualMachine.fromJson({
                id: virtual_machine.sdc_id,
                sdc_id: virtual_machine.sdc_id,
                name: virtual_machine.name || '',
                enabled: true,
                status: '',
                host_id: virtual_machine.host_id === 'null' ? 'NULL' : virtual_machine.host_id,
                state: virtual_machine.state,
                last_sync: virtual_machine.last_sync
            });

            const q = this.uow._models.VirtualMachine
                .query(this.uow._transaction)
                .insert(virtual_machine_model)
                .returning('*');

            this.uow._logger.debug(q.toSql());
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
        this.uow._logger.info(`Updating virtual machine "${virtual_machine.sdc_id}"`);
        try {
            const virtual_machine_model = this.uow._models.VirtualMachine.fromJson({
                sdc_id: virtual_machine.sdc_id,
                name: virtual_machine.name || '',
                enabled: virtual_machine.enabled,
                status: virtual_machine.status,
                host_id: virtual_machine.host_id,
                state: virtual_machine.state,
                last_sync: virtual_machine.last_sync
            });

            const q = this.uow._models.VirtualMachine
                .query(this.uow._transaction)
                .where('id', virtual_machine.id)
                .patch(virtual_machine_model)
                .returning('*');

            this.uow._logger.debug(q.toSql());
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
}

module.exports = VirtualMachinesRepository;
