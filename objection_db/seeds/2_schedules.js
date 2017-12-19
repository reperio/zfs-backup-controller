const moment = require('moment');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('schedules').del()
    .then(function () {
      // Inserts seed entries
      return knex('schedules').insert([
        {
          id: '13360957-3fc2-4533-8860-dd79f7c04e37',
          name: 'quarter_hour',
          display_name: 'Every 15 minutes',
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        {
          id: '320e5ceb-389a-44ac-a47d-09ff9f15e2ad',
          name: 'hourly',
          display_name: 'Hourly',
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        {
          id: '3eb86528-b866-4faa-9453-a21de08ed79d',
          name: 'weekly',
          display_name: 'Weekly',
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        {
          id: '445c5e9d-72ee-43f6-8fc8-273ede287e95',
          name: 'monthly',
          display_name: 'Monthly',
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        {
          id: '13360957-3fc2-4533-8860-dd79f7c04e39',
          name: 'daily',
          display_name: 'Daily',
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        }
      ]);
    });
};
