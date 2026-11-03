import { useEffect, useRef, useState, type Ref } from 'react';
import { boundedTomGaze, tomGazeStep, tomPresentation, tomRestingGaze, type TomFocus, type TomGaze, type TomMood, type TomOutcome, type TomPresentation } from '../lib/tomMotion';
import type { TomExpression } from './CactomTomArt';
import { TomCharacter } from './TomCharacter';
import './tom-motion.css';
import {ACCESS_COPY,accessTomCaption,type AccessLocale} from '../lib/accessLocale';

/** Form state → Tom's face. Privacy always wins over the other faces (he covers his eyes). */
export function tomExpressionFor(presentation:Pick<TomPresentation,'mood'|'covered'>):TomExpression{
  if(presentation.covered)return 'privacidade';
  const map:Record<TomMood,TomExpression>={idle:'feliz',listening:'concentrado',privacy:'privacidade',waiting:'pensativo',success:'comemorando',error:'triste'};
  return map[presentation.mood];
}
/** Pupil offset in SVG user units (the vector Tom is 400 units wide). */
export function tomGazeTransform(gaze:TomGaze){
  return `translate(${(gaze.x*.36).toFixed(2)}px,${(gaze.y*.4).toFixed(2)}px)`;
}

export function TomArtwork({presentation,className='',reactRef}:{presentation:TomPresentation;className?:string;reactRef?:Ref<HTMLDivElement>}){
  const expression=tomExpressionFor(presentation);
  return <div className={`tom-rig ${className}`} aria-hidden="true" data-mood={presentation.mood} data-covered={presentation.covered}>
    <div className="tom-react" ref={reactRef}><div className="tom-lean"><div className="tom-face" key={expression}><TomCharacter expression={expression}/></div></div></div>
  </div>;
}

type Props={locale?:AccessLocale;focus:TomFocus;busy:boolean;outcome:TomOutcome;showPassword:boolean};
const EASE_OUT='cubic-bezier(.22,1,.36,1)';
function react(kind:'cover'|'uncover'|'success'|'error',body:HTMLElement|null){
  if(!body?.animate)return [];
  const timing=(duration:number):KeyframeAnimationOptions=>({duration,easing:'linear'});
  if(kind==='cover'||kind==='uncover')return [body.animate([
    {transform:'translate3d(0,0,0) scale(1,1)',easing:'cubic-bezier(.5,0,.75,0)'},
    {transform:'translate3d(0,4%,0) scale(1.06,.92)',offset:.35,easing:EASE_OUT},
    {transform:'translate3d(0,-2%,0) scale(.97,1.04)',offset:.72,easing:'ease-in-out'},
    {transform:'translate3d(0,0,0) scale(1,1)'}],timing(380))];
  if(kind==='success')return [body.animate([
    {transform:'translate3d(0,0,0) scale(1,1)',easing:'cubic-bezier(.5,0,.75,0)'},
    {transform:'translate3d(0,3%,0) scale(1.1,.88)',offset:.16,easing:'cubic-bezier(.2,.75,.35,1)'},
    {transform:'translate3d(0,-16%,0) scale(.92,1.1)',offset:.5,easing:'cubic-bezier(.55,0,.8,.3)'},
    {transform:'translate3d(0,0,0) scale(1.08,.92)',offset:.8,easing:EASE_OUT},
    {transform:'translate3d(0,0,0) scale(1,1)'}],timing(760))];
  return [body.animate([
    {transform:'translate3d(0,0,0) rotate(0)',easing:'ease-out'},
    {transform:'translate3d(-3%,0,0) rotate(-3deg)',offset:.18,easing:'ease-in-out'},
    {transform:'translate3d(2.4%,0,0) rotate(2.4deg)',offset:.4,easing:'ease-in-out'},
    {transform:'translate3d(-1.3%,0,0) rotate(-1.2deg)',offset:.62,easing:'ease-in-out'},
    {transform:'translate3d(.5%,0,0) rotate(.4deg)',offset:.82,easing:'ease-in-out'},
    {transform:'translate3d(0,0,0) rotate(0)'}],timing(620))];
}

/** Tom on the login/sign-up form. Receives only booleans and pointer coordinates — never typed text. */
export function TomInteractive(props:Props){
  const root=useRef<HTMLDivElement>(null),body=useRef<HTMLDivElement>(null);
  const [reduced,setReduced]=useState(true),[paused,setPaused]=useState(false);
  const presentation=tomPresentation({focus:props.focus,busy:props.busy,outcome:props.outcome,showPassword:props.showPassword,reducedMotion:true});
  const live=useRef({follow:true,rest:{x:0,y:0} as TomGaze,wake:()=>{}});
  live.current.follow=!presentation.covered&&!props.busy&&props.outcome==='idle';
  live.current.rest=presentation.covered||reduced||paused?{x:0,y:0}:tomRestingGaze(presentation.mood);

  useEffect(()=>{
    const preference=window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let onScreen=true;
    const sync=()=>{setReduced(preference?.matches??true);setPaused(document.hidden||!onScreen);};
    const observer=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{onScreen=entries[0]?.isIntersecting??true;sync();}):null;
    if(root.current)observer?.observe(root.current);
    sync();
    preference?.addEventListener?.('change',sync);document.addEventListener('visibilitychange',sync);
    return ()=>{observer?.disconnect();preference?.removeEventListener?.('change',sync);document.removeEventListener('visibilitychange',sync);};
  },[]);

  // Pupils follow the mouse (or look at the form) with a damped follower; the loop sleeps once settled.
  useEffect(()=>{
    const pupils=()=>root.current?.querySelector<SVGGElement>('.ct-pupils')??null;
    if(reduced||paused){const p=pupils();if(p)p.style.transform='';live.current.wake=()=>{};return;}
    const fine=window.matchMedia?.('(hover: hover) and (pointer: fine)');
    let frame:number|null=null,last=0,current={x:0,y:0},pointer:TomGaze|null=null;
    const target=()=>live.current.follow&&pointer?pointer:live.current.rest;
    const tick=(now:number)=>{
      const goal=target(),next=tomGazeStep(current,goal,last?now-last:16);last=now;
      const settled=Math.abs(next.x-goal.x)+Math.abs(next.y-goal.y)<.08;
      current=settled?{...goal}:next;
      const p=pupils();if(p){p.style.animation='none';p.style.transform=tomGazeTransform(current);}
      frame=settled?null:requestAnimationFrame(tick);
    };
    const wake=()=>{if(frame===null){last=0;frame=requestAnimationFrame(tick);}};
    const move=(event:PointerEvent)=>{
      if(event.pointerType!=='mouse'||!fine?.matches||!root.current)return;
      pointer=boundedTomGaze({x:event.clientX,y:event.clientY},root.current.getBoundingClientRect());
      if(live.current.follow)wake();
    };
    const leave=()=>{pointer=null;wake();};
    live.current.wake=wake;wake();
    window.addEventListener('pointermove',move,{passive:true});document.documentElement.addEventListener('pointerleave',leave);window.addEventListener('blur',leave);
    return ()=>{if(frame!==null)cancelAnimationFrame(frame);live.current.wake=()=>{};window.removeEventListener('pointermove',move);document.documentElement.removeEventListener('pointerleave',leave);window.removeEventListener('blur',leave);};
  },[reduced,paused]);
  // A new face re-mounts the pupils group: re-apply the current gaze.
  useEffect(()=>{live.current.wake();},[presentation.mood,presentation.covered,props.busy]);

  const previous=useRef({covered:presentation.covered,outcome:props.outcome});
  useEffect(()=>{
    const before=previous.current;previous.current={covered:presentation.covered,outcome:props.outcome};
    if(reduced||paused)return;
    let kind:Parameters<typeof react>[0]|null=null;
    if(props.outcome!==before.outcome&&props.outcome!=='idle')kind=props.outcome;
    else if(presentation.covered!==before.covered)kind=presentation.covered?'cover':'uncover';
    if(!kind)return;
    const running=react(kind,body.current);
    return ()=>running.forEach(animation=>animation.cancel());
  },[presentation.covered,props.outcome,reduced,paused]);

  return <div ref={root} className="tom-interactive" data-reduced={reduced} data-paused={paused} data-mood={presentation.mood}>
    <span className="tom-accessible-name" role="img" aria-label={ACCESS_COPY[props.locale??'pt-BR'].tomName}/>
    <TomArtwork presentation={presentation} reactRef={body}/>
    <span className="access-tom-greeting" aria-live="polite" aria-atomic="true">{accessTomCaption(presentation,props.locale??'pt-BR')}</span>
  </div>;
}
