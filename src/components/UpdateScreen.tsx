import {useEffect,useRef,useState} from 'react';
import {onInstallChange,updateAvailable} from '../lib/pwa';
import {TomOfficial} from './CactomBrand';
import './update-screen.css';

type News={versao?:string;titulo?:string;itens?:{icone?:string;texto:string}[]};
const FALLBACK:News={titulo:'Tem novidade no Cactom!',itens:[{icone:'✨',texto:'Melhorias e correções pra tua prática ficar ainda melhor.'}]};

/**
 * Tela de atualização: aparece quando sai uma versão nova com o app aberto.
 * Mostra o que mudou (public/novidades.json, editado a cada versão) e atualiza com um toque.
 * "Depois" deixa terminar a lição; a atualização entra na próxima vez que abrir o app.
 */
export function UpdateScreen(){
 const [show,setShow]=useState(updateAvailable()),[later,setLater]=useState(false),[news,setNews]=useState<News|null>(null),[busy,setBusy]=useState(false);
 const goRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>onInstallChange(()=>setShow(updateAvailable())),[]);
 useEffect(()=>{
  if(!show||news)return;
  fetch('/novidades.json',{cache:'no-store'}).then(r=>r.ok?r.json():FALLBACK).then((n:News)=>setNews(n?.itens?.length?n:FALLBACK)).catch(()=>setNews(FALLBACK));
 },[show,news]);
 useEffect(()=>{if(show&&!later)goRef.current?.focus();},[show,later]);
 if(!show||later)return null;
 const n=news??FALLBACK;
 const update=()=>{setBusy(true);setTimeout(()=>window.location.reload(),450);};
 return <div className="upd" role="dialog" aria-modal="true" aria-labelledby="upd-title">
  <div className="upd-card">
   <span className="upd-badge">Versão nova{n.versao?` · ${n.versao.split('.').reverse().join('/')}`:''}</span>
   <span className="upd-tom" aria-hidden="true"><TomOfficial decorative expression="comemorando"/></span>
   <h1 id="upd-title">{n.titulo??FALLBACK.titulo}</h1>
   <ul className="upd-list">{(n.itens??[]).slice(0,5).map((it,k)=><li key={k}><span aria-hidden="true">{it.icone??'✨'}</span><p>{it.texto}</p></li>)}</ul>
   <button ref={goRef} type="button" className="upd-go" onClick={update} disabled={busy}>{busy?<><i className="upd-spin" aria-hidden="true"/>Atualizando…</>:'Atualizar agora'}</button>
   <button type="button" className="upd-later" onClick={()=>setLater(true)} disabled={busy}>Depois, quero terminar o que estou fazendo</button>
   <small>Teu progresso fica salvo. Leva só um segundinho.</small>
  </div>
 </div>;
}
