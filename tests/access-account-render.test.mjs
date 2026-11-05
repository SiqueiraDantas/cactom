import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {ACCESS_COPY,ACCESS_LOCALES} from '../src/lib/accessLocale.ts';
let server,AccountForm,WorkshopGrid;
const noop=()=>{},base={mode:'login',locale:'pt-BR',fields:{name:'',username:'',password:'',confirmation:''},busy:false,error:'',focus:'none',outcome:'idle',showPassword:false,onField:noop,onShowPassword:noop,onSubmit:noop,onFocus:noop,onInvalid:noop,onExplore:noop,onLocale:noop,onEditWorkshop:noop};
before(async()=>{
 server=await createServer({configFile:false,root:process.cwd(),logLevel:'error',server:{middlewareMode:true,hmr:false,watch:null}});
 AccountForm=(await server.ssrLoadModule('/src/components/AccountForm.tsx')).AccountForm;
 WorkshopGrid=(await server.ssrLoadModule('/src/components/WorkshopGrid.tsx')).WorkshopGrid;
});
after(async()=>{await server?.close();});
const renderForm=props=>renderToStaticMarkup(React.createElement(AccountForm,{...base,...props}));
test('login oferece apenas usuário e senha existentes, com rótulos e aviso de conta local',()=>{
 const html=renderForm({});assert.equal((html.match(/class="access-field /g)??[]).length,2);
 assert.match(html,/name="username"/);assert.match(html,/autoComplete="username"/i);assert.match(html,/type="password"/);assert.match(html,/current-password/);
 assert.match(html,/aria-describedby="access-local-note"/);assert.match(html,/somente neste navegador/);assert.match(html,/access-account-tom/);
 assert.doesNotMatch(html,/name="confirmation"|name="name"|type="email"|Google|Facebook|Apple|Esqueceu|access-stage-ring|access-holo-panel/);
});
test('cadastro conserva os quatro campos e validação; a oficina pode ser trocada',()=>{
 const html=renderForm({mode:'signup',workshopId:'recorder-soprano'});assert.equal((html.match(/class="access-field /g)??[]).length,4);
 assert.match(html,/name="confirmation"/);assert.match(html,/minLength="8"/i);assert.match(html,/maxLength="128"/i);assert.match(html,/nickname/);assert.match(html,/new-password/);
 assert.match(html,/Sua oficina/);assert.match(html,/Flauta doce/);assert.match(html,/>Trocar</);
 assert.doesNotMatch(html,/compartilhe|assinatura|type="email"/i);
});
test('erros e espera refletem o acesso real e bloqueiam ações durante o envio',()=>{
 const error=renderForm({locale:'es',error:'Usuário ou senha incorretos.',outcome:'error'});assert.match(error,/role="alert"/);assert.match(error,/Usuario o contraseña incorrectos/);assert.doesNotMatch(error,/¡Todo listo!/);
 const busy=renderForm({busy:true,outcome:'waiting'});assert.match(busy,/aria-busy="true"/);assert.match(busy,/Conferindo seu acesso/);
 for(const tag of busy.matchAll(/<(?:button|input|select)\b[^>]*>/g))assert.match(tag[0],/disabled=""/);
});
test('Tom mantém os olhos cobertos no campo de senha e ao mostrar senha',()=>{
 for(const props of [{focus:'password'},{showPassword:true}])assert.match(renderForm(props),/data-covered="true"/);
});
test('login, cadastro, idioma e oficina são traduzidos nos três idiomas',()=>{
 for(const locale of ACCESS_LOCALES){
  const html=renderForm({locale,mode:'signup',workshopId:'recorder-soprano'}),t=ACCESS_COPY[locale];
  for(const value of [t.signupTitle,t.nameLabel,t.confirmationLabel,t.yourWorkshop,t.changeWorkshop,t.localNote,t.recorder])assert.ok(html.includes(value));
  assert.equal((html.match(/<option /g)??[]).length,3);
 }
});
test('catálogo usa os três cursos liberados (regência bloqueada), sem selecionar por conta própria nem liberar os futuros',()=>{
 const html=renderToStaticMarkup(React.createElement(WorkshopGrid,{onSelect:noop}));
 const cards=html.match(/<button[^>]*class="instrument-card[^\"]*"[^>]*>/g)??[];
 assert.equal(cards.length,7);assert.equal(cards.filter(tag=>!tag.includes('disabled=')).length,3);assert.equal(cards.filter(tag=>tag.includes('aria-pressed="true"')).length,0);
 assert.match(html,/Em breve/);assert.doesNotMatch(html,/milhões|alunos|<img|<image/i);
});
