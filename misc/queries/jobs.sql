SELECT
 j.id
,j.name
,j.offset
,hs.name AS source_host
,ht.name AS target_host
,s.name AS schedule
,j.source_retention
,j.target_retention
,j.sdc_vm_id
,j.source_location
,j.target_location
,j.zfs_type
,j.zfs_size
,j.last_execution
,j.last_schedule
,j.enabled
,j.createdAt
,j.updatedAt
FROM jobs AS j
INNER JOIN hosts as hs
ON j.source_host_id = hs.id
INNER JOIN hosts as ht
ON j.target_host_id = ht.id
INNER JOIN schedules as s
ON j.schedule_id = s.id
WHERE j.source_host_id = '23b07664-24fc-4345-815d-bf343271c059'
ORDER by offset ASC