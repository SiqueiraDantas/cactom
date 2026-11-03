import test from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, lessonCompleted, firstIncompleteIndex } from '../src/lib/curriculum.ts';

test('currículo inclui treze aulas e cada etapa tem ID exclusivo',()=>{
  assert.equal(LESSONS.length,13);
  const ids=LESSONS.flatMap(l=>l.steps.map(s=>s.id));
  assert.equal(new Set(ids).size,ids.length);
});
test('repetição da mesma nota exige check independente',()=>{
  const melody=LESSONS.find(l=>l.id==='pequena-melodia');
  assert.equal(melody.steps[0].note.id,melody.steps[1].note.id);
  assert.notEqual(melody.steps[0].id,melody.steps[1].id);
  assert.equal(lessonCompleted(melody,[melody.steps[0].id],[]),false);
  assert.equal(firstIncompleteIndex(melody,[melody.steps[0].id]),1);
});
test('pistos só concluem ao explorar os três',()=>{
  const pistos=LESSONS[0];
  assert.equal(lessonCompleted(pistos,[],[1,2]),false);
  assert.equal(lessonCompleted(pistos,[],[1,2,3]),true);
});
test('metas aumentam no desafio sem valores impossíveis',()=>{
  const challenge=LESSONS.find(l=>l.id==='firmeza');
  assert.equal(challenge.steps.every(s=>s.holdSeconds===3),true);
  assert.equal(LESSONS.flatMap(l=>l.steps).filter(s=>!s.figure).every(s=>s.holdSeconds>=1.5&&s.holdSeconds<=3),true);
});
