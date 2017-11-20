'use strict';
const uuid = require('uuid/v4');

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const transaction = await queryInterface.sequelize.transaction();
        try {
            const host_0_id = uuid();
            const host_1_id = uuid();
            const hostInsertQuery = await queryInterface.bulkInsert('hosts', [
                {id: host_0_id, sdc_id: '', ip_address: '192.168.156.161', port: 3000, createdAt: new Date(), updatedAt: new Date()},
                {id: host_1_id, sdc_id: '', ip_address: '192.168.156.162', port: 3000, createdAt: new Date(), updatedAt: new Date()}
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