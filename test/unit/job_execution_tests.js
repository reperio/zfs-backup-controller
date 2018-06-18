/* eslint-env  mocha */
/* eslint max-nested-callbacks: 0 */

const assert = require('assert');
const fs = require('fs');
const JobManager = require('../../jobs/job_manager');
const moment = require('moment');
const _ = require('lodash');
const sinon = require('sinon');

describe('Job Manager', () => {
    //load the test data
    this.test_data = JSON.parse(fs.readFileSync('./test/unit/testing_data/test_data_no_errors.json', 'utf8'));

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
        }};

    const job_manager = new JobManager(logger);

    // describe('Job Selection', () => {
    //     const time = moment('2017-11-25 00:30:00').valueOf();
    //     let clock = null;

    //     beforeEach(() => {
    //         clock = sinon.useFakeTimers({now: time});
    //     });

    //     it('Should filter jobs correctly with offsets', () => {
    //         const jobs = [
    //             {
    //                 job_schedule: {name: 'daily'},
    //                 last_schedule: moment().startOf('day').subtract(1, 'day'),
    //                 offset: 0
    //             },
    //             {
    //                 job_schedule: {name: 'daily'},
    //                 last_schedule: moment().startOf('day').subtract(1, 'day').add(49, 'minutes'),
    //                 offset: 49
    //             },
    //             {
    //                 job_schedule: {name: 'daily'},
    //                 last_schedule: moment().startOf('day').subtract(1, 'day').add(30, 'minutes'),
    //                 offset: 30
    //             }
    //         ];

    //         const filtered_jobs = job_manager.filter_eligible_jobs(jobs);

    //         assert.equal(filtered_jobs.length, 2);
    //     });

    //     afterEach(() => {
    //         clock.restore();
    //     });
    // });

    describe('Daily Schedules', () => {
        it('Should NOT execute job if last schedule and current schedule are the same', () => {
            const last_schedule = moment().startOf('day');

            const test_job = {
                job_schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 0
            };

            assert(!job_manager.should_job_execute(test_job));
        });

        it('Should execute job if last schedule was yesterday', () => {
            const last_schedule = moment().startOf('day').subtract(1, 'day');

            const test_job = {
                job_schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 0
            };

            assert(job_manager.should_job_execute(test_job));
        });

        it('Should NOT execute job if last schedule was today at the offset', () => {
            const last_schedule = moment().startOf('day').add(30, 'minutes');

            const test_job = {
                job_schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 30
            };

            assert(!job_manager.should_job_execute(test_job));
        });

        it('Should execute job if last schedule was today before the offset', () => {
            const last_schedule = moment().startOf('day').add(10, 'minutes');

            const test_job = {
                job_schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 30
            };

            assert(job_manager.should_job_execute(test_job));
        });
    });

    describe('Max jobs', () => {
        it('current_backup_jobs is incremented correctly', async () => {
            const workload = [
                {
                    id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    name: 'source_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 1,
                    max_retention_jobs: 1,
                    current_backup_jobs: 0,
                    current_retention_jobs: 0
                }, {
                    id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    name: 'target_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 1,
                    max_retention_jobs: 1,
                    current_backup_jobs: 0,
                    current_retention_jobs: 0
                }
            ];

            const jobs = [
                {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }
            ];

            await job_manager.filterJobsByWorkload(jobs, workload);

            assert.equal(workload[0].current_backup_jobs, 1);
        });

        it('Should only execute 1 job', async () => {
            const workload = [
                {
                    id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    name: 'source_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 1,
                    max_retention_jobs: 1,
                    current_backup_jobs: 0,
                    current_retention_jobs: 0
                }, {
                    id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    name: 'target_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 1,
                    max_retention_jobs: 1,
                    current_backup_jobs: 0,
                    current_retention_jobs: 0
                }
            ];

            const jobs = [
                {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }, {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a9',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }, {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a0',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }
            ];

            const jobs_to_execute = await job_manager.filterJobsByWorkload(jobs, workload);

            assert.equal(jobs_to_execute.length, 1);
        });

        it('Should NOT execute a job', async () => {
            const workload = [
                {
                    id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    name: 'source_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 1,
                    max_retention_jobs: 1,
                    current_backup_jobs: 0,
                    current_retention_jobs: 0
                }, {
                    id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    name: 'target_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 1,
                    max_retention_jobs: 1,
                    current_backup_jobs: 1,
                    current_retention_jobs: 0
                }
            ];

            const jobs = [
                {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }, {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a9',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }, {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a0',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }
            ];

            const jobs_to_execute = await job_manager.filterJobsByWorkload(jobs, workload);

            assert.equal(jobs_to_execute.length, 0);
        });

        it('Should execute 2 jobs', async () => {
            const workload = [
                {
                    id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    name: 'source_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 2,
                    max_retention_jobs: 1,
                    current_backup_jobs: 0,
                    current_retention_jobs: 0
                }, {
                    id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    name: 'target_host',
                    max_total_jobs: 2,
                    max_backup_jobs: 2,
                    max_retention_jobs: 1,
                    current_backup_jobs: 0,
                    current_retention_jobs: 0
                }
            ];

            const jobs = [
                {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }, {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a9',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }, {
                    id: 'b21d3b67-4e78-4b2c-8169-5891520048a0',
                    name: '',
                    offset: 0,
                    schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_size: 5,
                    source_host_id: '0151a683-00ea-40c7-9286-b68db2605c08',
                    target_host_id: '0151a683-00ea-40c7-9286-b68db2605c09',
                    source_retention: '',
                    target_retention: '',
                    last_execution: moment().utc().toDate(),
                    last_schedule: moment().utc().toDate(),
                    enabled: 1,
                    createdAt: moment().utc().toDate(),
                    updatedAt: moment().utc().toDate()
                }
            ];

            const jobs_to_execute = await job_manager.filterJobsByWorkload(jobs, workload);

            assert.equal(jobs_to_execute.length, 2);
        });
    });
});
