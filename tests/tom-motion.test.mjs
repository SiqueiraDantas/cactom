import test from 'node:test';
import assert from 'node:assert/strict';
import {boundedTomGaze,tomPresentation,tomCaption,tomGazeStep,tomRestingGaze,TOM_GAZE_LIMIT} from '../src/lib/tomMotion.ts';
const box={left:200,top:100,width:320,height:320};
test('olhar permanece central no centro do Tom e tem limites mesmo longe do formulário',()=>{
 assert.deepEqual(boundedTomGaze({x:360,y:260},box),{x:0,y:0});
 assert.deepEqual(boundedTomGaze({x:1e10,y:-1e10},box),{x:TOM_GAZE_LIMIT.x,y:-TOM_GAZE_LIMIT.y});
});
test('coordenadas ou limites inválidos deixam o olhar neutro',()=>{
 for(const point of [{x:NaN,y:1},{x:1,y:Infinity}])assert.deepEqual(boundedTomGaze(point,box),{x:0,y:0});
 for(const width of [0,-10,NaN])assert.deepEqual(boundedTomGaze({x:1,y:2},{...box,width}),{x:0,y:0});
});
test('senha focada ou mostrada cobre os olhos e impede rastreamento das pupilas',()=>{
 for(const state of [{focus:'password',showPassword:false},{focus:'none',showPassword:true}]){
  const value=tomPresentation({...state,busy:false,outcome:'idle',gaze:{x:12,y:8}});
  assert.equal(value.covered,true);assert.deepEqual(value.gaze,{x:0,y:0});assert.match(tomCaption(value),/espiar/);
 }
});
test('espera mantém privacidade e não é apresentada como sucesso',()=>{
 const value=tomPresentation({focus:'password',busy:true,outcome:'idle',gaze:{x:1,y:1}});
 assert.equal(value.mood,'waiting');assert.equal(value.covered,true);assert.match(tomCaption(value),/Espero/);
 const done=tomPresentation({focus:'none',busy:true,outcome:'success'});
 assert.equal(done.mood,'success');assert.equal(done.covered,false);
});
test('erro e foco de identificação têm reações distintas sem alterar a avaliação do acesso',()=>{
 assert.equal(tomPresentation({focus:'identity',busy:false,outcome:'idle'}).mood,'listening');
 const failed=tomPresentation({focus:'none',busy:false,outcome:'error'});
 assert.equal(failed.mood,'error');assert.match(tomCaption(failed),/tentar de novo/);
});
test('movimento reduzido neutraliza o olhar mantendo a pose necessária de privacidade',()=>{
 const still=tomPresentation({focus:'password',busy:false,outcome:'idle',reducedMotion:true,gaze:{x:12,y:8}});
 assert.deepEqual(still.gaze,{x:0,y:0});assert.equal(still.covered,true);
 const safe=tomPresentation({focus:'none',busy:false,outcome:'idle',gaze:{x:Infinity,y:99}});
 assert.deepEqual(safe.gaze,{x:0,y:TOM_GAZE_LIMIT.y});
});
test('pupilas se aproximam do alvo sem ultrapassar e independem da taxa de quadros',()=>{
 const target={x:TOM_GAZE_LIMIT.x,y:-TOM_GAZE_LIMIT.y};
 let fast={x:0,y:0},slow={x:0,y:0};
 for(let i=0;i<12;i++)fast=tomGazeStep(fast,target,1000/120);
 for(let i=0;i<6;i++)slow=tomGazeStep(slow,target,1000/60);
 assert.ok(Math.abs(fast.x-slow.x)<.05&&Math.abs(fast.y-slow.y)<.05);
 let value={x:0,y:0};for(let i=0;i<200;i++){value=tomGazeStep(value,target,16);assert.ok(value.x<=target.x+1e-9&&value.y>=target.y-1e-9);}
 assert.ok(Math.abs(value.x-target.x)<.01);
 assert.deepEqual(tomGazeStep({x:1,y:1},{x:5,y:5},NaN),tomGazeStep({x:1,y:1},{x:5,y:5},16));
 assert.deepEqual(tomGazeStep({x:1,y:1},{x:5,y:5},10000),tomGazeStep({x:1,y:1},{x:5,y:5},64));
});
test('olhar de repouso acompanha o formulário e fica dentro dos limites',()=>{
 assert.ok(tomRestingGaze('listening').y>0);assert.ok(tomRestingGaze('waiting').y<0);assert.deepEqual(tomRestingGaze('privacy'),{x:0,y:0});
 for(const mood of ['idle','listening','privacy','waiting','success','error']){const g=tomRestingGaze(mood);assert.ok(Math.abs(g.x)<=TOM_GAZE_LIMIT.x&&Math.abs(g.y)<=TOM_GAZE_LIMIT.y);}
});
test('Tom recebe somente estados e coordenadas: o componente não aceita nem lê texto de senha',async()=>{
 const {readFileSync}=await import('node:fs');
 const tom=readFileSync(new URL('../src/components/TomInteractive.tsx',import.meta.url),'utf8');
 assert.match(tom,/type Props=\{locale\?:AccessLocale;focus:TomFocus;busy:boolean;outcome:TomOutcome;showPassword:boolean\}/);
 assert.doesNotMatch(tom,/fields\.|\.value\b|addEventListener\('(key|input)/);
 const form=readFileSync(new URL('../src/components/AccountForm.tsx',import.meta.url),'utf8');
 assert.match(form,/<TomInteractive locale=\{locale\} focus=\{focus\} busy=\{busy\} outcome=\{outcome\} showPassword=\{showPassword\}\/>/);
});
