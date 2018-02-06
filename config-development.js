module.exports = {
    log_directory: './logs',
    db_logging: false,
    trace_log_level: 'info',
    app_file_log_level: 'info',
    app_json_log_level: 'info',
    stdout_log_level: 'debug',
    host: '0.0.0.0',
    port: 3000,
    
    mbuffer_size: '300k',
    mbuffer_rate: '200k',
    cnapi_ip_address: '172.20.33.22',
    vmapi_ip_address: '172.20.33.27',
    
    job_manager: {
        enabled: false,
        interval: 5000,
        max_jobs_per_iteration: 2
    },

    retention_manager: {
        enabled: false,
        interval: 5000
    },

    data_manager: {
        enabled: false,
        interval: 1000 * 60 * 60 * 24
    }
};
