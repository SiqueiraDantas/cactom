import {useEffect,useMemo,useRef,useState,type CSSProperties,type ReactNode} from 'react';
import {availableInstrument} from '../lib/instruments';
import type {AccessLocale} from '../lib/accessLocale';
import {SOURCES,REASONS,LEVELS,GOALS,STAFF_STEP,quizFor,optionAnswerLabel,QUIZ_HEARTS,quizXp,accuracyLabel,saveOnboarding,
 type OnboardingAnswers,type Choice,type Art,type QuizQuestion,type QuizOption} from '../lib/onboarding';
import {InstrumentTile} from './InstrumentTile';
import {workshopText} from './WorkshopGrid';
import {playSound,soundsOn,setSoundsOn} from '../lib/uiSound';
import './onboarding-journey.css';
import {TomRojao} from './TomRojao';

const TOM_CLIPBOARD='/animacoes/tom-prancheta.svg',TOM_WAVE='/animacoes/cactom-acenando.svg';
type Step='source'|'reason'|'level'|'overview'|'goal'|'path'|'motiv1'|'motiv2'|'quiz'|'complete'|'hop'|'streak';
const ASK:Step[]=['source','reason','level','overview','goal','path'];
const ORDER:Step[]=[...ASK,'motiv1','motiv2','quiz','complete','hop','streak'];

/** Sequência depois do “Oi! Eu sou o Tom!”: perguntas, atividade de aquecimento, trilha e rojão. */
export function OnboardingJourney({locale,workshopId,onBack,onDone}:{locale:AccessLocale;workshopId:string|null;onBack:()=>void;onDone:(answers:OnboardingAnswers)=>void}){
 const [step,setStep]=useState<Step>('source');
 const [answers,setAnswers]=useState<OnboardingAnswers>({});
 const [result,setResult]=useState<{correct:number;total:number;seconds:number}|null>(null);
 const course=availableInstrument(workshopId),courseName=course?workshopText(course,locale).name:'música';
 const next=()=>setStep(ORDER[Math.min(ORDER.indexOf(step)+1,ORDER.length-1)]);
 const back=()=>{playSound('tap');const i=ORDER.indexOf(step);if(i<=0)onBack();else setStep(ORDER[i-1]);};
 const finish=()=>{saveOnboarding(answers);onDone(answers);};
 const set=<K extends keyof OnboardingAnswers>(key:K,value:OnboardingAnswers[K])=>setAnswers(current=>({...current,[key]:value}));
 const headingRef=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{window.scrollTo({top:0,behavior:'auto'});headingRef.current?.focus({preventScroll:true});if(step==='complete')playSound('fanfarra');if(step==='streak')playSound('fogo');},[step]);

 if(step==='quiz')return <SheetQuiz key="quiz" path={answers.path??'zero'} onExit={()=>setStep('path')} onFinish={r=>{setResult(r);setStep('complete');}}/>;
 if(step==='complete'&&result){const percent=Math.round(result.correct/result.total*100);
  return <Shell footer={<Continue onClick={next}/>}><div className="obj-complete">
   <div className="obj-celebrate" aria-hidden="true"><img src={TOM_WAVE} alt="" width={400} height={420}/>{Array.from({length:10},(_,i)=><i key={i} style={{'--i':i} as CSSProperties}/>)}</div>
   <h1 ref={headingRef} tabIndex={-1}>Lição concluída!</h1>
   <div className="obj-stats">
    <div className="obj-stat obj-stat--xp"><b>TOTAL DE XP</b><span><Bolt/>{quizXp(result.correct)}</span></div>
    <div className="obj-stat obj-stat--acc"><b>{accuracyLabel(percent)}</b><span><Target/>{percent}%</span></div>
   </div>
  </div></Shell>;}
 if(step==='hop')return <TrailHop courseName={courseName} onDone={next}/>;
 if(step==='streak')return <Shell footer={<Continue onClick={finish}/>}><div className="obj-streak">
  <TomRojao animated className="obj-rojao"/>
  <h1 ref={headingRef} tabIndex={-1}>Teu rojão começa hoje, visse!</h1>
  <p>Faz uma etapa da trilha por dia e segura firme o rojão. Se largar a corda, ele volta pro zero!</p>
  <ol className="obj-week" aria-label="Esta semana">{weekDays().map(d=><li key={d.label} className={d.today?'is-today':''}><span>{d.label}</span><i/></li>)}</ol>
 </div></Shell>;
 if(step==='motiv1'||step==='motiv2')return <Shell footer={<Continue onClick={next}/>}><div className="obj-center">
  <h1 className="obj-bubble obj-bubble--down" ref={headingRef} tabIndex={-1}>{step==='motiv1'?'Ôxe, tem dia que dá uma preguiça danada de praticar…':'…por isso o Cactom é animado que só um forró, feito um jogo!'}</h1>
  <img className="obj-tom-big" src={TOM_CLIPBOARD} alt="" width={400} height={420}/>
 </div></Shell>;

 const index=ASK.indexOf(step),progress=(index+1)/(ASK.length+1);
 const ready=step==='overview'||(step==='source'&&answers.source)||(step==='reason'&&answers.reason)||(step==='level'&&answers.level)||(step==='goal'&&answers.goal)||(step==='path'&&answers.path);
 const question:Record<string,string>={source:'Me diz uma coisa: como foi que tu conheceu o Cactom?',reason:'E por que tu quer aprender música, hein?',level:'Tu já sabe quanto de música, mais ou menos?',overview:'Olha só o tanto de coisa arretada que tu vai fazer!',goal:'E qual vai ser tua meta de cada dia?',path:'Bora achar o lugar certinho pra tu começar!'};
 return <Shell top={<TopBar onBack={back} progress={progress}/>} footer={<Continue disabled={!ready} onClick={next}/>}>
  <div className="obj-ask">
   <div className="obj-speaker"><img src={TOM_CLIPBOARD} alt="" width={400} height={420}/><h1 className="obj-bubble obj-bubble--left" ref={headingRef} tabIndex={-1}>{question[step]}</h1></div>
   {step==='source'&&<ChoiceGrid items={SOURCES} value={answers.source} onPick={v=>set('source',v)}/>}
   {step==='reason'&&<ChoiceGrid items={REASONS} value={answers.reason} onPick={v=>set('reason',v)}/>}
   {step==='level'&&<ChoiceList label={question.level}>{LEVELS.map(item=><Option key={item.id} selected={answers.level===item.id} onClick={()=>set('level',item.id)}><Bars level={Number(item.icon)}/><span>{item.label}</span></Option>)}</ChoiceList>}
   {step==='overview'&&<ul className="obj-overview">
    <li><SheetIcon/><div><b>Ler partitura</b><span>Notas, ritmos e símbolos sem complicação</span></div></li>
    <li><span className="obj-overview-tile">{course&&<InstrumentTile instrument={course.id}/>}</span><div><b>{course?.id==='conductor'?'Reger suas primeiras músicas':'Tocar suas primeiras músicas'}</b><span>{courseName}, passo a passo e no seu ritmo</span></div></li>
    <li><Clock/><div><b>Criar o hábito de praticar</b><span>Rojão, conquistas e um tiquinho por dia</span></div></li>
   </ul>}
   {step==='goal'&&<ChoiceList label={question.goal}>{GOALS.map(g=><Option key={g.min} selected={answers.goal===g.min} onClick={()=>set('goal',g.min)}><b>{g.min} min / dia</b><span className="obj-goal-tag">{g.label}</span></Option>)}</ChoiceList>}
   {step==='path'&&<ChoiceList label={question.path} big>
    <Option selected={answers.path==='zero'} onClick={()=>set('path','zero')}><BookOne/><span className="obj-path-text"><b>Começar do zero</b><span>Faça a atividade mais fácil de partitura.</span></span></Option>
    <Option selected={answers.path==='nivel'} onClick={()=>set('path','nivel')}><Compass/><span className="obj-path-text"><b>Encontrar meu nível</b><span>Responda perguntas de partitura e veja o que você já sabe.</span></span></Option>
   </ChoiceList>}
  </div>
 </Shell>;
}

function Shell({top,footer,children}:{top?:ReactNode;footer:ReactNode;children:ReactNode}){
 return <div className="obj">{top}<main className="obj-main" id="access-actions">{children}</main><footer className="obj-footer"><div className="obj-footer-inner">{footer}</div></footer></div>;
}
function TopBar({onBack,progress,close=false,hearts}:{onBack:()=>void;progress:number;close?:boolean;hearts?:number}){
 return <header className="obj-top">
  <button type="button" className="obj-back" onClick={onBack} aria-label={close?'Sair da atividade':'Voltar'}>{close
   ?<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
   :<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6"/></svg>}</button>
  <div className="obj-progress" role="progressbar" aria-label="Progresso" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress*100)}><span style={{width:`${Math.max(4,progress*100)}%`}}/></div>
  {hearts!==undefined&&<span className={`obj-hearts${hearts===0?' is-dry':''}`} aria-label={`${hearts} ${hearts===1?'gota d’água':'gotas d’água'}`}><Drop level={hearts/QUIZ_HEARTS} key={hearts}/>{hearts}</span>}
  <SoundToggle/>
 </header>;
}
function Continue({onClick,disabled=false,label='Continuar',tone,sound=true}:{onClick:()=>void;disabled?:boolean;label?:string;tone?:'good'|'bad';sound?:boolean}){
 return <button type="button" className={`obj-continue${tone?` obj-continue--${tone}`:''}`} disabled={disabled} onClick={()=>{if(sound)playSound('pop');onClick();}}>{label}</button>;
}
function ChoiceGrid({items,value,onPick}:{items:Choice[];value?:string;onPick:(id:string)=>void}){
 return <div className="obj-grid" role="radiogroup">{items.map(item=><Option key={item.id} selected={value===item.id} onClick={()=>onPick(item.id)}><ChoiceIcon name={item.icon}/><span>{item.label}</span></Option>)}</div>;
}
function ChoiceList({label,big=false,children}:{label:string;big?:boolean;children:ReactNode}){
 return <div className={`obj-list${big?' obj-list--big':''}`} role="radiogroup" aria-label={label}>{children}</div>;
}
function Option({selected,onClick,children}:{selected:boolean;onClick:()=>void;children:ReactNode}){
 return <button type="button" role="radio" aria-checked={selected} className={`obj-option${selected?' is-selected':''}`} onClick={()=>{playSound('tap');onClick();}}>{children}</button>;
}

/* ---------- Mini atividade de partitura (aquecimento) ---------- */
type Check={ok:boolean;correctLabel:string}|null;
function SheetQuiz({path,onExit,onFinish}:{path:'zero'|'nivel';onExit:()=>void;onFinish:(r:{correct:number;total:number;seconds:number})=>void}){
 const {easy,hard}=useMemo(()=>quizFor(path),[path]);
 const questions=useMemo(()=>[...easy,...hard],[easy,hard]);
 const [index,setIndex]=useState(0),[picked,setPicked]=useState<string|null>(null),[check,setCheck]=useState<Check>(null);
 const [hearts,setHearts]=useState(QUIZ_HEARTS),[correct,setCorrect]=useState(0),[interlude,setInterlude]=useState(false),[easyAllRight,setEasyAllRight]=useState(true);
 const started=useRef(Date.now()),titleRef=useRef<HTMLHeadingElement>(null);
 const q=questions[index];
 useEffect(()=>{titleRef.current?.focus({preventScroll:true});},[index,interlude]);
 const verify=(skip=false)=>{
  if(check||(!picked&&!skip))return;
  const ok=!skip&&picked===q.answer,answer=q.options.find(o=>o.id===q.answer)!;
  if(ok)setCorrect(c=>c+1);else{if(!skip)setHearts(h=>Math.max(0,h-1));if(index<easy.length)setEasyAllRight(false);}
  playSound(ok?'certo':'errado');
  setCheck({ok,correctLabel:optionAnswerLabel(answer)});
 };
 const advance=()=>{
  setCheck(null);setPicked(null);
  if(index+1>=questions.length){onFinish({correct,total:questions.length,seconds:Math.round((Date.now()-started.current)/1000)});return;}
  if(index+1===easy.length){setInterlude(true);playSound('chegou');}
  setIndex(i=>i+1);
 };
 useEffect(()=>{
  const key=(e:KeyboardEvent)=>{
   if(interlude){if(e.key==='Enter'){e.preventDefault();playSound('pop');setInterlude(false);}return;}
   const n=Number(e.key);if(!check&&n>=1&&n<=q.options.length){playSound('tap');setPicked(q.options[n-1].id);return;}
   if(e.key==='Enter'){e.preventDefault();if(check){playSound('pop');advance();}else verify();}
  };
  window.addEventListener('keydown',key);return ()=>window.removeEventListener('keydown',key);
 });
 const progress=(index+(check?1:0))/questions.length;
 if(interlude)return <div className="obj obj--quiz">
  <TopBar close onBack={onExit} progress={index/questions.length} hearts={hearts}/>
  <main className="obj-main obj-interlude"><img className="obj-peek" src={TOM_WAVE} alt="" width={400} height={420}/><h1 className="obj-bubble obj-bubble--left" ref={titleRef} tabIndex={-1}>{easyAllRight?'Arretado! Agora o negócio vai apertar um tiquinho…':'Massa! Agora vai ficar um tiquinho mais difícil, visse?'}</h1></main>
  <footer className="obj-footer"><div className="obj-footer-inner"><Continue onClick={()=>setInterlude(false)}/></div></footer>
 </div>;
 return <div className="obj obj--quiz">
  <TopBar close onBack={onExit} progress={progress} hearts={hearts}/>
  <main className="obj-main obj-quiz">
   {q.tag&&<p className="obj-tag"><Sparkle/>{q.tag}</p>}
   <h1 ref={titleRef} tabIndex={-1}>{q.prompt}</h1>
   {q.art&&<div className="obj-prompt-art"><ArtView art={q.art}/></div>}
   <div className={q.layout==='cards'?'obj-cards':'obj-answers'} role="radiogroup" aria-label={q.prompt}>
    {q.options.map((o,i)=><AnswerOption key={o.id} option={o} n={i+1} layout={q.layout} selected={picked===o.id} state={check?(o.id===q.answer?'right':picked===o.id?'wrong':'idle'):'idle'} disabled={!!check} onPick={()=>{playSound('tap');setPicked(o.id);}}/>)}
   </div>
  </main>
  <footer className={`obj-footer obj-footer--quiz${check?(check.ok?' is-right':' is-wrong'):''}`}><div className="obj-footer-inner" aria-live="polite">
   {check?<>
    <div className="obj-feedback">{check.ok?<><b>Arretado!</b></>:<><b>Eita! A certa era:</b><span>{check.correctLabel}</span></>}</div>
    <Continue tone={check.ok?'good':'bad'} onClick={advance}/>
   </>:<>
    <button type="button" className="obj-skip" onClick={()=>verify(true)}>Pular</button>
    <Continue label="Verificar" sound={false} disabled={!picked} onClick={()=>verify()}/>
   </>}
  </div></footer>
 </div>;
}
function AnswerOption({option,n,layout,selected,state,disabled,onPick}:{option:QuizOption;n:number;layout:QuizQuestion['layout'];selected:boolean;state:'idle'|'right'|'wrong';disabled:boolean;onPick:()=>void}){
 return <button type="button" role="radio" aria-checked={selected} disabled={disabled} className={`obj-answer obj-answer--${layout}${selected?' is-selected':''}${state!=='idle'?` is-${state}`:''}`} onClick={onPick}>
  {option.art&&<span className="obj-answer-art"><ArtView art={option.art}/></span>}
  <span className="obj-answer-row"><span className="obj-answer-label">{option.label??''}</span><span className="obj-key" aria-hidden="true">{n}</span></span>
  {!option.label&&<span className="obj-sr">{`Opção ${n}`}</span>}
 </button>;
}
/** Pauta com clave de sol (nota) ou figura rítmica isolada. */
function ArtView({art}:{art:Art}){
 if(art.kind==='figure'){const f=art.figure,open=f==='semibreve'||f==='minima',stem=f!=='semibreve';
  return <svg viewBox="0 0 120 90" aria-hidden="true"><g transform="translate(60 62)">
   <ellipse rx="10" ry="7" transform="rotate(-20)" fill={open?'none':'#2B2F36'} stroke="#2B2F36" strokeWidth={open?3.6:0}/>
   {stem&&<rect x="7.4" y="-44" width="3.2" height="44" rx="1.2" fill="#2B2F36"/>}
   {f==='colcheia'&&<path d="M10 -44 Q26 -32 22 -12 Q19 -24 10 -27 Z" fill="#2B2F36"/>}
  </g></svg>;}
 const step=STAFF_STEP[art.pitch],y=70-step*5,up=step<4,ledger=step<=-2||step>=10;
 return <svg viewBox="0 0 120 90" aria-hidden="true">
  <g stroke="#9AA5AE" strokeWidth="1.4">{[30,40,50,60,70].map(l=><path key={l} d={`M8 ${l} H112`}/>)}</g>
  <text x="10" y="76" fontSize="54" fill="#2B2F36" fontFamily="'Noto Music','Bravura','Apple Symbols','Segoe UI Symbol',serif">𝄞</text>
  {ledger&&<path d={`M62 ${y} H88`} stroke="#2B2F36" strokeWidth="1.6"/>}
  <g transform={`translate(75 ${y})`}>
   <ellipse rx="7.2" ry="5.2" transform="rotate(-20)" fill="#2B2F36"/>
   {up?<rect x="5.4" y="-31" width="2.2" height="31" rx="1" fill="#2B2F36"/>:<rect x="-7.6" y="0" width="2.2" height="31" rx="1" fill="#2B2F36"/>}
  </g>
 </svg>;
}

/* ---------- Tom pulando de casa em casa até a primeira parada ---------- */
const NODES=[{x:150,y:60},{x:110,y:150},{x:90,y:240},{x:110,y:330},{x:150,y:420}];
function TrailHop({courseName,onDone}:{courseName:string;onDone:()=>void}){
 const [done,setDone]=useState(false);
 useEffect(()=>{
  const timers=[510,1030,1550,2120].map(ms=>setTimeout(()=>playSound('pulo'),ms));
  timers.push(setTimeout(()=>playSound('chegou'),2420),setTimeout(()=>setDone(true),2900));
  return ()=>timers.forEach(clearTimeout);
 },[]);
 useEffect(()=>{if(!done)return;const t=setTimeout(onDone,900);return ()=>clearTimeout(t);},[done,onDone]);
 return <div className="obj obj--hop">
  <main className="obj-main obj-hop" aria-label={`O Tom vai até a primeira parada da trilha de ${courseName}`}>
   <div className="obj-trail">
    {NODES.map((n,i)=><span key={i} className={`obj-node${i===0?' is-first':''}`} style={{left:n.x,top:n.y}}>{i===0?<Star/>:<Star muted/>}</span>)}
    <span className="obj-start-bubble" style={{left:NODES[0].x,top:NODES[0].y-62}}>COMEÇAR</span>
    <img className="obj-hopper" src={TOM_WAVE} alt="" width={400} height={420}/>
   </div>
  </main>
  <footer className="obj-footer"><div className="obj-footer-inner"><Continue onClick={onDone}/></div></footer>
 </div>;
}
/** Liga e desliga os efeitos sonoros (vale para todo o app neste aparelho). */
function SoundToggle(){
 const [on,setOn]=useState(()=>soundsOn());
 return <button type="button" className="obj-sound" aria-pressed={on} aria-label={on?'Desligar sons':'Ligar sons'} title={on?'Desligar sons':'Ligar sons'} onClick={()=>{const next=!on;setSoundsOn(next);setOn(next);if(next)playSound('tap');}}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/>{on?<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>:<path d="m17 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>}</svg>
 </button>;
}
function weekDays(){
 const names=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],today=new Date().getDay();
 return names.map((label,i)=>({label,today:i===today}));
}

/* ---------- Ícones planos ---------- */
function ChoiceIcon({name}:{name:string}){
 const icons:Record<string,ReactNode>={
  camera:<><rect x="6" y="12" width="36" height="28" rx="9" fill="#F77F6B"/><rect x="6" y="12" width="36" height="9" rx="4.5" fill="#FDB55E"/><circle cx="24" cy="27" r="8" fill="#fff"/><circle cx="24" cy="27" r="4.5" fill="#F77F6B"/><circle cx="35" cy="18" r="2" fill="#fff"/></>,
  video:<><rect x="5" y="11" width="38" height="27" rx="8" fill="#4A9FE8"/><path d="M20 18 L31 24.5 L20 31 Z" fill="#fff"/></>,
  note:<><ellipse cx="17" cy="35" rx="7" ry="5.5" transform="rotate(-20 17 35)" fill="#3D4A46"/><rect x="22" y="9" width="4" height="27" rx="2" fill="#3D4A46"/><path d="M25 9 Q38 14 36 26 Q33 18 25 18 Z" fill="#3D4A46"/></>,
  school:<><path d="M6 20 L24 9 L42 20 Z" fill="#E05A47"/><rect x="10" y="20" width="28" height="20" fill="#FFC93C"/><rect x="20" y="28" width="8" height="12" fill="#B9773E"/><rect x="13" y="24" width="5" height="5" fill="#fff"/><rect x="30" y="24" width="5" height="5" fill="#fff"/></>,
  people:<><circle cx="17" cy="18" r="7" fill="#F6C28B"/><path d="M5 40 Q5 27 17 27 Q29 27 29 40 Z" fill="#58B9F5"/><circle cx="32" cy="20" r="6.5" fill="#8D5A3B"/><path d="M21 41 Q21 29 32 29 Q43 29 43 41 Z" fill="#FF8A12"/></>,
  search:<><circle cx="21" cy="21" r="11" fill="none" stroke="#4A9FE8" strokeWidth="5"/><path d="M29 29 L40 40" stroke="#3D4A46" strokeWidth="6" strokeLinecap="round"/></>,
  dots:<><circle cx="24" cy="24" r="17" fill="#C77DFF"/><circle cx="16" cy="24" r="2.6" fill="#fff"/><circle cx="24" cy="24" r="2.6" fill="#fff"/><circle cx="32" cy="24" r="2.6" fill="#fff"/></>,
  drum:<><rect x="9" y="20" width="30" height="18" rx="4" fill="#E05A47"/><ellipse cx="24" cy="20" rx="15" ry="5" fill="#FFF3D6"/><path d="M12 24 L20 36 L28 24 L36 36" fill="none" stroke="#FFC93C" strokeWidth="2.5"/><path d="M14 6 L22 17 M36 6 L28 17" stroke="#B9773E" strokeWidth="3.5" strokeLinecap="round"/></>,
  party:<><path d="M9 41 L19 15 L34 30 Z" fill="#FFC93C"/><path d="M14 29 L25 21 M11 36 L29 26" stroke="#FF6F96" strokeWidth="3"/><circle cx="33" cy="12" r="3" fill="#58B9F5"/><circle cx="40" cy="22" r="2.4" fill="#7FD05B"/><circle cx="25" cy="8" r="2.4" fill="#C77DFF"/></>,
  church:<><path d="M24 5 V13 M20 9 H28" stroke="#8D99A3" strokeWidth="3" strokeLinecap="round"/><path d="M10 24 L24 13 L38 24 Z" fill="#58B9F5"/><rect x="13" y="24" width="22" height="17" fill="#FFF3D6"/><path d="M21 41 V33 Q24 29 27 33 V41 Z" fill="#B9773E"/></>,
  brain:<><path d="M24 10 Q14 6 10 14 Q4 18 8 26 Q6 34 14 36 Q18 42 24 38 Q30 42 34 36 Q42 34 40 26 Q44 18 38 14 Q34 6 24 10 Z" fill="#FF9EC0"/><path d="M24 11 V37 M16 18 Q20 22 16 26 M32 18 Q28 22 32 26" fill="none" stroke="#E5739B" strokeWidth="2.4" strokeLinecap="round"/></>,
  book:<><path d="M6 12 Q15 9 24 13 Q33 9 42 12 V38 Q33 35 24 39 Q15 35 6 38 Z" fill="#FFF3D6" stroke="#58B9F5" strokeWidth="3" strokeLinejoin="round"/><path d="M24 13 V39" stroke="#58B9F5" strokeWidth="2.5"/><rect x="12" y="9" width="5" height="12" fill="#E05A47"/></>,
  case:<><rect x="6" y="16" width="36" height="24" rx="5" fill="#B9773E"/><rect x="18" y="10" width="12" height="7" rx="2" fill="none" stroke="#8C5A30" strokeWidth="3"/><rect x="6" y="24" width="36" height="4" fill="#8C5A30"/><rect x="21" y="23" width="6" height="7" rx="1.5" fill="#FFC93C"/></>,
 };
 return <svg className="obj-icon" viewBox="0 0 48 48" aria-hidden="true">{icons[name]}</svg>;
}
function Bars({level}:{level:number}){
 return <svg className="obj-icon obj-bars" viewBox="0 0 48 48" aria-hidden="true">{[0,1,2,3].map(i=><rect key={i} x={6+i*10} y={34-i*7} width="7" height={8+i*7} rx="2" fill={i<level?'#58B9F5':'#D9E1E7'}/>)}</svg>;
}
const SheetIcon=()=><svg className="obj-icon obj-icon--big" viewBox="0 0 48 48" aria-hidden="true"><rect x="7" y="5" width="34" height="40" rx="5" fill="#C77DFF"/><rect x="11" y="9" width="26" height="32" rx="3" fill="#fff"/><g stroke="#D8C2F5" strokeWidth="1.6">{[16,20,24,28,32].map(y=><path key={y} d={`M14 ${y} H34`}/>)}</g><ellipse cx="21" cy="30" rx="3.4" ry="2.6" transform="rotate(-20 21 30)" fill="#3D4A46"/><rect x="23.4" y="18" width="1.6" height="12" fill="#3D4A46"/></svg>;
const Clock=()=><svg className="obj-icon obj-icon--big" viewBox="0 0 48 48" aria-hidden="true"><rect x="19" y="3" width="10" height="6" rx="2" fill="#E8A000"/><circle cx="24" cy="27" r="17" fill="#FFC93C"/><circle cx="24" cy="27" r="12" fill="#FFF8E6"/><path d="M24 19 V27 H30" fill="none" stroke="#B97400" strokeWidth="3.2" strokeLinecap="round"/></svg>;
const BookOne=()=><svg className="obj-icon obj-icon--big" viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="5" width="30" height="40" rx="3" fill="#FFC93C"/><rect x="34" y="5" width="5" height="40" fill="#FFF3D6"/><path d="M14 2 V12 L17 10 L20 12 V2 Z" fill="#E05A47"/><text x="22" y="34" fontSize="18" fontWeight="900" fill="#B97400" textAnchor="middle" fontFamily="Nunito,system-ui,sans-serif">1</text></svg>;
const Compass=()=><svg className="obj-icon obj-icon--big" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="20" fill="#4A9FE8"/><circle cx="24" cy="24" r="15" fill="#fff"/><path d="M31 15 L26.5 26.5 L17 33 L21.5 21.5 Z" fill="#B9C7D0"/><path d="M31 15 L26.5 26.5 L21.5 21.5 Z" fill="#E05A47"/></svg>;
/** Gota d’água (no lugar do coração): cada erro baixa a água da gota, até secar. */
const DROP='M20 2 C20 2 4 20 4 31 A16 16 0 0 0 36 31 C36 20 20 2 20 2 Z';
export const Drop=({level}:{level:number})=>{const top=48-Math.max(0,Math.min(1,level))*46;return <svg className="obj-drop" viewBox="0 0 40 50" aria-hidden="true">
 <defs><clipPath id="obj-drop-clip"><path d={DROP}/></clipPath></defs>
 <path d={DROP} fill="#E3F4FC"/>
 <g clipPath="url(#obj-drop-clip)"><rect className="obj-drop-water" x="0" y={top} width="40" height="50" fill="#1CB0F6"/><path className="obj-drop-wave" d={`M-10 ${top} q7 -4 14 0 t14 0 t14 0 t14 0 v6 h-56 Z`} fill="#58C8FA"/></g>
 <path d={DROP} fill="none" stroke="#0F8FCB" strokeWidth="2.4" strokeLinejoin="round"/>
 <ellipse cx="13" cy="27" rx="3" ry="6" fill="#fff" opacity=".7" transform="rotate(18 13 27)"/>
 {level<1&&<circle className="obj-drop-drip" cx="20" cy="47" r="3" fill="#1CB0F6"/>}
</svg>;};
const Bolt=()=><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2 L5 14 H11 L9 22 L19 9 H13 Z" fill="#FFC800"/></svg>;
const Target=()=><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="#58CC02" strokeWidth="2.6"/><circle cx="12" cy="12" r="4.5" fill="none" stroke="#58CC02" strokeWidth="2.6"/><circle cx="12" cy="12" r="1.6" fill="#58CC02"/></svg>;
const Sparkle=()=><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#CE82FF"/><path d="M12 6 L13.4 10.6 L18 12 L13.4 13.4 L12 18 L10.6 13.4 L6 12 L10.6 10.6 Z" fill="#fff"/></svg>;
const Star=({muted=false}:{muted?:boolean})=><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 L14.6 8.6 L20.6 9.3 L16.1 13.4 L17.3 19.4 L12 16.4 L6.7 19.4 L7.9 13.4 L3.4 9.3 L9.4 8.6 Z" fill={muted?'#C5CDD3':'#fff'}/></svg>;
