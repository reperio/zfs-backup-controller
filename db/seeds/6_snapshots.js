const moment = require('moment');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('snapshots').del()
    .then(function () {
      // Inserts seed entries
      return knex('snapshots').insert([
        {
          job_history_id: 'e714e0ed-9e83-4421-8058-1232024c7e50',
          name: 'dev1@201711202149',
          source_host_id: 'd08a1f76-7c4a-4dd9-a377-83ffffa752f4',
          source_host_status: 1,
          target_host_id: '13e5fca8-4bb5-4f48-a91d-9c25df923ae8',
          target_host_status: 5,
          snapshot_date_time: moment().utc().toDate(),
          job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        }
      ]);
    });
};
