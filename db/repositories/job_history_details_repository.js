class JobHistoryDetailsRepository {
    constructor (uow) {
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

    async getAllJobHistoryDetails(params) {
        this.uow._logger.info(`Fetching all job history details: ${JSON.stringify(params)}`);

        let q = this.uow._models.JobHistoryDetail
            .query(this.uow._transaction);

        if (params.filterModel.job_name) {
            const filter = params.filterModel.job_name.filter + '%';
            q = q.whereRaw('job_name LIKE ? ', [filter]);
        }

        if (params.filterModel.source_node_name) {
            const filter = params.filterModel.source_node_name.filter + '%';
            q = q.whereRaw('source_node_name LIKE ? ', [filter]);
        }

        if (params.filterModel.virtual_machine_name) {
            const filter = params.filterModel.virtual_machine_name.filter + '%';
            q = q.whereRaw('virtual_machine_name LIKE ? ', [filter]);
        }

        if (params.filterModel.start_date_time) {
            const filter = params.filterModel.start_date_time.filter + '%';
            q = q.whereRaw('start_date_time LIKE ? ', [filter]);
        }

        if (params.filterModel.end_date_time) {
            const filter = params.filterModel.end_date_time.filter + '%';
            q = q.whereRaw('end_date_time LIKE ? ', [filter]);
        }

        if (params.filterModel.schedule_date_time) {
            const filter = params.filterModel.schedule_date_time.filter + '%';
            q = q.whereRaw('schedule_date_time LIKE ? ', [filter]);
        }

        if (params.filterModel.result) {
            const filter = params.filterModel.result.filter + '%';
            q = q.whereRaw('result LIKE ? ', [filter]);
        }
        
        if (params.filterModel.source_host_status) {
            const filter = params.filterModel.source_host_status.filter + '%';
            q = q.whereRaw('source_host_status LIKE ? ', [filter]);
        }
        
        if (params.filterModel.target_host_status) {
            const filter = params.filterModel.target_host_status.filter + '%';
            q = q.whereRaw('target_host_status LIKE ? ', [filter]);
        }
        for (let sort of params.sortModel) {
            q = q.orderBy(this.formatColumnForSort(sort.colId), sort.sort);
        }

        const countQ = q.clone().select({count: this.uow._Model.raw('count(*)')});
        const countData = await countQ;
        const count = countData.length > 0 ? parseInt(countData[0].count) : 0;

        q = q.limit(params.endRow - params.startRow).offset(params.startRow);
        
        const jobs = await q;
        
        return {data: jobs, count: count};
    }
}

module.exports = JobHistoryDetailsRepository;
