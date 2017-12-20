const moment = require('moment');


exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('hosts').del()
    .then(function () {
      // Inserts seed entries
      return knex('hosts').insert([
        { 
          id: 'd08a1f76-7c4a-4dd9-a377-83ffffa752f4', 
          name: 'agent-1', 
          ip_address: '192.168.1.2', 
          port: 3000,
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        { 
          id: '13e5fca8-4bb5-4f48-a91d-9c25df923ae8', 
          name: 'agent-2', 
          ip_address: '192.168.1.3', 
          port: 3000,
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        }
      ]);
    });
};
