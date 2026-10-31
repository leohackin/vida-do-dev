/* Navigation in source-image coordinates; no changes to the approved artwork. */
(function(root){
 'use strict';
 function shortestPath(nodes,links,start,end){
  if(!nodes[start]||!nodes[end])return null;
  const pending=new Set(Object.keys(nodes)),cost={[start]:0},previous={};
  while(pending.size){
   let current=null;
   for(const key of pending)if(cost[key]!==undefined&&(current===null||cost[key]<cost[current]))current=key;
   if(current===null)return null;
   if(current===end){const path=[end];while(path[0]!==start)path.unshift(previous[path[0]]);return path;}
   pending.delete(current);
   for(const [a,b] of links){const next=a===current?b:b===current?a:null;if(!next||!pending.has(next))continue;
    const distance=Math.hypot(nodes[current][0]-nodes[next][0],nodes[current][1]-nodes[next][1]);
    const candidate=cost[current]+distance;
    if(cost[next]===undefined||candidate<cost[next]){cost[next]=candidate;previous[next]=current;}
   }
  }
  return null;
 }
 // A slot remains owned while approaching and interacting. Switching destinations
 // reserves the new slot before releasing the old one, so a failed request is safe.
 function createSlots(){
  const owners=new Map();
  return {
   reserve(actor,destination){const owner=owners.get(destination);if(owner!==undefined&&owner!==actor)return false;
    this.release(actor);owners.set(destination,actor);return true;},
   release(actor){for(const [key,owner] of owners)if(owner===actor)owners.delete(key);},
   owner(destination){return owners.get(destination);},
   snapshot(){return Object.fromEntries(owners);}
  };
 }
 // Footprint geometry. Distances are measured in source pixels, not screen pixels.
 function pointInPolygon(p,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const a=poly[i],b=poly[j];
   if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
 }
 function segmentDistance(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
  const t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0;
  return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);
 }
 function createFloor(boundary,obstacles,radius=12,cell=12){
  const clear=p=>pointInPolygon(p,boundary)&&
   boundary.every((a,i)=>segmentDistance(p,a,boundary[(i+1)%boundary.length])>=radius)&&
   obstacles.every(poly=>!pointInPolygon(p,poly)&&poly.every((a,i)=>segmentDistance(p,a,poly[(i+1)%poly.length])>=radius));
  const segmentCache=new Map();
  const segment=(a,b,blocked=[])=>{
   const key=a.join(',')+':'+b.join(',');
   let valid=segmentCache.get(key);
   if(valid===undefined){
    valid=true;
    const n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));
    for(let i=0;i<=n;i++)if(!clear([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n])){valid=false;break;}
    if(segmentCache.size<50000)segmentCache.set(key,valid);
   }
   return valid&&!blocked.some(q=>segmentDistance(q,a,b)<radius*2);
  };
  const points=new Map();
  for(let x=0;x<=1536;x+=cell)for(let y=0;y<=1024;y+=cell)if(clear([x,y]))points.set(`${x},${y}`,[x,y]);
  function route(start,end,blocked=[]){
   if(!clear(start)||!clear(end))return null;
   if(segment(start,end,blocked))return [end];
   const near=p=>[...points.entries()].filter(([,q])=>Math.hypot(p[0]-q[0],p[1]-q[1])<=cell*2&&segment(p,q,blocked));
   if(blocked.some(q=>Math.hypot(q[0]-end[0],q[1]-end[1])<radius*2))return null;
   const ends=new Set(near(end).map(([k])=>k)),heap=[],cost=new Map(),prev=new Map();
   const push=(k,g)=>{const q=points.get(k),item={k,g,f:g+Math.hypot(q[0]-end[0],q[1]-end[1])};
    heap.push(item);let i=heap.length-1;while(i){const parent=(i-1)>>1;if(heap[parent].f<=item.f)break;heap[i]=heap[parent];i=parent;}heap[i]=item;};
   const pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;
    while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;
     if(heap[child].f>=last.f)break;heap[i]=heap[child];i=child;}heap[i]=last;}return first;};
   for(const [k,q] of near(start)){const g=Math.hypot(q[0]-start[0],q[1]-start[1]);cost.set(k,g);push(k,g);}
   const closed=new Set();let found=null;
   while(heap.length){const {k:key,g}=pop();if(closed.has(key)||g!==cost.get(key))continue;
    if(ends.has(key)){found=key;break;}
    closed.add(key);const p=points.get(key);
    for(const [dx,dy] of [[cell,0],[-cell,0],[0,cell],[0,-cell],[cell,cell],[cell,-cell],[-cell,cell],[-cell,-cell]]){
     const q=[p[0]+dx,p[1]+dy],next=q.join(',');
     if(!points.has(next)||closed.has(next)||!segment(p,q,blocked))continue;
     const candidate=g+Math.hypot(dx,dy);
     if(candidate<(cost.get(next)??Infinity)){cost.set(next,candidate);prev.set(next,key);push(next,candidate);}
    }
   }
   if(found===null)return null;
   const path=[end];for(let k=found;k!==undefined;k=prev.get(k))path.unshift(points.get(k));
   // Keep only visible shortcuts; never cut an obstacle corner.
   const result=[];let anchor=start;
   for(let i=0;i<path.length;){let j=path.length-1;while(j>i&&!segment(anchor,path[j],blocked))j--;result.push(path[j]);anchor=path[j];i=j+1;}
   return result;
  }
  return {clear,segment,route,radius,boundary,obstacles};
 }
 const api={shortestPath,createSlots,createFloor,pointInPolygon,segmentDistance};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.OfficeNavigation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
