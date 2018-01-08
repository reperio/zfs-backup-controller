class HostsRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async getAllHosts() {
        this.uow._logger.info('Fetching all hosts from database');
        try {
            const q = this.uow._models.Host
                .query(this.uow._transaction)
                .orderBy('name', 'ASC');

            this.uow._logger.debug(q.toSql());
            const hosts = await q;
            this.uow._logger.info('Fetched all hosts');
            return hosts;
        } catch (err) {
            this.uow._logger.error('Failed to fetch hosts from database');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async create_host(host) {
        this.uow._logger.info(`Creating new host entry "${host.sdc_id}"`);
        try {
            const host_model = this.uow._models.Host.fromJson({
                id: host.sdc_id,
                name: host.name,
                sdc_id: host.sdc_id,
                ip_address: host.ip_address,
                port: host.port
            });

            const q = this.uow._models.Host
                .query(this.uow._transaction)
                .insert(host_model)
                .returning('*');

            this.uow._logger.debug(q.toSql());
            const new_host = await q;
            return new_host;
        } catch (err) {
            this.uow._logger.error('Failed to create host entry');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_host(host) {
        this.uow._logger.info(`Updating host entry "${host.sdc_id}"`);
        try {
            const host_model = this.uow._models.Host.fromJson({
                name: host.name,
                sdc_id: host.sdc_id,
                ip_address: host.ip_address,
                port: host.port
            });

            const q = this.uow._models.Host
                .query(this.uow._transaction)
                .where('id', host.id)
                .patch(host_model)
                .returning('*');

            this.uow._logger.debug(q.toSql());
            const updated_host = await q;
            return updated_host;
        } catch (err) {
            this.uow._logger.error('Failed to update host entry');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async create_hosts_bulk(hosts) {
        let inserted_hosts = [];

        try {
            this.uow._logger.info(`Starting batch insert of ${hosts.length} host(s)`);
            this.uow._logger.debug(JSON.stringify(hosts));
            for (let i = 0; i < hosts.length; i++) {
                const inserted_host = await this.create_host(hosts[i]);
                inserted_hosts.push(inserted_host);
            }

            this.uow._logger.info('Finished batch insert');
            return inserted_hosts;
        } catch (err) {
            this.uow._logger.error('Failed batch insert');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_hosts_bulk(hosts) {
        let updated_hosts = [];

        try {
            this.uow._logger.info(`Starting batch update of ${hosts.length} host(s)`);
            
            for (let i = 0; i < hosts.length; i++) {
                const updated_host = await this.update_host(hosts[i]);
                updated_hosts.push(updated_host);
            }

            this.uow._logger.info('Finished batch update');
            return updated_hosts;
        } catch (err) {
            this.uow._logger.error('Failed batch update');
            this.uow._logger.error(err);
            throw err;
        }
    }
}

module.exports = HostsRepository;
