const moment = require('moment');

exports.seed = function(knex, Promise) {
  // Deletes ALL existing entries
  return knex('job_history').del()
    .then(function () {
      // Inserts seed entries
      return knex('job_history').insert([
        { 
          id: 'e714e0ed-9e83-4421-8058-1232024c7e50',
          job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
          start_date_time: moment().utc().toDate(),
          end_date_time: moment().utc().toDate(),
          schedule_date_time: moment().utc().toDate(),
          result: 3,
          source_message: '',
          target_message: '',
          source_result: 2,
          target_result: 3,
          port: 57495,
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        { 
          id: 'e714e0ed-9e83-4421-8058-1232024c7e51',
          job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
          start_date_time: moment().utc().toDate(),
          end_date_time: moment().utc().toDate(),
          schedule_date_time: moment().utc().toDate(),
          result: 3,
          source_message: '',
          target_message: '',
          source_result: 2,
          target_result: 3,
          port: 57495,
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        { 
          id: 'a0e798c7-b553-46f7-9670-c361d8e4cead',
          job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
          start_date_time: moment().utc().toDate(),
          end_date_time: moment().utc().toDate(),
          schedule_date_time: moment().utc().toDate(),
          result: 2,
          source_message: '',
          target_message: '',
          source_result: 2,
          target_result: 2,
          port: 57495,
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        },
        { 
          id: 'a0e798c7-b553-46f7-9670-c361d8e4cea3',
          job_id: 'b21d3b67-4e78-4b2c-8169-5891520048a8',
          start_date_time: moment().utc().toDate(),
          end_date_time: moment().utc().toDate(),
          schedule_date_time: moment().utc().toDate(),
          result: 1,
          source_message: '',
          target_message: '',
          source_result: 2,
          target_result: 2,
          port: 57495,
          createdAt: moment().utc().toDate(),
          updatedAt: moment().utc().toDate()
        }
      ]);
    });
};
