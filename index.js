'use strict';

const Config = require('./config');
const Hapi = require('hapi');
const moment = require("moment");

const winston = require('winston');
require('winston-daily-rotate-file');

const JobManager = require('./jobs/job_manager');
const DataModel = require('./db');

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
    level: Config.log_level,
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

server.app.db = new DataModel(server.app.logger);

server.register({
    register: require("./api")
}, {
    routes: {
        prefix: "/api"
    }
}, (err) => {
    if (err) {
        console.error(err);
    }
});

//make sure unhandled exceptions are logged
server.on('request-error', (request, response) => {
    request.server.app.logger.error('Global error caught');
    request.server.app.logger.error(response);
});


server.ext({
    type: "onPreResponse",
    method: async (request, reply) => {
        const response = request.response;

        if (response.isBoom) {
            request.server.app.trace_logger.info({
                path:request.route.path, 
                method: request.route.method, 
                fingerprint: request.route.fingerprint, 
                code: response.output.statusCode,
                payload: response.output.payload
            });
        } else {
            request.server.app.trace_logger.info({
                path:request.route.path, 
                method: request.route.method, 
                fingerprint: request.route.fingerprint, 
                code: response.statusCode,
                payload: response.payload
            });
        }

        await reply.continue();
    }
});

if (!Config.db_logging) {
    server.app.db._db.sequelize.options.logging = false;
}

server.start(err => {
    if (err) {
    	console.log(err);
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

const job_manager = new JobManager(server.app.logger, server.app.db, Config.job_interval);
job_manager.start();

module.exports = server;
