class JobsRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async getAllJobs() {
        this.uow._logger.info('Fetching all jobs');
        const q = this.uow._models.Job
            .query(this.uow._transaction)
            .mergeEager("job_schedule")
            .mergeEager("job_source_host")
            .mergeEager("job_target_host");

        const jobs = await q;
        return jobs;
    }

    async getAllEnabledJobs() {
        this.uow._logger.info('Fetching all enabled jobs');
        const q = this.uow._models.Job
            .query(this.uow._transaction)
            .mergeEager("job_schedule")
            .mergeEager("job_source_host")
            .mergeEager("job_target_host")
            .where("enabled", true);

        const jobs = await q;
        return jobs;
    }

    async update_job_entry(id, job) {
        this.uow._logger.debug("JOB: " + JSON.stringify(job));
        this.uow._logger.info(`  ${job.id} - Updating job record.`);
        
        try {
            const q = this.uow._models.Job 
                .query(this.uow._transaction)
                .where("id", id)
                .patch(job)
                .returning("*");

            this.uow._logger.debug("JOB UPDATE QUERY: " + q.toSql());

            const newJob = await q;
            return newJob;
        } catch (err) {
            this.uow._logger.error(`  ${job.id} - Failed to update job record`);
            this.uow._logger.error(err);
            return null;
        }
    }
}

module.exports = JobsRepository;