'use strict';
const uuid = require('uuid/v4');
module.exports = function(sequelize, DataTypes) {
    const Job = sequelize.define('jobs', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        name: {type: DataTypes.STRING, allowNull: true},
        offset: {type: DataTypes.INTEGER, allowNull: false, defaultValue: 0},
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
        tableName: 'jobs',
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    Job.associate = function(models) {
        Job.belongsTo(models.hosts, {as: 'source_host', foreignKey: 'source_host_id'});
        Job.belongsTo(models.hosts, {as: 'target_host', foreignKey: 'target_host_id'});

        Job.belongsTo(models.schedules, {as: 'schedule', foreignKey: 'schedule_id'});
    };

    return Job;
};


// INSERT INTO jobs (id, 
//     schedule_id, 
//     source_retention, 
//     target_retention, 
//     sdc_vm_id, 
//     source_location, 
//     target_location, 
//     zfs_type, 
//     zfs_size, 
//     source_host_id, 
//     target_host_id, 
//     last_execution, 
//     last_schedule, 
//     enabled, 
//     createdAt, 
//     updatedAt)
//     VALUES
//     ('31ec47f2-ce13-11e7-8edf-9779b1343835'
//     , '1f457bce-3f69-4e5f-8036-dae0fd5ec1b3'
//     , '{"retentions":[{"interval":"daily","retention":0}]}'
//     , '{"retentions":[{"interval":"daily","retention":7},{"interval":"weekly","retention":4},{"interval":"monthly","retention":12}]}'
//     , 'def34304-65f2-4f44-af0a-fe0544816f67'
//     , 'zones/def34304-65f2-4f44-af0a-fe0544816f67'
//     , 'zones/def34304-65f2-4f44-af0a-fe0544816f67'
//     , 'filesystem'
//     , '25G'
//     , '074ea651-4f3e-4aeb-9366-a2436f043bff'
//     , 'fb458c8f-ab41-4368-8f8d-1bbf14466ae9'
//     , ''
//     , ''
//     , 1
//     , '2017-11-20 16:41:02'
//     , '2017-11-20 16:41:02');

//source = headnode, target = zfs-backup-01 schedule = daily, offset = 3