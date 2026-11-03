import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendPitchPoint, chartPaths, qualityLabel, resultsCsv, summarizeCompletedNote,
} from '../src/lib/telemetry.ts';

const pt = (at,cents,status='valid')=>({at,cents,status});

test('traçado descarta amostras antigas e não aceita relógio retrocedendo',()=>{
  let points=[];
  for(let n=0;n<140;n++) points=appendPitchPoint(points,pt(n*100,3),9000,120);
  assert.ok(points.length<=91);
  assert.equal(points[0].at,4900);
  assert.deepEqual(appendPitchPoint(points,pt(1200,4)),points);
});

test('a linha do gráfico não atravessa silêncio ou nota errada',()=>{
  const paths=chartPaths([pt(0,0),pt(100,3),pt(200,null,'silence'),pt(300,2),pt(400,-3)]);
  assert.equal(paths.length,2);
  assert.ok(paths[0].startsWith('M'));
  assert.ok(paths[1].includes(' L'));
});

test('não produz relatório de nota que não concluiu a duração',()=>{
  assert.equal(summarizeCompletedNote({stepId:'a',noteLabel:'Sol 4',completedAt:'2026-10-20',validCents:[1,2,1,0],durationMs:1900,requiredMs:2000,attempts:1}),null);
});

test('nota sustentada estável tem resumo pedagógico e métrica média',()=>{
  const result=summarizeCompletedNote({stepId:'sol',noteLabel:'Sol 4',completedAt:'2026-10-20',validCents:[1,3,-1,2,0,4],durationMs:2000,requiredMs:2000,attempts:2});
  assert.ok(result);
  assert.equal(result.quality,'muito-estavel');
  assert.equal(result.durationMs,2000);
  assert.equal(result.attempts,2);
  assert.equal(result.measuredFrames,6);
  assert.equal(qualityLabel(result.quality),'Muito estável');
});

test('emissão aprovada com variação elevada recebe conselho sem desaprovar a nota',()=>{
  const result=summarizeCompletedNote({stepId:'fa',noteLabel:'Fá 4',completedAt:'2026-10-20',validCents:[-32,32,-34,34,-30,30],durationMs:3000,requiredMs:3000,attempts:1});
  assert.ok(result);
  assert.equal(result.quality,'precisa-praticar');
  assert.match(result.advice,/gráfico/);
});

test('csv inclui cabeçalho e escapa etiquetas potencialmente malformadas',()=>{
  const a=summarizeCompletedNote({stepId:'a',noteLabel:'Fá "4"',completedAt:'2026-10-20',validCents:[0,0,0,0],durationMs:2000,requiredMs:2000,attempts:1});
  assert.ok(a);
  const csv=resultsCsv([a]);
  assert.match(csv,/atividade,nota,concluida_em/);
  assert.match(csv,/"Fá ""4"""/);
});
