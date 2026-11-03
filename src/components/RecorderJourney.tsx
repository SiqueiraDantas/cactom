import {Fragment,useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {RECORDER_PLAN,COURSE_TASKS,readCourse} from '../lib/recorderFullCourse';
import {readDiagnostic} from '../lib/recorderDiagnostic';
import {readModuleOne} from '../lib/recorderModuleOne';
import {JOURNEY_UNITS,SECTION_MILESTONES,readJourney,stopState,currentStop,dueReviews,type JourneyStop,type StopStatus,type LegacyResponse} from '../lib/recorderJourney';
import {lessonExercises} from '../lib/recorderExercises';
import {useProfileStorage} from './ProfileStorage';
import {RecorderDiagnosticPath} from './RecorderDiagnosticPath';
import {TomOfficial} from './CactomBrand';
import type {RecorderSystem} from '../lib/recorder';
import type {DiagnosticId} from '../lib/recorderDiagnostic';
import './recorder-journey.css';

export type JourneyOpen={stopId:string;lessonId?:string;review?:boolean};
const X=[50,27,50,73],TOP=104,STEP=120;
const STATUS_TEXT:Record<StopStatus,string>={'disponivel':'disponível','em-andamento':'em andamento','concluida':'concluída','revisao':'revisão recomendada'};
const LESSON_NAMES=new Map(COURSE_TASKS.map(t=>[t.lesson,t.lessonName]));
function StopIcon({kind,status}:{kind:JourneyStop['kind'];status:StopStatus}){
 const p={fill:'none',stroke:'currentColor',strokeWidth:2.6,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
 if(status==='concluida')return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} strokeWidth={3.4} d="m5 12.5 4.2 4.2L19 7"/></svg>;
 if(status==='revisao')return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5"/></svg>;
 switch(kind){
  case 'descoberta':return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect {...p} x="3" y="13" width="5" height="7" rx="2"/><rect {...p} x="16" y="13" width="5" height="7" rx="2"/></svg>;
  case 'pratica':return <svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(32 12 12)"><path {...p} d="M10 2.5h4l-.4 3.5h-3.2z"/><path {...p} d="M10.4 6h3.2v12.5l1.2 3h-5.6l1.2-3z"/><circle cx="12" cy="9.5" r="1" fill="currentColor"/><circle cx="12" cy="12.6" r="1" fill="currentColor"/><circle cx="12" cy="15.7" r="1" fill="currentColor"/></g></svg>;
  case 'criacao':return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M9 18V6l10-2v12"/><ellipse {...p} cx="6.5" cy="18" rx="2.5" ry="2"/><ellipse {...p} cx="16.5" cy="16" rx="2.5" ry="2"/></svg>;
  default:return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M5 21V4m0 0h11l-2 4 2 4H5"/></svg>;
 }
}

export function RecorderJourney({onLesson,onTask,system='baroque',onSystem}:{onLesson:(open:JourneyOpen)=>void;onTask:(id:string)=>void;system?:RecorderSystem;onSystem?:(s:RecorderSystem)=>void}){
 const storage=useProfileStorage();
 const [data]=useState(()=>{const journey=readJourney(storage),full=readCourse(storage),m1=readModuleOne(storage),diagnostic=readDiagnostic(storage);
  const legacy:Record<string,LegacyResponse|undefined>={...diagnostic.ledger.responses,...m1.ledger.responses,...full.ledger.responses};
  return {journey,legacy,diagnostic,warnings:[journey.warning,full.warning,m1.warning,diagnostic.warning].filter(Boolean)};});
 const {journey:{ledger},legacy}=data;
 const current=useMemo(()=>currentStop(ledger,legacy),[ledger,legacy]);
 const reviews=useMemo(()=>dueReviews(ledger,legacy),[ledger,legacy]);
 const [open,setOpen]=useState<string|null>(null);
 const [filter,setFilter]=useState(''),[jump,setJump]=useState('D01');
 const currentRef=useRef<HTMLButtonElement>(null),[farAway,setFarAway]=useState(false);
 const states=useMemo(()=>new Map(JOURNEY_UNITS.flatMap(u=>u.stops).map(s=>[s.id,stopState(s,ledger,legacy)])),[ledger,legacy]);
 const completed=[...states.values()].filter(s=>s.status==='concluida'||s.status==='revisao').length;
 const curState=states.get(current.id)!;
 // Volta automaticamente ao ponto estudado.
 useLayoutEffect(()=>{const node=currentRef.current;if(!node)return;const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;const top=node.getBoundingClientRect().top+window.scrollY-window.innerHeight*.45;if(current.index>0&&top>200)window.scrollTo({top,behavior:reduce?'auto':'auto'});},[]);
 useEffect(()=>{const node=currentRef.current;if(!node||typeof IntersectionObserver==='undefined')return;const io=new IntersectionObserver(([e])=>setFarAway(!e.isIntersecting));io.observe(node);return ()=>io.disconnect();},[]);
 const options=[...RECORDER_PLAN.diagnostic.map(t=>({id:t.id,task:t.task})),...COURSE_TASKS];
 const lower=filter.toLocaleLowerCase('pt-BR'),filtered=options.filter(t=>`${t.id} ${t.task}`.toLocaleLowerCase('pt-BR').includes(lower));
 const goCurrent=()=>{const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;currentRef.current?.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});currentRef.current?.focus({preventScroll:true});};
 const startCurrent=()=>onLesson({stopId:current.id,lessonId:curState.nextLesson??current.lessonIds[0],review:curState.status==='revisao'});
 return <div className="rj">
  <section className="rj-head" aria-labelledby="rj-title">
   <div className="rj-head-copy"><span className="rj-eyebrow">Flauta doce soprano · Unidade {current.unit} de 16</span><h2 id="rj-title">{current.unitGoal}</h2><p>Próxima parada: <b>{current.label}</b>{curState.total>1?` · lição ${Math.min(curState.done+1,curState.total)} de ${curState.total}`:''}</p></div>
   <button type="button" className="rj-continue" onClick={startCurrent}>{completed||ledger.xp?'Continuar':'Começar'}</button>
   <dl className="rj-stats"><div><dt>Paradas</dt><dd>{completed}/64</dd></div><div><dt>XP de prática</dt><dd>{ledger.xp}</dd></div><div><dt>Revisões</dt><dd>{reviews.length}</dd></div></dl>
   {reviews.length>0&&<button type="button" className="rj-review-cta" onClick={()=>onLesson({stopId:reviews[0].id,review:true})}>Revisar agora · Unidade {reviews[0].unit}, {reviews[0].label}</button>}
   <details className="rj-tools"><summary>Dedilhado, busca e diagnóstico</summary>
    <label className="rj-field">Dedilhado da sua flauta<select value={system} onChange={e=>onSystem?.(e.target.value as RecorderSystem)}><option value="baroque">Barroco</option><option value="german">Germânico</option></select></label>
    <label className="rj-field">Buscar atividade por código ou assunto<input type="search" value={filter} placeholder="Ex.: M10, B2.2, pausa" onChange={e=>{setFilter(e.target.value);const t=e.target.value.toLocaleLowerCase('pt-BR');const first=options.find(o=>`${o.id} ${o.task}`.toLocaleLowerCase('pt-BR').includes(t));if(first)setJump(first.id);}}/></label>
    <label className="rj-field">Atividade<select value={jump} onChange={e=>setJump(e.target.value)}>{filtered.map(t=><option key={t.id} value={t.id}>{t.id} · {t.task}</option>)}</select></label>
    <button type="button" className="rj-small-btn" disabled={!filtered.some(t=>t.id===jump)} onClick={()=>onTask(jump)}>Abrir atividade ({filtered.length} resultados)</button>
    <details className="rj-diagnostic"><summary>Diagnóstico inicial · {Object.keys(data.diagnostic.ledger.responses).length}/8 registros</summary><RecorderDiagnosticPath onOpen={(id:DiagnosticId|'summary')=>onTask(id)}/></details>
   </details>
   {data.warnings.map((w,i)=><p className="rj-warning" role="status" key={i}>{w}</p>)}
  </section>
  <ol className="rj-path" aria-label="Trilha da flauta: 16 unidades, 64 paradas">
   {JOURNEY_UNITS.map(unit=>{const milestone=SECTION_MILESTONES.find(m=>m.afterUnit===unit.number);
    return <Fragment key={unit.id}>
     <li className={`rj-unit rj-unit--s${unit.section}`} aria-labelledby={`rj-unit-${unit.number}`}>
      <header className="rj-unit-sign"><small>Unidade {unit.number}</small><h3 id={`rj-unit-${unit.number}`}>{unit.goal}</h3><p>{unit.title}</p></header>
      <div className="rj-stops" style={{'--rows':unit.stops.length} as CSSProperties}>
       <svg className="rj-curve" viewBox={`0 0 100 ${(unit.stops.length-1)*STEP+TOP+70}`} preserveAspectRatio="none" aria-hidden="true">
        {(()=>{const H=(unit.stops.length-1)*STEP+TOP+70,pts:[number,number][]=[[50,0],...unit.stops.map((_,i)=>[X[i],TOP+i*STEP] as [number,number]),[50,H]];
         return pts.slice(1).map(([x,y],k)=>{const [px,py]=pts[k],mid=(py+y)/2,st=k>0?states.get(unit.stops[k-1].id)?.status:undefined;return <path key={k} className={st==='concluida'||st==='revisao'?'is-done':''} d={`M${px} ${py}C${px} ${mid} ${x} ${mid} ${x} ${y}`} vectorEffect="non-scaling-stroke"/>;});})()}
       </svg>
       {unit.stops.map((stop,i)=>{const s=states.get(stop.id)!;const here=stop.id===current.id;const expanded=open===stop.id;
        const lesson=s.nextLesson??stop.lessonIds[0];const count=lessonExercises(lesson).length;
        return <div key={stop.id} className={`rj-stop is-${s.status} ${here?'is-current':''}`} style={{'--x':`${X[i]}%`,'--xn':X[i],'--row':i} as CSSProperties}>
         {here&&<span className="rj-here" aria-hidden="true">{s.status==='revisao'?'REVISAR':s.done?'CONTINUAR':'COMEÇAR'}</span>}
         {here&&<TomOfficial decorative expression="animado" className={`rj-tom ${X[i]>50?'is-left':''}`}/>}
         <button ref={here?currentRef:undefined} type="button" className="rj-node" aria-current={here?'step':undefined} aria-expanded={expanded} aria-controls={`rj-pop-${stop.id}`}
          aria-label={`Unidade ${unit.number}, ${stop.label}: ${STATUS_TEXT[s.status]}${s.total>1?`, ${s.done} de ${s.total} lições`:''}${here?'. Você está aqui':''}`}
          onClick={()=>setOpen(expanded?null:stop.id)}>
          {s.status==='em-andamento'&&<svg className="rj-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="100" strokeDasharray={`${Math.max(8,s.done/s.total*100)} 100`}/></svg>}
          <StopIcon kind={stop.kind} status={s.status}/>
         </button>
         <span className="rj-label">{stop.label}{s.status==='revisao'&&<em>revisar</em>}</span>
         {expanded&&<div className="rj-pop" id={`rj-pop-${stop.id}`} role="region" aria-label={`${stop.label}, unidade ${unit.number}`}>
          <b>{stop.label} · Unidade {unit.number}</b>
          <p>{s.status==='concluida'?'Parada concluída.':s.status==='revisao'?'Revisão recomendada para fixar.':s.total>1?`Lição ${Math.min(s.done+1,s.total)} de ${s.total}: ${LESSON_NAMES.get(lesson)}.`:`${LESSON_NAMES.get(lesson)}.`} {count} telas.</p>
          <button type="button" className="rj-pop-main" onClick={()=>onLesson({stopId:stop.id,lessonId:lesson,review:s.status==='revisao'})}>{s.status==='revisao'?'Revisar':s.status==='concluida'?'Praticar de novo':s.done?'Continuar':'Começar'}</button>
          {s.status==='revisao'&&<button type="button" className="rj-pop-link" onClick={()=>onLesson({stopId:stop.id,lessonId:stop.lessonIds[0]})}>Refazer a lição completa</button>}
          <details className="rj-pop-tasks"><summary>Atividades detalhadas ({stop.taskIds.length})</summary>{stop.taskIds.map(id=><button type="button" key={id} data-curriculum-id={id} onClick={()=>onTask(id)}><span>{id}</span>{COURSE_TASKS.find(t=>t.id===id)?.task}{legacy[id]&&' ✓'}</button>)}</details>
         </div>}
        </div>;})}
      </div>
     </li>
     {milestone&&<li className="rj-milestone" aria-label={`Desafio com o professor depois da unidade ${unit.number}`}><div className="rj-milestone-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4m-4 3h8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg></div><b>Desafio com o professor</b><p>Mostre o que aprendeu até aqui.</p><div>{milestone.assessments.map(a=><button type="button" key={a.id} data-curriculum-id={a.id} onClick={()=>onTask(a.id)}>{a.title}{legacy[a.id]&&' ✓'}</button>)}</div></li>}
    </Fragment>;})}
  </ol>
  {farAway&&<button type="button" className="rj-jump" onClick={goCurrent}>Ir para minha posição</button>}
 </div>;
}
