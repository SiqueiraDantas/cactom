import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STREAK_KEY, STREAK_TIME_ZONE, STREAK_MAX_DAYS,
  localPracticeDate, emptyStreakLedger, normalizeStreakLedger,
  appendPracticeDay, readStreak, recordPracticeDay, streakSummary,
} from '../src/lib/streak.ts';
import { createProfileStorage } from '../src/lib/profileStorage.ts';

const NOW = Date.parse('2026-10-22T15:00:00.000Z');
const ledger = (...days) => ({ version: 1, days });
function storage() {
  const data = new Map();
  const writes = [];
  return {
    data, writes,
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); writes.push(key); },
    removeItem: key => data.delete(key),
  };
}

test('a data de prática usa Fortaleza na virada da meia-noite, sem depender da data UTC', () => {
  assert.equal(STREAK_TIME_ZONE, 'America/Fortaleza');
  assert.equal(localPracticeDate(Date.parse('2026-10-23T02:59:59.999Z')), '2026-10-22');
  assert.equal(localPracticeDate(new Date('2026-10-23T03:00:00.000Z')), '2026-10-23');
  assert.equal(localPracticeDate(Date.parse('2027-01-01T02:59:59.999Z')), '2026-12-31');
  assert.equal(localPracticeDate(Date.parse('2027-01-01T03:00:00.000Z')), '2027-01-01');
});

test('sem etapa concluída a leitura não inventa dias, sequência ou meta cumprida', () => {
  const backing = storage();
  const result = streakSummary(readStreak(backing, NOW), NOW);
  assert.equal(result.currentStreak, 0);
  assert.equal(result.bestStreak, 0);
  assert.equal(result.totalDays, 0);
  assert.equal(result.practicedToday, false);
  assert.deepEqual(result.dailyGoal, { target: 1, completed: 0 });
  assert.equal(result.week.length, 7);
  assert.equal(result.week.filter(day => day.isToday).length, 1);
  assert.equal(backing.writes.length, 0);
});

test('uma etapa válida registra hoje uma vez, mesmo com várias práticas e dois instrumentos', () => {
  const backing = storage();
  const first = recordPracticeDay(backing, NOW);
  const second = recordPracticeDay(backing, NOW + 1_000);
  assert.equal(first.added, true);
  assert.equal(first.persisted, true);
  assert.equal(second.added, false);
  assert.deepEqual(second.ledger.days, ['2026-10-22']);
  assert.equal(backing.writes.length, 1);
  const result = streakSummary(second.ledger, NOW);
  assert.equal(result.currentStreak, 1);
  assert.equal(result.bestStreak, 1);
  assert.deepEqual(result.dailyGoal, { target: 1, completed: 1 });
});

test('ontem preserva a sequência enquanto ainda há tempo para cumprir a meta de hoje', () => {
  const data = ledger('2026-10-19', '2026-10-20', '2026-10-21');
  const result = streakSummary(data, NOW);
  assert.equal(result.currentStreak, 3);
  assert.equal(result.bestStreak, 3);
  assert.equal(result.practicedToday, false);
  assert.equal(streakSummary(appendPracticeDay(data, '2026-10-22', NOW), NOW).currentStreak, 4);
});

test('um dia perdido encerra a sequência atual e conserva a melhor sequência registrada', () => {
  const data = ledger('2026-10-14', '2026-10-15', '2026-10-16', '2026-10-20');
  const result = streakSummary(data, NOW);
  assert.equal(result.currentStreak, 0);
  assert.equal(result.bestStreak, 3);
  assert.equal(result.totalDays, 4);
  const renewed = streakSummary(appendPracticeDay(data, '2026-10-22', NOW), NOW);
  assert.equal(renewed.currentStreak, 1);
  assert.equal(renewed.bestStreak, 3);
});

test('sequências e calendário passam por fim de mês, ano e 29 de fevereiro reais', () => {
  const at = Date.parse('2024-03-01T15:00:00Z');
  const result = streakSummary(ledger('2024-02-28', '2024-02-29', '2024-03-01'), at);
  assert.equal(result.currentStreak, 3);
  assert.deepEqual(result.week.map(day => day.date), ['2024-02-24', '2024-02-25', '2024-02-26', '2024-02-27', '2024-02-28', '2024-02-29', '2024-03-01']);
  const newYear = Date.parse('2027-01-02T15:00:00Z');
  assert.equal(streakSummary(ledger('2026-12-31', '2027-01-01'), newYear).currentStreak, 2);
  assert.equal(result.week.at(-1).weekday, 'Sex');
});

test('normalização elimina datas impossíveis, futuras, duplicadas e tipos inválidos', () => {
  const value = ledger('2026-10-22', '2026-10-20', '2026-10-20', '2026-10-23', '2026-02-29', '2024-02-30', '2026-13-01', '2026-10-00', '22/10/2026', '2026-1-02', null, 0, {}, '2024-02-29');
  assert.deepEqual(normalizeStreakLedger(value, NOW), ledger('2024-02-29', '2026-10-20', '2026-10-22'));
  assert.deepEqual(appendPracticeDay(emptyStreakLedger(), '2026-10-23', NOW), emptyStreakLedger());
  assert.deepEqual(appendPracticeDay(emptyStreakLedger(), '2026-02-29', NOW), emptyStreakLedger());
  assert.equal(streakSummary(ledger('2026-10-23'), NOW).currentStreak, 0);
});

test('JSON e versões corrompidos são ignorados; uma nova etapa pode começar um ledger válido', () => {
  const backing = storage();
  for (const raw of ['{', 'null', '[]', '{"version":2,"days":["2026-10-22"]}', '{"version":1,"days":"2026-10-22"}']) {
    backing.setItem(STREAK_KEY, raw);
    assert.deepEqual(readStreak(backing, NOW), emptyStreakLedger());
  }
  assert.deepEqual(recordPracticeDay(backing, NOW).ledger, ledger('2026-10-22'));
  assert.deepEqual(readStreak(backing, NOW), ledger('2026-10-22'));
});

test('a leitura e a normalização têm limites seguros sem aceitar datas futuras', () => {
  const backing = storage();
  backing.setItem(STREAK_KEY, ' '.repeat(600_001));
  assert.deepEqual(readStreak(backing, NOW), emptyStreakLedger());
  const candidate = ledger(...Array(STREAK_MAX_DAYS + 100).fill('2026-10-21'));
  assert.deepEqual(normalizeStreakLedger(candidate, NOW), ledger('2026-10-21'));
});

test('falhas de armazenamento retornam progresso da sessão e não sobrescrevem dados ilegíveis', () => {
  let writes = 0;
  const unavailable = { getItem: () => { throw new Error('blocked'); }, setItem: () => { writes++; }, removeItem: () => {} };
  const result = recordPracticeDay(unavailable, NOW);
  assert.equal(result.persisted, false);
  assert.equal(result.added, true);
  assert.deepEqual(result.ledger, ledger('2026-10-22'));
  assert.equal(writes, 0);
  const full = { getItem: () => JSON.stringify(ledger('2026-10-21')), setItem: () => { throw new Error('quota'); }, removeItem: () => {} };
  const quotaResult = recordPracticeDay(full, NOW);
  assert.equal(quotaResult.persisted, false);
  assert.equal(streakSummary(quotaResult.ledger, NOW).currentStreak, 2);
});

test('contas locais e demo mantêm dias isolados através de ProfileStorage', () => {
  const backing = storage();
  const demo = createProfileStorage(null, backing);
  const ana = createProfileStorage('12345678-1234-4123-8123-123456789abc', backing);
  const bia = createProfileStorage('87654321-4321-4321-9321-cba987654321', backing);
  recordPracticeDay(demo, NOW);
  recordPracticeDay(ana, NOW - 86_400_000);
  assert.deepEqual(readStreak(demo, NOW).days, ['2026-10-22']);
  assert.deepEqual(readStreak(ana, NOW).days, ['2026-10-21']);
  assert.deepEqual(readStreak(bia, NOW).days, []);
  assert.equal(backing.data.size, 2);
});

test('funções puras preservam a entrada e relógios inválidos não gravam prática', () => {
  const source = Object.freeze({ version: 1, days: Object.freeze(['2026-10-21']) });
  assert.deepEqual(appendPracticeDay(source, '2026-10-22', NOW).days, ['2026-10-21', '2026-10-22']);
  assert.deepEqual(source.days, ['2026-10-21']);
  const backing = storage();
  assert.throws(() => recordPracticeDay(backing, NaN), RangeError);
  assert.throws(() => recordPracticeDay(backing, new Date('invalid')), RangeError);
  assert.throws(() => localPracticeDate(Infinity), RangeError);
  assert.equal(backing.writes.length, 0);
});
