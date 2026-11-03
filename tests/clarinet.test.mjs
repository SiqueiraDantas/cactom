import assert from 'node:assert/strict';
import test from 'node:test';
import {CLARINET_FINGERINGS,CLARINET_LESSONS,CLARINET_UNITS,clarinetNote,clarinetPitchMatches} from '../src/lib/clarinet.ts';
import {midiToFrequency,targetFrequencyFor} from '../src/lib/music.ts';
import {availableInstrument} from '../src/lib/instruments.ts';
test('curso de clarinete está disponível sem alterar cursos anteriores',()=>{
 assert.ok(availableInstrument('clarinet-bb'));
 assert.ok(availableInstrument('trumpet-bb'));
 assert.ok(availableInstrument('recorder-soprano'));
 assert.ok(availableInstrument('conductor'));
 assert.equal(CLARINET_LESSONS.length,9);
 assert.equal(CLARINET_UNITS.length,3);
 assert.deepEqual(CLARINET_LESSONS.map(x=>x.unit).sort((a,b)=>a-b),[0,0,0,1,1,1,2,2,2]);
});
test('digitação inicial e transposição em Si bemol verificadas',()=>{
 assert.deepEqual(CLARINET_FINGERINGS.map(x=>x.midi),[67,65,64,62,60]);
 assert.deepEqual(CLARINET_FINGERINGS.find(x=>x.midi===60)?.keys,['T','1','2','3']);
 assert.deepEqual(CLARINET_FINGERINGS.find(x=>x.midi===67)?.keys,[]);
 for(const lesson of CLARINET_LESSONS){assert.ok(lesson.notes.length);for(const midi of lesson.notes){
   const note=clarinetNote(midi);assert.equal(note.transposeSemitones,-2);
   assert.equal(targetFrequencyFor(note),midiToFrequency(midi-2));
   assert.equal(clarinetPitchMatches(midiToFrequency(midi-2),midi),true);
   assert.equal(clarinetPitchMatches(midiToFrequency(midi),midi),false);
 }}
});
test('um semitom errado não completa um exercício de clarinete',()=>{
 assert.equal(clarinetPitchMatches(midiToFrequency(63),64),false);
 assert.throws(()=>clarinetNote(85));
});
