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

    const job_history_id = request.payload.job_history_id;
    const code = request.payload.code;

    try {
        logger.info(`send_complete called with payload: ${JSON.stringify(request.payload)}`);

        logger.info(`${job_history_id} - Fetching job history entry.`);
        const job_history = await db.jobs_repository.get_job_history_by_id(job_history_id);
        logger.info(`${job_history.id} - Updating job history entry.`);

        const result = code === '0' ? 2 : 3;

        job_history.update({ source_message: code, source_result: result});
        logger.info(`${job_history_id} - Finished updating job history entry.`);
        
        return reply({status: 'success'});
    } catch (err) {
        logger.error(`${job_history_id} - Processing send_complete failed.`);
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

    const job_history_id = request.payload.job_history_id;
    const code = request.payload.code;

    try {
        logger.info(`receive_complete called with payload: ${JSON.stringify(request.payload)}`);

        const job_history = await db.jobs_repository.get_job_history_by_id(job_history_id);
        logger.info(`${job_history_id} - Updating job history entry.`);

        const result = code === '0' ? 2 : 3;

        job_history.update({ target_message: code, target_result: result});
        logger.info(`${job_history_id} - Finished updating job history entry.`);

        return reply({status: 'success'});
    } catch (err) {
        logger.error(`${job_history_id} - Processing receive_complete failed.`);
        logger.error(err);

        return reply(Boom.badImplementation('Snapshot receive_complete failed.'));
    }
}


module.exports = routes;