import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import { MicrophonePitchMonitor, type PitchSample, type SignalSnapshot } from '../lib/audio';
import { scoreSoundBar, recorderQuietThreshold, recorderRhythmSample, type RecorderRhythmSample } from '../lib/guidedRhythm';
import { MusicSymbol, MusicSymbolShape } from './MusicSymbol';
import { Metronome } from '../lib/metronome';
import { ReferenceTone } from '../lib/referenceTone';
import { TRUMPET, type InstrumentProfile } from '../lib/instruments';
import type { PracticeNote } from '../lib/music';
import { FIGURES, BPM_MAX, BPM_MIN, beatMs } from '../lib/rhythm';
import { scoreBar, validBar, barEvents, type TimedPitch, type EventAssessment } from '../lib/pulseAssessment';
import { formatWrittenNote, frequencyToMidi } from '../lib/music';
import type { Lesson } from '../lib/curriculum';
import {TREBLE_CLEF_PATH} from '../lib/trebleClef';

export type MeteredControls={start:()=>Promise<void>;stop:()=>Promise<void>};
export type MeteredControlState={preparing:boolean;running:boolean;review:boolean};
type Props={controlsRef?:Ref<MeteredControls>;onControlState?:(state:MeteredControlState)=>void;externalControls?:boolean;compact?:boolean;instrument?:InstrumentProfile;lesson:Lesson;onComplete:(results:EventAssessment[])=>void;onAttempt?:(results:EventAssessment[],bpm:number)=>void;completed:boolean};
type RunStatus='off'|'calibrating'|'ready'|'countin'|'playing'|'review';
const silentSignal:SignalSnapshot={rms:0,clarity:0,frequency:null,status:'quiet'};
export function MeteredBarLesson({lesson,onComplete,onAttempt,completed,instrument=TRUMPET,compact=false,controlsRef,onControlState,externalControls=false}:Props){
  const guided=instrument.id==='recorder-soprano'&&['recorder-compasso','recorder-pausa'].includes(lesson.id);
  const [bpm,setBpm]=useState(lesson.defaultBpm??60),[offset,setOffset]=useState(0);
  const [micOn,setMicOn]=useState(false),[clockOn,setClockOn]=useState(false),[beat,setBeat]=useState(0);
  const [status,setStatus]=useState<RunStatus>('off'),[activeIndex,setActiveIndex]=useState(-1),[countdown,setCountdown]=useState(4);
  const [liveResults,setLiveResults]=useState<(EventAssessment|null)[]>([]);
  const reviewedCount=useRef(0);
  const [results,setResults]=useState<EventAssessment[]|null>(null),[error,setError]=useState(''),[preparing,setPreparing]=useState(false);
  const [signal,setSignal]=useState<SignalSnapshot>(silentSignal),[microphoneName,setMicrophoneName]=useState('');
  const [devices,setDevices]=useState<MediaDeviceInfo[]>([]),[deviceId,setDeviceId]=useState(''),[minimumRms,setMinimumRms]=useState(.008);
  const monitor=useRef<MicrophonePitchMonitor|null>(null),metro=useRef<Metronome|null>(null),samples=useRef<TimedPitch[]>([]);
  const recorderSamples=useRef<RecorderRhythmSample[]>([]);
  const ambientReadings=useRef<number[]>([]),measuringAmbient=useRef(false),quietThreshold=useRef(minimumRms);
  const guide=useRef<ReferenceTone|null>(null),guideVersion=useRef(0);
  const stopGuide=useCallback(()=>{guideVersion.current++;const audio=guide.current;guide.current=null;audio?.stop();return Promise.resolve();},[]);
  const playGuide=async(note:PracticeNote)=>{
    if(monitor.current||preparingRef.current)return;
    await stopGuide();const token=guideVersion.current,audio=new ReferenceTone();guide.current=audio;
    try{if(token!==guideVersion.current||monitor.current)return;await audio.play(note);if(token!==guideVersion.current)audio.stop();}
    catch{if(token===guideVersion.current){void stopGuide();if(mounted.current)setError('Não foi possível reproduzir a referência sonora.');}}
  };
  const startAt=useRef<number|null>(null),completedRef=useRef(false),generation=useRef(0),preparingRef=useRef(false),inputSignal=useRef(silentSignal);
  const onCompleteRef=useRef(onComplete);onCompleteRef.current=onComplete;
  const onAttemptRef=useRef(onAttempt);onAttemptRef.current=onAttempt;
  const bpmRef=useRef(bpm);bpmRef.current=bpm;
  const offsetRef=useRef(offset);offsetRef.current=offset;
  const mounted=useRef(true),configured=validBar(lesson.steps);
  const stop=useCallback(async()=>{
    generation.current++;preparingRef.current=false;measuringAmbient.current=false;startAt.current=null;
    const input=monitor.current;monitor.current=null;metro.current?.stop();metro.current=null;
    await stopGuide();
    if(mounted.current){setStatus('off');setActiveIndex(-1);setMicOn(false);setClockOn(false);setBeat(0);setPreparing(false);setSignal(silentSignal);}
    if(input)try{await input.stop();}catch{/* Device was already disconnected. */}
  },[stopGuide]);
  useEffect(()=>{
    mounted.current=true;
    const hide=()=>{if(document.hidden)void stop();};
    document.addEventListener('visibilitychange',hide);
    return ()=>{mounted.current=false;void stop();document.removeEventListener('visibilitychange',hide);};
  },[stop]);
  useEffect(()=>{void stop();samples.current=[];setResults(null);completedRef.current=false;},[lesson.id,stop]);
  const tick=useCallback((at:number)=>{
    const beginning=startAt.current;if(beginning===null||completedRef.current)return;
    if(!monitor.current?.active){void stop();setError('O sinal do microfone foi interrompido. Reconecte e comece novamente.');return;}
    // Latency corrects captured samples only. The visual cue follows the actual clock.
    const elapsed=at-beginning,msPerBeat=beatMs(bpmRef.current);
    if(elapsed<0){setStatus('countin');setCountdown(Math.max(1,Math.min(4,Math.ceil(-elapsed/msPerBeat))));setActiveIndex(-1);return;}
    if(guided){
      const events=barEvents(lesson.steps,bpmRef.current,beginning);
      const finished=events.filter(e=>at>=e.end+120).length;
      if(finished>reviewedCount.current){
        reviewedCount.current=finished;
        const scored=scoreSoundBar(lesson.steps,recorderSamples.current,bpmRef.current,beginning);
        setLiveResults(scored.map((v,i)=>i<finished?v:null));
      }
    }
    const evaluationDelay=450+Math.max(0,-offsetRef.current);
    if(elapsed<4*msPerBeat+evaluationDelay){
      setStatus('playing');setActiveIndex(barEvents(lesson.steps,bpmRef.current,beginning).findIndex(e=>at>=e.start&&at<e.end));return;
    }
    completedRef.current=true;
    const verdict=guided?scoreSoundBar(lesson.steps,recorderSamples.current,bpmRef.current,beginning):scoreBar(lesson.steps,samples.current,bpmRef.current,beginning);
    setResults(verdict);setStatus('review');setActiveIndex(-1);
    onAttemptRef.current?.(verdict,bpmRef.current);
    if(verdict.every(v=>v.passed))onCompleteRef.current(verdict);
  },[lesson,stop,guided]);
  const tickRef=useRef(tick);tickRef.current=tick;
  useEffect(()=>{const id=setInterval(()=>{if(startAt.current!==null)tickRef.current(performance.now());},60);return ()=>clearInterval(id);},[]);
  const capture=useCallback((sample:PitchSample)=>{
    if(startAt.current===null||completedRef.current)return;
    const at=(sample?.timestamp??performance.now())+offsetRef.current,start=startAt.current,limit=4*beatMs(bpmRef.current);
    if(at>=start-600&&at<=start+limit+600){
      if(guided)recorderSamples.current.push(recorderRhythmSample(sample,inputSignal.current,at,quietThreshold.current));
      samples.current.push({at,frequency:sample?.frequency??(inputSignal.current.status==='unpitched'?0:null)});
      if(samples.current.length>400)samples.current.shift();
    }
    tickRef.current(sample?.timestamp??performance.now());
  },[guided,lesson]);
  const launch=()=>{
    const at=metro.current?.nextExerciseBarStartMs();
    if(at===null||at===undefined||!monitor.current?.active)throw new Error('Ative o microfone antes de começar o compasso.');
    reviewedCount.current=0;setLiveResults([]);recorderSamples.current=[];
    samples.current=[];completedRef.current=false;setResults(null);startAt.current=at;
    setStatus('countin');setCountdown(4);setActiveIndex(-1);
  };
  const prepare=async(run:boolean)=>{
    if(preparingRef.current||!configured||completed)return;
    preparingRef.current=true;setPreparing(true);setError('');const token=++generation.current;
    try{
      await stopGuide();if(token!==generation.current)return;
      if(!monitor.current){
        const input=await MicrophonePitchMonitor.create({deviceId:deviceId||undefined,minimumRms});
        if(!mounted.current||token!==generation.current){await input.stop();return;}
        monitor.current=input;setMicrophoneName(input.label);
        input.listen(capture,value=>{inputSignal.current=value;if(measuringAmbient.current&&value.status!=='inactive')ambientReadings.current.push(value.rms);if(mounted.current)setSignal(value);});
        setMicOn(true);setStatus('ready');
        void navigator.mediaDevices.enumerateDevices().then(list=>{if(mounted.current&&token===generation.current)setDevices(list.filter(d=>d.kind==='audioinput'&&d.deviceId));}).catch(()=>{});
      }
      if(run){
        if(guided){
          // Measure room noise without our own clicks; no recording or extra user step.
          metro.current?.stop();metro.current=null;setClockOn(false);setBeat(0);
          startAt.current=null;ambientReadings.current=[];measuringAmbient.current=true;setResults(null);setLiveResults([]);setActiveIndex(-1);setStatus('calibrating');
          await new Promise<void>(resolve=>setTimeout(resolve,750));
          if(!mounted.current||token!==generation.current)return;
          measuringAmbient.current=false;
          if(!monitor.current?.active)throw new Error('O microfone foi interrompido. Reconecte e tente novamente.');
          quietThreshold.current=recorderQuietThreshold(ambientReadings.current,minimumRms);
        }
        if(!metro.current){const clock=new Metronome();metro.current=clock;await clock.start(bpm,n=>{if(metro.current===clock)setBeat(n);});if(token!==generation.current){clock.stop();return;}setClockOn(true);}
        launch();
      }
    }catch(e){if(token===generation.current){await stop();setError(e instanceof Error?e.message:'Não foi possível iniciar o microfone.');}}
    finally{if(token===generation.current){preparingRef.current=false;setPreparing(false);}}
  };
  useImperativeHandle(controlsRef,()=>({start:()=>prepare(true),stop}));
  useEffect(()=>{
    onControlState?.({preparing,running:status==='countin'||status==='playing',review:status==='review'});
  },[onControlState,preparing,status]);
  const displayedResults=results??liveResults;
  const passed=results?.every(r=>r.passed)??false;
  // Simplified, responsive treble staff: event spacing is proportional to beats.
  let beatPosition = 0;
  const staffGlyphs = lesson.steps.map((event,i)=>{
    const x=100+beatPosition*68;
    beatPosition+=event.figure?FIGURES[event.figure].beats:1;
    const degree=[0,0,1,1,2,3,3,4,4,5,5,6][event.note.writtenMidi%12]+7*(Math.floor(event.note.writtenMidi/12)-5);
    const y=95-degree*7.5;
    return {event,x,y,index:i};
  });
  return <section className={`metered-lab glass-panel ${guided?'metered-lab--guided':''} ${compact?'metered-lab--compact':''}`} aria-label="Laboratório de compasso 4 por 4">
    {compact?<div className="metered-score-heading"><h2>Partitura</h2><span>4/4 · {bpm} BPM</span></div>:<>
    <div className="section-heading"><div><span className="eyebrow">SEU SOM NO COMPASSO</span><h2>{guided?'Siga os tempos da partitura':'Toque no tempo da partitura'}</h2></div><span className="step-pill">4/4 · {bpm} BPM</span></div>
    </>}
    <details className="metered-input-details" open={compact?undefined:true}><summary>Microfone e áudio</summary>
    <section className="rhythm-input-monitor" aria-label="Sinal do microfone">
      <div className="rhythm-input-heading"><span className={micOn?'rhythm-mic-live':''}>{micOn?'● MICROFONE ATIVO':'○ MICROFONE DESLIGADO'}</span><b>{signal.status==='pitched'&&signal.frequency?formatWrittenNote(Math.round(frequencyToMidi(signal.frequency)!-instrument.transpose)):signal.status==='unpitched'?'Som presente, buscando a nota':micOn?'Aguardando seu som':'Teste antes de começar'}</b></div>
      <div className="rhythm-level" role="meter" aria-label="Nível do sinal do microfone" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.round(Math.sqrt(signal.rms)*250))}><span style={{width:`${Math.min(100,Math.round(Math.sqrt(signal.rms)*250))}%`}}/></div>
      <p>{micOn?microphoneName:'Ao iniciar, permita o microfone no navegador.'}{signal.status==='pitched'&&signal.frequency?` · Som real: ${Math.round(signal.frequency)} Hz · ${instrument.id==='recorder-soprano'?'soprano: soa uma oitava acima da pauta':'nota escrita para trompete em Si♭'}`:''}</p>
      {!micOn&&<div className="rhythm-reference"><span>Ouça as notas escritas:</span>{[...new Map(lesson.steps.filter(s=>s.kind!=='rest').map(s=>[s.note.writtenMidi,s.note])).values()].map(note=><button type="button" disabled={preparing} key={note.id} onClick={()=>void playGuide(note)}>♪ {note.label}</button>)}</div>}
      <details><summary>Microfone e sensibilidade</summary><label>Entrada de áudio<select aria-label="Microfone das atividades de ritmo" value={deviceId} disabled={micOn||preparing} onChange={e=>setDeviceId(e.target.value)}><option value="">Padrão do sistema</option>{devices.map(d=><option key={d.deviceId} value={d.deviceId}>{d.label||'Microfone conectado'}</option>)}</select></label><label>Limiar de entrada <b>{minimumRms.toFixed(3)}</b><input aria-label="Limiar de silêncio do microfone" type="range" min=".002" max=".02" step=".001" value={minimumRms} disabled={micOn||preparing} onChange={e=>setMinimumRms(Number(e.target.value))}/></label><p>Se a barra não se mover, confira a entrada e a permissão. Se houver sinal mas a nota não aparecer, toque de forma confortável e reduza o limiar com o treino parado. Use fones.</p></details>
      {externalControls&&!micOn&&<button className="secondary-button" type="button" disabled={preparing} onClick={()=>void prepare(false)}>Testar microfone</button>}
    </section></details>
    {!compact&&<p className="metered-intro">{guided?'Siga a partitura: cada semínima dura 1 tempo; cada mínima, 2 tempos. Só faça silêncio onde houver pausa escrita. Toque a nota indicada: pequenas variações de afinação são aceitas, mas outra nota não vale como acerto. As durações seguem o metrônomo.':'Cada figura tem uma entrada e uma saída. O check só aparece após a avaliação de todo o compasso. A avaliação de ataques é aproximada e depende da latência do aparelho.'}</p>}
    {!compact&&<p className="metered-pulse-caption">{guided?'4/4 · siga as notas e respeite apenas as pausas escritas':'4 tempos neste compasso · acompanhe as notas e as pausas abaixo'}</p>}
    <div className="beats metered-beats" aria-live="off">{[1,2,3,4].map(n=><span key={n} className={clockOn&&beat===n?'beat-active':''}>{n}</span>)}</div>
    <svg className="metered-staff" viewBox="0 0 415 126" role="img" aria-label={`Partitura didática em clave de sol, ${lesson.steps.map(s=>s.kind==='rest'?'pausa':s.note.label).join(', ')}`}>
      {[20,35,50,65,80].map(y=><line key={y} x1="35" x2="389" y1={y} y2={y} stroke="currentColor" strokeWidth="1.2" opacity=".42"/>)}
      <path d={TREBLE_CLEF_PATH} transform="translate(40 65) scale(0.045)" fill="currentColor"/>
      {instrument.id==='recorder-soprano'&&<text x="63" y="15" fontSize="10" fill="currentColor">8</text>}
      <text x="355" y="12" fontSize="10" fill="currentColor">4/4</text>
      <line x1="388" x2="388" y1="20" y2="80" stroke="currentColor" strokeWidth="2"/>
      {staffGlyphs.map(({event,x,y,index:i})=><g key={event.id} className={displayedResults[i]?(displayedResults[i]?.passed?'score-note-ok':'score-note-no'):''}>
        {event.kind==='rest'?<g transform={`translate(${x-17}, 22) scale(.7)`}><MusicSymbolShape figure={event.figure} rest/></g>:<>
          {y>=95&&<line x1={x-17} x2={x+19} y1="95" y2="95" stroke="currentColor" strokeWidth="1.3"/>}
          <ellipse cx={x} cy={y} rx="10" ry="6" transform={`rotate(-17 ${x} ${y})`} fill={event.figure==='half'?'none':'currentColor'} stroke="currentColor" strokeWidth="2"/>
          <line x1={x+10} y1={y-2} x2={x+10} y2={y-40} stroke="currentColor" strokeWidth="2"/>
        </>}
        <text x={x} y="115" textAnchor="middle" fontSize="12" fontWeight={i===activeIndex?'700':'400'} fill="currentColor">{event.kind==='rest'?'Pausa':event.note.label}</text>
      </g>)}
    </svg>
    <div className="metered-notation" role="list" aria-label="Compasso de quatro tempos">
      {lesson.steps.map((event,i)=><div className={`metered-event ${i===activeIndex?'metered-current':''} ${displayedResults[i]?(displayedResults[i]?.passed?'metered-ok':'metered-no'):''}`} key={event.id} role="listitem">
        <span className="metered-figure"><MusicSymbol figure={event.figure} rest={event.kind==='rest'}/></span>
        <strong>{event.kind==='rest'?'Pausa':event.note.label}</strong>
        {guided&&<small className="written-time-range">{(()=>{const first=1+lesson.steps.slice(0,i).reduce((sum,s)=>sum+(s.figure?FIGURES[s.figure].beats:1),0);const length=event.figure?FIGURES[event.figure].beats:1;return length===1?`Tempo ${first}`:`Tempos ${first}–${first+length-1}`;})()}</small>}
        <small>{event.figure?FIGURES[event.figure].beats:1} {(!event.figure||FIGURES[event.figure].beats===1)?'tempo':'tempos'}</small>
        {displayedResults[i]&&<span className="metered-mark" aria-label={displayedResults[i]?.passed?'Acerto':'Tente novamente'}>{displayedResults[i]?.passed?'✓':'✕'}</span>}
      </div>)}
    </div>
    <details className="metered-tempo-details" open={compact?undefined:true}><summary>Ajustar andamento · {bpm} BPM</summary>
    <div className="metered-controls">
      <label>Andamento: <strong>{bpm} BPM</strong><input type="range" aria-label="Andamento" min={BPM_MIN} max={BPM_MAX} step="5" value={bpm} disabled={clockOn} onChange={e=>setBpm(Number(e.target.value))}/></label>
      {!guided&&<label>Compensação do microfone: <strong>{offset>=0?'+':''}{offset} ms</strong><input type="range" aria-label="Compensação da latência do microfone" min="-300" max="300" step="25" value={offset} disabled={status==='playing'||status==='countin'} onChange={e=>setOffset(Number(e.target.value))}/></label>}
    </div></details>

    {(!compact||status!=='off'&&status!=='ready')&&<div className="metered-live" role="status" aria-live="polite">
      {status==='calibrating'?'Fique em silêncio por um instante: ajustando o microfone ao ambiente.':status==='off'?'Comece a atividade ou teste o microfone primeiro.':status==='ready'?'Microfone pronto. Toque e confira a nota ouvida; depois comece a atividade.':status==='countin'?`Preparação: ${countdown} tempo(s) para entrar.`:status==='playing'?`Agora: ${activeIndex<0?'solte o som':lesson.steps[activeIndex]?.kind==='rest'?'silêncio':lesson.steps[activeIndex]?.note.label}`:passed?'Compasso concluído! Todas as etapas receberam check.':'Vamos tentar o compasso mais uma vez.'}
    </div>}
    {results&&<div className="metered-feedback">{results.map((r,i)=><div key={r.stepId}><span className={r.passed?'good':'bad'}>{r.passed?'✓':'✕'}</span><div><strong>{lesson.steps[i].kind==='rest'?'Pausa':lesson.steps[i].note.label}</strong><p>{r.message}{r.onsetErrorMs!==null?` Entrada ${r.onsetErrorMs>=0?'+':''}${r.onsetErrorMs} ms.`:''}</p></div></div>)}</div>}
    {!externalControls&&<div className="metered-actions">
      <button type="button" className="primary-button" disabled={completed||preparing||status==='countin'||status==='playing'} onClick={()=>void prepare(true)}>{preparing?'Preparando microfone…':status==='review'?'↻ Tentar o compasso de novo':'▶ Começar atividade'}</button>
      {!micOn&&<button type="button" className="secondary-button" disabled={preparing} onClick={()=>void prepare(false)}>Testar microfone primeiro</button>}
      {micOn&&<button type="button" className="secondary-button" onClick={()=>void stop()}>■ Parar microfone</button>}
    </div>}
    {error&&<div role="alert" className="error-panel">{error}</div>}
    {!compact&&<p className="metered-smallprint">{guided?'Use fones. Após quatro tempos de preparação, acompanhe o metrônomo e a partitura. O sistema verifica a nota e a oitava indicadas com tolerância de afinação, e silêncio nas pausas. Antes da contagem, fique em silêncio durante o ajuste do microfone.':'Use fones. A contagem tem quatro tempos; toque quando aparecer “Agora”.'} O botão de teste apenas escuta, sem avaliar. {!guided&&'Ajuste a compensação apenas se o reconhecimento estiver sistematicamente atrasado/adiantado.'} O aplicativo não grava o áudio nem mede fisicamente a articulação da língua. {completed?'Esta atividade já foi concluída.':''}</p>}
  </section>;
}
