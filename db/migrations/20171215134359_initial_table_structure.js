
exports.up = async function(knex, Promise) {
    await knex.schema.createTable("hosts", t => {
        t.uuid('id')
            //.defaultTo(knex.raw('uuid_generate_v4()'))
            .notNullable()
            .primary();
        t.text('name');
        t.uuid('sdc_id');
        t.text('ip_address');
        t.integer('port');
        t.dateTime('createdAt');
        t.dateTime('updatedAt');
    });

    await knex.schema.createTable("schedules", t => {
        t.uuid('id')
            //.defaultTo(knex.raw('uuid_generate_v4()'))
            .notNullable()
            .primary();
        t.text('name');
        t.text('display_name');
        t.dateTime('createdAt');
        t.dateTime('updatedAt');
    });

    await knex.schema.createTable("jobs", t => {
        t.uuid('id')
            //.defaultTo(knex.raw('uuid_generate_v4()'))
            .notNullable()
            .primary();
        t.text('name');
        t.uuid('schedule_id')
            .notNullable()
            .references('id')
            .inTable('schedules')
            .onDelete('RESTRICT');
        t.text('source_retention');
        t.text('target_retention');
        t.uuid('sdc_vm_id');
        t.text('source_location');
        t.text('target_location');
        t.integer('zfs_type');
        t.integer('zfs_size');
        t.integer('offset');
        t.uuid('source_host_id')
            .notNullable()
            .references('id')
            .inTable('hosts')
            .onDelete('RESTRICT');
        t.uuid('target_host_id')
            .notNullable()
            .references('id')
            .inTable('hosts')
            .onDelete('RESTRICT');
        t.dateTime('last_execution');
        t.dateTime('last_schedule');
        t.boolean('enabled');
        t.dateTime('createdAt');
        t.dateTime('updatedAt');
    });

    await knex.schema.createTable("job_history", t => {
        t.uuid('id')
            //.defaultTo(knex.raw('uuid_generate_v4()'))
            .notNullable()
            .primary();
        t.uuid('job_id')
            .notNullable()
            .references('id')
            .inTable('jobs')
            .onDelete('RESTRICT');
        t.dateTime('start_date_time');
        t.dateTime('end_date_time');
        t.dateTime('schedule_date_time');
        t.integer('result');
        t.text('source_message');
        t.text('target_message');
        t.integer('source_result');
        t.integer('target_result');
        t.integer('port');
        t.dateTime('createdAt');
        t.dateTime('updatedAt');
    });

    await knex.schema.createTable("snapshots", t => {
        t.uuid('job_history_id')
            .notNullable()
            .primary()
            .references('id')
            .inTable('job_history')
            .onDelete('RESTRICT');
        t.text('name');
        t.uuid('source_host_id')
            .notNullable()
            .references('id')
            .inTable('hosts')
            .onDelete('RESTRICT');
        t.uuid('target_host_id')
            .notNullable()
            .references('id')
            .inTable('hosts')
            .onDelete('RESTRICT');
        t.integer('source_host_status');
        t.integer('target_host_status');
        t.dateTime('snapshot_date_time');
        t.uuid('job_id')
            .notNullable()
            .references('id')
            .inTable('jobs')
            .onDelete('RESTRICT');
        t.dateTime('createdAt');
        t.dateTime('updatedAt');   
    });
};

exports.down = async function(knex, Promise) {
    await knex.schema.dropTableIfExists("snapshots");
    await knex.schema.dropTableIfExists("job_history");
    await knex.schema.dropTableIfExists("jobs");
    await knex.schema.dropTableIfExists("schedules");
    await knex.schema.dropTableIfExists("hosts");
};
