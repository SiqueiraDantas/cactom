import test from 'node:test';
import assert from 'node:assert/strict';
import {bandLessons,bandExercises,bandFingering,bandOverview,completeBandLesson,readBand,readBandJourney,bandKey,bandJourneyKey,bandJourney,challengeId} from '../src/lib/bandTrail.ts';
import {evaluateCourse,courseScoreEvents} from '../src/lib/recorderFullCourse.ts';

const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
for(const inst of ['clarinet-bb'])test(`${inst}: toda nota é ensinada (tela Nota nova) antes de ser cobrada; exemplos na própria tela; nada de professor`,()=>{
 const seen=new Set();
 for(const l of bandJourney(inst).stops.flatMap(s=>s.lessonIds).map(id=>({id}))){
  const ex=bandExercises(inst,l.id),meets=new Set(ex.filter(e=>e.kind==='meet').map(e=>e.target));
  for(const e of ex){
   assert.doesNotMatch(`${e.instruction} ${e.prompt} ${e.hint}`,/professor/i,e.id);
   const used=[e.target,...(e.notes??[]).map(n=>n.midi)].filter(n=>n!==undefined&&n!==null);
   for(const n of used)assert.ok(seen.has(n)||meets.has(n),`${e.id}: nota ${n} sem tela de nota nova antes`);
   if(e.kind==='fingering'){assert.deepEqual(e.options[e.answer].keys,bandFingering(inst,e.target));assert.equal(new Set(e.options.map(o=>o.keys.join())).size,e.options.length,'opções com dedilhados diferentes');}
   if(e.kind==='listen'||e.kind==='read')assert.ok(e.notes?.length&&(e.target===undefined||e.options[e.answer].midi===e.target),e.id);
   if(e.kind==='build')assert.ok(bandFingering(inst,e.target),e.id);
   if(e.kind==='tap'){assert.ok(e.tapBeats.length>0&&e.tapBeats.every(b=>b>=0&&b<e.tapLength),e.id);}
   if(e.kind==='create'){assert.ok(e.create.choices.includes(null));for(const c of e.create.choices.filter(x=>x!==null))assert.ok(seen.has(c)||meets.has(c),e.id);if(e.create.rule==='match')assert.ok(e.create.target.every(t=>e.create.choices.includes(t))&&e.create.target.filter(t=>t!==null).length>=2,e.id);}
   if(e.kind==='perform'){const total=e.notes.reduce((n,x)=>n+x.beats,0);assert.equal(total%(e.meter==='3/4'?3:4),0,e.id+' compasso completo');assert.ok(e.notes.some(n=>n.midi!==null));}
   if(e.options)assert.ok(Number.isInteger(e.answer)&&e.answer<e.options.length,e.id);
  }
  for(const e of ex)for(const n of [e.target,...(e.notes??[]).map(x=>x.midi)])if(n!==undefined&&n!==null)seen.add(n);
 }
 assert.ok(seen.has(66)&&seen.has(70),'Fá♯ e Si♭ ensinados');
});
for(const inst of ['clarinet-bb'])test(`${inst}: plano igual ao da flauta — 4 seções, 16 módulos, 5 lições por módulo, 3 atividades por lição`,async()=>{
 const {bandTrail}=await import('../src/lib/bandTrail.ts');
 const units=bandTrail(inst);assert.equal(units.length,16);assert.deepEqual([...new Set(units.map(u=>u.section))],[1,2,3,4]);
 for(const u of units){assert.equal(u.lessons.length,5);assert.deepEqual(u.lessons.map(l=>l.title),['Descobrir','Discriminar','Executar','Ler e criar','Aplicar e recuperar']);for(const l of u.lessons){assert.equal(l.tasks.length,3);assert.ok(bandExercises(inst,l.id).length>=3,l.id);}}
 assert.equal(bandLessons(inst).length,80);
});
test('dedilhados vêm dos cursos existentes: trompete Ré = pistos 1 e 3; clarinete Mi = polegar + indicador',()=>{
 assert.deepEqual(bandFingering('trumpet-bb',62),['1','3']);assert.deepEqual(bandFingering('trumpet-bb',67),[]);
 assert.deepEqual(bandFingering('clarinet-bb',64),['T','1']);assert.deepEqual(bandFingering('clarinet-bb',67),[]);
 assert.deepEqual(bandFingering('trumpet-bb',66),['2']);assert.deepEqual(bandFingering('trumpet-bb',70),['1']);assert.deepEqual(bandFingering('clarinet-bb',66),['1']);assert.deepEqual(bandFingering('clarinet-bb',70),['A','R']);
});
for(const inst of ['clarinet-bb'])test(`${inst}: mesmo molde da flauta — 4 áreas por unidade, 3 atividades × 2 apresentações (descoberta e exemplo novo) e desafio por seção`,()=>{
 const j=bandJourney(inst);assert.equal(j.units.length,16);assert.equal(j.stops.length,68);
 for(const u of j.units){assert.deepEqual(u.stops.slice(0,4).map(s=>s.kind),['descoberta','pratica','criacao','missao']);assert.equal(u.stops[0].lessonIds.length,2,'Descoberta tem duas lições');
  assert.equal(u.stops.length,[4,8,12,16].includes(u.number)?5:4);if(u.stops[4])assert.equal(u.stops[4].kind,'desafio');}
 for(const l of bandLessons(inst)){const ex=bandExercises(inst,l.id),main=ex.filter(e=>e.phase!=='apoio');
  assert.equal(main.length,6,l.id);for(const a of [1,2,3])assert.deepEqual(main.filter(e=>e.taskId===`${l.id}-A${a}`).map(e=>e.phase),['descoberta','aplicacao'],l.id);
  assert.ok(ex.every(e=>/^[A-Z0-9.-]+-P\d$/.test(e.id)),l.id);}
 const kinds=new Set(bandLessons(inst).flatMap(l=>bandExercises(inst,l.id).map(e=>e.kind)));
 for(const k of ['meet','observe','fingering','build','listen','compare','read','theory','story','perform','tap','create'])assert.ok(kinds.has(k),`tipo ${k}`);
 for(const s of [1,2,3,4]){const d=bandExercises(inst,challengeId(inst,s));assert.equal(d.length,8);assert.ok(d.some(e=>e.kind==='perform'&&e.noModel));}
});
test('trilha do trompete/clarinete alimenta Rojão, Progresso e Conquistas, com revisão espaçada e separada por instrumento',()=>{
 const s=mem();assert.equal(bandOverview(s,'clarinet-bb').lessonsDone,0);
 const at=new Date('2026-11-04T12:00:00Z'),pres=id=>bandExercises('clarinet-bb',id).map(e=>({id:e.id,correctFirst:true,recovered:false,evidence:e.evidence}));
 completeBandLesson(s,'clarinet-bb',{lessonId:'CLA-M01-L1',stopId:'CLA-U01-descoberta',review:false,at,presentations:pres('CLA-M01-L1')});
 let o=bandOverview(s,'clarinet-bb');assert.equal(o.lessonsDone,1);assert.ok(o.xp>=10);assert.equal(o.current.id,'CLA-U01-descoberta');assert.equal(o.open.lessonId,'CLA-M01-L2');
 const miss=pres('CLA-M01-L2');miss[3].correctFirst=false;
 const r=completeBandLesson(s,'clarinet-bb',{lessonId:'CLA-M01-L2',stopId:'CLA-U01-descoberta',review:false,at,presentations:miss});
 assert.ok(r.ledger.stops['CLA-U01-descoberta'].nextReview,'parada concluída agenda revisão D+1');assert.ok(r.ledger.reviewNeeded.includes(miss[3].id),'o que errou volta na revisão');
 o=bandOverview(s,'clarinet-bb');assert.equal(o.stopsDone,1);assert.equal(o.reviews.length,1);assert.equal(o.current.id,'CLA-U01-pratica');
 assert.equal(bandOverview(s,'trumpet-bb').lessonsDone,0);assert.ok(s.getItem(bandJourneyKey('clarinet-bb')));
 assert.equal(readBand({getItem:()=>'{quebrado'},'clarinet-bb').xp,0);
});
test('clarinete: quem já tinha começado não perde nada — lições do registro antigo entram na trilha nova',()=>{
 const s=mem();s.setItem(bandKey('clarinet-bb'),JSON.stringify({version:1,lessons:{'CLA-M01-L1':{at:'2026-11-01T10:00:00Z',xp:13,total:5,correctFirst:3},'CLA-M01-L2':{at:'2026-11-02T10:00:00Z',xp:12,total:5,correctFirst:2}},xp:25}));
 const {ledger}=readBandJourney(s,'clarinet-bb');assert.equal(ledger.xp,25);assert.ok(ledger.lessons['CLA-M01-L1']&&ledger.lessons['CLA-M01-L2']);
 const o=bandOverview(s,'clarinet-bb');assert.equal(o.stopsDone,1);assert.equal(o.current.id,'CLA-U01-pratica');assert.ok(s.getItem(bandKey('clarinet-bb')),'registro antigo continua lá');
});
test('regência bloqueada: não aparece como curso disponível',async()=>{
 const {availableInstrument,INSTRUMENTS}=await import('../src/lib/instruments.ts');
 assert.equal(availableInstrument('conductor'),null);assert.equal(INSTRUMENTS.find(i=>i.id==='conductor').available,false);
});
test('microfone do trompete/clarinete confere o som real (1 tom abaixo do escrito)',()=>{
 const notes=[{midi:67,beats:2},{midi:null,beats:2}],ev=courseScoreEvents(notes,'4/4'),hz=440*2**((67-2-69)/12),real=[];
 for(let at=0;at<4000;at+=90)real.push({at,frequency:at>=150&&at<1900?hz:null});
 assert.deepEqual(evaluateCourse(notes,'4/4',real,60,0,-2).map(v=>v.passed),[true,true]);
 assert.equal(evaluateCourse(notes,'4/4',real,60,0).map(v=>v.passed)[0],false,'com a transposição da flauta não passa');
 assert.equal(ev.length,2);
});
test('digitações conferidas com as tabelas: trompete (Tonestro, Si♭ e Dó iguais) e clarinete (Yamaha)',async()=>{
 const T={60:[],62:['1','3'],64:['1','2'],65:['1'],66:['2'],67:[],69:['1','2'],70:['1'],71:['2'],72:[],74:['1']};
 for(const [m,v] of Object.entries(T))assert.deepEqual(bandFingering('trumpet-bb',Number(m)),v,'trompete '+m);
 const C={55:['T','1','2','3','4','5','6'],57:['T','1','2','3','4','5'],60:['T','1','2','3'],62:['T','1','2'],64:['T','1'],65:['T'],66:['1'],67:[],69:['A'],70:['A','R']};
 for(const [m,v] of Object.entries(C))assert.deepEqual(bandFingering('clarinet-bb',Number(m)),v,'clarinete '+m);
 const {soundingOffset}=await import('../src/lib/bandTrail.ts');assert.equal(soundingOffset('trumpet-bb','sib'),-2);assert.equal(soundingOffset('trumpet-bb','do'),0);assert.equal(soundingOffset('clarinet-bb','do'),-2);
 const first=bandExercises('clarinet-bb','CLA-M01-L1');assert.equal(first[0].kind,'observe');assert.match(first[0].instruction,/Sente/);
 const f=await import('../src/lib/formacao.ts');for(const [i,word] of [['trumpet-bb',/embocadura/i],['recorder-soprano',/boca na flauta/i]]){const u=f.formationUnits(i).find(x=>f.formationPool(i,x).length&&['tecnica','emissao','leitura','conjunto','demonstracao','criacao'].includes(x.type));assert.ok(bandExercises(i,`${u.stopId}-L2`).some(e=>e.kind==='observe'&&word.test(e.instruction)),i);}
});
