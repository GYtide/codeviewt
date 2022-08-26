
export class Page{

    url:string;
    title:string;
    remark:string;
    pinx:number;
    constructor(curl:string,ctitle:string,rremark:string,ppinx:number){
        this.pinx = ppinx;
        this.remark = rremark;
        this.url = curl;
        this.title = ctitle;
    }
}

export class File{
    filename:string;
    path:string;
    remark:string;
    constructor(cfilename:string,cpath:string,rremark:string){
        this.remark = rremark;
        this.filename = cfilename;
        this.path = cpath;
    }
}