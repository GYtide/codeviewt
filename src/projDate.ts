import { mssql_async } from './dbcon/mssql_async';
import * as vscode from 'vscode';
import * as path from "path";
import { PageNode, LNodeL, pageNodeType } from './pageData';
import { fileNode, fileNodeType } from './fileDate';
import { clearScreenDown } from 'readline';
import { time } from 'console';
import { querySql } from './dbcon/dbcon';

export enum proNodeType { proj, projlist, file, filelist, page, pagelist }

export class projNode extends vscode.TreeItem {

    name: string;
    time: string;
    pid: string;
    remark: string;
    type: proNodeType;
    constructor(ttype: proNodeType, public label: string, iid: string, ttime: string,
        rremark: string, collapsibleState?: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.name = label;
        this.pid = iid;
        this.time = ttime;
        this.remark = rremark;
        this.type = ttype;
        this.iconPath = {
            light: path.join(__filename, "../../res/icons/dark/project-g.svg"),
            dark: path.join(__filename, "../../res/icons/light/project-g.svg")
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

export class ProjProvider implements vscode.TreeDataProvider<fileNode | PageNode | LNodeL | projNode>{

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
            // res([new projNode(proNodeType.proj,'aa','aaa','aaa','aaaa',vscode.TreeItemCollapsibleState.Collapsed)])
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
                let new_item = new fileNode(proNodeType.file, pelement, value.recordset[i].filename,
                    value.recordset[i].id,
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
            dbresp = mssql_async("select  * from project where id not in(select dproid from protopro) and id not in(select pid from pinpro)");
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

    addProject(args?: projNode) {
        //在根结点新建项目
        if (!args) {
            //增加元素，全部刷新，修改数据库然后重新读入

            //调用vscode API读入下列参数
            var name: string;
            var remark: string;
            var id: string;

            vscode.window.showInputBox({
                placeHolder: "项目名称", value: ""
            }).then((value: any) => {
                // vscode.window.showInformationMessage(value);
                if (!value) {
                    vscode.window.showInformationMessage('请输入正确的名称');
                }
                else {
                    try {

                        name = value;
                        return vscode.window.showInputBox({
                            placeHolder: "输入项目备注",
                            value: ""
                        });

                    } catch {
                        vscode.window.showInformationMessage(`添加失败!`);
                    }

                }
            }).then((value: any) => {
                if (value) {

                    id = `${Date.now()}`;
                    remark = value;
                    // vscode.window.showInformationMessage(name, id, remark);
                    var sql = `insert into project(id,name,remark) values('${id}','${name}','${value}')`;
                    // vscode.window.showInformationMessage(sql);
                    return mssql_async(sql);
                }
                else {
                    vscode.window.showInformationMessage(`请输入正确的备注`);
                }

            }).then((values: any) => {
                if (values) {
                    vscode.window.showInformationMessage(name + "添加成功");
                    this.refresh();
                }

            });
        }
        else {
            // vscode.window.showInformationMessage(`${Date.now()}`);
            //增加元素，全部刷新，修改数据库然后重新读入

            //调用vscode API读入下列参数
            var name: string;
            var remark: string;
            var id: string;

            vscode.window.showInputBox({
                placeHolder: "项目名称", value: ""
            }).then((value: any) => {
                // vscode.window.showInformationMessage(value);
                if (!value) {
                    vscode.window.showInformationMessage('请输入正确的名称');
                }
                else {
                    try {

                        name = value;
                        return vscode.window.showInputBox({
                            placeHolder: "输入项目备注",
                            value: ""
                        });

                    } catch {
                        vscode.window.showInformationMessage(`添加失败!`);
                    }

                }
            }).then((value: any) => {
                if (value) {

                    id = `${Date.now()}`;
                    remark = value;
                    // vscode.window.showInformationMessage(name, id, remark);
                    var sql = `insert into project(id,name,remark) values('${id}','${name}','${value}')`;
                    // vscode.window.showInformationMessage(sql);
                    mssql_async(sql);
                    // 添加包含关系
                    var sql = `insert into protopro(proid,dproid) values('${args.pid}','${id}')`;
                    return mssql_async(sql);
                }
                else {
                    vscode.window.showInformationMessage(`请输入正确的备注`);
                }

            }).then((values: any) => {
                if (values) {
                    vscode.window.showInformationMessage(name + "添加成功");
                    this.refresh();
                }
            });

        }


    }

    pinPro(args: projNode) {
        // 设置为固定
        var sql = `insert into pinpro(pid) values(${args.pid})`;
        mssql_async(sql);
        this.refresh();
    }
    // 添加文件

    async addFile(args: LNodeL) {
        var pid = args.parent.pid;
        // vscode.window.showInformationMessage(pid);
        // 添加文件
        const options: vscode.OpenDialogOptions = {
            canSelectMany: true,
            openLabel: '添加',
            canSelectFiles: true,
            canSelectFolders: false
        };
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
                // if not exists( select fid from fcollect where proid = '1654525531445' and fid in (select id from files where filename = 'Katy Perry - Roar.flac' and path = '/home/guolianshuai/音乐/tmpmusic/'))
                //              declare @id int
                //              select @id=id from files where filename = 'Katy Perry - Roar.flac' and path = '/home/guolianshuai/音乐/tmpmusic/'
                //              select @id
                //              insert into fcollect(proid,fid) values('123',@id)
                // if  exists(select id from files where filename = 'TheFatRat、Laura Brehm - Monody(1).flac' and path = '/home/guolianshuai/音乐/tmpmusic/')
                // insert into files(filename,path,size,remark,pinx) 
                // values('TheFatRat、Laura Brehm - Monody(1).flac','/home/guolianshuai/音乐/tmpmusic/',4096,'由文件列表添加/home/guolianshuai/音乐/tmpmusic/TheFatRat、Laura Brehm - Monody(1).flac',0)
                var sql = `if  not exists(select id from files where filename = '${a[a.length - 1]}' and path = '${b}')
                insert into files(filename,path,size,remark,pinx) 
                values('${a[a.length - 1]}','${b}',${stats.blksize},'由文件列表添加${files[i].path}',0)`;
                mssql_async(sql);
                vscode.window.showInformationMessage(sql);
                vscode.window.showInformationMessage("成功添加" + a[a.length - 1]);
                // 添加包含关系
                var sql = `if not exists( select fid from fcollect where proid = '${pid}' and fid in (select id from files where filename = '${a[a.length - 1]}' and path = '${b}'))
                             declare @id int
                             select @id=id from files where filename = '${a[a.length - 1]}' and path = '${b}'
                             select @id
                             insert into fcollect(proid,fid) values('${pid}',@id)`;
                vscode.window.showInformationMessage(sql);
                mssql_async(sql);
            });
            // console.log(files[i].path);
        }
        this.refresh();

    }
    addfilefromlist(args: LNodeL) {
        var pid = args.parent.pid;
        let sql = `select * from files where id not in (select fid from fcollect where proid = '${pid}')`;
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
            return vscode.window.showQuickPick(value, { placeHolder: "选择要添加的文件", canPickMany: true });

        }).then((value: any) => {

            console.log(value.length);
            for (let i = 0; value.length; ++i) {
                let sql = `insert into fcollect(proid,fid) values('${pid}',${value[i].description})`;
                mssql_async(sql);
            }
        });
        this.refresh();
    }
    addPage(args: LNodeL) {
        //增加元素，全部刷新，修改数据库然后重新读入
        let pid = args.parent.pid;
        let sql = `select * from pages where url not in (select pageid from pagecollect where proid = '${pid}')`;
        mssql_async(sql).then((value: any) => {
            let pageNodelist: any[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = { label: value.recordset[i].title, description: value.recordset[i].url, detail: value.recordset[i].comment };
                pageNodelist[i] = new_item;

            }
            return pageNodelist;
        }).then((value: any) => {
            // console.log(value);
            return vscode.window.showQuickPick(value, { placeHolder: "选择要添加的网页", canPickMany: true });

        }).then((value: any) => {

            console.log(value.length);
            for (let i = 0; value.length; ++i) {
                let sql = `insert into pagecollect(proid,pageid) values('${pid}','${value[i].description}')`;
                mssql_async(sql);
            }
        });
        this.refresh();

    }
    edittitle(args: projNode){
        vscode.window.showInputBox({
            placeHolder: "回车确认你的修改", value: args.label,
        }).then((value) => {
            if (!value) {
                vscode.window.showInformationMessage('请确认你的修改，本次未保存!');
            }
            else {
                try {

                    mssql_async(`update project set  name = '${value}' where id = ${args.pid}`);
                    // dbcon.update('',);
                    args.label = value;
                    this.refresh();
                    // this._onDidChangeTreeData.fire();

                    vscode.window.showInformationMessage(`备注修改成功!${value}`);

                } catch {

                    vscode.window.showInformationMessage(`备注修改失败!`);
                }
            }

        });

    }
    async importpro(args: projNode) {
        const options: vscode.OpenDialogOptions = {
            canSelectMany: false,
            openLabel: '输出位置',
            canSelectFiles: false,
            canSelectFolders: true
        };


        var fs = require('fs');
        var ipath: any = await vscode.window.showOpenDialog(options);
        // https://blog.51cto.com/lengyuexin/3093082
        // console.log(files.path);
        var fs = require('fs');
        console.log(ipath[0].path);
        var sql = `select * from pages where url in (
            select pageid from pagecollect where proid =  '${args.pid}' or  proid
            in (select dproid from  protopro where protopro.proid = '${args.pid}'))`;
        var dbresp = mssql_async(sql);
        var dbres: any = await dbresp.then((value: any) => {
            let pageNodelist: any = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = {
                    title: value.recordset[i].title, url: value.recordset[i].url, coment: value.recordset[i].comment
                    , pinned: value.recordset[i].pinx
                };
                pageNodelist[i] = new_item;

            }
            return JSON.stringify(pageNodelist);
        }).then((values: any) => {
            console.log(values);
            fs.mkdir(ipath[0].path + `/${args.label}导出`, function (err: any) {
                if (!err) {
                    fs.writeFile(`${ipath[0].path}/${args.label}导出/${args.label}pages.json`, values, function (err: any) {
                        if (err) {
                            console.log('写入失败', err);
                        } else {
                            console.log('写入成功');
                        }
                    });
                }

            });
        }).then(async () => {
            var sql = `select * from files where id in (
                select fid from fcollect where proid =  '${args.pid}' or  proid
                in (select dproid from  protopro where protopro.proid = '${args.pid}'))`;
            var dbresp = mssql_async(sql);
            var dbres: any = await dbresp.then((value: any) => {
                let fileNodelist: any = [];
                for (let i = 0; i < value.recordset.length; ++i) {
                    // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                    let new_item = {
                        filename: value.recordset[i].filename,
                        id: value.recordset[i].id,
                        path: value.recordset[i].path, size: value.recordset[i].size, time: value.recordset[i].time,
                        remark: value.recordset[i].remark, pined: value.recordset[i].pinx
                    };
                    fileNodelist[i] = new_item;
                }
                //复制文件
                // ————————————————参考:
                // 版权声明：本文为CSDN博主「起个破名真费劲..」的原创文章，遵循CC 4.0 BY-SA版权协议，转载请附上原文出处链接及本声明。
                // 原文链接：https://blog.csdn.net/qq_42440234/article/details/99631416
                for (let i = 0; i < fileNodelist.length; ++i) {

                    fs.readFile(fileNodelist[i].path+fileNodelist[i].filename, 'utf-8', function (err:any, data:any) {
                        if (err) {
                            throw err;
                        }
                        fs.writeFile(`${ipath[0].path}/${args.label}导出/${fileNodelist[i].filename}`, data, 'utf-8', function (error:any) {
                            if (error) {
                                throw error;
                            }
                        });
                    });
                    
                }
                return JSON.stringify(fileNodelist);
            }).then((values: any) => {
                console.log(values);

                fs.writeFile(`${ipath[0].path}/${args.label}导出/${args.label}files.json`, values, function (err: any) {
                    if (err) {
                        console.log('写入失败', err);
                    } else {
                        console.log('写入成功');
                    }
                });
            }
            );
        }
        );
    }
    deletePage(args: PageNode) {
        var pid = args.parent.parent.pid;
        vscode.window.showInformationMessage("是否删除(不会删除原项目)", '确认', '取消').then((select) => {
            if (select === '确认') {
                vscode.window.showInformationMessage("已成功从项目中删除" + args.label);
                var sql = `delete from pagecollect where pageid = '${args.url}' and proid = '${pid}'`;
                mssql_async(sql);
            }
            else {
                vscode.window.showInformationMessage("删除失败");
            }
        }
        );
        this.refresh();
    }
    deletefile(args: fileNode) {
        var pid = args.parent.parent.pid;
        vscode.window.showInformationMessage("是否删除(不会删除原项目)", '确认', '取消').then((select) => {
            if (select === '确认') {
                vscode.window.showInformationMessage("已成功从项目中删除" + args.label);
                var sql = `delete from fcollect where fid = ${args.fid} and proid = '${pid}'`;
                mssql_async(sql);
            }
            else {
                vscode.window.showInformationMessage("删除失败");
            }
        }
        );
        this.refresh();
    }
    selectcchilep(pid: string) {

    }
    // [{
    //     label: "固定",
    //     description: "新添加的网页将在固定网页context中"
    // }, {
    //     label: "不固定",
    //     description: "新添加的网页将在不固定网页context中"
    // }], {
    //     placeHolder: '选择是否为固定状态',
    // }

    addchilePro(args: LNodeL) {
        // 显示多选框 列出不包含此项目的项目
        let pid = args.parent.pid;
        let sql = `select * from project where id not in (select proid from protopro where dproid = '${pid}') and id <> '${pid}'`;
        mssql_async(sql).then((value: any) => {
            let projNodelist: any[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = { label: value.recordset[i].name, description: value.recordset[i].id, detail: value.recordset[i].remark };
                projNodelist[i] = new_item;

            }
            return projNodelist;
        }).then((value: any) => {
            // console.log(value);
            return vscode.window.showQuickPick(value, { placeHolder: "选择要添加的项目", canPickMany: true });

        }).then((value: any) => {

            console.log(value.length);
            for (let i = 0; value.length; ++i) {
                let sql = `insert into protopro(proid,dproid) values(${pid},${value[i].description})`;
                mssql_async(sql);
            }
        });
        this.refresh();

    }

    delchilePro(args: LNodeL) {
        // 显示多选框 列出不包含此项目的项目
        let pid = args.parent.pid;
        let sql = `select * from project where id in (select dproid from protopro where proid = '${pid}') and id <> '${pid}'`;
        mssql_async(sql).then((value: any) => {
            let projNodelist: any[] = [];
            for (let i = 0; i < value.recordset.length; ++i) {
                // var newpage =  new Element.Page(value.recordset[i].url, value.recordset[i].title,value.recordset[i].remark,value.recordset[i].pinx);s
                let new_item = { label: value.recordset[i].name, description: value.recordset[i].id, detail: value.recordset[i].remark };
                projNodelist[i] = new_item;
            }
            return projNodelist;
        }).then((value: any) => {
            // console.log(value);
            return vscode.window.showQuickPick(value, { placeHolder: "选择要取消的子项目", canPickMany: true });

        }).then((value: any) => {

            console.log(value.length);
            for (let i = 0; value.length; ++i) {
                let sql = `delete from protopro where proid = ${pid} and dproid = ${value[i].description}`;
                mssql_async(sql);
            }
        });
        this.refresh();
    }


    refresh(): void {
        this._onDidChangeTreeData.fire();
    }
}