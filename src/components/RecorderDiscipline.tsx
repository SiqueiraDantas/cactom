import {useCallback,useEffect,useRef,useState} from 'react';
import {DiagnosticAudio} from '../lib/diagnosticAudio';
import {MicrophonePitchMonitor} from '../lib/audio';
import {DIAGNOSTIC_TASKS,RECORDER_DIAGNOSTIC_KEY,diagnosticChoiceMatch,readDiagnostic,recordDiagnostic,type DiagnosticId,type DiagnosticResponse} from '../lib/recorderDiagnostic';
import {useProfileStorage} from './ProfileStorage';
import {ActivityShell} from './ActivityExperience';
import {CourseArtwork} from './CourseArtwork';
import {HubIcon} from './CactomHub';
import './recorder-discipline.css';

export function RecorderDiagnosticTask({id,existing,onCommit,onExit,answered}:{id:DiagnosticId;existing?:DiagnosticResponse;onCommit:(response:DiagnosticResponse)=>void;onExit:()=>void;answered:number}){
 const task=DIAGNOSTIC_TASKS.find(item=>item.id===id)!;
 const [choice,setChoice]=useState(existing?.choice??''),[interest,setInterest]=useState(existing?.interest??'');
 const [modelPlayed,setModelPlayed]=useState(existing?.modelPlayed??false),[playing,setPlaying]=useState(false),[error,setError]=useState('');
 const [starting,setStarting]=useState(false),[listening,setListening]=useState(false),[toneDetected,setToneDetected]=useState(existing?.toneDetected??false);
 const [taps,setTaps]=useState<number[]>([]),tapStart=useRef<number|null>(null);
 const audio=useRef(new DiagnosticAudio()),mic=useRef<MicrophonePitchMonitor|null>(null),generation=useRef(0),mounted=useRef(true),toneFrames=useRef(0);
 const stop=useCallback(()=>{
  generation.current++;audio.current.stop();const input=mic.current;mic.current=null;void input?.stop().catch(()=>{});
  if(mounted.current){setPlaying(false);setStarting(false);setListening(false);}
 },[]);
 useEffect(()=>{
  mounted.current=true;const hide=()=>{if(document.hidden)stop();};document.addEventListener('visibilitychange',hide);
  return ()=>{mounted.current=false;stop();document.removeEventListener('visibilitychange',hide);};
 },[stop]);
 const play=async()=>{
  stop();setError('');const token=++generation.current;setPlaying(true);
  try{const finished=await audio.current.play(id);if(mounted.current&&token===generation.current){if(finished)setModelPlayed(true);setPlaying(false);}}
  catch{if(mounted.current&&token===generation.current){audio.current.stop();setError('Não foi possível tocar o exemplo. Confira o áudio ou escolha a opção sem áudio para registrar essa condição.');setPlaying(false);}}
 };
 const toggleMic=async()=>{
  if(listening||starting){stop();return;}
  stop();setError('');setToneDetected(false);toneFrames.current=0;setStarting(true);const token=++generation.current;
  try{
   const input=await MicrophonePitchMonitor.create();
   if(!mounted.current||token!==generation.current){await input.stop();return;}
   mic.current=input;setStarting(false);setListening(true);
   input.listen(sample=>{if(mic.current!==input)return;toneFrames.current=sample?toneFrames.current+1:0;if(toneFrames.current>=3)setToneDetected(true);},snapshot=>{if(mic.current===input&&snapshot.status==='inactive'){stop();setError('O microfone foi interrompido. Você pode tentar novamente ou registrar que precisa de apoio.');}});
  }catch(cause){if(mounted.current&&token===generation.current){stop();setError(cause instanceof Error?cause.message:'Não foi possível abrir o microfone.');}}
 };
 const tap=()=>{const now=performance.now();if(tapStart.current===null)tapStart.current=now;const offset=now-tapStart.current;if(offset<=60000)setTaps(previous=>previous.length<32?[...previous,Math.round(offset)]:previous);};
 const allowedWithoutAudio=['sem-audio','sem-instrumento','apoio','depois'].includes(choice);
 const canContinue=!!choice&&!playing&&!starting&&(!task.sound||modelPlayed||allowedWithoutAudio);
 const commit=()=>{
  if(!canContinue)return;
  stop();onCommit({id,at:new Date().toISOString(),choice,modelPlayed,tapOffsetsMs:taps,toneDetected,...(id==='D08'?{interest:interest.trim().slice(0,120)}:{})});
 };
 return <ActivityShell title={`Diagnóstico · ${id}`} lessonNumber={0} completed={answered} total={8} success={false} onExit={()=>{stop();onExit();}} tools={[{id:'diagnostic-help',label:'Dicas',title:'Uma pista para esta descoberta',icon:<HubIcon name="book"/>,content:<><p>{task.hint}</p><p>Este diagnóstico não vale nota. Sua resposta ajuda a conversar sobre o ponto de partida; não comprova domínio de uma competência.</p></>}]} footer={<div className="session-footer-actions recorder-diagnostic-actions">{id==='D07'&&<button className="activity-primary" type="button" onClick={()=>void toggleMic()}>{starting?'Cancelar abertura':listening?'Parar microfone':'Testar microfone'}</button>}<button className={id==='D07'?'activity-secondary':'activity-primary'} type="button" onClick={commit} disabled={!canContinue}>{id==='D08'?'Ver minhas respostas':'Registrar e avançar'}<HubIcon name="arrow"/></button></div>}>
  <div className="recorder-diagnostic-heading"><span className="activity-eyebrow">DESCOBERTA {DIAGNOSTIC_TASKS.findIndex(item=>item.id===id)+1} DE 8 · SEM NOTA</span><h1>{task.title}</h1><p>{task.instruction}</p></div>
  <section className="recorder-diagnostic-card">
   {task.sound&&<div className="recorder-listening-model"><button type="button" className="activity-secondary" onClick={()=>playing?stop():void play()} disabled={starting}><HubIcon name={playing?'music':'headphones'}/>{playing?'Parar exemplo':modelPlayed?'Ouvir novamente':'Ouvir o exemplo'}</button><span role="status">{playing?'Escutando o exemplo…':modelPlayed?'Exemplo reproduzido':id==='D07'?'Ouça antes de experimentar o som.':'Primeiro, ouça o exemplo.'}</span></div>}
   {task.tapping&&<div className="recorder-diagnostic-taps"><button type="button" className="diagnostic-tap-button" onClick={tap}><HubIcon name="hand"/>Marcar um toque</button><p>{taps.length} {taps.length===1?'toque registrado':'toques registrados'}. Palmas fora da tela não são medidas pelo aplicativo.</p>{taps.length>0&&<button type="button" className="session-text-button" onClick={()=>{setTaps([]);tapStart.current=null;}}>Limpar meus toques</button>}</div>}
   {id==='D06'&&<div className="recorder-diagnostic-instrument"><CourseArtwork instrument="recorder-soprano"/><p>Mão esquerda em cima. Procure uma posição confortável, sem apertar ou esticar os dedos à força.</p></div>}
   {id==='D07'&&<div className="recorder-diagnostic-signal" role="status"><HubIcon name="music"/><p>{listening?toneDetected?'Um sinal sonoro foi percebido. Você pode parar o microfone e registrar como foi.':'Microfone ligado. Experimente um som suave.':toneDetected?'Registro: um sinal sonoro foi percebido.':'O microfone só liga quando você toca em Testar microfone.'}</p><small>Esta observação não avalia dedilhado, qualidade da emissão ou postura.</small></div>}
   <fieldset className="recorder-diagnostic-options"><legend>{id==='D03'||id==='D04'?'Qual é sua escolha?':id==='D08'?'Sua experiência com música':'Como foi para você?'}</legend>{task.choices.map(option=><label key={option.value} className={choice===option.value?'selected':''}><input type="radio" name={'choice-'+id} value={option.value} checked={choice===option.value} onChange={()=>setChoice(option.value)}/><span>{option.label}</span></label>)}</fieldset>
   {id==='D08'&&<label className="recorder-diagnostic-interest">Uma música que você gostaria de aprender (opcional)<input type="text" maxLength={120} value={interest} onChange={event=>setInterest(event.target.value)} autoComplete="off" placeholder="Nome de uma música"/></label>}
   {error&&<p className="activity-error" role="alert">{error}</p>}
   {!!choice&&!canContinue&&!playing&&!starting&&<p className="recorder-diagnostic-note">Reproduza o exemplo antes de registrar essa resposta, ou escolha a opção sem áudio.</p>}
  </section>
 </ActivityShell>;
}

export function RecorderDiscipline({startAt,onExit}:{startAt:DiagnosticId|'summary';onExit:()=>void}){
 const storage=useProfileStorage(),[initial]=useState(()=>readDiagnostic(storage)),[ledger,setLedger]=useState(initial.ledger),[warning,setWarning]=useState(initial.warning);
 const [view,setView]=useState<'diagnostic'|'summary'>(startAt==='summary'?'summary':'diagnostic');
 const [index,setIndex]=useState(()=>Math.max(0,DIAGNOSTIC_TASKS.findIndex(task=>task.id===startAt)));
 const answered=DIAGNOSTIC_TASKS.filter(task=>!!ledger.responses[task.id]).length;
 const commit=(response:DiagnosticResponse)=>{
  const next=recordDiagnostic(ledger,response);setLedger(next);
  if(initial.safeToWrite){try{storage.setItem(RECORDER_DIAGNOSTIC_KEY,JSON.stringify(next));setWarning('');}catch{setWarning('Suas respostas estão nesta sessão, mas o navegador não conseguiu salvá-las.');}}
  if(index===DIAGNOSTIC_TASKS.length-1)setView('summary');else setIndex(index+1);
  window.scrollTo({top:0,behavior:'instant'});
 };
 if(view==='diagnostic')return <RecorderDiagnosticTask key={DIAGNOSTIC_TASKS[index].id} id={DIAGNOSTIC_TASKS[index].id} existing={ledger.responses[DIAGNOSTIC_TASKS[index].id]} answered={answered} onCommit={commit} onExit={onExit}/>;
 return <ActivityShell title="Diagnóstico · suas respostas" lessonNumber={0} completed={answered} total={8} success={false} onExit={onExit} tools={[]} footer={<div className="session-footer-actions recorder-diagnostic-actions"><button type="button" className="activity-secondary" onClick={()=>{setIndex(0);setView('diagnostic');window.scrollTo({top:0,behavior:'instant'});}}>Rever D01</button><button type="button" className="activity-primary" onClick={onExit}>Voltar ao Aprender<HubIcon name="arrow"/></button></div>}>
  <div className="recorder-diagnostic-heading"><span className="activity-eyebrow">DIAGNÓSTICO SEM NOTA</span><h1>Seu ponto de partida.</h1><p>{answered} de 8 descobertas respondidas. Retome estas observações com quem acompanha seu aprendizado.</p></div>
  <div className="recorder-diagnostic-summary">{DIAGNOSTIC_TASKS.map(task=>{const response=ledger.responses[task.id],choice=task.choices.find(option=>option.value===response?.choice),match=response?diagnosticChoiceMatch(response):null;return <section key={task.id}><span>{task.id}</span><div><h2>{task.title}</h2><p>{choice?.label??'Ainda sem resposta'}</p>{response?.interest&&<p>Música escolhida: {response.interest}</p>}{response?.modelPlayed&&match!==null&&<small>Referência do exemplo: {task.id==='D03'?'o segundo som era o mais agudo.':'o caminho das notas descia.'}</small>}{response?.id==='D07'&&<small>{response.toneDetected?'Sinal sonoro percebido no teste opcional.':'Sem sinal sonoro registrado no teste opcional.'} Isso não é uma avaliação da emissão.</small>}</div></section>;})}</div>
  <p className="recorder-diagnostic-note">Este diagnóstico não atribui nota, nível ou aprovação de competência.</p>
  {warning&&<p className="recorder-discipline-warning" role="status">{warning}</p>}
 </ActivityShell>;
}
