import test from 'node:test';
import assert from 'node:assert/strict';
import { beatMs, figureDurationMs, requiredDurationMs, durationLabel, FIGURES } from '../src/lib/rhythm.ts';
import { LESSONS } from '../src/lib/curriculum.ts';
test('uma semínima corresponde a um pulso (60/90/120 BPM)',()=>{
  assert.equal(figureDurationMs('quarter',60),1000);
  assert.equal(figureDurationMs('quarter',120),500);
  assert.equal(figureDurationMs('quarter',90),667);
});
test('mínima tem 2 pulsos e semibreve 4',()=>{
  assert.equal(figureDurationMs('half',60),2000);
  assert.equal(figureDurationMs('whole',60),4000);
  assert.equal(figureDurationMs('half',120),1000);
  assert.equal(FIGURES.whole.beats,4);
});
test('exercícios legados continuam definidos em segundos independentemente do BPM',()=>{
  assert.equal(requiredDurationMs({holdSeconds:1.5},60),1500);
  assert.equal(requiredDurationMs({holdSeconds:1.5},120),1500);
});
test('novos exercícios respondem a mudanças de BPM',()=>{
  const lesson=LESSONS.find(l=>l.id==='pulso-primeiro');
  assert.ok(lesson && lesson.steps.length===4);
  assert.equal(requiredDurationMs(lesson.steps[1],60),2000);
  assert.equal(requiredDurationMs(lesson.steps[1],120),1000);
  assert.match(durationLabel(lesson.steps[1],60),/Mínima/);
});
test('cada etapa rítmica tem ID exclusivo e figura válida',()=>{
  const steps=LESSONS.flatMap(l=>l.steps);
  assert.equal(new Set(steps.map(s=>s.id)).size,steps.length);
  assert.equal(steps.filter(s=>s.figure).length,15);
});
test('BPM inválido não é aceito',()=>{
  assert.throws(()=>beatMs(0));assert.throws(()=>beatMs(200));assert.equal(beatMs(60),1000);
});
