import type {CourseNote,CourseMeter} from './recorderFullCourse.ts';
import type {KeyValueStorage} from './profileStorage.ts';
import {overviewOf,type JourneyOverview} from './journeyOverview.ts';
import {STOP_KINDS,createJourneyEngine,normalizeJourney,readJourney,writeJourney,lessonXp,type Evidence,type JourneyStop,type LessonOutcome} from './recorderJourney.ts';

/**
 * Curso de Iniciação Musical: para quem ainda não tem instrumento. Tudo se responde tocando na tela
 * (escolher, bater o ritmo no botão, montar o compasso). Mesmo molde dos outros cursos: 16 unidades,
 * 4 áreas por unidade (Descoberta, Prática, Criação, Missão), 5 lições com 3 atividades cada
 * (descoberta P1 + aplicação P2) e desafio no fim de cada seção. Plano em docs/PLANO-INICIACAO.md.
 *
 * Seção 1 · O som (pulso, agudo/grave, longo/curto, forte/piano), sem partitura.
 * Seção 2 · Notas e figuras: nomes das notas, pauta na clave de Sol, figuras e pausas, e as duas claves.
 * Seções 3 e 4 · Na unidade 9 a pessoa escolhe a clave (Sol ou Fá) e segue lendo nela.
 */
export type Clef='sol'|'fa';
export const CLEF_KEY='cactom-iniciacao-clave';
export function readClef(store:Pick<KeyValueStorage,'getItem'>):Clef|null{try{const v=store.getItem(CLEF_KEY);return v==='sol'||v==='fa'?v:null;}catch{return null;}}
export function saveClef(store:Pick<KeyValueStorage,'setItem'>,clef:Clef){try{store.setItem(CLEF_KEY,clef);}catch{/* sem armazenamento */}}
/** A partir desta unidade a leitura é na clave escolhida. */
export const CLEF_UNIT=9;

/* ---------- Notas ---------- */
const BASE=['Dó','Dó♯','Ré','Ré♯','Mi','Fá','Fá♯','Sol','Sol♯','Lá','Si♭','Si'];
/** Nome da nota no curso: notas da 2ª oitava da clave de Sol viram “agudo”; abaixo do Dó3 na de Fá, “grave”. */
export function iniName(midi:number):string{const b=BASE[midi%12];if(midi>=72)return `${b} agudo`;if(midi<48)return `${b} grave`;return b;}
/** Notas para ouvir na seção 1 (sem partitura): região confortável, do Dó ao Dó agudo. */
const EAR=[60,62,64,65,67,69,71,72];
/** Leitura na seção 2 (clave de Sol, antes da escolha). */
const SOL_EARLY:Record<number,number[]>={6:[67,64,65],7:[60,62]};
/** Notas novas por unidade em cada clave (seções 3 e 4). Fá: começa no Fá (4ª linha), a nota que dá nome à clave. */
const NEW_NOTES:Record<Clef,Record<number,number[]>>={
 sol:{9:[69,71],10:[72],11:[74],12:[76],13:[77],14:[79],15:[],16:[]},
 fa:{9:[53,55,52],10:[50],11:[48],12:[57],13:[59],14:[47,45],15:[43],16:[]},
};
/** Notas que a pessoa já leu até a unidade (na clave escolhida). */
export function readingPool(unit:number,clef:Clef):number[]{
 if(unit<6)return [];
 if(unit<CLEF_UNIT)return Object.entries(SOL_EARLY).filter(([u])=>Number(u)<=unit).flatMap(([,n])=>n);
 const early=clef==='sol'?[67,64,65,60,62]:[];
 return [...early,...Object.entries(NEW_NOTES[clef]).filter(([u])=>Number(u)<=unit).flatMap(([,n])=>n)];
}
function newNotesOf(unit:number,clef:Clef):number[]{if(unit<6)return [];if(unit<CLEF_UNIT)return SOL_EARLY[unit]??[];return NEW_NOTES[clef][unit]??[];}

/* ---------- Plano das 16 unidades ---------- */
type Q={prompt:string;options:string[];answer:number;hint:string};
/** Habilidades: cada código gera uma atividade (P1) e um exemplo novo (P2). */
export type Skill='agudo'|'grave'|'mesma'|'contorno'|'longo'|'curto'|'pulso'|'eco'|'ritmo'|'forte'|'piano'|'cresc'|'andamento'|'ordem'|'ouvir'|'nome'|'figura'|'figuraNome'|'pausa'|'tempos'|'maisAguda'|'criar'|'ditado'|'teoria'|'historia'|'sinal'|'revisao'|'clave';
type Module={number:number;section:number;title:string;goal:string;meter:CourseMeter;theory:[Q,Q];story:{title:string;scene:string}&Q;lessons:[Skill[],Skill[],Skill[],Skill[],Skill[]]};
export const INI_SECTIONS=['O som','Notas e figuras','Leitura na tua clave','Autonomia musical'];
const LESSON_NAMES=['Descobrir','Discriminar','Praticar','Ler e criar','Aplicar e recuperar'];
const M:Module[]=[
 {number:1,section:1,title:'O som e o silêncio',goal:'Descubra o mundo dos sons',meter:'4/4',
  theory:[{prompt:'O que é a música?',options:['Sons e silêncios organizados no tempo','Só barulho alto','Só palavras faladas'],answer:0,hint:'Música junta sons e silêncios, um depois do outro, no tempo.'},
   {prompt:'Um som agudo é…',options:['Fino, como um passarinho','Grosso, como um trovão','Sempre forte'],answer:0,hint:'Agudo = fino. Grave = grosso.'}],
  story:{title:'O som do sertão',scene:'De manhã tu ouviu um galo cantar e um trovão ao longe.',prompt:'Qual som é mais grave?',options:['O trovão','O galo','Os dois iguais'],answer:0,hint:'O trovão é grosso, bem grave; o galo é fino, agudo.'},
  lessons:[['agudo','mesma','teoria'],['grave','agudo','mesma'],['pulso','eco','agudo'],['contorno','teoria','grave'],['historia','agudo','mesma']]},
 {number:2,section:1,title:'O pulso da música',goal:'Sinta o coração da música',meter:'4/4',
  theory:[{prompt:'O pulso da música é…',options:['Uma batida que se repete sempre igual, como o coração','Um som bem agudo','Uma pausa longa'],answer:0,hint:'O pulso é a batida constante que a gente acompanha com o pé.'},
   {prompt:'Se a música fica mais rápida, o pulso…',options:['Fica mais rápido também','Para','Fica mais grave'],answer:0,hint:'O pulso acompanha a velocidade da música.'}],
  story:{title:'A quadrilha da escola',scene:'Na quadrilha, tu bateu palma fora do tempo da sanfona.',prompt:'O que ajuda?',options:['Escutar a batida e bater junto com ela','Bater o mais rápido possível','Parar de escutar a música'],answer:0,hint:'Primeiro escuta o pulso, depois bate junto.'},
  lessons:[['pulso','teoria','andamento'],['andamento','pulso','contorno'],['pulso','eco','pulso'],['eco','teoria','andamento'],['historia','pulso','revisao']]},
 {number:3,section:1,title:'Longo e curto',goal:'Meça quanto o som dura',meter:'4/4',
  theory:[{prompt:'A duração de um som é…',options:['Quanto tempo ele fica soando','Se ele é fino ou grosso','Se ele é forte ou fraco'],answer:0,hint:'Duração é o tempo que o som dura: longo ou curto.'},
   {prompt:'Um som longo dura…',options:['Mais tempos do pulso','Menos tempos do pulso','Nenhum tempo'],answer:0,hint:'Som longo atravessa vários pulsos; som curto cabe num só.'}],
  story:{title:'O apito do trem',scene:'O trem deu um apito bem comprido e depois dois apitos rapidinhos.',prompt:'Como foram os sons?',options:['Um longo e dois curtos','Três longos','Três curtos'],answer:0,hint:'O primeiro durou muito; os outros, pouquinho.'},
  lessons:[['longo','teoria','curto'],['curto','longo','mesma'],['eco','pulso','eco'],['longo','teoria','eco'],['historia','longo','revisao']]},
 {number:4,section:1,title:'Forte e piano',goal:'Brinque com a força do som',meter:'4/4',
  theory:[{prompt:'Em música, “piano” quer dizer…',options:['Suave, fraquinho','Forte','Rápido'],answer:0,hint:'Piano (p) é suave. Forte (f) é forte. Isso se chama dinâmica.'},
   {prompt:'A dinâmica fala sobre…',options:['A força do som: forte ou suave','A altura: agudo ou grave','A duração: longo ou curto'],answer:0,hint:'Dinâmica = intensidade, a força do som.'}],
  story:{title:'O neném dormindo',scene:'Tu quer tocar uma música em casa, mas o neném tá dormindo.',prompt:'Como tocar?',options:['Piano, bem suave','Forte, bem alto','Gritando'],answer:0,hint:'Piano é suave, pra não acordar ninguém.'},
  lessons:[['forte','teoria','piano'],['piano','forte','agudo'],['eco','cresc','pulso'],['cresc','teoria','forte'],['historia','cresc','revisao']]},
 {number:5,section:2,title:'As sete notas',goal:'Conheça as notas musicais',meter:'4/4',
  theory:[{prompt:'Quais são as sete notas musicais?',options:['Dó, Ré, Mi, Fá, Sol, Lá, Si','Dó, Ré, Mi, Fá, Sol, Lá, Lu','A, E, I, O, U, Ré, Mi'],answer:0,hint:'Dó, Ré, Mi, Fá, Sol, Lá, Si. Depois do Si, volta o Dó.'},
   {prompt:'Cantando Dó-Ré-Mi-Fá-Sol, o som…',options:['Vai subindo, ficando mais agudo','Vai descendo','Fica sempre igual'],answer:0,hint:'Na ordem Dó, Ré, Mi… cada nota é mais aguda que a anterior.'}],
  story:{title:'A escada das notas',scene:'Tom subiu a escada cantando uma nota em cada degrau: Dó, Ré, Mi…',prompt:'Qual nota vem no próximo degrau?',options:['Fá','Dó','Si'],answer:0,hint:'Depois do Mi vem o Fá.'},
  lessons:[['ordem','teoria','contorno'],['ouvir','ordem','agudo'],['eco','ordem','pulso'],['ordem','teoria','ouvir'],['historia','ordem','revisao']]},
 {number:6,section:2,title:'A pauta e a clave de Sol',goal:'Leia tuas primeiras notas',meter:'4/4',
  theory:[{prompt:'A pauta (pentagrama) tem…',options:['5 linhas e 4 espaços','4 linhas e 5 espaços','7 linhas'],answer:0,hint:'São 5 linhas; entre elas ficam 4 espaços. Conta-se de baixo pra cima.'},
   {prompt:'Na clave de Sol, a nota da 2ª linha (de baixo pra cima) é…',options:['Sol','Mi','Fá'],answer:0,hint:'A clave de Sol abraça a 2ª linha: ali mora o Sol.'}],
  story:{title:'A nota escondida',scene:'Na pauta tem uma nota na 1ª linha, embaixo do Fá.',prompt:'Que nota é?',options:['Mi','Sol','Dó'],answer:0,hint:'Mi na 1ª linha, Fá no 1º espaço, Sol na 2ª linha.'},
  lessons:[['teoria','nome','maisAguda'],['nome','ouvir','agudo'],['eco','nome','pulso'],['nome','criar','maisAguda'],['historia','nome','revisao']]},
 {number:7,section:2,title:'Figuras e pausas',goal:'Leia quanto cada nota dura',meter:'4/4',
  theory:[{prompt:'Quantos tempos vale a semínima (no 4/4)?',options:['1','2','4'],answer:0,hint:'Semibreve = 4, mínima = 2, semínima = 1.'},
   {prompt:'O que a pausa pede?',options:['Silêncio contado','Tocar mais forte','Tocar mais rápido'],answer:0,hint:'Cada figura tem uma pausa do mesmo tamanho: silêncio que também se conta.'}],
  story:{title:'O compasso cheio',scene:'No compasso de 4 tempos já tem uma mínima (2 tempos).',prompt:'O que completa o compasso?',options:['Duas semínimas','Uma semibreve','Três mínimas'],answer:0,hint:'2 + 1 + 1 = 4 tempos.'},
  lessons:[['figuraNome','figura','teoria'],['figura','longo','nome'],['ritmo','pausa','ritmo'],['tempos','ditado','criar'],['historia','figura','revisao']]},
 {number:8,section:2,title:'Duas claves: Sol e Fá',goal:'Descubra as claves',meter:'4/4',
  theory:[{prompt:'Pra que serve a clave?',options:['Diz o nome das notas na pauta','Diz se a música é rápida','Diz quem vai tocar'],answer:0,hint:'A clave dá nome a uma linha; dali se acha todas as outras notas.'},
   {prompt:'A clave de Fá é usada pra…',options:['Sons mais graves, como trombone, tuba e a mão esquerda do piano','Só sons agudos, como o apito','Só bateria'],answer:0,hint:'A clave de Fá mostra os graves; a de Sol, os médios e agudos.'}],
  story:{title:'A banda da cidade',scene:'Na banda, a flauta lê na clave de Sol e a tuba lê numa clave diferente.',prompt:'Qual clave a tuba usa?',options:['Clave de Fá','Clave de Sol','Nenhuma'],answer:0,hint:'Instrumentos graves leem na clave de Fá.'},
  lessons:[['clave','teoria','nome'],['clave','nome','maisAguda'],['ritmo','pausa','eco'],['nome','ditado','tempos'],['historia','clave','revisao']]},
 {number:9,section:3,title:'Minha clave',goal:'Leia na clave que tu escolheu',meter:'4/4',
  theory:[{prompt:'Na pauta, quanto mais alta a nota…',options:['Mais aguda ela soa','Mais grave ela soa','Mais longa ela fica'],answer:0,hint:'Em qualquer clave: mais em cima = mais agudo.'},
   {prompt:'Linha e espaço se alternam. Depois de uma nota na linha vem…',options:['Uma nota no espaço logo acima','Uma nota duas linhas acima','A mesma nota'],answer:0,hint:'Linha, espaço, linha, espaço: cada um é a nota seguinte.'}],
  story:{title:'A nota vizinha',scene:'Tu conhece uma nota na pauta. A nota de cima tá no espaço logo acima dela.',prompt:'Como achar o nome?',options:['É a próxima nota na ordem Dó-Ré-Mi…','É sempre Dó','Não dá pra saber'],answer:0,hint:'Subir um degrau na pauta = próxima nota da ordem.'},
  lessons:[['nome','teoria','maisAguda'],['nome','ouvir','agudo'],['ritmo','eco','pulso'],['nome','criar','ditado'],['historia','nome','revisao']]},
 {number:10,section:3,title:'Colcheias',goal:'Divida o tempo em dois',meter:'4/4',
  theory:[{prompt:'Quantas colcheias cabem num tempo de semínima?',options:['2','1','4'],answer:0,hint:'A colcheia vale meio tempo: duas cabem num tempo.'},
   {prompt:'Colcheias seguidas são ligadas por…',options:['Uma barra (travessão)','Uma pausa','Um ponto'],answer:0,hint:'Duas colcheias juntas viram um par com uma barra em cima.'}],
  story:{title:'O ritmo do forró',scene:'O forró tem muitas notas rapidinhas, duas em cada tempo.',prompt:'Que figura é essa?',options:['Colcheia','Semibreve','Mínima'],answer:0,hint:'Duas por tempo = colcheias.'},
  lessons:[['figuraNome','teoria','ritmo'],['figura','nome','andamento'],['ritmo','ritmo','eco'],['nome','ditado','criar'],['historia','ritmo','revisao']]},
 {number:11,section:3,title:'Compasso de três tempos',goal:'Dance a valsa',meter:'3/4',
  theory:[{prompt:'O que o 3/4 diz?',options:['Que cada compasso tem 3 tempos de semínima','Que a música tem 3 notas','Que se toca 3 vezes'],answer:0,hint:'O número de cima diz quantos tempos cabem no compasso.'},
   {prompt:'No 3/4, qual tempo é o mais forte?',options:['O 1º','O 2º','O 3º'],answer:0,hint:'Na valsa: UM-dois-três, UM-dois-três.'}],
  story:{title:'A valsa da festa',scene:'A banda tocou uma valsa na festa da cidade.',prompt:'Como contar?',options:['1-2-3, 1-2-3','1-2-3-4','1-2, 1-2'],answer:0,hint:'Valsa tem três tempos, com o primeiro mais forte.'},
  lessons:[['tempos','teoria','pulso'],['nome','tempos','contorno'],['pulso','ritmo','eco'],['nome','criar','ditado'],['historia','tempos','revisao']]},
 {number:12,section:3,title:'Dinâmicas na partitura',goal:'Leia a força do som',meter:'4/4',
  theory:[{prompt:'O sinal “mf” quer dizer…',options:['Meio forte','Muito fraco','Mais rápido'],answer:0,hint:'p = piano (suave), mf = mezzo forte (meio forte), f = forte.'},
   {prompt:'O crescendo pede pra…',options:['Ir aumentando a força do som aos pouquinhos','Parar de repente','Ficar mais grave'],answer:0,hint:'Crescendo aumenta; decrescendo (diminuendo) diminui.'}],
  story:{title:'A chegada do maracatu',scene:'O maracatu vem de longe e vai chegando perto da praça.',prompt:'Como o som fica?',options:['Crescendo: cada vez mais forte','Decrescendo: cada vez mais fraco','Sempre igual'],answer:0,hint:'Quem chega perto soa cada vez mais forte.'},
  lessons:[['sinal','teoria','forte'],['cresc','sinal','nome'],['eco','ritmo','pulso'],['nome','criar','sinal'],['historia','cresc','revisao']]},
 {number:13,section:4,title:'O ponto de aumento',goal:'Aumente a duração',meter:'4/4',
  theory:[{prompt:'O ponto do lado da nota…',options:['Aumenta metade do valor dela','Dobra o valor','Tira metade'],answer:0,hint:'Mínima (2) com ponto = 3 tempos. Semínima (1) com ponto = 1 e meio.'},
   {prompt:'Quantos tempos vale a mínima pontuada?',options:['3','2','4'],answer:0,hint:'2 + metade de 2 = 3.'}],
  story:{title:'O compasso da valsa',scene:'No 3/4 tu quer uma nota só, que dure o compasso todo.',prompt:'Que figura usar?',options:['Mínima pontuada','Semínima','Colcheia'],answer:0,hint:'Mínima pontuada = 3 tempos, o compasso inteiro do 3/4.'},
  lessons:[['figura','teoria','figuraNome'],['figura','nome','longo'],['ritmo','eco','ritmo'],['nome','ditado','criar'],['historia','figura','revisao']]},
 {number:14,section:4,title:'Andamento',goal:'Escolha a velocidade',meter:'4/4',
  theory:[{prompt:'Andamento é…',options:['A velocidade da música','A força do som','A altura do som'],answer:0,hint:'Lento, moderado, rápido: isso é o andamento.'},
   {prompt:'“Allegro” numa partitura pede…',options:['Rápido e alegre','Bem lento','Silêncio'],answer:0,hint:'Adagio = lento, Moderato = moderado, Allegro = rápido.'}],
  story:{title:'A música pra ninar',scene:'Tu vai tocar uma canção de ninar.',prompt:'Qual andamento combina?',options:['Lento','Rápido','Muito rápido'],answer:0,hint:'Pra ninar, devagarinho.'},
  lessons:[['andamento','teoria','nome'],['andamento','nome','cresc'],['pulso','ritmo','eco'],['nome','criar','ditado'],['historia','andamento','revisao']]},
 {number:15,section:4,title:'Ouvido de músico',goal:'Escreva o que tu ouve',meter:'4/4',
  theory:[{prompt:'No ditado musical, o que ajuda?',options:['Ouvir várias vezes, um tempo de cada vez','Responder sem ouvir','Ouvir só o final'],answer:0,hint:'Ouça, compare com o que tu já sabe e monte aos poucos.'},
   {prompt:'Duas notas iguais, uma depois da outra, na pauta ficam…',options:['Na mesma altura','Uma em cima da outra','Em pautas diferentes'],answer:0,hint:'Mesma nota = mesma linha ou mesmo espaço.'}],
  story:{title:'A música do rádio',scene:'Tocou uma melodia no rádio e tu quer escrever pra lembrar.',prompt:'Por onde começar?',options:['Descobrir a primeira nota e se a melodia sobe ou desce','Escrever qualquer nota','Desistir'],answer:0,hint:'Primeira nota + caminho (sobe/desce) = metade do ditado.'},
  lessons:[['ditado','contorno','teoria'],['ouvir','ditado','maisAguda'],['ritmo','eco','ritmo'],['ditado','criar','nome'],['historia','ditado','revisao']]},
 {number:16,section:4,title:'Concerto final',goal:'Mostre tudo o que aprendeu',meter:'4/4',
  theory:[{prompt:'Uma partitura mostra…',options:['Altura (notas), duração (figuras), dinâmica e andamento','Só o nome da música','Só as palavras da letra'],answer:0,hint:'Na partitura tem tudo: que nota, quanto dura, com que força e em que velocidade.'},
   {prompt:'Antes de tocar uma música nova, o que fazer?',options:['Ler a clave, o compasso, as notas e as dinâmicas','Começar sem olhar','Olhar só o título'],answer:0,hint:'Clave, compasso, notas, figuras e dinâmicas: confira tudo antes.'}],
  story:{title:'O concerto da escola',scene:'Chegou o dia do concerto e tu recebeu a partitura nova.',prompt:'O que conferir primeiro?',options:['A clave e o compasso','A cor do papel','Quantas páginas tem'],answer:0,hint:'A clave dá o nome das notas; o compasso, a contagem.'},
  lessons:[['nome','figura','sinal'],['ouvir','tempos','andamento'],['ritmo','ritmo','eco'],['ditado','criar','nome'],['historia','revisao','revisao']]},
];
export const INI_MODULES=M;
const TASK_TEXT:Record<Skill,string>={agudo:'Comparar sons agudos e graves.',grave:'Encontrar o som mais grave.',mesma:'Ouvir se dois sons são iguais.',contorno:'Ouvir se a melodia sobe ou desce.',longo:'Comparar sons longos e curtos.',curto:'Encontrar o som mais curto.',pulso:'Bater junto com o pulso.',eco:'Repetir um ritmo de ouvido.',ritmo:'Bater o ritmo lendo as figuras.',forte:'Ouvir a diferença entre forte e piano.',piano:'Encontrar o som mais suave.',cresc:'Ouvir crescendo e decrescendo.',andamento:'Ouvir se a música é lenta ou rápida.',ordem:'Saber a ordem das notas.',ouvir:'Descobrir qual nota tocou.',nome:'Ler o nome das notas na pauta.',figura:'Ler quanto cada figura dura.',figuraNome:'Conhecer as figuras musicais.',pausa:'Achar a pausa no compasso.',tempos:'Ler a fórmula de compasso.',maisAguda:'Achar a nota mais aguda na pauta.',criar:'Criar um compasso.',ditado:'Montar o que ouviu (ditado).',teoria:'Pensar sobre a música.',historia:'Resolver uma situação musical.',sinal:'Ler os sinais de dinâmica.',revisao:'Relembrar a unidade anterior.',clave:'Conhecer as claves de Sol e Fá.'};

/* ---------- Lições ---------- */
export type IniLesson={id:string;unit:number;index:number;title:string;tasks:[string,string,string];newNotes:number[]};
const id2=(n:number)=>String(n).padStart(2,'0');
export const INI_LESSONS:IniLesson[]=M.flatMap(m=>m.lessons.map((skills,L)=>({id:`INI-M${id2(m.number)}-L${L+1}`,unit:m.number,index:L,title:LESSON_NAMES[L],tasks:skills.map(s=>TASK_TEXT[s]) as [string,string,string],newNotes:[]})));

/* ---------- Telas ---------- */
export type IniKind='meet'|'listen'|'compare'|'read'|'theory'|'story'|'tap'|'create';
export type IniExercise={id:string;taskId:string;phase:'apoio'|'descoberta'|'aplicacao';kind:IniKind;instruction:string;prompt:string;target?:number;
 options?:{label:string;midi?:number}[];answer?:number;notes?:CourseNote[];alternative?:CourseNote[];meter?:CourseMeter;bpm?:number;score?:boolean;clef?:Clef;
 tapBeats?:number[];tapLength?:number;create?:{slots:number;choices:(number|null)[];rule:'fill-bar'|'match';target?:(number|null)[]};
 story?:{title:string;scene:string};hint:string;correct:string;incorrect:string;evidence:Evidence[];noModel?:boolean;hideModel?:boolean;duo?:boolean;checklist?:string[]};
type Seed=Omit<IniExercise,'id'|'taskId'|'phase'>;
function seeded(seed:string){let h=0;for(const c of seed)h=(h*31+c.charCodeAt(0))>>>0;return ()=>{h=(h*1103515245+12345)>>>0;return h/2**32;};}
function shuffle<T>(list:T[],rnd:()=>number){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const barOf=(m:CourseMeter)=>m==='3/4'?3:4;
function ask(q:Q,rnd:()=>number,instruction='Pra pensar',evidence:Evidence='leitura'):Seed{const order=shuffle(q.options.map((label,k)=>({label,k})),rnd);return {kind:'theory',instruction,prompt:q.prompt,options:order.map(o=>({label:o.label})),answer:order.findIndex(o=>o.k===q.answer),hint:q.hint,correct:`Isso! ${q.hint}`,incorrect:`Ainda não. ${q.hint}`,evidence:[evidence]};}

/** Ritmos que cabem num compasso, por unidade (só figuras que a pessoa já conhece). */
function rhythmBar(unit:number,meter:CourseMeter,rnd:()=>number):number[]{
 const four=unit>=13?[[3,1],[1.5,.5,2],[1,1,2],[2,1,1],[1.5,.5,1,1]]:unit>=10?[[1,.5,.5,2],[.5,.5,1,1,1],[1,1,.5,.5,1],[2,.5,.5,1],[1,1,2]]:[[1,1,2],[2,1,1],[1,1,1,1],[2,2],[1,2,1]];
 const three=unit>=13?[[3],[1.5,.5,1],[2,1]]:unit>=10?[[1,.5,.5,1],[.5,.5,1,1],[2,1]]:[[1,1,1],[2,1],[1,2]];
 const list=meter==='3/4'?three:four;return list[Math.floor(rnd()*list.length)];
}
const ints=(n:number)=>Array.from({length:n},(_,k)=>k);

function kitFor(unit:number,clef:Clef,meter:CourseMeter,rnd:()=>number){
 const reading=unit>=6;
 const pool=reading?readingPool(unit,unit>=CLEF_UNIT?clef:'sol'):EAR,readClef:Clef=unit>=CLEF_UNIT?clef:'sol';
 const pick=(from=pool)=>from[Math.floor(rnd()*from.length)];
 const two=():[number,number]=>{const [a,b]=shuffle(pool.length>1?pool:EAR,rnd);return [a,b];};
 const name=iniName;
 const opts=(x:number,from=pool)=>{const others=shuffle(from.filter(p=>p!==x),rnd).slice(0,2);return shuffle([x,...others],rnd);};
 const mid=pool.includes(67)?67:pool[Math.floor(pool.length/2)]??67;
 const k={
  agudo:():Seed=>{const [a,b]=two(),high=a>b?0:1;return {kind:'compare',instruction:'Qual soa mais agudo?',prompt:'Ouça o Modelo A e o Modelo B. Qual som é mais agudo (mais fino)?',notes:[{midi:a,beats:2}],alternative:[{midi:b,beats:2}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:high,hint:'Agudo é fino, como passarinho. Grave é grosso, como trovão.',correct:`Isso! O Modelo ${high?'B':'A'} é mais agudo.`,incorrect:`O mais agudo era o Modelo ${high?'B':'A'}. Ouça de novo.`,evidence:['escuta']};},
  grave:():Seed=>{const [a,b]=two(),low=a<b?0:1;return {kind:'compare',instruction:'Qual soa mais grave?',prompt:'Ouça o Modelo A e o Modelo B. Qual som é mais grave (mais grosso)?',notes:[{midi:a,beats:2}],alternative:[{midi:b,beats:2}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:low,hint:'Grave é o som mais grosso.',correct:`Isso! O Modelo ${low?'B':'A'} é mais grave.`,incorrect:`O mais grave era o Modelo ${low?'B':'A'}. Ouça de novo.`,evidence:['escuta']};},
  mesma:():Seed=>{const equal=rnd()<.5,[a,b]=two();return {kind:'compare',instruction:'Iguais ou diferentes?',prompt:'Ouça o Modelo A e o Modelo B. Tocaram o mesmo som?',notes:[{midi:a,beats:2}],alternative:[{midi:equal?a:b,beats:2}],options:[{label:'Iguais'},{label:'Diferentes'}],answer:equal?0:1,hint:'Compare a altura: fino ou grosso.',correct:equal?'Isso! Os dois são o mesmo som.':'Isso! São sons diferentes.',incorrect:equal?'Eram iguais. Ouça de novo.':'Eram diferentes. Ouça de novo.',evidence:['escuta']};},
  contorno:():Seed=>{const up=rnd()<.5,start=Math.floor(rnd()*3),run=EAR.slice(start,start+4),line=up?run:[...run].reverse();return {kind:'listen',instruction:'Sobe ou desce?',prompt:'Ouça a melodia. Do começo ao fim, o som sobe (fica mais agudo) ou desce (fica mais grave)?',notes:[...line.map(m=>({midi:m,beats:1}))],meter:'4/4',bpm:84,options:[{label:'Sobe'},{label:'Desce'}],answer:up?0:1,hint:'Compare o primeiro e o último som.',correct:`Isso! A melodia ${up?'sobe':'desce'}.`,incorrect:`A melodia ${up?'sobe':'desce'}. Ouça de novo.`,evidence:['escuta']};},
  longo:():Seed=>{const longB=rnd()<.5,m=pick(EAR);return {kind:'compare',instruction:'Qual som dura mais?',prompt:'Ouça o Modelo A e o Modelo B. Qual som é mais longo?',notes:[{midi:m,beats:longB?1:4}],alternative:[{midi:m,beats:longB?4:1}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:longB?1:0,hint:'Conte quanto tempo cada som fica soando.',correct:`Isso! O Modelo ${longB?'B':'A'} é o mais longo.`,incorrect:`O mais longo era o Modelo ${longB?'B':'A'}.`,evidence:['escuta']};},
  curto:():Seed=>{const shortB=rnd()<.5,m=pick(EAR);return {kind:'compare',instruction:'Qual som é mais curto?',prompt:'Ouça o Modelo A e o Modelo B. Qual som dura menos?',notes:[{midi:m,beats:shortB?3:.5}],alternative:[{midi:m,beats:shortB?.5:3}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:shortB?1:0,hint:'O som curto acaba rapidinho.',correct:`Isso! O Modelo ${shortB?'B':'A'} é o mais curto.`,incorrect:`O mais curto era o Modelo ${shortB?'B':'A'}.`,evidence:['escuta']};},
  forte:():Seed=>{const loudB=rnd()<.5,m=pick(EAR);return {kind:'compare',instruction:'Qual soa mais forte?',prompt:'Ouça o Modelo A e o Modelo B. Qual som é forte (mais intenso)?',notes:[{midi:m,beats:2,vol:loudB?.3:2}],alternative:[{midi:m,beats:2,vol:loudB?2:.3}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:loudB?1:0,hint:'Forte é o som com mais força. Deixe o volume do aparelho no meio.',correct:`Isso! O Modelo ${loudB?'B':'A'} é forte.`,incorrect:`O forte era o Modelo ${loudB?'B':'A'}.`,evidence:['escuta']};},
  piano:():Seed=>{const softB=rnd()<.5,m=pick(EAR);return {kind:'compare',instruction:'Qual soa mais suave (piano)?',prompt:'Ouça o Modelo A e o Modelo B. Qual som é piano, mais suave?',notes:[{midi:m,beats:2,vol:softB?2:.3}],alternative:[{midi:m,beats:2,vol:softB?.3:2}],options:[{label:'Modelo A'},{label:'Modelo B'}],answer:softB?1:0,hint:'Piano é suave, fraquinho.',correct:`Isso! O Modelo ${softB?'B':'A'} é piano.`,incorrect:`O piano (suave) era o Modelo ${softB?'B':'A'}.`,evidence:['escuta']};},
  cresc:():Seed=>{const up=rnd()<.5,m=pick(EAR),vols=[.25,.55,1,1.6,2.2],v=up?vols:[...vols].reverse();return {kind:'listen',instruction:'Crescendo ou decrescendo?',prompt:'Ouça. O som vai ficando mais forte ou mais suave?',notes:[...v.map((x):CourseNote=>({midi:m,beats:1,vol:x})),{midi:null,beats:3}],meter:'4/4',bpm:80,options:[{label:'Crescendo (mais forte)'},{label:'Decrescendo (mais suave)'}],answer:up?0:1,hint:'Crescendo aumenta a força; decrescendo diminui.',correct:`Isso! Foi ${up?'crescendo':'decrescendo'}.`,incorrect:`Foi ${up?'crescendo':'decrescendo'}. Ouça de novo.`,evidence:['escuta']};},
  andamento:():Seed=>{const fast=rnd()<.5,line=[60,64,67,64,60,64,67,72];return {kind:'listen',instruction:'Lento ou rápido?',prompt:'Ouça o trecho. O andamento (a velocidade) é lento ou rápido?',notes:[...line.map((m):CourseNote=>({midi:m,beats:.5})),{midi:null,beats:4}],meter:'4/4',bpm:fast?150:52,options:[{label:'Lento'},{label:'Rápido'}],answer:fast?1:0,hint:'Sinta o pulso: devagar é lento; ligeiro é rápido.',correct:`Isso! É ${fast?'rápido':'lento'}.`,incorrect:`Era ${fast?'rápido':'lento'}.`,evidence:['escuta']};},
  pulso:():Seed=>{const all=rnd()<.6,len=barOf(meter)*(meter==='3/4'?2:1);const beats=all?ints(len):ints(len).filter(b=>b%barOf(meter)===0);return {kind:'tap',instruction:all?'Bata no pulso':'Bata só no tempo 1',prompt:all?'Depois da contagem, toque o botão em cada pulso, junto com o clique.':'Conte os tempos e toque só no tempo 1 de cada compasso.',meter,bpm:66,tapBeats:beats,tapLength:len,hint:'Toque junto com o clique, nem antes nem depois.',correct:'No pulso, arretado!',incorrect:'Os toques não bateram com o pulso. Escute o clique e tente de novo.',evidence:['medicao-automatica']};},
  eco:():Seed=>{const r=rhythmBar(Math.min(unit,9),meter,rnd),notes=r.map(b=>({midi:mid,beats:b}));const beats:number[]=[];let at=0;for(const b of r){beats.push(at);at+=b;}return {kind:'tap',instruction:'Eco: repita o ritmo',prompt:'Toque em “Ouvir o ritmo”, depois comece a contagem e bata o mesmo ritmo no botão.',notes,meter,bpm:66,score:false,tapBeats:beats,tapLength:at,hint:'Cada som é um toque. Ouça quantas vezes quiser.',correct:'Eco perfeito!',incorrect:'O ritmo ficou diferente. Ouça de novo e repita.',evidence:['medicao-automatica']};},
  ritmo:():Seed=>{const r=[...rhythmBar(unit,meter,rnd),...rhythmBar(unit,meter,rnd)],notes:CourseNote[]=r.map((b,j)=>({midi:j===1&&unit>=7&&b===1?null:pick(),beats:b}));const beats:number[]=[];let at=0;for(const n of notes){if(n.midi!==null)beats.push(at);at+=n.beats;}return {kind:'tap',instruction:'Bata o ritmo da partitura',prompt:'Leia as figuras. Depois da contagem, toque o botão em cada nota. Nas pausas, não toque.',notes,meter,bpm:60,score:true,clef:readClef,tapBeats:beats,tapLength:at,hint:'Semínima = 1 tempo, mínima = 2, colcheia = meio. Pausa é silêncio.',correct:'Ritmo certinho!',incorrect:'Confira as figuras e as pausas e tente de novo.',evidence:['medicao-automatica']};},
  ordem:():Seed=>{const names=['Dó','Ré','Mi','Fá','Sol','Lá','Si'],i=Math.floor(rnd()*names.length),up=rnd()<.6,ans=up?names[(i+1)%7]:names[(i+6)%7];const others=shuffle(names.filter(n=>n!==ans&&n!==names[i]),rnd).slice(0,2),list=shuffle([ans,...others],rnd);return {kind:'theory',instruction:'A ordem das notas',prompt:up?`Qual nota vem depois do ${names[i]}?`:`Qual nota vem antes do ${names[i]}?`,options:list.map(label=>({label})),answer:list.indexOf(ans),hint:'Dó, Ré, Mi, Fá, Sol, Lá, Si… e volta o Dó.',correct:`Isso! ${up?'Depois':'Antes'} do ${names[i]} vem o ${ans}.`,incorrect:`${up?'Depois':'Antes'} do ${names[i]} vem o ${ans}.`,evidence:['leitura']};},
  ouvir:():Seed=>{const from=reading?pool:[60,64,67],t=pick(from),list=opts(t,from);return {kind:'listen',target:t,instruction:'Que nota tocou?',prompt:`Primeiro ouça a referência (${name(from[0])}) e depois a nota misteriosa. Qual nota foi?`,notes:[{midi:from[0],beats:2},{midi:null,beats:2},{midi:t,beats:2},{midi:null,beats:2}],meter:'4/4',bpm:72,options:list.map(x=>({label:name(x),midi:x})),answer:list.indexOf(t),hint:`Compare com a referência: mais agudo ou mais grave que o ${name(from[0])}?`,correct:`Isso! Tocou o ${name(t)}.`,incorrect:`Tocou o ${name(t)}. Ouça de novo comparando.`,evidence:['escuta']};},
  nome:():Seed=>{const t=pick(),list=opts(t);return {kind:'read',target:t,clef:readClef,instruction:'Que nota é essa?',prompt:`Olhe a nota na pauta (clave de ${readClef==='fa'?'Fá':'Sol'}) e escolha o nome dela.`,notes:[{midi:t,beats:4}],meter:'4/4',options:list.map(x=>({label:name(x),midi:x})),answer:list.indexOf(t),hint:readClef==='fa'?'Na clave de Fá, a 4ª linha (entre os dois pontinhos) é o Fá. Conte a partir dela.':'Na clave de Sol, a 2ª linha é o Sol. Conte linhas e espaços a partir dela.',correct:`Isso! É o ${name(t)}.`,incorrect:`É o ${name(t)}. Conte a partir da nota da clave.`,evidence:['leitura']};},
  maisAguda:():Seed=>{const p=shuffle(pool,rnd).slice(0,3);if(p.length<2)return k.nome();const high=Math.max(...p);return {kind:'read',clef:readClef,instruction:'A nota mais aguda',prompt:'Na partitura, qual é a nota mais aguda (a mais alta na pauta)?',notes:[...p.map((m):CourseNote=>({midi:m,beats:1})),{midi:null,beats:p.length===3?1:2}],meter:'4/4',options:shuffle(p,rnd).map(x=>({label:name(x),midi:x})),answer:-1,hint:'A mais aguda é a que fica mais em cima na pauta.',correct:`Isso! O ${name(high)} é o mais agudo.`,incorrect:`O mais agudo é o ${name(high)}.`,evidence:['leitura'],target:high};},
  figura:():Seed=>{const list=unit>=13?[[3,'mínima pontuada'],[1.5,'semínima pontuada'],[2,'mínima'],[1,'semínima']]:unit>=10?[[.5,'colcheia'],[1,'semínima'],[2,'mínima'],[4,'semibreve']]:[[4,'semibreve'],[2,'mínima'],[1,'semínima']];
   const [beats,label]=list[Math.floor(rnd()*list.length)] as [number,string];const vals=[...new Set([beats,...shuffle(list.map(x=>x[0] as number).filter(b=>b!==beats),rnd).slice(0,2)])].sort((a,b)=>a-b);
   const txt=(b:number)=>b===.5?'meio tempo':b===1.5?'1 tempo e meio':`${b} tempo${b>1?'s':''}`;
   return {kind:'read',clef:readClef,instruction:'Quanto dura essa figura?',prompt:'No compasso de 4/4, quantos tempos essa nota dura?',notes:[{midi:mid,beats},...(beats<4?[{midi:null,beats:4-beats}]:[])].flatMap(n=>n.midi===null&&n.beats===3?[{midi:null,beats:2},{midi:null,beats:1}]:n.midi===null&&n.beats===2.5?[{midi:null,beats:.5},{midi:null,beats:2}]:n.midi===null&&n.beats===3.5?[{midi:null,beats:.5},{midi:null,beats:1},{midi:null,beats:2}]:[n]),meter:'4/4',options:vals.map(v=>({label:txt(v)})),answer:vals.indexOf(beats),hint:`É uma ${label}: ${txt(beats)}.`,correct:`Isso! A ${label} dura ${txt(beats)}.`,incorrect:`É uma ${label}: dura ${txt(beats)}.`,evidence:['leitura']};},
  figuraNome:():Seed=>{const list=unit>=13?[[3,'Mínima pontuada'],[1.5,'Semínima pontuada'],[2,'Mínima']]:unit>=10?[[.5,'Colcheia'],[1,'Semínima'],[2,'Mínima']]:[[4,'Semibreve'],[2,'Mínima'],[1,'Semínima']];
   const k2=Math.floor(rnd()*list.length),[beats,label]=list[k2] as [number,string],names=shuffle(list.map(x=>x[1] as string),rnd);
   const rest=4-beats,fill:CourseNote[]=rest<=0?[]:rest===3?[{midi:null,beats:2},{midi:null,beats:1}]:rest===2.5?[{midi:null,beats:.5},{midi:null,beats:2}]:rest===3.5?[{midi:null,beats:.5},{midi:null,beats:1},{midi:null,beats:2}]:[{midi:null,beats:rest}];
   return {kind:'read',clef:readClef,instruction:'Que figura é essa?',prompt:'Olhe a primeira nota do compasso. Como se chama essa figura?',notes:[{midi:mid,beats},...fill],meter:'4/4',options:names.map(l=>({label:l})),answer:names.indexOf(label),hint:'Semibreve: bolinha aberta sem haste. Mínima: aberta com haste. Semínima: cheia com haste. Colcheia: cheia com bandeirinha.',correct:`Isso! É a ${label.toLocaleLowerCase('pt-BR')}.`,incorrect:`É a ${label.toLocaleLowerCase('pt-BR')}.`,evidence:['leitura']};},
  pausa:():Seed=>{const bar=barOf(meter),at=Math.floor(rnd()*bar),notes=ints(bar).map(b=>({midi:b===at?null:pick(),beats:1}));return {kind:'read',clef:readClef,instruction:'Onde está o silêncio?',prompt:'Em qual tempo do compasso fica a pausa?',notes,meter,options:ints(bar).map(b=>({label:`${b+1}º tempo`})),answer:at,hint:'Conte 1, 2, 3… em cada figura até chegar na pausa.',correct:`Isso! A pausa fica no ${at+1}º tempo.`,incorrect:`A pausa fica no ${at+1}º tempo.`,evidence:['leitura']};},
  tempos:():Seed=>{const bar=barOf(meter),notes=ints(bar).map(()=>({midi:pick(),beats:1})),list=shuffle([bar,bar===3?4:3,2],rnd);return {kind:'read',clef:readClef,instruction:'Quantos tempos?',prompt:`Olhe o número de cima do compasso (${meter}). Quantos tempos cabem em cada compasso?`,notes,meter,options:list.map(n=>({label:`${n} tempos`})),answer:list.indexOf(bar),hint:'O número de cima diz quantos tempos cabem no compasso.',correct:`Isso! Cabem ${bar} tempos.`,incorrect:`Cabem ${bar} tempos: é o número de cima.`,evidence:['leitura']};},
  clave:():Seed=>{const fa=rnd()<.5;return {kind:'read',clef:fa?'fa':'sol',instruction:'Que clave é essa?',prompt:'Olhe o começo da pauta. Que clave aparece?',notes:[{midi:fa?53:67,beats:4}],meter:'4/4',options:[{label:'Clave de Sol'},{label:'Clave de Fá'}],answer:fa?1:0,hint:'A de Sol parece um caracol enrolado na 2ª linha. A de Fá parece um “C” virado, com dois pontinhos em volta da 4ª linha.',correct:`Isso! Clave de ${fa?'Fá: a nota aí é o Fá':'Sol: a nota aí é o Sol'}.`,incorrect:`É a clave de ${fa?'Fá':'Sol'}.`,evidence:['leitura']};},
  sinal:():Seed=>{const all:Q[]=[{prompt:'O que o sinal “p” pede?',options:['Piano: suave','Forte','Pausa'],answer:0,hint:'p = piano, suave.'},{prompt:'O que o sinal “f” pede?',options:['Forte','Fraco','Fim'],answer:0,hint:'f = forte.'},{prompt:'O que o sinal “mf” pede?',options:['Meio forte','Muito fraco','Muito forte'],answer:0,hint:'mf = mezzo forte, meio forte.'},{prompt:'O sinal “<” (que vai abrindo) é…',options:['Crescendo: ir aumentando a força','Decrescendo','Uma pausa'],answer:0,hint:'Abre = cresce. Fecha (>) = diminui.'},{prompt:'Qual é a ordem do mais suave pro mais forte?',options:['p, mf, f','f, mf, p','mf, p, f'],answer:0,hint:'p (suave) → mf (meio forte) → f (forte).'}];return ask(all[Math.floor(rnd()*all.length)],rnd,'Sinais de dinâmica');},
  criar:():Seed=>{const bar=barOf(meter),choices=[...shuffle(pool,rnd).slice(0,3).sort((a,b)=>a-b),null];return {kind:'create',clef:readClef,instruction:'Crie teu compasso',prompt:`Monte um compasso de ${meter} com as notas que tu já sabe. Use pelo menos duas notas.`,meter,create:{slots:bar,choices,rule:'fill-bar'},hint:'Toque em cada tempo pra escolher uma nota ou uma pausa.',correct:'Compasso criado! Ouça como ficou.',incorrect:'Coloque nota em pelo menos dois tempos.',evidence:['criacao']};},
  ditado:():Seed=>{const bar=barOf(meter),notes=shuffle(pool,rnd).slice(0,3).sort((a,b)=>a-b),choices=[...notes,null];const target=ints(bar).map(i=>i===bar-1&&rnd()<.4?null:notes[Math.floor(rnd()*notes.length)]);if(target.filter(x=>x!==null).length<2)target[0]=notes[0];return {kind:'create',clef:readClef,instruction:'Ditado: ouça e monte',prompt:'Toque em “Ouvir” e monte, tempo por tempo, o que tu ouviu.',meter,bpm:60,notes:target.map(x=>({midi:x,beats:1})),create:{slots:bar,choices,rule:'match',target},hint:`A resposta: ${target.map(x=>x===null?'pausa':name(x)).join(' · ')}.`,correct:'Ouvido afiado! Montou igualzinho.',incorrect:'Ainda não ficou igual. Ouça de novo, um tempo de cada vez.',evidence:['escuta']};},
 };
 return k;
}
type Kit=ReturnType<typeof kitFor>;
function seedFor(skill:Skill,kit:Kit,m:Module,variant:number,rnd:()=>number,unit:number,clef:Clef,lessonId:string):Seed{
 switch(skill){
  case 'teoria':return ask(m.theory[variant%2],rnd);
  case 'historia':return variant===0?{kind:'story',story:{title:m.story.title,scene:m.story.scene},instruction:'Resolva a história',prompt:m.story.prompt,...(()=>{const order=shuffle(m.story.options.map((label,k)=>({label,k})),rnd);return {options:order.map(o=>({label:o.label})),answer:order.findIndex(o=>o.k===m.story.answer)};})(),hint:m.story.hint,correct:`Isso! ${m.story.hint}`,incorrect:`Ainda não. ${m.story.hint}`,evidence:['reflexao']}:ask(m.theory[1],rnd);
  case 'revisao':{const prev=M[Math.max(0,unit-2)],skills=prev.lessons.flat().filter(s=>s!=='historia'&&s!=='revisao'&&s!=='teoria'),s=skills[Math.floor(rnd()*skills.length)];const prevKit=kitFor(prev.number,clef,prev.meter,rnd);const seed=seedFor(s,prevKit,prev,variant,rnd,prev.number,clef,lessonId);return {...seed,instruction:`Relembre: ${seed.instruction.charAt(0).toLocaleLowerCase('pt-BR')}${seed.instruction.slice(1)}`};}
  default:return (kit[skill as keyof Kit] as ()=>Seed)();
 }
}
function fixAnswer(s:Seed):Seed{if(s.answer===-1&&s.options&&s.target!==undefined)return {...s,answer:s.options.findIndex(o=>o.midi===s.target)};return s;}

const CHALLENGE=new Map([4,8,12,16].map((u,k)=>[`INI-S${k+1}-DESAFIO`,u]));
export const iniChallengeId=(section:number)=>`INI-S${section}-DESAFIO`;
const CHALLENGE_SKILLS:Record<number,Skill[]>={4:['agudo','longo','forte','pulso','contorno','cresc','eco','andamento'],8:['ordem','nome','figura','pausa','clave','ritmo','ditado','maisAguda'],12:['nome','figura','tempos','sinal','ouvir','ritmo','ditado','cresc'],16:['nome','figura','andamento','sinal','ouvir','ritmo','ditado','maisAguda']};

/** Telas de uma lição. `clef`: a clave escolhida (vale a partir da unidade 9). */
export function iniExercises(lessonId:string,clef:Clef='sol'):IniExercise[]{
 const ch=CHALLENGE.get(lessonId);
 if(ch){const m=M[ch-1],rnd=seeded(lessonId+clef),kit=kitFor(ch,clef,m.meter,rnd);
  return CHALLENGE_SKILLS[ch].map((s,k)=>({...fixAnswer(seedFor(s,kit,m,k%2,rnd,ch,clef,lessonId)),id:`${lessonId}-A${k+1}-P1`,taskId:`${lessonId}-A${k+1}`,phase:'aplicacao' as const}));}
 const lesson=INI_LESSONS.find(l=>l.id===lessonId);if(!lesson)return [];
 const m=M[lesson.unit-1],rnd=seeded(lessonId+clef),kit=kitFor(m.number,clef,m.meter,rnd),out:IniExercise[]=[];
 const readClef:Clef=m.number>=CLEF_UNIT?clef:'sol';
 if(lesson.index===0){
  if(m.number===8)out.push({id:`${lessonId}-N53-P1`,taskId:`${lessonId}-N53`,phase:'apoio',kind:'meet',target:53,clef:'fa',instruction:'Clave nova: clave de Fá',prompt:'A clave de Fá marca a 4ª linha (entre os dois pontinhos): ali mora o Fá. Ela mostra os sons graves.',hint:'Fá na 4ª linha.',correct:'Agora tu conhece a clave de Fá!',incorrect:'',evidence:['leitura']});
  for(const n of newNotesOf(m.number,clef))out.push({id:`${lessonId}-N${n}-P1`,taskId:`${lessonId}-N${n}`,phase:'apoio',kind:'meet',target:n,clef:readClef,instruction:`Nota nova: ${iniName(n)}`,prompt:`Veja onde o ${iniName(n)} fica na pauta (clave de ${readClef==='fa'?'Fá':'Sol'}) e escute o som dele.`,hint:iniName(n),correct:`Agora tu já sabe ler o ${iniName(n)}!`,incorrect:'',evidence:['leitura']});
 }
 m.lessons[lesson.index].forEach((s,a)=>{for(const v of [0,1])out.push({...fixAnswer(seedFor(s,kit,m,v,rnd,m.number,clef,lessonId)),id:`${lessonId}-A${a+1}-P${v+1}`,taskId:`${lessonId}-A${a+1}`,phase:v?'aplicacao':'descoberta'});});
 return out;
}

/* ---------- Trilha ---------- */
export type IniJourneyUnit={number:number;section:number;title:string;goal:string;stops:JourneyStop[]};
function buildJourney(){
 const stops:JourneyStop[]=[],units:IniJourneyUnit[]=[];
 for(const m of M){
  const unit:IniJourneyUnit={number:m.number,section:m.section,title:m.title,goal:m.goal,stops:[]};
  const lessons=INI_LESSONS.filter(l=>l.unit===m.number);
  for(const shape of STOP_KINDS){const ls=shape.lessons.map(n=>lessons[n-1]);
   const stop:JourneyStop={id:`INI-U${id2(m.number)}-${shape.kind}`,index:stops.length,unit:m.number,section:m.section,kind:shape.kind,label:shape.label,lessonIds:ls.map(l=>l.id),taskIds:ls.flatMap(l=>[1,2,3].map(a=>`${l.id}-A${a}`)),unitTitle:m.title,unitGoal:m.goal,mission:''};
   unit.stops.push(stop);stops.push(stop);}
  if(m.number%4===0){const id=iniChallengeId(m.section);const stop:JourneyStop={id,index:stops.length,unit:m.number,section:m.section,kind:'desafio',label:'Desafio da seção',lessonIds:[id],taskIds:Array.from({length:8},(_,k)=>`${id}-A${k+1}`),unitTitle:m.title,unitGoal:`Desafio: ${INI_SECTIONS[m.section-1]}`,mission:''};unit.stops.push(stop);stops.push(stop);}
  units.push(unit);
 }
 const engine=createJourneyEngine(stops),lessonIds=new Set(stops.flatMap(s=>s.lessonIds)),stopIds=new Set(stops.map(s=>s.id));
 return {stops,units,engine,normalize:(v:unknown)=>normalizeJourney(v,id=>lessonIds.has(id),id=>stopIds.has(id))};
}
const JOURNEY=buildJourney();
export const iniJourney=()=>JOURNEY;
export const INI_KEY='cactom-trilha-iniciacao-v1';
export function readIniJourney(storage:Pick<KeyValueStorage,'getItem'>){return readJourney(storage,INI_KEY,JOURNEY.normalize);}
export function completeIniLesson(storage:Pick<KeyValueStorage,'getItem'|'setItem'>,outcome:LessonOutcome){
 const fresh=readIniJourney(storage),updated=JOURNEY.engine.completeLesson(fresh.ledger,outcome);
 let warning=fresh.warning;if(fresh.safeToWrite&&!writeJourney(storage,updated,INI_KEY))warning='Teu avanço ficou nesta sessão, mas este navegador não deixou salvar.';
 return {ledger:updated,xp:lessonXp(outcome),warning};
}
export function iniOverview(storage:Pick<KeyValueStorage,'getItem'>):JourneyOverview{return overviewOf(readIniJourney(storage).ledger,JOURNEY.engine,JOURNEY.units);}
export function iniLessonName(lessonId:string){return CHALLENGE.has(lessonId)?'Desafio da seção':INI_LESSONS.find(l=>l.id===lessonId)?.title??'';}
export function iniLessonTasks(lessonId:string):string[]{
 const u=CHALLENGE.get(lessonId);if(u)return [...new Set(CHALLENGE_SKILLS[u].map(s=>TASK_TEXT[s]))].slice(0,3);
 return [...(INI_LESSONS.find(l=>l.id===lessonId)?.tasks??[])];
}
/** Unidade da lição (para saber se já é hora de escolher a clave). */
export function iniUnitOf(lessonId:string){const c=CHALLENGE.get(lessonId);return c??INI_LESSONS.find(l=>l.id===lessonId)?.unit??0;}
