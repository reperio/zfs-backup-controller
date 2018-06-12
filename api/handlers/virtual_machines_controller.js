'use strict';
/* eslint no-use-before-define: 0*/
const _ = require('lodash');
const Boom = require('boom');
const Joi = require('joi');
const StatusService = require('../../backup_status');
const DATASET_FIELD = 'virtual_machine_id';
const LOCATION_DATASET_FIELD = 'location';
const routes = [];

routes.push({
    method: ['GET'],
    path: '/virtual_machines',
    handler: get_all_virtual_machines,
    config: {
        cors: true,
        validate: {
            query: {
                host_id: Joi.string().optional(),
                filter: Joi.string().optional()
            }
        }
    }
});

async function get_all_virtual_machines(request, reply) {
    const uow = await request.app.getNewUoW();
    const statusService = new StatusService(uow);

    uow._logger.info(`Fetching virtual machines: ${JSON.stringify(request.query)}`);

    try {
        const virtual_machines = await uow.virtual_machines_repository.get_all_virtual_machines(request.query.host_id, request.query.filter);
        const datasets = await uow.virtual_machine_datasets_repository.get_all_datasets();
        const dataset_status_records = await statusService.get_statuses(LOCATION_DATASET_FIELD, 'virtual_machines.name', request.query.filter);

        for (let i = 0; i < virtual_machines.length; i++) {
            const vm_datasets = _.filter(datasets, dataset => {
                return dataset.virtual_machine_id === virtual_machines[i].id;
            });

            virtual_machines[i].status_messages = [];
            
            for (let j = 0; j < vm_datasets.length; j++) {
                const status_result = _.find(dataset_status_records, record => {
                    return record.id === vm_datasets[j].location;
                });

                vm_datasets[j].status = status_result.status;
                vm_datasets[j].status_messages = status_result.messages;
                vm_datasets[j].last_execution = status_result.last_execution;
                virtual_machines[i].status = get_worse_status(virtual_machines[i].status, status_result.status);
                virtual_machines[i].status_messages.push(status_result.messages[0]);
            }

            virtual_machines[i].datasets = vm_datasets;
        }
        return reply(virtual_machines);
    } catch (err) {
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to retrieve virtual machines.'));
    }
}

function get_worse_status(oldStatus, newStatus) {
    const statuses = [null, 'good', 'warn', 'bad'];
    if (statuses.indexOf(oldStatus) > statuses.indexOf(newStatus)) {
        return oldStatus;
    }
    return newStatus;
}

routes.push({
    method: ['GET'],
    path: '/virtual_machines/{id}',
    handler: get_virtual_machine_by_id,
    config: {
        cors: true,
        validate: {
            params: {
                id: Joi.string().guid().required()
            }
        }
    }
});

async function get_virtual_machine_by_id(request, reply) {
    const uow = await request.app.getNewUoW();
    const statusService = new StatusService(uow);

    uow._logger.info(`Fetching virtual machines: ${JSON.stringify(request.query)}`);

    try {
        const virtual_machine = await uow.virtual_machines_repository.get_virtual_machine_by_id(request.params.id);
        const status_records = await statusService.get_statuses(DATASET_FIELD, 'virtual_machines.id', request.params.id);
        const status_result = _.find(status_records, record => {
            return record.id === virtual_machine.id;
        });
        virtual_machine.status = status_result.status;
        virtual_machine.status_messages = status_result.messages;
        return reply(virtual_machine);
    } catch (err) {
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to retrieve virtual machines.'));
    }
}

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


module.exports = { routes: routes };
