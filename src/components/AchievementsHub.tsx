import {useId} from 'react';
import {HubAction,HubHeading,HubIcon,HubTomScene,type HubIconName} from './CactomHub';

export type CourseBadge={icon:HubIconName;title:string;description:string;earned:boolean};
export function AchievementsHub({badges,onPractice,onRojão}:{badges:readonly CourseBadge[];onPractice:()=>void;onRojão:()=>void}){
 const count=badges.filter(badge=>badge.earned).length,id=useId();
 return <div className="practice-hub course-hub achievements-hub">
  <HubHeading icon="star" eyebrow="CADA DESCOBERTA CONTA" title="Suas" accent="conquistas." intro="Pequenos passos que merecem ser lembrados."/>
  <section className="practice-feature" aria-labelledby={id+'-summary'}>
   <div className="practice-feature-copy"><span className="practice-kicker"><i/>CONQUISTAS DO CURSO</span><div className="hub-feature-number"><strong>{count}</strong><span>de {badges.length}</span></div><h2 id={id+'-summary'}>Seu esforço está virando música.</h2><p className="practice-lesson-description">{count} de {badges.length} conquistas deste curso. Cada uma nasce de uma descoberta sua.</p><div className="hub-feature-track" role="progressbar" aria-label="Conquistas do curso" aria-valuemin={0} aria-valuemax={badges.length} aria-valuenow={count}><span style={{width:`${count/badges.length*100}%`}}/></div></div>
   <HubTomScene message="Cada passo conta!"/>
   <HubAction onClick={onPractice}>Continuar aprendendo</HubAction>
  </section>
  <section aria-labelledby={id+'-collection'}><div className="hub-section-heading"><h2 id={id+'-collection'}>Sua coleção de descobertas</h2><span>{count}/{badges.length}</span></div><div className="hub-achievement-grid">{badges.map((badge,index)=><article className={`badge-card ${badge.earned?'earned':''}`} data-achievement={badge.earned?'earned':'pending'} data-tone={index%4} key={badge.title}>
   <span className="hub-achievement-art" aria-hidden="true"><span><HubIcon name={badge.icon}/></span>{badge.earned&&<i><HubIcon name="check"/></i>}</span><div className="hub-achievement-copy"><span className="hub-achievement-status">{badge.earned?'CONQUISTADA':'POR DESCOBRIR'}</span><h3>{badge.title}</h3><p>{badge.description}</p></div>
  </article>)}</div></section>
  <button type="button" className="hub-related-link" onClick={onRojão}><span className="hub-related-icon"><HubIcon name="sun"/></span><span><b>As insígnias do Seu Rojão</b><small>Tiquinho, Passinho, Embalo e os próximos marcos de dias seguidos.</small></span><HubIcon name="arrow"/></button>
 </div>;
}
