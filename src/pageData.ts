import * as vscode from 'vscode';

import * as dbcon from "./dbcon/dbcon";
import * as path from "path";
import helper = require('./dbcon/fff/helper');

import { mssql_async } from './dbcon/mssql_async';
import * as Element from './DbElement';
import { url } from 'inspector';
import { proNodeType } from './projDate'


export enum pageNodeType { page, pagelist }

export class PageNode extends vscode.TreeItem {

    url: string;
    remark: string;
    pinx: number;
    type: proNodeType;
    public parent: any;
    constructor(ttype: proNodeType, parent: any, public label: string, curl: string, rremark: string, ppinx: number, collapsibleState?: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.url = curl;
        this.pinx = ppinx;
        this.remark = rremark;
        this.type = ttype;
        this.parent = parent;
        this.iconPath = {
            light: path.join(__filename, "../../res/icons/dark/symbol-field.svg"),
            dark: path.join(__filename, "../../res/icons/light/symbol-field.svg")
        };

    }
    //点击事件
    command = {
        title: this.label,          // 标题
        command: 'pageClick',       // 命令 ID
        tooltip: this.label,        // 鼠标覆盖时的小小提示框
        arguments: [                // 向 registerCommand 传递的参数。
            this             // 目前这里我们只传递一个 label
        ]
    };


    public editRemark(context: vscode.ExtensionContext) {
        vscode.window.showInputBox({
            placeHolder: "回车确认你的修改", value: this.remark
        }).then((value) => {
            if (!value) {
                vscode.window.showInformationMessage('请确认你的修改，本次未保存!');
            }
            else {
                try {

                    mssql_async(`update pages set  comment = '${value}' where url = '${this.url}'`);
                    // dbcon.update('',);
                    this.remark = value;
                    // this._onDidChangeTreeData.fire();

                    vscode.window.showInformationMessage(`备注修改成功!${this.remark}`);

                } catch {

                    vscode.window.showInformationMessage(`备注修改失败!`);
                }
            }

        });
    }

}

export class LNodeL extends vscode.TreeItem {

    public type: proNodeType;
    public parent: any;
    constructor(ttype: proNodeType, public label: string, parent: any, collapsibleState?: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.type = ttype;
        this.parent = parent;
        // this.iconPath = {light:"../res/icons/dark/symbol-file.svg" ,dark:"../res/icons/dark/symbol-file.svg"};
    }
}

export class PageProvider implements vscode.TreeDataProvider<PageNode | LNodeL>{

    // onDidChangeTreeData?: vscode.Event<void | PageNode | null | undefined> | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<PageNode | undefined | null | void> = new vscode.EventEmitter<PageNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<PageNode | undefined | null | void> = this._onDidChangeTreeData.event;



    async getChildren(element?: PageNode): Promise<PageNode[] | LNodeL[]> {
        return new Promise(async (res, rej) => {
            if (!element) {//父结点

                let pinNodes = new LNodeL(proNodeType.pagelist, "固定", "root", vscode.TreeItemCollapsibleState.Collapsed);
                let unpinNodes = new LNodeL(proNodeType.pagelist, "未固定", "root", vscode.TreeItemCollapsibleState.Collapsed);

                res([pinNodes, unpinNodes]);

            }
            else {//子结点
                if (element.label === "固定") {
                    let data = await this.selectALlpagetoNode(1, element).then(value => {
                        return value;
                    });
                    res(data);
                }
                else {
                    let data = await this.selectALlpagetoNode(0, element).then(value => {
                        return value;
                    });
                    res(data);
                }

            }
        });
    }

    async selectALlpagetoNode(pinx: number, pelement: any) {

        //pin = 0 表示不固定，pinx = 1 表示固定 
        var dbresp = mssql_async("select * from pages");
        var dbres: any = await dbresp.then((value: any) => {
            let pageNodelist: PageNode[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                if (value.recordset[i].pinx === pinx) {
                    // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                    let new_item = new PageNode(proNodeType.page, pelement, value.recordset[i].title, value.recordset[i].url, value.recordset[i].comment
                        , value.recordset[i].pinx, vscode.TreeItemCollapsibleState.None);
                    pageNodelist[i] = new_item;
                }

            }
            return pageNodelist;
        });
        return dbres;
    }
    //有问题，没法顺序执行
    //后期尝试 multiStepInput
    addTreeItem() {
        //增加元素，全部刷新，修改数据库然后重新读入

        //调用vscode API读入下列参数
        var url: string;
        var remark: string;
        var pinx: number;
        var title: string;

        vscode.window.showInputBox({
            placeHolder: "输入网页url", value: ""
        }).then((value: any) => {
            vscode.window.showInformationMessage(value);
            if (!value) {
                vscode.window.showInformationMessage('请输入正确的url');
            }
            else {
                try {
                    // dbcon.update('',);

                    //去除url字符串两侧的空格

                    value = value.replace(/^\s+/g, '');

                    url = value;
                    // vscode.window.showInformationMessage(`添加! ${url}`);
                    // this._onDidChangeTreeData.fire();

                    return vscode.window.showInputBox({
                        placeHolder: "输入网页标题 /*默认或离线将设置为当前时间*/",
                        value: ""
                    });

                } catch {
                    vscode.window.showInformationMessage(`添加失败!`);
                }
            }
        }).then((value: any) => {
            if (!value) {
                title = " " + Date.now();
                return vscode.window.showInputBox({
                    placeHolder: "输入网页备注描述 /*默认将设置为当前时间*/",
                    value: ""
                });
            }
            else {
                title = value;
                try {
                    return vscode.window.showInputBox({
                        placeHolder: "输入网页备注描述 /*默认将设置为当前时间*/",
                        value: ""
                    });
                }
                catch
                {
                    vscode.window.showInformationMessage(`添加失败!`);
                }
            }

        }).then((value: any) => {
            if (!value) {
                // vscode.window.showInformationMessage(`网页标题`);
                remark = " " + Date.now();
                return vscode.window.showQuickPick([{
                    label: "固定",
                    description: "新添加的网页将在固定网页context中"
                }, {
                    label: "不固定",
                    description: "新添加的网页将在不固定网页context中"
                }], {
                    placeHolder: '选择是否为固定状态',
                });
            }
            else {
                remark = value;
                try {
                    remark = value;
                    return vscode.window.showQuickPick([{
                        label: "固定",
                        description: "新添加的网页将在固定网页context中"
                    }, {
                        label: "不固定",
                        description: "新添加的网页将在不固定网页context中"
                    }], {
                        placeHolder: '选择是否为固定状态',
                    });
                } catch {
                    vscode.window.showInformationMessage(`添加失败!`);
                }
            }
        }).then((value: any) => {
            if (!value) {
                vscode.window.showInformationMessage(`添加失败!`);
            }
            else {
                if (value.label === "固定") {
                    pinx = 1;
                }
                else {
                    pinx = 0;
                }
                return mssql_async(`insert into pages(url ,title,comment,pinx) values('
                ${url}','${title}','${remark}',${pinx})`);
            }
            // vscode.window.showInformationMessage(value.label);
            // vscode.window.showInformationMessage('User choose ' + value);
        }).then((value: any) => {
            if (value) {
                // vscode.window.showInformationMessage(value);
                vscode.window.showInformationMessage(url + "添加成功");
                this.refresh();
            }
            else {
                vscode.window.showInformationMessage(`添加失败!`);
            }
        });
    }

    //固定
    pinpage(durl: string) {
        var sql = `update pages set pinx = 1 where url = '${durl}'`;
        mssql_async(sql);
        //   vscode.window.showInformationMessage("pin"+durl);
        this.refresh();
    }
    // 取消固定
    unpinpage(durl: string) {
        var sql = `update pages set pinx = 0 where url = '${durl}'`;
        mssql_async(sql);
        //   vscode.window.showInformationMessage("pin"+durl);
        this.refresh();
    }
    find() {
        let sql = `select * from pages`;
        mssql_async(sql).then((value: any) => {
            let pageNodelist: any[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = { label: value.recordset[i].title + "备注:" + value.recordset[i].comment, description: value.recordset[i].url, detail: value.recordset[i].comment };
                pageNodelist[i] = new_item;

            }
            return pageNodelist;
        }).then((value: any) => {
            // console.log(value);
            return vscode.window.showQuickPick(value, { placeHolder: "查找网页", canPickMany: true });

        }).then((value: any) => {

            console.log(value.length);
            if (value.length > 15) {
                vscode.window.showInformationMessage("选择的网页超过15个,不建议批量打开");
            }
            else {
                for (let i = 0;i< value.length; ++i) {
                    // let sql = `insert into pagecollect(proid,pageid) values('${pid}','${value[i].description}')`;
                    // mssql_async(sql);
                    vscode.env.openExternal(vscode.Uri.parse(value[i].description));
                }
            }

        });

    }

    deleteItem(durl: string) {

        // vscode.window.showInformationMessage(durl);
        // vscode.window.showQuickPick([{
        //     label: "取消",
        //     description: "取消删除"
        // }, {
        //     label: "删除",
        //     description: "删除" + durl
        // }], {
        //     placeHolder: '确认是否删除?',
        // }).then((value: any) => {

        //     if (value.label === "删除") {
        //         return mssql_async(`delete from pages where url = '${durl}'`);
        //     }
        vscode.window.showInformationMessage("是否删除", '确认', '取消').then((select) => {
            if (select === '确认') {
                vscode.window.showInformationMessage("已成功删除" + durl);
                // 级联删除
                mssql_async(`delete from pages where url = '${durl}'`);
                var sql = `delete from pagecollect where pageid = '${durl}'`;
                mssql_async(sql);
                this.refresh();
            }
            else {
                vscode.window.showInformationMessage("删除失败");
            }

        });
    }
    // 更改title
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }


    getTreeItem(element: PageNode): vscode.TreeItem {

        //根据结点类型修改上下文参数，保证命令的传输正确
        if (element.type === proNodeType.pagelist) {
            element.contextValue = 'pagelist';
            element.tooltip = '网页列表:' + element.label;
            if (element.label === "固定") {
                element.iconPath = {
                    light: path.join(__filename, "../../res/icons/dark/star-full.svg"),
                    dark: path.join(__filename, "../../res/icons/light/star-full.svg")
                };
            }
            else {
                element.iconPath = {
                    light: path.join(__filename, "../../res/icons/dark/star-half.svg"),
                    dark: path.join(__filename, "../../res/icons/light/star-half.svg")
                };
            }
        }
        else {
            if (element.pinx) {
                element.contextValue = 'pinpage';
            }
            else {
                element.contextValue = 'unpinpage';
            }
            element.tooltip = element.url + "\n" + element.remark;
        }
        return element;
    }
}


