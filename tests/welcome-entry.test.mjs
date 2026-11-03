import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ACCESS_LANGUAGE_KEY,ACCESS_LOCALES,ACCESS_COPY,readAccessLocale,saveAccessLocale,accessErrorMessage,accessTomCaption} from '../src/lib/accessLocale.ts';
import {WelcomePlayback,WelcomePageVisit} from '../src/lib/welcomePlayback.ts';

test('idiomas da entrada usam uma preferência própria e não tocam em contas ou curso',()=>{
 const data=new Map([['mis-music-lab-local-accounts-v1','contas'],['mis-music-lab-recorder-v1','checks']]);
 const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
 assert.equal(readAccessLocale(storage),'pt-BR');
 for(const locale of ACCESS_LOCALES){assert.equal(saveAccessLocale(locale,storage),true);assert.equal(readAccessLocale(storage),locale);}
 assert.equal(saveAccessLocale('fr',storage),false);assert.equal(data.get(ACCESS_LANGUAGE_KEY),'es');
 assert.equal(data.get('mis-music-lab-local-accounts-v1'),'contas');assert.equal(data.get('mis-music-lab-recorder-v1'),'checks');assert.equal(data.size,3);
});
test('preferência inválida ou armazenamento bloqueado conserva português sem impedir entrada',()=>{
 assert.equal(readAccessLocale({getItem:()=>'{broken'}),'pt-BR');
 assert.equal(readAccessLocale({getItem:()=>{throw Error('privacidade')}}),'pt-BR');
 assert.equal(saveAccessLocale('en',{getItem:()=>null,setItem:()=>{throw Error('quota')}}),false);
});
test('três idiomas cobrem todos os textos da entrada, campos, mensagens e objetos',()=>{
 const keys=Object.keys(ACCESS_COPY['pt-BR']).sort();
 for(const locale of ACCESS_LOCALES){assert.deepEqual(Object.keys(ACCESS_COPY[locale]).sort(),keys);assert.ok(Object.values(ACCESS_COPY[locale]).every(value=>typeof value==='string'&&value.length>0));}
 assert.match(ACCESS_COPY.en.localNote,/only in this browser/);assert.match(ACCESS_COPY.es.localNote,/solo en este navegador/);
 assert.equal(ACCESS_COPY.en.start,'Get started');assert.equal(ACCESS_COPY.es.start,'Empezar ahora');
});
test('erros reais da conta local são traduzidos sem alterar validação ou expor dados',()=>{
 const source=readFileSync(new URL('../src/lib/localAuth.ts',import.meta.url),'utf8');
 const messages=[...source.matchAll(/new Error\('([^']+)'\)/g)].map(match=>match[1]);
 assert.ok(messages.length>=13);
 for(const message of messages){
  assert.equal(accessErrorMessage(message,'pt-BR'),message);
  for(const locale of ['en','es']){const translated=accessErrorMessage(message,locale);assert.notEqual(translated,message);assert.notEqual(translated,ACCESS_COPY[locale].errorFallback,message);}
 }
 assert.equal(accessErrorMessage('erro inesperado','en'),ACCESS_COPY.en.errorFallback);
 assert.equal(accessErrorMessage('Usuário ou senha incorretos.','es'),'Usuario o contraseña incorrectos.');
});
test('Tom mantém aviso de privacidade localizado, inclusive durante espera',()=>{
 assert.equal(accessTomCaption({mood:'waiting',covered:true},'en'),"I'll wait without peeking!");
 assert.equal(accessTomCaption({mood:'listening',covered:true},'es'),'¡No voy a mirar!');
 assert.equal(accessTomCaption({mood:'success',covered:false},'pt-BR'),'Vamos nessa!');
});

function fixture(){
 const requests=[],states=[];
 const video={muted:false,currentTime:0,plays:0,pauses:0,play(){this.plays++;return new Promise((resolve,reject)=>requests.push({resolve,reject}));},pause(){this.pauses++;}};
 const playback=new WelcomePlayback(video,state=>states.push(state));
 return {video,playback,requests,states};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
test('animação toca muda uma vez e o fim permanece fixo ao ocultar e voltar à aba',async()=>{
 const f=fixture();f.playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(f.video.plays,1);assert.equal(f.video.muted,true);
 f.requests[0].resolve();await flush();assert.equal(f.states.at(-1),'playing');
 f.playback.ended();assert.equal(f.states.at(-1),'finished');
 f.playback.setEnvironment({reducedMotion:false,visible:false});f.playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(f.video.plays,1);assert.equal(f.states.at(-1),'finished');
});
test('movimento reduzido mantém imagem final mesmo se a preferência mudar depois',()=>{
 const f=fixture();f.playback.setEnvironment({reducedMotion:true,visible:true});assert.equal(f.video.plays,0);assert.equal(f.states.at(-1),'finished');
 f.playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(f.video.plays,0);
});
test('ocultar a aba pausa e voltar retoma da mesma posição antes de terminar',async()=>{
 const f=fixture();f.playback.setEnvironment({reducedMotion:false,visible:true});f.requests[0].resolve();await flush();f.video.currentTime=2;
 f.playback.setEnvironment({reducedMotion:false,visible:false});assert.equal(f.states.at(-1),'paused');
 f.playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(f.video.plays,2);assert.equal(f.video.currentTime,2);f.requests[1].resolve();await flush();
});
test('autoplay recusado conserva imagem final sem nova tentativa por visibilidade',async()=>{
 const f=fixture();f.playback.setEnvironment({reducedMotion:false,visible:true});f.requests[0].reject(Error('NotAllowed'));await flush();assert.equal(f.states.at(-1),'blocked');
 f.playback.setEnvironment({reducedMotion:false,visible:false});f.playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(f.video.plays,1);assert.equal(f.states.at(-1),'blocked');
});
test('voltar à entrada na mesma página conserva a pose; uma página nova pode animar',async()=>{
 const visit=new WelcomePageVisit(),f=fixture();
 const playback=new WelcomePlayback(f.video,state=>visit.record(state));
 assert.equal(visit.hasPresented,false);playback.setEnvironment({reducedMotion:false,visible:true});
 assert.equal(visit.hasPresented,false);f.requests[0].resolve();await flush();assert.equal(visit.hasPresented,true);
 playback.destroy();assert.equal(visit.hasPresented,true);assert.equal(new WelcomePageVisit().hasPresented,false);
 for(const state of ['finished','blocked','failed']){const staticVisit=new WelcomePageVisit();staticVisit.record(state);assert.equal(staticVisit.hasPresented,true);}
});
test('montagem descartada antes de play não consome a animação, inclusive em StrictMode',async()=>{
 const visit=new WelcomePageVisit(),f=fixture();
 const playback=new WelcomePlayback(f.video,state=>visit.record(state));
 playback.setEnvironment({reducedMotion:false,visible:true});playback.destroy();f.requests[0].resolve();await flush();
 assert.equal(visit.hasPresented,false);visit.record('waiting');visit.record('paused');assert.equal(visit.hasPresented,false);
});
test('play tardio não reativa vídeo após sair ou após preferência por imagem estática',async()=>{
 for(const mode of ['destroy','reduce']){
  const f=fixture();f.playback.setEnvironment({reducedMotion:false,visible:true});
  if(mode==='destroy')f.playback.destroy();else f.playback.setEnvironment({reducedMotion:true,visible:true});
  const before=[...f.states];f.requests[0].resolve();await flush();assert.deepEqual(f.states,before);assert.ok(f.video.pauses>=2);
 }
});
test('uma promessa antiga não pausa reprodução mais nova; falha final não reinicia sozinha',async()=>{
 const f=fixture();f.playback.setEnvironment({reducedMotion:false,visible:true});f.playback.setEnvironment({reducedMotion:false,visible:false});f.playback.setEnvironment({reducedMotion:false,visible:true});
 const pauses=f.video.pauses;f.requests[0].resolve();await flush();assert.equal(f.video.pauses,pauses);f.requests[1].resolve();await flush();assert.equal(f.states.at(-1),'playing');
 f.playback.failed();assert.equal(f.states.at(-1),'failed');f.playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(f.video.plays,2);
});

test('com espera por dados, o filme só começa com o clipe inteiro carregado e nunca trava no meio',async()=>{
 const requests=[],states=[];
 const video={muted:false,plays:0,pauses:0,play(){this.plays++;return new Promise((resolve,reject)=>requests.push({resolve,reject}));},pause(){this.pauses++;}};
 const playback=new WelcomePlayback(video,state=>states.push(state),{waitForData:true});
 playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(video.plays,0);assert.deepEqual(states,[]);
 playback.loaded();assert.equal(video.plays,1);requests[0].resolve();await flush();assert.equal(states.at(-1),'playing');
 playback.loaded();assert.equal(video.plays,1);
});
test('carregamento lento assenta na pose final; aba oculta não desiste e filme iniciado não é cortado',async()=>{
 const make=()=>{const states=[],video={muted:false,plays:0,pauses:0,play(){this.plays++;return Promise.resolve();},pause(){this.pauses++;}};return {states,video,playback:new WelcomePlayback(video,state=>states.push(state),{waitForData:true})};};
 const slow=make();slow.playback.setEnvironment({reducedMotion:false,visible:true});slow.playback.skip();assert.equal(slow.states.at(-1),'finished');slow.playback.loaded();assert.equal(slow.video.plays,0);
 const hidden=make();hidden.playback.setEnvironment({reducedMotion:false,visible:false});hidden.playback.skip();assert.notEqual(hidden.states.at(-1),'finished');
 hidden.playback.loaded();hidden.playback.setEnvironment({reducedMotion:false,visible:true});assert.equal(hidden.video.plays,1);
 const started=make();started.playback.setEnvironment({reducedMotion:false,visible:true});started.playback.loaded();await flush();started.playback.skip();assert.equal(started.states.at(-1),'playing');
});
test('mídia v3 da entrada existe, pôsteres são quadros do próprio filme e originais foram preservados',()=>{
 const meta=JSON.parse(readFileSync(new URL('../public/branding/cactom/entrada/origens.json',import.meta.url),'utf8'));
 assert.equal(meta.video.file,'cactom-saindo-do-livro-v3.mp4');assert.equal(meta.video.fps,60);assert.equal(meta.video.audioTracks,0);
 assert.equal(meta.video.whiteLuma,235);assert.ok(!('cssWhiteCorrection' in meta.video));
 for(const file of ['cactom-saindo-do-livro-v1.mp4','cactom-saindo-do-livro-v2.mp4','cactom-saindo-do-livro-v3.mp4','turma-final-v3.jpg','inicio-livro-v3.jpg','sertao-musical-v1.png'])assert.ok(readFileSync(new URL('../public/branding/cactom/entrada/'+file,import.meta.url)).length>1000,file);
 const css=readFileSync(new URL('../src/components/welcome-ensemble.css',import.meta.url),'utf8');assert.doesNotMatch(css,/welcome-entry-video[^}]*filter|welcome-poster[^}]*filter/);
});
