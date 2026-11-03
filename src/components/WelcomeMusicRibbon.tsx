import {useState} from 'react';
import {CourseArtwork} from './CourseArtwork';
import {ACCESS_COPY,type AccessCopy,type AccessLocale} from '../lib/accessLocale';
import {useAccessMotion} from './useAccessMotion';

const ITEMS:readonly {id:string;label:keyof AccessCopy;instrument?:string}[]=[
 {id:'recorder',label:'recorder',instrument:'recorder-soprano'},
 {id:'trumpet',label:'trumpet',instrument:'trumpet-bb'},
 {id:'score',label:'score'},
 {id:'clarinet',label:'clarinet',instrument:'clarinet-bb'},
 {id:'rhythm',label:'rhythm'},
 {id:'flute',label:'flute',instrument:'flute'},
 {id:'sax',label:'sax',instrument:'alto-sax'},
 {id:'notes',label:'notes'},
 {id:'conducting',label:'conducting',instrument:'conductor'},
 {id:'trombone',label:'trombone',instrument:'trombone'},
];
function MusicObject({id}:{id:string}){
 return <svg className="welcome-music-object" viewBox="0 0 64 52" fill="none" aria-hidden="true" focusable="false">
  {id==='score'?<><path d="M8 9q12-5 24 0 12-5 24 0v34q-12-5-24 0-12-5-24 0Z" fill="#fff9e7" stroke="#2d877b" strokeWidth="2.5" strokeLinejoin="round"/><path d="M32 10v32M13 18h13m-13 6h13m12-6h13m-13 6h13" stroke="#b4d9cd" strokeWidth="2"/><path d="M21 32v-9l7-2v9" stroke="#247b70" strokeWidth="2"/><ellipse cx="18.5" cy="32" rx="3.5" ry="2.5" fill="#247b70"/></>:id==='rhythm'?<><path d="M12 22h40l-3 22q-17 9-34 0Z" fill="#f3ad3b" stroke="#ce8827" strokeWidth="2"/><path d="m18 25 7 18 7-18 7 18 7-18" stroke="#ffe2a0" strokeWidth="2"/><ellipse cx="32" cy="22" rx="20" ry="6" fill="#ffedba" stroke="#dcaa58" strokeWidth="2"/><path d="m15 7 14 11m21-13L37 17" stroke="#ad7637" strokeWidth="4" strokeLinecap="round"/></>:<><path d="M25 36V14l24-5v23M25 21l24-5" stroke="#299588" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/><ellipse cx="18" cy="37" rx="8" ry="6" fill="#299588" transform="rotate(-15 18 37)"/><ellipse cx="42" cy="33" rx="8" ry="6" fill="#f0aa31" transform="rotate(-15 42 33)"/></>}
 </svg>;
}
export function WelcomeMusicRibbon({locale='pt-BR'}:{locale?:AccessLocale}){
 const t=ACCESS_COPY[locale],environment=useAccessMotion(),[paused,setPaused]=useState(false);
 const still=!environment.ready||environment.reducedMotion||!environment.visible||paused;
 return <footer className={`welcome-music-ribbon ${still?'welcome-music-ribbon--still':''}`} aria-label={t.ribbonLabel}>
  <div className="welcome-ribbon-window"><div className="welcome-ribbon-track" style={{animationPlayState:still?'paused':'running'}}>
   {[false,true].map(duplicate=><ul className="welcome-ribbon-set" key={String(duplicate)} aria-hidden={duplicate||undefined}>{ITEMS.map(item=><li key={item.id}>
    {item.instrument?<CourseArtwork instrument={item.instrument}/>:<MusicObject id={item.id}/>}<span>{t[item.label]}</span>
   </li>)}</ul>)}
  </div></div>
  {environment.ready&&!environment.reducedMotion&&<button type="button" className="welcome-ribbon-pause" onClick={()=>setPaused(value=>!value)} aria-label={paused?t.resumeRibbon:t.pauseRibbon} aria-pressed={paused} title={paused?t.resumeRibbon:t.pauseRibbon}>
   <svg viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">{paused?<path d="m6 3 11 7-11 7Z"/>:<><rect x="5" y="4" width="3" height="12" rx="1"/><rect x="12" y="4" width="3" height="12" rx="1"/></>}</svg>
  </button>}
 </footer>;
}
