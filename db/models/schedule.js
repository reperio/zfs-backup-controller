'use strict';
const uuid = require('uuid/v4');
module.exports = function(sequelize, DataTypes) {
    const Schedule = sequelize.define('schedules', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        minutes: {type: DataTypes.INTEGER, allowNull: false}
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