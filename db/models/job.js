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
// name, 
// offset, 
// schedule_id, 
// source_retention, 
// target_retention, 
// sdc_vm_id, 
// source_location, 
// target_location, 
// zfs_type, 
// zfs_size, 
// source_host_id, 
// target_host_id, 
// last_execution, 
// last_schedule, 
// enabled, 
// createdAt, 
// updatedAt)
// VALUES
// ('b7773c38-ce54-11e7-957f-3b303616282e'
// , 'manatee0/data/manatee'
// , 0
// , 'ea11d617-434d-457f-b28d-63bda70ce4b1'
// , '{"retentions":[{"interval":"quarter_hourly","retention":0}]}'
// , '{"retentions":[{"interval":"quarter_hourly","retention":4},{"interval":"hourly","retention":24},{"interval":"daily","retention":7},{"interval":"weekly","retention":4},{"interval":"monthly","retention":12}]}'
// , '439c0ffa-20e5-4cab-80a0-880afa863aba'
// , 'zones/439c0ffa-20e5-4cab-80a0-880afa863aba/data/manatee'
// , 'zones/439c0ffa-20e5-4cab-80a0-880afa863aba/data/manatee'
// , 1
// , 1
// , '23b07664-24fc-4345-815d-bf343271c059'
// , '66fa38f1-118e-4e5c-a90b-157160b22def'
// , NULL
// , NULL
// , 1
// , '2017-11-20 20:25:13'
// , '2017-11-20 20:25:13');

//source = headnode, target = zfs-backup-01 schedule = quarter_hour, offset = 7