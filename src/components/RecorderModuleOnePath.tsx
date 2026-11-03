import {useState,type CSSProperties} from 'react';
import {MODULE_ONE_LESSONS,MODULE_ONE_TASKS,readModuleOne,type ModuleOneLessonId} from '../lib/recorderModuleOne';
import {learningPathLayout} from '../lib/learningPath';
import {useProfileStorage} from './ProfileStorage';
import {HubIcon} from './CactomHub';
import './recorder-module-one.css';

export function RecorderModuleOnePath({onOpen}:{onOpen:(id:ModuleOneLessonId)=>void}){
 const storage=useProfileStorage(),[saved]=useState(()=>readModuleOne(storage));
 const responses=saved.ledger.responses,layout=learningPathLayout(5);
 const records=MODULE_ONE_TASKS.filter(task=>responses[task.id]).length;
 const next=MODULE_ONE_LESSONS.find(lesson=>MODULE_ONE_TASKS.some(task=>task.id.startsWith(lesson.id+'-')&&responses[task.id]?.report!=='pratiquei'))??MODULE_ONE_LESSONS[0];
 return <section className="journey-unit journey-unit-1 module-one-journey" aria-labelledby="module-one-path-title">
  <div className="unit-banner"><div className="unit-number">01</div><div className="unit-banner-copy"><small>MÓDULO 1 · PRIMEIROS PASSOS</small><h3 id="module-one-path-title">Sua flauta, seu primeiro som</h3></div><span className="unit-progress" aria-label={`${records} de 15 atividades com registro`}>{records}/15</span></div>
  <div className="path-nodes" style={{'--track-height':`${layout.height}px`,'--path-step':`${layout.step}px`,'--node-size':`${layout.size}px`} as CSSProperties}>
   <svg className="path-connector" viewBox={`0 0 1000 ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">{layout.segments.map(segment=><path key={segment.index} className="path-segment" d={segment.d}/>)}</svg>
   {MODULE_ONE_LESSONS.map((lesson,index)=>{
    const tasks=MODULE_ONE_TASKS.filter(task=>task.id.startsWith(lesson.id+'-')),recorded=tasks.filter(task=>responses[task.id]).length,practiced=tasks.filter(task=>responses[task.id]?.report==='pratiquei').length;
    const active=next.id===lesson.id;
    return <div className={`path-item ${active?'current':''}`} id={`lesson-${lesson.id}`} key={lesson.id} style={{'--node-x':`${layout.nodes[index].x}%`} as CSSProperties}>
     {active&&<span className="start-bubble">{records?'RETOMAR':'COMEÇAR'}</span>}
     <button className={`lesson-node module-one-node ${practiced===3?'recorded':recorded?'revisit':active?'available':'upcoming'}`} type="button" data-module-one-lesson={lesson.id} title={`${lesson.name} · ${lesson.title}`} aria-current={active?'step':undefined} aria-label={`Módulo 1. ${lesson.name}. ${lesson.title}. ${recorded} de 3 registros, sem nota`} onClick={()=>onOpen(lesson.id)}><HubIcon name={index===0?'hand':index===1?'headphones':index===3?'music':index===4?'book':'music'}/><span>{lesson.name}</span></button>
    </div>;
   })}
   <div className="unit-finish" role="img" aria-label="Fim do Módulo 1"><span><HubIcon name="music"/></span></div>
  </div>
  {saved.warning&&<p className="recorder-discipline-warning" role="status">{saved.warning}</p>}
 </section>;
}
