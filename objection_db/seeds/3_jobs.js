const moment = require('moment');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('jobs').del()
    .then(function () {
      // Inserts seed entries
      return knex('jobs').insert([
        {
          id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
          name: '',
          offset: 0,
          schedule_id: '13360957-3fc2-4533-8860-dd79f7c04e37',
          source_location: 'dev1',
          target_location: 'dev1',
          zfs_type: 1,
          zfs_size: 5,
          source_host_id: 'd08a1f76-7c4a-4dd9-a377-83ffffa752f4',
          target_host_id: '13e5fca8-4bb5-4f48-a91d-9c25df923ae8',
          last_execution: moment().utc().toDate(),
          last_schedule: moment().utc().toDate(),
          enabled: 1, 
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        }
      ]);
    });
};
