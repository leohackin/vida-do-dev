'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {shortestPath,createSlots}=require('../navigation.js');
test('route minimizes distance instead of number of edges',()=>{
 const nodes={a:[0,0],b:[0,100],c:[1,0],d:[2,0],e:[3,0]};
 assert.deepEqual(shortestPath(nodes,[['a','b'],['b','e'],['a','c'],['c','d'],['d','e']],'a','e'),['a','c','d','e']);
});
test('disconnected and invalid destinations return no route',()=>{
 assert.equal(shortestPath({a:[0,0],b:[1,0]},[],'a','b'),null);
 assert.equal(shortestPath({a:[0,0]},[],'a','missing'),null);
 assert.deepEqual(shortestPath({a:[0,0]},[],'a','a'),['a']);
});
test('a slot cannot be reserved by two characters',()=>{
 const slots=createSlots();assert.equal(slots.reserve('dev','desk'),true);
 assert.equal(slots.reserve('ana','desk'),false);assert.equal(slots.owner('desk'),'dev');
});
test('failed retarget preserves the previous reservation',()=>{
 const slots=createSlots();slots.reserve('dev','desk');slots.reserve('ana','coffee');
 assert.equal(slots.reserve('dev','coffee'),false);assert.equal(slots.owner('desk'),'dev');
});
test('retarget and cancellation free the previous slot',()=>{
 const slots=createSlots();slots.reserve('dev','desk');slots.reserve('dev','coffee');
 assert.equal(slots.owner('desk'),undefined);assert.equal(slots.reserve('ana','desk'),true);
 slots.release('dev');assert.equal(slots.owner('coffee'),undefined);assert.equal(slots.owner('desk'),'ana');
});
const {createFloor}=require('../navigation.js');
test('footprint clearance rejects walls, corners, and disconnected regions',()=>{
 const floor=createFloor([[0,0],[240,0],[240,240],[0,240]],[[[100,0],[140,0],[140,240],[100,240]]],12);
 assert.equal(floor.clear([5,50]),false);assert.equal(floor.clear([95,50]),false);
 assert.equal(floor.route([48,48],[192,48]),null);
 assert.equal(floor.route([5,50],[48,48]),null);
});
test('routing detours around furniture and temporary actors without cutting corners',()=>{
 const floor=createFloor([[0,0],[300,0],[300,300],[0,300]],[[[120,100],[180,100],[180,200],[120,200]]],12);
 const start=[48,150],end=[252,150],blocked=[[144,60]];
 assert.equal(floor.segment(start,end),false);
 const route=floor.route(start,end,blocked);assert.ok(route);let last=start;
 for(const p of route){assert.ok(floor.segment(last,p,blocked));last=p;}
 assert.deepEqual(last,end);
});
test('continuous footprint rejects a corner missed by three-pixel samples',()=>{
 const floor=createFloor([[0,0],[300,0],[300,300],[0,300]],[[[120,100],[180,100],[180,200],[120,200]]],12);
 const a=[98.04,105],b=[128.04,75];
 assert.ok(floor.clear(a));assert.ok(floor.clear(b));
 assert.equal(floor.segment(a,b),false);
});
