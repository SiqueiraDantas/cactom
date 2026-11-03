import {useId} from 'react';
import {HubAction,HubHeading,HubIcon,HubTomScene} from './CactomHub';
import type {JourneyOverview,JourneyOpenTarget} from '../lib/journeyOverview';

const STATUS:Record<string,string>={concluida:'Concluída',revisao:'Pede revisão','em-andamento':'Em andamento',disponivel:'Ainda não'};

/** Aba Progresso da flauta: mostra a trilha de verdade (paradas da aba Aprender), não as aulas antigas. */
export function JourneyProgressHub({overview:o,onOpen}:{overview:JourneyOverview;onOpen:(open:JourneyOpenTarget)=>void}){
 const id=useId();
 return <div className="practice-hub course-hub progress-hub">
  <HubHeading icon="chart" eyebrow="TEU CAMINHO COM A MÚSICA" title="Teu" accent="progresso." intro="Tudo o que tu fez na trilha aparece aqui."/>
  <section className="practice-feature" aria-labelledby={id+'-summary'}>
   <div className="practice-feature-copy"><span className="practice-kicker"><i/>UMA PARADA DE CADA VEZ</span><div className="hub-feature-number"><strong>{o.percent}<small>%</small></strong></div>
    <h2 id={id+'-summary'}>{o.lessonsDone?'Tu tá construindo teu som, visse!':'Tua jornada começa aqui.'}</h2>
    <p className="practice-lesson-description">{o.stopsDone} de {o.stopsTotal} paradas · {o.lessonsDone} de {o.lessonsTotal} lições · {o.xp} XP de prática</p>
    <div className="hub-feature-track" role="progressbar" aria-label="Progresso da trilha" aria-valuemin={0} aria-valuemax={100} aria-valuenow={o.percent}><span style={{width:`${o.percent}%`}}/></div></div>
   <HubTomScene message="Mais um passo!"/>
   <HubAction onClick={()=>onOpen(o.open)}>{o.open.review?'Revisar agora':o.lessonsDone?'Continuar minha trilha':'Começar minha trilha'}</HubAction>
  </section>
  <div className="hub-summary-grid">
   <section className="hub-summary-card cream"><span className="hub-summary-icon"><HubIcon name="book"/></span><span>UNIDADES CONCLUÍDAS</span><b>{o.unitsDone}<small> de {o.unitsTotal}</small></b><p>Cada unidade é um pedaço novo da música.</p></section>
   <section className="hub-summary-card blue"><span className="hub-summary-icon"><HubIcon name="headphones"/></span><span>REVISÕES PARA FAZER</span><b>{o.reviews.length}</b><p>{o.reviews.length?'Revisar ajuda a não esquecer.':'Tudo em dia por aqui.'}</p></section>
  </div>
  <section className="hub-course-history" aria-labelledby={id+'-units'}><div className="hub-section-heading"><h2 id={id+'-units'}>Teu caminho, parada por parada</h2><span>{o.unitsTotal} unidades</span></div><div className="hub-unit-list">{o.units.map(u=>{
   const count=u.stops.filter(s=>s.status==='concluida'||s.status==='revisao').length;
   return <details className="hub-progress-unit" key={u.number} open={u.stops.some(s=>s.stop.id===o.current.id)}><summary><span className="hub-unit-number">{String(u.number).padStart(2,'0')}</span><span className="hub-unit-title"><small>UNIDADE {u.number}</small><b>{u.goal}</b></span><span className="hub-unit-count" aria-label={`${count} de ${u.stops.length} paradas concluídas`}>{count}/{u.stops.length}</span><HubIcon name="chevron"/></summary><div className="hub-unit-lessons">{u.stops.map(s=>{
    const finished=s.status==='concluida'||s.status==='revisao',current=s.stop.id===o.current.id;
    return <button type="button" key={s.stop.id} className={`hub-lesson ${finished?'done':current?'current':''}`} onClick={()=>onOpen({stopId:s.stop.id,review:s.status==='revisao'})} aria-label={`${s.stop.label}, ${STATUS[s.status]}`}><span className="hub-lesson-index">{finished?<HubIcon name="check"/>:String(s.stop.index+1).padStart(2,'0')}</span><span className="hub-lesson-copy"><b>{s.stop.label}</b><small>{s.done} de {s.total} lições · {STATUS[s.status]}</small></span><span className="hub-lesson-action">{s.status==='revisao'?'Revisar':finished?'Rever':current?'Continuar':'Praticar'}</span><HubIcon name="arrow"/></button>;
   })}</div></details>;
  })}</div></section>
 </div>;
}
