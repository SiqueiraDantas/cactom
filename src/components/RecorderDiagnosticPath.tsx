import {useState,type CSSProperties} from 'react';
import {DIAGNOSTIC_TASKS,readDiagnostic,type DiagnosticId} from '../lib/recorderDiagnostic';
import {learningPathLayout} from '../lib/learningPath';
import {useProfileStorage} from './ProfileStorage';
import {HubIcon} from './CactomHub';
import './recorder-discipline.css';

/** The diagnostic is the first unit of Aprender, in the same continuous path. */
export function RecorderDiagnosticPath({onOpen}:{onOpen:(id:DiagnosticId|'summary')=>void}){
 const storage=useProfileStorage(),[initial]=useState(()=>readDiagnostic(storage));
 const responses=initial.ledger.responses,answered=DIAGNOSTIC_TASKS.filter(task=>responses[task.id]).length;
 const next=DIAGNOSTIC_TASKS.find(task=>!responses[task.id])??DIAGNOSTIC_TASKS[0];
 const layout=learningPathLayout(DIAGNOSTIC_TASKS.length);
 return <section className="journey-unit journey-unit-0 diagnostic-journey" aria-labelledby="diagnostic-path-title">
  <div className="unit-banner"><div className="unit-number"><HubIcon name="headphones"/></div><div className="unit-banner-copy"><small>ANTES DA PRIMEIRA AULA · SEM NOTA</small><h3 id="diagnostic-path-title">Seu ponto de partida</h3></div><span className="unit-progress" aria-label={`${answered} de 8 atividades do diagnóstico respondidas`}>{answered}/8</span></div>
  <div className="path-nodes" style={{'--track-height':`${layout.height}px`,'--path-step':`${layout.step}px`,'--node-size':`${layout.size}px`} as CSSProperties}>
   <svg className="path-connector" viewBox={`0 0 1000 ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">{layout.segments.map(segment=><path key={segment.index} className={`path-segment ${responses[DIAGNOSTIC_TASKS[segment.index].id]&&(segment.index+1<DIAGNOSTIC_TASKS.length?responses[DIAGNOSTIC_TASKS[segment.index+1].id]:answered===8)?'traversed':''}`} d={segment.d}/>)}</svg>
   {DIAGNOSTIC_TASKS.map((task,index)=>{const responded=!!responses[task.id],active=task.id===next.id;return <div className={`path-item ${active?'current':''}`} id={'diagnostic-'+task.id} key={task.id} style={{'--node-x':`${layout.nodes[index].x}%`} as CSSProperties}>
    {active&&<span className="start-bubble">{answered===8?'REVER':answered?'RETOMAR':'COMEÇAR'}</span>}
    <button className={`lesson-node diagnostic-node ${responded?'answered':active?'available':'upcoming'}`} type="button" data-diagnostic-id={task.id} title={`${task.id} · ${task.title}`} aria-current={active?'step':undefined} aria-label={`Diagnóstico ${task.id}. ${task.title}${responded?', respondida':', sem resposta'}, sem nota`} onClick={()=>onOpen(task.id)}><HubIcon name={responded?'check':task.sound?'headphones':task.id==='D06'?'hand':'music'}/><span className="diagnostic-node-code">{task.id}</span></button>
   </div>;})}
   <div className="unit-finish" role="img" aria-label="Fim do diagnóstico, sem nota"><span><HubIcon name="book"/></span></div>
  </div>
  {answered>0&&<button className="diagnostic-review-link" type="button" onClick={()=>onOpen('summary')}>Ver minhas respostas<HubIcon name="arrow"/></button>}
  {initial.warning&&<p className="recorder-discipline-warning" role="status">{initial.warning}</p>}
 </section>;
}
