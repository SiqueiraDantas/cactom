import test from 'node:test';
import assert from 'node:assert/strict';
import {Metronome} from '../src/lib/metronome.ts';
let lastContext=null;
const param={setValueAtTime(){},exponentialRampToValueAtTime(){}};
class ClockContext{
  state='suspended';currentTime=10;destination={};
  constructor(){lastContext=this;}
  async resume(){this.state='running';}
  async close(){this.state='closed';}
  createGain(){return {gain:param,connect(){},disconnect(){}};}
  createOscillator(){return {frequency:param,connect(){},disconnect(){},start(){},stop(){},onended:null};}
}
globalThis.AudioContext=ClockContext;
Object.defineProperty(globalThis,'performance',{configurable:true,value:{now:()=>5000}});
test('início da aula 13 reinicia a contagem em exatamente quatro pulsos',async()=>{
  const clock=new Metronome();await clock.start(60,()=>{});
  try{
    assert.ok(Math.abs(clock.nextExerciseBarStartMs()-9120)<.001);
    lastContext.currentTime=11.83;
    assert.ok(Math.abs(clock.nextExerciseBarStartMs()-9120)<.001,'a fase anterior do metrônomo não adiciona pulsos extras');
  }finally{clock.stop();}
});
test('biblioteca em 3/4 usa três pulsos e o andamento correto',async()=>{
  const clock=new Metronome();await clock.start(120,()=>{},3);
  try{assert.ok(Math.abs(clock.nextExerciseBarStartMs()-6620)<.001);}finally{clock.stop();}
});
test('andamento ou compasso inválido não inicia relógio',async()=>{const clock=new Metronome();await assert.rejects(()=>clock.start(0,()=>{}));await assert.rejects(()=>clock.start(60,()=>{},7));assert.equal(clock.nextExerciseBarStartMs(),null);});
