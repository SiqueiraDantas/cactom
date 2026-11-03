import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {recorderLessons} from '../src/lib/recorder.ts';
import {availableInstrument} from '../src/lib/instruments.ts';
let server,MusicSymbol,MeteredBarLesson;
before(async()=>{
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 MusicSymbol=(await server.ssrLoadModule('/src/components/MusicSymbol.tsx')).MusicSymbol;
 MeteredBarLesson=(await server.ssrLoadModule('/src/components/MeteredBarLesson.tsx')).MeteredBarLesson;
});
after(async()=>{await server?.close();});
test('quarter, half, whole and rest symbols render as geometry without a music font',()=>{
 for(const figure of ['quarter','half','whole'])for(const rest of [false,true]){
  const html=renderToStaticMarkup(React.createElement(MusicSymbol,{figure,rest}));
  assert.match(html,/<svg/);assert.match(html,/<(?:path|ellipse)/);assert.match(html,/aria-hidden="true"/);
  assert.doesNotMatch(html,/<text|font-family|𝄽|𝅗𝅥|𝅝|♩/u);
 }
});
test('recorder 13 displays minimum, quarter rest and quarter note without missing glyph characters',()=>{
 const html=renderToStaticMarkup(React.createElement(MeteredBarLesson,{lesson:recorderLessons()[12],instrument:availableInstrument('recorder-soprano'),onComplete:()=>{},completed:false}));
 assert.equal((html.match(/class="music-symbol"/g)??[]).length,3);
 assert.doesNotMatch(html,/𝄽|𝅗𝅥|𝅝|♩/u);
 assert.match(html,/Tempos 1–2/);assert.match(html,/Tempo 3/);assert.match(html,/Tempo 4/);
 assert.match(html,/2 tempos/);assert.match(html,/Pausa/);assert.match(html,/Si 4/);assert.match(html,/Lá 4/);
});
