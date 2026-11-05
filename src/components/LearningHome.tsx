import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import {InstallApp} from './InstallApp';
import {GuestProfileCard} from './AccountActions';
import { lessonCompleted } from '../lib/curriculum';
import type { InstrumentProfile } from '../lib/instruments';
import type { PracticeAttempt } from '../lib/adaptive';
import type { NoteResult } from '../lib/telemetry';
import './learning.css';
import './journey-refresh.css';
import './continuous-path.css';
import './cactom-dashboard.css';
import './community.css';
import { MascotScene, StreakFlame } from './LabIllustrations';
import { StreakScreen, useStreakStatus } from './StreakExperience';
import { courseFor } from '../lib/courses';
import { CactomWordmark, TomOfficial } from './CactomBrand';
import { CourseArtwork } from './CourseArtwork';
import { ScoreTab } from './ScoreTab';
import { track } from '../lib/devEvents';
import { devAllowed } from './DevDashboard';
import './score-pdf.css';
import type { ScoreStart } from './ScoreLab';
import { AchievementsHub } from './AchievementsHub';
import { RankingBoard } from './RankingBoard';
import { cloudEnabled, pushRanking } from '../lib/cloud';
import { entryFor } from '../lib/ranking';
import { ProgressHub } from './ProgressHub';
import { JourneyProgressHub } from './JourneyProgressHub';
import { CommunityHub } from './CommunityHub';
import { journeyOverview } from '../lib/journeyOverview';
import { bandOverview, isBand } from '../lib/bandTrail';
import { BandJourney } from './BandJourney';
import { useProfileStorage } from './ProfileStorage';
import {RecorderJourney,type JourneyOpen} from './RecorderJourney';
import { RecorderDiagnosticPath } from './RecorderDiagnosticPath';
import { RecorderModuleOnePath } from './RecorderModuleOnePath';
import type { ModuleOneLessonId } from '../lib/recorderModuleOne';
import type { DiagnosticId } from '../lib/recorderDiagnostic';
import { learningPathLayout } from '../lib/learningPath';
import type { AccessSession } from './LoginScreen';
import type { RecorderSystem } from '../lib/recorder';

type IconName = 'path'|'play'|'star'|'chart'|'arrow'|'check'|'lock'|'music'|'headphones'|'sun'|'heart'|'hand'|'book'|'chat';
export function LabIcon({name,size=24}: {name:IconName;size?:number}) {
  const paths:Record<IconName,ReactNode> = {
    path:<><path d="M8 4h9a4 4 0 0 1 0 8H7a4 4 0 0 0 0 8h10"/><circle cx="6" cy="4" r="2"/><path d="m15 17 3 3-3 3"/></>,
    play:<path d="m9 5 11 7-11 7Z"/>, star:<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z"/>,
    chart:<><path d="M4 4v16h17M8 15v-4m5 4V7m5 8v-6"/></>, arrow:<path d="M4 12h15m-6-6 6 6-6 6"/>, check:<path d="m5 12 4 4L19 6"/>,
    lock:<><rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/></>,
    music:<><path d="M9 18V5l11-2v13"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/></>,
    headphones:<><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="13" width="5" height="8" rx="2"/><rect x="16" y="13" width="5" height="8" rx="2"/></>,
    sun:<><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
    heart:<path d="M20.8 5.6a5.5 5.5 0 0 0-8.8 1 5.5 5.5 0 0 0-8.8 6.2L12 21l8.8-8.2a5.5 5.5 0 0 0 0-7.2Z"/>,
    hand:<><path d="M8 13V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7h-2a7 7 0 0 1-6-3l-3-4a2 2 0 0 1 3-3l3 3"/></>,
    book:<><path d="M12 6a9 9 0 0 0-9 0v14a9 9 0 0 1 9 0 9 9 0 0 1 9 0V6a9 9 0 0 0-9 0Zm0 0v14"/></>,
    chat:<><path d="M4 5h16v11H9l-5 4Z"/><path d="M8 9h8M8 12h5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

// Shared mascot API retained for activity, picker and login layouts.
export function Mandacaru({small=false,instrument='trumpet-bb'}:{small?:boolean;instrument?:string}){
  return <MascotScene variant="welcome" instrument={instrument} className={small?'mandacaru small':'mandacaru'}/>;
}

type Props = {
  onCurriculum?:(id:string)=>void;
  onJourneyLesson?:(open:JourneyOpen)=>void;
  onModuleOne?:(id:ModuleOneLessonId)=>void;
  onDiagnostic?:(id:DiagnosticId|'summary')=>void;
  initialTab?:'learn'|'scores'|'streak'|'achievements'|'progress'|'community';
  /** Abre a tela de tocar partitura (da aba Partituras). */
  onOpenScore?:(start:ScoreStart)=>void;
  access:AccessSession;onSignOut:()=>void;
  passed:Record<string,string[]>; seenValves:number[]; results:Record<string,NoteResult>;
  onLesson:(id:string)=>void; onVirtual:()=>void;
  course:ReturnType<typeof courseFor>;recorderSystem:RecorderSystem;onRecorderSystem:(system:RecorderSystem)=>void;
  onScores:()=>void;onInstrument:()=>void;instrument:InstrumentProfile;learningSupport:ReactNode;history:readonly PracticeAttempt[];
};
const navItems = [{id:'learn',label:'Aprender',icon:'path'},{id:'scores',label:'Partituras',icon:'book'},{id:'streak',label:'Seu Rojão',icon:'sun'},{id:'achievements',label:'Conquistas',icon:'star'},{id:'progress',label:'Meu progresso',icon:'chart'},{id:'community',label:'Comunidade',icon:'chat'}] as const;

export function LearningHome({passed,seenValves,results,onLesson,onVirtual,onScores,onInstrument,instrument,learningSupport,history,course,recorderSystem,onRecorderSystem,access,onSignOut,initialTab='learn',onOpenScore,onDiagnostic,onModuleOne,onCurriculum,onJourneyLesson}:Props) {
  const {lessons,units}=course;const recorder=instrument.id==='recorder-soprano';
  const [tab,setTab]=useState<NonNullable<Props['initialTab']>>(initialTab);
  const [help,setHelp]=useState(false);
  const mainRef=useRef<HTMLElement>(null),firstView=useRef(true),accountRef=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{if(firstView.current){firstView.current=false;return;}mainRef.current?.focus({preventScroll:true});},[tab]);
  useEffect(()=>{
    const outside=(event:PointerEvent)=>{if(accountRef.current?.open&&event.target instanceof Node&&!accountRef.current.contains(event.target))accountRef.current.open=false;};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'&&accountRef.current?.open){accountRef.current.open=false;accountRef.current.querySelector('summary')?.focus();}};
    document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
    return ()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
  },[]);
  const {summary:streak,saved:streakSaved}=useStreakStatus();
  const storage=useProfileStorage();
  /** Trilha (aba Aprender) alimenta Rojão, Conquistas e Progresso. */
  const band=isBand(instrument.id)?instrument.id:null;
  // ranking no servidor: manda a linha desta conta (primeiro nome e números) quando o progresso muda
  useEffect(()=>{const p=access.profile;if(!p||!cloudEnabled())return;const e=entryFor(p,instrument.id);if(e)void pushRanking(e,instrument.id,storage);},[access.profile?.id,instrument.id,streak.totalDays]);
  const trail=useMemo(()=>!onJourneyLesson?null:recorder?journeyOverview(storage):band?bandOverview(storage,band):null,[recorder,band,onJourneyLesson,storage,streak.totalDays]);
  const openTrail=()=>{if(trail&&onJourneyLesson)onJourneyLesson(trail.open);else onLesson(next.id);};
  const completed=lessons.filter(l=>lessonCompleted(l,passed[l.id]??[],seenValves));
  const next=lessons.find(l=>!lessonCompleted(l,passed[l.id]??[],seenValves))??lessons[0];
  const percent=Math.round(completed.length/lessons.length*100);
  const notes=Object.values(results);
  const legacyBadges=[{icon:'hand' as const,title:recorder?'Prazer, flauta doce!':'Prazer, trompete!',description:recorder?'Explore os oito furos no desenho.':'Explore os três pistos do instrumento.',earned:course.discoveryIds.every(n=>seenValves.includes(n))},{icon:'music' as const,title:'Meu primeiro som',description:recorder?'Conclua a aula Seu primeiro Si.':'Conclua a aula Seu primeiro Sol.',earned:completed.some(l=>l.id===lessons[1].id)},{icon:'star' as const,title:recorder?'Três notas na bagagem':'Cinco notas na bagagem',description:recorder?'Conclua Três notas na bagagem.':'Conclua A escada de cinco notas.',earned:completed.some(l=>l.id===(recorder?'recorder-tres-notas':'cinco-notas'))},{icon:'sun' as const,title:'O sertão é musical',description:`Conclua as ${lessons.length} aulas da trilha.`,earned:completed.length===lessons.length}];
  const badges=trail?[
    {icon:'hand' as const,title:`Prazer, ${instrument.name.toLocaleLowerCase('pt-BR')}!`,description:'Conclua a primeira lição da trilha.',earned:trail.lessonsDone>=1},
    {icon:'music' as const,title:'Primeira parada',description:'Conclua uma parada inteira da trilha.',earned:trail.stopsDone>=1},
    {icon:'sun' as const,title:'Rojão de 3 dias',description:'Pratique três dias seguidos.',earned:streak.bestStreak>=3},
    {icon:'star' as const,title:'100 XP de prática',description:'Junte 100 XP fazendo lições.',earned:trail.xp>=100},
    band?{icon:'headphones' as const,title:'Cinco lições na bagagem',description:'Conclua cinco lições da trilha.',earned:trail.lessonsDone>=5}:{icon:'headphones' as const,title:'Memória boa',description:'Faça uma revisão quando ela aparecer.',earned:trail.reviewsDone>=1},
    {icon:'book' as const,title:'Unidade 1 completa',description:`Conclua: ${trail.units[0]?.goal??'a primeira unidade'}.`,earned:!!trail.units[0]&&trail.units[0].stops.every(x=>x.status==='concluida'||x.status==='revisao')},
    {icon:'sun' as const,title:'Rojão de 7 dias',description:'Segure o rojão por uma semana inteira.',earned:streak.bestStreak>=7},
    {icon:'star' as const,title:'O sertão é musical',description:`Conclua as ${trail.stopsTotal} paradas da trilha.`,earned:trail.stopsDone===trail.stopsTotal},
  ]:legacyBadges;
  const legacyUnits=units.map((courseUnit,unitIndex)=>{
                const unitLessons=lessons.slice(courseUnit.from,courseUnit.to);
                const unitComplete=unitLessons.every(l=>completed.some(c=>c.id===l.id));
                const layout=learningPathLayout(unitLessons.length);
                const unitDone=unitLessons.filter(l=>completed.some(c=>c.id===l.id)).length;
                return <section key={`${instrument.id}-unit-${unitIndex}`} className={`journey-unit journey-unit-${unitIndex%3}`} aria-labelledby={`unit-title-${unitIndex}`}>
                  <div className="unit-banner">
                    <div className="unit-number">{String(unitIndex+1).padStart(2,'0')}</div>
                    <div className="unit-banner-copy">
                      <small>UNIDADE {unitIndex+1}</small>
                      <h3 id={`unit-title-${unitIndex}`}>{courseUnit.title}</h3>
                    </div>
                    <span className="unit-progress" aria-label={`${unitDone} de ${unitLessons.length} aulas concluídas`}>{unitDone}/{unitLessons.length}</span><span className="unit-banner-icon"><LabIcon name={unitComplete?'check':'music'} size={26}/></span>
                  </div>
                  <div className="path-nodes" style={{'--track-height':`${layout.height}px`,'--path-step':`${layout.step}px`,'--node-size':`${layout.size}px`} as CSSProperties}>
                    <svg className="path-connector" viewBox={`0 0 1000 ${layout.height}`} preserveAspectRatio="none" aria-hidden="true">{layout.segments.map(segment=>{
                      const fromDone=completed.some(l=>l.id===unitLessons[segment.index].id);
                      const toDone=segment.index+1<unitLessons.length?completed.some(l=>l.id===unitLessons[segment.index+1].id):unitComplete;
                      return <path className={fromDone&&toDone?'path-segment traversed':'path-segment'} key={segment.index} d={segment.d}/>;
                    })}</svg>
                    {unitLessons.map((lesson,i)=>{
                      const done=completed.some(l=>l.id===lesson.id);
                      const active=lesson.id===next.id;
                      return <div className={`path-item item-${i} ${active?'current':''} ${done?'complete':''}`} id={`lesson-${lesson.id}`} key={lesson.id} style={{'--node-x':`${layout.nodes[i].x}%`} as CSSProperties}>
                        {active&&<span className="start-bubble">{done?'REVISAR':completed.length?'CONTINUAR':'COMEÇAR'}</span>}
                        <button className={`lesson-node ${done?'done':active?'available':'upcoming'}`} type="button" title={lesson.title} aria-current={active?'step':undefined} aria-label={`${courseUnit.from+i+1}. ${lesson.title}${done?', concluída':active?', próxima aula':''}`} onClick={()=>onLesson(lesson.id)}><LabIcon name={done?'check':i===0?'music':i===3?'headphones':'star'} size={32}/></button>
                      </div>;
                    })}
                    <div className={`unit-finish ${unitComplete?'is-complete':''}`} role="img" aria-label={unitComplete?`Unidade ${unitIndex+1} concluída`:`Fim da unidade ${unitIndex+1}`}><span><LabIcon name={unitComplete?'check':'star'} size={25}/></span></div>
                  </div>
                </section>;
              });
  /** Trilha do trompete/clarinete: o mesmo mapa da flauta (4 áreas por unidade, revisões e desafios). */
  const bandUnits=band&&onJourneyLesson?<BandJourney instrument={band} onLesson={open=>onJourneyLesson(open)}/>:null;
  return <div className={`learning-app cactom-dashboard ${tab==='learn'?'learning-app--path':`learning-app--hub learning-app--${tab}`}`}>
    <a className="skip-link" href="#learning-main">Pular para o conteúdo</a>
    <aside className="learning-sidebar">
      <button type="button" className="learning-brand brand-home" aria-label="Cactom: voltar ao início" title="Voltar ao início" onClick={()=>{setTab('learn');setHelp(false);window.scrollTo({top:0,behavior:'smooth'});}}><CactomWordmark/></button>
      <nav aria-label="Navegação principal">{navItems.filter(item=>!(instrument.id==='iniciacao'&&item.id==='scores')).map(item=><button key={item.id} type="button" className={`learning-nav ${tab===item.id?'selected':''}`} aria-label={item.label} aria-current={tab===item.id?'page':undefined} onClick={()=>{setTab(item.id);setHelp(false);track('tab',{tab:item.id});window.scrollTo({top:0,behavior:'instant'});}}>{item.id==='streak'?<StreakFlame active={streak.currentStreak>0} size={25}/>:<LabIcon name={item.icon}/>}<span>{item.id==='progress'?'Progresso':item.label}</span>{item.id==='learn'&&<span className="nav-dot"/>}</button>)}</nav>
      <div className="sidebar-bottom"><TomOfficial className="sidebar-tom" decorative/><b>O sertão tem muito<br/>som pra ensinar.</b><p>E o seu começa aqui.</p><button type="button" className="help-button" onClick={()=>setHelp(v=>!v)} aria-expanded={help}><span>?</span> Como funciona</button><small>Escola de Música de Madalena · CE</small>{devAllowed()&&<a className="dev-link" href="#desenvolvedor">Painel do desenvolvedor</a>}</div>
    </aside>
    <div className="learning-body">
      <header className="learning-topbar"><button type="button" className="course-label course-picker-button" onClick={onInstrument} aria-label={`Seu curso: ${instrument.name}. Trocar curso`}><span className="course-instrument"><CourseArtwork instrument={instrument.id}/></span><span className="course-text"><b>{instrument.name}</b><small>Trocar curso</small></span><svg className="course-chevron" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg></button><div className="topbar-metrics"><button type="button" className="topbar-streak" title="Ver Seu Rojão" aria-label={`Ver Seu Rojão: ${streak.currentStreak} ${streak.currentStreak===1?'dia':'dias'}`} onClick={()=>{setTab('streak');window.scrollTo({top:0,behavior:'instant'});}}><StreakFlame active={streak.currentStreak>0} size={25}/><b>{streak.currentStreak}</b></button>{trail?<span title="XP de prática"><LabIcon name="star" size={22}/><b>{trail.xp}</b><small>XP</small></span>:<span title="Aulas concluídas"><LabIcon name="star" size={22}/><b>{completed.length}</b><small>aulas</small></span>}<button type="button" className="topbar-progress" title="Ver meu progresso" onClick={()=>{setTab('progress');window.scrollTo({top:0,behavior:'instant'});}}><LabIcon name="chart" size={22}/><b>{trail?trail.percent:percent}%</b></button><details className="home-account" ref={accountRef}><summary className="student-avatar" aria-label="Opções da conta" title={access.profile?.name??'Visitante'}>{access.profile?.name.slice(0,1).toLocaleUpperCase('pt-BR')??'V'}</summary><div><b>{access.profile?.name??'Visitante'}</b><small>{access.mode==='local'?'Perfil salvo neste navegador':'Explorando o Cactom'}</small><button type="button" onClick={onInstrument}>Trocar instrumento</button><button type="button" onClick={onSignOut}>{access.mode==='local'?'Sair da conta':'Voltar à entrada'}</button></div></details></div></header>
      {help&&<div className="learning-help" role="status"><b>Aprenda no seu ritmo.</b> Escolha uma aula, leia a explicação e pratique. {recorder?'Com sua flauta doce soprano, use o microfone; sem instrumento, explore os furos por toque no desenho.':instrument.id==='iniciacao'?'Não precisa de instrumento: tu responde tocando na tela, ouvindo e batendo os ritmos no botão. Na unidade 9 tu escolhe ler na clave de Sol ou de Fá.':instrument.id==='clarinet-bb'?'Com teu clarinete, use o microfone; cada nota nova aparece com o dedilhado antes de tocar.':'Com teu trompete, use o microfone; sem instrumento, explore os pistos virtuais por câmera ou toque.'} Os acertos são verificados pelos exercícios, e seu progresso fica salvo neste navegador.<button type="button" onClick={()=>setHelp(false)} aria-label="Fechar ajuda">×</button></div>}
      <div className="learning-grid"><main key={tab} ref={mainRef} tabIndex={-1} id="learning-main" className="learning-main" data-learning-view={tab}>{tab==="learn"&&<InstallApp/>}
        {tab==='learn'?<>
          {access.mode==='demo'&&<GuestProfileCard/>}
          {learningSupport&&<div className="learn-reinforcement">{learningSupport}</div>}
          {instrument.id!=='clarinet-bb'&&instrument.id!=='iniciacao'&&<button type="button" className="learn-virtual" onClick={onVirtual}><span className="learn-virtual-art" aria-hidden="true"><CourseArtwork instrument={instrument.id}/></span><span><b>Tá sem {recorder?'a flauta':'o trompete'} aí?</b><small>{recorder?'Toca nos furos da tela e escuta cada nota.':'Aperta os pistos da tela e escuta os sons.'}</small></span><LabIcon name="arrow" size={20}/></button>}
          <section className="course-path course-path-continuous" aria-label="Trilha de aulas em sequência">
            <div className="journey-all-units">
              {recorder&&onCurriculum?<RecorderJourney onTask={onCurriculum} onLesson={open=>onJourneyLesson?.(open)} system={recorderSystem} onSystem={onRecorderSystem}/>:<>{recorder&&onDiagnostic&&<RecorderDiagnosticPath onOpen={onDiagnostic}/>}{recorder&&onModuleOne&&<RecorderModuleOnePath onOpen={onModuleOne}/>}</>}
              {bandUnits?<>{bandUnits}{band==='trumpet-bb'&&<details className="full-course-legacy"><summary>Treinos anteriores · {lessons.length} aulas extras</summary>{legacyUnits}</details>}</>:recorder&&onCurriculum?<details className="full-course-legacy"><summary>Treinos anteriores · 13 aulas extras</summary>{legacyUnits}</details>:legacyUnits}
            </div>
          </section>
        </>:tab==='streak'?<StreakScreen summary={streak} saved={streakSaved} instrument={instrument.id} onPractice={openTrail}/>:tab==='scores'?<ScoreTab instrument={instrument} onOpen={start=>onOpenScore?onOpenScore(start):onScores()}/>:tab==='achievements'?<><RankingBoard instrumentId={instrument.id} profileId={access.profile?.id??null}/><AchievementsHub badges={badges} onPractice={openTrail} onRojão={()=>{setTab('streak');window.scrollTo({top:0,behavior:'instant'});}}/></>:tab==='community'?<CommunityHub instrumentId={instrument.id} profile={access.profile?{id:access.profile.id,name:access.profile.name}:null} storage={access.profile?storage:undefined}/>:trail&&onJourneyLesson?<JourneyProgressHub overview={trail} onOpen={onJourneyLesson}/>:<ProgressHub lessons={lessons} units={units} completed={completed} next={next} percent={percent} noteCount={notes.length} passed={passed} seen={seenValves} discoveryTotal={course.discoveryIds.length} discoveryName={course.discoveryName} history={history} onLesson={onLesson}/>}
        {tab!=='learn'&&<footer className="learning-footer"><span>Aprender. Praticar. Florescer.</span><small>Cactom · Made in Sertão · Madalena, Ceará</small></footer>}
      </main></div>
    </div>
  </div>;
}
