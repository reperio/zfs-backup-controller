'use strict';
/* eslint no-use-before-define: 0*/

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
    method: ['GET'],
    path: '/jobs/{id}',
    handler: getJob,
    config: {
        cors: true,
        validate: {
            params: {
                id: Joi.string().guid().required()
            }
        }
    }
});

async function getJob(request, reply) {
    const uow = await request.app.getNewUoW();

    const id = request.params.id;

    try {
        uow._logger.info(`Fetching job with id: ${id}`);
        const job = await uow.jobs_repository.get_job_by_id(id);

        return reply(job);
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

function verify_retention_values(data, type, schedule, messages) {
    const retentions = data.retentions;
    const intervals = ['quarter_hourly', 'hourly', 'daily', 'weekly', 'monthly'];
    const scheduleIndex = intervals.indexOf(schedule);
    let retentionObject = {};

    retentions.forEach(retention => {
        retentionObject[retention.interval] = retention.retention;
    });

    console.log(JSON.stringify(retentionObject));

    if (retentionObject.quarter_hourly === null || typeof retentionObject.quarter_hourly === 'undefined') {
        messages.push(`Retention interval "quarter_hourly" missing on ${type}`);
    } else if (intervals.indexOf('quarter_hourly') < scheduleIndex && retentionObject.quarter_hourly > 0) {
        messages.push(`Retention interval "quarter_hourly" cannot be greater than 0 for schedule "${schedule}" on ${type}`);
    }
    if (retentionObject.hourly === null || typeof retentionObject.hourly === 'undefined') {
        messages.push(`Retention interval "hourly" missing on ${type}`);
    } else if (intervals.indexOf('hourly') < scheduleIndex && retentionObject.hourly > 0) {
        messages.push(`Retention interval "hourly" cannot be greater than 0 for schedule "${schedule}" on ${type}`);
    }
    if (retentionObject.daily === null || typeof retentionObject.daily === 'undefined') {
        messages.push(`Retention interval "daily" missing on ${type}`);
    } else if (intervals.indexOf('daily') < scheduleIndex && retentionObject.daily > 0) {
        messages.push(`Retention interval "daily" cannot be greater than 0 for schedule "${schedule}" on ${type}`);
    }
    if (retentionObject.weekly === null || typeof retentionObject.weekly === 'undefined') {
        messages.push(`Retention interval "weekly" missing on ${type}`);
    } else if (intervals.indexOf('weekly') < scheduleIndex && retentionObject.weekly > 0) {
        messages.push(`Retention interval "weekly" cannot be greater than 0 for schedule "${schedule}" on ${type}`);
    }
    if (retentionObject.monthly === null || typeof retentionObject.monthly === 'undefined') {
        messages.push(`Retention interval "monthly" missing on ${type}`);
    }
}

async function create_job(request, reply) {
    const uow = await request.app.getNewUoW();
    const job = request.payload.job;

    // verify retention values
    uow._logger.debug('Source Retention: ' + JSON.stringify(job.source_retention));
    uow._logger.debug('Target Retention: ' + JSON.stringify(job.target_retention));
    
    const schedule = await uow.schedules_repository.get_schedule_by_id(job.schedule_id);
    const source_retentions = JSON.parse(job.source_retention);
    const target_retentions = JSON.parse(job.target_retention);
    
    console.log(source_retentions);
    console.log(target_retentions);

    let messages = [];
    verify_retention_values(source_retentions, 'source', schedule.name, messages);
    verify_retention_values(target_retentions, 'target', schedule.name, messages);

    if (messages.length > 0) {
        uow._logger.warn(JSON.stringify(messages));
        return reply(messages).code(400);
    }
    
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
        const schedule = await uow.schedules_repository.get_schedule_by_id(job.schedule_id);
        const source_retentions = JSON.parse(job.source_retention);
        const target_retentions = JSON.parse(job.target_retention);
    
        let messages = [];
        verify_retention_values(source_retentions, 'source', schedule.name, messages);
        verify_retention_values(target_retentions, 'target', schedule.name, messages);

        if (messages.length > 0) {
            uow._logger.warn(JSON.stringify(messages));
            return reply(messages).code(400);
        }

        const updated_job = await uow.jobs_repository.update_job_entry(job);
        return reply(updated_job);
    } catch (err) {
        uow._logger.error('Failed to update job');
        uow._logger.error(err);
        return reply(Boom.badImplementation('Failed to update job'));
    }
}

routes.push({
    method: ['PUT'],
    path: '/jobs/{id}/enabled',
    handler: edit_job_enabled_status,
    config: {
        cors: true,
        validate: {
            payload: {
                enabled: Joi.boolean().required()
            },
            params: {
                id: Joi.string().guid()
            }
        }
    }
});

async function edit_job_enabled_status(request, reply) {
    const uow = await request.app.getNewUoW();
    const job_id = request.params.id;
    const enabled = request.payload.enabled;

    uow._logger.info(`Updating enabled status for job "${job_id}"`);
    try {
        const updated_job = await uow.jobs_repository.update_job_enabled_status(job_id, enabled);
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
