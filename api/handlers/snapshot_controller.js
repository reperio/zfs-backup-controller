'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/snapshots',
    handler: getAllSnapshots,
    config: {
        cors: true
    }
});

async function getAllSnapshots(request, reply) {
    const uow = await request.app.getNewUoW();

    try {
        const snapshots = await uow.snapshots_repository.getAllSnapshots();

        return reply(snapshots);
    } catch (err) {
        uow._logger.error("Failed to retrieve snapshots");
        uow._logger.error(err);
        return reply(Boom.badImplementation('failed to retrieve snapshots'));
    }
}

module.exports = routes;