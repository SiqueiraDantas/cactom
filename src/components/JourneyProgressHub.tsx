import {useId,useState} from 'react';
import {HubIcon,type HubIconName} from './CactomHub';
import {TomOfficial} from './CactomBrand';
import type {JourneyOverview,JourneyOpenTarget} from '../lib/journeyOverview';
import './progress-album.css';
const STATUS:Record<string,string>={concluida:'Concluída',revisao:'Pede revisão','em-andamento':'Em andamento',disponivel:'Ainda não'};
const STICKER_ICONS:HubIconName[]=['music','headphones','hand','star','sun','book'];
/** Aba Progresso da trilha: cada unidade concluída vira uma figurinha colada no álbum. */
export function JourneyProgressHub({overview:o,onOpen}:{overview:JourneyOverview;onOpen:(open:JourneyOpenTarget)=>void}){
 const id=useId();
 const currentUnit=o.units.find(u=>u.stops.some(s=>s.stop.id===o.current.id))?.number??o.units[0]?.number??1;
 const [picked,setPicked]=useState<number>(currentUnit);
 const finished=(status:string)=>status==='concluida'||status==='revisao';
 const unit=o.units.find(u=>u.number===picked)??o.units[0];
 return <div className="practice-hub course-hub progress-hub album-hub">
  <header className="album-head">
   <span className="album-tom" aria-hidden="true"><TomOfficial decorative expression={o.lessonsDone?'orgulhoso':'animado'}/></span>
   <div className="album-head-copy">
    <p className="album-eyebrow">TEU ÁLBUM DA MÚSICA</p>
    <h1>{o.unitsDone} de {o.unitsTotal} figurinhas coladas</h1>
    <div className="album-bar" role="progressbar" aria-label="Progresso da trilha" aria-valuemin={0} aria-valuemax={100} aria-valuenow={o.percent}><span style={{width:`${o.percent}%`}}/></div>
    <p>{o.percent}% da trilha · {o.stopsDone} de {o.stopsTotal} paradas · {o.lessonsDone} de {o.lessonsTotal} lições · {o.xp} XP</p>
   </div>
   <button type="button" className="album-go" onClick={()=>onOpen(o.open)}>{o.open.review?'Revisar agora':o.lessonsDone?'Continuar':'Começar'}<HubIcon name="arrow"/></button>
  </header>

  {o.reviews.length>0&&<section className="album-reviews" aria-labelledby={id+'-rev'}>
   <span className="album-reviews-icon"><HubIcon name="headphones"/></span>
   <div><h2 id={id+'-rev'}>{o.reviews.length===1?'1 parada pede revisão':`${o.reviews.length} paradas pedem revisão`}</h2><p>Revisar ajuda a não esquecer.</p></div>
   <button type="button" onClick={()=>onOpen({stopId:o.reviews[0].id,review:true})}>Revisar</button>
  </section>}

  <section aria-labelledby={id+'-units'} className="album-section">
   <h2 id={id+'-units'} className="album-title">Tuas figurinhas</h2>
   <div className="album-grid">{o.units.map((u,k)=>{
    const done=u.stops.filter(s=>finished(s.status)).length,complete=done===u.stops.length&&u.stops.length>0,current=u.number===currentUnit&&!complete;
    const state=complete?'done':current?'current':done>0?'started':'locked';
    return <button type="button" key={u.number} className={`album-card ${state}${picked===u.number?' picked':''}`} data-tone={k%4} aria-pressed={picked===u.number} onClick={()=>setPicked(u.number)} aria-label={`Unidade ${u.number}: ${u.goal}. ${done} de ${u.stops.length} paradas`}>
     <span className="album-sticker">{complete?<HubIcon name={STICKER_ICONS[k%STICKER_ICONS.length]}/>:current?<span className="album-sticker-tom"><TomOfficial decorative expression="animado"/></span>:<b>{String(u.number).padStart(2,'0')}</b>}{(complete||current)&&<small>{String(u.number).padStart(2,'0')}</small>}</span>
     <span className="album-name">{u.goal}</span>
     {complete?<span className="album-state"><HubIcon name="check"/>Colada</span>:<span className="album-mini"><span className="album-track"><i style={{width:`${u.stops.length?done/u.stops.length*100:0}%`}}/></span><em>{done}/{u.stops.length}</em></span>}
    </button>;
   })}</div>
  </section>

  {unit&&<section className="album-detail" aria-labelledby={id+'-detail'}>
   <div className="album-detail-head"><small>UNIDADE {unit.number}</small><h2 id={id+'-detail'}>{unit.goal}</h2></div>
   <div className="hub-unit-lessons">{unit.stops.map(s=>{
    const isDone=finished(s.status),isCurrent=s.stop.id===o.current.id;
    return <button type="button" key={s.stop.id} className={`hub-lesson ${isDone?'done':isCurrent?'current':''}`} onClick={()=>onOpen({stopId:s.stop.id,review:s.status==='revisao'})} aria-label={`${s.stop.label}, ${STATUS[s.status]}`}><span className="hub-lesson-index">{isDone?<HubIcon name="check"/>:String(s.stop.index+1).padStart(2,'0')}</span><span className="hub-lesson-copy"><b>{s.stop.label}</b><small>{s.done} de {s.total} lições · {STATUS[s.status]}</small></span><span className="hub-lesson-action">{s.status==='revisao'?'Revisar':isDone?'Rever':isCurrent?'Continuar':'Praticar'}</span><HubIcon name="arrow"/></button>;
   })}</div>
  </section>}
 </div>;
}
