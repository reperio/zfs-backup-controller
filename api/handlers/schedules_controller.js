'use strict';
/* eslint no-use-before-define: 0*/

const Boom = require('boom');

const routes = [];

routes.push({
    method: ['GET'],
    path: '/schedules',
    handler: getAllSchedules,
    config: {
        cors: true
    }
});

async function getAllSchedules(request, reply) {
    const uow = await request.app.getNewUoW();

    try {
        const schedules = await uow.schedules_repository.getAllSchedules();

        return reply(schedules);
    } catch (err) {
        return reply(Boom.badImplementation('failed to retrieve schedules'));
    }
}

module.exports = { routes: routes };
