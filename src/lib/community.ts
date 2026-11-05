/**
 * Comunidade do Cactom: salas por instrumento e uma sala geral.
 * Pensada para crianças: só salas públicas (sem conversa privada), mensagens curtas, bloqueio de
 * dados pessoais (telefone, e-mail, endereço, redes, links) e de palavrões, e botão para esconder/denunciar.
 *
 * Transporte: `CommunityTransport`. Hoje existe só o local (`localCommunity`): as mensagens ficam neste
 * navegador e passam entre abas abertas. Para virar chat online, basta trocar por um transporte
 * ligado a um servidor (com moderação), mantendo a mesma interface.
 */
export type CommunityChannel={id:string;name:string;instrument?:string;topic:string};
export const COMMUNITY_CHANNELS:CommunityChannel[]=[
 {id:'geral',name:'Geral do Cactom',topic:'Papo sobre música e sobre o app.'},
 {id:'recorder-soprano',name:'Flauta doce',instrument:'recorder-soprano',topic:'Dúvidas, dicas e conquistas da flauta.'},
 {id:'trumpet-bb',name:'Trompete',instrument:'trumpet-bb',topic:'Embocadura, pistos e primeiros sons.'},
 {id:'clarinet-bb',name:'Clarinete',instrument:'clarinet-bb',topic:'Palheta, dedilhados e respiração.'},
];
/** Salas que a criança vê: a Geral e a do curso que ela escolheu (a turma dela). */
export function roomsFor(instrumentId:string):CommunityChannel[]{return COMMUNITY_CHANNELS.filter(c=>c.id==='geral'||c.id===instrumentId);}
/** Figurinhas do Tom (mandadas como texto curto e mostradas grandes no chat). */
export const STICKERS=['tom-feliz','tom-comemorando','tom-surpreso','tom-pensativo','tom-animado','tom-orgulhoso'] as const;
export type Sticker=(typeof STICKERS)[number];
export const STICKER_LABEL:Record<Sticker,string>={'tom-feliz':'Tom feliz','tom-comemorando':'Tom comemorando','tom-surpreso':'Tom surpreso','tom-pensativo':'Tom pensando','tom-animado':'Tom animado','tom-orgulhoso':'Tom orgulhoso'};
export function stickerOf(text:string):Sticker|null{const m=/^:(tom-[a-z]+):$/.exec(text.trim());return m&&(STICKERS as readonly string[]).includes(m[1])?m[1] as Sticker:null;}
export type CommunityMessage={id:string;channel:string;authorId:string;author:string;text:string;at:string;tom?:boolean};
export const MESSAGE_MAX=240;
export const QUICK_MESSAGES=['Bom dia, pessoal!','Consegui tocar uma nota nova!','Alguém tem dica pra respirar melhor?','Qual música vocês tão treinando?'];

const PERSONAL:[RegExp,string][]=[
 [/[\w.+-]+@[\w-]+\.[\w.]+/,'e-mail'],
 [/(https?:\/\/|www\.|\.com\b|\.br\b|\.net\b)/i,'link'],
 [/(^|\s)@\w{3,}/,'rede social'],
 [/\b(whats\s?app|zap|insta(gram)?|tik\s?tok|facebook|telegram|discord|snap(chat)?)\b/i,'rede social'],
 [/\b(endere[cç]o|moro na|moro no|minha rua|rua [a-zà-ú]|bairro|cep|minha escola [ée]|meu n[úu]mero|me chama no|onde (tu|voc[êe]) mora)\b/i,'endereço'],
];
const ROUGH=/\b(porra|caralho|merda|bosta|puta|put[ao]|fdp|vsf|vtnc|idiota|burr[oa]|ot[áa]ri[oa]|imbecil|cala a boca)\b/i;

export type MessageCheck={ok:true;text:string}|{ok:false;reason:string};
export function checkMessage(raw:string):MessageCheck{
 const text=raw.replace(/\s+/g,' ').trim();
 if(!text)return {ok:false,reason:'Escreve alguma coisa antes de mandar.'};
 if(text.length>MESSAGE_MAX)return {ok:false,reason:`Mensagem grande demais: até ${MESSAGE_MAX} letras.`};
 const phone=(text.match(/[\d\s().+-]{8,}/g)??[]).some(chunk=>chunk.replace(/\D/g,'').length>=8);
 const personal=phone?[null,'telefone'] as const:PERSONAL.find(([re])=>re.test(text));
 if(personal)return {ok:false,reason:`Ôxe, aqui não pode mandar ${personal[1]}. Teus dados ficam guardados contigo, visse?`};
 if(ROUGH.test(text))return {ok:false,reason:'Vamos falar com carinho? Essa palavra não pode aqui.'};
 return {ok:true,text};
}
export function tomWelcome(channel:CommunityChannel):CommunityMessage{
 return {id:'tom-'+channel.id,channel:channel.id,authorId:'tom',author:'Tom',tom:true,at:'',
  text:`Eita, bem-vindo à sala ${channel.name}! ${channel.topic} Regrinhas: fala com carinho, não manda telefone, endereço, rede social nem link, e se algo te incomodar, toca em “Esconder”.`};
}

export interface CommunityTransport{
 readonly online:boolean;
 history(channel:string):CommunityMessage[];
 send(message:Omit<CommunityMessage,'id'|'at'>):CommunityMessage;
 subscribe(listener:(message:CommunityMessage)=>void):()=>void;
}
const KEY='cactom-comunidade-v1',LIMIT=120;
type Store={version:1;messages:CommunityMessage[];hidden:string[]};
function read(storage:Storage|undefined):Store{try{const v=JSON.parse(storage?.getItem(KEY)??'null');if(v&&v.version===1&&Array.isArray(v.messages))return {version:1,messages:v.messages.filter(isMessage),hidden:Array.isArray(v.hidden)?v.hidden.filter((x:unknown)=>typeof x==='string'):[]};}catch{/* vazio */}return {version:1,messages:[],hidden:[]};}
function isMessage(m:unknown):m is CommunityMessage{const x=m as CommunityMessage;return !!x&&typeof x.id==='string'&&typeof x.channel==='string'&&typeof x.text==='string'&&typeof x.author==='string'&&typeof x.at==='string';}
function write(storage:Storage|undefined,store:Store){try{storage?.setItem(KEY,JSON.stringify(store));}catch{/* sem armazenamento */}}

/** Transporte local: guarda neste navegador e avisa as outras abas abertas. */
export function localCommunity(storage:Storage|undefined=globalThis.localStorage):CommunityTransport&{hidden():string[];hide(id:string):void}{
 const bus=typeof window!=='undefined'&&typeof BroadcastChannel!=='undefined'?new BroadcastChannel('cactom-comunidade'):null;
 return {
  online:false,
  history:channel=>read(storage).messages.filter(m=>m.channel===channel),
  send(message){
   const full:CommunityMessage={...message,id:`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,at:new Date().toISOString()};
   const store=read(storage);const mine=store.messages.filter(m=>m.channel===full.channel);
   const others=store.messages.filter(m=>m.channel!==full.channel);
   write(storage,{...store,messages:[...others,...[...mine,full].slice(-LIMIT)]});
   bus?.postMessage(full);return full;
  },
  subscribe(listener){if(!bus)return ()=>{};const on=(e:MessageEvent)=>{if(isMessage(e.data))listener(e.data);};bus.addEventListener('message',on);return ()=>bus.removeEventListener('message',on);},
  hidden:()=>read(storage).hidden,
  hide(id){const store=read(storage);if(!store.hidden.includes(id))write(storage,{...store,hidden:[...store.hidden,id]});},
 };
}
