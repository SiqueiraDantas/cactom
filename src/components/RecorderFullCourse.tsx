import {useCallback,useEffect,useRef,useState} from 'react';
import {MicrophonePitchMonitor} from '../lib/audio';
import {ModuleOneMedia} from '../lib/recorderModuleOneMedia';
import {RecorderCourseAudio} from '../lib/recorderCourseAudio';
import {RECORDER_FULL_KEY,COURSE_TASKS,courseTask,courseNote,courseScoreEvents,barBeats,pulseBeats,evaluateCourse,validatePhrase,canRecordCourse,reconstructionMatches,readCourse,recordCourse,type CourseTask,type CourseNote,type CourseResponse,type CourseReport} from '../lib/recorderFullCourse';
import type {ScoreSample} from '../lib/scoreAssessment';
import {recorderNote,type RecorderSystem} from '../lib/recorder';
import {ActivityShell} from './ActivityExperience';
import {RecorderDiagram} from './RecorderExperience';
import {RecorderCourseScore} from './RecorderCourseScore';
import {HubIcon} from './CactomHub';
import {useProfileStorage} from './ProfileStorage';
import './recorder-full-course.css';
const REPORTS=[['pratiquei','Pratiquei esta proposta'],['apoio','Preciso de apoio'],['depois','Vou retomar depois']] as const;
const RUBRIC=[['apoio-continuo','Com apoio contínuo'],['pistas','Com pistas pontuais'],['independente','Independente neste contexto'],['transferencia','Independente em uma situação nova']] as const;
export function RecorderFullTask({task,existing,system,onCommit,onExit,introduce=true,warning=''}:{task:CourseTask;existing?:CourseResponse;system:RecorderSystem;onCommit:(response:CourseResponse)=>void;onExit:()=>void;introduce?:boolean;warning?:string}){
 const m=task.material;
 const [report,setReport]=useState<CourseReport|''>(existing?.report??''),[answer,setAnswer]=useState<number|undefined>(existing?.answer),[reflection,setReflection]=useState(existing?.reflection??''),[marks,setMarks]=useState<number[]>(existing?.marks??[]),[rubric,setRubric]=useState(existing?.rubric??'');
 const [composition,setComposition]=useState<CourseNote[]>(existing?.composition??[]),[draftMidi,setDraftMidi]=useState(String(m.pool[0])),[draftBeats,setDraftBeats]=useState(1),[bars,setBars]=useState(/dois compassos|introdução de dois/i.test(task.task)?2:1);
 const [bpm,setBpm]=useState(60),[modelsHeard,setModelsHeard]=useState<number[]>(existing?.modelsHeard??[]),[heard,setHeard]=useState(m.mode==='compose'?existing?.referencePlayed??false:existing?.modelPlayed??false),[creationHeard,setCreationHeard]=useState(existing?.modelPlayed??false),[showModel,setShowModel]=useState(false),[manual,setManual]=useState(existing?.manual??false),[attempted,setAttempted]=useState(false),[matched,setMatched]=useState(0),[total,setTotal]=useState(0);
 const [playing,setPlaying]=useState(false),[starting,setStarting]=useState(false),[running,setRunning]=useState(false),[tapping,setTapping]=useState(false),[beatNumber,setBeatNumber]=useState(0),[active,setActive]=useState(-1),[phase,setPhase]=useState(''),[progress,setProgress]=useState(0),[results,setResults]=useState<boolean[]>([]),[error,setError]=useState('');
 const [target,setTarget]=useState(m.notes.find(n=>n.midi!==null)?.midi??71),[holes,setHoles]=useState<number[]>([]),[fingerings,setFingerings]=useState<number[]>([]);
 const audio=useRef(new RecorderCourseAudio()),timer=useRef<ReturnType<typeof setInterval>|null>(null),generation=useRef(0),mounted=useRef(true),samples=useRef<ScoreSample[]>([]),taps=useRef<number[]>([]),runStart=useRef(0),runQuarter=useRef(1000);
 const guide=useRef<()=>Promise<boolean>>(()=>Promise.resolve(false));
 const [media]=useState(()=>new ModuleOneMedia(()=>MicrophonePitchMonitor.create(),{stop:()=>audio.current.stop(),play:()=>guide.current()}));
 const practiceNotes=m.mode==='compose'&&composition.length?composition:m.notes;
 const notesRef=useRef(practiceNotes);notesRef.current=practiceNotes;
 const stop=useCallback(()=>{
  generation.current++;media.stop();if(timer.current!==null)clearInterval(timer.current);timer.current=null;
  if(mounted.current){setPlaying(false);setStarting(false);setRunning(false);setTapping(false);setActive(-1);setBeatNumber(0);}
 },[media]);
 useEffect(()=>{mounted.current=true;const hidden=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hidden);return ()=>{mounted.current=false;stop();document.removeEventListener('visibilitychange',hidden);};},[stop]);
 const play=async(alternative=false,duo=false,creation=false)=>{
  stop();setError('');setPlaying(true);const token=generation.current;
  const notes=alternative?m.alternative:creation?notesRef.current:m.notes;
  guide.current=()=>audio.current.play(notes,m.meter,bpm,{gate:alternative&&(task.module===7||task.module===13)?.98:m.gate,duo:duo||task.module===8&&m.mode==='listen'||task.module===12&&!task.assessment&&m.mode==='listen',duoMidi:task.module===12?71:undefined,sustained:task.module===12,cents:task.module===12&&!task.assessment&&alternative?22:0});
  try{const finished=await media.playGuide();if(mounted.current&&token===generation.current){setPlaying(false);if(finished){if(creation)setCreationHeard(true);else {setHeard(true);setModelsHeard(old=>[...new Set([...old,alternative?1:duo?2:0])]);}setPhase('Exemplo escutado. Agora experimente a proposta.');}}}
  catch{if(mounted.current&&token===generation.current){setPlaying(false);setError('Não foi possível tocar o exemplo. Confira a saída de áudio ou pratique com orientação.');}}
 };
 const begin=async(tapMode=false)=>{
  if(running||starting||tapping){stop();setPhase('Tentativa interrompida. Você pode começar novamente.');return;}
  stop();setError('');setResults([]);setMatched(0);setTotal(0);setAttempted(false);setProgress(0);setStarting(!tapMode);setPhase(tapMode?'Prepare o toque depois da contagem.':'Abrindo microfone…');
  const token=generation.current,notes=notesRef.current,quarter=60000/(bpm*pulseBeats(m.meter)),prepare=barBeats(m.meter)*quarter,events=courseScoreEvents(notes,m.meter),length=notes.reduce((sum,n)=>sum+n.beats,0)*quarter;
  samples.current=[];taps.current=[];
  if(!tapMode)try{
   const opened=await media.openMicrophone(()=>{},snapshot=>{
    if(!mounted.current||token!==generation.current)return;
    if(snapshot.status==='inactive'){stop();setError('O microfone foi interrompido. Reinicie quando estiver pronto.');return;}
    samples.current.push({at:performance.now(),frequency:snapshot.status==='quiet'?null:snapshot.status==='pitched'&&snapshot.clarity>=.8&&snapshot.frequency!==null?snapshot.frequency:NaN});
   });
   if(!mounted.current||token!==generation.current||!opened)return;
  }catch(cause){if(mounted.current&&token===generation.current){stop();setError(cause instanceof Error?cause.message:'Não foi possível abrir o microfone.');}return;}
  if(!mounted.current||token!==generation.current)return;
  runStart.current=performance.now()+prepare;runQuarter.current=quarter;setStarting(false);setRunning(!tapMode);setTapping(tapMode);
  const refresh=()=>{
   const now=performance.now(),elapsed=now-runStart.current,beat=elapsed/quarter;
   setProgress(Math.max(0,Math.min(1,elapsed/length)));setBeatNumber(Math.floor(Math.max(0,elapsed<0?elapsed+prepare:elapsed)/(quarter*pulseBeats(m.meter)))%(barBeats(m.meter)/pulseBeats(m.meter))+1);
   if(elapsed<0){setPhase(`Prepare · tempo ${Math.min(Math.ceil(barBeats(m.meter)/pulseBeats(m.meter)),Math.floor((elapsed+prepare)/(quarter*pulseBeats(m.meter)))+1)}`);setActive(-1);setBeatNumber(0);}
   else {const index=events.findIndex(e=>beat>=e.startBeat&&beat<e.startBeat+e.beats);let cursor=0;const paintedIndex=notes.findIndex(n=>{const inside=beat>=cursor&&beat<cursor+n.beats;cursor+=n.beats;return inside;});setActive(paintedIndex);setPhase(index<0?'Finalizando a leitura…':events[index].kind==='rest'?'Silêncio · mantenha a contagem':`${events[index].note!.label} · siga a partitura`);}
   if(elapsed>=length+360){
    let verdicts:boolean[];
    if(tapMode){const expected=events.filter(e=>e.kind==='note').map(e=>e.startBeat);let used=new Set<number>();verdicts=events.map(e=>e.kind==='rest'?!taps.current.some(at=>at>=e.startBeat+.12&&at<e.startBeat+e.beats-.12):(()=>{const i=taps.current.findIndex((at,j)=>!used.has(j)&&Math.abs(at-e.startBeat)*quarter<=220);if(i>=0)used.add(i);return i>=0;})());const extra=taps.current.length>expected.length;if(extra)verdicts=verdicts.map(()=>false);}
    else verdicts=evaluateCourse(notes,m.meter,samples.current,bpm,runStart.current).map(v=>v.passed);
    const good=verdicts.filter(Boolean).length;let at=0;
    const painted=notes.map(n=>{const index=events.findIndex(e=>at>=e.startBeat&&at<e.startBeat+e.beats);at+=n.beats;return verdicts[index]??false;});
    stop();setResults(painted);setAttempted(true);setMatched(good);setTotal(verdicts.length);setProgress(1);
    setPhase(`${good} de ${verdicts.length} ${tapMode?'entradas e pausas próximas ao modelo':'notas e pausas dentro dos critérios desta tentativa'}. ${good===verdicts.length?'Você pode registrar e continuar.':'Confira os itens vermelhos e repita com calma.'}`);
   }
  };
  refresh();timer.current=setInterval(refresh,50);
 };
 const mark=(index:number)=>setMarks(previous=>previous.includes(index)?previous.filter(i=>i!==index):[...previous,index]);
 const tap=()=>{if(!tapping||performance.now()<runStart.current)return;const at=(performance.now()-runStart.current)/runQuarter.current;taps.current.push(at);setPhase(`${taps.current.length} toques. Continue contando até o final.`);};
 let position:readonly number[]|null=null;try{position=recorderNote(target,system).holes??null;}catch{/* Altered fingerings must be read from the manufacturer chart for the model. */}
 const fingeringCorrect=!!position&&holes.length===position.length&&position.every(h=>holes.includes(h));
 const fingeringTargets=[...new Set(m.notes.filter(n=>n.midi!==null).map(n=>n.midi!))];
 useEffect(()=>{if(m.mode==='fingering'&&fingeringCorrect)setFingerings(previous=>previous.includes(target)?previous:[...previous,target]);},[m.mode,fingeringCorrect,target]);
 const compositionComplete=validatePhrase(composition,m.meter,m.pool)&&composition.reduce((sum,n)=>sum+n.beats,0)===bars*barBeats(m.meter);
 const response:CourseResponse={id:task.id,at:new Date().toISOString(),report:(report||'depois') as CourseReport,system,answer,reflection,marks,composition:m.mode==='compose'?composition:undefined,modelPlayed:m.mode==='compose'?creationHeard:heard,referencePlayed:heard,modelsHeard,manual,attempted:attempted||m.mode==='fingering'&&fingerings.length>0,matched:m.mode==='fingering'?fingerings.length:matched,total:m.mode==='fingering'?fingeringTargets.length:total,rubric:rubric||undefined};
 const allowed=!!report&&(m.mode!=='compose'||report!=='pratiquei'||compositionComplete)&&canRecordCourse(task,response)&&!playing&&!starting&&!running&&!tapping;
 const busy=playing||starting||running||tapping;
 const addNote=()=>{
  const next={midi:draftMidi==='rest'?null:Number(draftMidi),beats:draftBeats},at=composition.reduce((sum,n)=>sum+n.beats,0),bar=barBeats(m.meter);
  if(at+next.beats>bars*bar||at%bar+next.beats>bar){setError('Essa figura ultrapassa o compasso. Escolha uma duração menor.');return;}
  setComposition([...composition,next]);setCreationHeard(false);setResults([]);setError('');
 };
 const introduction=introduce?{title:task.moduleTitle,goal:task.task,explanation:m.guide,preparation:task.assessment?'Converse sobre os critérios com quem orienta você. O registro não é uma certificação automática.':'Experimente sem pressa. Ouça o exemplo antes do microfone; o botão de parar permanece suspenso.'}:undefined;
 const modelButtons=<div className="full-course-models"><button className="activity-secondary" type="button" disabled={starting||running||tapping} onClick={()=>playing?stop():void play()}><HubIcon name="headphones"/>{playing?'Parar exemplo':'Ouvir modelo A'}</button>{(['listen','choice','ensemble','annotate','reflect'].includes(m.mode)||task.module===14)&&<button className="activity-secondary" type="button" disabled={busy} onClick={()=>void play(true)}>Ouvir modelo B</button>}{m.mode==='ensemble'&&<button className="activity-secondary" type="button" disabled={busy} onClick={()=>void play(false,true)}>Ouvir duas vozes</button>}</div>;
 return <ActivityShell title={`${task.id} · ${task.lessonName}`} lessonNumber={task.module} completed={Number(task.id.match(/-A0([123])$/)?.[1]??1)-1} total={3} onExit={()=>{stop();onExit();}} success={false} introduction={introduction} tools={[{id:'full-hint',label:'Dicas',title:'Uma pista do Tom',icon:<HubIcon name="book"/>,content:<><p>{m.guide}</p><p>O microfone observa altura e duração. Técnica, timbre, fraseado e conjunto precisam de escuta e orientação.</p></>}]} footer={<div className="session-footer-actions full-course-footer">
  {['perform','ensemble','compose'].includes(m.mode)&&<button className="activity-primary" type="button" disabled={playing||m.mode==='compose'&&!compositionComplete} onClick={()=>void begin()}>{starting?'Cancelar abertura':running?'Parar microfone':'Começar atividade'}</button>}
  {m.mode==='tap'&&<button className="activity-primary" type="button" disabled={playing} onClick={()=>void begin(true)}>{tapping?'Parar atividade':'Começar atividade'}</button>}
  <button className={['perform','ensemble','compose','tap'].includes(m.mode)?'activity-secondary':'activity-primary'} type="button" disabled={!allowed} onClick={()=>{stop();onCommit(response);}}>Registrar e avançar<HubIcon name="arrow"/></button>
 </div>}>
  <section className="full-course-task" data-curriculum-task={task.id}>
   <header><span className="activity-eyebrow">{task.id} · {task.assessment?'AVALIAÇÃO ORIENTADA':`MÓDULO ${task.module} · ${task.lessonName.toLocaleUpperCase('pt-BR')}`}</span><h1>{task.task}</h1></header>
   {modelButtons}
   <div className="full-course-tempo"><label>Andamento <strong>{bpm} BPM</strong><input aria-label="Andamento do exemplo" type="range" min="40" max="96" step="4" value={bpm} disabled={busy} onChange={e=>setBpm(Number(e.target.value))}/></label><span>{m.meter==='6/8'?'6/8 · dois tempos, três subdivisões por tempo':`${m.meter} · ${barBeats(m.meter)} tempos por compasso`}</span></div>
   <div className="full-course-metronome" aria-label={m.meter==='6/8'?'Dois tempos no compasso 6/8':'Tempos do compasso'}>{Array.from({length:barBeats(m.meter)/pulseBeats(m.meter)},(_,i)=><span key={i} className={beatNumber===i+1?'active':''}>{i+1}</span>)}</div>
   <RecorderCourseScore notes={m.mode==='compose'?composition:practiceNotes} meter={m.meter} slur={m.slur} active={active} results={results} marks={marks} onMark={m.mode==='annotate'?mark:undefined}/>
   {['perform','ensemble','compose'].includes(m.mode)&&<details className="full-course-position"><summary>Ver o dedilhado de uma nota</summary><label>Nota<select value={target} onChange={e=>setTarget(Number(e.target.value))}>{[...new Set(practiceNotes.filter(n=>n.midi!==null).map(n=>n.midi!))].map(n=><option key={n} value={n}>{courseNote(n).label}</option>)}</select></label>{position?<><RecorderDiagram compact holes={position}/><p>{courseNote(target).label}: furos {position.join(' · ')} fechados. Sistema {system==='baroque'?'barroco':'germânico'}.</p></>:<p>Confira a nota alterada na <a href="https://www.yamaha.com/en/musical_instrument_guide/recorder/play/play002.html" target="_blank" rel="noreferrer">tabela Yamaha de referência; confirme o dedilhado do seu modelo com o professor</a>.</p>}</details>}
   {['listen','choice','annotate','reflect'].includes(m.mode)&&<details className="full-course-position"><summary>Comparar a partitura do modelo B</summary><RecorderCourseScore notes={m.alternative} meter={m.meter} slur={task.module===7||task.module===13}/></details>}
   <div className="full-course-progress" aria-label="Progresso da execução, da esquerda para a direita"><span style={{width:`${progress*100}%`}}/></div>
   {phase&&<p className="full-course-status" role="status">{phase}</p>}
   {m.mode==='compose'&&<><button className="session-text-button" type="button" onClick={()=>setShowModel(v=>!v)} aria-expanded={showModel}>{showModel?'Fechar partitura do exemplo':'Conferir a partitura do exemplo'}</button>{showModel&&<RecorderCourseScore notes={m.notes} meter={m.meter}/>}</>}
   {m.mode==='choice'&&<fieldset className="full-course-options"><legend>{m.question}</legend>{m.options?.map((option,index)=><label key={index} className={answer===index?(index===m.answer?'correct':'incorrect'):''}><input type="radio" name={'answer-'+task.id} checked={answer===index} onChange={()=>setAnswer(index)}/>{option}</label>)}{answer!==undefined&&<p role="status">{answer===m.answer?'Isso! Confira também no exemplo.':`Vamos conferir de novo. ${m.guide}`}</p>}</fieldset>}
   {m.mode==='fingering'&&<div className="full-course-fingering"><label>Nota para preparar<select value={target} onChange={e=>{setTarget(Number(e.target.value));setHoles([]);}}>{[...new Set(m.notes.filter(n=>n.midi!==null).map(n=>n.midi!))].map(n=><option key={n} value={n}>{courseNote(n).label}</option>)}</select></label>{position?<><RecorderDiagram compact holes={holes}/><div className="full-course-holes" role="group" aria-label="Furos para fechar no desenho">{Array.from({length:8},(_,n)=><button type="button" key={n} aria-pressed={holes.includes(n)} onClick={()=>setHoles(old=>old.includes(n)?old.filter(h=>h!==n):[...old,n])}>{n}<small>{n===0?'atrás':'frente'}</small></button>)}</div><p>{fingerings.length}/{fingeringTargets.length} posições conferidas no desenho.</p><p role="status">{fingeringCorrect?'A combinação no desenho corresponde à nota. Prepare também as outras notas da lista.':`Para ${courseNote(target).label}, feche ${position.join(' · ')}. Sistema ${system==='baroque'?'barroco':'germânico'}.`}</p></>:<p>Confira {courseNote(target).label} na <a href="https://www.yamaha.com/en/musical_instrument_guide/recorder/play/play002.html" target="_blank" rel="noreferrer">tabela Yamaha de referência para flauta soprano, conferindo seu modelo e sistema</a>. Prepare com orientação antes de experimentar.</p>}</div>}
   {m.mode==='tap'&&<button type="button" className="full-course-tap" disabled={!tapping} onClick={tap}><HubIcon name="hand"/>Marcar toque</button>}
   {m.mode==='compose'&&<fieldset className="full-course-composer" disabled={busy}><legend>Monte sua versão</legend><div><label>Compassos<select value={bars} onChange={e=>{setBars(Number(e.target.value));setComposition([]);setCreationHeard(false);}}>{[1,2,4,8].map(n=><option key={n} value={n}>{n}</option>)}</select></label><label>Nota<select value={draftMidi} onChange={e=>setDraftMidi(e.target.value)}>{m.pool.map(n=><option key={n} value={n}>{courseNote(n).label}</option>)}<option value="rest">Pausa</option></select></label><label>Figura<select value={draftBeats} onChange={e=>setDraftBeats(Number(e.target.value))}>{[[.5,'Colcheia'],[1,'Semínima'],[1.5,'Semínima pontuada'],[2,'Mínima'],[3,'Mínima pontuada'],[4,'Semibreve']].filter(([n])=>Number(n)<=barBeats(m.meter)&&(task.module>=6||[1,2].includes(Number(n)))).map(([n,label])=><option key={n} value={n}>{label}</option>)}</select></label><button type="button" className="activity-secondary" onClick={addNote}>Adicionar</button></div><button type="button" className="activity-secondary" disabled={!compositionComplete||busy} onClick={()=>void play(false,false,true)}>Ouvir minha criação</button><p>{composition.reduce((sum,n)=>sum+n.beats,0)} de {bars*barBeats(m.meter)} unidades de semínima preenchidas.</p><button type="button" className="session-text-button" disabled={!composition.length} onClick={()=>{setComposition(old=>old.slice(0,-1));setCreationHeard(false);}}>Desfazer última figura</button>{composition.length>0&&<RecorderCourseScore notes={composition} meter={m.meter}/>}<p>{compositionComplete?'Compassos completos. Ouça sua criação e experimente tocar.':'Preencha os compassos com as notas e pausas escolhidas.'}</p>{/ditado|padrão ouvido/i.test(task.task)&&compositionComplete&&<p role="status">{reconstructionMatches(task,composition)?'A reconstrução corresponde ao modelo.':'O padrão ainda difere do modelo. Ouça e confira as figuras.'}</p>}</fieldset>}
   {m.mode==='annotate'&&<p className="full-course-instruction">Toque nas notas da partitura para marcar pontos de respiração, entrada ou estudo, conforme a proposta. Toque novamente para retirar.</p>}
   {(m.mode==='reflect'||task.assessment||m.mode==='annotate')&&<label className="full-course-reflection">{m.reflection}<textarea rows={3} maxLength={600} value={reflection} onChange={e=>setReflection(e.target.value)} placeholder="Registre uma observação ou estratégia concreta."/></label>}
   {task.assessment&&<fieldset className="full-course-options"><legend>Como você realizou a proposta? Converse com quem orienta seu estudo.</legend>{RUBRIC.map(([value,label])=><label key={value}><input type="radio" name={'rubric-'+task.id} checked={rubric===value} onChange={()=>setRubric(value)}/>{label}</label>)}<small>Descritor relatado, sem nota ou certificação automática.</small></fieldset>}
   {['listen','fingering','perform','ensemble','tap','compose'].includes(m.mode)&&<label className="full-course-manual"><input type="checkbox" checked={manual} onChange={e=>setManual(e.target.checked)}/>Pratiquei com orientação, sem avaliação automática do microfone.</label>}
   <fieldset className="full-course-report"><legend>Seu registro</legend>{REPORTS.map(([value,label])=><label key={value}><input type="radio" name={'report-'+task.id} checked={report===value} onChange={()=>setReport(value)}/>{label}</label>)}</fieldset>
   {report==='pratiquei'&&!allowed&&!busy&&<p className="full-course-instruction" role="status">Conclua a proposta acima antes de registrar, ou escolha apoio/retomar depois.</p>}
   {error&&<p className="activity-error" role="alert">{error}</p>}{warning&&<p className="recorder-discipline-warning" role="status">{warning}</p>}
  </section>
 </ActivityShell>;
}
export function RecorderFullCourse({startAt,system,onExit}:{startAt:string;system:RecorderSystem;onExit:()=>void}){
 const storage=useProfileStorage(),[initial]=useState(()=>readCourse(storage)),[ledger,setLedger]=useState(initial.ledger),[warning,setWarning]=useState(initial.warning),[id,setId]=useState(startAt),[summary,setSummary]=useState(false),[introduce,setIntroduce]=useState(true);
 const task=courseTask(id),generic=COURSE_TASKS.filter(t=>t.module!==1||t.assessment);
 if(!task)return <section className="full-course-task"><h1>Atividade não encontrada</h1><button type="button" onClick={onExit}>Voltar ao Aprender</button></section>;
 const next=generic[generic.findIndex(t=>t.id===id)+1];
 const save=(response:CourseResponse)=>{
  const updated=recordCourse(ledger,response);setLedger(updated);
  if(initial.safeToWrite)try{storage.setItem(RECORDER_FULL_KEY,JSON.stringify(updated));setWarning('');}catch{setWarning('Os registros estão nesta sessão, mas não foi possível salvá-los neste navegador.');}
  if(next&&next.lesson===task.lesson){setId(next.id);setIntroduce(false);}else setSummary(true);window.scrollTo({top:0,behavior:'instant'});
 };
 if(!summary)return <RecorderFullTask key={id} task={task} system={system} existing={ledger.responses[id]} onCommit={save} onExit={onExit} introduce={introduce} warning={warning}/>;
 const tasks=generic.filter(t=>t.lesson===task.lesson);
 return <ActivityShell title={task.moduleTitle} lessonNumber={task.module} completed={tasks.filter(t=>ledger.responses[t.id]).length} total={tasks.length} success={false} onExit={onExit} tools={[]} footer={<div className="session-footer-actions"><button type="button" className="activity-secondary" onClick={onExit}>Voltar ao Aprender</button>{next&&<button type="button" className="activity-primary" onClick={()=>{setId(next.id);setIntroduce(true);setSummary(false);window.scrollTo({top:0,behavior:'instant'});}}>Próxima proposta<HubIcon name="arrow"/></button>}</div>}><section className="full-course-task"><h1>Seu estudo ficou registrado.</h1><p>Veja o que praticou e o que quer retomar. Os registros de prática não são notas ou certificados.</p>{tasks.map(t=><article className="full-course-summary-item" key={t.id}><span>{t.id}</span><h2>{t.task}</h2><p>{ledger.responses[t.id]?.report==='pratiquei'?'Prática registrada':ledger.responses[t.id]?.report==='apoio'?'Precisa de apoio':ledger.responses[t.id]?'Retomar depois':'Sem registro'}</p><button type="button" className="session-text-button" onClick={()=>{setId(t.id);setSummary(false);setIntroduce(false);}}>Rever atividade</button></article>)}{warning&&<p role="status">{warning}</p>}</section></ActivityShell>;
}
