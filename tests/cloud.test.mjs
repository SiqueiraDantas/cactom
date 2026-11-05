import test from 'node:test';
import assert from 'node:assert/strict';

const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),m};};
globalThis.localStorage=mem();
const {configureCloud,cloudEnabled,queueEvent,flushEvents,pushRanking,fetchRanking,toRow}=await import('../src/lib/cloud.ts');
const json=(status,body)=>new Response(body===undefined?null:JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
const ev=(id,extra={})=>({id,at:new Date().toISOString(),type:'answer',session:'s1',profileId:'p1',profileName:'Ana Clara',instrument:'trumpet-bb',data:{ok:true},...extra});

test('sem as variáveis do servidor o app segue só no navegador',()=>{configureCloud(null);assert.equal(cloudEnabled(),false);});

test('eventos vão em lote para a tabela eventos, só com o primeiro nome',async()=>{
 const calls=[];configureCloud({url:'https://teste.supabase.co',key:'sb_publishable_x',fetch:async(url,init)=>{calls.push({url:String(url),method:init?.method,body:init?.body?JSON.parse(init.body):null});return json(201);}});
 queueEvent(ev('11111111-1111-4111-8111-000000000001'));queueEvent(ev('11111111-1111-4111-8111-000000000002'));
 assert.equal(await flushEvents(),2);
 assert.match(calls[0].url,/\/rest\/v1\/eventos/);assert.equal(calls[0].method,'POST');assert.equal(calls[0].body.length,2);
 assert.equal(calls[0].body[0].profile_name,'Ana','nunca o nome completo');assert.ok(calls[0].body[0].device);
 assert.equal(JSON.parse(localStorage.getItem('cactom-eventos-fila')).length,0);
});

test('reenvio repetido (já existe) não trava a fila; sem internet a fila espera',async()=>{
 let mode='dup';configureCloud({url:'https://teste.supabase.co',key:'k',fetch:async(url,init)=>{
  if(mode==='off')throw new TypeError('Failed to fetch');
  const body=JSON.parse(init.body);if(Array.isArray(body))return json(409,{code:'23505',message:'duplicate key'});
  return body.id.endsWith('3')?json(409,{code:'23505',message:'duplicate key'}):json(201);}});
 queueEvent(ev('11111111-1111-4111-8111-000000000003'));queueEvent(ev('11111111-1111-4111-8111-000000000004'));
 assert.equal(await flushEvents(),1,'o repetido é descartado, o novo entra');
 assert.equal(JSON.parse(localStorage.getItem('cactom-eventos-fila')).length,0);
 mode='off';queueEvent(ev('11111111-1111-4111-8111-000000000005'));await flushEvents();
 assert.equal(JSON.parse(localStorage.getItem('cactom-eventos-fila')).length,1,'fica guardado pra depois');
 mode='ok';configureCloud({url:'https://teste.supabase.co',key:'k',fetch:async()=>json(201)});
 assert.equal(await flushEvents(),1);
});

test('ranking: manda a linha com o token do aparelho e lê o ranking de todos',async()=>{
 const calls=[];configureCloud({url:'https://teste.supabase.co',key:'k',fetch:async(url,init)=>{calls.push({url:String(url),body:init?.body?JSON.parse(init.body):null});
  if(String(url).includes('ranking_atualizar'))return json(200,true);
  return json(200,[{profile_id:'p9',name:'Bruno',xp:80,lessons:6,answered:30,correct:24,streak:3,last_at:null,created_at:'2026-11-01T00:00:00Z'}]);}});
 const store=mem();
 assert.equal(await pushRanking({profileId:'p1',name:'Ana',xp:40,lessons:3,answered:18,correct:15,accuracy:83,streak:2,lastAt:null},'trumpet-bb',store),true);
 const body=calls[0].body;assert.match(calls[0].url,/rpc\/ranking_atualizar/);assert.equal(body.p_name,'Ana');assert.ok(body.p_token.length>=20);
 await pushRanking({profileId:'p1',name:'Ana',xp:41,lessons:3,answered:18,correct:15,accuracy:83,streak:2,lastAt:null},'trumpet-bb',store);
 assert.equal(calls[1].body.p_token,body.p_token,'mesmo token sempre neste aparelho');
 const list=await fetchRanking('trumpet-bb');assert.equal(list[0].name,'Bruno');assert.equal(list[0].accuracy,80);
 assert.equal(toRow(ev('x',{profileName:undefined})).profile_name,null);
 configureCloud(null);
});
