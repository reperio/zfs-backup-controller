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
        this.data_model.logger.info(`  ${job_history.job_id} - Creating job history.`);
        try {
            const job_history_record = await this.data_model._db.job_history.create(job_history);
            this.data_model.logger.info(`  ${job_history.job_id} | ${job_history_record.id} - Job history entry created.`);

            return job_history_record;
        } catch(err) {
            this.data_model.logger.error(`  ${job_history.job_id} - Creating job history failed.`);
            this.data_model.logger.error(err);
            return null;
        }
    }

    async get_job_history_by_id(job_history_id) {
        this.data_model.logger.info(`Fetching job history entry with id: ${job_history_id}`);
        try {
            const job_history = await this.data_model._db.job_history.findOne({
                where: {id: job_history_id}
            });

            return job_history;
        } catch (err) {
            this.data_model.logger.error(err);
            return null;
        }
    }

    async get_most_recent_successful_job_history(job_id) {
        this.data_model.logger.info(`Fetching last successful job history entry for job: ${job_id}`);

        try {
            const job_history = await this.data_model._db.job_history.findAll({
                where: {
                    job_id: job_id,
                    source_result: 2,
                    target_result: 2
                    //TODO add result: 2 once we find out how to reliably set it
                },
                include: [{
                    model: this.data_model._db.snapshots,
                    as: 'snapshots'
                }],
                order: ['end_date_time', 'DESC']
            });

            if (job_history.length > 0) {
                return job_history[0];
            }

            return null;
        } catch (err) {
            this.data_model.logger.error(err);
            return null;
        }
    }
}

module.exports = JobsRepository;
