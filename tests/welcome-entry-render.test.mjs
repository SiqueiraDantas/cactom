import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {ACCESS_LANGUAGE_KEY,ACCESS_COPY,ACCESS_LOCALES} from '../src/lib/accessLocale.ts';
let server,LoginScreen,WelcomeEnsemble,WelcomeMusicRibbon;
const data=new Map(),noop=()=>{};
before(async()=>{
 globalThis.localStorage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 LoginScreen=(await server.ssrLoadModule('/src/components/LoginScreen.tsx')).LoginScreen;
 WelcomeEnsemble=(await server.ssrLoadModule('/src/components/WelcomeEnsemble.tsx')).WelcomeEnsemble;
 WelcomeMusicRibbon=(await server.ssrLoadModule('/src/components/WelcomeMusicRibbon.tsx')).WelcomeMusicRibbon;
});
after(async()=>{await server?.close();delete globalThis.localStorage;});
const render=element=>renderToStaticMarkup(element);
test('idioma salvo traduz entrada, seletor e ações; entrada limpa com a abertura do celular, sem textos extras',()=>{
 for(const locale of ACCESS_LOCALES){
  data.clear();data.set(ACCESS_LANGUAGE_KEY,locale);
  const html=render(React.createElement(LoginScreen,{onEnter:noop}));
  assert.ok(html.includes(`lang="${locale}"`));assert.ok(html.includes(ACCESS_COPY[locale].start));assert.ok(html.includes(ACCESS_COPY[locale].existing));assert.ok(html.includes(ACCESS_COPY[locale].explore));
  assert.ok(html.includes(ACCESS_COPY[locale].languageLabel));assert.equal((html.match(/<option /g)??[]).length,3);assert.match(html,/animacoes\/cactom-celular\.svg/);assert.ok(!html.includes(ACCESS_COPY[locale].heroIntro));assert.doesNotMatch(html,/access-hero-can|access-hero-paths|welcome-music-ribbon/);assert.match(html,/value="pt-BR"/);assert.match(html,/value="en"/);assert.match(html,/value="es"/);
  if(locale!=='pt-BR')assert.doesNotMatch(html,/Começar agora|Já tenho uma conta|Pular para as opções/);
 }
});
test('abertura desenhada: menina com flauta, Tom, estante e menino com tambor trocam de pose; sem vídeo',async()=>{
 const html=render(React.createElement(WelcomeEnsemble));
 assert.doesNotMatch(html,/<video|\.mp4|<audio/);
 assert.match(html,/data-phase="waiting"/);assert.match(html,/role="img"/);
 for(const part of ['wst-menina','wst-tom','wst-menino','estante-1.webp','sol-1.webp'])assert.match(html,new RegExp(part));
 const story=await server.ssrLoadModule('/src/components/WelcomeStory.tsx');
 const beat=.6;
 // menino: batida no tempo 1 (pose 4 e corpo afundando), baqueta erguida antes do tempo 2
 const hit=story.storyMotion('menino',2*2.4+.02);assert.equal(hit.pose,4);assert.ok(hit.sy<1);
 assert.equal(story.storyMotion('menino',2.4+beat+beat*.8).pose,2);
 // Tom: pula no tempo 2 (y negativo) e agacha no 3 (amassa)
 assert.ok(story.storyMotion('tom',2.4+beat+.2).y<-3);assert.ok(story.storyMotion('tom',2.4+2*beat+.02).sy<.95);
 // menina: funde poses de sopro e balança
 const g=story.storyMotion('menina',3.1);assert.ok([2,3,4,5].includes(g.pose));assert.ok(Math.abs(story.storyMotion('menina',1.5).rot)>0);
 // movimento contínuo: posições mudam entre quadros próximos
 assert.notDeepEqual(story.storyMotion('tom',3.0),story.storyMotion('tom',3.05));
});
test('cena já apresentada fica assentada; animação tem quique, ociosidade sem salto, pausa e movimento reduzido',async()=>{
 const scene=await server.ssrLoadModule('/src/components/WelcomeScene.tsx');
 const settled=render(React.createElement(scene.WelcomeScene,{phase:'settled',paused:true,reduced:true,label:'x'}));
 assert.match(settled,/data-phase="settled"/);assert.match(settled,/data-paused="true"/);assert.match(settled,/data-reduced="true"/);
 const {readFileSync}=await import('node:fs');
 const css=readFileSync(new URL('../src/components/welcome-scene.css',import.meta.url),'utf8');
 assert.match(css,/@keyframes wc-pop\{[\s\S]*scale\(1\.16,\.84\)/);
 assert.match(css,/\.wc-bob\{animation:wc-bob var\(--bob\) ease-in-out calc\(\(var\(--delay\) \+ \.82s\) \* var\(--k\)\)/);
 assert.match(css,/\[data-phase=settled\]\{--k:0\}/);assert.match(css,/data-paused=true\][^{]*\{animation-play-state:paused!important\}/);
 assert.match(css,/prefers-reduced-motion:reduce\)\{\.wc-stage \*\{animation:none!important/);
 const last=Math.max(...scene.WELCOME_CAST.map(cast=>cast.delay+(cast.variant==='lead'?.9:.82)));
 assert.ok(last<=scene.WELCOME_ENTRANCE_SECONDS,'entrada termina antes do registro de conclusão');
});
test('faixa duplica só a arte para continuidade, com uma única lista acessível e parada antes de ler preferências',()=>{
 const html=render(React.createElement(WelcomeMusicRibbon,{locale:'en'}));
 assert.equal((html.match(/<ul /g)??[]).length,2);assert.equal((html.match(/<ul [^>]*aria-hidden="true"/g)??[]).length,1);
 assert.match(html,/animation-play-state:paused/);assert.match(html,/Sheet music/);assert.match(html,/Recorder/);assert.match(html,/Trumpet/);assert.match(html,/Clarinet/);
 assert.doesNotMatch(html,/<audio|<video|data-learning-view/);
});
test('Começar agora: “Eu quero aprender…” com um cartão por curso disponível; um toque escolhe e segue',async()=>{
 const {WorkshopOnboarding}=await server.ssrLoadModule('/src/components/WorkshopOnboarding.tsx');
 for(const locale of ACCESS_LOCALES){
  const t=ACCESS_COPY[locale],picked=[],props={locale,onPick:id=>picked.push(id),onBack:noop,onLocale:noop};
  const html=render(React.createElement(WorkshopOnboarding,{...props,workshopId:null}));
  assert.ok(html.includes(t.workshopsTitle));assert.doesNotMatch(html,/role="progressbar"|onb-continue|ct-tom|disabled=""/);
  assert.equal((html.match(/class="wsp-card"/g)??[]).length,4);assert.equal((html.match(/class="instrument-tile"/g)??[]).length,4);
  for(const name of [t.recorder,t.trumpet,t.clarinet,t.conducting])assert.ok(html.includes(name));
  assert.ok(!html.includes(t.comingSoon));
  const chosen=render(React.createElement(WorkshopOnboarding,{...props,workshopId:'recorder-soprano'}));
  assert.match(chosen,/class="wsp-card is-selected"/);
 }
 assert.equal(ACCESS_COPY['pt-BR'].workshopsTitle,'Eu quero aprender…');
});
test('Tom tem nove expressões no app inteiro e TomOfficial descreve a expressão para leitores de tela',async()=>{
 const art=await server.ssrLoadModule('/src/components/CactomTomArt.tsx');
 const brand=await server.ssrLoadModule('/src/components/CactomBrand.tsx');
 assert.equal(art.TOM_EXPRESSIONS.length,9);
 const seen=new Set();
 for(const expression of art.TOM_EXPRESSIONS){
  const svg=render(React.createElement(art.CactomTomArt,{expression}));
  assert.match(svg,new RegExp(`data-expression="${expression}"`));seen.add(svg.replace(/data-expression="[^"]+"/,''));
  const official=render(React.createElement(brand.TomOfficial,{expression}));
  assert.match(official,/role="img"/);assert.match(official,/aria-label="Tom/);assert.doesNotMatch(official,/tom-oficial\.png/);
 }
 assert.equal(seen.size,9,'cada expressão tem um desenho diferente');
 const decorative=render(React.createElement(brand.TomOfficial,{decorative:true,expression:'comemorando'}));
 assert.match(decorative,/aria-hidden="true"/);assert.doesNotMatch(decorative,/role="img"/);
 const tom=await server.ssrLoadModule('/src/components/TomInteractive.tsx');
 assert.equal(tom.tomExpressionFor({mood:'listening',covered:true}),'privacidade');
 assert.equal(tom.tomExpressionFor({mood:'error',covered:false}),'triste');
 assert.equal(tom.tomExpressionFor({mood:'success',covered:false}),'comemorando');
 assert.equal(tom.tomExpressionFor({mood:'waiting',covered:false}),'pensativo');
});
test('tela de carregamento: Tom andando e pensando, anunciada para leitor de tela; 1,5 s depois da escolha da oficina',async()=>{
 const {CactomLoader,LOADER_MS,LOADER_SRC}=await server.ssrLoadModule('/src/components/CactomLoader.tsx');
 assert.equal((await server.ssrLoadModule('/src/components/LoginScreen.tsx')).PICK_LOADING_MS,1500);
 assert.equal(LOADER_MS,2000);assert.equal(LOADER_SRC,'/animacoes/cactom-carregando.svg');
 const html=render(React.createElement(CactomLoader,{locale:'en'}));
 assert.match(html,/role="status"/);assert.match(html,/cactom-carregando\.svg/);assert.match(html,/Loading…/);
});
test('jornada de boas-vindas: Tom pergunta, atividade de partitura é só aquecimento e tem gotas d’água e XP',async()=>{
 const {OnboardingJourney}=await server.ssrLoadModule('/src/components/OnboardingJourney.tsx');
 const data=await server.ssrLoadModule('/src/lib/onboarding.ts');
 const html=render(React.createElement(OnboardingJourney,{locale:'pt-BR',workshopId:'recorder-soprano',onBack:noop,onDone:noop}));
 assert.match(html,/como foi que tu conheceu o Cactom\?/);assert.match(html,/tom-prancheta\.svg/);assert.match(html,/role="progressbar"/);
 assert.equal((html.match(/class="obj-option"/g)??[]).length,data.SOURCES.length);
 assert.match(html,/class="obj-continue" disabled=""/);
 const zero=data.quizFor('zero'),nivel=data.quizFor('nivel');
 assert.equal(zero.easy.length,4);assert.equal(zero.hard.length,2);assert.equal(nivel.hard.length,4);
 for(const q of [...nivel.easy,...nivel.hard])assert.ok(q.options.some(o=>o.id===q.answer),q.id);
 assert.equal(data.QUIZ_HEARTS,5);assert.equal(data.quizXp(6),16);assert.equal(data.accuracyLabel(100),'INCRÍVEL');
 const saved=new Map();data.saveOnboarding({goal:10,path:'zero'},{setItem:(k,v)=>saved.set(k,v)});
 assert.equal(JSON.parse(saved.get(data.ONBOARDING_KEY)).goal,10);
});
test('rojão: nada de “ofensiva” nem foguinho; o ícone é o Tom segurando a corda',async()=>{
 const {StreakFlame}=await server.ssrLoadModule('/src/components/LabIllustrations.tsx');
 const html=render(React.createElement(StreakFlame,{size:30}));
 assert.match(html,/tom-rojao/);assert.match(html,/tr-rope/);
 const fs=await import('node:fs');
 for(const f of ['src/components/OnboardingJourney.tsx','src/components/StreakExperience.tsx','src/components/LearningHome.tsx'])assert.doesNotMatch(fs.readFileSync(f,'utf8').replace(/\/\*[\s\S]*?\*\//g,''),/ofensiva/i,f);
});
test('efeitos sonoros: preferência liga/desliga guardada e nenhum som fora do navegador',async()=>{
 const sound=await server.ssrLoadModule('/src/lib/uiSound.ts');
 data.clear();assert.equal(sound.soundsOn(),true);
 sound.setSoundsOn(false);assert.equal(data.get(sound.SOUND_KEY),'off');assert.equal(sound.soundsOn(),false);
 sound.setSoundsOn(true);assert.equal(sound.soundsOn(),true);
 assert.doesNotThrow(()=>sound.playSound('certo'));
});
