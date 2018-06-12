
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await tx.schema.alterTable('virtual_machines', (t) => {
                t.dateTime('last_sync');
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
            await tx.schema.alterTable('virtual_machines', (t) => {
                t.dropColumn('last_sync');
            });
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
