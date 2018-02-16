
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await knex.schema.alterTable('virtual_machines', t => {
                t.dropColumn('enabled');
            });

            await knex.schema.alterTable('virtual_machine_datasets', t => {
                t.boolean('enabled');
                t.text('type');
            });

            // await knex.schema.alterTable('jobs', t => {
            //     t.string('source_location', 60)
            //         .references('location')
            //         .inTable('virtual_machine_datasets')
            //         .onDelete('restrict')
            //         .alter();
            // });
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.down = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            await knex.schema.alterTable('virtual_machines', t => {
                t.boolean('enabled');
            });

            await knex.schema.alterTable('virtual_machine_datasets', t => {
                t.dropColumn('enabled');
                t.dropColumn('type');
            });

            // await knex.schema.alterTable('jobs', t => {
            //     t.text('source_location')
            //         .alter();
            // });
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
