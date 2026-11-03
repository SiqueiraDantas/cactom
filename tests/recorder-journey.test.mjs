import test from 'node:test';
import assert from 'node:assert/strict';
import {JOURNEY_STOPS,JOURNEY_UNITS,SECTION_MILESTONES,stopForLegacyId,emptyJourney,completeLesson,stopState,currentStop,readJourney,writeJourney,normalizeJourney,lessonXp,evidenceSummary,normalizeReviewDays,JOURNEY_KEY,DEFAULT_REVIEW_DAYS} from '../src/lib/recorderJourney.ts';
import {EXERCISES,lessonExercises,unitCounts,checkFingering,checkCreation,scoreTaps,tapFeedback,contour,newExample,exerciseById,fingeringFor} from '../src/lib/recorderExercises.ts';
import {COURSE_TASKS,validatePhrase} from '../src/lib/recorderFullCourse.ts';
import {recorderNote} from '../src/lib/recorder.ts';
import {createProfileStorage} from '../src/lib/profileStorage.ts';

const curricular=COURSE_TASKS.filter(t=>!t.assessment);
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),map:m};};

test('trilha: 16 unidades × 4 paradas = 64; Descoberta reúne L1–L2, Prática L3, Criação L4, Missão L5',()=>{
 assert.equal(JOURNEY_UNITS.length,16);assert.equal(JOURNEY_STOPS.length,64);
 for(const unit of JOURNEY_UNITS){
  assert.deepEqual(unit.stops.map(s=>s.kind),['descoberta','pratica','criacao','missao']);
  const m=String(unit.number).padStart(2,'0');
  assert.deepEqual(unit.stops[0].lessonIds.map(l=>l.slice(-3)),['L01','L02']);
  assert.deepEqual(unit.stops.slice(1).map(s=>s.lessonIds.map(l=>l.slice(-3))),[['L03'],['L04'],['L05']]);
  assert.ok(unit.stops.every(s=>s.lessonIds.every(l=>l.includes(`-M${m}-`))));
 }
 const lessons=JOURNEY_STOPS.flatMap(s=>s.lessonIds);assert.equal(lessons.length,80);assert.equal(new Set(lessons).size,80);
 assert.deepEqual(SECTION_MILESTONES.map(m=>m.afterUnit),[4,8,12,16]);assert.equal(SECTION_MILESTONES.flatMap(m=>m.assessments).length,12);
});
test('mapa de IDs antigos: cada uma das 240 atividades, 80 microlições e 16 módulos cai em uma única parada',()=>{
 for(const task of curricular){const stop=stopForLegacyId(task.id);assert.ok(stop,task.id);assert.ok(stop.taskIds.includes(task.id));assert.equal(JOURNEY_STOPS.filter(s=>s.taskIds.includes(task.id)).length,1);}
 assert.equal(stopForLegacyId('S1-M01-L02').id,'U01-descoberta');assert.equal(stopForLegacyId('S3-M10-L04-A02').id,'U10-criacao');assert.equal(stopForLegacyId('S4-M16').id,'U16-descoberta');
 assert.equal(JOURNEY_STOPS.reduce((n,s)=>n+s.taskIds.length,0),240);
});
test('banco: 480 apresentações (2 por tarefa-base), 30 na Unidade 1 conforme o caderno, todas com instrução, pista, feedback, gabarito e evidência',()=>{
 assert.equal(EXERCISES.length,480);
 for(const task of curricular)assert.equal(EXERCISES.filter(e=>e.taskId===task.id).length,2,task.id);
 assert.equal(EXERCISES.filter(e=>e.unit===1).length,30);
 for(const e of EXERCISES){
  assert.ok(e.instruction&&e.hint&&e.answerKey,e.id);assert.ok(e.evidence.length>0,e.id);
  if(e.status==='rascunho'){assert.ok(e.draftReason,e.id);continue;}
  if(e.kind==='choice'){assert.ok(e.options.length>=2,e.id);assert.ok(e.anyAnswer||Number.isInteger(e.answer)&&e.answer<e.options.length,e.id);assert.ok(e.correct,e.id);assert.ok(e.anyAnswer||e.incorrect,e.id);if(e.audio)assert.ok(e.notes?.length,e.id);if(e.audio==='AB')assert.ok(e.alternative?.length,e.id);}
  if(e.kind==='fingering')assert.ok(e.holes.length||e.target!==undefined,e.id);
  if(e.kind==='tap'){assert.ok(e.tapBeats.length>0,e.id);assert.ok(e.tapBeats.every(b=>b>=0&&b<e.tapLength),e.id);}
  if(e.kind==='perform')assert.ok(validatePhrase(e.notes,e.meter),e.id);
  if(e.kind==='observe')assert.ok(e.audio?e.notes?.length&&e.alternative?.length:e.checklist.length>=2,e.id);
  assert.ok(!e.teacher&&!e.evidence.includes('avaliacao-docente')||e.status==='rascunho',`${e.id}: a criança estuda sozinha, sem depender do professor`);
  assert.doesNotMatch(`${e.instruction} ${e.prompt??''} ${(e.checklist??[]).join(' ')}`,/professor/i,e.id);
  if(e.kind==='create')assert.ok(e.create.slots>0&&e.create.choices.length>=2,e.id);
 }
 const u1=lessonExercises('S1-M01-L01');assert.equal(u1.length,6);assert.equal(u1[0].instruction,'Aponte o bocal no desenho.');assert.equal(lessonExercises('S1-M01-L05')[5].teacher,undefined);assert.equal(lessonExercises('S1-M01-L02')[0].audio,'AB');
});
test('material musical correto: SI = 0 e 1; Fá respeita o sistema; contornos e notas mais agudas vêm dos próprios dados',()=>{
 assert.deepEqual(fingeringFor(71),[0,1]);assert.deepEqual(fingeringFor(65,'german'),[0,1,2,3,4]);assert.equal(fingeringFor(66),null);
 for(const e of EXERCISES.filter(x=>x.kind==='fingering'&&x.status==='pronto'&&x.target!==undefined))assert.deepEqual([...e.holes].sort(),[...recorderNote(e.target).holes].sort(),e.id);
 const si=exerciseById('S1-M01-L03-A01-P1');assert.deepEqual(si.options[si.answer].holes,[0,1]);
 for(const e of EXERCISES.filter(x=>x.prompt?.startsWith('Do primeiro ao último som')))assert.equal(['sobe','desce','igual'][e.answer],contour(e.notes),e.id);
 for(const e of EXERCISES.filter(x=>x.prompt==='Qual destas notas é a mais aguda no exemplo?')){const top=Math.max(...e.notes.filter(n=>n.midi!==null).map(n=>n.midi));assert.ok(e.options[e.answer].label.length>0);assert.ok(e.answerKey.includes(String(top)),e.id);}
 assert.equal(contour([{midi:71,beats:1},{midi:69,beats:1}]),'desce');
 const fresh=newExample([{midi:71,beats:1},{midi:69,beats:1},{midi:67,beats:1},{midi:null,beats:1}],[71,69,67],'4/4');assert.ok(validatePhrase(fresh,'4/4',[71,69,67]));assert.notDeepEqual(fresh.map(n=>n.midi),[71,69,67,null]);
 assert.ok(checkFingering(exerciseById('S1-M01-L02-A02-P2'),[1,0]));assert.ok(!checkFingering(exerciseById('S1-M01-L02-A02-P2'),[0,1,2]));
});
test('toques: tolerância, toque cedo no primeiro pulso recebe a pista do caderno, toques extras falham',()=>{
 assert.equal(scoreTaps([0,1],[0.05,1.1],1000).ok,true);
 const entry=exerciseById('S1-M01-L05-A02-P2');assert.deepEqual(entry.tapBeats,[1]);
 const early=scoreTaps(entry.tapBeats,[0.02],1000);assert.equal(early.ok,false);
 assert.equal(tapFeedback(entry,early),'Sua nota começou no primeiro pulso. Prepare o dedo ali e espere o segundo para tocar.');
 assert.equal(scoreTaps([0],[0,2],1000).ok,false);assert.equal(scoreTaps([0],[0,2],1000).extra,1);
 assert.equal(scoreTaps([0,2],[0.1,2.05],1000).ok,true);
});
test('criação: regras do caderno (três entradas, dois SI e dois LÁ, uma pausa, terminar no grave)',()=>{
 const three=exerciseById('S1-M01-L04-A03-P1');assert.ok(checkCreation(three,[71,null,71,71]));assert.ok(!checkCreation(three,[71,71,71,71]));assert.ok(!checkCreation(three,[71,undefined,71,71]));
 const pair=EXERCISES.find(e=>e.create?.rule==='two-each-71-69');assert.ok(checkCreation(pair,[69,71,71,69]));assert.ok(!checkCreation(pair,[71,71,71,69]));
 const low=EXERCISES.find(e=>e.create?.rule==='ends-low');const lowest=Math.min(...low.create.choices.filter(v=>v!==null));const v=Array(low.create.slots).fill(low.create.choices[0]);v[v.length-1]=lowest;assert.ok(checkCreation(low,v));v[v.length-1]=null;assert.ok(!checkCreation(low,v));
});
test('conclusão: XP de prática e recuperação, revisões em D+1, +3, +7, +14 e erro vai para revisão',()=>{
 const at=new Date('2026-11-02T12:00:00Z');let ledger=emptyJourney();
 const outcome={lessonId:'S1-M01-L03',stopId:'U01-pratica',review:false,at,presentations:[{id:'S1-M01-L03-A01-P1',correctFirst:true,recovered:false,evidence:['leitura']},{id:'S1-M01-L03-A02-P1',correctFirst:false,recovered:true,evidence:['medicao-automatica']},{id:'S1-M01-L03-A03-P1',correctFirst:false,recovered:false,evidence:['reflexao']}]};
 assert.equal(lessonXp(outcome),10+1+2);
 ledger=completeLesson(ledger,outcome);assert.equal(ledger.xp,13);assert.equal(ledger.lastStop,'U01-pratica');
 assert.ok(ledger.reviewNeeded.includes('S1-M01-L03-A02-P1'));
 const day=(iso)=>Math.round((Date.parse(iso)-at.getTime())/86400000);
 assert.equal(day(ledger.stops['U01-pratica'].nextReview),1);
 const expected=[3,7,14];let when=new Date(ledger.stops['U01-pratica'].nextReview);
 for(const total of expected){ledger=completeLesson(ledger,{...outcome,review:true,at:when,presentations:[{id:'S1-M01-L03-A02-P1',correctFirst:true,recovered:false,evidence:['medicao-automatica']}]});if(ledger.stops['U01-pratica'].nextReview){assert.equal(day(ledger.stops['U01-pratica'].nextReview),total);when=new Date(ledger.stops['U01-pratica'].nextReview);}}
 ledger=completeLesson(ledger,{...outcome,review:true,at:when,presentations:[{id:'S1-M01-L03-A02-P1',correctFirst:true,recovered:false,evidence:['medicao-automatica']}]});
 assert.equal(ledger.stops['U01-pratica'].reviewStep,4);assert.equal(ledger.stops['U01-pratica'].nextReview,undefined);
 assert.ok(!ledger.reviewNeeded.includes('S1-M01-L03-A02-P1'));
 const sum=evidenceSummary(ledger);assert.equal(sum['leitura'],1);assert.ok(sum['medicao-automatica']>=1);assert.equal(sum['avaliacao-docente'],0);
 assert.deepEqual(normalizeReviewDays([2,5,9]),[2,5,9]);assert.deepEqual(normalizeReviewDays([3,1]),DEFAULT_REVIEW_DAYS);
});
test('estados: disponível, em andamento, concluída, revisão; histórico antigo conclui lições; posição atual retorna ao ponto estudado',()=>{
 const descoberta=JOURNEY_STOPS[0],pratica=JOURNEY_STOPS[1];let ledger=emptyJourney();
 assert.equal(stopState(descoberta,ledger,{}).status,'disponivel');
 const legacy={};for(const t of descoberta.taskIds.filter(t=>t.startsWith('S1-M01-L01')))legacy[t]={report:'pratiquei'};
 const partial=stopState(descoberta,ledger,legacy);assert.equal(partial.status,'em-andamento');assert.equal(partial.done,1);assert.equal(partial.nextLesson,'S1-M01-L02');
 for(const t of descoberta.taskIds)legacy[t]={report:'pratiquei'};assert.equal(stopState(descoberta,ledger,legacy).status,'concluida');
 legacy['S1-M01-L02-A01']={report:'apoio'};assert.equal(stopState(descoberta,ledger,legacy).status,'revisao');
 assert.equal(currentStop(ledger,legacy).id,pratica.id);
 ledger=completeLesson(ledger,{lessonId:'S1-M01-L03',stopId:pratica.id,review:false,at:new Date('2026-11-02T12:00:00Z'),presentations:[{id:'S1-M01-L03-A01-P1',correctFirst:true,recovered:false,evidence:['leitura']}]});
 assert.equal(stopState(pratica,ledger,{},Date.parse('2026-11-02T13:00:00Z')).status,'concluida');
 assert.equal(stopState(pratica,ledger,{},Date.parse('2026-11-04T13:00:00Z')).status,'revisao');
 assert.equal(currentStop(ledger,legacy).id,'U01-criacao');
});
test('persistência: leitura validada, dados corrompidos não são sobrescritos e perfis ficam isolados',()=>{
 const backing=memory();const ana=createProfileStorage('11111111-1111-4111-8111-111111111111',backing),bia=createProfileStorage('22222222-2222-4222-8222-222222222222',backing);
 let ledger=completeLesson(emptyJourney(),{lessonId:'S1-M01-L01',stopId:'U01-descoberta',review:false,at:new Date(),presentations:[{id:'S1-M01-L01-A01-P1',correctFirst:true,recovered:false,evidence:['leitura']}]});
 assert.ok(writeJourney(ana,ledger));
 assert.equal(readJourney(ana).ledger.xp,11);assert.equal(readJourney(bia).ledger.xp,0);assert.equal(readJourney(bia).safeToWrite,true);
 assert.ok([...backing.map.keys()].every(k=>k.includes(JOURNEY_KEY)));assert.equal([...backing.map.keys()].length,1);
 const broken=memory();broken.setItem(JOURNEY_KEY,'{"version":1,"lessons":{"S9-M99":{}}}');const r=readJourney(broken);assert.equal(r.safeToWrite,false);assert.match(r.warning,/Nada foi apagado/);
 assert.equal(normalizeJourney({version:1,presentations:{'S1-M01-L01-A01-P1':{at:'2026-11-01T00:00:00Z',evidence:['inventada']}}}),null);
 assert.equal(normalizeJourney({version:2}),null);
});
test('contagem por unidade: implementadas, prontas e em rascunho somam 480',()=>{
 const counts=unitCounts();assert.equal(counts.length,16);assert.equal(counts.reduce((n,c)=>n+c.presentations,0),480);
 assert.equal(counts.reduce((n,c)=>n+c.ready+c.draft,0),480);assert.equal(counts[0].draft,0);
 for(const e of EXERCISES.filter(x=>x.status==='rascunho'))assert.ok(e.draftReason.length>20);
});
