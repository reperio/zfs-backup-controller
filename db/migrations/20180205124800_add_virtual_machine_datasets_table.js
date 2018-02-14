exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await knex.schema.alterTable('virtual_machines', t => {
                t.dropColumn('sdc_id');
            });

            await knex.schema.createTable('virtual_machine_datasets', t => {
                t.string('location', 60)
                    .primary();
                t.string('name');
                t.uuid('virtual_machine_id')
                    .notNullable()
                    .references('id')
                    .inTable('virtual_machines')
                    .onDelete('restrict');
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
            await knex.schema.dropTable('virtual_machine_datasets').transacting(tx);

            await knex.schema.alterTable('virtual_machines', t => {
                t.string('sdc_id');
            });
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
