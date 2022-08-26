

let f = async function(callBack:any){
  let a = [1,2,3];
  console.log("1");
  await callBack(a);
  console.log("2");

};

f(async (a:any)=>{
   console.log(a);
});