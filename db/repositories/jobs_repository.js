class JobsRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async getAllJobs(node_id, order_by, order_direction) {
        this.uow._logger.info('Fetching all jobs');

        const q = this.uow._models.Job
            .query(this.uow._transaction)
            .mergeEager('job_schedule')
            .mergeEager('job_source_host')
            .mergeEager('job_target_host')
            .mergeEager('job_virtual_machine');

        if (node_id) {
            q.where('source_host_id', node_id);
        }

        if (order_by && order_direction) {
            q.orderBy(order_by, order_direction);
        }

        const jobs = await q;

        return jobs;
    }

    async getAllEnabledJobs() {
        this.uow._logger.info('Fetching all enabled jobs');
        const q = this.uow._models.Job
            .query(this.uow._transaction)
            .mergeEager('job_schedule')
            .mergeEager('job_source_host')
            .mergeEager('job_target_host')
            .where('enabled', true);

        const jobs = await q;
        return jobs;
    }

    async get_job_by_id(id) {
        this.uow._logger.info(`Fetching job "${id}"`);

        try {
            const q = this.uow._models.Job
                .query(this.uow._transaction)
                .findById(id)
                .mergeEager('job_schedule')
                .mergeEager('job_source_host')
                .mergeEager('job_target_host')
                .mergeEager('job_virtual_machine');

            const job = await q;
            return job;
        } catch (err) {
            this.uow._logger.error(`Failed to fetch job "${id}"`);
            this.uow._logger.error(err);
            throw err;
        }
    }

    async create_job(job) {
        this.uow._logger.info(`Creating job "${job.name}"`);

        try {
            const job_model = this.uow._models.Job.fromJson({
                name: job.name,
                schedule_id: job.schedule_id,
                source_location: job.source_location,
                source_retention: job.source_retention,
                target_location: job.target_location,
                target_retention: job.target_retention,
                zfs_type: job.zfs_type,
                zfs_size: job.zfs_size,
                source_host_id: job.source_host_id,
                target_host_id: job.target_host_id,
                last_execution: job.last_execution,
                last_schedule: job.last_schedule,
                sdc_vm_id: job.sdc_vm_id,
                enabled: job.enabled,
                offset: job.offset
            });

            const q = this.uow._models.Job
                .query(this.uow._transaction)
                .insert(job_model)
                .returning('*');

            const new_job= await q;
            return new_job;
        } catch (err) {
            this.uow._logger.error('Failed to create job');
            this.uow._logger.error(err);
            throw err;
        }
    }

    async update_job_entry(job) {
        this.uow._logger.info(`  ${job.id} - Updating job record.`);
        
        try {
            const job_model = this.uow._models.Job.fromJson({
                name: job.name,
                schedule_id: job.schedule_id,
                source_retention: job.source_retention,
                target_retention: job.target_retention,
                last_execution: job.last_execution, //moment().utc(job.last_execution).format('YYYY-MM-DD hh:mm:ss'),
                last_schedule: job.last_schedule, //moment().utc(job.last_schedule).toDate(),
                enabled: job.enabled,
                offset: job.offset
            });

            const q = this.uow._models.Job
                .query(this.uow._transaction)
                .where('id', job.id)
                .patch(job_model)
                .returning('*');

            const new_job = await q;
            this.get_job_by_id(job.id);
            return new_job;
        } catch (err) {
            this.uow._logger.error(`  ${job.id} - Failed to update job record`);
            this.uow._logger.error(err);
            throw err;
        }
    }

    async delete_job(id) {
        this.uow._logger.info(`Deleting job "${id}"`);

        try {
            const q = this.uow._models.Job
                .query(this.uow._transaction)
                .delete()
                .where('id', id);

            await q;
            return;
        } catch (err) {
            this.uow._logger.error(`Failed to delete job "${id}"`);
            this.uow._logger.error(err);
            throw err;
        }
    }
}

module.exports = JobsRepository;
