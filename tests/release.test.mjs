import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceRelease,waitingForRelease } from '../src/lib/release.ts';

test('próxima nota precisa de uma pausa silenciosa contínua',()=>{
  let gate=waitingForRelease();
  gate=advanceRelease(gate,0,false);
  gate=advanceRelease(gate,100,true);
  gate=advanceRelease(gate,220,true);
  assert.equal(gate.awaiting,true);
  gate=advanceRelease(gate,280,false);
  gate=advanceRelease(gate,330,true);
  gate=advanceRelease(gate,520,true);
  assert.equal(gate.awaiting,true);
  gate=advanceRelease(gate,610,true);
  assert.equal(gate.awaiting,false);
});
test('uma nota sustentada nunca destrava a etapa seguinte',()=>{
  let gate=waitingForRelease();
  for(let t=0;t<4000;t+=100) gate=advanceRelease(gate,t,false);
  assert.equal(gate.awaiting,true);
});
