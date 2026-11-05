import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import type {TelemetryEvent} from './devEvents.ts';
import type {RankEntry} from './ranking.ts';

/**
 * Ligação com o servidor (Supabase). Usa só a URL e a chave PUBLICÁVEL (sb_publishable_…), que podem
 * ficar no site: quem protege os dados são as regras do banco (supabase/cactom-banco.sql).
 * Nunca coloque aqui a chave secreta (sb_secret_…) nem a senha do banco.
 * Sem as variáveis VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY o app segue só no navegador.
 */
type Env={VITE_SUPABASE_URL?:string;VITE_SUPABASE_PUBLISHABLE_KEY?:string};
const env:Env=(()=>{try{return (import.meta.env??{}) as Env;}catch{return {};}})();
let override:{url:string;key:string;fetch?:typeof fetch}|null=null;
let client:SupabaseClient|null=null;
/** Para testes: usa outro endereço/fetch. */
export function configureCloud(next:{url:string;key:string;fetch?:typeof fetch}|null){override=next;client=null;}
export function cloudEnabled(){const url=override?.url??env.VITE_SUPABASE_URL,key=override?.key??env.VITE_SUPABASE_PUBLISHABLE_KEY;return !!(url&&key&&/^https:\/\//.test(url));}
export function cloud():SupabaseClient|null{
 if(!cloudEnabled())return null;
 client??=createClient(override?.url??env.VITE_SUPABASE_URL!,override?.key??env.VITE_SUPABASE_PUBLISHABLE_KEY!,{
  auth:{persistSession:typeof localStorage!=='undefined',storageKey:'cactom-dev-auth',autoRefreshToken:true,detectSessionInUrl:false},
  realtime:{params:{eventsPerSecond:2}},...(override?.fetch?{global:{fetch:override.fetch}}:{})});
 return client;
}

/* ---------- Envio dos eventos: em lote, com fila se a internet cair ---------- */
const QUEUE_KEY='cactom-eventos-fila',QUEUE_MAX=600,BATCH=50;
type Row={id:string;at:string;type:string;session:string;device:string;profile_id:string|null;profile_name:string|null;instrument:string|null;data:TelemetryEvent['data']|null};
const store=()=>{try{return globalThis.localStorage;}catch{return undefined;}};
function deviceId(){const s=store();try{let id=s?.getItem('cactom-aparelho');if(!id){id=crypto.randomUUID();s?.setItem('cactom-aparelho',id);}return id;}catch{return 'sem-id';}}
const firstName=(n?:string)=>n?n.trim().split(/\s+/)[0]?.slice(0,40)||null:null;
export function toRow(e:TelemetryEvent):Row{return {id:e.id,at:e.at,type:e.type,session:e.session,device:deviceId(),profile_id:e.profileId,profile_name:firstName(e.profileName),instrument:e.instrument??null,data:e.data??null};}
function readQueue():Row[]{try{const v=JSON.parse(store()?.getItem(QUEUE_KEY)??'[]');return Array.isArray(v)?v:[];}catch{return [];}}
function writeQueue(q:Row[]){try{store()?.setItem(QUEUE_KEY,JSON.stringify(q.slice(-QUEUE_MAX)));}catch{/* sem espaço */}}
let timer:ReturnType<typeof setTimeout>|null=null,sending=false;
export const cloudStatus={lastOk:null as string|null,lastError:''};
export function queueEvent(e:TelemetryEvent){
 if(!cloudEnabled())return;
 const q=readQueue();q.push(toRow(e));writeQueue(q);
 if(timer)clearTimeout(timer);timer=setTimeout(()=>void flushEvents(),q.length>=BATCH?100:3000);
}
export async function flushEvents():Promise<number>{
 const db=cloud();if(!db||sending)return 0;sending=true;let sent=0;
 try{
  for(;;){
   const q=readQueue();if(!q.length)break;const batch=q.slice(0,BATCH);
   const {error}=await db.from('eventos').insert(batch);
   if(error){
    // "já existe" (reenvio depois de uma resposta perdida): manda um por um e descarta os repetidos
    if(error.code==='23505'){const keep:Row[]=[];for(const r of batch){const {error:e1}=await db.from('eventos').insert(r);if(e1&&e1.code!=='23505')keep.push(r);else if(!e1)sent++;}writeQueue([...keep,...readQueue().slice(batch.length)]);if(keep.length)break;continue;}
    // linha recusada pelas regras (ex.: data fora do prazo) não volta pra fila; outros erros esperam a próxima vez
    if(error.code==='42501'||error.code==='23514'){writeQueue(readQueue().slice(batch.length));continue;}
    cloudStatus.lastError=error.code==='42P01'||/does not exist|schema cache/i.test(error.message)?'As tabelas ainda não existem: rode o arquivo supabase/cactom-banco.sql no SQL Editor.':error.message;break;
   }
   writeQueue(readQueue().slice(batch.length));sent+=batch.length;cloudStatus.lastOk=new Date().toISOString();cloudStatus.lastError='';
  }
 }catch(err){cloudStatus.lastError=err instanceof Error?err.message:'Sem internet';}
 finally{sending=false;}
 return sent;
}
export function startCloudSync(){
 if(!cloudEnabled()||typeof window==='undefined')return;
 window.addEventListener('online',()=>void flushEvents());
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void flushEvents();});
 setTimeout(()=>void flushEvents(),4000);
}

/* ---------- Ranking no servidor ---------- */
/** Token secreto do perfil neste aparelho (o servidor só guarda o hash). Usado no ranking e no chat. */
export function profileToken(profileStore:Pick<Storage,'getItem'|'setItem'>){
 try{let t=profileStore.getItem('cactom-ranking-token');if(!t||t.length<20){t=`${crypto.randomUUID()}${crypto.randomUUID()}`;profileStore.setItem('cactom-ranking-token',t);}return t;}catch{return null;}
}
/** Manda a linha do ranking desta conta (só primeiro nome e números). */
export async function pushRanking(entry:RankEntry,instrumentId:string,profileStore:Pick<Storage,'getItem'|'setItem'>):Promise<boolean>{
 const db=cloud(),token=profileToken(profileStore);if(!db||!token)return false;
 try{const {data,error}=await db.rpc('ranking_atualizar',{p_profile:entry.profileId,p_token:token,p_instrument:instrumentId,p_name:entry.name,p_xp:entry.xp,p_lessons:entry.lessons,p_answered:entry.answered,p_correct:entry.correct,p_streak:entry.streak,p_last:entry.lastAt});
  return !error&&data===true;}catch{return false;}
}
type RankRow={profile_id:string;name:string;xp:number;lessons:number;answered:number;correct:number;streak:number;last_at:string|null;created_at?:string};
export async function fetchRanking(instrumentId:string):Promise<(RankEntry&{createdAt?:string})[]|null>{
 const db=cloud();if(!db)return null;
 try{const {data,error}=await db.rpc('ranking_do_instrumento',{p_instrument:instrumentId});if(error||!Array.isArray(data))return null;
  return (data as RankRow[]).map(r=>({profileId:r.profile_id,name:r.name,xp:r.xp,lessons:r.lessons,answered:r.answered,correct:r.correct,accuracy:r.answered?Math.round(r.correct/r.answered*100):null,streak:r.streak,lastAt:r.last_at,createdAt:r.created_at}));}catch{return null;}
}

/* ---------- Painel: login do desenvolvedor e leitura dos eventos ---------- */
export async function devSession(){const db=cloud();if(!db)return null;try{const {data}=await db.auth.getSession();return data.session?{email:data.session.user.email??''}:null;}catch{return null;}}
export async function devSignIn(email:string,password:string){const db=cloud();if(!db)throw new Error('Servidor não configurado.');let error;try{({error}=await db.auth.signInWithPassword({email:email.trim().toLowerCase(),password}));}catch{throw new Error('Sem conexão com o servidor. Confira a internet e tente de novo.');}
 if(error&&/fetch|network/i.test(error.message))throw new Error('Sem conexão com o servidor. Confira a internet e tente de novo.');if(error)throw new Error(error.message==='Invalid login credentials'?'E-mail ou senha errados.':error.message);}
export async function devSignOut(){await cloud()?.auth.signOut().catch(()=>{});}
export async function fetchServerEvents(days=30,max=20000):Promise<TelemetryEvent[]>{
 const db=cloud();if(!db)return [];const since=new Date(Date.now()-days*864e5).toISOString(),out:TelemetryEvent[]=[];
 for(let from=0;from<max;from+=1000){
  const {data,error}=await db.from('eventos').select('id,at,type,session,device,profile_id,profile_name,instrument,data').gte('at',since).order('at',{ascending:true}).range(from,from+999);
  if(error)throw new Error(error.code==='42P01'?'As tabelas ainda não existem: rode o SQL.':error.message);
  for(const r of data??[])out.push({id:r.id,at:r.at,type:r.type,session:r.session,profileId:r.profile_id,...(r.profile_name?{profileName:r.profile_name}:{}),...(r.instrument?{instrument:r.instrument}:{}),...(r.data?{data:r.data}:{})});
  if(!data||data.length<1000)break;
 }
 return out;
}
export async function clearServerEvents(){const db=cloud();if(!db)return;await db.from('eventos').delete().gte('at','1970-01-01');}
