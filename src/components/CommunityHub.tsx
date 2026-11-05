import {useEffect,useId,useMemo,useRef,useState,type FormEvent} from 'react';
import {MESSAGE_MAX,QUICK_MESSAGES,STICKERS,STICKER_LABEL,checkMessage,localCommunity,roomsFor,stickerOf,tomWelcome,type CommunityMessage} from '../lib/community';
import {localRanking} from '../lib/ranking';
import {cloudEnabled} from '../lib/cloud';
import {chatConsented,fetchChat,joinChat,reportChat,sendChat,type JoinResult} from '../lib/communityCloud';
import {TomOfficial} from './CactomBrand';
import {InstrumentTile} from './InstrumentTile';
import {GuestProfileCard} from './AccountActions';
import type {TomExpression} from './CactomTomArt';
import './community.css';

const COLORS=['#1cb0f6','#ff9600','#a96ddb','#ff4b4b','#2bb5a0','#e85d9a','#6a7cff','#d4a000'];
const colorOf=(id:string)=>{let h=0;for(const c of id)h=(h*31+c.charCodeAt(0))>>>0;return COLORS[h%COLORS.length];};
const dayLabel=(iso:string)=>{const d=new Date(iso),today=new Date(),y=new Date(Date.now()-864e5);const same=(a:Date,b:Date)=>a.toDateString()===b.toDateString();return same(d,today)?'Hoje':same(d,y)?'Ontem':d.toLocaleDateString('pt-BR',{day:'2-digit',month:'long'});};
const CLAN_TITLE:Record<string,string>={geral:'Geral do Cactom',iniciacao:'Turma da Iniciação','recorder-soprano':'Turma da Flauta','trumpet-bb':'Turma do Trompete','clarinet-bb':'Turma do Clarinete'};
const time=(at:string)=>at?new Date(at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}):'';

/** Selo do jogador (escudo com a inicial e a cor dele). */
function Badge({name,id,tom=false}:{name:string;id:string;tom?:boolean}){
 if(tom)return <span className="cm-badge cm-badge--tom" aria-hidden="true"><TomOfficial decorative expression="feliz"/></span>;
 return <span className="cm-badge" style={{'--c':colorOf(id)} as React.CSSProperties} aria-hidden="true"><svg viewBox="0 0 40 46"><path d="M20 2 37 8v14c0 11-7.5 18.5-17 22C10.5 40.5 3 33 3 22V8z"/></svg><b>{name.slice(0,1).toLocaleUpperCase('pt-BR')}</b></span>;
}

/** Aba Comunidade, no jeito de chat de turma: a sala Geral e a do teu curso, figurinhas do Tom, XP de cada um. */
type Store=Pick<Storage,'getItem'|'setItem'>;
const POLL_MS=4000;

/** Tela para o responsável autorizar o chat (LGPD, art. 14). */
function GuardianGate({name,onAuthorize}:{name:string;onAuthorize:(g:{name:string;birthYear:number})=>Promise<JoinResult>}){
 const [guardian,setGuardian]=useState(''),[year,setYear]=useState(''),[ok,setOk]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const id=useId(),now=new Date().getFullYear();
 const submit=async(e:FormEvent)=>{e.preventDefault();setError('');
  const y=Number(year);if(guardian.trim().length<2){setError('Escreva o nome do responsável.');return;}
  if(!Number.isInteger(y)||y<now-100||y>now-18){setError('Quem autoriza precisa ser maior de 18 anos.');return;}
  setBusy(true);const r=await onAuthorize({name:guardian.trim(),birthYear:y});setBusy(false);
  if(r==='responsavel')setError('Quem autoriza precisa ser maior de 18 anos.');
  else if(r==='offline')setError('Sem conexão com o servidor. Confira a internet e tente de novo.');
  else if(r==='outro-aparelho')setError('Esse perfil já entrou no chat em outro aparelho.');
  else if(r!=='ok')setError('Não deu pra liberar o chat deste perfil.');};
 return <form className="cm-gate" onSubmit={submit} aria-labelledby={id+'-t'}>
  <span className="cm-gate-tom" aria-hidden="true"><TomOfficial decorative expression="privacidade"/></span>
  <div className="cm-gate-copy">
   <span className="cm-crest-kicker">PARA O RESPONSÁVEL</span>
   <h2 id={id+'-t'}>Liberar o chat da turma para {name}?</h2>
   <ul>
    <li>No chat, {name} conversa com outras crianças que estudam no Cactom: na sala Geral e na turma do instrumento.</li>
    <li>Aparece só o primeiro nome. O app bloqueia telefone, e-mail, endereço, rede social, link e palavrão.</li>
    <li>Qualquer criança pode esconder e denunciar uma mensagem. A equipe do Cactom revê as denúncias e pode bloquear perfis.</li>
    <li>Guardamos as mensagens, o primeiro nome do responsável e o ano de nascimento dele, só para cuidar da segurança do chat.</li>
   </ul>
   <div className="cm-gate-fields">
    <label>Nome do responsável<input value={guardian} maxLength={60} autoComplete="name" onChange={e=>setGuardian(e.target.value)}/></label>
    <label>Ano de nascimento do responsável<input value={year} inputMode="numeric" maxLength={4} placeholder="ex.: 1985" onChange={e=>setYear(e.target.value.replace(/\D/g,''))}/></label>
   </div>
   <label className="cm-gate-check"><input type="checkbox" checked={ok} onChange={e=>setOk(e.target.checked)}/>Sou mãe, pai ou responsável por {name} e autorizo o uso do chat.</label>
   {error&&<p className="cm-error" role="alert">{error}</p>}
   <button type="submit" className="cm-send cm-gate-go" disabled={!ok||busy}>{busy?'Liberando…':'Autorizar e entrar'}</button>
  </div>
 </form>;
}

export function CommunityHub({instrumentId,profile,storage}:{instrumentId:string;profile:{id:string;name:string}|null;storage?:Store}){
 const online=cloudEnabled()&&!!profile&&!!storage;
 const [consented,setConsented]=useState(()=>!!storage&&chatConsented(storage));
 const [status,setStatus]=useState<JoinResult|'idle'>('idle');
 const transport=useMemo(()=>localCommunity(),[]);
 const rooms=useMemo(()=>roomsFor(instrumentId),[instrumentId]);
 const [channel,setChannel]=useState(()=>rooms.some(c=>c.id===instrumentId)?instrumentId:'geral');
 const [messages,setMessages]=useState<CommunityMessage[]>(()=>online?[]:transport.history(channel));
 const [hidden,setHidden]=useState<string[]>(()=>transport.hidden());
 const [draft,setDraft]=useState(''),[error,setError]=useState(''),[stickers,setStickers]=useState(false);
 const listRef=useRef<HTMLOListElement>(null),id=useId();
 const room=rooms.find(c=>c.id===channel)??rooms[0];
 const ready=online&&consented&&status==='ok';
 // entra no chat (atualiza a turma do perfil) sempre que abrir a aba
 useEffect(()=>{if(!online||!consented||!profile||!storage)return;let live=true;void joinChat(profile,instrumentId,storage).then(r=>{if(live)setStatus(r);});return ()=>{live=false;};},[online,consented,profile?.id,instrumentId]);
 // local (sem servidor)
 useEffect(()=>{if(online)return;setMessages(transport.history(channel));setError('');},[channel,transport,online]);
 useEffect(()=>online?undefined:transport.subscribe(m=>{if(m.channel===channel)setMessages(list=>list.some(x=>x.id===m.id)?list:[...list,m]);}),[channel,transport,online]);
 // online: busca a sala e depois só as novas, a cada poucos segundos enquanto a aba está aberta
 useEffect(()=>{
  if(!ready||!profile||!storage)return;let live=true,last:string|undefined,timer:ReturnType<typeof setTimeout>|undefined;
  setMessages([]);setError('');
  const tick=async()=>{
   if(document.visibilityState==='visible'){
    const got=await fetchChat(profile,channel,storage,last);
    if(!live)return;
    if(got){const first=last===undefined;if(got.length)last=got[got.length-1].at;setMessages(list=>first?got:[...list,...got.filter(m=>!list.some(x=>x.id===m.id))]);}
   }
   if(live)timer=setTimeout(()=>void tick(),POLL_MS);
  };
  void tick();
  return ()=>{live=false;if(timer)clearTimeout(timer);};
 },[ready,channel,profile?.id]);
 useEffect(()=>{const el=listRef.current;if(el)el.scrollTop=el.scrollHeight;},[messages,channel]);
 // XP de cada conta deste aparelho no instrumento da sala (na Geral, o maior entre os cursos)
 const xp=useMemo(()=>{const map=new Map<string,number>();const ids=room.id==='geral'?['iniciacao','recorder-soprano','trumpet-bb','clarinet-bb']:[room.id];
  for(const i of ids)for(const e of localRanking(i))map.set(e.profileId,Math.max(map.get(e.profileId)??0,e.xp));return map;},[room.id,messages.length]);
 const [sending,setSending]=useState(false);
 const send=async(text:string)=>{
  if(!profile||sending)return;
  const checked=checkMessage(text);if(!checked.ok){setError(checked.reason);return;}
  if(ready&&storage){
   setSending(true);const r=await sendChat(profile,channel,checked.text,storage);setSending(false);
   if(!r.ok){setError(r.reason);return;}
   setMessages(list=>list.some(x=>x.id===r.message.id)?list:[...list,r.message]);
  }else{
   const m=transport.send({channel,authorId:profile.id,author:profile.name.split(/\s+/)[0]||profile.name,text:checked.text});
   setMessages(list=>[...list,m]);
  }
  setDraft('');setError('');setStickers(false);
 };
 const hide=(mid:string)=>{transport.hide(mid);setHidden(h=>[...h,mid]);if(ready&&profile&&storage)void reportChat(profile,mid,storage);};
 const submit=(e:FormEvent)=>{e.preventDefault();void send(draft);};
 const visible=[tomWelcome(room),...messages.filter(m=>!hidden.includes(m.id))];
 const members=new Set(messages.map(m=>m.authorId)).size+(profile&&!messages.some(m=>m.authorId===profile.id)?1:0);
 const today=messages.filter(m=>m.at&&new Date(m.at).toDateString()===new Date().toDateString()).length;
 let lastDay='';
 return <div className="cm-clan">
  <header className="cm-crest">
   <div className="cm-crest-shield" aria-hidden="true">{room.id==='geral'?<TomOfficial decorative expression="animado"/>:<InstrumentTile instrument={room.id}/>}</div>
   <div className="cm-crest-copy"><span className="cm-crest-kicker">COMUNIDADE CACTOM</span><h1>{CLAN_TITLE[room.id]??room.name}</h1><p>{room.topic}</p></div>
   <dl className="cm-crest-stats"><div><dt>Membros</dt><dd>{members}</dd></div><div><dt>Mensagens hoje</dt><dd>{today}</dd></div></dl>
  </header>
  <nav className="cm-tabs" aria-label="Salas">{rooms.map(c=><button key={c.id} type="button" className={c.id===channel?'is-on':''} aria-current={c.id===channel?'page':undefined} onClick={()=>setChannel(c.id)}>
   <span className="cm-tab-icon" aria-hidden="true">{c.id==='geral'?<TomOfficial decorative expression="feliz"/>:<InstrumentTile instrument={c.id}/>}</span><span><b>{c.id==='geral'?'Geral':c.name}</b><small>{c.id==='geral'?'Todo mundo do Cactom':'Quem estuda o teu instrumento'}</small></span></button>)}</nav>
  {online&&!consented&&profile&&<GuardianGate name={profile.name.split(/\s+/)[0]||profile.name} onAuthorize={async g=>{const r=await joinChat(profile,instrumentId,storage!,g);if(r==='ok'){setConsented(true);setStatus('ok');}return r;}}/>}
  {online&&consented&&status!=='ok'&&status!=='idle'&&<p className="cm-status" role="status">{status==='offline'?'Sem conexão com o servidor agora. Confira a internet.':status==='outro-aparelho'?'Esse perfil já entrou no chat em outro aparelho. Use o chat por lá.':status==='bloqueado'?'O chat deste perfil foi pausado pela equipe do Cactom.':'Não deu pra entrar no chat agora.'}</p>}
  {!(online&&!consented)&&<section className="cm-hall" aria-labelledby={id+'-room'}>
   <h2 id={id+'-room'} className="cm-sr">Conversa da sala {room.name}</h2>
   <ol className="cm-feed" ref={listRef} aria-live="polite">{visible.map(m=>{
    const mine=!!profile&&m.authorId===profile.id,sticker=stickerOf(m.text),day=m.at?dayLabel(m.at):'';
    const sep=day&&day!==lastDay?(lastDay=day,<li key={'d'+m.id} className="cm-day"><span>{day}</span></li>):null;
    return [sep,<li key={m.id} className={`cm-row ${m.tom?'is-tom':''} ${mine?'is-mine':''}`}>
     {!mine&&<Badge name={m.author} id={m.authorId} tom={m.tom}/>}
     <div className="cm-card">
      <p className="cm-who"><b style={m.tom?undefined:{color:colorOf(m.authorId)}}>{mine?'Tu':m.author}</b>{m.tom&&<span className="cm-role">👑 Líder</span>}{!m.tom&&xp.get(m.authorId)!==undefined&&<span className="cm-xp" title="XP de prática">🏆 {xp.get(m.authorId)}</span>}{m.at&&<time dateTime={m.at}>{time(m.at)}</time>}</p>
      {sticker?<span className="cm-sticker" role="img" aria-label={STICKER_LABEL[sticker]}><TomOfficial decorative expression={sticker.replace('tom-','') as TomExpression}/></span>:<p className="cm-text">{m.text}</p>}
      {!m.tom&&!mine&&<button type="button" className="cm-hide" onClick={()=>hide(m.id)}>Esconder</button>}
     </div>
     {mine&&<Badge name={m.author} id={m.authorId}/>}
    </li>];})}</ol>
   {profile?<form className="cm-dock" onSubmit={submit}>
    {stickers&&<div className="cm-stickers" role="group" aria-label="Figurinhas do Tom">{STICKERS.map(s=><button key={s} type="button" aria-label={`Mandar figurinha: ${STICKER_LABEL[s]}`} onClick={()=>void send(`:${s}:`)}><TomOfficial decorative expression={s.replace('tom-','') as TomExpression}/></button>)}</div>}
    <div className="cm-chips" role="group" aria-label="Mensagens rápidas">{QUICK_MESSAGES.map(q=><button key={q} type="button" onClick={()=>void send(q)}>{q}</button>)}</div>
    {error&&<p className="cm-error" role="alert">{error}</p>}
    <div className="cm-bar">
     <button type="button" className={`cm-emote ${stickers?'is-on':''}`} aria-pressed={stickers} aria-label="Figurinhas do Tom" onClick={()=>setStickers(v=>!v)}><TomOfficial decorative expression="feliz"/></button>
     <label className="cm-sr" htmlFor={id+'-text'}>Mensagem para {room.name}</label>
     <input id={id+'-text'} value={draft} maxLength={MESSAGE_MAX} placeholder={room.id==='geral'?'Fala com a galera do Cactom…':`Fala com a ${CLAN_TITLE[room.id]??room.name}…`} autoComplete="off" onChange={e=>{setDraft(e.target.value);if(error)setError('');}}/>
     <button type="submit" className="cm-send" disabled={!draft.trim()||sending}>Enviar</button>
    </div>
    <small className="cm-rules">🛡️ Nada de telefone, endereço, rede social ou link. Nunca marque encontro com quem tu não conhece. {ready?'Esconder também avisa a equipe do Cactom.':'Por enquanto as conversas ficam só neste aparelho.'}</small>
   </form>:<div className="cm-guest"><p>Pra conversar na turma, crie teu perfil. Visitante só pode ler.</p><GuestProfileCard/></div>}
  </section>}
 </div>;
}
