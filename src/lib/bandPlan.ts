import type {CourseMeter} from './recorderFullCourse.ts';

/**
 * Plano do trompete e do clarinete no mesmo molde do plano da flauta (recorder-discipline-v1.json):
 * 4 seções · 16 módulos · 5 lições por módulo (Descobrir, Discriminar, Executar, Ler e criar,
 * Aplicar e recuperar) · 3 atividades por lição. Os temas dos módulos seguem os da flauta; mudam
 * as notas, a ordem em que aparecem e os dedilhados de cada instrumento. Pensado para a criança
 * estudar sozinha: os exemplos tocam no app e nada depende de professor.
 */
export type PlanInstrument='trumpet-bb'|'clarinet-bb';
export type PlanStyle='longas'|'pausas'|'frase'|'ritmo'|'duo'|'registro'|'alteracao'|'ternario'|'ajuste'|'carater'|'ornamento'|'arranjo'|'final';
export type PlanQuestion={prompt:string;options:string[];answer:number;hint:string};
export type PlanModule={number:number;section:number;title:string;goal:string;focus:string;style:PlanStyle;meter:CourseMeter;
 newNotes:Record<PlanInstrument,number[]>;theory:Record<PlanInstrument,PlanQuestion>;story:{title:string;scene:string}&PlanQuestion};
export const PLAN_SECTIONS=[{number:1,title:'Primeiros Passos',level:'A1'},{number:2,title:'Fundamentos',level:'A2'},{number:3,title:'Intermediário',level:'B1'},{number:4,title:'Autonomia Musical',level:'B2'}];
export const LESSON_NAMES=['Descobrir','Discriminar','Executar','Ler e criar','Aplicar e recuperar'] as const;
export const INSTRUMENT_WORD:Record<PlanInstrument,{name:string;article:string}>={'trumpet-bb':{name:'trompete',article:'o'},'clarinet-bb':{name:'clarinete',article:'o'}};

const same=(q:PlanQuestion)=>({'trumpet-bb':q,'clarinet-bb':q});
const both=(n:number[])=>({'trumpet-bb':n,'clarinet-bb':n});

export const PLAN_MODULES:PlanModule[]=[
 {number:1,section:1,title:'Conhecer o instrumento e produzir o primeiro som',goal:'Faça teu instrumento falar',focus:'o primeiro som',style:'longas',meter:'4/4',newNotes:both([67]),
  theory:{'trumpet-bb':{prompt:'Como nasce o som no trompete?',options:['Os lábios vibram dentro do bocal, como um zumbido','Os dedos batem nos pistos','O trompete toca sozinho'],answer:0,hint:'No trompete quem vibra são os lábios, encostados no bocal.'},
   'clarinet-bb':{prompt:'Como nasce o som no clarinete?',options:['A palheta vibra encostada no lábio de baixo','Os dedos batem nas chaves','O ar sai pela campana sem vibrar'],answer:0,hint:'No clarinete quem vibra é a palheta, presa na boquilha.'}},
  story:{title:'O instrumento precisa encontrar sua voz',scene:'Tu soprou com toda a força e o som saiu estourado.',prompt:'O que ajuda?',options:['Soprar com calma, ar firme e sem força demais','Soprar mais forte ainda','Parar de tocar pra sempre'],answer:0,hint:'Som bonito vem de ar firme e calmo, não de força.'}},
 {number:2,section:1,title:'Conversar com sol e fá',goal:'Converse com duas notas',focus:'Sol e Fá',style:'longas',meter:'4/4',newNotes:both([65]),
  theory:same({prompt:'Sol e Fá: qual soa mais agudo (mais fino)?',options:['Sol','Fá','Os dois iguais'],answer:0,hint:'Na pauta o Sol fica acima do Fá e soa mais fino.'}),
  story:{title:'Sol e Fá conversando',scene:'O exemplo tocou Sol e depois Fá.',prompt:'O som subiu ou desceu?',options:['Desceu','Subiu','Ficou igual'],answer:0,hint:'Do Sol pro Fá a melodia desce um degrau.'}},
 {number:3,section:1,title:'Mi, pulsação e silêncio',goal:'Toque e saiba esperar',focus:'a pausa e o pulso',style:'pausas',meter:'4/4',newNotes:both([64]),
  theory:same({prompt:'O que a pausa pede?',options:['Silêncio contado, sem soprar','Tocar mais forte','Tocar mais rápido'],answer:0,hint:'Pausa é silêncio que também se conta.'}),
  story:{title:'O silêncio também é música',scene:'Na partitura tinha uma pausa, mas tu continuou soprando.',prompt:'O que corrigir?',options:['Parar o ar na pausa e contar os tempos','Soprar mais forte na pausa','Pular a pausa'],answer:0,hint:'Na pausa o ar para, e tu continua contando.'}},
 {number:4,section:1,title:'Minha primeira peça',goal:'Toque tua primeira música',focus:'tua primeira música',style:'frase',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'Antes de tocar uma música nova, o que ajuda?',options:['Ouvir o exemplo e conferir os dedilhados','Tocar o mais rápido possível','Pular as partes difíceis'],answer:0,hint:'Ouvir primeiro faz a mão e o ouvido se prepararem.'}),
  story:{title:'A primeira música do ensaio',scene:'Tu errou uma nota no meio da música.',prompt:'O que fazer?',options:['Seguir no pulso e depois treinar só o trecho difícil','Parar e começar do zero toda vez','Desistir da música'],answer:0,hint:'Quem segue o pulso não se perde; o trecho difícil se treina depois.'}},
 {number:5,section:2,title:'Ampliar as notas e alcançar o registro grave',goal:'Descubra sons mais graves',focus:'as notas graves',style:'longas',meter:'4/4',newNotes:both([62,60]),
  theory:{'trumpet-bb':{prompt:'Pras notas graves no trompete, o ar deve ser…',options:['Mais lento e largo, com os lábios mais soltos','Rápido e com os lábios bem apertados','Nenhum ar'],answer:0,hint:'Grave no trompete pede ar largo e lábios relaxados.'},
   'clarinet-bb':{prompt:'Pras notas graves no clarinete, o mais importante é…',options:['Fechar bem cada furo, com a pontinha do dedo','Deixar os furos meio abertos','Morder a palheta'],answer:0,hint:'Um furo meio aberto faz o grave chiar.'}},
  story:{title:'A melodia precisa de um final mais grave',scene:'A melodia termina em Mi, mas pediram um final mais grave.',prompt:'Qual nota serve?',options:['Dó','Sol','Fá'],answer:0,hint:'Dó é a nota mais grave que tu já sabe.'}},
 {number:6,section:2,title:'Ritmos e compassos',goal:'Encontre o ritmo da música',focus:'semínimas, colcheias e mínimas',style:'ritmo',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'No compasso 4/4, quantos tempos vale a mínima?',options:['2','1','4'],answer:0,hint:'Semínima = 1, mínima = 2, semibreve = 4.'}),
  story:{title:'O ritmo fugiu',scene:'Tu tocou as colcheias devagar demais.',prompt:'O que ajuda?',options:['Contar o pulso e dividir cada tempo em dois','Tocar sem contar','Tocar tudo em mínimas'],answer:0,hint:'Duas colcheias cabem num tempo só.'}},
 {number:7,section:2,title:'Articular e organizar frases',goal:'Dê forma à tua frase',focus:'frases com respiração',style:'frase',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'Onde é melhor respirar numa frase?',options:['Na pausa ou no fim de uma ideia','No meio de uma nota longa','Em qualquer lugar'],answer:0,hint:'Respirar na pausa não quebra a música.'}),
  story:{title:'A frase ficou sem fôlego',scene:'O ar acabou no meio da frase.',prompt:'O que planejar?',options:['Respirar fundo na pausa antes da frase','Respirar no meio da nota longa','Não respirar'],answer:0,hint:'Planeje a respiração antes de começar.'}},
 {number:8,section:2,title:'Tocar em duo',goal:'Toque com outra pessoa',focus:'tocar junto com outra voz',style:'duo',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'Tocando junto, o que mais importa?',options:['Ouvir a outra voz e manter o pulso','Tocar mais alto que todo mundo','Ir mais rápido'],answer:0,hint:'Junto é ouvir e pulsar igual.'}),
  story:{title:'Um colega se perdeu no ensaio',scene:'No duo, um errou e parou. O outro continuou sozinho.',prompt:'O que o duo deve fazer?',options:['Combinar um ponto de encontro e voltar com contagem','Começar tudo do zero sempre','Cada um seguir sozinho'],answer:0,hint:'Um ponto combinado reúne os dois.'}},
 {number:9,section:3,title:'Ampliar o registro',goal:'Explore novos registros',focus:'as notas novas do registro',style:'registro',meter:'4/4',newNotes:{'trumpet-bb':[69,71,72],'clarinet-bb':[69,57,55]},
  theory:{'trumpet-bb':{prompt:'Pras notas mais agudas no trompete…',options:['Ar mais rápido e lábios um pouco mais firmes, sem apertar o bocal','Apertar o bocal com força na boca','Soprar menos ar'],answer:0,hint:'Agudo vem do ar rápido, não da força no bocal.'},
   'clarinet-bb':{prompt:'Como se faz o Lá da garganta no clarinete?',options:['Aperta a chave do Lá com o indicador esquerdo, com os furos abertos','Fecha todos os furos','Aperta todas as chaves'],answer:0,hint:'O Lá usa só a chave do Lá, em cima.'}},
  story:{title:'A melodia mudou de andar',scene:'A mesma melodia apareceu noutra região do instrumento.',prompt:'O que muda pra tocar?',options:['Os dedilhados das notas novas e o jeito de soprar','Nada muda','Só a velocidade'],answer:0,hint:'Nota nova pede dedilhado novo e ar ajustado.'}},
 {number:10,section:3,title:'Alterações e caminhos tonais',goal:'Descubra novos caminhos',focus:'Fá♯ e Si♭',style:'alteracao',meter:'4/4',newNotes:both([66,70]),
  theory:same({prompt:'O que faz o sustenido (♯)?',options:['Sobe a nota meio tom','Desce a nota meio tom','Deixa a nota mais longa'],answer:0,hint:'Sustenido sobe, bemol desce, bequadro cancela.'}),
  story:{title:'A nota não combina com a versão do grupo',scene:'O grupo toca em Sol maior. Tu tocou Fá natural onde a partitura pede Fá♯.',prompt:'O que corrigir?',options:['Tocar Fá sustenido','Tocar mais forte','Tirar a nota'],answer:0,hint:'Sol maior tem Fá♯ na armadura.'}},
 {number:11,section:3,title:'Compasso ternário e novos ritmos',goal:'Brinque com o ritmo',focus:'o compasso 3/4',style:'ternario',meter:'3/4',newNotes:both([]),
  theory:same({prompt:'Quantos tempos tem o compasso 3/4?',options:['3','4','2'],answer:0,hint:'O número de cima diz quantos tempos cabem.'}),
  story:{title:'A valsa da festa',scene:'A música da festa é uma valsa, em 3/4.',prompt:'Como contar?',options:['1-2-3, 1-2-3','1-2-3-4','1-2, 1-2'],answer:0,hint:'Valsa tem três tempos, com o primeiro mais forte.'}},
 {number:12,section:3,title:'Escutar, ajustar e afinar',goal:'Resolva um ensaio',focus:'afinação e ajuste',style:'ajuste',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'Teu som ficou um pouco abaixo do exemplo. O que tentar?',options:['Ouvir de novo e ajustar o ar com calma','Tocar mais forte pra cobrir','Parar de ouvir o exemplo'],answer:0,hint:'Afinar é ouvir e ajustar devagar.'}),
  story:{title:'O ensaio desafinado',scene:'Tu e o exemplo tocaram a mesma nota, mas o som “ondulou”.',prompt:'O que fazer?',options:['Ouvir com atenção e ajustar o ar devagar','Tocar mais forte pra cobrir','Parar de ouvir'],answer:0,hint:'A ondulação some quando as duas notas se encontram.'}},
 {number:13,section:4,title:'Articulação, caráter e estilo',goal:'Escolha como interpretar',focus:'caráter e articulação',style:'carater',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'Staccato quer dizer…',options:['Notas curtinhas e separadas','Notas bem ligadas','Notas muito fortes'],answer:0,hint:'Staccato = curtinho, com espaço entre as notas.'}),
  story:{title:'Todos tocam as notas, mas as frases não combinam',scene:'Cada um tocou de um jeito e a música ficou bagunçada.',prompt:'O que combinar?',options:['A articulação e onde respirar','Só a roupa da apresentação','Nada'],answer:0,hint:'Combinar o jeito de tocar une o grupo.'}},
 {number:14,section:4,title:'Ornamentar e variar',goal:'Crie uma nova versão',focus:'variações',style:'ornamento',meter:'4/4',newNotes:{'trumpet-bb':[74],'clarinet-bb':[]},
  theory:same({prompt:'Uma variação da melodia…',options:['Muda um pedaço e mantém a ideia principal','Troca a música toda','Toca só uma nota'],answer:0,hint:'Variar é brincar com a melodia sem perder ela.'}),
  story:{title:'A melodia ficou repetitiva',scene:'Tu tocou a mesma frase quatro vezes, sempre igual.',prompt:'Como variar?',options:['Mudar o ritmo de um pedaço e manter a ideia','Trocar todas as notas','Tocar mais rápido'],answer:0,hint:'Uma mudança pequena já faz diferença.'}},
 {number:15,section:4,title:'Adaptar melodias e criar um arranjo',goal:'Monte teu arranjo',focus:'arranjar uma melodia',style:'arranjo',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'Num arranjo, uma nota aguda demais pra quem toca…',options:['Pode virar outra nota da mesma harmonia ou mudar de oitava','Deve ser forçada até sair','Faz a música parar'],answer:0,hint:'Adaptar é manter a ideia com notas que dá pra tocar.'}),
  story:{title:'Entrou um novo músico na banda',scene:'Chegou alguém que só toca três notas.',prompt:'Que função dar a ele?',options:['Um acompanhamento com essas três notas','A melodia mais aguda','Nenhuma'],answer:0,hint:'Todo mundo cabe num bom arranjo.'}},
 {number:16,section:4,title:'Projeto final e continuidade',goal:'Prepare tua apresentação',focus:'a apresentação',style:'final',meter:'4/4',newNotes:both([]),
  theory:same({prompt:'Antes de se apresentar, o que ajuda?',options:['Ensaiar o começo e o fim e respirar com calma','Tocar sem ensaiar','Mudar a música na hora'],answer:0,hint:'Começo e fim seguros dão confiança.'}),
  story:{title:'Dia de apresentação',scene:'Bateu um nervosismo antes de tocar.',prompt:'O que ajuda?',options:['Respirar fundo, lembrar do começo e tocar com calma','Tocar rapidinho pra acabar logo','Sair correndo'],answer:0,hint:'Respirar fundo acalma o corpo e o som.'}},
];

/** Notas que a criança já conhece até o módulo `n` (inclusive), na ordem em que apareceram. */
export function poolUntil(i:PlanInstrument,n:number):number[]{return [...new Set(PLAN_MODULES.filter(m=>m.number<=n).flatMap(m=>m.newNotes[i]))];}

/** Textos das 3 atividades de cada lição (aparecem em “O que tu vai praticar” e no plano). */
export function lessonTasks(i:PlanInstrument,m:PlanModule,L:number,names:(midi:number)=>string):[string,string,string]{
 const word=INSTRUMENT_WORD[i].name,fresh=m.newNotes[i].map(names),pool=poolUntil(i,m.number).map(names);
 const list=(a:string[])=>a.length<=1?a.join(''):`${a.slice(0,-1).join(', ')} e ${a[a.length-1]}`;
 const one=pool.length<2,first=names(m.newNotes[i][0]??poolUntil(i,m.number).slice(-1)[0]);
 switch(L){
  case 0:return m.number===1?[`Conhecer o ${word} e a postura pra tocar.`,`Ver, ouvir e montar a primeira nota: ${list(fresh)}.`,'Descobrir o som pelo ouvido.']:
   [`Ouvir um exemplo com ${m.focus} e dizer se sobe ou desce.`,fresh.length?`Conhecer ${list(fresh)}: pauta, dedilhado e som.`:`Relembrar os dedilhados de ${list(pool.slice(-4))}.`,'Descobrir a nota pelo som.'];
  case 1:return [one?'Comparar dois sons pelo ouvido.':'Comparar dois sons e dizer qual é mais agudo.',one?'Sentir o pulso e tocar junto com ele.':'Reconhecer uma nota pelo som.',`Entender e aplicar: ${m.theory[i].prompt.replace(/\?$/,'').replace(/…$/,'')}.`];
  case 2:return [`Montar o dedilhado de ${first} sem soprar.`,`Bater o ritmo de um trecho com ${m.focus} e depois tocar.`,'Tocar variações do trecho, com calma.'];
  case 3:return ['Ler notas na pauta.','Criar um compasso e fazer um ditado.','Tocar lendo a partitura.'];
  default:return [`Resolver a história “${m.story.title}”.`,`Tocar um trecho novo e depois tocar sem ouvir antes.`,m.number===1?'Tocar de novo, agora sem ouvir o exemplo antes.':'Recuperar o que tu aprendeu no módulo anterior.'];
 }
}
