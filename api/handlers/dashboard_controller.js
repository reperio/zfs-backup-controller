'use strict';
/* eslint no-use-before-define: 0*/

const Boom = require('boom');

const routes = [];

function getServerStatus(server_uuid, datasets) {
    let status = 'good';

    for (let j = 0; j < datasets.length; j++) {
        if(datasets[j].host_id === server_uuid) {
            const dataset = datasets[j];
            if (dataset.job_id === null || dataset.num_successes <= 0) {
                status = 'bad';
                //since the colors are by host and not by dataset, we can break out of this loop because we already know the status for this host
                break;
            } else if (dataset.last_result !== 2) {
                //don't break here because we could still land in a bad status
                status = 'warn';
            }
        }
    }

    return status;
}

routes.push({
    method: ['GET'],
    path: '/dashboard',
    handler: getDashboardData,
    config: {
        cors: true
    }
});

async function getDashboardData(request, reply) {
    const uow = await request.app.getNewUoW();
    const logger = request.server.app.logger;
    const cnapi = await request.app.getNewCnApi();
    logger.info('Retrieving dashboard data');

    try {
        //fetch hosts from database
        const hosts = await uow.hosts_repository.get_all_hosts();
        const datasets = await uow.virtual_machine_datasets_repository.get_dataset_backup_statistics();

        for (let i = 0; i < hosts.length; i++) {
            if (hosts[i].sdc_id !== '') {
                const cnapi_record = await cnapi.getServerRecord(hosts[i].sdc_id);
                hosts[i].memory_total_bytes = cnapi_record.memory_total_bytes;
                hosts[i].memory_provisionable_bytes = cnapi_record.memory_provisionable_bytes;
                hosts[i].memory_available_bytes = cnapi_record.memory_available_bytes;
                hosts[i].reservation_ratio = cnapi_record.reservation_ratio;
                hosts[i].disk_pool_alloc_bytes = cnapi_record.disk_pool_alloc_bytes;
                hosts[i].disk_pool_size_bytes = cnapi_record.disk_pool_size_bytes;
                hosts[i].datacenter = cnapi_record.datacenter;
                hosts[i].vms = cnapi_record.vms;

                //append status to each server record
                //good: All enabled machines have a job and a successful backup
                //warning: Last backup failed
                //bad: Not configured or no successful backups
                hosts[i].status = getServerStatus(hosts[i].sdc_id, datasets);
            } else {
                hosts[i].sdc_id = 'n/a';
                hosts[i].memory_total_bytes = 200;
                hosts[i].memory_provisionable_bytes = 1;
                hosts[i].memory_available_bytes = 1;
                hosts[i].reservation_ratio = 1;
                hosts[i].disk_pool_alloc_bytes = 0;
                hosts[i].disk_pool_size_bytes = 100;
                hosts[i].datacenter = 'n/a';
            }
        }

        return reply(hosts);
    } catch (err) {
        logger.error('Failed to retrieve dashboard data');
        logger.error(err);

        return reply(Boom.badImplementation('Failed to retrieve dashboard data'));
    }
}


module.exports = routes;


/*
    Fetching host statuses
    1. Fetch all hosts from database
    2. If host has sdc_id set, fetch memory information from cnapi
    3. Fetch datasets from database and set host status
    4. Reply with list of hosts
*/
