/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from 'vscode';
import * as pagesidebar from './pageData';
import * as filesidebar from './fileDate';
import * as projsidebar from './projDate';
import * as pinprosidebar from './pinproDate';
import * as fs from 'fs';
import { mssql_async } from './dbcon/mssql_async';
const chokidar = require("chokidar");

// import * as sidebar from './test';

export function activate(context: vscode.ExtensionContext) {


	// 监听betterOneTab 的网页保存
	const dir = "/home/guolianshuai/下载/chromedownload/";
	chokidar.watch(dir)
		.on("all", (event: any, path: any) => {
			// vscode.window.showInformationMessage(path);
			if (event === 'unlink') {
				var readDir = fs.readdirSync(dir);
				// console.log(readDir[readDir.length - 1]);
				fs.readFile(dir + readDir[readDir.length - 1], 'utf8', function (err, data) {
					if (err) { console.log(err); };
					var test1 = JSON.parse(data);//读取的值

					// 以列表是否固定决定新的网页是否固定
					var pinx = 0;
					if (test1.pinned) {
						pinx = 1;
					}

					//添加新项目
					var sql = `insert into project(id,name,remark) values('${test1.time}','${test1.title}','${test1.title + "  pinned?:" + test1.pinned}')`;
					// console.log(sql);
					mssql_async(sql);

					var tabs = test1.tabs;

					// 循环插入网页项目
					for (let i = 0; i < tabs.length; ++i) {
						let sql = `
						if not exists(select id from pages where  url = '${tabs[i].url}')
						insert into pages(url ,title,comment,pinx) values(
						'${tabs[i].url}','${tabs[i].title}','由bettrtOneTab列表:${test1.title}批量插入${tabs[i].title}',${pinx}) `;
						mssql_async(sql);
						// vscode.window.showInformationMessage(sql);
					}

					//添加包含关系

					for (let i = 0; i < tabs.length; ++i) {
						let sql = `insert into pagecollect(proid,pageid) values('${test1.time}','${tabs[i].url}')`;
						mssql_async(sql);
					}
					vscode.window.showInformationMessage("已从BetterOneTab列表导入");
				});
			}
		});

	// 监听betterOneTab 的网页保存
	// vscode.commands.registerCommand('saveFrombrowser', () => {

	// });

	//=============注册 helloworld 命令 
	console.log('Congratulations, your extension "codeviewt" is now active!');
	let disposable = vscode.commands.registerCommand('codeviewt.helloWorld', () => {

		vscode.window.showInformationMessage('Hello World from codeviewt!');
	});
	context.subscriptions.push(disposable);
	//========================


	//================注册  侧边栏


	const pagebar = new pagesidebar.PageProvider();
	vscode.window.registerTreeDataProvider('pageDependencies', pagebar);

	const filebar = new filesidebar.FileProvider();
	vscode.window.registerTreeDataProvider('fileDependencies', filebar);

	const projbar = new projsidebar.ProjProvider();
	vscode.window.registerTreeDataProvider('ProDepen', projbar);

	const pinprobar = new pinprosidebar.pinProjProvider();
	vscode.window.registerTreeDataProvider('pinProDepen', pinprobar);

	//===========================


	const rootPath =
		vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
			? vscode.workspace.workspaceFolders[0].uri.fsPath
			: undefined;

	// =============注册命令============
	context.subscriptions.push(
		...initCommand({

			// 网页结点命令
			...{
				// 更改网页结点的备注
				"pageDependencies.editemark": (pageNode: pagesidebar.PageNode) => {
					pageNode.editRemark(context);
				},
				//刷新
				"pageDependencies.refreshEntry": () => {
					pagebar.refresh();

				},
				//添加网页
				"pageDependencies.addEntry": () => {
					pagebar.addTreeItem();
				},
				// 查找网页
				"pageDependencies.find": () => {
					pagebar.find();
				},
				//删除网页
				"page.delete": (args: pagesidebar.PageNode) => {
					pagebar.deleteItem(args.url);
					projbar.refresh();
					pinprobar.refresh();
				},
				//网页结点的点击事件
				'pageClick': (args: pagesidebar.PageNode) => {

					var label = args.label;
					var remark = args.remark;
					var url = args.url;
					vscode.window.showQuickPick([{
						label: label,
						description: url,
						detail: args.remark
					}], {
						placeHolder: '点击以打开此网页',
					}).then((value: any) => {
						vscode.env.openExternal(vscode.Uri.parse(value.description));
						// vscode.window.showInformationMessage('User choose ' + value);
					});

				},
				//直接打开链接
				"page.openLink": (page: pagesidebar.PageNode) => {
					vscode.env.openExternal(vscode.Uri.parse(page.url));
				},
				// 固定网页
				"pageDependencies.pin": (args: pagesidebar.PageNode) => {
					pagebar.pinpage(args.url);
				},
				//取消固定网页
				"pageDependencies.unpin": (args: pagesidebar.PageNode) => {
					pagebar.unpinpage(args.url);
				}

			},
			//  文件结点命令
			...{
				//在编辑器内打开文件
				// 原文链接：https://blog.csdn.net/forward_huan/article/details/108064629
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"file.openFile": (args: filesidebar.fileNode) => {
					filebar.openFile(args.path + args.filename);
				},
				"file.opendefault": (args: filesidebar.fileNode) => {
					vscode.env.openExternal(vscode.Uri.parse(args.path + args.filename));
				},
				"fileDependencies.refreshEntry": () => {
					filebar.refresh();
				},
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"fileDependencies.editemark": (args: filesidebar.fileNode) => {
					filebar.editremark(args);
				},
				// 固定文件
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"fileDependencies.pin": (args: filesidebar.fileNode) => {
					filebar.pinpage(args.fid);
				},
				// 查找文件
				"fileDependencies.find":()=>{
					filebar.find();
				},
				//取消固定文件
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"fileDependencies.unpin": (args: filesidebar.fileNode) => {
					filebar.unpinpage(args.fid);
				},
				//删除文件
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"file.delete": (args: filesidebar.fileNode) => {
					filebar.deleteItem(args);
					projbar.refresh();
					pinprobar.refresh();
				},
				//添加文件
				// eslint-disable-next-line @typescript-eslint/naming-convention
				"fileDependencies.addEntry": (args: pagesidebar.LNodeL) => {
					filebar.addItem(args);
				}

			},
			// 项目结点命令
			...{
				// 添加项目
				"ProDepen.addEntry": (args: any) => {
					// vscode.window.showInformationMessage('aaaaaaaaaa');
					projbar.addProject(args);
				},
				"ProDepen.addpage": (args: any) => {
					projbar.addPage(args);
				},
				"ProDepen.addfile": (args: pagesidebar.LNodeL) => {
					projbar.addFile(args);
				},
				"ProDepen.refreshEntry": () => {
					projbar.refresh();
				},
				// 固定项目
				"ProDepen.pinPro": (args: projsidebar.projNode) => {
					projbar.pinPro(args);
				},
				// 添加子项目
				"addchilePro": (args: pagesidebar.LNodeL) => {
					projbar.addchilePro(args);
					projbar.refresh();
					pinprobar.refresh();
				},
				//删除子项目
				"delchilePro": (args: pagesidebar.LNodeL) => {
					projbar.delchilePro(args);
					projbar.refresh();
					pinprobar.refresh();
				},
				// 从文件列表中添加文件
				"ProDepen.addfilefromlist": (args: pagesidebar.LNodeL) => {
					projbar.addfilefromlist(args);
				},
				// 从项目中删除
				"ProDepen.deletePage": (args: pagesidebar.PageNode) => {
					projbar.deletePage(args);
				},
				"ProDepen.deletefile": (args: filesidebar.fileNode) => {
					projbar.deletefile(args);
				},
				// 导出项目
				"pro.import":(args:projsidebar.projNode)=>{
				   projbar.importpro(args);
				},
				"ProDepen.edittitle":(args:projsidebar.projNode)=>{
					projbar.edittitle(args);
				}
			},
			...{
				"pinProDepen.refreshEntry": () => {
					pinprobar.refresh();
				},
				"pinpro.addpro": () => {

				},
				"pinProDepen.unpinpro": (args: projsidebar.projNode) => {
					pinprobar.unpinPro(args);
				}
			}
		})
	);


}


function commandWrapper(commandDefinition: any, command: string): (...args: any[]) => any {
	return (...args: any[]) => {
		try {
			commandDefinition[command](...args);
		} catch (err) {
			console.log(err);
		}
	};
}

function initCommand(commandDefinition: any): vscode.Disposable[] {

	const dispose = [];

	for (const command in commandDefinition) {
		if (commandDefinition.hasOwnProperty(command)) {
			dispose.push(vscode.commands.registerCommand(command, commandWrapper(commandDefinition, command)));
		}
	}

	return dispose;
}
export function deactivate() { }
