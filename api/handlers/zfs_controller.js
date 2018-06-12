/* eslint no-use-before-define: 0*/
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
    const uow = await request.app.getNewUoW();

    const job_history_id = request.payload.job_history_id;
    const code = request.payload.code;

    try {
        logger.info(`send_complete called with payload: ${JSON.stringify(request.payload)}`);

        logger.info(`${job_history_id} - Fetching job history entry.`);
        const job_history = await uow.job_history_repository.get_job_history_by_id(job_history_id);
        logger.info(`${job_history.id} - Updating job history entry.`);

        const result = code === 0 ? 2 : 3;

        job_history.source_message = code;
        job_history.source_result = result;
        
        if (result === 3) {
            job_history.result = 3;
        }

        await uow.job_history_repository.update_job_history_entry(job_history);
        logger.info(`${job_history_id} - Finished updating job history entry.`);

        return reply({status: 'success'});
    } catch (err) {
        logger.error(`${job_history_id} - Processing send_complete failed.`);
        logger.error(err);

        return reply(Boom.badImplementation('send_complete failed.'));
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
    const uow = await request.app.getNewUoW();

    const job_history_id = request.payload.job_history_id;
    const code = request.payload.code;

    try {
        logger.info(`receive_complete called with payload: ${JSON.stringify(request.payload)}`);

        const job_history = await uow.job_history_repository.get_job_history_by_id(job_history_id);
        logger.debug('found job history');
        logger.debug(JSON.stringify(job_history));
        logger.info(`${job_history_id} - Updating job history entry.`);

        const result = code === 0 ? 2 : 3;

        job_history.target_message = code;
        job_history.target_result = result;
        
        if (result === 3) {
            job_history.result = 3;
        }

        await uow.job_history_repository.update_job_history_entry(job_history);
        logger.info(`${job_history_id} - Finished updating job history entry.`);

        logger.info(`  ${job_history.job_id} | ${job_history.id} - Updating job snapshot.`);
        let snapshot = job_history.job_history_snapshot;
        
        //set snapshot target status to 'receive_failed' if the 'result' is failed, otherwise set it to 'created'
        snapshot.target_host_status = result === 3 ? 4 : 1;
        await uow.snapshots_repository.updateSnapshotEntry(snapshot);
        logger.info(`  ${job_history.job_id} | ${job_history.id} - Job snapshot updated.`);

        return reply({status: 'success'});
    } catch (err) {
        logger.error(`${job_history_id} - Processing receive_complete failed.`);
        logger.error(err);

        return reply(Boom.badImplementation('receive_complete failed.'));
    }
}

routes.push({
    method: ['POST'],
    path: '/zfs/destroy_complete',
    handler: destroy_complete,
    config: {
        cors: true,
        validate: {
            payload: {
                job_history_id: Joi.string().guid().required(),
                code: Joi.number().required(),
                host_id: Joi.string().guid().required()
            }
        }
    }
});

async function destroy_complete(request, reply) {
    const logger = request.server.app.logger;
    const uow = await request.app.getNewUoW();

    const job_history_id = request.payload.job_history_id;
    const code = request.payload.code;
    const host_id = request.payload.host_id;

    try {
        const snapshot = await uow.snapshots_repository.get_by_job_history_id(job_history_id);
        if (snapshot.source_host_id === host_id) {
            if (snapshot.source_host_status !== 5) {
                logger.warn(`${snapshot.job_history_id} - source snapshot deleted before being set to 'deleting' status`);
            }
            snapshot.source_host_status = code;
        } else if (snapshot.target_host_id === host_id) {
            if (snapshot.target_host_status !== 5) {
                logger.warn(`${snapshot.job_history_id} - target snapshot deleted before being set to 'deleting' status`);
            }
            snapshot.target_host_status = code;
        }

        await uow.snapshots_repository.updateSnapshotEntry(snapshot);
        return reply({status: 'success'});
    } catch (err) {
        logger.error(`${job_history_id} - Processing destroy_complete failed.`);
        logger.error(err);

        return reply(Boom.badImplementation('destroy_complete failed.'));
    }
}

const handlers = {
    destroy_complete: destroy_complete
};

module.exports = { routes: routes, handlers: handlers };
