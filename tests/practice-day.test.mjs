import test from 'node:test';
import assert from 'node:assert/strict';
import { markPracticeDay } from '../src/lib/practiceDay.ts';
import { createProfileStorage } from '../src/lib/profileStorage.ts';
import { readStreak, STREAK_KEY } from '../src/lib/streak.ts';

const NOW = Date.parse('2026-10-22T15:00:00Z');
const DAY = 86_400_000;
const firstId = 'fd1710a2-8351-41bb-b0d3-e9eb545dc7d8';
const secondId = '026af5d0-cc7f-4de6-9d34-4c4870e8b33f';
function memoryStorage() {
  const data = new Map(), writes = [];
  return { data, writes, getItem: key => data.get(key) ?? null, setItem(key, value) { data.set(key, value); writes.push(key); }, removeItem(key) { data.delete(key); } };
}
function capturePracticeEvents(t) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const target = new EventTarget(), events = [];
  target.addEventListener('mis-practice-day', event => events.push(event.detail));
  Object.defineProperty(globalThis, 'window', { configurable: true, value: target });
  t.after(() => { if (original) Object.defineProperty(globalThis, 'window', original); else delete globalThis.window; });
  return events;
}

test('etapas válidas repetidas registram uma data e comunicam a meta da demo', t => {
  const events = capturePracticeEvents(t), backing = memoryStorage();
  const storage = createProfileStorage(null, backing);
  const first = markPracticeDay(storage, NOW);
  const second = markPracticeDay(storage, NOW + 1000);
  assert.equal(first.added, true);
  assert.equal(second.added, false);
  assert.equal(second.persisted, true);
  assert.deepEqual(second.ledger.days, ['2026-10-22']);
  assert.deepEqual(backing.writes, [STREAK_KEY]);
  assert.deepEqual(readStreak(storage, NOW).days, ['2026-10-22']);
  assert.equal(events.length, 2);
  for (const event of events) {
    assert.equal(event.profileId, null);
    assert.equal(event.persisted, true);
    assert.deepEqual(event.ledger.days, ['2026-10-22']);
  }
});

test('evento identifica o perfil capturado, inclusive ao concluir callback de conta anterior', t => {
  const events = capturePracticeEvents(t), backing = memoryStorage();
  const first = createProfileStorage(firstId, backing);
  const finishOldActivity = () => markPracticeDay(first, NOW);
  const second = createProfileStorage(secondId, backing);
  markPracticeDay(second, NOW - DAY);
  finishOldActivity();
  markPracticeDay(createProfileStorage(null, backing), NOW);
  assert.deepEqual(events.map(event => event.profileId), [secondId, firstId, null]);
  assert.deepEqual(events.filter(event => event.profileId === secondId).map(event => event.ledger.days), [['2026-10-21']]);
  assert.deepEqual(readStreak(first, NOW).days, ['2026-10-22']);
  assert.deepEqual(readStreak(second, NOW).days, ['2026-10-21']);
});

test('escrita bloqueada conserva ledger na sessão e repetir o dia não anuncia persistência falsa', t => {
  const events = capturePracticeEvents(t), backing = memoryStorage();
  const blocked = { ...backing, setItem() { throw new Error('quota'); } };
  const storage = createProfileStorage(firstId, blocked);
  const first = markPracticeDay(storage, NOW);
  const repeat = markPracticeDay(storage, NOW + 1000);
  assert.equal(first.persisted, false);
  assert.equal(repeat.added, false);
  assert.equal(repeat.persisted, false);
  assert.equal(storage.isPersistent(), false);
  assert.deepEqual(readStreak(storage, NOW).days, ['2026-10-22']);
  assert.deepEqual(events.map(event => event.persisted), [false, false]);
  assert.deepEqual(events.map(event => event.ledger.days), [['2026-10-22'], ['2026-10-22']]);
  assert.equal(backing.data.size, 0);
  assert.deepEqual(readStreak(createProfileStorage(firstId, blocked), NOW).days, []);
  assert.deepEqual(readStreak(createProfileStorage(secondId, blocked), NOW).days, []);
});

test('nova prática após recuperar escrita salva também o dia retido na sessão', t => {
  const events = capturePracticeEvents(t), backing = memoryStorage();
  let writable = false;
  const recovering = { ...backing, setItem(key, value) { if (!writable) throw new Error('quota'); backing.setItem(key, value); } };
  const storage = createProfileStorage(firstId, recovering);
  markPracticeDay(storage, NOW);
  writable = true;
  const nextDay = markPracticeDay(storage, NOW + DAY);
  assert.equal(nextDay.persisted, true);
  assert.equal(storage.isPersistent(), true);
  assert.deepEqual(nextDay.ledger.days, ['2026-10-22', '2026-10-23']);
  assert.deepEqual(readStreak(createProfileStorage(firstId, backing), NOW + DAY).days, ['2026-10-22', '2026-10-23']);
  assert.deepEqual(events.map(event => event.persisted), [false, true]);
});
