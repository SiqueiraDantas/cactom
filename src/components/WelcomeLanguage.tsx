import {useId} from 'react';
import {ACCESS_COPY,ACCESS_LOCALES,LANGUAGE_NAMES,type AccessLocale} from '../lib/accessLocale';

export function WelcomeLanguage({locale,onChange,disabled=false}:{locale:AccessLocale;onChange:(locale:AccessLocale)=>void;disabled?:boolean}){
 const id='access-language-'+useId(),t=ACCESS_COPY[locale];
 return <label className="access-language" htmlFor={id}>
  <svg className="access-language-globe" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5 7h14M5 17h14"/></svg>
  <span>{t.languagePrefix}:</span>
  <select id={id} aria-label={t.languageLabel} value={locale} disabled={disabled} onChange={event=>{const value=event.target.value as AccessLocale;if(ACCESS_LOCALES.includes(value))onChange(value);}}>
   {ACCESS_LOCALES.map(value=><option key={value} value={value} lang={value}>{LANGUAGE_NAMES[value]}</option>)}
  </select>
  <svg className="access-language-chevron" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 6 4 4 4-4"/></svg>
 </label>;
}
