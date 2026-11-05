import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import {DOMParser} from '@xmldom/xmldom';
import {readScorePages,omrToMusicXml,omrSequence,omrMeasuresFix} from '../src/lib/scoreOmr.ts';
import {parseMusicXml} from '../src/lib/musicxml.ts';

function pgm(file){
 const b=zlib.gunzipSync(fs.readFileSync(new URL(file,import.meta.url)));let i=0;const f=[];
 while(f.length<4){while(b[i]<=0x20)i++;let s='';while(b[i]>0x20)s+=String.fromCharCode(b[i++]);f.push(s);}i++;
 return {width:+f[1],height:+f[2],data:b.subarray(i)};
}
const parser=x=>new DOMParser().parseFromString(x,'application/xml');
// "Brilha brilha estrelinha" (domínio público), gravada em PDF por um programa de partitura.
const C4=60,D4=62,E4=64,F4=65,G4=67,A4=69;
const WANT=[[C4,1],[C4,1],[G4,1],[G4,1],[A4,1],[A4,1],[G4,2],[F4,1],[F4,1],[E4,1],[E4,1],[D4,1],[D4,1],[C4,2],[G4,1],[G4,1],[F4,1],[F4,1],[E4,1],[E4,1],[D4,2],[G4,1],[G4,1],[F4,1],[F4,1],[E4,1],[E4,1],[D4,2]];

test('PDF de partitura: o leitor acha compasso, armadura, notas e durações',()=>{
 const r=readScorePages([pgm('./fixtures-brilha.pgm.gz')]);
 assert.equal(r.beats,4);assert.equal(r.fifths,0);assert.equal(r.measures.length,8);
 const got=omrSequence(omrMeasuresFix(r,4).measures).map(e=>[e.midi,e.beats]);
 assert.deepEqual(got,WANT);
});

test('PDF lido vira partitura de tocar igual às outras (flauta e trompete)',()=>{
 const r=readScorePages([pgm('./fixtures-brilha.pgm.gz')]);
 const flute=parseMusicXml(omrToMusicXml(r,{title:'Brilha',instrumentId:'recorder-soprano'}).xml,parser,'recorder-soprano');
 assert.deepEqual(flute.events.map(e=>[e.note?.writtenMidi??null,e.beats]),WANT);
 assert.equal(flute.events[0].note.transposeSemitones,12);
 const trumpet=parseMusicXml(omrToMusicXml(r,{title:'Brilha',instrumentId:'trumpet-bb'}).xml,parser,'trumpet-bb');
 assert.deepEqual(trumpet.events.map(e=>e.note?.writtenMidi??null),WANT.map(w=>w[0]));
 const trumpetC=parseMusicXml(omrToMusicXml(r,{instrumentId:'trumpet-bb'}).xml,parser,'trumpet-bb','baroque',0);
 assert.equal(trumpetC.events[0].note.transposeSemitones,0);
 const clarinet=parseMusicXml(omrToMusicXml(r,{instrumentId:'clarinet-bb'}).xml,parser,'clarinet-bb');
 assert.equal(clarinet.events[0].note.transposeSemitones,-2);
});

test('compasso e armadura ajustados na conferência entram na partitura',()=>{
 const r=readScorePages([pgm('./fixtures-brilha.pgm.gz')]);
 const xml=omrToMusicXml(r,{beats:4,fifths:1,instrumentId:'recorder-soprano'}).xml;
 assert.match(xml,/<fifths>1<\/fifths>/);
 // flauta: clave de Sol com 8 e altura real (1 oitava acima do escrito), sem transposição
 assert.match(xml,/<clef-octave-change>1<\/clef-octave-change>/);assert.doesNotMatch(xml,/<transpose>/);
});

test('página sem pauta dá aviso claro, sem inventar notas',()=>{
 const blank={width:800,height:600,data:new Uint8Array(800*600).fill(255)};
 assert.throws(()=>readScorePages([blank]),/pautas/);
});
