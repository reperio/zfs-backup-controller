
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            // remove zfs_type from jobs
            await tx.schema.alterTable('jobs', t => {
                t.dropColumn('zfs_type');
            });

            // create the job details view
            await tx.schema.raw(`CREATE VIEW job_details AS
            SELECT 
                job.id AS job_id,
                job_virtual_machine.name AS virtual_machine_name, 
                job.name AS job_name, 
                job_source_host.name AS source_host_name, 
                job_target_host.name AS target_host_name, 
                dataset.type AS dataset_type, 
                job_schedule.display_name AS schedule_name, 
                job.last_execution, 
                job.enabled
            FROM jobs job
            LEFT JOIN virtual_machine_datasets AS dataset ON dataset.location = job.source_location
            LEFT JOIN schedules AS job_schedule ON job_schedule.id = job.schedule_id
            LEFT JOIN hosts AS job_source_host ON job_source_host.id = job.source_host_id
            LEFT JOIN hosts AS job_target_host ON job_target_host.id = job.target_host_id
            LEFT JOIN virtual_machines AS job_virtual_machine ON job_virtual_machine.id = job.sdc_vm_id;`);
    
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
            // add zfs_type to jobs
            await tx.schema.alterTable('jobs', t => {
                t.integer('zfs_type');
            });
    
            // drop job details view
            await tx.schema.raw('DROP VIEW job_details;');

            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
