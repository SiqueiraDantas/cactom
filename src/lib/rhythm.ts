/** Figure durations relative to the quarter-note pulse (♩ = BPM). */
export type Figure = 'quarter' | 'half' | 'whole';
export const FIGURES: Record<Figure, { label: string; beats: number; symbol: string }> = {
  quarter: { label: 'Semínima', beats: 1, symbol: '♩' },
  half: { label: 'Mínima', beats: 2, symbol: '𝅗𝅥' },
  whole: { label: 'Semibreve', beats: 4, symbol: '𝅝' },
};
export const BPM_MIN = 45;
export const BPM_MAX = 120;
export function beatMs(bpm: number): number {
  if (!Number.isFinite(bpm) || bpm < BPM_MIN || bpm > BPM_MAX) throw new Error('BPM fora da faixa didática.');
  return 60000 / bpm;
}
export function figureDurationMs(figure: Figure, bpm: number): number {
  return Math.round(FIGURES[figure].beats * beatMs(bpm));
}
/** Existing sustain exercises remain independent of BPM. */
export function requiredDurationMs(step: {holdSeconds:number; figure?:Figure}, bpm: number): number {
  return step.figure ? figureDurationMs(step.figure, bpm) : Math.round(step.holdSeconds * 1000);
}
export function durationLabel(step: {holdSeconds:number; figure?:Figure}, bpm: number): string {
  if (!step.figure) return `${step.holdSeconds.toFixed(1).replace('.', ',')} s`;
  const fig = FIGURES[step.figure];
  return `${fig.label} · ${fig.beats} ${fig.beats===1?'pulso':'pulsos'} · ${(figureDurationMs(step.figure,bpm)/1000).toFixed(2).replace('.',',')} s`;
}
