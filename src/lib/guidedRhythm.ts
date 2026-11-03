import {barEvents,validBar,type EventAssessment,type TimedPitch} from './pulseAssessment.ts';
import {centsBetween,targetFrequencyFor} from './music.ts';
import {beatMs} from './rhythm.ts';
import type {ExerciseStep} from './curriculum.ts';
import type {PitchSample,SignalSnapshot} from './audio.ts';

export const RECORDER_RHYTHM_TOLERANCE_CENTS=60;

export type RecorderRhythmSample=TimedPitch&{input:'tone'|'quiet'|'noise'|'missing'};
/** Allow room noise below a measured floor, never turn an unavailable mic into silence. */
export function recorderQuietThreshold(readings:readonly number[],minimumRms:number):number{
 const valid=readings.filter(n=>Number.isFinite(n)&&n>=0).sort((a,b)=>a-b);
 if(valid.length<4)throw new Error('Não foi possível medir o microfone. Confira a entrada e tente novamente.');
 const floor=valid[Math.floor((valid.length-1)*.75)];
 return Math.max(minimumRms,floor*2.5,floor+.002);
}
/** A note needs a clear tone, not merely energy or the unpitched sentinel 0.
 * Broad input band here; target-note tolerance is applied by scoreSoundBar.
 */
export function recorderRhythmSample(sample:PitchSample,signal:SignalSnapshot,at:number,quietThreshold:number):RecorderRhythmSample{
 if(signal.status==='inactive'||!Number.isFinite(signal.rms)||signal.rms<0||!Number.isFinite(quietThreshold)||quietThreshold<=0){
  return {at,frequency:null,input:'missing'};
 }
 if(signal.rms<quietThreshold)return {at,frequency:null,input:'quiet'};
 const tone=signal.status==='pitched'&&sample!==null&&Number.isFinite(sample.frequency)&&sample.frequency>=450&&sample.frequency<=1400&&Number.isFinite(sample.clarity)&&sample.clarity>=.85&&Number.isFinite(sample.rms)&&sample.rms>=quietThreshold;
 return tone?{at,frequency:sample.frequency,input:'tone'}:{at,frequency:0,input:'noise'};
}

/** Ignore the short click + analyser window after each known metronome beat.
 * Unknown/missing input outside those windows never counts as played sound or silence.
 */
export function recorderClickWindow(at:number,startAt:number,bpm:number):boolean{
 const beat=beatMs(bpm),elapsed=at-startAt;
 return elapsed>=0&&elapsed%beat<180;
}
/** Follow the score with a bounded pitch tolerance, preserving written octave. */
export function scoreSoundBar(steps:readonly ExerciseStep[],samples:readonly RecorderRhythmSample[],bpm:number,startAt:number):EventAssessment[]{
 if(!validBar(steps))throw new Error('É necessário um compasso completo de quatro tempos.');
 return barEvents(steps,bpm,startAt).map(({step,start,end})=>{
  const rest=step.kind==='rest',margin=Math.min(120,(end-start)*.12);
  let expected=0,matched=0,tonalFrames=0,wrongNoteFrames=0;
  const target=rest?null:targetFrequencyFor(step.note);
  const used=new Set<RecorderRhythmSample>();
  for(let at=start+margin;at<end-margin;at+=90){
   if(recorderClickWindow(at,startAt,bpm))continue;
   expected++;
   const frame=samples.reduce<RecorderRhythmSample|null>((best,s)=>!used.has(s)&&Number.isFinite(s.at)&&s.at>=start&&s.at<end&&!recorderClickWindow(s.at,startAt,bpm)&&Math.abs(s.at-at)<=100&&(!best||Math.abs(s.at-at)<Math.abs(best.at-at))?s:best,null);
   if(!frame)continue;
   used.add(frame);
   if(rest){
    if(frame.input==='quiet')matched++;
   }else if(frame.input==='tone'&&typeof frame.frequency==='number'&&Number.isFinite(frame.frequency)&&frame.frequency>0){
    tonalFrames++;
    const cents=Math.abs(centsBetween(frame.frequency,target!));
    if(cents<=RECORDER_RHYTHM_TOLERANCE_CENTS+1e-8)matched++;
    else if(cents>=100)wrongNoteFrames++;
   }
  }
  const passed=expected>0&&matched>=(rest?1:3)&&matched/expected>=(rest?.8:.65);
  const enoughTone=expected>0&&tonalFrames>=3&&tonalFrames/expected>=.65;
  const reason=passed?null:rest?'rest':enoughTone?(wrongNoteFrames>0?'note':'tuning'):'signal';
  const message=passed?(rest?'Pausa respeitada no tempo indicado.':`${step.note.label} reconhecido nos tempos indicados.`):rest?'Faça silêncio durante o tempo da pausa.':reason==='note'?`Toque ${step.note.label}, como está na partitura. Outra nota ou oitava não vale como acerto.`:reason==='tuning'?`Aproxime a afinação de ${step.note.label} e mantenha o som.`:`Toque e mantenha ${step.note.label} nos tempos indicados. Ruído e cliques não valem como nota.`;
  return {stepId:step.id,passed,kind:rest?'rest':'note',onsetErrorMs:null,releaseErrorMs:null,reason,message};
 });
}
