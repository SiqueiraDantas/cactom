/**
 * Boas-vindas depois da escolha da oficina (formato Duolingo): perguntas do Tom, mini atividade
 * de partitura (só aquecimento: não mexe na trilha nem no rojão) e chegada na tela geral.
 * Gotas d’água (no lugar dos corações) e XP aparecem só dentro desta atividade, por decisão do responsável (02/11/2026),
 * e não são gravados no progresso.
 */
export type OnboardingAnswers={source?:string;reason?:string;level?:string;goal?:number;path?:'zero'|'nivel'};
export const ONBOARDING_KEY='cactom-onboarding-v1';
export function saveOnboarding(answers:OnboardingAnswers,storage:Pick<Storage,'setItem'>|undefined=globalThis.localStorage){
 try{storage?.setItem(ONBOARDING_KEY,JSON.stringify({...answers,savedAt:new Date().toISOString()}));}catch{/* armazenamento indisponível: segue sem guardar */}
}

export type Choice={id:string;label:string;icon:string};
export const SOURCES:Choice[]=[
 {id:'instagram',label:'Instagram',icon:'camera'},{id:'amigos',label:'Amigos ou família',icon:'people'},
 {id:'youtube',label:'YouTube',icon:'video'},{id:'escola',label:'Escola ou professor',icon:'school'},
 {id:'tiktok',label:'TikTok',icon:'note'},{id:'busca',label:'Busca na internet',icon:'search'},
 {id:'outro',label:'Outros',icon:'dots'},
];
export const REASONS:Choice[]=[
 {id:'banda',label:'Tocar numa banda ou fanfarra',icon:'drum'},{id:'diversao',label:'Me divertir',icon:'party'},
 {id:'igreja',label:'Tocar na igreja',icon:'church'},{id:'mente',label:'Exercitar a mente',icon:'brain'},
 {id:'estudos',label:'Avançar nos estudos',icon:'book'},{id:'carreira',label:'Seguir carreira na música',icon:'case'},
 {id:'outro',label:'Outro',icon:'dots'},
];
export const LEVELS:Choice[]=[
 {id:'0',label:'Nunca estudei música',icon:'0'},{id:'1',label:'Conheço o nome de algumas notas',icon:'1'},
 {id:'2',label:'Leio partituras simples',icon:'2'},{id:'3',label:'Toco algumas músicas',icon:'3'},
 {id:'4',label:'Leio e toco com segurança',icon:'4'},
];
export const GOALS=[{min:5,label:'Casual'},{min:10,label:'Regular'},{min:15,label:'Intensa'},{min:20,label:'Puxada'}] as const;

export type Pitch='C4'|'D4'|'E4'|'F4'|'G4'|'A4'|'B4'|'C5'|'D5'|'E5'|'F5';
export const NOTE_NAME:Record<Pitch,string>={C4:'Dó',D4:'Ré',E4:'Mi',F4:'Fá',G4:'Sol',A4:'Lá',B4:'Si',C5:'Dó',D5:'Ré',E5:'Mi',F5:'Fá'};
/** Passos acima da linha de baixo da pauta (Mi4) na clave de sol. */
export const STAFF_STEP:Record<Pitch,number>={C4:-2,D4:-1,E4:0,F4:1,G4:2,A4:3,B4:4,C5:5,D5:6,E5:7,F5:8};
export type Figure='semibreve'|'minima'|'seminima'|'colcheia';
export const FIGURE_NAME:Record<Figure,string>={semibreve:'Semibreve',minima:'Mínima',seminima:'Semínima',colcheia:'Colcheia'};
export type Art={kind:'note';pitch:Pitch}|{kind:'figure';figure:Figure};
export type QuizOption={id:string;label?:string;art?:Art};
export type QuizQuestion={id:string;tag?:string;prompt:string;art?:Art;options:QuizOption[];answer:string;layout:'cards'|'list'};

const note=(pitch:Pitch,label=false):QuizOption=>({id:pitch,art:{kind:'note',pitch},label:label?NOTE_NAME[pitch]:undefined});
const fig=(figure:Figure,label=false):QuizOption=>({id:figure,art:{kind:'figure',figure},label:label?FIGURE_NAME[figure]:undefined});
const text=(id:string,label:string):QuizOption=>({id,label});

export const QUIZ_EASY:QuizQuestion[]=[
 {id:'sol',tag:'NOTA NOVA',prompt:'Qual destas é a nota Sol?',layout:'cards',options:[note('E4',true),note('G4',true),note('C4',true)],answer:'G4'},
 {id:'mi',prompt:'Qual destas é a nota Mi?',layout:'cards',options:[note('G4'),note('A4'),note('E4')],answer:'E4'},
 {id:'seminima',tag:'FIGURA NOVA',prompt:'Qual destas é a semínima?',layout:'cards',options:[fig('minima',true),fig('seminima',true),fig('semibreve',true)],answer:'seminima'},
 {id:'tempo',prompt:'Quantos tempos vale a semínima?',art:{kind:'figure',figure:'seminima'},layout:'list',options:[text('1','1 tempo'),text('2','2 tempos'),text('4','4 tempos')],answer:'1'},
];
export const QUIZ_HARD:QuizQuestion[]=[
 {id:'do',prompt:'Que nota é esta?',art:{kind:'note',pitch:'C5'},layout:'list',options:[text('A4','Lá'),text('C5','Dó'),text('F4','Fá')],answer:'C5'},
 {id:'minima',prompt:'Qual figura vale 2 tempos?',layout:'cards',options:[fig('seminima'),fig('colcheia'),fig('minima')],answer:'minima'},
 {id:'aguda',prompt:'Qual destas notas é a mais aguda?',layout:'cards',options:[note('E4'),note('D5'),note('B4')],answer:'D5'},
 {id:'fa',prompt:'Que nota é esta?',art:{kind:'note',pitch:'F4'},layout:'list',options:[text('G4','Sol'),text('E4','Mi'),text('F4','Fá')],answer:'F4'},
];
/** Começar do zero: bloco fácil + 2 difíceis. Encontrar meu nível: bloco fácil + 4 difíceis. Nenhum dos dois muda a trilha. */
export function quizFor(path:'zero'|'nivel'){return {easy:QUIZ_EASY,hard:path==='zero'?QUIZ_HARD.slice(0,2):QUIZ_HARD};}
export function optionAnswerLabel(option:QuizOption){
 if(option.label)return option.label;
 if(option.art?.kind==='note')return NOTE_NAME[option.art.pitch];
 if(option.art?.kind==='figure')return FIGURE_NAME[option.art.figure];
 return option.id;
}
export const QUIZ_HEARTS=5;
/** XP mostrado no fim da atividade (não é gravado): 10 por concluir + 1 por acerto de primeira. */
export function quizXp(correct:number){return 10+correct;}
export function accuracyLabel(percent:number){return percent>=100?'INCRÍVEL':percent>=80?'ÓTIMO':'BOM';}
