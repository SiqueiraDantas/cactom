import test from 'node:test';
import assert from 'node:assert/strict';
import {learningPathLayout} from '../src/lib/learningPath.ts';
test('connections use the same centers and step as the real node count, including the finish',()=>{
 for(let count=1;count<=13;count++){
  const layout=learningPathLayout(count),points=[...layout.nodes,layout.finish];
  assert.equal(layout.nodes.length,count);assert.equal(layout.segments.length,count);
  assert.ok(layout.height>layout.finish.y);
  for(const [i,segment]of layout.segments.entries()){
   const coordinates=segment.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
   assert.deepEqual(coordinates.slice(0,2),[points[i].x*10,points[i].y]);
   assert.deepEqual(coordinates.slice(-2),[points[i+1].x*10,points[i+1].y]);
   assert.equal(points[i+1].y-points[i].y,layout.step);
   assert.ok(points[i].x>=20&&points[i].x<=80);
  }
 }
});
test('empty units create no phantom lessons and invalid counts are rejected',()=>{
 assert.deepEqual(learningPathLayout(0).nodes,[]);assert.deepEqual(learningPathLayout(0).segments,[]);
 for(const count of [-1,1.5,NaN,Infinity])assert.throws(()=>learningPathLayout(count));
});
