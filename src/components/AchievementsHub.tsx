import {useId,useState,type ReactNode} from 'react';
import {TomOfficial} from './CactomBrand';
import './achievements-v2.css';
import {HubIcon,type HubIconName} from './CactomHub';

export type CourseBadge={icon:HubIconName;title:string;description:string;earned:boolean};
const RANK_TAB:Record<string,string>={'iniciacao':'Ranking da iniciação','recorder-soprano':'Ranking da flauta','trumpet-bb':'Ranking do trompete','clarinet-bb':'Ranking do clarinete'};
export function AchievementsHub({badges,onPractice,onRojão,ranking,instrumentId=''}:{badges:readonly CourseBadge[];onPractice:()=>void;onRojão:()=>void;ranking?:ReactNode;instrumentId?:string}){
 const count=badges.filter(badge=>badge.earned).length,id=useId();
 const [view,setView]=useState<'ranking'|'medals'>(ranking?'ranking':'medals');
 const next=badges.find(badge=>!badge.earned);
 const pct=badges.length?Math.round(count/badges.length*100):0;
 return <div className="practice-hub course-hub achievements-hub ach-v2">
  <section className="ach-head" aria-labelledby={id+'-summary'}>
   <span className="ach-tom" aria-hidden="true"><TomOfficial decorative expression={count?'orgulhoso':'animado'}/></span>
   <div className="ach-head-copy">
    <p className="ach-eyebrow">TUAS CONQUISTAS</p>
    <h1 id={id+'-summary'}><span>{count}</span> de {badges.length} medalhas</h1>
    <div className="ach-bar" role="progressbar" aria-label="Medalhas conquistadas" aria-valuemin={0} aria-valuemax={badges.length} aria-valuenow={count}><span style={{width:`${pct}%`}}/></div>
    <p>{next?<>A próxima: <b>{next.title}</b> · {next.description}</>:'Tu ganhou todas as medalhas do curso. Que orgulho!'}</p>
   </div>
  </section>
  {ranking&&<div className="ach-tabs" role="tablist" aria-label="Ver">
   <button type="button" role="tab" aria-selected={view==='ranking'} className={view==='ranking'?'on':''} onClick={()=>setView('ranking')}>{RANK_TAB[instrumentId]??'Ranking'}</button>
   <button type="button" role="tab" aria-selected={view==='medals'} className={view==='medals'?'on':''} onClick={()=>setView('medals')}>Medalhas</button>
  </div>}
  {view==='ranking'&&ranking?<div role="tabpanel">{ranking}</div>:<div role="tabpanel" className="ach-medals-panel">
   <section aria-label="Medalhas" className="ach-grid">{badges.map((badge,index)=><article className={`ach-medal ${badge.earned?'earned':''}`} data-achievement={badge.earned?'earned':'pending'} data-tone={index%4} key={badge.title}>
    <span className="ach-medal-art" aria-hidden="true"><HubIcon name={badge.icon}/>{badge.earned&&<i><HubIcon name="check"/></i>}</span>
    <h3>{badge.title}</h3>
    <p>{badge.earned?'CONQUISTADA':badge.description}</p>
   </article>)}</section>
   <button type="button" className="hub-related-link" onClick={onRojão}><span className="hub-related-icon"><HubIcon name="sun"/></span><span><b>As insígnias do Seu Rojão</b><small>Tiquinho, Passinho, Embalo e os próximos marcos de dias seguidos.</small></span><HubIcon name="arrow"/></button>
   <button type="button" className="ach-go" onClick={onPractice}>Continuar aprendendo<HubIcon name="arrow"/></button>
  </div>}
 </div>;
}
