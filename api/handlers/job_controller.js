'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/jobs',
    handler: getAllJobs,
    config: {
        cors: true,
        validate: {
            query: {
                node_id: Joi.string().allow(''),
                order_by: Joi.string(),
                order_direction: Joi.string()
            }
        }
    }
});

async function getAllJobs(request, reply) {
    const uow = await request.app.getNewUoW();

    const node_id = request.query.node_id || null;
    const order_by = request.query.order_by || null;
    const order_direction= request.query.order_direction || null;

    try {
        uow._logger.info(`Fetching all jobs, filtered by ${node_id} and ordered by ${order_by}, ${order_direction}`);
        const jobs = await uow.jobs_repository.getAllJobs(node_id, order_by, order_direction);

        return reply(jobs);
    } catch (err) {
        return reply(Boom.badImplementation('failed to retrieve jobs.'));
    }
}


routes.push({
    method: ['POST'],
    path: '/jobs',
    handler: create_job,
    config: {
        cors: true,
        validate: {
            payload: {
                job: {
                    id: Joi.string().guid().allow(null),
                    name: Joi.string(),
                    schedule_id: Joi.string().guid(),
                    source_retention: Joi.string(),
                    target_retention: Joi.string(),
                    sdc_vm_id: Joi.string().guid(),
                    source_location: Joi.string(),
                    target_location: Joi.string(),
                    zfs_type: Joi.number(),
                    zfs_size: Joi.number(),
                    source_host_id: Joi.string().guid(),
                    target_host_id: Joi.string().guid(),
                    last_execution: Joi.date().allow(null),
                    last_schedule: Joi.date().allow(null),
                    enabled: Joi.boolean(),
                    offset: Joi.number(),
                    createdAt: Joi.date().optional(),
                    updatedAt: Joi.date().optional(),
                    job_source_host: Joi.object().optional(),
                    job_schedule: Joi.object().optional(),
                    job_target_host: Joi.object().optional(),
                    job_virtual_machine: Joi.object().optional()
                }
            }
        }
    }
});

async function create_job(request, reply) {
    const uow = await request.app.getNewUoW();
    const job = request.payload.job;

    try{
        await uow.jobs_repository.create_job(job);
        return reply(job);
    } catch (err) {
        uow._logger.error('Failed to create job');
        uow._logger.error(err);
        
        return reply(Boom.badImplementation('Failed to create new job'));
    }
}

routes.push({
    method: ['PUT'],
    path: '/jobs/{id}',
    handler: edit_job,
    config: {
        cors: true,
        validate: {
            payload: {
                job: {
                    id: Joi.string().guid().allow(null),
                    name: Joi.string(),
                    schedule_id: Joi.string().guid(),
                    source_retention: Joi.string(),
                    target_retention: Joi.string(),
                    sdc_vm_id: Joi.string().guid(),
                    source_location: Joi.string(),
                    target_location: Joi.string(),
                    zfs_type: Joi.number(),
                    zfs_size: Joi.number(),
                    source_host_id: Joi.string().guid(),
                    target_host_id: Joi.string().guid(),
                    last_execution: Joi.date().allow(null),
                    last_schedule: Joi.date().allow(null),
                    enabled: Joi.boolean(),
                    offset: Joi.number(),
                    createdAt: Joi.date(),
                    updatedAt: Joi.date(),
                    job_source_host: Joi.object().optional(),
                    job_schedule: Joi.object().optional(),
                    job_target_host: Joi.object().optional(),
                    job_virtual_machine: Joi.object().optional()
                }
            },
            params: {
                id: Joi.string().guid()
            }
        }
    }
});

async function edit_job(request, reply) {
    const uow = await request.app.getNewUoW();
    const job_id = request.params.id;
    const job = request.payload.job;

    uow._logger.info(`Updating job "${job_id}"`);
    try {
        const updated_job = await uow.jobs_repository.update_job_entry(job);
        return reply(updated_job);
    } catch (err) {
        uow._logger.error('Failed to update job');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to update job'));
    }
}

routes.push({
    method: ['DELETE'],
    path: '/jobs/{id}',
    handler: delete_job,
    config: {
        cors: true,
        validate: {
            params: {
                id: Joi.string().guid()
            }
        }
    }
});

async function delete_job(request, reply) {
    const uow = await request.app.getNewUoW();
    const logger = request.server.app.logger;
    const job_id = request.params.id;
    try {
        await uow.jobs_repository.delete_job(job_id);
        return reply(null).code(204);
    } catch (err) {
        logger.error('Failed to delete job');
        logger.error(err);
        return reply(Boom.badImplementation('Failed to delete job'));
    }
}

module.exports = routes;
