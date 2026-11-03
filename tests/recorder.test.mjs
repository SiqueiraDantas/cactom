import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import {recorderNote,recorderLessons,RECORDER_NOTES,RECORDER_HOLES} from '../src/lib/recorder.ts';
import {targetFrequencyFor,evaluatePitch,midiToFrequency} from '../src/lib/music.ts';
import {checkReading} from '../src/lib/assessment.ts';
import {LESSONS,lessonCompleted} from '../src/lib/curriculum.ts';
import {courseFor,progressStorageKey} from '../src/lib/courses.ts';
import {scoreBar,barEvents,validBar} from '../src/lib/pulseAssessment.ts';
import {recommendPractice,reinforcementLesson,difficultyFor,validAttempt} from '../src/lib/adaptive.ts';
import {RECORDER_SCORE_LIBRARY,SCORE_LIBRARY,scoresForInstrument,studyXml} from '../src/lib/scoreLibrary.ts';
import {parseMusicXml} from '../src/lib/musicxml.ts';
import {assessScore} from '../src/lib/scoreAssessment.ts';
import {advanceVirtualProgress,freshVirtualProgress} from '../src/lib/virtualTrumpet.ts';
const parser=xml=>new DOMParser({onError:(level,message)=>{if(level!=='warning')throw new Error(message);}}).parseFromString(xml,'application/xml');
const read=xml=>parseMusicXml(xml,parser,'recorder-soprano');
const history=(id,instrumentId='recorder-soprano',passed=false,writtenMidi=71)=>({id:String(id),at:new Date(1792590000000+id*1000).toISOString(),instrumentId,lessonId:'recorder-primeiro-si',stepId:'rec-si-inicial',writtenMidi,passed,reason:passed?null:'wrong-note',durationMs:2000,task:'sound'});
test('soprano usa a oitava real correta sem herdar os dois semitons do trompete',()=>{
  assert.ok(Math.abs(targetFrequencyFor(recorderNote(60))-523.251)<.01);
  assert.ok(Math.abs(targetFrequencyFor(recorderNote(71))-987.767)<.01);
  assert.ok(Math.abs(targetFrequencyFor(recorderNote(74))-1174.659)<.01);
  for(const note of RECORDER_NOTES){assert.equal(evaluatePitch(targetFrequencyFor(note),note).correctNote,true);assert.equal(evaluatePitch(targetFrequencyFor(note)/2,note).correctNote,false);}
});
test('Si, Lá, Sol, Dó e Ré têm posições de flauta doce, incluindo o polegar',()=>{
  assert.deepEqual(recorderNote(71).holes,[0,1]);assert.deepEqual(recorderNote(69).holes,[0,1,2]);assert.deepEqual(recorderNote(67).holes,[0,1,2,3]);
  assert.deepEqual(recorderNote(72).holes,[0,2]);assert.deepEqual(recorderNote(74).holes,[2]);
  assert.deepEqual(recorderNote(60).holes,RECORDER_HOLES);assert.deepEqual(recorderNote(62).holes,[0,1,2,3,4,5,6]);
});
test('Fá respeita sistema barroco ou germânico sem mudar a frequência',()=>{
  assert.deepEqual(recorderNote(65,'baroque').holes,[0,1,2,3,4,6,7]);assert.deepEqual(recorderNote(65,'german').holes,[0,1,2,3,4]);
  assert.equal(targetFrequencyFor(recorderNote(65,'baroque')),targetFrequencyFor(recorderNote(65,'german')));
  const german=recorderLessons('german').flatMap(l=>l.steps).find(s=>s.note.writtenMidi===65);assert.deepEqual(german.note.holes,[0,1,2,3,4]);
});
test('notas fora da extensão inicial ou acidentes não são simulados como outra posição',()=>{for(const n of [59,61,73,75,NaN])assert.throws(()=>recorderNote(n));});
test('treze aulas próprias têm IDs únicos e nenhum check em comum com trompete',()=>{
  const lessons=recorderLessons();assert.equal(lessons.length,13);
  const ids=lessons.flatMap(l=>[l.id,...l.steps.map(s=>s.id)]);assert.equal(new Set(ids).size,ids.length);
  const trumpetIds=LESSONS.flatMap(l=>[l.id,...l.steps.map(s=>s.id)]);assert.ok(ids.every(id=>!trumpetIds.includes(id)));
  const c=courseFor('recorder-soprano');assert.deepEqual(c.units.flatMap(u=>c.lessons.slice(u.from,u.to)),c.lessons);
  assert.ok(lessons.slice(1).every(l=>l.steps.length>0&&l.goal&&l.concept&&l.teacherTip));
});
test('descoberta exige explorar oito furos e não recebe check por ter etapas vazias',()=>{
  const lesson=recorderLessons()[0];assert.equal(lessonCompleted(lesson,[],[]),false);assert.equal(lessonCompleted(lesson,[],[1,2,3,4,5,6,7]),false);assert.equal(lessonCompleted(lesson,[],RECORDER_HOLES),true);
  assert.equal(lessonCompleted(LESSONS[0],[],[1,2,3]),true);
});
test('armazenamento preserva a chave do trompete e separa o curso de flauta',()=>{
  assert.equal(progressStorageKey('trumpet-bb'),'mis-music-lab-v03');assert.notEqual(progressStorageKey('recorder-soprano'),progressStorageKey('trumpet-bb'));
  const data={[progressStorageKey('trumpet-bb')]:{passed:{'primeiro-sol':['sol-inicial']}}};data[progressStorageKey('recorder-soprano')]={passed:{'recorder-primeiro-si':['rec-si-inicial']}};
  assert.deepEqual(data['mis-music-lab-v03'].passed,{'primeiro-sol':['sol-inicial']});
});
test('avaliação aceita Si real da soprano, mas rejeita outra nota e oitava',()=>{
  const note=recorderNote(71),sample=frequency=>({frequency,clarity:.99,rms:.03,timestamp:100});
  assert.equal(checkReading(sample(targetFrequencyFor(note)),note,[],45,30).valid,true);
  assert.equal(checkReading(sample(targetFrequencyFor(note)/2),note,[],45,30).valid,false);
  assert.equal(checkReading(sample(midiToFrequency(81)),note,[],45,30).valid,false);
});
test('último compasso da flauta aceita Si, pausa e Lá no tempo correto',()=>{
  const lesson=recorderLessons().at(-1);assert.equal(validBar(lesson.steps),true);
  const events=barEvents(lesson.steps,60,10000),frames=[];
  for(let at=9600;at<14500;at+=90){const e=events.find(e=>at>=e.start&&at<e.end);frames.push({at,frequency:e&&e.step.kind!=='rest'?targetFrequencyFor(e.step.note):null});}
  assert.deepEqual(scoreBar(lesson.steps,frames,60,10000).map(r=>r.passed),[true,true,true]);
  const wrong=frames.map(s=>({...s,frequency:s.frequency?s.frequency/2:null}));assert.equal(scoreBar(lesson.steps,wrong,60,10000)[0].passed,false);
});
test('recomendações e dificuldade não misturam instrumentos',()=>{
  const trumpet=[history(1,'trumpet-bb',false,67),history(2,'trumpet-bb',false,67),history(3,'trumpet-bb',false,67)];
  assert.equal(recommendPractice(trumpet,Date.now(),'recorder-soprano'),null);
  const mixed=[...trumpet,history(4),history(5)];const rec=recommendPractice(mixed,Date.now(),'recorder-soprano');
  assert.equal(rec.noteMidi,71);assert.equal(rec.instrumentId,'recorder-soprano');assert.equal(difficultyFor(trumpet,'recorder-soprano'),'padrao');assert.equal(validAttempt(history(6)),true);
  assert.equal(validAttempt(history(7,'recorder-soprano',false,80)),false);
  assert.ok(reinforcementLesson(rec).steps.every(s=>s.note.transposeSemitones===12));
});
test('reforço de Fá conserva o sistema da flauta escolhido',()=>{
  const rec=recommendPractice([history(1,'recorder-soprano',false,65),history(2,'recorder-soprano',false,65)],Date.now(),'recorder-soprano');
  assert.ok(reinforcementLesson(rec,'german').steps.every(s=>s.note.holes.join()==='0,1,2,3,4'));
});
test('estudos de flauta e trompete permanecem em bibliotecas separadas',()=>{
  assert.equal(scoresForInstrument('recorder-soprano'),RECORDER_SCORE_LIBRARY);assert.equal(scoresForInstrument('trumpet-bb'),SCORE_LIBRARY);
  for(const item of RECORDER_SCORE_LIBRARY){const score=read(item.xml);assert.equal(score.instrumentId,'recorder-soprano');assert.ok(score.events.some(e=>e.kind==='rest'));assert.ok(score.events.filter(e=>e.note).every(e=>e.note.transposeSemitones===12));}
});
test('MusicXML da flauta não aceita a transposição do trompete',()=>{
  assert.throws(()=>read(SCORE_LIBRARY[0].xml),/oitava/);
  assert.throws(()=>parseMusicXml(RECORDER_SCORE_LIBRARY[0].xml,parser),/transposição/);
  const source=studyXml('Mesmas alturas',[[['G',4]]]);const untransposed=source.replace(/<transpose>.*?<\/transpose>/,'');
  assert.notEqual(read(untransposed).id,parseMusicXml(untransposed,parser).id);
});
test('melodia da flauta é avaliada na altura sonora e respeita pausas',()=>{
  const score=read(RECORDER_SCORE_LIBRARY[0].xml),frames=[];
  for(let at=-400;at<=score.totalBeats*1000+500;at+=90){const e=score.events.find(e=>at>=e.startBeat*1000&&at<(e.startBeat+e.beats)*1000);frames.push({at,frequency:e?.note?targetFrequencyFor(e.note):null});}
  assert.ok(assessScore(score,frames,60,0).every(r=>r.passed));
  assert.ok(assessScore(score,frames.map(s=>({...s,frequency:s.frequency?s.frequency/2:null})),60,0).some(r=>!r.passed));
});
test('exploração por toque reconhece o furo traseiro e exige continuidade',()=>{
  let p=freshVirtualProgress();for(let t=0;t<=1300;t+=90)p=advanceVirtualProgress(p,[1],recorderNote(71).holes,t,1200);assert.equal(p.completed,false);
  for(let t=1400;t<=2750;t+=90)p=advanceVirtualProgress(p,[0,1],recorderNote(71).holes,t,1200);assert.equal(p.completed,true);
});
