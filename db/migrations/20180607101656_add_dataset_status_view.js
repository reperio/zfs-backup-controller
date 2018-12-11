
exports.up = async function (knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            // create the dataset_status view
            await tx.schema.raw(`CREATE VIEW dataset_status AS
                SELECT
                    hosts.sdc_id AS host_sdc_id,
                    hosts.name AS host_name,
                    virtual_machines.id AS virtual_machine_id,
                    virtual_machines.name AS virtual_machine_name,
                    virtual_machine_datasets.location AS dataset_location,
                    virtual_machine_datasets.name AS dataset_name,
                    virtual_machine_datasets.enabled AS dataset_enabled,
                    jobs.id AS job_id,
                    jobs.name AS job_name,
                    jobs.enabled AS job_enabled,
                    jobs.schedule_id AS schedule_id,
                    jobs.last_execution,
                    (SELECT start_date_time FROM job_history WHERE job_id = jobs.id AND result = '2' ORDER BY start_date_time DESC LIMIT 1) AS last_successful_backup,
                    (SELECT result FROM job_history WHERE job_id = jobs.id ORDER BY start_date_time DESC LIMIT 1) AS last_result,
                    (SELECT COUNT(*) FROM job_history WHERE job_id = jobs.id AND result = 2) AS num_successful_backups,
                    CASE
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'quarter_hour' THEN
                        CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN true ELSE false END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'hourly' THEN
                        CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN true ELSE false END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'daily' THEN
                        CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN true ELSE false END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'weekly' THEN
                        CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN true ELSE false END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'monthly' THEN
                        CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN true ELSE false END
                    END AS ran_within_previous_period,
                    CASE
                        WHEN virtual_machine_datasets.enabled = false THEN 0
                        WHEN jobs.id IS NULL OR (SELECT COUNT(*) FROM job_history WHERE job_id = jobs.id AND result = 2) < 1 THEN 3
                        WHEN (SELECT result FROM job_history WHERE job_id = jobs.id ORDER BY start_date_time DESC LIMIT 1) <> 2 THEN 2
                        ELSE
                        CASE
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'quarter_hour' THEN
                            CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 15 MINUTE) THEN 1 ELSE 2 END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'hourly' THEN
                            CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 ELSE 2 END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'daily' THEN
                            CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 1 ELSE 2 END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'weekly' THEN
                            CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN 1 ELSE 2 END
                        WHEN (SELECT name FROM schedules WHERE id = jobs.schedule_id) = 'monthly' THEN
                            CASE WHEN jobs.last_execution > DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 ELSE 2 END
                        END
                    END AS status
                FROM virtual_machine_datasets
                LEFT JOIN virtual_machines ON virtual_machine_datasets.virtual_machine_id = virtual_machines.id
                LEFT JOIN hosts ON virtual_machines.host_id = hosts.sdc_id
                LEFT JOIN jobs ON jobs.source_location = virtual_machine_datasets.location
                ORDER BY host_name, virtual_machine_name, dataset_name;`);

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};

exports.down = async function (knex, Promise) {
    await knex.transaction(async (tx) => {
        try {
            // drop the dataset_status view
            await tx.schema.raw('DROP VIEW dataset_status;');

            await tx.commit();
        } catch (err) {
            console.log(err);
            await tx.rollback();
        }
    });
};
