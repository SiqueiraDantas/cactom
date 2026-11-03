import { assessScoreEvent } from './scoreAssessment.ts';
import type { ExerciseStep } from './curriculum.ts';
import { beatMs, FIGURES } from './rhythm.ts';

export type TimedPitch = { at: number; frequency: number | null };
export type EventAssessment = {
  stepId: string;
  passed: boolean;
  kind: 'note' | 'rest';
  onsetErrorMs: number | null;
  releaseErrorMs: number | null;
  message: string;
  reason?:'note'|'tuning'|'rhythm'|'rest'|'signal'|'interrupted'|null;
};

/** Offsets in beats for a single 4/4 bar. No fake pitch analysis during rests. */
export function barEvents(steps: readonly ExerciseStep[], bpm: number, startAt: number) {
  let offset = 0;
  return steps.map(step => {
    if (!step.figure) throw new Error('Compasso necessita figura para todas as etapas.');
    const start = startAt + offset * beatMs(bpm);
    offset += FIGURES[step.figure].beats;
    return { step, start, end: startAt + offset * beatMs(bpm), beats: FIGURES[step.figure].beats };
  });
}
export function validBar(steps: readonly ExerciseStep[]): boolean {
  return steps.length > 0 && steps.every(s => !!s.figure) &&
    steps.reduce((sum, s) => sum + (s.figure ? FIGURES[s.figure].beats : 0), 0) === 4;
}

/**
 * Experimental rhythm evaluation. Input timestamps are monotonic ms; they should
 * be corrected for microphone/device latency BEFORE entering this function.
 * Onset/release are estimated from pitch-valid frames (not physical tonguing).
 * A note must begin/end close to the grid and maintain enough valid frames.
 * Rest requires silence in its central window. This is not a clinical breath test.
 */
export function scoreBar(
  steps: readonly ExerciseStep[], samples: readonly TimedPitch[], bpm: number,
  startAt: number, toleranceMs = 240,
): EventAssessment[] {
  if (!validBar(steps)) throw new Error('Este avaliador aceita compassos 4/4 completos.');
  let beat=0;
  return steps.map((step,index)=>{
    const length=FIGURES[step.figure!].beats;
    const event={id:step.id,kind:step.kind==='rest'?'rest' as const:'note' as const,note:step.kind==='rest'?null:step.note,startBeat:beat,beats:length,measureIndex:0,segments:[{cursorIndex:index,startBeat:beat,beats:length}]};
    beat+=length;
    const verdict=assessScoreEvent(event,samples,bpm,startAt,toleranceMs,step.toleranceCents);
    return {stepId:step.id,passed:verdict.passed,kind:event.kind,onsetErrorMs:verdict.onsetErrorMs,releaseErrorMs:verdict.releaseErrorMs,message:verdict.message,reason:verdict.reason};
  });
}
