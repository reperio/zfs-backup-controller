'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['POST'],
    path: '/job_histories',
    handler: getAllJobHistories,
    config: {
        cors: true
    }
});

async function getAllJobHistories(request, reply) {
    const uow = await request.app.getNewUoW();

    uow._logger.info(`Fetching job history: ${JSON.stringify(request.payload)}`);

    try {
        const job_histories = await uow.job_history_details_repository.getAllJobHistoryDetails(request.payload);

        return reply(job_histories);
    } catch (err) {
        uow._logger.error(err);
        return reply(Boom.badImplementation('failed to retrieve job histories'));
    }
}


module.exports = { routes: routes };
