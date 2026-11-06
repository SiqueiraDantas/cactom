import type {KeyValueStorage} from './profileStorage';

/**
 * Motor comum das trilhas em paradas (flauta, trompete, clarinete e iniciação): status de cada parada,
 * onde continuar, revisões espaçadas (D+1, +3, +7, +14), o que errou volta na revisão e XP.
 */
/** `desafio`: desafio de seção do trompete e do clarinete (a flauta usa o desafio com o professor). */
export type StopKind='descoberta'|'pratica'|'criacao'|'missao'|'desafio';
export const STOP_KINDS:readonly {kind:StopKind;label:string;lessons:number[]}[]=[
 {kind:'descoberta',label:'Descoberta',lessons:[1,2]},
 {kind:'pratica',label:'Prática',lessons:[3]},
 {kind:'criacao',label:'Criação',lessons:[4]},
 {kind:'missao',label:'Missão e revisão',lessons:[5]},
];
/** Objetivos de unidade apresentados ao aluno (analise-e-estrutura-cactom.md, seção 5). */
export type JourneyStop={id:string;index:number;unit:number;section:number;kind:StopKind;label:string;lessonIds:string[];taskIds:string[];unitTitle:string;unitGoal:string;mission:string};

/* ---------- Registro da jornada ---------- */
export type Evidence='escuta'|'leitura'|'tentativa-fisica'|'avaliacao-docente'|'medicao-automatica'|'pratica-declarada'|'criacao'|'reflexao';
export const EVIDENCE_LABEL:Record<Evidence,string>={'escuta':'Escuta','leitura':'Leitura','tentativa-fisica':'Tentativa no instrumento','avaliacao-docente':'Observado pelo professor','medicao-automatica':'Medição automática','pratica-declarada':'Prática declarada','criacao':'Criação','reflexao':'Reflexão'};
export type PresentationRecord={at:string;correctFirst:boolean;recovered:boolean;evidence:Evidence[];validated?:boolean};
export type LessonRecord={at:string;xp:number;total:number;correctFirst:number;recovered:number;review:boolean};
export type StopProgress={completedAt?:string;reviewStep:number;nextReview?:string;lastStudied?:string};
export type JourneyLedger={version:1;lessons:Record<string,LessonRecord>;stops:Record<string,StopProgress>;presentations:Record<string,PresentationRecord>;xp:number;lastStop?:string;reviewDays:number[];reviewNeeded:string[]};
export const DEFAULT_REVIEW_DAYS=[1,3,7,14];
export const emptyJourney=():JourneyLedger=>({version:1,lessons:{},stops:{},presentations:{},xp:0,reviewDays:[...DEFAULT_REVIEW_DAYS],reviewNeeded:[]});
const DAY=86400000;
const iso=(value:string)=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const EVIDENCE=new Set(Object.keys(EVIDENCE_LABEL));
export function normalizeReviewDays(days:unknown):number[]{
 if(!Array.isArray(days)||days.length<1||days.length>6)return [...DEFAULT_REVIEW_DAYS];
 const clean=days.map(Number);if(clean.some(d=>!Number.isInteger(d)||d<1||d>90))return [...DEFAULT_REVIEW_DAYS];
 for(let i=1;i<clean.length;i++)if(clean[i]<=clean[i-1])return [...DEFAULT_REVIEW_DAYS];
 return clean;
}
/** `isLesson`/`isStop`: IDs aceitos pela trilha de cada curso. */
export function normalizeJourney(value:unknown,isLesson:(id:string)=>boolean,isStop:(id:string)=>boolean):JourneyLedger|null{
 if(!value||typeof value!=='object'||Array.isArray(value))return null;const raw=value as Partial<JourneyLedger>;
 if(raw.version!==1)return null;const ledger=emptyJourney();
 ledger.reviewDays=normalizeReviewDays(raw.reviewDays);
 for(const [id,r] of Object.entries(raw.lessons??{})){if(!isLesson(id)&&!id.startsWith('review:'))return null;if(!r||!iso(r.at)||!Number.isInteger(r.xp)||r.xp<0||r.xp>500)return null;ledger.lessons[id]={at:r.at,xp:r.xp,total:Number(r.total)||0,correctFirst:Number(r.correctFirst)||0,recovered:Number(r.recovered)||0,review:r.review===true};}
 for(const [id,s] of Object.entries(raw.stops??{})){if(!isStop(id)||!s)return null;const step=Number(s.reviewStep);ledger.stops[id]={reviewStep:Number.isInteger(step)&&step>=0&&step<=6?step:0,...(s.completedAt&&iso(s.completedAt)?{completedAt:s.completedAt}:{}),...(s.nextReview&&iso(s.nextReview)?{nextReview:s.nextReview}:{}),...(s.lastStudied&&iso(s.lastStudied)?{lastStudied:s.lastStudied}:{})};}
 for(const [id,p] of Object.entries(raw.presentations??{})){if(!/^[A-Z0-9.-]+-P\d$/.test(id)||!p||!iso(p.at)||!Array.isArray(p.evidence)||p.evidence.some(e=>!EVIDENCE.has(e)))return null;ledger.presentations[id]={at:p.at,correctFirst:p.correctFirst===true,recovered:p.recovered===true,evidence:[...new Set(p.evidence)] as Evidence[],...(p.validated===true?{validated:true}:{})};}
 ledger.xp=Number.isInteger(raw.xp)&&raw.xp!>=0&&raw.xp!<1e6?raw.xp!:0;
 if(raw.lastStop&&isStop(raw.lastStop))ledger.lastStop=raw.lastStop;
 if(Array.isArray(raw.reviewNeeded))ledger.reviewNeeded=raw.reviewNeeded.filter(id=>typeof id==='string'&&/-P\d$/.test(id)).slice(0,200);
 return ledger;
}
export function readJourney(storage:Pick<KeyValueStorage,'getItem'>,key:string,normalize:(v:unknown)=>JourneyLedger|null):{ledger:JourneyLedger;warning:string;safeToWrite:boolean}{
 const fail=()=>({ledger:emptyJourney(),warning:'Não foi possível ler o registro da trilha. Nada foi apagado; novos avanços ficam só nesta sessão.',safeToWrite:false});
 try{const raw=storage.getItem(key);if(!raw)return {ledger:emptyJourney(),warning:'',safeToWrite:true};if(raw.length>900000)return fail();const ledger=normalize(JSON.parse(raw));return ledger?{ledger,warning:'',safeToWrite:true}:fail();}
 catch{return fail();}
}
export function writeJourney(storage:Pick<KeyValueStorage,'setItem'>,ledger:JourneyLedger,key:string):boolean{try{storage.setItem(key,JSON.stringify(ledger));return true;}catch{return false;}}

/* ---------- Estado das paradas ---------- */
export type LegacyResponse={report?:string}|object;
const reportOf=(r:LegacyResponse|undefined)=>r&&'report' in r?r.report:undefined;
export type StopStatus='disponivel'|'em-andamento'|'concluida'|'revisao';
export const XP_RULES={lesson:10,firstTry:1,recovered:2,review:5} as const;
export type LessonOutcome={lessonId:string;stopId:string;review:boolean;presentations:{id:string;correctFirst:boolean;recovered:boolean;evidence:Evidence[];validated?:boolean;skipped?:boolean}[];at:Date};
export function lessonXp(outcome:LessonOutcome){
 const answered=outcome.presentations.filter(p=>!p.skipped);
 return (outcome.review?XP_RULES.review:XP_RULES.lesson)+answered.filter(p=>p.correctFirst).length*XP_RULES.firstTry+answered.filter(p=>p.recovered).length*XP_RULES.recovered;
}
export function addDays(date:Date,days:number){return new Date(date.getTime()+days*DAY);}

/**
 * Regras da trilha (status da parada, onde continuar, revisões espaçadas, XP) para qualquer lista de
 * paradas: a flauta usa as 64 dela; o trompete e o clarinete usam as deles, com o mesmo comportamento.
 * As apresentações pertencem a uma parada quando o ID começa por um dos `taskIds` dela.
 */
export function createJourneyEngine(stops:readonly JourneyStop[]){
 const byLesson=new Map<string,JourneyStop>(),byId=new Map<string,JourneyStop>();
 for(const stop of stops){byId.set(stop.id,stop);for(const l of stop.lessonIds)byLesson.set(l,stop);}
 const owns=(stop:JourneyStop,presentation:string)=>stop.taskIds.some(t=>presentation.startsWith(t+'-'));
 function lessonDone(lessonId:string,ledger:JourneyLedger,legacy:Record<string,LegacyResponse|undefined>={}){
  if(ledger.lessons[lessonId])return true;
  const stop=byLesson.get(lessonId);if(!stop)return false;
  const tasks=stop.taskIds.filter(t=>t.startsWith(lessonId+'-'));
  return tasks.length>0&&tasks.every(t=>legacy[t]);
 }
 function stopState(stop:JourneyStop,ledger:JourneyLedger,legacy:Record<string,LegacyResponse|undefined>={},now=Date.now()){
  const done=stop.lessonIds.filter(l=>lessonDone(l,ledger,legacy)).length;
  const progress=ledger.stops[stop.id];
  const touched=done>0||stop.taskIds.some(t=>legacy[t])||Object.keys(ledger.presentations).some(p=>owns(stop,p));
  const legacySupport=stop.taskIds.some(t=>reportOf(legacy[t])==='apoio'||reportOf(legacy[t])==='depois');
  const complete=done===stop.lessonIds.length;
  const due=complete&&!!progress?.nextReview&&Date.parse(progress.nextReview)<=now;
  const missed=ledger.reviewNeeded.some(p=>owns(stop,p));
  const status:StopStatus=complete?(due||legacySupport||missed?'revisao':'concluida'):touched?'em-andamento':'disponivel';
  return {status,done,total:stop.lessonIds.length,nextLesson:stop.lessonIds.find(l=>!lessonDone(l,ledger,legacy)),reviewStep:progress?.reviewStep??0,nextReview:progress?.nextReview,due};
 }
 /** Parada em que o aluno deve continuar: última estudada se incompleta; senão a próxima incompleta após ela. */
 function currentStop(ledger:JourneyLedger,legacy:Record<string,LegacyResponse|undefined>={}):JourneyStop{
  const incomplete=(s:JourneyStop)=>{const st=stopState(s,ledger,legacy).status;return st!=='concluida'&&st!=='revisao';};
  const last=ledger.lastStop?byId.get(ledger.lastStop):undefined;
  if(last){if(incomplete(last))return last;const after=stops.slice(last.index+1).find(incomplete);if(after)return after;}
  return stops.find(incomplete)??stops[stops.length-1];
 }
 function dueReviews(ledger:JourneyLedger,legacy:Record<string,LegacyResponse|undefined>={},now=Date.now()){
  return stops.filter(s=>stopState(s,ledger,legacy,now).status==='revisao');
 }
 function completeLesson(ledger:JourneyLedger,outcome:LessonOutcome,legacy:Record<string,LegacyResponse|undefined>={}):JourneyLedger{
  const stop=byId.get(outcome.stopId);if(!stop)throw new Error('Parada desconhecida.');
  if(!outcome.review&&!stop.lessonIds.includes(outcome.lessonId))throw new Error('Lição fora da parada.');
  const at=outcome.at.toISOString(),xp=lessonXp(outcome);
  const next:JourneyLedger={...ledger,lessons:{...ledger.lessons},stops:{...ledger.stops},presentations:{...ledger.presentations},reviewNeeded:[...ledger.reviewNeeded]};
  const key=outcome.review?`review:${stop.id}:${at}`:outcome.lessonId;
  next.lessons[key]={at,xp,total:outcome.presentations.length,correctFirst:outcome.presentations.filter(p=>p.correctFirst).length,recovered:outcome.presentations.filter(p=>p.recovered).length,review:outcome.review};
  for(const p of outcome.presentations){
   if(p.skipped)continue;
   next.presentations[p.id]={at,correctFirst:p.correctFirst,recovered:p.recovered,evidence:p.evidence,...(p.validated?{validated:true}:{})};
   const already=next.reviewNeeded.indexOf(p.id);
   if(!p.correctFirst&&already<0)next.reviewNeeded.push(p.id);
   if(p.correctFirst&&already>=0&&outcome.review)next.reviewNeeded.splice(already,1);
  }
  next.xp=ledger.xp+xp;next.lastStop=stop.id;
  const previous=next.stops[stop.id]??{reviewStep:0};
  const progress:StopProgress={...previous,lastStudied:at};
  const complete=stop.lessonIds.every(l=>l===outcome.lessonId||lessonDone(l,next,legacy));
  if(outcome.review){
   const step=Math.min(previous.reviewStep+1,ledger.reviewDays.length);progress.reviewStep=step;
   if(step<ledger.reviewDays.length)progress.nextReview=addDays(outcome.at,ledger.reviewDays[step]-ledger.reviewDays[step-1]).toISOString();else delete progress.nextReview;
  }else if(complete&&!previous.completedAt){progress.completedAt=at;progress.reviewStep=0;progress.nextReview=addDays(outcome.at,ledger.reviewDays[0]).toISOString();}
  next.stops[stop.id]=progress;
  return next;
 }
 return {stops,stop:(id:string)=>byId.get(id),lessonDone,stopState,currentStop,dueReviews,completeLesson};
}
/** Contagem de evidências por tipo, sempre separadas. */
export function evidenceSummary(ledger:JourneyLedger){
 const counts=Object.fromEntries(Object.keys(EVIDENCE_LABEL).map(k=>[k,0])) as Record<Evidence,number>;
 for(const p of Object.values(ledger.presentations))for(const e of p.evidence)counts[e]++;
 return counts;
}
