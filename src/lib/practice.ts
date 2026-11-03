/**
 * Credit only stable, consecutive valid frames toward a held note.
 * Brief detection dropouts (< graceMs) freeze time instead of granting it.
 * Stale frames and longer interruptions reset the attempt.
 * Pure logic so it can be checked without hardware.
 */
export type HoldState = {
  creditedMs: number;
  lastAt: number | null;
  invalidSince: number | null;
  lastFrameValid: boolean;
  completed: boolean;
};

export type HoldConfig = {
  requiredMs: number;
  graceMs: number;
  maxFrameGapMs: number;
};

export const DEFAULT_HOLD_CONFIG: HoldConfig = {
  requiredMs: 2000,
  graceMs: 180,
  maxFrameGapMs: 240,
};

export function freshHold(): HoldState {
  return { creditedMs: 0, lastAt: null, invalidSince: null, lastFrameValid: false, completed: false };
}

export function advanceHold(
  previous: HoldState,
  at: number,
  valid: boolean,
  options: HoldConfig = DEFAULT_HOLD_CONFIG,
): HoldState {
  if (previous.completed || !Number.isFinite(at)) return previous;
  if (previous.lastAt !== null && at <= previous.lastAt) return previous;
  const delta = previous.lastAt === null ? 0 : at - previous.lastAt;
  if (previous.lastAt !== null && delta > options.maxFrameGapMs) {
    return valid ? { ...freshHold(), lastAt: at, lastFrameValid: true } : freshHold();
  }
  if (!valid) {
    const since = previous.invalidSince ?? at;
    if (at - since > options.graceMs) return { ...freshHold(), lastAt: at, invalidSince: since };
    return { ...previous, lastAt: at, invalidSince: since, lastFrameValid: false };
  }
  const gapExceeded = previous.invalidSince !== null && at - previous.invalidSince > options.graceMs;
  const creditedMs = gapExceeded
    ? 0
    : previous.creditedMs + (previous.lastFrameValid ? delta : 0);
  return {
    creditedMs: Math.min(creditedMs, options.requiredMs),
    lastAt: at,
    invalidSince: null,
    lastFrameValid: true,
    completed: creditedMs >= options.requiredMs,
  };
}

export function countValidPercent(state: HoldState, requiredMs: number): number {
  return Math.min(100, Math.round((100 * state.creditedMs) / requiredMs));
}
