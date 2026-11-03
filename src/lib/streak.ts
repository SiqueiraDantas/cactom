import type { KeyValueStorage } from './profileStorage';

export const STREAK_KEY = 'mis-music-lab-streak-v1';
export const STREAK_TIME_ZONE = 'America/Fortaleza';
// At most a century of distinct dates, without retaining attempts or media.
export const STREAK_MAX_DAYS = 36_600;
const MAX_JSON_LENGTH = 600_000;
const DAY_MS = 86_400_000;
const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: STREAK_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
});
const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export type StreakClock = Date | number;
export type StreakLedger = { readonly version: 1; readonly days: readonly string[] };
export type StreakCalendarDay = {
  date: string;
  weekday: typeof WEEKDAYS[number];
  practiced: boolean;
  isToday: boolean;
};
export type StreakSummary = {
  today: string;
  currentStreak: number;
  bestStreak: number;
  totalDays: number;
  practicedToday: boolean;
  dailyGoal: { target: 1; completed: 0 | 1 };
  week: StreakCalendarDay[];
};
export type StreakRecordResult = {
  ledger: StreakLedger;
  added: boolean;
  persisted: boolean;
};

/** An ordinal for a real Gregorian date, independent of the computer timezone. */
function ordinal(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (year < 1000 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.getTime() / DAY_MS;
}

function dateFromOrdinal(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

/** The practice date follows Fortaleza, even when the device is in another timezone. */
export function localPracticeDate(now: StreakClock = Date.now()): string {
  const timestamp = now instanceof Date ? now.getTime() : now;
  if (!Number.isFinite(timestamp)) throw new RangeError('Relógio inválido para a sequência de prática.');
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) throw new RangeError('Relógio inválido para a sequência de prática.');
  const parts = dateFormatter.formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(value => value.type === type)?.value ?? '';
  const result = `${part('year')}-${part('month')}-${part('day')}`;
  if (ordinal(result) === null) throw new RangeError('Data fora do intervalo da sequência de prática.');
  return result;
}

export function emptyStreakLedger(): StreakLedger {
  return { version: 1, days: [] };
}

/** Only validated, unique dates up to today can contribute to progress. */
export function normalizeStreakLedger(value: unknown, now: StreakClock = Date.now()): StreakLedger {
  const today = localPracticeDate(now);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyStreakLedger();
  const candidate = value as { version?: unknown; days?: unknown };
  if (candidate.version !== 1 || !Array.isArray(candidate.days)) return emptyStreakLedger();
  const days = new Set<string>();
  // Bound work even if a caller passes an unusually large in-memory array.
  for (const day of candidate.days.slice(-STREAK_MAX_DAYS)) {
    if (ordinal(day) !== null && day <= today) days.add(day);
  }
  return { version: 1, days: [...days].sort() };
}

/** Pure update for an explicitly verified practice date; it never counts a visit. */
export function appendPracticeDay(ledger: unknown, day: unknown, now: StreakClock = Date.now()): StreakLedger {
  const normalized = normalizeStreakLedger(ledger, now);
  if (typeof day !== 'string' || ordinal(day) === null || day > localPracticeDate(now) || normalized.days.includes(day)) return normalized;
  return { version: 1, days: [...normalized.days, day].sort().slice(-STREAK_MAX_DAYS) };
}

function readLedger(storage: KeyValueStorage, now: StreakClock): { ledger: StreakLedger; readable: boolean } {
  let raw: string | null;
  try { raw = storage.getItem(STREAK_KEY); }
  catch { return { ledger: emptyStreakLedger(), readable: false }; }
  if (raw === null) return { ledger: emptyStreakLedger(), readable: true };
  if (raw.length > MAX_JSON_LENGTH) return { ledger: emptyStreakLedger(), readable: true };
  try { return { ledger: normalizeStreakLedger(JSON.parse(raw) as unknown, now), readable: true }; }
  catch { return { ledger: emptyStreakLedger(), readable: true }; }
}

/** Pass the current ProfileStorage so demo and each local account remain isolated. */
export function readStreak(storage: KeyValueStorage, now: StreakClock = Date.now()): StreakLedger {
  localPracticeDate(now);
  return readLedger(storage, now).ledger;
}

/** Call only after completing a valid stage; opening the app must not call this. */
export function recordPracticeDay(storage: KeyValueStorage, now: StreakClock = Date.now()): StreakRecordResult {
  const today = localPracticeDate(now);
  const { ledger: previous, readable } = readLedger(storage, now);
  const ledger = appendPracticeDay(previous, today, now);
  const added = !previous.days.includes(today);
  if (!readable) return { ledger, added, persisted: false };
  if (!added) return { ledger, added, persisted: true };
  try {
    storage.setItem(STREAK_KEY, JSON.stringify(ledger));
    return { ledger, added, persisted: true };
  } catch {
    return { ledger, added, persisted: false };
  }
}

export function streakSummary(ledger: unknown, now: StreakClock = Date.now()): StreakSummary {
  const today = localPracticeDate(now);
  const todayOrdinal = ordinal(today)!;
  const normalized = normalizeStreakLedger(ledger, now);
  const practiced = new Set(normalized.days);
  let bestStreak = 0;
  let lastRun = 0;
  let previousOrdinal: number | null = null;
  for (const date of normalized.days) {
    const day = ordinal(date)!;
    lastRun = previousOrdinal !== null && day === previousOrdinal + 1 ? lastRun + 1 : 1;
    bestStreak = Math.max(bestStreak, lastRun);
    previousOrdinal = day;
  }
  // Yesterday keeps the sequence alive while today's goal is still available.
  const currentStreak = previousOrdinal === todayOrdinal || previousOrdinal === todayOrdinal - 1 ? lastRun : 0;
  const practicedToday = practiced.has(today);
  const week = Array.from({ length: 7 }, (_, index): StreakCalendarDay => {
    const day = todayOrdinal - 6 + index;
    const date = dateFromOrdinal(day);
    return { date, weekday: WEEKDAYS[new Date(day * DAY_MS).getUTCDay()], practiced: practiced.has(date), isToday: day === todayOrdinal };
  });
  return {
    today, currentStreak, bestStreak, totalDays: normalized.days.length, practicedToday,
    dailyGoal: { target: 1, completed: practicedToday ? 1 : 0 }, week,
  };
}
