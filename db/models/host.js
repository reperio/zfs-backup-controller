'use strict';

module.exports = function(sequelize, DataTypes) {
    const Host = sequelize.define('hosts', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {type: DataTypes.STRING, allowNull: false},
        sdc_id: {type: DataTypes.STRING, allowNull: true},
        ip_address: {type: DataTypes.STRING, allowNull: false},
        port: {type: DataTypes.INTEGER, allowNull: false}
    }, {
        tableName: 'hosts',
        timestamps: true,
        deletedAt: false,
        freezeTableName: true
    });

    Host.associate = function(models) {

    };

    return Host;
};
