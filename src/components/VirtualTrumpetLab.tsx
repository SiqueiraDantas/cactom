import { useCallback, useEffect, useRef, useState } from 'react';
import { BEGINNER_NOTES, targetFrequencyFor, type PracticeNote } from '../lib/music';
import { VirtualTrumpetAudio } from '../lib/virtualAudio';
import {
  HAND_CONNECTIONS, VIRTUAL_STEPS, advanceGesture, advanceVirtualProgress,
  anglesToValves, freshVirtualProgress, initialGesture, visibleHandAngles, smoothAngles,
  sameValves, validCalibration,
  type FingerAngles, type GestureState, type Landmark, type ValveCalibration, type VirtualProgress
} from '../lib/virtualTrumpet';
import '../virtual.css';
import { useProfileStorage } from './ProfileStorage';
import type { ProfileStorage } from '../lib/profileStorage';
import { ActivityCoach } from './ActivityExperience';
import { markPracticeDay } from '../lib/practiceDay';

type Model = import('@mediapipe/tasks-vision').HandLandmarker;
type Mode='camera'|'touch';
type Phase='off'|'starting'|'active';
type LocalProgress={camera:string[];touch:string[]};
const STORAGE='mis-music-lab-v06-virtual';
const MODELS='/mediapipe/hand_landmarker.task';
const WASM='/mediapipe';
const defaultProgress:LocalProgress={camera:[],touch:[]};
function getProgress(storage:ProfileStorage):LocalProgress{
  try{const data=JSON.parse(storage.getItem(STORAGE)||'null') as Partial<LocalProgress> | null;
    return {camera:Array.isArray(data?.camera)?data.camera.filter((x):x is string=>typeof x==='string'):[],touch:Array.isArray(data?.touch)?data.touch.filter((x):x is string=>typeof x==='string'):[]};
  }catch{return defaultProgress;}
}
const fingers=['Indicador','Médio','Anelar'];
function ValveKeys({valves,onToggle,interactive=true}: {valves:readonly number[];onToggle?:(value:number)=>void;interactive?:boolean}) {
  return <div className="virtual-valves" role="group" aria-label="Três pistos do trompete">
    {[1,2,3].map((valve)=><button key={valve} type="button" className={`virtual-valve ${valves.includes(valve)?'pressed':''}`} disabled={!interactive} aria-pressed={valves.includes(valve)} aria-label={`Pisto ${valve} — ${fingers[valve-1]}`} onClick={()=>onToggle?.(valve)}>
      <span className="virtual-valve-cap"/><span className="virtual-valve-shaft"/><b>{valve}</b><small>{fingers[valve-1]}</small>
    </button>)}
  </div>;
}
function drawHand(canvas:HTMLCanvasElement, video:HTMLVideoElement, landmarks:readonly Landmark[] | null):void{
  const w=video.videoWidth,h=video.videoHeight;if(!w||!h)return;
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.clearRect(0,0,w,h);if(!landmarks)return;
  ctx.lineWidth=Math.max(2,w/180);ctx.strokeStyle='rgba(245,165,40,.88)';
  for(const [a,b] of HAND_CONNECTIONS){ctx.beginPath();ctx.moveTo(landmarks[a].x*w,landmarks[a].y*h);ctx.lineTo(landmarks[b].x*w,landmarks[b].y*h);ctx.stroke();}
  landmarks.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x*w,p.y*h,[8,12,16].includes(i)?Math.max(5,w/70):Math.max(3,w/125),0,Math.PI*2);ctx.fillStyle=[8,12,16].includes(i)?'#f5a528':'#4a84c3';ctx.fill();});
}
function firstIncomplete(done:readonly string[]):number{
  const index=VIRTUAL_STEPS.findIndex(s=>!done.includes(s.id));return index<0?VIRTUAL_STEPS.length:index;
}
function frequencyLabel(note:PracticeNote):string{return `${Math.round(targetFrequencyFor(note))} Hz (som real)`;}

export function VirtualTrumpetLab(){
  const storage=useProfileStorage();
  const [mode,setMode]=useState<Mode>('camera');
  const [phase,setPhase]=useState<Phase>('off');
  const [error,setError]=useState('');
  const [seenHand,setSeenHand]=useState(false);
  const [liveValves,setLiveValves]=useState<number[]|null>(null);
  const [angles,setAngles]=useState<FingerAngles|null>(null);
  const [calibration,setCalibration]=useState<ValveCalibration|null>(null);
  const [calOpen,setCalOpen]=useState<FingerAngles|null>(null);
  const [section,setSection]=useState<'practice'|'explore'>('practice');
  const [exploreNote,setExploreNote]=useState('G4');
  const [touchValves,setTouchValves]=useState<number[]>([]);
  const [saved,setSaved]=useState<LocalProgress>(()=>getProgress(storage));
  const [stepIndex,setStepIndex]=useState(()=>firstIncomplete(getProgress(storage).camera));
  const [meter,setMeter]=useState(0);
  const [notice,setNotice]=useState('Mostre uma mão aberta, com a palma voltada para a câmera.');
  const [celebrate,setCelebrate]=useState(false);
  const [sensitivity,setSensitivity]=useState(0);
  const [volume,setVolume]=useState(65);
  const sensitivityRef=useRef(0);sensitivityRef.current=sensitivity;
  const smoothed=useRef<FingerAngles|null>(null);
  const angleHistory=useRef<FingerAngles[]>([]);
  const referenceTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const savedRef=useRef(saved);savedRef.current=saved;
  const video=useRef<HTMLVideoElement|null>(null);
  const canvas=useRef<HTMLCanvasElement|null>(null);
  const stream=useRef<MediaStream|null>(null);
  const model=useRef<Model|null>(null);
  const raf=useRef<number|null>(null);
  const session=useRef(0);
  const latestAngles=useRef<FingerAngles|null>(null);
  const lastFrame=useRef(0);
  const gesture=useRef<GestureState>(initialGesture());
  const previousValveSet=useRef<number[]>([]);
  const progress=useRef<VirtualProgress>(freshVirtualProgress());
  const stepRef=useRef(stepIndex);
  const modeRef=useRef<Mode>(mode);
  const sectionRef=useRef(section);
  const exploreRef=useRef(exploreNote);
  const calRef=useRef(calibration);
  const lock=useRef(false);
  const passingTimeout=useRef<ReturnType<typeof setTimeout>|null>(null);
  const audio=useRef(new VirtualTrumpetAudio());
  const latestControl=useRef<(valves:number[]|null,now:number)=>void>(()=>{});
  stepRef.current=stepIndex;modeRef.current=mode;sectionRef.current=section;exploreRef.current=exploreNote;calRef.current=calibration;
  const current=VIRTUAL_STEPS[stepIndex];
  const done=saved[mode];
  const completed=stepIndex>=VIRTUAL_STEPS.length;
  const focusedNote=section==='explore'?BEGINNER_NOTES.find(n=>n.id===exploreNote)!:current?.note;
  const matches=liveValves!==null&&focusedNote&&sameValves(liveValves,focusedNote.valves);

  useEffect(()=>{try{storage.setItem(STORAGE,JSON.stringify(saved));}catch{/* armazenamento indisponível */}},[saved,storage]);

  const stopCamera=useCallback(()=>{
    session.current+=1;
    if(passingTimeout.current){clearTimeout(passingTimeout.current);passingTimeout.current=null;}
    if(referenceTimer.current){clearTimeout(referenceTimer.current);referenceTimer.current=null;}
    lock.current=false;progress.current=freshVirtualProgress();setMeter(0);setCelebrate(false);
    const resumeIndex=firstIncomplete(savedRef.current[modeRef.current]);stepRef.current=resumeIndex;setStepIndex(resumeIndex);
    smoothed.current=null;angleHistory.current=[];calRef.current=null;setCalibration(null);setCalOpen(null);
    if(raf.current!==null){cancelAnimationFrame(raf.current);raf.current=null;}
    stream.current?.getTracks().forEach(track=>track.stop());stream.current=null;
    if(video.current){video.current.pause();video.current.srcObject=null;}
    try{model.current?.close();}catch{/* já encerrado */}model.current=null;
    latestAngles.current=null;previousValveSet.current=[];gesture.current=initialGesture();
    setSeenHand(false);setLiveValves(null);setAngles(null);setPhase('off');
    audio.current.playWritten(null);
  },[]);
  useEffect(()=>()=>{
    session.current+=1;if(raf.current!==null)cancelAnimationFrame(raf.current);
    if(passingTimeout.current)clearTimeout(passingTimeout.current);
    if(referenceTimer.current)clearTimeout(referenceTimer.current);
    stream.current?.getTracks().forEach(t=>t.stop());
    try{model.current?.close();}catch{/* fechando */}
    void audio.current.close();
  },[]);

  useEffect(()=>{
    const pause=()=>{if(document.hidden){stopCamera();audio.current.playWritten(null);setNotice('Treino pausado ao sair da tela. Reative e calibre para continuar.');}};
    document.addEventListener('visibilitychange',pause);
    return ()=>document.removeEventListener('visibilitychange',pause);
  },[stopCamera]);

  const processValves=useCallback((valves:number[]|null,now:number)=>{
    if(modeRef.current==='camera'&&!calRef.current)valves=null;
    setLiveValves(valves);
    if(lock.current){audio.current.playWritten(null);return;}
    const choice=sectionRef.current==='explore'
      ? BEGINNER_NOTES.find(n=>n.id===exploreRef.current)
      : VIRTUAL_STEPS[stepRef.current]?.note;
    const good=valves!==null&&choice&&sameValves(valves,choice.valves);
    audio.current.playWritten(good?choice!.writtenMidi:null);
    if(sectionRef.current==='explore'||lock.current||stepRef.current>=VIRTUAL_STEPS.length)return;
    const currentStep=VIRTUAL_STEPS[stepRef.current];
    const previousStep=VIRTUAL_STEPS[stepRef.current-1];
    const needsReset=Boolean(previousStep&&sameValves(previousStep.note.valves,currentStep.note.valves));
    const next=advanceVirtualProgress(progress.current,valves,currentStep.note.valves,now,currentStep.targetMs,needsReset);
    progress.current=next;
    setMeter(next.matchedSince===null?0:Math.min(100,(now-next.matchedSince)/currentStep.targetMs*100));
    if(!next.completed)return;
    markPracticeDay(storage);lock.current=true;audio.current.playWritten(null);audio.current.success();
    setCelebrate(true);setMeter(100);
    setNotice(`✓ ${currentStep.note.label}: digitação mantida corretamente!`);
    setSaved(old=>({...old,[modeRef.current]:old[modeRef.current].includes(currentStep.id)?old[modeRef.current]:[...old[modeRef.current],currentStep.id]}));
    passingTimeout.current=setTimeout(()=>{
      const nextIndex=stepRef.current+1;stepRef.current=nextIndex;setStepIndex(nextIndex);
      progress.current={...freshVirtualProgress(),readyForDifferentPose:!needsResetForNext(nextIndex)};
      setMeter(0);setCelebrate(false);
      setNotice(nextIndex>=VIRTUAL_STEPS.length?'Parabéns! Todas as digitações foram concluídas.':'Faça a nova combinação e mantenha os dedos por alguns instantes.');
      lock.current=false;
    },900);
  },[]);
  latestControl.current=processValves;
  function needsResetForNext(nextIndex:number):boolean{
    return nextIndex>0&&nextIndex<VIRTUAL_STEPS.length&&sameValves(VIRTUAL_STEPS[nextIndex-1].note.valves,VIRTUAL_STEPS[nextIndex].note.valves);
  }

  const startCamera=useCallback(async()=>{
    if(phase!=='off')return;
    const token=++session.current;
    setError('');setNotice('Carregando o reconhecimento da mão…');setPhase('starting');
    try{
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('A câmera precisa de HTTPS ou localhost e de um navegador compatível.');
      void audio.current.enable().catch(()=>{});
      const camera=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:'user',width:{ideal:640},height:{ideal:480},frameRate:{ideal:24,max:30}}});
      if(token!==session.current){camera.getTracks().forEach(t=>t.stop());return;}
      stream.current=camera;
      const element=video.current;if(!element)throw new Error('Elemento de vídeo não disponível.');
      element.srcObject=camera;await element.play();
      if(token!==session.current)return;
      const { FilesetResolver, HandLandmarker }=await import('@mediapipe/tasks-vision');
      const vision=await FilesetResolver.forVisionTasks(WASM);
      let landmarker:Model;
      try{
        landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:MODELS,delegate:'GPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.6,minHandPresenceConfidence:.6,minTrackingConfidence:.5});
      }catch{
        landmarker=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath:MODELS,delegate:'CPU'},runningMode:'VIDEO',numHands:1,minHandDetectionConfidence:.6,minHandPresenceConfidence:.6,minTrackingConfidence:.5});
      }
      if(token!==session.current){landmarker.close();return;}
      model.current=landmarker;setPhase('active');setNotice('Mantenha a mão inteira dentro do quadro; depois calibre os dedos.');
      let videoTime=-1;
      const tick=(now:number)=>{
        if(token!==session.current||!model.current)return;
        raf.current=requestAnimationFrame(tick);
        if(now-lastFrame.current<70||!element.videoWidth||element.currentTime===videoTime)return;
        lastFrame.current=now;videoTime=element.currentTime;
        try{
          const result=model.current.detectForVideo(element,now);
          const points=result.landmarks?.[0] as Landmark[]|undefined;
          drawHand(canvas.current!,element,points??null);
          const raw=points?visibleHandAngles(points):null;
          const values=smoothAngles(smoothed.current,raw);smoothed.current=values;
          angleHistory.current=raw?[...angleHistory.current,raw].slice(-15):[];
          latestAngles.current=values;setAngles(values);setSeenHand(Boolean(values));
          const candidate=values?anglesToValves(values,calRef.current,previousValveSet.current,sensitivityRef.current):null;
          gesture.current=advanceGesture(gesture.current,candidate,now);
          if(gesture.current.stable===null){previousValveSet.current=[];latestControl.current(null,now);return;}
          const selected=gesture.current.stable.split('-').filter(Boolean).map(Number);
          previousValveSet.current=selected;
          latestControl.current(selected,now);
        }catch{smoothed.current=null;angleHistory.current=[];gesture.current=initialGesture();latestControl.current(null,now);setNotice('Não foi possível analisar este quadro. Reposicione a mão.');}
      };
      raf.current=requestAnimationFrame(tick);
    }catch(e){
      if(token!==session.current)return;
      setError(e instanceof Error?e.message:'Não foi possível ativar a câmera.');
      stopCamera();
    }
  },[phase,stopCamera]);

  const selectMode=(next:Mode)=>{
    if(next===mode)return;
    stopCamera();if(passingTimeout.current)clearTimeout(passingTimeout.current);
    lock.current=false;progress.current=freshVirtualProgress();gesture.current=initialGesture();
    setMode(next);modeRef.current=next;setMeter(0);setCelebrate(false);
    const ix=firstIncomplete(saved[next]);stepRef.current=ix;setStepIndex(ix);setLiveValves(null);
    setNotice(next==='camera'?'Ative a webcam para reconhecer os pistos.':'Toque nos pistos virtuais para experimentar as combinações.');
  };
  const touchToggle=(number:number)=>{
    void audio.current.enable().catch(()=>{});
    setTouchValves(prev=>prev.includes(number)?prev.filter(x=>x!==number):[...prev,number]);
  };
  useEffect(()=>{
    if(mode!=='touch')return;
    const tick=()=>latestControl.current(document.hidden?null:touchValves,performance.now());
    tick();const interval=setInterval(tick,80);return ()=>{clearInterval(interval);audio.current.playWritten(null);};
  },[mode,touchValves]);
  const captureCalibration=(part:'open'|'closed')=>{
    const frames=angleHistory.current;
    if(frames.length<8){setNotice('Mantenha a mão inteira e a posição parada por um segundo antes de registrar.');return;}
    if([0,1,2].some(i=>Math.max(...frames.map(f=>f[i]))-Math.min(...frames.map(f=>f[i]))>15)){setNotice('A posição está variando. Relaxe a mão, mantenha os dedos parados e tente novamente.');return;}
    const values=[0,1,2].map(i=>frames.reduce((sum,f)=>sum+f[i],0)/frames.length) as FingerAngles;
    if(part==='open'){setCalOpen([...values] as FingerAngles);setCalibration(null);calRef.current=null;setNotice('Dedos soltos registrados! Agora dobre os três dedos e toque em “Registrar pressionados”.');return;}
    if(!calOpen){setNotice('Registre primeiro a posição com os dedos soltos.');return;}
    const candidate:ValveCalibration={open:calOpen,closed:[...values] as FingerAngles};
    if(!validCalibration(candidate)){setNotice('Calibração insuficiente: dobre mais os dedos ou aproxime a mão, com a palma visível.');return;}
    calRef.current=candidate;setCalibration(candidate);setNotice('Calibração concluída! Agora pratique as digitações da sequência.');
  };
  const changeSection=(newSection:'practice'|'explore')=>{
    if(passingTimeout.current)clearTimeout(passingTimeout.current);
    lock.current=false;progress.current=freshVirtualProgress();setMeter(0);setCelebrate(false);
    setSection(newSection);sectionRef.current=newSection;audio.current.playWritten(null);
  };
  const reset=()=>{
    if(passingTimeout.current)clearTimeout(passingTimeout.current);
    lock.current=false;progress.current=freshVirtualProgress();setMeter(0);setCelebrate(false);
    stepRef.current=0;setStepIndex(0);setSaved(old=>({...old,[mode]:[]}));
    setNotice('Treino reiniciado. Comece pela primeira nota.');
  };
  const hearReference=async()=>{
    const target=focusedNote;if(!target)return;
    try{await audio.current.enable();audio.current.playWritten(target.writtenMidi);
      if(referenceTimer.current)clearTimeout(referenceTimer.current);
      referenceTimer.current=setTimeout(()=>audio.current.playWritten(null),700);
    }catch{setNotice('Toque novamente para liberar o som do navegador.');}
  };
  return <main className="virtual-shell">
    <section className="virtual-hero glass-panel">
      <div><span className="eyebrow">MÚSICA NA PONTA DOS DEDOS</span><h1>Seu trompete, <span>do seu jeito.</span></h1><p>Descubra as posições, experimente os sons e conquiste uma nota de cada vez.</p><div className="virtual-hero-tags"><span>✦ Treino de digitação</span><span>✦ No seu ritmo</span><span>✦ Trompete em Si♭</span></div></div>
      <div className="virtual-hero-decoration" aria-hidden="true">♬</div>
    </section>
    <ActivityCoach hint={mode==='camera'?'Mostre sua mão e faça a calibração antes de começar.':'Esta demonstração usa o toque. O treino por câmera fica salvo separadamente.'}>{mode==='camera'?'Sua mão vira parte da música. Bora tentar?':'Toque nos pistos e descubra cada combinação!'}</ActivityCoach>
    <details className="virtual-settings"><summary>Ajustes do treino</summary><label>Volume do som guia <b>{volume}%</b><input aria-label="Volume do trompete virtual" type="range" min="0" max="100" value={volume} onChange={e=>{const value=Number(e.target.value);setVolume(value);audio.current.setVolume(value/100);}}/></label><label>Sensibilidade dos dedos <b>{sensitivity>0?'+':''}{sensitivity}</b><input aria-label="Sensibilidade dos dedos" type="range" min="-15" max="15" value={sensitivity} onChange={e=>{setSensitivity(Number(e.target.value));progress.current=freshVirtualProgress();setMeter(0);}}/></label><p>Valores maiores acionam os pistos com menos flexão. Calibre novamente se mudar a posição da mão.</p></details>
    <div className="virtual-mode-row glass-panel"><div><b>Como deseja treinar?</b><small>O modo de toque também funciona sem câmera, mas não valida o movimento da mão.</small></div><div className="virtual-toggle" role="group" aria-label="Modo do trompete virtual"><button className={mode==='camera'?'active':''} onClick={()=>selectMode('camera')} type="button">📷 Câmera</button><button className={mode==='touch'?'active':''} onClick={()=>selectMode('touch')} type="button">👆 Pistos na tela</button></div></div>
    <div className="virtual-layout">
      <section className="virtual-capture glass-panel"><div className="virtual-section-head"><div><span className="eyebrow">{mode==='camera'?'CÂMERA DO SEU TREINO':'PRATIQUE COM OS DEDOS'}</span><h2>{mode==='camera'?'Sua mão é o instrumento':'Toque nos três pistos'}</h2></div><span className={`virtual-status ${phase==='active'?'is-live':''}`}>{mode==='touch'?'MODO DEMONSTRAÇÃO':phase==='active'?'● CÂMERA ATIVA':phase==='starting'?'INICIANDO…':'CÂMERA DESLIGADA'}</span></div>
        {mode==='camera'?<>
          <div className="camera-frame"><video ref={video} autoPlay muted playsInline aria-label="Imagem da câmera usada para rastrear a mão"/><canvas ref={canvas} aria-hidden="true"/>{phase!=='active'&&<div className="camera-empty"><span>✋</span><b>Vamos reconhecer seus dedos</b><small>Posicione a mão direita com a palma voltada para a câmera.</small></div>}<span className="camera-watermark">MIS · HAND TRACKING BETA</span></div>
          <div className="virtual-camera-actions"><button className="primary-button" type="button" disabled={phase==='starting'} onClick={()=>phase==='off'?void startCamera():stopCamera()}>{phase==='off'?'Ativar câmera':phase==='starting'?'Preparando IA…':'Desligar câmera'}</button><span className={`camera-hand-pill ${seenHand?'detected':''}`}>{seenHand?'✓ Mão identificada':'Aguardando mão'}</span></div>
          {error&&<p className="virtual-error" role="alert">{error} Se preferir, experimente o modo “Pistos na tela”.</p>}
          <div className="virtual-calibrate"><div><strong>Calibração da mão</strong><p>Uma vez por sessão: registre os dedos estendidos, depois os três flexionados. Melhora a precisão dos gestos.</p></div><div className="virtual-cal-buttons"><button type="button" disabled={!seenHand} onClick={()=>captureCalibration('open')}>{calOpen?'✓ ': '1 · '}Registrar soltos</button><button type="button" disabled={!seenHand||!calOpen} onClick={()=>captureCalibration('closed')}>{calibration?'✓ ': '2 · '}Registrar pressionados</button></div>{calibration&&<small className="cal-success">✓ Calibração personalizada ativa</small>}</div>
        </>:<div className="virtual-manual"><span className="manual-hint">Pressione os pistos como se segurasse um trompete</span><ValveKeys valves={touchValves} onToggle={touchToggle}/><p>Treino tátil: útil quando a câmera não está disponível. Os resultados ficam separados dos exercícios verificados pela câmera.</p></div>}
        <div className="virtual-detection"><div><span className="eyebrow">PISTOS RECONHECIDOS</span><strong>{liveValves===null?'Aguardando leitura…':liveValves.length?liveValves.join(' + '):'Todos soltos (0)'}</strong></div><ValveKeys valves={liveValves??[]} interactive={false}/></div>
        <p className="virtual-notice" role="status" aria-live="polite">{notice}</p>
        {mode==='camera'&&angles&&<p className="virtual-angles">Ângulos dos dedos (diagnóstico): {angles.map(Math.round).join('° / ')}° · {calibration?'calibrado':'limiar provisório'}</p>}
      </section>
      <section className="virtual-lesson glass-panel"><div className="virtual-section-head"><div><span className="eyebrow">APRENDIZAGEM INTERATIVA</span><h2>{section==='practice'?'Trilha de digitação':'Laboratório livre'}</h2></div></div>
        <div className="virtual-tabs" role="group" aria-label="Atividades"><button type="button" className={section==='practice'?'active':''} onClick={()=>changeSection('practice')}>✓ Aula guiada</button><button type="button" className={section==='explore'?'active':''} onClick={()=>changeSection('explore')}>♫ Explorar sons</button></div>
        {section==='practice'?(completed?<div className="virtual-conclusion"><span>🏆</span><h3>Missão cumprida!</h3><p>Você completou as {VIRTUAL_STEPS.length} digitações no modo {mode==='camera'?'câmera':'toque'}. A coordenação dos dedos melhora com prática curta e frequente.</p><button className="primary-button" onClick={reset} type="button">Repetir a trilha</button></div>:<>
          <div className="virtual-progress-title"><strong>Aula: Pistos e primeiras notas</strong><span>{Math.min(stepIndex,VIRTUAL_STEPS.length)}/{VIRTUAL_STEPS.length}</span></div><div className="virtual-progress-line"><span style={{width:`${Math.min(100,stepIndex/VIRTUAL_STEPS.length*100)}%`}}/></div>
          <div className="virtual-target"><span>NOTA SOLICITADA</span><strong>{current.note.label}</strong><small>{frequencyLabel(current.note)}</small><div className="virtual-target-valves"><span>Pistos esperados</span><ValveKeys valves={current.note.valves} interactive={false}/></div><p>{current.tip}</p></div>
          <div className="virtual-hold"><div><b>{celebrate?'✓ Digitação correta!':matches?'Mantenha a posição…':'Aguardando digitação correta'}</b><small>{(current.targetMs/1000).toFixed(2).replace('.',',')} s de posição estável · avalia dedos, não sopro</small></div><strong>{Math.round(meter)}%</strong></div><div className="virtual-hold-track"><span style={{width:`${meter}%`}}/></div>
          <div className="virtual-steps">{VIRTUAL_STEPS.map((step,i)=><div key={step.id} className={`virtual-step ${done.includes(step.id)?'done':''} ${i===stepIndex?'current':''}`}><span>{done.includes(step.id)?'✓':String(i+1).padStart(2,'0')}</span><b>{step.note.label}</b><small>{step.note.valveDescription==='Aberto (0)'?'0':step.note.valveDescription}</small></div>)}</div>
          <div className="virtual-actions"><button className="secondary-button" onClick={()=>void hearReference()} type="button">♫ Ouvir a nota</button><button className="secondary-button" onClick={reset} type="button">↻ Reiniciar aula</button></div>
        </>):<div className="virtual-explore"><p>Escolha a nota que quer ouvir e faça a combinação de pistos. A mesma posição pode corresponder a harmônicos diferentes: aqui, você seleciona a nota-alvo.</p><label htmlFor="virtual-note">Nota e registro de referência</label><select id="virtual-note" value={exploreNote} onChange={e=>{setExploreNote(e.target.value);exploreRef.current=e.target.value;audio.current.playWritten(null);}}>{BEGINNER_NOTES.map(n=><option key={n.id} value={n.id}>{n.label} — {n.valveDescription==='Aberto (0)'?'pistos soltos':n.valveDescription}</option>)}</select><div className="virtual-target"><strong>{focusedNote?.label}</strong><small>{focusedNote&&frequencyLabel(focusedNote)}</small><ValveKeys valves={focusedNote?.valves??[]} interactive={false}/></div><p className={matches?'virtual-match success':'virtual-match'}>{matches?'✓ Posição correta. Ouça a nota sintetizada.':'Faça a digitação mostrada e mantenha os dedos.'}</p><button className="secondary-button" type="button" onClick={()=>void hearReference()}>♫ Ouvir referência</button></div>}
        <div className="virtual-teacher-tip"><strong>💡 Dica pedagógica</strong><p>Treinar os dedos sem instrumento ajuda a memorizar posições, mas não ensina a embocadura, respiração nem a emissão real do som. Para isso, continue usando as aulas com trompete verdadeiro.</p></div>
      </section>
    </div>
    <footer className="virtual-footnote">A análise da câmera acontece no aparelho. Nenhuma imagem é gravada ou enviada pelo Music Lab. Na primeira utilização, o navegador baixa o modelo de IA; o fornecedor pode receber dados técnicos de uso. Para câmera no celular, é necessário HTTPS.</footer>
  </main>;
}
