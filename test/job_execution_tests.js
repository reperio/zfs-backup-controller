/* eslint-env  mocha */
/* eslint max-nested-callbacks: 0 */

const assert = require('assert');
const fs = require('fs');
const JobManager = require('../jobs/job_manager');
const moment = require('moment');
const _ = require('lodash');
const sinon = require('sinon');

describe('Job Manager', () => {
    //load the test data
    this.test_data = JSON.parse(fs.readFileSync('./test/testing_data/test_data_no_errors.json', 'utf8'));

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

    describe('Job Selection', () => {
        it('test', () => {
            const time = moment('2017-11-25 00:30:00').valueOf();
            sinon.useFakeTimers({now: time});

            const jobs = [
                {
                    schedule: {name: 'daily'},
                    last_schedule: moment('2017-11-25 12:30:00').startOf('day').subtract(1, 'day'),
                    offset: 0
                },
                {
                    schedule: {name: 'daily'},
                    last_schedule: moment('2017-11-25 12:30:00').startOf('day').subtract(1, 'day').add(49, 'minutes'),
                    offset: 49
                },
                {
                    schedule: {name: 'daily'},
                    last_schedule: moment('2017-11-25 12:30:00').startOf('day').subtract(1, 'day').add(30, 'minutes'),
                    offset: 30
                }
            ];

            const filtered_jobs = job_manager.filter_eligible_jobs(jobs);

            assert.equal(filtered_jobs.length, 2);
        });
    });

    describe('Daily Schedules', () => {
        it('Should NOT execute job if last schedule and current schedule are the same', () => {
            const last_schedule = moment().startOf('day');

            const test_job = {
                schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 0
            };

            assert(!job_manager.should_job_execute(test_job));
        });

        it('Should execute job if last schedule was yesterday', () => {
            const last_schedule = moment().startOf('day').subtract(1, 'day');

            const test_job = {
                schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 0
            };

            assert(job_manager.should_job_execute(test_job));
        });

        it('Should NOT execute job if last schedule was today at the offset', () => {
            const last_schedule = moment().startOf('day').add(30, 'minutes');

            const test_job = {
                schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 30
            };

            assert(!job_manager.should_job_execute(test_job));
        });

        it('Should execute job if last schedule was today before the offset', () => {
            const last_schedule = moment().startOf('day').add(10, 'minutes');

            const test_job = {
                schedule: {name: 'daily'},
                last_schedule: last_schedule,
                offset: 30
            };

            assert(job_manager.should_job_execute(test_job));
        });
    });
});
