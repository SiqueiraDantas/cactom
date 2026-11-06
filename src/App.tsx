import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { MicrophonePitchMonitor, type PitchSample } from './lib/audio';
import { analysisGuidance, checkReading, type ReadingResult } from './lib/assessment';
import { firstIncompleteIndex, lessonCompleted, LESSONS, type Lesson } from './lib/curriculum';
import { countValidPercent, freshHold, advanceHold, type HoldState } from './lib/practice';
import { advanceRelease, waitingForRelease, type ReleaseState } from './lib/release';
import { type PracticeNote } from './lib/music';
import { track, setTelemetryContext } from './lib/devEvents';
import { DevDashboard } from './components/DevDashboard';
import { appendPitchPoint, qualityLabel, resultsCsv, summarizeCompletedNote, type PitchPoint, type NoteResult } from './lib/telemetry';
import { PitchTimeline } from './components/PitchTimeline';
import { lessonIntroduction } from './components/ActivityIntroduction';
import { MusicSymbol } from './components/MusicSymbol';
import { MeteredBarLesson, type MeteredControls, type MeteredControlState } from './components/MeteredBarLesson';
import { Metronome } from './lib/metronome';
import { FIGURES, durationLabel, requiredDurationMs, BPM_MIN, BPM_MAX } from './lib/rhythm';
import './styles.css';
import { VirtualTrumpetLab } from './components/VirtualTrumpetLab';
import { LearningHome } from './components/LearningHome';
import './redesign.css';
import { ActivityShell, DiscoveryActivity, ActivityVictory, type ActivityTool } from './components/ActivityExperience';
import './activity.css';
import './expansion.css';
import { InstrumentPicker } from './components/InstrumentPicker';
import { availableInstrument, type InstrumentProfile } from './lib/instruments';
import { readBrowserCourse, saveBrowserCourse } from './lib/browserCourse';
import { readSession, saveSession, clearSession } from './lib/session';
import {courseEntrySelection,type AccessFlow} from './lib/accessFlow';
import {AccountActions,type AccountActionsValue} from './components/AccountActions';
import { usePracticeHistory } from './lib/adaptiveStore';
import { recommendPractice, reinforcementLesson, type DifficultyReason } from './lib/adaptive';
import { ScoreLab, type ScoreStart } from './components/ScoreLab';
import { courseFor, progressStorageKey, isDiscovery } from './lib/courses';
import { RecorderDiscovery, RecorderDiagram, RecorderTouchLab } from './components/RecorderExperience';
import {BandLesson} from './components/BandLesson';
import {isBand} from './lib/bandTrail';
import type {JourneyOpen} from './components/StopIcon';
import type { RecorderSystem } from './lib/recorder';
import { ReferenceTone } from './lib/referenceTone';
import { markPracticeDay } from './lib/practiceDay';
import { LoginScreen, type AccessSession } from './components/LoginScreen';
import { ConductorCourse } from './components/ConductorCourse';
import { ProfileStorageProvider, useProfileStorage } from './components/ProfileStorage';
import type { KeyValueStorage } from './lib/profileStorage';

type ListenState = 'off' | 'starting' | 'on';
type Saved = { seenValves: number[]; passed: Record<string,string[]>; attempts: Record<string,number>; results: Record<string,NoteResult>; soundOn: boolean };
// Keep the previous storage key so students do not lose v0.3 completed activities.
function initialSaved(instrumentId:string,storage:KeyValueStorage): Saved {
  const empty:Saved = { seenValves:[], passed:{}, attempts:{}, results:{}, soundOn:true };
  try {
    const value = JSON.parse(storage.getItem(progressStorageKey(instrumentId)) || 'null') as Partial<Saved> | null;
    if(value) return {
      seenValves: Array.isArray(value.seenValves)?value.seenValves.filter((v):v is number=>instrumentId==='recorder-soprano'?Number.isInteger(v)&&v>=0&&v<=7:v===1||v===2||v===3):[],
      passed: typeof value.passed==='object' && value.passed !== null ? Object.fromEntries(Object.entries(value.passed).map(([key,v])=>[key,Array.isArray(v)?v.filter((x):x is string=>typeof x==='string'):[]])):{},
      attempts: typeof value.attempts==='object' && value.attempts!==null ? value.attempts : {},
      results: typeof value.results==='object' && value.results!==null ? value.results : {},
      soundOn: value.soundOn!==false,
    };
    if(instrumentId==='recorder-soprano')return empty;
    const old=JSON.parse(storage.getItem('mis-music-lab-aulas-v02') || 'null') as {seenValves?:number[]; passed?:{som?:string[];escala?:string[]}}|null;
    if(!old) return empty;
    const legacyEscala=old.passed?.escala ?? [];
    return {
      ...empty,
      seenValves: Array.isArray(old.seenValves)?old.seenValves:[],
      passed: {
        'primeiro-sol': old.passed?.som?.includes('G4')?['sol-inicial']:[],
        'cinco-notas': LESSONS.find(l=>l.id==='cinco-notas')?.steps.filter(s=>legacyEscala.includes(s.note.id)).map(s=>s.id) ?? [],
      },
    };
  } catch {return empty;}
}

type SymbolName = 'music'|'check'|'chevron'|'arrow'|'mic'|'volume'|'volumeOff'|'repeat'|'book'|'sparkle'|'shield'|'headphones'|'play'|'pause'|'bolt'|'menu'|'trophy'|'wave'|'hand'|'info'|'help'|'clock';
function Symbol({name, size=20}: {name:SymbolName;size?:number}) {
  const pieces:Record<SymbolName,ReactNode>={
    music:<><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></>,
    check:<path d="m5 12 4 4L19 6"/>, chevron:<path d="m9 18 6-6-6-6"/>,
    arrow:<path d="M5 12h14m-6-6 6 6-6 6"/>,
    mic:<><rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5m-4 0h8"/></>,
    volume:<><path d="m11 5-5 4H3v6h3l5 4V5Zm4 4a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/></>,
    volumeOff:<><path d="m11 5-5 4H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/></>,
    repeat:<><path d="M4 7h14l-3-3m3 3-3 3M20 17H6l3 3m-3-3 3-3"/></>,
    book:<><path d="M12 7a7 7 0 0 0-9-1v14a7 7 0 0 1 9 1 7 7 0 0 1 9-1V6a7 7 0 0 0-9 1Zm0 0v14"/></>,
    sparkle:<path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"/>,
    shield:<><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    headphones:<><path d="M4 14v-3a8 8 0 0 1 16 0v3M4 14h3v7H6a2 2 0 0 1-2-2Zm16 0h-3v7h1a2 2 0 0 0 2-2Z"/></>,
    play:<path d="m8 5 11 7-11 7V5Z"/>, pause:<><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></>,
    bolt:<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>,
    menu:<path d="M4 6h16M4 12h16M4 18h16"/>, trophy:<><path d="M7 4h10v9a5 5 0 0 1-10 0V4Zm0 2H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4M12 18v3m-4 0h8"/></>,
    wave:<path d="M2 12h2l2-7 4 14 4-14 4 14 2-7h2"/>,
    hand:<><path d="M8 13V6a2 2 0 0 1 4 0v5-7a2 2 0 0 1 4 0v7-5a2 2 0 0 1 4 0v9a7 7 0 0 1-7 7h-2a7 7 0 0 1-6-3L2 15a2 2 0 0 1 3-3l3 3"/></>,
    info:<><circle cx="12" cy="12" r="10"/><path d="M12 11v6m0-10v.1"/></>,
    help:<><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 4 2l-1.5 1v2M12 18v.1"/></>,
    clock:<><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{pieces[name]}</svg>;
}


function ValveDiagram({valves,interactive=false,onToggle}: {valves:readonly number[];interactive?:boolean;onToggle?:(n:number)=>void}){
  const fingers=['Indicador','Médio','Anelar'];
  return <div className="valve-panel">
    <div className="valve-bar" role={interactive?'group':undefined} aria-label="Diagrama dos três pistos">
      {[1,2,3].map(n=><button className={`valve ${valves.includes(n)?'pressed':''}`} disabled={!interactive} aria-pressed={valves.includes(n)} aria-label={`Pisto ${n}, dedo ${fingers[n-1]}`} key={n} onClick={()=>onToggle?.(n)} type="button"><span className="valve-top"/><span className="valve-stem"/><b>{n}</b></button>)}
    </div>
    <span className="valve-caption">{interactive?'Toque nos pistos para descobrir':'Pistos escuros = pressionados'}</span>
  </div>;
}

function NoteStaff({note,figure='whole'}: {note:PracticeNote; figure?:'quarter'|'half'|'whole'}){
  const degree=[0,0,1,1,2,3,3,4,4,5,5,6][note.writtenMidi%12]+7*(Math.floor(note.writtenMidi/12)-5);
  const y=126-degree*10;
  return <svg className="music-staff" viewBox="0 0 296 146" role="img" aria-label={`Nota ${note.label} escrita na pauta musical em clave de sol, ${figure==='whole'?'semibreve':figure==='half'?'mínima':'semínima'}`}>
    {note.transposeSemitones===12&&<text x="55" y="18" fill="currentColor" fontSize="13">8</text>}
    {[26,46,66,86,106].map(line=><line key={line} x1="11" x2="286" y1={line} y2={line} stroke="currentColor" strokeOpacity=".27" strokeWidth="1.6"/>)}
    <text x="20" y="109" fontFamily="'Noto Music','Segoe UI Symbol','DejaVu Serif',serif" fontSize="92" fill="currentColor">𝄞</text>
    {y===126&&<line x1="151" x2="195" y1="126" y2="126" stroke="currentColor" strokeWidth="1.7"/>}
    <ellipse cx="173" cy={y} rx={figure==='whole'?12.5:11.4} ry="7.3" transform={`rotate(-17 173 ${y})`} fill={figure==='whole'||figure==='half'?'none':'currentColor'} stroke="currentColor" strokeWidth={figure==='whole'?3.4:2}/>
    {figure!=='whole'&&<line x1="184" y1={y-2} x2="184" y2={y-52} stroke="currentColor" strokeWidth="2.2"/>}
  </svg>;
}

function formatSec(n:number){return n.toFixed(1).replace('.',',');}
const SUSPEND_MS=1000;

export default function App(){
  // Quem já passou pelo começo volta direto pra tela geral ao atualizar.
  const [access,setAccessState]=useState<AccessSession|null>(()=>{const saved=readSession();return saved?{...saved,initialInstrumentId:readBrowserCourse()??undefined}:null;});
  const setAccess=(next:AccessSession|null)=>{
    if(next){saveSession(next);setTelemetryContext({profileId:next.profile?.id??null,profileName:next.profile?.name});track(next.mode==='local'?'login':'demo',{username:next.profile?.username});}
    else{track('logout');clearSession();setTelemetryContext({profileId:null,profileName:undefined});}
    setAccessState(next);};
  useEffect(()=>{if(access)setTelemetryContext({profileId:access.profile?.id??null,profileName:access.profile?.name});},[access]);
  // quem volta já logado (sessão salva) entra em “Quem entrou” uma vez por aba
  useEffect(()=>{if(!access)return;try{if(sessionStorage.getItem('cactom-voltou'))return;sessionStorage.setItem('cactom-voltou','1');}catch{/* sem sessão */}track(access.mode==='local'?'login':'demo',{username:access.profile?.username,restored:true});},[]);
  // Visitante que pede “Criar um perfil” ou “Entrar” volta à entrada já no formulário certo.
  const [start,setStart]=useState<AccessFlow|undefined>();
  // Painel do desenvolvedor: endereço #desenvolvedor (abre só no computador de quem desenvolve)
  const [dev,setDev]=useState(()=>typeof location!=='undefined'&&location.hash==='#desenvolvedor');
  useEffect(()=>{const on=()=>setDev(location.hash==='#desenvolvedor');window.addEventListener('hashchange',on);return ()=>window.removeEventListener('hashchange',on);},[]);
  const actions=useMemo<AccountActionsValue>(()=>({
    createProfile:()=>{let saved:string|null=null;try{saved=localStorage.getItem('mis-music-lab-instrument');}catch{}setStart({view:'signup',workshopId:readBrowserCourse()??availableInstrument(saved)?.id??availableInstrument(access?.initialInstrumentId)?.id??null});setAccess(null);},
    signIn:()=>{setStart({view:'login',workshopId:null});setAccess(null);},
  }),[access?.initialInstrumentId]);
  if(dev)return <DevDashboard/>;
  if(!access)return <LoginScreen key={start?.view??'entrada'} start={start} onEnter={session=>{setStart(undefined);setAccess(session.initialInstrumentId?session:{...session,initialInstrumentId:readBrowserCourse()??undefined});}}/>;
  return <AccountActions.Provider value={access.mode==='demo'?actions:null}><ProfileStorageProvider profileId={access.profile?.id??null}><CourseEntry key={access.profile?.id??'demo'} access={access} onSignOut={()=>setAccess(null)}/></ProfileStorageProvider></AccountActions.Provider>;
}
export function CourseEntry({access,onSignOut}:{access:AccessSession;onSignOut:()=>void}){
  const storage=useProfileStorage();
  const [entry]=useState(()=>{let saved:string|null=null;try{saved=storage.getItem('mis-music-lab-instrument');}catch{}return courseEntrySelection(access.initialInstrumentId,saved);});
  const [selected,setSelected]=useState<string|null>(entry.selected);
  const [choosing,setChoosing]=useState(entry.choosing);
  useEffect(()=>{
    const requested=availableInstrument(access.initialInstrumentId);
    if(requested)try{storage.setItem('mis-music-lab-instrument',requested.id);}catch{}
  },[access.initialInstrumentId,storage]);
  const instrument=availableInstrument(selected);
  const choose=(id:string)=>{if(!availableInstrument(id))return;track('course',{instrument:id});setTelemetryContext({instrument:id});saveBrowserCourse(id);try{storage.setItem('mis-music-lab-instrument',id);}catch{}setSelected(id);setChoosing(false);};
  if(!instrument||choosing)return <InstrumentPicker access={access} onSignOut={onSignOut} selectedId={instrument?.id} onChoose={choose} onCancel={instrument?()=>setChoosing(false):undefined}/>;
  if(instrument.id==='conductor')return <ConductorCourse key={instrument.id} onChooseInstrument={()=>setChoosing(true)} onSignOut={onSignOut}/>;
  return <InstrumentCourse key={instrument.id} access={access} onSignOut={onSignOut} instrument={instrument} onChooseInstrument={()=>setChoosing(true)}/>;
}
export function InstrumentCourse({instrument,onChooseInstrument,access,onSignOut}:{instrument:InstrumentProfile;onChooseInstrument:()=>void;access:AccessSession;onSignOut:()=>void}){
  const storage=useProfileStorage();
  useEffect(()=>{setTelemetryContext({instrument:instrument.id});},[instrument.id]);
  const recorder=instrument.id==='recorder-soprano';
  const [recorderSystem,setRecorderSystem]=useState<RecorderSystem>(()=>{try{return storage.getItem('mis-music-lab-recorder-system')==='german'?'german':'baroque';}catch{return 'baroque';}});
  const course=useMemo(()=>courseFor(instrument.id,recorderSystem),[instrument.id,recorderSystem]);
  const courseLessons=course.lessons;
  const [saved,setSaved]=useState<Saved>(()=>initialSaved(instrument.id,storage));
  const [home,setHome]=useState(true);
  const [journeyLesson,setJourneyLesson]=useState<JourneyOpen|null>(null);
  const meteredControls=useRef<MeteredControls|null>(null);
  const [meteredState,setMeteredState]=useState<MeteredControlState>({preparing:false,running:false,review:false});
  const [scoreMode,setScoreMode]=useState(false),[scoreStart,setScoreStart]=useState<ScoreStart|null>(null),[homeTab,setHomeTab]=useState<'learn'|'scores'>('learn');
  const extraLessons=useRef(new Map<string,Lesson>());
  const lookupLesson=useCallback((id:string)=>extraLessons.current.get(id)??courseLessons.find(item=>item.id===id)??courseLessons[0],[courseLessons]);
  const {history,record}=usePracticeHistory(instrument.id);
  const attemptStats=useRef<{started:number;counts:Partial<Record<DifficultyReason,number>>;frames:number}>({started:0,counts:{},frames:0});
  const micSession=useRef(0);
  const [virtualMode,setVirtualMode]=useState(false);
  const [selectedLesson,setSelectedLesson]=useState<string>(courseLessons[0].id);
  const [pressed,setPressed]=useState<number[]>([]);
  const [index,setIndex]=useState(0);
  const [listening,setListening]=useState<ListenState>('off');
  const [reading,setReading]=useState<ReadingResult|null>(null);
  const [hold,setHold]=useState<HoldState>(freshHold);
  const [trace,setTrace]=useState<PitchPoint[]>([]);
  const [lastResult,setLastResult]=useState<NoteResult|null>(null);
  const [showSuccess,setShowSuccess]=useState(false);
  const [needRelease,setNeedRelease]=useState(false);
  const [microphoneError,setMicrophoneError]=useState('');
  const [bpm,setBpm]=useState(60);
  const [metronomeOn,setMetronomeOn]=useState(false);
  const [metronomeStarting,setMetronomeStarting]=useState(false);
  const [metronomeError,setMetronomeError]=useState('');
  const [currentBeat,setCurrentBeat]=useState(0);
  const monitorRef=useRef<MicrophonePitchMonitor|null>(null);
  const toneContext=useRef<AudioContext|null>(null);
  const reference=useRef(new ReferenceTone());
  const metronomeRef=useRef<Metronome|null>(null);
  const metronomeActiveRef=useRef(false);
  const metroStartingRef=useRef(false);
  const bpmRef=useRef(60);
  const lessonRef=useRef(selectedLesson);
  const indexRef=useRef(index);
  const savedRef=useRef(saved);
  const holdRef=useRef<HoldState>(freshHold());
  const pitchHistory=useRef<number[]>([]);
  const attemptCentsRef=useRef<number[]>([]);
  const traceRef=useRef<PitchPoint[]>([]);
  const passingRef=useRef(false);
  const attemptedRef=useRef(false);
  const releaseStateRef=useRef<ReleaseState>({awaiting:false,silenceStarted:null});
  const releasePendingRef=useRef(false);
  const inStart=useRef(false);
  const mounted=useRef(true);
  const practiceVisible=useRef(false);
  practiceVisible.current=!home&&!virtualMode&&!scoreMode;
  const delay=useRef<ReturnType<typeof setTimeout>|null>(null);
  lessonRef.current=selectedLesson; indexRef.current=index; savedRef.current=saved;

  const lesson=lookupLesson(selectedLesson);
  const steps=lesson.steps;
  const doneIds=saved.passed[lesson.id]??[];
  const lessonDone=lessonCompleted(lesson,doneIds,saved.seenValves);
  const activeStep=steps[index];
  const discovery=isDiscovery(lesson);
  const lessonPosition=courseLessons.findIndex(l=>l.id===selectedLesson);
  const nextLesson=lessonPosition>=0?courseLessons[lessonPosition+1]??null:null;
  const thisLessonResults=steps.map(s=>saved.results[s.id]).filter((r):r is NoteResult=>!!r && typeof r.meanCents==='number');
  const requiredMs=activeStep?requiredDurationMs(activeStep,bpm):0;
  const notePercent=requiredMs?countValidPercent(hold,requiredMs):0;
  const feedback=reading&&activeStep?analysisGuidance(reading.status,reading.cents,activeStep.note.label,reading.detected):null;
  const signal=reading?.status==='valid'?'on':reading?.status==='unstable'||reading?.status==='out-of-tune'?'warn':reading?.status==='wrong-note'?'bad':'idle';

  useEffect(()=>{try{storage.setItem(progressStorageKey(instrument.id),JSON.stringify(saved));}catch{/* privacidade */}},[saved,instrument.id,storage]);
  const persist=useCallback((fn:(prev:Saved)=>Saved)=>setSaved(prev=>{const updated=fn(prev); savedRef.current=updated; return updated;}),[]);
  const clearDelay=useCallback(()=>{if(delay.current){clearTimeout(delay.current);delay.current=null;}},[]);
  const stopMetronome=useCallback(()=>{metronomeActiveRef.current=false;metronomeRef.current?.stop();metronomeRef.current=null;setMetronomeOn(false);setMetronomeStarting(false);metroStartingRef.current=false;setCurrentBeat(0);},[]);
  const startMetronome=useCallback(async()=>{
    if(metronomeActiveRef.current||metroStartingRef.current)return;
    metroStartingRef.current=true;setMetronomeError('');setMetronomeStarting(true);
    const metronome=new Metronome();metronomeRef.current=metronome;
    try{await metronome.start(bpmRef.current,beat=>{if(metronomeRef.current===metronome)setCurrentBeat(beat);});
      if(metronomeRef.current!==metronome){metronome.stop();return;}
      metronomeActiveRef.current=true;setMetronomeOn(true);
    }catch{if(metronomeRef.current===metronome){stopMetronome();setMetronomeError('Não foi possível iniciar o som do metrônomo. Toque novamente ou confira as permissões de áudio do navegador.');}}
    finally{metroStartingRef.current=false;setMetronomeStarting(false);}
  },[stopMetronome]);
  const resetReading=useCallback(()=>{
    holdRef.current=freshHold(); pitchHistory.current=[]; attemptedRef.current=false;attemptCentsRef.current=[];traceRef.current=[];
    setTrace([]);
    setHold(freshHold());setReading(null);setShowSuccess(false);
    passingRef.current=false;setNeedRelease(false);releaseStateRef.current={awaiting:false,silenceStarted:null};
  },[]);
  const finishAttempt=useCallback((passed:boolean,forced?:DifficultyReason)=>{
    const stats=attemptStats.current;
    if(!stats.frames)return;
    const lid=lessonRef.current,step=lookupLesson(lid).steps[indexRef.current];
    if(step){
      const reason=forced??(Object.entries(stats.counts).sort((a,b)=>b[1]-a[1])[0]?.[0] as DifficultyReason|undefined)??'interrupted';
      record({task:'sound',lessonId:lid,stepId:step.id,writtenMidi:step.note.writtenMidi,passed,reason:passed?null:reason,durationMs:Math.max(0,performance.now()-stats.started)});
    }
    attemptStats.current={started:0,counts:{},frames:0};
  },[lookupLesson,record]);
  const stop=useCallback(async()=>{
    reference.current.stop();micSession.current++;finishAttempt(false);
    const monitor=monitorRef.current; monitorRef.current=null;
    if(monitor){try{await monitor.stop();}catch{/* already stopped */}}
    if(mounted.current){setListening('off');setReading(null);}
  },[finishAttempt]);
  useEffect(()=>{
    mounted.current=true;
    return ()=>{
      mounted.current=false;reference.current.stop();
      if(delay.current) clearTimeout(delay.current);
      void monitorRef.current?.stop();monitorRef.current=null;
      metronomeRef.current?.stop();metronomeRef.current=null;
      if(toneContext.current)void toneContext.current.close();toneContext.current=null;
    };
  },[]);
  const shortTone=useCallback((frequency:number,success=false)=>{
    try {
      let ctx=toneContext.current;
      if(!ctx){ctx=new AudioContext();toneContext.current=ctx;}
      if(ctx.state==='suspended')void ctx.resume();
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      const t=ctx.currentTime;
      osc.type=success?'sine':'triangle';
      osc.frequency.setValueAtTime(frequency,t);
      if(success)osc.frequency.setValueAtTime(frequency*1.25,t+.12);
      gain.gain.setValueAtTime(.0001,t);
      gain.gain.exponentialRampToValueAtTime(success?.055:.035,t+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,t+(success?.3:.9));
      osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+(success?.31:.92));
    } catch {/* Tom opcional em navegadores restritivos */}
  },[]);
  const endSuccess=useCallback(async(lid:string)=>{
    if(!mounted.current||lessonRef.current!==lid)return;
    passingRef.current=false;
    setShowSuccess(true);
    setNeedRelease(false);
    stopMetronome();
    await stop();
  },[stop,stopMetronome]);
  const handleSample=useCallback((value:PitchSample)=>{
    if(!mounted.current || passingRef.current)return;
    const lid=lessonRef.current;
    const currentLesson=lookupLesson(lid);
    const step=currentLesson.steps[indexRef.current];
    if(!step||savedRef.current.passed[lid]?.includes(step.id))return;
    // Rhythm tasks require an audible/visible pulse, not an arbitrary fixed timer.
    if(step.figure && !metronomeActiveRef.current)return;
    const now=value?.timestamp ?? performance.now();
    if(releasePendingRef.current){
      // Exige uma pausa antes da próxima nota, mesmo quando a nota é repetida.
      releaseStateRef.current=advanceRelease(releaseStateRef.current,now,value===null,260);
      if(!releaseStateRef.current.awaiting){releasePendingRef.current=false;setNeedRelease(false);}
      return;
    }
    const result=checkReading(value,step.note,pitchHistory.current,step.toleranceCents,step.stabilityLimitCents);
    setReading(result);
    if(value||attemptStats.current.frames){
      const stats=attemptStats.current;if(!stats.frames)stats.started=now;stats.frames++;
      const reason:DifficultyReason|null=result.status==='silence'?'interrupted':result.status==='valid'?null:result.status;
      if(reason)stats.counts[reason]=(stats.counts[reason]??0)+1;
    }
    const appended=appendPitchPoint(traceRef.current,{at:now,cents:result.cents,status:result.status});
    traceRef.current=appended;setTrace(appended);
    if(result.cents!==null&&result.status!=='wrong-note'&&result.status!=='out-of-tune'){
      pitchHistory.current=[...pitchHistory.current,result.cents].slice(-7);
    }else if(result.status==='silence'||result.status==='wrong-note'){
      pitchHistory.current=[];
    }
    if(value && !attemptedRef.current && result.status!=='silence'){
      attemptedRef.current=true;
      persist(old=>({...old,attempts:{...old.attempts,[step.id]:(old.attempts[step.id]??0)+1}}));
    }
    const previous=holdRef.current;
    const next=advanceHold(previous,now,result.valid,{requiredMs:requiredDurationMs(step,bpmRef.current),graceMs:180,maxFrameGapMs:240});
    holdRef.current=next;
    setHold(next);
    if(previous.creditedMs>0 && next.creditedMs===0 && !next.completed){attemptCentsRef.current=[];finishAttempt(false,result.status==='valid'||result.status==='silence'?'interrupted':result.status);}
    if(result.valid && result.cents!==null)attemptCentsRef.current.push(result.cents);
    if(!next.completed){
      if(attemptedRef.current && previous.creditedMs>0 && next.creditedMs===0 && !result.valid)attemptedRef.current=false;
      return;
    }
    passingRef.current=true;finishAttempt(true);
    const summary=summarizeCompletedNote({
      stepId:step.id,noteLabel:step.note.label,completedAt:new Date().toISOString(),
      validCents:attemptCentsRef.current,durationMs:next.creditedMs,
      requiredMs:requiredDurationMs(step,bpmRef.current),attempts:savedRef.current.attempts[step.id]??1,
    });
    if(summary)setLastResult(summary);
    setShowSuccess(true);
    if(savedRef.current.soundOn)shortTone(784,true);
    persist(old=>{const oldDone=old.passed[lid]??[];
      return {...old,passed:{...old.passed,[lid]:oldDone.includes(step.id)?oldDone:[...oldDone,step.id]},
        results:summary?{...old.results,[step.id]:summary}:old.results};
    });
    clearDelay();
    const isLast=indexRef.current===currentLesson.steps.length-1;
    delay.current=setTimeout(()=>{
      if(!mounted.current||lessonRef.current!==lid)return;
      if(isLast){void endSuccess(lid);return;}
      const nextIndex=indexRef.current+1;indexRef.current=nextIndex;setIndex(nextIndex);
      holdRef.current=freshHold(); pitchHistory.current=[]; attemptedRef.current=false;attemptCentsRef.current=[];traceRef.current=[];
    setTrace([]);
      setHold(freshHold());setReading(null);setShowSuccess(false);
      passingRef.current=false;releasePendingRef.current=true;releaseStateRef.current=waitingForRelease();setNeedRelease(true);
    },SUSPEND_MS);
  },[clearDelay,endSuccess,persist,shortTone,lookupLesson,finishAttempt]);
  const latest=useRef(handleSample);latest.current=handleSample;
  const start=useCallback(async()=>{
    if(listening!=='off'||inStart.current)return;
    reference.current.stop();setMicrophoneError('');setListening('starting');inStart.current=true;
    // Liberar efeitos sonoros neste gesto do usuário, quando permitido.
    if(savedRef.current.soundOn && !toneContext.current){try{toneContext.current=new AudioContext();void toneContext.current.resume();}catch{/* opcional */}}
    const requestedLesson=lessonRef.current,token=++micSession.current;
    try{
      const monitor=await MicrophonePitchMonitor.create();
      if(!mounted.current||token!==micSession.current||!practiceVisible.current||lessonRef.current!==requestedLesson){await monitor.stop();return;}
      monitorRef.current=monitor;
      resetReading();releasePendingRef.current=false;
      monitor.listen(value=>latest.current(value));
      setListening('on');
    }catch(error){if(token===micSession.current){setMicrophoneError(error instanceof Error?error.message:'Não foi possível acessar o microfone.');setListening('off');}}
    finally{inStart.current=false;}
  },[listening,resetReading]);
  const navigate=useCallback((id:string)=>{
    clearDelay();passingRef.current=false;releasePendingRef.current=false;
    stopMetronome();void stop();
    const nextBpm=lookupLesson(id).defaultBpm??60;bpmRef.current=nextBpm;setBpm(nextBpm);
    setMeteredState({preparing:false,running:false,review:false});
    setSelectedLesson(id);lessonRef.current=id;setMicrophoneError('');
    const next=lookupLesson(id);
    const ix=firstIncompleteIndex(next,savedRef.current.passed[id]??[]);
    setIndex(ix);indexRef.current=ix;resetReading();setLastResult(null);
  },[clearDelay,resetReading,stop,stopMetronome,lookupLesson]);
  const resetLesson=useCallback(()=>{
    clearDelay();stopMetronome();void stop();releasePendingRef.current=false;
    if(isDiscovery(lesson)){
      persist(o=>({...o,seenValves:[]}));setPressed([]);
    }else{
      persist(o=>{
        const nextResults={...o.results},nextAttempts={...o.attempts};
        lesson.steps.forEach(step=>{delete nextResults[step.id];delete nextAttempts[step.id];});
        return {...o,passed:{...o.passed,[selectedLesson]:[]},results:nextResults,attempts:nextAttempts};
      });
    }
    indexRef.current=0;setIndex(0);resetReading();setLastResult(null);
  },[clearDelay,persist,resetReading,selectedLesson,stop,stopMetronome,lesson]);
  useEffect(()=>{
    const pause=()=>{if(document.hidden){clearDelay();stopMetronome();void stop();resetReading();}};
    document.addEventListener('visibilitychange',pause);
    return ()=>document.removeEventListener('visibilitychange',pause);
  },[clearDelay,stopMetronome,stop,resetReading]);
  const clickValve=(n:number)=>{
    const before=savedRef.current.seenValves,after=[...new Set([...before,n])];
    if(course.discoveryIds.every(id=>after.includes(id))&&!course.discoveryIds.every(id=>before.includes(id)))markPracticeDay(storage);
    setPressed(old=>old.includes(n)?old.filter(x=>x!==n):[...old,n]);
    persist(old=>({...old,seenValves:old.seenValves.includes(n)?old.seenValves:[...old.seenValves,n]}));
  };
  const tryReference=()=>{if(activeStep && listening==='off')void reference.current.play(activeStep.note).catch(()=>setMicrophoneError('Não foi possível reproduzir a referência.'));};
  const updateBpm=(value:number)=>{if(metronomeOn||metronomeStarting||listening!=='off')return;const next=Math.min(BPM_MAX,Math.max(BPM_MIN,value));bpmRef.current=next;setBpm(next);resetReading();};
  const exportHistory=()=>{
    if(!thisLessonResults.length)return;
    const csv='\ufeff'+resultsCsv(thisLessonResults);
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download=`music-lab-${lesson.id}-resultado.csv`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const openLesson=(id:string)=>{navigate(id);setVirtualMode(false);setScoreMode(false);setHome(false);window.scrollTo({top:0,behavior:'instant'});};
  const openVirtual=()=>{clearDelay();stopMetronome();void stop();resetReading();setVirtualMode(true);setScoreMode(false);setHome(false);window.scrollTo({top:0,behavior:'instant'});};
  const backHome=()=>{setHomeTab('learn');setJourneyLesson(null);clearDelay();stopMetronome();void stop();resetReading();setScoreMode(false);setHome(true);window.scrollTo({top:0,behavior:'instant'});};
  const recommendation=recommendPractice(history,Date.now(),instrument.id);
  const openReinforcement=()=>{
    if(!recommendation)return;
    const custom=reinforcementLesson(recommendation,recorderSystem);extraLessons.current.set(custom.id,custom);
    const stepIds=new Set(custom.steps.map(step=>step.id));
    persist(previous=>({...previous,passed:{...previous.passed,[custom.id]:[]},attempts:Object.fromEntries(Object.entries(previous.attempts).filter(([id])=>!stepIds.has(id))),results:Object.fromEntries(Object.entries(previous.results).filter(([id])=>!stepIds.has(id)))}));
    openLesson(custom.id);
  };
  const openScores=(start:ScoreStart|null=null)=>{setScoreStart(start);clearDelay();stopMetronome();void stop();setVirtualMode(false);setScoreMode(true);setHome(false);window.scrollTo({top:0,behavior:'instant'});};
  const openJourneyLesson=(open:JourneyOpen)=>{clearDelay();stopMetronome();void stop();resetReading();setVirtualMode(false);setScoreMode(false);setHome(false);setJourneyLesson(open);window.scrollTo({top:0,behavior:'instant'});};
  const band=isBand(instrument.id)?instrument.id:null;
  if(band&&journeyLesson)return <BandLesson key={`${band}-${journeyLesson.stopId}-${journeyLesson.lessonId}-${journeyLesson.review}`} instrument={band} stopId={journeyLesson.stopId} lessonId={journeyLesson.lessonId} review={journeyLesson.review} onExit={backHome}/>;
  if(scoreMode)return <ScoreLab key={scoreStart?.scoreId??scoreStart?.file?.name??'biblioteca'} start={scoreStart} instrument={instrument} recorderSystem={recorderSystem} onExit={()=>{setScoreStart(null);backHome();setHomeTab('scores');}} onAttempt={record}/>;
  if(home)return <LearningHome key={homeTab} initialTab={homeTab} onOpenScore={start=>openScores(start)} onJourneyLesson={band?openJourneyLesson:undefined} access={access} onSignOut={onSignOut} instrument={instrument} course={course} recorderSystem={recorderSystem} onRecorderSystem={value=>{try{storage.setItem('mis-music-lab-recorder-system',value);}catch{}extraLessons.current.clear();setRecorderSystem(value);setSelectedLesson(courseLessons[0].id);}} onInstrument={onChooseInstrument} onScores={()=>openScores()} history={history} learningSupport={recommendation?<section className="adaptive-card"><span className="adaptive-icon"><Symbol name="sparkle" size={27}/></span><div><span className="activity-eyebrow">UM REFORÇO DO SEU JEITO · {recommendation.level}</span><h2>{recommendation.title}</h2><p>{recommendation.description}</p><small>{recommendation.evidence}</small><button className="activity-secondary" type="button" onClick={openReinforcement}>Praticar este reforço <Symbol name="arrow" size={16}/></button></div></section>:null} passed={saved.passed} seenValves={saved.seenValves} results={saved.results} onLesson={openLesson} onVirtual={instrument.id==='clarinet-bb'?()=>openJourneyLesson({stopId:'CLA-M01-L1',lessonId:'CLA-M01-L1'}):openVirtual}/>;
  if(virtualMode&&recorder)return <RecorderTouchLab system={recorderSystem} onExit={backHome}/>;
  if(virtualMode)return <div className="site redesigned-practice virtual-session">
    <header className="virtual-session-header"><button className="back-to-trail" type="button" onClick={backHome}>← Voltar à trilha</button><span>PRÁTICA VIRTUAL <i>·</i> MADE IN SERTÃO</span><button className="session-text-button" type="button" onClick={()=>openLesson(selectedLesson)}>Usar meu trompete <Symbol name="arrow" size={17}/></button></header>
    <VirtualTrumpetLab/>
  </div>;
  const activityTotal=discovery?course.discoveryIds.length:steps.length;
  const activityCompleted=discovery?course.discoveryIds.filter(n=>saved.seenValves.includes(n)).length:steps.filter(s=>doneIds.includes(s.id)).length;
  const completed=lessonDone||showSuccess;
  const footerTitle=lessonDone?'Mandou bem!':lesson.rhythmMode==='metered'?null:showSuccess?'É isso! Nota concluída.':needRelease?'Respire. A próxima nota vem aí.':listening==='on'?(feedback?.title??'Estou ouvindo seu som…'):null;
  const tools:ActivityTool[]=[
    ...(activeStep&&!lessonDone&&lesson.rhythmMode!=='metered'?[{
      id:'tuning',label:'Afinação',title:'Afinação e detalhes do som',icon:<Symbol name="wave" size={23}/>,
      content:<><div className="activity-tuning"><div><b>Afinação</b><span>{reading?.cents===null||reading?.cents===undefined||signal==='bad'?'Aguardando som':`${reading.cents>=0?'+':''}${Math.round(reading.cents)} cents`}</span></div><div className="tuning-track"><div className="tuning-safe"/><div className="tuning-center"/><span className={`tuning-pointer ${signal}`} style={{left:`${50+Math.max(-60,Math.min(60,reading?.cents??0))/1.2}%`}}/></div><div className="tuning-labels"><span>Grave</span><span>No centro</span><span>Agudo</span></div></div><PitchTimeline points={trace} tolerance={activeStep!.toleranceCents}/><p>Meta de afinação: ±{activeStep!.toleranceCents} cents. O tempo só conta com a nota correta, afinada e estável.</p>{lastResult&&<p><b>Última nota: {lastResult.noteLabel}.</b> {lastResult.advice}</p>}</>,
    }]:[]),
    ...(!lessonDone?[{
      id:'guide',label:'Dicas',title:'Entenda esta atividade',icon:<Symbol name="book" size={23}/>,
      content:<><p><b>Objetivo:</b> {lesson.goal}</p>{activeStep&&<p>{activeStep.instruction}</p>}{lesson.rhythmMode==='metered'&&<><p>Uma semínima dura 1 tempo; uma mínima, 2 tempos. Siga as notas e faça silêncio apenas nas pausas escritas.</p><p>Use fones. Ao começar, fique em silêncio no breve ajuste do microfone e espere quatro tempos de preparação.</p></>}{discovery&&<p>Explore o desenho sem soprar, com as mãos relaxadas. O treino com microfone começa na próxima aula.</p>}<p>{lesson.concept}</p><p><b>Dica do professor:</b> {lesson.teacherTip}</p>{lesson.rhythmMode==='metered'&&<p>Toque a nota e a oitava indicadas. Pequenas variações de afinação são aceitas; outra nota não vale como acerto.</p>}<button className="activity-secondary" type="button" onClick={openVirtual}>{recorder?'Sem instrumento? Praticar os furos por toque':'Sem instrumento? Praticar os pistos virtuais'}</button><p>Seu treino fica aqui. Nenhum áudio é gravado.</p></>,
    }]:[]),
    {
      id:'lessons',label:'Etapas',title:lessonDone?'Aulas e resultados':'Etapas e aulas',icon:<Symbol name="menu" size={23}/>,
      content:<div className="activity-lesson-menu"><nav aria-label="Escolher outra aula">{courseLessons.map((item,i)=><button type="button" key={item.id} onClick={()=>navigate(item.id)} aria-current={item.id===selectedLesson?'step':undefined}><span>{lessonCompleted(item,saved.passed[item.id]??[],saved.seenValves)?'✓':String(i+1).padStart(2,'0')}</span>{item.title}<Symbol name="chevron" size={17}/></button>)}</nav>{steps.length>0&&<ol className="activity-step-list">{steps.map(s=><li key={s.id}><span>{doneIds.includes(s.id)?'✓':'○'}</span><b>{s.kind==='rest'?'Pausa':s.note.label}</b><small>{durationLabel(s,bpm)}</small></li>)}</ol>}{thisLessonResults.length>0&&<div className="activity-results"><h2>Seus resultados nesta aula</h2>{thisLessonResults.map(r=><p key={r.stepId}><b>{r.noteLabel}</b> {qualityLabel(r.quality)} · {r.meanCents>0?'+':''}{r.meanCents} cents</p>)}<button className="activity-secondary" type="button" onClick={exportHistory}>Exportar CSV</button></div>}<button className="session-text-button" type="button" onClick={resetLesson}><Symbol name="repeat" size={17}/> Reiniciar esta aula</button></div>,
    },
  ];
  return <ActivityShell introduction={lessonIntroduction(lesson)} key={lesson.id} tools={tools} title={lesson.title} lessonNumber={lessonPosition+1} completed={activityCompleted} total={activityTotal} soundOn={saved.soundOn} onSound={()=>persist(v=>({...v,soundOn:!v.soundOn}))} onExit={backHome} success={completed} footer={<>
    {footerTitle&&<div className="session-footer-feedback"><span className="footer-feedback-icon"><Symbol name={completed?'check':listening==='on'?'wave':'sparkle'} size={24}/></span><div><b>{footerTitle}</b><p>{lessonDone?'Seu progresso ficou salvo neste navegador.':showSuccess?'O próximo exercício aparece automaticamente.':needRelease?'Faça uma pequena pausa entre os sons.':discovery?`${activityCompleted} de ${activityTotal} ${course.discoveryName} explorados. Experimente cada um.`:lesson.rhythmMode==='metered'?'Use o botão da atividade para iniciar ou repetir o compasso.':listening==='on'?(feedback?.description??'Sustente a nota com calma.'):'O microfone só liga quando você tocar no botão.'}</p></div></div>}
    <div className="session-footer-actions">
      {lessonDone?<><button className="session-text-button" type="button" onClick={resetLesson}><Symbol name="repeat" size={17}/> Praticar de novo</button><button className="activity-primary" type="button" onClick={()=>nextLesson?navigate(nextLesson.id):backHome()}>CONTINUAR <Symbol name="arrow" size={19}/></button></>:discovery?<button className="activity-primary" type="button" disabled>EXPLORE OS {activityTotal} {course.discoveryName.toUpperCase()} <Symbol name="hand" size={19}/></button>:lesson.rhythmMode==='metered'?<button className="activity-primary" type="button" onClick={()=>{if(meteredState.preparing||meteredState.running)void meteredControls.current?.stop();else void meteredControls.current?.start();}}><Symbol name={meteredState.preparing||meteredState.running?'pause':meteredState.review?'repeat':'mic'} size={20}/>{meteredState.preparing?'Cancelar preparação':meteredState.running?'Parar atividade':meteredState.review?'Tentar novamente':'Começar atividade'}</button>:<button className={`activity-primary ${listening==='on'?'is-listening':''}`} type="button" disabled={listening==='starting'||showSuccess} onClick={()=>listening==='off'?void start():void stop()}><Symbol name={listening==='on'?'pause':'mic'} size={20}/>{listening==='starting'?'CONECTANDO…':listening==='on'?'Parar atividade':'Começar atividade'}</button>}
    </div>
  </>}>
    {lessonDone?<ActivityVictory recorder={recorder} discovery={discovery} total={activityTotal}/>:discovery?recorder?<RecorderDiscovery showGuidance={false} pressed={pressed} seen={saved.seenValves} onToggle={clickValve}/>:<DiscoveryActivity showGuidance={false} pressed={pressed} seen={saved.seenValves} onToggle={clickValve}/>:<>
      <h1 className="activity-practice-title">{lesson.title}</h1>
      {lesson.rhythmMode==='metered'?<MeteredBarLesson externalControls controlsRef={meteredControls} onControlState={setMeteredState} compact instrument={instrument} key={lesson.id} lesson={lesson} completed={lessonDone} onAttempt={(verdict,tempo)=>verdict.forEach(v=>{
        const target=lesson.steps.find(item=>item.id===v.stepId);if(!target)return;
        record({task:v.kind==='rest'?'rest':'rhythm',lessonId:lesson.id,stepId:v.stepId,writtenMidi:target.note.writtenMidi,passed:v.passed,reason:v.passed?null:v.reason==='note'?'wrong-note':v.reason==='tuning'?'out-of-tune':v.reason==='interrupted'?'interrupted':v.kind==='rest'?'rest':'rhythm',durationMs:requiredDurationMs(target,tempo)});
      })} onComplete={result=>{
        persist(oldSaved=>{const previous=oldSaved.passed[lesson.id]??[];return {...oldSaved,passed:{...oldSaved.passed,[lesson.id]:Array.from(new Set([...previous,...result.filter(r=>r.passed).map(r=>r.stepId)]))}};});
      }}/>:activeStep&&<>
        <section className={`sound-challenge ${recorder?'sound-challenge--recorder recorder-reference-card':''} ${showSuccess?'correct':''}`} aria-label="Nota e digitação do exercício">
          <div className="sound-challenge-top"><span className="activity-eyebrow">{recorder?'FLAUTA DOCE':'SUA NOTA ESCRITA · TROMPETE EM SI♭'}</span><button className="activity-listen" type="button" onClick={tryReference} disabled={listening!=='off'} title={listening!=='off'?'Pause o microfone para ouvir a referência':'Ouvir referência eletrônica'}><Symbol name="volume" size={19}/> Ouvir nota</button></div>
        {activeStep.figure&&<section className="activity-metronome" aria-label="Metrônomo"><div className="activity-metro-heading"><span className="activity-figure"><MusicSymbol figure={activeStep.figure}/></span><div><b>{FIGURES[activeStep.figure].label} <span>· {FIGURES[activeStep.figure].beats} {FIGURES[activeStep.figure].beats===1?'tempo':'tempos'}</span></b><p>Uma nota por vez. Cada flash marca um tempo.</p></div><button className="activity-secondary" type="button" disabled={metronomeStarting} onClick={()=>{if(metronomeOn){stopMetronome();resetReading();}else void startMetronome();}}>{metronomeOn?'■ Parar':metronomeStarting?'Preparando…':'▶ Ligar'}</button></div><div className="activity-metro-controls"><label>Andamento <b>{bpm} BPM</b><input aria-label="Andamento do metrônomo" type="range" min={BPM_MIN} max={BPM_MAX} step="5" value={bpm} disabled={metronomeOn||metronomeStarting||listening!=='off'} onChange={e=>updateBpm(Number(e.target.value))}/></label><div className="activity-beats activity-beats--single" aria-label={metronomeOn?'Tempo regular do metrônomo':'Metrônomo parado'}><span key={currentBeat} className={metronomeOn?'active pulse-flash':''}>1</span><small>TEMPO</small></div></div>{metronomeError&&<p role="alert" className="activity-error">{metronomeError}</p>}</section>}
          <div className="sound-target"><div className="sound-note-name"><strong>{activeStep.note.label.split(' ')[0]}</strong><span>{activeStep.note.label.split(' ').slice(1).join(' ')}</span></div><div className="sound-staff"><NoteStaff note={activeStep.note} figure={activeStep.figure}/></div></div>
          <div className={recorder?"sound-fingering recorder-sound-fingering":"sound-fingering"}><div><span className="activity-eyebrow">{recorder?'DIGITAÇÃO':'COMO FICAM OS PISTOS'}</span><b>{recorder?`Feche os furos ${activeStep.note.holes?.join(' · ')}`:activeStep.note.valves.length?`Pressione ${activeStep.note.valves.join(' + ')}`:'Deixe os três soltos'}</b></div>{recorder?<RecorderDiagram compact holes={activeStep.note.holes??[]}/>:<ValveDiagram valves={activeStep.note.valves}/>}</div>
          <div className="sound-hold"><div><Symbol name={showSuccess?'check':'clock'} size={21}/><b>{showSuccess?'Nota conquistada!':listening==='on'?'Mantenha seu som…':'Sustente sem interromper'}</b><span>{formatSec(hold.creditedMs/1000)} / {formatSec(requiredMs/1000)} s</span></div><div className="sound-hold-progress" role="progressbar" aria-label="Sustentação da nota" aria-valuemin={0} aria-valuemax={100} aria-valuenow={notePercent}><span style={{width:`${notePercent}%`}}/></div></div>
        </section>

        {activeStep.figure&&!metronomeOn&&<p className="activity-reminder"><Symbol name="info" size={18}/> Primeiro ligue o metrônomo. Depois, ative o microfone.</p>}
        {microphoneError&&<p className="activity-error" role="alert">{microphoneError}</p>}
        
      </>}
      
    </>}
    
  </ActivityShell>;
}
