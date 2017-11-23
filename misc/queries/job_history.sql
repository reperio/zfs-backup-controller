SELECT
 jh.id
,j.name AS job
,jh.start_date_time
,jh.end_date_time
,jh.schedule_date_time
,jr.name AS job_result
,jh.source_message
,jh.target_message
,js.name AS source_result
,jt.name AS target_result
,jh.port
,jh.createdAt
,jh.updatedAt
FROM job_history AS jh
INNER JOIN job_result AS jr
ON jh.result = jr.id
INNER JOIN job_result AS js
on jh.source_result = js.id
INNER JOIN job_result AS jt
ON jh.target_result = jt.id
INNER JOIN jobs as j
ON jh.job_id = j.id
ORDER BY jh.job_id,jh.start_date_time ASC