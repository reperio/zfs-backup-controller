/* eslint max-nested-callbacks: 0 */

exports.up = async function (knex, Promise) {
    // drop the tables if they exist

    const job_result_promise = new Promise(async(resolve, reject) => {
        knex.schema.hasTable('job_result').then(async (exists) => {
            if (exists) {
                await knex.schema.droptTable('job_result');
            }
    
            await knex.schema.createTable('job_result', t => {
                t.integer('id')
                    .notNullable()
                    .primary();
                t.text('name');
            });
    
            await knex.schema.raw(`INSERT INTO job_result (id, name) VALUES
                (0, 'default'),
                (1, 'started'),
                (2, 'success'),
                (3, 'failed');`);

            resolve();
        });
    });

    const snapshot_status_promise = new Promise(async(resolve, reject) => {
        knex.schema.hasTable('snapshot_status').then(async (exists2) => {
            if (exists2) {
                await knex.schema.droptTable('snapshot_status');
            }
    
            await knex.schema.createTable('snapshot_status', t => {
                t.integer('id')
                    .notNullable()
                    .primary();
                t.text('name');
            });
    
            await knex.schema.raw(`INSERT INTO snapshot_status (id, name) VALUES
                (0, 'default'),
                (1, 'created'),
                (2, 'deleted'),
                (3, 'destroy_failed'),
                (4, 'receive_failed'),
                (5, 'deleting');`);

            resolve();
        });
    });

    return Promise.all([ job_result_promise, snapshot_status_promise]);
};

exports.down = async function (knex) {
    await knex.schema.dropTable('job_result');

    await knex.schema.dropTable('snapshot_status');
};

exports.config = { transaction: true };
