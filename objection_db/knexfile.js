module.exports = {
    development: {
        client: "mysql",
        connection: {
            host: "127.0.0.1", 
            user: "reperio", 
            password: "reperio", 
            database: "reperio_backups_dev"
        },
        migrations: {
            tableName: "knex_migrations"
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