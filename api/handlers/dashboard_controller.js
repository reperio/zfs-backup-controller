'use strict';

const Boom = require('boom');
const Joi = require('joi');
const _ = require('lodash');

const routes = [];

routes.push({
    method:['GET'],
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
            let status = 'good';
            for (let j = 0; j < virtual_machines.length; j++) {
                if(virtual_machines[j].host_id === server_uuid) {
                    const virtual_machine = virtual_machines[j];
                    if (virtual_machine.job_id === null || virtual_machine.num_successes <= 0) {
                        status = 'bad';
                        //since the colors are by host and not by job, we can break out of this loop because we already know the status for this host
                        j = virtual_machines.length;
                    } else if (virtual_machine.last_result != 2) {
                        status = 'warn';
                    }
                    logger.debug(`server: ${server_uuid}, job: ${virtual_machine.job_id}, num_failures: ${virtual_machine.num_failures}, num_successes: ${virtual_machine.num_successes}, last_result: ${virtual_machine.last_result}, status: ${status}`);
                }
            }
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
