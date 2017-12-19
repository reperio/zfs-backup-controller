class JobsRepository {
    constructor(uow){
        this.uow = uow;
    }

    async getAllJobs() {
        //this.data_model.logger.info('Fetching all jobs');
        const q = this.uow._models.Job
            .query(this.uow._transaction)
            .where("enabled", true);

        const jobs = await q;
        return jobs;
    }

    async getUnfinishedJobs() {
        this.uow._logger.info('Fetching unfinished jobs');
        const q = this.uow._models.JobHistory
            .query(this.uow._transaction)
            .whereIn("result", [0, 1])

        const jobs = await q;
        return jobs;
    }

    async create_job_history(job_history) {
        this.uow._logger.info(`  ${job_history.job_id} - Creating job history.`);

        try {
            const job_history = await this.uow._models.JobHistory
                .query(this.uow._transaction)
                .insertAndFetch(job_history);
        } catch (err) {
            this.uow._logger.error(`  ${job_history.job_id} - Creating job history failed.`);
            this.uow._logger.error(err);
            return null;
        }
    }

    async get_job_history_by_id(job_history_id) {
        this.uow._logger.info(`Fetching job history entry with id: ${job_history_id}`);

        try {
            const q = this.uow._models.JobHistory
                .query(this.uow._transaction)
                .mergeEager("job_history_snapshot")
                .where("id", job_history_id);

            const job_history = await q;
            return job_history;
        } catch (err) {
            this.uow._logger.error(err);
            return null;
        }
    }

    async get_most_recent_successful_job_history(job_id) {
        this.uow._logger.info(`Fetching last successful job history entry for job: ${job_id}`);
        try {
            const q = this.uow._models.JobHistory
                .query(this.uow._transaction)
                .mergeEager("job_history_snapshot")
                .where("job_id", job_id)
                .where("source_result", 2)
                .where("target_result", 2)
                .where("result", 2)
                .orderBy("end_date_time", "desc");

            const job_histories = await q;
            
            if (job_histories.length > 0) {
                return job_histories[0];
            }

            return null;
        } catch (err) {
            this.uow._logger.error(err);
            return null;
        }
    }
}

module.exports = JobsRepository;