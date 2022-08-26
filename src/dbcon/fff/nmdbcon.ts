// // var node_mssql = require('node-mssql');

// import * as node_mssql from 'node-mssql';
// /**
//  * 连接数据库
//  * */
// var queryObj = new node_mssql.Query({
//     host: 'x.x.x.x',	 // You can use 'x.x.x.x\\instance' to connect to named instance
//     port: 1433,
//     username: 'myuser',
//     password: 'mypassword',
//     database: 'mydatabase'
// });



// /**
//  * 添加
//  * */
// var insert = function (data, insertTable,callback) {

//     queryObj.table(insertTable);
//     queryObj.data(data);
//     queryObj.insert(function (results) {
//         callback(results);
//     }, function (err, sql) {
//         if (err) {
//             console.log(err);
//         }
//     });
// };

// /**
//  * 条件查询
//  * */
// var list = function (successCallback, option, listTable) {

//     queryObj.table(listTable);
//     queryObj.where(option);
//     queryObj.select(function (results) {
//         successCallback(results);
//     }, function (err, sql) {
//         if (err)
//             console.log(err);
//     });

// };

// /**
//  * 修改
//  * */
// var update = function (data, option, updateTable,successCallback) {

//     queryObj.table(updateTable);
//     queryObj.data(data);
//     queryObj.where(option);

//     queryObj.update(function (results) {
//         successCallback(results);
//     }, function (err, sql) {
//         if (err)
//             console.log(err);
//         //console.log(sql);
//     });

// };

// /**
//  * 删除
//  * */
// var del = function (ids, table,successCallback,failedCallback) {

//     queryObj.query("delete from " + table + " where serno in ( " + ids + " )",successCallback,failedCallback);

// };

// /**
//  * 模糊查询
//  * */
// var list_sql = function(sql,successCallback){
//     queryObj.query(sql, successCallback,function(err){
//         console.log(err);
//     });
// };

// /**
//  *分页查询
//  * */
// var  list_sqlPage = function(sql,rows,page,successCallback){
//     queryObj.query(sql,rows,page,successCallback,function (err){
//         console.log(err);
//     })
// }


// /**
//  * 统计
//  * */
// var total = function(sql,callback){
//     queryObj.query(sql,callback,function(err){
//         console.log(err);
//     });
// };

// /**
//  * 根据ID查询
//  * */
// var findUserById = function(sql,successCallback,failedCallback){
//     queryObj.query(sql,successCallback,failedCallback);
// };

// exports.list = list;
// exports.list_sql = list_sql;
// exports.list_sqlPage = list_sqlPage;
// exports.insert = insert;
// exports.update = update;
// exports.del = del;
// exports.total = total;
// exports.findUserById = findUserById;