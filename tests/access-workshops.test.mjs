import test from 'node:test';
import assert from 'node:assert/strict';
import {accessFlow,initialAccessFlow,accessWorkshopIntent,courseEntrySelection} from '../src/lib/accessFlow.ts';
import {INSTRUMENTS} from '../src/lib/instruments.ts';
test('começar abre oficinas, o Tom se apresenta, vem a jornada de boas-vindas; o cadastro só por pedido explícito',()=>{
 let state=accessFlow(initialAccessFlow,{type:'start'});assert.equal(state.view,'workshops');assert.equal(state.workshopId,null);
 assert.deepEqual(accessFlow(state,{type:'continue'}),state);
 for(const id of ['flute','alto-sax','trombone','nao-existe'])assert.deepEqual(accessFlow(state,{type:'choose',id}),state);
 state=accessFlow(state,{type:'choose',id:'recorder-soprano'});state=accessFlow(state,{type:'continue'});
 assert.deepEqual(state,{view:'hello',workshopId:'recorder-soprano'});
 assert.deepEqual(accessFlow(state,{type:'back'}),{view:'workshops',workshopId:'recorder-soprano'});
 state=accessFlow(state,{type:'continue'});
 assert.deepEqual(state,{view:'journey',workshopId:'recorder-soprano'});
 assert.deepEqual(accessFlow(state,{type:'back'}),{view:'hello',workshopId:'recorder-soprano'});
 assert.deepEqual(accessFlow(state,{type:'signup'}),{view:'signup',workshopId:'recorder-soprano'});
 assert.deepEqual(accessFlow({view:'workshops',workshopId:null},{type:'signup'}),{view:'workshops',workshopId:null});
});
test('trocar oficina retorna ao catálogo sem perder escolha e aceita os quatro cursos existentes',()=>{
 for(const item of INSTRUMENTS.filter(item=>item.available)){
  const chosen=accessFlow({view:'workshops',workshopId:null},{type:'choose',id:item.id});
  const signup=accessFlow(chosen,{type:'signup'});assert.equal(signup.workshopId,item.id);
  assert.deepEqual(accessFlow(signup,{type:'back'}),chosen);
  assert.deepEqual(accessFlow(signup,{type:'edit-workshop'}),chosen);
 }
});
test('login direto não exige escolher oficina; cadastro pode trocar para login preservando sua intenção',()=>{
 const chosen={view:'signup',workshopId:'recorder-soprano'};
 assert.deepEqual(accessFlow(chosen,{type:'login'}),{view:'login',workshopId:'recorder-soprano'});
 const welcome=accessFlow({view:'login',workshopId:'recorder-soprano'},{type:'back'});
 assert.deepEqual(accessFlow(welcome,{type:'login'}),{view:'login',workshopId:null});
 assert.equal(accessFlow({view:'login',workshopId:null},{type:'start'}).view,'workshops');
});
test('preferência explícita entra direto na oficina escolhida; acesso comum mantém seleção existente',()=>{
 assert.deepEqual(courseEntrySelection('recorder-soprano','trumpet-bb'),{selected:'recorder-soprano',choosing:false});
 assert.deepEqual(courseEntrySelection(undefined,'clarinet-bb'),{selected:'clarinet-bb',choosing:true});
 assert.deepEqual(courseEntrySelection(undefined,null),{selected:null,choosing:true});
});
test('oficinas indisponíveis ou parâmetros inválidos nunca pulam o seletor',()=>{
 for(const value of ['flute','trombone','alto-sax','desconhecido',{},null]){
  assert.deepEqual(courseEntrySelection(value,'recorder-soprano'),{selected:'recorder-soprano',choosing:true});
  assert.deepEqual(courseEntrySelection(value,value),{selected:null,choosing:true});
 }
});
test('escolha de oficina não registra conta, progresso ou um dia de prática',()=>{
 const before={...initialAccessFlow};let state=accessFlow(initialAccessFlow,{type:'start'});
 state=accessFlow(state,{type:'choose',id:'clarinet-bb'});state=accessFlow(state,{type:'continue'});
 assert.deepEqual(initialAccessFlow,before);assert.deepEqual(Object.keys(state).sort(),['view','workshopId']);
 assert.deepEqual(accessFlow(state,{type:'choose',id:'recorder-soprano'}),state);
});

test('explorar pela entrada não herda uma escolha abandonada; entrar pelo cadastro conserva a escolha',()=>{
 const selected={view:'workshops',workshopId:'recorder-soprano'};
 assert.equal(accessWorkshopIntent(selected),undefined);
 assert.equal(accessWorkshopIntent(accessFlow(selected,{type:'back'})),undefined);
 const hello=accessFlow(selected,{type:'continue'});assert.equal(accessWorkshopIntent(hello),undefined);
 assert.equal(accessWorkshopIntent(accessFlow(hello,{type:'continue'})),undefined);
 const signup=accessFlow(selected,{type:'signup'});assert.equal(accessWorkshopIntent(signup),'recorder-soprano');
 assert.equal(accessWorkshopIntent(accessFlow(signup,{type:'login'})),'recorder-soprano');
 assert.equal(accessWorkshopIntent({view:'signup',workshopId:'alto-sax'}),undefined);
});

test('curso escolhido fica salvo no navegador, com ou sem login',async()=>{
 const {createServer}=await import('vite');
 const v=await createServer({server:{middlewareMode:true},logLevel:'silent'});
 try{
  const store=new Map();globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,val)=>store.set(k,String(val)),removeItem:k=>store.delete(k)};
  const m=await v.ssrLoadModule('/src/lib/browserCourse.ts');
  assert.equal(m.readBrowserCourse(),null);
  m.saveBrowserCourse('recorder-soprano');assert.equal(m.readBrowserCourse(),'recorder-soprano');
  m.saveBrowserCourse('curso-que-nao-existe');assert.equal(m.readBrowserCourse(),'recorder-soprano');
 }finally{delete globalThis.localStorage;await v.close();}
});

test('sessão lembrada: atualizar a página não repete tutorial; sair apaga; senha nunca é guardada',async()=>{
 const m=new Map(),store={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
 const s=await import('../src/lib/session.ts');
 assert.equal(s.readSession(store),null);
 s.saveSession({mode:'local',profile:{id:'p1',username:'ana',name:'Ana',password:'x'}},store);
 assert.deepEqual(s.readSession(store),{mode:'local',profile:{id:'p1',username:'ana',name:'Ana'}});assert.doesNotMatch(m.get(s.SESSION_KEY),/password/);
 s.clearSession(store);assert.equal(s.readSession(store),null);
 m.set('cactom-onboarding-v1','{}');assert.deepEqual(s.readSession(store),{mode:'demo',profile:null});
});
