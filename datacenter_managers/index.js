const HostManager = require('./hosts_manager');
const VirtualMachineManager = require('./virtual_machine_manager');
const CnApi = require('../cn_api');
const VmApi = require('../vm_api');

class DataCenterApisManager {
    constructor (uow, config) {
        this.uow = uow;
        this.config = config;
    }

    async start() {
        const cn_api = new CnApi(this.config, this.uow._logger);
        const vm_api = new VmApi(this.config, this.uow._logger);

        const host_manager = new HostManager(this.uow, cn_api);
        const vm_manager = new VirtualMachineManager(this.uow, vm_api);

        this.interval_id = setInterval(async () => {
            await host_manager.execute();
            await vm_manager.execute();
        }, this.config.datacenter_apis_interval);

        await host_manager.execute();
        await vm_manager.execute();
    }
}

module.exports = DataCenterApisManager;
