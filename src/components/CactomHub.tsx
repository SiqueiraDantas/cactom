import type {ReactNode} from 'react';
import {TomOfficial} from './CactomBrand';
import type {TomExpression} from './CactomTomArt';
import './practice-hub.css';
import './course-hubs.css';

export type HubIconName='star'|'chart'|'book'|'arrow'|'check'|'chevron'|'music'|'hand'|'sun'|'headphones'|'upload';
export function HubIcon({name}:{name:HubIconName}){
 const paths:Record<HubIconName,ReactNode>={
  star:<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z"/>,
  chart:<path d="M4 4v16h17M8 15v-4m5 4V7m5 8v-6"/>,
  book:<path d="M12 6a9 9 0 0 0-9 0v14a9 9 0 0 1 9 0 9 9 0 0 1 9 0V6a9 9 0 0 0-9 0Zm0 0v14"/>,
  arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>,check:<path d="m5 12 4 4L19 6"/>,chevron:<path d="m8 10 4 4 4-4"/>,
  music:<><path d="M9 18V5l11-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/></>,
  hand:<><path d="M8 13V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7h-2a7 7 0 0 1-6-3l-3-4a2 2 0 0 1 3-3l3 3"/></>,
  sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
  headphones:<><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="12" width="5" height="9" rx="2"/><rect x="16" y="12" width="5" height="9" rx="2"/></>,
  upload:<><path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/></>,
 };
 return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name]}</svg>;
}
export function HubHeading({eyebrow,title,accent,intro,icon}:{eyebrow:string;title:string;accent:string;intro:string;icon:HubIconName}){
 return <header className="practice-heading"><span className="practice-eyebrow"><HubIcon name={icon}/>{eyebrow}</span><h1>{title} <span>{accent}</span></h1><p>{intro}</p></header>;
}
export function HubTomScene({message='Vamos juntos?',expression='feliz'}:{message?:string;expression?:TomExpression}){
 return <div className="practice-tom-scene" aria-hidden="true"><span className="practice-tom-orbit"/><span className="practice-tom-spark spark-one"/><span className="practice-tom-spark spark-two"/><TomOfficial decorative className="practice-tom" expression={expression}/><span className="practice-tom-hello">{message}</span></div>;
}
export function HubAction({children,onClick}:{children:ReactNode;onClick:()=>void}){
 return <div className="practice-feature-action"><button type="button" className="practice-start" onClick={onClick}><span>{children}</span><HubIcon name="arrow"/></button></div>;
}
