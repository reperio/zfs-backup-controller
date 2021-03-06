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
    cnapi_admin_network: '172.20.33.1/24',

    send_delay: 5000,

    default_host_port: 3000,
    
    job_manager: {
        enabled: false,
        interval: 5000,
        send_properties: false
    },

    retention_manager: {
        enabled: false
    },

    data_manager: {
        enabled: false,
        interval: 1000 * 60 * 60 * 24
    },

    notification_email: {
        send_grid_api_key: '',
        smtp_host: 'localhost',
        smtp_port: 25,
        smtp_user: '',
        smtp_password: '',
        method: 'smtp',
        to: 'spencerdangel@sevenhillstechnology.com',
        from: 'no-reply@sevenhillstechnology.com'
    }
};
