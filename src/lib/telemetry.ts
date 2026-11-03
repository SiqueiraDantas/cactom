import type { ReadingStatus } from './assessment.ts';

/** These points contain calculated pitch data, never microphone recordings. */
export type PitchPoint = {
  at: number;
  cents: number | null;
  status: ReadingStatus;
};

export type NoteResult = {
  stepId: string;
  noteLabel: string;
  completedAt: string;
  durationMs: number;
  requiredMs: number;
  meanCents: number;
  spreadCents: number;
  peakDeviationCents: number;
  measuredFrames: number;
  attempts: number;
  quality: 'muito-estavel' | 'estavel' | 'precisa-praticar';
  advice: string;
};

export function appendPitchPoint(
  previous: readonly PitchPoint[],
  point: PitchPoint,
  windowMs = 9000,
  maxPoints = 120,
): PitchPoint[] {
  if (!Number.isFinite(point.at)) return [...previous];
  if (previous.length && point.at <= previous[previous.length - 1].at) return [...previous];
  return [...previous, point].filter(p => p.at >= point.at - windowMs).slice(-maxPoints);
}

const rounded = (n: number) => Math.round(n * 10) / 10;

/** Called only after the acoustic hold was approved by the existing motor. */
export function summarizeCompletedNote(args: {
  stepId: string;
  noteLabel: string;
  completedAt: string;
  validCents: readonly number[];
  durationMs: number;
  requiredMs: number;
  attempts: number;
}): NoteResult | null {
  const { validCents, durationMs, requiredMs, attempts } = args;
  if (validCents.length < 4 || validCents.some(c => !Number.isFinite(c)) ||
      !Number.isFinite(durationMs) || durationMs < requiredMs || requiredMs <= 0) return null;
  const mean = validCents.reduce((sum, c) => sum + c, 0) / validCents.length;
  const spread = Math.sqrt(validCents.reduce((sum, c) => sum + (c - mean) ** 2, 0) / validCents.length);
  const peak = Math.max(...validCents.map(c => Math.abs(c)));
  const quality: NoteResult['quality'] = spread <= 10 && Math.abs(mean) <= 12
    ? 'muito-estavel' : spread <= 20 && Math.abs(mean) <= 22 ? 'estavel' : 'precisa-praticar';
  const advice = quality === 'muito-estavel'
    ? 'Boa regularidade da altura! Descanse um instante e continue a sequência.'
    : quality === 'estavel'
      ? 'Muito bem: a nota foi sustentada. Procure aproximar o som do centro do afinador.'
      : 'Você completou a nota. Na próxima tentativa, observe as oscilações do gráfico e busque uma emissão confortável e regular.';
  return {
    stepId: args.stepId,
    noteLabel: args.noteLabel,
    completedAt: args.completedAt,
    durationMs: rounded(durationMs),
    requiredMs,
    meanCents: rounded(mean),
    spreadCents: rounded(spread),
    peakDeviationCents: rounded(peak),
    measuredFrames: validCents.length,
    attempts: Math.max(1, Math.floor(attempts)),
    quality,
    advice,
  };
}

export function qualityLabel(quality: NoteResult['quality']): string {
  return quality === 'muito-estavel' ? 'Muito estável'
    : quality === 'estavel' ? 'Estável' : 'Praticar regularidade';
}

/** SVG helper: only plausible pitch readings are connected; silence/wrong pitch creates a gap. */
export function chartPaths(points: readonly PitchPoint[], clampCents = 90): string[] {
  if (points.length < 2) return [];
  const first = points[0].at;
  const last = points[points.length - 1].at;
  const elapsed = Math.max(1, last - first);
  const paths: string[] = [];
  let path = '';
  let count = 0;
  const flush = () => { if (count >= 2) paths.push(path); path = ''; count = 0; };
  for (const point of points) {
    if (point.cents === null || !Number.isFinite(point.cents) ||
        point.status === 'silence' || point.status === 'wrong-note') { flush(); continue; }
    const x = 42 + 410 * (point.at - first) / elapsed;
    const y = 88 - Math.max(-clampCents, Math.min(clampCents, point.cents)) / clampCents * 67;
    path += `${count === 0 ? 'M' : ' L'}${x.toFixed(1)},${y.toFixed(1)}`;
    count++;
  }
  flush();
  return paths;
}

/** Produces an anonymous, locally stored CSV without introducing third-party analytics. */
export function resultsCsv(results: readonly NoteResult[]): string {
  const header = 'atividade,nota,concluida_em,duracao_s,media_cents,oscilacao_cents,desvio_maximo_cents,tentativas,qualidade';
  const q = (s: string) => `"${s.replaceAll('"','""')}"`;
  return [header, ...results.map(r => [r.stepId, r.noteLabel, r.completedAt,
    (r.durationMs / 1000).toFixed(2), r.meanCents, r.spreadCents, r.peakDeviationCents,
    r.attempts, qualityLabel(r.quality)].map(value => q(String(value))).join(','))].join('\r\n');
}
