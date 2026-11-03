import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreBar, validBar, barEvents } from '../src/lib/pulseAssessment.ts';
import { targetFrequencyFor } from '../src/lib/music.ts';
import { LESSONS } from '../src/lib/curriculum.ts';
const lead = LESSONS.find(l=>l.id==='entrada-no-pulso');
const restBar = LESSONS.find(l=>l.id==='compasso-pausa');
const sample = (t, note) => ({at:t,frequency:note?targetFrequencyFor(note):null});
function performance(lesson, bpm=60, offset=0, endOffset=0){
  const windows=barEvents(lesson.steps,bpm,10000);
  const samples=[];
  for(let t=9600;t<=14400;t+=90){
    const active=windows.find(w=>t>=w.start+offset && t <w.end+endOffset);
    samples.push(sample(t,active?.step.kind==='rest'?null:active?.step.note));
  }
  return samples;
}
test('compassos novos totalizam 4 pulsos',()=>{
  assert.ok(lead&&restBar);
  assert.ok(validBar(lead.steps));assert.ok(validBar(restBar.steps));
});
test('quatro notas no pulso recebem check',()=>{
  const scored=scoreBar(lead.steps,performance(lead),60,10000);
  assert.deepEqual(scored.map(s=>s.passed),[true,true,true,true]);
});
test('nota deslocada além de 240ms não passa no tempo',()=>{
  const scored=scoreBar(lead.steps,performance(lead,60,350,-350),60,10000);
  assert.equal(scored[0].passed,false);
});
test('pausa central em silêncio recebe check',()=>{
  const scored=scoreBar(restBar.steps,performance(restBar),60,10000);
  assert.deepEqual(scored.map(s=>s.passed),[true,true,true]);
});
test('nota durante pausa provoca falha',()=>{
  const noisy=performance(restBar);
  for(const s of noisy)if(s.at>12200&&s.at<12800)s.frequency=targetFrequencyFor(restBar.steps[0].note);
  const scored=scoreBar(restBar.steps,noisy,60,10000);
  assert.equal(scored[1].passed,false);
});
test('sem captação, não marca check nas notas nem pausas',()=>{
  const silent=performance(restBar).map(s=>({...s,frequency:null}));
  const scored=scoreBar(restBar.steps,silent,60,10000);
  assert.equal(scored[0].passed,false);
  assert.equal(scored[2].passed,false);
});
test('figuras sem 4 tempos são recusadas',()=>{
  assert.equal(validBar([lead.steps[0]]),false);
  assert.throws(()=>scoreBar([lead.steps[0]],[],60,10000));
});
test('aula 13 aceita Sol escrito (349 Hz), pausa e Fá escrito (311 Hz)',()=>{
  const frames=performance(restBar);
  assert.ok(frames.some(s=>s.frequency&&Math.abs(s.frequency-349.228)<.01));
  assert.ok(frames.some(s=>s.frequency&&Math.abs(s.frequency-311.127)<.01));
  assert.deepEqual(scoreBar(restBar.steps,frames,60,10000).map(r=>r.passed),[true,true,true]);
});
test('dois sopros separados não viram uma mínima contínua na aula 13',()=>{
  const frames=performance(restBar).map(s=>s.at>10600&&s.at<11300?{...s,frequency:null}:s);
  assert.equal(scoreBar(restBar.steps,frames,60,10000)[0].passed,false);
});
test('ruído sem altura reconhecida não é confundido com uma pausa silenciosa',()=>{
  const frames=performance(restBar).map(s=>s.at>12100&&s.at<12900?{...s,frequency:0}:s);
  assert.equal(scoreBar(restBar.steps,frames,60,10000)[1].passed,false);
});
test('ausência de cobertura de amostras na pausa não recebe check',()=>{
  const frames=performance(restBar).filter(s=>s.at<12200||s.at>12800);
  assert.equal(scoreBar(restBar.steps,frames,60,10000)[1].passed,false);
});
