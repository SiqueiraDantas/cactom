import type {CSSProperties} from 'react';
import {CactomTomArt,type TomVariant} from './CactomTomArt';
import './welcome-scene.css';

export type WelcomeScenePhase='waiting'|'entering'|'settled';
type Cast={variant:TomVariant;left:number;bottom:number;width:number;dx:number;dy:number;delay:number;bob:number;blink:number;z:number};
/** Positions in % of the 3:2 stage. dx/dy: where the character starts inside the book (% of its own box). */
export const WELCOME_CAST:Cast[]=[
 {variant:'trumpet',left:12,bottom:33,width:25,dx:92,dy:40,delay:.98,bob:2.1,blink:1.3,z:1},
 {variant:'flute',left:63,bottom:33,width:25,dx:-92,dy:40,delay:1.1,bob:2.3,blink:2.9,z:1},
 {variant:'lead',left:31,bottom:17,width:38,dx:0,dy:58,delay:.48,bob:2.6,blink:.4,z:2},
 {variant:'drum',left:1,bottom:2,width:25,dx:150,dy:-22,delay:1.22,bob:1.9,blink:3.6,z:5},
 {variant:'maestro',left:72,bottom:2,width:25,dx:-145,dy:-22,delay:1.34,bob:2.2,blink:2.1,z:5},
];
const NOTES=[{left:6,top:16,color:'#f5a528',delay:1.7,rot:-10},{left:30,top:4,color:'#4a84c3',delay:1.85,rot:8},{left:66,top:6,color:'#239143',delay:2,rot:-6},{left:89,top:22,color:'#4a84c3',delay:2.15,rot:10}];
/** Length of the entrance; idle motion starts from here so nothing jumps. */
export const WELCOME_ENTRANCE_SECONDS=2.4;

function Note({color}:{color:string}){
 return <svg viewBox="0 0 40 48" aria-hidden="true" focusable="false"><path d="M15 6L36 1V31" fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 6V37" stroke={color} strokeWidth="5" strokeLinecap="round"/><ellipse cx="9" cy="38" rx="9" ry="7" fill={color} transform="rotate(-18 9 38)"/><ellipse cx="30" cy="32" rx="8" ry="6.5" fill={color} transform="rotate(-18 30 32)"/></svg>;
}

function Book(){
 return <svg viewBox="0 0 340 118" aria-hidden="true" focusable="false">
  <ellipse cx="170" cy="110" rx="150" ry="7" fill="#1d3b2a" opacity=".08"/>
  <path d="M14 34Q90 14 170 32Q250 14 326 34V104Q250 86 170 104Q90 86 14 104Z" fill="#e8952a"/>
  <path d="M22 28Q94 10 168 28V98Q94 80 22 98Z" fill="#fffaf0"/>
  <path d="M318 28Q246 10 172 28V98Q246 80 318 98Z" fill="#fff6e6"/>
  <g fill="none" stroke="#2c5163" strokeWidth="1.6" opacity=".35">
   <path d="M38 42Q96 28 154 42M38 52Q96 38 154 52M38 62Q96 48 154 62M38 72Q96 58 154 72M38 82Q96 68 154 82"/>
   <path d="M186 42Q244 28 302 42M186 52Q244 38 302 52M186 62Q244 48 302 62M186 72Q244 58 302 72M186 82Q244 68 302 82"/>
  </g>
  <g fill="#2c5163" opacity=".55"><ellipse cx="64" cy="58" rx="5" ry="4" transform="rotate(-20 64 58)"/><ellipse cx="96" cy="49" rx="5" ry="4" transform="rotate(-20 96 49)"/><ellipse cx="222" cy="51" rx="5" ry="4" transform="rotate(-20 222 51)"/><ellipse cx="262" cy="62" rx="5" ry="4" transform="rotate(-20 262 62)"/></g>
  <path d="M170 30V104" stroke="#e3cfa8" strokeWidth="3"/>
 </svg>;
}

const vars=(values:Record<string,string|number>)=>values as CSSProperties;
export function WelcomeScene({phase,paused,reduced=false,label}:{phase:WelcomeScenePhase;paused:boolean;reduced?:boolean;label:string}){
 return <div className="wc-stage" data-phase={phase} data-paused={paused} data-reduced={reduced} role="img" aria-label={label}>
  <div className="wc-burst" aria-hidden="true">{Array.from({length:8},(_,i)=><i key={i} style={vars({'--a':`${i*45}deg`})}/>)}</div>
  {WELCOME_CAST.map(cast=><div key={cast.variant} className={`wc-actor wc-actor--${cast.variant}`} style={vars({left:`${cast.left}%`,bottom:`${cast.bottom}%`,width:`${cast.width}%`,zIndex:cast.z,'--dx':`${cast.dx}%`,'--dy':`${cast.dy}%`,'--delay':`${cast.delay}s`,'--bob':`${cast.bob}s`,'--blink':`${cast.blink}s`})}>
   <div className="wc-pop"><div className="wc-bob"><CactomTomArt variant={cast.variant}/></div></div>
  </div>)}
  <div className="wc-book" style={{zIndex:3}}><Book/></div>
  {NOTES.map((note,i)=><div key={i} className="wc-note" style={vars({left:`${note.left}%`,top:`${note.top}%`,'--delay':`${note.delay}s`,'--rot':`${note.rot}deg`,'--float':`${3+i*.35}s`})}><Note color={note.color}/></div>)}
 </div>;
}
