'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/job_histories',
    handler: getAllJobHistories,
    config: {
        cors: true,
        validate: {
            query: {
                host_id: Joi.string().optional(),
                virtual_machine_id: Joi.string().optional()
            }
        }
    }
});

async function getAllJobHistories(request, reply) {
    const uow = await request.app.getNewUoW();

    uow._logger.info(`Fetching job history: ${JSON.stringify(request.query)}`);

    try {
        const job_histories = await uow.job_history_repository.getAllJobHistories(request.query.host_id, request.query.virtual_machine_id);

        return reply(job_histories);
    } catch (err) {
        uow._logger.error(err);
        return reply(Boom.badImplementation('failed to retrieve job histories'));
    }
}


module.exports = routes;