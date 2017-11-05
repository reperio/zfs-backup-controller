class JobsRepository {
    constructor(data_model) {
        this.data_model = data_model;
    }

    async getAllJobs() {
        this.data_model.logger.info('Fetching all jobs');
        const jobs = await this.data_model._db.jobs.findAll({
            include: [{
                model: this.data_model._db.hosts,
                as: 'source_host'
            }, {
                model: this.data_model._db.hosts,
                as: 'target_host'
            }, {
                model: this.data_model._db.schedules,
                as: 'schedule'
            }]
        });
        return jobs;
    }

    async create_job_history(job_history) {
        this.data_model.logger.info('Creating job history');
        try {
            const job_history_record = await this.data_model._db.job_history.create(job_history);

            return job_history_record;
        } catch(err) {
            this.data_model.logger.error(err);
            return null;
        }
    }
}

module.exports = JobsRepository;