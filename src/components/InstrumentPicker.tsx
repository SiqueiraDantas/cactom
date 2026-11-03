import {useState} from 'react';
import {availableInstrument} from '../lib/instruments';
import {readAccessLocale,saveAccessLocale,type AccessLocale} from '../lib/accessLocale';
import {WorkshopOnboarding} from './WorkshopOnboarding';
import type {AccessSession} from './LoginScreen';

/**
 * Course chooser shown after “Explorar primeiro” and when changing course.
 * It is the very same screen as “Começar agora” (WorkshopOnboarding), so both paths look identical.
 * Closing returns to the current course when there is one, otherwise to the entrance.
 */
export function InstrumentPicker({onChoose,onCancel,selectedId,onSignOut}:{access:AccessSession;onSignOut:()=>void;selectedId?:string;onChoose:(id:string)=>void;onCancel?:()=>void}){
 const [selected,setSelected]=useState<string|null>(availableInstrument(selectedId)?selectedId!:null);
 const [locale,setLocale]=useState<AccessLocale>(()=>readAccessLocale());
 const chooseLocale=(value:AccessLocale)=>{setLocale(value);saveAccessLocale(value);};
 return <div lang={locale} className="access-page access-page--onboarding instrument-picker-onboarding">
  <WorkshopOnboarding locale={locale} workshopId={selected} onPick={id=>{if(availableInstrument(id)){setSelected(id);onChoose(id);}}} onBack={onCancel??onSignOut} onLocale={chooseLocale}/>
 </div>;
}
