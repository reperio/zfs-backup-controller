
exports.up = async function(knex) {
    knex.schema.hasTable('snapshot_status').then(async (exists) => {
        if (exists) {
            await knex('snapshot_status').insert([{
                id: 4,
                name: 'receive_failed'
            }]);
        }
    });
};

exports.down = async function(knex) {
    knex.schema.hasTable('snapshot_status').then(async (exists) => {
        if (exists) {
            await knex('snapshot_status').where('id', 4).delete();
        }
    });
};

exports.config = { transaction: true };
