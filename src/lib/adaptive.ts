import { BEGINNER_NOTES } from './music.ts';
import { RECORDER_NOTES, recorderNote, type RecorderSystem } from './recorder.ts';
import { availableInstrument } from './instruments.ts';
import type { Lesson } from './curriculum.ts';

export type Difficulty='acolhedor'|'padrao'|'desafio';
export type DifficultyReason='wrong-note'|'out-of-tune'|'unstable'|'interrupted'|'rhythm'|'rest';
export type PracticeAttempt={
  id:string;at:string;instrumentId:string;lessonId:string;stepId:string;writtenMidi:number;
  passed:boolean;reason:DifficultyReason|null;durationMs:number;
  task?:'sound'|'rhythm'|'rest';
};
export type Recommendation={instrumentId?:string;noteMidi:number;focus:DifficultyReason|'review';level:Difficulty;title:string;description:string;evidence:string};
export const HISTORY_LIMIT=500;
export function validAttempt(value:unknown):value is PracticeAttempt{
  if(!value||typeof value!=='object')return false;
  const a=value as Partial<PracticeAttempt>,profile=availableInstrument(a.instrumentId);
  return typeof a.id==='string'&&typeof a.at==='string'&&Number.isFinite(Date.parse(a.at))&&typeof a.lessonId==='string'&&typeof a.stepId==='string'&&!!profile&&typeof a.passed==='boolean'&&Number.isInteger(a.writtenMidi)&&a.writtenMidi!>=profile.writtenRange[0]&&a.writtenMidi!<=profile.writtenRange[1]&&Number.isFinite(a.durationMs)&&a.durationMs!>=0&&(a.reason===null||['wrong-note','out-of-tune','unstable','interrupted','rhythm','rest'].includes(a.reason??''));
}
export function appendAttempt(previous:readonly PracticeAttempt[],attempt:PracticeAttempt):PracticeAttempt[]{
  if(!validAttempt(attempt)||previous.some(a=>a.id===attempt.id))return [...previous];
  return [...previous,attempt].slice(-HISTORY_LIMIT);
}
export function difficultyFor(history:readonly PracticeAttempt[],instrumentId='trumpet-bb'):Difficulty{
  const recent=history.filter(a=>a.instrumentId===instrumentId).slice(-8);
  if(recent.length<3)return 'padrao';
  const wins=recent.filter(a=>a.passed).length/recent.length;
  if(wins<.5)return 'acolhedor';
  return recent.length>=6&&wins>=.85?'desafio':'padrao';
}
export function recommendPractice(history:readonly PracticeAttempt[],now=Date.now(),instrumentId='trumpet-bb'):Recommendation|null{
  const notes=instrumentId==='recorder-soprano'?RECORDER_NOTES:BEGINNER_NOTES;
  const recent=history.filter(validAttempt).filter(a=>a.instrumentId===instrumentId).slice(-40);
  if(!recent.length)return null;
  const level=difficultyFor(recent,instrumentId);
  const groups=new Map<string,{noteMidi:number;focus:DifficultyReason;count:number}>();
  for(const [index,a] of recent.entries()){
    if(a.passed||!a.reason||!notes.some(n=>n.writtenMidi===a.writtenMidi))continue;
    // A later successful attempt resolves this error for recommendation purposes.
    if(recent.slice(index+1).some(later=>later.passed&&later.writtenMidi===a.writtenMidi&&(a.reason==='rhythm'?later.task==='rhythm':a.reason==='rest'?later.task==='rest':later.task!=='rest')))continue;
    const key=`${a.writtenMidi}:${a.reason}`,group=groups.get(key)??{noteMidi:a.writtenMidi,focus:a.reason!,count:0};group.count++;groups.set(key,group);
  }
  const most=[...groups.values()].sort((a,b)=>b.count-a.count)[0];
  if(most&&most.count>=2){
    const label=notes.find(n=>n.writtenMidi===most.noteMidi)!.label;
    const actions:Record<DifficultyReason,string>={
      'wrong-note':'reconhecer a altura da nota','out-of-tune':'aproximar a afinação do centro','unstable':'manter a altura mais regular',
      interrupted:'sustentar um som contínuo',rhythm:'acompanhar o pulso com calma',rest:'dar espaço para o silêncio',
    };
    return {instrumentId,noteMidi:most.noteMidi,focus:most.focus,level,title:`Vamos cuidar do ${label}?`,description:`Um treino curto para ${actions[most.focus]}.`,evidence:`${most.count} tentativas recentes com essa dificuldade, ainda sem um acerto posterior nessa nota.`};
  }
  const successes=recent.filter(a=>a.passed&&notes.some(n=>n.writtenMidi===a.writtenMidi));
  const byNote=new Map<number,PracticeAttempt>();
  successes.forEach(a=>byNote.set(a.writtenMidi,a));
  const due=[...byNote.values()].filter(a=>now-Date.parse(a.at)>=86400000).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at))[0];
  const note=due??successes[successes.length-1];
  if(!note)return null;
  return {instrumentId,noteMidi:note.writtenMidi,focus:'review',level,title:due?'Uma nota para reencontrar':'Seu próximo pequeno desafio',description:due?'Revisite uma nota que você já conquistou.':'Reforce o que acabou de aprender com uma sequência curta.',evidence:due?'Revisão sugerida após pelo menos um dia desde o último acerto desta nota.':'Sugestão baseada no seu último acerto e nas oito tentativas mais recentes.'};
}
export function reinforcementLesson(rec:Recommendation,system:RecorderSystem='baroque'):Lesson{
  const notes=rec.instrumentId==='recorder-soprano'?RECORDER_NOTES.map(n=>recorderNote(n.writtenMidi,system)):BEGINNER_NOTES;
  const note=notes.find(n=>n.writtenMidi===rec.noteMidi)??notes[0];
  const rhythmic=rec.focus==='rhythm'||rec.focus==='rest';
  const [seconds,tolerance,stability]=rec.level==='acolhedor'?[1.2,50,35]:rec.level==='desafio'?[2.5,35,25]:[2,45,30];
  const id=`${rec.instrumentId==='recorder-soprano'?'recorder-':''}reforco-v07-${note.writtenMidi}-${rec.focus}-${rec.level}`;
  const step=(index:number)=>({id:`${id}-${index}`,note,holdSeconds:seconds,toleranceCents:tolerance,stabilityLimitCents:stability,instruction:`Toque ${note.label} com calma. Faça uma pausa antes da próxima tentativa.`});
  const steps=rhythmic?[
    {...step(0),figure:'half' as const},
    {...step(1),figure:'quarter' as const,kind:'rest' as const,instruction:'Fique em silêncio neste pulso.'},
    {...step(2),figure:'quarter' as const},
  ]:[step(0),step(1),step(2)];
  return {id,title:'Reforço: '+note.label,summary:rec.description,goal:rec.description,
    concept:`Treino personalizado por regras verificáveis. ${rec.evidence} Etapa: ${rec.level}. Nota e oitava corretas continuam obrigatórias.`,
    teacherTip:'Descanse entre as tentativas. Se sentir desconforto, pare e procure orientação presencial.',
    category:'som',steps,...(rhythmic?{rhythmMode:'metered' as const,defaultBpm:60}:{})};
}
