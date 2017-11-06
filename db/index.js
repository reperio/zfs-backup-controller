const db = require('./models');
const JobsRepository = require("./repositories/jobs_repository");
const SnapshotsRepository = require("./repositories/snapshots_repository");

class DataModel {
    constructor(logger) {
        this._db = db;
        this.logger = logger;

        this._jobsRepository = null;
        this._snapshotsRepository = null;
    }

    get jobs_repository() {
        this._jobsRepository = this._jobsRepository || new JobsRepository(this);
        return this._jobsRepository;
    }

    get snapshots_repository() {
        this._snapshotsRepository = this._snapshotsRepository || new SnapshotsRepository(this);
        return this._snapshotsRepository;
    }
}

module.exports = DataModel;