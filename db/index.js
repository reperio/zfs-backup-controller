const db = require('./models');
const JobsRepository = require("./repositories/jobs_repository");

class DataModel {
    constructor(logger) {
        this._db = db;
        this.logger = logger;

        this._jobsRepository = null;
    }

    get jobs_repository() {
        this._jobsRepository = this._jobsRepository || new JobsRepository(this);
        return this._jobsRepository;
    }
}

module.exports = DataModel;