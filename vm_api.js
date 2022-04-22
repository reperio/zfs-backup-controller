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
                if (vm_records[i].state) {
                    if (vm_records[i].state !== 'destroyed' && vm_records[i].state !== 'failed' && vm_records[i].state !== 'configured') {
                        trimmed_records.push(this.get_vm_object(vm_records[i]));
                    }
                }
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
            return this.get_vm_object(vm_record);
        } catch (err) {
            this.logger.error(`Failed to fetch record for vm "${uuid}"`);
            this.logger.error(err);
            throw err;
        }
    }

    async get_full_vm_record_by_id(uuid) {
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
            return vm_record;
        } catch (err) {
            this.logger.error(`Failed to fetch record for vm "${uuid}"`);
            this.logger.error(err);
            throw err;
        }
    }

    get_vm_object(vm_record) {
        const datasets = [];

        datasets.push({
            location: vm_record.zfs_filesystem,
            name: 'root',
            virtual_machine_id: vm_record.uuid,
            enabled: vm_record.brand === 'kvm' ? false : true,
            type: 'root'
        });

        if (vm_record.brand === 'kvm') {
            for (let i = 0; i < vm_record.disks.length; i++) {
                datasets.push({
                    location: vm_record.disks[i].zfs_filesystem || null,
                    name: vm_record.disks[i].zfs_filesystem.substr(vm_record.disks[i].zfs_filesystem.lastIndexOf('-') + 1) || null,
                    virtual_machine_id: vm_record.uuid,
                    enabled: true,
                    type: 'zvol'
                });
            }
        } else {
            for (let i = 0; i < vm_record.datasets.length; i++) {
                datasets.push({
                    location: vm_record.datasets[i],
                    name: vm_record.datasets[i].substr(vm_record.datasets[i].lastIndexOf('/') + 1),
                    virtual_machine_id: vm_record.uuid,
                    enabled: true,
                    type: 'dataset'
                });
            }
        }

        return {
            id: vm_record.uuid,
            name: vm_record.alias,
            status: '',
            host_id: vm_record.server_uuid,
            state: vm_record.state,
            type: vm_record.brand,
            datasets: datasets
        };
    }
}

module.exports = VmApi;
