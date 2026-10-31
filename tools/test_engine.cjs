const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
function engine(){
 const element=()=>({getContext:()=>({}),addEventListener(){},querySelector:()=>({}),textContent:'',value:'',style:{}});
 const elements=new Map();
 const sandbox={console,Math,Date,Set,Map,performance:{now:()=>0},
  Image:class {},requestAnimationFrame(){},setTimeout(){},setInterval(){},
  document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},querySelectorAll:()=>[],addEventListener(){}},window:{}};
 sandbox.OfficeNavigation=require('../navigation.js');
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../office.js'),'utf8'),sandbox);
 const debug=sandbox.window.__officeDebug;debug.state.eventTimer=Infinity;debug.state.spawnTimer=Infinity;return debug;
}
test('integration: occupied destination leaves current movement intact',()=>{
 const e=engine(),[guest,dev]=e.actors;
 assert.equal(e.sendTo(guest,'desk'),true);assert.equal(e.sendTo(dev,'coffee'),true);
 const route=dev.route;assert.equal(e.sendTo(dev,'desk',true),false);
 assert.equal(dev.route,route);assert.equal(dev.goal,'coffee');assert.equal(e.slots.owner('coffee'),'dev');
});
test('integration: arrival holds slot and successful departure releases it',()=>{
 const e=engine(),[guest,dev]=e.actors;
 e.sendTo(guest,'desk');
 for(let i=0;i<2000&&guest.walking;i++)e.tick(.08);
 assert.equal(guest.walking,false);assert.equal(guest.pose,'type');
 assert.equal(guest.x,e.nodes.desk[0]);assert.equal(guest.y,e.nodes.desk[1]);
 assert.equal(e.sendTo(dev,'desk'),false);
 assert.equal(e.sendTo(guest,'coffee'),true);assert.equal(e.sendTo(dev,'desk'),true);
});
test('integration: unreachable destination does not spawn or reserve',()=>{
 const e=engine(),dev=e.actors[1];e.links.splice(0);
 assert.equal(e.sendTo(dev,'coffee'),false);assert.equal(dev.active,false);
 assert.equal(Object.keys(e.slots.snapshot()).length,0);
});
test('integration: requesting the current location arrives immediately',()=>{
 const e=engine(),a=e.actors[0];a.x=e.nodes.desk[0];a.y=e.nodes.desk[1];
 assert.equal(e.sendTo(a,'desk'),true);assert.equal(a.walking,false);assert.equal(a.pose,'type');
});
