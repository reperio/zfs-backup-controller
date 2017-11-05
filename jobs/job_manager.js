const _ = require('lodash');
const moment = require('moment');
const async = require('async');

class JobManager {
	constructor(logger, db, interval) {
		this.logger = logger;
		this.db = db;

		this.interval_id = null;
		this.interval = interval;
	}

	//starts the execution loop
	start() {
		const self = this;
		this.interval_id = setInterval(() => self.execute(), this.interval);
	}

	//main execution of the job manager, finds and executes jobs
	async execute() {
		const self = this;
		this.logger.info('');
		this.logger.info('executing');

		const jobs = await this. fetch_jobs();
		const filtered_jobs = await this.filter_eligible_jobs(jobs);
		const result = await this.execute_jobs(filtered_jobs);
	}

	async fetch_jobs() {
		this.logger.info('fetching jobs');
		const jobs = await this.db.jobs_repository.getAllJobs();
		return jobs;
	}

	async filter_eligible_jobs(jobs) {
		this.logger.info(`filtering ${jobs.length} jobs`);

		const now = moment();
		return _.filter(jobs, function(job) {
			const last_execution = moment(job.last_execution);
			const difference = now.diff(last_execution, 'minutes');

			return difference >= job.schedule.minutes || !job.last_execution;
		});
	}

	async execute_jobs(jobs) {
		this.logger.info(`executing ${jobs.length} jobs`);
		this.logger.info(_.map(jobs, 'id'));

		for (let index = 0 ; index < jobs.length ; ++index) {
			const current_job = jobs[index];

			try {
				this.logger.info(`${current_job.id} - Job starting.`);
				const job_result = await this.execute_job(current_job);
				this.logger.info(`${current_job.id} - Job finished.`);
			} catch (err) {
				this.logger.error(`${current_job.id} - Job failed to execute.`)
				this.logger.error(err);
			}
		}
	}

	async execute_job(job) {
		this.logger.info(`  ${job.id} - Executing.`);
		const now = new Date();

		//update last execution on job
		this.logger.info(`  ${job.id} - Updated job last execution.`);
		await job.update({last_execution: now});
		this.logger.info(`  ${job.id} - Job Updated.`);

		this.logger.info(`  ${job.id} - Creating Job History entry.`);
		//create job history record
		const job_history = await this.db.jobs_repository.create_job_history({
			job_id: job.id,
	        start_date_time: now,
	        end_date_time: null,
	        result: 0,
	        source_message: null,
	        target_message: null,
	        source_result: 0,
	        target_result: 0,
	        port: 1234,
		});

		if (!job_history) {
			throw new Error('Failed to create job history entry.');
		}

		this.logger.info(`  ${job.id} | ${job_history.id} - Job history entry created.`);

		try {
			this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Receive command to target ${job.target_host.ip_address}.`);
			//request zfs receive

			this.logger.info(`  ${job.id} | ${job_history.id} - ZFS Receive command sent.`);

			//update job history record
			this.logger.info(`  ${job.id} | ${job_history.id} - Updating job history entry.`);
			await job_history.update({target_message: 'test', target_result: 1});
			this.logger.info(`  ${job.id} | ${job_history.id} - Job history entry updated.`);
		} catch (err) {
			this.logger.error(`  ${job.id} | ${job_history.id} - Failed to start zfs receive on target`);
			throw err;
		}

		try {
			this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Send command to source ${job.source_host.ip_address}.`);
			//request zfs send

			this.logger.info(`  ${job.id} | ${job_history.id} - ZFS Send command sent.`);

			//update job history record
			this.logger.info(`  ${job.id} | ${job_history.id} - Updating job history entry.`);
			await job_history.update({source_message: 'test', source_result: 1, result: 1});
			this.logger.info(`  ${job.id} | ${job_history.id} - Job history entry updated.`);
		} catch(err) {
			this.logger.error(`  ${job.id} | ${job_history.id} - Failed to start zfs send on source`);
			throw err;
		}
	}
}

module.exports = JobManager;


/* Proposed status codes
* job history: 0 = pending, 1 = started (both receive and send commands executed), 2 = complete (send and receive commands confirmed), 3 = failed
* source_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
* target_result: 0 = pending, 1 = started, 2 = complete, 3 = failed
*/