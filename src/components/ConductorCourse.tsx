import {useCallback,useEffect,useRef,useState} from 'react';
import {useProfileStorage} from './ProfileStorage';
import {Metronome} from '../lib/metronome';
import {ARRANGEMENTS,ConductingEnsemble,type ConductingAudioMode} from '../lib/conductorMusic';
import {
  BEAT_POINTS,CONDUCTING_LESSONS,CONDUCTING_UNITS,START,advanceConducting,
  freshGesture,guidePosition,mapHand,scoreGesture,type ConductingLesson,type GestureProgress,type Point,
} from '../lib/conducting';
import './conductor.css';

type Model=import('@mediapipe/tasks-vision').HandLandmarker;
type Stage='off'|'loading'|'ready';
type Result={precision:number;rhythm:number;passed:boolean;stars:number};
type RecordSaved=Result&{at:string};
type Saved=Record<string,RecordSaved>;
const STORAGE='cactom-regencia-cam-v1';
function readProgress(storage:{getItem:(key:string)=>string|null}):Saved {
  try {
    const value=JSON.parse(storage.getItem(STORAGE)||'null');
    if(!value||typeof value!=='object'||Array.isArray(value))return {};
    return Object.fromEntries(Object.entries(value).filter(([key,entry])=>CONDUCTING_LESSONS.some(x=>x.id===key)&&entry&&typeof entry==='object'&&typeof (entry as RecordSaved).precision==='number')) as Saved;
  }catch{return {};}
}
function StageIcon({size=42}:{size?:number}){
  return <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M20 16c0 15-8 24-5 31 4 8 18 8 23-1 7-12 0-22-9-28" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/><path d="M30 18 25 6m5 12 8-7" stroke="#F5A528" strokeWidth="5" strokeLinecap="round"/><circle cx="16" cy="48" r="5" fill="#F5A528"/><path d="M44 15c10 5 14 15 13 25" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 5"/></svg>;
}
export function ConductorCourse({onChooseInstrument,onSignOut}:{onChooseInstrument:()=>void;onSignOut:()=>void}){
  const storage=useProfileStorage();
  const [saved,setSaved]=useState<Saved>(()=>readProgress(storage));
  const [selected,setSelected]=useState<ConductingLesson|null>(null);
  const finished=CONDUCTING_LESSONS.filter(l=>saved[l.id]?.passed).length;
  const record=useCallback((id:string,result:Result)=>{
    setSaved(prev=>{
      const earlier=prev[id];
      const keep=earlier&&(earlier.passed&&!result.passed||(earlier.passed===result.passed&&earlier.precision>result.precision))?earlier:{...result,at:new Date().toISOString()};
      const next={...prev,[id]:keep};
      try{storage.setItem(STORAGE,JSON.stringify(next));}catch{/* modo sem armazenamento */}
      return next;
    });
  },[storage]);
  if(selected){
    const index=CONDUCTING_LESSONS.findIndex(l=>l.id===selected.id);
    return <ConductorPractice key={selected.id} lesson={selected} onExit={()=>setSelected(null)} onFinish={record} onNext={()=>{const next=CONDUCTING_LESSONS[index+1];setSelected(next??null);}}/>;
  }
  return <main className="conductor-home">
    <header className="conductor-topbar"><button className="conductor-back" type="button" onClick={onChooseInstrument}>← Trocar curso</button><strong className="conductor-brand">Cactom <span>✳</span></strong><button className="conductor-exit" type="button" onClick={onSignOut}>Sair</button></header>
    <section className="conductor-intro"><div className="conductor-intro-copy"><span className="conductor-eyebrow">NOVO CURSO · APRENDA COM SEU CORPO</span><h1>Regência <span>em movimento.</span></h1><p>Suas mãos conduzem a música! A câmera acompanha seus gestos enquanto você aprende os compassos com som, ritmo e prática.</p><div className="conductor-highlights"><span>📷 Câmera ao vivo</span><span>♪ Som antes do símbolo</span><span>🎼 2/4 · 3/4 · 4/4</span></div><div className="conductor-total"><b>{finished} de {CONDUCTING_LESSONS.length}</b> atividades concluídas <div className="conductor-total-track"><span style={{width:`${100*finished/CONDUCTING_LESSONS.length}%`}}/></div></div></div><div className="conductor-intro-art" aria-hidden="true"><StageIcon size={120}/><div className="conductor-orbit conductor-orbit-a"/><div className="conductor-orbit conductor-orbit-b"/><span>♫</span></div></section>
    <div className="conductor-path" aria-label="Trilha contínua de regência">
      {CONDUCTING_UNITS.map((unit,unitIndex)=><section className="conductor-unit" key={unit.title}><div className={`conductor-unit-header ${unit.color}`}><span className="conductor-unit-num">{unitIndex+1}</span><div><small>UNIDADE {unitIndex+1} · {unit.description}</small><h2>{unit.title}</h2></div><span aria-hidden="true">{unitIndex===0?'♩':unitIndex===1?'♪':'♫'}</span></div><div className="conductor-nodes">
        {CONDUCTING_LESSONS.filter(l=>l.unit===unitIndex).map((lesson,index)=>{
          const done=saved[lesson.id]?.passed;
          const position=index===1?'right':'left';
          const isNext=CONDUCTING_LESSONS.find(l=>!saved[l.id]?.passed)?.id===lesson.id;
          return <div className={`conductor-node-row ${position}`} key={lesson.id}><button type="button" className={`conductor-node ${done?'complete':''} ${isNext?'next':''}`} onClick={()=>setSelected(lesson)} aria-label={`${lesson.title}, ${lesson.meter}/4, ${lesson.bpm} BPM${done?', concluída':''}`}><span className="conductor-node-icon">{done?'✓':index===2?'★':'♩'}</span></button><div className="conductor-node-info"><b>{lesson.title}</b><small>{lesson.meter}/4 · {lesson.bpm} BPM {done?'· ✓ Concluída':''}</small></div></div>;
        })}</div></section>)}
    </div>
    <p className="conductor-privacy-note">A câmera é ativada apenas com sua permissão. As imagens não são gravadas nem enviadas ao servidor; somente a pontuação é salva neste perfil do navegador.</p>
  </main>;
}

function ConductorPractice({lesson,onExit,onFinish,onNext}:{lesson:ConductingLesson;onExit:()=>void;onFinish:(id:string,result:Result)=>void;onNext:()=>void}){
  const [stage,setStage]=useState<Stage>('off');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('Ative a câmera e posicione a mão diante dela.');
  const [hand,setHand]=useState<Point|null>(null);
  const [mapped,setMapped]=useState<Point|null>(null);
  const [guide,setGuide]=useState<Point>(START);
  const [origin,setOrigin]=useState<Point|null>(null);
  const [gain,setGain]=useState(.85);
  const [sensitivity,setSensitivity]=useState(1.3);
  const [bpm,setBpm]=useState(lesson.bpm);
  const [beat,setBeat]=useState(0);
  const [audioMode,setAudioMode]=useState<ConductingAudioMode>('music');
  const modeRef=useRef<ConductingAudioMode>(audioMode);modeRef.current=audioMode;
  const [metronomeWithMusic,setMetronomeWithMusic]=useState(false);
  const [ensembleStatus,setEnsembleStatus]=useState('Aguardando o gesto de entrada');
  const [dynamics,setDynamics]=useState(65);
  const [previewing,setPreviewing]=useState(false);
  const [progress,setProgress]=useState<GestureProgress>(freshGesture);
  const [result,setResult]=useState<Result|null>(null);
  const [running,setRunning]=useState(false);
  const [countIn,setCountIn]=useState(false);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const guideRef=useRef<HTMLDivElement|null>(null);
  const streamRef=useRef<MediaStream|null>(null);
  const modelRef=useRef<Model|null>(null);
  const frameRef=useRef<number|null>(null);
  const requestRef=useRef(0);
  const lastFrameRef=useRef(-1);
  const lastSampleRef=useRef(0);
  const handRef=useRef<Point|null>(null);
  const originRef=useRef<Point|null>(null);
  const gainRef=useRef(gain);gainRef.current=gain;
  const sensitivityRef=useRef(sensitivity);sensitivityRef.current=sensitivity;
  const runRef=useRef<GestureProgress>(freshGesture());
  const practiceMeasuresRef=useRef(lesson.measures);
  const exerciseAtRef=useRef<number|null>(null);
  const metroRef=useRef<Metronome|null>(null);
  const ensembleRef=useRef<ConductingEnsemble|null>(null);
  const previewRef=useRef<ConductingEnsemble|null>(null);
  const previewTimerRef=useRef<ReturnType<typeof setTimeout>|null>(null);
  const cutSinceRef=useRef<number|null>(null);
  const cutRegisteredRef=useRef(false);
  const scoreCallbackRef=useRef(onFinish);scoreCallbackRef.current=onFinish;
  const activeRef=useRef(true);
  const isRunning=useRef(false);
  const beepRef=useRef(false);

  const stopPreview=useCallback(()=>{
    if(previewTimerRef.current!==null){clearTimeout(previewTimerRef.current);previewTimerRef.current=null;}
    previewRef.current?.stop();previewRef.current=null;setPreviewing(false);
  },[]);
  const stopRun=useCallback(()=>{
    metroRef.current?.stop();metroRef.current=null;
    ensembleRef.current?.stop();ensembleRef.current=null;
    cutSinceRef.current=null;cutRegisteredRef.current=false;
    exerciseAtRef.current=null;isRunning.current=false;
    setRunning(false);setCountIn(false);setBeat(0);setGuide(START);
  },[]);
  const stopCamera=useCallback(()=>{
    ++requestRef.current;
    stopRun();stopPreview();
    if(frameRef.current!==null){cancelAnimationFrame(frameRef.current);frameRef.current=null;}
    streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null;
    if(videoRef.current){videoRef.current.pause();videoRef.current.srcObject=null;}
    try{modelRef.current?.close();}catch{/* já encerrado */}modelRef.current=null;
    handRef.current=null;originRef.current=null;setHand(null);setMapped(null);setOrigin(null);setStage('off');
  },[stopRun,stopPreview]);
  useEffect(()=>{
    activeRef.current=true;
    const handleVisibility=()=>{if(document.hidden){stopCamera();setNotice('Treino pausado. Reative a câmera para continuar.');}};
    document.addEventListener('visibilitychange',handleVisibility);
    return ()=>{
      activeRef.current=false;document.removeEventListener('visibilitychange',handleVisibility);
      ++requestRef.current;
      if(frameRef.current!==null)cancelAnimationFrame(frameRef.current);
      streamRef.current?.getTracks().forEach(track=>track.stop());
      try{modelRef.current?.close();}catch{/* já encerrado */}
      metroRef.current?.stop();
      ensembleRef.current?.stop();
      previewRef.current?.stop();
      if(previewTimerRef.current!==null)clearTimeout(previewTimerRef.current);
    };
  },[stopCamera]);

  const startCamera=async()=>{
    if(stage!=='off')return;
    setError('');setNotice('Preparando o reconhecimento da sua mão…');setStage('loading');
    const token=++requestRef.current;
    let stream:MediaStream|null=null;
    let model:Model|null=null;
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Abra o Cactom em localhost ou HTTPS para usar a câmera.');
      stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});
      if(token!==requestRef.current){stream.getTracks().forEach(t=>t.stop());return;}
      streamRef.current=stream;
      const video=videoRef.current;
      if(!video)throw new Error('Prévia da câmera não encontrada.');
      video.srcObject=stream;
      await video.play();
      const {FilesetResolver,HandLandmarker}=await import('@mediapipe/tasks-vision');
      const vision=await FilesetResolver.forVisionTasks('/mediapipe');
      const options={baseOptions:{modelAssetPath:'/mediapipe/hand_landmarker.task',delegate:'GPU' as const},runningMode:'VIDEO' as const,numHands:1,minHandDetectionConfidence:.55,minHandPresenceConfidence:.55,minTrackingConfidence:.5};
      try{model=await HandLandmarker.createFromOptions(vision,options);}
      catch{model=await HandLandmarker.createFromOptions(vision,{...options,baseOptions:{...options.baseOptions,delegate:'CPU'}});}
      if(token!==requestRef.current){model.close();return;}
      modelRef.current=model;setStage('ready');setNotice('Levante a mão até a posição inicial do desenho e toque em Calibrar.');
      lastFrameRef.current=-1;lastSampleRef.current=0;
      const frame=(time:number)=>{
        if(token!==requestRef.current||!modelRef.current)return;
        frameRef.current=requestAnimationFrame(frame);
        if(time-lastSampleRef.current<65||video.currentTime===lastFrameRef.current||!video.videoWidth)return;
        lastSampleRef.current=time;lastFrameRef.current=video.currentTime;
        if(exerciseAtRef.current!==null)setGuide(guidePosition(time,exerciseAtRef.current,lesson.meter,bpmRef.current));
        try{
          const marks=modelRef.current.detectForVideo(video,time).landmarks?.[0];
          let point:Point|null=null;
          if(!marks){handRef.current=null;setHand(null);setMapped(null);}
          else{
            // Ponto médio da palma espelhado para corresponder à imagem visível.
            const raw={x:1-(marks[0].x*.30+marks[9].x*.70),y:marks[0].y*.30+marks[9].y*.70};
            const previous=handRef.current;
            const smooth=previous?{x:previous.x*.58+raw.x*.42,y:previous.y*.58+raw.y*.42}:raw;
            handRef.current=smooth;setHand(smooth);
            if(originRef.current){point=mapHand(smooth,originRef.current,gainRef.current);setMapped(point);}
          }
          const startAt=exerciseAtRef.current;
          if(startAt===null)return;
          if(time<startAt){
            setCountIn(true);
            // Guardar o início do movimento na preparação do primeiro tempo.
            // Sem isso, a avaliação só enxergaria a parte final do gesto inicial.
            const windowMs=60000/bpmRef.current*.6;
            if(point&&time>=startAt-windowMs){
              const samples=runRef.current.samples.filter(s=>time-s.at<=windowMs);
              runRef.current={...runRef.current,samples:[...samples,{at:time,point}]};
            }
            return;
          }
          if(beepRef.current){beepRef.current=false;setCountIn(false);}
          if(modeRef.current==='orchestra'&&point){
            // A dimensão do gesto controla a intensidade sonora com suavização.
            const spread=Math.hypot(point.x-START.x,point.y-START.y);
            const dynamicLevel=Math.round(100*Math.max(.34,Math.min(1,.34+spread/290)));
            ensembleRef.current?.setIntensity(dynamicLevel/100);
            setDynamics(dynamicLevel);
            // Corte explícito: manter a mão por 1 s no canto superior direito,
            // afastado dos quatro pontos convencionais da regência.
            if(point.x>=338&&point.y<=133){
              cutSinceRef.current??=time;
              if(time-cutSinceRef.current>=1000&&!cutRegisteredRef.current){
                cutRegisteredRef.current=true;
                ensembleRef.current?.setEntered(false);
                setEnsembleStatus('Corte realizado · faça o tempo 1 para reentrar');
              }
            }else{cutSinceRef.current=null;cutRegisteredRef.current=false;}
          }else{cutSinceRef.current=null;cutRegisteredRef.current=false;}
          const before=runRef.current;
          const next=advanceConducting(before,point,time,startAt,lesson.meter,bpmRef.current,practiceMeasuresRef.current,sensitivityRef.current);
          runRef.current=next;
          if(next.next!==before.next){
            setProgress(next);
            if(modeRef.current==='orchestra'){
              if(next.hits>before.hits&&next.downbeats>before.downbeats){
                ensembleRef.current?.setEntered(true);
                setEnsembleStatus('Orquestra tocando · conduza os músicos!');
              }else if(next.misses>before.misses&&next.recorded.length-next.recorded.lastIndexOf(true)-1>=2&&ensembleRef.current?.isEntered){
                ensembleRef.current?.setEntered(false);
                setEnsembleStatus('Orquestra aguardando um tempo 1 correto');
              }
            }
            if(next.hits>before.hits&&!next.finished){
              const recognized=(next.next-1)%lesson.meter+1;
              setNotice(`✓ Tempo ${recognized} reconhecido! Continue regendo naturalmente.`);
            }
            if(next.finished){
              const outcome=scoreGesture(next,lesson.meter,practiceMeasuresRef.current);
              setResult(outcome);scoreCallbackRef.current(lesson.id,outcome);stopRun();
              setNotice(outcome.passed?'Bravo! Você concluiu a atividade de regência.':'Bom treino! Refaça para melhorar direção e ritmo.');
            }
          }
        }catch{setNotice('Não consegui analisar um quadro. Reposicione a mão com boa iluminação.');}
      };
      frameRef.current=requestAnimationFrame(frame);
    }catch(e){
      if(token!==requestRef.current)return;
      stream?.getTracks().forEach(t=>t.stop());try{model?.close();}catch{/* ignora */}
      setError(e instanceof Error?e.message:'Não foi possível iniciar a câmera.');
      stopCamera();
    }
  };
  const bpmRef=useRef(bpm);bpmRef.current=bpm;
  const calibrate=()=>{
    const current=handRef.current;
    if(!current){setNotice('Mostre sua mão inteira para a câmera antes de calibrar.');return;}
    originRef.current={...current};setOrigin({...current});setMapped({...START});
    setResult(null);setProgress(freshGesture());runRef.current=freshGesture();
    stopRun();setNotice('Calibrado! Reja naturalmente: o Cactom aceita variações de amplitude e reconhece a direção de cada tempo.');
  };
  const startExercise=async()=>{
    if(!originRef.current||stage!=='ready'||isRunning.current)return;
    setError('');setResult(null);runRef.current=freshGesture();setProgress(freshGesture());
    stopPreview();
    practiceMeasuresRef.current=audioMode==='orchestra'?Math.max(8,lesson.measures):audioMode==='music'?Math.max(4,lesson.measures):lesson.measures;
    const metro=new Metronome();metroRef.current=metro;
    metro.setClickAfterCountIn(audioMode==='gesture'||metronomeWithMusic);
    setEnsembleStatus('Aguardando o gesto de entrada');setDynamics(65);
    isRunning.current=true;setRunning(true);setCountIn(true);beepRef.current=true;
    if(window.innerWidth<=720)guideRef.current?.scrollIntoView({behavior:'smooth',block:'center'});
    try{
      await metro.start(bpm,setBeat,lesson.meter);
      if(metroRef.current!==metro){metro.stop();return;}
      const startAt=metro.nextExerciseBarStartMs();
      if(startAt===null)throw new Error('Não foi possível sincronizar o metrônomo.');
      exerciseAtRef.current=startAt;
      if(audioMode!=='gesture'){
        const ensemble=new ConductingEnsemble();ensembleRef.current=ensemble;
        await ensemble.start({bpm,meter:lesson.meter,startAtMs:startAt,mode:audioMode});
        if(metroRef.current!==metro){ensemble.stop();return;}
      }
      setNotice(audioMode==='orchestra'
        ?`Escute ${lesson.meter} tempos de preparação. Faça o tempo 1 corretamente para dar entrada à orquestra.`
        :audioMode==='music'?`Após os ${lesson.meter} tempos de preparação, reja a peça ${ARRANGEMENTS[lesson.meter].title}.`
        :`Ouça ${lesson.meter} tempos de preparação e reja com o metrônomo.`);
    }catch(e){stopRun();setError(e instanceof Error?e.message:'Não foi possível iniciar o metrônomo.');}
  };
  const previewMusic=async()=>{
    if(previewRef.current){stopPreview();return;}
    setError('');
    const ensemble=new ConductingEnsemble();previewRef.current=ensemble;setPreviewing(true);
    try{
      const duration=lesson.meter*2*60000/bpm;
      await ensemble.start({bpm,meter:lesson.meter,startAtMs:performance.now()+180,mode:'music'});
      if(previewRef.current!==ensemble){ensemble.stop();return;}
      previewTimerRef.current=setTimeout(()=>stopPreview(),duration+350);
    }catch(e){stopPreview();setError(e instanceof Error?e.message:'Não foi possível tocar a prévia.');}
  };
  const step=progress.next%lesson.meter;
  const targets=BEAT_POINTS[lesson.meter];
  const route=[START,...targets,START].map(p=>`${p.x},${p.y}`).join(' ');
  const finalScore=progress.hits+progress.misses;
  const practiceTotal=(audioMode==='orchestra'?Math.max(8,lesson.measures):audioMode==='music'?Math.max(4,lesson.measures):lesson.measures)*lesson.meter;
  return <main className="conductor-session">
    <header className="conductor-session-bar"><button type="button" className="conductor-back" onClick={()=>{stopCamera();onExit();}}>← Voltar à trilha</button><div className="conductor-session-progress"><b>{lesson.title}</b><div><span style={{width:`${100*finalScore/practiceTotal}%`}}/></div></div><b className="conductor-time">{lesson.meter}/4</b></header>
    <section className="conductor-session-title"><span className="conductor-eyebrow">REGÊNCIA COM CÂMERA · {lesson.bpm} BPM SUGERIDOS</span><h1>Seu gesto faz a música acontecer.</h1><p>{lesson.description} Escolha entre metrônomo, peça instrumental ou orquestra interativa e conduza com a mão diante da câmera.</p></section>
    <section className="conductor-music-studio" aria-label="Escolha como praticar regência">
      <div className="conductor-music-heading"><div><span className="conductor-eyebrow">ESTÚDIO DO MAESTRO · 3 ETAPAS</span><h2>Como você quer reger hoje?</h2></div><button className="conductor-preview" type="button" disabled={running} onClick={()=>void previewMusic()}>{previewing?'■ Parar prévia':'♫ Ouvir a peça'}</button></div>
      <div className="conductor-mode-options" role="group" aria-label="Modo de acompanhamento">
        <button type="button" className={`conductor-mode ${audioMode==='gesture'?'selected':''}`} aria-pressed={audioMode==='gesture'} disabled={running} onClick={()=>{stopPreview();setAudioMode('gesture');}}><span>01 · GESTO</span><b>🎵 Metrônomo</b><small>Aprenda o desenho e mantenha o pulso.</small></button>
        <button type="button" className={`conductor-mode ${audioMode==='music'?'selected':''}`} aria-pressed={audioMode==='music'} disabled={running} onClick={()=>{stopPreview();setAudioMode('music');}}><span>02 · MÚSICA</span><b>🎶 Peça instrumental</b><small>Reja a melodia, os acordes e o baixo.</small></button>
        <button type="button" className={`conductor-mode ${audioMode==='orchestra'?'selected':''}`} aria-pressed={audioMode==='orchestra'} disabled={running} onClick={()=>{stopPreview();setAudioMode('orchestra');}}><span>03 · INTERATIVO</span><b>🎻 Orquestra virtual</b><small>Sua entrada, corte e amplitude influenciam o som.</small></button>
      </div>
      {audioMode!=='gesture'&&<div className="conductor-piece-info"><div className="conductor-piece-icon">♪</div><div><b>{ARRANGEMENTS[lesson.meter].title}</b><span>{ARRANGEMENTS[lesson.meter].character} · Arranjo original do Cactom · {lesson.meter}/4</span></div><label className="conductor-metronome-switch"><input type="checkbox" checked={metronomeWithMusic} onChange={e=>setMetronomeWithMusic(e.target.checked)} disabled={running}/> Cliques após a preparação</label></div>}
      {audioMode==='orchestra'&&<div className="conductor-orchestra-console" aria-live="polite"><div className="conductor-concert-state"><span className={`conductor-state-dot ${running&&ensembleStatus.startsWith('Orquestra tocando')?'playing':''}`}/><div><b>{running?ensembleStatus:'Orquestra aguardando sua entrada'}</b><small>Treino de 8 compassos · Movimento para baixo no tempo 1 = entrada · 2 tempos perdidos = pausa · mão no alto à direita por 1 s = corte</small></div></div><div className="conductor-dynamic"><span>Dinâmica ao vivo</span><div><span style={{width:`${dynamics}%`}}/></div><b>{dynamics}%</b></div></div>}
    </section>
    <div className="conductor-stage-grid">
      <section className="conductor-camera-panel"><div className="conductor-panel-heading"><strong>01. Sua mão na câmera</strong><span className={`conductor-live ${stage==='ready'?'on':''}`}>{stage==='ready'?'● AO VIVO':stage==='loading'?'PREPARANDO…':'DESLIGADA'}</span></div>
        <div className="conductor-video-box"><video ref={videoRef} muted playsInline autoPlay aria-label="Imagem da câmera para acompanhar a mão do aluno"/>{stage!=='ready'&&<div className="conductor-camera-placeholder"><span>📷</span><b>Você é o maestro!</b><small>O vídeo ficará aqui quando ativar a câmera.</small></div>}{hand&&<span className="conductor-hand-marker" style={{left:`${hand.x*100}%`,top:`${hand.y*100}%`}} aria-hidden="true"/>}</div>
        <div className="conductor-camera-commands"><button className={stage==='ready'?'conductor-button outline':'conductor-button'} type="button" disabled={stage==='loading'} onClick={()=>stage==='off'?void startCamera():stopCamera()}>{stage==='off'?'📷 Ativar câmera':stage==='loading'?'Abrindo câmera…':'Desligar câmera'}</button><button className="conductor-button outline" type="button" disabled={stage!=='ready'||!hand} onClick={calibrate}>◎ Calibrar</button></div>
        <p className={`conductor-detection ${hand?'detected':''}`}>{stage==='ready'?(hand?'✓ Mão reconhecida':'Procure manter a mão no quadro'):'Use a câmera frontal do celular ou a webcam do notebook.'}</p>
        <div className="conductor-settings"><label>Ampliação do gesto <b>{Math.round(gain*100)}%</b><input type="range" min="0.55" max="1.3" step="0.05" value={gain} onChange={e=>setGain(Number(e.target.value))} disabled={running}/></label><label>Área de reconhecimento <b>{sensitivity>=1.2?'Ampla':'Moderada'} ({Math.round(sensitivity*100)}%)</b><input type="range" min="0.9" max="1.65" step="0.05" value={sensitivity} onChange={e=>setSensitivity(Number(e.target.value))} disabled={running}/></label><p className="conductor-gesture-help">Não precisa acertar as bolinhas: faça o padrão com naturalidade. O Cactom avalia direção, ordem dos tempos e pulso.</p></div>
      </section>
      <section className="conductor-guide-panel"><div className="conductor-panel-heading"><strong>02. Siga o desenho</strong><span>{lesson.meter}/4 · {bpm} BPM</span></div>
        <div className="conductor-gesture-stage" ref={guideRef}><svg viewBox="0 0 400 340" role="img" aria-label={`Traçado orientador de regência em ${lesson.meter} por 4, do tempo 1 ao ${lesson.meter}`}>
          <defs><linearGradient id="conduct-line" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#219c69"/><stop offset="1" stopColor="#4A84C3"/></linearGradient></defs>
          <path d="M200 65 L200 276" stroke="#a1d9c7" strokeDasharray="6 9" strokeWidth="2" opacity=".65"/>
          <polyline points={route} stroke="url(#conduct-line)" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity=".20"/>
          <polyline points={route} stroke="#2c5163" strokeWidth="3.2" strokeDasharray="8 11" strokeLinejoin="round" strokeLinecap="round" fill="none" opacity=".50"/>
          <circle cx={START.x} cy={START.y} r="11" fill="#d9efe7" stroke="#55a78d" strokeWidth="2"/>
          {targets.map((target,index)=><g key={index}><circle cx={target.x} cy={target.y} r={step===index&&running?26:22} fill={step===index&&running?'#f5a528':'#fff'} stroke={step===index&&running?'#e19a1e':'#bdd7d1'} strokeWidth="3"/><text x={target.x} y={target.y+7} fill={step===index&&running?'#fff':'#2c5163'} textAnchor="middle" fontWeight="900" fontSize="20">{index+1}</text></g>)}
          {running&&<g><circle cx={guide.x} cy={guide.y} r="23" fill="#55a3ed" opacity=".13"/><circle cx={guide.x} cy={guide.y} r="10" fill="#55a3ed" stroke="#fff" strokeWidth="3"/><circle cx={guide.x} cy={guide.y} r="3" fill="white"/></g>}
          {mapped&&<g><circle cx={mapped.x} cy={mapped.y} r="20" fill="#f5a528" opacity=".15"/><circle cx={mapped.x} cy={mapped.y} r="8" fill="#f5a528" stroke="#fff" strokeWidth="3"/></g>}
        </svg>
          <div className="conductor-current-beat"><span>{countIn?'PREPARAÇÃO':running?'TEMPO ATUAL':result?'EXERCÍCIO CONCLUÍDO':'PRONTO PARA REGER'}</span><strong>{running?beat||'·':result?result.precision+'%':lesson.meter+'/4'}</strong><small>{countIn?'Escute o metrônomo':running?'Conduza o movimento no pulso':origin?'Sua mão já está calibrada':'Calibre a mão na posição superior'}</small></div>
        </div>
        <div className="conductor-guide-actions"><label>Andamento <strong>{bpm} BPM</strong><input type="range" min="45" max="120" step="1" value={bpm} disabled={running} onChange={e=>setBpm(Number(e.target.value))}/></label><button className="conductor-button primary" type="button" disabled={stage!=='ready'||!origin||running} onClick={()=>void startExercise()}>{running?'♫ Regendo…':result?'↻ Tentar novamente':'▶ Começar regência'}</button>{running&&<button className="conductor-button outline" type="button" onClick={()=>{stopRun();setNotice('Exercício pausado. Você pode começar novamente.');}}>Parar treino</button>}</div>
      </section>
    </div>
    {error&&<p className="conductor-alert" role="alert">{error}</p>}
    <p className="conductor-notice" role="status">{notice}</p>
    {result?<section className="conductor-result"><span className="conductor-result-emoji" aria-hidden="true">{result.passed?'🏆':'🎯'}</span><div><span className="conductor-eyebrow">RESULTADO DO TREINO</span><h2>{result.passed?'Muito bem, maestro!':'Você está evoluindo!'}</h2><p>Direção e sequência do gesto: <strong>{result.precision}% dos tempos reconhecidos</strong>. Regularidade nos acertos: {result.rhythm}%. {result.passed?'Sua conquista foi salva.':'Experimente um gesto claro, na direção indicada e próximo ao pulso.'}</p><div className="conductor-result-stars">{'★'.repeat(result.stars)}{'☆'.repeat(3-result.stars)}</div></div><div className="conductor-result-actions"><button className="conductor-button outline" type="button" onClick={()=>{setResult(null);setNotice('Pratique novamente quando estiver pronto.');}}>Praticar de novo</button>{result.passed&&<button className="conductor-button primary" type="button" onClick={()=>{stopCamera();onNext();}}>Próxima atividade →</button>}</div></section>:null}
    <p className="conductor-privacy-note">Vídeo analisado no próprio navegador. Não gravamos nem enviamos imagens. As músicas são sintetizadas localmente, sem arquivos de terceiros. A orquestra virtual reage a entrada, corte e amplitude; nesta versão o andamento é fixado pelo BPM. O rastreamento depende da luz e da posição da mão e não substitui avaliação presencial da técnica.</p>
  </main>;
}
