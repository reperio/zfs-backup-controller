/* eslint max-depth: 0 */

const _ = require('lodash');
const Config = require('../config');

const fs = require('fs');
const Handlebars = require('handlebars');
const moment = require('moment');
const nodemailer = require('nodemailer');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const winston = require('winston');
require('winston-daily-rotate-file');

console.log('Starting Platform Monitor');

const app_file_transport = new (winston.transports.DailyRotateFile)({
    name: 'file_transport',
    filename: `${Config.log_directory}/log`,
    datePattern: 'controller-app-yyyy-MM-dd.',
    prepend: true,
    level: Config.app_file_log_level,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: false
});

const app_json_transport = new (winston.transports.DailyRotateFile)({
    name: 'json_transport',
    filename: `${Config.log_directory}/log`,
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

    const SUCCESS_COLOR = '#5BAF46';
    const FAILED_COLOR = '#C62B31';
    const MISSED_COLOR = '#4178B7';

    const get_html_status_message = function(dataset) {
        if (dataset.job_id == null) {
            return 'MISSING JOB';
        }

        if (!dataset.job_enabled) {
            return `${dataset.last_execution == null? '' : moment(dataset.last_execution).format('MM/DD/YYYY hh:mm A') + ' - '}JOB DISABLED`;
        }

        let color = null;
        let status_text = null;
        switch (dataset.status) {
            case 1:
                status_text = 'SUCCESS';
                color = SUCCESS_COLOR;
                break;
            case 2:
                status_text = 'MISSED';
                color = MISSED_COLOR;
                break;
            case 3:
                status_text = 'FAILED';
                color = FAILED_COLOR;
                break;
            default:
                status_text = 'FAILED';
                color = FAILED_COLOR;
                break;
        }

        return `${dataset.last_execution == null? 'Never' : moment(dataset.last_execution).format('MM/DD/YYYY hh:mm A')} - <span style="color: ${color}">${status_text}</span>`;
    };

    const get_text_status_message = function(dataset) {
        if (dataset.job_id == null) {
            return 'MISSING JOB';
        }

        if (!dataset.job_enabled) {
            return `${dataset.last_execution == null? '' : moment(dataset.last_execution).format('MM/DD/YYYY hh:mm A') + ' - '}JOB DISABLED`;
        }

        let status_text = null;
        switch (dataset.status) {
            case 1:
                status_text = 'SUCCESS';
                break;
            case 2:
                status_text = 'MISSED';
                break;
            case 3:
                status_text = 'FAILED';
                break;
            default:
                status_text = 'FAILED';
                break;
        }

        return `${dataset.last_execution == null? 'Never' : moment(dataset.last_execution).format('MM/DD/YYYY hh:mm A')} - ${status_text}`;
    };

    const all_dataset_jobs = [];
    dataset_status.map(x => {
        if (x.status !== 0) {
            x.status_message = get_html_status_message(x);
            x.text_status_message = get_text_status_message(x);
            x.last_successful_backup = moment(x.last_successful_backup).format('MM/DD/YYYY hh:mm:ss A') || 'Never';
            x.last_execution_date = moment(x.last_execution).format('MM/DD/YYYY hh:mm A');
            all_dataset_jobs.push(x);
        }
    });

    const failed_jobs = _.filter(all_dataset_jobs, job => {
        return job.dataset_enabled && job.job_enabled && (job.last_result === 3 && job.ran_within_previous_period === 1);
    });

    const start_time = moment().utc().subtract(1, 'hour');
    const stuck_jobs = _.filter(all_dataset_jobs, job => {
        return job.job_enabled && start_time > moment(job.last_execution) && (job.last_result === 1 || job.last_result === 0);
    });

    const missed_jobs = _.filter(all_dataset_jobs, job => {
        return job.job_enabled && job.ran_within_previous_period === 0;
    });

    const groupByHost = function (data) {
        return _(_.orderBy(data, ['host_name', 'virtual_machine_name', 'dataset_name']))
            .groupBy(x => x.host_name)
            .map((value, key) => ({name: key, jobs: value}))
            .value();
    };

    const data = {
        all_jobs: {
            hosts: groupByHost(all_dataset_jobs)
        },
        failed_jobs: {
            hosts: groupByHost(failed_jobs)
        },
        stuck_jobs: {
            hosts: groupByHost(stuck_jobs)
        },
        missed_jobs: {
            hosts: groupByHost(missed_jobs)
        },
        has_failed_jobs: failed_jobs.length > 0 ? true : false,
        has_stuck_jobs: stuck_jobs.length > 0 ? true : false,
        has_missed_jobs: missed_jobs.length > 0 ? true : false,
        message: `There have been ${failed_jobs.length} failed jobs, ${stuck_jobs.length} stuck jobs, and ${missed_jobs.length} missed jobs in the past day.`,
        short_date: moment().format('MM/DD/YYYY'),
        full_date: moment().format('MM/DD/YYYY hh:mm:ss A')
    };

    const reportTemplate = fs.readFileSync(path.join(__dirname, 'template.html'), 'utf-8');
    const template = Handlebars.compile(reportTemplate.split('\n').join(''), {noEscape: true});

    const html = template(data);

    const pad = function (str, l, c = null) {
        let paddedStr = str;
        while (paddedStr.length < l) {
            paddedStr += c || ' ';
        }
        return paddedStr;
    };

    let text = `Backup Status Report - ${data.short_date}\n${data.message}`;

    // failed jobs
    if (data.has_failed_jobs) {
        const failed_table_header = `\n\nFAILED JOBS\n${pad('Host', 16)}\t${pad('Virtual Machine', 25)}\t${pad('Dataset', 15)}\t${pad('Last Operation', 25)}\t${pad('Last Backup', 0)}`;
        text += `\n${failed_table_header}\n${pad('', failed_table_header.length, '-')}`;
        _.each(failed_jobs, job => {
            text += `\n${pad(job.host_name, 16)}\t${pad(job.virtual_machine_name, 25)}\t${pad(job.dataset_name, 15)}\t${pad(job.text_status_message, 25)}\t${pad(job.last_successful_backup, 0)}`;
        });
    }

    // stuck jobs
    if (data.has_stuck_jobs) {
        const stuck_table_header = `\n\nSTUCK JOBS\n${pad('Host', 16)}\t${pad('Virtual Machine', 25)}\t${pad('Dataset', 15)}\t${pad('Started', 25)}`;
        text += `\n${stuck_table_header}\n${pad('', stuck_table_header.length, '-')}`;
        _.each(stuck_jobs, job => {
            text += `\n${pad(job.host_name, 16)}\t${pad(job.virtual_machine_name, 25)}\t${pad(job.dataset_name, 15)}\t${pad(job.last_execution_date, 25)}`;
        });
    }

    // missed jobs
    if (data.has_missed_jobs) {
        const missed_table_header = `\n\nMISSED JOBS\n${pad('Host', 16)}\t${pad('Virtual Machine', 25)}\t${pad('Dataset', 15)}\t${pad('Last Operation', 25)}`;
        text += `\n${missed_table_header}\n${pad('', missed_table_header.length, '-')}`;
        _.each(missed_jobs, job => {
            text += `\n${pad(job.host_name, 16)}\t${pad(job.virtual_machine_name, 25)}\t${pad(job.dataset_name, 15)}\t${pad(job.text_status_message, 25)}`;
        });
    }

    // all jobs
    const all_table_header = `\n\nALL JOBS\n${pad('Host', 16)}\t${pad('Virtual Machine', 25)}\t${pad('Dataset', 15)}\t${pad('Last Operation', 25)}`;
    text += `\n${all_table_header}\n${pad('', all_table_header.length, '-')}`;
    _.each(all_dataset_jobs, job => {
        text += `\n${pad(job.host_name, 16)}\t${pad(job.virtual_machine_name, 25)}\t${pad(job.dataset_name, 15)}\t${pad(job.text_status_message, 25)}`;
    });

    text += `\n\nGenerated: ${data.full_date}\nReper.io / 513-780-5960 / support@reper.io`;

    //send email
    app_logger.info('sending email(s)...');
    const addresses = [].concat(Config.notification_email.to);
    if (Config.notification_email.method === 'sendgrid') {
    
        sgMail.setApiKey(Config.notification_email.send_grid_api_key);
        
        try {
            for (let i = 0; i < addresses.length; i++) {
                const msg = {
                    to: addresses[i],
                    from: Config.notification_email.from,
                    subject: `ZFS Backup Report - ${data.short_date}`,
                    text: text,
                    html: html
                };
                await sgMail.send(msg);
            }
            app_logger.info('email(s) sent');
        } catch (err) {
            console.error(err);
        }
    } else if (Config.notification_email.method === 'smtp') {
        const transporterOptions = {
            host: this.config.email.smtpHost,
            port: parseInt(this.config.email.smtpPort),
            secure: parseInt(this.config.email.smtpPort) === 465 ? true : false, // true for 465, false for other ports
            tls: {
                rejectUnauthorized: this.config.email.rejectUnauthorizedTLS
            }
        };

        // add auth to smtp transporter if it was configured
        if (this.config.email.smtpUser && this.config.email.smtpPassword) {
            transporterOptions.auth = {
                user: this.config.email.smtpUser,
                password: this.config.email.smtpPassword
            };
        }

        // create smtp transporter object
        this.transporter = nodemailer.createTransport(transporterOptions);

        for (let i = 0; i < addresses.length; i++) {
            const msg = {
                to: addresses[i],
                from: Config.notification_email.from,
                subject: `ZFS Backup Report - ${data.short_date}`,
                text: text,
                html: html
            };

            this.transporter.sendMail(msg, (error, info) => {
                if (error) {
                    this.logger.error(error);
                    this.logger.error(info);
                } else {
                    this.logger.debug(info);
                }
            });
        }
    } else {
        throw new Error('Notification email method not defined');
    }

    process.exit(0);
};

start();
