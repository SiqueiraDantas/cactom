import assert from 'node:assert/strict';
import test from 'node:test';
import {BEAT_POINTS,CONDUCTING_LESSONS,START,advanceConducting,freshGesture,guidePosition,mapHand,scoreGesture} from '../src/lib/conducting.ts';
test('todos os exercícios têm compassos, andamentos e unidades válidos',()=>{
 assert.equal(CONDUCTING_LESSONS.length,9);
 for(const l of CONDUCTING_LESSONS){assert.ok([2,3,4].includes(l.meter));assert.ok(l.bpm>=45&&l.bpm<=120);assert.equal(BEAT_POINTS[l.meter].length,l.meter);assert.ok(l.measures>=2);}
});
test('calibração mapeia a mão no ponto inicial; valores são limitados ao palco',()=>{
 assert.deepEqual(mapHand({x:.5,y:.2},{x:.5,y:.2}),START);
 const beyond=mapHand({x:6,y:6},{x:.5,y:.2});assert.ok(beyond.x<=396&&beyond.y<=336);
});
test('não pontua uma mão parada fora dos tempos',()=>{
 let state=freshGesture();for(let k=0;k<6;k++){state=advanceConducting(state,{x:200,y:65},1000+k*1000,1000,2,60,3);}
 assert.ok(state.hits<=3);assert.ok(state.misses>0);
 assert.equal(scoreGesture(state,2,3).passed,false);
});
test('movimentos corretos em sequência permitem aprovação, mesmo sem coincidir com alvos',()=>{
 for(const meter of [2,3,4]){
  const start=1500,interval=1000,total=meter*3;
  let state=freshGesture();
  for(let i=0;i<total;i++){
   const due=start+i*interval;
   const from=i%meter===0?START:BEAT_POINTS[meter][(i-1)%meter];
   const to=BEAT_POINTS[meter][i%meter];
   const offset={x:26,y:-12};
   state=advanceConducting(state,{x:from.x+offset.x,y:from.y+offset.y},due-380,start,meter,60,3);
   state=advanceConducting(state,{x:(from.x+to.x)/2+offset.x,y:(from.y+to.y)/2+offset.y},due-175,start,meter,60,3);
   state=advanceConducting(state,{x:to.x+offset.x,y:to.y+offset.y},due,start,meter,60,3);
  }
  // a última janela termina após o pulso final
  state=advanceConducting(state,null,start+total*interval,start,meter,60,3);
  assert.ok(state.hits>=total*.75,`${meter}/4: ${state.hits}/${total}`);
  assert.equal(scoreGesture(state,meter,3).passed,true);
 }
});
test('não aceita acerto estático mesmo sobre o ponto exato',()=>{
 let state=freshGesture();
 for(let time=700;time<6500;time+=80)state=advanceConducting(state,BEAT_POINTS[2][0],time,1000,2,60,3);
 assert.equal(state.hits,0);
 assert.equal(scoreGesture(state,2,3).passed,false);
});
test('uma trajetória invertida não ganha pontos apenas por cruzar área ampla',()=>{
 let state=freshGesture();
 for(const [t,p] of [[650,{x:200,y:260}],[900,{x:200,y:180}],[1040,{x:200,y:80}]]){
  state=advanceConducting(state,p,t,1000,2,60,3,1.65);
 }
 assert.equal(state.hits,0);
});
test('tempos perdidos avançam e não causam travamento',()=>{
 const state=advanceConducting(freshGesture(),null,11000,1000,4,60,3);
 assert.equal(state.misses,10);assert.equal(state.finished,false);
 const end=advanceConducting(state,null,16000,1000,4,60,3);
 assert.equal(end.finished,true);assert.equal(end.hits,0);
 assert.equal(scoreGesture(end,4,3).passed,false);
});

test('cursor guia avança pelo compasso no tempo do metrônomo',()=>{
 assert.deepEqual(guidePosition(1000,1000,4,60),BEAT_POINTS[4][0]);
 assert.deepEqual(guidePosition(2000,1000,4,60),BEAT_POINTS[4][1]);
 assert.deepEqual(guidePosition(4000,1000,4,60),BEAT_POINTS[4][3]);
 assert.deepEqual(guidePosition(5000,1000,4,60),BEAT_POINTS[4][0]);
});
