import {useEffect,useState} from 'react';
import {canPrompt,dismissInstall,installDismissed,isIosSafari,isStandalone,onInstallChange,promptInstall} from '../lib/pwa';
import {TomOfficial} from './CactomBrand';
import './install-app.css';

/** Faixa "Instalar o Cactom": aparece quando o navegador deixa instalar (ou no iPhone, com o passo a passo). */
export function InstallApp(){
 const [, setTick]=useState(0),[hidden,setHidden]=useState(()=>isStandalone()||installDismissed()),[ios]=useState(()=>isIosSafari()),[help,setHelp]=useState(false);
 useEffect(()=>onInstallChange(()=>setTick(n=>n+1)),[]);
 if(hidden||(!canPrompt()&&!ios))return null;
 const close=()=>{dismissInstall();setHidden(true);};
 return <aside className="install-app" aria-label="Instalar o Cactom">
  <span className="install-app-tom" aria-hidden="true"><TomOfficial decorative expression="animado"/></span>
  <div className="install-app-copy">
   <b>Instale o Cactom no celular</b>
   {help&&ios?<p>Toque em <b>Compartilhar</b> <span aria-hidden="true">(o quadrado com a seta)</span> e depois em <b>Adicionar à Tela de Início</b>.</p>:<p>Abre direto da tela inicial, em tela cheia e mais rápido.</p>}
  </div>
  <div className="install-app-actions">
   {ios?<button type="button" className="install-app-go" onClick={()=>setHelp(true)} disabled={help}>Como instalar</button>
    :<button type="button" className="install-app-go" onClick={async()=>{const ok=await promptInstall();if(ok)setHidden(true);}}>Instalar</button>}
   <button type="button" className="install-app-close" onClick={close} aria-label="Agora não">Agora não</button>
  </div>
 </aside>;
}
