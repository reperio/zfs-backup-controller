const _ = require('lodash');

class HostsManager {
    constructor(uow, cn_api) {
        this.uow = uow;
        this.cn_api = cn_api;
    }

    async execute() {
        this.uow._logger.info('');
        this.uow._logger.info('Host Manager execution starting');

        try { 
            //get all hosts from cn_api
            const cn_api_hosts = await this.cn_api.getAllServers();

            let converted_api_hosts = [];
            _(cn_api_hosts).each((api_host) => {
                converted_api_hosts.push({
                    id: null,
                    name: api_host.hostname,
                    sdc_id: api_host.uuid,
                    ip_address: '',
                    port: 0
                });
            });


            //get all hosts from database
            const db_hosts = await this.uow.hosts_repository.getAllHosts();

            let hosts_to_update = [];
            let hosts_to_create = [];

            _(converted_api_hosts).each((api_host) => {
                let is_in_database = false;

                //const ip_address = this.get_ip_addresses(api_host);
                _(db_hosts).each((db_host) => {
                    if (api_host.sdc_id === db_host.sdc_id) {
                        is_in_database = true;
                        const new_updated_host = {
                            id: db_host.id,
                            name: db_host.name,
                            sdc_id: db_host.sdc_id,
                            ip_address: db_host.ip_address,
                            port: db_host.port
                        };
                        hosts_to_update.push(new_updated_host);
                    }
                });

                if (!is_in_database) {
                    hosts_to_create.push(api_host);
                }
            });

            //create new hosts
            await this.uow.hosts_repository.create_hosts_bulk(hosts_to_create);

            //update existing hosts
            await this.uow.hosts_repository.update_hosts_bulk(hosts_to_update);

            this.uow._logger.info('Host Manager execution finished');
        } catch (err) {
            this.uow._logger.error('Host Manager execution failed');
            this.uow._logger.error(err);
        }
    }

    get_ip_addresses(host) {
        let addresses = [];
        let nics = host.sysinfo['Network Interfaces'];

        for(let nic in nics) {
            if (nics[nic]['Link Status'] === 'up') {
                addresses.push(nics[nic].ip4addr);
            }
        }

        return addresses.join(', ');
    }
}

module.exports = HostsManager;