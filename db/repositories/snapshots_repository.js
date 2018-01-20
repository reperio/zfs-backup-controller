class SnapshotsRepository {
    constructor (uow) {
        this.uow = uow;
    }

    async getAllSnapshots() {
        this.uow._logger.info('Fetching all snapshots');
        const q = this.uow._models.Snapshot
            .query(this.uow._transaction);
        
        const snapshots = await q;
        return snapshots;
    }

    async getAllSnapshotsByHostId(hostId) {
        this.uow._logger.info(`Fetching all snapshots with host_id: ${hostId}`);
        const q = this.uow._models.Snapshot
            .query(this.uow._transaction)
            .where('source_host_id', hostId);

        const snapshots = await q;
        return snapshots;
    }

    async get_active_snapshots_for_job(job_id) {
        this.uow._logger.info(`Fetching all active snapshots with job_id: ${job_id}`);
        const q = this.uow._models.Snapshot
            .query(this.uow._transaction)
            .mergeEager('snapshot_source_host')
            .mergeEager('snapshot_target_host')
            .mergeEager('snapshot_job_history')
            .mergeEager('snapshot_job')
            .where(function() {
                this.where('source_host_status', 1).orWhere('target_host_status', 1);
            })
            .where('job_id', job_id);


        const snapshots = await q;

        return snapshots;
    }

    async createSnapshotEntry(job_history, snapshot) {
        this.uow._logger.info(`${job_history.job_id} | ${job_history.id} - Creating snapshot entry`);
        try {
            const q = this.uow._models.Snapshot
                .query(this.uow._transaction)
                .insert(snapshot)
                .returning('*');

            const dbSnapshot = await q;
            return dbSnapshot;
        } catch (err) {
            this.uow._logger.error(err);
            throw err;
        }
    }

    async updateSnapshotEntry(snapshot) {
        const q = this.uow._models.Snapshot
            .query(this.uow._transaction)
            .where('job_history_id', snapshot.job_history_id)
            .patch(snapshot)
            .returning('*');

        const newSnapshot = await q;
        return newSnapshot;
    }

    async deleteSnapshotEntryById(snapshotId) {
        this.uow._logger.info(`Deleting snapshot entry with id: ${snapshotId}`);
        try {
            await this.uow._models.Snapshot
                .query(this.uow._transaction)
                .where('job_history_id', snapshotId)
                .delete();

            return true;
        } catch (err) {
            this.uow._logger.error(err);
            throw err;
        }
    }
}

module.exports = SnapshotsRepository;
