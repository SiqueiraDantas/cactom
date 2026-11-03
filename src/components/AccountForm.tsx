import type {FormEventHandler,Ref} from 'react';
import {AccessButton,AccessField} from './AccessControls';
import {TomInteractive} from './TomInteractive';
import {LabIcon} from './LearningHome';
import {WorkshopSummary} from './WorkshopGrid';
import {WelcomeLanguage} from './WelcomeLanguage';
import {ACCESS_COPY,accessErrorMessage,type AccessLocale} from '../lib/accessLocale';
import type {TomFocus,TomOutcome} from '../lib/tomMotion';
export type AccountFields={name:string;username:string;password:string;confirmation:string};
type Props={
 mode:'login'|'signup';locale:AccessLocale;fields:AccountFields;onField:(key:keyof AccountFields,value:string)=>void;
 busy:boolean;error:string;focus:TomFocus;outcome:TomOutcome;showPassword:boolean;onShowPassword:(value:boolean)=>void;
 onSubmit:FormEventHandler<HTMLFormElement>;onFocus:(value:TomFocus)=>void;onInvalid:()=>void;onExplore:()=>void;
 onLocale:(locale:AccessLocale)=>void;headingRef?:Ref<HTMLHeadingElement>;errorRef?:Ref<HTMLDivElement>;workshopId?:string|null;onEditWorkshop:()=>void;
};
export function AccountForm(props:Props){
 const {mode,locale,fields,busy,error,focus,outcome,showPassword}=props,t=ACCESS_COPY[locale],signup=mode==='signup';
 return <section className="access-card access-account-card" id="access-actions" aria-labelledby="access-title" tabIndex={-1}>
  <div className="access-account-tom"><TomInteractive locale={locale} focus={focus} busy={busy} outcome={outcome} showPassword={showPassword}/></div>
  <h1 id="access-title" ref={props.headingRef} tabIndex={-1}>{signup?t.signupTitle:t.loginTitle}</h1>
  {signup&&props.workshopId&&<div className="access-chosen-workshop"><WorkshopSummary id={props.workshopId} locale={locale}/><button type="button" disabled={busy} onClick={props.onEditWorkshop}>{t.changeWorkshop}</button></div>}
  {locale!=='pt-BR'&&<p className="access-language-note">{t.lessonLanguageNote}</p>}
  <form onSubmit={props.onSubmit} aria-busy={busy} aria-describedby="access-local-note"
   onFocusCapture={event=>{const input=event.target;props.onFocus(input instanceof HTMLInputElement?(input.name==='password'||input.name==='confirmation'?'password':input.name==='username'||input.name==='name'?'identity':'none'):'none');}}
   onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget as Node|null))props.onFocus('none');}}
   onInvalidCapture={props.onInvalid}>
   {signup&&<AccessField id="login-name" label={t.nameLabel} name="name" autoComplete="nickname" placeholder={t.namePlaceholder} maxLength={40} required value={fields.name} disabled={busy} onChange={e=>props.onField('name',e.target.value)}/>}
   <AccessField id="login-username" label={t.usernameLabel} name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder={t.usernamePlaceholder} minLength={3} maxLength={32} required value={fields.username} disabled={busy} onChange={e=>props.onField('username',e.target.value)}/>
   <AccessField id="login-password" label={t.passwordLabel} name="password" type={showPassword?'text':'password'} autoComplete={signup?'new-password':'current-password'} minLength={signup?8:undefined} maxLength={128} hint={signup?t.passwordHint:undefined} placeholder={signup?t.newPasswordPlaceholder:t.passwordPlaceholder} required value={fields.password} disabled={busy} onChange={e=>props.onField('password',e.target.value)}/>
   {signup&&<AccessField id="login-confirmation" label={t.confirmationLabel} name="confirmation" type={showPassword?'text':'password'} autoComplete="new-password" minLength={8} maxLength={128} placeholder={t.confirmationPlaceholder} required value={fields.confirmation} disabled={busy} onChange={e=>props.onField('confirmation',e.target.value)}/>}
   <label className="access-show-password"><input type="checkbox" checked={showPassword} disabled={busy} onChange={e=>props.onShowPassword(e.target.checked)}/> {t.showPassword}</label>
   {error&&<div className="access-error" role="alert" ref={props.errorRef} tabIndex={-1}><span aria-hidden="true">!</span><p>{accessErrorMessage(error,locale)}</p></div>}
   <AccessButton type="submit" busy={busy} busyLabel={outcome==='success'?t.success:signup?t.preparing:t.checking}>{signup?t.signupButton:t.loginButton}</AccessButton>
  </form>
  <div className="access-form-divider"><span>{t.or}</span></div>
  <button className="access-demo-link" type="button" disabled={busy} onClick={props.onExplore}>{t.explore} <LabIcon name="arrow" size={16}/></button>
  <p className="access-local-note" id="access-local-note"><LabIcon name="lock" size={14}/><span>{t.localNote}</span></p>
  <div className="access-form-language"><WelcomeLanguage locale={locale} onChange={props.onLocale} disabled={busy}/></div>
 </section>;
}
