
exports.up = async function(knex) {
    await knex.transaction(async (tx) => {
        try {
            await knex('snapshot_status').insert([{
                id: 4,
                name: 'receive_failed'
            }]);

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.down = async function(knex) {
    await knex.transaction(async (tx) => {
        try {
            await knex('snapshot_status').where('id', 4).delete();

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
