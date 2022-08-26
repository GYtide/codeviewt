var sqlserver = require('mssql');
var dbConfig = {
    server: '127.0.0.1',
    port: 1433,
    user: 'sa',
    password: '123456Ab',
    database: 'YeoneTab',
    extra: {
        trustServerCertificate: true,
    },
    //不加下面这一行会出现 "ConnectionError: Failed to connect to 
    //localhost:1433 - certificate is not yet valid" 证书错误
    options: { "trustServerCertificate": true }
};

var mssql_async = function (strsql:any) {
    return new Promise(function (resolve, reject) {
        sqlserver
            .connect(dbConfig)
            .then(function () {
                new sqlserver.Request()
                    .query(strsql)
                    .then(function (recordset:any) {
                        resolve(recordset);
                    })
                    .catch(function (err:any) {
                        reject(err);
                    });
            })
            .catch(function (err:any) {
                reject(err);
            });
    });
};

export {
    mssql_async
};

