import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LabIcon } from './LearningHome';
import { ActivityShell, type ActivityTool } from './ActivityExperience';
import './cactom-dashboard.css';
import { ScoreRenderer } from './ScoreRenderer';
import { ScoreLibraryHub } from './ScoreLibraryHub';
import { ScorePdfReview } from './ScorePdfReview';
import { track } from '../lib/devEvents';
import type { PdfReading } from '../lib/pdfScore';
import { soundingOffset } from '../lib/bandTrail';
import { scoresForInstrument, type LibraryScore } from '../lib/scoreLibrary';
import { MAX_XML_SIZE, parseMusicXml, type ParsedScore } from '../lib/musicxml';
import { activeScoreEvent, assessScore, assessScoreEvent, type ScoreSample, type ScoreVerdict } from '../lib/scoreAssessment';
import { importedScores, saveScore, saveReport, scoreReports, type ScoreReport } from '../lib/scoreStorage';
import { MicrophonePitchMonitor, type PitchSample, type SignalSnapshot } from '../lib/audio';
import { Metronome } from '../lib/metronome';
import { beatMs } from '../lib/rhythm';
import { targetFrequencyFor } from '../lib/music';
import type { PracticeAttempt } from '../lib/adaptive';

import type { InstrumentProfile } from '../lib/instruments';
import type { RecorderSystem } from '../lib/recorder';

import { useProfileStorage } from './ProfileStorage';

type Phase='idle'|'starting'|'countin'|'playing'|'review';
/** Como a tela abre a partir da aba Partituras: direto numa partitura ou já lendo um arquivo. */
export type ScoreStart={scoreId?:string;file?:File};
type Props={instrument:InstrumentProfile;recorderSystem:RecorderSystem;onExit:()=>void;onAttempt:(attempt:Omit<PracticeAttempt,'id'|'at'|'instrumentId'>)=>void;start?:ScoreStart|null};
export function ScoreLab({onExit,onAttempt,instrument,recorderSystem,start:opening=null}:Props){
  const {profileId}=useProfileStorage();
  const recorder=instrument.id==='recorder-soprano';
  const readScore=(xml:string)=>parseMusicXml(xml,undefined,instrument.id,recorderSystem,instrument.id==='trumpet-bb'?soundingOffset('trumpet-bb'):-2);
  const [pdf,setPdf]=useState<(PdfReading&{fileName:string})|null>(null),[pdfError,setPdfError]=useState(''),[importStep,setImportStep]=useState('');
  const [library,setLibrary]=useState<LibraryScore[]>([...scoresForInstrument(instrument.id)]),[chosen,setChosen]=useState<LibraryScore|null>(null);
  const [parsed,setParsed]=useState<ParsedScore|null>(null),[phase,setPhase]=useState<Phase>('idle');
  const [error,setError]=useState(''),[storageError,setStorageError]=useState(''),[reports,setReports]=useState<ScoreReport[]>([]);
  const [bpm,setBpm]=useState(60),[offset,setOffset]=useState(0),[beat,setBeat]=useState(0),[count,setCount]=useState(4);
  const [ready,setReady]=useState(false),[active,setActive]=useState(-1),[cursor,setCursor]=useState<number|null>(null);
  const [results,setResults]=useState<ScoreVerdict[]>([]),[feedback,setFeedback]=useState('Escolha um estudo para começar.');
  const [range,setRange]=useState<number|null>(null),[importing,setImporting]=useState(false);
  const mic=useRef<MicrophonePitchMonitor|null>(null),metro=useRef<Metronome|null>(null),timer=useRef<ReturnType<typeof setInterval>|null>(null);
  const signal=useRef<SignalSnapshot>({rms:0,clarity:0,frequency:null,status:'quiet'});
  const generation=useRef(0),mounted=useRef(true),starting=useRef(false),samples=useRef<ScoreSample[]>([]),judged=useRef(new Map<string,ScoreVerdict>());
  const onAttemptRef=useRef(onAttempt);onAttemptRef.current=onAttempt;
  const readyCallback=useCallback((value:boolean)=>setReady(value),[]);
  const exercise=useMemo(()=>{
    if(!parsed||range===null)return parsed;
    const measure=parsed.measures.find(m=>m.index===range);if(!measure)return parsed;
    const events=parsed.events.filter(e=>e.startBeat>=measure.startBeat&&e.startBeat+e.beats<=measure.startBeat+measure.beats).map(e=>({...e,startBeat:e.startBeat-measure.startBeat,segments:e.segments.map(s=>({...s,startBeat:s.startBeat-measure.startBeat}))}));
    return {...parsed,events,measures:[{...measure,startBeat:0}],totalBeats:measure.beats};
  },[parsed,range]);
  const stop=useCallback(()=>{
    generation.current++;starting.current=false;
    if(timer.current){clearInterval(timer.current);timer.current=null;}
    const monitor=mic.current;mic.current=null;void monitor?.stop().catch(()=>{});
    metro.current?.stop();metro.current=null;
    if(mounted.current){setPhase('idle');setBeat(0);}
  },[]);
  useEffect(()=>{
    mounted.current=true;
    void importedScores(profileId).then(items=>{if(!mounted.current)return;const all=[...scoresForInstrument(instrument.id),...items.filter(i=>typeof i.xml==='string'&&typeof i.title==='string'&&(i.instrumentId??'trumpet-bb')===instrument.id)];setLibrary(all);const wanted=opening?.scoreId?all.find(i=>i.id===opening.scoreId):undefined;if(wanted)choose(wanted);}).catch(()=>{if(mounted.current)setStorageError('A biblioteca importada ficará apenas nesta sessão, pois o armazenamento local não está disponível.');});
    void scoreReports(profileId).then(items=>{if(mounted.current)setReports(items);}).catch(()=>{});
    const hide=()=>{if(document.hidden){stop();setFeedback('Treino pausado ao sair da tela. Recomece com uma nova contagem.');}};
    document.addEventListener('visibilitychange',hide);
    if(opening?.file)void importFile(opening.file);
    return ()=>{mounted.current=false;stop();document.removeEventListener('visibilitychange',hide);};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[stop]);
  const choose=(item:LibraryScore)=>{
    stop();setError('');setResults([]);judged.current.clear();setRange(null);setCursor(null);setActive(-1);
    try{const score=readScore(item.xml);setParsed(score);setBpm(score.bpm);setChosen(item);setReady(false);setFeedback('Leia a partitura e prepare seu instrumento.');window.scrollTo({top:0,behavior:'instant'});}
    catch(e){setError(e instanceof Error?e.message:'Não foi possível ler a partitura.');}
  };
  const keep=async(item:LibraryScore)=>{
    if(library.filter(s=>s.imported).length>=20&&!library.some(s=>s.id===item.id))throw new Error('A biblioteca comporta até 20 partituras tuas. Apague uma no navegador para trazer outra.');
    try{await saveScore(item,profileId);}catch{setStorageError('A partitura abriu, mas não pôde ser salva. Ela ficará disponível nesta sessão.');}
    if(!mounted.current)return;
    setLibrary(previous=>[...previous.filter(s=>s.id!==item.id),item]);choose(item);
  };
  const confirmPdf=async(xml:string,title:string)=>{
    setPdfError('');
    try{const score=readScore(xml);await keep({instrumentId:instrument.id,id:score.id,title,description:`${score.measures.length} compassos · lida do teu PDF`,xml:score.xml,imported:true});if(mounted.current)setPdf(null);}
    catch(e){if(mounted.current)setPdfError(e instanceof Error?e.message:'Não consegui montar esta partitura.');}
  };
  const importFile=async(file:File|undefined)=>{
    if(!file)return;setError('');setImporting(true);
    try{
      if(/\.pdf$/i.test(file.name)||file.type==='application/pdf'){
        const {readPdfScore}=await import('../lib/pdfScore');
        const reading=await readPdfScore(file,step=>{if(mounted.current)setImportStep(step);});
        track('score_import',{format:'pdf',pages:reading.pages,notes:reading.result.measures.reduce((n,m)=>n+m.items.filter(x=>x.midi!==null).length,0),instrument:instrument.id});
        if(!mounted.current)return;
        if(!reading.result.measures.some(m=>m.items.some(n=>n.midi!==null)))throw new Error('Não achei notas neste PDF. Ele precisa ter a partitura desenhada (não só texto), numa pauta com clave de Sol.');
        setPdfError('');setPdf({...reading,fileName:file.name});window.scrollTo({top:0,behavior:'instant'});return;
      }
      if(file.size>MAX_XML_SIZE)throw new Error('Escolha um arquivo de até 512 KB.');
      if(!/\.(musicxml|xml)$/i.test(file.name))throw new Error('Use .musicxml ou .xml descompactado. Arquivos .mxl ainda não são aceitos.');
      const xml=await file.text(),score=readScore(xml);
      await keep({instrumentId:instrument.id,id:score.id,title:score.title,description:`${score.measures.length} compassos · importada por você`,xml:score.xml,imported:true});
    }catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Não foi possível importar o arquivo.');}
    finally{if(mounted.current){setImporting(false);setImportStep('');}}
  };
  const start=async()=>{
    if(!exercise||!chosen||!ready||starting.current||phase==='playing'||phase==='countin')return;
    const shortest=Math.min(...exercise.events.map(e=>e.beats));
    if(shortest*beatMs(bpm)<300){setError(`Há figuras muito curtas neste andamento. Reduza para até ${Math.floor(shortest*60000/300)} BPM, para permitir uma avaliação confiável com este detector.`);return;}
    starting.current=true;const token=++generation.current;setError('');setPhase('starting');setResults([]);judged.current.clear();setCursor(null);samples.current=[];
    try{
      const input=await MicrophonePitchMonitor.create();
      if(token!==generation.current){await input.stop();return;}mic.current=input;
      const clock=new Metronome();metro.current=clock;
      await clock.start(bpm,n=>{if(token===generation.current)setBeat(n);},exercise.beatsPerBar);
      if(token!==generation.current){clock.stop();return;}
      const startAt=clock.nextExerciseBarStartMs();if(startAt===null)throw new Error('Não foi possível iniciar a contagem.');
      const pulse=beatMs(bpm);let ended=false;
      const capture=(sample:PitchSample)=>{
        if(token!==generation.current||ended)return;
        const at=(sample?.timestamp??performance.now())+offset;
        if(at>=startAt-500&&at<=startAt+exercise.totalBeats*pulse+500)samples.current.push({at,frequency:sample?.frequency??(signal.current.status==='unpitched'?0:null)});
        const index=activeScoreEvent(exercise,(performance.now()-startAt)/pulse),event=exercise.events[index];
        if(!event)return;
        if(event.kind==='rest'){setFeedback(sample||signal.current.status==='unpitched'?'Este pulso pede silêncio. Solte o som.':'Deixe o silêncio fazer parte da música.');return;}
        if(!sample){setFeedback(`Toque ${event.note?.label} e mantenha a figura indicada.`);return;}
        const cents=1200*Math.log2(sample.frequency/targetFrequencyFor(event.note!));
        setFeedback(Math.abs(cents)<=45?'Nota certa. Acompanhe a duração na partitura.':Math.abs(cents)<100?'Ajuste suavemente a afinação.':`Estamos procurando ${event.note?.label}, na oitava indicada.`);
      };
      input.listen(capture,snapshot=>{signal.current=snapshot;});
      const tick=()=>{
        if(token!==generation.current||ended)return;
        if(!input.active){stop();setError('O microfone foi interrompido. Reconecte e recomece o trecho.');return;}
        const now=performance.now(),elapsed=(now-startAt)/pulse;
        if(elapsed<0){setPhase('countin');setCount(Math.min(exercise.beatsPerBar,Math.ceil(-elapsed)));setFeedback('Aguarde a contagem. Seu primeiro som entra no início do compasso.');return;}
        setPhase('playing');
        const index=activeScoreEvent(exercise,elapsed);setActive(index);
        const event=exercise.events[index],segment=event?.segments.find(s=>elapsed>=s.startBeat&&elapsed<s.startBeat+s.beats);
        if(segment)setCursor(segment.cursorIndex);
        let changed=false;
        const evaluationDelay=450+Math.max(0,-offset);
        for(const item of exercise.events)if(!judged.current.has(item.id)&&now>=startAt+(item.startBeat+item.beats)*pulse+evaluationDelay){judged.current.set(item.id,assessScoreEvent(item,samples.current,bpm,startAt));changed=true;}
        if(changed)setResults([...judged.current.values()]);
        if(now<startAt+exercise.totalBeats*pulse+evaluationDelay)return;
        ended=true;
        const verdict=assessScore(exercise,samples.current,bpm,startAt),allPassed=verdict.every(v=>v.passed);
        stop();setResults(verdict);setPhase('review');setActive(-1);setFeedback(allPassed?'Você concluiu este trecho! Cada nota recebeu um check.':'Tem música crescendo aí. Veja os compassos para tentar de novo.');
        const report:ScoreReport={id:crypto.randomUUID(),scoreId:chosen.id+(range===null?'':`-measure-${range}`),scoreTitle:exercise.title+(range===null?'':` · compasso ${range+1}`),at:new Date().toISOString(),bpm,passed:allPassed,results:verdict};
        setReports(previous=>[report,...previous].slice(0,200));
        void saveReport(report,profileId).catch(()=>{if(mounted.current)setStorageError('O resultado está nesta sessão, mas não pôde ser salvo no navegador.');});
        verdict.forEach(v=>{const item=exercise.events.find(e=>e.id===v.eventId);if(!item)return;onAttemptRef.current({lessonId:'score-'+chosen.id,stepId:item.id,writtenMidi:item.note?.writtenMidi??67,passed:v.passed,task:item.kind==='rest'?'rest':'rhythm',reason:v.passed?null:v.reason==='note'?'wrong-note':v.reason==='tuning'?'out-of-tune':v.reason==='interrupted'?'interrupted':v.reason==='rest'?'rest':'rhythm',durationMs:item.beats*pulse});});
      };
      timer.current=setInterval(tick,70);tick();
    }catch(e){if(token===generation.current){stop();setError(e instanceof Error?e.message:'Não foi possível iniciar o treino.');}}
    finally{if(token===generation.current)starting.current=false;}
  };
  const running=phase==='starting'||phase==='countin'||phase==='playing';
  const backLibrary=()=>{stop();setChosen(null);setParsed(null);setError('');};
  if(pdf&&!chosen)return <ScorePdfReview result={pdf.result} preview={pdf.preview} fileName={pdf.fileName} pdfTitle={pdf.title} pages={pdf.pages} instrumentId={instrument.id} error={pdfError} onCancel={()=>{setPdf(null);setPdfError('');}} onConfirm={(xml,title)=>void confirmPdf(xml,title)}/>;
  if(!chosen||!parsed||!exercise)return <ScoreLibraryHub instrument={instrument} library={library} reports={reports} importing={importing} importStep={importStep} error={error} storageError={storageError} onExit={onExit} onChoose={choose} onImport={importFile}/>;
  const tools:ActivityTool[]=[{id:'score-help',label:'Dicas',title:'Como praticar a partitura',icon:<LabIcon name="book" size={23}/>,content:<><p>{recorder?'As notas são escritas para flauta doce soprano, que soa uma oitava acima da pauta com 8.':instrument.id==='clarinet-bb'?'As notas são escritas para clarinete em Si♭, que soa dois semitons abaixo.':soundingOffset('trumpet-bb')===0?'As notas são escritas para trompete; teu trompete em Dó soa como está escrito.':'As notas são escritas para trompete em Si♭, que soa dois semitons abaixo.'} Use fones para o metrônomo não entrar no microfone.</p><p>O marcador acompanha a posição esperada no andamento. Os checks aparecem após avaliar a nota e sua duração. Notas repetidas precisam de emissões separadas.</p><p>A avaliação rítmica é aproximada; ajuste a compensação do microfone se necessário. Ela não avalia embocadura nem respiração.</p>{parsed.warnings.map(w=><p key={w}>{w}</p>)}</>},{id:'score-history',label:'Histórico',title:'Tentativas desta partitura',icon:<LabIcon name="chart" size={23}/>,content:<>{reports.filter(r=>r.scoreId===chosen.id||r.scoreId.startsWith(chosen.id+'-measure-')).slice(0,12).map(r=><p key={r.id}><b>{r.passed?'✓ Trecho concluído':'Em prática'}</b><br/>{r.scoreTitle}<br/>{new Date(r.at).toLocaleString('pt-BR')} · {r.bpm} BPM</p>)}{!reports.some(r=>r.scoreId.startsWith(chosen.id))&&<p>Seu histórico aparece depois da primeira tentativa completa.</p>}</>}];
  return <ActivityShell key={chosen.id} title={chosen.title} lessonNumber={0} total={exercise.events.length} completed={results.filter(r=>r.passed).length} onExit={()=>{stop();onExit();}} success={phase==='review'&&results.length>0&&results.every(r=>r.passed)} tools={tools} footer={<><div className="session-footer-feedback"><span className="footer-feedback-icon"><LabIcon name={phase==='review'&&results.every(r=>r.passed)?'check':'music'} size={23}/></span><div><b>{phase==='countin'?`Prepare-se: ${count} pulso(s)`:phase==='review'?'Seu trecho, compasso a compasso.':phase==='playing'?'Siga o seu compasso.':'Seu próximo som começa aqui.'}</b><p>{feedback}</p></div></div><div className="session-footer-actions"><button className="session-text-button" type="button" onClick={backLibrary}>Biblioteca</button><button className="activity-primary" type="button" disabled={!ready||phase==='starting'} onClick={()=>running?stop():void start()}>{phase==='starting'?'PREPARANDO…':running?'PAUSAR TREINO':phase==='review'?'TENTAR NOVAMENTE':'COMEÇAR A TOCAR'}</button></div></>}>
    <div className="activity-heading"><span className="activity-eyebrow">{recorder?'FLAUTA DOCE SOPRANO · CLAVE 8':instrument.id==='clarinet-bb'?'CLARINETE EM SI♭ · NOTAS ESCRITAS':'TROMPETE · NOTAS ESCRITAS'}</span><h1>{chosen.title}</h1><p>{range===null?`${parsed.measures.length} compassos`:`Praticando o compasso ${range+1}`} · {phase==='playing'?'Marcador: posição esperada no andamento':'Leia com calma antes de tocar.'}</p></div>
    <div className="score-controls"><label>Andamento <b>{bpm} BPM</b><input aria-label="Andamento da partitura" type="range" min="45" max="120" step="5" value={bpm} disabled={running} onChange={e=>setBpm(Number(e.target.value))}/></label><label>Compensação <b>{offset>0?'+':''}{offset} ms</b><input aria-label="Compensação do microfone na partitura" type="range" min="-300" max="300" step="25" value={offset} disabled={running} onChange={e=>setOffset(Number(e.target.value))}/></label><label>Trecho<select aria-label="Trecho da partitura" value={range??'all'} disabled={running} onChange={e=>{const value=e.target.value;if(value==='all'){setRange(null);}else{const index=Number(value),bar=parsed.measures[index];if(parsed.events.some(ev=>ev.startBeat<bar.startBeat&&ev.startBeat+ev.beats>bar.startBeat||ev.startBeat<bar.startBeat+bar.beats&&ev.startBeat+ev.beats>bar.startBeat+bar.beats)){setError('Este compasso contém uma ligadura com o vizinho. Pratique a partitura inteira para respeitar a duração.');return;}setRange(index);}setResults([]);setCursor(null);setPhase('idle');setError('');}}><option value="all">Partitura inteira</option>{parsed.measures.map(m=><option value={m.index} key={m.index}>Compasso {m.label}</option>)}</select></label></div>
    <div className="score-pulse"><span>{exercise.beatsPerBar}/4</span><div className="activity-beats">{Array.from({length:exercise.beatsPerBar},(_,i)=><span key={i} className={running&&beat===i+1?'active':''}>{i+1}</span>)}</div><b>{running&&phase==='countin'?`Entrando em ${count}…`:phase==='playing'?exercise.events[active]?.kind==='rest'?'Silêncio':exercise.events[active]?.note?.label:'Use fones para praticar'}</b></div>
    <ScoreRenderer xml={parsed.xml} cursorIndex={cursor} onReady={readyCallback}/>
    <div className="score-measures" aria-label="Resultado por compasso">{exercise.measures.map(m=>{const ids=exercise.events.filter(e=>e.segments.some(s=>s.startBeat<m.startBeat+m.beats&&s.startBeat+s.beats>m.startBeat)).map(e=>e.id),done=ids.map(id=>results.find(v=>v.eventId===id)),finished=done.every(Boolean),passed=finished&&done.every(v=>v?.passed);return <div className={finished?passed?'passed':'retry':''} key={m.index}><b>{passed?'✓ ':finished?'↻ ':''}Compasso {m.label}</b><small>{finished?passed?'Concluído':'Vamos repetir':'Aguardando sua tentativa'}</small></div>;})}</div>
    {results.length>0&&<div className="score-verdicts">{results.map(r=>{const event=exercise.events.find(e=>e.id===r.eventId);return <button type="button" disabled={running} key={r.eventId} className={r.passed?'passed':'retry'} onClick={()=>setCursor(event?.segments[0].cursorIndex??null)}><span>{r.passed?'✓':'↻'}</span><div><b>Compasso {r.measureIndex+1} · {event?.kind==='rest'?'Pausa':event?.note?.label}</b><p>{r.message}</p></div></button>;})}</div>}
    {error&&<p role="alert" className="activity-error">{error}</p>}{storageError&&<p role="status" className="score-notice">{storageError}</p>}
  </ActivityShell>;
}
