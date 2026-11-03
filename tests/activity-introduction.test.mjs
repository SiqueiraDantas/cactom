import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {recorderLessons} from '../src/lib/recorder.ts';
import {availableInstrument} from '../src/lib/instruments.ts';
let server,ActivityShell,ActivityIntroduction,lessonIntroduction,MeteredBarLesson;
const noop=()=>{},render=node=>renderToStaticMarkup(node);
before(async()=>{
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 ActivityShell=(await server.ssrLoadModule('/src/components/ActivityExperience.tsx')).ActivityShell;
 ({ActivityIntroduction,lessonIntroduction}=await server.ssrLoadModule('/src/components/ActivityIntroduction.tsx'));
 MeteredBarLesson=(await server.ssrLoadModule('/src/components/MeteredBarLesson.tsx')).MeteredBarLesson;
});
after(async()=>{await server?.close();});
const shellProps={title:'Aula de teste',lessonNumber:13,completed:0,total:3,onExit:noop,success:false,tools:[],footer:React.createElement('button',null,'LIGAR MICROFONE')};
test('each unfinished lesson starts with official Tom and does not mount the exercise or its audio controls',()=>{
 for(const lesson of recorderLessons()){
  let mounts=0;
  function Exercise(){mounts++;return React.createElement('div',null,'EXERCÍCIO EM EXECUÇÃO');}
  const html=render(React.createElement(ActivityShell,{...shellProps,introduction:lessonIntroduction(lesson)},React.createElement(Exercise)));
  assert.equal(mounts,0);assert.match(html,/class="tom-official[^"]*" data-expression="animado"/);assert.match(html,/Pular/);assert.match(html,/Avançar/);
  assert.ok(html.includes(lesson.title));assert.ok(html.includes(lesson.goal));
  assert.doesNotMatch(html,/EXERCÍCIO EM EXECUÇÃO|LIGAR MICROFONE|class="session-footer/);
 }
});
test('Pular and Avançar both proceed through the provided callback without granting progress',()=>{
 let calls=0;const tree=ActivityIntroduction({content:lessonIntroduction(recorderLessons()[12]),onProceed:()=>calls++});
 const buttons=[];
 const visit=node=>{
  if(!React.isValidElement(node))return;
  if(node.type==='button')buttons.push(node);
  React.Children.forEach(node.props.children,visit);
 };
 visit(tree);assert.equal(buttons.length,2);assert.equal(calls,0);
 for(const button of buttons){assert.equal(button.props.type,'button');button.props.onClick();}
 assert.equal(calls,2);
});
test('completed lessons and shells without an introduction retain their exercise/results view',()=>{
 for(const props of [{...shellProps,success:true,introduction:lessonIntroduction(recorderLessons()[12])},shellProps]){
  const html=render(React.createElement(ActivityShell,props,React.createElement('p',null,'RESULTADO OU ATIVIDADE')));
  assert.match(html,/RESULTADO OU ATIVIDADE/);assert.match(html,/LIGAR MICROFONE/);assert.doesNotMatch(html,/ANTES DE COMEÇAR/);
 }
});
test('compact activity keeps the score and start button, without the repeated explanation or idle banner',()=>{
 for(const lesson of recorderLessons().slice(11)){
  const html=render(React.createElement(MeteredBarLesson,{compact:true,lesson,instrument:availableInstrument('recorder-soprano'),onComplete:noop,completed:false}));
  assert.match(html,/metered-staff/);assert.match(html,/Começar atividade/);assert.match(html,/>Partitura<\/h2>/);
  assert.doesNotMatch(html,/class="metered-intro"|class="metered-smallprint"|Comece a atividade ou teste o microfone primeiro/);
  assert.match(html,/<details class="metered-input-details">/);assert.match(html,/<details class="metered-tempo-details">/);
  assert.match(html,/Tempo 4/);
 }
});

test('external controls leave one start action in the shared footer, not inside the score card',()=>{
 const footer=React.createElement('div',{className:'session-footer-actions'},React.createElement('button',{type:'button',className:'activity-primary'},'Começar atividade'));
 const exercise=React.createElement(MeteredBarLesson,{compact:true,externalControls:true,lesson:recorderLessons()[12],instrument:availableInstrument('recorder-soprano'),onComplete:noop,completed:false});
 const html=render(React.createElement(ActivityShell,{...shellProps,footer},exercise));
 assert.equal((html.match(/Começar atividade/g)??[]).length,1);
 assert.doesNotMatch(html,/class="metered-actions"|Salvar e voltar à trilha/);
 assert.match(html,/<footer[^>]*>[\s\S]*Começar atividade[\s\S]*<\/footer>/);
 assert.match(html,/Testar microfone/);assert.match(html,/metered-staff/);
});
test('all recorder lesson shells use viewport-fixed controls, including exercise views without an introduction',()=>{
 for(const lesson of recorderLessons()){
  const html=render(React.createElement(ActivityShell,{...shellProps,title:lesson.title},React.createElement('p',null,'Conteúdo comprido da aula')));
  assert.match(html,/activity-floating-controls/);
  assert.match(html,/<footer[^>]*style="[^"]*position:fixed/);
  assert.match(html,/bottom:calc\(max\(12px, env\(safe-area-inset-bottom, 0px\)\)/);
  assert.match(html,/translateX\(-50%\)/);
  assert.equal((html.match(/LIGAR MICROFONE/g)??[]).length,1);
 }
});
