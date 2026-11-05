import test from 'node:test';
import assert from 'node:assert/strict';
import { INSTRUMENTS,availableInstrument,trumpetNote } from '../src/lib/instruments.ts';
import { targetFrequencyFor } from '../src/lib/music.ts';
test('os quatro cursos liberados podem ser selecionados; regência bloqueada',()=>{assert.deepEqual(INSTRUMENTS.filter(i=>i.available).map(i=>i.id),['trumpet-bb','recorder-soprano','iniciacao','clarinet-bb']);assert.equal(availableInstrument('conductor'),null);assert.ok(availableInstrument('trumpet-bb'));assert.ok(availableInstrument('recorder-soprano'));assert.ok(availableInstrument('clarinet-bb')); assert.equal(availableInstrument('alto-sax'),null);assert.equal(availableInstrument('flute'),null);assert.equal(availableInstrument(null),null);});
test('perfil do trompete preserva transposição e harmônicos',()=>{assert.ok(Math.abs(targetFrequencyFor(trumpetNote(60))-233.0819)<.01);assert.deepEqual(trumpetNote(60).valves,trumpetNote(67).valves);assert.notEqual(targetFrequencyFor(trumpetNote(60)),targetFrequencyFor(trumpetNote(67)));});
test('partituras fora da extensão acústica não são avaliadas',()=>{assert.throws(()=>trumpetNote(59));assert.throws(()=>trumpetNote(85));assert.throws(()=>trumpetNote(60.5));assert.deepEqual(trumpetNote(66).valves,[2]);assert.deepEqual(trumpetNote(61).valves,[1,2,3]);});
