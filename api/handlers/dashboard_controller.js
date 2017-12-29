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

        return reply(serverRecords);
    } catch (err) {
        logger.error('Failed to retrieve dashboard data');
        logger.error(err);

        return reply(Boom.badImplementation('Failed to retrieve dashboard data'));
    }
}


module.exports = routes;