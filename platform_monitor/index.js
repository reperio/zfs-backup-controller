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
        failed_jobs_html.push(`<tr ${i % 2 === 0 ? 'style="background-color: #d4d4d4;"' : ''}>
                                <td align="left">${failed_jobs[i].job_name}</td>
                                <td align="left">${message}</td>
                                <td align="left">${failed_jobs[i].last_successful_backup === null ? '' : moment(failed_jobs[i].last_successful_backup).format('LLL')}</td>
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
        stuck_jobs_html.push(`<tr ${i % 2 === 0 ? 'style="background-color: #d4d4d4;"' : ''}>
                                <td align="left">${stuck_jobs[i].job_name}</td>
                                <td align="left">${failed_jobs[i].last_execution === null ? '' : moment(failed_jobs[i].last_execution).format('LLL')}</td>
                            </tr>`);
    }

    // uprotected nodes or virtual machines
    const unprotected_datasets = _.filter(dataset_status, status => {
        return status.dataset_enabled === true && (status.job_id === null || status.job_enabled !== true || status.num_successful_backups <= 0);
    });

    let unprotected_nodes_text = 'Unprotected Nodes:\n';
    let unprotected_nodes_html = '';


    const unprotected_nodes = _.uniqBy(unprotected_datasets, 'host_sdc_id');

    for (let i = 0; i < unprotected_nodes.length; i++) {
        unprotected_nodes_html += `<li><span>${unprotected_nodes[i].host_name}</span><ul>`;

        const node_virtual_machines = _.uniqBy(_.filter(unprotected_datasets, dataset => {
            return dataset.host_sdc_id === unprotected_nodes[i].host_sdc_id;
        }), 'virtual_machine_id');

        for (let j = 0; j < node_virtual_machines.length; j++) {
            unprotected_nodes_html += `<li><span>${node_virtual_machines[j].virtual_machine_name}</span><ul>`;

            const virtual_machine_datasets = _.filter(unprotected_datasets, dataset => {
                return dataset.virtual_machine_id === node_virtual_machines[j].virtual_machine_id;
            });

            for (let k = 0; k < virtual_machine_datasets.length; k++) {    
                let message = '';
                if (virtual_machine_datasets[k].last_result === 3 && virtual_machine_datasets[k].ran_within_previous_period === 1) {
                    message = 'Last run failed';
                } else if (virtual_machine_datasets[k].job_id === null) {
                    message = 'No defined job';
                } else if (virtual_machine_datasets[k].ran_within_previous_period === 0) {
                    message = 'Missed last scheduled backup';
                }
                unprotected_nodes_html += `<li><table style="width: 100%"><tbody><td width="33%">${virtual_machine_datasets[k].dataset_name}</td><td width="33%">${message}</td><td width="33%">${virtual_machine_datasets[k].last_successful_backup === null ? '' : moment(virtual_machine_datasets[k].last_successful_backup).format('LLL')}</td></tbody></table></li>`;
            }

            unprotected_nodes_html += '</ul></li>';
        }

        unprotected_nodes_html += '</ul></li>';
    }

    // send email
    const body_text = failed_jobs_text + '\n' + stuck_jobs_text + '\n' + unprotected_nodes_text;
    const body_html = `<body>
                            <h3>Failed Jobs: ${failed_jobs.length}</h3>
                            <table width="100%" style="border-collapse: collapse;">
                                <thead>
                                    <th align="left">Job</th>
                                    <th align="left">Message</th>
                                    <th align="left">Last Successful Backup</th>
                                </thead>
                                <tbody>
                                    ${failed_jobs_html.join('\n')}
                                </tbody>
                            </table>

                            <h3>Stuck Jobs: ${stuck_jobs.length}</h3>
                            <table width="100%" style="border-collapse: collapse;">
                                <thead>
                                    <th align="left">Job</th>
                                    <th align="left">Start Time</th>
                                </thead>
                                <tbody>
                                    ${stuck_jobs_html.join('\n')}
                                </tbody>
                            </table>

                            <h3>Uprotected Nodes</h3>
                            <table style="width: 100%;">
                                <tbody>
                                    <th width="33%" align="left">Dataset</th>
                                    <th width="33%" align="left" style="padding-left: 6.4%;">Message</th>
                                    <th width="33%" align="left">Last Successful Backup</th>
                                </tbody>
                            </table>
                            <ul>
                                ${unprotected_nodes_html}
                            </ul>
                        </body>`;

    app_logger.info('sending email(s)...');
    
    sgMail.setApiKey(Config.notification_email.send_grid_api_key);
    

    try {
        const addresses = [].concat(Config.notification_email.to);

        for (let i = 0; i < addresses.length; i++) {
            const msg = {
                to: addresses[i],
                from: Config.notification_email.from,
                subject: 'Platform Monitor',
                text: body_text,
                html: body_html
            };
            await sgMail.send(msg);
        }
    } catch (err) {
        console.error(err);
    }
    app_logger.info('email(s) sent');

    process.exit(0);
};

start();
