/* eslint-env  mocha */
/* eslint max-nested-callbacks: 0 */

const assert = require('assert');
const fs = require('fs');
const RetentionManager = require('../retention/retention_manager.js');
const moment = require('moment');
const _ = require('lodash');

describe('Retention Tests', async function() {
    //load the test data
    this.test_data = JSON.parse(fs.readFileSync('./test/testing_data/test_data_no_errors.json', 'utf8'));

    const retentionTestClass = new RetentionManager();

    describe('Search Start Date Tests', () => {
        describe('15 Minute Intervals', () => {
            describe('Retention level: 1', () => {
                let minuteTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-09 14:45'
                    }, {
                        givenDate: '2017-11-09 14:45',
                        expectedDate: '2017-11-09 14:45'
                    }, {
                        givenDate: '2017-11-09 14:44',
                        expectedDate: '2017-11-09 14:30'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-09 14:30'
                    }, {
                        givenDate: '2017-11-09 00:13',
                        expectedDate: '2017-11-09 00:00'
                    }
                ];

                for (let i = 0; i < minuteTests.length; i++) {
                    it(`(${minuteTests[i].givenDate}) should start searching for first snapshot at (${minuteTests[i].expectedDate})`, () => {
                        let expected = moment(minuteTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfQuarterHour(moment(minuteTests[i].givenDate), 0);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 2', () => {
                let minuteTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-09 14:30'
                    }, {
                        givenDate: '2017-11-09 14:45',
                        expectedDate: '2017-11-09 14:30'
                    }, {
                        givenDate: '2017-11-09 14:44',
                        expectedDate: '2017-11-09 14:15'
                    }, {
                        givenDate: '2017-11-09 14:12',
                        expectedDate: '2017-11-09 13:45'
                    }, {
                        givenDate: '2017-11-09 00:13',
                        expectedDate: '2017-11-08 23:45'
                    }
                ];

                for (let i = 0; i < minuteTests.length; i++) {
                    it(`(${minuteTests[i].givenDate}) should start searching for first snapshot at (${minuteTests[i].expectedDate})`, () => {
                        let expected = moment(minuteTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfQuarterHour(moment(minuteTests[i].givenDate), 1);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 3', () => {
                let minuteTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-09 14:15'
                    }, {
                        givenDate: '2017-11-09 14:45',
                        expectedDate: '2017-11-09 14:15'
                    }, {
                        givenDate: '2017-11-09 14:44',
                        expectedDate: '2017-11-09 14:00'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-09 14:00'
                    }, {
                        givenDate: '2017-11-09 00:13',
                        expectedDate: '2017-11-08 23:30'
                    }
                ];

                for (let i = 0; i < minuteTests.length; i++) {
                    it(`(${minuteTests[i].givenDate}) should start searching for first snapshot at (${minuteTests[i].expectedDate})`, () => {
                        let expected = moment(minuteTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfQuarterHour(moment(minuteTests[i].givenDate), 2);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });
        });

        describe('Hourly Intervals', () => {
            describe('Retention level: 1', () => {
                let hourTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-09 14:00'
                    }, {
                        givenDate: '2017-11-09 14:47',
                        expectedDate: '2017-11-09 14:00'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-09 14:00'
                    }, {
                        givenDate: '2017-11-09 14:23',
                        expectedDate: '2017-11-09 14:00'
                    }, {
                        givenDate: '2017-11-09 14:15',
                        expectedDate: '2017-11-09 14:00'
                    }
                ];

                for (let i = 0; i < hourTests.length; i++) {
                    it(`(${hourTests[i].givenDate}) should start searching for first snapshot at (${hourTests[i].expectedDate})`, () => {
                        let expected = moment(hourTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfHour(moment(hourTests[i].givenDate), 0);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 2', () => {
                let hourTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-09 13:00'
                    }, {
                        givenDate: '2017-11-09 14:47',
                        expectedDate: '2017-11-09 13:00'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-09 13:00'
                    }, {
                        givenDate: '2017-11-09 14:23',
                        expectedDate: '2017-11-09 13:00'
                    }, {
                        givenDate: '2017-11-09 00:15',
                        expectedDate: '2017-11-08 23:00'
                    }
                ];

                for (let i = 0; i < hourTests.length; i++) {
                    it(`(${hourTests[i].givenDate}) should start searching for first snapshot at (${hourTests[i].expectedDate})`, () => {
                        let expected = moment(hourTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfHour(moment(hourTests[i].givenDate), 1);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 3', () => {
                let hourTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-09 12:00'
                    }, {
                        givenDate: '2017-11-09 14:47',
                        expectedDate: '2017-11-09 12:00'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-09 12:00'
                    }, {
                        givenDate: '2017-11-09 14:23',
                        expectedDate: '2017-11-09 12:00'
                    }, {
                        givenDate: '2017-11-09 00:15',
                        expectedDate: '2017-11-08 22:00'
                    }
                ];

                for (let i = 0; i < hourTests.length; i++) {
                    it(`(${hourTests[i].givenDate}) should start searching for first snapshot at (${hourTests[i].expectedDate})`, () => {
                        let expected = moment(hourTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfHour(moment(hourTests[i].givenDate), 2);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });
        });

        describe('Daily Intervals', () => {
            describe('Retention level: 1', () => {
                let dayTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-09 00:00'
                    }, {
                        givenDate: '2017-11-09 14:47',
                        expectedDate: '2017-11-09 00:00'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-09 00:00'
                    }, {
                        givenDate: '2017-11-09 14:23',
                        expectedDate: '2017-11-09 00:00'
                    }, {
                        givenDate: '2017-11-01 14:15',
                        expectedDate: '2017-11-01 00:00'
                    }
                ];

                for (let i = 0; i < dayTests.length; i++) {
                    it(`(${dayTests[i].givenDate}) should start searching for first snapshot at (${dayTests[i].expectedDate})`, () => {
                        let expected = moment(dayTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfDay(moment(dayTests[i].givenDate), 0);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 2', () => {
                let dayTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-08 00:00'
                    }, {
                        givenDate: '2017-11-09 14:47',
                        expectedDate: '2017-11-08 00:00'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-08 00:00'
                    }, {
                        givenDate: '2017-11-08 00:00',
                        expectedDate: '2017-11-07 00:00'
                    }, {
                        givenDate: '2017-11-01 00:15',
                        expectedDate: '2017-10-31 00:00'
                    }
                ];

                for (let i = 0; i < dayTests.length; i++) {
                    it(`(${dayTests[i].givenDate}) should start searching for first snapshot at (${dayTests[i].expectedDate})`, () => {
                        let expected = moment(dayTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfDay(moment(dayTests[i].givenDate), 1);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 3', () => {
                let dayTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-07 00:00'
                    }, {
                        givenDate: '2017-11-09 14:47',
                        expectedDate: '2017-11-07 00:00'
                    }, {
                        givenDate: '2017-11-09 14:34',
                        expectedDate: '2017-11-07 00:00'
                    }, {
                        givenDate: '2017-11-09 00:00',
                        expectedDate: '2017-11-07 00:00'
                    }, {
                        givenDate: '2017-11-01 00:15',
                        expectedDate: '2017-10-30 00:00'
                    }
                ];

                for (let i = 0; i < dayTests.length; i++) {
                    it(`(${dayTests[i].givenDate}) should start searching for first snapshot at (${dayTests[i].expectedDate})`, () => {
                        let expected = moment(dayTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfDay(moment(dayTests[i].givenDate), 2);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });
        });

        describe('Weekly Intervals', () => {
            describe('Retention level: 1', () => {
                let weekTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-11-05 00:00'
                    }, {
                        givenDate: '2017-11-10 14:47',
                        expectedDate: '2017-11-05 00:00'
                    }, {
                        givenDate: '2017-11-06 14:34',
                        expectedDate: '2017-11-05 00:00'
                    }, {
                        givenDate: '2017-11-05 14:23',
                        expectedDate: '2017-11-05 00:00'
                    }, {
                        givenDate: '2017-11-01 14:15',
                        expectedDate: '2017-10-29 00:00'
                    }
                ];

                for (let i = 0; i < weekTests.length; i++) {
                    it(`(${weekTests[i].givenDate}) should start searching for first snapshot at (${weekTests[i].expectedDate})`, () => {
                        let expected = moment(weekTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfWeek(moment(weekTests[i].givenDate), 0);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 2', () => {
                let weekTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-10-29 00:00'
                    }, {
                        givenDate: '2017-11-10 14:47',
                        expectedDate: '2017-10-29 00:00'
                    }, {
                        givenDate: '2017-11-06 14:34',
                        expectedDate: '2017-10-29 00:00'
                    }, {
                        givenDate: '2017-11-05 14:23',
                        expectedDate: '2017-10-29 00:00'
                    }, {
                        givenDate: '2017-11-01 14:15',
                        expectedDate: '2017-10-22 00:00'
                    }
                ];

                for (let i = 0; i < weekTests.length; i++) {
                    it(`(${weekTests[i].givenDate}) should start searching for first snapshot at (${weekTests[i].expectedDate})`, () => {
                        let expected = moment(weekTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfWeek(moment(weekTests[i].givenDate), 1);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 3', () => {
                let weekTests = [
                    {
                        givenDate: '2017-11-09 14:54',
                        expectedDate: '2017-10-22 00:00'
                    }, {
                        givenDate: '2017-11-10 14:47',
                        expectedDate: '2017-10-22 00:00'
                    }, {
                        givenDate: '2017-11-06 14:34',
                        expectedDate: '2017-10-22 00:00'
                    }, {
                        givenDate: '2017-11-05 14:23',
                        expectedDate: '2017-10-22 00:00'
                    }, {
                        givenDate: '2017-11-01 14:15',
                        expectedDate: '2017-10-15 00:00'
                    }
                ];

                for (let i = 0; i < weekTests.length; i++) {
                    it(`(${weekTests[i].givenDate}) should start searching for first snapshot at (${weekTests[i].expectedDate})`, () => {
                        let expected = moment(weekTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfWeek(moment(weekTests[i].givenDate), 2);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });
        });

        describe('Monthly Intervals', () => {
            describe('Retention level: 1', () => {
                let monthTests = [
                    {
                        givenDate: '2017-11-15 14:54',
                        expectedDate: '2017-11-01 00:00'
                    }, {
                        givenDate: '2017-11-18 14:47',
                        expectedDate: '2017-11-01 00:00'
                    }, {
                        givenDate: '2017-11-30 23:59',
                        expectedDate: '2017-11-01 00:00'
                    }, {
                        givenDate: '2017-11-02 14:23',
                        expectedDate: '2017-11-01 00:00'
                    }, {
                        givenDate: '2017-01-01 00:00',
                        expectedDate: '2017-01-01 00:00'
                    }
                ];

                for (let i = 0; i < monthTests.length; i++) {
                    it(`(${monthTests[i].givenDate}) should start searching for first snapshot at (${monthTests[i].expectedDate})`, () => {
                        let expected = moment(monthTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfMonth(moment(monthTests[i].givenDate), 0);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 2', () => {
                let monthTests = [
                    {
                        givenDate: '2017-11-15 14:54',
                        expectedDate: '2017-10-01 00:00'
                    }, {
                        givenDate: '2017-11-18 14:47',
                        expectedDate: '2017-10-01 00:00'
                    }, {
                        givenDate: '2017-11-30 23:59',
                        expectedDate: '2017-10-01 00:00'
                    }, {
                        givenDate: '2017-11-02 14:23',
                        expectedDate: '2017-10-01 00:00'
                    }, {
                        givenDate: '2017-01-01 00:00',
                        expectedDate: '2016-12-01 00:00'
                    }
                ];

                for (let i = 0; i < monthTests.length; i++) {
                    it(`(${monthTests[i].givenDate}) should start searching for first snapshot at (${monthTests[i].expectedDate})`, () => {
                        let expected = moment(monthTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfMonth(moment(monthTests[i].givenDate), 1);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });

            describe('Retention level: 3', () => {
                let monthTests = [
                    {
                        givenDate: '2017-11-15 14:54',
                        expectedDate: '2017-09-01 00:00'
                    }, {
                        givenDate: '2017-11-18 14:47',
                        expectedDate: '2017-09-01 00:00'
                    }, {
                        givenDate: '2017-11-30 23:59',
                        expectedDate: '2017-09-01 00:00'
                    }, {
                        givenDate: '2017-11-02 14:23',
                        expectedDate: '2017-09-01 00:00'
                    }, {
                        givenDate: '2017-01-01 00:00',
                        expectedDate: '2016-11-01 00:00'
                    }
                ];

                for (let i = 0; i < monthTests.length; i++) {
                    it(`(${monthTests[i].givenDate}) should start searching for first snapshot at (${monthTests[i].expectedDate})`, () => {
                        let expected = moment(monthTests[i].expectedDate);
                        let actual = retentionTestClass.getStartOfMonth(moment(monthTests[i].givenDate), 2);
                        assert.equal(expected.valueOf(), actual.valueOf(), `${expected} != ${actual}`);
                    });
                }
            });
        });
    });


    describe('Find first snapshot tests', () => {
        let firstSnapshotTests = [
            {
                startDate: '2017-09-01 04:00',
                expectedId: 'd96b555a-fcb2-4ff0-a917-155b5fcb18eb'
            }
        ];

        //let sortedData = retentionTestClass.sortSnapshots(this.test_data);

        for (let i = 0; i < firstSnapshotTests.length; i++) {
            it(`Looking for first snapshot after (${firstSnapshotTests[i].startDate}), should have id (${firstSnapshotTests[i].expectedId})`, () => {
                const snapshot = retentionTestClass.getFirstSnapshotAfterDate(this.test_data, moment.utc(firstSnapshotTests[i].startDate));
                
                assert.equal(firstSnapshotTests[i].expectedId, snapshot.job_history_id);
            });
        }
    });

    describe('Full Retention Tests', () => {
        let snapshots = [];

        const retention_policy_1 = {
            retentions: [
                {
                    interval: 'quarter_hourly',
                    retention: 1
                },
                {
                    interval: 'hourly',
                    retention: 1
                },
                {
                    interval: 'daily',
                    retention: 1
                },
                {
                    interval: 'weekly',
                    retention: 1
                },
                {
                    interval: 'monthly',
                    retention: 1
                }
            ]
        };

        const retention_policy_2 = {
            retentions: [
                {
                    interval: 'quarter_hourly',
                    retention: 2
                },
                {
                    interval: 'hourly',
                    retention: 2
                },
                {
                    interval: 'daily',
                    retention: 2
                },
                {
                    interval: 'weekly',
                    retention: 2
                },
                {
                    interval: 'monthly',
                    retention: 2
                }
            ]
        };

        beforeEach(() => {
            snapshots = _.cloneDeep(this.test_data);
        });

        it('Should keep 8 for retention policy 1 at 2017-11-19T03:20:00.000Z', () => {
            const snapshots_to_delete = retentionTestClass.get_snapshots_to_delete(snapshots, retention_policy_1, 0, moment.utc('2017-11-19T03:20:00.000Z'));
            assert.equal(snapshots_to_delete.length, 9992);
        });

        it('Should keep 9 for retention policy 1 at 2017-11-19T03:40:00.000Z', () => {
            const snapshots_to_delete = retentionTestClass.get_snapshots_to_delete(snapshots, retention_policy_1, 0, moment.utc('2017-11-19T03:40:00.000Z'));
            //console.log(snapshots_to_delete.length);
            assert.equal(snapshots_to_delete.length, 9991);
        });

        it('Should keep 10 for retention policy 1 at 2017-11-21T03:40:00.000Z', () => {
            const snapshots_to_delete = retentionTestClass.get_snapshots_to_delete(snapshots, retention_policy_1, 0, moment.utc('2017-11-21T03:40:00.000Z'));
            //console.log(snapshots_to_delete.length);
            assert.equal(snapshots_to_delete.length, 9990);
        });

        it('Should keep 13 for retention policy 2 at 2017-11-19T03:20:00.000Z', () => {
            const snapshots_to_delete = retentionTestClass.get_snapshots_to_delete(snapshots, retention_policy_2, 0, moment.utc('2017-11-19T03:20:00.000Z'));
            assert.equal(snapshots_to_delete.length, 9987);
        });

        it('Should keep 13 for retention policy 2 at 2017-11-19T03:40:00.000Z', () => {
            const snapshots_to_delete = retentionTestClass.get_snapshots_to_delete(snapshots, retention_policy_2, 0, moment.utc('2017-11-19T03:40:00.000Z'));
            //console.log(snapshots_to_delete.length);
            assert.equal(snapshots_to_delete.length, 9987);
        });

        it('Should keep 13 for retention policy 2 at 2017-11-21T03:40:00.000Z', () => {
            const snapshots_to_delete = retentionTestClass.get_snapshots_to_delete(snapshots, retention_policy_2, 0, moment.utc('2017-11-21T03:40:00.000Z'));
            //console.log(snapshots_to_delete.length);
            assert.equal(snapshots_to_delete.length, 9987);
        });
    });

    describe('Retention tests with offset', () => {
        const retention_policy_1 = {
            retentions: [
                {
                    interval: 'quarter_hourly',
                    retention: 3
                }
            ]
        };
        let snapshots = [];

        beforeEach(() => {
            snapshots = [{
                job_history_id: '23bbe480-ce20-4eec-b46b-deaaf8e4ff2f',
                name: '201709010000',
                host_id: 0,
                snapshot_date_time: '2017-11-21T05:50:00.000Z'
            }, {
                job_history_id: '23bbe480-ce20-4eec-b46b-deaaf8e4ff2f',
                name: '201709010000',
                host_id: 0,
                snapshot_date_time: '2017-11-21T05:35:00.000Z'
            }, {
                job_history_id: '23bbe480-ce20-4eec-b46b-deaaf8e4ff2f',
                name: '201709010000',
                host_id: 0,
                snapshot_date_time: '2017-11-21T06:05:00.000Z'
            }, {
                job_history_id: '0887f6a5-fcfa-41cf-9185-526d5b9f87f6',
                name: '201709010015',
                host_id: 0,
                snapshot_date_time: '2017-11-21T06:20:00.000Z'
            }, {
                job_history_id: '7089472f-5bc0-489f-b462-96c7beebaab0',
                name: '201709010030',
                host_id: 0,
                snapshot_date_time: '2017-11-21T06:35:00.000Z'
            }, {
                job_history_id: 'cc705b49-3311-47a8-a4c4-17a9814e68ce',
                name: '201709010045',
                host_id: 0,
                snapshot_date_time: '2017-11-21T06:50:00.000Z'
            }];
        });

        it('Should keep 4 for retention policy 1 at 2017-11-21T05:51:00.000Z with offset 5', () => {
            const snapshots_to_delete = retentionTestClass.get_snapshots_to_delete(snapshots, retention_policy_1, 5, moment.utc('2017-11-21T06:51:00.000Z'));
            console.log(snapshots_to_delete);
            assert.equal(snapshots_to_delete.length, 2);
        });
    });
});
