const _ = require('lodash');
const Config = require('../config');

const moment = require('moment');
const sgMail = require('@sendgrid/mail');
const winston = require('winston');
require('winston-daily-rotate-file');

console.log('Starting Platform Monitor');

const log_directory = '../logs';

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

const console_transport = new (winston.transports.Console)({
    prepend: true,
    level: Config.stdout_log_level,
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

const CreateUow = require('../db')(app_logger);

const uow = CreateUow(app_logger);
const start = async function() {
    app_logger.info('Fetching dataset statuses from the database...');
    const dataset_status = await uow.dataset_status_repository.get_dataset_status();

    app_logger.info('generating report...');
    // failed and missed jobs
   
    const failed_jobs = _.filter(dataset_status, status => {
        return status.dataset_enabled && (status.last_result === 3 || status.ran_within_previous_period === 0);
    });
    app_logger.warn(`failed or missed jobs: ${failed_jobs.length}`);
    let failed_jobs_text = `Failed Jobs: ${failed_jobs.length}\n`;
    let failed_jobs_html = [];

    for (let i = 0; i < failed_jobs.length; i++) {
        let message = 'n/a';
        if (failed_jobs[i].last_result === 3 && failed_jobs[i].ran_within_previous_period === 1) {
            message = 'Last run failed';
        } else if (failed_jobs[i].ran_within_previous_period === 0) {
            message = 'Missed last scheduled backup';
        }
        
        failed_jobs_text += `\t${failed_jobs[i].job_name} - ${message}\n`;
        failed_jobs_html.push(`<tr>
                                <td style="padding-right: 10px; padding-left: 10px;">${failed_jobs[i].job_name}</td>
                                <td style="padding-right: 10px; padding-left: 10px;">${message}</td>
                                <td style="padding-right: 10px; padding-left: 10px;">${failed_jobs[i].last_successful_backup === null ? '' : moment(failed_jobs[i].last_successful_backup).format('LLL')}</td>
                            </tr>`);
    }

    // jobs running longer than an hour
    const start_time = moment().utc().subtract(1, 'hour');
    
    const stuck_jobs = _.filter(dataset_status, status => {
        return start_time > moment(status.last_execution) && (status.last_result === 1 || status.last_result === 0);
    });
    app_logger.warn(`jobs running longer than an hour: ${stuck_jobs.length}`);
    let stuck_jobs_text = `Stuck Jobs: ${stuck_jobs.length}`;
    let stuck_jobs_html = [];
    
    for (let i = 0; i < stuck_jobs.length; i++) {
        stuck_jobs_text += `\t${stuck_jobs[i].job_name}\n`;
        stuck_jobs_html.push(`<tr>
                                <td style="padding-right: 10px; padding-left: 10px;">${stuck_jobs[i].job_name}</td>
                                <td style="padding-right: 10px; padding-left: 10px;">${failed_jobs[i].last_execution === null ? '' : moment(failed_jobs[i].last_execution).format('LLL')}</td>
                            </tr>`);
    }

    // uprotected nodes or virtual machines
    const unprotected_datasets = _.filter(dataset_status, status => {
        return status.dataset_enabled === true && (status.job_id === null || status.job_enabled !== true || status.num_successful_backups <= 0);
    });

    let unprotected_nodes_text = 'Unprotected Nodes:\n';
    let unprotected_nodes_html = [];
    
    let previous_host_sdc_id = null;
    let previous_virtual_machine_id = null;
    _.each(unprotected_datasets, dataset => {
        let message = '';
        if (dataset.last_result === 3 && dataset.ran_within_previous_period === 1) {
            message = 'Last run failed';
        } else if (dataset.job_id === null) {
            message = 'No defined job';
        } else if (dataset.ran_within_previous_period === 0) {
            message = 'Missed last scheduled backup';
        } 

        if (previous_host_sdc_id !== dataset.host_sdc_id) {
            unprotected_nodes_html.push(`<tr class="host">
                                            <td style="padding-right: 10px; padding-left: 10px;">${dataset.host_name}</td>
                                        </tr>`);
            previous_host_sdc_id = dataset.host_sdc_id;
        }

        if (previous_virtual_machine_id !== dataset.virtual_machine_id) {
            unprotected_nodes_html.push(`<tr class="virtual-machine">
                                            <td style="padding-right: 10px; padding-left: 10px; padding-left:2em">${dataset.virtual_machine_name}</td>
                                        </tr>`);
            previous_virtual_machine_id = dataset.virtual_machine_id;
        }

        unprotected_nodes_text += `${dataset.host_name} - ${dataset.virtual_machine_name} - ${dataset.dataset_name} - ${message} - ${dataset.last_successful_backup === null ? 'n/a' : moment(dataset.last_successful_backup).format('LLL')}`;
        unprotected_nodes_html.push(`<tr class="dataset">
                                        <td style="padding-right: 10px; padding-left: 10px; padding-left:4em">\t\t${dataset.dataset_name}</td>
                                        <td>${message}</td>
                                        <td>${dataset.last_successful_backup === null ? '' : moment(dataset.last_successful_backup).format('LLL')}</td>
                                    </tr>`);
    });

    // send email
    const body_text = failed_jobs_text + '\n' + stuck_jobs_text + '\n' + unprotected_nodes_text;
    const body_html = `<div>
                            <h3>Failed Jobs: ${failed_jobs.length}</h3>
                            <table style="border-spacing: 0px;">
                                <thead>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Job</th>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Message</th>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Last Successful Backup</th>
                                </thead>
                                <tbody style="tr:nth-child(even) { background-color: #D3D3D3; }">
                                    ${failed_jobs_html.join('\n')}
                                </tbody>
                            </table>

                            <h3>Stuck Jobs: ${stuck_jobs.length}</h3>
                            <table style="border-spacing: 0px;">
                                <thead>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Job</th>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Start Time</th>
                                </thead>
                                <tbody style="tr:nth-child(even) { background-color: #D3D3D3; }">
                                    ${stuck_jobs_html.join('\n')}
                                </tbody>
                            </table>

                            <h3>Uprotected Nodes</h3>
                            <table style="border-spacing: 0px;">
                                <thead>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Node</th>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Message</th>
                                    <th style="text-align: left; padding-right: 10px; padding-left: 10px; padding-left:4em">Last Successful Backup</th>
                                </thead>
                                <tbody>
                                    ${unprotected_nodes_html.join('\n')}
                                </tbody>
                            </table>
                        </div>`;

    app_logger.info('sending email...');
    sgMail.setApiKey(Config.notification_email.send_grid_api_key);
    const msg = {
        to: Config.notification_email.to,
        from: Config.notification_email.from,
        subject: 'Platform Monitor',
        text: body_text,
        html: body_html
    };

    await sgMail.send(msg);
    app_logger.info('email sent');

    process.exit(0);
};

start();
