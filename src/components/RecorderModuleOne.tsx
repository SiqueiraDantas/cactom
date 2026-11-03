import {useCallback,useEffect,useRef,useState,type ReactNode} from 'react';
import {ActivityShell} from './ActivityExperience';
import type {IntroductionContent} from './ActivityIntroduction';
import {RecorderDiagram} from './RecorderExperience';
import {CourseArtwork} from './CourseArtwork';
import {HubIcon} from './CactomHub';
import {useProfileStorage} from './ProfileStorage';
import {DiagnosticAudio} from '../lib/diagnosticAudio';
import {MicrophonePitchMonitor} from '../lib/audio';
import {ModuleOneMedia} from '../lib/recorderModuleOneMedia';
import {MODULE_ONE_KEY,MODULE_ONE_LESSONS,MODULE_ONE_TASKS,PARTS,CARE,ADJUSTMENTS,freshModuleOneEvidence,canRecordModuleOne,readModuleOne,recordModuleOne,siFingering,freshFirstSi,advanceFirstSi,moduleOneCue,type ModuleOneLessonId,type ModuleOneTask,type ModuleOneResponse,type ModuleOneEvidence,type ModuleOneReport,type CuePhase} from '../lib/recorderModuleOne';
import './recorder-module-one.css';

type TaskProps={task:ModuleOneTask;existing?:ModuleOneResponse;position:number;onCommit:(response:ModuleOneResponse)=>void;onExit:()=>void;warning?:string;introduction?:IntroductionContent};
const partLabels={bocal:'Bocal',corpo:'Corpo',pe:'Pé'};
const partHints={bocal:'É a parte que se aproxima da boca. Observe também a janela, sem introduzir objetos nela.',corpo:'Aqui ficam os furos da frente e o furo do polegar, atrás.',pe:'É a extremidade inferior. Sua montagem e o alinhamento dependem do modelo.'};
const careLabels={orientacao:'Conferi os cuidados indicados para meu modelo.',secagem:'Fiz a limpeza e a secagem com a orientação adequada.',guardar:'Guardei a flauta conforme a recomendação do fabricante.'};
const adjustmentLabels={apoio:'Apoio e conforto das mãos',cobertura:'Cobertura dos furos',emissao:'Emissão orientada pelo professor'};
const needsMic=(mode:ModuleOneTask['mode'])=>['compare','sounds','adjust','recall'].includes(mode);

export function RecorderModuleOneTask({task,existing,position,onCommit,onExit,warning,introduction}:TaskProps){
 const [e,setEvidence]=useState<ModuleOneEvidence>(()=>({...freshModuleOneEvidence(),...existing?.evidence,siSounds:0,cueFinished:false}));
 const [report,setReport]=useState<ModuleOneReport|''>('');
 const [error,setError]=useState(''),[feedback,setFeedback]=useState(''),[tone,setTone]=useState<'neutral'|'good'|'wrong'>('neutral');
 const [listening,setListening]=useState(false),[starting,setStarting]=useState(false),[playing,setPlaying]=useState(false);
 const [cue,setCue]=useState<CuePhase|null>(null),[cueRunning,setCueRunning]=useState(false);
 const [showRecallHint,setShowRecallHint]=useState(false),[part,setPart]=useState<typeof PARTS[number]>('bocal');
 const capture=useRef(freshFirstSi()),timer=useRef<ReturnType<typeof setInterval>|null>(null),mounted=useRef(true),generation=useRef(0);
 const [media]=useState(()=>{const audio=new DiagnosticAudio();return new ModuleOneMedia(()=>MicrophonePitchMonitor.create(),{stop:()=>audio.stop(),play:()=>audio.play('D07')});});
 const patch=(values:Partial<ModuleOneEvidence>)=>setEvidence(previous=>({...previous,...values}));
 const stop=useCallback(()=>{
  generation.current++;media.stop();if(timer.current!==null)clearInterval(timer.current);timer.current=null;
  if(mounted.current){setStarting(false);setListening(false);setPlaying(false);setCueRunning(false);setCue(null);}
 },[media]);
 useEffect(()=>{
  mounted.current=true;const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);
  return ()=>{mounted.current=false;stop();document.removeEventListener('visibilitychange',hide);};
 },[stop]);
 const play=async()=>{
  stop();setError('');setFeedback('');setTone('neutral');setPlaying(true);const token=generation.current;
  try{await media.playGuide();if(mounted.current&&token===generation.current)setPlaying(false);}
  catch{if(mounted.current&&token===generation.current){setPlaying(false);setError('Não foi possível ouvir o Si. Confira o áudio ou pratique com quem acompanha você.');}}
 };
 const toggleMic=async()=>{
  if(listening||starting){stop();return;}
  stop();setError('');setFeedback('Espere um breve silêncio; depois experimente Si.');setTone('neutral');patch({siSounds:0});capture.current=freshFirstSi();setStarting(true);const token=generation.current;
  const goal=task.mode==='sounds'?3:1;
  try{
   const opened=await media.openMicrophone(()=>{},signal=>{
    if(!mounted.current||token!==generation.current)return;
    if(signal.status==='inactive'){stop();setError('O microfone foi interrompido. Você pode abrir novamente ou registrar que precisa de apoio.');return;}
    const previous=capture.current;
    capture.current=advanceFirstSi(previous,{at:performance.now(),frequency:signal.frequency,clarity:signal.clarity,rms:signal.rms,quiet:signal.status==='quiet'},goal);
    patch({siSounds:capture.current.count});
    if(capture.current.count>previous.count){setTone('good');setFeedback(`${capture.current.count} de ${goal} ${goal===1?'som de Si percebido':'sons de Si percebidos'}. ${capture.current.count<goal?'Pare antes do próximo som.':'Você pode parar o microfone e registrar como foi.'}`);}
    else if(signal.status==='pitched'){
     const cents=signal.frequency?1200*Math.log2(signal.frequency/(440*2**(14/12))):Infinity;
     if(Math.abs(cents)>45){setTone('wrong');setFeedback('Esse som está fora da faixa de Si. Pare e confira o preparo, sem forçar.');}
     else if(!capture.current.waitingRelease){setTone('neutral');setFeedback('Si está na faixa. Deixe o som acontecer com conforto.');}
    }else if(signal.status==='quiet'&&!capture.current.waitingRelease&&capture.current.count<goal){setTone('neutral');setFeedback('Pronto para o próximo Si.');}
   });
   if(mounted.current&&token===generation.current){setStarting(false);setListening(opened);}
  }catch(cause){if(mounted.current&&token===generation.current){stop();setError(cause instanceof Error?cause.message:'Não foi possível abrir o microfone.');}}
 };
 const startCue=()=>{
  stop();setError('');patch({cueFinished:false});setCueRunning(true);const start=performance.now(),pattern=task.mode==='create'?[...e.pattern]:[1,1,1];
  setCue(moduleOneCue(0,pattern));timer.current=setInterval(()=>{
   const next=moduleOneCue(performance.now()-start,pattern);setCue(next);
   if(next.kind==='finished'){if(timer.current!==null)clearInterval(timer.current);timer.current=null;setCueRunning(false);patch({cueFinished:true});}
  },50);
 };
 const allowed=canRecordModuleOne(task,e,report)&&!starting&&!playing&&!cueRunning;
 const commit=()=>{if(!allowed)return;stop();onCommit({id:task.id,at:new Date().toISOString(),report:report as ModuleOneReport,evidence:e});};
 const choice=(question:string,options:readonly {value:string;label:string}[]):ReactNode=><fieldset className="module-one-options"><legend>{question}</legend>{options.map(option=><label key={option.value} className={e.answer===option.value?'selected':''}><input type="radio" name={'answer-'+task.id} checked={e.answer===option.value} value={option.value} onChange={()=>patch({answer:option.value})}/>{option.label}</label>)}</fieldset>;
 const checkFeedback=(good:boolean,message:string)=>good?<p className="module-one-feedback good" role="status">{message}</p>:null;
 const fingering=<div className="module-one-fingering"><div className="module-one-position"><span className="module-one-si-card">SI</span><RecorderDiagram compact holes={e.holes}/></div><div><p>Feche os furos no desenho.</p><div className="module-one-holes" role="group" aria-label="Furos da flauta, 0 atrás e 1 a 7 na frente">{Array.from({length:8},(_,hole)=><button type="button" key={hole} aria-label={`Furo ${hole}${hole===0?', polegar esquerdo atrás':''}`} aria-pressed={e.holes.includes(hole)} onClick={()=>patch({holes:e.holes.includes(hole)?e.holes.filter(n=>n!==hole):[...e.holes,hole]})}>{hole}<small>{hole===0?'atrás':'frente'}</small></button>)}</div><p className="module-one-feedback" role="status">{siFingering(e.holes)?'Isso: 0 e 1 fechados no desenho. Agora prepare sua flauta.':e.holes.length?'Confira a combinação: somente 0 e 1.':'Toque nos furos 0 e 1.'}</p></div></div>;
 const acoustic=needsMic(task.mode)?<div className="module-one-acoustic"><div className="module-one-tone-row"><span className="module-one-si-card">SI</span><button className="activity-secondary" type="button" disabled={starting} onClick={()=>playing?stop():void play()}><HubIcon name="headphones"/>{playing?'Parar referência':'Ouvir Si'}</button></div>{task.mode==='sounds'&&<ol className="module-one-sound-count" aria-label="Sons de Si percebidos nesta tentativa">{[1,2,3].map(n=><li key={n} className={e.siSounds>=n?'heard':''} aria-label={`Som ${n}: ${e.siSounds>=n?'Si percebido':'ainda não percebido'}`}>{e.siSounds>=n?<HubIcon name="check"/>:n}</li>)}</ol>}<p className={'module-one-feedback '+tone} role="status">{feedback||'O microfone só liga no botão suspenso. Você também pode praticar sem ele.'}</p><small>Referência eletrônica de altura. A leitura do Si não avalia suas mãos, articulação ou timbre.</small></div>:null;
 let content:ReactNode=null;
 switch(task.mode){
  case 'parts':content=<div className="module-one-parts"><CourseArtwork instrument="recorder-soprano"/><div><div className="module-one-part-buttons">{PARTS.map(p=><button type="button" key={p} aria-pressed={part===p} onClick={()=>{setPart(p);patch({parts:[...new Set([...e.parts,p])]});}}>{partLabels[p]}{e.parts.includes(p)&&<HubIcon name="check"/>}</button>)}</div><p role="status">{partHints[part]}</p><small>{e.parts.length}/3 partes exploradas</small></div></div>;break;
  case 'hands':content=<><div className="module-one-hand-order"><span>ESQUERDA<small>em cima</small></span><CourseArtwork instrument="recorder-soprano"/><span>DIREITA<small>embaixo</small></span></div>{choice('Qual mão fica em cima?',[{value:'esquerda',label:'Mão esquerda'},{value:'direita',label:'Mão direita'}])}{e.answer==='direita'&&<p className="module-one-feedback wrong" role="status">Vamos inverter: esquerda em cima e direita embaixo.</p>}</>;break;
  case 'comfort':content=choice('Como ficou a posição?',[{value:'confortavel',label:'Estável e confortável, sem apertar'},{value:'ajustar',label:'Preciso de ajuda para ajustar'}]);break;
  case 'models':case 'identify':case 'compare':case 'adjust':content=<>
   <div className="module-one-live"><HubIcon name="headphones"/><b>Demonstração ao vivo</b><p>{task.mode==='adjust'?'Combine um ajuste observado com o professor.':'Dois modelos de Si, na mesma altura, apresentados pelo professor.'}</p><label><input type="checkbox" checked={e.liveModel} onChange={event=>patch({liveModel:event.target.checked})}/>{task.mode==='adjust'?'Conversei sobre o ajuste com o professor':'Ouvi a demonstração com quem me orienta'}</label></div>
   {task.mode==='identify'&&choice('Qual modelo tem a característica combinada?',[{value:'primeiro',label:'Primeiro modelo'},{value:'segundo',label:'Segundo modelo'}])}
   {task.mode==='adjust'&&<fieldset className="module-one-options"><legend>Qual variável vocês combinaram?</legend>{ADJUSTMENTS.map(a=><label key={a}><input type="radio" name="adjustment" checked={e.adjustment===a} onChange={()=>patch({adjustment:a})}/>{adjustmentLabels[a]}</label>)}</fieldset>}
   {acoustic}
  </>;break;
  case 'fingering':case 'associate':content=fingering;break;
  case 'sounds':content=acoustic;break;
  case 'cue':case 'create':content=<>
   {task.mode==='create'&&<fieldset className="module-one-pattern"><legend>Sua criação · três entradas</legend>{e.pattern.map((duration,index)=><label key={index}>Entrada {index+1}<select disabled={cueRunning} value={duration} onChange={event=>patch({pattern:e.pattern.map((value,i)=>i===index?Number(event.target.value):value),cueFinished:false})}><option value={1}>Breve · 1 s</option><option value={2}>Mais longa · 2 s</option></select></label>)}</fieldset>}
   <div className={`module-one-cue ${cue?.kind==='play'?'play':''}`} role="status"><strong>{cue?.kind==='play'?'SI':cue?.kind==='prepare'?'Prepare…':cue?.kind==='rest'?'Pare':cue?.kind==='finished'?'Sua vez terminou':'Vamos combinar as entradas?'}</strong><p>{cue?.kind==='play'?`Toque · entrada ${cue.index+1} de 3`:cue?.kind==='rest'?'Descanse até o próximo cartão':cue?.kind==='prepare'?'Espere o cartão SI aparecer':e.cueFinished?'Experimente novamente ou registre como foi.':'A sequência começa depois de uma breve preparação.'}</p><div className="module-one-cue-track" aria-hidden="true"><span style={{width:`${(cue?.progress??0)*100}%`}}/></div></div>
   {checkFeedback(e.cueFinished,'Sequência apresentada. Conte como foi tocar ou conduzir as entradas; isso não é uma avaliação pelo microfone.')}
  </>;break;
  case 'story':content=<>{choice('O que você faria primeiro?',[{value:'conferir',label:'Parar e conferir apoio e furos com calma'},{value:'forcar',label:'Soprar cada vez mais forte'},{value:'apertar',label:'Apertar os dedos com força'}])}{e.answer&&e.answer!=='conferir'&&<p className="module-one-feedback wrong" role="status">Experimente parar e conferir o preparo, sem forçar. Peça ajuda para escolher um ajuste.</p>}{checkFeedback(e.answer==='conferir','Esse é um primeiro passo confortável. Agora experimente na sua flauta.')}</>;break;
  case 'recall':content=<>{acoustic}<button type="button" className="module-one-hint-toggle" onClick={()=>{patch({hintUsed:true});setShowRecallHint(v=>!v);}} aria-expanded={showRecallHint}>{showRecallHint?'Fechar desenho':'Preciso de uma pista'}</button>{showRecallHint&&<div className="module-one-position"><RecorderDiagram compact holes={[0,1]}/><p>SI: feche 0 e 1, com a mão esquerda.</p></div>}</>;break;
  case 'care':content=<fieldset className="module-one-options"><legend>Cuidados conferidos com orientação</legend>{CARE.map(c=><label key={c}><input type="checkbox" checked={e.care.includes(c)} onChange={event=>patch({care:event.target.checked?[...e.care,c]:e.care.filter(value=>value!==c)})}/>{careLabels[c]}</label>)}</fieldset>;break;
 }
 return <ActivityShell introduction={introduction} title={`Módulo 1 · ${task.title}`} lessonNumber={0} completed={position} total={3} onExit={()=>{stop();onExit();}} success={false} tools={[{id:'m1-help',label:'Dicas',title:'Uma pista do Tom',icon:<HubIcon name="book"/>,content:<><p>{task.hint}</p><p>O registro conta o que você praticou. Técnica e timbre precisam de observação presencial.</p></>}]} footer={<div className="module-one-footer session-footer-actions">
  {needsMic(task.mode)&&<button type="button" className="activity-primary" onClick={()=>void toggleMic()}>{starting?'Cancelar abertura':listening?'Parar microfone':'Começar atividade'}</button>}
  {(task.mode==='cue'||task.mode==='create')&&<button type="button" className="activity-primary" onClick={()=>cueRunning?stop():startCue()}>{cueRunning?'Parar sequência':e.cueFinished?'Repetir sequência':'Começar atividade'}</button>}
  <button type="button" className={needsMic(task.mode)||task.mode==='cue'||task.mode==='create'?'activity-secondary':'activity-primary'} disabled={!allowed} onClick={commit}>{position===2?'Ver meus registros':'Registrar e avançar'}<HubIcon name="arrow"/></button>
 </div>}>
  <section className="module-one-task" data-module-one-task={task.id}><header><span className="activity-eyebrow">MÓDULO 1 · ATIVIDADE {position+1} DE 3</span><h1>{task.title}</h1><p>{task.prompt}</p></header><div className="module-one-content">{content}</div>
   <fieldset className="module-one-report"><legend>Como foi para você?</legend>{([{value:'pratiquei',label:'Pratiquei esta proposta'},{value:'apoio',label:'Preciso de apoio para continuar'},{value:'depois',label:'Vou retomar depois'}] as const).map(option=><label key={option.value}><input type="radio" name={'report-'+task.id} checked={report===option.value} onChange={()=>setReport(option.value)}/>{option.label}</label>)}</fieldset>
   {report==='pratiquei'&&!allowed&&!starting&&!playing&&!cueRunning&&<p className="module-one-feedback" role="status">Confira a proposta acima antes de registrar a prática. Se precisar, marque apoio ou retomar depois.</p>}
   {error&&<p className="activity-error" role="alert">{error}</p>}{warning&&<p className="recorder-discipline-warning" role="status">{warning}</p>}
  </section>
 </ActivityShell>;
}

export function RecorderModuleOne({startAt,startTask,onExit}:{startAt:ModuleOneLessonId;startTask?:string;onExit:()=>void}){
 const storage=useProfileStorage(),[initial]=useState(()=>readModuleOne(storage)),[ledger,setLedger]=useState(initial.ledger),[warning,setWarning]=useState(initial.warning);
 const [lessonIndex,setLessonIndex]=useState(()=>Math.max(0,MODULE_ONE_LESSONS.findIndex(l=>l.id===startAt)));
 const lesson=MODULE_ONE_LESSONS[lessonIndex],tasks=MODULE_ONE_TASKS.filter(task=>task.id.startsWith(lesson.id+'-'));
 const [position,setPosition]=useState(()=>{const exact=MODULE_ONE_TASKS.filter(task=>task.id.startsWith(startAt+'-')).findIndex(task=>task.id===startTask);if(exact>=0)return exact;const index=MODULE_ONE_TASKS.filter(task=>task.id.startsWith(startAt+'-')).findIndex(task=>initial.ledger.responses[task.id]?.report!=='pratiquei');return Math.max(0,index);});
 const [view,setView]=useState<'task'|'summary'>('task'),[showIntroduction,setShowIntroduction]=useState(true);
 const exit=()=>{onExit();window.scrollTo({top:0,behavior:'instant'});};
 const commit=(response:ModuleOneResponse)=>{
  const next=recordModuleOne(ledger,response);setLedger(next);setShowIntroduction(false);
  if(initial.safeToWrite){try{storage.setItem(MODULE_ONE_KEY,JSON.stringify(next));setWarning('');}catch{setWarning('Seus registros estão nesta sessão, mas o navegador não conseguiu salvá-los.');}}
  if(position===2)setView('summary');else setPosition(position+1);window.scrollTo({top:0,behavior:'instant'});
 };
 if(view==='task')return <RecorderModuleOneTask introduction={showIntroduction?lesson:undefined} key={tasks[position].id} task={tasks[position]} position={position} existing={ledger.responses[tasks[position].id]} onCommit={commit} onExit={exit} warning={warning}/>;
 return <ActivityShell title={`Módulo 1 · ${lesson.name}`} lessonNumber={0} completed={tasks.filter(t=>ledger.responses[t.id]).length} total={3} success={false} onExit={exit} tools={[]} footer={<div className="module-one-footer session-footer-actions"><button className="activity-secondary" type="button" onClick={exit}>Voltar ao Aprender</button>{lessonIndex<4?<button className="activity-primary" type="button" onClick={()=>{const next=MODULE_ONE_LESSONS[lessonIndex+1];setLessonIndex(lessonIndex+1);const index=MODULE_ONE_TASKS.filter(t=>t.id.startsWith(next.id+'-')).findIndex(t=>ledger.responses[t.id]?.report!=='pratiquei');setPosition(Math.max(0,index));setShowIntroduction(true);setView('task');window.scrollTo({top:0,behavior:'instant'});}}>Próxima microlição<HubIcon name="arrow"/></button>:<button className="activity-primary" type="button" onClick={exit}>Continuar na trilha<HubIcon name="arrow"/></button>}</div>}>
  <section className="module-one-summary"><span className="activity-eyebrow">SEUS REGISTROS · {lesson.name}</span><h1>Um passo de cada vez.</h1><p>Veja o que você experimentou e o que quer retomar. Esses registros não são uma nota ou certificação de técnica.</p>{tasks.map((task,index)=>{const response=ledger.responses[task.id];return <article key={task.id}><HubIcon name={response?.report==='pratiquei'?'check':'book'}/><div><h2>{task.title}</h2><p>{response?.report==='pratiquei'?'Prática relatada':response?.report==='apoio'?'Precisa de apoio':response?'Retomar depois':'Ainda sem registro'}</p>{response?.evidence.siSounds!==undefined&&response.evidence.siSounds>0&&<small>{response.evidence.siSounds} {response.evidence.siSounds===1?'som de Si percebido':'sons de Si percebidos'} pelo microfone, sem avaliação de timbre.</small>}{task.mode==='identify'&&response?.evidence.answer&&<small>Escolha para conversar com o professor: {response.evidence.answer} modelo.</small>}<button type="button" className="session-text-button" onClick={()=>{setShowIntroduction(false);setPosition(index);setView('task');window.scrollTo({top:0,behavior:'instant'});}}>Rever atividade {index+1}</button></div></article>;})}{warning&&<p className="recorder-discipline-warning" role="status">{warning}</p>}</section>
 </ActivityShell>;
}
