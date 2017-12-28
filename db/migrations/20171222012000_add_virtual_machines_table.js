exports.up = async function(knex, Promise) {
    //create index so the host_id foreign key in the virtual machines table doesn't error out
    await knex.schema.alterTable('hosts', t => {
        t.uuid('sdc_id')
            .unique()
            .alter();
    });

    await knex.schema.createTable('virtual_machines', t => {
        t.uuid('id')
            .notNullable()
            .primary();
        t.uuid('sdc_id')
            .unique();
        t.text('name');
        t.boolean('enabled');
        t.text('status');
        t.uuid('host_id')
            .references('sdc_id')
            .inTable('hosts')
            .onDelete('RESTRICT');
        t.text('state');
    });

    await knex.raw('CREATE INDEX hosts_sdc_id_foreign ON hosts (sdc_id);');

    //TODO add this back to a later migration after we have data established
    //edit the jobs table to add a relationship to virtual machines
    // await knex.schema.alterTable('jobs', t => {
    //     t.uuid('sdc_vm_id')
    //         .references('sdc_id')
    //         .inTable('virtual_machines')
    //         .alter();
    // });
};

exports.down = async function(knex, Promise) {
    await knex.schema.alterTable('jobs', t => {
        t.uuid('sdc_vm_id').alter();
    });

    await knex.schema.dropTableIfExists('virtual_machines');
};
