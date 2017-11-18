const env = process.env.NODE_ENV || 'development';

const config_name = `config-${env}`;

console.log(`loading ${config_name}`);

const config = require(`./${config_name}`);

module.exports = config;
