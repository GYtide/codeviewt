import { mssql_async } from './dbcon/mssql_async';
import * as vscode from 'vscode';
import * as path from "path";
import { PageNode, LNodeL, pageNodeType } from './pageData';
import { fileNode, fileNodeType } from './fileDate';
import { clearScreenDown } from 'readline';
import { time } from 'console';
import {proNodeType,projNode} from './projDate';

export class pinProjProvider implements vscode.TreeDataProvider<fileNode | PageNode | LNodeL | projNode>{

    // onDidChangeTreeData?: vscode.Event<void | PageNode | null | undefined> | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<fileNode | undefined | null | void> = new vscode.EventEmitter<fileNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<fileNode | undefined | null | void> = this._onDidChangeTreeData.event;

    async getChildren(element?: any): Promise<fileNode[] | projNode[] | PageNode[] | LNodeL[]> {
        return new Promise(async (res, rej) => {

            if (!element) {//父结点
                let data = await this.selectprojtoNode(0).then(value => {
                    return value;
                });
                res(data);
            }
            else {//子结点 
                if (element.type === proNodeType.proj) {
                    let new_filelist = new LNodeL(proNodeType.filelist, element.label + "的文件", element, vscode.TreeItemCollapsibleState.Collapsed);
                    let new_pagelist = new LNodeL(proNodeType.pagelist, element.label + "的网页", element, vscode.TreeItemCollapsibleState.Collapsed);
                    let new_prolist = new LNodeL(proNodeType.projlist, element.label + "的子项目", element, vscode.TreeItemCollapsibleState.Collapsed)
                    // let data = await selectprojtoNode(1,element.pid).then(value => {
                    //     return value;
                    // });

                    res([new_filelist, new_pagelist, new_prolist]);
                }
                else if (element.type === proNodeType.filelist) {
                    let data = await this.selectAllfiletoNode(element).then(value => {
                        return value;
                    });
                    res(data);
                }
                else if (element.type === proNodeType.pagelist) {
                    let data = await this.selectAllpagetoNode(element).then(value => {
                        return value;
                    });
                    res(data);
                }
                else if (element.type === proNodeType.projlist) {
                    var pid = element.parent.pid;
                    // console.log(pid);
                    let data = await this.selectprojtoNode(1, pid).then(value => {
                        return value;
                    });
                    res(data);
                }

            }

        });
    }
    async selectAllpagetoNode(pelement: any) {

        //pin = 0 表示不固定，pinx = 1 表示固定 
        var sql = `select * from pages where url in (select pageid from pagecollect where proid =  '${pelement.parent.pid}')`;
        var dbresp = mssql_async(sql);
        var dbres: any = await dbresp.then((value: any) => {
            let pageNodelist: PageNode[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = new PageNode(proNodeType.page, pelement, value.recordset[i].title, value.recordset[i].url, value.recordset[i].comment
                    , value.recordset[i].pinx, vscode.TreeItemCollapsibleState.None);
                pageNodelist[i] = new_item;

            }
            return pageNodelist;
        });
        return dbres;
    }
    async selectAllfiletoNode(pelement: any) {

        //pin = 0 表示不固定，pinx = 1 表示固定 
        var sql = `select * from files where id in (select fid from fcollect where proid = '${pelement.parent.pid}')`;
        var dbresp = mssql_async(sql);
        var dbres: any = await dbresp.then((value: any) => {
            let fileNodelist: fileNode[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = new fileNode(proNodeType.file, pelement, value.recordset[i].filename, value.recordset[i].id,
                    value.recordset[i].path, value.recordset[i].size, value.recordset[i].time,
                    value.recordset[i].remark, value.recordset[i].pinx,
                    vscode.TreeItemCollapsibleState.None);
                fileNodelist[i] = new_item;
            }
            return fileNodelist;
        });
        return dbres;
    }

    async selectprojtoNode(childrenPro: number, fproid?: string) {
        //childrenPro = 0 父项目（不被其他项目包含），childrenPro = 1 子项目（至少被一个其他项目包含） 
        var dbresp;
        if (childrenPro === 0) {
            dbresp = mssql_async("select  * from project where id in(select pid from pinpro);");
        }
        else {
            // console.log(`select * from project where id in (select dproid from protopro where proid = '${fproid}'`);
            dbresp = mssql_async(`select * from project where id in (select dproid from protopro where proid = '${fproid}')`);
        }
        var dbres: any = await dbresp.then((value: any) => {
            let projNodelist: projNode[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = new projNode(proNodeType.proj, value.recordset[i].name, value.recordset[i].id, value.recordset[i].time, value.recordset[i].remark, vscode.TreeItemCollapsibleState.Collapsed);
                projNodelist[i] = new_item;

            }
            return projNodelist;
        });
        return dbres;
    }
    unpinPro(args:projNode)
    {
         // 设置为不固定
         var sql = `delete from pinpro where pid = ${args.pid}`;
         mssql_async(sql);
         this.refresh();
    }
    addpinItem(){

    }

    getTreeItem(element: any): vscode.TreeItem {

        //根据结点类型修改上下文参数，保证命令的传输正确
        if (element.type === proNodeType.filelist) {
            element.contextValue = 'filelist';
            element.tooltip = '文件列表:' + element.label;
            element.iconPath = {
                light: path.join(__filename, "../../res/icons/dark/symbol-enum.svg"),
                dark: path.join(__filename, "../../res/icons/light/symbol-enum.svg")
            };

        }
        else if (element.type === proNodeType.pagelist) {

            element.contextValue = 'pagelist';
            element.tooltip = '文件列表:' + element.label;
            element.iconPath = {
                light: path.join(__filename, "../../res/icons/dark/star-full.svg"),
                dark: path.join(__filename, "../../res/icons/dark/star-full.svg")
            };
        }
        else if (element.type === proNodeType.projlist) {
            element.contextValue = 'projlist';
            element.tooltip = '项目列表:' + element.label;
            element.iconPath = {
                light: path.join(__filename, "../../res/icons/dark/file-submodule-g.svg"),
                dark: path.join(__filename, "../../res/icons/dark/file-submodule-g.svg")
            };
        }
        else if (element.type === proNodeType.proj) {
            element.contextValue = 'proj';
            element.tooltip = '项目:' + element.label;
            element.iconPath = {
                light: path.join(__filename, "../../res/icons/dark/project-g.svg"),
                dark: path.join(__filename, "../../res/icons/dark/project-g.svg")
            };
        }
        else if (element.type === proNodeType.file) {
            element.contextValue = 'profile';
            element.tooltip = '文件:' + element.label;;
        }
        else if (element.type === proNodeType.page) {
            element.contextValue = 'propage';
            element.tooltip = '网页:' + element.label;
        }
        return element;
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}
