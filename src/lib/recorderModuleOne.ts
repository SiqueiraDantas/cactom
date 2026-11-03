import type {KeyValueStorage} from './profileStorage';

export const MODULE_ONE_KEY='cactom-recorder-module-01-v1';
export const MODULE_ONE_LESSONS=[
 {id:'S1-M01-L01',name:'Descobrir',title:'Prazer, sua flauta!',goal:'Conhecer as partes e encontrar uma posição confortável.',explanation:'Observe o bocal, o corpo e o pé. Imite a posição: mão esquerda em cima, direita embaixo. Segure com firmeza leve.',preparation:'Se os dedos não alcançam os furos sem esforço, peça ajuda para ajustar o instrumento.'},
 {id:'S1-M01-L02',name:'Discriminar',title:'Um som para escutar',goal:'Comparar duas emissões na mesma nota com quem orienta você.',explanation:'Peça ao professor dois modelos ao vivo de Si e uma característica para observar. Depois escolha um modelo e experimente.',preparation:'Esta lição precisa dessa demonstração. Sem professor agora, registre para retomar depois; não há comparação automática de timbre.'},
 {id:'S1-M01-L03',name:'Executar',title:'Seu primeiro Si',goal:'Preparar o Si e experimentar três sons curtos.',explanation:'Feche o furo 0 com o polegar esquerdo, atrás, e o furo 1 com o indicador esquerdo, na frente. Experimente ataques leves, com descanso entre os sons.',preparation:'O microfone é opcional e observa somente a altura aproximada do Si. Conforto, articulação e emissão precisam de acompanhamento.'},
 {id:'S1-M01-L04',name:'Ler e criar',title:'O cartão vira música',goal:'Relacionar SI ao dedilhado, entrar, parar e criar três entradas.',explanation:'Agora o cartão SI dá o sinal de tocar. Quando ele sai, pare. Depois você escolhe a duração de três entradas e experimenta sua ideia.',preparation:'O cartão é um sinal de entrada, sem compasso ou duração de figura musical. Você pode repetir sem limite.'},
 {id:'S1-M01-L05',name:'Aplicar e recuperar',title:'A flauta encontra sua voz',goal:'Resolver um problema, recuperar o Si e cuidar do instrumento.',explanation:'Escolha um ajuste confortável, prepare o Si sem copiar o desenho e experimente. Ao terminar, cuide da flauta conforme a orientação do fabricante.',preparation:'Não force o sopro nem os dedos. Peça orientação se houver desconforto ou dúvida sobre limpeza.'},
] as const;
export type ModuleOneLessonId=(typeof MODULE_ONE_LESSONS)[number]['id'];
export type ModuleOneTaskId=`${ModuleOneLessonId}-A0${1|2|3}`;
export type ModuleOneMode='parts'|'hands'|'comfort'|'models'|'identify'|'compare'|'fingering'|'sounds'|'adjust'|'associate'|'cue'|'create'|'story'|'recall'|'care';
export type ModuleOneTask={id:ModuleOneTaskId;title:string;prompt:string;hint:string;mode:ModuleOneMode};
export const MODULE_ONE_TASKS:readonly ModuleOneTask[]=[
 {id:'S1-M01-L01-A01',title:'Conheça as partes',prompt:'Explore o bocal, o corpo e o pé da flauta no desenho. Depois procure cada parte no seu instrumento.',hint:'O bocal fica junto à boca. O corpo tem os furos. O pé é a extremidade de baixo. Não desmonte à força.',mode:'parts'},
 {id:'S1-M01-L01-A02',title:'Cada mão em seu lugar',prompt:'Imite a posição de quem orienta você: mão esquerda em cima e direita embaixo. Qual mão fica em cima?',hint:'O polegar direito ajuda a apoiar por baixo, sem tapar o furo traseiro da mão esquerda.',mode:'hands'},
 {id:'S1-M01-L01-A03',title:'Firmeza sem apertar',prompt:'Segure a flauta sem soprar. Confira com quem acompanha você: ela fica estável sem apertar ou esticar os dedos?',hint:'Se houver tensão, faça uma pausa e peça ajuda para reorganizar o apoio. O aplicativo não enxerga suas mãos.',mode:'comfort'},
 {id:'S1-M01-L02-A01',title:'Duas maneiras de soar',prompt:'Peça ao professor dois modelos de emissão na mesma nota Si. Escute uma característica combinada, como continuidade do som.',hint:'Compare as duas emissões ao vivo. A referência eletrônica das outras atividades não demonstra qualidade de timbre.',mode:'models'},
 {id:'S1-M01-L02-A02',title:'Qual modelo você ouviu?',prompt:'Peça ao professor que repita os dois modelos e diga qual característica você deve procurar. Escolha o primeiro ou o segundo e converse sobre sua escolha.',hint:'O professor combina o contraste. Não existe uma resposta fixa nem um acerto automático para modelos feitos ao vivo.',mode:'identify'},
 {id:'S1-M01-L02-A03',title:'Experimente e compare',prompt:'Depois da demonstração ao vivo, experimente uma emissão curta de Si. Compare com o modelo e conte ao professor o que percebeu.',hint:'Mude uma coisa de cada vez. A escuta do professor é necessária para comparar emissão e timbre.',mode:'compare'},
 {id:'S1-M01-L03-A01',title:'Prepare o Si em silêncio',prompt:'No desenho, feche somente o furo 0, atrás, e o 1, na frente. Depois prepare o mesmo dedilhado na sua flauta, sem soprar.',hint:'Polegar esquerdo atrás; indicador esquerdo no primeiro furo da frente. O desenho não verifica seus dedos reais.',mode:'fingering'},
 {id:'S1-M01-L03-A02',title:'Três pequenos sons',prompt:'Prepare o Si e produza três sons curtos, com ataque leve. Pare entre eles e respire com conforto.',hint:'Se usar o microfone, espere o silêncio inicial. Um som contínuo conta uma vez; outra nota não conta como Si.',mode:'sounds'},
 {id:'S1-M01-L03-A03',title:'Um ajuste de cada vez',prompt:'Com o professor, escolha uma variável observada e repita o Si. Qual ajuste vocês combinaram?',hint:'Mude apenas o que foi observado, como apoio ou cobertura dos furos. O aplicativo não escolhe uma correção técnica pelo som.',mode:'adjust'},
 {id:'S1-M01-L04-A01',title:'SI: um nome, uma posição',prompt:'Associe o cartão SI à combinação de furos no desenho. Depois prepare essa posição na flauta.',hint:'SI: feche 0 e 1. Os demais furos ficam abertos. Essa posição inicial é igual nos sistemas barroco e germânico.',mode:'associate'},
 {id:'S1-M01-L04-A02',title:'O cartão dá a entrada',prompt:'Comece a sequência: toque Si quando o cartão aparecer e pare quando ele desaparecer.',hint:'Espere a preparação. O cartão passa de tocar para parar três vezes. Aqui não há partitura com tempos a cumprir.',mode:'cue'},
 {id:'S1-M01-L04-A03',title:'Crie suas três entradas',prompt:'Escolha uma duração para cada uma das três entradas. Apresente sua sequência por gestos e experimente com Si.',hint:'Convide alguém a seguir seus gestos. Os intervalos de descanso desta sequência são sua criação, não uma regra de partitura.',mode:'create'},
 {id:'S1-M01-L05-A01',title:'A flauta procura sua voz',prompt:'A flauta fez um som diferente do esperado. Qual é um primeiro passo confortável para ajudá-la?',hint:'Pare, confira o preparo com calma e mude uma variável com ajuda. Soprar ou apertar com força não é a solução.',mode:'story'},
 {id:'S1-M01-L05-A02',title:'Si, por sua conta',prompt:'Sem abrir o desenho primeiro, prepare e toque Si. Se precisar, use a pista e depois tente outra vez.',hint:'Recupere de memória: polegar esquerdo no furo 0 e indicador esquerdo no 1. Usar uma pista faz parte de aprender.',mode:'recall'},
 {id:'S1-M01-L05-A03',title:'Até o próximo som',prompt:'Com quem orienta você, faça a limpeza e a secagem recomendadas para o seu modelo. Marque os cuidados conferidos.',hint:'Siga o fabricante: materiais e modelos pedem cuidados diferentes. Não use água quente, produtos ou desmontagem sem orientação.',mode:'care'},
];
export const PARTS=['bocal','corpo','pe'] as const;
export const CARE=['orientacao','secagem','guardar'] as const;
export const ADJUSTMENTS=['apoio','cobertura','emissao'] as const;
export type ModuleOneEvidence={parts:string[];answer:string;holes:number[];liveModel:boolean;adjustment:string;care:string[];pattern:number[];cueFinished:boolean;hintUsed:boolean;siSounds:number};
export const freshModuleOneEvidence=():ModuleOneEvidence=>({parts:[],answer:'',holes:[],liveModel:false,adjustment:'',care:[],pattern:[1,1,1],cueFinished:false,hintUsed:false,siSounds:0});
export type ModuleOneReport='pratiquei'|'apoio'|'depois';
export type ModuleOneResponse={id:ModuleOneTaskId;at:string;report:ModuleOneReport;evidence:ModuleOneEvidence};
export type ModuleOneLedger={version:1;moduleId:'S1-M01';responses:Partial<Record<ModuleOneTaskId,ModuleOneResponse>>};
export const emptyModuleOne=():ModuleOneLedger=>({version:1,moduleId:'S1-M01',responses:{}});
export const siFingering=(holes:readonly number[])=>holes.length===2&&holes.includes(0)&&holes.includes(1);
export function canRecordModuleOne(task:ModuleOneTask,e:ModuleOneEvidence,report:string):boolean{
 if(report==='apoio'||report==='depois')return true;
 if(report!=='pratiquei')return false;
 switch(task.mode){
  case 'parts':return PARTS.every(part=>e.parts.includes(part));
  case 'hands':return e.answer==='esquerda';
  case 'comfort':return e.answer==='confortavel';
  case 'models':case 'compare':return e.liveModel;
  case 'identify':return e.liveModel&&['primeiro','segundo'].includes(e.answer);
  case 'fingering':case 'associate':return siFingering(e.holes);
  case 'adjust':return e.liveModel&&ADJUSTMENTS.includes(e.adjustment as typeof ADJUSTMENTS[number]);
  case 'cue':case 'create':return e.cueFinished;
  case 'story':return e.answer==='conferir';
  case 'care':return CARE.every(care=>e.care.includes(care));
  default:return true; // Physical practice is explicitly a report, never acoustic certification.
 }
}
export function normalizeModuleOneResponse(value:unknown):ModuleOneResponse|null{
 if(!value||typeof value!=='object')return null;
 const r=value as Partial<ModuleOneResponse>,task=MODULE_ONE_TASKS.find(t=>t.id===r.id),e=r.evidence;
 if(!task||typeof r.at!=='string'||!Number.isFinite(Date.parse(r.at))||!['pratiquei','apoio','depois'].includes(r.report??'')||!e||typeof e!=='object')return null;
 const allowedArray=(v:unknown,allowed:readonly unknown[],max:number)=>Array.isArray(v)&&v.length<=max&&new Set(v).size===v.length&&v.every(x=>allowed.includes(x));
 if(!allowedArray(e.parts,PARTS,3)||!allowedArray(e.holes,[0,1,2,3,4,5,6,7],8)||!allowedArray(e.care,CARE,3)||!['','esquerda','direita','confortavel','ajustar','primeiro','segundo','conferir','forcar','apertar'].includes(e.answer)||!['',...ADJUSTMENTS].includes(e.adjustment)||!Array.isArray(e.pattern)||e.pattern.length!==3||e.pattern.some(x=>x!==1&&x!==2)||!Number.isInteger(e.siSounds)||e.siSounds<0||e.siSounds>3||typeof e.liveModel!=='boolean'||typeof e.cueFinished!=='boolean'||typeof e.hintUsed!=='boolean')return null;
 // Store only relevant derived observations. Never raw input, timestamps, recordings or grades.
 const evidence=freshModuleOneEvidence();
 if(task.mode==='parts')evidence.parts=[...e.parts];
 if(['hands','comfort','identify','story'].includes(task.mode))evidence.answer=e.answer;
 if(['fingering','associate'].includes(task.mode))evidence.holes=[...e.holes];
 if(['models','identify','compare','adjust'].includes(task.mode))evidence.liveModel=e.liveModel;
 if(task.mode==='adjust')evidence.adjustment=e.adjustment;
 if(task.mode==='care')evidence.care=[...e.care];
 if(task.mode==='create')evidence.pattern=[...e.pattern];
 if(task.mode==='cue'||task.mode==='create')evidence.cueFinished=e.cueFinished;
 if(task.mode==='recall')evidence.hintUsed=e.hintUsed;
 if(['sounds','compare','adjust','recall'].includes(task.mode))evidence.siSounds=e.siSounds;
 if(!canRecordModuleOne(task,evidence,r.report!))return null;
 return {id:task.id,at:r.at,report:r.report!,evidence};
}
export function recordModuleOne(ledger:ModuleOneLedger,response:ModuleOneResponse):ModuleOneLedger{
 const normalized=normalizeModuleOneResponse(response);if(!normalized)throw new Error('Registro do Módulo 1 inválido.');
 return {...ledger,responses:{...ledger.responses,[normalized.id]:normalized}};
}
export function readModuleOne(storage:KeyValueStorage):{ledger:ModuleOneLedger;safeToWrite:boolean;warning:string}{
 const failure={ledger:emptyModuleOne(),safeToWrite:false,warning:'Não foi possível ler o Módulo 1 salvo. Os dados anteriores serão preservados; esta sessão fica em memória.'};
 try{const raw=storage.getItem(MODULE_ONE_KEY);if(raw===null)return {ledger:emptyModuleOne(),safeToWrite:true,warning:''};if(raw.length>90000)return failure;
  const parsed=JSON.parse(raw) as Partial<ModuleOneLedger>;
  if(!parsed||parsed.version!==1||parsed.moduleId!=='S1-M01'||!parsed.responses||typeof parsed.responses!=='object'||Array.isArray(parsed.responses))return failure;
  const ledger=emptyModuleOne();for(const [key,value] of Object.entries(parsed.responses)){const response=normalizeModuleOneResponse(value);if(!response||response.id!==key)return failure;ledger.responses[response.id]=response;}
  return {ledger,safeToWrite:true,warning:''};
 }catch{return failure;}
}

/** Three distinct short Si sounds, with real silence between them. No octave folding. */
export type FirstSiState={count:number;holdSince:number|null;quietSince:number|null;waitingRelease:boolean;lastAt:number|null};
export const freshFirstSi=():FirstSiState=>({count:0,holdSince:null,quietSince:null,waitingRelease:true,lastAt:null});
export type FirstSiInput={at:number;frequency:number|null;clarity:number;rms:number;quiet:boolean};
export function advanceFirstSi(previous:FirstSiState,input:FirstSiInput,goal=3):FirstSiState{
 if(!Number.isFinite(input.at)||previous.lastAt!==null&&input.at<=previous.lastAt)return previous;
 const gap=previous.lastAt!==null&&input.at-previous.lastAt>240;
 let state={...previous,lastAt:input.at,...(gap?{holdSince:null,quietSince:null}:{})};
 if(state.count>=goal)return state;
 if(input.quiet&&Number.isFinite(input.rms)&&input.rms<.008){
  const quietSince=state.quietSince??input.at;
  return {...state,holdSince:null,quietSince,waitingRelease:state.waitingRelease&&input.at-quietSince<180};
 }
 state={...state,quietSince:null};
 const frequency=input.frequency;
 const cents=frequency&&Number.isFinite(frequency)?1200*Math.log2(frequency/(440*2**(14/12))):Infinity;
 const valid=frequency!==null&&Number.isFinite(frequency)&&Number.isFinite(input.clarity)&&input.clarity>=.85&&Number.isFinite(input.rms)&&input.rms>=.008&&Math.abs(cents)<=45;
 if(state.waitingRelease||!valid)return {...state,holdSince:null};
 const holdSince=state.holdSince??input.at;
 return input.at-holdSince>=270?{...state,count:state.count+1,holdSince:null,waitingRelease:true}:{...state,holdSince};
}

export type CuePhase={kind:'prepare'|'play'|'rest'|'finished';index:number;progress:number};
/** Free signal game, not a metrical score. Everything advances left to right. */
export function moduleOneCue(elapsedMs:number,pattern:readonly number[]):CuePhase{
 let elapsed=Math.max(0,elapsedMs)-2000;
 if(elapsed<0)return {kind:'prepare',index:0,progress:Math.max(0,elapsedMs)/2000};
 for(let index=0;index<3;index++){
  const duration=(pattern[index]===2?2:1)*1000;
  if(elapsed<duration)return {kind:'play',index,progress:elapsed/duration};
  elapsed-=duration;
  if(elapsed<1200)return {kind:'rest',index,progress:elapsed/1200};
  elapsed-=1200;
 }
 return {kind:'finished',index:2,progress:1};
}
