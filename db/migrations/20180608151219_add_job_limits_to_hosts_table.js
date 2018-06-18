
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await knex.schema.alterTable('hosts', t => {
                t.integer('max_total_jobs');
                t.integer('max_backup_jobs');
                t.integer('max_retention_jobs');
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
            await knex.schema.alterTable('hosts', t => {
                t.dropColumn('max_total_jobs');
                t.dropColumn('max_backup_jobs');
                t.dropColumn('max_retention_jobs');
            });
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
