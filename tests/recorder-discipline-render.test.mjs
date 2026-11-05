import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {DIAGNOSTIC_TASKS,RECORDER_DIAGNOSTIC_KEY,emptyDiagnostic,recordDiagnostic} from '../src/lib/recorderDiagnostic.ts';
let server,RecorderDiscipline,RecorderDiagnosticTask,RecorderDiagnosticPath,Provider,InstrumentCourse;
const backing=new Map(),noop=()=>{};
before(async()=>{
 globalThis.localStorage={getItem:key=>backing.get(key)??null,setItem:(key,value)=>backing.set(key,value),removeItem:key=>backing.delete(key)};
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 ({RecorderDiscipline,RecorderDiagnosticTask}=await server.ssrLoadModule('/src/components/RecorderDiscipline.tsx'));
 RecorderDiagnosticPath=(await server.ssrLoadModule('/src/components/RecorderDiagnosticPath.tsx')).RecorderDiagnosticPath;
 Provider=(await server.ssrLoadModule('/src/components/ProfileStorage.tsx')).ProfileStorageProvider;
 InstrumentCourse=(await server.ssrLoadModule('/src/App.tsx')).InstrumentCourse;
});
after(async()=>{await server?.close();delete globalThis.localStorage;});
const render=element=>renderToStaticMarkup(React.createElement(Provider,{profileId:null},element));
test('um nó abre a atividade diretamente e o resumo volta ao Aprender, sem página intermediária',()=>{
 backing.clear();
 const direct=render(React.createElement(RecorderDiscipline,{startAt:'D03',onExit:noop}));
 assert.match(direct,/Qual som é mais agudo/);assert.match(direct,/Diagnóstico · D03/);
 assert.doesNotMatch(direct,/Começar diagnóstico|Novo percurso de flauta doce|Um novo|16 módulos/);
 const summary=render(React.createElement(RecorderDiscipline,{startAt:'summary',onExit:noop}));
 assert.match(summary,/0 de 8 descobertas respondidas/);assert.match(summary,/Voltar ao Aprender/);
 assert.doesNotMatch(summary,/recorder-discipline-topbar|recorder-discipline-map/);
});
test('oito telas não ligam áudio na renderização e o microfone é opcional só na D07',()=>{
 const previous=globalThis.AudioContext;globalThis.AudioContext=class{constructor(){throw new Error('áudio não deveria abrir na renderização');}};
 try{
  for(const task of DIAGNOSTIC_TASKS){
   const html=render(React.createElement(RecorderDiagnosticTask,{id:task.id,onCommit:noop,onExit:noop,answered:0}));
   assert.ok(html.includes(task.title));assert.match(html,/SEM NOTA/);assert.match(html,/type="radio"/);assert.match(html,/Registrar e avançar|Ver minhas respostas/);
   assert.equal(html.includes('Testar microfone'),task.id==='D07');
   if(task.id==='D08')assert.match(html,/maxLength="120"/i);
  }
 }finally{globalThis.AudioContext=previous;}
});
test('diagnóstico integra a única trilha Aprender da flauta com 8 nós, 64 paradas e preserva os 13 antigos',async()=>{
 backing.clear();
 const {availableInstrument}=await server.ssrLoadModule('/src/lib/instruments.ts');
 const access={mode:'demo',profile:null};
 backing.set('mis-music-lab-recorder-v1',JSON.stringify({seenValves:[0,1,2,3,4,5,6,7],passed:{'recorder-primeiro-si':['rec-si-inicial']},results:{},attempts:{},soundOn:true}));
 const course=id=>render(React.createElement(InstrumentCourse,{instrument:availableInstrument(id),access,onSignOut:noop,onChooseInstrument:noop}));
 const recorder=course('recorder-soprano'),trumpet=course('trumpet-bb');
 assert.doesNotMatch(recorder,/Novo percurso de flauta doce|recorder-discipline-entry/);
 assert.equal((recorder.match(/class="course-path course-path-continuous"/g)??[]).length,1);
 assert.equal((recorder.match(/data-diagnostic-id="D0[1-8]"/g)??[]).length,8);
 assert.equal((recorder.match(/class="rj-node"/g)??[]).length,64);assert.match(recorder,/class="topbar-progress"[\s\S]*?<b>0%<\/b>/);assert.equal((recorder.match(/id="lesson-recorder-/g)??[]).length,13);
 assert.ok(recorder.indexOf('id="diagnostic-D01"')<recorder.indexOf('id="lesson-recorder-furos"'));
 assert.doesNotMatch(trumpet,/data-diagnostic-id/);assert.equal((trumpet.match(/class="rj-node"/g)??[]).length,68,'16 unidades × 4 áreas + 4 desafios de seção');assert.equal((trumpet.match(/class="lesson-node /g)??[]).length,13,'13 treinos anteriores');assert.match(trumpet,/bj-unit-1/);
 assert.equal(JSON.parse(backing.get('mis-music-lab-recorder-v1')).passed['recorder-primeiro-si'][0],'rec-si-inicial');
});

test('respostas existentes aparecem nos nós e a retomada aponta ao primeiro item sem resposta',()=>{
 backing.clear();let ledger=emptyDiagnostic();
 for(const id of ['D01','D03'])ledger=recordDiagnostic(ledger,{id,at:'2026-10-30T15:00:00Z',choice:id==='D03'?'primeiro':'sozinho',modelPlayed:true,tapOffsetsMs:[],toneDetected:false});
 backing.set(RECORDER_DIAGNOSTIC_KEY,JSON.stringify(ledger));
 const html=render(React.createElement(RecorderDiagnosticPath,{onOpen:noop}));
 assert.match(html,/2 de 8 atividades do diagnóstico respondidas/);assert.equal((html.match(/diagnostic-node answered/g)??[]).length,2);
 assert.match(html,/aria-current="step"[^>]*aria-label="Diagnóstico D02/);assert.match(html,/Ver minhas respostas/);
 assert.doesNotMatch(html,/lesson-node done|concluída|APROVADO/);
});
