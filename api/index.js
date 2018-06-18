'use strict';
const ZFSControllerHandlers = require('./handlers/zfs_controller');
const HostControllerHandlers = require('./handlers/host_controller');
const JobControllerHandlers = require('./handlers/job_controller');
const JobDetailsControllerHandlers = require('./handlers/job_details_controller');
const JobHistoryControllerHandlers = require('./handlers/job_history_controller');
const ScheduleControllerHandlers = require('./handlers/schedules_controller');
const SnapshotsControllerHandlers = require('./handlers/snapshot_controller');
const DashboardControllerHandlers = require('./handlers/dashboard_controller');
const VirtualMachinesControllerHandlers = require('./handlers/virtual_machines_controller');
const VirtualMachineDatasetControllerHandlers = require('./handlers/virtual_machine_datasets_controller');


exports.register = function (server, options, next) {
    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply({message: 'hello', status: 'success'});
        }
    });

    server.route({
        method: 'OPTIONS',
        path: '/{p*}',
        config: {
            handler: function(request, reply) {
                const response = reply();
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
                return response;
            },
            cors: true
        }
    });

    server.route(ZFSControllerHandlers.routes);
    server.route(HostControllerHandlers.routes);
    server.route(JobControllerHandlers.routes);
    server.route(JobDetailsControllerHandlers.routes);
    server.route(JobHistoryControllerHandlers.routes);
    server.route(ScheduleControllerHandlers.routes);
    server.route(SnapshotsControllerHandlers.routes);
    server.route(DashboardControllerHandlers.routes);
    server.route(VirtualMachinesControllerHandlers.routes);
    server.route(VirtualMachineDatasetControllerHandlers.routes);
    
    next();
};

exports.register.attributes = {
    name: 'apiPlugin',
    version: '1.0.0'
};
