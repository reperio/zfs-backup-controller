
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await knex.schema.alterTable('virtual_machines', (t) => {
                t.dateTime('last_sync');
            }).transacting(tx);
    
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
            await knex.schema.alterTable('virtual_machines', (t) => {
                t.dropColumn('last_sync');
            }).transacting(tx);
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
