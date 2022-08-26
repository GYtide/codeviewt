
import * as dbcon from '../dbcon';

import { mssql_async } from '../mssql_async';

class PageNode {
    name: string;
    constructor(nname: string) {
        this.name = nname;
    }
};




// async function selectALlpagetoNode(){
  
//     var dbresp = mssql_async("select * from pages");
//     var dbres: any = await dbresp.then((value:any)=>{
//         let pageNodelist:PageNode[] = [] ;
//         for(let i =  0; i < value.recordset.length;++i)
//         {
//             pageNodelist[i] = new PageNode(value.recordset[i].title);
//         }
//         return pageNodelist;
//     });
//     return dbres;
// }

// let a = async function(){
    
//     let data = await selectALlpagetoNode().then(value=>{
//         return value;
//     });
//     console.log(data);
    
// };

// a();

mssql_async(`update pages set  comment = '1233' where url = 'https://danmoser.github.io/notes/gai_fits-imgs.html'`)
