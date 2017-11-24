INSERT INTO jobs (
 id
,name
,offset
,schedule_id
,source_retention
,target_retention
,sdc_vm_id
,source_location
,target_location
,zfs_type
,zfs_size
,source_host_id
,target_host_id
,last_execution
,last_schedule
,enabled
,createdAt
,updatedAt)
VALUES (
 '50ee0dfa-d0d6-11e7-825b-87de28fedc24'
,'Stack13-12/data'
,53
,'95ab491f-8025-4d82-b67d-1d4fee4bf4c2'
,'{"retentions":[{"interval":"daily","retention":1}]}'
,'{"retentions":[{"interval":"daily","retention":7},{"interval":"weekly","retention":4},{"interval":"monthly","retention":12}]}'
,'e57c3bf3-7ed9-4431-9af8-c0c9c7172035'
,'zones/e57c3bf3-7ed9-4431-9af8-c0c9c7172035-disk1'
,'zones/e57c3bf3-7ed9-4431-9af8-c0c9c7172035-disk1'
,1
,1
,'efb43ab6-8a03-41b9-91f0-782328ecaa54'
,'66fa38f1-118e-4e5c-a90b-157160b22def'
,NULL
,NULL
,1
,'2017-11-24 00:00:00'
,'2017-11-24 00:00:00');