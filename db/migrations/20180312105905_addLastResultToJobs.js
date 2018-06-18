
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await tx.schema.alterTable('jobs', t => {
                t.integer('last_result');
            });
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.down = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await tx.schema.alterTable('jobs', t => {
                t.dropColumn('last_result');
            });
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
