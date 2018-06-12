
exports.up = async function(knex) {
    await knex.transaction(async (tx) => {
        try {
            tx.schema.hasTable('snapshot_status').then(async (exists) => {
                if (exists) {
                    await tx('snapshot_status').insert([{
                        id: 4,
                        name: 'receive_failed'
                    }]);
                }
            });
            
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
            tx.schema.hasTable('snapshot_status').then(async (exists) => {
                if (exists) {
                    await tx('snapshot_status').where('id', 4).delete();
                }
            });

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
