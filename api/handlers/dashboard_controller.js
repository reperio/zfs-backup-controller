'use strict';
/* eslint no-use-before-define: 0*/

const Boom = require('boom');

const routes = [];

function getServerStatus(server_uuid, virtual_machines, logger) {
    let status = 'good';

    for (let j = 0; j < virtual_machines.length; j++) {
        if(virtual_machines[j].host_id === server_uuid) {
            const virtual_machine = virtual_machines[j];
            if (virtual_machine.job_id === null || virtual_machine.num_successes <= 0) {
                status = 'bad';
                //since the colors are by host and not by job, we can break out of this loop because we already know the status for this host
                break;
            } else if (virtual_machine.last_result !== 2) {
                //don't break here because we could still land in a bad status
                status = 'warn';
            }
            logger.debug(`server: ${server_uuid}, job: ${virtual_machine.job_id}, num_failures: ${virtual_machine.num_failures}, num_successes: ${virtual_machine.num_successes}, last_result: ${virtual_machine.last_result}, status: ${status}`);
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
        const servers = await cnapi.getAllServers();

        let serverPromises = [];

        for(let i = 0; i < servers.length; i++) {
            serverPromises.push(cnapi.getServerRecord(servers[i].uuid));
        }

        let serverRecords = await Promise.all(serverPromises);

        //append status to each server record
        //good: All enabled machines have a job and a successful backup
        //warning: Last backup failed
        //bad: Not configured or no successful backups
        
        //fetch all virtual machines from the database
        const virtual_machines = await uow.virtual_machines_repository.get_virtual_machine_status();
        
        for (let i = 0; i < serverRecords.length; i++) {
            const server_uuid = serverRecords[i].uuid;
            const status = getServerStatus(server_uuid, virtual_machines, logger);
            
            serverRecords[i].status = status;
        }

        return reply(serverRecords);
    } catch (err) {
        logger.error('Failed to retrieve dashboard data');
        logger.error(err);

        return reply(Boom.badImplementation('Failed to retrieve dashboard data'));
    }
}


module.exports = routes;
