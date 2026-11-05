import test from 'node:test';
import assert from 'node:assert/strict';

const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
globalThis.localStorage=mem();
const {configureCloud}=await import('../src/lib/cloud.ts');
const C=await import('../src/lib/communityCloud.ts');
const {roomsFor,stickerOf}=await import('../src/lib/community.ts');
const json=(status,body)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const ana={id:'p-ana',name:'Ana Clara'};

test('turmas: a criança só vê a Geral e a turma do instrumento dela',()=>{
 assert.deepEqual(roomsFor('recorder-soprano').map(r=>r.id),['geral','recorder-soprano']);
 assert.deepEqual(roomsFor('trumpet-bb').map(r=>r.id),['geral','trumpet-bb']);
 assert.equal(stickerOf(':tom-feliz:'),'tom-feliz');assert.equal(stickerOf(':tom-qualquer:'),null);assert.equal(stickerOf('oi :tom-feliz:'),null);
});

test('chat online: só entra com o responsável; manda só o primeiro nome e o token do perfil',async()=>{
 const calls=[];configureCloud({url:'https://teste.supabase.co',key:'k',fetch:async(url,init)=>{const body=JSON.parse(init.body);calls.push({url:String(url),body});
  return json(200,body.p_responsavel?'ok':'responsavel');}});
 const store=mem();
 assert.equal(C.chatConsented(store),false);
 assert.equal(await C.joinChat(ana,'recorder-soprano',store),'responsavel');
 assert.equal(C.chatConsented(store),false,'sem autorização não libera');
 assert.equal(await C.joinChat(ana,'recorder-soprano',store,{name:'Maria',birthYear:1985}),'ok');
 assert.equal(C.chatConsented(store),true);
 const b=calls[1].body;assert.match(calls[1].url,/rpc\/chat_entrar/);assert.equal(b.p_name,'Ana');assert.equal(b.p_responsavel,'Maria');assert.equal(b.p_ano_responsavel,1985);
 assert.ok(b.p_token.length>=20);assert.equal(calls[0].body.p_token,b.p_token,'mesmo token do perfil');
 configureCloud(null);
});

test('chat online: lê a sala, manda, mostra o motivo do bloqueio e denuncia',async()=>{
 const calls=[];configureCloud({url:'https://teste.supabase.co',key:'k',fetch:async(url,init)=>{const u=String(url),body=JSON.parse(init.body);calls.push({u,body});
  if(u.includes('chat_mensagens_da_sala'))return json(200,[{id:'m1',channel:'recorder-soprano',profile_id:'p-bia',name:'Bia',text:'Oi!',at:'2026-11-04T20:00:00Z'}]);
  if(u.includes('chat_enviar'))return json(200,body.p_text.includes('zap')?{ok:false,reason:'rede social'}:{ok:true,message:{id:'m2',channel:body.p_channel,profile_id:body.p_profile,name:'Ana',text:body.p_text,at:'2026-11-04T20:01:00Z'}});
  if(u.includes('chat_denunciar'))return json(200,true);
  return json(404,{});}});
 const store=mem();
 const list=await C.fetchChat(ana,'recorder-soprano',store);
 assert.deepEqual(list[0],{id:'m1',channel:'recorder-soprano',authorId:'p-bia',author:'Bia',text:'Oi!',at:'2026-11-04T20:00:00Z'});
 await C.fetchChat(ana,'recorder-soprano',store,'2026-11-04T20:00:00Z');assert.equal(calls[1].body.p_after,'2026-11-04T20:00:00Z','depois busca só as novas');
 const ok=await C.sendChat(ana,'recorder-soprano','Consegui!',store);assert.equal(ok.ok,true);assert.equal(ok.message.author,'Ana');
 const no=await C.sendChat(ana,'recorder-soprano','me chama no zap',store);assert.equal(no.ok,false);assert.match(no.reason,/rede social/);
 assert.equal(await C.reportChat(ana,'m1',store),true);
 configureCloud({url:'https://teste.supabase.co',key:'k',fetch:async()=>{throw new TypeError('Failed to fetch');}});
 const off=await C.sendChat(ana,'geral','oi',store);assert.equal(off.ok,false);assert.match(off.reason,/internet/);
 assert.equal(await C.fetchChat(ana,'geral',store),null);
 configureCloud(null);
});
