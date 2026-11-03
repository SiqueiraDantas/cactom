import test from 'node:test';
import assert from 'node:assert/strict';
import {ARRANGEMENTS,notesForBeat,midiToHz,ConductingEnsemble} from '../src/lib/conductorMusic.ts';

test('as três peças são originais, por compasso e não exigem áudio remoto',()=>{
 const titles=new Set();
 for(const meter of [2,3,4]){
  const score=ARRANGEMENTS[meter];titles.add(score.title);
  assert.equal(score.meter,meter);
  assert.equal(score.melody.length,score.progression.length*meter);
  assert.ok(score.progression.every(c=>c.length===3));
  assert.ok(score.melody.every(n=>n>=60&&n<=90));
 }
 assert.equal(titles.size,3);
});
test('cada batida tem melodia e harmonia organizada por função musical',()=>{
 for(const meter of [2,3,4]){
  for(let i=0;i<48;i++){
   const notes=notesForBeat(meter,i);
   assert.ok(notes.some(n=>n.voice==='lead'));
   assert.ok(notes.every(n=>n.midi>20&&n.midi<95&&n.level>0));
   if(i%meter===0)assert.ok(notes.some(n=>n.voice==='bass')&&notes.some(n=>n.voice==='harmony'));
  }
 }
});
test('notas reais em Hz e repetição determinística do arranjo',()=>{
 assert.equal(midiToHz(69),440);
 assert.ok(Math.abs(midiToHz(60)-261.6256)<.01);
 for(const meter of [2,3,4]){
  const piece=ARRANGEMENTS[meter];
  assert.deepEqual(notesForBeat(meter,0),notesForBeat(meter,piece.melody.length));
 }
});
test('modo gesto não abre AudioContext ou reproduz áudio instrumental',async()=>{
 const audio=new ConductingEnsemble();
 await audio.start({mode:'gesture',bpm:72,meter:4,startAtMs:1000});
 assert.equal(audio.isEntered,false);
 audio.stop();
});

test('orquestra virtual é silenciosa até a entrada; corte silencia e admite nova entrada',async()=>{
 const previous=globalThis.AudioContext;
 const masters=[];
 class MockGain{
  constructor(){this.gain={value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v},setValueAtTime(v){this.value=v},linearRampToValueAtTime(v){this.value=v}};masters.push(this);}
  connect(){} disconnect(){}
 }
 class MockOscillator{
  constructor(){this.frequency={setValueAtTime(){}};this.onended=null;}
  connect(){} disconnect(){} start(){} stop(){this.onended?.();}
 }
 class MockContext{
  constructor(){this.currentTime=0;this.state='running';this.destination={};}
  createGain(){return new MockGain();}
  createOscillator(){return new MockOscillator();}
  resume(){return Promise.resolve();}close(){return Promise.resolve();}
 }
 globalThis.AudioContext=MockContext;
 try{
  const orchestra=new ConductingEnsemble();
  await orchestra.start({mode:'orchestra',bpm:60,meter:4,startAtMs:performance.now()+2000});
  assert.equal(orchestra.isEntered,false);
  orchestra.setEntered(true);
  assert.equal(orchestra.isEntered,true);
  assert.ok(masters[0].gain.value>0);
  orchestra.setIntensity(.9);
  assert.ok(masters[0].gain.value>.4);
  orchestra.setEntered(false);
  assert.equal(orchestra.isEntered,false);
  assert.equal(masters[0].gain.value,0);
  orchestra.setEntered(true);
  assert.equal(orchestra.isEntered,true);
  orchestra.stop();
 }finally{globalThis.AudioContext=previous;}
});
