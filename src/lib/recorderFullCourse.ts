import {formatWrittenNote,targetFrequencyFor,type PracticeNote} from './music.ts';
import type {ScoreSample} from './scoreAssessment.ts';
import type {ScoreEvent} from './musicxml.ts';

/** Figuras, compassos e correção pelo microfone usados pelas trilhas (flauta, trompete, clarinete, iniciação). */
export type CourseNote={midi:number|null;beats:number;tie?:boolean;/** volume relativo (1 = normal): dinâmica forte/piano */vol?:number};
export type CourseMeter='2/4'|'3/4'|'4/4'|'6/8';
export function barBeats(meter:CourseMeter){const [n,d]=meter.split('/').map(Number);return n*4/d;}
export function pulseBeats(meter:CourseMeter){return meter==='6/8'?1.5:1;}
export function courseNote(midi:number):PracticeNote{return {id:'full-recorder-'+midi,writtenMidi:midi,label:({70:'Si♭ 4',66:'Fá♯ 4',73:'Dó♯ 5',75:'Mi♭ 5',78:'Fá♯ 5'} as Record<number,string>)[midi]??formatWrittenNote(midi),valves:[],valveDescription:'',transposeSemitones:12};}
export function validatePhrase(notes:readonly CourseNote[],meter:CourseMeter,pool?:readonly number[]):boolean{
 if(!notes.length||notes.length>128)return false;let at=0;const bar=barBeats(meter);
 for(const n of notes){if(!n||typeof n!=='object'||![.5,1,1.5,2,3,4].includes(n.beats)||n.midi!==null&&(!Number.isInteger(n.midi)||n.midi<60||n.midi>81||pool&&!pool.includes(n.midi))||at%bar+n.beats>bar+1e-6)return false;at+=n.beats;}
 return at>0&&Math.abs(at%bar)<1e-6;
}
export function courseScoreEvents(notes:readonly CourseNote[],meter:CourseMeter):ScoreEvent[]{
 const events:ScoreEvent[]=[];let beat=0;
 for(let index=0;index<notes.length;index++){
  const n=notes[index],start=beat;let length=n.beats;
  while(notes[index]?.tie&&notes[index+1]?.midi===n.midi){index++;length+=notes[index].beats;}
  events.push({id:'event-'+events.length,kind:n.midi===null?'rest':'note',note:n.midi===null?null:courseNote(n.midi),startBeat:start,beats:length,measureIndex:Math.floor(start/barBeats(meter)),segments:[{cursorIndex:events.length,startBeat:start,beats:length}]});beat+=length;
 }
 return events;
}
/**
 * Correção pelo microfone, pensada para criança estudando sozinha: confere a NOTA (±50 cents) no miolo
 * de cada figura e o SILÊNCIO nas pausas. Entrar um tiquinho atrasado, soltar um pouco antes ou ter um
 * quadro de ar no meio não reprova. Sem sinal nenhum, nada é aprovado.
 */
/** `transpose`: semitons entre a nota escrita e o som (flauta +12; trompete e clarinete em Si♭ −2). */
export function evaluateCourse(notes:readonly CourseNote[],meter:CourseMeter,samples:readonly ScoreSample[],bpm:number,startAt:number,transpose=12){
 const quarter=60000/(bpm*pulseBeats(meter));
 // O microfone e a criança chegam um tiquinho depois do clique: a janela da nota anda junto (atraso),
 // e notas curtas (colcheia) só precisam de um trechinho afinado, não do tempo inteiro.
 const LAG=120,EARLY=100,SAMPLE=90;
 const finite=(s:ScoreSample)=>Number.isFinite(s.at);
 return courseScoreEvents(notes,meter).map(e=>{
  const start=startAt+e.startBeat*quarter,end=start+e.beats*quarter,len=end-start;
  const verdict=(passed:boolean,reason:'signal'|'rest'|'note'|'tuning'|null,message:string)=>({eventId:e.id,measureIndex:e.measureIndex,passed,reason,message,onsetErrorMs:null,releaseErrorMs:null});
  if(e.kind==='rest'){
   const pad=Math.min(300,len*.3),inner=samples.filter(s=>finite(s)&&s.at>=start+pad+LAG*.5&&s.at<=end-Math.min(150,len*.15));
   if(inner.length<2&&len>=600)return verdict(false,'signal','O microfone não ouviu esse trecho. Toque mais perto dele.');
   if(!inner.length)return samples.some(s=>finite(s)&&s.at>=start&&s.at<=end)?verdict(true,null,'Pausa respeitada.'):verdict(false,'signal','O microfone não ouviu esse trecho.');
   const quiet=inner.filter(s=>s.frequency===null).length/inner.length;
   return quiet>=.6?verdict(true,null,'Pausa respeitada.'):verdict(false,'rest','Na pausa, pare o ar.');
  }
  const pad=Math.min(250,len*.2),inner=samples.filter(s=>finite(s)&&s.at>=start+pad-EARLY&&s.at<=end+LAG);
  if(!samples.some(s=>finite(s)&&s.at>=start&&s.at<=end))return verdict(false,'signal','O microfone não ouviu esse trecho. Toque mais perto dele.');
  const target=targetFrequencyFor({...e.note!,transposeSemitones:transpose}),off=(s:ScoreSample)=>s.frequency!==null&&Number.isFinite(s.frequency)&&s.frequency>0?Math.abs(1200*Math.log2(s.frequency/target)):Infinity;
  const tuned=inner.filter(s=>off(s)<=50).length,needed=Math.max(2,Math.round(len*.4/SAMPLE));
  if(tuned>=Math.min(needed,Math.max(2,Math.round(inner.length*.55))))return verdict(true,null,'Nota certa.');
  // Qual nota saiu? (mediana dos quadros com som) — ajuda a criança a saber o que corrigir.
  const heard=inner.flatMap(s=>s.frequency!==null&&Number.isFinite(s.frequency)&&s.frequency>0?[s.frequency]:[]).sort((x,y)=>x-y);
  const got=heard.length>=2?Math.round(69+12*Math.log2(heard[Math.floor(heard.length/2)]/440))-transpose:null;
  const want=e.note!.writtenMidi;
  const wrong=got!==null&&got!==want?{midi:got,name:formatWrittenNote(got).replace(/ \d$/,''),dir:got>want?'agudo':'grave'}:null;
  if(wrong)return {...verdict(false,'note',`Saiu ${wrong.name} em vez de ${e.note!.label.replace(/ \d$/,'')}. ${wrong.dir==='agudo'?'Som mais agudo que o pedido: algum furo tá deixando o ar escapar. Confira se cada furo do dedilhado tá bem fechado.':'Som mais grave que o pedido: confira se não fechou furo a mais e sopre um tiquinho mais firme.'}`),heardMidi:wrong.midi};
  return inner.some(s=>off(s)<=110)?verdict(false,'tuning','Quase: confira se os furos estão bem fechados e sopre mais leve.'):verdict(false,'note',`Estamos procurando ${e.note!.label}.`);
 });
}
