import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {COURSE_TASKS,courseTask} from '../src/lib/recorderFullCourse.ts';
let server,Task,Path,Score,Provider;
const noop=()=>{},values=new Map(),render=element=>renderToStaticMarkup(React.createElement(Provider,{profileId:null},element));
before(async()=>{
 globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 Task=(await server.ssrLoadModule('/src/components/RecorderFullCourse.tsx')).RecorderFullTask;
 Path=(await server.ssrLoadModule('/src/components/RecorderFullPath.tsx')).RecorderFullPath;
 Score=(await server.ssrLoadModule('/src/components/RecorderCourseScore.tsx')).RecorderCourseScore;
 Provider=(await server.ssrLoadModule('/src/components/ProfileStorage.tsx')).ProfileStorageProvider;
});
after(async()=>{await server?.close();delete globalThis.localStorage;});
test('Aprender oferece 80 microlições e acesso direto às 260 atividades, sem itens bloqueados',()=>{
 const html=render(React.createElement(Path,{onOpen:noop}));
 assert.match(html,/260 atividades abertas/);assert.equal((html.match(/data-curriculum-lesson=/g)??[]).length,80);assert.equal((html.match(/data-curriculum-id=/g)??[]).length,252);assert.equal((html.match(/data-diagnostic-id=/g)??[]).length,8);
 for(const task of COURSE_TASKS)assert.ok(html.includes(`data-curriculum-id="${task.id}"`),task.id);
 assert.match(html,/S4-M16-L05-A03/);assert.match(html,/B2.3/);assert.match(html,/Dedilhado da sua flauta/);assert.doesNotMatch(html,/materials-pending|Em preparação|Comprar|Assinar/);
});
test('as 237 novas propostas renderizam controles e partitura, sem abrir microfone ou áudio no carregamento',()=>{
 const previous=globalThis.AudioContext;globalThis.AudioContext=class{constructor(){throw Error('áudio automático')}};
 try{for(const task of COURSE_TASKS.filter(t=>t.module!==1||t.assessment)){
  const html=render(React.createElement(Task,{task,system:'baroque',onCommit:noop,onExit:noop,introduce:false}));
  assert.ok(html.includes(`data-curriculum-task="${task.id}"`));assert.match(html,/Registrar e avançar/);assert.match(html,/Preciso de apoio/);assert.match(html,/position:fixed/);assert.match(html,/recorder-course-score/);assert.doesNotMatch(html,/𝅗𝅥|𝄽|𝄾|data-microphone-active="true"/);
 }}finally{globalThis.AudioContext=previous;}
});
test('todas as avaliações têm descritores relatados e reflexão, sem nota ou certificado automático',()=>{
 for(const task of COURSE_TASKS.filter(t=>t.assessment)){
  const html=render(React.createElement(Task,{task,system:'german',onCommit:noop,onExit:noop,introduce:false}));
  assert.match(html,/AVALIAÇÃO ORIENTADA/);assert.match(html,/Com apoio contínuo/);assert.match(html,/Independente em uma situação nova/);assert.match(html,/<textarea/);assert.match(html,/sem nota ou certificação automática/);
 }
});
test('nota longa, pausa e colcheia usam geometria; 6/8 mostra somente dois tempos',()=>{
 const html=render(React.createElement(Score,{notes:[{midi:71,beats:2},{midi:null,beats:1},{midi:69,beats:1}],meter:'4/4'}));
 assert.match(html,/<ellipse/);assert.match(html,/mínima/);assert.match(html,/Pausa/);assert.doesNotMatch(html,/𝅗𝅥|𝄽/);
 const task=COURSE_TASKS.find(t=>t.material.meter==='6/8'),six=render(React.createElement(Task,{task,system:'baroque',onCommit:noop,onExit:noop,introduce:false}));
 assert.match(six,/dois tempos, três subdivisões por tempo/);assert.match(six,/aria-label="Dois tempos no compasso 6\/8"/);
});
test('retomar registro antigo não faz aparecer um acerto novo de microfone',()=>{
 const task=courseTask('S1-M03-L03-A02'),html=render(React.createElement(Task,{task,existing:{id:task.id,at:'2026-10-31T12:00:00Z',report:'pratiquei',attempted:true,matched:4,total:4},system:'baroque',onCommit:noop,onExit:noop,introduce:false}));
 assert.match(html,/Começar atividade/);assert.match(html,/disabled=""/);assert.doesNotMatch(html,/4 de 4 notas|style="color:#23823f"/);
});
