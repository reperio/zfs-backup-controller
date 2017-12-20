class HostsRepository {
    constructor(uow){
        this.uow = uow;
    }

    async getAllHosts() {
        const q = this.uow._models.Host
            .query(this.uow._transaction);

        const hosts = await q;
        return hosts;
    }
}

module.exports = HostsRepository;