import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {MODULE_ONE_KEY,MODULE_ONE_LESSONS,MODULE_ONE_TASKS,freshModuleOneEvidence,canRecordModuleOne,normalizeModuleOneResponse,emptyModuleOne,readModuleOne,recordModuleOne,freshFirstSi,advanceFirstSi,moduleOneCue} from '../src/lib/recorderModuleOne.ts';
import {ModuleOneMedia} from '../src/lib/recorderModuleOneMedia.ts';
import {createProfileStorage} from '../src/lib/profileStorage.ts';

const task=mode=>MODULE_ONE_TASKS.find(t=>t.mode===mode);
const response=(mode='sounds',patch={})=>({id:task(mode).id,at:'2026-10-30T19:00:00Z',report:'pratiquei',evidence:freshModuleOneEvidence(),...patch});
const memory=()=>{const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};};
const si=440*2**(14/12);
function samples(state,{frequency=si,clarity=.98,rms=.02,quiet=false,start=0,count=5,step=90}={}){
 for(let i=0;i<count;i++)state=advanceFirstSi(state,{at:start+i*step,frequency,clarity,rms,quiet});return state;
}
const quiet=(state,start=0,count=4)=>samples(state,{frequency:null,rms:.001,quiet:true,start,count});
test('Módulo 1 cobre os mesmos quinze códigos do plano, sem rebatizar as atividades',()=>{
 const plan=JSON.parse(readFileSync(new URL('../src/data/recorder-discipline-v1.json',import.meta.url)));
 const source=plan.sections[0].modules[0];
 assert.deepEqual(MODULE_ONE_LESSONS.map(l=>l.id),source.microLessons.map(l=>l.id));
 assert.deepEqual(MODULE_ONE_TASKS.map(t=>t.id),source.microLessons.flatMap(l=>l.activities.map(a=>a.id)));
 assert.equal(MODULE_ONE_LESSONS.length,5);assert.equal(MODULE_ONE_TASKS.length,15);
 assert.equal(source.microLessons[1].activities[0].status,'guided-live-demonstration');
 assert.equal(plan.sections[0].modules[1].microLessons[0].activities[0].status,'interactive-guided-practice');
});
test('interações necessárias não viram prática por visita, escolha errada ou apenas continuar',()=>{
 for(const mode of ['parts','hands','comfort','models','identify','compare','fingering','adjust','associate','cue','create','story','care']){
  assert.equal(canRecordModuleOne(task(mode),freshModuleOneEvidence(),'pratiquei'),false,mode);
  assert.equal(canRecordModuleOne(task(mode),freshModuleOneEvidence(),'apoio'),true);
  assert.equal(canRecordModuleOne(task(mode),freshModuleOneEvidence(),'depois'),true);
  assert.equal(canRecordModuleOne(task(mode),freshModuleOneEvidence(),''),false);
 }
 const e={...freshModuleOneEvidence(),holes:[0,1,2],answer:'direita',parts:['corpo','pe'],care:['orientacao','guardar']};
 for(const mode of ['parts','hands','fingering','care'])assert.equal(canRecordModuleOne(task(mode),e,'pratiquei'),false,mode);
});
test('apoios físicos são declarados, comparação de timbre exige demonstração e não ganha acerto automático',()=>{
 const e={...freshModuleOneEvidence(),parts:['bocal','corpo','pe'],answer:'esquerda',holes:[1,0],care:['orientacao','secagem','guardar'],liveModel:true,adjustment:'cobertura',cueFinished:true};
 for(const mode of ['parts','hands','models','compare','fingering','associate','adjust','cue','create','care'])assert.equal(canRecordModuleOne(task(mode),e,'pratiquei'),true,mode);
 for(const answer of ['primeiro','segundo'])assert.ok(normalizeModuleOneResponse(response('identify',{evidence:{...e,answer}})));
 assert.equal(normalizeModuleOneResponse(response('identify',{evidence:{...e,liveModel:false,answer:'primeiro'}})),null);
 const result=normalizeModuleOneResponse({...response(),grade:100,xp:10,passed:true,audio:'raw',evidence:{...e,siSounds:2,recording:'raw'}});
 for(const name of ['grade','xp','passed','audio'])assert.equal(name in result,false);
 assert.equal('recording' in result.evidence,false);assert.equal(result.evidence.siSounds,2);assert.deepEqual(result.evidence.parts,[]);
});
test('registros imutáveis e limitados preservam curso antigo, diagnóstico, Rojão e isolamento de perfil',()=>{
 const backing=memory(),a=createProfileStorage('12345678-1234-4123-8123-123456789abc',backing),b=createProfileStorage('87654321-4321-4321-8321-cba987654321',backing);
 a.setItem('mis-music-lab-recorder-v1','checks');a.setItem('cactom-recorder-discipline-v1','diagnóstico');a.setItem('mis-music-lab-streak-v1','dias');
 const initial=emptyModuleOne(),next=recordModuleOne(initial,response());
 assert.equal(Object.keys(initial.responses).length,0);a.setItem(MODULE_ONE_KEY,JSON.stringify(next));
 assert.equal(readModuleOne(a).ledger.responses[task('sounds').id].report,'pratiquei');assert.equal(Object.keys(readModuleOne(b).ledger.responses).length,0);
 assert.equal(a.getItem('mis-music-lab-recorder-v1'),'checks');assert.equal(a.getItem('cactom-recorder-discipline-v1'),'diagnóstico');assert.equal(a.getItem('mis-music-lab-streak-v1'),'dias');assert.equal(backing.data.size,4);
 for(const patch of [{id:'D01'},{at:'ruim'},{report:'aprovado'},{evidence:{...freshModuleOneEvidence(),siSounds:4}},{evidence:{...freshModuleOneEvidence(),holes:[0,0]}},{evidence:{...freshModuleOneEvidence(),pattern:[1,5,1]}}])assert.equal(normalizeModuleOneResponse(response('sounds',patch)),null);
});
test('dados corrompidos, futuros ou ilegíveis não autorizam substituir registros',()=>{
 const store=memory();
 for(const raw of ['{','x'.repeat(90001),JSON.stringify({version:2,moduleId:'S1-M01',responses:{}}),JSON.stringify({version:1,moduleId:'S1-M01',responses:{invalid:response()}})]){
  store.setItem(MODULE_ONE_KEY,raw);assert.equal(readModuleOne(store).safeToWrite,false);assert.equal(store.getItem(MODULE_ONE_KEY),raw);
 }
 assert.equal(readModuleOne({getItem:()=>{throw Error('negado')}}).safeToWrite,false);
});
test('silêncio, ruído, nota Sol, oitava errada e variação ampla nunca contam como Si',()=>{
 for(const options of [{frequency:null,rms:.001,quiet:true},{frequency:si,clarity:.4},{frequency:si,rms:.003},{frequency:si*2**(-4/12)},{frequency:si/2},{frequency:si*2},{frequency:si*2**(60/1200)},{frequency:NaN},{frequency:si,rms:NaN}]){
  const state=samples(quiet(freshFirstSi()),{...options,start:400,count:30});assert.equal(state.count,0,JSON.stringify(options));
 }
});
test('precisa de silêncio inicial e três emissões distintas; som contínuo só conta uma vez',()=>{
 assert.equal(samples(freshFirstSi(),{count:40}).count,0);
 let state=samples(quiet(freshFirstSi()),{start:400,count:30});assert.equal(state.count,1);
 // Noise is not the silence required to release the previous note.
 state=samples(state,{frequency:null,clarity:.2,rms:.04,start:3200,count:10});
 state=samples(state,{start:4200,count:10});assert.equal(state.count,1);
 state=quiet(state,5200);state=samples(state,{start:5600,count:5});assert.equal(state.count,2);
 state=quiet(state,6100);state=samples(state,{start:6500,count:5});assert.equal(state.count,3);
});
test('pequena variação é aceita, leituras esparsas e sopros incompletos não somam duração',()=>{
 const state=samples(quiet(freshFirstSi()),{frequency:si*2**(35/1200),start:400});assert.equal(state.count,1);
 const sparse=samples(quiet(freshFirstSi()),{start:400,step:500,count:20});assert.equal(sparse.count,0);
 let short=quiet(freshFirstSi());short=samples(short,{start:400,count:2});short=quiet(short,600);short=samples(short,{start:1000,count:2});assert.equal(short.count,0);
 assert.deepEqual(advanceFirstSi(state,{at:10,frequency:si,clarity:1,rms:.02,quiet:false}),state);
});
test('cartão tem preparo, três entradas e paradas reais; fim depende da sequência inteira',()=>{
 assert.deepEqual(moduleOneCue(0,[1,1,1]),{kind:'prepare',index:0,progress:0});
 assert.equal(moduleOneCue(2000,[1,1,1]).kind,'play');assert.equal(moduleOneCue(3000,[1,1,1]).kind,'rest');
 assert.equal(moduleOneCue(4200,[1,1,1]).index,1);assert.equal(moduleOneCue(6400,[1,1,1]).index,2);
 assert.equal(moduleOneCue(8599,[1,1,1]).kind,'rest');assert.equal(moduleOneCue(8600,[1,1,1]).kind,'finished');
 assert.equal(moduleOneCue(8600,[2,1,2]).kind,'play');assert.equal(moduleOneCue(10600,[2,1,2]).kind,'finished');
 const a=moduleOneCue(2200,[1,1,1]),b=moduleOneCue(2700,[1,1,1]);assert.ok(b.progress>a.progress);
});
function fixture(){
 const inputs=[],requests=[],events=[];
 const guide={stop(){events.push('stop-guide')},async play(){events.push('play-guide');return true}};
 const controller=new ModuleOneMedia(()=>new Promise((resolve,reject)=>requests.push({resolve,reject})),guide);
 const input=()=>{const value={stopped:0,stop:async()=>{value.stopped++;events.push('stop-mic')},listen(sample,signal){value.sample=sample;value.signal=signal}};inputs.push(value);return value};
 return {controller,requests,input,inputs,events};
}
test('permissão tardia é fechada ao cancelar; callbacks antigos não atingem outra atividade',async()=>{
 const f=fixture();let calls=0;const opening=f.controller.openMicrophone(()=>calls++,()=>calls++);f.controller.stop();const late=f.input();f.requests[0].resolve(late);assert.equal(await opening,false);assert.equal(late.stopped,1);
 const next=f.controller.openMicrophone(()=>calls++,()=>calls++),active=f.input();f.requests[1].resolve(active);assert.equal(await next,true);active.sample(null);assert.equal(calls,1);f.controller.stop();active.sample(null);active.signal({status:'quiet'});assert.equal(calls,1);assert.equal(active.stopped,1);
});
test('guia para o microfone antes de soar; microfone para o guia antes de abrir',async()=>{
 const f=fixture(),opening=f.controller.openMicrophone(()=>{},()=>{});const active=f.input();f.requests[0].resolve(active);await opening;
 const result=await f.controller.playGuide();assert.equal(result,true);assert.equal(active.stopped,1);assert.ok(f.events.lastIndexOf('stop-mic')<f.events.indexOf('play-guide'));
 const pending=f.controller.openMicrophone(()=>{},()=>{});assert.equal(f.events.at(-1),'stop-guide');f.controller.stop();f.requests[1].reject(Error('negado'));assert.equal(await pending,false);
 const failure=f.controller.openMicrophone(()=>{},()=>{});f.requests[2].reject(Error('negado'));await assert.rejects(failure,/negado/);
});
test('duas aberturas concorrentes mantêm só a atual e falha de listen fecha o recurso',async()=>{
 const f=fixture(),first=f.controller.openMicrophone(()=>{},()=>{}),second=f.controller.openMicrophone(()=>{},()=>{});
 const a=f.input(),b=f.input();f.requests[1].resolve(b);assert.equal(await second,true);f.requests[0].resolve(a);assert.equal(await first,false);assert.equal(a.stopped,1);assert.equal(b.stopped,0);
 const broken=f.controller.openMicrophone(()=>{},()=>{}),c=f.input();c.listen=()=>{throw Error('listen falhou')};f.requests[2].resolve(c);await assert.rejects(broken,/listen falhou/);assert.equal(b.stopped,1);assert.equal(c.stopped,1);
});
