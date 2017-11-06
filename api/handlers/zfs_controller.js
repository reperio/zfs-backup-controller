'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['POST'],
    path: '/zfs/send_complete',
    handler: send_complete,
    config: {
        cors: true,
        validate: {
            payload: {
                job_history_id: Joi.string().guid().required(),
                code: Joi.number().required()
            }
        }
    }
});

async function send_complete(request, reply) {
    const logger = request.server.app.logger;
    const db = request.server.app.db;

    try {
        const payload = JSON.stringify(request.payload);
        logger.info(`send_complete called with payload: ${payload}`);

        const job_history_id = payload.job_history_id;
        const code = payload.code;

        const job_history = await db.jobs_repository.get_job_history_by_id(job_history_id);
        logger.info(`${job_history.id} - Updating job history entry.`);

        job_history.update({ source_message: 'test', source_result: code});

    } catch (err) {
        logger.error(err);

        return reply(Boom.badImplementation('Snapshot send_complete failed.'));
    }
}

routes.push({
    method: ['POST'],
    path: '/zfs/receive_complete',
    handler: receive_complete,
    config: {
        cors: true,
        validate: {
            payload: {
                job_history_id: Joi.string().guid().required(),
                code: Joi.number().required()
            }
        }
    }
});

async function receive_complete(request, reply) {
    const logger = request.server.app.logger;
    const db = request.server.app.db;

    try {
        const payload = JSON.stringify(request.payload);
        logger.info(`receive_complete called with payload: ${payload}`);

        const job_history_id = payload.job_history_id;
        const code = payload.code;

        const job_history = await db.jobs_repository.get_job_history_by_id(job_history_id);
        logger.info(`${job_history.id} - Updating job history entry.`);

        job_history.update({ target_message: 'test', target_result: code});

    } catch (err) {
        logger.error(err);

        return reply(Boom.badImplementation('Snapshot receive_complete failed.'));
    }
}


module.exports = routes;