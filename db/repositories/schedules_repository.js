class SchedulesRepository {
    constructor(uow) {
        this.uow = uow;
    }

    async getAllSchedules() {
        const q = this.uow._models.Schedule
            .query(this.uow._transaction);

        const schedules = await q;
        return schedules;
    }

    async get_schedule_by_id(id) {
        this.uow._logger.info(`Fetching schedule by id: ${id}`);
        const q = this.uow._models.Schedule
            .query(this.uow._transaction)
            .findById(id);

        this.uow._logger.debug(q.toSql());
        const schedule = await q;
        return schedule;
    }
}

module.exports = SchedulesRepository;
