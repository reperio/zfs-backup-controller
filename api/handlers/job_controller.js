'use strict';

const Boom = require('boom');
const Joi = require('joi');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/jobs',
    handler: getAllJobs,
    config: {
        cors: true
    }
});

async function getAllJobs(request, reply){
    const logger = request.server.app.logger;
    const uow = await request.app.getNewUoW();

    try {
        const jobs = await uow.jobs_repository.getAllJobs();

        return reply(jobs);
    } catch (err) {
        return reply(Boom.badImplementation('failed to retrieve jobs.'));
    }
}

module.exports = routes;