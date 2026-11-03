import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {COURSE_MODULES,COURSE_TASKS,COURSE_IDS,courseTask,courseScoreEvents,courseNote,barBeats,pulseBeats,validatePhrase,evaluateCourse,canRecordCourse,reconstructionMatches,normalizeCourseResponse,recordCourse,readCourse,emptyCourse,RECORDER_FULL_KEY} from '../src/lib/recorderFullCourse.ts';
import {targetFrequencyFor} from '../src/lib/music.ts';
import {createProfileStorage} from '../src/lib/profileStorage.ts';
const source=JSON.parse(readFileSync(new URL('../src/data/recorder-discipline-v1.json',import.meta.url),'utf8'));
const task=COURSE_TASKS.find(t=>t.module===3&&t.material.mode==='perform');
function memory(){const values=new Map();return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};}
function simulated(notes,meter,bpm=60,transform=hz=>hz){
 const events=courseScoreEvents(notes,meter),q=60000/(bpm*pulseBeats(meter)),end=notes.reduce((sum,n)=>sum+n.beats,0)*q;
 const samples=[];for(let at=-400;at<=end+500;at+=50){const e=events.find(e=>at>=e.startBeat*q&&at<(e.startBeat+e.beats)*q);samples.push({at,frequency:e?.note?transform(targetFrequencyFor(e.note)):null});}return samples;
}
test('todos os 260 IDs originais têm rota e os 16 módulos preservam as 80 microlições',()=>{
 assert.equal(COURSE_MODULES.length,16);assert.equal(COURSE_MODULES.flatMap(m=>m.microLessons).length,80);assert.equal(COURSE_TASKS.length,252);assert.equal(COURSE_IDS.length,260);assert.equal(new Set(COURSE_IDS).size,260);
 const original=source.sections.flatMap(s=>[...s.modules.flatMap(m=>m.microLessons.flatMap(l=>l.activities)),...s.assessments]);
 assert.deepEqual(COURSE_TASKS.map(t=>({id:t.id,task:t.task})),original.map(t=>({id:t.id,task:t.task})));
 assert.equal(COURSE_TASKS.filter(t=>t.assessment).length,12);assert.ok(courseTask('S4-M16-L05-A03'));assert.ok(courseTask('B2.3'));
});
test('cada proposta possui material utilizável, compasso completo e notas na tessitura do exemplo',()=>{
 for(const t of COURSE_TASKS){const m=t.material;assert.ok(m.mode,t.id);assert.ok(m.guide.length>30,t.id);assert.ok(m.reflection.length>10,t.id);assert.ok(validatePhrase(m.notes,m.meter,m.pool),t.id);assert.ok(validatePhrase(m.alternative,m.meter),t.id+' alternativa');
  if(m.mode==='choice'){assert.ok(m.question);assert.equal(m.options.length,3);assert.ok(m.answer>=0&&m.answer<3);}
 }
});
test('a primeira peça mantém só Si, Lá e Sol; a ampliação de registro vem depois',()=>{
 for(const t of COURSE_TASKS.filter(t=>t.module===4&&!t.assessment))assert.ok(t.material.notes.every(n=>n.midi===null||[67,69,71].includes(n.midi)),t.id);
 const six=COURSE_TASKS.filter(t=>t.material.meter==='6/8');assert.ok(six.length>=5);assert.ok(six.every(t=>barBeats(t.material.meter)/pulseBeats(t.material.meter)===2));
});
test('silêncio com microfone ativo não acerta nota; ausência de sinal também não aprova pausa',()=>{
 const notes=[{midi:71,beats:2},{midi:null,beats:1},{midi:69,beats:1}];
 const quiet=simulated(notes,'4/4',60,()=>null),verdict=evaluateCourse(notes,'4/4',quiet,60,0);
 assert.deepEqual(verdict.map(v=>v.passed),[false,true,false]);
 assert.ok(evaluateCourse(notes,'4/4',[],60,0).every(v=>!v.passed));
 const noise=simulated(notes,'4/4').map(s=>({...s,frequency:NaN}));assert.ok(evaluateCourse(notes,'4/4',noise,60,0).every(v=>!v.passed));
});
test('nota e pausa reais, afinação moderada e erro de outra nota são diferenciados',()=>{
 const notes=[{midi:71,beats:2},{midi:null,beats:1},{midi:69,beats:1}];
 const good=evaluateCourse(notes,'4/4',simulated(notes,'4/4'),60,0);assert.ok(good.every(v=>v.passed));
 const close=evaluateCourse(notes,'4/4',simulated(notes,'4/4',60,hz=>hz*2**(30/1200)),60,0);assert.ok(close.every(v=>v.passed));
 const wrong=evaluateCourse(notes,'4/4',simulated(notes,'4/4',60,()=>targetFrequencyFor(courseNote(67))),60,0);assert.deepEqual(wrong.map(v=>v.passed),[false,true,false]);
 const noisyRest=simulated(notes,'4/4').map(s=>s.at>=2000&&s.at<3000?{...s,frequency:900}:s);assert.equal(evaluateCourse(notes,'4/4',noisyRest,60,0)[1].passed,false);
 const wide=evaluateCourse(notes,'4/4',simulated(notes,'4/4',60,hz=>hz*2**(70/1200)),60,0);assert.equal(wide[0].passed,false);
});
test('6/8 usa dois tempos e ligaduras somam uma emissão contínua',()=>{
 const six=COURSE_TASKS.find(t=>t.material.meter==='6/8').material;assert.ok(evaluateCourse(six.notes,'6/8',simulated(six.notes,'6/8'),60,0).every(v=>v.passed));
 const tied=[{midi:71,beats:.5,tie:true},{midi:71,beats:1},{midi:69,beats:.5},{midi:67,beats:2}];
 const events=courseScoreEvents(tied,'4/4');assert.equal(events.length,3);assert.equal(events[0].beats,1.5);assert.equal(events[1].startBeat,1.5);
 assert.ok(evaluateCourse(tied,'4/4',simulated(tied,'4/4'),60,0).every(v=>v.passed));
});
test('criação valida tessitura, preenchimento, duração e passagem de compasso',()=>{
 assert.ok(validatePhrase([{midi:71,beats:2},{midi:null,beats:2}],'4/4',[71]));
 for(const notes of [[],[null],[{midi:71,beats:1}],[{midi:80,beats:4}],[{midi:69,beats:4}],[{midi:71,beats:3},{midi:71,beats:2},{midi:71,beats:3}],[{midi:71,beats:NaN}]])assert.equal(validatePhrase(notes,'4/4',[71]),false);
});
test('gravar prática exige ação real ou relato orientado explícito; avaliação pede descritor e reflexão',()=>{
 const base={id:task.id,at:'2026-10-31T12:00:00Z',report:'pratiquei',attempted:true,matched:0,total:4};assert.equal(canRecordCourse(task,base),false);
 assert.ok(canRecordCourse(task,{...base,matched:4}));assert.ok(canRecordCourse(task,{...base,manual:true}));
 const assessment=courseTask('B2.3');assert.equal(canRecordCourse(assessment,{...base,id:assessment.id,reflection:'Uma reflexão sobre o estudo.'}),false);
 assert.ok(canRecordCourse(assessment,{...base,id:assessment.id,reflection:'Uma reflexão sobre o estudo.',rubric:'pistas'}));
});
test('respostas normalizam somente observações, sem áudio bruto, aprovação ou XP',()=>{
 const response={id:task.id,at:'2026-10-31T12:00:00Z',report:'apoio',audio:'não guardar',samples:[1,2],xp:50,passed:true,system:'german',reflection:'x'.repeat(1000)};
 const clean=normalizeCourseResponse(response);assert.ok(clean);assert.equal(clean.reflection.length,600);assert.equal(clean.system,'german');
 for(const key of ['audio','samples','xp','passed'])assert.ok(!(key in clean));
 assert.equal(normalizeCourseResponse({...response,id:'S1-M01-L01-A01'}),null);assert.equal(normalizeCourseResponse({...response,id:'inexistente'}),null);
});
test('registros isolados por perfil preservam Módulo 1, diagnóstico, treinos e Seu Rojão',()=>{
 const backing=memory(),a=createProfileStorage('11111111-1111-4111-8111-111111111111',backing),b=createProfileStorage('22222222-2222-4222-8222-222222222222',backing),demo=createProfileStorage(null,backing);
 for(const key of ['cactom-recorder-module-01-v1','mis-music-lab-recorder-v1','mis-music-lab-streak-v1'])backing.setItem(key,'preservado');
 const ledger=recordCourse(emptyCourse(),{id:task.id,at:'2026-10-31T12:00:00Z',report:'apoio'});a.setItem(RECORDER_FULL_KEY,JSON.stringify(ledger));
 assert.equal(Object.keys(readCourse(a).ledger.responses).length,1);assert.equal(Object.keys(readCourse(b).ledger.responses).length,0);assert.equal(Object.keys(readCourse(demo).ledger.responses).length,0);assert.equal(backing.values.size,4);
 for(const key of ['cactom-recorder-module-01-v1','mis-music-lab-recorder-v1','mis-music-lab-streak-v1'])assert.equal(backing.getItem(key),'preservado');
});
test('dados corrompidos ou futuros não autorizam sobrescrever os registros',()=>{
 const store=memory();for(const raw of ['{',JSON.stringify({version:2,responses:{}}),JSON.stringify({version:1,responses:{errado:{id:task.id,at:'2026-10-31T12:00:00Z',report:'apoio'}}})]){store.setItem(RECORDER_FULL_KEY,raw);const read=readCourse(store);assert.equal(read.safeToWrite,false);assert.ok(read.warning);assert.equal(store.getItem(RECORDER_FULL_KEY),raw);}
});

test('escuta comparativa exige os dois modelos ou relato orientado explícito',()=>{
 const t=courseTask('S3-M09-L01-A01'),r={id:t.id,at:'2026-10-31T12:00:00Z',report:'pratiquei',modelPlayed:true,modelsHeard:[0]};
 assert.equal(canRecordCourse(t,r),false);assert.ok(canRecordCourse(t,{...r,modelsHeard:[0,1]}));assert.ok(canRecordCourse(t,{...r,manual:true}));
});
test('ditado confere o padrão e a criação preserva as restrições do enunciado',()=>{
 const t=courseTask('S2-M06-L02-A02'),notes=t.material.notes;
 assert.ok(reconstructionMatches(t,notes));assert.equal(reconstructionMatches(t,[{midi:71,beats:4}]),false);
 const base={id:t.id,at:'2026-10-31T12:00:00Z',report:'pratiquei',composition:notes,modelPlayed:true,referencePlayed:true};
 assert.ok(canRecordCourse(t,base));assert.equal(canRecordCourse(t,{...base,composition:[{midi:71,beats:4}]}),false);
 const cards=courseTask('S1-M02-L04-A03');assert.equal(canRecordCourse(cards,{...base,composition:[{midi:71,beats:4}]}),false);assert.ok(canRecordCourse(cards,{...base,composition:[71,69,71,69].map(midi=>({midi,beats:1}))}));
});

test('avaliação B1 compara uma terceira nota real e reúne registro agudo, alteração e ritmos',()=>{
 const listen=courseTask('B1.1').material;assert.equal(listen.notes[2].midi,67);assert.equal(listen.alternative[2].midi,65);
 const performance=courseTask('B1.2').material;assert.ok(performance.notes.some(n=>n.midi===74));assert.ok(performance.notes.some(n=>n.midi===66));assert.ok(performance.notes.some(n=>n.beats===.5));assert.ok(validatePhrase(performance.notes,performance.meter,performance.pool));
});

test('criar e tocar não vira execução correta apenas por ouvir a criação',()=>{
 const t=courseTask('S2-M06-L04-A03'),r={id:t.id,at:'2026-10-31T12:00:00Z',report:'pratiquei',composition:[{midi:71,beats:4}],modelPlayed:true};
 assert.equal(canRecordCourse(t,r),false);assert.ok(canRecordCourse(t,{...r,manual:true}));assert.ok(canRecordCourse(t,{...r,attempted:true,matched:1,total:1}));
});
test('criança sozinha: entrar um pouco atrasado, soltar antes e um quadro de ar no meio não reprovam',()=>{
 const notes=[{midi:71,beats:2},{midi:null,beats:2}];
 const hz=targetFrequencyFor(courseNote(71)),real=[];
 for(let at=0;at<4000;at+=90)real.push({at,frequency:at<280?null:at<1750?(at>900&&at<1000?NaN:hz):null});
 assert.deepEqual(evaluateCourse(notes,'4/4',real,60,0).map(v=>v.passed),[true,true]);
 const octave=real.map(s=>Number.isFinite(s.frequency)&&s.frequency?{...s,frequency:s.frequency*2}:s);
 assert.equal(evaluateCourse(notes,'4/4',octave,60,0)[0].passed,false);
});
test('colcheias tocadas certo, com o atraso normal do microfone (~150 ms), passam; nota errada não',()=>{
 const notes=[{midi:71,beats:1},{midi:69,beats:.5},{midi:67,beats:.5},{midi:null,beats:1},{midi:71,beats:1}];
 const ev=courseScoreEvents(notes,'4/4'),q=1000,real=[];
 for(let at=0;at<4200;at+=90){const t=at-150;const e=ev.find(e=>t>=e.startBeat*q&&t<(e.startBeat+e.beats)*q-40);real.push({at,frequency:e?.note?targetFrequencyFor(e.note):null});}
 assert.deepEqual(evaluateCourse(notes,'4/4',real,60,0).map(v=>v.passed),[true,true,true,true,true]);
 const wrongEighth=real.map(s=>s.at>=1600&&s.at<2100?{...s,frequency:targetFrequencyFor(courseNote(64))}:s);
 assert.equal(evaluateCourse(notes,'4/4',wrongEighth,60,0)[2].passed,false);
});
