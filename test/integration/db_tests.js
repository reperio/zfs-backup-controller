/* eslint-env  mocha */
/* eslint max-nested-callbacks: 0 */

process.env.NODE_ENV = 'test';

const _ = require('lodash');
const moment = require('moment');
const assert = require('assert');

const {knex} = require('../../db/connect.js');
const knex_config = require('../../db/knexfile').test;

const connection = knex.client.connectionSettings;

describe('DB Integration Tests', function () {
    const logging = false;
    
    const logger = {
        error: (message) => {
            if (logging) {
                console.log(message || '');
            }
        }, info: (message) => {
            if (logging) {
                console.log(message || '');
            }
        }, debug: (message) => {
            if (logging) {
                console.log(message || '');
            }
        }};

    //initialize uow
    const CreateUow = require('../../db')(logger);
    const _uow = CreateUow(logger);

    //set timeout
    this.timeout(45000);

    //set up the database
    before(async () => {
        //create the database
        const conn = {
            host: connection.host,
            user: connection.user,
            password: connection.password
        };
        
        // connect without database selected
        const knex_tmp = require('knex')({ client: 'mysql', connection: conn});
        
        await knex_tmp.raw(`CREATE DATABASE ${connection.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_520_ci;`);
        
        await knex_tmp.destroy();
        // //run migrations
        await knex.migrate.latest(knex_config);
        // console.log('migrate done');
        
        // //seed database
        await knex.seed.run(knex_config);
        // console.log('seed done');
    });

    describe('Jobs Repository', () => {
        it('Should return 1 job', async () => {
            const jobs = await _uow.jobs_repository.getAllJobs();
            assert.equal(jobs.length, 1);
        });

        it('Should return 1 unfinished jobs', async () => {
            const job_histories = await _uow.job_history_repository.getUnfinishedJobs();
            assert.equal(job_histories.length, 1);
        });

        //create job_history entry

        it('Should return a job history', async() => {
            const job_history = await _uow.job_history_repository.get_job_history_by_id('e714e0ed-9e83-4421-8058-1232024c7e50');
            assert.notEqual(job_history, null);
        });

        it('Should return a successful job_history', async()=>{
            const job_history = await _uow.job_history_repository.get_most_recent_successful_job_history('b21d3b67-4e78-4b2c-8169-5891520048a8');
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
                target_host_status: 5,
                snapshot_date_time: '2017-11-20 21:49:42',
                job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
                createdAt: timestamp,
                updatedAt: timestamp
            }; 

            const result = await _uow.snapshots_repository.createSnapshotEntry(job_history, snapshot);
            assert.notEqual(result, null);
        });
    });
    
    describe('Hosts Repository', async () => {
        it('Host workload details are calculated correctly', async () => {
            const workload = await _uow.hosts_repository.get_all_workload_details();
            // it doesn't matter which host we test because both of them are involved in the backup job
            assert.equal(workload[0].current_backup_jobs, 1);
        });

        it('Host "13e5fca8-4bb5-4f48-a91d-9c25df923ae8" should have one retention job running', async () => {
            const workloads = await _uow.hosts_repository.get_all_workload_details();
            console.log(workloads);
            const hostWorkload = _.find(workloads, workload => {
                return workload.id === '13e5fca8-4bb5-4f48-a91d-9c25df923ae8';
            });
            
            assert.equal(hostWorkload.current_retention_jobs, 1);
        });

        it('Host "d08a1f76-7c4a-4dd9-a377-83ffffa752f4" should have no retention jobs running', async () => {
            const workloads = await _uow.hosts_repository.get_all_workload_details();
            console.log(workloads);
            const hostWorkload = _.find(workloads, workload => {
                return workload.id === 'd08a1f76-7c4a-4dd9-a377-83ffffa752f4';
            });
            assert.equal(hostWorkload.current_retention_jobs, 0);
        });
    });

    //drop the database
    after(async () => {
        const conn = {
            host: connection.host,
            user: connection.user,
            password: connection.password
        };
        
        // connect without database selected
        const knex_tmp = require('knex')({ client: 'mysql', connection: conn});
        
        await knex_tmp.raw(`DROP DATABASE ${connection.database};`);
        await knex_tmp.destroy();
        await knex.destroy();
    });
});
