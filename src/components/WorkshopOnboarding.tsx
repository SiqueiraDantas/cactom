import type {Ref} from 'react';
import {INSTRUMENTS} from '../lib/instruments';
import {ACCESS_COPY,type AccessLocale} from '../lib/accessLocale';
import {CactomWordmark} from './CactomBrand';
import {InstrumentTile} from './InstrumentTile';
import {WelcomeLanguage} from './WelcomeLanguage';
import {workshopText} from './WorkshopGrid';
import {playSound} from '../lib/uiSound';
import './workshop-onboarding.css';
import './workshop-pick.css';

type Props={locale:AccessLocale;workshopId:string|null;onPick:(id:string)=>void;onBack:()=>void;onLocale:(locale:AccessLocale)=>void;headingRef?:Ref<HTMLHeadingElement>};
/** Ordem de exibição: o curso principal primeiro. Só cursos disponíveis aparecem. */
const ORDER=['recorder-soprano','trumpet-bb','clarinet-bb','conductor'];
/**
 * “Começar agora” no formato da escolha de idioma do Duolingo: “Eu quero aprender…” e um
 * cartão por curso disponível. Um toque escolhe o curso e segue direto para o cadastro.
 */
export function WorkshopOnboarding({locale,workshopId,onPick,onBack,onLocale,headingRef}:Props){
 const t=ACCESS_COPY[locale];
 const courses=INSTRUMENTS.filter(item=>item.available).sort((a,b)=>(ORDER.indexOf(a.id)+99)%99-(ORDER.indexOf(b.id)+99)%99);
 return <div className="wsp">
  <header className="wsp-top">
   <button type="button" className="wsp-home" onClick={()=>{playSound('tap');onBack();}} aria-label={t.back}><CactomWordmark/></button>
   <WelcomeLanguage locale={locale} onChange={onLocale}/>
  </header>
  <main className="wsp-main" id="access-actions">
   <h1 className="wsp-title" id="access-title" ref={headingRef} tabIndex={-1}>{t.workshopsTitle}</h1>
   <ul className="wsp-grid" aria-label={t.chooseWorkshop}>
    {courses.map(item=>{const name=workshopText(item,locale).name;
     return <li key={item.id}><button type="button" className={`wsp-card${workshopId===item.id?' is-selected':''}`} aria-label={`${t.choose} ${name}`} onClick={()=>{playSound('tap');onPick(item.id);}}>
      <InstrumentTile instrument={item.id}/><strong>{name}</strong>
     </button></li>;})}
   </ul>
  </main>
 </div>;
}
