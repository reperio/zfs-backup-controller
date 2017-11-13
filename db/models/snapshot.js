'use strict';

module.exports = function (sequelize, DataTypes) {
    const Snapshot = sequelize.define('snapshots', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        name: {type: DataTypes.STRING, allowNull: false},
        host_id: {type: DataTypes.UUID, allowNull: true},
        snapshot_date_time: {type: DataTypes.DATE, allowNull: false},
        job_history_id: {type: DataTypes.UUID, allowNull: true}
    }, {
        tableName: 'snapshots',
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    Snapshot.associate = function (models) {
        Snapshot.belongsTo(models.hosts, {as: 'host', foreignKey: 'host_id'});
        Snapshot.belongsTo(models.job_history, {as: 'job_history', foreignKey: 'job_history_id'});
    };

    return Snapshot;
};
