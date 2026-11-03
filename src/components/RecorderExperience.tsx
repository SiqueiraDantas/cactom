import { useEffect, useId, useRef, useState } from 'react';
import { ActivityCoach } from './ActivityExperience';
import { LabIcon } from './LearningHome';
import { RECORDER_HOLES, HOLE_FINGERS, RECORDER_NOTES, recorderNote, type RecorderSystem } from '../lib/recorder';
import { advanceVirtualProgress, freshVirtualProgress } from '../lib/virtualTrumpet';
import { ReferenceTone } from '../lib/referenceTone';
import './recorder.css';
import { markPracticeDay } from '../lib/practiceDay';
import { useProfileStorage } from './ProfileStorage';
import type { ProfileStorage } from '../lib/profileStorage';

export function RecorderDiagram({holes,interactive=false,compact=false,onToggle}:{holes:readonly number[];interactive?:boolean;compact?:boolean;onToggle?:(hole:number)=>void}){
  const artId=useId().replace(/:/g,'');
  const hole=(n:number)=><button type="button" key={n} className={'recorder-hole '+(holes.includes(n)?'covered':'open')} disabled={!interactive} aria-label={`Furo ${n}${n===0?', atrás':''}, ${HOLE_FINGERS[n]}, ${holes.includes(n)?'fechado':'aberto'}`} aria-pressed={holes.includes(n)} onClick={()=>onToggle?.(n)}><b>{n}</b><span className="recorder-hole-dots"><i/>{n>=6&&<i/>}</span><small>{n===0?'Polegar atrás':HOLE_FINGERS[n]}</small></button>;
  return <div className={`recorder-diagram ${compact?'recorder-diagram--compact':''}`} role="group" aria-label="Digitação da flauta doce: furo 0 atrás; furos 1 a 7 na frente"><div className="recorder-thumb">{hole(0)}<span>ATRÁS</span></div><div className="recorder-body"><svg className="recorder-realistic-art" viewBox="0 0 320 620" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs><linearGradient id={artId+'-ivory'}><stop stopColor="#b8a786"/><stop offset=".22" stopColor="#f0e8d3"/><stop offset=".48" stopColor="#fffbed"/><stop offset=".78" stopColor="#e2d6b8"/><stop offset="1" stopColor="#ac9874"/></linearGradient><linearGradient id={artId+'-dark'}><stop stopColor="#302a26"/><stop offset=".4" stopColor="#635547"/><stop offset=".65" stopColor="#423930"/><stop offset="1" stopColor="#252320"/></linearGradient></defs>
    <ellipse cx="110" cy="602" rx="43" ry="7" fill="#174a4510"/>
    <path d="M94 12Q110 7 126 12L130 61Q146 83 141 117L132 149 128 180 126 508Q126 535 139 555L145 581Q110 602 75 581L81 555Q94 535 94 508L92 180 88 149 79 117Q74 83 90 61Z" fill={'url(#'+artId+'-ivory)'} stroke="#a8987b" strokeWidth="1.5"/>
    <path d="M94 12Q110 7 126 12L128 42Q110 47 92 42Z" fill={'url(#'+artId+'-dark)'}/>
    <path d="M90 63Q110 72 130 63M80 111Q110 120 140 111M89 150Q110 156 132 150M93 175H128M94 512H126M83 552Q110 562 137 552M78 572Q110 585 142 572" fill="none" stroke="#af9d7c" strokeWidth="3"/>
    <rect x="99" y="83" width="22" height="16" rx="2" fill="#4a4034"/><path d="m99 101 11 20 11-20" fill="#d2c09b" stroke="#b7a27a"/>
    <path d="M101 184v315" stroke="white" strokeOpacity=".45" strokeWidth="3"/>
  </svg><span className="recorder-front-label">FRENTE</span>{RECORDER_HOLES.slice(1).map(hole)}<div className="recorder-foot" aria-hidden="true"/></div><p>● fechado · ○ aberto<br/>6 e 7: cubra as duas aberturas.</p></div>;
}
export function RecorderDiscovery({pressed,seen,onToggle,showGuidance=true}:{showGuidance?:boolean;pressed:readonly number[];seen:readonly number[];onToggle:(n:number)=>void}){
  const next=RECORDER_HOLES.find(n=>!seen.includes(n));
  return <>{showGuidance&&<><div className="activity-heading"><span className="activity-eyebrow">PRIMEIRA DESCOBERTA · FLAUTA DOCE</span><h1>Uma flauta, muitas descobertas.</h1><p>Conheça os sete furos da frente e o polegar de trás.</p></div><ActivityCoach recorder hint="Mão esquerda em cima. Mão direita embaixo.">{seen.length?`Boa! Explore agora o furo ${next??7}.`:'Vamos descobrir onde cada dedo fica?'}</ActivityCoach></>}<section className="recorder-discovery"><div className="discovery-stage-heading"><span className="activity-eyebrow">TOQUE EM CADA FURO DO DESENHO</span><b>{seen.length}/8 descobertos</b></div><RecorderDiagram holes={pressed} interactive onToggle={onToggle}/><p>Este desenho ensina as posições. Na prática com o instrumento, o microfone verifica o som.</p></section></>;
}
const TOUCH_KEY='mis-music-lab-recorder-touch-v1';
function initialTouch(system:RecorderSystem,storage:ProfileStorage):number[]{try{const value=JSON.parse(storage.getItem(TOUCH_KEY+'-'+system)??'[]');return Array.isArray(value)?value.filter((n):n is number=>Number.isInteger(n)&&n>=0&&n<RECORDER_NOTES.length):[];}catch{return [];}}
export function RecorderTouchLab({system,onExit}:{system:RecorderSystem;onExit:()=>void}){
  const storage=useProfileStorage();
  const [done,setDone]=useState(()=>initialTouch(system,storage)),[index,setIndex]=useState(()=>{const saved=initialTouch(system,storage);const next=RECORDER_NOTES.findIndex((_,i)=>!saved.includes(i));return next<0?RECORDER_NOTES.length:next;});
  const [holes,setHoles]=useState<number[]>([]),[percent,setPercent]=useState(0),[error,setError]=useState('');
  const hold=useRef(freshVirtualProgress()),tone=useRef(new ReferenceTone()),holesRef=useRef(holes);holesRef.current=holes;
  const note=index<RECORDER_NOTES.length?recorderNote(RECORDER_NOTES[index].writtenMidi,system):null;
  useEffect(()=>()=>tone.current.stop(),[]);
  useEffect(()=>{try{storage.setItem(TOUCH_KEY+'-'+system,JSON.stringify(done));}catch{/* Session remains usable. */}},[done,system,storage]);
  useEffect(()=>{
    hold.current=freshVirtualProgress();setPercent(0);
    if(!note)return;
    const id=setInterval(()=>{
      const now=performance.now(),next=advanceVirtualProgress(hold.current,document.hidden?null:holesRef.current,note.holes!,now,1200);
      hold.current=next;setPercent(next.matchedSince===null?0:Math.min(100,(now-next.matchedSince)/1200*100));
      if(next.completed){markPracticeDay(storage);clearInterval(id);setDone(previous=>[...new Set([...previous,index])]);setIndex(index+1);}
    },90);
    return ()=>clearInterval(id);
  },[index,system]);
  const play=()=>{if(note)void tone.current.play(note).catch(()=>setError('Não foi possível reproduzir a referência.'));};
  return <main className="recorder-touch-page"><header><button className="back-to-trail" type="button" onClick={onExit}>← Voltar à trilha</button><span className="activity-eyebrow">EXPLORAÇÃO POR TOQUE · FLAUTA DOCE</span></header><div className="activity-heading"><h1>{note?`Vamos montar ${note.label}?`:'Sua mão já conhece novos caminhos!'}</h1><p>Experimente as posições no desenho. Este treino não usa câmera nem avalia o som do instrumento.</p></div>{note?<section className="recorder-touch-card"><div className="recorder-touch-target"><span>FECHAR OS FUROS</span><b>{note.holes!.join(' · ')}</b><strong>{note.label}</strong><button type="button" className="activity-secondary" onClick={play}>♪ Ouvir referência</button></div><RecorderDiagram holes={holes} interactive onToggle={n=>{tone.current.stop();setHoles(previous=>previous.includes(n)?previous.filter(v=>v!==n):[...previous,n]);}}/><p>Monte a combinação e mantenha por 1,2 segundo.</p><div className="sound-hold-progress" role="progressbar" aria-label="Combinação mantida" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}><span style={{width:`${percent}%`}}/></div><span className="activity-eyebrow">{index+1} DE {RECORDER_NOTES.length} POSIÇÕES</span></section>:<section className="recorder-touch-card"><LabIcon name="check" size={48}/><p>As {done.length} posições foram exploradas. O progresso por toque fica separado das aulas com microfone.</p><button className="activity-primary" type="button" onClick={()=>{setDone([]);setIndex(0);setHoles([]);}}>EXPERIMENTAR DE NOVO</button></section>}{error&&<p role="alert" className="activity-error">{error}</p>}</main>;
}
