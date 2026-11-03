import test from 'node:test';
import assert from 'node:assert/strict';
import { freshHold, advanceHold, countValidPercent } from '../src/lib/practice.ts';

const config = { requiredMs: 2000, graceMs: 180, maxFrameGapMs: 240 };
function feed(s, frames) { return frames.reduce((state, [time, ok]) => advanceHold(state, time, ok, config), s); }

test('check somente depois de 2s válidos', () => {
  let state = freshHold();
  for (let t=0;t<=2000;t+=80) state=advanceHold(state,t,true,config);
  assert.equal(state.completed,true);
  assert.equal(state.creditedMs,2000);
  assert.equal(countValidPercent(state,2000),100);
});

test('silêncio prolongado zera o progresso da tentativa', () => {
  const state = feed(freshHold(),[[0,true],[100,true],[200,true],[300,false],[400,false],[500,false]]);
  assert.equal(state.creditedMs,0);
  assert.equal(state.completed,false);
});

test('interrupção curtíssima não conta como tempo válido', () => {
  const state = feed(freshHold(),[[0,true],[100,true],[200,false],[300,true],[400,true]]);
  assert.equal(state.creditedMs,200);
});

test('amostras duplicadas e pausas grandes nunca somam tempo',()=>{
  let state=feed(freshHold(),[[0,true],[100,true],[100,true],[1000,true]]);
  assert.equal(state.creditedMs,0);
  state=advanceHold(state,1100,true,config);
  assert.equal(state.creditedMs,100);
});

test('depois do sucesso, não atribui novo progresso', () => {
  let state=freshHold();
  for(let t=0;t<=2000;t+=80) state=advanceHold(state,t,true,config);
  assert.deepEqual(advanceHold(state,2100,false,config),state);
});
