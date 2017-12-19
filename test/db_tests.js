process.env.NODE_ENV = 'test';

const moment = require('moment');
const assert = require('assert');
const cp = require('child_process');
const sinon = require('sinon');

const UoW = require('../objection_db');
const {knex, Model} = require('../objection_db/connect.js');
const knex_config = require('../objection_db/knexfile').test;

const connection = knex.client.connectionSettings;

describe("DB Integration Tests",function () {
    //initialize uow
    const _uow = new UoW();

    //set timeout
    this.timeout(15000);

    //set up the database 
    before(async () => {
        //create the database 
        cp.execSync(`mysql -u ${connection.user} -p${connection.password} -h ${connection.host} -e "CREATE DATABASE ${connection.database} CHARACTER SET utf8 COLLATE utf8_general_ci";`, {stdio: [0,0,0]});
        
        //give user rights to the new database
        cp.execSync(`mysql -u ${connection.user} -p${connection.password} -h ${connection.host} -e "GRANT SELECT, INSERT, UPDATE ON ${connection.database}.* TO '${connection.user}'@'${connection.host}'";`, {stdio: [0,0,0]});
        
        //run migrations
        await knex.migrate.latest(knex_config);
        
        //seed database
        await knex.seed.run(knex_config);
    });

    describe('Jobs Repository', () => {
        it('Should return 1 job', async () => {
            const jobs = await _uow.jobs_repository.getAllJobs();
            assert.equal(jobs.length, 1);
        });

        it('Should return 0 unfinished jobs', async () => {
            const job_histories = await _uow.jobs_repository.getUnfinishedJobs();
            assert.equal(job_histories.length, 0);
        });

        //create job_history entry

        it('Should return a job history', async() => {
            const job_history = await _uow.jobs_repository.get_job_history_by_id('e714e0ed-9e83-4421-8058-1232024c7e50');
            assert.notEqual(job_history, null);
        });

        it('Should return a successful job_history', async()=>{
            const job_history = _uow.jobs_repository.get_most_recent_successful_job_history('b21d3b67-4e78-4b2c-8169-5891520048a8');
            assert.notEqual(job_history, null);
        });
    });

    describe('Snapshots Repository', () => {
        it('Should return 1 snapshot', async () => {
            const snapshot = await _uow.snapshots_repository.getAllSnapshotsByHostId('d08a1f76-7c4a-4dd9-a377-83ffffa752f4');
            assert.notEqual(snapshot, null);
        });

        it('Should return 1 active snapshot for job "b21d3b67-4e78-4b2c-8169-5891520048a8"', async () => {
            const snapshot = await _uow.snapshots_repository.get_active_snapshots_for_job('b21d3b67-4e78-4b2c-8169-5891520048a8');
            assert.notEqual(snapshot, null);
        });

        it('Should delete snapshot', async () => {
            const result = await _uow.snapshots_repository.deleteSnapshotEntryById('e714e0ed-9e83-4421-8058-1232024c7e50');
            assert.equal(result, true);
        });

        it('Create and return new snapshot', async () => {

            const timestamp = moment().utc().toDate();

            const job_history = { 
                id: 'e714e0ed-9e83-4421-8058-1232024c7e50', 
                job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8', 
                start_date_time: timestamp,
                end_date_time: timestamp,
                schedule_date_time: timestamp,
                result: 3,
                source_message: 0,
                target_message: 1,
                source_result: 2,
                target_result: 3,
                port: 57495,
                createdAt: timestamp,
                updatedAt: timestamp
            };

            const snapshot = {
                job_history_id: 'e714e0ed-9e83-4421-8058-1232024c7e50',
                name: 'dev1@201711202149',
                source_host_id: 'd08a1f76-7c4a-4dd9-a377-83ffffa752f4',
                source_host_status: 1,
                target_host_id: '13e5fca8-4bb5-4f48-a91d-9c25df923ae8',
                target_host_status: 1,
                snapshot_date_time: '2017-11-20 21:49:42',
                job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
                createdAt: timestamp,
                updatedAt: timestamp
            }; 

            const result = await _uow.snapshots_repository.createSnapshotEntry(job_history, snapshot);
            assert.notEqual(result, null);
        });
    });
    
    //drop the database
    after(async () => {
        cp.execSync(`mysql -u ${connection.user} -p${connection.password} -h ${connection.host} -e "DROP DATABASE ${connection.database}";`, {stdio: [0,0,0]});
    });
});
