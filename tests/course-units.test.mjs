import test from 'node:test';
import assert from 'node:assert/strict';
import { courseFor } from '../src/lib/courses.ts';

for (const instrument of ['trumpet-bb', 'recorder-soprano']) {
  test(`a trilha de ${instrument} mantém todas as aulas nas unidades sequenciais`, () => {
    const { lessons, units } = courseFor(instrument);
    assert.equal(units.length, 3);
    assert.equal(units[0].from, 0);
    assert.equal(units.at(-1).to, lessons.length);
    assert.ok(units.every(unit => unit.title && unit.description && unit.from < unit.to));
    for (let i=1; i<units.length; i++) assert.equal(units[i-1].to, units[i].from);
    assert.deepEqual(units.flatMap(unit=>lessons.slice(unit.from,unit.to)), [...lessons]);
  });
}
