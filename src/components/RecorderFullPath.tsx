import {useState,type CSSProperties} from 'react';
import {RECORDER_PLAN,COURSE_MODULES,COURSE_TASKS,COURSE_IDS,readCourse} from '../lib/recorderFullCourse';
import {readDiagnostic} from '../lib/recorderDiagnostic';
import {readModuleOne} from '../lib/recorderModuleOne';
import {learningPathLayout} from '../lib/learningPath';
import {useProfileStorage} from './ProfileStorage';
import {RecorderDiagnosticPath} from './RecorderDiagnosticPath';
import {HubIcon} from './CactomHub';
import {TomOfficial} from './CactomBrand';
import type {RecorderSystem} from '../lib/recorder';
import type {DiagnosticId} from '../lib/recorderDiagnostic';
import './recorder-full-course.css';
/** The complete plan belongs to Aprender; this is not a second course or progress migration. */
export function RecorderFullPath({onOpen,system='baroque',onSystem}:{onOpen:(id:string)=>void;system?:RecorderSystem;onSystem?:(system:RecorderSystem)=>void}){
 const storage=useProfileStorage(),[saved]=useState(()=>readCourse(storage)),[m1]=useState(()=>readModuleOne(storage)),[diagnostic]=useState(()=>readDiagnostic(storage));
 const [jump,setJump]=useState('D01'),[filter,setFilter]=useState('');
 const responses={...diagnostic.ledger.responses,...m1.ledger.responses,...saved.ledger.responses};
 const count=COURSE_IDS.filter(id=>responses[id as keyof typeof responses]).length;
 const layout=learningPathLayout(5);
 const options=[...RECORDER_PLAN.diagnostic.map(t=>({id:t.id,task:t.task})),...COURSE_TASKS];
 const filtered=options.filter(t=>`${t.id} ${t.task}`.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR')));
 return <>
  <section className="full-path-overview" aria-labelledby="full-path-title"><TomOfficial decorative expression="animado" className="full-path-tom"/><span className="activity-eyebrow">PERCURSO COMPLETO · FLAUTA DOCE SOPRANO</span><h2 id="full-path-title">Do primeiro som à sua própria música.</h2><p>16 módulos · 80 microlições · 260 atividades abertas para experimentar.</p><div className="full-path-count"><strong>{count}/260</strong><span>atividades com registro · sem nota automática</span></div><div className="full-path-meter"><span style={{width:`${count/260*100}%`}}/></div>
   <label className="full-path-system">Dedilhado da sua flauta<select value={system} onChange={e=>onSystem?.(e.target.value as RecorderSystem)}><option value="baroque">Barroco</option><option value="german">Germânico</option></select></label><details className="full-path-jump"><summary>Ir direto para uma atividade</summary><label>Buscar por código ou assunto<input type="search" value={filter} onChange={e=>{const text=e.target.value;setFilter(text);const first=options.find(t=>`${t.id} ${t.task}`.toLocaleLowerCase('pt-BR').includes(text.toLocaleLowerCase('pt-BR')));if(first)setJump(first.id);}} placeholder="Ex.: M10, B2.2, pausa"/></label><label>Atividade<select value={jump} onChange={e=>setJump(e.target.value)}>{filtered.map(t=><option key={t.id} value={t.id}>{t.id} · {t.task}</option>)}</select></label><button className="activity-secondary" type="button" disabled={!filtered.some(t=>t.id===jump)} onClick={()=>onOpen(jump)}>Abrir atividade<HubIcon name="arrow"/></button><p>{filtered.length} resultados</p></details>
  </section>
  <details className="full-path-diagnostic"><summary>Diagnóstico inicial · {Object.keys(diagnostic.ledger.responses).length}/8 registros</summary><RecorderDiagnosticPath onOpen={(id:DiagnosticId|'summary')=>onOpen(id)}/></details>
  {RECORDER_PLAN.sections.map(section=><section className="full-path-section" key={section.id} aria-labelledby={'full-section-'+section.id}><header><span>{section.level}</span><h2 id={'full-section-'+section.id}>{section.title}</h2><small>60 atividades + 3 avaliações</small></header>
   {COURSE_MODULES.filter(module=>module.section===section.number).map(module=>{
    const tasks=COURSE_TASKS.filter(t=>!t.assessment&&t.module===module.number),records=tasks.filter(t=>responses[t.id as keyof typeof responses]).length;
    return <details className="full-path-module" key={module.id} open={module.number===1?true:undefined}><summary><span className="full-path-module-number">{String(module.number).padStart(2,'0')}</span><span><small>MÓDULO {module.number}</small><strong>{module.title}</strong></span><b>{records}/15</b></summary><p className="full-path-goal">{module.goal}</p>
     <div className="path-nodes" style={{'--track-height':`${layout.height}px`,'--path-step':`${layout.step}px`,'--node-size':`${layout.size}px`} as CSSProperties}>
      <svg className="path-connector" viewBox={`0 0 1000 ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">{layout.segments.map(segment=><path key={segment.index} className="path-segment" d={segment.d}/>)}</svg>
      {module.microLessons.map((lesson,index)=>{
       const own=tasks.filter(t=>t.lesson===lesson.id),registered=own.filter(t=>responses[t.id as keyof typeof responses]).length;
       return <div key={lesson.id} className="path-item" id={`lesson-${lesson.id}`} style={{'--node-x':`${layout.nodes[index].x}%`} as CSSProperties}>
        <button type="button" className={`lesson-node full-course-node ${registered===3?'recorded':'available'}`} data-curriculum-lesson={lesson.id} data-module-one-lesson={module.number===1?lesson.id:undefined} onClick={()=>onOpen(own.find(t=>!responses[t.id as keyof typeof responses])?.id??own[0].id)} title={`${lesson.id} · ${lesson.name}`} aria-label={`Módulo ${module.number}. ${lesson.name}. ${registered} de 3 registros`}><HubIcon name={index===1?'headphones':index===3?'music':index===4?'book':'music'}/><span>{index+1}</span></button><span className="full-path-lesson-label">{lesson.name}</span>
       </div>;
      })}
      <div className="unit-finish" role="img" aria-label={`Fim do Módulo ${module.number}`}><span><HubIcon name="music"/></span></div>
     </div>
     <details className="full-path-task-list"><summary>Ver as 15 atividades deste módulo</summary>{tasks.map(t=><button key={t.id} type="button" data-curriculum-id={t.id} onClick={()=>onOpen(t.id)}><span>{t.id}</span><strong>{t.task}</strong>{responses[t.id as keyof typeof responses]&&<HubIcon name="check"/>}</button>)}</details>
    </details>;
   })}
   <div className="full-path-assessments"><h3>Colocando em prática · {section.level}</h3>{section.assessments.map(a=><button type="button" key={a.id} data-curriculum-id={a.id} onClick={()=>onOpen(a.id)}><span>{a.id}</span><strong>{a.title}</strong><small>{a.task}</small>{responses[a.id as keyof typeof responses]&&<HubIcon name="check"/>}</button>)}</div>
  </section>)}
  {[saved.warning,m1.warning,diagnostic.warning].filter(Boolean).map((warning,i)=><p className="recorder-discipline-warning" role="status" key={i}>{warning}</p>)}
 </>;
}
