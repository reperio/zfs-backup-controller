const _ = require('lodash');
const range = require('range_check');

class HostsManager {
    constructor(uow, cn_api, default_host_port, admin_network) {
        this.uow = uow;
        this.cn_api = cn_api;
        this.default_host_port = default_host_port;
        this.admin_network = admin_network;
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
                    id: api_host.uuid,
                    name: api_host.hostname,
                    sdc_id: api_host.uuid,
                    ip_address: this.get_ip_addresses(api_host),
                    port: this.default_host_port
                });
            });


            //get all hosts from database
            const db_hosts = await this.uow.hosts_repository.getAllHosts();

            let hosts_to_update = [];
            let hosts_to_create = [];

            _(converted_api_hosts).each((api_host) => {
                let is_in_database = false;

                _(db_hosts).each((db_host) => {
                    if (api_host.sdc_id === db_host.sdc_id) {
                        is_in_database = true;
                        const new_updated_host = {
                            id: db_host.id,
                            name: api_host.name,
                            sdc_id: db_host.sdc_id,
                            ip_address: api_host.ip_address,
                            port: db_host.port || this.default_host_port
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
        let nics = host.sysinfo['Network Interfaces'];

        for(let nic in nics) {
            if (nics[nic]['Link Status'] === 'up') {
                if (range.inRange(nics[nic].ip4addr, this.admin_network)) {
                    return nics[nic].ip4addr;
                }
            }
        }

        return '';
    }
}

module.exports = HostsManager;
