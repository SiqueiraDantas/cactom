import { targetFrequencyFor } from './music.ts';
import type { ParsedScore, ScoreEvent } from './musicxml.ts';
import { beatMs } from './rhythm.ts';
export type ScoreSample={at:number;frequency:number|null};
export type ScoreVerdict={eventId:string;measureIndex:number;passed:boolean;reason:'note'|'tuning'|'rhythm'|'rest'|'signal'|'interrupted'|null;onsetErrorMs:number|null;releaseErrorMs:number|null;message:string};
const FRAME=90,MAX_GAP=240;
function cents(hz:number,target:number):number{return 1200*Math.log2(hz/target);}
export function assessScoreEvent(event:ScoreEvent,samples:readonly ScoreSample[],bpm:number,startAt:number,toleranceMs=240,toleranceCents=45):ScoreVerdict{
  const pulse=beatMs(bpm),start=startAt+event.startBeat*pulse,end=start+event.beats*pulse;
  const finish=(passed:boolean,reason:ScoreVerdict['reason'],message:string,onsetErrorMs:number|null=null,releaseErrorMs:number|null=null):ScoreVerdict=>({eventId:event.id,measureIndex:event.measureIndex,passed,reason,message,onsetErrorMs,releaseErrorMs});
  const ordered=samples.filter(s=>Number.isFinite(s.at)&&s.at>=start-toleranceMs-FRAME&&s.at<=end+toleranceMs+FRAME).sort((a,b)=>a.at-b.at).filter((s,i,a)=>i===0||s.at!==a[i-1].at);
  const margin=Math.min(100,(end-start)*.16),inner=ordered.filter(s=>s.at>=start+margin&&s.at<end-margin);
  if(inner.length<2||inner.some((s,i)=>i>0&&s.at-inner[i-1].at>MAX_GAP)||!inner.length||inner[0].at>start+margin+MAX_GAP||inner[inner.length-1].at<end-margin-MAX_GAP)return finish(false,'signal','O sinal foi insuficiente. Repita o trecho com o microfone ativo.');
  if(event.kind==='rest'){
    const quiet=inner.filter(s=>s.frequency===null).length/inner.length;
    return quiet>=.9?finish(true,null,'Pausa respeitada.'):finish(false,'rest','Deixe o silêncio acontecer durante toda a pausa.');
  }
  if(!event.note)return finish(false,'note','A nota-alvo não foi definida.');
  const target=targetFrequencyFor(event.note);
  const inTune=(s:ScoreSample)=>s.frequency!==null&&Number.isFinite(s.frequency)&&s.frequency>0&&Math.abs(cents(s.frequency,target))<=toleranceCents;
  const matching=inner.filter(inTune);
  if(matching.length<2){
    const plausible=inner.some(s=>s.frequency!==null&&s.frequency>0&&Math.abs(cents(s.frequency,target))<=100);
    return finish(false,plausible?'tuning':'note',plausible?'Aproxime a afinação do centro.':`Estamos procurando ${event.note.label}, na oitava indicada.`);
  }
  const center=matching[Math.floor(matching.length/2)];
  let from=ordered.indexOf(center),to=from;
  // Follow the entire contiguous sounding run, including before/after the event.
  while(from>0&&inTune(ordered[from-1])&&ordered[from].at-ordered[from-1].at<=MAX_GAP)from--;
  while(to<ordered.length-1&&inTune(ordered[to+1])&&ordered[to+1].at-ordered[to].at<=MAX_GAP)to++;
  const onset=Math.round(ordered[from].at-start),release=Math.round(ordered[to].at+FRAME-end);
  const before=ordered[from-1],after=ordered[to+1];
  // A run touching the sampled boundaries cannot prove its attack/release.
  if(!before||!after||inTune(before)||inTune(after))return finish(false,'rhythm','Separe as notas e respeite o começo e o fim de cada figura.',onset,release);
  if(Math.abs(onset)>toleranceMs||Math.abs(release)>toleranceMs)return finish(false,'rhythm',onset>toleranceMs?'Entre junto com o pulso.':release>toleranceMs?'Solte o som ao final da figura.':'Respeite a duração da figura.',onset,release);
  const run=inner.filter(s=>s.at>=ordered[from].at&&s.at<=ordered[to].at);
  if(matching.length/inner.length<.72||run.some(s=>!inTune(s)))return finish(false,'interrupted','O som foi interrompido. Repita mantendo a nota contínua.',onset,release);
  return finish(true,null,'Nota, duração e entrada próximas ao pulso.',onset,release);
}
export function assessScore(score:ParsedScore,samples:readonly ScoreSample[],bpm:number,startAt:number):ScoreVerdict[]{
  return score.events.map(e=>assessScoreEvent(e,samples,bpm,startAt));
}
export function activeScoreEvent(score:ParsedScore,elapsedBeats:number):number{
  return score.events.findIndex(e=>elapsedBeats>=e.startBeat&&elapsedBeats<e.startBeat+e.beats);
}
