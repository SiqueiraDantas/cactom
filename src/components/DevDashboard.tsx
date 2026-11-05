import {useEffect,useMemo,useState,type CSSProperties} from 'react';
import {readEvents,clearEvents,TELEMETRY_EVENT,TELEMETRY_KEY,type TelemetryEvent} from '../lib/devEvents';
import {devStats,type DevUser} from '../lib/devStats';
import {listLocalProfiles} from '../lib/localAuth';
import {entryFor} from '../lib/ranking';
import {createProfileStorage} from '../lib/profileStorage';
import {readStreak,streakSummary} from '../lib/streak';
import {COURSE_TASKS} from '../lib/recorderFullCourse';
import {bandLessonName,isBand} from '../lib/bandTrail';
import {CactomWordmark} from './CactomBrand';
import {blockProfile,deleteMessage,fetchModeration,setHidden,type ModRow} from '../lib/communityCloud';
import {cloudEnabled,cloudStatus,devSession,devSignIn,devSignOut,fetchServerEvents,fetchRanking,clearServerEvents,flushEvents} from '../lib/cloud';
import './dev-dashboard.css';

/** O painel só abre no computador de quem desenvolve (npm run dev ou rede local). Publicado na internet, fica fechado até haver login de desenvolvedor no servidor. */
export function devAllowed(){
 if(cloudEnabled())return true; // com servidor, quem protege é o login do desenvolvedor + regras do banco
 try{if(import.meta.env?.DEV)return true;}catch{/* fora do Vite */}
 const h=globalThis.location?.hostname??'';
 return h==='localhost'||h.endsWith('.local')||/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[?::1\]?$)/.test(h);
}
const INSTR:Record<string,string>={'iniciacao':'Iniciação','recorder-soprano':'Flauta doce','trumpet-bb':'Trompete','clarinet-bb':'Clarinete'};
const TYPE:Record<string,string>={app_open:'Abriu o app',login:'Entrou',signup:'Criou conta',demo:'Entrou como visitante',logout:'Saiu',course:'Escolheu curso',tab:'Abriu aba',lesson_start:'Começou lição',lesson_complete:'Concluiu lição',answer:'Respondeu',mic:'Microfone',score_import:'Enviou partitura',error:'Erro',restored:'Voltou ao app (já logado)'};
const TAB:Record<string,string>={learn:'Aprender',scores:'Partituras',streak:'Rojão',achievements:'Conquistas',progress:'Progresso',community:'Comunidade'};
const when=(iso:string|null)=>iso?new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
const ms=(n:number|null)=>n===null?'—':n>=1000?`${(n/1000).toFixed(1).replace('.',',')} s`:`${n} ms`;
const LESSON_NAME=new Map(COURSE_TASKS.map(t=>[t.lesson,t.lessonName]));
function lessonLabel(id:string){
 const band=/^(TPT|CLA|INI)-/.exec(id);if(band){const i=band[1]==='TPT'?'trumpet-bb':band[1]==='INI'?'iniciacao':'clarinet-bb';const m=/M(\d\d)-L(\d)/.exec(id);return `${INSTR[i]} · ${m?`Unidade ${Number(m[1])}, `:''}${bandLessonName(i,id)}`;}
 const m=/^S\d-M(\d\d)-L0(\d)/.exec(id);return m?`Flauta · Unidade ${Number(m[1])}, ${LESSON_NAME.get(id)??`lição ${m[2]}`}`:id;
}
function users():DevUser[]{
 return listLocalProfiles().map(p=>{let streak=0;try{streak=streakSummary(readStreak(createProfileStorage(p.id))).currentStreak;}catch{/* nada */}
  return {id:p.id,name:p.name,username:p.username,createdAt:p.createdAt,streak,instruments:['iniciacao','recorder-soprano','trumpet-bb','clarinet-bb'].map(id=>{const e=entryFor(p,id);return e?{id,xp:e.xp,lessons:e.lessons,accuracy:e.accuracy}:null;}).filter((x):x is DevUser['instruments'][number]=>!!x)};});
}
function describe(e:TelemetryEvent){
 const d=e.data??{};
 switch(e.type){
  case 'app_open':return `${d.device??''} · ${d.browser??''} · carregou em ${ms(typeof d.load==='number'?Math.round(d.load):null)}`;
  case 'course':return INSTR[String(d.instrument)]??String(d.instrument??'');
  case 'tab':return TAB[String(d.tab)]??String(d.tab??'');
  case 'lesson_start':return lessonLabel(String(d.lesson??''))+(d.review?' (revisão)':'');
  case 'lesson_complete':return `${lessonLabel(String(d.lesson??''))} · ${d.correctFirst}/${d.total} de primeira · +${d.xp} XP`;
  case 'answer':return `${d.skipped?'Pulou':d.ok?'Acertou':'Errou'}${d.retry?' (2ª vez)':''}: ${d.instruction??d.exercise}`;
  case 'mic':return d.ok?'abriu':`falhou${d.error?`: ${d.error}`:''}`;
  case 'score_import':return `PDF com ${d.notes} notas`;
  case 'error':return `${d.message} (${d.source})`;
  default:return d.username?`@${d.username}`:'';
 }
}
function Bars<T extends {day:string}>({title,data,value,format=(n:number)=>String(n),note}:{title:string;data:T[];value:(d:T)=>number|null;format?:(n:number)=>string;note?:string}){
 const vals=data.map(d=>value(d)??0),max=Math.max(1,...vals),W=560,H=150,bw=W/data.length;
 return <figure className="dd-chart"><figcaption><b>{title}</b>{note&&<small>{note}</small>}</figcaption>
  <svg viewBox={`0 0 ${W} ${H+26}`} role="img" aria-label={`${title}: ${data.map((d,i)=>`${d.day.slice(8,10)}/${d.day.slice(5,7)} ${format(vals[i])}`).join(', ')}`}>
   <line x1="0" x2={W} y1={H} y2={H} className="dd-axis"/>
   {data.map((d,i)=>{const h=vals[i]/max*(H-22),x=i*bw+bw*.18,w=bw*.64;return <g key={d.day} className="dd-bar">
    <rect x={i*bw} y="0" width={bw} height={H+26} fill="transparent"><title>{`${d.day.slice(8,10)}/${d.day.slice(5,7)}: ${format(vals[i])}`}</title></rect>
    {vals[i]>0&&<path d={`M${x} ${H}V${H-h+4}q0-4 4-4h${w-8}q4 0 4 4V${H}z`}/>}
    {vals[i]>0&&(vals[i]===max||i===data.length-1)&&<text x={x+w/2} y={H-h-6} textAnchor="middle" className="dd-val">{format(vals[i])}</text>}
    {(i%2===1||i===data.length-1)&&<text x={x+w/2} y={H+18} textAnchor="middle" className="dd-tick">{d.day.slice(8,10)}/{d.day.slice(5,7)}</text>}
   </g>;})}
  </svg></figure>;
}
async function serverUsers(events:TelemetryEvent[]):Promise<DevUser[]>{
 const ids=['iniciacao','recorder-soprano','trumpet-bb','clarinet-bb'],rows=await Promise.all(ids.map(id=>fetchRanking(id).then(r=>(r??[]).map(e=>({...e,instrument:id})))));
 const users=new Map<string,DevUser>(),username=new Map<string,string>();
 for(const e of events)if((e.type==='login'||e.type==='signup')&&e.profileId&&e.data?.username)username.set(e.profileId,String(e.data.username));
 for(const r of rows.flat()){const u=users.get(r.profileId)??{id:r.profileId,name:r.name,username:username.get(r.profileId)??'',createdAt:r.createdAt??'',streak:0,instruments:[]};
  u.instruments.push({id:r.instrument,xp:r.xp,lessons:r.lessons,accuracy:r.accuracy});u.streak=Math.max(u.streak,r.streak);if(r.createdAt&&(!u.createdAt||r.createdAt<u.createdAt))u.createdAt=r.createdAt;users.set(r.profileId,u);}
 // quem entrou mas ainda não pontuou também aparece
 for(const e of events)if(e.profileId&&!users.has(e.profileId)&&(e.type==='login'||e.type==='signup'))users.set(e.profileId,{id:e.profileId,name:e.profileName??'—',username:username.get(e.profileId)??'',createdAt:e.at,streak:0,instruments:[]});
 return [...users.values()];
}
function DevLogin({onDone}:{onDone:(email:string)=>void}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <form className="dd-card dd-login" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await devSignIn(email,password);onDone(email.trim().toLowerCase());}catch(err){setError(err instanceof Error?err.message:'Não deu pra entrar.');}finally{setBusy(false);}}}>
  <h2>Entrar como desenvolvedor</h2><p className="dd-muted">Use o e-mail e a senha do usuário que você criou no Supabase (Authentication → Users). Só e-mails da tabela “desenvolvedores” veem os dados.</p>
  <label>E-mail<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
  <label>Senha<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
  {error&&<p className="dd-error" role="alert">{error}</p>}
  <button type="submit" disabled={busy}>{busy?'Entrando…':'Entrar'}</button>
 </form>;
}
const ROOM:Record<string,string>={geral:'Geral',iniciacao:'Iniciação','recorder-soprano':'Flauta','trumpet-bb':'Trompete','clarinet-bb':'Clarinete'};
/** Moderação da Comunidade online: denúncias primeiro, depois as mais novas. */
function ModerationCard({tick}:{tick:number}){
 const [rows,setRows]=useState<ModRow[]|null>(null),[error,setError]=useState(''),[filter,setFilter]=useState<'denuncias'|'todas'>('denuncias'),[again,setAgain]=useState(0);
 useEffect(()=>{let alive=true;void fetchModeration().then(r=>{if(alive){setRows(r);setError('');}}).catch(e=>{if(alive)setError(e instanceof Error?e.message:'Erro ao ler o chat.');});return ()=>{alive=false;};},[tick,again]);
 const act=async(fn:()=>Promise<boolean>)=>{if(await fn())setAgain(n=>n+1);else setError('Não deu pra salvar a mudança.');};
 const list=(rows??[]).filter(r=>filter==='todas'||r.reports>0||r.hidden).sort((a,b)=>b.reports-a.reports||b.at.localeCompare(a.at));
 const reported=(rows??[]).filter(r=>r.reports>0).length;
 return <section className="dd-card"><h2>Comunidade: moderação</h2>
  <p className="dd-muted">Últimos 14 dias: {rows?.length??0} mensagens, {reported} com denúncia. Com 3 denúncias a mensagem some sozinha.</p>
  <div className="dd-filters"><span className="dd-source" role="group" aria-label="Filtro">{(['denuncias','todas'] as const).map(v=><button key={v} type="button" className={filter===v?'is-on':''} aria-pressed={filter===v} onClick={()=>setFilter(v)}>{v==='denuncias'?'Denunciadas e escondidas':'Todas'}</button>)}</span></div>
  {error&&<p className="dd-error" role="alert">{error}</p>}
  {rows===null&&!error?<p className="dd-muted">Carregando…</p>:list.length?<div className="dd-scroll"><table><thead><tr><th>Quando</th><th>Sala</th><th>Quem</th><th>Mensagem</th><th>Denúncias</th><th>Ações</th></tr></thead><tbody>
   {list.map(r=><tr key={r.id}><td>{when(r.at)}</td><td>{ROOM[r.channel]??r.channel}</td><td>{r.name}</td><td>{r.hidden?<s>{r.text}</s>:r.text}{r.hidden&&<small> · escondida</small>}</td><td>{r.reports}</td>
    <td><div className="dd-actions"><button type="button" onClick={()=>void act(()=>setHidden(r.id,!r.hidden))}>{r.hidden?'Mostrar':'Esconder'}</button><button type="button" onClick={()=>void act(()=>deleteMessage(r.id))}>Apagar</button><button type="button" className="is-danger" onClick={()=>void act(()=>blockProfile(r.profile_id))}>Bloquear perfil</button></div></td></tr>)}
  </tbody></table></div>:<p className="dd-muted">{filter==='denuncias'?'Nenhuma denúncia. Turma comportada!':'Nenhuma mensagem ainda.'}</p>}
 </section>;
}

export function DevDashboard(){
 const [tick,setTick]=useState(0),[confirm,setConfirm]=useState(false),[who,setWho]=useState('todos'),[kind,setKind]=useState('todos');
 const [source,setSource]=useState<'servidor'|'local'>(()=>cloudEnabled()?'servidor':'local'),[account,setAccount]=useState<string|null|undefined>(undefined);
 const [remote,setRemote]=useState<{events:TelemetryEvent[];users:DevUser[];at:string}|null>(null),[remoteError,setRemoteError]=useState(''),[loading,setLoading]=useState(false);
 useEffect(()=>{if(source!=='servidor')return;void devSession().then(s=>setAccount(s?.email??null));},[source]);
 useEffect(()=>{if(source!=='servidor'||!account)return;let alive=true;setLoading(true);setRemoteError('');
  void flushEvents().then(()=>fetchServerEvents()).then(async ev=>{const us=await serverUsers(ev);if(alive)setRemote({events:ev,users:us,at:new Date().toISOString()});}).catch(err=>{if(alive)setRemoteError(err instanceof Error?err.message:'Erro ao ler o servidor.');}).finally(()=>{if(alive)setLoading(false);});
  return ()=>{alive=false;};},[source,account,tick]);
 useEffect(()=>{const on=()=>setTick(t=>t+1);window.addEventListener(TELEMETRY_EVENT,on);const st=(e:StorageEvent)=>{if(!e.key||e.key===TELEMETRY_KEY||e.key.includes('trilha')||e.key.includes('journey'))on();};window.addEventListener('storage',st);const id=setInterval(on,15000);return ()=>{window.removeEventListener(TELEMETRY_EVENT,on);window.removeEventListener('storage',st);clearInterval(id);};},[]);
 const localEvents=useMemo(()=>readEvents(),[tick]),localPeople=useMemo(()=>users(),[tick]);
 const events=source==='servidor'?remote?.events??[]:localEvents,people=source==='servidor'?remote?.users??[]:localPeople;
 const s=useMemo(()=>devStats(events,people),[events,people]);
 const sessions=useMemo(()=>{const m=new Map<string,string>();for(const e of events){const k=e.profileId??`v:${e.session}`;if(!m.has(k))m.set(k,e.profileName??`Visitante ${e.session.slice(0,4)}`);}return [...m];},[events]);
 const timeline=events.filter(e=>(who==='todos'||(e.profileId??`v:${e.session}`)===who)&&(kind==='todos'||e.type===kind)).slice(-150).reverse();
 const exportJson=()=>{const blob=new Blob([JSON.stringify({exportadoEm:new Date().toISOString(),eventos:events,usuarios:people},null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`cactom-eventos-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);};
 if(!devAllowed())return <main className="dd dd--locked"><CactomWordmark/><h1>Painel do desenvolvedor</h1><p>Por enquanto o painel só abre no computador de quem desenvolve o Cactom. Quando o servidor estiver ligado, ele vai abrir com login de desenvolvedor.</p><a href="#">Voltar ao app</a></main>;
 const k=s.kpis;
 const needLogin=source==='servidor'&&account===null;
 return <main className="dd">
  <header className="dd-top"><div className="dd-brand"><CactomWordmark/><span>Painel do desenvolvedor</span></div>
   <div className="dd-actions"><span className="dd-live" title="Atualiza sozinho">● ao vivo</span><button type="button" onClick={()=>setTick(t=>t+1)}>Atualizar</button><button type="button" onClick={exportJson}>Exportar JSON</button>
    {cloudEnabled()&&<span className="dd-source" role="group" aria-label="De onde vêm os dados">{(['servidor','local'] as const).map(v=><button key={v} type="button" aria-pressed={source===v} className={source===v?'is-on':''} onClick={()=>setSource(v)}>{v==='servidor'?'Servidor (todos)':'Este navegador'}</button>)}</span>}
    {source==='servidor'&&account&&<button type="button" onClick={()=>{void devSignOut();setAccount(null);setRemote(null);}}>Sair ({account})</button>}
    {confirm?<span className="dd-confirm">Apagar {events.length} eventos{source==='servidor'?' do servidor':''}? <button type="button" className="is-danger" onClick={()=>{if(source==='servidor')void clearServerEvents().then(()=>setTick(t=>t+1));else clearEvents();setConfirm(false);setTick(t=>t+1);}}>Apagar</button><button type="button" onClick={()=>setConfirm(false)}>Cancelar</button></span>:<button type="button" onClick={()=>setConfirm(true)}>Limpar eventos</button>}
    <a className="dd-back" href="#">Voltar ao app</a></div></header>
  {source==='servidor'?<p className="dd-scope">Servidor (todos os aparelhos, últimos 30 dias): {loading?'carregando…':`${s.total} eventos, ${s.kpis.contas} ${s.kpis.contas===1?'aluno':'alunos'} e ${s.visitors} ${s.visitors===1?'sessão':'sessões'} de visitante`}{remote?.at?` · lido às ${new Date(remote.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:''}.{cloudStatus.lastError?` Envio deste aparelho: ${cloudStatus.lastError}`:''}</p>
   :<p className="dd-scope">Dados deste navegador: {s.total} eventos{s.first?` desde ${when(s.first)}`:''}, {s.kpis.contas} {s.kpis.contas===1?'conta':'contas'} e {s.visitors} {s.visitors===1?'sessão':'sessões'} de visitante.{cloudEnabled()?'':' Com o servidor (Supabase) ligado, este painel passa a mostrar todos os aparelhos.'}</p>}
  {remoteError&&<p className="dd-error" role="alert">{remoteError}</p>}
  {needLogin?<DevLogin onDone={email=>setAccount(email)}/>:<>
  <section className="dd-kpis" aria-label="Resumo">
   {[['Contas criadas',k.contas],['Pessoas ativas hoje',k.ativosHoje],['Aberturas hoje',k.aberturasHoje],['Lições na semana',k.licoesSemana],['Acerto de primeira (semana)',k.acertoSemana===null?'—':`${k.acertoSemana}%`],['Carregamento (mediana)',ms(k.carregamento)],['Erros na semana',k.errosSemana]].map(([l,v])=><div key={l} className={`dd-kpi ${l==='Erros na semana'&&Number(v)>0?'is-alert':''}`}><span>{l}</span><b>{v}</b></div>)}
  </section>
  <section className="dd-grid2">
   <Bars title="Aberturas do app por dia" note="últimos 14 dias" data={s.daily} value={d=>d.opens}/>
   <Bars title="Lições concluídas por dia" note="últimos 14 dias" data={s.daily} value={d=>d.lessons}/>
  </section>
  <section className="dd-grid2">
   <div className="dd-card"><h2>Velocidade de carregamento</h2><p className="dd-muted">Últimas {s.speed.samples} aberturas. Metade carrega em até (mediana) · 9 em cada 10 em até (p90).</p>
    <table><thead><tr><th>Medida</th><th>Mediana</th><th>p90</th></tr></thead><tbody>
     <tr><td>Página pronta (load)</td><td>{ms(s.speed.load.p50)}</td><td>{ms(s.speed.load.p90)}</td></tr>
     <tr><td>Primeira coisa na tela (FCP)</td><td>{ms(s.speed.fcp.p50)}</td><td>{ms(s.speed.fcp.p90)}</td></tr>
     <tr><td>Maior elemento na tela (LCP)</td><td>{ms(s.speed.lcp.p50)}</td><td>{ms(s.speed.lcp.p90)}</td></tr>
     <tr><td>Resposta do servidor (TTFB)</td><td>{ms(s.speed.ttfb.p50)}</td><td>—</td></tr>
     {s.speed.byDevice.map(d=><tr key={d.device}><td>No {d.device} ({d.n})</td><td>{ms(d.load)}</td><td>—</td></tr>)}
    </tbody></table></div>
   <Bars title="Carregamento por dia (mediana)" note="quanto menor, melhor" data={s.daily} value={d=>d.load} format={n=>ms(n)}/>
  </section>
  <section className="dd-card"><h2>Quem entrou</h2>{s.logins.length?<div className="dd-scroll"><table><thead><tr><th>Quando</th><th>O quê</th><th>Quem</th><th>Curso</th><th>Aparelho</th></tr></thead><tbody>
   {s.logins.map((l,i)=><tr key={i}><td>{when(l.at)}</td><td>{TYPE[l.type]}</td><td>{l.name}{l.username&&<small> @{l.username}</small>}</td><td>{INSTR[l.instrument]??'—'}</td><td>{l.device||'—'}</td></tr>)}
  </tbody></table></div>:<p className="dd-muted">Ninguém entrou ainda desde que o registro começou.</p>}</section>
  <section className="dd-card"><h2>Usuários</h2>{s.people.length?<div className="dd-scroll"><table><thead><tr><th>Nome</th><th>Criou em</th><th>Último uso</th><th>Rojão</th><th>Progresso por curso</th><th>Eventos</th></tr></thead><tbody>
   {s.people.map(u=><tr key={u.id}><td><b>{u.name}</b><small> @{u.username}</small></td><td>{when(u.createdAt)}</td><td>{when(u.lastAt)}</td><td>{u.streak} {u.streak===1?'dia':'dias'}</td><td>{u.instruments.length?u.instruments.map(i=><span key={i.id} className="dd-chip">{INSTR[i.id]}: {i.xp} XP · {i.lessons} lições · {i.accuracy??0}%</span>):'—'}</td><td>{u.events}</td></tr>)}
  </tbody></table></div>:<p className="dd-muted">Nenhuma conta criada neste navegador.</p>}</section>
  <section className="dd-grid2">
   <div className="dd-card"><h2>Lições mais feitas</h2>{s.topLessons.length?<table><thead><tr><th>Lição</th><th>Concluídas</th><th>Acerto</th></tr></thead><tbody>{s.topLessons.map(l=><tr key={l.lesson}><td>{lessonLabel(l.lesson)}</td><td>{l.done} de {l.starts}</td><td>{l.accuracy===null?'—':`${l.accuracy}%`}</td></tr>)}</tbody></table>:<p className="dd-muted">Nenhuma lição registrada ainda.</p>}</div>
   <div className="dd-card"><h2>Onde mais erram</h2><p className="dd-muted">Telas com pelo menos 3 respostas, só a primeira tentativa.</p>{s.hardest.length?<table><thead><tr><th>Tela</th><th>Erro</th></tr></thead><tbody>{s.hardest.map(h=><tr key={h.exercise}><td>{h.instruction||h.exercise}<small> · {lessonLabel(h.lesson)}</small></td><td><span className="dd-meter" style={{'--v':`${h.errorRate}%`} as CSSProperties}/>{h.errorRate}% <small>({h.wrong}/{h.n})</small></td></tr>)}</tbody></table>:<p className="dd-muted">Ainda sem respostas suficientes.</p>}</div>
  </section>
  <section className="dd-grid3">
   <div className="dd-card"><h2>Lições abandonadas</h2>{s.dropouts.length?<ul className="dd-list">{s.dropouts.map(d=><li key={d.lesson}><span>{lessonLabel(d.lesson)}</span><b>{d.quit}%</b></li>)}</ul>:<p className="dd-muted">Ninguém largou lição no meio (ou ainda faltam dados).</p>}</div>
   <div className="dd-card"><h2>Cursos</h2><ul className="dd-list">{s.instruments.map(i=><li key={i.id}><span>{INSTR[i.id]}</span><b>{i.people} {i.people===1?'pessoa':'pessoas'} · {i.lessons} lições</b></li>)}</ul></div>
   <div className="dd-card"><h2>Abas e recursos</h2><ul className="dd-list">{s.tabs.map(([t,n])=><li key={t}><span>{TAB[t]??t}</span><b>{n}</b></li>)}<li><span>Microfone abriu / falhou</span><b>{s.mic.ok} / {s.mic.fail}</b></li><li><span>Partituras em PDF enviadas</span><b>{s.scores}</b></li></ul>{s.mic.reasons.length>0&&<p className="dd-muted">Falhas: {s.mic.reasons.join(' · ')}</p>}</div>
  </section>
  {source==='servidor'&&account&&<ModerationCard tick={tick}/>}
  <section className="dd-card"><h2>Erros do app</h2>{s.errors.length?<div className="dd-scroll"><table><thead><tr><th>Quando</th><th>Erro</th><th>Onde</th><th>Quem</th></tr></thead><tbody>{s.errors.map((e,i)=><tr key={i}><td>{when(e.at)}</td><td>{e.message}</td><td>{e.source}</td><td>{e.name}</td></tr>)}</tbody></table></div>:<p className="dd-muted">Nenhum erro registrado. Arretado!</p>}</section>
  <section className="dd-card"><h2>Tudo o que o usuário fez</h2>
   <div className="dd-filters"><label>Pessoa<select value={who} onChange={e=>setWho(e.target.value)}><option value="todos">Todas</option>{sessions.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
    <label>Tipo<select value={kind} onChange={e=>setKind(e.target.value)}><option value="todos">Todos</option>{Object.entries(TYPE).map(([id,l])=><option key={id} value={id}>{l}</option>)}</select></label><span className="dd-muted">{timeline.length} mais recentes</span></div>
   {timeline.length?<ol className="dd-timeline">{timeline.map(e=><li key={e.id} className={`is-${e.type}`}><time>{when(e.at)}</time><b>{TYPE[e.type]??e.type}</b><span>{describe(e)}</span><small>{e.profileName??'Visitante'}{e.instrument&&(isBand(e.instrument)||e.instrument==='recorder-soprano')?` · ${INSTR[e.instrument]}`:''}</small></li>)}</ol>:<p className="dd-muted">Nada por aqui ainda.</p>}
  </section>
  </>}
 </main>;
}
