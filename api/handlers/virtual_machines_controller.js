'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/virtual_machines',
    handler: get_all_virtual_machines,
    config: {
        cors: true,
        validate: {
            query: {
                host_id: Joi.string().optional()
            }
        }
    }
});

async function get_all_virtual_machines(request, reply) {
    const uow = await request.app.getNewUoW();

    uow._logger.info(`Fetching virtual machines: ${JSON.stringify(request.query)}`);

    try {
        const virtual_machines = await uow.virtual_machines_repository.get_all_virtual_machines(request.query.host_id);

        return reply(virtual_machines);
    } catch (err) {
        return reply(Boom.badImplementation('Failed to retrieve virtual machines.'));
    }
}


module.exports = routes;