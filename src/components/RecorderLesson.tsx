import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {track} from '../lib/devEvents';
import {COURSE_TASKS,evaluateCourse,courseScoreEvents,barBeats,pulseBeats} from '../lib/recorderFullCourse';
import {lessonExercises,exerciseById,checkFingering,checkCreation,scoreTaps,tapFeedback,fingeringFor,NAME,type Exercise} from '../lib/recorderExercises';
import {journeyStop,readJourney,writeJourney,completeLesson,lessonXp,EVIDENCE_LABEL,type Evidence,type LegacyResponse,type LessonOutcome} from '../lib/recorderJourney';
import {FluteFrontBack} from './FluteFrontBack';
import {RecorderCourseAudio} from '../lib/recorderCourseAudio';
import {LessonSound} from '../lib/lessonSound';
import {MicrophonePitchMonitor} from '../lib/audio';
import {ModuleOneMedia} from '../lib/recorderModuleOneMedia';
import type {ScoreSample} from '../lib/scoreAssessment';
import {CHECK_GERMAN,type RecorderSystem} from '../lib/recorder';
import {useProfileStorage} from './ProfileStorage';
import {markPracticeDay} from '../lib/practiceDay';
import {RecorderDiagram} from './RecorderExperience';
import {RecorderCourseScore} from './RecorderCourseScore';
import {startLessonMetronome,stopLessonMetronome} from '../lib/lessonMetronome';
import {TomOfficial} from './CactomBrand';
import {JourneyArt} from './JourneyArt';
import './recorder-lesson.css';

type Verdict={ok:boolean;neutral?:boolean;message:string;evidence:Evidence[];validated?:boolean;skipped?:boolean};
type Pending={ready:boolean;check:()=>Verdict};
type Item={ex:Exercise;retry:boolean};
type Result={correctFirst:boolean;recovered:boolean;evidence:Evidence[];validated?:boolean;skipped?:boolean;needsReview:boolean};
const TASK_TEXT=new Map(COURSE_TASKS.map(t=>[t.id,t.task]));

export function reviewExercises(stopId:string,needed:readonly string[]):Exercise[]{
 const stop=journeyStop(stopId);if(!stop)return [];
 const pool=stop.lessonIds.flatMap(l=>lessonExercises(l));
 const missed=pool.filter(e=>needed.includes(e.id));
 const auto=pool.filter(e=>!missed.includes(e)&&e.kind!=='observe');
 return [...missed,...auto].slice(0,6);
}

export function RecorderLesson({stopId,lessonId,review=false,system,legacy,silent:initialSilent=false,onExit,onSystem}:{stopId:string;lessonId?:string;review?:boolean;system:RecorderSystem;legacy:Record<string,LegacyResponse|undefined>;silent?:boolean;onExit:()=>void;onSystem?:(s:RecorderSystem)=>void}){
 const storage=useProfileStorage();
 const stop=journeyStop(stopId)!;
 const [loaded]=useState(()=>readJourney(storage));
 const exercises=useMemo(()=>review?reviewExercises(stopId,loaded.ledger.reviewNeeded):lessonExercises(lessonId??stop.lessonIds[0]),[review,stopId,lessonId,loaded,stop]);
 const [stage,setStage]=useState<'intro'|'story'|'activity'|'conclusion'>('intro');
 const [queue,setQueue]=useState<Item[]>(()=>exercises.map(ex=>({ex,retry:false})));
 const [pos,setPos]=useState(0),[verdict,setVerdict]=useState<Verdict|null>(null),[pending,setPending]=useState<Pending|null>(null);
 const [results,setResults]=useState<Record<string,Result>>({});
 const [silent,setSilent]=useState(initialSilent),[saved,setSaved]=useState<{xp:number;nextReview?:string;warning:string}|null>(null);
 const sound=useRef(new LessonSound());
 useEffect(()=>()=>sound.current.stop(),[]);
 const item=queue[pos],answered=Object.values(results).filter(r=>!r.needsReview||r.recovered||r.skipped).length;
 const lessonName=review?'Revisão':(lessonId?COURSE_TASKS.find(t=>t.lesson===lessonId)?.lessonName:'')??'';
 const headingRef=useRef<HTMLHeadingElement>(null),feedbackRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{headingRef.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});},[stage,pos]);
 useEffect(()=>{if(verdict)feedbackRef.current?.focus({preventScroll:true});},[verdict]);

 const check=()=>{if(!pending?.ready||verdict)return;const v=pending.check();setVerdict(v);if(item)track('answer',{exercise:item.ex.id,kind:item.ex.kind,ok:v.ok||!!v.neutral,skipped:!!v.skipped,retry:item.retry,lesson:lessonId??stop.lessonIds[0],instruction:item.ex.instruction});if(!silent&&!v.neutral&&!v.skipped)void sound.current.chime(v.ok);};
 const advance=()=>{
  if(!item||!verdict)return;const {ex,retry}=item,previous=results[ex.id];
  const ok=verdict.ok||!!verdict.neutral;
  const result:Result=retry?{...previous!,recovered:ok&&!verdict.skipped,needsReview:!ok||!!verdict.skipped,evidence:[...new Set([...(previous?.evidence??[]),...verdict.evidence])] as Evidence[]}:{correctFirst:ok&&!verdict.skipped,recovered:false,evidence:verdict.evidence,validated:verdict.validated,skipped:verdict.skipped,needsReview:!ok||!!verdict.skipped};
  const nextResults={...results,[ex.id]:result};setResults(nextResults);
  let nextQueue=queue;if(!retry&&!ok&&!verdict.skipped){nextQueue=[...queue,{ex,retry:true}];setQueue(nextQueue);}
  setVerdict(null);setPending(null);
  if(pos+1<nextQueue.length){const following=nextQueue[pos+1];setPos(pos+1);setStage(following.ex.story&&!following.retry?'story':'activity');}
  else finish(nextResults);
 };
 const finish=(final:Record<string,Result>)=>{
  const outcome:LessonOutcome={lessonId:review?`review:${stopId}`:(lessonId??stop.lessonIds[0]),stopId,review,at:new Date(),presentations:Object.entries(final).map(([id,r])=>({id,correctFirst:r.correctFirst,recovered:r.recovered,evidence:r.evidence,validated:r.validated,skipped:r.skipped}))};
  const fresh=readJourney(storage);let warning=fresh.warning;
  try{const updated=completeLesson(fresh.ledger,outcome,legacy);if(fresh.safeToWrite&&!writeJourney(storage,updated))warning='Seu avanço ficou nesta sessão, mas este navegador não permitiu salvar.';if(outcome.presentations.some(p=>!p.skipped))markPracticeDay(storage);track('lesson_complete',{lesson:outcome.lessonId,stop:stopId,instrument:'recorder-soprano',review,xp:lessonXp(outcome),total:outcome.presentations.length,correctFirst:outcome.presentations.filter(p=>p.correctFirst).length});setSaved({xp:lessonXp(outcome),nextReview:updated.stops[stopId]?.nextReview,warning});}
  catch(error){setSaved({xp:0,warning:error instanceof Error?error.message:'Não foi possível registrar.'});}
  setStage('conclusion');if(!silent)void sound.current.celebrate();
 };

 const header=<header className="rl-top">
  <button type="button" className="rl-close" onClick={onExit} aria-label="Sair da lição e voltar à trilha"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
  <div className="rl-progress" role="progressbar" aria-label="Progresso da lição" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={Math.min(answered,queue.length)}><span style={{width:`${stage==='intro'?0:stage==='conclusion'?100:Math.min(100,answered/queue.length*100)}%`}}/></div>
  <button type="button" className="rl-sound" aria-pressed={!silent} onClick={()=>{setSilent(s=>!s);sound.current.stop();}} title={silent?'Sons de acerto desligados':'Sons de acerto ligados'}>{silent?'Som: não':'Som: sim'}</button>
 </header>;

 if(stage==='intro'){
  const tasks=[...new Set(exercises.map(e=>e.taskId))].map(id=>TASK_TEXT.get(id)!);
  return <div className="rl rl--intro" data-environment="introducao">{header}<main className="rl-main">
   <div className="rl-intro-hero"><TomOfficial decorative expression="animado" className="rl-intro-tom"/><div className="rl-bubble"><span className="rl-eyebrow">Unidade {stop.unit} · {stop.label}{review?'':` · ${lessonName}`}</span><h1 ref={headingRef} tabIndex={-1}>{review?'Hora de revisar':stop.unitGoal}</h1><p>{review?'Bora retomar o que pediu mais atenção nesta parada, visse?':`Bora! Nesta lição tu vai ${tasks[0]?.charAt(0).toLocaleLowerCase('pt-BR')}${tasks[0]?.slice(1)}`}</p></div></div>
   <section className="rl-card"><h2>O que você vai praticar</h2><ul className="rl-goals">{tasks.slice(0,3).map(t=><li key={t}>{t}</li>)}</ul><p className="rl-meta">{exercises.length} telas · cerca de {Math.max(2,Math.round(exercises.length*.6))} min</p></section>
  </main><footer className="rl-footer"><button type="button" className="rl-btn rl-btn--ghost" onClick={onExit}>Agora não</button><button type="button" className="rl-btn" onClick={()=>{track('lesson_start',{lesson:lessonId??stop.lessonIds[0],stop:stopId,instrument:'recorder-soprano',review,screens:queue.length});setStage(queue[0]?.ex.story?'story':'activity')}} disabled={!queue.length}>Começar</button></footer></div>;
 }
 if(stage==='story'&&item?.ex.story){
  return <div className="rl rl--story" data-environment="historia">{header}<main className="rl-main"><section className="rl-story"><span className="rl-eyebrow">História do ensaio</span><h1 ref={headingRef} tabIndex={-1}>{item.ex.story.title}</h1><div className="rl-story-scene"><TomOfficial decorative expression="pensativo" className="rl-story-tom"/><div className="rl-bubble rl-story-bubble"><p className="rl-story-text">{item.ex.story.scene}</p></div></div></section></main><footer className="rl-footer"><button type="button" className="rl-btn" onClick={()=>setStage('activity')}>Resolver</button></footer></div>;
 }
 if(stage==='conclusion'){
  const list=Object.entries(results),first=list.filter(([,r])=>r.correctFirst).length,recovered=list.filter(([,r])=>r.recovered).length,needs=list.filter(([,r])=>!r.correctFirst);
  const skills=[...new Set(list.map(([id])=>exerciseById(id)?.taskId).filter(Boolean))].map(id=>TASK_TEXT.get(id!)!);
  const evidence=[...new Set(list.flatMap(([,r])=>r.evidence))];
  return <div className="rl rl--done" data-environment="conclusao">{header}<main className="rl-main"><section className="rl-done">
   <TomOfficial decorative expression="comemorando" className="rl-done-tom"/>
   <h1 ref={headingRef} tabIndex={-1}>{review?'Revisão feita, arretado!':'Lição concluída, arretado!'}</h1>
   <div className="rl-stats"><div><b>+{saved?.xp??0}</b><span>XP de prática</span></div><div><b>{first}/{list.length}</b><span>de primeira</span></div><div><b>{recovered}</b><span>recuperadas</span></div></div>
   <section className="rl-card"><h2>Habilidades praticadas</h2><ul className="rl-goals">{skills.slice(0,4).map(s=><li key={s}>{s}</li>)}</ul></section>
   <section className="rl-card"><h2>{needs.length?'Para revisar':'Revisão'}</h2>{needs.length?<ul className="rl-goals rl-goals--review">{needs.map(([id,r])=><li key={id}>{exerciseById(id)?.instruction}{r.recovered?' · recuperada, volta na revisão':r.skipped?' · ficou para depois':''}</li>)}</ul>:<p>Nada pendente desta lição.</p>}{saved?.nextReview&&<p className="rl-meta">Próxima revisão desta parada: {new Date(saved.nextReview).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</p>}</section>
   <p className="rl-evidence">Registrado como: {evidence.map(e=>EVIDENCE_LABEL[e]).join(' · ')||'—'}. Prática registrada não é nota nem certificado.</p>
   {saved?.warning&&<p className="rl-warning" role="status">{saved.warning}</p>}
  </section></main><footer className="rl-footer"><button type="button" className="rl-btn" onClick={onExit} autoFocus>Voltar à trilha</button></footer></div>;
 }
 if(!item)return null;
 const {ex,retry}=item;
 return <div className={`rl rl--activity ${verdict?'has-feedback':''}`} data-environment="atividade" data-kind={ex.kind} data-exercise={ex.id}>{header}
  <main className="rl-main">
   {retry&&<p className="rl-retry-label">Corrija o erro de antes</p>}
   <h1 className="rl-instruction" ref={headingRef} tabIndex={-1}>{ex.instruction}</h1>
   {ex.prompt&&<p className="rl-prompt">{ex.prompt}</p>}
   <ExerciseBody key={ex.id+(retry?'-r':'')} ex={ex} system={system} locked={!!verdict} setPending={setPending} silent={silent} onSystem={onSystem}/>
  </main>
  {verdict?<div className={`rl-feedback ${verdict.skipped?'is-skip':verdict.neutral?'is-neutral':verdict.ok?'is-ok':'is-error'}`} role="status" ref={feedbackRef} tabIndex={-1} data-environment="feedback">
   <div className="rl-feedback-copy"><strong>{verdict.skipped?'Fica pra depois, visse':verdict.neutral?'Anotado!':verdict.ok?(retry?'Agora foi!':'Arretado!'):'Eita, quase!'}</strong><p>{verdict.message}</p>{!verdict.ok&&!verdict.neutral&&!verdict.skipped&&<p className="rl-hint"><b>Pista:</b> {ex.hint}</p>}{!verdict.ok&&!verdict.neutral&&!verdict.skipped&&!retry&&<p className="rl-meta">Esta tela volta no fim da lição.</p>}</div>
   <button type="button" className="rl-btn" onClick={advance} autoFocus>Continuar</button>
  </div>:<footer className="rl-footer">
   {['perform','tap','observe'].includes(ex.kind)||ex.audio?<button type="button" className="rl-btn rl-btn--ghost" onClick={()=>setVerdict({ok:false,skipped:true,message:ex.audio?'Sem problema. Esta escuta entra na sua revisão.':'Sem problema. Esta prática entra na sua revisão.',evidence:[]})}>{ex.audio?'Não posso ouvir agora':'Não posso tocar agora'}</button>:<span/>}
   <button type="button" className="rl-btn" disabled={!pending?.ready} onClick={check}>{ex.kind==='meet'?'Entendi':'Verificar'}</button>
  </footer>}
 </div>;
}

function SpeakerIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>;}

function useListener(ex:Exercise){
 const audio=useRef(new RecorderCourseAudio()),pulse=useRef(new LessonSound());
 const [playing,setPlaying]=useState<string|null>(null),[heard,setHeard]=useState<string[]>([]),[error,setError]=useState('');
 useEffect(()=>()=>{audio.current.stop();pulse.current.stop();},[]);
 const play=async(which:'A'|'B'|'duo')=>{
  if(playing){audio.current.stop();pulse.current.stop();setPlaying(null);return;}
  setPlaying(which);setError('');
  try{
   let done:boolean;
   if(ex.audio==='pulse')done=await pulse.current.clicks(ex.notes!.length,ex.bpm??72,barBeats(ex.meter??'4/4'));
   else done=await audio.current.play(which==='B'?ex.alternative!:ex.notes!,ex.meter??'4/4',ex.bpm??72,{attack:(which==='B'?ex.attacks?.[1]:ex.attacks?.[0])??'leve',countIn:!ex.attacks,...(ex.unit===12&&ex.audio==='AB'?{duo:true,duoMidi:71,sustained:true,cents:which==='B'?22:0}:{duo:which==='duo'}),gate:which==='B'&&(ex.unit===7||ex.unit===13)?.98:ex.unit===7||ex.unit===13?.6:.9});
   if(done)setHeard(h=>[...new Set([...h,which])]);
  }catch{setError('Não foi possível tocar o som. Confira o volume ou use “Não posso ouvir agora”.');}
  setPlaying(null);
 };
 const buttons=ex.audio==='AB'?<div className="rl-listen-row"><button type="button" className="rl-listen" onClick={()=>void play('A')}><SpeakerIcon/>{playing==='A'?'Parar':'Modelo A'}</button><button type="button" className="rl-listen rl-listen--b" onClick={()=>void play('B')}><SpeakerIcon/>{playing==='B'?'Parar':'Modelo B'}</button></div>:<button type="button" className="rl-listen" onClick={()=>void play(ex.audio==='duo'?'duo':'A')}><SpeakerIcon/>{playing?'Parar':ex.audio==='pulse'?'Ouvir o pulso':'Ouvir'}</button>;
 const ready=ex.audio==='AB'?heard.includes('A')&&heard.includes('B'):heard.length>0;
 return {buttons,ready,error,playing};
}

function ExerciseBody({ex,system,locked,setPending,silent,onSystem}:{ex:Exercise;system:RecorderSystem;locked:boolean;setPending:(p:Pending|null)=>void;silent:boolean;onSystem?:(s:RecorderSystem)=>void}){
 switch(ex.kind){
  case 'choice':return <ChoiceBody ex={ex} locked={locked} setPending={setPending}/>;
  case 'fingering':return <FingeringBody ex={ex} system={system} locked={locked} setPending={setPending}/>;
  case 'tap':return <TapBody ex={ex} locked={locked} setPending={setPending} silent={silent}/>;
  case 'perform':return <PerformBody ex={ex} system={system} locked={locked} setPending={setPending}/>;
  case 'create':return <CreateBody ex={ex} system={system} locked={locked} setPending={setPending}/>;
  case 'observe':return <ObserveBody ex={ex} locked={locked} setPending={setPending}/>;
  case 'meet':return <MeetBody ex={ex} system={system} setPending={setPending} onSystem={onSystem}/>;
  default:return null;
 }
}

function ChoiceBody({ex,locked,setPending}:{ex:Exercise;locked:boolean;setPending:(p:Pending|null)=>void}){
 const [choice,setChoice]=useState<number|null>(null);const listener=useListener(ex);const needsAudio=!!ex.audio;
 useEffect(()=>{setPending({ready:choice!==null&&(!needsAudio||listener.ready),check:()=>{
  if(ex.anyAnswer)return {ok:true,neutral:true,message:ex.optionFeedback?.[choice!]??ex.correct,evidence:ex.evidence};
  const ok=choice===ex.answer;return {ok,message:ok?ex.correct:`${ex.incorrect} Resposta certa: ${ex.options![ex.answer!].label}.`,evidence:ex.evidence};
 }});},[choice,listener.ready]);
 const visual=ex.options?.some(o=>o.art||o.holes);
 return <section className="rl-stimulus">
  {ex.art&&<JourneyArt id={ex.art}/>}
  {needsAudio&&<div className="rl-audio">{listener.buttons}{!listener.ready&&<small>{ex.audio==='AB'?'Ouça os dois modelos para responder.':'Ouça antes de responder.'}</small>}{listener.error&&<p className="rl-warning" role="alert">{listener.error}</p>}</div>}
  {ex.score&&ex.notes&&<RecorderCourseScore notes={ex.notes} meter={ex.meter??'4/4'}/>}
  <div className={`rl-options ${visual?'rl-options--visual':''}`} role="radiogroup" aria-label={ex.prompt??ex.instruction}>
   {ex.options!.map((o,i)=>{const state=locked&&!ex.anyAnswer?(i===ex.answer?'is-right':i===choice?'is-wrong':''):'';
    return <button type="button" role="radio" aria-checked={choice===i} key={i} disabled={locked} className={`rl-option ${choice===i?'is-selected':''} ${state}`} onClick={()=>setChoice(i)}>
     {o.art&&<JourneyArt id={o.art}/>}{o.holes&&<JourneyArt id="diagram" holes={o.holes} label={`Diagrama: furos ${o.holes.join(', ')} fechados`}/>}<span>{o.label}</span>
    </button>;})}
  </div>
 </section>;
}

function FingeringBody({ex,system,locked,setPending}:{ex:Exercise;system:RecorderSystem;locked:boolean;setPending:(p:Pending|null)=>void}){
 const [holes,setHoles]=useState<number[]>(ex.prefilled??[]);
 const expected=ex.target!==undefined?(fingeringFor(ex.target,system)??ex.holes??[]):ex.holes??[];
 const toggle=(h:number)=>{if(ex.prefilled?.includes(h))return;setHoles(old=>old.includes(h)?old.filter(x=>x!==h):[...old,h]);};
 useEffect(()=>{setPending({ready:holes.length>(ex.prefilled?.length??0)||(holes.length>0&&!ex.prefilled),check:()=>{const ok=checkFingering(ex,holes,system);return {ok,message:ok?ex.correct:`${ex.incorrect}${ex.target===65?` (sistema ${system==='baroque'?'barroco':'germânico'})`:''}`,evidence:ex.evidence};}});},[holes,system]);
 return <section className="rl-stimulus rl-fingering">
  {ex.art&&ex.art!=='flute-back'&&<JourneyArt id={ex.art}/>}
  {ex.target!==undefined&&<p className="rl-target"><span>Nota</span><b>{NAME[ex.target]}</b></p>}
  {ex.art==='flute-back'?<FluteFrontBack holes={locked?expected:holes} interactive={!locked} onToggle={toggle}/>:<RecorderDiagram holes={locked?expected:holes} interactive={!locked} compact onToggle={toggle}/>}
  {locked&&<p className="rl-meta">O desenho mostra a posição certa: {expected.join(' · ')}.</p>}
 </section>;
}

function TapBody({ex,locked,setPending,silent}:{ex:Exercise;locked:boolean;setPending:(p:Pending|null)=>void;silent:boolean}){
 const meter=ex.meter??'4/4',bpm=ex.bpm??60,quarter=60000/(bpm*pulseBeats(meter)),count=barBeats(meter)/pulseBeats(meter);
 const [state,setState]=useState<'idle'|'count'|'tap'|'done'>('idle'),[beat,setBeat]=useState(0),[taps,setTaps]=useState<number[]>([]);
 const start=useRef(0),timer=useRef<ReturnType<typeof setInterval>|null>(null),sound=useRef(new LessonSound()),tapsRef=useRef<number[]>([]);
 const stopAll=useCallback(()=>{if(timer.current)clearInterval(timer.current);timer.current=null;sound.current.stop();},[]);
 useEffect(()=>stopAll,[stopAll]);
 const verdict=useMemo(()=>scoreTaps(ex.tapBeats!,taps,quarter),[taps,quarter,ex.tapBeats]);
 useEffect(()=>{setPending({ready:state==='done',check:()=>({ok:verdict.ok,message:tapFeedback(ex,verdict),evidence:ex.evidence,validated:false})});},[state,verdict]);
 const begin=()=>{
  stopAll();tapsRef.current=[];setTaps([]);setState('count');const prep=barBeats(meter)*quarter;start.current=performance.now()+prep;
  if(!silent)void sound.current.clicks(count+Math.ceil(ex.tapLength!/pulseBeats(meter)),bpm,count).catch(()=>{});
  timer.current=setInterval(()=>{const el=performance.now()-start.current;setBeat(Math.floor((el<0?el+prep:el)/(quarter*pulseBeats(meter)))%count+1);
   if(el>=0)setState(s=>s==='count'?'tap':s);
   if(el>=ex.tapLength!*quarter+quarter*.6){stopAll();setTaps([...tapsRef.current]);setState('done');}},30);
 };
 const tap=()=>{if(state!=='tap'&&state!=='count')return;const at=(performance.now()-start.current)/quarter;if(at<-.5)return;tapsRef.current.push(at);setTaps([...tapsRef.current]);};
 useEffect(()=>{if(state!=='tap'&&state!=='count')return;const key=(e:KeyboardEvent)=>{if(e.code==='Space'||e.key==='Enter'){e.preventDefault();tap();}};window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);},[state]);
 return <section className="rl-stimulus rl-tap">
  {ex.score&&ex.notes&&<RecorderCourseScore notes={ex.notes} meter={meter}/>}
  <div className="rl-beats" aria-hidden="true">{Array.from({length:count},(_,i)=><span key={i} className={(state==='count'||state==='tap')&&beat===i+1?'on':''}>{i+1}</span>)}</div>
  <p className="rl-meta" aria-live="polite">{state==='idle'?`Contagem de ${count} e depois toque.`:state==='count'?'Prepare… conte junto.':state==='tap'?'Agora!':`${taps.filter(t=>t>=-.5).length} toques registrados.`}</p>
  {state==='idle'||state==='done'?<button type="button" className="rl-btn rl-btn--secondary" disabled={locked} onClick={begin}>{state==='done'?'Tentar de novo':'Começar contagem'}</button>
  :<button type="button" className="rl-tap-pad" onPointerDown={e=>{e.preventDefault();tap();}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')e.preventDefault();}}>TOQUE</button>}
 </section>;
}

function PerformBody({ex,system,locked,setPending}:{ex:Exercise;system:RecorderSystem;locked:boolean;setPending:(p:Pending|null)=>void}){
 const notes=ex.notes!,meter=ex.meter??'4/4';
 const [tip,setTip]=useState('');const [bpm]=useState(ex.bpm??60),[mode,setMode]=useState<'idle'|'opening'|'running'|'measured'|'declared'>('idle'),[results,setResults]=useState<boolean[]>([]),[active,setActive]=useState(-1),[error,setError]=useState(''),[status,setStatus]=useState('');
 const guide=useRef(new RecorderCourseAudio()),beeper=useRef<AudioContext|null>(null),samples=useRef<ScoreSample[]>([]),timer=useRef<ReturnType<typeof setInterval>|null>(null),token=useRef(0);
 const [media]=useState(()=>new ModuleOneMedia(()=>MicrophonePitchMonitor.create(),{stop:()=>guide.current.stop(),play:()=>guide.current.play(notes,meter,bpm,{duo:ex.audio==='duo'})}));
 const stop=useCallback(()=>{token.current++;media.stop();stopLessonMetronome(beeper);if(timer.current)clearInterval(timer.current);timer.current=null;setActive(-1);},[media]);
 useEffect(()=>()=>{const c=beeper.current;beeper.current=null;if(c&&c.state!=='closed')void c.close().catch(()=>{});},[]);
 /** Bipes do metrônomo na contagem antes de tocar (o primeiro mais agudo). Devolve o atraso até o 1º bipe. */
 useEffect(()=>{const hide=()=>{if(document.hidden){stop();setMode(m=>m==='running'||m==='opening'?'idle':m);setStatus('Prática interrompida. Comece de novo quando voltar.');}};document.addEventListener('visibilitychange',hide);return ()=>{document.removeEventListener('visibilitychange',hide);stop();};},[stop]);
 const matched=results.filter(Boolean).length;
 useEffect(()=>{setPending({ready:mode==='measured'||mode==='declared',check:()=>{
  if(mode==='declared')return {ok:true,message:'Prática declarada registrada. Quando puder, toque com o microfone para conferir.',evidence:['pratica-declarada']};
  const ok=results.length>0&&matched===results.length;
  return {ok,message:ok?`${ex.correct} ${matched} de ${results.length} eventos no lugar.`:`${matched} de ${results.length} no lugar. ${tip||ex.incorrect}`,evidence:['tentativa-fisica','medicao-automatica'],validated:false};
 }});},[mode,results,tip]);
 const listen=async()=>{stop();setError('');try{await media.playGuide();}catch{setError('Não foi possível tocar o modelo.');}};
 const begin=async()=>{
  stop();setError('');setResults([]);setMode('opening');setStatus('Abrindo o microfone…');const my=token.current;samples.current=[];
  const quarter=60000/(bpm*pulseBeats(meter)),prep=barBeats(meter)*quarter,length=notes.reduce((s,n)=>s+n.beats,0)*quarter;
  try{const ok=await media.openMicrophone(()=>{},snap=>{if(my!==token.current)return;if(snap.status==='inactive'){stop();setMode('idle');setError('O microfone foi interrompido.');return;}samples.current.push({at:performance.now(),frequency:snap.status==='quiet'?null:snap.status==='pitched'&&snap.clarity>=.8&&snap.frequency!==null?snap.frequency:NaN});});track('mic',{ok:!!ok});if(!ok||my!==token.current)return;}
  catch(cause){track('mic',{ok:false,error:cause instanceof Error?cause.message:'erro'});if(my===token.current){setMode('idle');setError(cause instanceof Error?cause.message:'Não foi possível abrir o microfone. Você pode marcar “Toquei sem microfone”.');}return;}
  const startAt=performance.now()+startLessonMetronome(beeper,{countIn:Math.round(barBeats(meter)/pulseBeats(meter)),playing:Math.ceil(length/(quarter*pulseBeats(meter))),pulseMs:quarter*pulseBeats(meter),perBar:Math.round(barBeats(meter)/pulseBeats(meter))})+prep;setMode('running');
  timer.current=setInterval(()=>{const el=performance.now()-startAt;
   if(el<0){setStatus(`Prepare · ${Math.floor((el+prep)/(quarter*pulseBeats(meter)))+1}`);return;}
   let at=0,idx=-1;notes.forEach((x,i)=>{if(el/quarter>=at&&el/quarter<at+x.beats)idx=i;at+=x.beats;});setActive(idx);setStatus(idx>=0?(notes[idx].midi===null?'Silêncio':`Toque ${NAME[notes[idx].midi!]}`):'Conferindo…');
   if(el>=length+360){const all=evaluateCourse(notes,meter,samples.current,bpm,startAt),verdicts=all.map(v=>v.passed);{const k=all.findIndex(v=>!v.passed&&v.reason==='note'),evs=courseScoreEvents(notes,meter),m=k>=0?evs[k]?.note?.writtenMidi:undefined,h=m!==undefined?fingeringFor(m,system):null;setTip(k>=0?`${all[k].message}${h?` ${NAME[m!]} = furos ${h.join(' · ')} fechados${m===66?(system==='german'?' (flauta germânica: o furo 4 fica aberto e o 7 fecha)':' (o furo 4 fica aberto)'):''}.`:''}`:all.find(v=>!v.passed&&v.reason!=='signal')?.message??all.find(v=>!v.passed)?.message??'');}stop();
    const painted:boolean[]=[];let ev=0;notes.forEach((x,i)=>{if(i>0&&!(notes[i-1].tie&&notes[i-1].midi===x.midi))ev++;painted.push(verdicts[ev]??false);});
    setResults(painted);setMode('measured');setStatus('');}
  },50);
 };
 const busy=mode==='opening'||mode==='running';
 const cueOn=ex.cue&&active>=0&&notes[active]?.midi!==null;
 return <section className="rl-stimulus rl-perform">
  {ex.cue?<div className={`rl-cue ${cueOn?'is-up':''}`} aria-live="polite"><JourneyArt id="card-si" label={cueOn?'Cartão SI levantado: toque':'Cartão SI abaixado: silêncio'}/></div>:null}
  <RecorderCourseScore notes={notes} meter={meter} active={active} results={results}/>
  <p className="rl-meta">{meter} · {bpm} BPM</p>
  <NoteFingerings midis={notes.flatMap(x=>x.midi===null?[]:[x.midi])} system={system}/>
  {status&&<p className="rl-status" role="status">{status}</p>}
  {error&&<p className="rl-warning" role="alert">{error}</p>}
  <div className="rl-perform-actions">
   <button type="button" className="rl-btn rl-btn--secondary" disabled={locked||busy} onClick={()=>void listen()}><SpeakerIcon/>Ouvir modelo</button>
   <button type="button" className="rl-btn rl-btn--mic" disabled={locked} onClick={()=>busy?(stop(),setMode('idle'),setStatus('Microfone desligado.')):void begin()}>{busy?'Parar microfone':mode==='measured'?'Tocar de novo':'Tocar com microfone'}</button>
  </div>
  <div className="rl-alt" role="group" aria-label="Outras formas de registrar">
   <button type="button" disabled={locked||busy} aria-pressed={mode==='declared'} onClick={()=>{stop();setMode('declared');}}>Toquei sem microfone</button>
  </div>
  <small className="rl-fine">O microfone confere altura e duração. Não avalia respiração, postura nem timbre. Nada é gravado.</small>
 </section>;
}

function CreateBody({ex,system,locked,setPending}:{ex:Exercise;system:RecorderSystem;locked:boolean;setPending:(p:Pending|null)=>void}){
 const c=ex.create!,[values,setValues]=useState<(number|null|undefined)[]>(()=>Array(c.slots).fill(undefined));
 const audio=useRef(new RecorderCourseAudio());useEffect(()=>()=>audio.current.stop(),[]);const listener=useListener(ex);
 const complete=values.every(v=>v!==undefined)&&(!ex.audio||listener.ready);
 useEffect(()=>{setPending({ready:complete,check:()=>{const ok=checkCreation(ex,values);return {ok,message:ok?ex.correct:ex.incorrect,evidence:ex.evidence};}});},[values]);
 const cycle=(i:number)=>setValues(old=>{const next=[...old];const options=c.choices;const k=options.indexOf(next[i] as number|null);next[i]=options[(k+1)%options.length];return next;});
 const label=(v:number|null|undefined)=>v===undefined?'?':v===null?'pausa':NAME[v];
 const beat=ex.meter==='6/8'?.5:1;
 return <section className="rl-stimulus rl-create">
  {ex.audio&&<div className="rl-audio">{listener.buttons}{!listener.ready&&<small>Ouça antes de montar.</small>}</div>}
  <div className="rl-slots">{values.map((v,i)=><button type="button" key={i} disabled={locked} className={`rl-slot ${v===undefined?'is-empty':v===null?'is-rest':''}`} onClick={()=>cycle(i)} aria-label={`Tempo ${i+1}: ${label(v)}. Toque para trocar.`}><small>{i+1}</small><b>{label(v)}</b></button>)}</div>
  <p className="rl-meta">Toque em cada tempo para escolher: {c.choices.map(x=>label(x)).join(' → ')}.</p>
  <NoteFingerings midis={c.choices.flatMap(x=>x===null?[]:[x])} system={system}/>
  {!ex.audio&&<button type="button" className="rl-btn rl-btn--secondary" disabled={!complete} onClick={()=>void audio.current.play(values.map(v=>({midi:v??null,beats:beat})),ex.meter??'4/4',66).catch(()=>{})}><SpeakerIcon/>Ouvir minha criação</button>}
 </section>;
}

function ObserveBody({ex,locked,setPending}:{ex:Exercise;locked:boolean;setPending:(p:Pending|null)=>void}){
 const [checked,setChecked]=useState<number[]>([]);const listener=useListener(ex);
 const list=ex.checklist??[],all=checked.length===list.length,ready=ex.audio?listener.ready&&all:all;
 useEffect(()=>{setPending({ready,check:()=>ex.audio?{ok:true,message:ex.correct,evidence:['escuta']}:{ok:true,message:'Prática registrada. Você mesmo conferiu cada item.',evidence:ex.evidence.includes('reflexao')?['reflexao']:['pratica-declarada']}});},[ready]);
 return <section className="rl-stimulus rl-observe">
  {ex.audio&&<div className="rl-audio">{listener.buttons}{!listener.ready&&<small>Ouça os dois modelos para continuar.</small>}{listener.error&&<p className="rl-warning" role="alert">{listener.error}</p>}</div>}
  {list.length>0&&<ul className="rl-checklist">{list.map((c,i)=><li key={i}><label><input type="checkbox" disabled={locked} checked={checked.includes(i)} onChange={()=>setChecked(o=>o.includes(i)?o.filter(x=>x!==i):[...o,i])}/><span>{c}</span></label></li>)}</ul>}
 </section>;
}

/** Dedilhado de cada nota usada na atividade: a criança nunca toca uma nota sem ver como se faz. */
function MiniFingering({holes}:{holes:readonly number[]}){
 const ys=[0,1,2,3,4,5,6,7].map(n=>n===0?6:10+n*9+(n>=4?5:0));
 return <svg className="rl-mini-fing" viewBox="0 0 30 92" aria-hidden="true"><rect x="9" y="2" width="12" height="88" rx="6" fill="#F3ECD9" stroke="#C9B892"/>
  {ys.map((y,n)=><circle key={n} cx={n===0?5:15} cy={y} r={n===0?3.6:4.2} fill={holes.includes(n)?'#2B241D':'#fff'} stroke="#6b5a43" strokeWidth="1.3"/>)}</svg>;
}
export function NoteFingerings({midis,system}:{midis:readonly number[];system:RecorderSystem}){
 const list=[...new Set(midis)].filter(m=>fingeringFor(m,system));
 if(!list.length)return null;
 return <div className="rl-fings" aria-label="Como fazer cada nota">{list.map(m=>{const h=fingeringFor(m,system)!;return <figure key={m} className="rl-fing"><MiniFingering holes={h}/><figcaption><b>{NAME[m]}</b><small>furos {h.join(' ')}</small></figcaption></figure>;})}</div>;
}
function MeetBody({ex,system,setPending,onSystem}:{ex:Exercise;system:RecorderSystem;setPending:(p:Pending|null)=>void;onSystem?:(s:RecorderSystem)=>void}){
 const midi=ex.target!,holes=fingeringFor(midi,system)??[],audio=useRef(new RecorderCourseAudio()),[playing,setPlaying]=useState(false),[heard,setHeard]=useState(false);
 useEffect(()=>()=>audio.current.stop(),[]);
 useEffect(()=>{setPending({ready:true,check:()=>({ok:true,neutral:!heard,message:heard?ex.correct:`${ex.correct} Quando puder, toque em “Ouvir o ${NAME[midi]}” pra escutar.`,evidence:['leitura']})});},[heard]);
 const listen=async()=>{if(playing){audio.current.stop();setPlaying(false);return;}setPlaying(true);try{if(await audio.current.play([{midi,beats:3}],'4/4',72,{countIn:false}))setHeard(true);}catch{/* sem áudio */}setPlaying(false);};
 return <section className="rl-stimulus rl-meet">
  <div className="rl-meet-grid">
   <div className="rl-meet-score"><RecorderCourseScore notes={[{midi,beats:4}]} meter="4/4" single/><p className="rl-meta">Na pauta, o {NAME[midi]} fica aqui.</p></div>
   <RecorderDiagram holes={holes} compact/>
  </div>
  <p className="rl-meet-holes"><b>{NAME[midi]}</b> = furos {holes.join(' · ')} fechados · os outros abertos.</p>
  {(midi===65||midi===66)&&onSystem&&<div className="rl-system" role="radiogroup" aria-label="Tipo da tua flauta"><span>Minha flauta é:</span>{(['baroque','german'] as const).map(v=><button key={v} type="button" role="radio" aria-checked={system===v} className={system===v?'is-on':''} onClick={()=>onSystem(v)}>{v==='baroque'?'Barroca':'Germânica'}</button>)}<small>No Fá e no Fá sustenido o dedilhado muda. Na dúvida, veja a caixinha ou o manual da tua flauta: lá diz “barroca” ou “germânica”.</small></div>}
  {system==='german'&&CHECK_GERMAN.has(midi)&&<p className="rl-fine">Na flauta germânica, este dedilhado pode mudar: confira a tabela que veio com a sua flauta.</p>}
  <button type="button" className="rl-listen" onClick={()=>void listen()}><SpeakerIcon/>{playing?'Parar':`Ouvir o ${NAME[midi]}`}</button>
 </section>;
}
