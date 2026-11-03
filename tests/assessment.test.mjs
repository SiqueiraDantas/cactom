import test from 'node:test';
import assert from 'node:assert/strict';
import { checkReading, recentJitter, analysisGuidance } from '../src/lib/assessment.ts';
import { BEGINNER_NOTES, targetFrequencyFor } from '../src/lib/music.ts';

const sol=BEGINNER_NOTES[4];
const sample=(frequency,clarity=0.96,rms=.05)=>({frequency,clarity,rms,timestamp:500});

test('reconhece a nota correta e sustenta quando dentro da faixa',()=>{
  const result=checkReading(sample(targetFrequencyFor(sol)),sol,[0,1,0,-1,0],45,30);
  assert.equal(result.status,'valid');
  assert.equal(result.valid,true);
});
test('não dá crédito para erro de nota ou ruído baixo',()=>{
  assert.equal(checkReading(sample(262),sol,[],45,30).status,'wrong-note');
  assert.equal(checkReading(sample(targetFrequencyFor(sol),.2),sol,[],45,30).status,'silence');
  assert.equal(checkReading(sample(targetFrequencyFor(sol),.99,.001),sol,[],45,30).status,'silence');
});
test('identifica som agudo com diferença maior que tolerância',()=>{
  const frequency=targetFrequencyFor(sol)*2**(48/1200);
  const result=checkReading(sample(frequency),sol,[],40,30);
  assert.equal(result.status,'out-of-tune');
  assert.equal(result.valid,false);
});
test('avisa sobre oscilação alta de afinação',()=>{
  const result=checkReading(sample(targetFrequencyFor(sol)*2**(35/1200)),sol,[-33,29,-34,25,31],45,22);
  assert.equal(result.status,'unstable');
  assert.ok(recentJitter([-33,29,-34,25,31]) > 22);
});
test('feedback distingue agudo e grave',()=>{
  assert.match(analysisGuidance('out-of-tune',25,sol.label,sol.label).title,/agudo/);
  assert.match(analysisGuidance('out-of-tune',-25,sol.label,sol.label).title,/grave/);
});
