import {COURSE_TASKS,validatePhrase,barBeats,type CourseNote,type CourseMeter,type CourseTask} from './recorderFullCourse.ts';
import {recorderNote,type RecorderSystem} from './recorder.ts';
import type {Evidence} from './recorderJourney.ts';

/**
 * Banco de apresentações da trilha. Cada atividade-base (tarefa curricular) gera duas apresentações:
 * P1 = descoberta, P2 = aplicação em exemplo novo. Unidade 1 segue o roteiro de 30 telas do caderno.
 * Contagens separadas: tarefa-base (240) · apresentação (480) · feedback (estado, não conta como nova atividade).
 */
export type ExerciseKind='choice'|'fingering'|'order'|'tap'|'perform'|'observe'|'create'|'meet';
export type ArtId='flute-parts'|'flute-back'|'hands-left-up'|'hands-right-up'|'support-thumb'|'support-squeeze'|'card-si'|'gesture-breath'|'gesture-none'|'diagram';
export type ExerciseOption={label:string;art?:ArtId;holes?:number[]};
export type Exercise={
 id:string;taskId:string;unit:number;lessonId:string;slot:number;phase:'descoberta'|'aplicacao';kind:ExerciseKind;
 instruction:string;prompt?:string;
 notes?:CourseNote[];alternative?:CourseNote[];meter?:CourseMeter;bpm?:number;score?:boolean;audio?:'A'|'AB'|'duo'|'pulse';art?:ArtId;
 options?:ExerciseOption[];answer?:number;anyAnswer?:boolean;optionFeedback?:string[];
 holes?:number[];prefilled?:number[];target?:number;
 tokens?:string[];order?:string[];
 tapBeats?:number[];tapLength?:number;
 create?:{slots:number;choices:(number|null)[];rule:'entries3'|'two-each-71-69'|'one-rest'|'fill-bar'|'ends-low'|'match';target?:(number|null)[]};
 checklist?:string[];teacher?:boolean;cue?:boolean;attacks?:['leve'|'explosivo','leve'|'explosivo'];
 story?:{title:string;scene:string};
 hint:string;correct:string;incorrect:string;answerKey:string;
 evidence:Evidence[];status:'pronto'|'rascunho';draftReason?:string;
};
export const NAME:Record<number,string>={60:'Dó',62:'Ré',64:'Mi',65:'Fá',66:'Fá♯',67:'Sol',69:'Lá',70:'Si♭',71:'Si',72:'Dó agudo',74:'Ré agudo'};
const n=(...midi:(number|null)[]):CourseNote[]=>midi.map(m=>({midi:m,beats:1}));
const holesOf=(midi:number,system:RecorderSystem='baroque')=>[...recorderNote(midi,system).holes!];
export const fingeringFor=(midi:number,system:RecorderSystem='baroque'):number[]|null=>{try{return holesOf(midi,system);}catch{return null;}};
const RETORNO='Volta no fim da lição se errar e na revisão espaçada (D+1, +3, +7, +14).';

/* ===================== Unidade 1 · roteiro do caderno ===================== */
type Seed=Omit<Exercise,'id'|'unit'|'lessonId'|'slot'|'phase'|'status'|'taskId'>&{status?:Exercise['status'];draftReason?:string};
const U1:Record<string,Seed[]>={
 'S1-M01-L01':[
  {kind:'choice',instruction:'Aponte o bocal no desenho.',prompt:'Qual número mostra o bocal, a parte onde se sopra?',art:'flute-parts',options:[{label:'1'},{label:'2'},{label:'3'}],answer:0,hint:'O bocal fica na ponta de cima, onde a boca encosta de leve.',correct:'Isso. O bocal é a parte 1, onde o ar entra.',incorrect:'Essa parte não é o bocal. Procure a ponta de cima, com a abertura para o ar.',answerKey:'1 = bocal; 2 = corpo; 3 = pé.',evidence:['leitura']},
  {kind:'fingering',instruction:'Encontre o furo traseiro.',prompt:'Veja a flauta de frente e de trás. Toque no furo que o polegar esquerdo fecha.',art:'flute-back',holes:[0],hint:'Só existe um furo atrás do corpo da flauta. Ele é o furo 0.',correct:'Encontrou. O furo 0 fica atrás e é do polegar esquerdo.',incorrect:'Esse furo fica na frente. Vire a flauta: o furo de trás é o 0.',answerKey:'Furo 0 (polegar esquerdo, atrás).',evidence:['leitura']},
  {kind:'choice',instruction:'Escolha a figura com a mão esquerda acima.',prompt:'Em qual figura a mão esquerda está mais perto do bocal?',options:[{label:'Figura A',art:'hands-right-up'},{label:'Figura B',art:'hands-left-up'}],answer:1,hint:'Procure a letra E perto do bocal.',correct:'Isso. Mão esquerda em cima, direita embaixo.',incorrect:'Nessa figura a mão direita está em cima. Troque: a esquerda fica perto do bocal.',answerKey:'Figura B: E em cima, D embaixo.',evidence:['leitura']},
  {kind:'observe',instruction:'Prepare sua posição usando o espelho.',prompt:'Com a flauta nas mãos, confira no espelho:',checklist:['Mão esquerda em cima, perto do bocal','Polegar esquerdo atrás, no furo 0','Ombros soltos e cotovelos afastados do corpo'],hint:'Se os dedos não alcançam os furos sem esforço, peça ajuda para ajustar.',correct:'Posição preparada.',incorrect:'Volte ao espelho e confira um item de cada vez.',answerKey:'Rubrica: os três itens observáveis.',evidence:['tentativa-fisica']},
  {kind:'choice',instruction:'Compare dois apoios.',prompt:'Qual apoio deixa os dedos livres para fechar os furos?',options:[{label:'Polegar direito apoia atrás, sem apertar',art:'support-thumb'},{label:'Todos os dedos apertam o corpo da flauta',art:'support-squeeze'}],answer:0,hint:'Quem segura o peso é o polegar direito, atrás.',correct:'Isso. Com o polegar direito apoiando, os outros dedos ficam livres.',incorrect:'Apertando com todos os dedos, eles não conseguem se mover. O apoio é do polegar direito.',answerKey:'Apoio no polegar direito.',evidence:['leitura']},
  {kind:'observe',instruction:'Prepare a flauta em silêncio.',prompt:'Antes de tocar, deixe tudo pronto e confira:',checklist:['Flauta parada, sem soprar','Mão esquerda em cima e polegar atrás','Respiração pronta, esperando para começar'],hint:'A preparação é silenciosa. O som só começa quando você decidir tocar.',correct:'Preparação feita.',incorrect:'Tudo bem. Repita a preparação com calma.',answerKey:'Autoavaliação: preparo silencioso, mãos e respiração.',evidence:['tentativa-fisica']},
 ],
 'S1-M01-L02':[
  {kind:'observe',audio:'AB',notes:[{midi:71,beats:3}],alternative:[{midi:71,beats:3}],meter:'4/4',bpm:72,attacks:['leve','explosivo'],instruction:'Escute dois modelos de si.',prompt:'Toque em Modelo A e Modelo B. É o mesmo si, tocado de dois jeitos. Só escute, sem tocar.',hint:'Preste atenção ao começo de cada som: suave ou explosivo?',correct:'Modelos escutados.',incorrect:'Ouça os dois de novo.',answerKey:'Modelo A: ataque leve. Modelo B: ataque explosivo.',evidence:['escuta']},
  {kind:'choice',audio:'AB',notes:[{midi:71,beats:3}],alternative:[{midi:71,beats:3}],meter:'4/4',bpm:72,attacks:['leve','explosivo'],instruction:'Escolha qual coincide com o som-alvo.',prompt:'O som-alvo é leve e estável. Qual modelo se parece com ele?',options:[{label:'Modelo A'},{label:'Modelo B'}],answer:0,hint:'O som leve começa sem estalo e não “grita”.',correct:'O modelo A começa suave, sem estalo: é o som-alvo.',incorrect:'O modelo B começa com um golpe de ar. O som leve é o A.',answerKey:'Modelo A (ataque leve).',evidence:['escuta']},
  {kind:'choice',audio:'AB',notes:[{midi:71,beats:3}],alternative:[{midi:71,beats:3}],meter:'4/4',bpm:72,attacks:['explosivo','leve'],instruction:'Ouça de novo com a ordem trocada.',prompt:'Agora a ordem mudou. Qual modelo é o som-alvo, leve e estável?',options:[{label:'Modelo A'},{label:'Modelo B'}],answer:1,hint:'Ouça o som, não a posição na fila.',correct:'Você ouviu o som, não a ordem: agora o leve é o B.',incorrect:'Desta vez o A começa com golpe de ar. O som leve é o B.',answerKey:'Modelo B (ataque leve).',evidence:['escuta']},
  {kind:'fingering',instruction:'Prepare si sem soprar.',prompt:'Feche no desenho os furos de si.',target:71,holes:[0,1],hint:'Si usa só a mão esquerda: polegar atrás (0) e indicador (1).',correct:'Isso. Si fecha 0 e 1.',incorrect:'Ainda não. Para si, feche só o 0 (atrás) e o 1 (indicador esquerdo).',answerKey:'Si = furos 0 e 1.',evidence:['leitura']},
  {kind:'perform',instruction:'Experimente uma emissão curta.',prompt:'Toque um si curto e leve, como quem diz “tu”.',notes:[{midi:71,beats:2},{midi:null,beats:2}],meter:'4/4',bpm:60,hint:'Pouco ar, língua leve no começo, dedos 0 e 1 bem fechados.',correct:'Som curto registrado.',incorrect:'Tente de novo com menos ar.',answerKey:'Si4 escrito ±45 cents por pelo menos 70% da duração (medição pelo microfone).',evidence:['tentativa-fisica']},
  {kind:'choice',instruction:'Compare ao modelo e escolha um ajuste.',prompt:'Seu si ficou diferente do modelo. Qual ajuste você vai tentar primeiro?',options:[{label:'Apoio: firmar o polegar direito atrás'},{label:'Cobertura: fechar melhor o furo 0 ou 1'},{label:'Emissão: soprar com menos força'}],anyAnswer:true,optionFeedback:['Apoio escolhido. Com a flauta estável, os dedos cobrem melhor.','Cobertura escolhida. Um furo meio aberto faz o som chiar.','Emissão escolhida. Sopro forte demais deixa o si agudo e estridente.'],hint:'Escolha o ajuste ligado ao que você ouviu: chiado = cobertura; som agudo e forte = emissão.',correct:'Ajuste escolhido. Experimente-o na próxima vez que tocar.',incorrect:'',answerKey:'Rubrica: escolha justificável (apoio, cobertura ou emissão).',evidence:['reflexao']},
 ],
 'S1-M01-L03':[
  {kind:'choice',instruction:'Associe SI ao diagrama.',prompt:'Qual diagrama mostra si, com 0 e 1 fechados?',options:[{label:'Diagrama A',holes:[0,1,2]},{label:'Diagrama B',holes:[0,1]},{label:'Diagrama C',holes:[1,2]}],answer:1,hint:'Si tem dois furos fechados: o de trás (0) e o primeiro da frente (1).',correct:'Isso. Si = 0 e 1 fechados.',incorrect:'Esse diagrama não é si. Procure exatamente 0 e 1 fechados.',answerKey:'Diagrama B.',evidence:['leitura']},
  {kind:'fingering',instruction:'Complete o diagrama.',prompt:'O polegar (0) já está fechado. Complete a posição de si.',target:71,prefilled:[0],holes:[0,1],hint:'Falta um dedo da mão esquerda: o indicador.',correct:'Completo. 0 e 1 fechados.',incorrect:'Falta ou sobra um furo. Si fecha só 0 e 1.',answerKey:'Acrescentar o furo 1.',evidence:['leitura']},
  {kind:'tap',instruction:'Prepare a nota enquanto conta dois pulsos.',prompt:'Depois da contagem, toque no botão em cada um dos dois pulsos.',meter:'2/4',bpm:60,tapBeats:[0,1],tapLength:2,hint:'Toque junto com o clique, nem antes nem depois.',correct:'Dois pulsos no lugar.',incorrect:'Seus toques não coincidiram com os pulsos. Escute o clique e toque junto.',answerKey:'Toques nos tempos 1 e 2 (±220 ms).',evidence:['medicao-automatica']},
  {kind:'perform',instruction:'Toque três sons curtos com descanso.',prompt:'Si, descanso, si, descanso, si, descanso.',notes:n(71,null,71,null,71,null),meter:'2/4',bpm:60,hint:'Entre um som e outro, pare o ar e mantenha os dedos no lugar.',correct:'Três sons registrados.',incorrect:'Tente de novo deixando o silêncio inteiro.',answerKey:'Três Si4 com silêncio entre eles (medição pelo microfone).',evidence:['tentativa-fisica']},
  {kind:'choice',instruction:'Aplique uma pista.',prompt:'Seu si saiu com um chiado. Qual pista ajuda?',options:[{label:'Conferir se os furos 0 e 1 estão totalmente cobertos'},{label:'Soprar mais forte'},{label:'Levantar o polegar'}],answer:0,hint:'Chiado costuma vir de furo mal coberto.',correct:'Isso. Com os furos bem cobertos, o chiado some.',incorrect:'Essa mudança aumenta o problema. Chiado pede cobertura dos furos.',answerKey:'Cobertura dos furos 0 e 1.',evidence:['reflexao']},
  {kind:'perform',instruction:'Repita em outro andamento.',prompt:'Agora mais devagar: si, descanso, si, descanso.',notes:n(71,null,71,null),meter:'4/4',bpm:48,hint:'Mais devagar não é mais forte: mantenha o ar leve.',correct:'Repetição registrada.',incorrect:'Tente de novo com calma.',answerKey:'Dois Si4 com silêncio a 48 BPM.',evidence:['tentativa-fisica']},
 ],
 'S1-M01-L04':[
  {kind:'fingering',instruction:'Leia o cartão SI e prepare a nota.',prompt:'O cartão mostra SI. Feche os furos no desenho.',art:'card-si',target:71,holes:[0,1],hint:'Cartão SI = 0 e 1 fechados.',correct:'Você reconheceu o dedilhado. Agora vamos ouvir sua execução.',incorrect:'Ainda não é si. Feche 0 e 1.',answerKey:'0 e 1.',evidence:['leitura']},
  {kind:'perform',cue:true,instruction:'Inicie o som quando o cartão subir.',prompt:'Fique pronto. Quando o cartão SI subir, comece o som.',notes:[{midi:null,beats:2},{midi:71,beats:2}],meter:'4/4',bpm:60,hint:'Prepare os dedos antes. Só sopre quando o cartão aparecer.',correct:'Entrada registrada.',incorrect:'Espere o cartão subir para começar.',answerKey:'Som começa com o cartão (tempo 3).',evidence:['tentativa-fisica']},
  {kind:'perform',cue:true,instruction:'Termine quando o cartão baixar.',prompt:'Toque si enquanto o cartão estiver em cima e pare quando ele baixar.',notes:[{midi:71,beats:3},{midi:null,beats:1}],meter:'4/4',bpm:60,hint:'Parar também é tocar: corte o ar no momento exato.',correct:'Corte registrado.',incorrect:'Tente parar junto com o cartão.',answerKey:'Si nos tempos 1–3, silêncio no 4.',evidence:['tentativa-fisica']},
  {kind:'tap',instruction:'Marque quatro pulsos e toque só no primeiro.',prompt:'Conte 1-2-3-4 e toque o botão apenas no 1.',meter:'4/4',bpm:60,tapBeats:[0],tapLength:4,hint:'Os tempos 2, 3 e 4 são de espera, sem tocar.',correct:'Só no primeiro. Perfeito.',incorrect:'Houve toque fora do tempo 1. Conte por dentro e toque só no 1.',answerKey:'Um toque no tempo 1; nenhum nos tempos 2–4.',evidence:['medicao-automatica']},
  {kind:'create',instruction:'Crie três entradas.',prompt:'Escolha três dos quatro tempos para tocar si.',meter:'4/4',create:{slots:4,choices:[71,null],rule:'entries3'},hint:'Marque três tempos com SI e deixe um em silêncio.',correct:'Padrão com três entradas criado. Ouça e toque junto.',incorrect:'O padrão precisa de exatamente três entradas.',answerKey:'Qualquer padrão com 3 SI e 1 silêncio.',evidence:['criacao']},
  {kind:'tap',instruction:'Siga um padrão novo.',prompt:'Padrão novo: tocar no 1 e no 3. Toque o botão nesses tempos.',meter:'4/4',bpm:60,tapBeats:[0,2],tapLength:4,hint:'1 toca, 2 espera, 3 toca, 4 espera.',correct:'Padrão novo seguido.',incorrect:'O padrão era 1 e 3. Escute e tente de novo.',answerKey:'Toques nos tempos 1 e 3.',evidence:['medicao-automatica']},
 ],
 'S1-M01-L05':[
  {kind:'choice',audio:'pulse',instruction:'Ouça o pulso do pequeno grupo.',prompt:'O grupo marca o pulso. O clique mais forte começa cada grupo. Quantos pulsos há em cada grupo?',notes:n(null,null,null,null,null,null,null,null),meter:'4/4',bpm:72,options:[{label:'2'},{label:'3'},{label:'4'}],answer:2,hint:'Conte a partir de cada clique mais forte.',correct:'Isso, grupos de quatro.',incorrect:'Conte de novo a partir do clique mais forte: 1-2-3-4.',answerKey:'4 pulsos por grupo.',evidence:['escuta']},
  {kind:'choice',instruction:'Identifique o gesto que prepara a entrada.',prompt:'Qual gesto avisa que a entrada vai começar?',options:[{label:'Respirar junto e levantar a flauta um tempo antes',art:'gesture-breath'},{label:'Começar sem olhar para ninguém',art:'gesture-none'}],answer:0,hint:'O gesto vem antes do som, como uma respiração combinada.',correct:'Isso. A respiração combinada prepara todos para entrar juntos.',incorrect:'Sem gesto, ninguém sabe quando começar. Procure o aviso que vem um tempo antes.',answerKey:'Respirar e levantar a flauta no tempo anterior.',evidence:['leitura']},
  {kind:'choice',story:{title:'A flauta precisa encontrar sua voz',scene:'O grupo combinou: “A flauta entra no terceiro tempo”. No ensaio, a flauta entrou cedo e o som se misturou com a percussão.'},instruction:'Resolva a história.',prompt:'O plano anunciado foi entrar no terceiro tempo. Quando a flauta deve começar?',options:[{label:'No segundo tempo'},{label:'No terceiro tempo'}],answer:1,hint:'Releia o plano: qual tempo foi combinado?',correct:'Isso. Seguindo o plano, a flauta encontra seu espaço no terceiro tempo.',incorrect:'Entrar no segundo repete o problema. O plano anunciado foi o terceiro tempo.',answerKey:'Terceiro tempo.',evidence:['leitura']},
  {kind:'tap',instruction:'Prepare si durante o silêncio e entre no pulso pedido.',prompt:'Prepare os dedos no tempo 1 e toque o botão só no tempo 2.',meter:'4/4',bpm:60,tapBeats:[1],tapLength:4,hint:'Tempo 1: dedos prontos, sem som. Tempo 2: entrada.',correct:'Entrada no segundo pulso.',incorrect:'Sua nota começou no primeiro pulso. Prepare o dedo ali e espere o segundo para tocar.',answerKey:'Um toque no tempo 2.',evidence:['medicao-automatica']},
  {kind:'fingering',instruction:'Retome uma dificuldade com outro exemplo.',prompt:'Outro exemplo: o cartão mostra SI de novo, agora sem o desenho de apoio. Feche os furos.',target:71,holes:[0,1],hint:'Lembre do cartão: si = polegar atrás e indicador esquerdo.',correct:'Retomada feita.',incorrect:'Si fecha 0 e 1. Confira de novo.',answerKey:'0 e 1.',evidence:['leitura']},
  {kind:'observe',instruction:'Entrada sozinho e cuidado com a flauta.',prompt:'Faça uma entrada de si sem ouvir o modelo. Depois guarde a flauta conforme o fabricante:',checklist:['Entrada de si sem modelo tocando junto','Secar a umidade com cuidado, sem forçar','Guardar na capa ou estojo indicado pelo fabricante'],hint:'Siga a orientação do manual do seu instrumento para limpeza.',correct:'Entrada e cuidados registrados.',incorrect:'Repita com calma, um item de cada vez.',answerKey:'Autoavaliação: entrada independente + cuidados do fabricante.',evidence:['tentativa-fisica']},
 ],
};

/* ===================== Unidades 2–16 · gerador sobre o material ===================== */
const STORIES:Record<number,{title:string;scene:string;prompt:string;options:string[];answer:number;hint:string}>={
 2:{title:'O eco trocou a ordem das notas',scene:'Você tocou SI–LÁ. O eco respondeu LÁ–SI.',prompt:'O que o eco fez?',options:['Trocou a ordem: subiu em vez de descer','Repetiu igual','Tocou outra nota'],answer:0,hint:'SI–LÁ desce. LÁ–SI sobe.'},
 3:{title:'A banda perdeu a entrada',scene:'A banda tocou SI, LÁ e, na pausa, metade parou de contar. No SOL, ninguém entrou junto.',prompt:'O que faltou na pausa?',options:['Continuar contando em silêncio','Tocar mais forte depois','Pular o SOL'],answer:0,hint:'A pausa ocupa um tempo inteiro: o pulso continua.'},
 4:{title:'O final da peça sumiu',scene:'Na apresentação, a peça terminou sem a sustentação final: a última nota ficou curta.',prompt:'Como recuperar o final?',options:['Planejar a respiração antes da última frase','Tocar mais rápido','Tirar a última nota'],answer:0,hint:'Sem ar no fim, a nota longa fica curta.'},
 5:{title:'A melodia precisa de um final mais grave',scene:'A melodia termina em SOL e o grupo quer um final que “pouse” mais embaixo.',prompt:'Qual final pousa mais grave?',options:['SOL – FÁ – MI','SOL – LÁ – SI','SOL – SOL – SOL'],answer:0,hint:'Mais grave = notas que descem.'},
 6:{title:'O compasso ganhou um tempo a mais',scene:'Num 3/4, alguém escreveu: mínima + mínima.',prompt:'Quantos tempos há nesse compasso?',options:['4 tempos: um a mais','3 tempos: correto','2 tempos: falta um'],answer:0,hint:'Mínima = 2 tempos. Some as duas.'},
 7:{title:'A frase ficou sem fôlego',scene:'O aluno respirou no meio de uma ideia ligada e a frase quebrou.',prompt:'Onde é melhor respirar?',options:['No fim da ideia, na pausa ou na nota longa','Entre duas notas ligadas','Em qualquer nota'],answer:0,hint:'Respire nas fronteiras da frase.'},
 8:{title:'Um colega se perdeu no ensaio',scene:'No duo, um colega errou uma nota e parou. O outro continuou sozinho.',prompt:'O que o duo deve fazer?',options:['Combinar um ponto de encontro e retomar com contagem','Começar tudo do zero sempre','Cada um seguir sozinho'],answer:0,hint:'Um ponto combinado deixa todos voltarem juntos.'},
 9:{title:'A melodia mudou de andar',scene:'A frase começa em SI e sobe para DÓ e RÉ agudos.',prompt:'O que muda no polegar no RÉ agudo deste exemplo?',options:['O polegar fica aberto','O polegar aperta mais','Nada muda'],answer:0,hint:'Ré agudo fecha só o furo 2.'},
 10:{title:'A nota não combina com a versão do grupo',scene:'O grupo toca em Sol maior. Você tocou FÁ natural onde a partitura pede FÁ♯.',prompt:'O que corrigir?',options:['Tocar Fá sustenido, como manda a armadura','Tocar Si bemol','Manter Fá natural'],answer:0,hint:'Sol maior tem um sustenido: Fá♯.'},
 11:{title:'A banda confundiu os apoios do ritmo',scene:'A música está em 6/8, mas metade da banda conta 1-2-3 como em 3/4.',prompt:'Como sentir o 6/8?',options:['Dois tempos, cada um dividido em três','Três tempos de duas partes','Seis tempos fortes iguais'],answer:0,hint:'6/8: “UM-dois-três DOIS-dois-três”.'},
 12:{title:'O ensaio só repete a música inteira',scene:'Toda vez que erram o compasso 5, voltam ao início e erram de novo.',prompt:'Qual estratégia ajuda?',options:['Isolar o compasso 5, tocar devagar e reintegrar','Tocar a música inteira mais rápido','Pular o compasso 5'],answer:0,hint:'Estude o ponto difícil isolado.'},
 13:{title:'Todos tocam as notas, mas as frases não combinam',scene:'Cada flautista termina a frase de um jeito: uns cortam, outros prolongam.',prompt:'Qual é o próximo passo?',options:['Combinar juntos o final e a articulação da frase','Cada um decidir sozinho','Tocar mais forte'],answer:0,hint:'Interpretação de grupo é combinada.'},
 14:{title:'A melodia ficou cheia demais',scene:'Foram colocados ornamentos em todas as notas e a melodia principal sumiu.',prompt:'O que fazer?',options:['Manter poucos ornamentos que preservem as notas principais','Acrescentar mais ornamentos','Tirar a melodia'],answer:0,hint:'O ornamento enfeita, não substitui.'},
 15:{title:'Entrou um novo músico na banda',scene:'Chegou um colega novo que ainda toca só SI, LÁ e SOL.',prompt:'Que função dar a ele no arranjo?',options:['Um acompanhamento com SI, LÁ e SOL','A melodia mais aguda','Nenhuma'],answer:0,hint:'Distribua funções pelos recursos de cada um.'},
 16:{title:'Mudança no ensaio geral',scene:'A maestrina pede: “Recomecem do compasso 9”.',prompt:'Como o grupo recomeça?',options:['Localizar o compasso 9, combinar a contagem e entrar juntos','Voltar ao início','Esperar a próxima música'],answer:0,hint:'Ponto combinado + contagem.'},
};
const DRAFT:Record<string,string>={
 'S2-M05-L03-A03':'Comparar a qualidade de emissão de notas graves exige gravação de referência ou observação; o timbre sintetizado não serve como modelo.',
 'S4-M13-L01-A01':'Exige duas interpretações gravadas por músico; o som sintético não mostra caráter.',
 'S4-M13-L02-A01':'Exige exemplos sonoros gravados que mostrem caráter.',
 'S4-M14-L01-A03':'Gesto ornamental precisa de demonstração gravada e diagrama conferido.',
};
type Ctx={task:CourseTask;unit:number;L:number;a:number;slot:number;phase:'descoberta'|'aplicacao'};
const pitched=(notes:readonly CourseNote[])=>notes.filter(x=>x.midi!==null).map(x=>x.midi!);
/**
 * Exemplo novo: mesma figura rítmica, alturas deslocadas só entre as notas que o próprio trecho usa
 * (nunca acrescenta alteração nem muda a tonalidade). Com uma só nota, gira o ritmo.
 */
export function newExample(notes:readonly CourseNote[],pool:readonly number[],meter:CourseMeter):CourseNote[]{
 const own=[...new Set(pitched(notes))].sort((x,y)=>x-y);
 const naturals=[60,62,64,65,67,69,71,72,74].filter(p=>pool.includes(p));
 const set=own.length>=2?own:(own.length===1&&own[0]!==66&&own[0]!==70?naturals:own);
 const map=(f:(i:number)=>number)=>notes.map(x=>x.midi===null?{midi:null,beats:x.beats}:{midi:set[Math.max(0,Math.min(set.length-1,f(set.indexOf(x.midi))))]??x.midi,beats:x.beats});
 const candidates:CourseNote[][]=[];
 if(own.length>=2)candidates.push(map(i=>set.length-1-i));
 candidates.push(notes.slice().reverse().map(x=>({midi:x.midi,beats:x.beats})));
 if(own.length===1&&set.length>=2){const i=set.indexOf(own[0]);const other=set[i>0?i-1:i+1];candidates.push(notes.map(x=>({midi:x.midi===null?null:other,beats:x.beats})));}
 candidates.push([...notes.slice(1),notes[0]].map(x=>({midi:x.midi,beats:x.beats})));
 candidates.push(map(i=>i+1),map(i=>i-1));
 const same=(x:CourseNote[])=>JSON.stringify(x.map(y=>[y.midi,y.beats]))===JSON.stringify(notes.map(y=>[y.midi,y.beats]));
 const distinct=(x:CourseNote[])=>new Set(pitched(x)).size>=Math.min(2,own.length);
 return candidates.find(x=>!same(x)&&distinct(x)&&validatePhrase(x,meter,pool))??notes.map(x=>({midi:x.midi,beats:x.beats}));
}
/** “Recuperar …”: material da unidade anterior, como pede o caderno. */
const RECALL:Record<number,{notes:CourseNote[];meter:CourseMeter}>={
 2:{notes:n(71,null,71,null),meter:'4/4'},3:{notes:n(71,69,69,71),meter:'4/4'},5:{notes:n(71,69,67,null),meter:'4/4'},
 6:{notes:n(64,62,64,60),meter:'4/4'},7:{notes:[{midi:71,beats:1},{midi:69,beats:.5},{midi:67,beats:.5},{midi:null,beats:1},{midi:71,beats:1}],meter:'4/4'},
 9:{notes:n(64,62,60,null),meter:'4/4'},10:{notes:n(67,69,71,72),meter:'4/4'},
};
export function contour(notes:readonly CourseNote[]):'sobe'|'desce'|'igual'{const p=pitched(notes);if(p.length<2)return 'igual';return p[p.length-1]>p[0]?'sobe':p[p.length-1]<p[0]?'desce':'igual';}
const firstBar=(notes:readonly CourseNote[],meter:CourseMeter)=>{let at=0;const out:CourseNote[]=[];for(const x of notes){if(at>=barBeats(meter))break;out.push(x);at+=x.beats;}return out;};
function contourQuestion(_c:Ctx,notes:CourseNote[],meter:CourseMeter,lead:string):Seed{
 const labels=['Sobe','Desce','Fica na mesma nota'];
 if(contour(notes)==='igual'){const p=pitched(notes);const k=p.findIndex((x,i)=>i>0&&x!==p[i-1]);if(k>0){const up=p[k]>p[k-1];return {kind:'choice',audio:'A',notes,meter,bpm:72,instruction:lead,prompt:'Na primeira mudança de nota, o som sobe ou desce?',options:labels.slice(0,2).map(label=>({label})),answer:up?0:1,hint:'Escute só a primeira troca de nota.',correct:`Isso: ${up?'sobe':'desce'} (${NAME[p[k-1]]} → ${NAME[p[k]]}).`,incorrect:`Na primeira troca, ${NAME[p[k-1]]} → ${NAME[p[k]]}: ${up?'sobe':'desce'}.`,answerKey:`${NAME[p[k-1]]} → ${NAME[p[k]]}: ${up?'sobe':'desce'}.`,evidence:['escuta']};}}
 const answer=contour(notes);
 return {kind:'choice',audio:'A',notes,meter,bpm:72,instruction:lead,prompt:'Do primeiro ao último som, o caminho sobe, desce ou fica na mesma nota?',options:labels.map(label=>({label})),answer:answer==='sobe'?0:answer==='desce'?1:2,hint:'Compare só o primeiro e o último som. Mais grave = desce.',correct:`Isso: ${answer==='igual'?'termina na mesma nota':answer}.`,incorrect:`Ouça de novo comparando o primeiro e o último som. O caminho ${answer==='igual'?'termina na mesma nota':answer}.`,answerKey:`${notes.map(x=>x.midi===null?'pausa':NAME[x.midi]).join(' · ')} → ${answer}.`,evidence:['escuta']};
}
function highestQuestion(notes:CourseNote[],meter:CourseMeter,lead:string,useScore=false):Seed|null{
 const p=[...new Set(pitched(notes))];if(p.length<2)return null;const top=Math.max(...p);const options=p.sort((x,y)=>x-y).slice(-3);
 return {kind:'choice',audio:useScore?undefined:'A',score:useScore,notes,meter,bpm:72,instruction:lead,prompt:useScore?'Na partitura, qual é a nota mais aguda?':'Qual destas notas é a mais aguda no exemplo?',options:options.map(m=>({label:NAME[m]})),answer:options.indexOf(top),hint:useScore?'Na pauta, a nota mais aguda é a que fica mais acima.':'O som mais agudo é o mais “fino”.',correct:`Isso: ${NAME[top]}.`,incorrect:`A mais aguda é ${NAME[top]}. Ouça de novo procurando o som mais fino.`,answerKey:`${NAME[top]} (MIDI escrito ${top}).`,evidence:[useScore?'leitura':'escuta']};
}
function restQuestion(notes:CourseNote[],meter:CourseMeter,lead:string):Seed|null{
 const bar=firstBar(notes,meter);if(bar.some(x=>x.beats!==1))return null;const i=bar.findIndex(x=>x.midi===null);if(i<0)return null;const total=bar.length;
 return {kind:'choice',audio:'A',score:false,notes:bar,meter,bpm:66,instruction:lead,prompt:'Em qual tempo do compasso fica o silêncio?',options:Array.from({length:total},(_,k)=>({label:`${k+1}º tempo`})),answer:i,hint:'Conte 1-2-3-4 junto com o exemplo e note onde não há som.',correct:`Isso: o silêncio está no ${i+1}º tempo.`,incorrect:`Conte de novo. O silêncio está no ${i+1}º tempo.`,answerKey:`${i+1}º tempo.`,evidence:['escuta']};
}
function fingeringSeed(midi:number,lead:string,extra=''):Seed{
 const holes=fingeringFor(midi);
 if(!holes)return {kind:'fingering',target:midi,holes:[],instruction:lead,prompt:`Prepare ${NAME[midi]} no desenho.`,hint:'Confira na tabela do fabricante do seu modelo.',correct:'',incorrect:'',answerKey:'Diagrama da nota alterada ainda não conferido para os dois sistemas.',evidence:['leitura'],status:'rascunho',draftReason:`Dedilhado de ${NAME[midi]} depende do modelo e sistema; diagrama conferido ainda ausente.`};
 return {kind:'fingering',target:midi,holes,instruction:lead,prompt:`Feche no desenho os furos de ${NAME[midi]}.${extra}`,hint:`${NAME[midi]}: furos ${holes.join(' · ')} fechados${midi===65?' no sistema barroco (germânico: 0–4)':''}.`,correct:`Isso: ${NAME[midi]} = ${holes.join(' · ')}.`,incorrect:`Ainda não. ${NAME[midi]} fecha ${holes.join(' · ')}.`,answerKey:`${holes.join(' · ')} (barroco; o app ajusta Fá para o sistema escolhido).`,evidence:['leitura']};
}
function performSeed(notes:CourseNote[],meter:CourseMeter,lead:string,prompt:string,hint:string):Seed{
 return {kind:'perform',notes,meter,bpm:60,instruction:lead,prompt,hint,correct:'Execução registrada.',incorrect:'Confira os pontos vermelhos e tente de novo, mais devagar.',answerKey:`${notes.map(x=>x.midi===null?'pausa':NAME[x.midi]).join(' · ')} em ${meter} (±45 cents, duração e entrada, pelo microfone).`,evidence:['tentativa-fisica']};
}
function tapSeed(notes:CourseNote[],meter:CourseMeter,lead:string):Seed|null{
 const beats:number[]=[];let at=0;for(const x of notes){if(x.midi!==null)beats.push(at);at+=x.beats;}
 if(!beats.length||at>8)return null;
 return {kind:'tap',meter,bpm:meter==='6/8'?50:60,tapBeats:beats,tapLength:at,notes,score:true,instruction:lead,prompt:'Depois da contagem, toque o botão em cada ataque da partitura. Nas pausas, não toque.',hint:'Leia a partitura e conte por dentro. A pausa é silêncio contado.',correct:'Ritmo no lugar.',incorrect:'Algum toque ficou fora do lugar. Conte em voz baixa e tente de novo.',answerKey:`Ataques nas posições ${beats.map(b=>b+1).join(', ')} (em semínimas, ±220 ms).`,evidence:['medicao-automatica','leitura']};
}
const STRATEGY_USED=new Set<string>();
function strategySeed(c:Ctx,lead:string):Seed{
 const m=c.task.material;
 if(!(m.question&&m.options&&m.answer!==undefined)){if(STRATEGY_USED.has(c.task.lesson))return {...observeSeed(c,lead),evidence:['reflexao']};STRATEGY_USED.add(c.task.lesson);}
 if(m.question&&m.options&&m.answer!==undefined)return {kind:'choice',audio:/ouv|escut|exempl|modelo/i.test(m.question)?'A':undefined,notes:m.notes,alternative:m.alternative,meter:m.meter,bpm:66,instruction:lead,prompt:m.question,options:m.options.map(label=>({label})),answer:m.answer,hint:m.guide,correct:'Isso.',incorrect:`Ainda não. ${m.guide}`,answerKey:m.options[m.answer],evidence:[/ouv|escut|modelo/i.test(m.question)?'escuta':'leitura']};
 return {kind:'choice',instruction:lead,prompt:'Qual estratégia ajuda nesta situação?',options:[{label:m.guide},{label:'Tocar mais rápido sem conferir o trecho'},{label:'Forçar o sopro e seguir sem escutar'}],answer:0,hint:'Prefira a estratégia que observa e ajusta.',correct:'Isso. Essa estratégia observa e ajusta.',incorrect:`Essa opção não resolve. ${m.guide}`,answerKey:m.guide,evidence:['reflexao']};
}
function compareSeed(c:Ctx,lead:string):Seed|null{
 const m=c.task.material,A=m.notes,B=m.alternative;if(!B?.length)return null;
 const same=JSON.stringify(A.map(x=>[x.midi,x.beats]))===JSON.stringify(B.map(x=>[x.midi,x.beats]));
 if(c.unit===7||c.unit===13)return {kind:'choice',audio:'AB',notes:A,alternative:B,meter:m.meter,bpm:66,instruction:lead,prompt:'Qual modelo tem as notas mais ligadas, sem espaço entre elas?',options:[{label:'Modelo A'},{label:'Modelo B'}],answer:1,hint:'Escute se há um pequeno silêncio entre as notas.',correct:'Isso: no modelo B as notas se emendam.',incorrect:'No modelo A há um pequeno espaço entre as notas. O ligado é o B.',answerKey:'Modelo B (articulação ligada, gate 98%).',evidence:['escuta']};
 if(c.unit===14)return {kind:'choice',audio:'AB',notes:A,alternative:B,meter:m.meter,bpm:60,instruction:lead,prompt:'Qual modelo é a versão ornamentada?',options:[{label:'Modelo A'},{label:'Modelo B'}],answer:pitched(B).length>pitched(A).length?1:0,hint:'A versão ornamentada tem notas extras em volta da principal.',correct:'Isso: notas extras enfeitam a melodia.',incorrect:'Ouça de novo procurando as notas a mais.',answerKey:`Modelo ${pitched(B).length>pitched(A).length?'B':'A'}.`,evidence:['escuta']};
 if(c.unit===9)return {kind:'choice',audio:'AB',notes:A,alternative:B,meter:m.meter,bpm:72,instruction:lead,prompt:'Qual modelo está na região mais aguda da flauta?',options:[{label:'Modelo A'},{label:'Modelo B'}],answer:Math.max(...pitched(A))>Math.max(...pitched(B))?0:1,hint:'Região aguda = sons mais finos.',correct:'Isso.',incorrect:'Ouça de novo: qual soa mais fino?',answerKey:`Modelo ${Math.max(...pitched(A))>Math.max(...pitched(B))?'A':'B'}.`,evidence:['escuta']};
 if(c.unit===12&&!c.task.assessment)return {kind:'choice',audio:'AB',notes:A,alternative:B,meter:m.meter,bpm:60,instruction:lead,prompt:'Em qual modelo as duas vozes soam mais afinadas entre si, sem “batimento”?',options:[{label:'Modelo A'},{label:'Modelo B'}],answer:0,hint:'Quando as vozes desafinam, aparece uma ondulação no som.',correct:'Isso: no modelo A as vozes coincidem.',incorrect:'No modelo B uma voz está 22 cents acima: escute a ondulação.',answerKey:'Modelo A (B tem +22 cents).',evidence:['escuta']};
 if(c.phase==='aplicacao'){const own=[...new Set(pitched(A))];const change=(c.task.id.charCodeAt(c.task.id.length-1)+c.unit)%2===0&&own.length>1;const idx=A.findIndex(x=>x.midi!==null&&x.midi!==A.find(y=>y.midi!==null)!.midi);const alt=A.map((x,i)=>change&&i===idx?{...x,midi:own.find(p=>p!==x.midi)!}:{...x});
  return {kind:'choice',audio:'AB',notes:A,alternative:alt,meter:m.meter,bpm:72,instruction:lead,prompt:'Exemplo novo: os modelos A e B são iguais ou diferentes?',options:[{label:'Iguais'},{label:'Diferentes'}],answer:change?1:0,hint:'Compare nota a nota.',correct:change?'Isso: uma nota mudou.':'Isso: são iguais.',incorrect:change?`Uma nota muda no modelo B (${idx+1}º som).`:'Os dois são exatamente iguais.',answerKey:change?`Diferentes (${idx+1}º som).`:'Iguais.',evidence:['escuta']};}
 if(c.unit===15){const lowB=Math.min(...pitched(B))<Math.min(...pitched(A));return {kind:'choice',audio:'AB',notes:A,alternative:B,meter:m.meter,bpm:72,instruction:lead,prompt:'Qual versão está numa posição mais grave?',options:[{label:'Modelo A'},{label:'Modelo B'}],answer:lowB?1:0,hint:'Mesma melodia, alturas diferentes: qual soa mais “grossa”?',correct:'Isso.',incorrect:'Compare de novo: a versão mais grave soa mais “grossa”.',answerKey:`Modelo ${lowB?'B':'A'} (transposição de ${lowB?'-2':'+2'} semitons).`,evidence:['escuta']};}
 return {kind:'choice',audio:'AB',notes:A,alternative:B,meter:m.meter,bpm:72,instruction:lead,prompt:'Os modelos A e B são iguais ou diferentes?',options:[{label:'Iguais'},{label:'Diferentes'}],answer:same?0:1,hint:'Compare nota a nota, do começo ao fim.',correct:same?'Isso, são iguais.':'Isso, são diferentes.',incorrect:'Ouça os dois de novo, comparando o começo de cada um.',answerKey:same?'Iguais.':'Diferentes.',evidence:['escuta']};
}
function annotateSeed(notes:CourseNote[],meter:CourseMeter,lead:string):Seed|null{
 const rest=notes.findIndex((x,i)=>x.midi===null&&i>0&&i<notes.length-1);if(rest<0)return null;
 const candidates=[1,rest,Math.min(notes.length-2,rest+2)].filter((v,i,arr)=>arr.indexOf(v)===i&&v>0);if(candidates.length<2)return null;
 return {kind:'choice',score:true,notes,meter,instruction:lead,prompt:'Na partitura, onde é melhor marcar a respiração?',options:candidates.map(i=>({label:i===rest?`Na pausa (${i+1}º evento)`:`Depois do ${i}º som`})),answer:candidates.indexOf(rest),hint:'A respiração fica no silêncio escrito, sem cortar a ideia.',correct:'Isso: a pausa dá tempo de respirar sem quebrar a frase.',incorrect:'Respirar ali corta a ideia no meio. Procure o silêncio escrito.',answerKey:`Pausa no ${rest+1}º evento.`,evidence:['leitura']};
}
function createSeed(c:Ctx,lead:string,second:boolean):Seed{
 const m=c.task.material,pool=[...new Set(m.pool)].slice(0,4);
 if(c.task.id==='S1-M02-L04-A03')return {kind:'create',meter:'4/4',create:{slots:4,choices:[71,69],rule:'two-each-71-69'},instruction:lead,prompt:'Monte uma sequência nova com dois SI e dois LÁ.',hint:'Use exatamente dois cartões de cada nota.',correct:'Sequência criada. Ouça e toque.',incorrect:'Confira: precisa de dois SI e dois LÁ.',answerKey:'Qualquer ordem com 2 SI e 2 LÁ.',evidence:['criacao']};
 if(c.task.id==='S1-M03-L04-A03')return {kind:'create',meter:'4/4',create:{slots:4,choices:[71,69,67,null],rule:'one-rest'},instruction:lead,prompt:'Crie um padrão com três ataques e uma pausa.',hint:'Três tempos com nota, um tempo de silêncio.',correct:'Padrão criado.',incorrect:'O padrão precisa de três notas e uma pausa.',answerKey:'3 notas + 1 pausa, em qualquer ordem.',evidence:['criacao']};
 const slots=m.meter==='6/8'?6:barBeats(m.meter);
 return {kind:'create',meter:m.meter,create:{slots,choices:[...pool,null],rule:second?'ends-low':'fill-bar'},instruction:lead,prompt:second?`Crie um compasso de ${m.meter} que termine na nota mais grave disponível (${NAME[Math.min(...pool)]}).`:`Crie um compasso de ${m.meter} com as notas da unidade.`,hint:second?`O último espaço deve ser ${NAME[Math.min(...pool)]}.`:'Preencha todos os espaços; use pelo menos uma nota.',correct:'Compasso criado. Ouça e experimente tocar.',incorrect:second?`Termine em ${NAME[Math.min(...pool)]}.`:'Preencha todos os espaços com pelo menos uma nota.',answerKey:second?`Compasso completo terminando em ${NAME[Math.min(...pool)]}.`:'Compasso completo com ao menos uma nota.',evidence:['criacao']};
}
function observeSeed(c:Ctx,lead:string):Seed{
 const m=c.task.material;
 return {kind:'observe',instruction:lead,prompt:'Faça no seu instrumento e confira:',checklist:[c.task.task.replace(/\.$/,''),m.guide.split('. ')[0].replace(/\.$/,'')],hint:m.guide,correct:'Registrado.',incorrect:'Repita com apoio.',answerKey:'Prática declarada pelo aluno.',evidence:['tentativa-fisica']};
}
const WORD:[RegExp,number][]=[[/\bsi bemol\b/i,70],[/\bfá sustenido\b/i,66],[/\bsol\b/i,67],[/\blá\b/i,69],[/\bsi\b/i,71],[/\bfá\b/i,65],[/\bmi\b/i,64],[/\bré\b/i,62],[/\bdó\b/i,60]];
function notesInText(text:string){const found:[number,number][]=[];for(const [re,midi] of WORD){const m=re.exec(text);if(m&&!found.some(f=>f[1]===midi))found.push([m.index,midi]);}const clean=found.filter(([,m])=>!(m===71&&found.some(f=>f[1]===70))&&!(m===65&&found.some(f=>f[1]===66)));return clean.sort((a,b)=>a[0]-b[0]).map(f=>f[1]);}
/** Itens escritos à mão onde o gerador não acerta o foco da tarefa (chave: ID-1 descoberta, ID-2 aplicação). */
const SPECIFIC:Record<string,Seed>={
 'S2-M06-L02-A02-1':{kind:'create',audio:'A',notes:n(71,69,null,67),meter:'4/4',bpm:66,create:{slots:4,choices:[71,69,67,null],rule:'match',target:[71,69,null,67]},instruction:'',prompt:'Ditado: ouça e monte o que ouviu, um cartão por tempo.',hint:'Ouça de novo contando 1-2-3-4. Um dos tempos é silêncio.',correct:'Ditado completo.',incorrect:'Ainda diferente do que tocou. Ouça de novo e confira tempo a tempo.',answerKey:'Si · Lá · pausa · Sol.',evidence:['escuta','criacao']},
 'S2-M06-L02-A02-2':{kind:'create',audio:'A',notes:n(67,null,69,71),meter:'4/4',bpm:66,create:{slots:4,choices:[71,69,67,null],rule:'match',target:[67,null,69,71]},instruction:'',prompt:'Ditado novo: ouça e monte.',hint:'O silêncio agora está em outro tempo.',correct:'Ditado completo.',incorrect:'Ainda diferente. Ouça de novo, tempo a tempo.',answerKey:'Sol · pausa · Lá · Si.',evidence:['escuta','criacao']},
 'S2-M06-L05-A02-1':{kind:'choice',instruction:'',prompt:'Num compasso 3/4 alguém escreveu: mínima + mínima. Qual troca deixa o compasso certo?',options:[{'label': 'Trocar a segunda mínima por uma semínima'}, {'label': 'Acrescentar mais uma semínima'}, {'label': 'Trocar a primeira mínima por uma semibreve'}],answer:0,hint:'3/4 tem três tempos. Mínima vale 2; semínima vale 1.',correct:'Isso: 2 + 1 = 3 tempos.',incorrect:'Ainda não. 3/4 tem três tempos. Mínima vale 2; semínima vale 1.',answerKey:'Trocar a segunda mínima por uma semínima',evidence:['leitura']},
 'S2-M06-L05-A02-2':{kind:'choice',instruction:'',prompt:'Num compasso 2/4 há só uma semínima. O que falta?',options:[{'label': 'Mais um tempo: uma semínima ou uma pausa de semínima'}, {'label': 'Uma mínima'}, {'label': 'Nada, está completo'}],answer:0,hint:'2/4 tem dois tempos; já há um.',correct:'Isso: falta um tempo.',incorrect:'Ainda não. 2/4 tem dois tempos; já há um.',answerKey:'Mais um tempo: uma semínima ou uma pausa de semínima',evidence:['leitura']},
 'S2-M07-L04-A01-1':{kind:'choice',instruction:'',prompt:'Uma ligadura de expressão une notas diferentes. Como tocar?',options:[{'label': 'Ligado: só a primeira nota recebe ataque de língua'}, {'label': 'Separado: cada nota com novo ataque'}, {'label': 'Somar as durações numa nota só'}],answer:0,hint:'Ligadura de expressão = notas diferentes, um único sopro sem novo ataque.',correct:'Isso: um ataque, as outras notas emendadas.',incorrect:'Ainda não. Ligadura de expressão = notas diferentes, um único sopro sem novo ataque.',answerKey:'Ligado: só a primeira nota recebe ataque de língua',evidence:['leitura']},
 'S2-M07-L04-A01-2':{kind:'choice',instruction:'',prompt:'E quando a ligadura une duas notas iguais (mesma altura)?',options:[{'label': 'Soma as durações, sem novo ataque (prolongamento)'}, {'label': 'Toca as duas notas separadas'}, {'label': 'Vira uma pausa'}],answer:0,hint:'Ligadura entre notas iguais é de prolongamento.',correct:'Isso: é prolongamento.',incorrect:'Ainda não. Ligadura entre notas iguais é de prolongamento.',answerKey:'Soma as durações, sem novo ataque (prolongamento)',evidence:['leitura']},
 'S3-M10-L03-A03-1':{kind:'choice',instruction:'',prompt:'No trecho Si · Si♭ · Si · Si♭, qual passagem pede prática isolada?',options:[{'label': 'A troca Si ↔ Si♭, que muda o dedilhado'}, {'label': 'O primeiro Si sozinho'}, {'label': 'Nenhuma'}],answer:0,hint:'Isole a troca que exige dedilhado novo.',correct:'Isso: a troca de dedilhado é o ponto a isolar.',incorrect:'Ainda não. Isole a troca que exige dedilhado novo.',answerKey:'A troca Si ↔ Si♭, que muda o dedilhado',evidence:['leitura']},
 'S3-M10-L03-A03-2':{kind:'choice',instruction:'',prompt:'Em Fá · Sol · Lá · Si♭ · Dó, onde está a troca mais nova para a mão?',options:[{'label': 'Lá → Si♭'}, {'label': 'Fá → Sol'}, {'label': 'Sol → Lá'}],answer:0,hint:'Si♭ é a nota nova do trecho.',correct:'Isso: Lá → Si♭.',incorrect:'Ainda não. Si♭ é a nota nova do trecho.',answerKey:'Lá → Si♭',evidence:['leitura']},
 'S3-M10-L05-A02-1':{kind:'choice',instruction:'',prompt:'Trecho em Sol maior: Sol · Lá · Si · Dó · Ré · Dó · Si · Fá. Qual nota perdeu o sustenido da armadura?',options:[{'label': 'Fá'}, {'label': 'Si'}, {'label': 'Dó'}],answer:0,hint:'A armadura de Sol maior tem Fá♯.',correct:'Isso: o Fá deve ser Fá♯.',incorrect:'Ainda não. A armadura de Sol maior tem Fá♯.',answerKey:'Fá',evidence:['leitura']},
 'S3-M10-L05-A02-2':{kind:'choice',instruction:'',prompt:'Trecho em Fá maior: Fá · Sol · Lá · Si · Dó. Qual nota precisa de bemol?',options:[{'label': 'Si'}, {'label': 'Lá'}, {'label': 'Dó'}],answer:0,hint:'A armadura de Fá maior tem Si♭.',correct:'Isso: Si♭.',incorrect:'Ainda não. A armadura de Fá maior tem Si♭.',answerKey:'Si',evidence:['leitura']},
 'S3-M10-L04-A03-2':{kind:'choice',instruction:'',prompt:'E a armadura de Fá maior tem qual alteração?',options:[{label:'Um Si bemol'},{label:'Um Fá sustenido'},{label:'Nenhuma'}],answer:0,hint:'Fá maior: Fá Sol Lá Si♭ Dó Ré Mi.',correct:'Isso: Si♭.',incorrect:'Ainda não. Fá maior: Fá Sol Lá Si♭ Dó Ré Mi.',answerKey:'Um Si bemol',evidence:['leitura']},
 'S3-M10-L04-A01-2':{kind:'choice',instruction:'',prompt:'E qual sinal abaixa a nota em um semitom?',options:[{'label': 'Bemol'}, {'label': 'Sustenido'}, {'label': 'Bequadro'}],answer:0,hint:'Sustenido sobe, bemol desce, bequadro cancela.',correct:'Isso: bemol.',incorrect:'Ainda não. Sustenido sobe, bemol desce, bequadro cancela.',answerKey:'Bemol',evidence:['leitura']},
 'S4-M15-L01-A03-1':{kind:'choice',instruction:'',prompt:'A melodia chega a uma nota aguda que a turma ainda não toca. O que adaptar?',options:[{'label': 'Mudar a passagem de oitava ou trocar por outra nota da mesma harmonia'}, {'label': 'Pular a frase inteira'}, {'label': 'Forçar o sopro até sair'}],answer:0,hint:'Adapte a extensão preservando a ideia.',correct:'Isso: adapta a extensão sem perder a ideia.',incorrect:'Ainda não. Adapte a extensão preservando a ideia.',answerKey:'Mudar a passagem de oitava ou trocar por outra nota da mesma harmonia',evidence:['leitura']},
 'S4-M15-L01-A03-2':{kind:'choice',instruction:'',prompt:'Uma frase de oito compassos não deixa respirar. O que adaptar?',options:[{'label': 'Criar uma respiração no fim de uma ideia, encurtando a nota anterior'}, {'label': 'Tocar mais rápido'}, {'label': 'Tirar metade das notas'}],answer:0,hint:'Respiração planejada no fim de uma ideia.',correct:'Isso: ponto de respiração no fim da ideia.',incorrect:'Ainda não. Respiração planejada no fim de uma ideia.',answerKey:'Criar uma respiração no fim de uma ideia, encurtando a nota anterior',evidence:['leitura']}
};
/** Aplicação em exemplo novo, escolhida pelo foco da tarefa (não um formato aleatório). */
function focusOf(c:Ctx):'dedilhado'|'pauta'|'contorno'|'tempo'|'escuta'|'estrategia'{
 const text=`${c.task.task} ${c.task.material.question??''}`;
 if(/dedo|dedilhad|furo|polegar/i.test(text))return 'dedilhado';
 if(/pauta|linha|clave|escrit|ler |leitura|partitura|notação|sinal|armadura/i.test(text))return 'pauta';
 if(/sobe|desce|caminho|direç|ascend|descend|grave|agud|região|registro/i.test(text))return 'contorno';
 if(/pausa|silêncio|tempo|compasso|puls|ritm|figura|duraç|síncop|6\/8|subdivis/i.test(text))return 'tempo';
 if(/ouv|escut|modelo|grava|exemplo|som/i.test(text))return 'escuta';
 return 'estrategia';
}
function pulseTapSeed(meter:CourseMeter,lead:string,count=4):Seed{
 const pulse=meter==='6/8'?1.5:1,beats=Array.from({length:count},(_,i)=>i*pulse);
 return {kind:'tap',meter,bpm:meter==='6/8'?50:60,tapBeats:beats,tapLength:count*pulse,instruction:lead,prompt:`Depois da contagem, toque o botão em cada um dos ${count} pulsos${meter==='6/8'?' (cada pulso tem três colcheias)':''}.`,hint:'Toque junto com o clique, de forma regular.',correct:'Pulso regular.',incorrect:'Algum toque saiu do pulso. Escute o clique e toque junto.',answerKey:`${count} toques nos pulsos (±220 ms).`,evidence:['medicao-automatica']};
}
function applyNew(c:Ctx,notes:CourseNote[],meter:CourseMeter,lead:string):Seed{
 const m=c.task.material;
 switch(focusOf(c)){
  case 'dedilhado':{const used=new Set(pitched(m.notes));const midi=[...m.pool].reverse().find(p=>!used.has(p)&&fingeringFor(p))??[...used].reverse().find(p=>fingeringFor(p))??71;return fingeringSeed(midi,lead,' Outra nota, sem modelo ao lado.');}
  case 'pauta':return highestQuestion(notes,meter,lead,true)??restQuestion(notes,meter,lead)??contourQuestion(c,notes,meter,lead);
  case 'contorno':return contourQuestion(c,notes,meter,lead);
  case 'tempo':return restQuestion(notes,meter,lead)??tapSeed(firstBar(notes,meter),meter,lead)??pulseTapSeed(meter,lead);
  case 'escuta':return compareSeed(c,lead)??highestQuestion(notes,meter,lead)??contourQuestion(c,notes,meter,lead);
  default:return {...observeSeed(c,lead),evidence:['reflexao']};
 }
}
function generate(c:Ctx):Seed{
 const m=c.task.material,second=c.phase==='aplicacao',meter=m.meter,base=m.notes,fresh=newExample(base,m.pool,meter);
 const notes=second?fresh:base;const lead=second?`Exemplo novo · ${c.task.task}`:c.task.task;
 const recall=/^Recuperar/i.test(c.task.task)?RECALL[c.unit]:undefined;
 if(recall&&(m.mode==='perform'||m.mode==='choice'||m.mode==='listen')){const r=second?newExample(recall.notes,pitched(recall.notes),recall.meter):recall.notes;return performSeed(r,recall.meter,lead,second?'Recupere com um exemplo novo:':'Recupere o que você já sabe tocar:',`Material da unidade anterior: ${[...new Set(pitched(recall.notes))].map(p=>NAME[p]).join(', ')}.`);}
 const special=SPECIFIC[`${c.task.id}-${second?2:1}`];if(special)return {...special,instruction:lead};
 if(DRAFT[c.task.id]&&!second)return {...observeSeed(c,lead),status:'rascunho',draftReason:DRAFT[c.task.id]};
 if(c.L===5&&c.a===0&&STORIES[c.unit]&&!second){const s=STORIES[c.unit];return {kind:'choice',story:{title:s.title,scene:s.scene},instruction:'Resolva a história.',prompt:s.prompt,options:s.options.map(label=>({label})),answer:s.answer,hint:s.hint,correct:`Isso. ${s.hint}`,incorrect:`Ainda não. ${s.hint}`,answerKey:s.options[s.answer],evidence:['leitura']};}
 switch(m.mode){
  case 'fingering':{const named=notesInText(c.task.task).filter(p=>fingeringFor(p)||p===66||p===70);const targets=named.length?[...named,...pitched(base).filter(p=>!named.includes(p))]:[...new Set(pitched(base))];const midi=second?(targets[1]??[...m.pool].sort((x,y)=>y-x).find(p=>p!==targets[0])??targets[0]):targets[0];return fingeringSeed(midi,lead,second?' Agora sem o modelo ao lado.':'');}
  case 'perform':return performSeed(notes,meter,lead,second?'Toque este exemplo novo, ainda não ouvido:':'Toque o trecho na partitura:',m.guide);
  case 'tap':return /puls|caminhar|sentir agrupamentos|marcar/i.test(c.task.task)?pulseTapSeed(meter,lead,meter==='6/8'?2:/três tempos|3\/4/i.test(c.task.task)||meter==='3/4'?3:/dois tempos|2\/4/i.test(c.task.task)||meter==='2/4'?2:4):(tapSeed(firstBar(notes,meter),meter,lead)??performSeed(notes,meter,lead,'Toque o trecho:',m.guide));
  case 'compose':return createSeed(c,lead,second);
  case 'annotate':return annotateSeed(notes,meter,lead)??(second?applyNew(c,notes,meter,lead):strategySeed(c,lead));
  case 'reflect':return second?{...observeSeed(c,lead),evidence:['reflexao']}:strategySeed(c,lead);
  case 'ensemble':return second?{...performSeed(notes,meter,lead,'Exemplo novo: ouça a melodia com a voz de apoio do app e depois toque a melodia:',m.guide),audio:'duo'}:{kind:'choice',audio:'duo',notes:base,meter,bpm:66,instruction:lead,prompt:'Quantas vozes tocam juntas no exemplo?',options:[{label:'Uma'},{label:'Duas'},{label:'Quatro'}],answer:1,hint:'Uma voz faz a melodia; outra, um som de apoio mais grave.',correct:'Isso: duas vozes, melodia e apoio.',incorrect:'Ouça de novo: há uma melodia e um apoio por baixo.',answerKey:'Duas vozes.',evidence:['escuta']};
  case 'listen':return second?applyNew(c,notes,meter,lead):(compareSeed(c,lead)??contourQuestion(c,notes,meter,lead));
  case 'choice':default:return second?applyNew(c,notes,meter,lead):strategySeed(c,lead);
 }
}

export const EXERCISES:Exercise[]=[];
for(const task of COURSE_TASKS){
 if(task.assessment)continue;
 const parts=/^S\d-M(\d\d)-L0(\d)-A0(\d)$/.exec(task.id)!;const unit=Number(parts[1]),L=Number(parts[2]),a=Number(parts[3])-1,lessonId=task.lesson;
 for(const phase of ['descoberta','aplicacao'] as const){
  const slot=a*2+(phase==='descoberta'?1:2);
  const seed=unit===1?U1[lessonId][slot-1]:generate({task,unit,L,a,slot,phase});
  EXERCISES.push({...seed,id:`${task.id}-P${phase==='descoberta'?1:2}`,taskId:task.id,unit,lessonId,slot,phase,status:seed.status??'pronto',...(seed.draftReason?{draftReason:seed.draftReason}:{})} as Exercise);
 }
}
export const RETURN_RULE=RETORNO;
/* ---------- Nota nova: antes da primeira atividade que usa uma nota, uma tela ensina como fazer ---------- */
function pitchesOf(e:Exercise):number[]{
 const out=new Set<number>();
 for(const n of [...(e.notes??[]),...(e.alternative??[])])if(n.midi!==null)out.add(n.midi);
 if(e.target!==undefined)out.add(e.target);
 for(const c of e.create?.choices??[])if(c!==null)out.add(c);
 for(const c of e.create?.target??[])if(c!==null&&c!==undefined)out.add(c);
 return [...out];
}
/** Notas novas por lição, na ordem da trilha (primeira vez que cada nota aparece numa atividade pronta). */
export const NEW_NOTES=new Map<string,number[]>();
{
 const seen=new Set<number>(),lessons=[...new Set(EXERCISES.map(e=>e.lessonId))];
 for(const lessonId of lessons){
  const fresh:number[]=[];
  for(const e of EXERCISES.filter(x=>x.lessonId===lessonId&&x.status==='pronto').sort((x,y)=>x.slot-y.slot))for(const p of pitchesOf(e))if(!seen.has(p)&&fingeringFor(p)){seen.add(p);fresh.push(p);}
  if(fresh.length)NEW_NOTES.set(lessonId,fresh);
 }
}
export const MEET_EXERCISES:Exercise[]=[...NEW_NOTES].flatMap(([lessonId,notes])=>{
 const first=EXERCISES.find(e=>e.lessonId===lessonId)!;
 return notes.map((midi,i)=>({id:`${lessonId}-N${midi}-P1`,taskId:first.taskId,unit:first.unit,lessonId,slot:-notes.length+i,phase:'descoberta' as const,kind:'meet' as const,target:midi,notes:[{midi,beats:4}],meter:'4/4' as const,bpm:60,
  instruction:`Nota nova: ${NAME[midi]}`,prompt:`Veja como fazer o ${NAME[midi]}: feche os furos pintados, sopre leve como quem diz “tu” e escute o som.`,
  hint:`${NAME[midi]}: furos ${fingeringFor(midi)!.join(' · ')} fechados.`,correct:`Agora tu já sabe fazer o ${NAME[midi]}!`,incorrect:'',answerKey:`${NAME[midi]} = furos ${fingeringFor(midi)!.join(' · ')}.`,evidence:['leitura'],status:'pronto' as const}));
});
export function lessonExercises(lessonId:string,{includeDrafts=false}={}){return [...MEET_EXERCISES,...EXERCISES].filter(e=>e.lessonId===lessonId&&(includeDrafts||e.status==='pronto')).sort((x,y)=>x.slot-y.slot);}
export function exerciseById(id:string){return EXERCISES.find(e=>e.id===id)??MEET_EXERCISES.find(e=>e.id===id);}

/* ---------- Correção ---------- */
export function checkFingering(ex:Exercise,holes:readonly number[],system:RecorderSystem='baroque'){
 const expected=ex.target!==undefined?(fingeringFor(ex.target,system)??ex.holes??[]):ex.holes??[];
 return expected.length===holes.length&&expected.every(h=>holes.includes(h));
}
export function checkCreation(ex:Exercise,values:readonly (number|null|undefined)[]){
 const c=ex.create!;if(values.length!==c.slots||values.some(v=>v===undefined))return false;
 const notes=values.filter(v=>v!==null) as number[];
 switch(c.rule){
  case 'entries3':return notes.length===3;
  case 'two-each-71-69':return notes.length===4&&notes.filter(v=>v===71).length===2&&notes.filter(v=>v===69).length===2;
  case 'one-rest':return notes.length===3;
  case 'fill-bar':return notes.length>=1;
  case 'match':return values.every((v,i)=>v===c.target![i]);
  case 'ends-low':{const low=Math.min(...(c.choices.filter(v=>v!==null) as number[]));return notes.length>=1&&values[values.length-1]===low;}
 }
}
export type TapVerdict={ok:boolean;early:number;late:number;missing:number;extra:number;firstEarlyBeat?:number};
/** Toques em unidades de semínima a partir do primeiro tempo do compasso. */
export function scoreTaps(expected:readonly number[],taps:readonly number[],quarterMs:number,toleranceMs=220):TapVerdict{
 const used=new Set<number>();let early=0,late=0,missing=0;let firstEarlyBeat:number|undefined;
 for(const beat of expected){
  let best=-1,bestDiff=Infinity;taps.forEach((t,i)=>{if(used.has(i))return;const d=Math.abs(t-beat)*quarterMs;if(d<bestDiff){bestDiff=d;best=i;}});
  if(best>=0&&bestDiff<=toleranceMs){used.add(best);continue;}
  missing++;
  const near=taps.findIndex((t,i)=>!used.has(i)&&t<beat&&beat-t<=1.6);
  if(near>=0){early++;used.add(near);if(firstEarlyBeat===undefined)firstEarlyBeat=Math.round(taps[near]);}
  else if(taps.some((t,i)=>!used.has(i)&&t>beat))late++;
 }
 const extra=taps.length-used.size;
 return {ok:missing===0&&extra===0,early,late,missing,extra,...(firstEarlyBeat!==undefined?{firstEarlyBeat}:{})};
}
export function tapFeedback(ex:Exercise,v:TapVerdict){
 if(v.ok)return ex.correct;
 if(v.early&&ex.tapBeats?.length===1&&ex.tapBeats[0]===1&&v.firstEarlyBeat===0)return 'Sua nota começou no primeiro pulso. Prepare o dedo ali e espere o segundo para tocar.';
 if(v.early)return 'Você entrou antes do tempo. Espere o pulso combinado e toque junto com ele.';
 if(v.extra&&!v.missing)return 'Houve toques a mais. Nas pausas e nos tempos de espera, não toque.';
 if(v.late)return 'Você entrou depois do tempo. Prepare antes e toque junto com o clique.';
 return ex.incorrect;
}

/* ---------- Contagem por unidade ---------- */
export function unitCounts(){
 return Array.from({length:16},(_,i)=>{const list=EXERCISES.filter(e=>e.unit===i+1);const tasks=new Set(list.map(e=>e.taskId)).size;
  return {unit:i+1,tasks,presentations:list.length,ready:list.filter(e=>e.status==='pronto').length,draft:list.filter(e=>e.status==='rascunho').length,teacher:list.filter(e=>e.teacher||e.evidence.includes('avaliacao-docente')).length,autoChecked:list.filter(e=>e.status==='pronto'&&(e.answer!==undefined||e.holes?.length||e.tapBeats||e.create)).length};});
}
