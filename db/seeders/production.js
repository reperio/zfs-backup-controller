'use strict';
const uuid = require('uuid/v4');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            const host_0_id = uuid();
            const host_1_id = uuid();
            const host_2_id = uuid();
            const host_3_id = uuid();
            const host_4_id = uuid();
            const host_5_id = uuid();
            const host_6_id = uuid();
            const host_7_id = uuid();
            const host_8_id = uuid();
            const host_9_id = uuid();
            const host_10_id = uuid();
            const host_11_id = uuid();
            const host_12_id = uuid();
            const host_13_id = uuid();
            const host_14_id = uuid();
            const host_15_id = uuid();
            const hostInsertQuery = await queryInterface.bulkInsert('hosts', [
                {id: host_0_id, name: 'headnode', ip_address: '172.20.33.7', sdc_id: '00000000-0000-0000-0000-0cc47a088bc8', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_1_id, name: 'bldg-a-quad01-a', ip_address: '172.20.33.44', sdc_id: '00000000-0000-0000-0000-0cc47a0542ee', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_2_id, name: 'bldg-a-quad01-b', ip_address: '172.20.33.47', sdc_id: '00000000-0000-0000-0000-0cc47a03ef76', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_3_id, name: 'bldg-a-quad01-c', ip_address: '172.20.33.50', sdc_id: '00000000-0000-0000-0000-0cc47a04015e', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_4_id, name: 'bldg-a-quad01-d', ip_address: '172.20.33.54', sdc_id: '00000000-0000-0000-0000-0cc47ac2138e', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_5_id, name: 'bldg-a-v2-01', ip_address: '172.20.33.63', sdc_id: '00000000-0000-0000-0000-ac1f6b05e326', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_6_id, name: 'bldg-b-quad-01-a', ip_address: '172.20.33.43', sdc_id: '00000000-0000-0000-0000-0cc47a0894ee', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_7_id, name: 'bldg-b-quad01-b', ip_address: '172.20.33.48', sdc_id: '00000000-0000-0000-0000-0cc47a0894f2', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_8_id, name: 'bldg-b-quad01-c', ip_address: '172.20.33.51', sdc_id: '00000000-0000-0000-0000-0cc47a03effe', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_9_id, name: 'bldg-b-quad01-d', ip_address: '172.20.33.57', sdc_id: '00000000-0000-0000-0000-0cc47ac213ac', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_10_id, name: 'bldg-c-quad01-b', ip_address: '172.20.33.46', sdc_id: '00000000-0000-0000-0000-0cc47a0894c8', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_11_id, name: 'bldg-c-quad01-c', ip_address: '172.20.33.49', sdc_id: '00000000-0000-0000-0000-0cc47a089402', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_12_id, name: 'bldg-c-quad01-d', ip_address: '172.20.33.52', sdc_id: '00000000-0000-0000-0000-0cc47a089444', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_13_id, name: 'bldg-c-v2-01', ip_address: '172.20.33.62', sdc_id: '00000000-0000-0000-0000-ac1f6b05d826', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_14_id, name: 'bldg-d-v2-01', ip_address: '172.20.33.61', sdc_id: '00000000-0000-0000-0000-ac1f6b05e5a6', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_15_id, name: 'zfs-backup-01', ip_address: '172.20.33.254', sdc_id: '', port: 3000, createdAt: new Date(), updatedAt: new Date()}
            ], {
                returning: true,
                transaction: transaction
            });

            const schedule_quarter_hourly_id = uuid();
            const schedule_hourly_id = uuid();
            const schedule_dialy_id = uuid();
            const schedule_weekly_id = uuid();
            const schedule_monthly_id = uuid();

            const scheduleInsertQuery = await queryInterface.bulkInsert("schedules", [
                {id: schedule_quarter_hourly_id, name: 'quarter_hour', display_name: 'Every 15 minutes', createdAt: new Date(),updatedAt: new Date()},
                {id: schedule_hourly_id, name: 'hourly', display_name: 'Hourly', createdAt: new Date(),updatedAt: new Date()},
                {id: schedule_dialy_id, name: 'daily', display_name: 'Daily', createdAt: new Date(),updatedAt: new Date()},
                {id: schedule_weekly_id, name: 'weekly', display_name: 'Weekly', createdAt: new Date(),updatedAt: new Date()},
                {id: schedule_monthly_id, name: 'monthly', display_name: 'Monthly', createdAt: new Date(),updatedAt: new Date()}
            ], {
                returning: true,
                transaction: transaction
            });

            const job_0_id = uuid();
            const job_1_id = uuid();
            const job_2_id = uuid();
            const job_3_id = uuid();

            const jobInsertQuery = await queryInterface.bulkInsert("jobs", [
                {
                    id: job_0_id,
                    schedule_id: schedule_quarter_hourly_id,
                    source_retention: '',
                    target_retention: '',
                    sdc_vm_id: '',
                    source_location: 'dev1',
                    target_location: 'dev1',
                    zfs_type: 1,
                    zfs_size: 5,
                    source_host_id: host_0_id,
                    target_host_id: host_1_id,
                    last_execution: null,
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ], {
                returning: true,
                transaction: transaction
            });

            transaction.commit();
        } catch (e) {
            console.log(e);
            transaction.rollback();
            throw e;
        }
    },

    down: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            await queryInterface.bulkDelete('job_history', null, { transaction: transaction });
            await queryInterface.bulkDelete('jobs', null, { transaction: transaction });
            await queryInterface.bulkDelete('schedules', null, { transaction: transaction });
            await queryInterface.bulkDelete('hosts', null, { transaction: transaction });
            transaction.commit();
        } catch (e) {
            transaction.rollback();
            throw e;
        }
        
    }
};