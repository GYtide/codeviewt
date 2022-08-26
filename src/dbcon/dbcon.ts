//数据库操作的封装   参考来源：https://segmentfault.com/a/1190000010324061

import { rejects } from "assert";
import { resolve } from "path";

//
const mssql = require("mssql");
const conf = require("./dbconfig");

const pool = new mssql.ConnectionPool(conf);
const poolConnect = pool.connect();


// 原文链接：https://blog.csdn.net/weixin_42304193/article/details/104485583

var dbselect = function(sqlstr:any){
    console.log("1");
    //首先是创建连接，连接成功就会调用then里面的函数
    //然后运行语句，返回查询的结果，成功之后在调用下一个then里面的函数
    return mssql.connect(conf).then(function () {
        console.log("2");
        return mssql.query(sqlstr);
    }).then(function(result:any){
        console.log("3");
        mssql.close();
        return result;

    }).catch(function(error:any){
        console.log("4");
        mssql.close();
    });
};


pool.on('error', (err:any):void=> {
    console.log('error: ', err);
});
/**
 * 自由查询
 * @param sql sql语句，例如: 'select * from news where id = @id'
 * @param params 参数，用来解释sql中的@*，例如： { id: id }
 * @param callBack 回调函数
 */
let querySql = async function (sql:any, params:any, callBack:any) {
    try {
        let ps = new mssql.PreparedStatement(await poolConnect);
        if (params !== "") {
            for (let index in params) {
                if (typeof params[index] === "number") {
                    ps.input(index, mssql.Int);
                } else if (typeof params[index] === "string") {
                    ps.input(index, mssql.NVarChar);
                }
            }
        }
        ps.prepare(sql, function (err:any) {
            if (err) {
                console.log(err);
            }
            ps.execute(params, function (err:any, recordset:any) {
                callBack(err, recordset);
                ps.unprepare(function (err:any) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        });
    } catch (e) {
        console.log(e);
    }
};


/**
 * 按条件和需求查询指定表
 * @param tableName 数据库表名，例：'news'
 * @param topNumber 只查询前几个数据，可为空，为空表示查询所有
 * @param whereSql 条件语句，例：'where id = @id'
 * @param params 参数，用来解释sql中的@*，例如： { id: id }
 * @param orderSql 排序语句，例：'order by created_date'
 * @param callBack 回调函数
 */
let select = async function (tableName:any, topNumber:any, whereSql:any, params:any, orderSql:any, callBack:any) {
    try {
        let ps = new mssql.PreparedStatement(await poolConnect);
        let sql = "select * from " + tableName + " ";
        if (topNumber !== "") {
            sql = "select top(" + topNumber + ") * from " + tableName + " ";
        }
        sql += whereSql + " ";
        if (params !== "") {
            for (let index in params) {
                if (typeof params[index] === "number") {
                    ps.input(index, mssql.Int);
                } else if (typeof params[index] === "string") {
                    ps.input(index, mssql.NVarChar);
                }
            }
        }
        sql += orderSql;
        console.log(sql);
        ps.prepare(sql, function (err:any) {
            if (err) {
                console.log(err);
            }
            ps.execute(params, function (err:any, recordset:any) {
                callBack(err, recordset);
                ps.unprepare(function (err:any) {
                    if (err) {
                        console.log(err);
                    }
                });
            });
        });
    } catch (e) {
        console.log(e);
    }
};


/*
*
*
*/
let selectAllre = async function (tableName:any) {
    try {

        return new Promise((resolve,reject)=>{
                   
        });
     
    } catch (e) {
        console.log(e);
    }
};


/**
 * 查询指定表的所有数据
 * @param tableName 数据库表名
 * @param callBack 回调函数
 */
let selectAll = async function (tableName:any, callBack:any) {
    try {
        console.log('testssyys-1');
        let ps = new mssql.PreparedStatement(await poolConnect);
        console.log('testssyys0');
        let sql = "select * from " + tableName + " ";
        ps.prepare(sql, function (err: any) {
                if (err) {
                    console.log(err);
                }
                console.log('testssyys1');
                ps.execute("", function (err: any, recordset: any) {
                    console.log('testssyys2');
                    callBack(err, recordset);
                    console.log('testssyys3');
                    ps.unprepare(function (err: any) {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
                console.log('testssyys4');
            });
    } catch (e) {
        console.log(e);
    }
};

/**
 * 添加字段到指定表
 * @param addObj 需要添加的对象字段，例：{ name: 'name', age: 20 }
 * @param tableName 数据库表名
 * @param callBack 回调函数
 */
let add =  async function (addObj:any, tableName:any, callBack:any) {
    try {
        let ps = new mssql.PreparedStatement(await poolConnect);
        let sql = "insert into " + tableName + "(";
        if (addObj !== "") {
            for (let index in addObj) {
                if (typeof addObj[index] === "number") {
                    ps.input(index, mssql.Int);
                } else if (typeof addObj[index] === "string") {
                    ps.input(index, mssql.NVarChar);
                }
                sql += index + ",";
            }
            sql = sql.substring(0, sql.length - 1) + ") values(";
            for (let index in addObj) {
                if (typeof addObj[index] === "number") {
                    sql += addObj[index] + ",";
                } else if (typeof addObj[index] === "string") {
                    sql += "'" + addObj[index] + "'" + ",";
                }
            }
        }
        sql = sql.substring(0, sql.length - 1) + ") SELECT @@IDENTITY id"; // 加上SELECT @@IDENTITY id才会返回id
        ps.prepare(sql, function (err:any) {
            if (err) {
                console.log(err);
            }
            ps.execute(addObj, function (err:any, recordset:any) {
                callBack(err, recordset);
                ps.unprepare(function (err:any) {
                    if (err)
                    {
                        console.log(err);
                    }
                });
            });
        });
    } catch (e) {
        console.log(e);
    }
};

/**
 * 更新指定表的数据
 * @param updateObj 需要更新的对象字段，例：{ name: 'name', age: 20 }
 * @param whereObj 需要更新的条件，例: { id: id }
 * @param tableName 数据库表名
 * @param callBack 回调函数
 */
let update = async function (updateObj:any, whereObj:any, tableName:any, callBack:any) {
    try {
        let ps = new mssql.PreparedStatement(await poolConnect);
        let sql = "update " + tableName + " set ";
        if (updateObj !== "") {
            for (let index in updateObj) {
                if (typeof updateObj[index] === "number") {
                    ps.input(index, mssql.Int);
                    sql += index + "=" + updateObj[index] + ",";
                } else if (typeof updateObj[index] === "string") {
                    ps.input(index, mssql.NVarChar);
                    sql += index + "=" + "'" + updateObj[index] + "'" + ",";
                }
            }
        }
        sql = sql.substring(0, sql.length - 1) + " where ";
        if (whereObj !== "") {
            for (let index in whereObj) {
                if (typeof whereObj[index] === "number") {
                    ps.input(index, mssql.Int);
                    sql += index + "=" + whereObj[index] + " and ";
                } else if (typeof whereObj[index] === "string") {
                    ps.input(index, mssql.NVarChar);
                    sql += index + "=" + "'" + whereObj[index] + "'" + " and ";
                }
            }
        }
        sql = sql.substring(0, sql.length - 5);
        ps.prepare(sql, function (err:any) {
            if (err)
            {
                console.log(err);
            }
            ps.execute(updateObj, function (err:any, recordset:any) {
                callBack(err, recordset);
                ps.unprepare(function (err:any) {
                    if (err)
                    {
                        console.log(err);
                    }
                });
            });
        });
    } catch (e) {
        console.log(e);
    }
};

/**
 * 删除指定表字段
 * @param whereSql 要删除字段的条件语句，例：'where id = @id'
 * @param params 参数，用来解释sql中的@*，例如： { id: id }
 * @param tableName 数据库表名
 * @param callBack 回调函数
 */
let del = async function (whereSql:any, params:any, tableName:any, callBack:any) {
    try {
        let ps = new mssql.PreparedStatement(await poolConnect);
        let sql = "delete from " + tableName + " ";
        if (params !== "") {
            for (let index in params) {
                if (typeof params[index] === "number") {
                    ps.input(index, mssql.Int);
                } else if (typeof params[index] === "string") {
                    ps.input(index, mssql.NVarChar);
                }
            }
        }
        sql += whereSql;
        ps.prepare(sql, function (err:any) {
            if (err)
            {
                console.log(err);
            }
            ps.execute(params, function (err:any, recordset:any) {
                callBack(err, recordset);
                ps.unprepare(function (err:any) {
                    if (err)
                    {
                        console.log(err);
                    }
                });
            });
        });
    } catch (e) {
        console.log(e);
    }
};

// exports.config = conf;
// exports.del = del;
// exports.select = select;
// exports.update = update;
// exports.querySql = querySql;
// exports.selectAll = selectAll;
// exports.add = add;

export{
    dbselect,
    conf,
    del,
    select,
    update,
    querySql,
    selectAll,
    selectAllre,
    add
};
