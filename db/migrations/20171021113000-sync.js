'use strict';

const db = require('./../models');

module.exports = {
    up: function(migration, DataTypes, done) {
        db.sequelize
            .sync({force:true, logging: function(log) {
                // console.log('test');
                console.log(log);
            }})
            .then(function(result) {
                //TODO sequelize cli is incompatible with sequelize v4, need to find a way to determine if result is actually an error or just a ref to sequelize itself.
                console.log('DONE');
                //console.log(result);
                done();
            });
    },

    down: function(migration, DataTypes, done) {
        console.log('test');
        migration
            .dropAllTables()
            .then(function(result) {
                console.log(result);
                done();
            }).catch(function(err) {
                console.log(err);
                done();
            });
    }
};