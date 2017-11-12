'use strict';
const uuid = require('uuid/v4');
module.exports = function(sequelize, DataTypes) {
    const JobHistory = sequelize.define('job_history', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        job_id: {type: DataTypes.UUID, allowNull: false},
        start_date_time: {type: DataTypes.DATE, allowNull: false},
        end_date_time: {type: DataTypes.DATE, allowNull: true},
        schedule_date_time: {type: DataTypes.DATE, allowNull: true},
        result: {type: DataTypes.INTEGER, allowNull: false},
        source_message: {type: DataTypes.TEXT, allowNull: true},
        target_message: {type: DataTypes.TEXT, allowNull: true},
        source_result: {type: DataTypes.INTEGER, allowNull: false},
        target_result: {type: DataTypes.INTEGER, allowNull: false},
        port: {type: DataTypes.INTEGER, allowNull: false}
    }, {
        tableName: "job_history",
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    JobHistory.associate = function(models) {
        JobHistory.belongsTo(models.jobs, {as: 'job', foreignKey: 'job_id'})
    };

    return JobHistory;
};