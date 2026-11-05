import {PLAN_MODULES,LESSON_NAMES,INSTRUMENT_WORD,poolUntil,lessonTasks,type PlanStyle,type PlanQuestion} from './bandPlan.ts';
import type {CourseNote,CourseMeter} from './recorderFullCourse.ts';
import type {KeyValueStorage} from './profileStorage.ts';
import {overviewOf,type JourneyOverview} from './journeyOverview.ts';
import {iniExercises,iniJourney,readIniJourney,completeIniLesson,iniOverview,iniLessonName,iniLessonTasks,iniName,type Clef} from './iniciacao.ts';
import {STOP_KINDS,type Evidence,createJourneyEngine,normalizeJourney,readJourney,writeJourney,emptyJourney,lessonXp,type JourneyStop,type JourneyLedger,type LessonOutcome} from './recorderJourney.ts';

/**
 * Trilha do trompete e do clarinete no mesmo formato das lições da flauta: a criança estuda sozinha,
 * toda nota nova ganha uma tela “Nota nova” (pauta + dedilhado + som), os exemplos tocam na própria
 * atividade e o microfone confere a execução com contagem de bipes. As notas e os dedilhados vêm
 * dos cursos existentes (curriculum.ts e clarinet.ts); nada novo é inventado.
 */
export type BandInstrument='trumpet-bb'|'clarinet-bb';
export const BAND_INSTRUMENTS:readonly BandInstrument[]=['trumpet-bb','clarinet-bb'];
/** Cursos com a trilha de paradas deste arquivo: trompete, clarinete e a Iniciação Musical (sem instrumento). */
export type TrailCourse=BandInstrument|'iniciacao';
export const isWind=(id:string):id is BandInstrument=>(BAND_INSTRUMENTS as readonly string[]).includes(id);
export const isBand=(id:string):id is TrailCourse=>isWind(id)||id==='iniciacao';
/** Nome da nota no curso (a iniciação também usa a clave de Fá). */
export const noteName=(i:TrailCourse,midi:number)=>i==='iniciacao'?iniName(midi):NOTE_NAME[midi]??iniName(midi);
export const NOTE_NAME:Record<number,string>={55:'Sol grave',57:'Lá grave',60:'Dó',62:'Ré',64:'Mi',65:'Fá',66:'Fá♯',67:'Sol',69:'Lá',70:'Si♭',71:'Si',72:'Dó agudo',74:'Ré agudo'};

/**
 * Dedilhados (nota escrita). Trompete: pistos apertados. Clarinete: T = polegar esquerdo (furo de trás),
 * R = chave de registro (polegar), A = chave do Lá, 1–3 = dedos da mão esquerda, 4–6 = dedos da mão direita.
 * Do Dó ao Sol vêm de curriculum.ts / clarinet.ts; as demais são posições padrão de iniciante.
 */
const TRUMPET:Record<number,string[]>={60:[],62:['1','3'],64:['1','2'],65:['1'],66:['2'],67:[],69:['1','2'],70:['1'],71:['2'],72:[],74:['1']};
const CLARINET:Record<number,string[]>={55:['T','1','2','3','4','5','6'],57:['T','1','2','3','4','5'],60:['T','1','2','3'],62:['T','1','2'],64:['T','1'],65:['T'],66:['1'],67:[],69:['A'],70:['A','R']};
export function bandFingering(instrument:TrailCourse,midi:number):string[]|null{if(instrument==='iniciacao')return null;const t=(instrument==='trumpet-bb'?TRUMPET:CLARINET)[midi];return t?[...t]:null;}
export function fingeringLabel(instrument:TrailCourse,keys:readonly string[]):string{
 if(instrument==='iniciacao')return '';
 if(instrument==='trumpet-bb')return keys.length?`Pisto${keys.length>1?'s':''} ${keys.join(' e ')}`:'Nenhum pisto (aberto)';
 if(!keys.length)return 'Tudo aberto';
 const parts:string[]=[];const lh:Record<string,string>={1:'indicador',2:'médio',3:'anelar'};
 if(keys.includes('T'))parts.push('polegar');
 const left=keys.filter(k=>lh[k]).map(k=>lh[k]);parts.push(...left);
 const right=keys.filter(k=>['4','5','6'].includes(k)).map(k=>String(Number(k)-3));if(right.length)parts.push(`dedo${right.length>1?'s':''} ${right.join(', ')} da mão direita`);
 if(keys.includes('A'))parts.push('chave do Lá');if(keys.includes('R'))parts.push('chave de registro');
 const txt=parts.length===1?parts[0]:`${parts.slice(0,-1).join(', ')} e ${parts[parts.length-1]}`;return txt.charAt(0).toLocaleUpperCase('pt-BR')+txt.slice(1);
}

export type BandLesson={id:string;unit:number;index:number;title:string;summary:string;goal:string;tasks:[string,string,string];notes:number[];newNotes:number[]};
export type BandUnit={number:number;section:number;title:string;goal:string;lessons:BandLesson[]};
const PREFIX:Record<BandInstrument,string>={'trumpet-bb':'TPT','clarinet-bb':'CLA'};
const unique=(list:number[])=>[...new Set(list)];
const name=(m:number)=>NOTE_NAME[m];
function buildTrail(i:BandInstrument):BandUnit[]{
 return PLAN_MODULES.map(m=>({number:m.number,section:m.section,title:m.title,goal:m.goal.replace('teu instrumento',`teu ${INSTRUMENT_WORD[i].name}`),lessons:LESSON_NAMES.map((lname,L)=>({
  id:`${PREFIX[i]}-M${String(m.number).padStart(2,'0')}-L${L+1}`,unit:m.number,index:L,title:lname,summary:`Módulo ${m.number} · ${m.title}`,goal:m.goal,
  tasks:lessonTasks(i,m,L,name),notes:poolUntil(i,m.number),newNotes:L===0?m.newNotes[i]:[],
 }))}));
}
const TRAILS:Record<BandInstrument,BandUnit[]>={'trumpet-bb':buildTrail('trumpet-bb'),'clarinet-bb':buildTrail('clarinet-bb')};
export const bandTrail=(i:BandInstrument)=>TRAILS[i];
export const bandLessons=(i:BandInstrument)=>TRAILS[i].flatMap(u=>u.lessons);
export const bandModule=(n:number)=>PLAN_MODULES.find(m=>m.number===n)!;

/* ---------- Telas de cada lição ---------- */
export type BandKind='meet'|'observe'|'fingering'|'build'|'listen'|'compare'|'read'|'theory'|'story'|'perform'|'tap'|'create';
/** Uma tela da lição. `phase`: apoio (corpo, nota nova) · descoberta (P1) · aplicação em exemplo novo (P2), como na flauta. */
export type BandExercise={id:string;taskId:string;phase:'apoio'|'descoberta'|'aplicacao';kind:BandKind;checklist?:string[];instruction:string;prompt:string;target?:number;
 options?:{label:string;keys?:string[];midi?:number}[];answer?:number;notes?:CourseNote[];alternative?:CourseNote[];meter?:CourseMeter;bpm?:number;duo?:boolean;
 /** sem o botão “Ouvir modelo” (tocar lendo / lembrando) */noModel?:boolean;/** montar dedilhado sem o desenho de apoio */hideModel?:boolean;score?:boolean;clef?:Clef;
 tapBeats?:number[];tapLength?:number;create?:{slots:number;choices:(number|null)[];rule:'fill-bar'|'match';target?:(number|null)[]};
 story?:{title:string;scene:string};hint:string;correct:string;incorrect:string;evidence:Evidence[]};
function seeded(seed:string){let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;return ()=>{h=(h*1103515245+12345)>>>0;return h/2**32;};}
function shuffle<T>(list:T[],rnd:()=>number){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const verb=(i:BandInstrument)=>i==='trumpet-bb'?'aperte os pistos pintados':'feche os furos e chaves pintados';
const bar=(meter:CourseMeter)=>meter==='3/4'?3:4;
function padTo(phrase:CourseNote[],meter:CourseMeter):CourseNote[]{const total=phrase.reduce((n,x)=>n+x.beats,0),b=bar(meter),rest=(b-total%b)%b;return rest?[...phrase,{midi:null,beats:rest}]:phrase;}
/** Trecho para tocar, no estilo do módulo, só com notas que a criança já conhece. */
function phraseFor(style:PlanStyle,pool:number[],focus:number[],rnd:()=>number,variant:number,meter:CourseMeter):CourseNote[]{
 const pick=()=>pool[Math.floor(rnd()*pool.length)];
 const main=focus.length?focus:[pool[pool.length-1]];
 const near=(m:number)=>{const sorted=[...pool].sort((a,b)=>a-b),k=sorted.indexOf(m);return sorted[Math.max(0,Math.min(sorted.length-1,k+(rnd()<.5?-1:1)))]??m;};
 let out:CourseNote[]=[];
 switch(style){
  case 'longas':out=main.length===1&&pool.length===1?[{midi:main[0],beats:2},{midi:null,beats:2},{midi:main[0],beats:4}]:[{midi:main[0],beats:2},{midi:near(main[0]),beats:2},{midi:main[main.length-1],beats:2},{midi:null,beats:2}];break;
  case 'pausas':{const a=main[0],b=near(a);out=[{midi:a,beats:1},{midi:null,beats:1},{midi:b,beats:1},{midi:null,beats:1},{midi:a,beats:2},{midi:null,beats:2}];break;}
  case 'ritmo':{const a=pick(),b=near(a);out=[{midi:a,beats:1},{midi:b,beats:.5},{midi:a,beats:.5},{midi:b,beats:2},{midi:a,beats:.5},{midi:b,beats:.5},{midi:a,beats:1},{midi:pick(),beats:2}];break;}
  case 'ternario':{const a=pick(),b=near(a);out=[{midi:a,beats:2},{midi:b,beats:1},{midi:b,beats:1},{midi:a,beats:1},{midi:near(b),beats:1},{midi:a,beats:3}];break;}
  case 'registro':case 'alteracao':case 'ornamento':{const a=main[variant%main.length],b=pool.includes(67)?67:near(a);out=[{midi:b,beats:1},{midi:a,beats:1},{midi:b,beats:1},{midi:a,beats:1},{midi:a,beats:2},{midi:null,beats:2}];break;}
  default:{const sorted=[...pool].sort((x,y)=>x-y),start=Math.floor(rnd()*Math.max(1,sorted.length-3)),run=sorted.slice(start,start+4);
   const line=variant%2?[...run].reverse():run;out=[...line.map(m=>({midi:m,beats:1})),...[...line].reverse().slice(1,3).map(m=>({midi:m,beats:1})),{midi:line[0],beats:2}];
   if(style==='carater'&&variant%2)out=out.map(n=>n.beats===1?{...n,beats:.5}:n);break;}
 }
 return padTo(out,meter);
}

export function bandExercises(instrument:TrailCourse,lessonId:string,clef:Clef='sol'):BandExercise[]{
 if(instrument==='iniciacao')return iniExercises(lessonId,clef);
 const challenge=CHALLENGE_IDS[instrument].get(lessonId);if(challenge)return challengeExercises(instrument,lessonId,challenge);
 const lessons=bandLessons(instrument),index=lessons.findIndex(l=>l.id===lessonId);if(index<0)return [];
 const lesson=lessons[index],m=bandModule(lesson.unit),L=lesson.index,pool=lesson.notes,rnd=seeded(instrument+lessonId),out:BandExercise[]=[];
 const word=INSTRUMENT_WORD[instrument].name,met=new Set(lessons.slice(0,index).flatMap(l=>l.newNotes)),fresh=unique([...lesson.newNotes,...pool.filter(n=>!met.has(n)&&!lesson.newNotes.includes(n))]);
 const focus=m.newNotes[instrument].length?m.newNotes[instrument]:pool.slice(-2);
 const kit=makeKit(instrument,pool,rnd,m.meter);
 const other=(x:number)=>{const rest=pool.filter(p=>p!==x);return rest.length?rest[Math.floor(rnd()*rest.length)]:x;};
 const target=focus[Math.floor(rnd()*focus.length)];
 const phrase=(variant:number)=>phraseFor(m.style,pool,focus,rnd,variant,m.meter);
 const bpm=m.style==='ritmo'||m.style==='carater'?56:60;
 // apoio: postura, respiração, embocadura e mãos; depois cada nota nova ganha a tela “Nota nova”
 body(instrument,m.number,L).forEach((b,k)=>out.push({id:`${lessonId}-B${k+1}-P1`,taskId:`${lessonId}-B${k+1}`,phase:'apoio',kind:'observe',instruction:b.title,prompt:b.prompt,checklist:b.items,hint:b.prompt,correct:b.done,incorrect:'',evidence:['tentativa-fisica']}));
 for(const n of fresh)out.push({...kit.meet(n),id:`${lessonId}-N${n}-P1`,taskId:`${lessonId}-N${n}`,phase:'apoio'});
 const task=(a:number,p1:Seed,p2:Seed)=>{out.push({...p1,id:`${lessonId}-A${a}-P1`,taskId:`${lessonId}-A${a}`,phase:'descoberta'},{...p2,id:`${lessonId}-A${a}-P2`,taskId:`${lessonId}-A${a}`,phase:'aplicacao'});};
 const one=pool.length<2,prev=m.number>1?poolUntil(instrument,m.number-1):pool;
 switch(L){
  case 0:
   if(m.number===1)task(1,kit.partQuestion(),kit.postureQuestion());
   else task(1,kit.contour(phrase(0),'Ouça o exemplo'),kit.contour(phrase(1),'Exemplo novo: ouça'));
   if(fresh.length||m.number===1){const a=fresh[0]??target;task(2,kit.build(a),kit.choose(fresh[1]??a));}
   else{const a=pool[pool.length-1],b=other(a);task(2,{...kit.build(a),instruction:`Relembre: monte o ${name(a)}`},kit.choose(b));}
   if(one)task(3,kit.same(target),kit.longer(target));else task(3,kit.listen(target),kit.listen(other(target)));
   break;
  case 1:
   if(one)task(1,kit.same(target),kit.longer(target));else{const [a,b]=shuffle(pool,rnd);task(1,kit.higher(a,b),kit.higher(...shuffle(pool.filter(x=>x!==a),rnd).concat(a).slice(0,2) as [number,number]));}
   if(one)task(2,kit.pulse(4,[0,1,2,3]),kit.pulse(4,[0,2]));else task(2,kit.listen(other(target)),kit.listen(target));
   task(3,kit.theory(m.theory[instrument]),kit.scoreQuestion(phrase(2),m.style));
   break;
  case 2:
   task(1,kit.build(target),pool.length>1?kit.build(other(target)):{...kit.build(target),instruction:`Monte o ${name(target)} de novo, sem olhar o modelo`,hideModel:true});
   {const p=phrase(0);task(2,kit.rhythm(p,bpm),{...kit.perform(p,bpm),instruction:`Agora toque esse ritmo no ${word}`,prompt:'É o mesmo trecho que tu acabou de bater. Ouça o exemplo, espere os 4 bipes e toque junto com a partitura.'});}
   task(3,{...kit.perform(phrase(1),bpm),instruction:'Toque uma variação',prompt:'O trecho mudou um pouquinho. Ouça o exemplo e toque.'},{...kit.perform(phrase(3),Math.max(48,bpm-8)),instruction:'Exemplo novo, bem devagar',prompt:'Outro trecho, mais devagar. Capriche no som de cada nota.'});
   break;
  case 3:
   task(1,kit.read(target),kit.read(other(target)));
   task(2,kit.create(m.meter),kit.dictation(m.meter));
   task(3,{...kit.perform(phrase(1),bpm),instruction:'Toque lendo a partitura',prompt:'Leia as notas e toque. Se quiser, ouça o exemplo antes.'},{...kit.perform(phrase(2),bpm),instruction:'Exemplo novo: só lendo',prompt:'Desta vez sem ouvir antes: leia a partitura, confira os dedilhados embaixo e toque.',noModel:true});
   break;
  default:{
   const s=m.story;task(1,{kind:'story',story:{title:s.title,scene:s.scene},instruction:'Resolva a história',prompt:s.prompt,options:s.options.map(label=>({label})),answer:s.answer,hint:s.hint,correct:`Isso! ${s.hint}`,incorrect:`Ainda não. ${s.hint}`,evidence:['leitura']},kit.trouble(m.number));
   const p=phrase(2);task(2,{...kit.perform(p,bpm),instruction:'Trecho novo',prompt:'Ouça o exemplo, espere os 4 bipes e toque.',duo:m.style==='duo'},{...kit.perform(p,bpm),instruction:'O mesmo trecho, sem ouvir antes',prompt:'Tu já ouviu esse trecho. Agora toque lembrando dele, sem o exemplo.',noModel:true});
   if(m.number>1){const old=prev[Math.floor(rnd()*prev.length)];task(3,{...kit.perform(phraseFor(bandModule(m.number-1).style,prev,prev.slice(-2),rnd,3,m.meter),bpm),instruction:'Recupere o módulo anterior',prompt:`Um trecho com as notas do módulo ${m.number-1}. Ouça e toque.`},{...kit.choose(old),instruction:`Lembra do ${name(old)}?`});}
   else task(3,{...kit.perform(phrase(3),bpm),instruction:'Toque de novo, sem ouvir antes',prompt:'Leia a partitura e toque do teu jeito.',noModel:true},{...kit.choose(67),instruction:'Lembra do Sol?'});
  }
 }
 return out;
}

type Seed=Omit<BandExercise,'id'|'taskId'|'phase'>;
const TROUBLE:{prompt:string;options:string[];answer:number;hint:string}[]=[
 {prompt:'Teu som saiu estourado, forte demais. Qual pista ajuda?',options:['Soprar com calma, ar firme e sem força','Soprar ainda mais forte','Apertar o instrumento com força'],answer:0,hint:'Som bonito vem de ar firme e calmo, não de força.'},
 {prompt:'Saiu uma nota diferente da partitura. O que conferir primeiro?',options:['O dedilhado, olhando o desenho embaixo da partitura','O volume do celular','A cor da partitura'],answer:0,hint:'Nota trocada quase sempre é dedilhado trocado.'},
 {prompt:'Tu se perdeu no tempo no meio do trecho. O que ajuda?',options:['Contar junto com os bipes do metrônomo','Tocar mais rápido pra alcançar','Parar de ouvir os bipes'],answer:0,hint:'Os bipes marcam o tempo do começo ao fim.'},
 {prompt:'O ar acabou antes do fim do trecho. O que planejar?',options:['Puxar o ar pela barriga antes de começar e respirar nas pausas','Tocar sem respirar','Soprar mais forte no começo'],answer:0,hint:'Ar planejado chega até o fim da frase.'},
];
function makeKit(i:BandInstrument,pool:number[],rnd:()=>number,meter:CourseMeter){
 const word=INSTRUMENT_WORD[i].name;
 const others=(x:number,n:number)=>shuffle(pool.filter(p=>p!==x),rnd).slice(0,n);
 const opts=(x:number)=>{const list=[x,...others(x,2)];if(list.length<3)for(const extra of [67,65,64,62,60,69,71])if(!list.includes(extra)&&list.length<3)list.push(extra);return shuffle(list,rnd);};
 const lab=(midi:number)=>fingeringLabel(i,bandFingering(i,midi)!).toLocaleLowerCase('pt-BR');
 const kit={
  meet:(midi:number):Seed=>({kind:'meet',target:midi,instruction:`Nota nova: ${name(midi)}`,prompt:`Veja como fazer o ${name(midi)}: ${verb(i)}, sopre com calma e escute o som.`,hint:fingeringLabel(i,bandFingering(i,midi)!),correct:`Agora tu já sabe fazer o ${name(midi)}!`,incorrect:'',evidence:['leitura']}),
  partQuestion:():Seed=>i==='trumpet-bb'
   ?{kind:'theory',instruction:'Conheça teu trompete',prompt:'Em que parte do trompete a boca encosta?',options:[{label:'No bocal'},{label:'Na campana'},{label:'Nos pistos'}],answer:0,hint:'O bocal é a pecinha redonda onde os lábios vibram.',correct:'Isso! A boca encosta no bocal.',incorrect:'Ainda não. A boca encosta no bocal, onde os lábios vibram.',evidence:['leitura']}
   :{kind:'theory',instruction:'Conheça teu clarinete',prompt:'Em que parte do clarinete fica a palheta?',options:[{label:'Na boquilha'},{label:'Na campana'},{label:'Nas chaves'}],answer:0,hint:'A palheta fica presa na boquilha, a parte que vai na boca.',correct:'Isso! A palheta fica na boquilha.',incorrect:'Ainda não. A palheta fica na boquilha, que vai na boca.',evidence:['leitura']},
  postureQuestion:():Seed=>{const good='Na pontinha da cadeira, costas retas e ombros soltos',list=shuffle([good,'Encolhido, com os ombros levantados','Deitado no sofá'],rnd);return {kind:'theory',instruction:'Qual postura ajuda a tocar?',prompt:`Pra tocar ${word} sentado, como fica o corpo?`,options:list.map(label=>({label})),answer:list.indexOf(good),hint:'Costas retas e ombros soltos deixam o ar entrar fácil.',correct:'Isso! Corpo reto e solto, o ar entra fácil.',incorrect:'Ainda não. Sente na pontinha da cadeira, costas retas e ombros soltos.',evidence:['leitura']};},
  build:(midi:number):Seed=>({kind:'build',target:midi,instruction:`Monte o ${name(midi)}`,prompt:i==='trumpet-bb'?`Toque nos pistos que tu aperta pra fazer o ${name(midi)}. Se for sem pisto nenhum, deixe todos soltos.`:`Toque nos furos e chaves que tu fecha pra fazer o ${name(midi)}.`,hint:`${name(midi)}: ${lab(midi)}.`,correct:`Isso! ${name(midi)} = ${lab(midi)}.`,incorrect:`Ainda não. ${name(midi)} = ${lab(midi)}.`,evidence:['leitura']}),
  choose:(midi:number):Seed=>{const sig=bandFingering(i,midi)!.join(),distinct:number[]=[];
   for(const o of shuffle(unique([...pool,...poolUntil(i,16)]).filter(x=>x!==midi),rnd)){const s=bandFingering(i,o)!.join();if(s!==sig&&!distinct.some(d=>bandFingering(i,d)!.join()===s))distinct.push(o);if(distinct.length===2)break;}
   const list=shuffle([midi,...distinct],rnd);
   return {kind:'fingering',target:midi,instruction:`Como se faz o ${name(midi)}?`,prompt:`Escolha o dedilhado do ${name(midi)}.`,options:list.map(o=>({label:fingeringLabel(i,bandFingering(i,o)!),keys:bandFingering(i,o)!})),answer:list.indexOf(midi),hint:`${name(midi)}: ${lab(midi)}.`,correct:`Isso! ${name(midi)} = ${lab(midi)}.`,incorrect:`Esse é de outra nota. ${name(midi)} = ${lab(midi)}.`,evidence:['leitura']};},
  listen:(target:number):Seed=>{const list=shuffle([target,...others(target,2)],rnd);return {kind:'listen',target,instruction:'Escute e descubra',prompt:'Toque em “Ouvir” e escolha qual nota tocou.',notes:[{midi:target,beats:2}],meter:'4/4',bpm:72,options:list.map(x=>({label:name(x),midi:x})),answer:list.indexOf(target),hint:'Compare: as notas mais graves soam mais “grossas”. Ouça quantas vezes quiser.',correct:`Isso! Tocou o ${name(target)}.`,incorrect:`Tocou o ${name(target)}. Ouça de novo e compare.`,evidence:['escuta']};},
  higher:(a:number,b:number):Seed=>{const high=a>b?0:1;return {kind:'compare',instruction:'Qual soa mais agudo?',prompt:'Ouça o Modelo A e o Modelo B. Qual é o som mais agudo (mais fino)?',notes:[{midi:a,beats:2}],alternative:[{midi:b,beats:2}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:high,hint:'O som mais agudo é o mais “fininho”.',correct:`Isso! O Modelo ${high?'B':'A'} (${name(Math.max(a,b))}) é mais agudo.`,incorrect:`O mais agudo era o Modelo ${high?'B':'A'}, com ${name(Math.max(a,b))}.`,evidence:['escuta']};},
  same:(a:number):Seed=>({kind:'compare',instruction:'Iguais ou diferentes?',prompt:'Ouça o Modelo A e o Modelo B. Tocaram a mesma nota?',notes:[{midi:a,beats:2}],alternative:[{midi:a,beats:2}],options:[{label:'Iguais'},{label:'Diferentes'}],answer:0,hint:'Os dois tocaram a mesma nota.',correct:'Isso! Os dois são a mesma nota.',incorrect:'Ouça de novo: é a mesma nota nos dois.',evidence:['escuta']}),
  longer:(a:number):Seed=>{const longB=rnd()<.5;return {kind:'compare',instruction:'Qual som dura mais?',prompt:'Ouça o Modelo A e o Modelo B. Qual som é mais longo?',notes:[{midi:a,beats:longB?1:4}],alternative:[{midi:a,beats:longB?4:1}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:longB?1:0,hint:'Conte quanto tempo cada som fica soando.',correct:`Isso! O Modelo ${longB?'B':'A'} dura 4 tempos.`,incorrect:`O mais longo era o Modelo ${longB?'B':'A'}, com 4 tempos.`,evidence:['escuta']};},
  contour:(notes:CourseNote[],lead:string):Seed=>{const p=notes.flatMap(n=>n.midi===null?[]:[n.midi]),first=p[0],last=p[p.length-1];
   if(first===last){const k=p.findIndex((x,j)=>j>0&&x!==p[j-1]);if(k>0){const up=p[k]>p[k-1];return {kind:'listen',instruction:lead,prompt:'Na primeira vez que a nota muda, o som sobe ou desce?',notes,meter,bpm:72,options:[{label:'Sobe'},{label:'Desce'}],answer:up?0:1,hint:'Sobe = fica mais agudo; desce = fica mais grave.',correct:`Isso! Na primeira mudança o som ${up?'sobe':'desce'}.`,incorrect:`Na primeira mudança o som ${up?'sobe':'desce'}. Ouça de novo.`,evidence:['escuta']};}}
   const ans=last>first?0:last<first?1:2;return {kind:'listen',instruction:lead,prompt:'Do primeiro ao último som, a melodia sobe, desce ou termina na mesma nota?',notes,meter,bpm:72,options:[{label:'Sobe'},{label:'Desce'},{label:'Termina na mesma nota'}],answer:ans,hint:'Compare só o primeiro e o último som.',correct:`Isso! ${['Sobe','Desce','Termina na mesma nota'][ans]}.`,incorrect:`A resposta era: ${['sobe','desce','termina na mesma nota'][ans]}. Ouça de novo.`,evidence:['escuta']};},
  read:(target:number):Seed=>{const list=opts(target);return {kind:'read',target,instruction:'Que nota é essa?',prompt:'Olhe a nota na pauta e escolha o nome dela.',notes:[{midi:target,beats:4}],options:list.map(x=>({label:name(x),midi:x})),answer:list.indexOf(target),hint:'Conte as linhas e os espaços a partir de uma nota que tu já sabe.',correct:`Isso! É o ${name(target)}.`,incorrect:`É o ${name(target)}. Compare com as notas vizinhas.`,evidence:['leitura']};},
  scoreQuestion:(notes:CourseNote[],style:PlanStyle):Seed=>{
   const bar=meter==='3/4'?3:4,first:CourseNote[]=[];let at=0;for(const n of notes){if(at>=bar)break;first.push(n);at+=n.beats;}
   const restAt=(()=>{let t=0;for(const n of first){if(n.midi===null&&Number.isInteger(t)&&n.beats===1)return t;t+=n.beats;}return -1;})();
   if(style==='pausas'&&restAt>=0)return {kind:'read',instruction:'Onde está o silêncio?',prompt:'Na partitura, em qual tempo do compasso fica a pausa?',notes:first,meter,options:Array.from({length:bar},(_,k)=>({label:`${k+1}º tempo`})),answer:restAt,hint:'Conte 1, 2, 3, 4 em cada figura até chegar na pausa.',correct:`Isso! A pausa fica no ${restAt+1}º tempo.`,incorrect:`A pausa fica no ${restAt+1}º tempo. Conte de novo.`,evidence:['leitura']};
   const p=unique(notes.flatMap(n=>n.midi===null?[]:[n.midi]));
   if(p.length>=3&&!['ritmo','ternario','carater'].includes(style)){const high=Math.max(...p),list=shuffle(p.slice(0,3).includes(high)?p.slice(0,3):[high,...p.filter(x=>x!==high).slice(0,2)],rnd);return {kind:'read',instruction:'A nota mais aguda',prompt:'Na partitura, qual é a nota mais aguda (a mais alta na pauta)?',notes,meter,options:list.map(x=>({label:name(x),midi:x})),answer:list.indexOf(high),hint:'A nota mais aguda é a que fica mais em cima na pauta.',correct:`Isso! O ${name(high)} é o mais agudo.`,incorrect:`O mais agudo é o ${name(high)}, o mais alto na pauta.`,evidence:['leitura']};}
   const list=shuffle([bar,bar===3?4:3,2],rnd);return {kind:'read',instruction:'Quantos tempos?',prompt:`Olhe o número de cima do compasso (${meter}). Quantos tempos cabem em cada compasso?`,notes:first,meter,options:list.map(n=>({label:`${n} tempos`})),answer:list.indexOf(bar),hint:'O número de cima diz quantos tempos cabem no compasso.',correct:`Isso! Cabem ${bar} tempos.`,incorrect:`Cabem ${bar} tempos: é o número de cima.`,evidence:['leitura']};},
  theory:(q:PlanQuestion):Seed=>{const order=shuffle(q.options.map((label,k)=>({label,k})),rnd);return {kind:'theory',instruction:'Pra pensar',prompt:q.prompt,options:order.map(o=>({label:o.label})),answer:order.findIndex(o=>o.k===q.answer),hint:q.hint,correct:`Isso! ${q.hint}`,incorrect:`Ainda não. ${q.hint}`,evidence:['leitura']};},
  trouble:(n:number):Seed=>{const t=TROUBLE[(n-1)%TROUBLE.length],order=shuffle(t.options.map((label,k)=>({label,k})),rnd);return {kind:'theory',instruction:'Qual pista ajuda?',prompt:t.prompt,options:order.map(o=>({label:o.label})),answer:order.findIndex(o=>o.k===t.answer),hint:t.hint,correct:`Isso! ${t.hint}`,incorrect:`Ainda não. ${t.hint}`,evidence:['reflexao']};},
  pulse:(length:number,beats:number[]):Seed=>({kind:'tap',instruction:beats.length===length?'Sinta o pulso':'Toque só no 1 e no 3',prompt:beats.length===length?`Depois da contagem, toque o botão em cada um dos ${length} pulsos, junto com o clique.`:'Conte 1-2-3-4 e toque o botão só no 1 e no 3.',meter:'4/4',bpm:60,tapBeats:beats,tapLength:length,hint:beats.length===length?'Toque junto com o clique, nem antes nem depois.':'1 toca, 2 espera, 3 toca, 4 espera.',correct:'No pulso, arretado!',incorrect:'Os toques não bateram com o pulso. Escute o clique e tente de novo.',evidence:['medicao-automatica']}),
  rhythm:(notes:CourseNote[],bpm:number):Seed=>{const beats:number[]=[];let at=0;for(const n of notes){if(n.midi!==null)beats.push(at);at+=n.beats;}
   return {kind:'tap',instruction:'Bata o ritmo do trecho',prompt:'Antes de tocar, sinta o ritmo: depois da contagem, toque o botão em cada nota da partitura. Nas pausas, não toque.',notes,meter,bpm,score:true,tapBeats:beats,tapLength:at,hint:'Leia a partitura: cada nota é um toque; a pausa é silêncio.',correct:'Ritmo certinho!',incorrect:'Confira as notas e as pausas da partitura e tente de novo.',evidence:['medicao-automatica']};},
  perform:(notes:CourseNote[],bpm:number):Seed=>({kind:'perform',instruction:'Toque o trecho',prompt:'Ouça o exemplo, espere os 4 bipes e toque junto com a partitura.',notes,meter,bpm,hint:'Pouco ar e calma: o som não precisa ser forte. Confira o dedilhado de cada nota embaixo da partitura.',correct:'Tocou certinho!',incorrect:'Confira as notas em vermelho e tente de novo, mais devagar.',evidence:['tentativa-fisica']}),
  create:(m:CourseMeter):Seed=>{const slots=m==='3/4'?3:4,choices=[...pool.slice(-3),null];return {kind:'create',instruction:'Crie teu compasso',prompt:`Monte um compasso de ${m} com as notas que tu já sabe. Use pelo menos duas notas.`,meter:m,create:{slots,choices,rule:'fill-bar'},hint:'Toque em cada tempo pra escolher uma nota ou uma pausa. Pelo menos dois tempos com nota.',correct:'Compasso criado! Ouça como ficou e toque no teu instrumento.',incorrect:'Coloque nota em pelo menos dois tempos.',evidence:['criacao']};},
  dictation:(m:CourseMeter):Seed=>{const slots=m==='3/4'?3:4,choices=[...pool.slice(-3),null];const notes=pool.slice(-3);const target=Array.from({length:slots},(_,k)=>k===slots-1&&slots===4&&rnd()<.5?null:notes[Math.floor(rnd()*notes.length)]);if(target.filter(x=>x!==null).length<2)target[0]=notes[0];
   return {kind:'create',instruction:'Ditado: ouça e monte',prompt:'Toque em “Ouvir” e monte, tempo por tempo, o que tu ouviu.',meter:m,bpm:60,notes:target.map(x=>({midi:x,beats:1})),create:{slots,choices,rule:'match',target},hint:`A resposta: ${target.map(x=>x===null?'pausa':name(x)).join(' · ')}.`,correct:'Ouvido afiado! Montou igualzinho.',incorrect:'Ainda não ficou igual. Ouça de novo, um tempo de cada vez.',evidence:['escuta']};},
 };
 return kit;
}

/* ---------- Desafio da seção: depois das unidades 4, 8, 12 e 16 ---------- */
export const CHALLENGE_UNITS=[4,8,12,16] as const;
const CHALLENGE_IDS:Record<BandInstrument,Map<string,number>>={'trumpet-bb':new Map(CHALLENGE_UNITS.map((u,k)=>[`TPT-S${k+1}-DESAFIO`,u])),'clarinet-bb':new Map(CHALLENGE_UNITS.map((u,k)=>[`CLA-S${k+1}-DESAFIO`,u]))};
export const challengeId=(i:BandInstrument,section:number)=>`${PREFIX[i]}-S${section}-DESAFIO`;
function challengeExercises(i:BandInstrument,lessonId:string,unit:number):BandExercise[]{
 const pool=poolUntil(i,unit),m=bandModule(unit),rnd=seeded(i+lessonId),kit=makeKit(i,pool,rnd,m.meter),out:BandExercise[]=[];
 const pick=()=>pool[Math.floor(rnd()*pool.length)],sectionStart=unit-3,styles=PLAN_MODULES.filter(x=>x.number>=sectionStart&&x.number<=unit);
 const seq:Seed[]=[kit.listen(pick()),{...kit.higher(...(shuffle(pool,rnd).slice(0,2) as [number,number]))},kit.read(pick()),kit.build(pick()),
  kit.rhythm(phraseFor(styles[1].style,pool,pool.slice(-2),rnd,1,styles[1].meter),60),kit.dictation(m.meter),
  {...kit.perform(phraseFor(styles[2].style,pool,pool.slice(-2),rnd,2,styles[2].meter),60),meter:styles[2].meter,instruction:'Desafio: toque o trecho'},
  {...kit.perform(phraseFor(m.style,pool,pool.slice(-3),rnd,3,m.meter),56),instruction:'Desafio final: só lendo',prompt:'Leia, confira os dedilhados e toque sem ouvir antes.',noModel:true}];
 seq.forEach((s,k)=>out.push({...s,id:`${lessonId}-A${k+1}-P1`,taskId:`${lessonId}-A${k+1}`,phase:'aplicacao'}));
 return out;
}

/* ---------- Trilha em paradas, igual à da flauta ---------- */
/**
 * Cada unidade tem as mesmas 4 áreas da flauta: Descoberta (lições 1 e 2), Prática (3), Criação (4) e
 * Missão e revisão (5). Depois das unidades 4, 8, 12 e 16 vem o Desafio da seção (sem professor).
 * O registro usa as mesmas regras: revisão espaçada (D+1, +3, +7, +14), o que errou volta na revisão, XP.
 */
export type BandJourneyUnit={number:number;section:number;title:string;goal:string;stops:JourneyStop[]};
const SECTION_TITLES=['Primeiros Passos','Fundamentos','Intermediário','Autonomia Musical'];
function buildJourney(i:BandInstrument){
 const stops:JourneyStop[]=[],units:BandJourneyUnit[]=[];
 for(const u of TRAILS[i]){
  const unit:BandJourneyUnit={number:u.number,section:u.section,title:u.title,goal:u.goal,stops:[]};
  for(const shape of STOP_KINDS){
   const lessons=shape.lessons.map(n=>u.lessons[n-1]);
   const stop:JourneyStop={id:`${PREFIX[i]}-U${String(u.number).padStart(2,'0')}-${shape.kind}`,index:stops.length,unit:u.number,section:u.section,kind:shape.kind,label:shape.label,lessonIds:lessons.map(l=>l.id),taskIds:lessons.flatMap(l=>[1,2,3].map(a=>`${l.id}-A${a}`)),unitTitle:u.title,unitGoal:u.goal,mission:''};
   unit.stops.push(stop);stops.push(stop);
  }
  if((CHALLENGE_UNITS as readonly number[]).includes(u.number)){const id=challengeId(i,u.section);
   const stop:JourneyStop={id,index:stops.length,unit:u.number,section:u.section,kind:'desafio',label:'Desafio da seção',lessonIds:[id],taskIds:Array.from({length:8},(_,k)=>`${id}-A${k+1}`),unitTitle:u.title,unitGoal:`Desafio: ${SECTION_TITLES[u.section-1]}`,mission:''};
   unit.stops.push(stop);stops.push(stop);}
  units.push(unit);
 }
 const engine=createJourneyEngine(stops),lessonIds=new Set(stops.flatMap(s=>s.lessonIds)),stopIds=new Set(stops.map(s=>s.id));
 return {stops,units,engine,normalize:(v:unknown)=>normalizeJourney(v,id=>lessonIds.has(id),id=>stopIds.has(id))};
}
const JOURNEYS={'trumpet-bb':buildJourney('trumpet-bb'),'clarinet-bb':buildJourney('clarinet-bb')};
export const bandJourney=(i:TrailCourse)=>i==='iniciacao'?iniJourney():JOURNEYS[i];
export const bandJourneyKey=(i:BandInstrument)=>`cactom-trilha-${i}-v2`;
/** Nome da lição dentro da parada (Descobrir, Discriminar…) ou “Desafio da seção”. */
export function bandLessonName(i:TrailCourse,lessonId:string){if(i==='iniciacao')return iniLessonName(lessonId);return CHALLENGE_IDS[i].has(lessonId)?'Desafio da seção':bandLessons(i).find(l=>l.id===lessonId)?.title??'';}
export function bandLessonTasks(i:TrailCourse,lessonId:string):string[]{
 if(i==='iniciacao')return iniLessonTasks(lessonId);
 const u=CHALLENGE_IDS[i].get(lessonId);if(u)return ['Escutar e reconhecer notas.','Ler a partitura e montar dedilhados.','Bater ritmos, fazer ditado e tocar.'];
 return [...(bandLessons(i).find(l=>l.id===lessonId)?.tasks??[])];
}

/** Registro antigo (v1: uma lição por parada). Lido só para levar o progresso para o registro novo. */
export type BandLedger={version:1;lessons:Record<string,{at:string;xp:number;total:number;correctFirst:number}>;xp:number};
export const bandKey=(i:BandInstrument)=>`cactom-trilha-${i}-v1`;
export function readBand(storage:Pick<KeyValueStorage,'getItem'>,i:BandInstrument):BandLedger{
 try{const v=JSON.parse(storage.getItem(bandKey(i))??'null');if(v?.version===1&&v.lessons&&typeof v.lessons==='object'){const ids=new Set(bandLessons(i).map(l=>l.id));const lessons:BandLedger['lessons']={};for(const [id,r] of Object.entries(v.lessons as Record<string,BandLedger['lessons'][string]>))if(ids.has(id)&&r&&typeof r.at==='string'&&Number.isInteger(r.xp))lessons[id]={at:r.at,xp:r.xp,total:Number(r.total)||0,correctFirst:Number(r.correctFirst)||0};return {version:1,lessons,xp:Object.values(lessons).reduce((n,l)=>n+l.xp,0)};}}catch{/* registro quebrado */}
 return {version:1,lessons:{},xp:0};
}
/** Lê a trilha nova; na primeira vez, traz as lições já feitas no registro antigo (nada é apagado). */
export function readBandJourney(storage:Pick<KeyValueStorage,'getItem'>,i:TrailCourse):{ledger:JourneyLedger;warning:string;safeToWrite:boolean}{
 if(i==='iniciacao')return readIniJourney(storage);
 const j=JOURNEYS[i];let raw:string|null=null;try{raw=storage.getItem(bandJourneyKey(i));}catch{/* sem armazenamento */}
 if(raw)return readJourney(storage,bandJourneyKey(i),j.normalize);
 const old=readBand(storage,i),ledger=emptyJourney();
 for(const [id,r] of Object.entries(old.lessons))ledger.lessons[id]={at:r.at,xp:r.xp,total:r.total,correctFirst:r.correctFirst,recovered:0,review:false};
 ledger.xp=old.xp;const last=Object.entries(old.lessons).sort((a,b)=>a[1].at.localeCompare(b[1].at)).pop();
 if(last){const stop=j.stops.find(s=>s.lessonIds.includes(last[0]));if(stop)ledger.lastStop=stop.id;}
 return {ledger,warning:'',safeToWrite:true};
}
export function completeBandLesson(storage:Pick<KeyValueStorage,'getItem'|'setItem'>,i:TrailCourse,outcome:LessonOutcome){
 if(i==='iniciacao')return completeIniLesson(storage,outcome);
 const fresh=readBandJourney(storage,i),updated=JOURNEYS[i].engine.completeLesson(fresh.ledger,outcome);
 let warning=fresh.warning;if(fresh.safeToWrite&&!writeJourney(storage,updated,bandJourneyKey(i)))warning='Teu avanço ficou nesta sessão, mas este navegador não deixou salvar.';
 return {ledger:updated,xp:lessonXp(outcome),warning};
}
/** Mesmo formato do resumo da flauta, para Rojão, Conquistas e Progresso. */
export function bandOverview(storage:Pick<KeyValueStorage,'getItem'>,i:TrailCourse):JourneyOverview{
 if(i==='iniciacao')return iniOverview(storage);
 const j=JOURNEYS[i];return overviewOf(readBandJourney(storage,i).ledger,j.engine,j.units);
}

/* ---------- Postura, respiração, embocadura e mãos (antes de soprar) ---------- */
type BodyStep={title:string;prompt:string;items:string[];done:string};
const POSTURA:BodyStep={title:'Sente do jeito certo',prompt:'Antes de tocar, arrume o corpo. Confira cada item:',items:['Sentado na pontinha da cadeira, com as costas retas','Pés inteiros no chão, um pouco afastados','Ombros soltos, sem levantar','Cabeça reta: o instrumento vem até a boca, não a boca até ele'],done:'Corpo pronto pra tocar!'};
const RESPIRA:BodyStep={title:'Respire como músico',prompt:'O ar é o combustível do som. Faça junto:',items:['Puxe o ar pela boca enchendo a barriga, não os ombros','Solte o ar devagar, como quem sopra uma vela sem apagar','Puxe contando até 4 e solte contando até 8'],done:'Arretado! Esse ar vai virar som.'};
const BOCA:Record<BandInstrument,BodyStep>={
 'trumpet-bb':{title:'A boca no trompete (embocadura)',prompt:'O som do trompete nasce nos lábios. Experimente:',items:['Lábios juntinhos, como quem diz “mmm”','Faça um zumbido com os lábios, ainda sem o bocal','Encoste o bocal no meio dos lábios, sem apertar','Faça o mesmo zumbido dentro do bocal'],done:'Zumbido no bocal: é assim que o trompete fala!'},
 'clarinet-bb':{title:'A boca no clarinete (embocadura)',prompt:'O som do clarinete nasce na palheta. Experimente:',items:['Lábio de baixo cobrindo um pouquinho os dentes de baixo','Palheta apoiada no lábio de baixo','Dentes de cima apoiados em cima da boquilha','Cantos da boca firmes, como quem diz “u”'],done:'Boca no lugar: agora a palheta pode vibrar!'}};
const MAOS:Record<BandInstrument,BodyStep>={
 'trumpet-bb':{title:'As mãos no trompete',prompt:'Segure assim, sem força:',items:['Mão esquerda segura o trompete pela parte dos pistos','Dedos indicador, médio e anelar da mão direita em cima dos pistos 1, 2 e 3','Dedos curvadinhos, apertando com a pontinha','Polegar direito por baixo, entre o 1º e o 2º pisto'],done:'Mãos prontas!'},
 'clarinet-bb':{title:'As mãos no clarinete',prompt:'Segure assim, sem força:',items:['Mão esquerda em cima, com o polegar no furo de trás','Mão direita embaixo, com o polegar no apoio','Dedos curvadinhos, tampando os furos com a polpa do dedo','Os dedos que não tocam ficam pertinho dos furos'],done:'Mãos prontas!'}};
function body(i:BandInstrument,module:number,L:number):BodyStep[]{
 if(module!==1)return module===2&&L===0?[RESPIRA]:[];
 return [[POSTURA,RESPIRA],[BOCA[i]],[MAOS[i]],[],[]][L] as BodyStep[];
}
/** Trompete em Si♭ (soa 1 tom abaixo do escrito) ou em Dó (soa como escrito). Os pistos são os mesmos (tabelas Tonestro). */
export const TRUMPET_KEY='cactom-trompete-afinacao';
export type TrumpetKey='sib'|'do';
export function readTrumpetKey():TrumpetKey{try{return globalThis.localStorage?.getItem(TRUMPET_KEY)==='do'?'do':'sib';}catch{return 'sib';}}
export function saveTrumpetKey(k:TrumpetKey){try{globalThis.localStorage?.setItem(TRUMPET_KEY,k);}catch{/* sem armazenamento */}}
export function soundingOffset(i:TrailCourse,k:TrumpetKey=readTrumpetKey()){if(i==='iniciacao')return 0;return i==='trumpet-bb'&&k==='do'?0:-2;}
