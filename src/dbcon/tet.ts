import {mssql_async} from './mssql_async';
import * as vscode from 'vscode'
import {projNode,proNodeType} from '../projDate';
async function selectprojtoNode(childrenPro: number , fproid?:string) {
    //childrenPro = 0 父项目（不被其他项目包含），childrenPro = 1 子项目（至少被一个其他项目包含） 
    var dbresp ;
    if(childrenPro===0)
    {
        dbresp = mssql_async("select * from project where id not in(select dproid from protopro)");
    }
    else
    {
        dbresp = mssql_async(`select * from project where id in (select dproid from protopro where proid = ${fproid}`);
    }
    return dbresp;
}

var dbresp = mssql_async("select * from project where id not in(select dproid from protopro)");

dbresp.then((value:any)=>{
  console.log(value);
});
