import type {LocalProfile} from './localAuth.ts';
import {ONBOARDING_KEY} from './onboarding.ts';

/**
 * Lembra a entrada neste navegador: quem já passou pelo começo (visitante que fez o tutorial, ou
 * conta local que entrou) volta direto para a tela geral ao atualizar a página.
 * Guarda só id, usuário e nome do perfil; nunca senha. “Sair da conta” / “Voltar à entrada” apaga.
 */
export const SESSION_KEY='cactom-sessao-v1';
export type SavedSession={mode:'demo';profile:null}|{mode:'local';profile:LocalProfile};
type Store=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
const store=():Store|undefined=>{try{return globalThis.localStorage;}catch{return undefined;}};

export function saveSession(session:SavedSession,storage:Store|undefined=store()){
 try{storage?.setItem(SESSION_KEY,JSON.stringify(session.mode==='local'?{mode:'local',profile:{id:session.profile.id,username:session.profile.username,name:session.profile.name}}:{mode:'demo',profile:null}));}catch{/* sem armazenamento */}
}
export function clearSession(storage:Store|undefined=store()){try{storage?.removeItem(SESSION_KEY);}catch{/* sem armazenamento */}}
export function readSession(storage:Store|undefined=store()):SavedSession|null{
 try{
  const raw=JSON.parse(storage?.getItem(SESSION_KEY)??'null');
  if(raw?.mode==='local'){const p=raw.profile;if(p&&typeof p.id==='string'&&typeof p.username==='string'&&typeof p.name==='string')return {mode:'local',profile:{id:p.id,username:p.username,name:p.name}};return null;}
  if(raw?.mode==='demo')return {mode:'demo',profile:null};
  // visitante antigo que já fez o tutorial, antes desta chave existir
  if(storage?.getItem(ONBOARDING_KEY))return {mode:'demo',profile:null};
 }catch{/* registro quebrado: começa pela entrada */}
 return null;
}
