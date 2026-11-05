import {useEffect,useMemo,useState} from 'react';
import {localRanking,sortRanking,MIN_ANSWERS_FOR_ACCURACY,type RankEntry,type RankMode,type RankingSource} from '../lib/ranking';
import {cloudEnabled,fetchRanking} from '../lib/cloud';
import './ranking.css';
import './ranking-v2.css';

const MODES:{id:RankMode;label:string}[]=[{id:'xp',label:'Pontos'},{id:'acertos',label:'Acertos'},{id:'rojao',label:'Rojão'}];
const COURSE:Record<string,string>={'iniciacao':'da iniciação musical','recorder-soprano':'da flauta doce','trumpet-bb':'do trompete','clarinet-bb':'do clarinete'};
const valueOf=(e:RankEntry,mode:RankMode)=>mode==='xp'?`${e.xp} XP`:mode==='rojao'?`${e.streak} ${e.streak===1?'dia':'dias'}`:e.answered>=MIN_ANSWERS_FOR_ACCURACY&&e.accuracy!==null?`${e.accuracy}%`:'—';
const detailOf=(e:RankEntry,mode:RankMode)=>mode==='acertos'?(e.answered>=MIN_ANSWERS_FOR_ACCURACY?`${e.correct} de ${e.answered} de primeira`:`faltam ${MIN_ANSWERS_FOR_ACCURACY-e.answered} respostas pra entrar`):`${e.lessons} ${e.lessons===1?'lição':'lições'} · ${e.accuracy??0}% de primeira`;

/** Ranking do instrumento entre quem tem login (Pontos, Acertos de primeira, Rojão). */
export function RankingBoard({instrumentId,profileId,source=localRanking}:{instrumentId:string;profileId:string|null;source?:RankingSource}){
 const [mode,setMode]=useState<RankMode>('xp'),[tick,setTick]=useState(0);
 useEffect(()=>{const on=()=>setTick(t=>t+1);window.addEventListener('storage',on);window.addEventListener('mis-practice-day',on);return ()=>{window.removeEventListener('storage',on);window.removeEventListener('mis-practice-day',on);};},[]);
 const [server,setServer]=useState<RankEntry[]|null>(null);
 useEffect(()=>{if(!cloudEnabled())return;let alive=true;const load=()=>void fetchRanking(instrumentId).then(r=>{if(alive&&r)setServer(r);});load();const id=setInterval(load,60000);return ()=>{alive=false;clearInterval(id);};},[instrumentId,tick]);
 // com servidor: todos os alunos; as contas deste aparelho entram com os números mais novos
 const list=useMemo(()=>{const local=source(instrumentId);if(!server)return sortRanking(local,mode);const byId=new Map(server.map(e=>[e.profileId,e]));for(const e of local)byId.set(e.profileId,e);return sortRanking([...byId.values()],mode);},[source,instrumentId,mode,tick,server]);
 const top=list.slice(0,3),rest=list.slice(3),mine=list.findIndex(e=>e.profileId===profileId);
 const podium=[top[1],top[0],top[2]];
 return <section className="rk" aria-labelledby="rk-title">
  <header className="rk-head"><div><span className="rk-eyebrow">RANKING {COURSE[instrumentId]?.replace(/^d[ao] /,'').toLocaleUpperCase('pt-BR')}</span><h2 id="rk-title">Quem tá no topo {COURSE[instrumentId]??''}</h2></div>
   <div className="rk-modes" role="tablist" aria-label="Ordenar ranking por">{MODES.map(m=><button key={m.id} type="button" role="tab" aria-selected={mode===m.id} className={mode===m.id?'is-on':''} onClick={()=>setMode(m.id)}>{m.label}</button>)}</div>
  </header>
  {!profileId&&<div className="rk-guest"><svg className="rk-guest-lock" viewBox="0 0 24 24" fill="none" stroke="#B37A00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg><p><b>Entre com tua conta pra aparecer no ranking.</b> Quem estuda sem login não entra na disputa.</p></div>}
  {list.length===0?<p className="rk-empty">Ninguém pontuou ainda neste instrumento. Faça uma lição e seja o primeiro, visse!</p>:<>
   <ol className="rk-podium" aria-label="Pódio">{podium.map((e,i)=>{const place=[2,1,3][i];return e?<li key={e.profileId} className={`rk-place rk-place--${place} ${e.profileId===profileId?'is-me':''}`}>
     <span className="rk-avatar" aria-hidden="true">{e.name.charAt(0).toLocaleUpperCase('pt-BR')}{place===1&&<svg className="rk-crown" viewBox="0 0 40 24" aria-hidden="true"><path d="M4 22 L8 6 L16 14 L20 2 L24 14 L32 6 L36 22 Z" fill="#FFC23D" stroke="#E5A800" strokeWidth="2" strokeLinejoin="round"/></svg>}</span>
     <b className="rk-name">{e.profileId===profileId?'Tu':e.name}</b><span className="rk-value">{valueOf(e,mode)}</span>
     <span className="rk-step"><span className="rk-medal">{place}º</span></span></li>:<li key={'vazio'+place} className={`rk-place rk-place--${place} is-empty`} aria-hidden="true"><span className="rk-step"/></li>;})}</ol>
   {rest.length>0&&<ol className="rk-list" start={4}>{rest.map((e,k)=><li key={e.profileId} className={e.profileId===profileId?'is-me':''}><span className="rk-pos">{k+4}º</span><span className="rk-avatar rk-avatar--sm" aria-hidden="true">{e.name.charAt(0).toLocaleUpperCase('pt-BR')}</span><span className="rk-who"><b>{e.profileId===profileId?'Tu':e.name}</b><small>{detailOf(e,mode)}</small></span><span className="rk-value">{valueOf(e,mode)}</span></li>)}</ol>}
   {mine>=0&&<p className="rk-me">Tu tá em <b>{mine+1}º lugar</b> {mode==='xp'?'em pontos':mode==='acertos'?'em acertos de primeira':'no rojão'}. {mine>0?`Faltam ${mode==='xp'?`${list[mine-1].xp-list[mine].xp+1} XP`:mode==='rojao'?`${list[mine-1].streak-list[mine].streak+1} dia(s)`:'alguns acertos'} pra passar ${list[mine-1].name}.`:'Segura o rojão!'}</p>}
  </>}
  <p className="rk-note">{server?'Ranking de todos os alunos do Cactom neste instrumento.':'Por enquanto o ranking junta as contas que entraram neste aparelho. Com o servidor ligado, entram todos os alunos.'}</p>
 </section>;
}
