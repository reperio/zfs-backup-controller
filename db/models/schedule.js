'use strict';
const uuid = require('uuid/v4');
module.exports = function(sequelize, DataTypes) {
    const Schedule = sequelize.define('schedules', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: false},
        display_name: {type: DataTypes.STRING, allowNull: false}
    }, {
        tableName: "schedules",
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    Schedule.associate = function(models) {

    };

    return Schedule;
};