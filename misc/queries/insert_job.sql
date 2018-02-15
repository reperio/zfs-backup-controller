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
 '594f7a8a-02bb-11e8-b97c-93f65dae5b64'
,'cpc-kazoo-media-01'
,129
,'95ab491f-8025-4d82-b67d-1d4fee4bf4c2'
,'{"retentions":[{"interval":"quarter_hourly","retention":0},{"interval":"hourly","retention":0},{"interval":"daily","retention":0},{"interval":"weekly","retention":0},{"interval":"monthly","retention":0}]}'
,'{"retentions":[{"interval":"quarter_hourly","retention":0},{"interval":"hourly","retention":0},{"interval":"daily","retention":7},{"interval":"weekly","retention":4},{"interval":"monthly","retention":12}]}'
,'57bfe549-e925-e91f-ea5c-ee2deac51a60'
,'zones/57bfe549-e925-e91f-ea5c-ee2deac51a60'
,'zones/57bfe549-e925-e91f-ea5c-ee2deac51a60'
,1
,1
,'efb8ade8-e53f-44ba-b80d-bfe7491e3ba7'
,'66fa38f1-118e-4e5c-a90b-157160b22def'
,NULL
,NULL
,0
,'2018-01-26 00:00:00'
,'2018-01-26 00:00:00');