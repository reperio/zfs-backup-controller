'use strict';

module.exports = function (sequelize, DataTypes) {
    const Snapshot = sequelize.define('snapshots', {
        job_history_id: {
            type: DataTypes.UUID,
            primaryKey: true,
            allowNull: false
        },

        name: {type: DataTypes.STRING, allowNull: false},
        source_host_id: {type: DataTypes.UUID, allowNull: false},
        source_host_status: {type: DataTypes.INTEGER, allowNull: false},
        target_host_id: {type: DataTypes.UUID, allowNull: false},
        target_host_status: {type: DataTypes.INTEGER, allowNull: false},
        snapshot_date_time: {type: DataTypes.DATE, allowNull: false},
        job_id: {type: DataTypes.UUID, allowNull: false}
    }, {
        tableName: 'snapshots',
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    Snapshot.associate = function (models) {
        Snapshot.belongsTo(models.hosts, {as: 'source_host', foreignKey: 'source_host_id'});
        Snapshot.belongsTo(models.hosts, {as: 'target_host', foreignKey: 'target_host_id'});
        Snapshot.belongsTo(models.job_history, {as: 'job_history', foreignKey: 'job_history_id', onDelete: ''});
        Snapshot.belongsTo(models.jobs, {as: 'job', foreignKey: 'job_id'});
    };

    return Snapshot;
};

/**
 * Host statuses
 * 0 = pending (default)
 * 1 = created
 * 2 = deleted
 * 3 = failed
 */
