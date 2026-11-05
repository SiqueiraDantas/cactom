import { useEffect, useId, useState } from 'react';
import { readStreak, streakSummary, normalizeStreakLedger, type StreakLedger, type StreakSummary } from '../lib/streak';
import { STREAK_INSIGNIAS, insigniaForStreak, type StreakInsignia } from '../lib/streakInsignias';
import { useProfileStorage } from './ProfileStorage';
import { StreakFlame } from './LabIllustrations';
import './streak.css';
import './cactom-dashboard.css';
import './practice-hub.css';
import './rojao-hub.css';
import './rojao-v2.css';
import {TomOfficial} from './CactomBrand';
export function useStreakStatus(){
  const storage=useProfileStorage(),[ledger,setLedger]=useState(()=>readStreak(storage)),[now,setNow]=useState(()=>Date.now()),[saved,setSaved]=useState(()=>storage.isPersistent());
  useEffect(()=>{
    const clock=()=>setNow(Date.now());
    const refresh=()=>{setLedger(readStreak(storage));setSaved(storage.isPersistent());clock();};
    const practiced=(event:Event)=>{const detail=(event as CustomEvent<{profileId:string|null;ledger:StreakLedger;persisted:boolean}>).detail;if(detail?.profileId!==storage.profileId)return;setLedger(normalizeStreakLedger(detail.ledger));setSaved(detail.persisted&&storage.isPersistent());clock();};
    window.addEventListener('mis-practice-day',practiced);window.addEventListener('storage',refresh);window.addEventListener('focus',refresh);
    const timer=setInterval(clock,30000);
    return ()=>{clearInterval(timer);window.removeEventListener('mis-practice-day',practiced);window.removeEventListener('storage',refresh);window.removeEventListener('focus',refresh);};
  },[storage]);
  return {summary:streakSummary(ledger,now),saved};
}
export function StreakWeek({summary}:{summary:StreakSummary}){
  return <div className="streak-week" aria-label="Prática nos últimos sete dias">{summary.week.map(day=><div key={day.date} className={`streak-day ${day.practiced?'practiced':''} ${day.isToday?'today':''}`} aria-label={`${day.date}: ${day.practiced?'praticou':'sem prática registrada'}${day.isToday?', hoje':''}`}><span>{day.weekday}</span><b>{day.practiced?<StreakFlame size={25}/>:day.isToday?<i/>:'·'}</b><small>{day.isToday?'HOJE':day.date.slice(8)}</small></div>)}</div>;
}
export function StreakCard({summary,onOpen}:{summary:StreakSummary;onOpen:()=>void}){
  return <section className="daily-goal-card"><div className="daily-goal-heading"><span>SEU ROJÃO, TODO DIA</span><StreakFlame active={summary.currentStreak>0} size={29}/></div><h2>{summary.currentStreak} <span>{summary.currentStreak===1?'dia seguido':'dias seguidos'}</span></h2><CurrentInsignia days={summary.currentStreak} compact/><p>{summary.practicedToday?'A prática de hoje já está na bagagem.':'Uma pequena prática pode virar um grande hábito.'}</p><StreakWeek summary={summary}/><div className={`daily-goal-check ${summary.practicedToday?'done':''}`}><b>{summary.practicedToday?'✓':'○'}</b><span>{summary.practicedToday?'Meta de hoje concluída':'Meta: concluir uma etapa'}</span><small>{summary.dailyGoal.completed}/1</small></div><button type="button" onClick={onOpen}>VER SEU ROJÃO <span>→</span></button></section>;
}
function StreakIcon({name}:{name:'arrow'|'check'|'award'|'sun'|'chevron'}){
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name==='arrow'?<path d="M5 12h14m-6-6 6 6-6 6"/>:name==='check'?<path d="m5 12 4 4L19 6"/>:name==='chevron'?<path d="m8 10 4 4 4-4"/>:name==='award'?<><path d="M8 3h8v7a4 4 0 0 1-8 0Zm4 11v5m-4 2h8M8 5H4v3a5 5 0 0 0 5 5m7-8h4v3a5 5 0 0 1-5 5"/></>:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>}
  </svg>;
}

function InsigniaArtwork({insignia,className='',priority=false}:{insignia:StreakInsignia;className?:string;priority?:boolean}){
  return <img className={`rojao-insignia-art ${className}`} src={insignia.artwork} width="1122" height="1402" alt="" aria-hidden="true" loading={priority?'eager':'lazy'} decoding="async" fetchPriority={priority?'high':undefined} draggable={false}/>;
}

function CurrentInsignia({days,compact=false}:{days:number;compact?:boolean}){
  const insignia=insigniaForStreak(days);
  if(!insignia)return null;
  return <span className={`rojao-current-insignia ${compact?'compact':''}`} data-insignia={insignia.id}><InsigniaArtwork insignia={insignia}/>{!compact&&<small>Insígnia atual</small>}<b>{insignia.name}</b></span>;
}

export function StreakScreen({summary,onPractice,saved=true}:{summary:StreakSummary;onPractice:()=>void;instrument:string;saved?:boolean}){
  const currentInsignia=insigniaForStreak(summary.currentStreak);
  const next=STREAK_INSIGNIAS.find(insignia=>insignia.days>summary.currentStreak);
  const missing=next?next.days-summary.currentStreak:0;
  const nextPct=next?Math.round(summary.currentStreak/next.days*100):100;
  const practicedWeek=summary.week.filter(day=>day.practiced).length;
  const id=useId();
  return <div className="streak-screen practice-hub rojao-hub rojao-v2">
    <section className="rojao-v2-hero" aria-labelledby={id+'-count'}>
      <span className="rojao-v2-art">{currentInsignia?<InsigniaArtwork insignia={currentInsignia} priority/>:<TomOfficial decorative expression={summary.practicedToday?'orgulhoso':'animado'}/>}</span>
      <div className="rojao-v2-copy">
        <span className="rojao-v2-eyebrow"><StreakFlame active={summary.currentStreak>0} size={18}/> SEU ROJÃO</span>
        <h1 id={id+'-count'}><strong>{summary.currentStreak}</strong><span>{summary.currentStreak===1?'dia seguido':'dias seguidos'}</span></h1>
        <p>{summary.practicedToday?'Hoje já teve música. Volta amanhã pra não deixar o rojão apagar!':summary.currentStreak>0?'Faz uma etapa hoje pra não largar a corda do rojão.':'Bora começar? Uma etapa já é teu primeiro passo.'}</p>
        <div className="rojao-v2-chips">
          {currentInsignia&&<span>Insígnia: <b>{currentInsignia.name}</b></span>}
          <span>Recorde: <b>{summary.bestStreak} {summary.bestStreak===1?'dia':'dias'}</b></span>
          <span>Dias com música: <b>{summary.totalDays}</b></span>
        </div>
      </div>
    </section>

    <section className="rojao-v2-card streak-calendar" aria-labelledby={id+'-week'}>
      <div className="rojao-v2-card-head"><h2 id={id+'-week'}>Esta semana</h2><span>{practicedWeek} de 7 dias com música</span></div>
      <StreakWeek summary={summary}/>
    </section>

    {next?<section className="rojao-v2-next" aria-labelledby={id+'-next'}>
      <span className="rojao-v2-next-art"><InsigniaArtwork insignia={next}/></span>
      <div className="rojao-v2-next-copy">
        <span className="rojao-v2-label">PRÓXIMA INSÍGNIA</span>
        <h2 id={id+'-next'}>{next.name} · {missing===1?'falta 1 dia':`faltam ${missing} dias`}</h2>
        <div className="rojao-v2-bar" role="progressbar" aria-label={`Progresso até ${next.name}`} aria-valuemin={0} aria-valuemax={next.days} aria-valuenow={summary.currentStreak}><span style={{width:`${nextPct}%`}}/></div>
      </div>
      <button className="practice-start rojao-v2-go" type="button" onClick={onPractice}><span>{summary.practicedToday?'Continuar praticando':'Praticar agora'}</span><StreakIcon name="arrow"/></button>
    </section>:<section className="rojao-v2-next" aria-label="Todas as insígnias conquistadas">
      <div className="rojao-v2-next-copy"><span className="rojao-v2-label">TODAS AS INSÍGNIAS</span><h2>Tu chegou no Estirão. Que rojão!</h2></div>
      <button className="practice-start rojao-v2-go" type="button" onClick={onPractice}><span>Continuar praticando</span><StreakIcon name="arrow"/></button>
    </section>}

    <section className="rojao-milestones" aria-labelledby={id+'-milestones'}>
      <div className="rojao-section-heading"><div><h2 id={id+'-milestones'}>Suas insígnias</h2><p>Marcos da sua maior sequência.</p></div></div>
      <div className="rojao-milestone-grid">{STREAK_INSIGNIAS.map(insignia=>{const earned=summary.bestStreak>=insignia.days;return <article className={earned?'earned':''} data-insignia={insignia.id} key={insignia.id}><span className="streak-medallion"><InsigniaArtwork insignia={insignia}/>{earned&&<i><StreakIcon name="check"/></i>}</span><b>{insignia.name}</b><span className="rojao-insignia-days">{insignia.days===30?'30 dias ou mais':`${insignia.days} ${insignia.days===1?'dia':'dias'}`}</span><small>{earned?'CONQUISTADA':'POR DESCOBRIR'}</small></article>;})}</div>
    </section>

    <details className="rojao-how"><summary><span className="rojao-how-icon"><StreakIcon name="sun"/></span><span>Como manter seu rojão?</span><StreakIcon name="chevron"/></summary><div><p>Conclua uma etapa válida em qualquer instrumento ou uma posição na exploração por toque. Uma prática por dia já conta; abrir o aplicativo não acrescenta um dia.</p><p>Os dias seguem o horário de Fortaleza. Conta local e demonstração têm registros separados.</p></div></details>
    {!saved&&<p className="rojao-save-notice" role="status">O navegador não conseguiu salvar sua sequência. Ela está disponível nesta sessão.</p>}
  </div>;
}
