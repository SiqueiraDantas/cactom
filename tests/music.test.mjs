import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BEGINNER_NOTES, centsBetween, evaluatePitch, formatWrittenNote,
  midiToFrequency, targetFrequencyFor, writtenToConcertMidi,
} from '../src/lib/music.ts';

test('trompete Si bemol soa dois semitons abaixo', () => {
  assert.equal(writtenToConcertMidi(60), 58);
  assert.ok(Math.abs(targetFrequencyFor(BEGINNER_NOTES[0]) - 233.0819) < 0.01);
});

test('cinco notas iniciais possuem digitações esperadas', () => {
  assert.deepEqual(BEGINNER_NOTES.map(n => n.valves), [[], [1,3], [1,2], [1], []]);
});

test('afinação compara nota real com alvo transposto', () => {
  const note = BEGINNER_NOTES[2];
  assert.equal(evaluatePitch(targetFrequencyFor(note), note).inTune, true);
  assert.equal(evaluatePitch(targetFrequencyFor(note), note).detectedWritten, 'Mi 4');
  assert.equal(evaluatePitch(midiToFrequency(67), note).correctNote, false);
});

test('cents e arredondamento de nota', () => {
  assert.ok(Math.abs(centsBetween(440, 440)) < 0.000001);
  assert.equal(Math.round(centsBetween(466.16376, 440)), 100);
  assert.equal(formatWrittenNote(60), 'Dó 4');
});
