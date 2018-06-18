'use strict';
/* eslint no-use-before-define: 0*/

const _ = require('lodash');
const Boom = require('boom');
const Joi = require('joi');
const StatusService = require('../../backup_status');
const DATASET_FIELD = 'location';
const VM_ID_FIELD = 'virtual_machine_id';

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
    const statusService = new StatusService(uow);
    const logger = request.server.app.logger;
    const vm_id = request.params.vm_id;

    try {
        logger.info(`Fetching datasets for virtual_machine: ${vm_id}`);
        const vm_datasets = await uow.virtual_machine_datasets_repository.get_all_datasets_for_virtual_machine(vm_id);
        const status_records = await statusService.get_statuses(DATASET_FIELD, VM_ID_FIELD, vm_id);
        for (let i = 0; i < vm_datasets.length; i++) {
            const status_result = _.find(status_records, record => {
                return record.id === vm_datasets[i].location;
            });
            vm_datasets[i].status = status_result.status;
            vm_datasets[i].status_messages = status_result.messages;
        }

        logger.debug(JSON.stringify(vm_datasets));
        return reply(vm_datasets);
    } catch (err) {
        logger.error('Failed to fetch virtual machine datasets');
        logger.error(err);
        return reply(Boom.badImplementation());
    }
}

routes.push({
    method: 'PUT',
    path: '/datasets',
    handler: toggle_dataset_enabled_status,
    config: {
        cors: true,
        validate: {
            payload: {
                dataset: {
                    location: Joi.string().required(),
                    name: Joi.string().required(),
                    virtual_machine_id: Joi.string().guid().required(),
                    createdAt: Joi.date(),
                    updatedAt: Joi.date(),
                    enabled: Joi.boolean(),
                    type: Joi.string(),
                    status: Joi.string().allow(null)
                }
            },
            options: {
                stripUnknown: true
            }
        }
    }
});

async function toggle_dataset_enabled_status(request, reply) {
    const uow = await request.app.getNewUoW();
    try {
        const dataset = request.payload.dataset;
        const result = await uow.virtual_machine_datasets_repository.update_dataset(dataset);
        reply(result);
    } catch (err) {
        uow._logger.error(err);
        throw err;
    }
}

module.exports = { routes: routes };
