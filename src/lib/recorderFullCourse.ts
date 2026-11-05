import plan from '../data/recorder-discipline-v1.json' with {type:'json'};
import {formatWrittenNote,targetFrequencyFor,type PracticeNote} from './music.ts';
import type {ScoreSample} from './scoreAssessment.ts';
import type {ScoreEvent} from './musicxml.ts';
import type {KeyValueStorage} from './profileStorage';
export const RECORDER_FULL_KEY='cactom-recorder-course-260-v1';
export const RECORDER_PLAN=plan;
export type CourseMode='listen'|'choice'|'fingering'|'perform'|'tap'|'compose'|'annotate'|'reflect'|'ensemble';
export type CourseNote={midi:number|null;beats:number;tie?:boolean;/** volume relativo (1 = normal): dinâmica forte/piano */vol?:number};
export type CourseMeter='2/4'|'3/4'|'4/4'|'6/8';
export type CourseMaterial={mode:CourseMode;notes:CourseNote[];alternative:CourseNote[];pool:number[];meter:CourseMeter;guide:string;reflection:string;question?:string;options?:string[];answer?:number;gate?:number;slur?:boolean;guided?:boolean};
export type CourseTask={id:string;task:string;module:number;section:number;lesson:string;lessonName:string;moduleTitle:string;assessment:boolean;material:CourseMaterial};
type Recipe={pool:number[];phrase:CourseNote[];alternative?:CourseNote[];meter?:CourseMeter;modes:CourseMode[];guide:string;reflection:string};
const phrase=(notes:(number|null)[],beats=1):CourseNote[]=>notes.map(midi=>({midi,beats}));
const timed=(...notes:[number|null,number][]):CourseNote[]=>notes.map(([midi,beats])=>({midi,beats}));
const tune=phrase([71,69,67,69,71,71,71,null,69,69,69,null,71,69,67,null]);
const duo=phrase([67,null,67,null,69,null,69,null,67,null,67,null,71,69,67,null]);
const sync=timed([null,.5],[71,.5],[71,1],[69,1],[67,1]);sync[1].tie=true;
const six=timed([71,.5],[69,.5],[67,.5],[69,.5],[71,.5],[74,.5]);
const modes=(value:string)=>value.split(' ') as CourseMode[];
const RECIPES:Record<number,Recipe>={
 1:{pool:[71],phrase:phrase([71,null,71,null]),modes:modes('fingering reflect reflect listen choice perform fingering perform reflect fingering perform compose choice perform reflect'),guide:'Mão esquerda em cima. Para Si, feche 0 e 1, sem apertar.',reflection:'Que cuidado ajudou a preparar sua flauta?'},
 2:{pool:[71,69],phrase:phrase([71,71,69,69]),alternative:phrase([69,71,69,71]),modes:modes('fingering choice fingering listen choice perform perform perform perform choice perform compose compose choice perform'),guide:'De Si para Lá, acrescente o médio esquerdo no furo 2. Os furos 0 e 1 continuam fechados.',reflection:'Qual troca de dedo você precisou preparar com mais calma?'},
 3:{pool:[71,69,67],phrase:phrase([71,69,67,null]),alternative:phrase([67,69,71,null]),modes:modes('fingering perform perform choice choice choice tap perform tap choice choice compose choice perform perform'),guide:'Sol: feche 0, 1, 2 e 3. Continue contando durante a pausa; o silêncio ocupa um tempo.',reflection:'Como você manteve a contagem durante o silêncio?'},
 4:{pool:[71,69,67],phrase:tune,alternative:timed([71,2],[69,1],[67,1]),modes:modes('listen choice perform choice compose listen perform perform perform annotate compose perform perform reflect perform'),guide:'Divida a peça em duas metades. Respire no silêncio escrito e junte as partes em andamento confortável.',reflection:'Qual trecho você escolheu ajustar e o que mudou ao repetir?'},
 5:{pool:[67,65,64,62,60],phrase:phrase([67,65,64,62,60,null,62,64]),modes:modes('listen fingering perform fingering choice perform fingering fingering reflect choice perform compose choice perform perform'),guide:'Confira o sistema da flauta. Fá barroco fecha 0–4, 6 e 7; germânico fecha 0–4. Ré grave fecha 0–6; Dó fecha 0–7.',reflection:'Em qual nota grave você precisou conferir a cobertura dos furos?'},
 6:{pool:[71,69,67,65,64,62,60],phrase:timed([71,1],[69,.5],[67,.5],[null,1],[71,1]),alternative:timed([71,2],[69,1],[67,1]),modes:modes('tap tap perform choice compose listen tap tap perform choice compose compose choice compose perform'),guide:'Semínima: 1 tempo. Mínima: 2. Cada par de colcheias ocupa 1 tempo. Complete o compasso sem acrescentar pausas entre notas.',reflection:'Qual duração ou agrupamento você usou para conferir o compasso?'},
 7:{pool:[71,69,67,65,64],phrase:phrase([71,69,67,null,69,67,65,null]),modes:modes('listen reflect perform choice annotate reflect perform perform perform annotate annotate compose choice annotate perform'),guide:'Compare ataques separados e notas ligadas. Combine respirações ao fim das ideias; o microfone não certifica articulação nem respiração.',reflection:'Onde você respirou e por que esse lugar preserva a frase?'},
 8:{pool:[71,69,67,65,64,62,60],phrase:duo,alternative:tune,modes:modes('listen tap ensemble choice choice choice ensemble ensemble ensemble annotate annotate compose choice ensemble reflect'),guide:'Ouça as duas vozes. Combine uma contagem e um ponto de encontro para retomar. Experimente primeiro só sua parte.',reflection:'Qual ponto de encontro ajudou o duo a continuar?'},
 9:{pool:[67,69,71,72,74],phrase:phrase([71,72,74,null,74,72,71,null]),alternative:phrase([60,62,64,null,64,62,60,null]),modes:modes('listen choice perform fingering choice fingering perform perform reflect choice perform compose choice perform perform'),guide:'Neste exemplo, Dó5 fecha 0 e 2; Ré5 fecha apenas 2, com polegar aberto. Notas posteriores com polegar parcialmente aberto precisam do dedilhado do modelo e de orientação.',reflection:'Qual mudança no polegar você observou na troca de região?'},
 10:{pool:[60,62,64,65,66,67,69,70,71,72,74],phrase:phrase([67,69,71,72,74,72,71,66]),alternative:phrase([65,67,69,70,72,70,69,65]),modes:modes('listen choice perform listen fingering perform perform perform annotate choice perform choice choice annotate perform'),guide:'Compare Fá natural e Fá sustenido; depois Si e Si bemol. Confira as posições das alterações na tabela do fabricante para seu sistema; a escrita e a escuta aqui mantêm a alteração.',reflection:'Qual alteração e qual transição você precisou conferir?'},
 11:{pool:[71,69,67,72,74],phrase:sync,alternative:six,modes:modes('tap tap perform choice compose tap perform tap perform choice perform compose choice perform tap'),guide:'Em 6/8, sinta dois tempos, cada um com três colcheias. Na síncopa, mantenha a contagem estável; a ligadura prolonga a mesma nota sem novo ataque.',reflection:'Como você diferenciou os três tempos de 3/4 dos dois tempos de 6/8?'},
 12:{pool:[60,62,64,65,67,69,71,72,74],phrase:phrase([71,69,67,69,71,72,74,null]),modes:modes('listen listen perform choice choice reflect perform perform ensemble annotate annotate reflect choice perform reflect'),guide:'Localize o problema: nota, ritmo ou entrada. Isole um trecho, reduza o andamento, repita com um objetivo e volte à frase.',reflection:'Qual problema você isolou, qual estratégia usou e que diferença percebeu?'},
 13:{pool:[60,62,64,65,67,69,71,72,74],phrase:tune,modes:modes('listen reflect perform choice reflect listen perform annotate perform annotate reflect reflect choice ensemble perform'),guide:'Toque a mesma frase com duas intenções e compare os finais. As escolhas de caráter e estilo são suas: o microfone não julga estilo.',reflection:'Que intenção musical você escolheu e como mudou sua interpretação?'},
 14:{pool:[67,69,71,72,74],phrase:timed([71,1],[69,1],[67,2]),alternative:timed([71,.5],[72,.5],[71,.5],[69,.5],[67,2]),modes:modes('listen annotate perform choice choice choice perform perform listen annotate compose perform choice reflect perform'),guide:'Escute a melodia simples e a ornamentada. Preserve as notas principais e o compasso; experimente lentamente antes de recolocar o ornamento.',reflection:'Qual ornamento você manteve ou retirou e por quê?'},
 15:{pool:[60,62,64,65,66,67,69,70,71,72,74],phrase:tune,alternative:tune.map(n=>({...n,midi:n.midi===null?null:n.midi-2})),modes:modes('listen perform annotate listen choice perform compose compose ensemble compose reflect compose choice reflect ensemble'),guide:'Compare as duas posições da melodia. Escolha uma extensão confortável; distribua melodia, acompanhamento, introdução e final sem perder a ideia principal.',reflection:'Que adaptação de altura, ritmo ou função musical ajudou seu grupo?'},
 16:{pool:[60,62,64,65,66,67,69,70,71,72,74],phrase:[...tune,...duo],modes:modes('choice reflect annotate reflect reflect reflect perform perform perform reflect perform reflect ensemble reflect reflect'),guide:'Escolha repertório confortável, defina duas prioridades e prepare entradas e transições. Simule uma apresentação e revise uma decisão observável.',reflection:'Qual evidência mostra o que avançou e qual será seu próximo objetivo?'},
};
export function barBeats(meter:CourseMeter){const [n,d]=meter.split('/').map(Number);return n*4/d;}
export function pulseBeats(meter:CourseMeter){return meter==='6/8'?1.5:1;}
export function courseNote(midi:number):PracticeNote{return {id:'full-recorder-'+midi,writtenMidi:midi,label:midi===70?'Si♭ 4':midi===66?'Fá♯ 4':formatWrittenNote(midi),valves:[],valveDescription:'',transposeSemitones:12};}
export function validatePhrase(notes:readonly CourseNote[],meter:CourseMeter,pool?:readonly number[]):boolean{
 if(!notes.length||notes.length>128)return false;let at=0;const bar=barBeats(meter);
 for(const n of notes){if(!n||typeof n!=='object'||![.5,1,1.5,2,3,4].includes(n.beats)||n.midi!==null&&(!Number.isInteger(n.midi)||n.midi<60||n.midi>74||pool&&!pool.includes(n.midi))||at%bar+n.beats>bar+1e-6)return false;at+=n.beats;}
 return at>0&&Math.abs(at%bar)<1e-6;
}
const QUESTIONS:Record<string,[string,string[],number]>={
 '2-2':['Qual dedo muda de Si para Lá?',['Médio esquerdo, no furo 2','Indicador direito, no furo 4','Polegar direito'],0],
 '2-5':['Qual caminho corresponde ao exemplo principal?',['Si · Lá, depois Lá · Si','Lá · Si, depois Si · Lá','Sol · Lá · Si · pausa'],0],
 '2-10':['Qual nota escrita fica na terceira linha da pauta em clave de sol?',['Lá','Si','Sol'],1],
 '3-4':['O exemplo principal desce ou sobe?',['Desce: Si, Lá, Sol','Sobe: Sol, Lá, Si','Repete sempre Sol'],0],
 '3-5':['Em que tempo está o silêncio do exemplo principal?',['No segundo','No terceiro','No quarto'],2],
 '3-6':['Qual cartão corresponde a Si, Lá, Sol e silêncio?',['Três notas e uma pausa de um tempo','Quatro notas sem pausa','Uma semibreve'],0],
 '3-10':['Qual nota fica na segunda linha da pauta em clave de sol?',['Sol','Si','Ré'],0],
 '3-11':['O que fazer no tempo com uma pausa de semínima?',['Acrescentar um tempo depois','Manter a contagem em silêncio','Sustentar a nota anterior'],1],
 '4-2':['Qual grupo de notas reaparece no início da peça?',['Si, Lá, Sol','Dó, Ré, Mi','Fá, Mi, Ré'],0],
 '4-4':['Quanto dura uma mínima em 4/4, com a semínima como tempo?',['Um tempo','Dois tempos','Quatro tempos'],1],
 '5-5':['Como caminha o trecho Sol, Fá, Mi?',['Desce','Sobe','Repete a mesma altura'],0],
 '5-10':['Qual é a nota mais grave entre estas?',['Sol4','Mi4','Dó4'],2],
 '6-4':['Qual figura ocupa metade de um tempo em 4/4?',['Mínima','Colcheia','Semibreve'],1],
 '6-10':['Quantas semínimas completam 3/4?',['Duas','Três','Quatro'],1],
 '7-4':['Como reconhecer duas notas ligadas no exemplo?',['Pela continuidade entre alturas','Por uma pausa extra entre todas','Pelo volume máximo'],0],
 '8-4':['Quando começa a entrada combinada?',['Antes da contagem','Depois da contagem de preparação','Em qualquer instante'],1],
 '8-5':['Se uma voz se adianta à outra, o que revisar primeiro?',['A entrada e a contagem','A cor do instrumento','Aumentar a força do sopro'],0],
 '8-6':['Como retomar um duo após um desencontro?',['Combinar um ponto e contar a entrada','Cada um retomar sozinho','Sempre tocar mais rápido'],0],
 '9-2':['Qual exemplo está na região mais aguda?',['O principal, com Si, Dó e Ré acima','A alternativa, com Dó, Ré e Mi graves','Os dois têm a mesma altura'],0],
 '9-5':['No Ré5 deste exemplo, como fica o polegar esquerdo?',['Aberto','Totalmente fechado','Fora do instrumento com todos os dedos'],0],
 '9-10':['Entre estas notas escritas, qual fica mais acima na pauta?',['Sol4','Si4','Ré5'],2],
 '10-2':['Qual modelo começa com Fá sustenido?',['Modelo A','Modelo B','Os dois começam com Si bemol'],1],
 '10-10':['Qual sinal eleva a nota em um semitom?',['Bemol','Sustenido','Bequadro'],1],
 '10-12':['A armadura de Sol maior tem qual alteração?',['Um Fá sustenido','Um Si bemol','Nenhuma'],0],
 '11-4':['O que distingue uma síncopa neste estudo?',['Sustentar a nota iniciada fora do apoio, mantendo a contagem','Parar a contagem','Acrescentar uma pausa em cada nota'],0],
 '11-10':['O que faz a ligadura de prolongamento entre notas da mesma altura?',['Soma as durações, sem novo ataque','Transforma a nota em pausa','Aumenta a altura'],0],
 '12-4':['As notas estão certas, mas uma voz começa antes da outra. Qual o problema?',['Entrada','Altura da nota','Tessitura'],0],
 '12-5':['Como estudar um desencontro localizado?',['Isolar, tocar lentamente e reintegrar','Repetir só a peça inteira, sempre mais rápido','Apertar mais a flauta'],0],
 '13-4':['Qual escolha ajuda a produzir uma frase mais contínua?',['Combinar ligações e respirações nas fronteiras da ideia','Pausar a cada nota sem combinar','Tocar sempre com força máxima'],0],
 '14-4':['O ornamento deve preservar principalmente o quê?',['A nota principal e a organização do tempo','A maior quantidade possível de notas','Uma pausa extra obrigatória'],0],
 '14-5':['Qual sinal de problema pede reduzir o ornamento?',['Ele faz perder a contagem e a nota principal','Ele cabe no compasso','Ele foi preparado lentamente'],0],
 '14-6':['Como escolher uma versão ornamentada?',['Pelo caráter e pela clareza da frase','Sempre a mais rápida','Sempre com todos os ornamentos'],0],
 '15-5':['Qual adaptação é mais adequada?',['A que mantém a ideia em uma extensão confortável','A que exige forçar notas ainda não preparadas','Qualquer versão, sem ouvir'],0],
 '16-1':['Qual repertório escolher para apresentar?',['Uma peça preparada, com extensão e ritmo confortáveis','A mais difícil disponível, sem ensaio','Somente uma peça nunca ouvida'],0],
};
function material(module:number,index:number,assessment=false):CourseMaterial{
 const r=RECIPES[module],mode=assessment?(['choice','perform','reflect'] as CourseMode[])[index]:r.modes[index];
 let notes=r.phrase.map(n=>({...n})),meter:CourseMeter=r.meter??'4/4';
 if(module===2&&[3,4,5].includes(index))notes=phrase([71,69,69,71]);
 if(module===2&&index===7)notes=phrase([71,69,71,69]);
 if(module===5&&index===3)notes=phrase([64,null,64,null]);
 if(module===5&&index===6)notes=phrase([62,null,62,null]);
 if(module===5&&index===7)notes=phrase([60,null,60,null]);
 if(module===6&&index===6){meter='2/4';notes=phrase([71,69]);}
 if(module===6&&index===7){meter='3/4';notes=phrase([71,69,67]);}
 if(module===10&&[0,1].includes(index))notes=phrase([65,67,69,67]);
 if(module===10&&index===2)notes=phrase([66,null,66,null]);
 if(module===10&&index===3)notes=phrase([71,71,71,null]);
 if(module===10&&[4,5].includes(index))notes=phrase([71,70,71,70]);
 if(module===10&&index===7)notes=r.alternative!.map(n=>({...n}));
 if(!assessment&&module===12&&[0,1].includes(index))notes=[{midi:71,beats:4}];
 if(module===11&&[7,8,10,11,12,13].includes(index)){meter='6/8';notes=six.map(n=>({...n}));}
 if(module===11&&index===14){meter='3/4';notes=phrase([71,69,67]);}
 if(module===4&&[2,6].includes(index))notes=notes.slice(0,8);
 if(module===4&&index===7)notes=notes.slice(8);
 if(module===9&&[2,6].includes(index))notes=phrase([72,null,74,null]);
 if(assessment&&module===8)notes=[...duo,...duo];
 const specific=QUESTIONS[`${module}-${index+1}`];
 const fallback:[string,string[],number]=['Qual estratégia ajuda nesta situação?',[r.guide,'Tocar mais rápido sem conferir o trecho','Forçar o sopro e seguir sem escutar'],0];
 const q=specific??fallback;
 const slur=module===7&&[7,8,9,10,11,13,14].includes(index)||module===13&&[7,9,10,13,14].includes(index);
 let alternative=meter==='6/8'?six.slice().reverse():meter!=='4/4'?notes.slice().reverse():module===11?phrase([71,69,67,null]):r.alternative??r.phrase.slice().reverse();
 if(module===10&&[0,1].includes(index))alternative=phrase([66,67,69,67]);
 if(module===10&&index===3)alternative=phrase([70,70,70,null]);
 if(!assessment&&module===12&&[0,1].includes(index))alternative=[{midi:71,beats:4}];
 return {mode,notes,alternative:alternative.map(n=>({...n,tie:false})),pool:r.pool,meter,guide:r.guide,reflection:r.reflection,question:mode==='choice'?q[0]:undefined,options:mode==='choice'?q[1]:undefined,answer:mode==='choice'?q[2]:undefined,slur,gate:slur?.98:module===7||module===13?.6:.91,guided:[7,8,9,12,13,14,15,16].includes(module)};
}
function assessmentMaterial(section:number,index:number):CourseMaterial{
 const m=material(section*4,index,true);
 if(section===1&&index===0){m.question='Qual é o início do exemplo ouvido?';m.options=['Si, Lá, Sol','Sol, Lá, Si','Ré, Mi, Fá'];m.answer=0;}
 if(section===1&&index===2){m.mode='perform';m.notes=phrase([69,71,67,69,71,69,67,null,67,69,71,null,69,67,67,null]);m.reflection='Que estratégia você usou para preparar esta variação nova?';}
 if(section===2&&index===0){m.question='Qual cartão corresponde ao começo da voz principal?';m.options=['Sol, pausa, Sol, pausa','Si, Lá, Sol, Lá','Uma única mínima'];m.answer=0;}
 if(section===2&&index===1)m.notes=[...duo,...duo];
 if(section===2&&index===2){m.mode='ensemble';m.notes=duo;}
 if(section===3&&index===0){m.question='Compare os modelos A e B. O que muda na terceira nota?';m.options=['A altura: Sol foi trocado por Fá','Somente o andamento','Somente a entrada'];m.answer=0;m.alternative=m.notes.map((n,i)=>i===2?{...n,midi:65}:n);}
 if(section===3&&index===1){m.notes=[...phrase([71,72,74,null]),...timed([74,1],[72,.5],[71,.5],[69,1],[66,1]),...phrase([67,69,71,72]),...timed([71,2],[69,1],[67,1])];m.pool=[...m.pool,66];}
 const reflections:Record<number,string[]>={1:['Quais notas, contorno e pausas você reconheceu no exemplo?','Onde você planejou respirar na peça e como preparou a entrada?','Que estratégia você usou para preparar esta variação nova?'],2:['Qual detalhe da escrita ajudou a relacionar a partitura ao exemplo?','Como você organizou a articulação e a respiração na melodia?','Qual ponto de encontro e qual contagem vocês combinaram no duo?'],3:['Qual problema você localizou e qual estratégia escolheu para estudá-lo?','Qual passagem reúne os recursos técnicos e rítmicos que você preparou?','Registre o plano, o que fez e uma diferença observável entre antes e depois.'],4:['Qual programa, entradas e transições você preparou para a apresentação?','Explique as decisões de tessitura, respiração, estrutura e expressão da sua versão.','Que mudança musical você recebeu, como adaptou o trecho e qual será seu próximo objetivo?']};
 m.reflection=reflections[section][index];
 if(section===4&&index===0)m.mode='ensemble';
 if(section===4&&index===1)m.mode='compose';
 m.guided=true;return m;
}
export const COURSE_MODULES=plan.sections.flatMap(s=>s.modules.map(m=>({...m,section:s.number,sectionTitle:s.title,level:s.level})));
export const COURSE_TASKS:CourseTask[]=plan.sections.flatMap(s=>[
 ...s.modules.flatMap(m=>m.microLessons.flatMap(l=>l.activities.map((a,i)=>({id:a.id,task:a.task,module:m.number,section:s.number,lesson:l.id,lessonName:l.name,moduleTitle:m.title,assessment:false,material:material(m.number,(l.number-1)*3+i)})))),
 ...s.assessments.map((a,i)=>({id:a.id,task:a.task,module:s.number*4,section:s.number,lesson:`${s.id}-assessment`,lessonName:a.title,moduleTitle:`Avaliação · ${s.title}`,assessment:true,material:assessmentMaterial(s.number,i)})),
]);
export const COURSE_IDS=[...plan.diagnostic.map(d=>d.id),...COURSE_TASKS.map(t=>t.id)];
export function courseTask(id:string){return COURSE_TASKS.find(t=>t.id===id);}
export function courseScoreEvents(notes:readonly CourseNote[],meter:CourseMeter):ScoreEvent[]{
 const events:ScoreEvent[]=[];let beat=0;
 for(let index=0;index<notes.length;index++){
  const n=notes[index],start=beat;let length=n.beats;
  while(notes[index]?.tie&&notes[index+1]?.midi===n.midi){index++;length+=notes[index].beats;}
  events.push({id:'event-'+events.length,kind:n.midi===null?'rest':'note',note:n.midi===null?null:courseNote(n.midi),startBeat:start,beats:length,measureIndex:Math.floor(start/barBeats(meter)),segments:[{cursorIndex:events.length,startBeat:start,beats:length}]});beat+=length;
 }
 return events;
}
/**
 * Correção pelo microfone, pensada para criança estudando sozinha: confere a NOTA (±50 cents) no miolo
 * de cada figura e o SILÊNCIO nas pausas. Entrar um tiquinho atrasado, soltar um pouco antes ou ter um
 * quadro de ar no meio não reprova. Sem sinal nenhum, nada é aprovado.
 */
/** `transpose`: semitons entre a nota escrita e o som (flauta +12; trompete e clarinete em Si♭ −2). */
export function evaluateCourse(notes:readonly CourseNote[],meter:CourseMeter,samples:readonly ScoreSample[],bpm:number,startAt:number,transpose=12){
 const quarter=60000/(bpm*pulseBeats(meter));
 // O microfone e a criança chegam um tiquinho depois do clique: a janela da nota anda junto (atraso),
 // e notas curtas (colcheia) só precisam de um trechinho afinado, não do tempo inteiro.
 const LAG=120,EARLY=100,SAMPLE=90;
 const finite=(s:ScoreSample)=>Number.isFinite(s.at);
 return courseScoreEvents(notes,meter).map(e=>{
  const start=startAt+e.startBeat*quarter,end=start+e.beats*quarter,len=end-start;
  const verdict=(passed:boolean,reason:'signal'|'rest'|'note'|'tuning'|null,message:string)=>({eventId:e.id,measureIndex:e.measureIndex,passed,reason,message,onsetErrorMs:null,releaseErrorMs:null});
  if(e.kind==='rest'){
   const pad=Math.min(300,len*.3),inner=samples.filter(s=>finite(s)&&s.at>=start+pad+LAG*.5&&s.at<=end-Math.min(150,len*.15));
   if(inner.length<2&&len>=600)return verdict(false,'signal','O microfone não ouviu esse trecho. Toque mais perto dele.');
   if(!inner.length)return samples.some(s=>finite(s)&&s.at>=start&&s.at<=end)?verdict(true,null,'Pausa respeitada.'):verdict(false,'signal','O microfone não ouviu esse trecho.');
   const quiet=inner.filter(s=>s.frequency===null).length/inner.length;
   return quiet>=.6?verdict(true,null,'Pausa respeitada.'):verdict(false,'rest','Na pausa, pare o ar.');
  }
  const pad=Math.min(250,len*.2),inner=samples.filter(s=>finite(s)&&s.at>=start+pad-EARLY&&s.at<=end+LAG);
  if(!samples.some(s=>finite(s)&&s.at>=start&&s.at<=end))return verdict(false,'signal','O microfone não ouviu esse trecho. Toque mais perto dele.');
  const target=targetFrequencyFor({...e.note!,transposeSemitones:transpose}),off=(s:ScoreSample)=>s.frequency!==null&&Number.isFinite(s.frequency)&&s.frequency>0?Math.abs(1200*Math.log2(s.frequency/target)):Infinity;
  const tuned=inner.filter(s=>off(s)<=50).length,needed=Math.max(2,Math.round(len*.4/SAMPLE));
  if(tuned>=Math.min(needed,Math.max(2,Math.round(inner.length*.55))))return verdict(true,null,'Nota certa.');
  // Qual nota saiu? (mediana dos quadros com som) — ajuda a criança a saber o que corrigir.
  const heard=inner.flatMap(s=>s.frequency!==null&&Number.isFinite(s.frequency)&&s.frequency>0?[s.frequency]:[]).sort((x,y)=>x-y);
  const got=heard.length>=2?Math.round(69+12*Math.log2(heard[Math.floor(heard.length/2)]/440))-transpose:null;
  const want=e.note!.writtenMidi;
  const wrong=got!==null&&got!==want?{midi:got,name:formatWrittenNote(got).replace(/ \d$/,''),dir:got>want?'agudo':'grave'}:null;
  if(wrong)return {...verdict(false,'note',`Saiu ${wrong.name} em vez de ${e.note!.label.replace(/ \d$/,'')}. ${wrong.dir==='agudo'?'Som mais agudo que o pedido: algum furo tá deixando o ar escapar. Confira se cada furo do dedilhado tá bem fechado.':'Som mais grave que o pedido: confira se não fechou furo a mais e sopre um tiquinho mais firme.'}`),heardMidi:wrong.midi};
  return inner.some(s=>off(s)<=110)?verdict(false,'tuning','Quase: confira se os furos estão bem fechados e sopre mais leve.'):verdict(false,'note',`Estamos procurando ${e.note!.label}.`);
 });
}
export type CourseReport='pratiquei'|'apoio'|'depois';
export type CourseResponse={id:string;at:string;report:CourseReport;answer?:number;reflection?:string;marks?:number[];composition?:CourseNote[];modelPlayed?:boolean;modelsHeard?:number[];referencePlayed?:boolean;manual?:boolean;attempted?:boolean;matched?:number;total?:number;rubric?:string;system?:'baroque'|'german'};
export type CourseLedger={version:1;responses:Record<string,CourseResponse>};
export function emptyCourse():CourseLedger{return {version:1,responses:{}};}
export function reconstructionMatches(task:CourseTask,notes:readonly CourseNote[]){
 const compact=(phrase:readonly CourseNote[])=>courseScoreEvents(phrase,task.material.meter).map(e=>[e.kind,e.note?.writtenMidi??null,e.beats]);
 return JSON.stringify(compact(notes))===JSON.stringify(compact(task.material.notes));
}
export function canRecordCourse(task:CourseTask,response:CourseResponse){
 if(response.report!=='pratiquei')return ['apoio','depois'].includes(response.report);
 const m=task.material;
 if(task.assessment&&(!response.rubric||(response.reflection?.trim().length??0)<12))return false;
 if(m.mode==='choice')return response.answer===m.answer&&(!/ouvid|escuta|sonoro|exempl/i.test(task.task)||response.modelPlayed===true);
 if(m.mode==='listen'){const contrast=[2,7,9,10,12,13,14,15].includes(task.module);return response.manual===true||response.modelPlayed===true&&(!contrast||!!response.modelsHeard?.includes(0)&&!!response.modelsHeard?.includes(1));}
 if(m.mode==='compose'){
  if(!response.composition||!validatePhrase(response.composition,m.meter,m.pool)||response.modelPlayed!==true)return false;
  if(/ditado|padrão ouvido/i.test(task.task)&&(!response.referencePlayed||!reconstructionMatches(task,response.composition)))return false;
  if(task.id==='S1-M02-L04-A03'&&(response.composition.length!==4||response.composition.some(n=>n.beats!==1)||response.composition.filter(n=>n.midi===71).length!==2||response.composition.filter(n=>n.midi===69).length!==2))return false;
  if(task.id==='S1-M03-L04-A03'&&(response.composition.length!==4||response.composition.filter(n=>n.midi===null).length!==1||response.composition.some(n=>n.beats!==1)))return false;
  if(/tocar|executar|experimentar|reproduzir|apresentar/i.test(task.task)&&!response.manual&&!(response.attempted&&(response.total??0)>0&&response.matched===response.total))return false;
  return true;
 }
 if(m.mode==='annotate')return !!response.marks?.length;
 if(m.mode==='reflect')return (response.reflection?.trim().length??0)>=12;
 return response.manual===true||response.attempted===true&&(response.total??0)>0&&response.matched===response.total;
}
export function normalizeCourseResponse(value:unknown):CourseResponse|null{
 if(!value||typeof value!=='object')return null;const r=value as CourseResponse,t=courseTask(r.id);
 if(!t||t.module===1&&!t.assessment||!['pratiquei','apoio','depois'].includes(r.report)||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at)))return null;
 const clean:CourseResponse={id:t.id,at:r.at,report:r.report};
 if(r.system==='baroque'||r.system==='german')clean.system=r.system;
 if(Number.isInteger(r.answer)&&r.answer!>=0&&r.answer!<(t.material.options?.length??0))clean.answer=r.answer;
 if(typeof r.reflection==='string')clean.reflection=r.reflection.trim().slice(0,600);
 if(Array.isArray(r.modelsHeard)&&r.modelsHeard.length<=3&&r.modelsHeard.every(n=>[0,1,2].includes(n)))clean.modelsHeard=[...new Set(r.modelsHeard)];
 if(Array.isArray(r.marks)&&r.marks.length<=128&&r.marks.every(n=>Number.isInteger(n)&&n>=0&&n<t.material.notes.length))clean.marks=[...new Set(r.marks)];
 if(Array.isArray(r.composition)&&validatePhrase(r.composition,t.material.meter,t.material.pool))clean.composition=r.composition.map(n=>({midi:n.midi,beats:n.beats}));
 for(const key of ['modelPlayed','referencePlayed','manual','attempted'] as const)if(typeof r[key]==='boolean')clean[key]=r[key];
 if(Number.isInteger(r.total)&&r.total!>=0&&r.total!<=128&&Number.isInteger(r.matched)&&r.matched!>=0&&r.matched!<=r.total!){clean.matched=r.matched;clean.total=r.total;}
 if(typeof r.rubric==='string'&&['apoio-continuo','pistas','independente','transferencia'].includes(r.rubric))clean.rubric=r.rubric;
 return canRecordCourse(t,clean)?clean:null;
}
export function recordCourse(ledger:CourseLedger,response:CourseResponse):CourseLedger{const clean=normalizeCourseResponse(response);if(!clean)throw new Error('Registro desta atividade inválido.');return {version:1,responses:{...ledger.responses,[clean.id]:clean}};}
export function readCourse(storage:Pick<KeyValueStorage,'getItem'>):{ledger:CourseLedger;warning:string;safeToWrite:boolean}{
 const fail=()=>({ledger:emptyCourse(),warning:'Não foi possível ler os registros do curso completo. O conteúdo continua disponível; os dados existentes não serão substituídos.',safeToWrite:false});
 try{const raw=storage.getItem(RECORDER_FULL_KEY);if(!raw)return {ledger:emptyCourse(),warning:'',safeToWrite:true};if(raw.length>700000)return fail();
  const data=JSON.parse(raw);if(data.version!==1||!data.responses||typeof data.responses!=='object'||Array.isArray(data.responses))return fail();const ledger=emptyCourse();
  for(const [id,value] of Object.entries(data.responses)){const clean=normalizeCourseResponse(value);if(!clean||clean.id!==id)return fail();ledger.responses[id]=clean;}
  return {ledger,warning:'',safeToWrite:true};
 }catch{return fail();}
}
