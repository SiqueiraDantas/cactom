import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { attachFloatingFooter } from '../lib/floatingFooter';
import { ActivityIntroduction, type IntroductionContent } from './ActivityIntroduction';
import { LabIcon } from './LearningHome';
import './cactom-activity.css';
import { CactomWordmark, TomOfficial } from './CactomBrand';
import type { TomExpression } from './CactomTomArt';

export type ActivityTool = {
  id:string; label:string; title:string; icon:ReactNode; content:ReactNode;
};

type ShellProps = {
  title:string; lessonNumber:number; completed:number; total:number;
  soundOn?:boolean; onSound?:()=>void; onExit:()=>void;
  children:ReactNode; footer:ReactNode; success:boolean;
  tools:readonly ActivityTool[];
  introduction?:IntroductionContent;
};

export function ActivityShell({title,lessonNumber,completed,total,soundOn,onSound,onExit,children,footer,success,tools,introduction}:ShellProps) {
  const [introDismissed,setIntroDismissed]=useState(false);
  const [portalHost,setPortalHost]=useState<HTMLElement|null>(null);
  useEffect(()=>{setPortalHost(document.body);},[]);
  const showIntroduction=!!introduction&&!introDismissed&&!success;
  const mainRef=useRef<HTMLElement>(null);
  const shellRef=useRef<HTMLDivElement>(null),footerRef=useRef<HTMLElement>(null);
  useEffect(()=>{
    const footer=footerRef.current,shell=shellRef.current;
    if(showIntroduction||!portalHost||!footer||!shell)return;
    return attachFloatingFooter(footer,shell);
  },[showIntroduction,portalHost]);
  useEffect(()=>{mainRef.current?.focus({preventScroll:true});},[showIntroduction]);
  const proceed=()=>{setIntroDismissed(true);window.scrollTo({top:0,behavior:'instant'});};
  const percent=Math.round(Math.min(1,completed/Math.max(1,total))*100);
  const [activeId,setActiveId]=useState<string|null>(null);
  const activeTool=tools.find(tool=>tool.id===activeId);
  const toolButtons=useRef(new Map<string,HTMLButtonElement>());
  const panelHeading=useRef<HTMLHeadingElement>(null);
  const activeToolId=activeTool?.id;
  const closeTool=()=>{
    setActiveId(null);
    if(activeId)toolButtons.current.get(activeId)?.focus({preventScroll:true});
  };
  useEffect(()=>{
    if(activeId&&!activeToolId)setActiveId(null);
    if(activeToolId)panelHeading.current?.focus({preventScroll:true});
  },[activeId,activeToolId]);
  useEffect(()=>{
    if(!activeId)return;
    const onKey=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){
        event.preventDefault();
        setActiveId(null);
        toolButtons.current.get(activeId)?.focus({preventScroll:true});
      }
    };
    document.addEventListener('keydown',onKey);
    return ()=>document.removeEventListener('keydown',onKey);
  },[activeId]);
  const floatingControls=<div className="activity-session activity-session--focused activity-floating-controls" style={{display:'contents'}}>
    <footer ref={footerRef} className={`session-footer ${success?'positive':''}`} style={{position:'fixed',left:'50%',right:'auto',bottom:'calc(max(12px, env(safe-area-inset-bottom, 0px)) + var(--activity-viewport-bottom, 0px))',transform:'translateX(-50%)',width:'calc(100% - 24px)',maxWidth:'600px',zIndex:60}}>
      <div className="session-footer-inner">{footer}</div>
    </footer>
  </div>;
  return <div ref={shellRef} className={`activity-session ${success?'session-complete':''} ${showIntroduction?'activity-session--introduction':'activity-session--focused'}`}>
    <header className="session-header">
      <button className="session-exit" type="button" onClick={onExit} aria-label="Voltar à trilha" title="Voltar à trilha">×</button>
      <div className="session-progress-block"><div className="session-progress-caption"><span>{lessonNumber>0?`AULA ${String(lessonNumber).padStart(2,'0')}`:'PRÁTICA'} <i>·</i> {title}</span><b>{completed}/{total}</b></div><div className="session-progress" role="progressbar" aria-label="Progresso da atividade" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><span style={{width:`${percent}%`}}><i/></span></div></div>
      {onSound&&<button type="button" className={`session-sound ${soundOn?'enabled':''}`} onClick={onSound} aria-label={soundOn?'Desativar aviso sonoro de acerto':'Ativar aviso sonoro de acerto'} aria-pressed={soundOn}>{soundOn?'♪':'♪̸'}</button>}
      <button type="button" className="session-brand brand-home" onClick={onExit} aria-label="Cactom: voltar ao início" title="Voltar ao início"><CactomWordmark/></button>
    </header>
    <div className={`session-workspace ${activeTool?'tools-open':''}`}>
      {!showIntroduction&&<aside className="activity-toolbox" aria-label="Ferramentas da atividade">
        <nav className="activity-tool-icons" aria-label="Informações e recursos">{tools.map(tool=><button
          key={tool.id} type="button"
          ref={element=>{if(element)toolButtons.current.set(tool.id,element);else toolButtons.current.delete(tool.id);}}
          className={activeId===tool.id?'active':''}
          title={tool.title} aria-label={tool.title} aria-expanded={activeId===tool.id}
          aria-controls={activeId===tool.id?'activity-tool-panel':undefined}
          onClick={()=>activeId===tool.id?closeTool():setActiveId(tool.id)}
        >{tool.icon}<span>{tool.label}</span></button>)}</nav>
        {activeTool&&<section className="activity-tool-panel" id="activity-tool-panel" role="region" aria-labelledby="activity-tool-title">
          <header><h2 id="activity-tool-title" ref={panelHeading} tabIndex={-1}>{activeTool.title}</h2><button type="button" onClick={closeTool} aria-label="Fechar painel de informações" title="Fechar (Esc)">×</button></header>
          <div className="activity-tool-content" key={activeTool.id}>{activeTool.content}</div>
        </section>}
      </aside>}
      <main className="session-main" ref={mainRef} tabIndex={-1} aria-label={showIntroduction?'Apresentação da aula':title}>{showIntroduction&&introduction?<ActivityIntroduction content={introduction} onProceed={proceed}/>:children}</main>
    </div>
    {!showIntroduction&&(portalHost?createPortal(floatingControls,portalHost):floatingControls)}
  </div>;
}

export function ActivityCoach({children,hint,expression='feliz'}: {children:ReactNode;hint?:string;recorder?:boolean;expression?:TomExpression}) {
  return <div className="activity-coach"><div className="coach-mascot"><TomOfficial decorative expression={expression}/></div><div className="coach-bubble"><b>{children}</b>{hint&&<p>{hint}</p>}</div></div>;
}

export function DiscoveryActivity({pressed,seen,onToggle,showGuidance=true}: {showGuidance?:boolean;pressed:readonly number[];seen:readonly number[];onToggle:(n:number)=>void}) {
  const next=[1,2,3].find(n=>!seen.includes(n));
  return <>
    {showGuidance&&<>
    <div className="activity-heading"><span className="activity-eyebrow">PRIMEIRA DESCOBERTA</span><h1>Prazer, seu trompete!</h1><p>Três pistos. Três dedos. Um mundo de música.</p></div>
    <ActivityCoach hint="A mão direita toca os pistos. A esquerda segura o instrumento.">{seen.length===0?'Bora conhecer os três pistos?':`Boa! Agora experimente o pisto ${next}.`}</ActivityCoach>
    </>}
    <section className="discovery-stage" aria-label="Explore os três pistos"><div className="discovery-stage-heading"><span className="activity-eyebrow">TOQUE EM CADA PISTO</span><span className="exploration-count">{seen.length} de 3 descobertos</span></div>
      <div className="piston-cards">{[1,2,3].map(n=>{
        const explored=seen.includes(n);const down=pressed.includes(n);
        return <button key={n} type="button" className={`piston-card piston-${n} ${explored?'explored':''} ${down?'is-pressed':''}`} aria-label={`Pisto ${n}, dedo ${['indicador','médio','anelar'][n-1]}`} aria-pressed={down} onClick={()=>onToggle(n)}>
          <span className="piston-number">{n}</span><span className="piston-discovered" aria-label={explored?'Explorado':'Ainda não explorado'}>{explored?<LabIcon name="check" size={16}/>:<span/>}</span>
          <svg className="piston-art" viewBox="0 0 110 150" fill="none" aria-hidden="true"><ellipse cx="55" cy="137" rx="31" ry="6" fill="#e1e7db"/><rect x="28" y="67" width="54" height="64" rx="16" fill="var(--piston-body)" stroke="var(--piston-edge)" strokeWidth="3"/><path d="M37 85h36m-36 13h36m-36 13h36" stroke="white" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round"/><rect x="26" y="66" width="58" height="13" rx="6" fill="var(--piston-cap)" stroke="var(--piston-edge)" strokeWidth="2"/><g className="piston-plunger"><rect x="48" y="31" width="14" height="38" rx="5" fill="var(--piston-body)" stroke="var(--piston-edge)" strokeWidth="2"/><ellipse cx="55" cy="31" rx="33" ry="12" fill="var(--piston-edge)"/><ellipse cx="55" cy="25" rx="33" ry="12" fill="var(--piston-cap)" stroke="var(--piston-edge)" strokeWidth="2"/><path d="M36 22q18-8 37 0" stroke="white" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round"/></g></svg>
          <strong>{['Indicador','Médio','Anelar'][n-1]}</strong><small>{down?'Pressionado':explored?'Pode tocar de novo':'Toque para descobrir'}</small>
        </button>;
      })}</div>
      <div className="discovery-under-note"><LabIcon name="hand" size={19}/><span>Imagine sua mão direita sobre o trompete.</span></div>
    </section>
  </>;
}

export function ActivityVictory({discovery,total,recorder=false}: {discovery:boolean;total:number;recorder?:boolean}) {
  return <section className="activity-victory" aria-live="polite"><div className="victory-confetti" aria-hidden="true"><i/><i/><i/><i/><i/><i/></div><div className="victory-mascot"><TomOfficial decorative expression="comemorando"/></div><span className="activity-eyebrow">MAIS UMA DESCOBERTA NA BAGAGEM</span><h1>{discovery?(recorder?'Você já conhece os furos!':'Você já conhece os pistos!'):'Esse som é uma conquista!'}</h1><p>{discovery?(recorder?'Duas mãos, oito posições: agora vamos descobrir suas primeiras notas.':'Indicador, médio e anelar: seu trio já está pronto para começar a fazer música.'):'Você concluiu os exercícios desta aula. Respire, comemore e continue no seu ritmo.'}</p><div className="victory-facts"><span><LabIcon name="check" size={23}/><b>{total} {discovery?(recorder?'furos explorados':'pistos explorados'):total===1?'etapa concluída':'etapas concluídas'}</b><small>UM PASSO DE CADA VEZ</small></span><span><LabIcon name="star" size={23}/><b>Progresso registrado</b><small>A JORNADA É SUA</small></span></div></section>;
}
