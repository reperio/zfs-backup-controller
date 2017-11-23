SELECT
 s.job_history_id
,s.name
,hs.name AS source_host
,ss.name AS source_status
,ht.name AS target_host
,st.name AS target_status
,s.snapshot_date_time
,j.name AS job
,s.createdAt
,s.updatedAt
FROM snapshots AS s
INNER JOIN snapshot_status AS ss
ON s.source_host_status = ss.id
INNER JOIN snapshot_status AS st
ON s.target_host_status = st.id
INNER JOIN hosts as hs
ON s.source_host_id = hs.id
INNER JOIN hosts as ht
ON s.target_host_id = ht.id
INNER JOIN jobs as j
ON s.job_id = j.id
ORDER by j.id,s.snapshot_date_time ASC