const request = require('request-promise-native');

class CnApi {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    //TODO log all the things

    async getAllServers() {
        this.logger.info('Retrieving servers from cn_api');
        const url = 'http://' + this.config.cnapi_ip_address + '/servers';

        const http_options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };

        try {
            const serverRecords = await request(http_options);
            this.logger.info('Retrieved servers from cn_api');
            return serverRecords;
        } catch (err) {
            this.logger.error(err);
            throw err;
        }
    }

    async getServerRecord(uuid) {
        this.logger.info(`Retrieving record for server "${uuid}" from cn_api`);
        const url = 'http://' + this.config.cnapi_ip_address + '/servers/' + uuid;
        
        const http_options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };

        try {
            const result = await request(http_options);
            
            let serverRecord = {
                hostname: result.hostname,
                uuid: result.uuid,
                memory_total_bytes: result.memory_total_bytes,
                memory_provisionable_bytes: result.memory_provisionable_bytes,
                memory_available_bytes: result.memory_available_bytes,
                reservation_ratio: result.reservation_ratio,
                headnode: result.headnode,
                datacenter: result.datacenter,
                vms: result.vms,
                disk_pool_alloc_bytes: result.disk_pool_alloc_bytes,
                disk_pool_size_bytes: result.disk_pool_size_bytes,
                sysinfo: result.sysinfo
            };
            return serverRecord;

        } catch (err) {
            this.logger.error(`Failed to retrieve record for server "${uuid}"`);
            this.logger.error(err);

            throw err;
        }
    }
}

module.exports = CnApi;