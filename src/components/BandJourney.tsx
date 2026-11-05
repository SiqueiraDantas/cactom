import {Fragment,useEffect,useLayoutEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import {bandJourney,readBandJourney,bandExercises,bandLessonName,type BandInstrument} from '../lib/bandTrail';
import type {StopStatus} from '../lib/recorderJourney';
import {useProfileStorage} from './ProfileStorage';
import {TomOfficial} from './CactomBrand';
import {StopIcon,type JourneyOpen} from './RecorderJourney';
import {TrumpetKeyChoice} from './BandLesson';
import './recorder-journey.css';

const X=[50,27,50,73],TOP=104,STEP=120;
const STATUS_TEXT:Record<StopStatus,string>={'disponivel':'disponível','em-andamento':'em andamento','concluida':'concluída','revisao':'revisão recomendada'};
const NAME:Record<BandInstrument,string>={'trumpet-bb':'Trompete','clarinet-bb':'Clarinete em Si♭'};
const SECTIONS=['Primeiros Passos','Fundamentos','Intermediário','Autonomia Musical'];

/** Trilha do trompete e do clarinete: o mesmo mapa da flauta (4 áreas por unidade, revisões e desafios de seção). */
export function BandJourney({instrument,onLesson}:{instrument:BandInstrument;onLesson:(open:JourneyOpen)=>void}){
 const storage=useProfileStorage(),journey=bandJourney(instrument),{engine,units}=journey;
 const [data]=useState(()=>readBandJourney(storage,instrument));const ledger=data.ledger;
 const current=useMemo(()=>engine.currentStop(ledger),[ledger,engine]);
 const reviews=useMemo(()=>engine.dueReviews(ledger),[ledger,engine]);
 const states=useMemo(()=>new Map(journey.stops.map(s=>[s.id,engine.stopState(s,ledger)])),[ledger,journey,engine]);
 const [open,setOpen]=useState<string|null>(null);
 const currentRef=useRef<HTMLButtonElement>(null),[farAway,setFarAway]=useState(false);
 const completed=[...states.values()].filter(s=>s.status==='concluida'||s.status==='revisao').length,curState=states.get(current.id)!;
 useLayoutEffect(()=>{const node=currentRef.current;if(!node)return;const top=node.getBoundingClientRect().top+window.scrollY-window.innerHeight*.45;if(current.index>0&&top>200)window.scrollTo({top,behavior:'auto'});},[]);
 useEffect(()=>{const node=currentRef.current;if(!node||typeof IntersectionObserver==='undefined')return;const io=new IntersectionObserver(([e])=>setFarAway(!e.isIntersecting));io.observe(node);return ()=>io.disconnect();},[]);
 const goCurrent=()=>{const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;currentRef.current?.scrollIntoView({block:'center',behavior:reduce?'auto':'smooth'});currentRef.current?.focus({preventScroll:true});};
 const startCurrent=()=>onLesson({stopId:current.id,lessonId:curState.nextLesson??current.lessonIds[0],review:curState.status==='revisao'});
 return <div className="rj">
  <section className="rj-head" aria-labelledby="bj-title">
   <div className="rj-head-copy"><span className="rj-eyebrow">{NAME[instrument]} · Unidade {current.unit} de 16</span><h2 id="bj-title">{current.unitGoal}</h2><p>Próxima parada: <b>{current.label}</b>{curState.total>1?` · lição ${Math.min(curState.done+1,curState.total)} de ${curState.total}`:''}</p></div>
   <button type="button" className="rj-continue" onClick={startCurrent}>{completed||ledger.xp?'Continuar':'Começar'}</button>
   <dl className="rj-stats"><div><dt>Paradas</dt><dd>{completed}/{journey.stops.length}</dd></div><div><dt>XP de prática</dt><dd>{ledger.xp}</dd></div><div><dt>Revisões</dt><dd>{reviews.length}</dd></div></dl>
   {reviews.length>0&&<button type="button" className="rj-review-cta" onClick={()=>onLesson({stopId:reviews[0].id,review:true})}>Revisar agora · Unidade {reviews[0].unit}, {reviews[0].label}</button>}
   {instrument==='trumpet-bb'&&<details className="rj-tools"><summary>Afinação do trompete</summary><TrumpetKeyChoice/></details>}
   {data.warning&&<p className="rj-warning" role="status">{data.warning}</p>}
  </section>
  <ol className="rj-path" aria-label={`Trilha do ${NAME[instrument].toLocaleLowerCase('pt-BR')}: 16 unidades, ${journey.stops.length} paradas`}>
   {units.map(unit=><Fragment key={unit.number}>
    {(unit.number-1)%4===0&&<li className="rj-milestone bj-section" aria-label={`Seção ${unit.section}`}><b>Seção {unit.section} · {SECTIONS[unit.section-1]}</b><p>Unidades {unit.number} a {unit.number+3}, com desafio no fim.</p></li>}
    <li className={`rj-unit rj-unit--s${unit.section}`} aria-labelledby={`bj-unit-${unit.number}`}>
     <header className="rj-unit-sign"><small>Unidade {unit.number}</small><h3 id={`bj-unit-${unit.number}`}>{unit.goal}</h3><p>{unit.title}</p></header>
     <div className="rj-stops" style={{'--rows':unit.stops.length} as CSSProperties}>
      <svg className="rj-curve" viewBox={`0 0 100 ${(unit.stops.length-1)*STEP+TOP+70}`} preserveAspectRatio="none" aria-hidden="true">
       {(()=>{const H=(unit.stops.length-1)*STEP+TOP+70,pts:[number,number][]=[[50,0],...unit.stops.map((_,i)=>[X[i%4],TOP+i*STEP] as [number,number]),[50,H]];
        return pts.slice(1).map(([x,y],k)=>{const [px,py]=pts[k],mid=(py+y)/2,st=k>0?states.get(unit.stops[k-1].id)?.status:undefined;return <path key={k} className={st==='concluida'||st==='revisao'?'is-done':''} d={`M${px} ${py}C${px} ${mid} ${x} ${mid} ${x} ${y}`} vectorEffect="non-scaling-stroke"/>;});})()}
      </svg>
      {unit.stops.map((stop,i)=>{const s=states.get(stop.id)!,here=stop.id===current.id,expanded=open===stop.id,x=X[i%4];
       const lesson=s.nextLesson??stop.lessonIds[0],count=bandExercises(instrument,lesson).length,name=bandLessonName(instrument,lesson);
       return <div key={stop.id} className={`rj-stop is-${s.status} ${here?'is-current':''} ${stop.kind==='desafio'?'is-challenge':''}`} style={{'--x':`${x}%`,'--xn':x,'--row':i} as CSSProperties}>
        {here&&<span className="rj-here" aria-hidden="true">{s.status==='revisao'?'REVISAR':s.done?'CONTINUAR':'COMEÇAR'}</span>}
        {here&&<TomOfficial decorative expression="animado" className={`rj-tom ${x>50?'is-left':''}`}/>}
        <button ref={here?currentRef:undefined} type="button" className="rj-node" aria-current={here?'step':undefined} aria-expanded={expanded} aria-controls={`bj-pop-${stop.id}`}
         aria-label={`Unidade ${unit.number}, ${stop.label}: ${STATUS_TEXT[s.status]}${s.total>1?`, ${s.done} de ${s.total} lições`:''}${here?'. Tu está aqui':''}`}
         onClick={()=>setOpen(expanded?null:stop.id)}>
         {s.status==='em-andamento'&&<svg className="rj-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="100" strokeDasharray={`${Math.max(8,s.done/s.total*100)} 100`}/></svg>}
         <StopIcon kind={stop.kind} status={s.status}/>
        </button>
        <span className="rj-label">{stop.label}{s.status==='revisao'&&<em>revisar</em>}</span>
        {expanded&&<div className="rj-pop" id={`bj-pop-${stop.id}`} role="region" aria-label={`${stop.label}, unidade ${unit.number}`}>
         <b>{stop.label} · Unidade {unit.number}</b>
         <p>{s.status==='concluida'?'Parada concluída.':s.status==='revisao'?'Revisão recomendada pra fixar.':s.total>1?`Lição ${Math.min(s.done+1,s.total)} de ${s.total}: ${name}.`:stop.kind==='desafio'?'Mostre tudo que tu aprendeu nesta seção.':`${name}.`} {count} telas.</p>
         <button type="button" className="rj-pop-main" onClick={()=>onLesson({stopId:stop.id,lessonId:lesson,review:s.status==='revisao'})}>{s.status==='revisao'?'Revisar':s.status==='concluida'?'Praticar de novo':s.done?'Continuar':'Começar'}</button>
         {s.status==='revisao'&&<button type="button" className="rj-pop-link" onClick={()=>onLesson({stopId:stop.id,lessonId:stop.lessonIds[0]})}>Refazer a lição completa</button>}
         {s.total>1&&<div className="bj-pop-lessons">{stop.lessonIds.map((l,k)=><button type="button" key={l} onClick={()=>onLesson({stopId:stop.id,lessonId:l})}>Lição {k+1}: {bandLessonName(instrument,l)}{engine.lessonDone(l,ledger)?' ✓':''}</button>)}</div>}
        </div>}
       </div>;})}
     </div>
    </li>
   </Fragment>)}
  </ol>
  {farAway&&<button type="button" className="rj-jump" onClick={goCurrent}>Ir para minha posição</button>}
 </div>;
}
