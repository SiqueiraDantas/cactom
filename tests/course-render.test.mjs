import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {availableInstrument} from '../src/lib/instruments.ts';
import {createProfileStorage} from '../src/lib/profileStorage.ts';
import {streakSummary} from '../src/lib/streak.ts';
let server,App,CourseEntry,InstrumentCourse,Provider,StreakScreen,AccessField,AccessButton,TomArtwork,storage=new Map();
const backing={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
globalThis.localStorage=backing;
const demo={mode:'demo',profile:null},noop=()=>{};
const profileA={id:'11111111-1111-4111-8111-111111111111',username:'ana',name:'Ana'};
const profileB={id:'22222222-2222-4222-8222-222222222222',username:'bia',name:'Bia'};
before(async()=>{
  server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
  const app=await server.ssrLoadModule('/src/App.tsx');App=app.default;CourseEntry=app.CourseEntry;InstrumentCourse=app.InstrumentCourse;
  Provider=(await server.ssrLoadModule('/src/components/ProfileStorage.tsx')).ProfileStorageProvider;
  StreakScreen=(await server.ssrLoadModule('/src/components/StreakExperience.tsx')).StreakScreen;
  const controls=await server.ssrLoadModule('/src/components/AccessControls.tsx');AccessField=controls.AccessField;AccessButton=controls.AccessButton;
  TomArtwork=(await server.ssrLoadModule('/src/components/TomInteractive.tsx')).TomArtwork;
});
after(async()=>{await server?.close();delete globalThis.localStorage;});
const render=element=>renderToStaticMarkup(element);
const saved=(seenValves,passed)=>JSON.stringify({seenValves,passed,attempts:{},results:{},soundOn:true});
const pathPercent=html=>Number(html.match(/class="topbar-progress"[^>]*>[\s\S]*?<b>(\d+)%<\/b>/)?.[1]??-1);
const course=(id,profile=null)=>render(React.createElement(Provider,{profileId:profile?.id??null},React.createElement(InstrumentCourse,{instrument:availableInstrument(id),onChooseInstrument:noop,access:profile?{mode:'local',profile}:demo,onSignOut:noop})));
test('entrada apresenta boas-vindas com Cactom, Tom e os três caminhos de acesso antes do instrumento',()=>{
  storage=new Map([['mis-music-lab-instrument','trumpet-bb']]);const html=render(React.createElement(App));
  assert.match(html,/Começar agora/);assert.match(html,/Já tenho uma conta/);assert.match(html,/Explorar primeiro/);assert.match(html,/access-page--welcome/);assert.match(html,/animacoes\/cactom-celular\.svg/);assert.doesNotMatch(html,/<video/);assert.match(html,/branding\/cactom\/cactom-wordmark.png/);assert.doesNotMatch(html,/Escola de Música de Madalena|64 paradas/);assert.match(html,/A música floresce em/);assert.doesNotMatch(html,/Quero aprender/);assert.doesNotMatch(html,/lab-mascot|getUserMedia|Esqueci minha senha/);
});

test('campo de acesso conserva rótulo e associa dica, erro e descrição externa para leitor de tela',()=>{
  const html=render(React.createElement(AccessField,{id:'teste-user',label:'Usuário de teste',hint:'Uma dica',error:'Confira o usuário','aria-describedby':'contexto',required:true}));
  assert.match(html,/for="teste-user"/);assert.match(html,/id="teste-user"/);assert.match(html,/aria-describedby="teste-user-hint teste-user-error contexto"/);assert.match(html,/aria-invalid="true"/);assert.match(html,/id="teste-user-error"/);assert.match(html,/required=""/);
});

test('botão em espera bloqueia nova ação e comunica o estado, sem sucesso fictício',()=>{
  const busy=render(React.createElement(AccessButton,{busy:true,busyLabel:'Conferindo seu acesso…'},'Entrar'));
  assert.match(busy,/disabled=""/);assert.match(busy,/aria-busy="true"/);assert.match(busy,/Conferindo seu acesso/);assert.doesNotMatch(busy,/>Entrar<|Sucesso/);
  const idle=render(React.createElement(AccessButton,{variant:'secondary'},'Pular e experimentar'));
  assert.doesNotMatch(idle,/disabled|aria-busy/);assert.match(idle,/type="button"/);
});

test('Tom vetorial muda de expressão com o formulário e cobre os olhos na senha',()=>{
  const html=render(React.createElement(React.Fragment,null,
    React.createElement(TomArtwork,{presentation:{mood:'idle',covered:false,gaze:{x:0,y:0}}}),
    React.createElement(TomArtwork,{presentation:{mood:'privacy',covered:true,gaze:{x:0,y:0}}}),
    React.createElement(TomArtwork,{presentation:{mood:'error',covered:false,gaze:{x:0,y:0}}}),
    React.createElement(TomArtwork,{presentation:{mood:'success',covered:false,gaze:{x:0,y:0}}})));
  assert.doesNotMatch(html,/<img|<image |<mask|clipPath/);
  for(const face of ['feliz','privacidade','triste','comemorando'])assert.match(html,new RegExp(`data-expression="${face}"`));
  assert.match(html,/class="[^"]*ct-front-arms[^"]*"/);
  const ids=[...html.matchAll(/ id="([^"]+)"/g)].map(value=>value[1]);assert.equal(new Set(ids).size,ids.length);
});
test('após entrar ou pular, seleção oferece os quatro cursos liberados (regência bloqueada)',()=>{
  storage=new Map();
  for(const access of [demo,{mode:'local',profile:profileA}]){
    const html=render(React.createElement(Provider,{profileId:access.profile?.id??null},React.createElement(CourseEntry,{access,onSignOut:noop})));
    assert.match(html,/Eu quero aprender…/);assert.match(html,/Flauta doce/);assert.match(html,/Trompete/);assert.doesNotMatch(html,/Regência/);assert.match(html,/Clarinete/);assert.equal((html.match(/<button[^>]*class="wsp-card[^"]*"[^>]*>/g)??[]).filter(tag=>!tag.includes('disabled=')).length,4);
  }
});
test('curso da flauta não importa as conquistas antigas do trompete e mostra a Formação de 400 unidades',()=>{
  storage=new Map([['mis-music-lab-v03',saved([1,2,3],{'primeiro-sol':['sol-inicial']})]]);
  const html=course('recorder-soprano');assert.match(html,/Flauta doce · Módulo 1 de 16/);assert.match(html,/Identificar as partes da flauta/);assert.match(html,/Nível 1 · Iniciação/);assert.match(html,/Sequência 1/);
  assert.equal(pathPercent(html),0);assert.doesNotMatch(html,/Seu primeiro Sol|Seu primeiro Si|Treinos anteriores/);assert.match(html,/Seu Rojão/);
});
test('trilha antiga saiu: registros de teste antigos não aparecem e cada curso abre a Formação dele',()=>{
  storage=new Map([['mis-music-lab-v03',saved([1,2,3],{})],['mis-music-lab-recorder-v1',saved([0,1,2,3,4,5,6,7],{'recorder-primeiro-si':['rec-si-inicial']})],['cactom-recorder-journey-v1','{"version":1}'],['cactom-trilha-trumpet-bb-v2','{"version":1}']]);
  const recorder=course('recorder-soprano');assert.equal(pathPercent(recorder),0);assert.doesNotMatch(recorder,/Um novo som: Lá|Treinos anteriores/);
  const trumpet=course('trumpet-bb');assert.equal(pathPercent(trumpet),0);assert.match(trumpet,/Trompete · Módulo 1 de 16/);assert.match(trumpet,/Identificar as partes do trompete/);assert.doesNotMatch(trumpet,/Seu primeiro Sol|Treinos anteriores/);
});
test('contas locais não herdam progresso da demo nem de outra conta',()=>{
  storage=new Map([['mis-music-lab-v03',saved([1,2,3],{'primeiro-sol':['sol-inicial']})]]);
  const ledger=stops=>JSON.stringify({version:1,xp:10*stops*5,stops:{},presentations:{},reviewDays:[1,3,7,14],reviewNeeded:[],lessons:Object.fromEntries(Array.from({length:stops},(_,k)=>[1,2,3,4,5].map(l=>[`TPT-U${String(k+1).padStart(3,'0')}-L${l}`,{at:'2026-11-03T12:00:00.000Z',xp:10,total:3,correctFirst:3,recovered:0,review:false}])).flat())});
  storage.set('cactom-formacao-trompete-v2',ledger(8));
  const a=createProfileStorage(profileA.id,backing);a.setItem('cactom-formacao-trompete-v2',ledger(4));
  assert.equal(pathPercent(course('trumpet-bb',profileA)),1);assert.equal(pathPercent(course('trumpet-bb',profileB)),0);assert.equal(pathPercent(course('trumpet-bb')),2,'40 de 2.000 microlições');
});
test('tela de Seu Rojão mostra apenas calendário e marcos derivados das datas',()=>{
  const summary=streakSummary({version:1,days:['2026-10-19','2026-10-20','2026-10-21']},new Date('2026-10-21T15:00:00Z'));
  const html=render(React.createElement(StreakScreen,{summary,instrument:'recorder-soprano',onPractice:noop}));
  assert.match(html,/dias seguidos/);assert.match(html,/Próxima insígnia|PRÓXIMA INSÍGNIA/);assert.equal((html.match(/streak-day practiced/g)??[]).length,3);assert.equal((html.match(/<article class="earned"/g)??[]).length,2);assert.match(html,/CONQUISTADA/);
  const empty=render(React.createElement(StreakScreen,{summary:streakSummary({version:1,days:[]},new Date('2026-10-21T15:00:00Z')),instrument:'trumpet-bb',onPractice:noop}));
  assert.match(empty,/Praticar agora/);assert.equal((empty.match(/<article class="earned"/g)??[]).length,0);
});


test('oficina escolhida antes do cadastro entra no curso correto sem uma segunda seleção',()=>{
 storage=new Map([['mis-music-lab-instrument','trumpet-bb']]);
 const access={...demo,initialInstrumentId:'recorder-soprano'};
 const html=render(React.createElement(Provider,{profileId:null},React.createElement(CourseEntry,{access,onSignOut:noop})));
 assert.match(html,/Flauta doce/);assert.match(html,/Identificar as partes da flauta/);assert.doesNotMatch(html,/class="instrument-picker|class="wsp"/);
 const invalid=render(React.createElement(Provider,{profileId:null},React.createElement(CourseEntry,{access:{...demo,initialInstrumentId:'alto-sax'},onSignOut:noop})));
 assert.match(invalid,/Eu quero aprender…/);
});
test('iniciação musical abre a trilha própria, sem instrumento virtual nem aba de partituras',()=>{
  storage=new Map();
  const html=course('iniciacao');
  assert.match(html,/Iniciação musical · Unidade 1 de 16/);assert.match(html,/Descubra o mundo dos sons/);assert.match(html,/Seção 1 · O som/);
  assert.doesNotMatch(html,/Tá sem/);assert.doesNotMatch(html,/aria-label="Partituras"/);
});
