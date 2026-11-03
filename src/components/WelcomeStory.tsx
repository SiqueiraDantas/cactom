import {useEffect,useRef,type CSSProperties} from 'react';
import './welcome-story.css';

/**
 * Abertura desenhada e contínua: menina com flauta, Tom dançando, estante e menino no tambor.
 * Um laço de requestAnimationFrame mexe cada personagem o tempo todo (respiração, balanço, pulos com
 * física, impacto da batida) e funde as poses desenhadas umas nas outras. Sem re-render do React por quadro.
 * Pausa fora da tela/aba oculta; movimento reduzido mostra a pose de descanso parada.
 */
export const STORY_SECONDS=1.2; // entrada; depois a cena segue em laço
const BPM=100,BEAT=60/BPM,BAR=BEAT*4;
const BASE='/branding/cactom/abertura/';
const PANEL={w:767,h:335};
const BOX:Record<string,[number,number,number,number]>={"menina-1":[39,47,216,317],"tom-1":[226,104,386,309],"estante-1":[375,144,540,309],"menino-1":[545,58,680,317],"sol-1":[680,18,740,77],"menina-2":[27,51,203,316],"tom-2":[183,109,386,312],"menino-2":[543,51,697,316],"menina-3":[23,48,198,318],"tom-3":[201,54,387,311],"menino-3":[545,55,702,318],"menina-4":[22,53,194,318],"tom-4":[208,103,369,313],"menino-4":[551,61,699,318],"menina-5":[22,48,197,317],"tom-5":[203,43,397,297],"menino-5":[544,51,701,317],"menina-6":[26,50,199,317],"tom-6":[216,104,366,310],"menino-6":[548,53,688,317]};
type Actor='menina'|'tom'|'menino';
const ACTORS:Actor[]=['menina','tom','menino'];
const box=(key:string):CSSProperties=>{const [x0,y0,x1,y1]=BOX[key];return {left:`${x0/PANEL.w*100}%`,top:`${y0/PANEL.h*100}%`,width:`${(x1-x0)/PANEL.w*100}%`,height:`${(y1-y0)/PANEL.h*100}%`};};
/** Ponto de apoio (pés) de cada personagem, em % do palco, para girar/amassar a partir do chão. */
const FEET:Record<Actor,[number,number]>={menina:[16,94],tom:[39,93],menino:[80,94]};

export type Motion={pose:number;blend:number;from:number;x:number;y:number;sx:number;sy:number;rot:number};
const smooth=(x:number)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
/** Estado de cada personagem no instante t (segundos desde o início). Puro, para testes. */
export function storyMotion(actor:Actor,t:number):Motion{
 const intro=Math.min(1,t/.55),pop=intro<1?1-Math.pow(1-intro,3):1;
 const beatPos=(t%BEAT)/BEAT,beatIdx=Math.floor(t/BEAT),bar=Math.floor(t/BAR),inBar=Math.floor((t%BAR)/BEAT);
 const finale=bar%3===2&&inBar>=2; // a cada três compassos, todos comemoram juntos
 if(actor==='menino'){
  // bate nos tempos 1 e 3: sobe a baqueta antes, desce na batida; corpo afunda no impacto
  const hitBeat=inBar%2===0,k=beatPos;
  const pose=finale?3:hitBeat?(k<.18?4:1):(k>.55?2:1);
  const impact=hitBeat?Math.exp(-k*14):0;
  return {pose,from:pose,blend:1,x:0,y:impact*1.6+(1-pop)*8,sx:1+impact*.035,sy:1-impact*.045,rot:finale?Math.sin(t*9)*2.5:-impact*1.5};
 }
 if(actor==='menina'){
  // tocando: alterna as poses de sopro devagar, balança com a respiração
  const cycle=[2,3,4,5],slow=t/(BEAT*2),i=Math.floor(slow)%4,frac=slow%1;
  const pose=t<.9?1:finale?3:cycle[(i+1)%4],from=t<.9?1:finale?3:cycle[i];
  const breath=Math.sin(t*2*Math.PI/(BEAT*4));
  return {pose,from,blend:smooth((frac-.75)/.25),x:Math.sin(t*1.3)*.4,y:breath*.5+(1-pop)*8,sx:1-breath*.008,sy:1+breath*.012,rot:Math.sin(t*2*Math.PI/(BEAT*4))*2.2};
 }
 // Tom: dança no pulso. Tempo 1 acena, 2 pula de braços para cima, 3 agacha, 4 pula de novo.
 const seq=[2,3,4,5],pose=t<.9?1:finale?3:seq[inBar];
 const air=(inBar===1||inBar===3||finale)?Math.sin(Math.PI*Math.min(1,beatPos/.7)):0;
 const land=(inBar===2)?Math.exp(-beatPos*7):0;
 const jump=air*9;
 return {pose,from:pose,blend:1,x:Math.sin(beatIdx*1.7)*.6,y:-jump+land*1.5+(1-pop)*10,sx:1+land*.07-air*.03,sy:1-land*.09+air*.05,rot:Math.sin(t*2*Math.PI/BEAT/2)*4};
}

export type StoryPhase='waiting'|'playing'|'settled';
export function WelcomeStory({phase,paused,reduced=false,label,run=0}:{phase:StoryPhase;paused:boolean;reduced?:boolean;label:string;run?:number}){
 const active=phase!=='waiting';
 const stage=useRef<HTMLDivElement>(null),pausedRef=useRef(paused);pausedRef.current=paused;
 useEffect(()=>{
  const root=stage.current;if(!root)return;
  const actors=ACTORS.map(a=>({a,el:root.querySelector<HTMLElement>(`.wst-${a}`)!,imgs:[...root.querySelectorAll<HTMLImageElement>(`.wst-${a} img`)]}));
  const notes=[...root.querySelectorAll<HTMLElement>('.wst-note')],ring=root.querySelector<HTMLElement>('.wst-ring'),stand=root.querySelector<HTMLElement>('.wst-estante'),sun=root.querySelector<HTMLElement>('.wst-sol-wrap');
  // A pose nova aparece por cima da anterior (que fica inteira por baixo): sem fantasma translúcido.
  const show=(set:{imgs:HTMLImageElement[]},pose:number,from:number,blend:number)=>set.imgs.forEach((img,i)=>{const n=i+1;const fading=pose!==from&&blend<1;img.style.zIndex=n===pose?'2':'1';img.style.opacity=String(n===pose?(fading?blend:1):n===from&&fading?1:0);});
  if(reduced||!active){
   actors.forEach(s=>{show(s,!active?1:6,!active?1:6,1);s.el.style.transform='';});
   notes.forEach(n=>n.style.opacity='0');if(ring)ring.style.opacity='0';return;
  }
  let t=0,last=performance.now(),frame=0;
  const tick=(now:number)=>{
   const dt=Math.min(.05,(now-last)/1000);last=now;if(!pausedRef.current)t+=dt;
   for(const s of actors){const m=storyMotion(s.a,t);show(s,m.pose,m.from,m.blend);const [fx,fy]=FEET[s.a];
    s.el.style.transformOrigin=`${fx}% ${fy}%`;s.el.style.transform=`translate(${m.x}%,${m.y}%) rotate(${m.rot}deg) scale(${m.sx},${m.sy})`;}
   // notas saem da flauta e sobem ondulando
   notes.forEach((n,i)=>{const life=2.4,k=((t-1-i*.3)%life+life)%life/life;const on=t>1+i*.3;
    n.style.opacity=on?String(Math.min(1,k*5)*(1-k)):'0';n.style.transform=`translate(${Math.sin(k*6+i)*18+k*40}%,${-k*260}%) rotate(${Math.sin(k*5+i)*18}deg) scale(${.7+k*.5})`;});
   // onda do tambor e estante tremendo na batida
   const k=(t%(BEAT*2))/(BEAT*2);if(ring){ring.style.opacity=String(Math.max(0,1-k*2.2));ring.style.transform=`translate(-50%,-50%) scale(${.4+k*1.8})`;}
   if(stand)stand.style.transform=`rotate(${Math.exp(-k*10)*.8}deg)`;
   if(sun)sun.style.transform=`rotate(${t*12}deg) scale(${1+Math.sin(t*2)*.04})`;
   frame=requestAnimationFrame(tick);
  };
  frame=requestAnimationFrame(tick);
  return ()=>cancelAnimationFrame(frame);
 },[active,reduced,run]);
 return <div ref={stage} className="wst-stage" data-phase={phase} data-reduced={reduced} role="img" aria-label={label} key={run}>
  <div className="wst-sol-wrap" style={box('sol-1')}><span className="wst-rays" aria-hidden="true"/><img className="wst-sol" src={BASE+'sol-1.webp'} alt="" decoding="async"/></div>
  <img className="wst-part wst-estante" src={BASE+'estante-1.webp'} alt="" style={box('estante-1')} decoding="async"/>
  <span className="wst-ring" aria-hidden="true"/>
  {ACTORS.map(actor=><div className={`wst-actor wst-${actor}`} key={actor}>
   {[1,2,3,4,5,6].map(n=><img key={n} className="wst-part" data-pose={n} src={`${BASE}${actor}-${n}.webp`} alt="" style={{...box(`${actor}-${n}`),opacity:n===(phase==='settled'||reduced?6:1)?1:0}} decoding="async"/>)}
  </div>)}
  {[0,1,2,3,4,5,6].map(i=><span className="wst-note" key={i} aria-hidden="true" style={{'--c':['#1f6fd1','#f08a24','#1f6fd1','#3fae49','#f08a24','#1f6fd1','#3fae49'][i]} as CSSProperties}><svg viewBox="0 0 30 40"><path d="M20 4v24" stroke="var(--c)" strokeWidth="4.5" strokeLinecap="round"/><path d="M20 4q8 2 8 10" stroke="var(--c)" strokeWidth="4.5" fill="none" strokeLinecap="round"/><ellipse cx="13" cy="30" rx="8.5" ry="6.5" fill="var(--c)" transform="rotate(-20 13 30)"/></svg></span>)}
 </div>;
}
/** Compatibilidade com testes antigos: pose do personagem no instante t. */
export function storyPose(actor:Actor,t:number){return storyMotion(actor,t).pose;}
