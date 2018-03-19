class JobHistoryRepository {
    constructor(uow) {
        this.uow = uow;
    }

    formatColumnForSort(columnName) {
        let formattedName = '';
        let parts = columnName.split('.');

        for (let index = 0 ; index < parts.length ; ++index) {
            const part = parts[index];
            
            if (index > 0) {
                if (index === (parts.length - 1)) {
                    formattedName += '.';
                } else {
                    formattedName += ':';
                }
            }

            formattedName += part;
        }

        return formattedName;
    }

    // examples
    // {"startRow":0,"endRow":100,"sortModel":[],"filterModel":{}}
    // {"startRow":0,"endRow":100,"sortModel":[{"colId":"job_history_job.name","sort":"desc"}],"filterModel":{}}
    // {"startRow":0,"endRow":100,"sortModel":[],"filterModel":{"job_history_job.name":{"type":"contains","filter":"stack","filterType":"text"}}}
    // {"startRow":0,"endRow":100,"sortModel":[],"filterModel":{"job_history_job.name":{"type":"contains","filter":"stack","filterType":"text"},"job_history_job.job_source_host.name":{"type":"contains","filter":"head","filterType":"text"}}}
    async getAllJobHistories(params) {
        this.uow._logger.info(`Fetching all job histories: ${JSON.stringify(params)}`);
        let q = this.uow._models.JobHistory
            .query(this.uow._transaction)
            //.eagerAlgorithm(this.uow._models.JobHistory.JoinEagerAlgorithm)
            .eager('job_history_snapshot')
            .mergeEager('job_history_job.job_source_host')
            .mergeEager('job_history_job.job_target_host')
            .mergeEager('job_history_job.job_virtual_machine');

        if (params.filterModel['job_history_job.name']) {
            const filter = params.filterModel['job_history_job.name'].filter + '%';
            q = q.whereRaw('job_history_job.name LIKE ? ', [filter]);
        }

        if (params.filterModel['job_history_job.job_source_host.name']) {
            const filter = params.filterModel['job_history_job.job_source_host.name'].filter + '%';
            q = q.whereRaw('`job_history_job:job_source_host`.`name` LIKE ? ', [filter]);
        }

        if (params.filterModel['job_history_job.job_virtual_machine.name']) {
            const filter = params.filterModel['job_history_job.job_virtual_machine.name'].filter + '%';
            q = q.whereRaw('`job_history_job:job_virtual_machine`.`name` LIKE ? ', [filter]);
        }

        for (let sort of params.sortModel) {
            q = q.orderBy(this.formatColumnForSort(sort.colId), sort.sort);
        }

        // const count = await q.clone().count('*');
        const countQ = q.clone().select({count: this.uow._Model.raw("count(*)")});
        const countData = await countQ;
        const count = countData.length > 0 ? parseInt(countData[0].count) : 0;

        q = q.limit(params.endRow - params.startRow).offset(params.startRow);
        
        const job_histories = await q;

        console.log(job_histories[0]);
        
        return {data: job_histories, count: count};
    }

    async getUnfinishedJobs() {
        this.uow._logger.info('Fetching running jobs');
        const q = this.uow._models.JobHistory
            .query(this.uow._transaction)
            .eagerAlgorithm(this.uow._models.JobHistory.JoinEagerAlgorithm)
            .mergeEager('job_history_job')
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
        
        let update_job = false;
        try {
            if (job_history.result === 2 || job_history.result === 3) {
                await this.uow.beginTransaction();
                update_job = true;
            }

            const q = this.uow._models.JobHistory
                .query(this.uow._transaction)
                .where('id', job_history.id)
                .patch(job_history)
                .returning('*');

            const newJobHistory = await q;

            if (update_job) {
                const r = this.uow._models.Job
                    .query(this.uow._transaction)
                    .where('id', job_history.job_id)
                    .patch({last_result: job_history.result});

                await r;
                this.uow.commitTransaction();
            }
            
            return newJobHistory;
        } catch (err) {
            if (update_job) {
                await this.uow.rollbackTransaction();
            }
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
