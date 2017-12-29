
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await knex.schema.alterTable('virtual_machines', (t) => {
                t.dateTime('createdAt');
                t.dateTime('updatedAt');
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
                t.dropColumn('createdAt');
                t.dropColumn('updatedAt');
            }).transacting(tx);
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
