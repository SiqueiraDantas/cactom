import test from 'node:test';
import assert from 'node:assert/strict';
import {track,readEvents,clearEvents,setTelemetryContext,TELEMETRY_KEY,TELEMETRY_MAX,browserName} from '../src/lib/devEvents.ts';
import {devStats} from '../src/lib/devStats.ts';
import {entryFor,sortRanking,firstName,MIN_ANSWERS_FOR_ACCURACY} from '../src/lib/ranking.ts';
import {bandExercises} from '../src/lib/bandTrail.ts';

const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';

test('registro de eventos: guarda com perfil e curso, corta textos longos e mantém só os mais recentes',()=>{
 const s=mem();setTelemetryContext({profileId:A,profileName:'Ana Clara',instrument:'trumpet-bb'});
 const e=track('answer',{exercise:'X',ok:true,instruction:'a'.repeat(400)},s);
 assert.equal(e.profileId,A);assert.equal(e.instrument,'trumpet-bb');assert.equal(e.data.instruction.length,160);
 for(let i=0;i<TELEMETRY_MAX+5;i++)track('tab',{tab:'learn'},s);
 const list=readEvents(s);assert.equal(list.length,TELEMETRY_MAX);assert.equal(list.at(-1).type,'tab');
 clearEvents(s);assert.equal(readEvents(s).length,0);
 assert.deepEqual(readEvents({getItem:()=>'{quebrado'}),[],'registro quebrado não derruba o app');
 assert.equal(browserName('Mozilla/5.0 (Macintosh) AppleWebKit Chrome/130 Safari/537'),'Chrome');
 setTelemetryContext({profileId:null,profileName:undefined,instrument:undefined});
});

test('ranking: lê o progresso de cada conta no instrumento e ordena por pontos, acertos e rojão',()=>{
 const s=mem(),at='2026-11-04T12:00:00Z';
 const ledger=(n,xp,correct)=>JSON.stringify({version:1,lessons:Object.fromEntries(['TPT-U001-L1','TPT-U001-L2','TPT-U001-L3'].slice(0,n).map(id=>[id,{at,xp:Math.round(xp/n),total:6,correctFirst:correct,recovered:0,review:false}])),stops:{},presentations:{},xp,reviewDays:[1,3,7,14],reviewNeeded:[]});
 s.setItem(`mis-user:${A}:cactom-formacao-trompete-v2`,ledger(2,30,6));
 s.setItem(`mis-user:${B}:cactom-formacao-trompete-v2`,ledger(3,40,3));
 const a=entryFor({id:A,name:'Ana Clara'},'trumpet-bb',s),b=entryFor({id:B,name:'Bruno'},'trumpet-bb',s);
 assert.equal(a.name,'Ana');assert.equal(a.lessons,2);assert.equal(a.accuracy,100);assert.equal(b.accuracy,50);
 assert.deepEqual(sortRanking([a,b],'xp').map(e=>e.name),['Bruno','Ana']);
 assert.deepEqual(sortRanking([a,b],'acertos').map(e=>e.name),['Ana','Bruno']);
 assert.equal(entryFor({id:A,name:'Ana'},'clarinet-bb',s),null,'quem não estudou o instrumento não entra');
 const few={...a,answered:MIN_ANSWERS_FOR_ACCURACY-1,accuracy:100};assert.deepEqual(sortRanking([few,b],'acertos').map(e=>e.name),['Bruno','Ana'],'precisa de respostas mínimas pra disputar acertos');
 assert.equal(firstName('  Maria   José '),'Maria');
});

test('painel: números do dia, carregamento, lições, telas difíceis e abandono',()=>{
 const now=new Date('2026-11-04T15:00:00Z'),at=h=>new Date(now.getTime()-h*36e5).toISOString();
 const ev=(type,h,data={},extra={})=>({id:Math.random().toString(36),at:at(h),type,session:extra.session??'s1',profileId:'profileId' in extra?extra.profileId:A,profileName:'Ana',instrument:'trumpet-bb',data});
 const events=[ev('app_open',3,{load:900,fcp:400,device:'celular'}),ev('app_open',2,{load:1500,fcp:700,device:'computador'},{session:'s2',profileId:null}),ev('login',2.9,{username:'ana'}),
  ev('lesson_start',2.5,{lesson:'TPT-M01-L1',instrument:'trumpet-bb'}),ev('lesson_complete',2.4,{lesson:'TPT-M01-L1',instrument:'trumpet-bb',total:6,correctFirst:4,xp:14}),
  ev('lesson_start',2.3,{lesson:'TPT-M01-L2',instrument:'trumpet-bb'}),ev('lesson_start',2.2,{lesson:'TPT-M01-L2',instrument:'trumpet-bb'}),ev('lesson_complete',2.1,{lesson:'TPT-M01-L2',instrument:'trumpet-bb',total:6,correctFirst:6,xp:16}),
  ...[0,1,2].map(i=>ev('answer',2,{exercise:'TPT-M01-L1-A2-P1',instruction:'Monte o Sol',ok:i===2,lesson:'TPT-M01-L1'})),ev('answer',2,{exercise:'TPT-M01-L1-A2-P1',ok:true,retry:true}),
  ev('error',1,{message:'boom',source:'a.js:1'}),ev('mic',1,{ok:false,error:'Permissão negada'})];
 const st=devStats(events,[{id:A,name:'Ana',username:'ana',createdAt:at(100),instruments:[],streak:2}],now);
 assert.equal(st.kpis.contas,1);assert.equal(st.kpis.aberturasHoje,2);assert.equal(st.kpis.ativosHoje,2,'conta + visitante');
 assert.equal(st.kpis.licoesSemana,2);assert.equal(st.kpis.acertoSemana,33,'só a primeira tentativa conta');assert.equal(st.kpis.carregamento,1200);assert.equal(st.kpis.errosSemana,1);
 assert.equal(st.logins[0].name,'Ana');assert.equal(st.hardest[0].errorRate,67);
 assert.equal(st.topLessons.find(l=>l.lesson==='TPT-M01-L2').quit,50,'começou 2x, terminou 1x');
 assert.equal(st.mic.fail,1);assert.equal(st.daily.length,14);assert.equal(st.daily.at(-1).opens,2);
});

test('telas do trompete/clarinete têm ID estável para o painel achar onde erram',()=>{
 const ex=bandExercises('trumpet-bb','TPT-M01-L1');assert.ok(ex.every(e=>/^TPT-M01-L1-/.test(e.id)));
});
