import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const P=await import('../src/lib/pwa.ts');

test('manifesto do app instalável tem nome, cores, ícones comuns e maskable',()=>{
 const m=JSON.parse(readFileSync(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(m.short_name,'Cactom');assert.equal(m.display,'standalone');assert.equal(m.start_url.startsWith('/'),true);assert.equal(m.scope,'/');
 for(const size of ['192x192','512x512']){assert.ok(m.icons.some(i=>i.sizes===size&&i.purpose==='any'),size);assert.ok(m.icons.some(i=>i.sizes===size&&i.purpose==='maskable'),size+' maskable');}
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');assert.match(html,/rel="manifest" href="\/manifest.webmanifest"/);
});

test('service worker não guarda outros sites (Supabase) nem envios',()=>{
 const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
 assert.match(sw,/request\.method !== 'GET'/);assert.match(sw,/url\.origin !== self\.location\.origin/);assert.match(sw,/request\.mode === 'navigate'/);
});

test('instalação: iPhone no Safari ganha o passo a passo; aviso dispensado some por 14 dias',()=>{
 assert.equal(P.isIosSafari('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'),true);
 assert.equal(P.isIosSafari('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1'),false);
 assert.equal(P.isIosSafari('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'),false);
 const m=new Map(),s={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};
 assert.equal(P.installDismissed(s),false);P.dismissInstall(s);assert.equal(P.installDismissed(s),true);
 m.set('cactom-instalar-dispensado',String(Date.now()-15*864e5));assert.equal(P.installDismissed(s),false);
});
