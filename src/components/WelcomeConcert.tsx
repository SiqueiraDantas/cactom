import type {CSSProperties} from 'react';
import {CactomTomArt} from './CactomTomArt';
import {CONCERT_BEATS} from '../lib/welcomeConcert';
import './welcome-concert.css';

/**
 * Abertura “pequeno concerto” (≈5 s): a percussionista dá dois pulsos na zabumba, a criança da flauta
 * se prepara e responde (as notas pousam no livro), o violão entra no acompanhamento e o Tom sai do
 * livro para reger o final junto à logo. Cada gesto tem consequência visível.
 * Só transform/opacity animam; cada personagem é uma camada HTML própria.
 */
export type ConcertPhase='waiting'|'playing'|'settled';
const INK='#24433f';
const v=(values:Record<string,string|number>)=>values as CSSProperties;

function Face({blow=false,skin}:{blow?:boolean;skin:string}){
 return <g>
  <circle cx="70" cy="62" r="34" fill={skin} stroke={INK} strokeWidth="3"/>
  <g className="wcc-eyes"><ellipse cx="57" cy="62" rx="7.5" ry="9" fill="#fff" stroke={INK} strokeWidth="2.5"/><ellipse cx="83" cy="62" rx="7.5" ry="9" fill="#fff" stroke={INK} strokeWidth="2.5"/><circle cx="58.5" cy="64" r="3.8" fill={INK}/><circle cx="84.5" cy="64" r="3.8" fill={INK}/></g>
  <circle cx="47" cy="76" r="5" fill="#ff9b8a" opacity=".55"/><circle cx="93" cy="76" r="5" fill="#ff9b8a" opacity=".55"/>
  {blow?<ellipse cx="70" cy="82" rx="4" ry="3.5" fill={INK}/>:<path d="M61 80q9 8 18 0" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round"/>}
 </g>;
}
function Body({shirt}:{shirt:string}){
 return <g><rect x="49" y="148" width="15" height="28" rx="7" fill="#3b4a6b" stroke={INK} strokeWidth="3"/><rect x="76" y="148" width="15" height="28" rx="7" fill="#3b4a6b" stroke={INK} strokeWidth="3"/><path d="M42 100h56l10 54H32z" fill={shirt} stroke={INK} strokeWidth="3" strokeLinejoin="round"/></g>;
}
/** Percussionista com zabumba. */
function Drummer(){
 return <svg viewBox="0 0 140 180" aria-hidden="true">
  <Body shirt="#f5a528"/>
  <circle cx="40" cy="34" r="15" fill="#3a2a22" stroke={INK} strokeWidth="3"/><circle cx="100" cy="34" r="15" fill="#3a2a22" stroke={INK} strokeWidth="3"/>
  <Face skin="#a86b45"/>
  <path d="M38 50q4-26 32-26t32 26q-14-10-32-10t-32 10z" fill="#3a2a22"/>
  <g className="wcc-drum"><rect x="26" y="118" width="88" height="40" rx="8" fill="#e8463d" stroke={INK} strokeWidth="3"/><path d="M30 122l12 32 12-32 12 32 12-32 12 32 12-32 12 32" fill="none" stroke="#fff3df" strokeWidth="3" strokeLinejoin="round"/><ellipse cx="70" cy="118" rx="44" ry="9" fill="#fff6e4" stroke={INK} strokeWidth="3"/></g>
  <path d="M44 106q-16 8-14 26" fill="none" stroke="#a86b45" strokeWidth="10" strokeLinecap="round"/>
  <g className="wcc-mallet"><path d="M98 106q16-2 18-20" fill="none" stroke="#a86b45" strokeWidth="10" strokeLinecap="round"/><path d="M116 88 92 112" stroke="#7b4b2a" strokeWidth="5" strokeLinecap="round"/><circle cx="90" cy="114" r="8" fill="#fff6e4" stroke={INK} strokeWidth="3"/></g>
 </svg>;
}
/** Criança da flauta doce. */
function Flutist(){
 return <svg viewBox="0 0 140 180" aria-hidden="true">
  <Body shirt="#1f8a8c"/>
  <Face skin="#f1c3a0" blow/>
  <path d="M34 66q-4-38 36-40t36 40q-4-18-12-22-10 8-24 8t-28-4q-6 6-8 18z" fill="#c4602d" stroke={INK} strokeWidth="3" strokeLinejoin="round"/>
  <g className="wcc-flute"><path d="M68 80 L104 150" stroke={INK} strokeWidth="11" strokeLinecap="round"/><path d="M68 80 L104 150" stroke="#fff4dc" strokeWidth="6" strokeLinecap="round"/><circle cx="82" cy="107" r="2.4" fill={INK}/><circle cx="87" cy="117" r="2.4" fill={INK}/><circle cx="92" cy="127" r="2.4" fill={INK}/><circle cx="97" cy="137" r="2.4" fill={INK}/><circle cx="80" cy="103" r="6.5" fill="#f1c3a0" stroke={INK} strokeWidth="2.5"/><circle cx="94" cy="131" r="6.5" fill="#f1c3a0" stroke={INK} strokeWidth="2.5"/></g>
 </svg>;
}
/** Criança do violão (acompanhamento). */
function Guitarist(){
 return <svg viewBox="0 0 140 180" aria-hidden="true">
  <Body shirt="#a96ddb"/>
  <Face skin="#d9a27a"/>
  <path d="M36 54q2-30 34-30t34 30q-8-8-16-8l-6-8-6 8-6-8-6 8-6-8-6 8q-8 0-16 8z" fill="#1d1d2b" stroke={INK} strokeWidth="3" strokeLinejoin="round"/>
  <g className="wcc-guitar"><path d="M18 102 L66 130" stroke="#7b4b2a" strokeWidth="8" strokeLinecap="round"/><rect x="8" y="94" width="16" height="10" rx="3" transform="rotate(30 16 99)" fill="#5a3a22" stroke={INK} strokeWidth="2.5"/>
   <path d="M60 116q14-14 30-4 14-6 22 8 8 16-6 26-12 10-28 4-18 4-24-12-6-12 6-22z" fill="#e9a54b" stroke={INK} strokeWidth="3" strokeLinejoin="round"/><circle cx="86" cy="134" r="7" fill="#5a3a22"/>
   <g className="wcc-strings"><path d="M24 104 96 142M22 108 94 146" stroke="#fff6e4" strokeWidth="1.4"/></g></g>
  <g className="wcc-strum"><path d="M100 110q10 6 4 24" fill="none" stroke="#d9a27a" strokeWidth="10" strokeLinecap="round"/><circle cx="102" cy="136" r="6.5" fill="#d9a27a" stroke={INK} strokeWidth="2.5"/></g>
 </svg>;
}
function Book(){
 return <svg viewBox="0 0 340 118" aria-hidden="true">
  <ellipse cx="170" cy="110" rx="150" ry="7" fill="#1d3b2a" opacity=".08"/>
  <path d="M14 34Q90 14 170 32Q250 14 326 34V104Q250 86 170 104Q90 86 14 104Z" fill="#e8952a" stroke={INK} strokeWidth="3"/>
  <path d="M22 28Q94 10 168 28V98Q94 80 22 98Z" fill="#fffaf0"/><path d="M318 28Q246 10 172 28V98Q246 80 318 98Z" fill="#fff6e6"/>
  <g fill="none" stroke="#2c5163" strokeWidth="1.6" opacity=".35"><path d="M38 42Q96 28 154 42M38 52Q96 38 154 52M38 62Q96 48 154 62M38 72Q96 58 154 72M38 82Q96 68 154 82"/><path d="M186 42Q244 28 302 42M186 52Q244 38 302 52M186 62Q244 48 302 62M186 72Q244 58 302 72M186 82Q244 68 302 82"/></g>
  <g className="wcc-page-notes" fill="#2c5163"><ellipse cx="206" cy="47" rx="6" ry="4.6" transform="rotate(-20 206 47)"/><ellipse cx="240" cy="53" rx="6" ry="4.6" transform="rotate(-20 240 53)"/><ellipse cx="274" cy="62" rx="6" ry="4.6" transform="rotate(-20 274 62)"/></g>
  <path d="M170 30V104" stroke="#e3cfa8" strokeWidth="3"/>
 </svg>;
}
function Note({color}:{color:string}){return <svg viewBox="0 0 30 40" aria-hidden="true"><path d="M20 4v24" stroke={color} strokeWidth="4.5" strokeLinecap="round"/><path d="M20 4q8 2 8 10" stroke={color} strokeWidth="4.5" fill="none" strokeLinecap="round"/><ellipse cx="13" cy="30" rx="8.5" ry="6.5" fill={color} transform="rotate(-20 13 30)"/></svg>;}

export function WelcomeConcert({phase,paused,reduced=false,label,run=0}:{phase:ConcertPhase;paused:boolean;reduced?:boolean;label:string;run?:number}){
 return <div className="wcc-stage" key={run} data-phase={phase} data-paused={paused} data-reduced={reduced} role="img" aria-label={label}>
  <div className="wcc-logo" aria-hidden="true"><img src="/branding/cactom/cactom-wordmark.png" alt="" width="447" height="134" decoding="async"/></div>
  <div className="wcc-book"><Book/></div>
  <div className="wcc-actor wcc-tom" style={v({'--d':`${CONCERT_BEATS.tom}s`})}><div className="wcc-tom-rise"><CactomTomArt variant="maestro" expression="animado"/></div></div>
  <div className="wcc-actor wcc-drummer"><div className="wcc-hop"><Drummer/></div></div>
  <div className="wcc-actor wcc-flutist"><div className="wcc-hop"><Flutist/></div></div>
  <div className="wcc-actor wcc-guitarist"><div className="wcc-hop"><Guitarist/></div></div>
  {CONCERT_BEATS.drum.map((t,i)=><span key={'r'+i} className="wcc-ripple" style={v({'--d':`${t}s`})}/>)}
  <div className="wcc-pulses" aria-hidden="true">{CONCERT_BEATS.drum.map((t,i)=><i key={i} style={v({'--d':`${t}s`})}/>)}</div>
  {CONCERT_BEATS.flute.map((t,i)=><span key={'n'+i} className="wcc-fly" style={v({'--d':`${t}s`,'--i':i})}><Note color={['#1f8a8c','#4a84c3','#f5a528'][i]}/></span>)}
  {CONCERT_BEATS.strum.map((t,i)=><span key={'s'+i} className="wcc-wave" style={v({'--d':`${t}s`})}/>)}
 </div>;
}
