const assert = require('assert');

const cn_api = require('../cn_api');
const Config = require('../config');

const logger = {
     info: function(txt) { },
     error: function(txt) { }
};

const cnapi = new cn_api(Config, logger);

describe("cn_api tests", function() {

    it('retrieves server definitions', async () => {
        const servers = await cnapi.getAllServers();
        assert.notEqual(servers, null);
    });

    it('retrieves definitions for server "00000000-0000-0000-0000-0cc47a03ef76"', async ()=> {
        const server = await cnapi.getServerRecord("00000000-0000-0000-0000-0cc47a03ef76");
        assert.notEqual(server, null);
    });
});