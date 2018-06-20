/* eslint-env  mocha */
/* eslint max-nested-callbacks: 0 */
process.env.NODE_ENV = 'test';

const _ = require('lodash');
const assert = require('assert');
const RetentionManager = require('../../retention/retention_manager.js');

const {knex} = require('../../db/connect.js');
const knex_config = require('../../db/knexfile').test;

const connection = knex.client.connectionSettings;

const handlers = require('../../api/handlers/zfs_controller').handlers;

describe('Retention Manager Tests', async function () {
    this.timeout(45000);
    const logging = false;

    const logger = {
        info: (message) => {
            if (logging) {
                console.log(message || '');
            }
        }, debug: (message) => {
            if (logging) {
                console.log(message || '');
            }
        }, warn: (message) => {
            if (logging) {
                console.log(message || '');
            }
        }, error: (message) => {
            console.error(message || '');
        }};

    const agentApi = {
        zfs_destroy_snapshot: async function (snapshot, host) {
            return true;
        }
    };

    const CreateUow = require('../../db')(logger);
    const uow = CreateUow(logger);
    const retentionTestClass = new RetentionManager(logger, uow, agentApi, 1000);

    const fakeRequest = {
        app: {
            getNewUoW: async () => {
                return CreateUow(logger);
            }
        },
        server: {
            app: {
                logger: logger
            }
        }
    };

    const fakeReply = () => {
        return true;
    };

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

    it('delete_snapshot function should set snapshot source host status to deleting', async () => {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        await retentionTestClass.delete_snapshot('b21d3b67-4e78-4b2c-8169-5891520048a8', snapshot, snapshot.source_host_id);
        const updatedSnapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        assert.equal(updatedSnapshot.source_host_status, 5);
    });

    it('delete_snapshot function should set snapshot target host status to deleting', async () => {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        await retentionTestClass.delete_snapshot('b21d3b67-4e78-4b2c-8169-5891520048a8', snapshot, snapshot.target_host_id);
        const updatedSnapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        assert.equal(updatedSnapshot.target_host_status, 5);
    });

    it('delete_snapshot function does not change source status when deleting target snapshot', async () => {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        await retentionTestClass.delete_snapshot('b21d3b67-4e78-4b2c-8169-5891520048a8', snapshot, snapshot.target_host_id);
        const updatedSnapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        assert.equal(updatedSnapshot.source_host_status, snapshot.source_host_status);
    });

    it('destroy_complete function can correctly set the value of source snapshot status to deleted', async () => {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        const req = Object.assign({}, fakeRequest);
        req.payload ={
            job_history_id: 'e714e0ed-9e83-4421-8058-1232024c7e50',
            code: 2,
            host_id: snapshot.source_host_id
        };
        await handlers.destroy_complete(req, fakeReply);
        const updatedSnapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        assert.equal(updatedSnapshot.source_host_status, 2);
    });

    it('destroy_complete function can correctly set the value of source snapshot status to destroy_failed', async () => {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        const req = Object.assign({}, fakeRequest);
        req.payload ={
            job_history_id: 'e714e0ed-9e83-4421-8058-1232024c7e50',
            code: 3,
            host_id: snapshot.source_host_id
        };
        await handlers.destroy_complete(req, fakeReply);
        const updatedSnapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        assert.equal(updatedSnapshot.source_host_status, 3);
    });

    it('destroy_complete function can correctly set the value of target snapshot status to deleted', async () => {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        const req = Object.assign({}, fakeRequest);
        req.payload ={
            job_history_id: 'e714e0ed-9e83-4421-8058-1232024c7e50',
            code: 2,
            host_id: snapshot.target_host_id
        };
        await handlers.destroy_complete(req, fakeReply);
        const updatedSnapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        assert.equal(updatedSnapshot.target_host_status, 2);
    });

    it('destroy_complete function can correctly set the value of target snapshot status to destroy_failed', async () => {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        const req = Object.assign({}, fakeRequest);
        req.payload ={
            job_history_id: 'e714e0ed-9e83-4421-8058-1232024c7e50',
            code: 3,
            host_id: snapshot.target_host_id
        };
        await handlers.destroy_complete(req, fakeReply);
        const updatedSnapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        assert.equal(updatedSnapshot.target_host_status, 3);
    });

    it('retention job will not be fired on host that does not have space', async () => {
        const job = await uow.jobs_repository.get_job_by_id('b21d3b67-4e78-4b2c-8169-5891520048a8');
        const workloads = await uow.hosts_repository.get_all_workload_details();
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e51');
        const host_workload = _.find(workloads, workload => {
            return snapshot.source_host_id === workload.id;
        });
        host_workload.current_retention_jobs = host_workload.max_retention_jobs;
        assert.equal(host_workload.current_retention_jobs, host_workload.max_retention_jobs);
        const result = await retentionTestClass.process_snapshot(job, snapshot, workloads, true);
        assert.equal(result, false);
    });

    it('workload is correctly incremented when firing off retention jobs', async () => {
        const job = await uow.jobs_repository.get_job_by_id('b21d3b67-4e78-4b2c-8169-5891520048a8');
        const workloads = await uow.hosts_repository.get_all_workload_details();
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e51');
        const host_workload = _.find(workloads, workload => {
            return snapshot.source_host_id === workload.id;
        });
        await retentionTestClass.process_snapshot(job, snapshot, workloads, true);
        assert.equal(host_workload.current_retention_jobs, 1);
    });

    it('retention job will not be fired for previously deleted or in progress snapshot', async () => {
        const job = await uow.jobs_repository.get_job_by_id('b21d3b67-4e78-4b2c-8169-5891520048a8');
        const workloads = await uow.hosts_repository.get_all_workload_details();
        const snapshot = await uow.snapshots_repository.get_by_job_history_id('e714e0ed-9e83-4421-8058-1232024c7e50');
        const host_workload = _.find(workloads, workload => {
            return snapshot.source_host_id === workload.id;
        });
        const old_current_retention_jobs = host_workload.current_retention_jobs;
        const result = await retentionTestClass.process_snapshot(job, snapshot, workloads, false);
        assert.equal(result, true);
        assert.equal(host_workload.current_retention_jobs, old_current_retention_jobs);
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
