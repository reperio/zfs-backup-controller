'use strict';
/* eslint no-use-before-define: 0*/

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: 'GET',
    path: '/hosts/{host_id}/virtual_machines/{vm_id}/datasets',
    handler: get_datasets_by_virtual_machine_id,
    config: {
        cors: true,
        validate: {
            params: {
                host_id: Joi.string().guid(),
                vm_id: Joi.string().guid()
            }
        }
    }
});

async function get_datasets_by_virtual_machine_id(request, reply) {
    const uow = await request.app.getNewUoW();
    const logger = request.server.app.logger;
    const vm_id = request.params.vm_id;

    try {
        logger.info(`Fetching datasets for virtual_machine: ${vm_id}`);
        const vm_datasets = await uow.virtual_machine_datasets_repository.get_all_datasets_for_virtual_machine(vm_id);
        logger.debug(JSON.stringify(vm_datasets));
        return reply(vm_datasets);
    } catch (err) {
        logger.error('Failed to fetch virtual machine datasets');
        logger.error(err);
        return reply(Boom.badImplementation());
    }
} 

module.exports = routes;