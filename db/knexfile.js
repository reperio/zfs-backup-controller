module.exports = {
    development: {
        client: "mysql",
        connection: {
            host: "localhost", 
            user: "reperio", 
            password: "reperio", 
            database: "reperio_backups_dev"
        },
        migrations: {
            tableName: "knex_migrations",
            directory: __dirname + "/migrations"
        }
    },
    test: {
        client: "mysql",
        connection: {
            host: "localhost",
            user: "reperio",
            password: "reperio",
            database: "reperio_backups_test" + "_" + (Math.floor(Math.random() * (10000 - 1 + 1) + 1)).toString()
        },
        migrations: {
            tableName: "knex_migrations",
            directory: __dirname + "/migrations"
        },
        seeds: {
            directory: __dirname + "/seeds"
        }
    }
};