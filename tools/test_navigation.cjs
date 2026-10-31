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
