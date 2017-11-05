var env = process.env.NODE_ENV || 'development'

var config_name = "config-" + env;
console.log('loading ' + config_name);
//load the correct config based on the node env
var config = require("./" + config_name);

module.exports = config;


