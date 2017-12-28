'use strict';

const Config = require('./config');
const Hapi = require('hapi');

const winston = require('winston');
require('winston-daily-rotate-file');

const JobManager = require('./jobs/job_manager');
const RetentionManager = require('./retention/retention_manager');
const DatacenterApisManager = require('./datacenter_managers/index');
const UoW = require('./db');
const AgentApi = require('./agent_api');
const CnApi = require('./cn_api');

// Create a server with a host and port
const server = new Hapi.Server({});
server.connection({
    host: Config.host,
    port: Config.port
});

server.app.config = Config;

const log_directory = Config.log_directory;

const app_file_transport = new (winston.transports.DailyRotateFile)({
    name: 'file_transport',
    filename: `${log_directory}/log`,
    datePattern: 'controller-app-yyyy-MM-dd.',
    prepend: true,
    level: Config.app_file_log_level,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: false
});

const app_json_transport = new (winston.transports.DailyRotateFile)({
    name: 'json_transport',
    filename: `${log_directory}/log`,
    datePattern: 'controller-json-yyyy-MM-dd.',
    prepend: true,
    level: Config.app_json_log_level,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: true
});

const trace_file_transport = new (winston.transports.DailyRotateFile)({
    filename: `${log_directory}/log`,
    datePattern: 'controller-trace-yyyy-MM-dd.',
    prepend: true,
    level: Config.trace_log_level,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: true
});

const console_transport = new (winston.transports.Console)({
    prepend: true,
    level: Config.stdout_log_level,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: false,
    colorize: true
});

const app_logger = new (winston.Logger)({
    transports: [
        app_file_transport,
        app_json_transport,
        console_transport
    ]
});

const trace_logger = new (winston.Logger)({
    transports: [
        trace_file_transport,
        console_transport
    ]
});

server.app.logger = app_logger;
server.app.trace_logger = trace_logger;

server.register({
    register: require('./api')
}, {
    routes: {
        prefix: '/api'
    }
}, (err) => {
    if (err) {
        app_logger.error(err);
    }
});

//make sure unhandled exceptions are logged
server.on('request-error', (request, response) => {
    request.server.app.logger.error('Global error caught');
    request.server.app.logger.error(response);
});

server.ext({
    type: 'onPreResponse',
    method: async (request, reply) => {
        const response = request.response;

        if (response.isBoom) {
            request.server.app.trace_logger.info({
                path: request.route.path,
                method: request.route.method,
                fingerprint: request.route.fingerprint,
                code: response.output.statusCode,
                payload: response.output.payload
            });
        } else {
            request.server.app.trace_logger.info({
                path: request.route.path,
                method: request.route.method,
                fingerprint: request.route.fingerprint,
                code: response.statusCode,
                payload: response.payload
            });
        }

        await reply.continue();
    }
});

server.ext({
    type: "onRequest",
    method: async (request, reply) => {
        request.app.uows = [];
        request.app.cnapis = [];

        request.app.getNewUoW = async () => {
            const uow = new UoW(server.app.logger);
            request.app.uows.push(uow);
            return uow;
        };

        request.app.getNewCnApi = async () => {
            const cnapi = new CnApi(Config, server.app.logger);
            request.app.cnapis.push(cnapi);
            return cnapi;
        }

        await reply.continue();
    }
});

// if (!Config.db_logging) {
//     server.app.db._db.sequelize.options.logging = false;
// }

server.start(err => {
    if (err) {
        app_logger.error(err);
        throw err;
    }
    app_logger.info('Server running at:', server.info.uri);
});


const agent_api = new AgentApi(Config, server.app.logger);

server.app.agent_api = agent_api;

const uow = new UoW(server.app.logger);

if (Config.run_job_manager) {
    const retention_manager = new RetentionManager(server.app.logger);

    const job_manager = new JobManager(server.app.logger, uow, Config.job_interval, Config.retention_interval, agent_api, retention_manager);
    job_manager.start();
}

const datacenter_manager = new DatacenterApisManager(uow, Config);
datacenter_manager.start();

module.exports = server;
