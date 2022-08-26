const rollup = require("rollup");
const chokidar = require("chokidar");
import * as mssql_async from './dbcon/mssql_async';
import * as fs from 'fs';

const dir = "/home/guolianshuai/下载/chromedownload/1654954789809.json";
let a = dir.split('/');
console.log(a[a.length-1]);
var b:string = '';

for(let i = 0 ; i<a.length-1;++i)
{
    b+=a[i]+'/';
}
console.log(b);

// chokidar.watch(dir)
//     .on("all", (event:any, path:any) => {
//         // vscode.window.showInformationMessage(path);
//         if(event === 'unlink')
//         {
//             var readDir = fs.readdirSync(dir);
//             console.log(readDir[readDir.length-1]);
//             fs.readFile(dir+readDir[readDir.length-1],'utf8',function (err, data) {
//                 if(err) console.log(err);
//                 var test1=JSON.parse(data);//读取的值
//                 var sql = `insert into project(id,name,remark) values('${test1.time}','${test1.title}','${test1.title+"  pinned?:"+test1.pinned}')`;
//                 // console.log(sql);
//             });
//         }
//     });
// rollup.rollup({
//     input: "main.js",
//   })
//   .then(async (bundle:any) => {
//     await bundle.write({
//       file: "bundle.js",
//     });

// chokidar.watch("/home/guolianshuai/下载/chromedownload", {
//         ignored: ["**/node_modules/**", "**/.git/**"],
//       })
//       .on("all", (event:any, path:any) => {
//         console.log(event, path);
//       });

// const path = '/home/guolianshuai/下载/chromedownload/'; // 目标文件夹
// const files = fs.readdirSync(path);
// var lastFile = files.sort(function(a, b) {
// 	var t1:any = fs.statSync(path+a).ctime;
// 	var t2:any = fs.statSync(path+b).ctime;
// 	return t2 - t1;
// }).pop();

// console.log(lastFile);


