import test from 'node:test';
import assert from 'node:assert/strict';
import {DOMParser} from '@xmldom/xmldom';
import {parseMusicXml} from '../src/lib/musicxml.ts';
import {SCORE_LIBRARY,studyXml} from '../src/lib/scoreLibrary.ts';
const parse=xml=>new DOMParser({onError:(level,message)=>{if(level!=='warning')throw new Error(message);}}).parseFromString(xml,'application/xml');
const read=xml=>parseMusicXml(xml,parse);
test('todos os estudos originais são MusicXML válidos com compassos completos',()=>{
  for(const item of SCORE_LIBRARY){const s=read(item.xml);assert.ok(s.events.length);assert.equal(s.totalBeats,s.measures.length*4);assert.equal(s.instrumentId,'trumpet-bb');assert.equal(s.bpm,60);}
});
test('importação mantém nota escrita, pausa, oitava, duração e posição',()=>{
  const s=read(SCORE_LIBRARY[0].xml);assert.equal(s.events[0].note.writtenMidi,67);assert.equal(s.events[0].beats,2);assert.equal(s.events[1].kind,'rest');assert.equal(s.events[1].startBeat,2);assert.equal(s.events[2].measureIndex,1);
});
test('DOCTYPE externo comum é removido sem ser consultado',()=>{const s=read(SCORE_LIBRARY[0].xml.replace('<score-partwise','<!DOCTYPE score-partwise SYSTEM "https://example.invalid/no-fetch.dtd"><score-partwise'));assert.equal(s.xml.includes('DOCTYPE'),false);});
test('entidades, imagens e conteúdo externo não entram na biblioteca',()=>{
  assert.throws(()=>read('<!DOCTYPE x [<!ENTITY p SYSTEM "file:///private">]>'+SCORE_LIBRARY[0].xml),/entidades/);
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<work>','<credit-image source="https://example.invalid/x"/><work>')),/externo/);
});
test('polifonia, vozes múltiplas, quiálteras e múltiplas partes são recusadas',()=>{
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<note>','<note><chord/>')),/linha melódica/);
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<note>','<backup><duration>1</duration></backup><note>')),/linha melódica/);
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('</part></score-partwise>','</part><part id="P2"/></score-partwise>')),/única parte/);
});
test('duração incorreta, extensão inválida e transposição errada dão erro',()=>{
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<duration>8</duration>','<duration>4</duration>')),/tempos completos|figura/);
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<octave>4</octave>','<octave>3</octave>')),/Dó4/);
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<chromatic>-2</chromatic>','<chromatic>0</chromatic>')),/transposição/);
});
test('ligadura une durações sem criar uma segunda emissão',()=>{
  let xml=studyXml('Ligadura',[[['G',4]],[['G',4]]]);
  xml=xml.replace('<duration>16</duration>','<duration>16</duration><tie type="start"/>');
  const last=xml.lastIndexOf('<duration>16</duration>');xml=xml.slice(0,last)+xml.slice(last).replace('<duration>16</duration>','<duration>16</duration><tie type="stop"/>');
  const s=read(xml);assert.equal(s.events.length,1);assert.equal(s.events[0].beats,8);assert.equal(s.events[0].segments.length,2);
});
test('ligadura não fechada e XML malformado não são aceitos',()=>{assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<duration>8</duration>','<duration>8</duration><tie type="start"/>')));assert.throws(()=>read('<score-partwise><part>'));});
test('limites de tamanho, compasso e conteúdo são aplicados',()=>{assert.throws(()=>read(' '.repeat(512*1024+1)),/512 KB/);assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<beats>4</beats>','<beats>5</beats>')),/2\/4/);assert.throws(()=>read(studyXml('Silêncio',[[[null,4]]])),/pelo menos uma nota/);});
test('andamento é limitado à faixa de treino sem esconder o ajuste',()=>{const s=read(SCORE_LIBRARY[0].xml.replace('tempo="60"','tempo="180"'));assert.equal(s.bpm,120);assert.equal(s.warnings.length,1);});
test('figura escrita divergente e mudanças de andamento não são avaliadas silenciosamente',()=>{
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<type>half</type>','<type>quarter</type>')),/figura/);
  assert.throws(()=>read(SCORE_LIBRARY[0].xml.replace('<measure number="2">','<measure number="2"><direction><sound tempo="80"/></direction>')),/constante/);
  const lateTempo=SCORE_LIBRARY[0].xml.replace('<sound tempo="60"/>','').replace('</note>','</note><direction><sound tempo="80"/></direction>');
  assert.throws(()=>read(lateTempo),/constante/);
});
