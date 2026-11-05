/**
 * Registro de eventos do Cactom (para o Painel do desenvolvedor).
 * Por enquanto fica no próprio navegador (localStorage, até 4000 eventos, os mais antigos saem).
 * Quando houver banco (Supabase), basta registrar um envio com `setTelemetrySink` — a tela não muda.
 * Privacidade: só apelido do perfil e dados de uso; nada de áudio, tela, senha ou localização.
 */
export type TelemetryType='app_open'|'login'|'signup'|'demo'|'logout'|'course'|'tab'|'lesson_start'|'lesson_complete'|'answer'|'mic'|'score_import'|'error';
export type TelemetryValue=string|number|boolean|null;
export type TelemetryEvent={id:string;at:string;type:TelemetryType;session:string;profileId:string|null;profileName?:string;instrument?:string;data?:Record<string,TelemetryValue>};
export const TELEMETRY_KEY='cactom-eventos-v1';
export const TELEMETRY_MAX=4000;
export const TELEMETRY_EVENT='cactom-telemetria';
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const store=():Store|undefined=>{try{return globalThis.localStorage;}catch{return undefined;}};
const rid=()=>{try{return crypto.randomUUID();}catch{return Math.random().toString(36).slice(2)+Date.now().toString(36);}};
const ctx:{session:string;profileId:string|null;profileName?:string;instrument?:string}={session:sessionId(),profileId:null};
function sessionId(){try{const s=globalThis.sessionStorage;const old=s?.getItem('cactom-sessao-aba');if(old)return old;const id=rid();s?.setItem('cactom-sessao-aba',id);return id;}catch{return rid();}}
let sink:((e:TelemetryEvent)=>void)|null=null;
/** Envio extra (ex.: Supabase). Erros no envio nunca atrapalham o app. */
export function setTelemetrySink(fn:((e:TelemetryEvent)=>void)|null){sink=fn;}
export function setTelemetryContext(next:Partial<Omit<typeof ctx,'session'>>){Object.assign(ctx,next);}
export function telemetryContext(){return {...ctx};}
const clean=(data:Record<string,unknown>={})=>{const out:Record<string,TelemetryValue>={};for(const [k,v] of Object.entries(data)){if(v===undefined)continue;out[k]=typeof v==='string'?v.slice(0,160):typeof v==='number'?Math.round(v*100)/100:typeof v==='boolean'||v===null?v:String(v).slice(0,160);}return out;};
export function readEvents(storage:Pick<Store,'getItem'>|undefined=store()):TelemetryEvent[]{
 try{const raw=storage?.getItem(TELEMETRY_KEY);if(!raw)return [];const list=JSON.parse(raw);return Array.isArray(list)?list.filter(e=>e&&typeof e.type==='string'&&typeof e.at==='string'):[];}catch{return [];}
}
export function track(type:TelemetryType,data?:Record<string,unknown>,storage:Store|undefined=store(),now=new Date()):TelemetryEvent{
 const e:TelemetryEvent={id:rid(),at:now.toISOString(),type,session:ctx.session,profileId:ctx.profileId,...(ctx.profileName?{profileName:ctx.profileName}:{}),...(ctx.instrument?{instrument:ctx.instrument}:{}),...(data?{data:clean(data)}:{})};
 try{const list=readEvents(storage);list.push(e);storage?.setItem(TELEMETRY_KEY,JSON.stringify(list.slice(-TELEMETRY_MAX)));}catch{/* sem espaço: segue sem registrar */}
 try{sink?.(e);}catch{/* envio externo falhou */}
 try{globalThis.dispatchEvent?.(new CustomEvent(TELEMETRY_EVENT,{detail:e}));}catch{/* fora do navegador */}
 return e;
}
export function clearEvents(storage:Store|undefined=store()){try{storage?.removeItem(TELEMETRY_KEY);}catch{/* nada */}}

let started=false;
/** Abre a sessão: registra a abertura com a velocidade de carregamento e passa a anotar erros da página. */
export function startTelemetry(){
 if(started||typeof window==='undefined')return;started=true;
 if(location.hash==='#desenvolvedor')return;
 const vitals:{fcp?:number;lcp?:number}={};
 try{new PerformanceObserver(list=>{for(const e of list.getEntries())if(e.name==='first-contentful-paint')vitals.fcp=e.startTime;}).observe({type:'paint',buffered:true});}catch{/* sem suporte */}
 try{new PerformanceObserver(list=>{const last=list.getEntries().at(-1);if(last)vitals.lcp=last.startTime;}).observe({type:'largest-contentful-paint',buffered:true});}catch{/* sem suporte */}
 const report=()=>setTimeout(()=>{
  const nav=performance.getEntriesByType?.('navigation')[0] as PerformanceNavigationTiming|undefined;
  const conn=(navigator as Navigator&{connection?:{effectiveType?:string}}).connection;
  track('app_open',{load:nav?nav.loadEventEnd-nav.startTime:performance.now(),dom:nav?nav.domContentLoadedEventEnd-nav.startTime:undefined,ttfb:nav?nav.responseStart-nav.startTime:undefined,fcp:vitals.fcp,lcp:vitals.lcp,
   device:/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)?'celular':'computador',browser:browserName(navigator.userAgent),width:window.innerWidth,net:conn?.effectiveType,path:location.hash||'/'});
 },600);
 if(document.readyState==='complete')report();else window.addEventListener('load',report,{once:true});
 window.addEventListener('error',e=>track('error',{message:e.message||'Erro na página',source:`${(e.filename||'').split('/').pop()}:${e.lineno||0}`}));
 window.addEventListener('unhandledrejection',e=>track('error',{message:e.reason instanceof Error?e.reason.message:String(e.reason??'Promessa rejeitada'),source:'promise'}));
}
export function browserName(ua:string){return /Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'Outro';}
