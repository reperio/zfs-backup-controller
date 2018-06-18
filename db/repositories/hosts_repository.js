const {knex} = require('../connect');

class HostsRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async get_all_hosts() {
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

    async get_all_workload_details(host_id) {
        const filter_host_id = host_id || null;
        this.uow._logger.info('Fetching all host workloads from database');

        try {
            const active_backup_jobs_query = knex('job_history').count('*').where(knex.raw('?? = ?? AND (?? = ?? OR ?? = ??)', ['job_history.result', 1, 'jobs.source_host_id', 'hosts.id', 'jobs.target_host_id', 'hosts.id'])).leftJoin('jobs', 'jobs.id', 'job_history.job_id');
            const active_retention_jobs_query = knex('snapshots').count('*').where(knex.raw('(?? = ?? AND ?? = ??) OR (?? = ?? AND ?? = ??)', ['snapshots.source_host_status', 5, 'snapshots.source_host_id', 'hosts.id', 'snapshots.target_host_status', 5, 'snapshots.target_host_id', 'hosts.id']));
            const q = knex.column(
                {id: 'hosts.id'},
                {name: 'hosts.name'},
                {max_total_jobs: 'hosts.max_total_jobs'},
                {max_backup_jobs: 'hosts.max_backup_jobs'},
                {max_retention_jobs: 'hosts.max_retention_jobs'},
                {current_backup_jobs: active_backup_jobs_query},
                {current_retention_jobs: active_retention_jobs_query})
                .from('hosts');

            if (filter_host_id) {
                q.where('id', filter_host_id);
            }

            const results = await q;
            return results;
        } catch (err) {
            this.uow._logger.error('Failed to fetch all host workloads from database');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async get_host_by_id(host_id) {
        this.uow._logger.info(`Fetching host with id "${host_id}"`);

        const q = this.uow._models.Host
            .query(this.uow._transaction)
            .findById(host_id);

        const host = await q;
        return host;
    }

    async create_host(host) {
        this.uow._logger.info(`Creating new host entry "${host.sdc_id}"`);
        try {
            const host_model = this.uow._models.Host.fromJson({
                name: host.name,
                sdc_id: host.sdc_id || null,
                ip_address: host.ip_address,
                port: host.port,
                max_total_jobs: host.max_total_jobs,
                max_backup_jobs: host.max_backup_jobs,
                max_retention_jobs: host.max_retention_jobs
            });

            const q = this.uow._models.Host
                .query(this.uow._transaction)
                .insert(host_model)
                .returning('*');

            const new_host = await q;
            return new_host;
        } catch (err) {
            this.uow._logger.error('Failed to create host entry');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_host(host) {
        this.uow._logger.info(`Updating host entry "${host.id}"`);
        try {
            const host_model = this.uow._models.Host.fromJson({
                name: host.name,
                sdc_id: host.sdc_id,
                ip_address: host.ip_address,
                port: host.port,
                max_total_jobs: host.max_total_jobs,
                max_backup_jobs: host.max_backup_jobs,
                max_retention_jobs: host.max_retention_jobs
            });

            const q = this.uow._models.Host
                .query(this.uow._transaction)
                .where('id', host.id)
                .patch(host_model)
                .returning('*');

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

    async delete_host_by_id(host_id) {
        try {
            this.uow._logger.info(`Deleting host with id: "${host_id}"`);

            //make sure we can actually delete this host
            const host = await this.get_host_by_id(host_id);

            if (host.sdc_id !== null) {
                throw new Error('Cannot delete host: Host from cnapi');
            }

            const q = this.uow._models.Host
                .query(this.uow._transaction)
                .deleteById(host_id);

            await q;
            return true;
        } catch (err) {
            this.uow._logger.error('Failed to delete host');
            this.uow._logger.error(err);
            throw err;
        }
    }
}

module.exports = HostsRepository;
