import test from 'node:test';
import assert from 'node:assert/strict';
import {FORMATION_COURSES,formationPlan,formationJourney,formationUnits,formationExercises,formationKey,formationUnit,formationPool,focusNotes,readFormation,completeFormationLesson,formationOverview,MICRO_NAMES} from '../src/lib/formacao.ts';
import {bandExercises,bandJourney,bandFingering,bandLessonName,bandLessonTasks,readBandJourney,completeBandLesson,isBand,soundingOffset} from '../src/lib/bandTrail.ts';
import {emptyJourney,lessonXp,evidenceSummary,normalizeReviewDays,DEFAULT_REVIEW_DAYS,EVIDENCE_LABEL} from '../src/lib/recorderJourney.ts';
import {scoreTaps} from '../src/lib/tapScore.ts';
import {validatePhrase,barBeats} from '../src/lib/recorderFullCourse.ts';
import {createProfileStorage} from '../src/lib/profileStorage.ts';

const memory=()=>{const map=new Map();return {map,getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k),clear:()=>map.clear(),key:i=>[...map.keys()][i]??null,get length(){return map.size;}};};
const NAME={'recorder-soprano':'flauta','trumpet-bb':'trompete'};

for(const i of FORMATION_COURSES){
 test(`${NAME[i]}: plano completo do livro — 4 níveis, 16 módulos, 80 sequências, 400 unidades, 2.000 microlições`,()=>{
  const plan=formationPlan(i);assert.deepEqual(plan.levels.map(l=>l.title),['Iniciação','Básico','Intermediário','Avançado']);
  assert.deepEqual(plan.levels.map(l=>l.modules.length),[4,4,4,4]);
  assert.deepEqual(plan.levels.map(l=>l.modules.reduce((n,m)=>n+m.sequences.length,0)),[12,20,24,24]);
  const units=formationUnits(i);assert.equal(units.length,400);
  assert.deepEqual(units.map(u=>u.code),Array.from({length:400},(_,k)=>`U${String(k+1).padStart(3,'0')}`));
  assert.deepEqual(units.filter(u=>u.checkpoint).map(u=>u.number),[15,30,45,60,85,110,135,160,190,220,250,280,310,340,370,400]);
  for(const u of units){assert.ok(u.objective.length>8,u.code);assert.ok(plan.types[u.type],u.code);for(const r of u.review)if(r!=='entrada')assert.ok(formationUnit(i,r),`${u.code} retoma ${r}`);}
  const j=formationJourney(i);assert.equal(j.stops.length,400);assert.equal(j.units.length,16);
  assert.equal(j.stops.reduce((n,s)=>n+s.lessonIds.length,0),2000);
  assert.deepEqual(j.stops[0].lessonIds.map(l=>bandLessonName(i,l)),[...MICRO_NAMES]);
  assert.equal(j.stops.find(s=>s.label==='U037').mission,i==='recorder-soprano'?'Duas notas: si e lá':'Primeira altura estável');
  assert.equal(bandJourney(i),j);assert.ok(isBand(i));
 });
 test(`${NAME[i]}: cada microlição tem telas válidas, IDs únicos e toda nota tem dedilhado e tela “Nota nova” antes de ser cobrada`,()=>{
  const seen=new Set(),ids=new Set(),kinds=new Set();let screens=0;
  for(const stop of formationJourney(i).stops)for(const lesson of stop.lessonIds){
   const list=bandExercises(i,lesson);assert.ok(list.length>=2&&list.length<=10,`${lesson}: ${list.length} telas`);screens+=list.length;
   assert.ok(bandLessonTasks(i,lesson).length===3);
   for(const e of list){
    assert.ok(!ids.has(e.id),'repetido '+e.id);ids.add(e.id);kinds.add(e.kind);
    assert.match(e.id,/^[A-Z0-9.-]+-P\d$/);assert.ok(e.id.startsWith(stop.id+'-'));
    assert.ok(e.instruction&&e.prompt&&e.hint!==undefined&&e.evidence.length&&e.evidence.every(x=>EVIDENCE_LABEL[x]),e.id);
    if(e.kind==='meet')seen.add(e.target);
    const used=[e.target,...(e.notes??[]).map(n=>n.midi),...(e.options??[]).map(o=>o.midi),...(e.create?.choices??[])].filter(x=>typeof x==='number');
    if(['build','perform','read','fingering'].includes(e.kind))for(const n of used){assert.ok(bandFingering(i,n),`${e.id}: sem dedilhado para ${n}`);assert.ok(seen.has(n),`${e.id}: ${n} cobrada antes da Nota nova`);}
    if(e.options&&e.answer!==undefined){assert.ok(e.answer>=0&&e.answer<e.options.length,e.id);assert.ok(e.options.length>=2,e.id+' só uma opção');assert.equal(new Set(e.options.map(o=>o.label)).size,e.options.length,e.id+' opções repetidas');}
    assert.doesNotMatch(`${e.instruction} ${e.prompt}`,/undefined|NaN|furos e chaves|Qual destes era o objetivo/,e.id);
    if(e.kind==='perform')assert.ok(validatePhrase(e.notes,e.meter),e.id);
   }
  }
  for(const k of ['observe','meet','theory','build','fingering','listen','compare','read','perform','tap','create'])assert.ok(kinds.has(k),'falta tipo '+k);
  assert.ok(screens>5000&&screens<14000,`total de telas ${screens}`);
 });
}

test('ordem das notas segue o livro: flauta si→lá→sol, dó/ré agudos no M05, graves no M07; trompete começa no sol',()=>{
 const f='recorder-soprano',t='trumpet-bb',at=(i,code)=>formationPool(i,formationUnit(i,code));
 assert.deepEqual(at(f,'U031'),[71]);assert.deepEqual(at(f,'U036'),[71,69]);assert.deepEqual(at(f,'U041'),[71,69,67]);
 assert.ok(!at(f,'U075').includes(72));assert.ok(at(f,'U076').includes(72)&&at(f,'U076').includes(74));
 assert.ok(at(f,'U111').includes(65)&&!at(f,'U111').includes(60));assert.ok(at(f,'U131').includes(70));
 assert.deepEqual(at(t,'U001'),[]);assert.deepEqual(at(t,'U036'),[67]);assert.ok(at(t,'U111').includes(60));
 assert.deepEqual(focusNotes('Localizar fá natural no dedilhado barroco',at(f,'U111')),[65]);
 assert.deepEqual(focusNotes('Alternar si e lá lentamente',at(f,'U037')),[69,71]);
 assert.deepEqual(focusNotes('Tocar uma peça curta em sol maior',at(f,'U130')),[]);
 const meet=bandExercises(f,'FLA-U031-L2').find(e=>e.kind==='meet');assert.equal(meet.target,71);assert.deepEqual(bandFingering(f,71),['0','1']);
 assert.equal(soundingOffset(f),12);
 // notas agudas: 2º registro da flauta e região aguda do trompete
 assert.deepEqual(focusNotes('Obter mi agudo com orientação',at(f,'U162')),[76]);assert.deepEqual(focusNotes('Alternar fá, sol e lá agudos',at(f,'U168')),[77,79,81]);
 assert.deepEqual(focusNotes('Localizar mi bemol',at(f,'U208')),[75]);
 assert.deepEqual(bandFingering(f,76),['Ø','1','2','3','4','5']);assert.deepEqual(bandFingering(f,81),['Ø','1','2']);
 assert.ok(bandExercises(f,'FLA-U162-L2').some(e=>e.kind==='meet'&&e.target===76));assert.ok(!at(f,'U160').includes(76));
 assert.deepEqual(bandFingering(t,79),[]);assert.deepEqual(bandFingering(t,76),['1','2']);assert.ok(at(t,'U181').includes(76)&&!at(t,'U180').includes(76));assert.ok(at(t,'U371').includes(81));
 assert.ok(!formationJourney(f).stops.some(s=>s.lessonIds.some(l=>bandExercises(f,l).some(e=>/notas além do app/.test(e.instruction))&&!/U297/.test(s.id))));
});

test('unidades sem instrumento não pedem microfone; as de tocar praticam de verdade e terminam sem modelo',()=>{
 const t='trumpet-bb';
 for(const code of ['U001','U017','U020']){const all=[1,2,3,4,5].flatMap(k=>bandExercises(t,`TPT-${code}-L${k}`));assert.ok(!all.some(e=>e.kind==='perform'),code);}
 const demo=bandExercises('recorder-soprano','FLA-U045-L5');assert.ok(demo.some(e=>e.kind==='perform'&&e.noModel));
 const all=bandExercises('recorder-soprano','FLA-U037-L1');assert.equal(all[0].kind,'perform');assert.match(all[0].prompt,/U036/);assert.match(all[0].instruction,/^Retome: /);
 assert.ok(!formationJourney('recorder-soprano').stops.flatMap(s=>s.lessonIds).some(l=>bandExercises('recorder-soprano',l).some(e=>/Qual destes era o objetivo|qual evidência mostra/i.test(e.prompt))),'sem perguntas sobre o próprio plano');
 const practice=bandExercises('recorder-soprano','FLA-U122-L3');assert.ok(practice.filter(e=>e.kind==='perform').length>=2);
});
test('o avançado é mais difícil: frases mais longas, mais rápidas, com figuras e compassos que a iniciação não tem',()=>{
 const stats=(i,from,to)=>{const ps=formationUnits(i).filter(u=>u.number>=from&&u.number<=to).flatMap(u=>[1,2,3,4,5].flatMap(k=>bandExercises(i,`${u.stopId}-L${k}`))).filter(e=>e.kind==='perform');
  return {beats:ps.reduce((n,e)=>n+e.notes.reduce((m,x)=>m+x.beats,0),0)/ps.length,bpm:ps.reduce((n,e)=>n+e.bpm,0)/ps.length,eighths:ps.filter(e=>e.notes.some(x=>x.beats===.5)).length/ps.length,dotted:ps.some(e=>e.notes.some(x=>x.beats===1.5)),meters:new Set(ps.map(e=>e.meter)),noModel:ps.filter(e=>e.noModel).length/ps.length,count:ps.length};};
 for(const i of FORMATION_COURSES){
  const ini=stats(i,31,60),adv=stats(i,281,400);
  assert.ok(adv.beats>=ini.beats*2,`${i}: tamanho ${ini.beats} → ${adv.beats}`);assert.ok(adv.bpm>=ini.bpm+25,`${i}: andamento ${ini.bpm} → ${adv.bpm}`);
  assert.equal(ini.eighths,0);assert.ok(adv.eighths>.6,`${i}: colcheias ${adv.eighths}`);assert.ok(adv.dotted);assert.ok(!ini.dotted);
  assert.deepEqual([...ini.meters],['4/4']);assert.ok(adv.meters.has('6/8')&&adv.meters.has('3/4'));assert.ok(adv.noModel>ini.noModel);
  assert.ok(adv.count/120>=ini.count/30*0.9,`${i}: prática por unidade`);
 }
});

test('conclusão: XP, revisão em D+1, +3, +7, +14, o que errou volta na revisão e a unidade fecha após as 5 microlições',()=>{
 const i='recorder-soprano',s=memory(),at=new Date('2026-11-06T12:00:00Z'),stop=formationJourney(i).stops[36];
 for(const [k,lesson] of stop.lessonIds.entries()){
  const ex=bandExercises(i,lesson),outcome={lessonId:lesson,stopId:stop.id,review:false,at:new Date(at.getTime()+k*1000),presentations:ex.map((e,n)=>({id:e.id,correctFirst:!(k===2&&n===0),recovered:k===2&&n===0,evidence:e.evidence}))};
  const done=completeBandLesson(s,i,outcome);assert.equal(done.xp,lessonXp(outcome));
 }
 const {ledger}=readBandJourney(s,i);assert.ok(ledger.stops[stop.id].completedAt);assert.equal(ledger.reviewNeeded.length,1);
 const day=iso=>Math.round((Date.parse(iso)-at.getTime())/86400000);assert.equal(day(ledger.stops[stop.id].nextReview),1);
 const o=formationOverview(s,i);assert.equal(o.stopsDone,1);assert.equal(o.lessonsDone,5);assert.equal(o.stopsTotal,400);assert.equal(o.lessonsTotal,2000);assert.equal(o.current.id,'FLA-U038');
 assert.ok(s.getItem(formationKey(i)));assert.equal(s.getItem(formationKey('trumpet-bb')),null);
 assert.equal(Object.keys(ledger.lessons).length,5);assert.ok(Object.keys(ledger.presentations).length<=1,'detalhe das telas de unidade concluída é enxugado');
 assert.deepEqual(normalizeReviewDays([2,5,9]),[2,5,9]);assert.deepEqual(normalizeReviewDays([3,1]),DEFAULT_REVIEW_DAYS);
});

test('persistência: perfis isolados, registro quebrado não é sobrescrito e IDs de outra trilha são recusados',()=>{
 const backing=memory(),ana=createProfileStorage('11111111-1111-4111-8111-111111111111',backing),bia=createProfileStorage('22222222-2222-4222-8222-222222222222',backing);
 const i='trumpet-bb',l='TPT-U001-L1',ex=bandExercises(i,l);
 completeFormationLesson(ana,i,{lessonId:l,stopId:'TPT-U001',review:false,at:new Date(),presentations:ex.map(e=>({id:e.id,correctFirst:true,recovered:false,evidence:e.evidence}))});
 assert.ok(readFormation(ana,i).ledger.xp>0);assert.equal(readFormation(bia,i).ledger.xp,0);
 const broken=memory();broken.setItem(formationKey(i),JSON.stringify({version:1,lessons:{'FLA-U001-L1':{at:'2026-11-01T00:00:00Z',xp:10}}}));
 const r=readFormation(broken,i);assert.equal(r.safeToWrite,false);assert.match(r.warning,/Nada foi apagado/);
});

test('registro da trilha inteira cabe no armazenamento (limite de leitura 900 mil caracteres)',()=>{
 const i='trumpet-bb',s=memory(),at=new Date('2026-11-06T12:00:00Z');
 for(const stop of formationJourney(i).stops)for(const lesson of stop.lessonIds){const ex=bandExercises(i,lesson);completeFormationLesson(s,i,{lessonId:lesson,stopId:stop.id,review:false,at,presentations:ex.map(e=>({id:e.id,correctFirst:true,recovered:false,evidence:e.evidence}))});}
 const raw=s.getItem(formationKey(i));assert.ok(raw.length<900000,`registro com ${raw.length} caracteres`);
 assert.equal(readFormation(s,i).safeToWrite,true);assert.equal(formationOverview(s,i).stopsDone,400);
});

test('toques: tolerância, toque cedo e toques extras',()=>{
 assert.equal(scoreTaps([0,1],[0.05,1.1],1000).ok,true);
 assert.equal(scoreTaps([0],[0,2],1000).ok,false);assert.equal(scoreTaps([0],[0,2],1000).extra,1);
 assert.equal(scoreTaps([1],[0.02],1000).early,1);assert.equal(barBeats('3/4'),3);
});
