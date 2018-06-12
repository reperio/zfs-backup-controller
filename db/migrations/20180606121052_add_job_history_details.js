
exports.up = async function(knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            // create the job history details view
            await tx.schema.raw(`CREATE VIEW job_history_details AS
            SELECT
                job.name AS job_name,
                source.name AS source_node_name,
                virtual_machine.name AS virtual_machine_name,
                start_date_time,
                end_date_time,
                schedule_date_time,
                result,
                snapshot.source_host_status,
                snapshot.target_host_status
            FROM job_history
            LEFT JOIN jobs job ON job_history.job_id = job.id
            LEFT JOIN hosts source ON job.source_host_id = source.id
            LEFT JOIN hosts target ON job.target_host_id = target.id
            LEFT JOIN virtual_machines virtual_machine ON job.sdc_vm_id = virtual_machine.id
            LEFT JOIN snapshots snapshot ON snapshot.job_history_id = job_history.id;`);
    
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
            // drop job history details view
            await tx.schema.raw('DROP VIEW job_history_details;');

            await tx.commit();
        } catch(err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.config = { transaction: false };
