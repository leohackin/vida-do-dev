/* Vida do Dev · illustrated office engine v0.14
 * Native Canvas2D: no remote APIs, game framework or online dependency.
 * All 3D-ish world positions are authored in source-image pixels (1536 × 1024).
 * Background is the user-approved illustration with one movable figure extracted.
 */
'use strict';
const cv=document.getElementById('scene'),ctx=cv.getContext('2d',{alpha:true});
const $=id=>document.getElementById(id);
const W=1536,H=1024,images={};
const imageSources={background:'assets/office-clean.png',brand:'assets/reference-original.png',guest:'assets/guest-walksheet.png',dev:'assets/dev-sheet.png',devMove:'assets/dev-directional.png',seated:'assets/seated-atlas.png',ana:'assets/ana-sheet.png',ops:'assets/ops-sheet.png',pm:'assets/pm-sheet.png'};
let loaded=0;Object.entries(imageSources).forEach(([name,url])=>{const img=new Image();img.src=url;img.onload=()=>{loaded++;};img.onerror=()=>{console.error('Erro ao carregar sprite',url);};images[name]=img;});
// Hand-authored foot-space map: furniture is solid, targets remain on visible floor.
// Enclosed meeting room and occupied seats are approached from the corridor.
const boundary=[[265,410],[540,405],[575,325],[895,210],[920,385],[1080,435],[1120,630],[970,815],[945,880],[875,866],[765,840],[470,815],[385,730],[265,660]];
const obstacles=[
 [[805,370],[904,400],[914,455],[817,427]],
 [[640,302],[667,302],[669,321],[638,321]],
 [[736,309],[765,309],[771,330],[730,330]],
 [[320,213],[493,214],[550,268],[550,395],[380,398],[321,355]],
 [[575,407],[650,367],[827,381],[847,462],[800,533],[658,558],[570,510]],
 [[680,472],[748,450],[788,519],[739,555],[688,547]],
 [[770,544],[815,534],[868,581],[843,628],[784,636],[752,599]],
 [[840,526],[922,500],[978,530],[942,580],[865,581]],
 [[280,447],[431,442],[502,544],[365,636],[290,589]],
 [[420,661],[604,581],[706,650],[647,736],[473,797]],
 [[561,800],[746,727],[864,788],[848,892],[683,928]],
 [[990,651],[1074,618],[1271,735],[1238,808],[1110,844],[973,769]]
];
const floor=OfficeNavigation.createFloor(boundary,obstacles,12,6);
const nodes={entry:[936,852],hall:[930,816],desk:[888,744],coffee:[600,350],bathroom:[850,245],meeting:[925,625],sofa:[900,628],arcade:[1090,604]};
const destinations={
 coffee:{node:'coffee',label:'Copa',action:'coffee',bubble:'Sem café, sem deploy.'},
 desk:{node:'desk',label:'Estações',action:'type',bubble:'Passou local. Em produção veremos.'},
 meeting:{node:'meeting',label:'Sala de reunião',action:'sit',bubble:'Essa reunião podia ser um e-mail.'},
 lounge:{node:'sofa',label:'Descompressão',action:'sit',bubble:'Cinco minutinhos de paz.'},
 arcade:{node:'arcade',label:'Acesso ao fliperama',action:'sit',bubble:'Mais uma fase e eu volto.'},
 bathroom:{node:'bathroom',label:'Banheiro',action:'hide',bubble:'AFK. Já volto.'},
 entrance:{node:'entry',label:'Entrada',action:'idle',bubble:'Bora codar. Ou tentar.'}
};
const interactionSlots={
 coffee:[[600,350],[628,345]],desk:[[888,744],[760,680]],
 meeting:[[900,700],[1000,600]],lounge:[[900,628],[942,650]],
 arcade:[[1090,604]],bathroom:[[850,245]],entrance:[[936,852],[908,832]]
};
// Visual seats are separate from safe foot-space approach points. The logical
// body remains in the corridor for routing; sit/stand transitions interpolate
// to the reconstructed chair or sofa without moving collision geometry inside furniture.
const interactionVisual={
 'desk:0':[1030,790],'desk:1':[620,840],
 'meeting:0':[1200,375],'meeting:1':[1300,390],
 'lounge:0':[640,485],'lounge:1':[755,480],
 'arcade:0':[1350,675]
};
const npcEvents=[
 {name:'SÓ MAIS UM COMMIT',desc:'O Dev jurou que este é o último de hoje.',lines:['só mais um commit...','o último. agora vai.'],dest:'desk'},
 {name:'DEPLOY SURPRESA',desc:'Uma alteração pequena quebrou três serviços.',lines:['quem subiu isso?', 'na minha máquina funciona.'],dest:'desk'},
 {name:'QUICK CALL',desc:'O PM só precisava de cinco minutinhos.',lines:['tem 5 min pra uma ideia?', 'acabou de virar uma sprint.'],dest:'meeting'},
 {name:'CHAMADO DE PRODUÇÃO',desc:'Um bug só aparece quando alguém está olhando.',lines:['bug de novo?!', 'já tentou reiniciar?'],dest:'desk'},
 {name:'CAFÉ ACABOU',desc:'Incidente de severidade máxima na copa.',lines:['acabou o café?', 'SEV-1. chama o time.'],dest:'coffee'},
 {name:'PAUSA MERECIDA',desc:'O sofá venceu o sprint.',lines:['pausa também faz parte.', '5 minutinhos...'],dest:'lounge'},
 {name:'MODO ARCADE',desc:'Alguém está fazendo benchmarking de fliperama.',lines:['essa fase é um feature.', 'GAME OVER. de novo.'],dest:'arcade'},
 {name:'SEM TESTE EM PROD',desc:'O QA sente um distúrbio na força.',lines:['alguém testou?', 'testei no localhost.'],dest:'desk'},
 {name:'REUNIÃO QUE NÃO ACABA',desc:'O requisito mudou enquanto a apresentação carregava.',lines:['mudança de escopo...', 'mas é só um botão.'],dest:'meeting'}
];
const actorDefs=[
 {id:'guest',name:'Visitante',img:'guest',x:930,y:816,speed:95,delay:0,home:'desk',active:true},
 {id:'dev',name:'O Dev',img:'dev',x:1075,y:865,speed:81,delay:1.6,home:'lounge',active:false},
 {id:'ana',name:'Ana',img:'ana',x:1319,y:815,speed:105,delay:3,home:'desk',active:false},
 {id:'pm',name:'PM',img:'pm',x:1056,y:900,speed:90,delay:7,home:'meeting',active:false},
 {id:'ops',name:'Ops',img:'ops',x:716,y:835,speed:87,delay:5,home:'coffee',active:false}
];
const actors=actorDefs.map(v=>({...v,route:[],goal:null,pose:'idle',elapsed:0,wait:2+v.delay,dir:0,facing:0,bubble:null,blink:0,paused:false,visible:true,walking:false,alpha:1,slot:null,transition:null,motionTime:0,blocked:0}));
const findActor=id=>actors.find(a=>a.id===id);
const state={running:true,speed:1,zoom:1,panX:0,panY:0,markers:false,time:'real',season:'auto',spawnTimer:14,selected:'guest',timer:0,eventTimer:11,storyTimer:0,ambience:false,part:[],fx:[],hover:null,manual:false};
let last=performance.now(),audio=null,pan=null,nowTime=Date.now();
const rand=(a,b)=>a+Math.random()*(b-a),choose=a=>a[Math.floor(Math.random()*a.length)],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function day(){return new Date();}
function activeSeason(){if(state.season!=='auto')return state.season;let d=day(),m=d.getMonth()+1,k=d.getDate();if(m===10&&k>=28)return'halloween';if(m===12&&k>=10&&k<=26)return'christmas';let prog=new Date(d.getFullYear(),0,1);let n=Math.floor((Date.UTC(d.getFullYear(),m-1,k)-Date.UTC(d.getFullYear(),0,1))/86400000)+1;if(n===256)return'programmer';return'normal';}
const slots=OfficeNavigation.createSlots();
const queues=Object.fromEntries(Object.keys(destinations).map(k=>[k,[]]));
let queueTimer=0;
function cancelQueue(id){for(const queue of Object.values(queues)){const i=queue.indexOf(id);if(i>=0)queue.splice(i,1);}}
// The upper cul-de-sac has no proven passing place. Admit one visit at a time,
// retaining its permit through the interaction and the return through the aisle.
// Rejected visitors keep their current route AND slot, rather than stopping in
// the middle of a released slot that another actor has already reserved.
let upperOwner=null;
const upperDestination=which=>which==='coffee'||which==='bathroom';
const inUpper=a=>a.y<390||(a.x<770&&a.y<565);
function refreshUpperOwner(){
 const owner=findActor(upperOwner);
 if(owner&&(!owner.active||(!inUpper(owner)&&!upperDestination(owner.goal))))upperOwner=null;
 if(upperOwner===null){const inside=actors.find(a=>a.active&&inUpper(a));if(inside)upperOwner=inside.id;}
}
function pathBetween(a,b,point=nodes[destinations[b]?.node],blocked=[]){
 const path=point&&floor.route([a.x,a.y],point,blocked);
 return path?path.filter(p=>dist([a.x,a.y],p)>.01).map(p=>({x:p[0],y:p[1]})):path;
}
function sendTo(a,which,user=false){
 if(!a||!destinations[which])return false;
 refreshUpperOwner();
 const upperFull=upperDestination(which)&&upperOwner!==null&&upperOwner!==a.id;
 const origin=a.active?a:{x:nodes.entry[0],y:nodes.entry[1]};
 const occupied=actors.filter(o=>o!==a&&o.active&&o.visible).map(o=>[o.x,o.y]);
 let choice=null;
 for(const [i,point] of interactionSlots[which].entries()){
  const key=`${which}:${i}`,owner=slots.owner(key);
  if(owner!==undefined&&owner!==a.id)continue;
  const route=pathBetween(origin,which,point,occupied);
  if(!route)continue;
  const length=route.reduce((v,p,i)=>v+dist(i?[route[i-1].x,route[i-1].y]:[origin.x,origin.y],[p.x,p.y]),0);
  if(!choice||length<choice.length)choice={key,route,length};
 }
 const capacityFull=interactionSlots[which].every((_,i)=>slots.owner(`${which}:${i}`)!==undefined&&slots.owner(`${which}:${i}`)!==a.id);
 const ahead=queues[which][0]&&queues[which][0]!==a.id&&!(upperDestination(which)&&upperOwner===a.id);
 if(!choice||ahead||upperFull){
  if(user&&(capacityFull||ahead||upperFull)){
   // Repeated clicks on the same destination must not surrender FIFO priority.
   if(!queues[which].includes(a.id)){cancelQueue(a.id);queues[which].push(a.id);}
   setStory(`${a.name} está na fila de ${destinations[which].label.toLowerCase()}. A rota atual foi mantida.`);
  }
  else if(user)setStory('Não há caminho seguro disponível. A rota atual foi mantida.');
  return false;
 }
 // Entry is a physical spawn point too; do not materialize on another actor.
 if(!a.active&&actors.some(other=>other!==a&&other.active&&other.visible&&dist([other.x,other.y],nodes.entry)<floor.radius*2))return false;
 if(!a.visible&&actors.some(o=>o!==a&&o.active&&o.visible&&dist([o.x,o.y],[a.x,a.y])<floor.radius*2))return false;
 if(!slots.reserve(a.id,choice.key))return false;
 if(upperDestination(which))upperOwner=a.id;
 cancelQueue(a.id);
 if(!a.active){a.active=true;a.x=nodes.entry[0];a.y=nodes.entry[1];}
 const wasSeated=['sit','type'].includes(a.pose)&&!a.walking;
 a.slot=choice.key;a.route=choice.route;a.goal=which;a.pose='walk';a.visible=true;a.walking=true;a.wait=0;a.bubble=null;a.alpha=1;a.motionTime=0;a.blocked=0;
 a.transition=wasSeated?{kind:'stand',t:0,duration:.35}:null;
 if(user){state.manual=true;setStory(`${a.name} está indo para ${destinations[which].label.toLowerCase()}.`);setStatus('A CAMINHO',`${a.name} → ${destinations[which].label}`);speech(a,'já vou!',2.2);}
 if(!a.route.length)arrive(a);
 return true;
}
function speech(a,msg,secs=4){a.bubble={text:msg,t:secs};}
function setStory(msg){$('story').textContent=msg;}
function setStatus(name,sub){$('eventName').textContent=name;$('eventText').textContent=sub;}
function playEvent(custom){let ev=custom||choose(npcEvents);setStatus(ev.name,ev.desc);setStory(ev.desc);
 const lead=findActor(state.selected)||actors[0];sendTo(lead,ev.dest);speech(lead,choose(ev.lines),5);state.eventTimer=rand(19,30);
 for(let i=0;i<25;i++)state.fx.push({x:rand(700,1330),y:rand(280,820),dy:rand(15,50),t:rand(1,2.6),sz:rand(2,5),col:choose(['#ffd45e','#93dcff','#e9a3d3','#f6faf8'])});
}
function arrive(a){a.walking=false;a.route=[];let d=destinations[a.goal]||destinations.desk;a.pose=d.action;a.transition=['sit','type'].includes(d.action)?{kind:'sit',t:0,duration:.5}:null;a.wait=rand(5,12);if(a.id==='dev')a.wait+=2;
 if(a.goal==='bathroom'){a.visible=false;a.wait=rand(3,6);}
 else {a.visible=true;a.alpha=1; if(Math.random()<.72)speech(a,d.bubble,rand(3,5));
  const colleague=actors.find(o=>o!==a&&o.active&&o.visible&&!o.walking&&o.goal===a.goal);
  if(colleague){const replies={dev:'só mais um commit...',ana:'no mobile também?',ops:'e o rollback?',pm:'tem 5 min pra uma ideia?',guest:'primeiro, um café.'};speech(a,replies[a.id],4);speech(colleague,replies[colleague.id],5);}
 }
}
function tick(dt){if(!state.running)return;dt=Math.min(dt,.08)*state.speed;state.timer+=dt;state.eventTimer-=dt;
 if(state.eventTimer<0)playEvent();
 state.spawnTimer-=dt;if(state.spawnTimer<=0){const newGuy=actors.find(a=>!a.active&&a.id!=='guest');
  const spawned=newGuy&&(sendTo(newGuy,newGuy.home)||sendTo(newGuy,'entrance'));
  if(spawned){setStory(`${newGuy.name} acabou de chegar ao escritório.`);speech(newGuy,'bom dia, pessoal!',4);}state.spawnTimer=spawned?rand(15,25):1;
 }
 queueTimer-=dt;if(queueTimer<=0){for(const [dest,queue] of Object.entries(queues))if(queue.length)sendTo(findActor(queue[0]),dest);queueTimer=.5;}
 refreshUpperOwner();
 for(let a of actors){if(!a.active)continue;a.elapsed+=dt;if(a.transition){a.transition.t+=dt;if(a.transition.t>=a.transition.duration)a.transition=null;}if(a.bubble){a.bubble.t-=dt;if(a.bubble.t<=0)a.bubble=null;}
  if(a.walking&&a.route.length){
   if(a.transition)continue;
   let p=a.route[0],dx=p.x-a.x,dy=p.y-a.y,l=Math.hypot(dx,dy),step=Math.min(a.speed*dt,l);
   const next=l?[a.x+dx/l*step,a.y+dy/l*step]:[a.x,a.y];
   const others=actors.filter(o=>o!==a&&o.active&&o.visible);
   if(others.some(o=>dist(next,[o.x,o.y])<floor.radius*2)){
    a.blocked+=dt;
    if(a.blocked>.5){const target=interactionSlots[a.goal][Number(a.slot.split(':')[1])];const route=pathBetween(a,a.goal,target,others.map(o=>[o.x,o.y]));if(route)a.route=route;a.blocked=0;}
    continue;
   }
   a.blocked=0;a.motionTime+=dt;a.x=next[0];a.y=next[1];a.dir=dx>=0?0:1;
   a.facing=dy>=0?(dx>=0?0:1):(dx>=0?2:3);
   if(l<=step+.001){a.route.shift();if(!a.route.length)arrive(a);}
  }else if(!a.walking){a.wait-=dt;if(a.wait<=0){const options=a.id==='dev'?['coffee','desk','lounge','meeting','bathroom']:a.id==='ops'?['desk','coffee','arcade','bathroom']:['coffee','meeting','arcade','lounge','desk','bathroom'];if(Object.values(queues).some(q=>q.includes(a.id))||!sendTo(a,choose(a.id==='pm'?['meeting','coffee','desk']:options)))a.wait=1;}}
 }
 for(let f of state.fx){f.y-=f.dy*dt;f.t-=dt;f.x+=Math.sin(state.timer*3+f.y)*dt*18;}state.fx=state.fx.filter(f=>f.t>0);
}
function seatRenderState(a,sitting){
 const progress=a.transition?Math.min(1,a.transition.t/a.transition.duration):1;
 const seated=a.transition?(a.transition.kind==='sit'?progress:1-progress):(sitting?1:0);
 // A straight interpolation to a chair visibly crossed the furniture between
 // its safe approach point and the authored seat. Change depth while hidden:
 // fade at the approach, switch layers at zero opacity, then reveal in place.
 const visualSeated=a.transition?(seated>=.5?1:0):seated;
 const renderAlpha=a.alpha*(a.transition?Math.abs(progress*2-1):1);
 const visual=interactionVisual[a.slot];
 return {progress,visualSeated,renderAlpha,x:visual&&visualSeated?visual[0]:a.x,y:visual&&visualSeated?visual[1]:a.y};
}
function imgDraw(a){if(!a.active||!a.visible)return;const im=images[a.img];if(!im?.complete||!im.naturalWidth)return;
 const sitting=['sit','type'].includes(a.pose)&&!a.walking,typing=a.pose==='type'&&!a.walking;
 let {visualSeated,renderAlpha,x,y}=seatRenderState(a,sitting);
 let t=a.elapsed;let step=a.walking?Math.floor(a.motionTime*9)%6:0;let phase=a.walking&&!a.transition?Math.sin(a.motionTime*9)*1.3:Math.sin(t*1.2)*.45;
 if(visualSeated&&images.seated?.complete&&images.seated.naturalWidth){
  const cells={guest:[0,434],dev:[434,435],ana:[869,434],ops:[1303,435],pm:[1738,434]};
  const [sx,sw]=cells[a.id],sh=724,targetHeight=138,targetWidth=sw/sh*targetHeight;
  // Seated actors are supported by furniture, so a floor shadow under their
  // shoes makes them look perched on top of the cushion or chair.
  ctx.save();ctx.globalAlpha=renderAlpha;
  // Nearest-neighbour downscaling keeps the seated art in the same crisp,
  // pixel-edged visual language as each character's walking sheet.
  ctx.imageSmoothingEnabled=false;ctx.drawImage(images.seated,sx,0,sw,sh,x-targetWidth/2,y-targetHeight+phase,targetWidth,targetHeight);ctx.restore();
  return;
 }
 let frameX=step,frameY=0,sw=78,sh=183,dw=78,dh=183;
 if(a.id==='dev'&&images.devMove?.complete&&images.devMove.naturalWidth){
  const frames=[
   [[119,35,165,275],[425,36,126,276],[690,35,159,275],[992,36,147,275]],
   [[115,337,170,277],[420,337,133,276],[698,338,164,276],[1000,338,146,276]],
   [[116,638,163,276],[410,638,138,275],[697,638,163,277],[984,639,155,275]],
   [[113,933,161,282],[407,933,148,281],[691,933,166,282],[986,933,156,282]]
  ];
  const frameIndex=a.walking&&!a.transition?Math.floor(a.motionTime*6)%4:1;
  const [sx,sy,sourceWidth,sourceHeight]=frames[a.facing][frameIndex];
  // The directional atlas is tightly cropped while the legacy sheets include
  // generous transparent margins. Match the visible character scale rather
  // than the raw frame height so Dev belongs in the same perspective.
  let targetHeight=148,targetWidth=sourceWidth/sourceHeight*targetHeight;
  targetHeight*=1-.18*visualSeated;
  ctx.save();ctx.globalAlpha=renderAlpha;ctx.fillStyle='rgba(29,26,25,.30)';ctx.beginPath();ctx.ellipse(x,y+1,25,6,0,0,2*Math.PI);ctx.fill();
  ctx.translate(x-targetWidth/2,y-targetHeight+phase);ctx.translate(0,34*visualSeated);ctx.imageSmoothingEnabled=true;
  ctx.drawImage(images.devMove,sx,sy,sourceWidth,sourceHeight,0,0,targetWidth,targetHeight);
  if(a.pose==='coffee'&&!a.walking){
   const mugX=targetWidth*.70,mugY=targetHeight*.56;
   ctx.fillStyle='#f4f1e8';ctx.strokeStyle='#313238';ctx.lineWidth=1.5;
   ctx.beginPath();ctx.roundRect(mugX,mugY,9,11,2);ctx.fill();ctx.stroke();
   ctx.beginPath();ctx.arc(mugX+10,mugY+5.5,3.2,-Math.PI/2,Math.PI/2);ctx.stroke();
  }
  if(a.pose==='type'&&!a.walking){ctx.fillStyle='#ecbc83';ctx.beginPath();ctx.ellipse(targetWidth*.59,targetHeight*.61+Math.sin(t*12)*1.2,4.5,2.5,0,0,2*Math.PI);ctx.fill();}
  ctx.restore();
  return;
 }
 if(a.img==='dev'){sw=112;sh=202;dw=103;dh=187;
  frameY=a.pose==='walk'?1:a.pose==='coffee'?2:a.pose==='type'?3:0;
  frameX=a.walking?step:(a.pose==='coffee'||a.pose==='type'?Math.floor(t*4)%6:0);
 }else{frameY=a.dir===1?1:0;frameX=a.walking?step:0;}
 dh*=1-.18*visualSeated;y-=15*visualSeated;
 if(typing){y+=Math.sin(t*8)*1.3;}
 const flicker=(a.id==='dev'&&!a.walking&&a.pose==='idle'&&Math.sin(t*1.47)>.996); // blink
 ctx.save();ctx.globalAlpha=renderAlpha;
 // soft contact shadow, no dark rectangle around transparent sprites
 ctx.fillStyle='rgba(29,26,25,.30)';ctx.beginPath();ctx.ellipse(x,y+1,24*(sitting?1.25:1),6,0,0,2*Math.PI);ctx.fill();
 ctx.translate(x-dw/2,y-dh+phase);ctx.translate(0,34*visualSeated);
 ctx.imageSmoothingEnabled=true;
 ctx.drawImage(im,frameX*sw,frameY*sh,sw,sh,0,0,dw,dh);
 // tiny typing keyboard motion superimposed only while at desk
 if(typing){ctx.fillStyle='#ecbc83';ctx.fillRect(dw*.53,dh*.60+Math.sin(t*12)*2,8,3);}
 if(flicker){ctx.strokeStyle='#201a18';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(dw*.42,dh*.36);ctx.lineTo(dw*.61,dh*.36);ctx.stroke();}
 ctx.restore();
}
const coverLayers=[
 // these masks reproduce original real furniture pixels, allowing the walking sprites to move 'behind' desks, sofas and foreground glass
 {name:'sofa',poly:[[610,455],[850,455],[868,514],[800,563],[677,565],[610,525]],rect:[600,445,280,120],pred:a=>(a.y<573&&a.x>602&&a.x<870)||(a.goal==='lounge'&&!a.walking)},
 {name:'arcade-table',poly:[[1207,537],[1284,526],[1358,566],[1357,611],[1300,655],[1210,616]],rect:[1195,520,180,150],pred:a=>(a.x>1194&&a.x<1375&&a.y<677)||(a.goal==='arcade'&&!a.walking)},
 {name:'coffee-island',poly:[[323,215],[492,215],[532,258],[518,378],[383,392],[330,351]],rect:[319,207,220,197],pred:a=>a.x<550&&a.y<414},
 {name:'meeting-glass',poly:[[1094,275],[1410,286],[1530,477],[1530,650],[1391,522],[1220,425],[1070,351]],rect:[1060,275,470,375],pred:a=>a.x>1080&&a.y<490},
 {name:'meeting-table',poly:[[1120,330],[1370,330],[1405,380],[1190,415]],pred:a=>a.goal==='meeting'&&!a.walking},
 {name:'desk-right',poly:[[965,720],[1215,720],[1270,820],[995,855]],pred:a=>a.slot==='desk:0'&&!a.walking},
 {name:'desk-lower',poly:[[525,780],[785,780],[845,900],[590,950]],pred:a=>a.slot==='desk:1'&&!a.walking}
];
const obstacleDepth=obstacles.map(poly=>({poly,minX:Math.min(...poly.map(p=>p[0])),maxX:Math.max(...poly.map(p=>p[0])),maxY:Math.max(...poly.map(p=>p[1]))}));
function redrawBackgroundPoly(poly){ctx.save();ctx.beginPath();ctx.moveTo(poly[0][0],poly[0][1]);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i][0],poly[i][1]);ctx.closePath();ctx.clip();ctx.drawImage(images.background,0,0,W,H);ctx.restore();}
function drawOcclusion(a){if(!images.background?.complete)return;
 const sitting=['sit','type'].includes(a.pose)&&!a.walking;
 const loungeSeated=a.goal==='lounge'&&seatRenderState(a,sitting).visualSeated;
 // Every collision polygon is also a ground-contact depth mask. When an actor
 // walks behind its front edge, restore those furniture pixels over the feet.
 // This makes rendering obey the same geometry that A* already treats as solid.
 // On the sofa, the authored seated sprite includes knees and lower legs in
 // front of the cushion; repainting the sofa would cut the actor at the waist.
 for(const layer of obstacleDepth)if(!loungeSeated&&a.x>layer.minX-55&&a.x<layer.maxX+55&&a.y<layer.maxY+18)redrawBackgroundPoly(layer.poly);
 for(const cover of coverLayers)if(!(loungeSeated&&cover.name==='sofa')&&cover.pred(a))redrawBackgroundPoly(cover.poly);
}
function drawBubble(a){if(!a.active||!a.visible||!a.bubble)return;let v=a.bubble.text,lines=[];let parts=v.split(' '),s='';for(let w of parts){let test=s?s+' '+w:w;if(test.length>23&&s){lines.push(s);s=w;}else s=test;}if(s)lines.push(s);lines=lines.slice(0,3);
 ctx.save();ctx.font='bold 16px system-ui, sans-serif';let bw=Math.max(105,...lines.map(l=>ctx.measureText(l).width+27));let bh=lines.length*21+16;let x=Math.min(1536-bw-18,Math.max(18,a.x-bw/2)),y=Math.max(90,a.y-(a.img==='dev'?209:194)-bh-15);
 ctx.fillStyle='rgba(255,255,255,.98)';ctx.strokeStyle='#1f1c1c';ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(x,y,bw,bh,13);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(a.x-6,y+bh-1);ctx.lineTo(a.x+2,y+bh+13);ctx.lineTo(a.x+12,y+bh-1);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.fillRect(a.x-3,y+bh-4,9,4);
 ctx.fillStyle='#161616';ctx.textAlign='center';lines.forEach((l,i)=>ctx.fillText(l,x+bw/2,y+25+i*21));ctx.restore();}
function drawTargets(){if(!state.markers)return;for(const [key,d] of Object.entries(destinations)){let [x,y]=nodes[d.node];let t=state.timer*.001;ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#ffd35d';ctx.fillStyle='rgba(13,16,20,.78)';ctx.beginPath();ctx.arc(x,y,12+Math.sin(state.timer*1.5)*2,0,2*Math.PI);ctx.fill();ctx.stroke();ctx.fillStyle='#ffd35d';ctx.beginPath();ctx.arc(x,y,3,0,2*Math.PI);ctx.fill();ctx.font='bold 14px system-ui';ctx.textAlign='center';let tw=ctx.measureText(d.label).width+21;ctx.fillStyle='rgba(15,16,20,.92)';ctx.beginPath();ctx.roundRect(x-tw/2,y-42,tw,24,5);ctx.fill();ctx.fillStyle='#fff5d1';ctx.fillText(d.label,x,y-25);ctx.restore();}}
function drawEffects(){let time=state.time,hr=new Date().getHours();if(time==='real')time=hr<7||hr>20?'night':hr>=17?'sunset':'morning';
 if(time==='night'){ctx.fillStyle='rgba(12,22,57,.24)';ctx.globalCompositeOperation='source-atop';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 if(time==='sunset'){ctx.fillStyle='rgba(231,126,53,.085)';ctx.globalCompositeOperation='source-atop';ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
 // coffee machine steam rising naturally over original coffee bar
 for(let i=0;i<4;i++){let x=420+i*7+Math.sin(state.timer*.75+i)*4,y=138-(state.timer*17+i*17)%43;ctx.strokeStyle=`rgba(255,239,203,${.11+(i%2)*.09})`;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-8,y-10,x+9,y-19,x,y-27);ctx.stroke();}
 // lighting on arcade controls & monitor
 ctx.save();ctx.globalAlpha=.24+.16*Math.sin(state.timer*3);ctx.fillStyle='#ffd044';ctx.shadowColor='#ffc84a';ctx.shadowBlur=22;ctx.fillRect(1456,553,40,11);ctx.restore();
 const s=activeSeason();if(s==='halloween'){
  ctx.save();ctx.fillStyle='rgba(20,14,23,.58)';for(let i=0;i<4;i++){let x=250+i*210+Math.sin(state.timer*.5+i)*26,y=78+i%2*24;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(state.timer*2+i)*.15);ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(-16,-16,-28,0);ctx.quadraticCurveTo(-18,-1,-4,6);ctx.lineTo(0,0);ctx.quadraticCurveTo(15,-16,28,0);ctx.quadraticCurveTo(14,-1,4,6);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();
 }if(s==='christmas'){
  for(let i=0;i<14;i++){let x=270+i*31,y=45+Math.sin(i*.8)*19;ctx.fillStyle=['#ffd554','#f55e69','#71e5aa','#8fcfff'][i%4];ctx.beginPath();ctx.arc(x,y,4,0,2*Math.PI);ctx.fill();}
 }
 if(s==='friday'){ctx.save();ctx.font='900 19px system-ui';ctx.fillStyle='#f5d25c';ctx.fillText('⚡ DEPLOY NA SEXTA? ⚡',35,430);ctx.restore();}
 for(let p of state.fx){ctx.fillStyle=p.col;ctx.globalAlpha=Math.min(1,p.t);ctx.fillRect(p.x,p.y,p.sz,p.sz);}ctx.globalAlpha=1;
}
function render(){ctx.clearRect(0,0,W,H);if(images.background?.complete&&images.background.naturalWidth){ctx.save();ctx.translate(W/2+state.panX,H/2+state.panY);ctx.scale(state.zoom,state.zoom);ctx.translate(-W/2,-H/2);
 // transparent edges of illustration remain truly transparent
 ctx.drawImage(images.background,0,0,W,H);
 // Preserve the approved wordmark byte-for-byte from the reference. The clean
 // plate removes people/cats, while this exterior crop contains branding only.
 if(images.brand?.complete&&images.brand.naturalWidth)ctx.drawImage(images.brand,0,805,300,219,0,805,300,219);
 for(let a of [...actors].filter(a=>a.active).sort((a,b)=>a.y-b.y)){imgDraw(a);drawOcclusion(a);}
 drawEffects();drawTargets();for(let a of actors)if(a.active)drawBubble(a);ctx.restore();}
 else{ctx.fillStyle='#242229';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ffc739';ctx.font='bold 32px system-ui';ctx.textAlign='center';ctx.fillText('Montando o escritório...',W/2,H/2);}}
function loop(ms){let dt=(ms-last)/1000;last=ms;tick(dt);render();requestAnimationFrame(loop);}requestAnimationFrame(loop);
function selected(){return findActor(state.selected)||actors[0];}
function timeLabel(){const d=day();let h=d.getHours(),m=d.getMinutes();if(state.time!=='real'){const t={morning:'09:30',sunset:'17:45',night:'22:15'};return t[state.time]||'09:30';}return String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');}
setInterval(()=>{$('clockValue').textContent=timeLabel();let h=day().getHours();$('dayLabel').textContent=state.time==='night'||(state.time==='real'&&(h<7||h>=20))?'mais um commit antes de dormir':'café, código e pequenas crises';},1200);$('clockValue').textContent=timeLabel();
$('pause').onclick=()=>{state.running=!state.running;$('pauseLabel').textContent=state.running?'Pausar':'Continuar';$('pause').querySelector('.ic').textContent=state.running?'Ⅱ':'▶';setStory(state.running?'A vida no escritório voltou ao normal. Mais ou menos.':'Tempo congelado. O bug continua lá.');};
$('surprise').onclick=()=>{playEvent();blip(480,.14);};
$('markers').onclick=()=>{state.markers=!state.markers;$('markersLabel').textContent=state.markers?'Ocultar destinos':'Destinos';};
$('fullscreen').onclick=()=>{document.fullscreenElement?document.exitFullscreen():$('gameShell').requestFullscreen?.();};
$('character').onchange=e=>{state.selected=e.target.value;let a=selected();setStory(`Você está acompanhando ${a.name}. Escolha um destino para ele.`);speech(a,'e aí?',2);};
$('timeMode').onchange=e=>state.time=e.target.value;
$('season').onchange=e=>{state.season=e.target.value;let s=activeSeason();setStory(`Decoração: ${s==='normal'?'dia normal':s}.`);};
$('speed').onchange=e=>{state.speed=parseFloat(e.target.value);setStory(`Simulação a ${state.speed}×.`);};
document.querySelectorAll('[data-dest]').forEach(b=>{b.onclick=()=>{sendTo(selected(),b.dataset.dest,true);blip(600,.04);};});
function setZoom(z){state.zoom=Math.min(2.4,Math.max(.85,z));$('zoomLabel').textContent=Math.round(state.zoom*100)+'%';}
$('zoomIn').onclick=()=>setZoom(state.zoom+.2);$('zoomOut').onclick=()=>setZoom(state.zoom-.2);$('resetZoom').onclick=()=>{setZoom(1);state.panX=0;state.panY=0;};
function scenePoint(e){let b=cv.getBoundingClientRect(),sx=(e.clientX-b.left)/b.width*W,sy=(e.clientY-b.top)/b.height*H;return{x:(sx-W/2-state.panX)/state.zoom+W/2,y:(sy-H/2-state.panY)/state.zoom+H/2};}
function nearestTarget(p){let best=null,bd=Infinity;for(let [key,d] of Object.entries(destinations)){let node=nodes[d.node],dst=dist([p.x,p.y],node);if(dst<bd){bd=dst;best=key;}}return bd<105?best:null;}
const hotspots=[
 {area:[350,165,530,375],key:'coffee'},{area:[1100,95,1480,368],key:'meeting'},{area:[795,150,935,300],key:'bathroom'},
 {area:[610,367,902,630],key:'lounge'},{area:[1180,470,1480,660],key:'arcade'},{area:[260,410,688,865],key:'desk'},{area:[805,850,1060,1024],key:'entrance'}
];
function inHotspot(p){let direct=hotspots.find(v=>p.x>=v.area[0]&&p.x<=v.area[2]&&p.y>=v.area[1]&&p.y<=v.area[3]);return direct?.key||nearestTarget(p);}
cv.addEventListener('pointerdown',e=>{let p=scenePoint(e);pan={startX:e.clientX,startY:e.clientY,px:state.panX,py:state.panY,moved:false,p,down:Date.now()};cv.setPointerCapture(e.pointerId);});
cv.addEventListener('pointermove',e=>{if(pan){let dx=(e.clientX-pan.startX)/cv.clientWidth*W,dy=(e.clientY-pan.startY)/cv.clientHeight*H;if(Math.abs(dx)+Math.abs(dy)>7){pan.moved=true;state.panX=pan.px+dx;state.panY=pan.py+dy;}return;}let p=scenePoint(e),k=inHotspot(p),tip=$('hoverTip');if(k){tip.hidden=false;tip.textContent=destinations[k].label+' · clique para visitar';let br=cv.getBoundingClientRect();tip.style.left=Math.min(br.width-170,Math.max(6,e.clientX-br.left+14))+'px';tip.style.top=Math.min(br.height-40,Math.max(5,e.clientY-br.top-39))+'px';}else tip.hidden=true;});
cv.addEventListener('pointerup',e=>{if(!pan)return;let moved=pan.moved,p=pan.p;pan=null;if(moved)return;let picked=[...actors].reverse().find(a=>a.active&&a.visible&&Math.abs(a.x-p.x)<55&&p.y<a.y+20&&p.y>a.y-185);if(picked){state.selected=picked.id;$('character').value=picked.id;speech(picked,choose(['opa!','fala, dev!','tô de boa.','só mais um commit...']),3);setStory(`Acompanhando ${picked.name}. Clique em um ambiente para ele ir até lá.`);return;}let k=inHotspot(p);if(k){sendTo(selected(),k,true);blip(660,.05);}});
cv.addEventListener('pointercancel',()=>{pan=null;});
cv.addEventListener('pointerleave',()=>{$('hoverTip').hidden=true;});
cv.addEventListener('wheel',e=>{e.preventDefault();setZoom(state.zoom+(e.deltaY<0?.12:-.12));},{passive:false});
document.addEventListener('keydown',e=>{if(['SELECT','INPUT'].includes(document.activeElement?.tagName))return;if(e.code==='Space'){e.preventDefault();$('pause').click();}if(e.key.toLowerCase()==='e')$('surprise').click();if(e.key.toLowerCase()==='m')$('markers').click();if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen();});
function blip(freq=440,duration=.08){if(!state.ambience)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),gain=audio.createGain();o.type='sine';o.frequency.value=freq;gain.gain.value=.018;gain.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(gain);gain.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch{}}
$('sound').onclick=()=>{state.ambience=!state.ambience;$('soundIcon').textContent=state.ambience?'♫':'♪';$('soundLabel').textContent=state.ambience?'Som ligado':'Som desligado';if(state.ambience)blip(660,.12);};
setTimeout(()=>{let a=findActor('guest');sendTo(a,'coffee');setStatus('CAFÉ ANTES DE TUDO','Alguém começou o dia na copa.');setStory('O visitante vai buscar café. O Dev já está calculando quanto tempo falta para sexta.');},1600);
window.__officeDebug={state,actors,floor,interactionSlots,interactionVisual,render,imgDraw,seatRenderState,sendTo,playEvent,images,destinations,nodes,slots,queues,cancelQueue,pathBetween,tick,arrive};
