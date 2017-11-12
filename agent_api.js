const request = require('request-promise-native');

class AgentApi {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
        this.urls = {
            zfs_create_snapshot: '/api/zfs/create_snapshot',
            zfs_destroy_snapshot: '/api/zfs/destroy_snapshot',
            zfs_send: '/api/zfs/send_snapshot',
            zfs_receive: '/api/zfs/receive_snapshot'
        };
    }

    async zfs_create_snapshot(job, job_history, snapshot_name, recursive) {
        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Create Snapshot command to source ${job.source_host.ip_address}.`);

        const url = `http://${job.source_host.ip_address}:${job.source_host.port}${this.urls.zfs_create_snapshot}`;
        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Create Snapshot command to url ${url}.`);

        const payload = {
            snapshot_name: snapshot_name,
            recursive: recursive
        };

        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Create Snapshot command sending with payload: ${payload}`);

        const http_options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application / json'
            },
            json: payload
        };

        try {
            const result = await request(http_options);
            this.logger.info(`  ${job.id} | ${job_history.id} - ZFS Create Snapshot command sent.`);

            return true;
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - Failed to start zfs create snapshot on source`);
            this.logger.error(err);

            throw err;
        }
    }

    async zfs_destroy_snapshot(job, job_history, snapshot_name) {
        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Destroy Snapshot command to source ${job.source_host.ip_address}.`);

        const url = `http://${job.source_host.ip_address}:${job.source_host.port}${this.urls.zfs_destroy_snapshot}`;
        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Destroy Snapshot command to url ${url}.`);

        const payload = {
            snapshot_name: snapshot_name
        };

        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Destroy Snapshot command sending with payload: ${payload}`);

        const http_options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application / json'
            },
            json: payload
        };

        try {
            const result = await request(http_options);
            this.logger.info(`  ${job.id} | ${job_history.id} - ZFS Destroy Snapshot command sent.`);

            return true;
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - Failed to start zfs destroy snapshot on source`);
            this.logger.error(err);

            throw err;
        }
    }

    async zfs_send(job, job_history, snapshot_name, port, incremental, include_properties, source_snapshot_name) {
        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Send command to source ${job.source_host.ip_address}.`);

        const url = `http://${job.source_host.ip_address}:${job.source_host.port}${this.urls.zfs_send}`;
        this.logger.info(`  ${job.id} | ${job_history.id} - Send command sending to url: ${url}`);

        const payload = {
            snapshot_name: snapshot_name,
            host: job.target_host.ip_address,
            port: port,
            incremental: incremental,
            include_properties: include_properties,
            source_snapshot_name: source_snapshot_name,
            mbuffer_size: this.config.mbuffer_size,
            mbuffer_rate: this.config.mbuffer_rate,
            job_history_id: job_history.id
        };

        const http_options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application / json'
            },
            json: payload
        };

        this.logger.info(`  ${job.id} | ${job_history.id} - Send command sending with payload: ${payload}`);

        try {
            const result = await request(http_options);
            this.logger.info(`  ${job.id} | ${job_history.id} - ZFS Send command sent.`);

            return true;
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - Failed to start zfs send on source`);
            this.logger.error(err);

            throw err;
        }
    }

    async zfs_receive(job, job_history, port, force_rollback) {
        this.logger.info(`  ${job.id} | ${job_history.id} - Sending ZFS Receive command to target ${job.target_host.ip_address}.`);

        const url = `http://${job.source_host.ip_address}:${job.source_host.port}${this.urls.zfs_receive}`;
        this.logger.info(`  ${job.id} | ${job_history.id} - Receive command sending to url: ${url}`);

        const payload = {
            target: job.target_host.ip_address,
            port: port,
            force_rollback: force_rollback,
            job_history_id: job_history.id
        };
        this.logger.info(`  ${job.id} | ${job_history.id} - Receive command sending with payload: ${payload}`);

        const http_options = {
            uri: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application / json'
            },
            json: payload
        };

        try {
            const result = await request(http_options);
            this.logger.info(`  ${job.id} | ${job_history.id} - ZFS Receive command sent`);

            return true;
        } catch (err) {
            this.logger.error(`  ${job.id} | ${job_history.id} - Failed to start zfs receive on target`);
            this.logger.error(err);

            throw err;
        }
    }
}

module.exports = AgentApi;


