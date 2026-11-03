import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {INSTRUMENTS} from '../src/lib/instruments.ts';
let server,InstrumentPicker,CourseArtwork;
const noop=()=>{},demo={mode:'demo',profile:null};
before(async()=>{
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 InstrumentPicker=(await server.ssrLoadModule('/src/components/InstrumentPicker.tsx')).InstrumentPicker;
 CourseArtwork=(await server.ssrLoadModule('/src/components/CourseArtwork.tsx')).CourseArtwork;
});
after(async()=>{await server?.close();});
test('Explorar primeiro shows the same “Eu quero aprender…” screen as Começar agora',()=>{
 const html=renderToStaticMarkup(React.createElement(InstrumentPicker,{access:demo,onChoose:noop,onSignOut:noop}));
 assert.match(html,/class="access-page access-page--onboarding/);
 assert.match(html,/class="wsp"/);assert.match(html,/Eu quero aprender…/);
 assert.doesNotMatch(html,/onb-progress|onb-continue|picker-account|workshop-footer/);assert.doesNotMatch(html,/wsp-signin|>Entrar</);
});
test('only the four available courses are shown, each a single tap, with the current one highlighted',()=>{
 const html=renderToStaticMarkup(React.createElement(InstrumentPicker,{access:demo,onChoose:noop,onSignOut:noop,onCancel:noop,selectedId:'recorder-soprano'}));
 const cards=html.match(/<button[^>]*class="wsp-card[^"]*"[^>]*>/g)??[];
 assert.equal(cards.length,4);assert.ok(cards.every(tag=>!tag.includes('disabled=')));
 assert.match(html,/<button[^>]*class="wsp-card is-selected"[^>]*aria-label="Escolher Flauta doce"/);
 assert.doesNotMatch(html,/Saxofone|Trombone|Flauta transversal|Em breve/);
});
test('illustrated instruments have unique gradient references and use no photographic assets',()=>{
 const html=renderToStaticMarkup(React.createElement(React.Fragment,null,...INSTRUMENTS.map(item=>React.createElement(CourseArtwork,{key:item.id,instrument:item.id}))));
 assert.equal((html.match(/class="course-artwork"/g)??[]).length,7);
 const ids=[...html.matchAll(/ id="([^"]*)"/g)].map(match=>match[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const match of html.matchAll(/url\(#([^)]*)\)/g))assert.ok(ids.includes(match[1]));
 assert.doesNotMatch(html,/<image|<img|generated_images|\.png/);
});
