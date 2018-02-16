'use strict';
const ZFSControllerHandlers = require('./handlers/zfs_controller');
const HostControllerHandlers = require('./handlers/host_controller');
const JobControllerHandlers = require('./handlers/job_controller');
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

    server.route(ZFSControllerHandlers);
    server.route(HostControllerHandlers);
    server.route(JobControllerHandlers);
    server.route(JobHistoryControllerHandlers);
    server.route(ScheduleControllerHandlers);
    server.route(SnapshotsControllerHandlers);
    server.route(DashboardControllerHandlers);
    server.route(VirtualMachinesControllerHandlers);
    server.route(VirtualMachineDatasetControllerHandlers);
    
    next();
};

exports.register.attributes = {
    name: 'apiPlugin',
    version: '1.0.0'
};
