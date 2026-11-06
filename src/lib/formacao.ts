import flauta from '../data/formacao-flauta-v2.json' with {type:'json'};
import trompete from '../data/formacao-trompete-v2.json' with {type:'json'};
import {createJourneyEngine,normalizeJourney,readJourney,writeJourney,lessonXp,type JourneyLedger,type JourneyStop,type LessonOutcome,type StopKind,type Evidence} from './recorderJourney.ts';
import {overviewOf,type JourneyOverview} from './journeyOverview.ts';
import type {KeyValueStorage} from './profileStorage.ts';
import {barBeats,type CourseNote,type CourseMeter} from './recorderFullCourse.ts';
import {makeKit,seeded,shuffle,bodySteps,NOTE_NAME,type BandExercise,type FormationSeed} from './bandTrail.ts';

/**
 * Formação em flauta doce e em trompete — “Do primeiro som à autonomia musical” (plano v2.0, nov/2026).
 * 4 níveis · 16 módulos · 80 sequências · 400 unidades · 2.000 microlições.
 * Cada unidade (U001–U400) é uma parada da trilha; cada parada tem as 5 microlições do plano:
 * Retomar e ouvir · Descobrir · Praticar · Aplicar · Demonstrar. As telas de cada microlição seguem o
 * tipo da unidade (técnica, escuta, leitura, criação…) e usam só as notas que o plano já apresentou.
 * Os textos de objetivo, prática e evidência vêm do plano; nada de resultado ou nota é inventado.
 */
export type FormationCourse='recorder-soprano'|'trumpet-bb';
export const FORMATION_COURSES:readonly FormationCourse[]=['recorder-soprano','trumpet-bb'];
export const isFormation=(id:string):id is FormationCourse=>id==='recorder-soprano'||id==='trumpet-bb';
type RawUnit={code:string;number:number;objective:string;type:string;checkpoint:boolean;review:string[]};
type RawPlan={id:string;title:string;reference:string;status:string;note?:string;microLessons:{number:number;id:string;name:string;goal:string}[];types:Record<string,{label:string;pratica:string;evidencia:string}>;
 levels:{id:string;title:string;minutesPerMicroLesson:number;modules:{id:string;number:number;title:string;sequences:{id:string;number:number;title:string;units:RawUnit[]}[]}[]}[]};
const PLANS:Record<FormationCourse,RawPlan>={'recorder-soprano':flauta as RawPlan,'trumpet-bb':trompete as RawPlan};
const PREFIX:Record<FormationCourse,string>={'recorder-soprano':'FLA','trumpet-bb':'TPT'};
export const formationPlan=(i:FormationCourse)=>PLANS[i];
export const MICRO_NAMES=['Retomar e ouvir','Descobrir','Praticar','Aplicar','Demonstrar'] as const;
export const LEVEL_TITLES=['Iniciação','Básico','Intermediário','Avançado'] as const;

export type FormationUnit=RawUnit&{stopId:string;module:number;moduleTitle:string;sequence:number;sequenceTitle:string;level:number;levelTitle:string;minutes:number;typeLabel:string;pratica:string;evidencia:string};
const KIND:Record<string,StopKind>={'cuidado':'descoberta','escuta':'descoberta','sem-emissao':'descoberta','tecnica':'pratica','emissao':'pratica','leitura':'pratica','conjunto':'criacao','criacao':'criacao','registro':'criacao','demonstracao':'desafio'};

export type FormationModule={number:number;section:number;title:string;goal:string;stops:JourneyStop[];sequences:{number:number;title:string;stops:JourneyStop[]}[]};
function build(i:FormationCourse){
 const plan=PLANS[i],units:FormationUnit[]=[],stops:JourneyStop[]=[],modules:FormationModule[]=[];
 plan.levels.forEach((lv,L)=>{for(const mo of lv.modules){
  const mod:FormationModule={number:mo.number,section:L+1,title:`Módulo ${mo.number} · ${mo.sequences[0].units[0].code}–${mo.sequences[mo.sequences.length-1].units[4].code}`,goal:mo.title,stops:[],sequences:[]};
  for(const sq of mo.sequences){const seq={number:sq.number,title:sq.title,stops:[] as JourneyStop[]};
   for(const u of sq.units){
    const t=plan.types[u.type],stopId=`${PREFIX[i]}-${u.code}`;
    const unit:FormationUnit={...u,stopId,module:mo.number,moduleTitle:mo.title,sequence:sq.number,sequenceTitle:sq.title,level:L+1,levelTitle:lv.title,minutes:lv.minutesPerMicroLesson,typeLabel:t.label,pratica:t.pratica,evidencia:t.evidencia};
    const stop:JourneyStop={id:stopId,index:stops.length,unit:mo.number,section:L+1,kind:u.checkpoint?'desafio':KIND[u.type]??'pratica',label:u.code,lessonIds:MICRO_NAMES.map((_,k)=>`${stopId}-L${k+1}`),taskIds:[stopId],unitTitle:u.objective,unitGoal:u.objective,mission:sq.title};
    units.push(unit);stops.push(stop);mod.stops.push(stop);seq.stops.push(stop);
   }
   mod.sequences.push(seq);}
  modules.push(mod);
 }});
 const engine=createJourneyEngine(stops),lessonIds=new Set(stops.flatMap(s=>s.lessonIds)),stopIds=new Set(stops.map(s=>s.id)),byStop=new Map(units.map(u=>[u.stopId,u])),byCode=new Map(units.map(u=>[u.code,u]));
 return {stops,units:modules,engine,list:units,byStop,byCode,normalize:(v:unknown)=>normalizeJourney(v,id=>lessonIds.has(id),id=>stopIds.has(id))};
}
const JOURNEYS={'recorder-soprano':build('recorder-soprano'),'trumpet-bb':build('trumpet-bb')};
export const formationJourney=(i:FormationCourse)=>JOURNEYS[i];
export const formationUnits=(i:FormationCourse)=>JOURNEYS[i].list;
export const formationKey=(i:FormationCourse)=>i==='recorder-soprano'?'cactom-formacao-flauta-v2':'cactom-formacao-trompete-v2';
/** Unidade (U001–U400) de uma lição, parada ou código. */
export function formationUnit(i:FormationCourse,id:string):FormationUnit|undefined{
 const j=JOURNEYS[i],m=/^(?:[A-Z]{3}-)?(U\d{3})/.exec(id);return m?j.byCode.get(m[1]):undefined;
}
const microOf=(lessonId:string)=>{const m=/-L([1-5])$/.exec(lessonId);return m?Number(m[1]):0;};
export function formationLessonName(_i:FormationCourse,lessonId:string){const k=microOf(lessonId);return k?MICRO_NAMES[k-1]:'';}
export function formationLessonTasks(i:FormationCourse,lessonId:string):string[]{
 const u=formationUnit(i,lessonId),k=microOf(lessonId);if(!u||!k)return [];
 return [`${u.objective}.`,PLANS[i].microLessons[k-1].goal,k===5?`Evidência: ${u.evidencia}`:`Prática (${u.typeLabel.toLocaleLowerCase('pt-BR')}): ${u.pratica}`];
}

/* ---------- Notas que o plano já apresentou, por módulo e sequência ---------- */
/** Flauta (nota escrita, soprano barroca): si, lá, sol (M03) · dó e ré agudos (M05 S04) · fá, mi, ré, dó graves, fá♯, si♭ (M07). */
function poolFlute(mod:number,seq:number,n=999):number[]{
 if(mod<3)return [];
 if(mod===3)return seq===1?[71]:seq===2?[71,69]:[71,69,67];
 const base=[71,69,67];
 if(mod===4||(mod===5&&seq<4))return base;
 const high=[...base,72,74];if(mod<7)return high;
 if(mod===7){const out=[...high,65,64];if(seq>=2)out.push(62,60);if(seq>=4)out.push(66);if(seq>=5)out.push(70);return out;}
 const all=[...high,65,64,62,60,66,70];
 if(mod<9)return all;
 // 2º registro (M09): mi e fá agudos (S1), sol e lá agudos (S2), fá♯ agudo nas escalas (S4); dó♯ e mi♭ agudos (M10 S4)
 // cada nota aguda entra na unidade que a apresenta: mi (U162), fá (U163), sol (U166), lá (U167)
 const second=[...all,...(n>=162?[76]:[]),...(n>=163?[77]:[])];if(mod===9&&seq===1)return second;
 const upper=[...second,...(n>=166?[79]:[]),...(n>=167?[81]:[])];if(mod===9&&seq<4)return upper;
 const scales=[...upper,78];if(mod<10||(mod===10&&seq<4))return scales;
 return [...scales,73,75];
}
/** Trompete (nota escrita em si♭): sol (M03) · fá e mi (M03–M04) · ré e dó (M05) · lá, si e dó agudo (M06) · fá♯, si♭ e ré agudo (M07). */
function poolTrumpet(mod:number,seq:number):number[]{
 if(mod<3)return [];
 if(mod===3)return seq<3?[67]:[67,65];
 if(mod===4)return [67,65,64];
 if(mod===5)return [67,65,64,62,60];
 if(mod===6)return seq<2?[67,65,64,62,60]:[67,65,64,62,60,69,71,72];
 if(mod===7)return seq===1?[60,62,64,65,67,69,71,72]:[60,62,64,65,66,67,69,70,71,72,74];
 const base=[60,62,64,65,66,67,69,70,71,72,74];
 // região aguda acessível (M09 S5): mi e fá agudos; extensão (M13 em diante): fá♯ e sol agudos; lá agudo no fim do avançado (M15)
 if(mod<9||(mod===9&&seq<5))return base;
 const high=[...base,76,77];if(mod<13)return high;
 const ext=[...high,78,79];return mod<15?ext:[...ext,81];
}
export function formationPool(i:FormationCourse,u:Pick<FormationUnit,'module'|'sequence'>&{number?:number}){return i==='recorder-soprano'?poolFlute(u.module,u.sequence,u.number??999):poolTrumpet(u.module,u.sequence);}
/** Notas citadas no objetivo (“Localizar fá natural”, “Alternar si e lá”…), quando o instrumento já as tem. */
const w=(text:string)=>new RegExp(`(?<!\\p{L})(?:${text})(?!\\p{L})`,'u');
const WORDS:[RegExp,number][]=[[w('dó grave|dó e ré graves|ré e dó graves'),60],[w('ré grave|ré e dó'),62],[w('dó sustenido|dó♯'),73],[w('mi bemol|mi♭'),75],[w('fá sustenido|fá♯'),66],[w('si bemol|si♭'),70],[w('dó agudo|dó e ré agudos'),72],[w('ré agudo|dó e ré agudos'),74],[w('mi(?! bemol)'),64],[w('fá(?! sustenido)'),65],[w('sol(?! maior| menor)'),67],[w('lá(?! maior| menor)'),69],[w('si(?! bemol| maior| menor)'),71]];
export function focusNotes(objective:string,pool:readonly number[]):number[]{
 let text=objective.toLocaleLowerCase('pt-BR');const found:number[]=[];
 const add=(m:number)=>{if(pool.includes(m)&&!found.includes(m))found.push(m);};
 // “ré, mi e fá agudos”: só dó e ré agudos existem no app; as outras notas agudas (2º registro) não são trocadas pelas graves
 text=text.replace(/((?:(?:dó|ré|mi|fá|sol|lá|si)(?:,\s*|\s+e\s+))*(?:dó|ré|mi|fá|sol|lá|si))\s+agud[oa]s?/gu,(list:string)=>{const HIGH:Record<string,number>={'dó':72,'ré':74,'mi':76,'fá':77,'sol':79,'lá':81};for(const n of list.match(/dó|ré|mi|fá|sol|lá|si/gu)??[])if(HIGH[n])add(HIGH[n]);return ' ';});
 for(const [re,midi] of WORDS)if(re.test(text))add(midi);
 return found;
}

/* ---------- Dificuldade: cresce com o nível e o módulo ---------- */
/**
 * Iniciação: 1–2 compassos, semínimas e mínimas, graus vizinhos, ~60 bpm.
 * Básico: 2 compassos, colcheias (a partir de M06 S04), saltos pequenos, até ~76 bpm.
 * Intermediário: 3 compassos, pontuados, síncopes, 3/4 e 6/8, saltos maiores, até ~88 bpm.
 * Avançado: 4 compassos, todas as figuras, saltos amplos, leitura sem modelo, até ~100 bpm.
 */
export type Tier={rhythm:0|1|2|3;bars:number;bpm:number;leap:number};
export function tierOf(u:Pick<FormationUnit,'level'|'module'|'sequence'|'checkpoint'>):Tier{
 const m=u.module;
 const rhythm=(m<=5||(m===6&&u.sequence<4)?0:m<=9?1:m<=12?2:3) as Tier['rhythm'];
 const bars=m<=3?1:m<=4?2:u.level===2?2:u.level===3?3:4;
 return {rhythm,bars:bars+(u.checkpoint&&m>4?1:0),bpm:Math.min(104,52+m*3),leap:[1,2,3,5][rhythm]};
}
export function meterOf(u:Pick<FormationUnit,'module'|'sequence'|'number'|'objective'>):CourseMeter{
 const o=u.objective.toLocaleLowerCase('pt-BR');
 if(/composto|6\/8|seis por oito/.test(o)||(u.module===10&&u.sequence===3))return '6/8';
 if(/três tempos|ternári|valsa/.test(o))return '3/4';
 if(/dois tempos|binári/.test(o))return '2/4';
 if(u.module<=6)return '4/4';
 const k=u.number%(u.module>=10?3:2);return k===0?'4/4':k===1?'3/4':'6/8';
}
/** Células rítmicas por compasso (r = pausa). Cada nível acrescenta figuras novas às anteriores. */
const CELLS:Record<CourseMeter,string[][]>={
 '4/4':[['4','2 2','2 1 1','1 1 2','1 1 1 1','2 r1 1','1 1 r2'],['1 .5 .5 1 1','.5 .5 1 2','1 1 .5 .5 1','.5 .5 .5 .5 2','2 .5 .5 1'],['1.5 .5 1 1','1 1.5 .5 1','.5 1 .5 2','1.5 .5 2','r.5 .5 1 2'],['.5 .5 .5 .5 1 1','1.5 .5 1.5 .5','.5 1 1 1 .5','.5 .5 1.5 .5 1','r.5 .5 .5 .5 1 1']],
 '3/4':[['3','2 1','1 1 1','1 2','1 r1 1'],['1 .5 .5 1','.5 .5 1 1','2 .5 .5'],['1.5 .5 1','1 1.5 .5','.5 1 .5 1'],['.5 .5 .5 .5 1','1.5 .5 .5 .5']],
 '2/4':[['2','1 1','1 r1'],['.5 .5 1','1 .5 .5'],['1.5 .5','.5 1 .5'],['.5 .5 .5 .5']],
 '6/8':[['1.5 1.5','1 .5 1.5','3'],['1 .5 1 .5','.5 .5 .5 1.5'],['.5 .5 .5 1 .5','1.5 .5 .5 .5'],['.5 .5 .5 .5 .5 .5']],
};
const FINAL:Record<CourseMeter,string[]>={'4/4':['4','2 2'],'3/4':['3','2 1'],'2/4':['2'],'6/8':['3','1.5 1.5']};
/** Melodia nova com as notas do aluno, no compasso e na dificuldade da unidade. */
export function melody(pool:readonly number[],focus:readonly number[],tier:Tier,meter:CourseMeter,rnd:()=>number,bars=tier.bars):CourseNote[]{
 const sorted=[...new Set(pool)].sort((a,b)=>a-b);if(!sorted.length)return [];
 const pick=<T,>(list:readonly T[])=>list[Math.floor(rnd()*list.length)];
 const start=focus.length?pick(focus):sorted[Math.floor(sorted.length/2)];
 let k=sorted.indexOf(start);const out:CourseNote[]=[];
 const step=()=>{if(sorted.length<2)return;let d=Math.round((rnd()*2-1)*tier.leap);if(d===0&&rnd()<.6)d=rnd()<.5?-1:1;k=Math.max(0,Math.min(sorted.length-1,k+d));};
 for(let b=0;b<bars;b++){
  const last=b===bars-1&&bars>1,levels=CELLS[meter].slice(0,tier.rhythm+1);
  const cell=last?pick(FINAL[meter]):pick(rnd()<.55?levels[levels.length-1]:pick(levels));
  const parts=cell.split(' ');
  parts.forEach((t,n)=>{const rest=t.startsWith('r'),beats=Number(rest?t.slice(1):t);
   if(rest&&(b>0||n>0)){out.push({midi:null,beats});return;}
   if(out.length)step();
   const isLast=last&&n===parts.length-1;out.push({midi:isLast&&focus.length?focus[0]:sorted[k],beats});});
 }
 if(focus.length&&!out.some(n=>n.midi!==null&&focus.includes(n.midi))){const first=out.find(n=>n.midi!==null);if(first)first.midi=focus[0];}
 return out;
}

/** Tipos em que a unidade pede tocar o instrumento. */
const PLAYS=new Set(['tecnica','emissao','leitura','conjunto','demonstracao','criacao']);
const sentenceList=(text:string)=>text.replace(/\.$/,'').split(/,\s+|;\s+|\s+e\s+(?=(?:então\s+)?[a-zà-ú]+(?:ar|er|ir|or)\b)/).map(s=>s.trim()).filter(Boolean).map(s=>s.charAt(0).toLocaleUpperCase('pt-BR')+s.slice(1));
const lower=(t:string)=>t.charAt(0).toLocaleLowerCase('pt-BR')+t.slice(1);

/** Primeira unidade em que o plano pede tocar o instrumento com uma nota definida (recebe postura, ar, boca e mãos). */
const FIRST=new Map<FormationCourse,string>();
function firstPlaying(i:FormationCourse){if(!FIRST.has(i))FIRST.set(i,JOURNEYS[i].list.find(u=>formationPool(i,u).length>0&&PLAYS.has(u.type))?.code??'');return FIRST.get(i)!;}
const cache=new Map<string,BandExercise[]>();
/** Telas de uma microlição (lessonId = FLA-U037-L3). */
export function formationExercises(i:FormationCourse,lessonId:string):BandExercise[]{
 const key=i+lessonId;if(cache.has(key))return cache.get(key)!;
 const out=buildExercises(i,lessonId);cache.set(key,out);return out;
}
const LEVEL_WORD=['','Iniciação','Básico','Intermediário','Avançado'];
/* ---------- Assunto de cada unidade (pelo objetivo do livro) ---------- */
export type Topic='partes'|'cuidado'|'corpo'|'ar'|'som'|'pulso'|'afinacao'|'leitura'|'registro'|'criacao'|'conjunto'|'escuta'|'tocar';
const has=(o:string,re:RegExp)=>re.test(o);
/**
 * O tipo do livro às vezes não combina com o objetivo (o próprio livro aponta U068, U121, U124, U187, U204 e U301
 * como “conjunto” sem serem; U248 e U389 como “criação” sendo tarefas escritas). O assunto parte do objetivo.
 */
export function topicOf(u:Pick<FormationUnit,'objective'|'type'|'module'>,hasNotes:boolean):Topic{
 const o=u.objective.toLocaleLowerCase('pt-BR');
 const reg=/espaço (e o tempo )?de prática|planejar (a|o) (próxim|estudo)|plano (semanal|de)|planejar estudo|diário|objetivo|critério|portfólio|devolutiva|autoavali|\bficha|notas breves|descrever|\blistar|\bdefinir|curadoria|cronograma|rotina|\bmeta|registrar a|registro de|documenta|organizar o estudo|organizar a sessão|escolher (o|um|as|os) (repert|obra|peça|estudo)|justificar|relatório/;
 if(u.type==='registro'||(!['criacao','demonstracao','escuta'].includes(u.type)&&!has(o,/^(tocar|executar)/)&&has(o,reg))||has(o,/descrever um problema|escrever notas breves/))return 'registro';
 if(has(o,/afina|afinador|bomba geral|acima ou abaixo da refer|uníssono|referência auditiva/))return hasNotes?'afinacao':'som';
 if(has(o,/partes d[aoe] (flauta|trompete|instrumento)|bocal, tubo|campana|pistões e as bombas|frente, verso|conhecer as bombas|tipos de surdina|localizar os três/))return 'partes';
 if(!hasNotes&&has(o,/respira|inspir|soltar o ar|\bo ar\b|fôlego|expira/))return 'ar';
 if(!hasNotes&&has(o,/postura|\bmãos?\b|apoio|corpo|ombro|tensão|pescoço|rosto|segurar|sentado|em pé|polpa do dedo|cobrir um orifício|sem rigidez|apoiar|dedos|pistão|pistões/))return 'corpo';
 if((u.type==='cuidado'&&!hasNotes)||has(o,/guardar|\bguarda\b|higien|estojo|manuten|chave de água|encaixar|\bmontar o|desmontar|instalar e retirar|descansar o instrumento|limpar|retirar o bocal/))return 'cuidado';
 if(!hasNotes&&has(o,/puls|palmas|caminhar|contagem|\beco\b|ao sinal|a um sinal|sinal combinado|\bparar\b|anteci|longos e curtos|som e silêncio|sequência de som/))return 'pulso';
 if(!hasNotes)return 'som';
 if(u.type==='escuta'||has(o,/^ouvir|^reconhecer|^comparar|^distinguir|^perceber/))return 'escuta';
 if(u.type==='criacao'||has(o,/^criar|improvis|compor|composiç|arranjo|^variar|^escrever uma (melodia|frase|segunda|pequena)/))return 'criacao';
 if(u.type==='conjunto'&&has(o,/colega|parceir|\bo grupo\b|em grupo\b|acompanhamento|dueto|(?<!dedos )em conjunto|de conjunto|trio|quarteto|regente|outra voz|o outro|ensaio|câmara|\bbase\b|instrumento em dó|professor|metais|uníssono/))return 'conjunto';
 if((u.type==='leitura'&&!has(o,/tocar|executar/))||has(o,/pauta|clave|\bler\b|leitura|linhas|armadura|barras? de compasso|anacruse|símbolo|primeira vista/))return 'leitura';
 return 'tocar';
}
type Q={prompt:string;options:string[];answer:number;hint:string};
/** Perguntas factuais sobre o instrumento e o cuidado com ele (respostas de manual, sem invenção). */
const PARTS:Record<FormationCourse,Q[]>={
 'recorder-soprano':[
  {prompt:'Por onde o ar entra na flauta doce?',options:['Pelo bocal, a ponta que vai nos lábios','Pelo furo de trás','Pela ponta de baixo'],answer:0,hint:'O bocal fica entre os lábios, sem morder.'},
  {prompt:'Quantos furos a flauta soprano tem na frente?',options:['Sete','Três','Dez'],answer:0,hint:'Sete na frente e um atrás, do polegar.'},
  {prompt:'Quem tampa o furo de trás?',options:['O polegar da mão esquerda','O polegar da mão direita','Ninguém, ele fica sempre aberto'],answer:0,hint:'A mão esquerda fica em cima; o polegar dela tampa o furo de trás.'},
  {prompt:'Qual mão fica em cima, perto do bocal?',options:['A esquerda','A direita','Tanto faz'],answer:0,hint:'Esquerda em cima, direita embaixo.'},
  {prompt:'Na flauta de três partes, como se chamam as peças?',options:['Cabeça, corpo e pé','Bocal, pistão e campana','Boquilha, palheta e barrilete'],answer:0,hint:'Cabeça (com o bocal), corpo (com a maioria dos furos) e pé.'}],
 'trumpet-bb':[
  {prompt:'Em que parte do trompete a boca encosta?',options:['No bocal','Na campana','Nos pistões'],answer:0,hint:'O bocal é a peça redonda onde os lábios vibram.'},
  {prompt:'Quantos pistões tem o trompete?',options:['Três','Dois','Quatro'],answer:0,hint:'Pistões 1, 2 e 3; o 1 é o mais perto de ti.'},
  {prompt:'Por onde o som sai do trompete?',options:['Pela campana','Pelo bocal','Pela chave de água'],answer:0,hint:'A campana é a boca larga na ponta do tubo.'},
  {prompt:'Para que serve a chave de água?',options:['Tirar a água que junta dentro do tubo','Deixar o som mais forte','Trocar a nota'],answer:0,hint:'Com o tempo o sopro junta água; a chave deixa ela sair.'},
  {prompt:'Para que serve a bomba geral de afinação?',options:['Ajustar a afinação do instrumento inteiro','Guardar o bocal','Deixar o pistão mais leve'],answer:0,hint:'Puxar a bomba deixa o som um pouco mais grave; empurrar, mais agudo.'},
  {prompt:'Onde se encaixa a surdina?',options:['Na campana','No bocal','Entre os pistões'],answer:0,hint:'A surdina entra na campana e muda o timbre e o volume.'}]};
const CARE:Record<FormationCourse,Q[]>={
 'recorder-soprano':[
  {prompt:'Depois de tocar, o que fazer com a flauta?',options:['Secar por dentro com a vareta e guardar no estojo','Deixar molhada em cima da mesa','Lavar com água quente e sabão forte'],answer:0,hint:'Flauta seca e guardada dura mais. Para lavar, siga o manual do fabricante.'},
  {prompt:'Como encaixar as partes da flauta?',options:['Girando devagar, sem forçar','Empurrando com força','Batendo de leve na mesa'],answer:0,hint:'Encaixe com cuidado, girando; se estiver duro, peça ajuda.'},
  {prompt:'Onde a flauta não deve ficar?',options:['No sol ou perto de calor','No estojo','Na mochila, dentro do estojo'],answer:0,hint:'Calor pode deformar a flauta.'},
  {prompt:'Ao segurar a flauta, os dedos devem…',options:['Apoiar sem apertar','Apertar o mais forte possível','Ficar esticados e duros'],answer:0,hint:'Mão solta: o dedo tampa o furo sem força.'}],
 'trumpet-bb':[
  {prompt:'Como colocar o bocal no trompete?',options:['Encaixar com um giro leve, sem bater','Bater com a mão pra prender bem','Rosquear com força'],answer:0,hint:'Bocal batido pode travar. Encaixe leve.'},
  {prompt:'Antes de guardar o trompete, o que fazer?',options:['Tirar a água pela chave de água e guardar no estojo','Guardar com água dentro','Deixar fora do estojo'],answer:0,hint:'Água parada no tubo estraga o instrumento.'},
  {prompt:'Um pistão começou a travar. O que fazer?',options:['Parar e pedir ajuda pra lubrificar ou fazer manutenção','Forçar até soltar','Tocar mais forte'],answer:0,hint:'Pistão travado se resolve com óleo próprio ou manutenção, nunca na força.'},
  {prompt:'Entre uma tentativa e outra, onde deixar o trompete?',options:['Deitado num lugar seguro ou no colo','Em pé na cadeira','Pendurado pela campana'],answer:0,hint:'Instrumento em pé cai fácil.'},
  {prompt:'Ao tirar uma bomba, o certo é…',options:['Puxar reto, com cuidado, apertando o pistão quando o manual pede','Puxar torto com força','Usar uma ferramenta pra arrancar'],answer:0,hint:'Algumas bombas só saem com o pistão apertado. Siga o manual.'}]};
const PLANQ:Q[]=[{prompt:'O que ajuda num lugar de estudo?',options:['Lugar calmo, com o instrumento e a partitura à mão','Televisão ligada do lado','Qualquer canto, com pressa'],answer:0,hint:'Calma e tudo à mão deixam o estudo render.'},{prompt:'Como dividir um estudo curto?',options:['Tentativas curtas com pausas entre elas','Tocar sem parar até cansar','Só ouvir, sem tocar nunca'],answer:0,hint:'Tentar, descansar e tentar de novo: assim o corpo aprende sem cansar.'},{prompt:'Antes de começar a estudar, o que decidir?',options:['Um objetivo pequeno pra hoje','Tocar tudo que existe','Nada, é só começar'],answer:0,hint:'Um objetivo claro mostra se o estudo deu certo.'}];
const EMB:Record<FormationCourse,Q[]>={'recorder-soprano':[{prompt:'Como soprar na flauta doce?',options:['Bem de leve, como quem diz “tu”','Com toda a força','Enchendo as bochechas'],answer:0,hint:'Pouco ar: a flauta soa com sopro calmo.'},{prompt:'O som saiu um apito agudo e forte. O que fazer?',options:['Soprar menos','Soprar mais forte','Morder o bocal'],answer:0,hint:'Apito é sinal de ar demais.'},{prompt:'Onde ficam os lábios?',options:['Encostados de leve no bocal, sem morder','Mordendo o bocal com os dentes','Longe do bocal'],answer:0,hint:'Os dentes não tocam a flauta.'}],
 'trumpet-bb':[{prompt:'Como nasce o som do trompete?',options:['Os lábios vibram dentro do bocal, como um zumbido','Os dedos batem nos pistões','O trompete toca sozinho'],answer:0,hint:'No trompete quem vibra são os lábios.'},{prompt:'Como encostar o bocal nos lábios?',options:['Encostar sem apertar','Apertar bem forte contra a boca','Morder o bocal'],answer:0,hint:'Pressão demais cansa e fecha o som.'},{prompt:'Como começar o som de forma leve?',options:['Com a língua, como quem diz “tu”','Com um soco de ar','Com a boca bem aberta'],answer:0,hint:'O “tu” dá um começo limpo, sem empurrar.'}]};
const BREATH:Q[]=[{prompt:'Ao puxar o ar pra tocar, o que deve encher?',options:['A barriga e as costelas, com os ombros soltos','Só as bochechas','Os ombros, levantando bem'],answer:0,hint:'Ombro levantado deixa o corpo tenso.'},{prompt:'Como soltar o ar ao tocar?',options:['Contínuo e calmo, como quem sopra uma vela sem apagar','De uma vez, com força','Aos pouquinhos, prendendo'],answer:0,hint:'Ar contínuo vira som estável.'}];
const POSTURE:Q[]=[{prompt:'Pra tocar sentado, como fica o corpo?',options:['Na ponta da cadeira, costas retas e ombros soltos','Encolhido, com os ombros levantados','Deitado no sofá'],answer:0,hint:'Costas retas e ombros soltos deixam o ar entrar fácil.'},{prompt:'Os dedos que não estão tocando ficam…',options:['Pertinho do lugar, prontos','Bem longe, esticados','Apertando o instrumento'],answer:0,hint:'Dedo perto chega rápido na próxima nota.'},{prompt:'O instrumento vem até a boca ou a boca vai até ele?',options:['O instrumento vem até a boca','A boca vai até o instrumento','Tanto faz'],answer:0,hint:'Cabeça reta; quem se move é o instrumento.'}];

function buildExercises(i:FormationCourse,lessonId:string):BandExercise[]{
 const u=formationUnit(i,lessonId),k=microOf(lessonId);if(!u||!k||!lessonId.startsWith(u.stopId+'-'))return [];
 const all=JOURNEYS[i].list,pool=formationPool(i,u),meter=meterOf(u),tier=tierOf(u),rnd=seeded(i+lessonId);
 const trumpet=i==='trumpet-bb',topic=topicOf(u,pool.length>0),noPlay=trumpet&&u.type==='sem-emissao';
 const focus=(()=>{const f=focusNotes(u.objective,pool);return f.length?f:pool.slice(-2);})();
 const target=focus.length?focus[Math.floor(rnd()*focus.length)]:(trumpet?67:71);
 const wide=[...new Set([...pool,...(i==='recorder-soprano'?poolFlute(16,1):poolTrumpet(16,1))])];
 const kit=makeKit(i,pool,rnd,meter,wide);
 const simple=meter==='6/8'||meter==='2/4'?'4/4':meter;
 const bpm=tier.bpm,slow=Math.max(48,bpm-14),goal=lower(u.objective);
 const tune=(bars=tier.bars)=>melody(pool,focus,tier,meter,rnd,bars);
 const out:BandExercise[]=[];let a=0;
 const push=(seed:FormationSeed,phase:BandExercise['phase']='descoberta')=>{a++;out.push({...seed,id:`${lessonId}-A${a}-P1`,taskId:`${lessonId}-A${a}`,phase} as BandExercise);};
 const level=`${LEVEL_WORD[u.level]} · ${u.typeLabel}`;
 const play=(notes:CourseNote[],speed:number,instruction:string,prompt:string,extra:Partial<FormationSeed>={}):FormationSeed=>({...kit.perform(notes,speed),meter,instruction,prompt:`${prompt} (${speed} bpm)`,...extra});
 const observe=(instruction:string,prompt:string,items:string[],done:string,evidence:Evidence[]=['pratica-declarada']):FormationSeed=>({kind:'observe',instruction,prompt,checklist:items,hint:prompt,correct:done,incorrect:'',evidence});
 const ask=(q:Q,instruction:string):FormationSeed=>{const order=shuffle(q.options.map((label,n)=>({label,n})),rnd);return {kind:'theory',instruction,prompt:q.prompt,options:order.map(o=>({label:o.label})),answer:order.findIndex(o=>o.n===q.answer),hint:q.hint,correct:`Isso! ${q.hint}`,incorrect:`Ainda não. ${q.hint}`,evidence:['leitura']};};
 let asked=0;const askFrom=(bank:Q[],instruction:string)=>ask(bank[(u.number+k*2+asked++)%bank.length],instruction);
 const readIn=(t:number):FormationSeed=>{if(pool.length<2)return kit.choose(t);const base=kit.read(t);if(pool.length>=3)return base;const list=shuffle([...pool],rnd);return {...base,options:list.map(x=>({label:NOTE_NAME[x],midi:x})),answer:list.indexOf(t)};};
 const ear=():FormationSeed=>pool.length>1?kit.listen(target):kit.longer(target);
 const where=(notes:CourseNote[],high:boolean):FormationSeed=>{const bar=barBeats(meter);let at=0;const pos=notes.map(n=>{const m=Math.floor((at+1e-6)/bar);at+=n.beats;return {n,m};}).filter(x=>x.n.midi!==null);
  const best=pos.reduce((b,x)=>(high?x.n.midi!>b.n.midi!:x.n.midi!<b.n.midi!)?x:b,pos[0]),bars=Math.max(1,Math.ceil(at/bar)),word=high?'aguda':'grave',ans=best.m;
  return {kind:'read',instruction:`A nota mais ${word}`,prompt:`Leia a partitura: em qual compasso aparece primeiro a nota mais ${word}?`,notes,meter,options:Array.from({length:bars},(_,n)=>({label:`${n+1}º compasso`})),answer:ans,hint:`A mais ${word} fica mais ${high?'em cima':'embaixo'} na pauta. As barras separam os compassos.`,correct:`Isso! Está no ${ans+1}º compasso.`,incorrect:`Está no ${ans+1}º compasso. Procure a nota mais ${high?'alta':'baixa'} na pauta.`,evidence:['leitura']};};
 /** Trompete em si♭: a nota escrita soa um tom abaixo. Usado nas unidades de escrita × som real e transposição. */
 const SOUND:Record<number,string>={56:'Lá♭ grave',57:'Lá grave',58:'Si♭ grave',59:'Si grave',61:'Ré♭',66:'Fá♯',68:'Lá♭',71:'Si',73:'Ré♭ agudo',74:'Ré agudo',60:'Dó',62:'Ré',63:'Mi♭',64:'Mi',65:'Fá',67:'Sol',69:'Lá',70:'Si♭',72:'Dó agudo'};
 const realQ=(t:number):FormationSeed=>{const real=t-2,list=shuffle([real,t,real-2,real+1,t+2].filter((x,n,arr)=>SOUND[x]&&arr.indexOf(x)===n).slice(0,3),rnd);return {kind:'read',target:undefined,instruction:'Escrito e som real',prompt:`No trompete em si♭, a nota escrita ${NOTE_NAME[t]} soa qual nota real?`,notes:[{midi:t,beats:4}],options:list.map(x=>({label:SOUND[x]})),answer:list.indexOf(real),hint:'No trompete em si♭, o som real fica um tom abaixo da nota escrita.',correct:`Isso! ${NOTE_NAME[t]} escrito soa ${SOUND[real]}.`,incorrect:`${NOTE_NAME[t]} escrito soa ${SOUND[real]}: um tom abaixo.`,evidence:['leitura']};};
 const transp=trumpet&&/som real|transp|instrumento em dó|parte em dó|altura real/.test(goal)&&SOUND[target-2]!==undefined;
 const readQ=(notes:CourseNote[])=>transp?realQ(target):pool.length>1&&tier.bars>1?where(notes,rnd()<.5):readIn(target);
 const PATTERNS=[[0,1,2,3],[0,2],[0,1,3],[0,2,3],[1,3],[0,3]];
 const pulse=(n:number):FormationSeed=>{const beats=PATTERNS[n%PATTERNS.length],full=beats.length===4;return {kind:'tap',instruction:full?'Sinta o pulso':'Som e silêncio',prompt:full?'Depois da contagem, toque o botão em cada um dos 4 pulsos.':`Conte 1-2-3-4 e toque o botão só no ${beats.map(b=>b+1).join(' e no ')}; nos outros tempos, silêncio.`,meter:'4/4',bpm:60,tapBeats:beats,tapLength:4,hint:'Toque junto com o clique, nem antes nem depois.',correct:'No pulso, arretado!',incorrect:'Os toques não bateram com o pulso. Escute o clique e tente de novo.',evidence:['medicao-automatica']};};
 const ref=u.review.map(c=>JOURNEYS[i].byCode.get(c)).filter((x):x is FormationUnit=>!!x);
 const refPlay=ref.find(r=>formationPool(i,r).length>0&&!['registro','cuidado','partes'].includes(topicOf(r,true)));
 const body=()=>{if(u.code===firstPlaying(i))bodySteps(i).forEach((b,n)=>out.push({kind:'observe',instruction:b.title,prompt:b.prompt,checklist:b.items,hint:b.prompt,correct:b.done,incorrect:'',evidence:['tentativa-fisica'],id:`${lessonId}-B${n+1}-P1`,taskId:`${lessonId}-B${n+1}`,phase:'apoio'} as BandExercise));};
 const meetFresh=()=>{const seen=new Set(all.filter(x=>x.number<u.number).flatMap(x=>formationPool(i,x)));for(const n of pool)if(!seen.has(n)){a++;out.push({...kit.meet(n),id:`${lessonId}-N${n}-P1`,taskId:`${lessonId}-N${n}`,phase:'apoio'} as BandExercise);}};
 const how=()=>observe(u.objective,`${level} · Como se faz:`,sentenceList(u.pratica),'Entendido. Agora é com tu.',['reflexao']);
 const steps=(title:string,items:string[],done='Feito!')=>observe(title,'Faça cada passo com calma e marque quando conseguir:',items,done);
 const show=()=>observe(u.checkpoint?`Checkpoint · ${u.moduleTitle}`:'Mostre que tu sabe',`Faça sozinho, do começo ao fim: ${goal}.`,['Fiz sem olhar as instruções','Fiz sem ninguém fazendo junto','Sei explicar o que fiz'],'Mostrado! Esta unidade volta na revisão para fixar.',['reflexao']);
 const retome=()=>{if(refPlay){const rp=formationPool(i,refPlay),rt=tierOf(refPlay),rm=meterOf(refPlay);push(play(melody(rp,focusNotes(refPlay.objective,rp),rt,rm,rnd,Math.max(1,rt.bars-1)),Math.max(48,rt.bpm),`Retome: ${lower(refPlay.objective)}`,`Da ${refPlay.code}. Ouça o exemplo e toque.`,{meter:rm}));}};

 /* --- Antes da primeira nota: instrumento, cuidado, corpo, ar, pulso e primeiros sons, sem microfone --- */
 if(!pool.length){
  const partsQ=()=>askFrom(PARTS[i],trumpet?'Conheça teu trompete':'Conheça tua flauta'),careQ=()=>askFrom(CARE[i],'Cuidar do instrumento'),postQ=()=>askFrom(POSTURE,'Corpo pronto'),airQ=()=>askFrom(BREATH,'O ar do músico');
  const rhythmic=topic==='pulso'||topic==='som';
  const embQ=()=>askFrom(EMB[i],'O primeiro som'),planQ=()=>askFrom(PLANQ,'Organizar o estudo');
  const q=topic==='partes'?partsQ:topic==='cuidado'?careQ:topic==='ar'?airQ:topic==='corpo'?postQ:topic==='registro'?planQ:topic==='som'?embQ:()=>({...kit.longer(target),instruction:'Som longo ou curto?'});
  const bs=bodySteps(i),stepFor=topic==='ar'?bs[1]:topic==='corpo'?(/mão|dedo|orifício|segurar|apoi/.test(goal)?bs[3]:bs[0]):topic==='som'?bs[2]:null;
  if(k===1){push(q());push(rhythmic?pulse(u.number):q());}
  else if(k===2&&topic==='registro'){push(how());push(observe('Teu registro','Anote no caderno ou no celular:',['Onde e quando tu vai estudar','Quanto tempo, com pausas','O que tu quer conseguir'],'Registro começado!',['reflexao']));}
  else if(k===2){push(how());push(stepFor?observe(stepFor.title,stepFor.prompt,stepFor.items,stepFor.done,['tentativa-fisica']):q());}
  else if(k===3){push(steps(`Pratique: ${goal}`,sentenceList(u.pratica)));if(rhythmic){push({...kit.longer(target),instruction:'Som longo ou curto?'});push(pulse(u.number+2));}else push(q());}
  else if(k===4){push(steps('Aplique agora',[`${u.objective}, sem olhar as instruções`,'Repita duas vezes do mesmo jeito','Descanse e confira o que melhorou']));push(rhythmic?pulse(u.number+3):q());}
  else{push(show());push(rhythmic?pulse(u.number+4):q());}
  return out;
 }

 const main=tune(),longer=tune(tier.bars+1);
 /* --- Registro, cuidado e instrumento com notas já aprendidas --- */
 if(topic==='registro'||topic==='cuidado'||topic==='partes'){
  const bank=topic==='partes'?PARTS[i]:CARE[i];
  if(k===1){retome();push(topic==='registro'?ear():askFrom(bank,'Lembra?'));if(!refPlay)push({...kit.contour(main,'Ouça o trecho do estudo de hoje'),meter,bpm});}
  else if(k===2){push(how());push(topic==='registro'?observe('Teu registro','Anote no caderno ou no celular:',['Data e quanto tempo de estudo','O que tu quer melhorar hoje',`Como vai saber que deu certo: ${goal}`],'Registro começado!',['reflexao']):askFrom(bank,'Pra pensar'));}
  else if(k===3){push(steps(`Faça: ${goal}`,sentenceList(u.pratica)));push(play(main,slow,'Estudo do dia, devagar','Use este trecho no teu estudo. Ouça e toque.'));}
  else if(k===4){push(play(main,bpm,'Estudo do dia, no andamento','O mesmo trecho, agora no andamento. Anote o que melhorou.'));push(topic==='registro'?readQ(main):askFrom(bank,'Confira'));}
  else{push(observe(u.checkpoint?`Checkpoint · ${u.moduleTitle}`:'Mostre o resultado',`O que mostra que tu aprendeu: ${lower(u.evidencia)}`,sentenceList(u.evidencia),'Mostrado! Esta unidade volta na revisão.',['reflexao']));push(play(tune(),bpm,'Toque o trecho do estudo, sem modelo','Sem ouvir antes: mostre como ficou depois do estudo.',{noModel:true}),'aplicacao');}
  return out;
 }

 /* --- Unidades com notas: escuta, afinação, leitura, criação, conjunto e técnica --- */
 const focusText=`Foco: ${goal}.`;
 const pulseGoal=/puls|palmas|caminhar|contagem|\beco\b|anteci|entrada|compassos de espera/.test(goal);
 const high=i==='recorder-soprano'&&/registro superior|si e dó do registro/.test(goal);
 switch(k){
  case 1:{retome();if(pulseGoal)push(pulse(u.number));push(ear());push({...kit.contour(main,'Ouça o alvo desta unidade'),meter,bpm});break;}
  case 2:{body();meetFresh();push(how());
   if(high)push(observe('Atenção: notas além do app',`O microfone do Cactom confere as notas até o Lá agudo. Para ${goal}, siga a tabela de dedilhados e a orientação do professor; aqui tu treina o ar e a leitura com as notas que o app já conhece.`,['Conferi o dedilhado na tabela','Tentei com orientação, sem forçar o ar'],'Combinado!',['pratica-declarada']));
   if(topic==='escuta'||topic==='afinacao'){if(pool.length>1){const [x,y]=shuffle(pool,rnd);push(kit.higher(x,y));}else push(kit.same(target));}
   else if(transp)push(realQ(target));else if(topic==='leitura')push(readIn(target));else push(kit.choose(target));
   push({...kit.rhythm(main,slow),meter});
   if(tier.rhythm>=1&&tier.bars>1&&pool.length>1)push(where(main,rnd()<.5));
   break;}
  case 3:{
   if(noPlay){push(steps(`Sem tocar: ${goal}`,sentenceList(u.pratica),'Feito, sem cansar a boca.'));push({...kit.rhythm(main,slow),meter});push(kit.choose(target));break;}
   if(topic==='escuta'||topic==='afinacao'){push(pool.length>1?kit.listen(target):kit.longer(target));if(pool.length>1)push(kit.higher(...(shuffle(pool,rnd).slice(0,2) as [number,number])));else push(kit.same(target));push({...kit.contour(tune(),'Ouça e compare'),meter,bpm});if(topic==='afinacao')push(play([{midi:target,beats:4},{midi:null,beats:4}],60,'Nota longa e estável','Toque a nota e mantenha o som parado, sem subir nem descer.',{meter:'4/4'}));else push(kit.dictation(simple));break;}
   if(topic==='criacao'){push(kit.create(simple));push(play(main,slow,'Toque uma ideia parecida','Uma ideia com as mesmas notas. Ouça e toque.'));push(kit.create(simple));break;}
   if(pulseGoal)push(pulse(u.number+1));
   push(kit.build(target));
   push(play(main,slow,'Devagar primeiro',`${focusText} Ouça, espere a contagem e toque.`));
   push(play(main,bpm,'Agora no andamento','O mesmo trecho, no andamento.'));
   if(tier.rhythm>=1)push(play(tune(),bpm,u.level>=3?'Variação, lendo sem ouvir antes':'Variação','O trecho mudou. Atenção às figuras.',{noModel:u.level>=3}));
   break;}
  case 4:{
   if(topic==='conjunto'){push(play(longer,bpm,'Toque junto com a outra voz',`${focusText} Ouça a outra voz e entre junto, sem correr.`,{duo:true}));push(play(tune(),bpm,'Outra parte, em dueto','Mantenha o pulso mesmo quando a outra voz mexe.',{duo:true}));}
   else if(topic==='criacao'){push(kit.create(simple));push(play(longer,bpm,'Uma frase mais longa no mesmo estilo','Toque e compare com a tua ideia.'));}
   else if(topic==='escuta'||topic==='afinacao'){push(kit.dictation(simple));push(play(main,bpm,'Toque o que tu ouviu','Ouça o exemplo e toque igual.'));}
   else if(topic==='leitura'){push(readQ(longer));push(play(longer,bpm,'Leia e toque, sem ouvir antes','Leia a partitura e toque.',{noModel:true}));}
   else{push(play(longer,bpm,`Frase de ${Math.ceil(longer.reduce((n,x)=>n+x.beats,0)/barBeats(meter))} compassos`,`${focusText} Ouça e toque.`));push(u.level>=2?play(tune(tier.bars+1),bpm+6,'Um pouco mais rápido','Mesmo cuidado, andamento maior.',{noModel:u.level>=4}):play(longer,bpm,'Agora sem ouvir antes','Tu já ouviu esse trecho. Toque lembrando dele.',{noModel:true}));}
   if(u.level>=3&&pool.length>1&&topic!=='leitura')push(where(longer,rnd()<.5));
   break;}
  default:{
   push(play(tune(),bpm,u.checkpoint?`Checkpoint · ${u.moduleTitle}`:'Demonstre sem modelo',`${focusText} Sem ouvir antes: leia a partitura e toque do começo ao fim.`,{noModel:true,duo:topic==='conjunto'}),'aplicacao');
   if(u.checkpoint||u.level>=3)push(play(tune(tier.bars+1),bpm,'Leitura à primeira vista','Trecho que tu nunca viu, sem exemplo.',{noModel:true}),'aplicacao');
   else push(readIn(target),'aplicacao');
   if(topic==='escuta')push(kit.dictation(simple),'aplicacao');else if(topic==='criacao')push(kit.create(simple),'aplicacao');
  }
 }
 return out;
}


/* ---------- Registro ---------- */
export function readFormation(storage:Pick<KeyValueStorage,'getItem'>,i:FormationCourse){return readJourney(storage,formationKey(i),JOURNEYS[i].normalize);}
/** Guarda o detalhe de cada tela só enquanto ele serve (unidade em andamento ou tela que volta na revisão), para o registro das 2.000 microlições caber no navegador. */
function compact(ledger:JourneyLedger):JourneyLedger{
 const done=new Set(Object.entries(ledger.stops).filter(([,p])=>p.completedAt).map(([id])=>id)),keep=new Set(ledger.reviewNeeded);
 const presentations:JourneyLedger['presentations']={};
 for(const [id,p] of Object.entries(ledger.presentations)){const stop=/^[A-Z]{3}-U\d{3}/.exec(id)?.[0];if(!stop||!done.has(stop)||keep.has(id))presentations[id]=p;}
 return {...ledger,presentations};
}
export function completeFormationLesson(storage:Pick<KeyValueStorage,'getItem'|'setItem'>,i:FormationCourse,outcome:LessonOutcome){
 const fresh=readFormation(storage,i),updated=compact(JOURNEYS[i].engine.completeLesson(fresh.ledger,outcome));
 let warning=fresh.warning;if(fresh.safeToWrite&&!writeJourney(storage,updated,formationKey(i)))warning='Teu avanço ficou nesta sessão, mas este navegador não deixou salvar.';
 return {ledger:updated,xp:lessonXp(outcome),warning};
}
export function formationOverview(storage:Pick<KeyValueStorage,'getItem'>,i:FormationCourse):JourneyOverview{const j=JOURNEYS[i];return overviewOf(readFormation(storage,i).ledger,j.engine,j.units);}
export type {CourseNote};
