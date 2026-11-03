import {useEffect,useId,useMemo,useRef,useState,type FormEvent} from 'react';
import {COMMUNITY_CHANNELS,MESSAGE_MAX,QUICK_MESSAGES,checkMessage,localCommunity,tomWelcome,type CommunityMessage} from '../lib/community';
import {HubHeading} from './CactomHub';
import {TomOfficial} from './CactomBrand';
import {GuestProfileCard} from './AccountActions';
import './community.css';

/** Aba Comunidade: salas por instrumento + sala geral, com regras de segurança para crianças. */
export function CommunityHub({instrumentId,profile}:{instrumentId:string;profile:{id:string;name:string}|null}){
 const transport=useMemo(()=>localCommunity(),[]);
 const [channel,setChannel]=useState(()=>COMMUNITY_CHANNELS.some(c=>c.id===instrumentId)?instrumentId:'geral');
 const [messages,setMessages]=useState<CommunityMessage[]>(()=>transport.history(channel));
 const [hidden,setHidden]=useState<string[]>(()=>transport.hidden());
 const [draft,setDraft]=useState(''),[error,setError]=useState('');
 const listRef=useRef<HTMLOListElement>(null),id=useId();
 const room=COMMUNITY_CHANNELS.find(c=>c.id===channel)!;
 useEffect(()=>{setMessages(transport.history(channel));setError('');},[channel,transport]);
 useEffect(()=>transport.subscribe(m=>{if(m.channel===channel)setMessages(list=>list.some(x=>x.id===m.id)?list:[...list,m]);}),[channel,transport]);
 useEffect(()=>{const el=listRef.current;if(el)el.scrollTop=el.scrollHeight;},[messages,channel]);
 const send=(text:string)=>{
  if(!profile)return;
  const checked=checkMessage(text);if(!checked.ok){setError(checked.reason);return;}
  const m=transport.send({channel,authorId:profile.id,author:profile.name,text:checked.text});
  setMessages(list=>[...list,m]);setDraft('');setError('');
 };
 const submit=(e:FormEvent)=>{e.preventDefault();send(draft);};
 const visible=[tomWelcome(room),...messages.filter(m=>!hidden.includes(m.id))];
 const time=(at:string)=>at?new Date(at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'';
 return <div className="practice-hub course-hub community-hub">
  <HubHeading icon="hand" eyebrow="COMUNIDADE CACTOM" title="Bora" accent="prosear." intro="Converse com quem também tá aprendendo música."/>
  <p className="cm-preview" role="note"><b>Prévia:</b> por enquanto as conversas ficam só neste aparelho. Quando o servidor do chat for ligado, tu conversa com gente de todo canto.</p>
  <div className="cm-layout">
   <nav className="cm-rooms" aria-label="Salas da comunidade">{COMMUNITY_CHANNELS.map(c=><button key={c.id} type="button" className={`cm-room ${c.id===channel?'is-on':''}`} aria-current={c.id===channel?'true':undefined} onClick={()=>setChannel(c.id)}><span className="cm-room-hash" aria-hidden="true">#</span><span><b>{c.name}</b><small>{c.id===instrumentId?'Teu curso':c.id==='geral'?'Todo mundo':c.topic}</small></span></button>)}</nav>
   <section className="cm-chat" aria-labelledby={id+'-room'}>
    <header className="cm-chat-head"><h2 id={id+'-room'}># {room.name}</h2><span>{room.topic}</span></header>
    <ol className="cm-messages" ref={listRef} aria-live="polite">{visible.map(m=>{const mine=!!profile&&m.authorId===profile.id;
     return <li key={m.id} className={`cm-msg ${m.tom?'is-tom':''} ${mine?'is-mine':''}`}>
      {m.tom?<span className="cm-avatar cm-avatar--tom"><TomOfficial decorative expression="feliz"/></span>:<span className="cm-avatar" aria-hidden="true">{m.author.slice(0,1).toLocaleUpperCase('pt-BR')}</span>}
      <div className="cm-bubble"><p className="cm-meta"><b>{mine?'Tu':m.author}</b>{m.at&&<time dateTime={m.at}>{time(m.at)}</time>}</p><p className="cm-text">{m.text}</p>
       {!m.tom&&!mine&&<button type="button" className="cm-hide" onClick={()=>{transport.hide(m.id);setHidden(h=>[...h,m.id]);}}>Esconder</button>}</div>
     </li>;})}</ol>
    {profile?<form className="cm-form" onSubmit={submit}>
     <div className="cm-quick" role="group" aria-label="Mensagens rápidas">{QUICK_MESSAGES.map(q=><button key={q} type="button" onClick={()=>send(q)}>{q}</button>)}</div>
     {error&&<p className="cm-error" role="alert">{error}</p>}
     <div className="cm-input"><label className="cm-sr" htmlFor={id+'-text'}>Mensagem para {room.name}</label>
      <input id={id+'-text'} value={draft} maxLength={MESSAGE_MAX} placeholder={`Escreve pra sala ${room.name}…`} autoComplete="off" onChange={e=>{setDraft(e.target.value);if(error)setError('');}}/>
      <button type="submit" disabled={!draft.trim()}>Enviar</button></div>
     <small className="cm-rules">Nada de telefone, endereço, rede social ou link. Nunca marque encontro com quem tu não conhece.</small>
    </form>:<div className="cm-guest"><p>Pra conversar na comunidade, crie teu perfil. Visitante só pode ler.</p><GuestProfileCard/></div>}
   </section>
  </div>
 </div>;
}
