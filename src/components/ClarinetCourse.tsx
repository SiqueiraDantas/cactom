import {useCallback,useEffect,useRef,useState} from 'react';
import {useProfileStorage} from './ProfileStorage';
import {MicrophonePitchMonitor,type PitchSample} from '../lib/audio';
import {ReferenceTone} from '../lib/referenceTone';
import {targetFrequencyFor} from '../lib/music';
import {clarinetNote,CLARINET_FINGERINGS,CLARINET_LESSONS,CLARINET_UNITS,clarinetPitchMatches,type ClarinetLesson} from '../lib/clarinet';
import './clarinet.css';
const KEY='cactom-clarinete-v1';
type Saved={completed:string[];steps:Record<string,number>};
function readSaved(storage:{getItem(key:string):string|null}):Saved{
  try{const v=JSON.parse(storage.getItem(KEY)||'null');return {completed:Array.isArray(v?.completed)?v.completed.filter((id:unknown)=>typeof id==='string'&&CLARINET_LESSONS.some(l=>l.id===id)):[],steps:v?.steps&&typeof v.steps==='object'&&!Array.isArray(v.steps)?v.steps:{}};}catch{return {completed:[],steps:{}};}
}
function Fingering({midi}:{midi:number}){
  const item=CLARINET_FINGERINGS.find(n=>n.midi===midi)!;
  return <div className="clarinet-fingering" aria-label={`Digitação de ${clarinetNote(midi).label}`}>
    <div className="clarinet-keys"><div className={`clarinet-thumb ${item.keys.includes('T')?'closed':''}`} title="Polegar esquerdo">T</div><div className="clarinet-tube">{[1,2,3].map(n=><div className={`clarinet-hole ${item.keys.includes(String(n))?'closed':''}`} title={`Dedo esquerdo ${n}`} key={n}>{n}</div>)}</div></div>
    <p>{item.explanation}</p>
  </div>;
}
function Practice({lesson,startStep,onBack,onProgress,onDone}:{lesson:ClarinetLesson;startStep:number;onBack:()=>void;onProgress:(index:number)=>void;onDone:()=>void}){
  const [index,setIndex]=useState(Math.min(startStep,lesson.notes.length-1));
  const [heard,setHeard]=useState('Ative o microfone e ouça a nota antes de tocar.');
  const [error,setError]=useState('');
  const [listening,setListening]=useState(false);
  const [validMs,setValidMs]=useState(0);
  const [exploreIndex,setExploreIndex]=useState(0);
  const monitor=useRef<MicrophonePitchMonitor|null>(null);
  const reference=useRef(new ReferenceTone());
  const active=useRef(true),request=useRef(0),last=useRef<number|null>(null),validRef=useRef(0),sampleCount=useRef(0),advanceRef=useRef(false);
  const currentNote=lesson.notes[index];
  const stop=useCallback(async()=>{
    request.current++;const old=monitor.current;monitor.current=null;
    last.current=null;validRef.current=0;sampleCount.current=0;
    setListening(false);setValidMs(0);
    if(old)await old.stop().catch(()=>{});
  },[]);
  useEffect(()=>{active.current=true;return ()=>{active.current=false;request.current++;reference.current.stop();const old=monitor.current;monitor.current=null;if(old)void old.stop().catch(()=>{});};},[]);
  const advance=useCallback(()=>{
    if(advanceRef.current)return;
    advanceRef.current=true;
    if(index+1>=lesson.notes.length){onDone();return;}
    const next=index+1;
    onProgress(next);setIndex(next);setValidMs(0);validRef.current=0;sampleCount.current=0;last.current=null;
    setHeard('Muito bem! Agora ouça e toque a próxima nota.');
    // Um novo ataque é necessário: o som sustentado da nota anterior não passa direto.
    window.setTimeout(()=>{advanceRef.current=false;},500);
  },[index,lesson.notes.length,onDone,onProgress]);
  const advanceRefCallback=useRef(advance);advanceRefCallback.current=advance;
  const listen=async()=>{
    if(monitor.current){await stop();return;}
    setError('');setHeard('Preparando microfone…');const token=++request.current;
    try{
      const session=await MicrophonePitchMonitor.create();
      if(token!==request.current||!active.current){await session.stop();return;}
      monitor.current=session;setListening(true);setHeard('Toque a nota indicada e mantenha um som estável.');
      session.listen((sample:PitchSample)=>{
        if(!active.current||monitor.current!==session||advanceRef.current)return;
        const now=performance.now();
        if(sample&&clarinetPitchMatches(sample.frequency,lesson.notes[currentIndex.current],70)){
          const elapsed=last.current===null?0:Math.min(140,now-last.current);
          last.current=now;sampleCount.current++;
          validRef.current+=Math.max(0,elapsed);
          setValidMs(validRef.current);
          setHeard('✓ Nota reconhecida! Continue o som.');
          if(sampleCount.current>=5&&validRef.current>=lesson.holdMs){advanceRefCallback.current();}
        }else{
          last.current=null;sampleCount.current=0;
          validRef.current=Math.max(0,validRef.current-180);
          setValidMs(validRef.current);
          setHeard(sample?'Nota diferente ou som instável. Confira a posição dos dedos.':'Escutando… toque quando estiver pronto.');
        }
      });
    }catch(e){if(token===request.current){setError(e instanceof Error?e.message:'Não foi possível abrir o microfone.');setHeard('Verifique a permissão do navegador.');}}
  };
  const currentIndex=useRef(index);currentIndex.current=index;
  const play=async()=>{setError('');try{await reference.current.play(clarinetNote(currentNote));}catch{setError('Não foi possível reproduzir a referência sonora.');}};
  return <main className="clarinet-course clarinet-practice"><header className="clarinet-bar"><button type="button" onClick={()=>{void stop();onBack();}}>← Voltar à trilha</button><strong>{lesson.title}</strong><span>{index+1}/{lesson.notes.length}</span></header>
    <div className="clarinet-lesson-layout"><section className="clarinet-lesson-card"><small>CLARINETE EM SI♭ · SOM ANTES DO SÍMBOLO</small><h1>{lesson.title}</h1><p>{lesson.instruction}</p><div className="clarinet-progress"><span style={{width:`${100*(index+(lesson.kind==='sound'?validMs/Math.max(lesson.holdMs,1):0))/lesson.notes.length}%`}}/></div>
      <div className="clarinet-note-mark"><small>NOTA ESCRITA</small><b>{clarinetNote(currentNote).label}</b><span>Som real: {Math.round(targetFrequencyFor(clarinetNote(currentNote)))} Hz</span></div>
      <Fingering midi={currentNote}/><button className="clarinet-audition" type="button" disabled={listening} onClick={()=>void play()}>♫ Ouvir a nota</button>
      {lesson.kind==='explore'?<><p>Explore as posições antes de praticar com o instrumento. A câmera não é necessária.</p><div className="clarinet-explore-buttons">{lesson.notes.map((note,i)=><button type="button" key={note} className={exploreIndex===i?'active':''} onClick={()=>{setExploreIndex(i);setIndex(i);}}>{clarinetNote(note).label}</button>)}</div><button className="clarinet-action" type="button" onClick={onDone}>✓ Concluir exploração</button></>:<><div className="clarinet-mic-controls"><button className="clarinet-action" type="button" onClick={()=>void listen()}>{listening?'■ Desligar microfone':'🎤 Ativar microfone'}</button><div className="clarinet-note-meter"><span style={{width:`${Math.min(100,validMs/lesson.holdMs*100)}%`}}/></div></div><p className="clarinet-feedback" role="status">{heard}</p><p className="clarinet-mic-tip">O Cactom ouve a altura da nota, não a qualidade da embocadura ou a posição real dos dedos. Faça pausas e evite esforço.</p></>}
      {error&&<p role="alert" className="clarinet-error">{error}</p>}
    </section><aside className="clarinet-teacher"><span>🎶</span><h2>Aprenda no seu tempo</h2><p>O clarinete em Si♭ soa um tom abaixo da nota escrita. Primeiro escute, depois experimente os dedos e pratique a emissão.</p><b>Uma boa postura importa</b><p>Mantenha o corpo relaxado, use a embocadura orientada pelo professor e não force o som.</p></aside></div>
  </main>;
}
export function ClarinetCourse({onChooseInstrument,onSignOut}:{onChooseInstrument:()=>void;onSignOut:()=>void}){
  const storage=useProfileStorage();
  const [saved,setSaved]=useState<Saved>(()=>readSaved(storage));
  const [selected,setSelected]=useState<ClarinetLesson|null>(null);
  const [finished,setFinished]=useState<ClarinetLesson|null>(null);
  const markStep=useCallback((id:string,i:number)=>setSaved(prev=>{const next={...prev,steps:{...prev.steps,[id]:i}};try{storage.setItem(KEY,JSON.stringify(next));}catch{}return next;}),[storage]);
  const complete=useCallback((lesson:ClarinetLesson)=>{setSaved(prev=>{const next={completed:[...new Set([...prev.completed,lesson.id])],steps:{...prev.steps,[lesson.id]:0}};try{storage.setItem(KEY,JSON.stringify(next));}catch{}return next;});setSelected(null);setFinished(lesson);},[storage]);
  if(finished)return <main className="clarinet-course clarinet-victory"><div className="clarinet-victory-card"><span>🌟</span><h1>Bravo! Mais um passo com o clarinete.</h1><p>Você concluiu <b>{finished.title}</b>. Seu progresso foi salvo neste perfil do navegador.</p><button className="clarinet-action" type="button" onClick={()=>{const i=CLARINET_LESSONS.indexOf(finished);setFinished(null);setSelected(CLARINET_LESSONS[i+1]??null);}}>{CLARINET_LESSONS.indexOf(finished)+1===CLARINET_LESSONS.length?'Voltar à trilha':'Próxima atividade →'}</button><button className="clarinet-audition" type="button" onClick={()=>setFinished(null)}>Ver trilha</button></div></main>;
  if(selected)return <Practice key={selected.id} lesson={selected} startStep={Math.max(0,Math.min(Number(saved.steps[selected.id])||0,selected.notes.length-1))} onBack={()=>setSelected(null)} onProgress={n=>markStep(selected.id,n)} onDone={()=>complete(selected)}/>;
  return <main className="clarinet-course"><header className="clarinet-bar"><button type="button" onClick={onChooseInstrument}>← Trocar curso</button><strong>Clarinete <span>♪</span></strong><button type="button" onClick={onSignOut}>Sair</button></header>
    <div className="clarinet-path" aria-label="Trilha contínua de clarinete">{CLARINET_UNITS.map((unit,ui)=><section key={unit.title} className="clarinet-unit"><div className={`clarinet-unit-title ${unit.color}`}><span>{ui+1}</span><div><small>UNIDADE {ui+1} · {unit.description}</small><h2>{unit.title}</h2></div></div><div className="clarinet-nodes">{CLARINET_LESSONS.filter(l=>l.unit===ui).map((lesson,i)=>{const done=saved.completed.includes(lesson.id);return <div className={`clarinet-node-row ${i%2?'right':''}`} key={lesson.id}><button type="button" className={`clarinet-node ${done?'complete':''}`} onClick={()=>setSelected(lesson)} aria-label={`${lesson.title}${done?', concluída':''}`}>{done?'✓':lesson.kind==='explore'?'♪':'♫'}</button><div><b>{lesson.title}</b><small>{lesson.summary}</small></div></div>;})}</div></section>)}</div>
    <p className="clarinet-local">As atividades usam microfone mediante permissão. Nenhuma gravação de áudio é armazenada. As orientações de digitação são introdutórias e não substituem o professor.</p>
  </main>;
}
