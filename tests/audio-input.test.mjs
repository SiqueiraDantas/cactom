import test from 'node:test';
import assert from 'node:assert/strict';
import {MicrophonePitchMonitor} from '../src/lib/audio.ts';
let callback=null,amplitude=.06,lastContext=null,lastConstraints=null,toneHz=349.228231433,harmonic=false;
class FakeContext{
  state='suspended';sampleRate=48000;
  constructor(){lastContext=this;}
  async resume(){this.state='running';}
  async close(){this.state='closed';}
  createMediaStreamSource(){return {connect(){},disconnect(){}};}
  createAnalyser(){return {fftSize:4096,smoothingTimeConstant:0,disconnect(){},getFloatTimeDomainData(buffer){for(let i=0;i<buffer.length;i++){const phase=2*Math.PI*toneHz/48000*i;buffer[i]=amplitude*(Math.sin(phase)+(harmonic?.4*Math.sin(2*phase)+.15*Math.sin(3*phase):0));}}};}
}
globalThis.AudioContext=FakeContext;
globalThis.window={setInterval(fn){callback=fn;return 1;},clearInterval(){callback=null;}};
function track(){return {label:'Microfone do teste',readyState:'live',stop(){this.readyState='ended';}};}
function setup(getStream){
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{mediaDevices:{getUserMedia:async constraints=>{lastConstraints=constraints;return getStream();}}}});
}
test('escuta Sol escrito real de 349 Hz e reporta sinal antes da avaliação',async()=>{
  const audioTrack=track();setup(()=>({getTracks:()=>[audioTrack],getAudioTracks:()=>[audioTrack]}));amplitude=.06;
  const input=await MicrophonePitchMonitor.create({deviceId:'chosen'});let sample=null,signal=null;
  input.listen(s=>{sample=s;},s=>{signal=s;});callback();
  assert.equal(signal.status,'pitched');assert.ok(Math.abs(sample.frequency-349.228)<.5);
  assert.equal(input.label,'Microfone do teste');assert.equal(lastConstraints.video,false);assert.deepEqual(lastConstraints.audio.deviceId,{exact:'chosen'});
  await input.stop();assert.equal(input.active,false);assert.equal(audioTrack.readyState,'ended');assert.equal(lastContext.state,'closed');assert.equal(callback,null);
});
test('limiar configurável detecta som fraco sem aprovar ruído',async()=>{
  const audioTrack=track();setup(()=>({getTracks:()=>[audioTrack],getAudioTracks:()=>[audioTrack]}));amplitude=.006;
  const normal=await MicrophonePitchMonitor.create();let sample='pending';normal.listen(s=>{sample=s;});callback();assert.equal(sample,null);await normal.stop();
  const sensitiveTrack=track();setup(()=>({getTracks:()=>[sensitiveTrack],getAudioTracks:()=>[sensitiveTrack]}));
  const sensitive=await MicrophonePitchMonitor.create({minimumRms:.002});let signal=null;sensitive.listen(s=>{sample=s;},value=>{signal=value;});callback();assert.ok(sample?.frequency>349,JSON.stringify({sample,signal}));await sensitive.stop();amplitude=.06;
});
test('permissão negada vira orientação em português',async()=>{setup(()=>{throw new DOMException('denied','NotAllowedError');});await assert.rejects(()=>MicrophonePitchMonitor.create(),/não foi autorizado/);});
test('contexto que não inicia libera os tracks e fecha recursos',async()=>{
  const audioTrack=track();setup(()=>({getTracks:()=>[audioTrack],getAudioTracks:()=>[audioTrack]}));
  class Broken extends FakeContext{async resume(){throw new Error('resume failed');}}
  globalThis.AudioContext=Broken;await assert.rejects(()=>MicrophonePitchMonitor.create(),/resume failed/);assert.equal(audioTrack.readyState,'ended');assert.equal(lastContext.state,'closed');globalThis.AudioContext=FakeContext;
});
test('microfone desconectado sinaliza inatividade em vez de nota válida',async()=>{
  const audioTrack=track();setup(()=>({getTracks:()=>[audioTrack],getAudioTracks:()=>[audioTrack]}));
  const input=await MicrophonePitchMonitor.create();let sample='pending',signal=null;input.listen(s=>{sample=s;},s=>{signal=s;});audioTrack.readyState='ended';callback();assert.equal(sample,null);assert.equal(signal.status,'inactive');await input.stop();
});
test('Sol e Fá da aula 13 são reconhecidos com harmônicos presentes',async()=>{
  const audioTrack=track();setup(()=>({getTracks:()=>[audioTrack],getAudioTracks:()=>[audioTrack]}));amplitude=.06;harmonic=true;
  const input=await MicrophonePitchMonitor.create();let sample=null;input.listen(value=>{sample=value;});
  try{for(const frequency of [349.228231433,311.126983722]){toneHz=frequency;callback();assert.ok(sample,`sem detecção em ${frequency} Hz`);assert.ok(Math.abs(sample.frequency-frequency)<.5);}}
  finally{await input.stop();toneHz=349.228231433;harmonic=false;}
});
test('microfone detecta a extensão sonora do curso de flauta, inclusive Ré6 acima de 1100 Hz',async()=>{
  const audioTrack=track();setup(()=>({getTracks:()=>[audioTrack],getAudioTracks:()=>[audioTrack]}));amplitude=.06;harmonic=false;
  const input=await MicrophonePitchMonitor.create();let sample=null;input.listen(value=>{sample=value;});
  try{for(const midi of [72,74,76,77,79,81,83,84,86]){toneHz=440*2**((midi-69)/12);callback();assert.ok(sample,'nota sem sinal: '+midi);assert.ok(Math.abs(sample.frequency-toneHz)<1,'altura incorreta: '+midi);}}
  finally{await input.stop();toneHz=349.228231433;}
});
