'use strict';
const ZFSControllerHandlers = require('./handlers/zfs_controller');

exports.register = function (server, options, next) {

    server.route({
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply({message:'hello', status:'success'});
        }
    });

    server.route({
        method: 'OPTIONS',
        path: '/{p*}',
        config: {
            handler: function(request, reply) {
                var response = reply();
                response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
                response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
                return response;
            },
            cors: true
        }
    });

    server.route(ZFSControllerHandlers);
    
    next();
};

exports.register.attributes = {
    name: 'apiPlugin',
    version: '1.0.0'
};