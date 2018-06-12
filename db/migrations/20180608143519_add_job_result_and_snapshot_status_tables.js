
exports.up = async function (knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            // drop the tables if they exist
            tx.schema.hasTable('job_result').then(async (exists) => {
                if (exists) {
                    await tx.schema.droptTable('job_result');
                }
            });

            tx.schema.hasTable('snapshot_status').then(async (exists) => {
                if (exists) {
                    await tx.schema.droptTable('snapshot_status');
                }
            });

            // create tables
            await tx.schema.createTable('job_result', t => {
                t.integer('id')
                    .notNullable()
                    .primary();
                t.text('name');
            });

            await tx.schema.createTable('snapshot_status', t => {
                t.integer('id')
                    .notNullable()
                    .primary();
                t.text('name');
            });

            await tx.schema.raw(`INSERT INTO job_result (id, name) VALUES
                (0, 'default'),
                (1, 'started'),
                (2, 'success'),
                (3, 'failed');`);

            await tx.schema.raw(`INSERT INTO snapshot_status (id, name) VALUES
                (0, 'default'),
                (1, 'created'),
                (2, 'deleted'),
                (3, 'destroy_failed'),
                (4, 'receive_failed'),
                (5, 'deleting');`);

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.down = async function (knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await tx.schema.dropTable('job_result');

            await tx.schema.dropTable('snapshot_status');

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
