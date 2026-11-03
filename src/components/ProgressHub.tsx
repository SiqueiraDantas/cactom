import {useId} from 'react';
import type {Lesson} from '../lib/curriculum';
import type {PracticeAttempt} from '../lib/adaptive';
import {isDiscovery,type CourseUnit} from '../lib/courses';
import {HubAction,HubHeading,HubIcon,HubTomScene} from './CactomHub';

type Props={lessons:readonly Lesson[];units:readonly CourseUnit[];completed:readonly Lesson[];next:Lesson;percent:number;noteCount:number;passed:Record<string,string[]>;seen:readonly number[];discoveryTotal:number;discoveryName:string;history:readonly PracticeAttempt[];onLesson:(id:string)=>void};
const reasonLabel=(attempt:PracticeAttempt)=>attempt.reason==='wrong-note'?'Altura da nota':attempt.reason==='out-of-tune'?'Afinação':attempt.reason==='unstable'?'Estabilidade':attempt.reason==='rhythm'?'Ritmo':attempt.reason==='rest'?'Pausa':attempt.reason==='interrupted'?'Continuidade':'Etapa aprovada';

export function ProgressHub({lessons,units,completed,next,percent,noteCount,passed,seen,discoveryTotal,discoveryName,history,onLesson}:Props){
 const id=useId(),done=new Set(completed.map(lesson=>lesson.id));
 const completedUnits=units.filter(unit=>lessons.slice(unit.from,unit.to).every(lesson=>done.has(lesson.id))).length;
 return <div className="practice-hub course-hub progress-hub">
  <HubHeading icon="chart" eyebrow="SEU CAMINHO COM A MÚSICA" title="Seu" accent="progresso." intro="Veja o que você já descobriu e encontre seu próximo passo."/>
  <section className="practice-feature" aria-labelledby={id+'-summary'}>
   <div className="practice-feature-copy"><span className="practice-kicker"><i/>UMA AULA DE CADA VEZ</span><div className="hub-feature-number"><strong>{percent}<small>%</small></strong></div><h2 id={id+'-summary'}>{completed.length?'Você está construindo seu som.':'Sua jornada começa aqui.'}</h2><p className="practice-lesson-description">{completed.length} de {lessons.length} aulas concluídas · {noteCount} notas avaliadas</p><div className="hub-feature-track" role="progressbar" aria-label="Progresso do curso" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><span style={{width:`${percent}%`}}/></div></div>
   <HubTomScene message="Mais um passo!"/>
   <HubAction onClick={()=>onLesson(next.id)}>{completed.length===lessons.length?'Revisitar minha trilha':'Continuar minha trilha'}</HubAction>
  </section>
  <div className="hub-summary-grid"><section className="hub-summary-card cream"><span className="hub-summary-icon"><HubIcon name="book"/></span><span>UNIDADES CONCLUÍDAS</span><b>{completedUnits}<small> de {units.length}</small></b><p>Um conjunto de descobertas a cada etapa.</p></section><section className="hub-summary-card blue"><span className="hub-summary-icon"><HubIcon name="headphones"/></span><span>TENTATIVAS REGISTRADAS</span><b>{history.length}</b><p>Seu histórico recente de prática.</p></section></div>
  <section className="hub-course-history" aria-labelledby={id+'-lessons'}><div className="hub-section-heading"><h2 id={id+'-lessons'}>Seu caminho, aula por aula</h2><span>{lessons.length} aulas</span></div><div className="hub-unit-list">{units.map((unit,unitIndex)=>{
   const list=lessons.slice(unit.from,unit.to),count=list.filter(lesson=>done.has(lesson.id)).length;
   return <details className="hub-progress-unit" key={unit.title} open={list.some(lesson=>lesson.id===next.id)}><summary><span className="hub-unit-number">{String(unitIndex+1).padStart(2,'0')}</span><span className="hub-unit-title"><small>UNIDADE {unitIndex+1}</small><b>{unit.title}</b></span><span className="hub-unit-count" aria-label={`${count} de ${list.length} aulas concluídas`}>{count}/{list.length}</span><HubIcon name="chevron"/></summary><div className="hub-unit-lessons">{list.map((lesson,index)=>{
    const finished=done.has(lesson.id),current=lesson.id===next.id;
    return <button type="button" className={`hub-lesson ${finished?'done':current?'current':''}`} key={lesson.id} onClick={()=>onLesson(lesson.id)} aria-label={`${unit.from+index+1}. ${lesson.title}${finished?', concluída':current?', próxima aula':''}`}><span className="hub-lesson-index">{finished?<HubIcon name="check"/>:String(unit.from+index+1).padStart(2,'0')}</span><span className="hub-lesson-copy"><b>{lesson.title}</b><small>{isDiscovery(lesson)?`${seen.length} de ${discoveryTotal} ${discoveryName} explorados`:`${lesson.steps.filter(step=>(passed[lesson.id]??[]).includes(step.id)).length} de ${lesson.steps.length} etapas concluídas`}</small></span><span className="hub-lesson-action">{finished?'Rever':current?'Continuar':'Praticar'}</span><HubIcon name="arrow"/></button>;
   })}</div></details>;
  })}</div></section>
  <details className="hub-disclosure"><summary><span className="hub-related-icon"><HubIcon name="chart"/></span><span>Suas tentativas recentes<small>{history.length?`${Math.min(history.length,8)} registros mais recentes`:'Seu histórico começa com a primeira prática'}</small></span><HubIcon name="chevron"/></summary><div className="hub-attempt-list">{history.length?history.slice(-8).reverse().map(attempt=><div className={`hub-attempt ${attempt.passed?'passed':''}`} key={attempt.id}><span className="hub-attempt-icon"><HubIcon name={attempt.passed?'check':'music'}/></span><span><b>{attempt.passed?'Etapa conquistada':'Em prática'}</b><small>{reasonLabel(attempt)}</small></span><time dateTime={attempt.at}>{new Date(attempt.at).toLocaleDateString('pt-BR')}</time></div>):<div className="hub-empty-state"><HubIcon name="headphones"/><p>Pratique com seu instrumento para começar seu histórico de tentativas.</p></div>}</div></details>
 </div>;
}
