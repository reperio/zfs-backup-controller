const request = require('request-promise-native');

class VmApi {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }

    async get_all_vm_records() {
        this.logger.info('Fetching all vm records from vm_api');
        const url = 'http://' + this.config.vmapi_ip_address + '/vms';

        const options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };

        try {
            const vm_records = await request(options);
            this.logger.info('Fetched vm records');

            let trimmed_records = [];

            for (let i = 0; i < vm_records.length; i++) {
                trimmed_records.push({
                    sdc_id: vm_records[i].uuid,
                    name: vm_records[i].alias,
                    enabled: null,
                    status: null,
                    host_id: vm_records[i].server_uuid,
                    state: vm_records[i].state
                });
            }

            return trimmed_records;
        } catch (err) {
            this.logger.error('Failed to fetch vm records');
            this.logger.error(err);
            throw err;
        }
    }

    async get_vm_record_by_id(uuid) {
        this.logger.info(`Fetching record for vm "${uuid}"`);
        const url = 'http://' + this.config.vmapi_ip_address + '/vms/' + uuid;

        const options = {
            uri: url,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            json: true
        };

        try {
            const vm_record = await request(options);
            this.logger.info(`Fetched record for vm "${vm_record.uuid}"`);
            return {
                sdc_id: vm_record.uuid,
                name: vm_record.alias,
                enabled: null,
                status: null,
                host_id: vm_record.server_uuid,
                state: vm_record.state
            };
        } catch (err) {
            this.logger.error(`Failed to fetch record for vm "${uuid}"`);
            this.logger.error(err);
            throw err;
        }
    }
}

module.exports = VmApi;
