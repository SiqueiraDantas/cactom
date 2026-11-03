import test from 'node:test';
import assert from 'node:assert/strict';
import { appendAttempt,difficultyFor,recommendPractice,reinforcementLesson,validAttempt } from '../src/lib/adaptive.ts';
const attempt=(id,passed=false,reason='wrong-note',writtenMidi=67)=>({id:String(id),at:new Date(Date.UTC(2026,9,21,10,0,id)).toISOString(),instrumentId:'trumpet-bb',lessonId:'primeiro-sol',stepId:'sol-inicial',writtenMidi,passed,reason:passed?null:reason,durationMs:2000});
test('sem evidência não inventa dificuldade nem recomenda reforço',()=>{assert.equal(recommendPractice([]),null);assert.equal(difficultyFor([]),'padrao');});
test('dificuldade recorrente gera exercício na nota e foco corretos',()=>{
  const rec=recommendPractice([attempt(1),attempt(2)],Date.UTC(2026,9,21,11));
  assert.equal(rec.noteMidi,67);assert.equal(rec.focus,'wrong-note');
  const lesson=reinforcementLesson(rec);assert.ok(lesson.steps.every(s=>s.note.writtenMidi===67));assert.equal(new Set(lesson.steps.map(s=>s.id)).size,3);
});
test('um acerto posterior resolve erro antigo para a recomendação',()=>{const rec=recommendPractice([attempt(1),attempt(2),attempt(3,true)],Date.UTC(2026,9,21,11));assert.equal(rec.focus,'review');});
test('ordem do histórico resolve tentativas gravadas no mesmo milissegundo',()=>{const a=attempt(1),b={...attempt(2),at:a.at},c={...attempt(3,true),at:a.at};assert.equal(recommendPractice([a,b,c],Date.parse(a.at)).focus,'review');});
test('reforço muda gradualmente sem dispensar nota/oitava/duração',()=>{
  assert.equal(difficultyFor([attempt(1),attempt(2),attempt(3)]),'acolhedor');
  assert.equal(difficultyFor(Array.from({length:6},(_,i)=>attempt(i,true))),'desafio');
  const lesson=reinforcementLesson({noteMidi:67,focus:'wrong-note',level:'acolhedor',title:'',description:'',evidence:''});
  assert.ok(lesson.steps.every(s=>s.holdSeconds>=1&&s.toleranceCents<=50&&s.stabilityLimitCents<=35));
});
test('histórico limitado, sem duplicação ou valores inválidos',()=>{
  assert.equal(validAttempt({...attempt(0),writtenMidi:NaN}),false);
  let data=[];for(let i=0;i<510;i++)data=appendAttempt(data,attempt(i));assert.equal(data.length,500);
  assert.equal(appendAttempt(data,data[0]).length,500);assert.equal(appendAttempt(data,{id:'bad'}).length,500);
});
test('revisão depende de tempo real desde o último acerto',()=>{const a=attempt(1,true);assert.match(recommendPractice([a],Date.parse(a.at)+2*86400000).title,/reencontrar/);});
test('dificuldade de ritmo gera compasso com pausa e IDs próprios',()=>{
  const rec=recommendPractice([attempt(1,false,'rhythm'),attempt(2,false,'rhythm')]);
  const l=reinforcementLesson(rec);assert.equal(l.rhythmMode,'metered');assert.equal(l.steps[1].kind,'rest');assert.equal(l.steps[0].figure,'half');
});
test('acerto de sustentação não apaga dificuldade de pausa ou ritmo',()=>{
  const data=[attempt(1,false,'rest'),attempt(2,false,'rest'),{...attempt(3,true),task:'sound'}];
  assert.equal(recommendPractice(data).focus,'rest');
  assert.notEqual(recommendPractice([...data,{...attempt(4,true),task:'rest'}]).focus,'rest');
});
