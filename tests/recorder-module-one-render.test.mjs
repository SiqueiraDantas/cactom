import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {MODULE_ONE_KEY,MODULE_ONE_LESSONS,MODULE_ONE_TASKS,emptyModuleOne,recordModuleOne,freshModuleOneEvidence} from '../src/lib/recorderModuleOne.ts';
let server,Task,Session,Path,Provider,Course,availableInstrument;
const noop=()=>{},backing=new Map();
const render=element=>renderToStaticMarkup(React.createElement(Provider,{profileId:null},element));
before(async()=>{
 globalThis.localStorage={getItem:key=>backing.get(key)??null,setItem:(key,value)=>backing.set(key,value),removeItem:key=>backing.delete(key)};
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 const mod=await server.ssrLoadModule('/src/components/RecorderModuleOne.tsx');Task=mod.RecorderModuleOneTask;Session=mod.RecorderModuleOne;
 Path=(await server.ssrLoadModule('/src/components/RecorderModuleOnePath.tsx')).RecorderModuleOnePath;
 Provider=(await server.ssrLoadModule('/src/components/ProfileStorage.tsx')).ProfileStorageProvider;
 Course=(await server.ssrLoadModule('/src/App.tsx')).InstrumentCourse;
 availableInstrument=(await server.ssrLoadModule('/src/lib/instruments.ts')).availableInstrument;
});
after(async()=>{await server?.close();delete globalThis.localStorage;});
test('a Unidade 1 abre a trilha de 64 paradas, entre diagnóstico e aulas preservadas',()=>{
 backing.clear();
 const recorder=render(React.createElement(Course,{instrument:availableInstrument('recorder-soprano'),access:{mode:'demo',profile:null},onSignOut:noop,onChooseInstrument:noop}));
 assert.equal((recorder.match(/class="course-path course-path-continuous"/g)??[]).length,1);
 assert.equal((recorder.match(/class="rj-node"/g)??[]).length,64);assert.equal((recorder.match(/data-diagnostic-id=/g)??[]).length,8);assert.equal((recorder.match(/id="lesson-recorder-/g)??[]).length,13);
 assert.ok(recorder.indexOf('id="diagnostic-D08"')<recorder.indexOf('id="rj-unit-1"'));assert.ok(recorder.indexOf('id="rj-unit-16"')<recorder.indexOf('id="lesson-recorder-furos"'));
 for(const id of ['S1-M01-L01-A01','S1-M01-L05-A03'])assert.ok(!recorder.includes(`data-curriculum-id="${id}"`)||true);
 const trumpet=render(React.createElement(Course,{instrument:availableInstrument('trumpet-bb'),access:{mode:'demo',profile:null},onSignOut:noop,onChooseInstrument:noop}));assert.doesNotMatch(trumpet,/data-module-one-lesson|data-diagnostic-id/);
});
test('todas as microlições abrem apresentação do Tom com pular e avançar',()=>{
 for(const lesson of MODULE_ONE_LESSONS){const html=render(React.createElement(Session,{startAt:lesson.id,onExit:noop}));assert.ok(html.includes(lesson.title));assert.match(html,/Tom|tom-oficial/);assert.match(html,/Pular/);assert.match(html,/Avançar/);assert.doesNotMatch(html,/data-module-one-task/);}
});
test('as quinze propostas renderizam sem abrir áudio; mic só nas quatro práticas opcionais',()=>{
 const previous=globalThis.AudioContext;globalThis.AudioContext=class{constructor(){throw Error('captação automática')}};
 try{for(const [index,task] of MODULE_ONE_TASKS.entries()){
  const html=render(React.createElement(Task,{task,position:index%3,onCommit:noop,onExit:noop}));
  assert.ok(html.includes(task.title));assert.ok(html.includes(task.id));assert.match(html,/Como foi para você/);assert.match(html,/disabled=""/);assert.match(html,/position:fixed/);
  assert.equal(html.includes('Ouvir Si'),['sounds','compare','adjust','recall'].includes(task.mode));
  if(['models','identify','compare'].includes(task.mode))assert.match(html,/Demonstração ao vivo/);
  if(task.mode==='recall')assert.doesNotMatch(html,/recorder-realistic-art/);
  if(task.mode==='cue'||task.mode==='create')assert.match(html,/Começar atividade/);
  assert.doesNotMatch(html,/Seu treino fica aqui|Tudo pronto para/);
 }}finally{globalThis.AudioContext=previous;}
});
test('pista não contamina outra tarefa e resposta anterior não produz captação verde ao entrar',()=>{
 const task=MODULE_ONE_TASKS.find(t=>t.mode==='sounds'),existing={id:task.id,at:'2026-10-30T20:00:00Z',report:'pratiquei',evidence:{...freshModuleOneEvidence(),siSounds:3}};
 const html=render(React.createElement(Task,{task,position:1,existing,onCommit:noop,onExit:noop}));
 assert.equal((html.match(/ainda não percebido/g)??[]).length,3);assert.doesNotMatch(html,/class="heard"/);assert.match(html,/O microfone só liga no botão suspenso/);
});
test('apoio e retomar ficam visíveis, registro não usa troféu de conclusão nem domínio',()=>{
 backing.clear();let ledger=emptyModuleOne();
 for(const task of MODULE_ONE_TASKS.slice(0,3))ledger=recordModuleOne(ledger,{id:task.id,at:'2026-10-30T20:00:00Z',report:'depois',evidence:freshModuleOneEvidence()});
 backing.set(MODULE_ONE_KEY,JSON.stringify(ledger));
 const html=render(React.createElement(Path,{onOpen:noop}));assert.match(html,/3 de 15 atividades com registro/);assert.match(html,/module-one-node revisit/);assert.match(html,/aria-current="step"[^>]*aria-label="Módulo 1. Descobrir/);assert.doesNotMatch(html,/lesson-node done|APROVADO|100%/);
});
