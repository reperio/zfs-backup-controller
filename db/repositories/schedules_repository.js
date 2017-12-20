class SchedulesRepository {
    constructor(uow){
        this.uow = uow;
    }

    async getAllSchedules() {
        const q = this.uow._models.Schedule
            .query(this.uow._transaction);

        const schedules = await q;
        return schedules;
    }
}

module.exports = SchedulesRepository;