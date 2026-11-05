import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {courseFor} from '../src/lib/courses.ts';
import {availableInstrument} from '../src/lib/instruments.ts';
import {scoresForInstrument} from '../src/lib/scoreLibrary.ts';
let server,LearningHome,Provider,ScoreLab;
const noop=()=>{},course=courseFor('recorder-soprano'),instrument=availableInstrument('recorder-soprano');
const props={passed:{},seenValves:[],results:{},onLesson:noop,onVirtual:noop,onScores:noop,onInstrument:noop,instrument,learningSupport:null,history:[],course,recorderSystem:'baroque',onRecorderSystem:noop,access:{mode:'demo',profile:null},onSignOut:noop};
before(async()=>{
 globalThis.localStorage={getItem:()=>null,setItem:noop,removeItem:noop};
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 LearningHome=(await server.ssrLoadModule('/src/components/LearningHome.tsx')).LearningHome;
 Provider=(await server.ssrLoadModule('/src/components/ProfileStorage.tsx')).ProfileStorageProvider;
 ScoreLab=(await server.ssrLoadModule('/src/components/ScoreLab.tsx')).ScoreLab;
});
after(async()=>{await server?.close();delete globalThis.localStorage;});
const wrap=child=>renderToStaticMarkup(React.createElement(Provider,{profileId:null},child));
const home=(tab='learn',extra={})=>wrap(React.createElement(LearningHome,{...props,...extra,initialTab:tab}));
test('the learning path keeps all 13 reachable lessons across three vertical units, with no unit tabs',()=>{
 const html=home();
 assert.equal((html.match(/class="journey-unit journey-unit-/g)??[]).length,3);
 assert.equal((html.match(/class="lesson-node /g)??[]).length,13);
 assert.equal((html.match(/class="path-connector"/g)??[]).length,3);
 for(const lesson of course.lessons)assert.ok(html.includes('id="lesson-'+lesson.id+'"'));
 assert.match(html,/0 de 4 aulas concluídas/);assert.match(html,/0 de 5 aulas concluídas/);
 assert.doesNotMatch(html,/class="unit-tabs"|class="welcome-card"|class="node-label"/);
});
test('course percentage, unit counters and achievements remain derived from actual completions',()=>{
 const passed={[course.lessons[1].id]:course.lessons[1].steps.map(s=>s.id)},seenValves=[0,1,2,3,4,5,6,7];
 const html=home('learn',{passed,seenValves});
 assert.match(html,/class="topbar-progress"[^>]*>[\s\S]*?<b>15%<\/b>/);
 assert.match(html,/2 de 4 aulas concluídas/);
 const achievements=home('achievements',{passed,seenValves});
 assert.match(achievements,/<span>2<\/span> de \d+ medalhas/);assert.match(achievements,/class="rk"/);assert.ok(achievements.indexOf('>Ranking')<achievements.indexOf('>Medalhas<'));
 const progress=home('progress',{passed,seenValves});
 assert.match(progress,/2 de 13 aulas concluídas/);assert.match(progress,/0 notas avaliadas/);
});
test('every dashboard tab uses official branding and keeps the six navigation destinations',()=>{
 for(const tab of ['learn','scores','streak','achievements','progress']){
  const html=home(tab);
  assert.match(html,new RegExp('data-learning-view="'+tab+'"'));
  assert.match(html,/cactom-wordmark.png/);assert.match(html,/class="tom-official/);
  assert.doesNotMatch(html,/logo-madeinsertao|lab-mascot|Made in Sertão Music Lab/);
  for(const name of ['Aprender','Partituras','Seu Rojão','Conquistas','Meu progresso','Comunidade'])assert.ok(html.includes('aria-label="'+name+'"'));
 }
 assert.ok(!home('learn').includes('aria-label="Praticar"'));
 const scores=home('scores');assert.match(scores,/Adicionar partitura/);assert.match(scores,/Traz tua partitura/);assert.match(scores,/accept="\.pdf/);
 const learn=home('learn');assert.match(learn,/Tá sem a flauta aí\?/);
});
test('score library keeps its original studies and MusicXML import under the new visual shell',()=>{
 const html=wrap(React.createElement(ScoreLab,{instrument,recorderSystem:'baroque',onExit:noop,onAttempt:noop}));
 assert.match(html,/cactom-score-library/);assert.match(html,/cactom-wordmark.png/);assert.match(html,/type="file"/);assert.match(html,/Enviar partitura em PDF ou MusicXML para flauta doce/);
 assert.equal((html.match(/class="shelf-card"/g)??[]).length,scoresForInstrument(instrument.id).length);
 for(const score of scoresForInstrument(instrument.id))assert.ok(html.includes(score.title));
});
