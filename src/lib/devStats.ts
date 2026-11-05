import type {TelemetryEvent} from './devEvents.ts';
import {localPracticeDate} from './streak.ts';

/** Contas do serviço de usuários (sem senha), com o resumo de cada instrumento já calculado. */
export type DevUser={id:string;name:string;username:string;createdAt:string;instruments:{id:string;xp:number;lessons:number;accuracy:number|null}[];streak:number};
const day=(iso:string)=>localPracticeDate(new Date(iso));
const median=(xs:number[])=>{if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b),m=s.length>>1;return Math.round(s.length%2?s[m]:(s[m-1]+s[m])/2);};
const pct=(xs:number[],p:number)=>{if(!xs.length)return null;const s=[...xs].sort((a,b)=>a-b);return Math.round(s[Math.min(s.length-1,Math.floor(p*s.length))]);};
const num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)?v:null;
export type DevStats=ReturnType<typeof devStats>;

export function devStats(events:readonly TelemetryEvent[],users:readonly DevUser[],now=new Date()){
 const today=localPracticeDate(now),days14=Array.from({length:14},(_,k)=>localPracticeDate(new Date(now.getTime()-(13-k)*864e5))),week=new Set(days14.slice(-7));
 const inWeek=(e:TelemetryEvent)=>week.has(day(e.at)),isToday=(e:TelemetryEvent)=>day(e.at)===today;
 const opens=events.filter(e=>e.type==='app_open'),answers=events.filter(e=>e.type==='answer'&&!e.data?.skipped),completes=events.filter(e=>e.type==='lesson_complete');
 const who=(e:TelemetryEvent)=>e.profileId??`visitante:${e.session}`;
 const loads=(list:TelemetryEvent[],k:string)=>list.map(e=>num(e.data?.[k])).filter((x):x is number=>x!==null&&x>0&&x<120000);
 const weekAnswers=answers.filter(inWeek),firstTry=weekAnswers.filter(e=>!e.data?.retry);
 const kpis={
  contas:users.length,
  ativosHoje:new Set(events.filter(isToday).map(who)).size,
  aberturasHoje:opens.filter(isToday).length,
  licoesSemana:completes.filter(inWeek).length,
  acertoSemana:firstTry.length?Math.round(firstTry.filter(e=>e.data?.ok).length/firstTry.length*100):null,
  carregamento:median(loads(opens.filter(inWeek),'load')),
  errosSemana:events.filter(e=>e.type==='error'&&inWeek(e)).length,
 };
 const daily=days14.map(d=>{const ev=events.filter(e=>day(e.at)===d);return {day:d,opens:ev.filter(e=>e.type==='app_open').length,lessons:ev.filter(e=>e.type==='lesson_complete').length,people:new Set(ev.map(who)).size,load:median(loads(ev.filter(e=>e.type==='app_open'),'load'))};});
 const recentOpens=opens.slice(-60);
 const speed={samples:recentOpens.length,
  load:{p50:median(loads(recentOpens,'load')),p90:pct(loads(recentOpens,'load'),.9)},
  fcp:{p50:median(loads(recentOpens,'fcp')),p90:pct(loads(recentOpens,'fcp'),.9)},
  lcp:{p50:median(loads(recentOpens,'lcp')),p90:pct(loads(recentOpens,'lcp'),.9)},
  ttfb:{p50:median(loads(recentOpens,'ttfb'))},
  byDevice:['celular','computador'].map(d=>({device:d,n:recentOpens.filter(e=>e.data?.device===d).length,load:median(loads(recentOpens.filter(e=>e.data?.device===d),'load'))})),
  last:recentOpens.slice(-8).reverse().map(e=>({at:e.at,load:num(e.data?.load),fcp:num(e.data?.fcp),device:String(e.data?.device??''),browser:String(e.data?.browser??''),net:e.data?.net?String(e.data.net):''}))};
 const deviceOf=new Map(opens.map(e=>[e.session,`${e.data?.device??''} · ${e.data?.browser??''}`]));
 const logins=events.filter(e=>['login','signup','demo','logout'].includes(e.type)).slice(-40).reverse().map(e=>({at:e.at,type:e.data?.restored?'restored':e.type,name:e.profileName??(e.type==='demo'?'Visitante':'—'),username:String(e.data?.username??''),instrument:e.instrument??'',device:deviceOf.get(e.session)??''}));
 const lastSeen=new Map<string,string>();for(const e of events)if(e.profileId)lastSeen.set(e.profileId,e.at);
 const people=users.map(u=>({...u,lastAt:lastSeen.get(u.id)??null,events:events.filter(e=>e.profileId===u.id).length})).sort((a,b)=>(b.lastAt??'').localeCompare(a.lastAt??''));
 const visitors=new Set(events.filter(e=>!e.profileId).map(e=>e.session)).size;
 // lições: mais feitas, acerto médio e quantas foram começadas sem terminar
 const byLesson=new Map<string,{lesson:string;instrument:string;starts:number;done:number;total:number;correct:number}>();
 for(const e of events){if(e.type!=='lesson_start'&&e.type!=='lesson_complete')continue;const id=String(e.data?.lesson??'');if(!id||id.startsWith('review:'))continue;
  const row=byLesson.get(id)??{lesson:id,instrument:String(e.data?.instrument??e.instrument??''),starts:0,done:0,total:0,correct:0};
  if(e.type==='lesson_start')row.starts++;else{row.done++;row.total+=num(e.data?.total)??0;row.correct+=num(e.data?.correctFirst)??0;}byLesson.set(id,row);}
 const lessons=[...byLesson.values()].map(r=>({...r,accuracy:r.total?Math.round(r.correct/r.total*100):null,quit:r.starts?Math.max(0,Math.round((1-r.done/r.starts)*100)):0}));
 const topLessons=[...lessons].sort((a,b)=>b.done-a.done||b.starts-a.starts).slice(0,10);
 const dropouts=lessons.filter(r=>r.starts>=2&&r.quit>0).sort((a,b)=>b.quit-a.quit||b.starts-a.starts).slice(0,8);
 // telas onde mais erram (só primeira tentativa, a partir de 3 respostas)
 const byEx=new Map<string,{exercise:string;instruction:string;kind:string;lesson:string;n:number;wrong:number}>();
 for(const e of answers){if(e.data?.retry)continue;const id=String(e.data?.exercise??'');if(!id)continue;const r=byEx.get(id)??{exercise:id,instruction:String(e.data?.instruction??''),kind:String(e.data?.kind??''),lesson:String(e.data?.lesson??''),n:0,wrong:0};r.n++;if(!e.data?.ok)r.wrong++;byEx.set(id,r);}
 const hardest=[...byEx.values()].filter(r=>r.n>=3&&r.wrong>0).map(r=>({...r,errorRate:Math.round(r.wrong/r.n*100)})).sort((a,b)=>b.errorRate-a.errorRate||b.n-a.n).slice(0,10);
 const instrumentIds=['recorder-soprano','trumpet-bb','clarinet-bb'];
 const instruments=instrumentIds.map(id=>({id,choices:events.filter(e=>e.type==='course'&&e.data?.instrument===id).length,lessons:completes.filter(e=>(e.data?.instrument??e.instrument)===id).length,people:new Set(events.filter(e=>e.instrument===id).map(who)).size}));
 const tabs=Object.entries(events.filter(e=>e.type==='tab').reduce<Record<string,number>>((m,e)=>{const t=String(e.data?.tab??'');m[t]=(m[t]??0)+1;return m;},{})).sort((a,b)=>b[1]-a[1]);
 const micEvents=events.filter(e=>e.type==='mic');
 const mic={ok:micEvents.filter(e=>e.data?.ok).length,fail:micEvents.filter(e=>!e.data?.ok).length,reasons:[...new Set(micEvents.filter(e=>!e.data?.ok).map(e=>String(e.data?.error??'')).filter(Boolean))].slice(0,4)};
 const errors=events.filter(e=>e.type==='error').slice(-20).reverse().map(e=>({at:e.at,message:String(e.data?.message??''),source:String(e.data?.source??''),name:e.profileName??'Visitante'}));
 const scores=events.filter(e=>e.type==='score_import').length;
 return {kpis,daily,speed,logins,people,visitors,topLessons,dropouts,hardest,instruments,tabs,mic,errors,scores,total:events.length,first:events[0]?.at??null};
}
