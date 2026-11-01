const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function engine(seed=12345){
 const math=Object.create(Math);math.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const element=()=>({getContext:()=>({}),addEventListener(){},querySelector:()=>({}),textContent:'',value:'',style:{}});
 const elements=new Map();
 const sandbox={console,Math:math,Date,Set,Map,performance:{now:()=>0},
  Image:class {},requestAnimationFrame(){},setTimeout(){},setInterval(){},
  document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll:()=>[],addEventListener(){}},window:{}};
 sandbox.OfficeNavigation=require('../navigation.js');
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../office.js'),'utf8'),sandbox);
 const debug=sandbox.window.__officeDebug;debug.state.eventTimer=Infinity;debug.state.spawnTimer=Infinity;return debug;
}

module.exports=engine;
