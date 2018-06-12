
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await tx.schema.alterTable('virtual_machines', (t) => {
                t.dateTime('createdAt');
                t.dateTime('updatedAt');
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
                t.dropColumn('createdAt');
                t.dropColumn('updatedAt');
            });
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
