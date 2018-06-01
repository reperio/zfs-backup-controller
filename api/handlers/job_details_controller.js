'use strict';
/* eslint no-use-before-define: 0*/

const Boom = require('boom');

const routes = [];

routes.push({
    method: ['POST'],
    path: '/job_details',
    handler: getAllJobDetails,
    config: {
        cors: true
    }
});

async function getAllJobDetails(request, reply) {
    const uow = await request.app.getNewUoW();

    try {
        const jobs = uow.job_details_repository.getAllJobDetails(request.payload);

        return reply(jobs);
    } catch (err) {
        uow._logger.error(err);
        return reply(Boom.badImplementation('failed to retrieve jobs.'));
    }
}

module.exports = routes;
