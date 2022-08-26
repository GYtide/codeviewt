// 数据库的配置参数 参考来源: https://segmentfault.com/a/1190000010324061

let app = {
    user: 'sa',
    password: '123456Ab',
    server: 'localhost',
    database: 'YeoneTab',
    port: 1433,

    pool: {
        min: 0,
        max: 10,
        idleTimeoutMillis: 3000
    },
    // extra: {
    //     trustServerCertificate: true,
    // }
    //不加下面这一行会出现 "ConnectionError: Failed to connect to 
    //localhost:1433 - certificate is not yet valid" 证书错误
    options: {"trustServerCertificate": true}   
};

module.exports = app;