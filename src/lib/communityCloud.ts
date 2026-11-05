import {cloud,profileToken} from './cloud.ts';
import type {CommunityMessage} from './community.ts';

/**
 * Comunidade online (Supabase, supabase/cactom-comunidade.sql).
 * Tudo passa por funções do banco que conferem o token secreto do perfil; ninguém lê as tabelas direto.
 * A autorização do responsável fica registrada no servidor e lembrada neste aparelho.
 */
type Store=Pick<Storage,'getItem'|'setItem'>;
export type ChatProfile={id:string;name:string};
const CONSENT_KEY='cactom-chat-autorizado';
export type JoinResult='ok'|'responsavel'|'outro-aparelho'|'bloqueado'|'invalido'|'offline';

export function chatConsented(store:Store){try{return store.getItem(CONSENT_KEY)==='1';}catch{return false;}}

/** Entra no chat. Na primeira vez precisa do nome e do ano de nascimento do responsável. */
export async function joinChat(profile:ChatProfile,instrument:string,store:Store,guardian?:{name:string;birthYear:number}):Promise<JoinResult>{
 const db=cloud(),token=profileToken(store);if(!db||!token)return 'offline';
 try{
  const {data,error}=await db.rpc('chat_entrar',{p_profile:profile.id,p_token:token,p_name:profile.name.trim().split(/\s+/)[0]||profile.name,p_instrument:instrument,p_responsavel:guardian?.name??null,p_ano_responsavel:guardian?.birthYear??null});
  if(error)return 'offline';
  const r=String(data) as JoinResult;
  if(r==='ok')try{store.setItem(CONSENT_KEY,'1');}catch{/* sem espaço */}
  return r;
 }catch{return 'offline';}
}

type Row={id:string;channel:string;profile_id:string;name:string;text:string;at:string};
const toMessage=(r:Row):CommunityMessage=>({id:r.id,channel:r.channel,authorId:r.profile_id,author:r.name,text:r.text,at:r.at});

export async function fetchChat(profile:ChatProfile,channel:string,store:Store,after?:string):Promise<CommunityMessage[]|null>{
 const db=cloud(),token=profileToken(store);if(!db||!token)return null;
 try{const {data,error}=await db.rpc('chat_mensagens_da_sala',{p_profile:profile.id,p_token:token,p_channel:channel,p_after:after??null});
  if(error||!Array.isArray(data))return null;return (data as Row[]).map(toMessage);}catch{return null;}
}

const REASON:Record<string,string>={
 telefone:'Ôxe, aqui não pode mandar telefone. Teus dados ficam guardados contigo, visse?',
 'e-mail':'Ôxe, aqui não pode mandar e-mail. Teus dados ficam guardados contigo, visse?',
 link:'Ôxe, aqui não pode mandar link.',
 'rede social':'Ôxe, aqui não pode mandar rede social. Teus dados ficam guardados contigo, visse?',
 'endereço':'Ôxe, aqui não pode mandar endereço. Teus dados ficam guardados contigo, visse?',
 palavra:'Vamos falar com carinho? Essa palavra não pode aqui.',
 rapido:'Calma, respira! Espera um pouquinho antes da próxima mensagem.',
 sala:'Essa sala não é da tua turma.',
 'sem-acesso':'Teu perfil ainda não entrou no chat.',
 vazia:'Escreve alguma coisa antes de mandar.',grande:'Mensagem grande demais.',
};
export async function sendChat(profile:ChatProfile,channel:string,text:string,store:Store):Promise<{ok:true;message:CommunityMessage}|{ok:false;reason:string}>{
 const db=cloud(),token=profileToken(store);if(!db||!token)return {ok:false,reason:'Sem conexão com o servidor.'};
 try{const {data,error}=await db.rpc('chat_enviar',{p_profile:profile.id,p_token:token,p_channel:channel,p_text:text});
  if(error||!data)return {ok:false,reason:'Sem internet agora. Tenta de novo daqui a pouco.'};
  const d=data as {ok:boolean;reason?:string;message?:Row};
  return d.ok&&d.message?{ok:true,message:toMessage(d.message)}:{ok:false,reason:REASON[d.reason??'']??'Não deu pra mandar essa mensagem.'};
 }catch{return {ok:false,reason:'Sem internet agora. Tenta de novo daqui a pouco.'};}
}

/** O botão Esconder também denuncia: com 3 denúncias a mensagem some pra todo mundo. */
export async function reportChat(profile:ChatProfile,messageId:string,store:Store){
 const db=cloud(),token=profileToken(store);if(!db||!token)return false;
 try{const {data,error}=await db.rpc('chat_denunciar',{p_profile:profile.id,p_token:token,p_message:messageId});return !error&&data===true;}catch{return false;}
}

/* ---------- Painel do desenvolvedor: moderação ---------- */
export type ModRow={id:string;channel:string;profile_id:string;name:string;text:string;at:string;hidden:boolean;reports:number};
export async function fetchModeration(days=14):Promise<ModRow[]>{
 const db=cloud();if(!db)return [];
 const {data,error}=await db.from('chat_mensagens').select('id,channel,profile_id,name,text,at,hidden,reports').gte('at',new Date(Date.now()-days*864e5).toISOString()).order('at',{ascending:false}).limit(500);
 if(error)throw new Error(error.code==='42P01'?'Rode o arquivo supabase/cactom-comunidade.sql no SQL Editor.':error.message);
 return (data??[]) as ModRow[];
}
export async function setHidden(id:string,hidden:boolean){const db=cloud();if(!db)return false;const {error}=await db.from('chat_mensagens').update({hidden}).eq('id',id);return !error;}
export async function deleteMessage(id:string){const db=cloud();if(!db)return false;const {error}=await db.from('chat_mensagens').delete().eq('id',id);return !error;}
export async function blockProfile(profileId:string){const db=cloud();if(!db)return false;const {error}=await db.from('chat_perfis').update({bloqueado:true}).eq('profile_id',profileId);if(!error)await db.from('chat_mensagens').update({hidden:true}).eq('profile_id',profileId);return !error;}
