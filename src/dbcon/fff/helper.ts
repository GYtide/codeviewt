///引入依赖
const mssql = require('mssql');

//方法对象
const units = {
    sql: function (sql: any, callback: any , childs:any) {
        ///连接池
        new mssql.ConnectionPool(units.config())
            .connect()
            .then((pool: any) => {
                let ps = new mssql.PreparedStatement(pool);
                ps.prepare(sql, (err: any) => {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    ps.execute('', (err: any, result: any) => {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        ps.unprepare((err: any) => {
                            if (err) {
                                console.log(err);
                                callback(err, null);
                                return;
                            }
                            callback(err, result);
                        });
                    });
                });
            }).catch((err: any) => {
                console.log("Database Connection Failed! Bad Config:", err);
            });
    },
    /*
   * 默认config对象
   * @type {{user: string, password: string, server: string, database: string, pool: {min: number, idleTimeoutMillis: number}}}
   */
    config: function () {
        return {
            user: 'sa',                       //SQL Server 的登录名
            password: '123456Ab',               //SQL Server 的登录密码
            server: 'localhost',              //SQL Server 的地址
            database: 'YeoneTab',                 //数据库名称
            port: 1433,                       //端口号，默认为1433
            pool: {
                min: 0,                         //连接池最小连接数，默认0
                max: 10,                        //连接池最大连接数，默认10
                idleTimeoutMillis: 3000         //设置关闭未使用连接的时间，单位ms默认30000
            },
            extra: {
                trustServerCertificate: true,
            },
            //不加下面这一行会出现 "ConnectionError: Failed to connect to 
            //localhost:1433 - certificate is not yet valid" 证书错误
            options: { "trustServerCertificate": true }
            /*--其他属性--*/
            // connectionTimeout：             //连接timeout，单位ms 默认 15000
            // requestTimeout：                //请求timeout，单位ms默认15000
            // parseJSON：                     //将json数据集转化成json obj 
        };
    }
};

// module.exports = units;
export {
    units
};