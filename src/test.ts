

var a = [2,3,4];

let y = async function (callback: any) {

    let a = [1, 2, 3];
    console.log("aaaa1");
    callback(a);
    console.log("aaaa2");
};


y((aa: any) => {
    console.log(aa,a);
});