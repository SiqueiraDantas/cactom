import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {track} from '../lib/devEvents';
import {bandExercises,bandJourney,readBandJourney,completeBandLesson,bandLessonName,bandLessonTasks,bandFingering,fingeringLabel,noteName,readTrumpetKey,saveTrumpetKey,soundingOffset,type BandExercise,type BandInstrument,type TrailCourse,type TrumpetKey} from '../lib/bandTrail';
import {readClef,saveClef,CLEF_UNIT,type Clef} from '../lib/iniciacao';
import {TREBLE_CLEF_PATH,BASS_CLEF_PATH} from '../lib/trebleClef';
import {evaluateCourse,barBeats,pulseBeats,type CourseNote} from '../lib/recorderFullCourse';
import {RecorderCourseAudio} from '../lib/recorderCourseAudio';
import {LessonSound} from '../lib/lessonSound';
import {MicrophonePitchMonitor} from '../lib/audio';
import {ModuleOneMedia} from '../lib/recorderModuleOneMedia';
import {markPracticeDay} from '../lib/practiceDay';
import type {Evidence,LessonOutcome} from '../lib/recorderJourney';
import {scoreTaps} from '../lib/recorderExercises';
import type {ScoreSample} from '../lib/scoreAssessment';
import {useProfileStorage} from './ProfileStorage';
import {RecorderCourseScore} from './RecorderCourseScore';
import {startLessonMetronome,stopLessonMetronome} from '../lib/lessonMetronome';
import {TomOfficial} from './CactomBrand';
import './recorder-lesson.css';
import './band-lesson.css';

type Verdict={ok:boolean;neutral?:boolean;skipped?:boolean;message:string};
type Pending={ready:boolean;check:()=>Verdict};
type Item={ex:BandExercise;retry:boolean};
type Result={correctFirst:boolean;recovered:boolean;evidence:Evidence[];skipped?:boolean;needsReview:boolean};
const voiceOf=(i:TrailCourse)=>i==='iniciacao'?'teclado' as const:i==='clarinet-bb'?'clarinete' as const:readTrumpetKey()==='do'?'trompete-do' as const:'trompete' as const;
const NAME_OF={'trumpet-bb':'trompete','clarinet-bb':'clarinete','iniciacao':'iniciação musical'} as const;

/** Revisão de uma parada: primeiro o que ficou pendente, depois outras telas da parada (até 6). */
export function reviewBandExercises(instrument:TrailCourse,stopId:string,needed:readonly string[],clef:Clef='sol'):BandExercise[]{
 const stop=bandJourney(instrument).engine.stop(stopId);if(!stop)return [];
 const pool=stop.lessonIds.flatMap(l=>bandExercises(instrument,l,clef)).filter(e=>e.phase!=='apoio');
 const missed=pool.filter(e=>needed.includes(e.id)),auto=pool.filter(e=>!missed.includes(e)&&e.kind!=='observe');
 const spread=auto.filter((_,k)=>k%2===0).concat(auto.filter((_,k)=>k%2===1));
 return [...missed,...spread].slice(0,6);
}

/** Lição do trompete/clarinete no mesmo formato da flauta: apresentação, história, telas com erro que volta no fim, conclusão com revisão espaçada. */
export function BandLesson({instrument,stopId,lessonId,review=false,onExit}:{instrument:TrailCourse;stopId:string;lessonId?:string;review?:boolean;onExit:()=>void}){
 const storage=useProfileStorage();
 const journey=bandJourney(instrument),stop=journey.engine.stop(stopId)??journey.stops.find(s=>s.lessonIds.includes(lessonId??''))!;
 const lesson=lessonId??stop.lessonIds[0];
 const [loaded]=useState(()=>readBandJourney(storage,instrument));
 const ini=instrument==='iniciacao',needsClef=ini&&stop.unit>=CLEF_UNIT;
 const [clef,setClef]=useState<Clef|null>(()=>ini?readClef(storage):null);
 const exercises=useMemo(()=>review?reviewBandExercises(instrument,stop.id,loaded.ledger.reviewNeeded,clef??'sol'):bandExercises(instrument,lesson,clef??'sol'),[instrument,lesson,review,stop.id,loaded,clef]);
 const [stage,setStage]=useState<'intro'|'story'|'activity'|'done'>('intro');
 const [queue,setQueue]=useState<Item[]>(()=>exercises.map(ex=>({ex,retry:false})));
 useEffect(()=>{if(stage==='intro')setQueue(exercises.map(ex=>({ex,retry:false})));},[exercises]);
 const [pos,setPos]=useState(0),[verdict,setVerdict]=useState<Verdict|null>(null),[pending,setPending]=useState<Pending|null>(null);
 const [results,setResults]=useState<Record<string,Result>>({}),[saved,setSaved]=useState<{xp:number;nextReview?:string;warning:string}|null>(null),[silent,setSilent]=useState(false);
 const sound=useRef(new LessonSound());useEffect(()=>()=>sound.current.stop(),[]);
 const headingRef=useRef<HTMLHeadingElement>(null),feedbackRef=useRef<HTMLDivElement>(null);
 useEffect(()=>{headingRef.current?.focus({preventScroll:true});window.scrollTo({top:0,behavior:'auto'});},[stage,pos]);
 useEffect(()=>{if(verdict)feedbackRef.current?.focus({preventScroll:true});},[verdict]);
 const item=queue[pos],answered=Object.values(results).filter(r=>!r.needsReview||r.recovered||r.skipped).length;
 const tasks=bandLessonTasks(instrument,lesson),lessonName=review?'Revisão':bandLessonName(instrument,lesson);
 const check=()=>{if(!pending?.ready||verdict)return;const v=pending.check();setVerdict(v);if(item)track('answer',{exercise:item.ex.id,kind:item.ex.kind,ok:v.ok||!!v.neutral,skipped:!!v.skipped,retry:item.retry,lesson:lesson,instruction:item.ex.instruction});if(!silent&&!v.neutral&&!v.skipped)void sound.current.chime(v.ok);};
 const advance=()=>{
  if(!item||!verdict)return;const {ex,retry}=item,previous=results[ex.id],ok=verdict.ok||!!verdict.neutral;
  const result:Result=retry?{...previous!,recovered:ok&&!verdict.skipped,needsReview:!ok||!!verdict.skipped}:{correctFirst:ok&&!verdict.skipped,recovered:false,evidence:ex.evidence,skipped:verdict.skipped,needsReview:!ok||!!verdict.skipped};
  const nextResults={...results,[ex.id]:result};setResults(nextResults);
  let next=queue;if(!retry&&!ok&&!verdict.skipped){next=[...queue,{ex,retry:true}];setQueue(next);}
  setVerdict(null);setPending(null);
  if(pos+1<next.length){const following=next[pos+1];setPos(pos+1);setStage(following.ex.kind==='story'&&!following.retry?'story':'activity');return;}
  finish(nextResults);
 };
 const finish=(final:Record<string,Result>)=>{
  const outcome:LessonOutcome={lessonId:review?`review:${stop.id}`:lesson,stopId:stop.id,review,at:new Date(),presentations:Object.entries(final).map(([id,r])=>({id,correctFirst:r.correctFirst,recovered:r.recovered,evidence:r.evidence,skipped:r.skipped}))};
  try{const done=completeBandLesson(storage,instrument,outcome);if(outcome.presentations.some(p=>!p.skipped))markPracticeDay(storage);track('lesson_complete',{lesson:outcome.lessonId,stop:stop.id,instrument,review,xp:done.xp,total:outcome.presentations.length,correctFirst:outcome.presentations.filter(p=>p.correctFirst).length});setSaved({xp:done.xp,nextReview:done.ledger.stops[stop.id]?.nextReview,warning:done.warning});}
  catch(error){setSaved({xp:0,warning:error instanceof Error?error.message:'Não foi possível registrar.'});}
  setStage('done');if(!silent)void sound.current.celebrate();
 };
 const header=<header className="rl-top">
  <button type="button" className="rl-close" onClick={onExit} aria-label="Sair da lição e voltar à trilha"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
  <div className="rl-progress" role="progressbar" aria-label="Progresso da lição" aria-valuemin={0} aria-valuemax={queue.length} aria-valuenow={Math.min(answered,queue.length)}><span style={{width:`${stage==='intro'?0:stage==='done'?100:Math.min(100,answered/queue.length*100)}%`}}/></div>
  <button type="button" className="rl-sound" aria-pressed={!silent} onClick={()=>{setSilent(s=>!s);sound.current.stop();}}>{silent?'Som: não':'Som: sim'}</button>
 </header>;
 if(stage==='intro'){const fresh=exercises.filter(e=>e.kind==='meet').map(e=>e.target!);
  return <div className="rl rl--intro" data-environment="introducao">{header}<main className="rl-main">
  <div className="rl-intro-hero"><TomOfficial decorative expression="animado" className="rl-intro-tom"/><div className="rl-bubble"><span className="rl-eyebrow">{NAME_OF[instrument].toLocaleUpperCase('pt-BR')} · Unidade {stop.unit} · {stop.label}{review||lessonName===stop.label?'':` · ${lessonName}`}</span><h1 ref={headingRef} tabIndex={-1}>{review?'Hora de revisar':stop.unitGoal}</h1><p>{review?'Bora retomar o que pediu mais atenção nesta parada, visse?':stop.kind==='desafio'?'Chegou a hora de mostrar tudo que tu aprendeu nesta seção. Sem pressa, visse?':`Bora! Nesta lição tu vai ${tasks[0]?.charAt(0).toLocaleLowerCase('pt-BR')}${tasks[0]?.slice(1)}`}</p></div></div>
  <section className="rl-card"><h2>O que tu vai praticar</h2><ul className="rl-goals">{tasks.slice(0,3).map(t=><li key={t}>{t}</li>)}</ul>{instrument==='trumpet-bb'&&<TrumpetKeyChoice/>}{needsClef&&<ClefChoice value={clef} onChange={c=>{saveClef(storage,c);setClef(c);}}/>}{fresh.length>0&&<p className="rl-meta">Nota{fresh.length>1?'s':''} nova{fresh.length>1?'s':''}: {fresh.map(n=>noteName(instrument,n)).join(', ')}</p>}<p className="rl-meta">{exercises.length} telas · cerca de {Math.max(2,Math.round(exercises.length*.8))} min</p></section>
 </main><footer className="rl-footer"><button type="button" className="rl-btn rl-btn--ghost" onClick={onExit}>Agora não</button><button type="button" className="rl-btn" onClick={()=>{track('lesson_start',{lesson:lesson,stop:stopId,instrument:instrument,review,screens:queue.length});setStage(queue[0]?.ex.kind==='story'?'story':'activity')}} disabled={!exercises.length||(needsClef&&!clef)}>{needsClef&&!clef?'Escolha a clave':'Começar'}</button></footer></div>;}
 if(stage==='story'&&item?.ex.story)return <div className="rl rl--story" data-environment="historia">{header}<main className="rl-main"><section className="rl-story"><span className="rl-eyebrow">História do ensaio</span><h1 ref={headingRef} tabIndex={-1}>{item.ex.story.title}</h1><div className="rl-story-scene"><TomOfficial decorative expression="pensativo" className="rl-story-tom"/><div className="rl-bubble rl-story-bubble"><p className="rl-story-text">{item.ex.story.scene}</p></div></div></section></main><footer className="rl-footer"><button type="button" className="rl-btn" onClick={()=>setStage('activity')}>Resolver</button></footer></div>;
 if(stage==='done'){
  const list=Object.entries(results).filter(([id])=>!/-(B|N)\d+-P1$/.test(id)),first=list.filter(([,r])=>r.correctFirst).length,recovered=list.filter(([,r])=>r.recovered).length,needs=list.filter(([,r])=>!r.correctFirst);
  const byId=new Map(exercises.map(e=>[e.id,e]));
  return <div className="rl rl--done" data-environment="conclusao">{header}<main className="rl-main"><section className="rl-done">
   <TomOfficial decorative expression="comemorando" className="rl-done-tom"/>
   <h1 ref={headingRef} tabIndex={-1}>{review?'Revisão feita, arretado!':stop.kind==='desafio'?'Desafio vencido, arretado!':'Lição concluída, arretado!'}</h1>
   <div className="rl-stats"><div><b>+{saved?.xp??0}</b><span>XP de prática</span></div><div><b>{first}/{list.length}</b><span>de primeira</span></div><div><b>{recovered}</b><span>recuperadas</span></div></div>
   <section className="rl-card"><h2>Habilidades praticadas</h2><ul className="rl-goals">{tasks.slice(0,3).map(t=><li key={t}>{t}</li>)}</ul></section>
   <section className="rl-card"><h2>{needs.length?'Pra revisar':'Revisão'}</h2>{needs.length?<ul className="rl-goals rl-goals--review">{needs.map(([id,r])=><li key={id}>{byId.get(id)?.instruction}{r.recovered?' · recuperada, volta na revisão':r.skipped?' · ficou pra depois':''}</li>)}</ul>:<p>Nada pendente desta lição.</p>}{saved?.nextReview&&<p className="rl-meta">Próxima revisão desta parada: {new Date(saved.nextReview).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</p>}</section>
   <p className="rl-evidence">Teu rojão de hoje tá garantido, visse! Prática registrada não é nota nem certificado.</p>
   {saved?.warning&&<p className="rl-warning" role="status">{saved.warning}</p>}
  </section></main><footer className="rl-footer"><button type="button" className="rl-btn" onClick={onExit} autoFocus>Voltar à trilha</button></footer></div>;}
 if(!item)return null;
 const {ex,retry}=item,canSkip=ex.kind==='perform'||ex.kind==='tap'||ex.kind==='listen'||ex.kind==='compare'||(ex.kind==='create'&&ex.create?.rule==='match');
 return <div className={`rl rl--activity ${verdict?'has-feedback':''}`} data-environment="atividade" data-kind={ex.kind} data-exercise={ex.id}>{header}
  <main className="rl-main">
   {retry&&<p className="rl-retry-label">Corrija o erro de antes</p>}
   {ex.phase==='aplicacao'&&!retry&&stop.kind!=='desafio'&&!review&&<p className="rl-retry-label band-phase">Exemplo novo</p>}
   <h1 className="rl-instruction" ref={headingRef} tabIndex={-1}>{ex.instruction}</h1>
   <p className="rl-prompt">{ex.prompt}</p>
   <Body key={ex.id+(retry?'-r':'')} ex={ex} instrument={instrument} locked={!!verdict} setPending={setPending} silent={silent}/>
  </main>
  {verdict?<div className={`rl-feedback ${verdict.skipped?'is-skip':verdict.neutral?'is-neutral':verdict.ok?'is-ok':'is-error'}`} role="status" ref={feedbackRef} tabIndex={-1}>
   <div className="rl-feedback-copy"><strong>{verdict.skipped?'Fica pra depois, visse':verdict.neutral?'Anotado!':verdict.ok?(retry?'Agora foi!':'Arretado!'):'Eita, quase!'}</strong><p>{verdict.message}</p>{!verdict.ok&&!verdict.neutral&&!verdict.skipped&&<p className="rl-hint"><b>Pista:</b> {ex.hint}</p>}{!verdict.ok&&!verdict.neutral&&!verdict.skipped&&!retry&&<p className="rl-meta">Esta tela volta no fim da lição.</p>}</div>
   <button type="button" className="rl-btn" onClick={advance} autoFocus>Continuar</button>
  </div>:<footer className="rl-footer">
   {canSkip?<button type="button" className="rl-btn rl-btn--ghost" onClick={()=>setVerdict({ok:false,skipped:true,message:'Sem problema. Essa entra na tua revisão.'})}>{ex.kind==='perform'?'Não posso tocar agora':ex.kind==='tap'?'Agora não':'Não posso ouvir agora'}</button>:<span/>}
   <button type="button" className="rl-btn" disabled={!pending?.ready} onClick={check}>{ex.kind==='meet'?'Entendi':'Verificar'}</button>
  </footer>}
 </div>;
}

function Body({ex,instrument,locked,setPending,silent}:{ex:BandExercise;instrument:TrailCourse;locked:boolean;setPending:(p:Pending|null)=>void;silent:boolean}){
 if(ex.kind==='build')return <BuildBody ex={ex} instrument={instrument} locked={locked} setPending={setPending}/>;
 if(ex.kind==='tap')return <TapBody ex={ex} instrument={instrument} locked={locked} setPending={setPending} silent={silent}/>;
 if(ex.kind==='create')return <CreateBody ex={ex} instrument={instrument} locked={locked} setPending={setPending}/>;
 if(ex.kind==='observe')return <ObserveBody ex={ex} locked={locked} setPending={setPending}/>;
 if(ex.kind==='meet')return <MeetBody ex={ex} instrument={instrument} setPending={setPending}/>;
 if(ex.kind==='perform')return <PerformBody ex={ex} instrument={instrument} locked={locked} setPending={setPending}/>;
 return <ChoiceBody ex={ex} instrument={instrument} locked={locked} setPending={setPending}/>;
}

/** Desenho do dedilhado: trompete (3 pistos) ou clarinete (polegar + 3 furos da mão esquerda). */
/** Desenho do dedilhado no estilo das tabelas de referência: trompete (Tonestro, pisto roxo = apertado)
 * e clarinete (tabela Yamaha: ● fechado/apertado, ○ aberto; chave de registro, polegar, chaves do Lá e do Sol♯, mãos esquerda e direita). */
export function BandFingering({instrument,keys,small=false}:{instrument:TrailCourse;keys:readonly string[];small?:boolean}){
 if(instrument==='iniciacao')return null;
 if(instrument==='trumpet-bb')return <svg className={`band-fing band-fing--tpt${small?' is-small':''}`} viewBox="0 0 220 120" role="img" aria-label={fingeringLabel(instrument,keys)}>
  <rect x="4" y="66" width="22" height="12" rx="4" fill="#8A8F98"/><rect x="24" y="68" width="40" height="8" rx="4" fill="#F2B530"/>
  <path d="M60 60 H150 Q182 58 214 26 V118 Q182 86 150 84 H60 Z" fill="#FFC83D" stroke="#D99A16" strokeWidth="2"/>
  <ellipse cx="212" cy="72" rx="6" ry="46" fill="#A8541A"/>
  <rect x="64" y="86" width="86" height="22" rx="11" fill="none" stroke="#F2B530" strokeWidth="7"/>
  {['1','2','3'].map((k,i)=>{const down=keys.includes(k),x=80+i*26;return <g key={k}>
   <rect x={x-7} y={down?44:30} width="14" height={down?48:62} rx="4" fill="#F2B530" stroke="#D99A16" strokeWidth="1.5"/>
   <rect x={x-10} y={down?36:22} width="20" height="10" rx="4" fill={down?'#7C3AED':'#F2B530'} stroke={down?'#5B21B6':'#D99A16'} strokeWidth="1.5"/>
   <text x={x} y="16" textAnchor="middle" fontSize="12" fontWeight="900" fill={down?'#7C3AED':'#8A8A8A'}>{k}</text></g>;})}
 </svg>;
 const on=(k:string)=>keys.includes(k),hole=(k:string,cx:number,cy:number,r=8.5)=><circle key={k} cx={cx} cy={cy} r={r} fill={on(k)?'#111':'#fff'} stroke="#111" strokeWidth="2"/>;
 return <svg className={`band-fing band-fing--cla${small?' is-small':''}`} viewBox="0 0 120 300" role="img" aria-label={fingeringLabel(instrument,keys)}>
  <rect x="44" y="8" width="34" height="284" rx="16" fill="#F1E9D2" stroke="#A8935F" strokeWidth="2.5"/>
  <ellipse cx="61" cy="30" rx="7" ry="11" fill={on('A')?'#111':'#fff'} stroke="#111" strokeWidth="2"/>
  <path d="M86 32 q10 6 8 22 q-6 -2 -10 -10 z" fill="#fff" stroke="#111" strokeWidth="1.8"/>
  <ellipse cx="22" cy="40" rx="6" ry="10" fill={on('R')?'#111':'#fff'} stroke="#111" strokeWidth="2"/>
  {hole('T',22,68,8)}
  {hole('1',61,74)}{hole('2',61,104)}{hole('3',61,134)}
  <path d="M70 150 h14 v6 h-14 z M36 150 h10 v6 h-10z" fill="#fff" stroke="#111" strokeWidth="1.5"/>
  {hole('4',61,186)}{hole('5',61,216)}{hole('6',61,246)}
  <path d="M30 262 q14 -6 24 4 q-12 10 -24 4 z M30 276 q14 -6 24 4 q-12 10 -24 4 z" fill="#fff" stroke="#111" strokeWidth="1.5"/>
  {!small&&<g fontSize="11" fontWeight="800" fill="#4B4B4B"><text x="22" y="22" textAnchor="middle">registro</text><text x="22" y="92" textAnchor="middle">polegar</text><text x="98" y="34">Lá</text>
   <text x="88" y="78">1</text><text x="88" y="108">2</text><text x="88" y="138">3</text><text x="88" y="190">1</text><text x="88" y="220">2</text><text x="88" y="250">3</text>
   <text x="104" y="108" fontSize="9" fill="#888" transform="rotate(90 104 108)">mão esquerda</text><text x="104" y="218" fontSize="9" fill="#888" transform="rotate(90 104 218)">mão direita</text></g>}
 </svg>;
}
function BandFingerings({instrument,midis}:{instrument:TrailCourse;midis:readonly number[]}){
 if(instrument==='iniciacao')return null;
 const list=[...new Set(midis)].filter(m=>bandFingering(instrument,m));
 return <div className="rl-fings" aria-label="Como fazer cada nota">{list.map(m=><figure key={m} className="rl-fing"><BandFingering instrument={instrument} keys={bandFingering(instrument,m)!} small/><figcaption><b>{noteName(instrument,m)}</b><small>{fingeringLabel(instrument,bandFingering(instrument,m)!)}</small></figcaption></figure>)}</div>;
}
function useModel(instrument:TrailCourse){
 const audio=useRef(new RecorderCourseAudio()),[playing,setPlaying]=useState(false),[heard,setHeard]=useState(false);
 useEffect(()=>()=>audio.current.stop(),[]);
 const play=async(notes:CourseNote[],countIn=false,bpm=72,extra:{duo?:boolean;meter?:'4/4'|'3/4'|'2/4'|'6/8'}={})=>{if(playing){audio.current.stop();setPlaying(false);return;}setPlaying(true);try{const low=Math.min(...notes.flatMap(n=>n.midi===null?[]:[n.midi]));if(await audio.current.play(notes,extra.meter??'4/4',bpm,{countIn,voice:voiceOf(instrument),...(extra.duo?{duo:true,duoMidi:low-5,sustained:true}:{})}))setHeard(true);}catch{/* sem áudio */}setPlaying(false);};
 return {play,playing,heard,stop:()=>audio.current.stop()};
}
function SpeakerIcon(){return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>;}

function MeetBody({ex,instrument,setPending}:{ex:BandExercise;instrument:TrailCourse;setPending:(p:Pending|null)=>void}){
 const midi=ex.target!,keys=bandFingering(instrument,midi),model=useModel(instrument);
 useEffect(()=>{setPending({ready:true,check:()=>({ok:true,neutral:!model.heard,message:model.heard?ex.correct:`${ex.correct} Quando puder, toque em “Ouvir o ${noteName(instrument,midi)}”.`})});},[model.heard]);
 return <section className="rl-stimulus rl-meet">
  <div className="rl-meet-grid">
   <div className="rl-meet-score"><RecorderCourseScore notes={[{midi,beats:4}]} meter="4/4" single instrument={NAME_OF[instrument]} clef={ex.clef}/><p className="rl-meta">Na pauta, o {noteName(instrument,midi)} fica aqui.</p></div>
   {keys&&<BandFingering instrument={instrument} keys={keys}/>}
  </div>
  {keys?<p className="rl-meet-holes"><b>{noteName(instrument,midi)}</b> = {fingeringLabel(instrument,keys).toLocaleLowerCase('pt-BR')}.</p>:<p className="rl-meet-holes"><b>{noteName(instrument,midi)}</b></p>}
  <button type="button" className="rl-listen" onClick={()=>void model.play([{midi,beats:3}])}><SpeakerIcon/>{model.playing?'Parar':`Ouvir o ${noteName(instrument,midi)}`}</button>
 </section>;
}
function ChoiceBody({ex,instrument,locked,setPending}:{ex:BandExercise;instrument:TrailCourse;locked:boolean;setPending:(p:Pending|null)=>void}){
 const [choice,setChoice]=useState<number|null>(null),model=useModel(instrument),modelB=useModel(instrument),needsAudio=ex.kind==='listen',compare=ex.kind==='compare';
 const [heardA,setHeardA]=useState(false),[heardB,setHeardB]=useState(false);
 useEffect(()=>{if(model.heard)setHeardA(true);},[model.heard]);useEffect(()=>{if(modelB.heard)setHeardB(true);},[modelB.heard]);
 const audioReady=compare?heardA&&heardB:!needsAudio||model.heard;
 useEffect(()=>{setPending({ready:choice!==null&&audioReady,check:()=>{const ok=choice===ex.answer;return {ok,message:ok?ex.correct:ex.incorrect};}});},[choice,audioReady]);
 return <section className="rl-stimulus">
  {ex.kind==='story'&&ex.story&&<div className="rl-story-scene band-story"><TomOfficial decorative expression="pensativo" className="rl-story-tom"/><div className="rl-bubble rl-story-bubble"><b>{ex.story.title}</b><p className="rl-story-text">{ex.story.scene}</p></div></div>}
  {ex.kind==='read'&&<div className="rl-meet-score band-read"><RecorderCourseScore notes={ex.notes!} meter={ex.meter??'4/4'} single={ex.notes!.length===1} hideLabels instrument={NAME_OF[instrument]} clef={ex.clef}/></div>}
  {needsAudio&&<div className="rl-audio"><button type="button" className="rl-listen" onClick={()=>void model.play(ex.notes!,false,ex.bpm??72,{meter:ex.meter})}><SpeakerIcon/>{model.playing?'Parar':'Ouvir'}</button>{!model.heard&&<small>Ouça antes de responder.</small>}</div>}
  {compare&&<div className="rl-audio"><div className="rl-listen-row"><button type="button" className="rl-listen" onClick={()=>void model.play(ex.notes!)}><SpeakerIcon/>{model.playing?'Parar':'Modelo A'}</button><button type="button" className="rl-listen rl-listen--b" onClick={()=>void modelB.play(ex.alternative!)}><SpeakerIcon/>{modelB.playing?'Parar':'Modelo B'}</button></div>{!(heardA&&heardB)&&<small>Ouça os dois modelos para responder.</small>}</div>}
  <div className={`band-options ${ex.kind==='fingering'?'band-options--fing':''}`} role="radiogroup" aria-label={ex.instruction}>{ex.options!.map((o,i)=>{
   const state=locked?(i===ex.answer?'is-right':i===choice?'is-wrong':''):'';
   return <button key={i} type="button" role="radio" aria-checked={choice===i} disabled={locked} className={`rl-option band-option ${choice===i?'is-selected':''} ${state}`} onClick={()=>setChoice(i)}>{o.keys&&<BandFingering instrument={instrument} keys={o.keys} small/>}<span>{o.label}</span></button>;})}</div>
 </section>;
}
function PerformBody({ex,instrument,locked,setPending}:{ex:BandExercise;instrument:TrailCourse;locked:boolean;setPending:(p:Pending|null)=>void}){
 const notes=ex.notes!,meter=ex.meter??'4/4',bpm=ex.bpm??60;
 const [mode,setMode]=useState<'idle'|'opening'|'running'|'measured'|'declared'>('idle'),[results,setResults]=useState<boolean[]>([]),[active,setActive]=useState(-1),[status,setStatus]=useState(''),[error,setError]=useState('');
 const model=useModel(instrument),samples=useRef<ScoreSample[]>([]),timer=useRef<ReturnType<typeof setInterval>|null>(null),token=useRef(0),beeper=useRef<AudioContext|null>(null);
 const [media]=useState(()=>new ModuleOneMedia(()=>MicrophonePitchMonitor.create(),{stop:()=>model.stop(),play:()=>Promise.resolve(true)}));
 const stop=useCallback(()=>{token.current++;media.stop();stopLessonMetronome(beeper);if(timer.current)clearInterval(timer.current);timer.current=null;setActive(-1);},[media]);
 useEffect(()=>()=>{stop();const c=beeper.current;beeper.current=null;if(c&&c.state!=='closed')void c.close().catch(()=>{});},[stop]);
 const matched=results.filter(Boolean).length;
 useEffect(()=>{setPending({ready:mode==='measured'||mode==='declared',check:()=>{
  if(mode==='declared')return {ok:true,neutral:true,message:'Prática anotada. Quando puder, toque com o microfone pra conferir.'};
  const ok=results.length>0&&matched===results.length;
  return {ok,message:ok?`${ex.correct} ${matched} de ${results.length} no lugar.`:`${matched} de ${results.length} no lugar. ${ex.incorrect}`};
 }});},[mode,results]);
 const begin=async()=>{
  stop();setError('');setResults([]);setMode('opening');setStatus('Abrindo o microfone…');const my=token.current;samples.current=[];
  const quarter=60000/(bpm*pulseBeats(meter)),prep=barBeats(meter)*quarter,length=notes.reduce((s,n)=>s+n.beats,0)*quarter;
  try{const ok=await media.openMicrophone(()=>{},snap=>{if(my!==token.current)return;if(snap.status==='inactive'){stop();setMode('idle');setError('O microfone foi interrompido.');return;}samples.current.push({at:performance.now(),frequency:snap.status==='quiet'?null:snap.status==='pitched'&&snap.clarity>=.8&&snap.frequency!==null?snap.frequency:NaN});});track('mic',{ok:!!ok});if(!ok||my!==token.current)return;}
  catch(cause){track('mic',{ok:false,error:cause instanceof Error?cause.message:'erro'});if(my===token.current){setMode('idle');setError(cause instanceof Error?cause.message:'Não foi possível abrir o microfone.');}return;}
  const startAt=performance.now()+startLessonMetronome(beeper,{countIn:Math.round(barBeats(meter)/pulseBeats(meter)),playing:Math.ceil(length/(quarter*pulseBeats(meter))),pulseMs:quarter*pulseBeats(meter),perBar:Math.round(barBeats(meter)/pulseBeats(meter))})+prep;setMode('running');
  timer.current=setInterval(()=>{const el=performance.now()-startAt;
   if(el<0){setStatus(`Prepare · ${Math.floor((el+prep)/(quarter*pulseBeats(meter)))+1}`);return;}
   let at=0,idx=-1;notes.forEach((x,i)=>{if(el/quarter>=at&&el/quarter<at+x.beats)idx=i;at+=x.beats;});setActive(idx);setStatus(idx>=0?(notes[idx].midi===null?'Silêncio':`Toque ${noteName(instrument,notes[idx].midi!)}`):'Conferindo…');
   if(el>=length+360){const v=evaluateCourse(notes,meter,samples.current,bpm,startAt,soundingOffset(instrument)).map(x=>x.passed);stop();setResults(v);setMode('measured');setStatus('');}
  },50);
 };
 const busy=mode==='opening'||mode==='running';
 return <section className="rl-stimulus rl-perform">
  <RecorderCourseScore notes={notes} meter={meter} active={active} results={results} instrument={NAME_OF[instrument]} clef={ex.clef}/>
  <p className="rl-meta">{meter} · {bpm} BPM</p>
  <BandFingerings instrument={instrument} midis={notes.flatMap(n=>n.midi===null?[]:[n.midi])}/>
  {status&&<p className="rl-status" role="status">{status}</p>}
  {error&&<p className="rl-warning" role="alert">{error}</p>}
  <div className="rl-perform-actions">
   {!ex.noModel&&<button type="button" className="rl-btn rl-btn--secondary" disabled={locked||busy} onClick={()=>void model.play(notes,true,bpm,{duo:ex.duo,meter})}><SpeakerIcon/>{model.playing?'Parar':'Ouvir modelo'}</button>}
   <button type="button" className="rl-btn rl-btn--mic" disabled={locked} onClick={()=>busy?(stop(),setMode('idle'),setStatus('Microfone desligado.')):void begin()}>{busy?'Parar microfone':mode==='measured'?'Tocar de novo':'Tocar com microfone'}</button>
  </div>
  <div className="rl-alt" role="group" aria-label="Outras formas de registrar"><button type="button" disabled={locked||busy} aria-pressed={mode==='declared'} onClick={()=>{stop();setMode('declared');}}>Toquei sem microfone</button></div>
  <small className="rl-fine">O microfone confere a nota e o tempo. Nada é gravado.</small>
 </section>;
}

/** Montar o dedilhado: a criança aperta os pistos (trompete) ou fecha furos e chaves (clarinete) no desenho. */
const KEY_LABEL:Record<BandInstrument,[string,string][]>={
 'trumpet-bb':[['1','Pisto 1'],['2','Pisto 2'],['3','Pisto 3']],
 'clarinet-bb':[['R','Chave de registro'],['T','Polegar (atrás)'],['A','Chave do Lá'],['1','Esquerda: indicador'],['2','Esquerda: médio'],['3','Esquerda: anelar'],['4','Direita: indicador'],['5','Direita: médio'],['6','Direita: anelar']]};
function BuildBody({ex,instrument,locked,setPending}:{ex:BandExercise;instrument:TrailCourse;locked:boolean;setPending:(p:Pending|null)=>void}){
 const midi=ex.target!,expected=bandFingering(instrument,midi)!,[keys,setKeys]=useState<string[]>([]),[touched,setTouched]=useState(false);
 useEffect(()=>{setPending({ready:touched||expected.length===0,check:()=>{const ok=keys.length===expected.length&&expected.every(k=>keys.includes(k));return {ok,message:ok?ex.correct:ex.incorrect};}});},[keys,touched]);
 const toggle=(k:string)=>{setTouched(true);setKeys(o=>o.includes(k)?o.filter(x=>x!==k):[...o,k]);};
 return <section className="rl-stimulus band-build">
  <div className="rl-meet-grid">
   <div className="rl-meet-score"><RecorderCourseScore notes={[{midi,beats:4}]} meter="4/4" single instrument={NAME_OF[instrument]} clef={ex.clef}/><p className="rl-meta">{ex.hideModel?'Que nota é essa? Monte ela.':`Esta é o ${noteName(instrument,midi)}.`}</p></div>
   <BandFingering instrument={instrument} keys={keys}/>
  </div>
  <div className={`band-keys band-keys--${instrument==='trumpet-bb'?'tpt':'cla'}`} role="group" aria-label="Pistos, furos e chaves">
   {KEY_LABEL[instrument as BandInstrument].map(([k,label])=><button key={k} type="button" aria-pressed={keys.includes(k)} disabled={locked} className={keys.includes(k)?'is-on':''} onClick={()=>toggle(k)}>{label}</button>)}
  </div>
  {expected.length===0&&!touched&&<p className="rl-meta">Dica: tem nota que se faz sem apertar nada.</p>}
 </section>;
}
/** Bater o ritmo: contagem, depois um toque em cada nota (ou em cada pulso). */
function TapBody({ex,instrument,locked,setPending,silent}:{ex:BandExercise;instrument:TrailCourse;locked:boolean;setPending:(p:Pending|null)=>void;silent:boolean}){
 const meter=ex.meter??'4/4',bpm=ex.bpm??60,quarter=60000/(bpm*pulseBeats(meter)),count=barBeats(meter)/pulseBeats(meter);
 const [state,setState]=useState<'idle'|'count'|'tap'|'done'>('idle'),[beat,setBeat]=useState(0),[taps,setTaps]=useState<number[]>([]);
 const start=useRef(0),timer=useRef<ReturnType<typeof setInterval>|null>(null),sound=useRef(new LessonSound()),tapsRef=useRef<number[]>([]),echo=useModel(instrument);
 const stopAll=useCallback(()=>{if(timer.current)clearInterval(timer.current);timer.current=null;sound.current.stop();},[]);
 useEffect(()=>stopAll,[stopAll]);
 const verdict=useMemo(()=>scoreTaps(ex.tapBeats!,taps,quarter),[taps,quarter,ex.tapBeats]);
 useEffect(()=>{setPending({ready:state==='done',check:()=>({ok:verdict.ok,message:verdict.ok?ex.correct:verdict.early?'Tu entrou antes do tempo. Espere a nota e toque junto com ela.':verdict.extra&&!verdict.missing?'Teve toque a mais. Nas pausas, não toque.':verdict.late?'Tu entrou depois do tempo. Prepare antes e toque junto com o clique.':ex.incorrect})});},[state,verdict]);
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
  {ex.score&&ex.notes&&<RecorderCourseScore notes={ex.notes} meter={meter} instrument={NAME_OF[instrument]} clef={ex.clef}/>}
  {!ex.score&&ex.notes&&<div className="rl-audio"><button type="button" className="rl-listen" disabled={state==='count'||state==='tap'} onClick={()=>void echo.play(ex.notes!,false,bpm,{meter})}><SpeakerIcon/>{echo.playing?'Parar':'Ouvir o ritmo'}</button></div>}
  <div className="rl-beats" aria-hidden="true">{Array.from({length:count},(_,i)=><span key={i} className={(state==='count'||state==='tap')&&beat===i+1?'on':''}>{i+1}</span>)}</div>
  <p className="rl-meta" aria-live="polite">{state==='idle'?`Contagem de ${count} e depois toque.`:state==='count'?'Prepare… conte junto.':state==='tap'?'Agora!':`${taps.filter(t=>t>=-.5).length} toques registrados.`}</p>
  {state==='idle'||state==='done'?<button type="button" className="rl-btn rl-btn--secondary" disabled={locked} onClick={begin}>{state==='done'?'Tentar de novo':'Começar contagem'}</button>
  :<button type="button" className="rl-tap-pad" onPointerDown={e=>{e.preventDefault();tap();}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' ')e.preventDefault();}}>TOQUE</button>}
 </section>;
}
/** Criar um compasso (pelo menos duas notas) ou ditado (montar o que ouviu). */
function CreateBody({ex,instrument,locked,setPending}:{ex:BandExercise;instrument:TrailCourse;locked:boolean;setPending:(p:Pending|null)=>void}){
 const c=ex.create!,dictation=c.rule==='match',[values,setValues]=useState<(number|null|undefined)[]>(()=>Array(c.slots).fill(undefined)),model=useModel(instrument),mine=useModel(instrument);
 const filled=values.every(v=>v!==undefined),ready=filled&&(!dictation||model.heard);
 useEffect(()=>{setPending({ready,check:()=>{const ok=dictation?values.every((v,i)=>v===c.target![i]):values.filter(v=>v!==null&&v!==undefined).length>=2;return {ok,message:ok?ex.correct:ex.incorrect};}});},[values,ready]);
 const cycle=(i:number)=>setValues(old=>{const next=[...old];const k=c.choices.indexOf(next[i] as number|null);next[i]=c.choices[(k+1)%c.choices.length];return next;});
 const label=(v:number|null|undefined)=>v===undefined?'?':v===null?'pausa':noteName(instrument,v);
 return <section className="rl-stimulus rl-create">
  {dictation&&<div className="rl-audio"><button type="button" className="rl-listen" onClick={()=>void model.play(ex.notes!,false,ex.bpm??60,{meter:ex.meter})}><SpeakerIcon/>{model.playing?'Parar':'Ouvir'}</button>{!model.heard&&<small>Ouça antes de montar. Pode ouvir quantas vezes quiser.</small>}</div>}
  <div className="rl-slots">{values.map((v,i)=><button type="button" key={i} disabled={locked} className={`rl-slot ${v===undefined?'is-empty':v===null?'is-rest':''}`} onClick={()=>cycle(i)} aria-label={`Tempo ${i+1}: ${label(v)}. Toque para trocar.`}><small>{i+1}</small><b>{label(v)}</b></button>)}</div>
  <p className="rl-meta">Toque em cada tempo para escolher: {c.choices.map(x=>label(x)).join(' → ')}.</p>
  {filled&&<RecorderCourseScore notes={values.map(v=>({midi:v??null,beats:1}))} meter={ex.meter??'4/4'} instrument={NAME_OF[instrument]} clef={ex.clef}/>}
  <BandFingerings instrument={instrument} midis={c.choices.flatMap(x=>x===null?[]:[x])}/>
  {!dictation&&<button type="button" className="rl-btn rl-btn--secondary" disabled={!filled} onClick={()=>void mine.play(values.map(v=>({midi:v??null,beats:1})),true,66,{meter:ex.meter})}><SpeakerIcon/>{mine.playing?'Parar':'Ouvir minha criação'}</button>}
 </section>;
}

function ObserveBody({ex,locked,setPending}:{ex:BandExercise;locked:boolean;setPending:(p:Pending|null)=>void}){
 const [checked,setChecked]=useState<number[]>([]),list=ex.checklist??[];
 useEffect(()=>{setPending({ready:checked.length===list.length,check:()=>({ok:true,message:ex.correct})});},[checked]);
 return <section className="rl-stimulus rl-observe">
  <div className="rl-story-scene band-story"><TomOfficial decorative expression="feliz" className="rl-story-tom"/><div className="rl-bubble rl-story-bubble"><p className="rl-story-text">Faz com calma e marca cada item quando conseguir, visse?</p></div></div>
  <ul className="rl-checklist">{list.map((c,i)=><li key={i}><label><input type="checkbox" disabled={locked} checked={checked.includes(i)} onChange={()=>setChecked(o=>o.includes(i)?o.filter(x=>x!==i):[...o,i])}/><span>{c}</span></label></li>)}</ul>
 </section>;
}
/** Trompete em Si♭ ou em Dó: os pistos são os mesmos; muda só o som que o app toca e confere. */
export function TrumpetKeyChoice(){
 const [k,setK]=useState<TrumpetKey>(()=>readTrumpetKey());
 const pick=(v:TrumpetKey)=>{saveTrumpetKey(v);setK(v);};
 return <div className="band-key" role="radiogroup" aria-label="Afinação do teu trompete"><span>Teu trompete é em:</span>
  {(['sib','do'] as const).map(v=><button key={v} type="button" role="radio" aria-checked={k===v} className={k===v?'is-on':''} onClick={()=>pick(v)}>{v==='sib'?'Si bemol':'Dó'}</button>)}
  <small>{k==='sib'?'O mais comum. Soa um tom abaixo do que está escrito.':'Soa igual ao que está escrito.'} Os pistos são os mesmos.</small></div>;
}

/** Iniciação: a partir da unidade 9 a pessoa escolhe em que clave vai ler (pode trocar depois). */
export function ClefChoice({value,onChange}:{value:Clef|null;onChange:(c:Clef)=>void}){
 const opts:[Clef,string,string][]=[['sol','Clave de Sol','Para sons médios e agudos: flauta, trompete, clarinete, violino, voz.'],['fa','Clave de Fá','Para sons graves: trombone, tuba, fagote, violoncelo, mão esquerda do piano.']];
 return <fieldset className="ini-clef"><legend>{value?'Tua clave de leitura':'Escolha em que clave tu quer ler'}</legend>
  <div className="ini-clef-grid">{opts.map(([c,title,desc])=><button key={c} type="button" aria-pressed={value===c} className={value===c?'is-on':''} onClick={()=>onChange(c)}>
   <svg viewBox="0 0 120 70" aria-hidden="true">{[15,25,35,45,55].map(y=><line key={y} x1="4" x2="116" y1={y} y2={y} stroke="currentColor" strokeWidth="1.3" opacity=".45"/>)}
    {c==='sol'?<path d={TREBLE_CLEF_PATH} transform="translate(14 45) scale(0.03)" fill="currentColor"/>:<path d={BASS_CLEF_PATH} transform="translate(14 25) scale(0.03)" fill="currentColor"/>}
    <ellipse cx="80" cy={c==='sol'?45:25} rx="7" ry="5" transform={`rotate(-16 80 ${c==='sol'?45:25})`} fill="currentColor"/></svg>
   <b>{title}</b><small>{desc}</small><em>{c==='sol'?'O Sol mora na 2ª linha':'O Fá mora na 4ª linha'}</em></button>)}</div>
  <p className="rl-meta">Dá pra trocar depois, no mapa da trilha. Teu progresso continua.</p>
 </fieldset>;
}
