import {useEffect,useRef,useState} from 'react';
import {ACCESS_COPY,type AccessLocale} from '../lib/accessLocale';
import {welcomePageVisit} from '../lib/welcomePlayback';
import {STORY_SECONDS as CONCERT_SECONDS} from './WelcomeStory';
import {WelcomeSound} from '../lib/welcomeSound';
import {useAccessMotion} from './useAccessMotion';
import {WelcomeStory,type StoryPhase as ConcertPhase} from './WelcomeStory';
import {RiveAnimation,RIVE_FILES,riveFileExists,type RiveHandle} from './RiveAnimation';

const LABELS={
 'pt-BR':{skip:'Pular',replay:'Ver de novo',soundOn:'Som ligado',soundOff:'Sem som'},
 'en':{skip:'Skip',replay:'Watch again',soundOn:'Sound on',soundOff:'Muted'},
 'es':{skip:'Saltar',replay:'Ver de nuevo',soundOn:'Con sonido',soundOff:'Sin sonido'},
} as Record<string,{skip:string;replay:string;soundOn:string;soundOff:string}>;
/**
 * Abertura: uma vez por carga de página; voltar do login mostra o quadro final.
 * Começa sem som (versão silenciosa). Pular, ver de novo e som são opcionais.
 * Movimento reduzido mostra o quadro final; “Ver de novo” fica disponível se a pessoa pedir.
 */
export function WelcomeEnsemble({locale='pt-BR'}:{locale?:AccessLocale}){
 const t=ACCESS_COPY[locale],l=LABELS[locale]??LABELS['pt-BR'],environment=useAccessMotion(),root=useRef<HTMLElement>(null);
 const [phase,setPhase]=useState<ConcertPhase>(()=>welcomePageVisit.hasPresented?'settled':'waiting');
 // Se existir public/animacoes/abertura.riv (feito no Rive), ele substitui a cena desenhada em código.
 const [rive,setRive]=useState<'checking'|'yes'|'no'>('checking'),riveRef=useRef<RiveHandle>(null);
 useEffect(()=>{let alive=true;void riveFileExists(RIVE_FILES.abertura).then(ok=>{if(alive)setRive(ok?'yes':'no');});return ()=>{alive=false;};},[]);
 const [run,setRun]=useState(0),[sound,setSound]=useState(false),[onScreen,setOnScreen]=useState(true),[forced,setForced]=useState(false);
 const audio=useRef<WelcomeSound|null>(null);

 useEffect(()=>()=>audio.current?.stop(),[]);
 useEffect(()=>{
  if(!environment.ready||phase!=='waiting'||rive==='checking')return;
  if(environment.reducedMotion){welcomePageVisit.record('finished');setPhase('settled');return;}
  if(!environment.visible)return;
  // Começa quando a página termina de montar: a cena não disputa o processador com a carga inicial.
  let cancelled=false,frame=0;
  const go=()=>{frame=requestAnimationFrame(()=>{frame=requestAnimationFrame(()=>{if(cancelled)return;welcomePageVisit.record('playing');setPhase('playing');});});};
  const hasIdle=typeof window.requestIdleCallback==='function';
  const idle=hasIdle?window.requestIdleCallback(go,{timeout:900}):window.setTimeout(go,350);
  return ()=>{cancelled=true;cancelAnimationFrame(frame);if(hasIdle)window.cancelIdleCallback(idle);else clearTimeout(idle);};
 },[environment.ready,environment.reducedMotion,environment.visible,phase,rive]);
 useEffect(()=>{
  if(phase!=='playing')return;
  const done=setTimeout(()=>{welcomePageVisit.record('finished');setPhase('settled');setForced(false);},CONCERT_SECONDS*1000);
  return ()=>clearTimeout(done);
 },[phase,run]);
 useEffect(()=>{
  const element=root.current;if(!element||typeof IntersectionObserver==='undefined')return;
  const observer=new IntersectionObserver(entries=>setOnScreen(entries[0]?.isIntersecting??true));
  observer.observe(element);return ()=>observer.disconnect();
 },[]);
 useEffect(()=>{if(phase!=='playing'||!environment.visible)audio.current?.stop();},[phase,environment.visible]);
 const replay=(withSound=sound)=>{audio.current?.stop();setForced(environment.reducedMotion);setRun(r=>r+1);setPhase('playing');if(withSound){audio.current??=new WelcomeSound();void audio.current.play();}};
 const skip=()=>{audio.current?.stop();welcomePageVisit.record('finished');setPhase('settled');setForced(false);};
 const toggleSound=()=>{const next=!sound;setSound(next);if(next)replay(true);else audio.current?.stop();};
 const reduced=environment.ready&&environment.reducedMotion&&!forced;
 if(rive==='yes'&&!(environment.ready&&environment.reducedMotion))return <figure ref={root} className="welcome-ensemble welcome-ensemble--rive" data-stage="rive">
  <RiveAnimation ref={riveRef} src={RIVE_FILES.abertura} stateMachine="Abertura" label={t.artworkAlt} onError={()=>setRive('no')}/>
  <figcaption className="wcc-controls"><button type="button" onClick={()=>riveRef.current?.replay()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/></svg>{l.replay}</button></figcaption>
 </figure>;
 return <figure ref={root} className="welcome-ensemble welcome-ensemble--concert" data-stage={phase}>
  <WelcomeStory run={run} phase={phase} paused={!environment.visible||!onScreen} reduced={reduced} label={t.artworkAlt}/>
  <figcaption className="wcc-controls">
   {phase==='playing'?<button type="button" onClick={skip}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 5 8 7-8 7zM17 5v14"/></svg>{l.skip}</button>
   :phase==='settled'&&<button type="button" onClick={()=>replay()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v5h5"/></svg>{l.replay}</button>}
   <button type="button" aria-pressed={sound} onClick={toggleSound}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/>{sound?<path d="M16.5 8.5a5 5 0 0 1 0 7"/>:<path d="m17 9 5 6m0-6-5 6"/>}</svg>{sound?l.soundOn:l.soundOff}</button>
  </figcaption>
 </figure>;
}
