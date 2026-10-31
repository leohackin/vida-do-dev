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
 const api={shortestPath,createSlots};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else root.OfficeNavigation=api;
})(typeof globalThis!=='undefined'?globalThis:this);
