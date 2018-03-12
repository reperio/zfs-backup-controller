'use strict';
/* eslint no-use-before-define: 0*/

const _ = require('lodash');
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

        let promises = [];
        for (let i = 0; i < hosts.length; i++) {
            if (hosts[i].sdc_id !== '' && hosts[i].sdc_id != null) {
                promises.push(cnapi.getServerRecord(hosts[i].sdc_id));
            } else {
                hosts[i].sdc_id = null;
                hosts[i].memory_total_bytes = 200;
                hosts[i].memory_provisionable_bytes = 1;
                hosts[i].memory_available_bytes = 1;
                hosts[i].reservation_ratio = 1;
                hosts[i].disk_pool_alloc_bytes = 0;
                hosts[i].disk_pool_size_bytes = 100;
                hosts[i].datacenter = 'n/a';
            }
        }

        for (let i = 0; i < promises.length; i++) {
            const cnapi_record = await promises[i];

            const db_host = _.find(hosts, host => {
                return host.sdc_id === cnapi_record.uuid;
            });

            db_host.memory_total_bytes = cnapi_record.memory_total_bytes;
            db_host.memory_provisionable_bytes = cnapi_record.memory_provisionable_bytes;
            db_host.memory_available_bytes = cnapi_record.memory_available_bytes;
            db_host.reservation_ratio = cnapi_record.reservation_ratio;
            db_host.disk_pool_alloc_bytes = cnapi_record.disk_pool_alloc_bytes;
            db_host.disk_pool_size_bytes = cnapi_record.disk_pool_size_bytes;
            db_host.datacenter = cnapi_record.datacenter;
            db_host.vms = cnapi_record.vms;

            //append status to each server record
            //good: All enabled machines have a job and a successful backup
            //warning: Last backup failed
            //bad: Not configured or no successful backups
            db_host.status = getServerStatus(hosts[i].sdc_id, datasets);
        }

        return reply(hosts);
    } catch (err) {
        logger.error('Failed to retrieve dashboard data');
        logger.error(err);

        return reply(Boom.badImplementation('Failed to retrieve dashboard data'));
    }
}

module.exports = routes;
