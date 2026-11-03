import {useEffect,useReducer,useRef,useState,type FormEvent} from 'react';
import {createLocalAccount,signInLocal,type LocalProfile} from '../lib/localAuth';
import {accessFlow,initialAccessFlow,accessWorkshopIntent,type AccessAction,type AccessFlow} from '../lib/accessFlow';
import {LabIcon} from './LearningHome';
import {CactomWordmark} from './CactomBrand';
import {AccessButton} from './AccessControls';
import {AccountForm,type AccountFields} from './AccountForm';
import {WorkshopOnboarding} from './WorkshopOnboarding';
import {WelcomePhoneScene} from './WelcomePhoneScene';
import {CactomLoader,LOADER_SRC} from './CactomLoader';
import {HelloTom,HELLO_TOM_SRC} from './HelloTom';
import {OnboardingJourney} from './OnboardingJourney';
import {playSound} from '../lib/uiSound';
import {availableInstrument} from '../lib/instruments';
import {readBrowserCourse,saveBrowserCourse} from '../lib/browserCourse';
import {preload} from 'react-dom';
import {WelcomeLanguage} from './WelcomeLanguage';
import {ACCESS_COPY,readAccessLocale,saveAccessLocale,type AccessLocale} from '../lib/accessLocale';
import type {TomFocus,TomOutcome} from '../lib/tomMotion';
import './login.css';
import './cactom-access.css';
import './welcome-ensemble.css';
import './access-account.css';

/** Tempo da tela de carregamento entre a escolha da oficina e a próxima etapa. */
export const PICK_LOADING_MS=1500;
export type AccessSession=({mode:'demo';profile:null}|{mode:'local';profile:LocalProfile})&{initialInstrumentId?:string};
/** Entry, workshop choice and existing local account; no new authentication service. */
export function LoginScreen({onEnter,start}:{onEnter:(session:AccessSession)=>void;start?:AccessFlow}){
 const [flow,dispatch]=useReducer(accessFlow,start??{...initialAccessFlow,workshopId:readBrowserCourse()}),{view,workshopId}=flow;
 /** Veio do cadastro (“Trocar”): escolher outra oficina volta direto ao cadastro. */
 const editingFromSignup=useRef(false);
 const [locale,setLocale]=useState<AccessLocale>(()=>readAccessLocale()),t=ACCESS_COPY[locale];
 const chooseLocale=(value:AccessLocale)=>{setLocale(value);saveAccessLocale(value);};
 const [fields,setFields]=useState<AccountFields>({name:'',username:'',password:'',confirmation:''});
 const [showPassword,setShowPassword]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [focus,setFocus]=useState<TomFocus>('none'),[outcome,setOutcome]=useState<TomOutcome>('idle');
 const active=useRef(true),working=useRef(false),errorRef=useRef<HTMLDivElement>(null),headingRef=useRef<HTMLHeadingElement>(null);
 const handoff=useRef<ReturnType<typeof setTimeout>|null>(null),navigationFrame=useRef<number|null>(null);
 const [picking,setPicking]=useState(false),pickTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 useEffect(()=>{active.current=true;return ()=>{active.current=false;if(handoff.current)clearTimeout(handoff.current);if(pickTimer.current)clearTimeout(pickTimer.current);if(navigationFrame.current!==null)cancelAnimationFrame(navigationFrame.current);};},[]);
 useEffect(()=>{if(error)errorRef.current?.focus({preventScroll:true});},[error]);
 useEffect(()=>{
  const previousLanguage=document.documentElement.lang,previousTitle=document.title;
  document.documentElement.lang=locale;document.title=t.pageTitle;
  return ()=>{document.documentElement.lang=previousLanguage;document.title=previousTitle;};
 },[locale,t.pageTitle]);
 const navigate=(action:AccessAction)=>{
  if(working.current)return;
  dispatch(action);setError('');setFields(current=>({...current,password:'',confirmation:''}));setShowPassword(false);setFocus('none');setOutcome('idle');
  if(navigationFrame.current!==null)cancelAnimationFrame(navigationFrame.current);
  navigationFrame.current=requestAnimationFrame(()=>{navigationFrame.current=null;window.scrollTo({top:0,behavior:'auto'});headingRef.current?.focus({preventScroll:true});});
 };
 /** Depois de escolher a oficina: Tom carregando por 1,5 s e então a próxima etapa. Toques repetidos são ignorados. */
 const pickWorkshop=(id:string)=>{
  if(pickTimer.current)return;
  if(editingFromSignup.current){editingFromSignup.current=false;saveBrowserCourse(id);dispatch({type:'choose',id});navigate({type:'signup'});return;}
  saveBrowserCourse(id);dispatch({type:'choose',id});setPicking(true);
  pickTimer.current=setTimeout(()=>{pickTimer.current=null;if(!active.current)return;setPicking(false);navigate({type:'continue'});},PICK_LOADING_MS);
 };
 const withWorkshop=(session:AccessSession):AccessSession=>{const id=accessWorkshopIntent(flow)??readBrowserCourse()??undefined;return id?{...session,initialInstrumentId:id}:session;};
 const enter=(session:AccessSession)=>{
  const destination=withWorkshop(session);setOutcome('success');setFocus('none');setShowPassword(false);setFields(current=>({...current,password:'',confirmation:''}));
  handoff.current=setTimeout(()=>{if(active.current)onEnter(destination);},650);
 };
 const explore=()=>{if(!working.current)onEnter(withWorkshop({mode:'demo',profile:null}));};
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(working.current||(view!=='login'&&view!=='signup'))return;
  working.current=true;setBusy(true);setError('');setOutcome('idle');let handingOff=false;
  try{
   const profile=view==='login'?await signInLocal(fields.username,fields.password):await createLocalAccount(fields);
   if(active.current){handingOff=true;enter({mode:'local',profile});}
  }catch(reason){if(active.current){setOutcome('error');setError(reason instanceof Error?reason.message:'Não foi possível entrar. Tente novamente.');}}
  finally{if(!handingOff){working.current=false;if(active.current)setBusy(false);}}
 };
 const isWelcome=view==='welcome',isWorkshop=view==='workshops',isForm=view==='login'||view==='signup';
 if(isWorkshop){preload(LOADER_SRC,{as:'image'});preload(HELLO_TOM_SRC,{as:'image'});}
 if(view==='journey')return <div lang={locale} className="access-page access-page--onboarding">
  <OnboardingJourney locale={locale} workshopId={workshopId} onBack={()=>navigate({type:'back'})} onDone={()=>onEnter({mode:'demo',profile:null,initialInstrumentId:availableInstrument(workshopId)?.id})}/>
 </div>;
 if(view==='hello')return <div lang={locale} className="access-page access-page--onboarding">
  <a className="access-skip" href="#access-actions">{t.skip}</a>
  <HelloTom locale={locale} onContinue={()=>navigate({type:'continue'})} headingRef={headingRef}/>
 </div>;
 if(isWorkshop)return <div lang={locale} className="access-page access-page--onboarding">
  <a className="access-skip" href="#access-actions">{t.skip}</a>
  <WorkshopOnboarding locale={locale} workshopId={workshopId} onPick={pickWorkshop} onBack={()=>navigate({type:'back'})} onLocale={chooseLocale} headingRef={headingRef}/>
  {picking&&<CactomLoader locale={locale}/>}
 </div>;
 return <div lang={locale} className={`access-page ${isWelcome?'access-page--welcome':'access-page--form access-page--account'}`}>
  <a className="access-skip" href="#access-actions">{t.skip}</a>
  {isForm?<header className="access-header access-account-header">
   <button type="button" className="access-close" disabled={busy} onClick={()=>navigate({type:'back'})} aria-label={t.back}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button>
   <CactomWordmark/>
   <AccessButton variant="secondary" className="access-header-cta" disabled={busy} onClick={()=>navigate({type:view==='login'?'start':'login'})}>{view==='login'?t.createAccount:t.signIn}</AccessButton>
  </header>:<header className="access-header">
   <div className="access-brand-group"><CactomWordmark/></div>
   <div className="access-header-actions"><WelcomeLanguage locale={locale} onChange={chooseLocale}/></div>
  </header>}
  <main className="access-layout" aria-label={isWelcome?t.welcomeLabel:view==='login'?t.loginTitle:t.signupTitle}>
   {isWelcome?<>
    <section className="access-welcome" aria-label={t.sceneLabel}><WelcomePhoneScene locale={locale}/></section>
    <section className="access-card" id="access-actions" aria-labelledby="access-title" tabIndex={-1}>
     <h1 className="access-hero-title" id="access-title" ref={headingRef} tabIndex={-1}>{t.headline} <em>{t.headlineAccent}</em></h1>
     <div className="access-hero-actions"><AccessButton onClick={()=>{playSound('pop');navigate({type:'start'});}}>{t.start} <LabIcon name="arrow" size={19}/></AccessButton><AccessButton variant="secondary" onClick={()=>{playSound('pop');navigate({type:'login'});}}>{t.existing}</AccessButton><button className="access-demo-link" type="button" onClick={()=>{playSound('pop');explore();}}>{t.explore} <span aria-hidden="true">→</span></button></div>
    </section>
   </>:<AccountForm mode={view==='signup'?'signup':'login'} locale={locale} fields={fields} onField={(key,value)=>{setFields(current=>({...current,[key]:value}));setOutcome('idle');if(error)setError('');}} busy={busy} error={error} focus={focus} outcome={outcome} showPassword={showPassword} onShowPassword={setShowPassword} onSubmit={event=>void submit(event)} onFocus={setFocus} onInvalid={()=>setOutcome('error')} onExplore={explore} onLocale={chooseLocale} headingRef={headingRef} errorRef={errorRef} workshopId={workshopId} onEditWorkshop={()=>{editingFromSignup.current=true;navigate({type:'edit-workshop'});}}/>}
  </main>
 </div>;
}
