import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import {parseMusicXml} from '../src/lib/musicxml.ts';
import {SCORE_LIBRARY,studyXml} from '../src/lib/scoreLibrary.ts';
import {assessScore,activeScoreEvent} from '../src/lib/scoreAssessment.ts';
import {targetFrequencyFor} from '../src/lib/music.ts';
const read=xml=>parseMusicXml(xml,x=>new DOMParser().parseFromString(x,'application/xml'));
const origin=10000;
function play(score,transform=(s)=>s){
  const result=[];
  for(let t=origin-450;t<=origin+score.totalBeats*1000+450;t+=90){
    const event=score.events[activeScoreEvent(score,(t-origin)/1000)];
    const sample={at:t,frequency:event?.note?targetFrequencyFor(event.note):null};result.push(transform(sample,event));
  }
  return result;
}
test('melodia com notas e pausas no andamento recebe checks reais',()=>{for(const item of SCORE_LIBRARY){const s=read(item.xml);assert.ok(assessScore(s,play(s),60,origin).every(v=>v.passed));}});
test('oitava errada e outra nota nunca são aprovadas',()=>{const s=read(SCORE_LIBRARY[0].xml);const result=assessScore(s,play(s,a=>({...a,frequency:a.frequency===null?null:a.frequency*2})),60,origin);assert.equal(result[0].passed,false);assert.equal(result[0].reason,'note');});
test('silêncio não vira acerto de nota nem ausência de dados vira pausa',()=>{const s=read(SCORE_LIBRARY[0].xml);assert.equal(assessScore(s,play(s,a=>({...a,frequency:null})),60,origin)[0].passed,false);assert.ok(assessScore(s,[],60,origin).every(v=>!v.passed));});
test('ruído na pausa e perda de frames não recebem check',()=>{const s=read(SCORE_LIBRARY[0].xml);const noisy=play(s,a=>({...a,frequency:a.frequency??349.23}));assert.equal(assessScore(s,noisy,60,origin)[1].passed,false);const gaps=play(s).filter(a=>a.at<12200||a.at>13500);assert.equal(assessScore(s,gaps,60,origin)[1].passed,false);});
test('um único som prolongado não aprova notas repetidas',()=>{const s=read(studyXml('Repetidas',[[['G',1],['G',1],['G',1],['G',1]]]));assert.ok(assessScore(s,play(s),60,origin).every(v=>!v.passed));});
test('notas repetidas com soltura audível entre emissões são independentes',()=>{const s=read(studyXml('Repetidas',[[['G',1],['G',1],['G',1],['G',1]]]));const data=play(s,a=>{const beat=(a.at-origin)/1000,phase=beat-Math.floor(beat);return {...a,frequency:beat>=0&&beat<4&&phase<.12?null:a.frequency};});assert.ok(assessScore(s,data,60,origin).every(v=>v.passed));});
test('interrupção central não soma sopros separados',()=>{const s=read(SCORE_LIBRARY[0].xml);const data=play(s,a=>({...a,frequency:a.at>10700&&a.at<11200?null:a.frequency}));assert.equal(assessScore(s,data,60,origin)[0].passed,false);});
test('entrada muito atrasada e afinação fora da tolerância não aprovam',()=>{const s=read(SCORE_LIBRARY[0].xml);const late=play(s).map(a=>({...a,at:a.at+400}));assert.equal(assessScore(s,late,60,origin)[0].passed,false);const sharp=play(s,a=>({...a,frequency:a.frequency===null?null:a.frequency*2**(65/1200)}));assert.equal(assessScore(s,sharp,60,origin)[0].reason,'tuning');});
