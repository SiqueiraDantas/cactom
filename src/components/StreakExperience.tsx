import { useEffect, useId, useState } from 'react';
import { readStreak, streakSummary, normalizeStreakLedger, type StreakLedger, type StreakSummary } from '../lib/streak';
import { STREAK_INSIGNIAS, insigniaForStreak, type StreakInsignia } from '../lib/streakInsignias';
import { useProfileStorage } from './ProfileStorage';
import { StreakFlame } from './LabIllustrations';
import './streak.css';
import './cactom-dashboard.css';
import './practice-hub.css';
import './rojao-hub.css';
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
  const nextMilestone=STREAK_INSIGNIAS.find(insignia=>insignia.days>summary.bestStreak);
  const id=useId();
  return <div className="streak-screen practice-hub rojao-hub">
    <header className="practice-heading">
      <span className="practice-eyebrow"><StreakFlame active={summary.currentStreak>0} size={18}/> SEU RITMO, TODO DIA</span>
      <h1>Seu <span>Rojão.</span></h1>
      <p>Um pouco de música hoje. Mais um passo amanhã.</p>
    </header>

    <section className="practice-feature rojao-feature" aria-labelledby={id+'-count'}>
      <div className="practice-feature-copy">
        <span className="practice-kicker"><i/>{summary.practicedToday?'HOJE JÁ TEVE MÚSICA':'UM DIA PUXA O OUTRO'}</span>
        <div className="rojao-count" data-digits={String(summary.currentStreak).length}><strong>{summary.currentStreak}</strong><StreakFlame active={summary.currentStreak>0} size={48}/></div>
        <h2 id={id+'-count'}>{summary.currentStreak===1?'dia seguido!':'dias seguidos!'}</h2>
        <CurrentInsignia days={summary.currentStreak}/>
        <p className="practice-lesson-description">{summary.practicedToday?'A prática de hoje já entrou na sua história. Amanhã tem mais música.':summary.currentStreak>0?'Faz uma etapa hoje pra não largar a corda do rojão.':'Bora começar? Uma etapa já é teu primeiro passo.'}</p>
      </div>
      <div className={`practice-tom-scene ${currentInsignia?'rojao-badge-scene':''}`} aria-hidden="true">
        <span className="practice-tom-orbit"/>
        <span className="practice-tom-spark spark-one"/>
        <span className="practice-tom-spark spark-two"/>
        <>{currentInsignia?<InsigniaArtwork insignia={currentInsignia} className="rojao-feature-badge" priority/>:<TomOfficial decorative className="practice-tom" expression={summary.practicedToday?'orgulhoso':'animado'}/>}</>
        {!currentInsignia&&<span className="practice-tom-hello">{summary.practicedToday?'Massa! Até amanhã, visse?':'Bora segurar o rojão?'}</span>}
      </div>
      <div className="practice-feature-action"><button className="practice-start" type="button" onClick={onPractice}><span>{summary.practicedToday?'Continuar praticando':'Praticar hoje'}</span><StreakIcon name="arrow"/></button></div>
    </section>

    <section className="streak-calendar" aria-labelledby={id+'-week'}>
      <div className="rojao-section-heading"><div><h2 id={id+'-week'}>Sua semana musical</h2><p>Cada dia com música deixa sua marca.</p></div><span className={`rojao-today ${summary.practicedToday?'done':''}`} aria-label={`Meta de hoje: ${summary.dailyGoal.completed} de 1 etapa concluída`}>{summary.practicedToday?<StreakIcon name="check"/>:<span className="rojao-today-dot"/>}<span>Hoje <b>{summary.dailyGoal.completed}/1</b></span></span></div>
      <StreakWeek summary={summary}/>
      <p className="rojao-week-note"><span className="rojao-practiced-dot"/>Dia praticado<span className="rojao-today-outline"/>Hoje</p>
    </section>

    <div className="rojao-stats">
      <section className="rojao-stat rojao-stat--record"><span className="rojao-stat-icon"><StreakIcon name="award"/></span><span className="rojao-stat-label">SEU RECORDE</span><b>{summary.bestStreak}<small> {summary.bestStreak===1?'dia':'dias'}</small></b><p>Sua maior sequência até aqui.</p></section>
      <section className="rojao-stat rojao-stat--total"><span className="rojao-stat-icon"><StreakIcon name="sun"/></span><span className="rojao-stat-label">DIAS COM MÚSICA</span><b>{summary.totalDays}<small> {summary.totalDays===1?'dia':'dias'}</small></b><p>Cada retorno faz parte da história.</p></section>
    </div>

    <section className="rojao-milestones" aria-labelledby={id+'-milestones'}>
      <div className="rojao-section-heading"><div><h2 id={id+'-milestones'}>Suas insígnias</h2><p>Marcos da sua maior sequência.</p></div>{nextMilestone&&<span className="rojao-next-milestone">Próxima: <b>{nextMilestone.name}</b><small>{nextMilestone.days} {nextMilestone.days===1?'dia':'dias'}</small></span>}</div>
      <div className="rojao-milestone-grid">{STREAK_INSIGNIAS.map(insignia=>{const earned=summary.bestStreak>=insignia.days;return <article className={earned?'earned':''} data-insignia={insignia.id} key={insignia.id}><span className="streak-medallion"><InsigniaArtwork insignia={insignia}/>{earned&&<i><StreakIcon name="check"/></i>}</span><b>{insignia.name}</b><span className="rojao-insignia-days">{insignia.days===30?'30 dias ou mais':`${insignia.days} ${insignia.days===1?'dia':'dias'}`}</span><small>{earned?'CONQUISTADA':'POR DESCOBRIR'}</small></article>;})}</div>
    </section>

    <details className="rojao-how"><summary><span className="rojao-how-icon"><StreakIcon name="sun"/></span><span>Como manter seu rojão?</span><StreakIcon name="chevron"/></summary><div><p>Conclua uma etapa válida em qualquer instrumento ou uma posição na exploração por toque. Uma prática por dia já conta; abrir o aplicativo não acrescenta um dia.</p><p>Os dias seguem o horário de Fortaleza. Conta local e demonstração têm registros separados.</p></div></details>
    {!saved&&<p className="rojao-save-notice" role="status">O navegador não conseguiu salvar sua sequência. Ela está disponível nesta sessão.</p>}
  </div>;
}
