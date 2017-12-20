'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/job_histories',
    handler: getAllJobHistories,
    config: {
        cors: true
    }
});

async function getAllJobHistories(request, reply) {
    const uow = await request.app.getNewUoW();

    try {
        const job_histories = await uow.job_history_repository.getAllJobHistories();

        return reply(job_histories);
    } catch (err) {

        return reply(Boom.badImplementation('failed to retrieve job histories'));
    }
}


module.exports = routes;