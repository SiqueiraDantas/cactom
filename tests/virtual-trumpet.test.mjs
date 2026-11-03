import test from 'node:test';
import assert from 'node:assert/strict';
import {
  jointAngle,readFingerAngles,anglesToValves,validCalibration,advanceGesture,initialGesture,
  freshVirtualProgress,advanceVirtualProgress,VIRTUAL_STEPS,sameValves
} from '../src/lib/virtualTrumpet.ts';
import { targetFrequencyFor } from '../src/lib/music.ts';

const open=[170,170,170],closed=[85,88,90];
const cal={open,closed};

test('ponto de articulação: dedo reto ~180°, dedo dobrado ~90°',()=>{
  assert.ok(Math.abs(jointAngle({x:0,y:0},{x:1,y:0},{x:2,y:0})-180)<.001);
  assert.ok(Math.abs(jointAngle({x:0,y:0},{x:1,y:0},{x:1,y:1})-90)<.001);
});

test('mede indicador, médio e anelar nos pontos corretos da mão',()=>{
  const p=Array.from({length:21},()=>({x:0,y:0,z:0}));
  for(const [m,b,t] of [[5,6,8],[9,10,12],[13,14,16]]){
    p[m]={x:0,y:0,z:0};p[b]={x:1,y:0,z:0};p[t]={x:2,y:0,z:0};
  }
  assert.deepEqual(readFingerAngles(p)?.map(Math.round),[180,180,180]);
  p[8]={x:1,y:1,z:0};p[16]={x:1,y:1,z:0};
  assert.deepEqual(readFingerAngles(p)?.map(Math.round),[90,180,90]);
  assert.equal(readFingerAngles([]),null);
});

test('calibração descarta amostras não contrastantes',()=>{
  assert.equal(validCalibration(cal),true);
  assert.equal(validCalibration({open:[151,140,170],closed:[150,125,169]}),false);
  assert.deepEqual(anglesToValves([165,88,85],cal),[2,3]);
  assert.deepEqual(anglesToValves([170,170,170],cal),[]);
});

test('histerese reduz troca espúria de um dedo na fronteira',()=>{
  const threshold=(cal.open[0]+cal.closed[0])/2;
  assert.deepEqual(anglesToValves([threshold,170,170],cal),[]);
  assert.deepEqual(anglesToValves([threshold,170,170],cal,[1]),[1]);
});

test('a configuração reconhecida só vira estável depois do debounce',()=>{
  let s=initialGesture();s=advanceGesture(s,[1,3],100);
  assert.equal(s.stable,null);
  s=advanceGesture(s,[1,3],200);assert.equal(s.stable,null);
  s=advanceGesture(s,[1,3],290);assert.equal(s.stable,'1-3');
  s=advanceGesture(s,[1],300);assert.equal(s.stable,null,'nova pose invalida instantaneamente a antiga');
  s=advanceGesture(s,null,310);assert.equal(s.stable,null);
});

test('sustentação de digitação tem de ser ininterrupta; sem mão não avança',()=>{
  let p=freshVirtualProgress();
  p=advanceVirtualProgress(p,[1,2],[1,2],100,900);
  p=advanceVirtualProgress(p,[1,2],[1,2],800,900);
  assert.equal(p.completed,false);
  p=advanceVirtualProgress(p,null,[1,2],810,900);
  assert.equal(p.matchedSince,null);
  p=advanceVirtualProgress(p,[1,2],[1,2],1000,900);
  for(let t=1100;t<=1900;t+=100)p=advanceVirtualProgress(p,[1,2],[1,2],t,900);
  assert.equal(p.completed,true);
});

test('para repetir a digitação igual, exige saída por 320ms',()=>{
  let p={...freshVirtualProgress(),readyForDifferentPose:false};
  p=advanceVirtualProgress(p,[],[],100,500,true);
  p=advanceVirtualProgress(p,[],[],1000,500,true);
  assert.equal(p.completed,false);
  p=advanceVirtualProgress(p,[1],[],1200,500,true);
  p=advanceVirtualProgress(p,[1],[],1380,500,true);
  p=advanceVirtualProgress(p,[1],[],1540,500,true);
  p=advanceVirtualProgress(p,[],[],1600,500,true);
  for(let t=1700;t<=2100;t+=100)p=advanceVirtualProgress(p,[],[],t,500,true);
  assert.equal(p.completed,true);
});

test('sequência expandida preserva oito etapas originais e acrescenta combinações',()=>{
  assert.equal(VIRTUAL_STEPS.length,14);
  assert.equal(new Set(VIRTUAL_STEPS.map(s=>s.id)).size,14);
  assert.deepEqual(VIRTUAL_STEPS.slice(0,8).map(s=>s.id),Array.from({length:8},(_,i)=>`virtual-06-${i+1}`));
  assert.deepEqual(VIRTUAL_STEPS.slice(0,5).map(s=>s.note.id),['G4','F4','E4','D4','C4']);
  assert.deepEqual(VIRTUAL_STEPS.slice(0,5).map(s=>s.note.valves),[[],[1],[1,2],[1,3],[]]);
  assert.ok(VIRTUAL_STEPS.every(s=>s.targetMs>=900&&s.targetMs<=2000));
  assert.equal(sameValves([3,1],[1,3]),true);
  assert.ok(Math.abs(targetFrequencyFor(VIRTUAL_STEPS[0].note)-349.228)<.1);
});
