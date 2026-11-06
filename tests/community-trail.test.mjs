import test from 'node:test';
import assert from 'node:assert/strict';
import {checkMessage,localCommunity,COMMUNITY_CHANNELS,tomWelcome} from '../src/lib/community.ts';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),clear:()=>m.clear(),key:()=>null,length:0};};
test('comunidade: salas geral + instrumentos, só públicas, com boas-vindas do Tom',()=>{
 assert.deepEqual(COMMUNITY_CHANNELS.map(c=>c.id),['geral','iniciacao','recorder-soprano','trumpet-bb','clarinet-bb'],'regência bloqueada: sem sala');
 assert.match(tomWelcome(COMMUNITY_CHANNELS[0]).text,/não manda telefone/);
});
test('comunidade protege a criança: bloqueia dados pessoais, links e palavrões; deixa papo de música passar',()=>{
 for(const bad of ['meu zap é 85 99999-1234','me chama no insta','manda email pra ana@gmail.com','olha www.site.com','moro na rua das flores','@joaozinho123','seu idiota'])assert.equal(checkMessage(bad).ok,false,bad);
 for(const ok of ['Consegui tocar o Si!','conta 1 2 3 4 e entra','o som ficou feio, alguma dica?','tô no 60 BPM'])assert.equal(checkMessage(ok).ok,true,ok);
 assert.equal(checkMessage('   ').ok,false);assert.equal(checkMessage('a'.repeat(300)).ok,false);
});
test('comunidade local guarda por sala e esconde mensagem só para quem pediu',()=>{
 const store=memory(),t=localCommunity(store);
 const m=t.send({channel:'recorder-soprano',authorId:'p1',author:'Ana',text:'Oi!'});
 t.send({channel:'geral',authorId:'p1',author:'Ana',text:'Geral'});
 assert.equal(t.history('recorder-soprano').length,1);assert.equal(t.history('geral').length,1);
 t.hide(m.id);assert.deepEqual(t.hidden(),[m.id]);assert.equal(t.online,false);
});
test('trilha alimenta as outras abas: lição concluída conta XP, parada e progresso',async()=>{
 const {formationOverview,formationJourney}=await import('../src/lib/formacao.ts');
 const {bandExercises,completeBandLesson}=await import('../src/lib/bandTrail.ts');
 const store=memory(),before=formationOverview(store,'recorder-soprano');
 assert.equal(before.xp,0);assert.equal(before.lessonsDone,0);assert.equal(before.stopsTotal,400);
 const stop=formationJourney('recorder-soprano').stops[0];
 for(const lessonId of stop.lessonIds)completeBandLesson(store,'recorder-soprano',{lessonId,stopId:stop.id,review:false,presentations:bandExercises('recorder-soprano',lessonId).map(e=>({id:e.id,correctFirst:true,recovered:false,evidence:e.evidence})),at:new Date('2026-11-02T12:00:00Z')});
 const after=formationOverview(store,'recorder-soprano');
 assert.equal(after.lessonsDone,stop.lessonIds.length);assert.equal(after.stopsDone,1);assert.ok(after.xp>0);assert.ok(after.percent>0);
 assert.notEqual(after.current.id,stop.id);
});
test('partitura: compasso empilhado, sem barra logo após a fórmula e colcheias do mesmo tempo com barra',async()=>{
 const {createServer}=await import('vite');const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const v=await createServer({server:{middlewareMode:true},logLevel:'silent'});
 try{const {RecorderCourseScore}=await v.ssrLoadModule('/src/components/RecorderCourseScore.tsx');
  const html=renderToStaticMarkup(React.createElement(RecorderCourseScore,{notes:[{midi:71,beats:1},{midi:69,beats:.5},{midi:67,beats:.5},{midi:null,beats:2}],meter:'4/4'}));
  assert.match(html,/<text x="80" y="62">4<\/text><line x1="71" x2="89"[^>]*><\/line><text x="80" y="89">4<\/text>/);
  assert.doesNotMatch(html,/x1="100" x2="100"/);
  assert.equal((html.match(/<rect[^>]*height="5.5"/g)??[]).length,1);
 }finally{await v.close();}
});
test('partitura: haste para baixo do Si (3ª linha) pra cima; pausa de semínima centrada e maior',async()=>{
 const {createServer}=await import('vite');const React=await import('react');const {renderToStaticMarkup}=await import('react-dom/server');
 const v=await createServer({server:{middlewareMode:true},logLevel:'silent'});
 try{const {RecorderCourseScore}=await v.ssrLoadModule('/src/components/RecorderCourseScore.tsx');
  const html=renderToStaticMarkup(React.createElement(RecorderCourseScore,{notes:[{midi:67,beats:1},{midi:71,beats:1},{midi:null,beats:1},{midi:74,beats:1}],meter:'4/4'}));
  assert.match(html,/x1="129" x2="129" y1="77" y2="45"/,'Sol: haste pra cima');
  assert.match(html,/y1="67" y2="99"/,'Si: haste pra baixo');
  assert.match(html,/scale\(\.72\)/,'pausa de semínima maior');
 }finally{await v.close();}
});
