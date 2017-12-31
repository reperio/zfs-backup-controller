'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/hosts/{id}/virtual_machines',
    handler: get_virtual_machines_by_host,
    config: {
        cors: true,
        validate: {
            params: {
                id: Joi.string().guid()
            }
        }
    }
});

async function get_virtual_machines_by_host(request, reply) {
    const uow = await request.app.getNewUoW();
    const host_id = request.params.id;

    try {
        const virtual_machines = await uow.virtual_machines_repository.get_all_virtual_machines_by_host_id(host_id);
        return reply(virtual_machines);
    } catch (err) {
        uow._logger.error('Failed to fetch virtual machines');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to fetch virtual machines'));
    }
}

routes.push({
    method: ['GET'],
    path: '/hosts/{host_id}/virtual_machines/{virtual_machine_id}/vm_api_record',
    handler: get_virtual_machine_record,
    config: {
        cors: true,
        validate: {
            params: {
                host_id: Joi.string().guid(),
                virtual_machine_id: Joi.string().guid()
            }
        }
    }
});

async function get_virtual_machine_record(request, reply) {
    const uow = await request.app.getNewUoW();
    const vm_api = await request.app.getNewVmApi();
    const virtual_machine_id = request.params.virtual_machine_id;

    try {
        uow._logger.info('Fetching virtual machine from vm api');
        const virtual_machine = await vm_api.get_full_vm_record_by_id(virtual_machine_id);
        return reply(virtual_machine);
    } catch (err) {
        uow._logger.error('Failed to fetch virtual machines');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to fetch virtual machines'));
    }
}

module.exports = routes;
