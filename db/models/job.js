'use strict';
const uuid = require('uuid/v4');
module.exports = function(sequelize, DataTypes) {
    const Job = sequelize.define('jobs', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        schedule_id: {type: DataTypes.UUID, allowNull: false},
        source_retention: {type: DataTypes.TEXT, allowNull: false},
        target_retention: {type: DataTypes.TEXT, allowNull: false},
        sdc_vm_id: {type: DataTypes.UUID, allowNull: false},
        source_location: {type: DataTypes.STRING, allowNull: false},
        target_location: {type: DataTypes.STRING, allowNull: false},
        zfs_type: {type: DataTypes.INTEGER, allowNull: false},
        zfs_size: {type: DataTypes.INTEGER, allowNull: false},
        source_host_id: {type: DataTypes.UUID, allowNull: false},
        target_host_id: {type: DataTypes.UUID, allowNull: false},
        last_execution: {type: DataTypes.DATE, allowNull: true},
        last_schedule: {type: DataTypes.DATE, allowNull: true},
        enabled: {type: DataTypes.BOOLEAN, allowNull: false}
    }, {
        tableName: "jobs",
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    Job.associate = function(models) {
        Job.belongsTo(models.hosts, {as: 'source_host', foreignKey: 'source_host_id'});
        Job.belongsTo(models.hosts, {as: 'target_host', foreignKey: 'target_host_id'});

        Job.belongsTo(models.schedules, {as: 'schedule', foreignKey: 'schedule_id'})
    };

    return Job;
};