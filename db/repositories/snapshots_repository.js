class SnapshotsRepository {
    constructor(data_model) {
        this.data_model = data_model;
    }

    async getAllSnapshotsByHostId(hostId) {
        this.data_model.logger.info(`Fetching all snapshots with host_id: ${hostId}`);
        const snapshots = await this.data_model._db.snapshots.findAll({
            where: { host_id: hostId}
        });
        return snapshots;
    }

    async createSnapshotEntry(job_history, snapshot) {
        this.data_model.logger.info(`${job_history.job_id} | ${job_history.id} - Creating snapshot entry`);
        try {
            const snapshot_entry = await this.data_model._db.snapshots.create(snapshot);

            return snapshot_entry;
        } catch (err) {
            this.data_model.logger.error(err);
            return null;
        }
    }

    async deleteSnapshotEntryById(snapshotId) {
        this.data_model.logger.info(`Deleting snapshot entry with id: ${snapshotId}`);
        try {
            await this.data_model._db.snapshots.destroy({
                where: { id: snapshotId }
            });

            return true;
        } catch (err) {
            this.data_model.logger.error(err);
            return null;
        }
    }
}

module.exports = SnapshotsRepository;