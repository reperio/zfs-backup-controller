'use strict';
const uuid = require('uuid/v4');
module.exports = function(sequelize, DataTypes) {
    const Snapshot = sequelize.define("snapshots", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        name: {type: DataTypes.STRING, allowNull: false},
        host_id: {type: DataTypes.INTEGER, allowNull: false},
        snapshot_date_time: {type: DataTypes.DATE, allowNull: false}
    }, {
        tableName: "snapshots",
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    Snapshot.associate = function(models) {

    };

    return Snapshot;
};