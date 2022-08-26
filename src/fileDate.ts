import { mssql_async } from './dbcon/mssql_async';
import * as vscode from 'vscode';
import * as path from "path";
import { proNodeType } from './projDate';
import { LNodeL } from './pageData';

export enum fileNodeType { file, filelist }


export class fileNode extends vscode.TreeItem {

    filename: string;
    path: string;
    pinx: number;

    size: number;
    time: string;
    fid: number;
    remark: string;
    public parent: any;
    type: proNodeType;

    constructor(ttype: proNodeType, parent: any, public label: string, iid: number, ppath: string, ssize: number, ttime: string,
        rremark: string, ppinx: number, collapsibleState?: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.filename = label;
        this.path = ppath;
        this.fid = iid;

        this.time = ttime;
        this.size = ssize;
        this.pinx = ppinx;
        this.remark = rremark;
        this.type = ttype;
        this.parent = parent;
        this.iconPath = {
            light: path.join(__filename, "../../res/icons/dark/symbol-method.svg"),
            dark: path.join(__filename, "../../res/icons/light/symbol-method.svg")
        };

    }
    //点击事件
    command = {
        title: this.label,          // 标题
        command: 'fileClick',       // 命令 ID
        tooltip: this.label,        // 鼠标覆盖时的小小提示框
        arguments: [                // 向 registerCommand 传递的参数。
            this             // 目前这里我们只传递一个 label
        ]
    };
}

// export class fileNodeL extends vscode.TreeItem {

//     type: proNodeType;

//     constructor(ttype: proNodeType, public label: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
//         super(label, collapsibleState);
//         this.type = ttype;
//         // this.iconPath = {light:"../res/icons/dark/symbol-file.svg" ,dark:"../res/icons/dark/symbol-file.svg"};
//     }
// }

export class FileProvider implements vscode.TreeDataProvider<fileNode | LNodeL>{

    // onDidChangeTreeData?: vscode.Event<void | PageNode | null | undefined> | undefined;
    private _onDidChangeTreeData: vscode.EventEmitter<fileNode | undefined | null | void> = new vscode.EventEmitter<fileNode | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<fileNode | undefined | null | void> = this._onDidChangeTreeData.event;



    async getChildren(element?: fileNode): Promise<fileNode[] | LNodeL[]> {
        return new Promise(async (res, rej) => {
            if (!element) {//父结点

                let pinNodes = new LNodeL(proNodeType.filelist, "固定", "root", vscode.TreeItemCollapsibleState.Collapsed);
                let unpinNodes = new LNodeL(proNodeType.filelist, "未固定", "root", vscode.TreeItemCollapsibleState.Collapsed);

                return res([pinNodes, unpinNodes]);

            }
            else {//子结点
                if (element.label === "固定") {
                    let data = await this.selectAllfiletoNode(1, element).then(value => {
                        return value;
                    });
                    res(data);
                }
                else {
                    let data = await this.selectAllfiletoNode(0, element).then(value => {
                        return value;
                    });
                    res(data);
                }

            }
        });
    }

    async selectAllfiletoNode(pinx: number, pelement: any) {

        //pin = 0 表示不固定，pinx = 1 表示固定 
        var dbresp = mssql_async("select * from files");
        var dbres: any = await dbresp.then((value: any) => {
            let fileNodelist: fileNode[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                if (value.recordset[i].pinx === pinx) {
                    // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                    let new_item = new fileNode(proNodeType.file, pelement, value.recordset[i].filename, value.recordset[i].id,
                        value.recordset[i].path, value.recordset[i].size, value.recordset[i].time,
                        value.recordset[i].remark, value.recordset[i].pinx,
                        vscode.TreeItemCollapsibleState.None);
                    fileNodelist[i] = new_item;
                }

            }
            return fileNodelist;
        });
        return dbres;
    }
    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
    // 打开文件
    openFile(args: string) {
        vscode.workspace.openTextDocument(args)
            .then(doc => {
                // 在VSCode编辑窗口展示读取到的文本
                vscode.window.showTextDocument(doc);
            }, err => {
                vscode.window.showInformationMessage(`Open ${args} error, ${err}.`);
            }).then(undefined, err => {
                vscode.window.showInformationMessage(`Open ${args} error, ${err}.`);
            });
        // vscode.env.openExternal(vscode.Uri.parse(args));
    }
    find() {
        let sql = `select * from files`;
        mssql_async(sql).then((value: any) => {
            let fileNodelist: any[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                // let new_item = { label: value.recordset[i].path + value.recordset[i].filename, description: value.recordset[i].id, detail: value.recordset[i].remark };
                let new_item = { label: value.recordset[i].path + value.recordset[i].filename, description: `${value.recordset[i].id}`, detail: value.recordset[i].remark };
                fileNodelist[i] = new_item;

            }
            return fileNodelist;
        }).then((value: any) => {
            // console.log(value);
            return vscode.window.showQuickPick(value, { placeHolder: "查找文件", canPickMany: true });

        }).then((value: any) => {

            console.log(value.length);
    
            if (value.length > 5) {
                vscode.window.showInformationMessage("选择的网页超过5个,不建议批量打开","确认");
            }
            else {
                for (let i = 0; i < value.length; ++i) {
                    // let sql = `insert into pagecollect(proid,pageid) values('${pid}','${value[i].description}')`;
                    // mssql_async(sql);
                    vscode.env.openExternal(vscode.Uri.parse(value[i].label));
                }
            }
        });

    }
    //修改备注
    editremark(file: fileNode) {
        vscode.window.showInputBox({
            placeHolder: "回车确认你的修改", value: file.remark
        }).then((value) => {
            if (!value) {
                vscode.window.showInformationMessage('请确认你的修改，本次未保存!');
            }
            else {
                try {

                    mssql_async(`update files set  remark = '${value}' where id = ${file.fid}`);
                    // dbcon.update('',);
                    file.remark = value;
                    this.refresh();
                    // this._onDidChangeTreeData.fire();

                    vscode.window.showInformationMessage(`备注修改成功!${file.remark}`);

                } catch {

                    vscode.window.showInformationMessage(`备注修改失败!`);
                }
            }

        });

    }
    // 添加文件

    async addItem(flist: LNodeL) {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: true,
            openLabel: '添加',
            canSelectFiles: true,
            canSelectFolders: false
        };
        var pinx = 0;
        if (flist.label === "固定") {
            pinx = 1;
        }


        var fs = require('fs');
        var files: any = await vscode.window.showOpenDialog(options);
        for (let i = 0; i < files?.length; ++i) {
            fs.stat(files[i].path, (err: any, stats: any) => {
                //    console.log(stats);
                //插入文件
                let a = files[i].path.split('/');
                // console.log(a[a.length - 1]);
                var b: string = '';

                for (let i = 0; i < a.length - 1; ++i) {
                    b += a[i] + '/';
                }
                var sql = `if  exists(select id from files where filename = '${a[a.length - 1]}' and path = '${b}')
                insert into files(filename,path,size,remark,pinx) 
                values('${a[a.length - 1]}','${b}',${stats.blksize},'由文件列表添加${files[i].path}',${pinx})`;
                mssql_async(sql);
                vscode.window.showInformationMessage("成功添加" + a[a.length - 1]);

            });
            // console.log(files[i].path);
        }
        this.refresh();
    }

    //删除
    deleteItem(file: fileNode) {
        vscode.window.showInformationMessage("是否删除", '确认', '取消').then((select) => {
            if (select === '确认') {
                vscode.window.showInformationMessage("已成功删除" + `${file.filename}`);
                // 级联删除
                mssql_async(`delete from files where id = '${file.fid}'`);;
                var sql = `delete from fcollect where fid = '${file.fid}'`;
                mssql_async(sql);
                this.refresh();
            }
            else {
                vscode.window.showInformationMessage("删除失败");
            }

        });
    }
    //固定
    pinpage(fid: number) {
        var sql = `update files set pinx = 1 where id = ${fid}`;
        mssql_async(sql);
        //   vscode.window.showInformationMessage("pin"+durl);
        this.refresh();
    }
    // 取消固定
    unpinpage(fid: number) {
        var sql = `update files set pinx = 0 where id = ${fid}`;
        mssql_async(sql);
        //   vscode.window.showInformationMessage("pin"+durl);
        this.refresh();
    }

    getTreeItem(element: fileNode): vscode.TreeItem {

        //根据结点类型修改上下文参数，保证命令的传输正确
        if (element.type === proNodeType.filelist) {
            element.contextValue = 'filelist';
            element.tooltip = '文件列表:' + element.label;
            if (element.label === "固定") {
                element.iconPath = {
                    light: path.join(__filename, "../../res/icons/dark/symbol-enum.svg"),
                    dark: path.join(__filename, "../../res/icons/light/symbol-enum.svg")
                };
            }
            else {
                element.iconPath = {
                    light: path.join(__filename, "../../res/icons/dark/symbol-enum-member.svg"),
                    dark: path.join(__filename, "../../res/icons/light/symbol-enum-member.svg")
                };
            }
        }
        else {
            if (element.pinx) {
                element.contextValue = 'pinfile';
            }
            else {
                element.contextValue = 'unpinfile';
            }
            element.tooltip = element.filename + "\n" + element.remark;
        }
        return element;
    }
}