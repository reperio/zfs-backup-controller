'use strict';
/* eslint no-use-before-define: 0*/

const Boom = require('boom');
const Joi = require('joi');

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
        const hosts = await uow.hosts_repository.get_all_hosts();

        return reply(hosts);
    } catch (err) {
        uow._logger.error('Failed to retrieve hosts');
        uow._logger.error(err);
        return reply(Boom.badImplementation('failed to retrieve hosts'));
    }
}

routes.push({
    method: 'GET',
    path: '/hosts/default_port',
    handler: get_default_port,
    config: {
        cors: true
    }
});

async function get_default_port(request, reply) {
    const config = request.server.app.config;
    return reply(config.default_host_port);
}

routes.push({
    method: 'GET',
    path: '/hosts/{id}',
    handler: get_host_by_id,
    config: {
        cors: true,
        validate: {
            params: {
                id: Joi.string().guid().required()
            }
        }
    }
});

async function get_host_by_id(request, reply) {
    const uow = await request.app.getNewUoW();
    const host_id = request.params.id;

    try {
        const host = await uow.hosts_repository.get_host_by_id(host_id);
        return reply(host);
    } catch (err) {
        uow._logger.error('Failed to fetch host');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to fetch host'));
    }
}

routes.push({
    method: 'POST',
    path: '/hosts',
    handler: create_new_host,
    config: {
        cors: true,
        validate: {
            payload: {
                host: {
                    name: Joi.string().required(),
                    ip_address: Joi.string().required(),
                    port: Joi.number().required(),
                    sdc_id: Joi.string().allow(['', null]),
                    id: Joi.string().allow(['', null]),
                    max_total_jobs: Joi.number().required(),
                    max_backup_jobs: Joi.number().required(),
                    max_retention_jobs: Joi.number().required(),
                    createdAt: Joi.date().optional(),
                    updatedAt: Joi.date().optional()
                }
            }
        }
    }
});

async function create_new_host(request, reply) {
    const uow = await request.app.getNewUoW();
    const new_host = request.payload.host;

    try {
        const result = await uow.hosts_repository.create_host(new_host);
        return reply(result);
    } catch (err) {
        uow._logger.error('Failed to create host');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to create new host'));
    }
}

routes.push({
    method: 'PUT',
    path: '/hosts/{id}',
    handler: update_host,
    config: {
        cors: true,
        validate: {
            params: {
                id: Joi.string().required()
            },
            payload: {
                host: {
                    name: Joi.string().required(),
                    ip_address: Joi.string().required(),
                    port: Joi.number().required(),
                    sdc_id: Joi.string().allow('', null),
                    id: Joi.string().allow('', null),
                    max_total_jobs: Joi.number().required(),
                    max_backup_jobs: Joi.number().required(),
                    max_retention_jobs: Joi.number().required(),
                    createdAt: Joi.date().optional(),
                    updatedAt: Joi.date().optional()
                }
            }
        }
    }
});

async function update_host(request, reply) {
    const uow = await request.app.getNewUoW();
    const host_id = request.params.id;
    const host = request.payload.host;

    if (host_id !== host.id) {
        return reply(Boom.badData('host_id does not match host.id'));
    }

    // ensure that name and ip_address cannot be changed for hosts in SDC
    if (host.sdc_id !== null && host.sdc_id !== '') {
        const db_host = await uow.hosts_repository.get_host_by_id(host_id);
        host.name = db_host.name;
        host.ip_address = db_host.ip_address;
    }

    try {
        const result = uow.hosts_repository.update_host(host);
        return reply(result);
    } catch (err) {
        uow._logger.error('Failed to update host');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to update host'));
    }
}

routes.push({
    method: 'DELETE',
    path: '/hosts/{id}',
    handler: delete_host,
    config: {
        cors: true,
        validate: {
            params: {
                id: Joi.string().required()
            }
        }
    }
});

async function delete_host(request, reply) {
    const uow = await request.app.getNewUoW();
    const host_id = request.params.id;

    try {
        const result = await uow.hosts_repository.delete_host_by_id(host_id);
        return reply(result);
    } catch (err) {
        uow._logger.error('Failed to delete host');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to delete host'));
    }
}

module.exports = { routes: routes };
