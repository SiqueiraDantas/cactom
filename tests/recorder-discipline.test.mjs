import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createProfileStorage} from '../src/lib/profileStorage.ts';
import {DIAGNOSTIC_IDS,DIAGNOSTIC_TASKS,RECORDER_DIAGNOSTIC_KEY,emptyDiagnostic,readDiagnostic,recordDiagnostic,normalizeDiagnosticResponse,diagnosticChoiceMatch} from '../src/lib/recorderDiagnostic.ts';
import {diagnosticStimulus,DiagnosticAudio} from '../src/lib/diagnosticAudio.ts';
import {targetFrequencyFor} from '../src/lib/music.ts';
import {recorderNote} from '../src/lib/recorder.ts';
const plan=JSON.parse(readFileSync(new URL('../src/data/recorder-discipline-v1.json',import.meta.url),'utf8'));
const response=(id='D01',extra={})=>({id,at:'2026-10-30T15:00:00Z',choice:'sozinho',modelPlayed:true,tapOffsetsMs:[0,700],toneDetected:false,...extra});
function memory(){const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}

test('plano mantém 4 seções, 16 módulos, 80 microlições e exatamente 260 códigos únicos',()=>{
 const modules=plan.sections.flatMap(s=>s.modules),lessons=modules.flatMap(m=>m.microLessons),activities=lessons.flatMap(l=>l.activities),assessments=plan.sections.flatMap(s=>s.assessments);
 assert.equal(plan.sections.length,4);assert.equal(modules.length,16);assert.equal(lessons.length,80);assert.equal(activities.length,240);assert.equal(assessments.length,12);assert.equal(plan.diagnostic.length,8);
 const all=[...activities,...assessments,...plan.diagnostic];assert.equal(new Set(all.map(a=>a.id)).size,260);
 for(const section of plan.sections)for(const module of section.modules)for(const lesson of module.microLessons){
  assert.equal(lesson.activities.length,3);
  for(const [index,activity] of lesson.activities.entries()){assert.equal(activity.id,`${lesson.id}-A${String(index+1).padStart(2,'0')}`);assert.ok(activity.task.length>15);assert.equal(activity.status,module.number===1?(lesson.number===2?'guided-live-demonstration':'guided-practice'):'interactive-guided-practice');}
 }
 assert.ok(activities.some(a=>a.id==='S1-M03-L03-A02'));assert.ok(activities.some(a=>a.id==='S4-M16-L05-A03'));
});
test('diagnóstico possui as oito tarefas do documento e não é uma aprovação curricular',()=>{
 assert.deepEqual(DIAGNOSTIC_TASKS.map(t=>t.id),DIAGNOSTIC_IDS);assert.deepEqual(plan.diagnostic.map(t=>t.id),DIAGNOSTIC_IDS);
 const item=normalizeDiagnosticResponse({...response(),passed:true,xp:20,audio:'não deve ser salvo',rawSamples:[1,2],competence:'domínio'});
 assert.ok(item);for(const key of ['passed','xp','audio','rawSamples','competence'])assert.ok(!(key in item));
 assert.equal(diagnosticChoiceMatch(response()),null);
});
test('respostas inválidas e dados fora dos limites não entram no histórico',()=>{
 for(const change of [{id:'D09'},{at:'inválida'},{choice:'inexistente'},{tapOffsetsMs:[700,0]},{tapOffsetsMs:[NaN]},{tapOffsetsMs:[60001]},{tapOffsetsMs:Array(33).fill(0)},{modelPlayed:'sim'}])assert.equal(normalizeDiagnosticResponse(response('D01',change)),null);
 const d8=normalizeDiagnosticResponse(response('D08',{choice:'primeiro-contato',interest:'x'.repeat(200),tapOffsetsMs:[0],toneDetected:true}));
 assert.equal(d8.interest.length,120);assert.deepEqual(d8.tapOffsetsMs,[]);assert.equal(d8.toneDetected,false);
 assert.ok(!('interest' in normalizeDiagnosticResponse(response('D01',{interest:'privado'}))));
});
test('revisar uma resposta substitui só a tarefa e não altera o histórico anterior em memória',()=>{
 const first=recordDiagnostic(emptyDiagnostic(),response()),second=recordDiagnostic(first,response('D02',{choice:'pistas'}));
 const third=recordDiagnostic(second,response('D01',{choice:'apoio'}));
 assert.equal(first.responses.D01.choice,'sozinho');assert.equal(Object.keys(first.responses).length,1);assert.equal(third.responses.D02.choice,'pistas');assert.equal(third.responses.D01.choice,'apoio');
});
test('diagnóstico isolado por perfil não migra aulas antigas nem concede dia de prática',()=>{
 const backing=memory(),demo=createProfileStorage(null,backing),a=createProfileStorage('11111111-1111-4111-8111-111111111111',backing),b=createProfileStorage('22222222-2222-4222-8222-222222222222',backing);
 backing.setItem('mis-music-lab-recorder-v1','histórico antigo');backing.setItem('mis-music-lab-streak-v1','dias antigos');
 a.setItem(RECORDER_DIAGNOSTIC_KEY,JSON.stringify(recordDiagnostic(emptyDiagnostic(),response())));
 assert.equal(Object.keys(readDiagnostic(a).ledger.responses).length,1);assert.equal(Object.keys(readDiagnostic(b).ledger.responses).length,0);assert.equal(Object.keys(readDiagnostic(demo).ledger.responses).length,0);
 assert.equal(backing.getItem('mis-music-lab-recorder-v1'),'histórico antigo');assert.equal(backing.getItem('mis-music-lab-streak-v1'),'dias antigos');assert.equal(backing.values.size,3);
});
test('leitura corrompida ou de versão futura não autoriza sobrescrever o histórico',()=>{
 const store=memory();
 for(const raw of ['{','x'.repeat(75001),JSON.stringify({version:2,courseId:'recorder-discipline-v1',responses:{}}),JSON.stringify({version:1,courseId:'recorder-discipline-v1',responses:{D02:response('D01')}})]){
  store.setItem(RECORDER_DIAGNOSTIC_KEY,raw);assert.equal(readDiagnostic(store).safeToWrite,false);assert.equal(store.getItem(RECORDER_DIAGNOSTIC_KEY),raw);
 }
 assert.equal(readDiagnostic({getItem:()=>{throw new Error('privacidade')}}).safeToWrite,false);
});
test('só as duas escolhas de escuta têm referência objetiva; autorrelatos não viram acerto',()=>{
 assert.equal(diagnosticChoiceMatch(response('D03',{choice:'segundo'})),true);assert.equal(diagnosticChoiceMatch(response('D03',{choice:'primeiro'})),false);
 assert.equal(diagnosticChoiceMatch(response('D04',{choice:'desce'})),true);assert.equal(diagnosticChoiceMatch(response('D04',{choice:'sobe'})),false);
 assert.equal(diagnosticChoiceMatch(response('D03',{choice:'sem-audio',modelPlayed:false})),null);assert.equal(diagnosticChoiceMatch(response('D05')),null);
});
test('modelos sonoros respeitam o número de tempos e a oitava real da flauta soprano',()=>{
 assert.equal(diagnosticStimulus('D01').length,8);assert.equal(diagnosticStimulus('D02').length,4);
 const pair=diagnosticStimulus('D03');assert.equal(pair.length,2);assert.ok(pair[1].frequency>pair[0].frequency);
 assert.equal(pair[1].frequency,targetFrequencyFor(recorderNote(71)));assert.ok(pair[1].frequency>980&&pair[1].frequency<1000);
 const line=diagnosticStimulus('D04');assert.ok(line[0].frequency>line[1].frequency&&line[1].frequency>line[2].frequency);
 assert.deepEqual(diagnosticStimulus('D06'),[]);assert.deepEqual(diagnosticStimulus('D08'),[]);
});

class FakeContext{
 static all=[];static wait=false;static fail=false;
 constructor(){this.state='suspended';this.currentTime=10;this.nodes=[];this.closed=0;this.destination={};FakeContext.all.push(this);}
 resume(){if(FakeContext.wait)return new Promise(resolve=>{this.release=()=>{this.state='running';resolve();};});this.state='running';return Promise.resolve();}
 close(){this.closed++;this.state='closed';return Promise.resolve();}
 createOscillator(){if(FakeContext.fail)throw new Error('nó indisponível');const node={frequency:{value:0},connect(){},start(at){this.started=at;},stop(at){this.stopped=at;}};this.nodes.push(node);return node;}
 createGain(){return {connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}};}
}
async function withAudio(fn){const previous=globalThis.AudioContext;FakeContext.all=[];FakeContext.wait=false;FakeContext.fail=false;globalThis.AudioContext=FakeContext;try{await fn();}finally{globalThis.AudioContext=previous;}}
test('exemplo só cria áudio ao clicar e fecha o contexto depois da reprodução completa',()=>withAudio(async()=>{
 const audio=new DiagnosticAudio();assert.equal(FakeContext.all.length,0);const playing=audio.play('D03');await Promise.resolve();const ctx=FakeContext.all[0];assert.equal(ctx.nodes.length,2);ctx.nodes.at(-1).onended();assert.equal(await playing,true);assert.equal(ctx.closed,1);
}));
test('parar ou substituir um exemplo cancela o anterior sem marcar reprodução completa',()=>withAudio(async()=>{
 const audio=new DiagnosticAudio(),one=audio.play('D01');await Promise.resolve();const old=FakeContext.all[0],two=audio.play('D04');assert.equal(await one,false);await Promise.resolve();old.nodes.at(-1).onended();const current=FakeContext.all[1];assert.equal(current.closed,0);audio.stop();assert.equal(await two,false);assert.equal(old.closed,1);assert.equal(current.closed,1);
}));
test('cancelamento enquanto áudio abre e erro de nó não deixam contexto ativo',()=>withAudio(async()=>{
 FakeContext.wait=true;const audio=new DiagnosticAudio(),playing=audio.play('D07'),ctx=FakeContext.all[0];audio.stop();ctx.release();assert.equal(await playing,false);assert.equal(ctx.state,'closed');
 FakeContext.wait=false;FakeContext.fail=true;await assert.rejects(()=>audio.play('D03'),/nó indisponível/);assert.equal(FakeContext.all.at(-1).state,'closed');
}));
