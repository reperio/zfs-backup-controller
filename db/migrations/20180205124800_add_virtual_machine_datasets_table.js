exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await knex.schema.createTable('virtual_machine_datasets', t => {
                t.uuid('id')
                    .notNullable()
                    .primary();
                t.string('location');
                t.uuid('virtual_machine_id')
                    .notNullable()
                    .references('id')
                    .inTable('virtual_machines')
                    .onDelete('restrict');
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
            await knex.schema.droptTable('virtual_machine_datasets').transacting(tx);
    
            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
