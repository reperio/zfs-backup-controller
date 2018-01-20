'use strict';
/* eslint no-use-before-define: 0*/

const Boom = require('boom');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/hosts',
    handler: getHosts,
    config: {
        cors: true
    }
});

async function getHosts(request, reply) {
    const uow = await request.app.getNewUoW();

    try {
        uow._logger.info('Fetching hosts');
        const hosts = await uow.hosts_repository.getAllHosts();

        return reply(hosts);
    } catch (err) {
        uow._logger.error('Failed to retrieve hosts');
        uow._logger.error(err);
        return reply(Boom.badImplementation('failed to retrieve hosts'));
    }
}

module.exports = routes;
