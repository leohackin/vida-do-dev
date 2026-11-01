const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('./engine_fixture.cjs');
function finish(e,a){for(let i=0;i<4000&&a.walking;i++)e.tick(.08);assert.equal(a.walking,false,`${a.id} should arrive`);}
test('every authored slot is reachable, with clearance along every segment',()=>{
 const e=engine();
 for(const points of Object.values(e.interactionSlots))for(const end of points){
  const route=e.floor.route(e.nodes.entry,end);assert.ok(route,`unreachable ${end}`);
  let start=e.nodes.entry;for(const p of route){assert.ok(e.floor.segment(start,p));start=p;}
 }
});
test('capacity refusal preserves movement and reservation; independent slots work',()=>{
 const e=engine(),[guest,dev,ana]=e.actors;
 assert.ok(e.sendTo(guest,'desk'));assert.ok(e.sendTo(dev,'desk'));
 assert.notEqual(guest.slot,dev.slot);
 // A third character cannot materialize on the actor waiting at entry.
 assert.equal(e.sendTo(ana,'arcade'),false);
 ana.active=true;[ana.x,ana.y]=e.interactionSlots.entrance[1];
 const route=guest.route,slot=guest.slot;
 assert.ok(e.sendTo(ana,'arcade'));
 assert.equal(e.sendTo(guest,'arcade',true),false);
 assert.equal(guest.route,route);assert.equal(guest.slot,slot);assert.equal(e.slots.owner(slot),guest.id);
});
test('arrival holds individual slot and departure releases it',()=>{
 const e=engine(),guest=e.actors[0];assert.ok(e.sendTo(guest,'desk'));const slot=guest.slot;
 finish(e,guest);assert.equal(guest.pose,'type');assert.equal(e.slots.owner(slot),'guest');
 assert.ok(e.sendTo(guest,'coffee'));assert.equal(e.slots.owner(slot),undefined);
 assert.equal(guest.transition.kind,'stand');const x=guest.x,y=guest.y;e.tick(.08);assert.equal(guest.x,x);assert.equal(guest.y,y);
});
test('every seated interaction slot has a distinct visual seat',()=>{
 const e=engine();
 for(const destination of ['desk','meeting','lounge','arcade']){
  const seats=e.interactionSlots[destination].map((_,index)=>e.interactionVisual[`${destination}:${index}`]);
  assert.ok(seats.every(Boolean),destination);
  assert.equal(new Set(seats.map(String)).size,seats.length,destination);
 }
});
test('invalid or obstructed origin does not spawn, move or reserve',()=>{
 const e=engine(),guest=e.actors[0];guest.x=400;guest.y=300;
 assert.equal(e.sendTo(guest,'coffee'),false);assert.equal(e.sendTo(e.actors[1],'missing'),false);
 assert.equal(Object.keys(e.slots.snapshot()).length,0);
});
test('requesting current slot arrives immediately',()=>{
 const e=engine(),a=e.actors[0];[a.x,a.y]=e.interactionSlots.desk[0];
 assert.ok(e.sendTo(a,'desk'));assert.equal(a.walking,false);assert.equal(a.pose,'type');
});
test('all characters including PM reach every destination without furniture collisions',()=>{
 for(const id of ['guest','dev','ana','ops','pm'])for(const dest of ['coffee','desk','meeting','lounge','arcade','bathroom','entrance']){
  const e=engine(),a=e.actors.find(a=>a.id===id);e.actors.forEach(o=>o.active=false);
  assert.ok(e.sendTo(a,dest),`${id} -> ${dest}`);
  for(let i=0;i<4000&&a.walking;i++){e.tick(.08);assert.ok(e.floor.clear([a.x,a.y]));}
  assert.equal(a.walking,false,`${id} -> ${dest} arrived`);assert.equal(e.slots.owner(a.slot),id);
 }
});
test('opposing traffic eventually arrives and preserves physical separation',()=>{
 const e=engine(),a=e.actors[0],b=e.actors[1];
 [a.x,a.y]=e.nodes.bathroom;b.active=true;[b.x,b.y]=e.nodes.entry;
 assert.ok(e.sendTo(a,'entrance'));assert.equal(e.sendTo(b,'bathroom',true),false);
 assert.equal(e.queues.bathroom[0],b.id);
 for(let i=0;i<4000&&(a.walking||b.walking||e.queues.bathroom.length);i++){
  for(const o of [a,b])if(!o.walking)o.wait=Infinity;
  e.tick(.08);assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=24-1e-8);
 }
 assert.equal(a.walking,false);assert.equal(b.walking,false);
});
test('pause freezes movement, transitions and simulation timers',()=>{
 const e=engine(),a=e.actors[0];e.sendTo(a,'desk');e.state.running=false;
 const before=JSON.stringify(e.actors);e.tick(.08);assert.equal(JSON.stringify(e.actors),before);assert.equal(e.state.timer,0);
});
test('Dev records all four movement directions for the directional atlas',()=>{
 const e=engine(),dev=e.actors.find(a=>a.id==='dev');dev.active=true;
 for(const [dx,dy,expected] of [[1,1,0],[-1,1,1],[1,-1,2],[-1,-1,3]]){
  dev.x=800;dev.y=600;dev.walking=true;dev.transition=null;dev.route=[{x:800+dx*100,y:600+dy*100}];
  e.tick(.08);assert.equal(dev.facing,expected);
 }
});
test('upper visit keeps its permit during interaction and releases after departure',()=>{
 const e=engine(),[owner,waiting]=e.actors;
 assert.ok(e.sendTo(owner,'coffee'));finish(e,owner);owner.wait=Infinity;
 assert.ok(e.sendTo(waiting,'desk'));
 const route=waiting.route,slot=waiting.slot;
 assert.equal(e.sendTo(waiting,'bathroom',true),false);
 assert.equal(waiting.route,route);assert.equal(waiting.slot,slot);
 e.tick(.08);assert.equal(waiting.goal,'desk');
 assert.ok(e.sendTo(owner,'entrance'));
 e.tick(.08);assert.equal(waiting.goal,'desk');
 for(let i=0;i<4000&&e.queues.bathroom.length;i++)e.tick(.08);
 assert.equal(waiting.goal,'bathroom');assert.equal(e.queues.bathroom.length,0);
 assert.ok(owner.y>=565,'outgoing actor cleared the upper area before admission');
});
test('FIFO queue preserves old route, serves vacancies, and cancels on retarget',()=>{
 const e=engine(),a=e.actors[0],b=e.actors[1];
 assert.ok(e.sendTo(a,'arcade'));assert.ok(e.sendTo(b,'coffee'));
 const route=b.route,slot=b.slot;
 assert.equal(e.sendTo(b,'arcade',true),false);assert.equal(b.route,route);assert.equal(b.slot,slot);
 assert.equal(e.queues.arcade[0],b.id);
 assert.ok(e.sendTo(a,'desk'));e.tick(.08);
 assert.equal(b.goal,'arcade');assert.equal(e.queues.arcade.length,0);
 assert.equal(e.slots.owner(slot),undefined);
 e.queues.coffee.push(b.id);assert.ok(e.sendTo(b,'lounge'));assert.equal(e.queues.coffee.length,0);
});
test('repeated manual requests preserve FIFO priority and serve the original head',()=>{
 const e=engine(),[owner,first,second]=e.actors;
 assert.ok(e.sendTo(owner,'arcade'));
 for(const [a,p] of [[first,e.interactionSlots.entrance[1]],[second,e.interactionSlots.meeting[0]]]){
  a.active=true;[a.x,a.y]=p;
  assert.equal(e.sendTo(a,'arcade',true),false);
 }
 for(const a of [first,second,first])assert.equal(e.sendTo(a,'arcade',true),false);
 assert.deepEqual(Array.from(e.queues.arcade),[first.id,second.id]);
 assert.ok(e.sendTo(owner,'desk'));e.tick(.08);
 assert.equal(e.slots.owner('arcade:0'),first.id);
 assert.deepEqual(Array.from(e.queues.arcade),[second.id]);
 // A different full destination replaces the pending request instead of duplicating it.
 assert.ok(e.sendTo(owner,'bathroom'));
 assert.equal(e.sendTo(second,'bathroom',true),false);
 assert.equal(e.queues.arcade.length,0);
 assert.deepEqual(Array.from(e.queues.bathroom),[second.id]);
});
for(const seed of [42,7,2026])test(`seed ${seed}: five-character routines stay separated and continue moving`,()=>{
 const e=engine(seed);e.state.spawnTimer=0;e.state.eventTimer=10;
 const lastMoved=new Map(),arrivals=new Map();
 for(let i=0;i<3000;i++){
  const before=new Map(e.actors.map(a=>[a.id,{x:a.x,y:a.y,walking:a.walking}]));
  e.tick(.08);
  for(const a of e.actors){const p=before.get(a.id);
   if(a.active&&Math.hypot(a.x-p.x,a.y-p.y)>.01)lastMoved.set(a.id,e.state.timer);
   if(p.walking&&!a.walking)arrivals.set(a.id,(arrivals.get(a.id)||0)+1);
  }
  const visible=e.actors.filter(a=>a.active&&a.visible);
  for(const a of visible){assert.ok(e.floor.clear([a.x,a.y]),a.id);
   for(const b of visible)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>=24-1e-8,`${a.id}/${b.id}`);
  }
  const owners=Object.values(e.slots.snapshot());assert.equal(new Set(owners).size,owners.length);
 }
 assert.equal(e.actors.filter(a=>a.active).length,5);
 for(const a of e.actors){
  assert.ok((arrivals.get(a.id)||0)>=2,`${a.id} completed at least two trips`);
  assert.ok(e.state.timer-(lastMoved.get(a.id)||0)<60,`${a.id} moved in the last minute`);
 }
});
test('coworkers at different slots exchange role-specific dialogue',()=>{
 const e=engine(),dev=e.actors[1],pm=e.actors.find(a=>a.id==='pm');
 for(const [a,p] of [[dev,e.interactionSlots.meeting[0]],[pm,e.interactionSlots.meeting[1]]]){
  a.active=true;a.visible=true;a.walking=false;a.goal='meeting';[a.x,a.y]=p;
 }
 e.arrive(pm);assert.match(pm.bubble.text,/5 min/);assert.match(dev.bubble.text,/commit/);
});
