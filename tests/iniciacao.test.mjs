import test from 'node:test';
import assert from 'node:assert/strict';
const I=await import('../src/lib/iniciacao.ts');
const B=await import('../src/lib/bandTrail.ts');
const {INSTRUMENTS}=await import('../src/lib/instruments.ts');

test('iniciação: curso disponível, 16 unidades com 4 áreas e 4 desafios',()=>{
 const c=INSTRUMENTS.find(i=>i.id==='iniciacao');assert.ok(c?.available);assert.ok(B.isBand('iniciacao'));
 assert.equal(I.INI_MODULES.length,16);assert.equal(I.INI_LESSONS.length,80);
 const j=I.iniJourney();assert.equal(j.stops.length,68);assert.equal(j.stops.filter(s=>s.kind==='desafio').length,4);
 assert.deepEqual(I.INI_SECTIONS,['O som','Notas e figuras','Leitura na tua clave','Autonomia musical']);
});

const CHOICE=new Set(['listen','compare','read','theory','story']);
for(const clef of ['sol','fa'])test(`iniciação (${clef}): toda tela tem resposta válida, compassos cheios e nada de dedilhado`,()=>{
 const lessons=I.iniJourney().stops.flatMap(s=>s.lessonIds);
 for(const id of lessons){
  const list=I.iniExercises(id,clef);assert.ok(list.length>=6||id.includes('DESAFIO'),id);
  const ids=new Set(list.map(e=>e.id));assert.equal(ids.size,list.length,`ids repetidos em ${id}`);
  for(const e of list){
   assert.ok(!['build','fingering','perform','observe'].includes(e.kind),`${e.id}: ${e.kind} precisa de instrumento`);
   if(CHOICE.has(e.kind)){assert.ok(e.options?.length>=2,e.id);assert.ok(Number.isInteger(e.answer)&&e.answer>=0&&e.answer<e.options.length,`${e.id} resposta ${e.answer}`);
    assert.equal(new Set(e.options.map(o=>o.label)).size,e.options.length,`${e.id}: opções repetidas`);}
   if(e.kind==='compare')assert.ok(e.notes&&e.alternative,e.id);
   if(e.kind==='tap'){assert.ok(e.tapBeats.length>0&&e.tapLength>0,e.id);assert.ok(e.tapBeats.every(b=>b>=0&&b<e.tapLength),e.id);}
   if(e.kind==='create'){assert.ok(e.create.slots>=3,e.id);if(e.create.rule==='match')assert.equal(e.create.target.length,e.create.slots);}
   if(e.notes&&(e.kind==='read'||e.kind==='tap'&&e.score)){const bar=e.meter==='3/4'?3:4,total=e.notes.reduce((n,x)=>n+x.beats,0);assert.equal(total%bar,0,`${e.id}: compasso incompleto (${total})`);
    let at=0;for(const n of e.notes){assert.ok(at%bar+n.beats<=bar+1e-9,`${e.id}: figura atravessa a barra`);at+=n.beats;}}
   if(e.kind==='meet')assert.ok(e.target!==undefined&&e.clef,e.id);
  }
 }
});

test('iniciação: a partir da unidade 9 a leitura é na clave escolhida, dentro da pauta',()=>{
 for(const [clef,lo,hi] of [['sol',60,79],['fa',43,59]]){
  for(let u=9;u<=16;u++){const pool=I.readingPool(u,clef);assert.ok(pool.length>=3);assert.ok(pool.every(n=>n>=lo&&n<=hi),`${clef} ${u}: ${pool}`);}
  const reads=I.INI_LESSONS.filter(l=>l.unit>=9).flatMap(l=>I.iniExercises(l.id,clef)).filter(e=>e.kind==='read'&&e.instruction==='Que nota é essa?');
  assert.ok(reads.length>10);assert.ok(reads.every(e=>e.clef===clef),'clave certa');
  assert.ok(reads.every(e=>e.notes.every(n=>n.midi===null||n.midi>=lo&&n.midi<=hi)));
 }
 assert.equal(I.iniName(53),'Fá');assert.equal(I.iniName(43),'Sol grave');assert.equal(I.iniName(72),'Dó agudo');
 const before=I.iniExercises('INI-M06-L1','fa').filter(e=>e.clef);assert.ok(before.every(e=>e.clef==='sol'),'antes da unidade 9 é sempre clave de Sol');
});

test('iniciação: clave salva no perfil e trilha registra XP como os outros cursos',()=>{
 const m=new Map(),store={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v))};
 assert.equal(I.readClef(store),null);I.saveClef(store,'fa');assert.equal(I.readClef(store),'fa');
 const stop=I.iniJourney().stops[0];
 const r=B.completeBandLesson(store,'iniciacao',{lessonId:stop.lessonIds[0],stopId:stop.id,review:false,at:new Date(),presentations:[{id:stop.lessonIds[0]+'-A1-P1',correctFirst:true,recovered:false,evidence:['escuta']}]});
 assert.ok(r.xp>0);assert.equal(B.bandOverview(store,'iniciacao').lessonsDone,1);
 assert.equal(B.bandLessonName('iniciacao',stop.lessonIds[0]),'Descobrir');
});
