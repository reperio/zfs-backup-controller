class JobHistoryRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async getAllJobHistories(host_id, virtual_machine_id) {
        this.uow._logger.info(`Fetching all job histories: ${host_id} | ${virtual_machine_id}`);
        let q = this.uow._models.JobHistory
            .query(this.uow._transaction)
            .eagerAlgorithm(this.uow._models.JobHistory.JoinEagerAlgorithm)
            .mergeEager('job_history_job.job_source_host')
            .mergeEager('job_history_job.job_target_host')
            .mergeEager('job_history_job.job_virtual_machine');

        if (host_id) {
            q = q.where('job_history_job.source_host_id', host_id);
        }

        if (virtual_machine_id) {
            q = q.andWhere('job_history_job.sdc_vm_id', virtual_machine_id);
        }
        
        const job_histories = await q;
        return job_histories;
    }

    async getUnfinishedJobs() {
        this.uow._logger.info('Fetching unfinished jobs');
        const q = this.uow._models.JobHistory
            .query(this.uow._transaction)
            .whereIn('result', [0, 1]);

        const job_histories = await q;
        return job_histories;
    }

    async create_job_history(job_history) {
        this.uow._logger.info(`  ${job_history.job_id} - Creating job history.`);
        this.uow._logger.debug('Job History Entry: ' + JSON.stringify(job_history));

        try {
            const q = this.uow._models.JobHistory
                .query(this.uow._transaction)
                .insertAndFetch(job_history);

            const new_job_history = await q;
            return new_job_history;
        } catch (err) {
            this.uow._logger.error(`  ${job_history.job_id} - Creating job history failed.`);
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_job_history_entry(job_history) {
        this.uow._logger.info(`${job_history.job_id} - Updating job history.`);
        this.uow._logger.debug('Job History Entry: ' + JSON.stringify(job_history));

        try {
            const q = this.uow._models.JobHistory
                .query(this.uow._transaction)
                .where('id', job_history.id)
                .patch(job_history)
                .returning('*');

            const newJobHistory = await q;
            return newJobHistory;
        } catch (err) {
            this.uow._logger.error(err);
            throw err;
        }
    }

    async get_job_history_by_id(job_history_id) {
        this.uow._logger.info(`Fetching job history entry with id: ${job_history_id}`);

        try {
            const q = this.uow._models.JobHistory
                .query(this.uow._transaction)
                //.eagerAlgorithm(this.uow._models.JobHistory.JoinEagerAlgorithm)
                .mergeEager('job_history_snapshot')
                .where('id', job_history_id);

            const job_histories = await q;
            
            if (job_histories.length > 0) {
                return job_histories[0];
            }

            return null;
        } catch (err) {
            this.uow._logger.error(err);
            throw err;
        }
    }

    async get_most_recent_successful_job_history(job_id) {
        this.uow._logger.info(`Fetching last successful job history entry for job: ${job_id}`);
        try {
            const q = this.uow._models.JobHistory
                .query(this.uow._transaction)
                .mergeEager('job_history_snapshot')
                .where('job_id', job_id)
                .where('source_result', 2)
                .where('target_result', 2)
                .where('result', 2)
                .orderBy('end_date_time', 'desc');

            const job_histories = await q;
            
            if (job_histories.length > 0) {
                return job_histories[0];
            }

            return null;
        } catch (err) {
            this.uow._logger.error(err);
            throw err;
        }
    }
}

module.exports = JobHistoryRepository;
