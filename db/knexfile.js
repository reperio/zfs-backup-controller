module.exports = {
    development: {
        client: 'mysql',
        connection: {
            host: '10.2.3.31',
            user: 'reperio',
            password: 'reperio',
            database: 'reperio_backups_dev',
            dateStrings: true,
            typeCast: (field, next) => {
                //console.log('TypeCasting', field.type, field.length);
                if (field.type === 'TINY' && field.length === 1) {
                    let value = field.string();
                    return value ? (value === '1') : null;
                }
                return next();
            }
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: __dirname + '/migrations'
        }
    },
    test: {
        client: 'mysql',
        connection: {
            host: '10.2.3.31',
            user: 'reperio',
            password: 'reperio',
            database: 'reperio_backups_test' + '_' + (Math.floor(Math.random() * (10000 - 1 + 1) + 1)).toString(),
            timezone: 'UTC',
            dateStrings: true,
            typeCast: (field, next) => {
                //console.log('TypeCasting', field.type, field.length);
                if (field.type === 'TINY' && field.length === 1) {
                    let value = field.string();
                    return value ? (value === '1') : null;
                }
                return next();
            }
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: __dirname + '/migrations'
        },
        seeds: {
            directory: __dirname + '/seeds'
        }
    },
    production: {
        client: 'mysql',
        connection: {
            host: 'localhost',
            user: 'reperio',
            password: 'mlQMLA6wbLMJwdCO',
            database: 'zfs-backup',
            timezone: 'UTC',
            dateStrings: true,
            typeCast: (field, next) => {
                //console.log('TypeCasting', field.type, field.length);
                if (field.type === 'TINY' && field.length === 1) {
                    let value = field.string();
                    return value ? (value === '1') : null;
                }
                return next();
            }
        },
        migrations: {
            tableName: 'knex_migrations',
            directory: __dirname + '/migrations'
        }
    }
};
