import {useEffect,type Ref} from 'react';
import {ACCESS_COPY,type AccessLocale} from '../lib/accessLocale';
import {AccessButton} from './AccessControls';
import {playSound} from '../lib/uiSound';
import './hello-tom.css';

/** Tom acenando (SVG + CSS em public/animacoes, mesmo personagem da ficha oficial). */
export const HELLO_TOM_SRC='/animacoes/cactom-acenando.svg';
/** Depois da escolha da oficina: o Tom se apresenta, e CONTINUAR leva ao cadastro. */
export function HelloTom({locale,onContinue,headingRef}:{locale:AccessLocale;onContinue:()=>void;headingRef?:Ref<HTMLHeadingElement>}){
 const t=ACCESS_COPY[locale];
 useEffect(()=>{const timer=setTimeout(()=>playSound('chegou'),350);return ()=>clearTimeout(timer);},[]);
 return <div className="hello-tom">
  <main className="hello-tom-main" id="access-actions">
   <h1 className="hello-tom-bubble" id="access-title" ref={headingRef} tabIndex={-1}>{t.helloTom}</h1>
   <img className="hello-tom-art" src={HELLO_TOM_SRC} alt={t.helloTomAlt} width={400} height={420} decoding="async"/>
  </main>
  <footer className="hello-tom-footer"><div className="hello-tom-footer-inner"><AccessButton className="hello-tom-continue" onClick={()=>{playSound('pop');onContinue();}}>{t.continue}</AccessButton></div></footer>
 </div>;
}
