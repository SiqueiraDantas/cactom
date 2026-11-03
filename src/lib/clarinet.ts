import {formatWrittenNote,type PracticeNote} from './music.ts';
export const CLARINET_ID='clarinet-bb';
export type ClarinetFingering={midi:number;keys:readonly string[];explanation:string};
/** Digitações básicas de mão esquerda (registro chalumeau), sem chave de registro. */
export const CLARINET_FINGERINGS:readonly ClarinetFingering[]=[
  {midi:67,keys:[],explanation:'Sol4: todos os orifícios abertos, sem a chave de registro.'},
  {midi:65,keys:['T'],explanation:'Fá4: polegar esquerdo fecha o orifício traseiro.'},
  {midi:64,keys:['T','1'],explanation:'Mi4: polegar + indicador esquerdo.'},
  {midi:62,keys:['T','1','2'],explanation:'Ré4: polegar + indicador e médio esquerdos.'},
  {midi:60,keys:['T','1','2','3'],explanation:'Dó4: polegar + indicador, médio e anelar esquerdos.'},
];
export function clarinetNote(midi:number):PracticeNote{
  const fingering=CLARINET_FINGERINGS.find(f=>f.midi===midi);
  if(!fingering)throw new Error('Este curso inicial usa Dó4, Ré4, Mi4, Fá4 e Sol4 escritos.');
  return {id:`clarinet-${midi}`,writtenMidi:midi,label:formatWrittenNote(midi),valves:[],transposeSemitones:-2,
    valveDescription:fingering.explanation};
}
export type ClarinetLesson={id:string;title:string;summary:string;goal:string;unit:number;kind:'explore'|'sound';notes:readonly number[];holdMs:number;instruction:string};
export const CLARINET_LESSONS:readonly ClarinetLesson[]=[
  {id:'cla-conhecendo',title:'Conheça o clarinete',summary:'Mão esquerda e chaves',goal:'Conhecer as posições de Sol, Fá e Mi.',unit:0,kind:'explore',notes:[67,65,64],holdMs:0,instruction:'Explore as digitações. A mão esquerda fica na parte superior; mantenha dedos arredondados.'},
  {id:'cla-primeiro-sol',title:'Meu primeiro Sol',summary:'Uma nota confortável',goal:'Ouvir e sustentar Sol4 escrito.',unit:0,kind:'sound',notes:[67],holdMs:1000,instruction:'Sem tapar os orifícios, ouça a referência e toque Sol4 com emissão confortável.'},
  {id:'cla-primeiro-fa',title:'Descubra o Fá',summary:'O polegar entra em cena',goal:'Encontrar Fá4 e sustentar o som.',unit:0,kind:'sound',notes:[65],holdMs:1000,instruction:'Feche suavemente o orifício traseiro com o polegar esquerdo.'},
  {id:'cla-primeiro-mi',title:'Chegou o Mi',summary:'Polegar e indicador',goal:'Tocar Mi4 escrito.',unit:1,kind:'sound',notes:[64],holdMs:1100,instruction:'Polegar mais indicador esquerdo; procure manter a coluna de ar estável.'},
  {id:'cla-tres-notas',title:'Sol, Fá e Mi',summary:'Descendo nota por nota',goal:'Conectar Sol4, Fá4 e Mi4.',unit:1,kind:'sound',notes:[67,65,64],holdMs:900,instruction:'Ouça cada nota antes de tocá-la. Troque os dedos sem apertar as chaves.'},
  {id:'cla-primeiro-re',title:'Mais um dedo: Ré',summary:'O médio da mão esquerda',goal:'Tocar Ré4 escrito.',unit:1,kind:'sound',notes:[62,64],holdMs:1000,instruction:'Polegar, indicador e médio para Ré4; volte ao Mi4 para comparar.'},
  {id:'cla-primeiro-do',title:'Dó completa a família',summary:'Três dedos da mão esquerda',goal:'Encontrar Dó4 escrito.',unit:2,kind:'sound',notes:[60,62],holdMs:1000,instruction:'Feche polegar, indicador, médio e anelar esquerdos; evite forçar o sopro.'},
  {id:'cla-primeira-melodia',title:'Uma frase de cinco notas',summary:'Dó, Ré, Mi, Fá, Sol',goal:'Tocar uma sequência simples.',unit:2,kind:'sound',notes:[60,62,64,65,67],holdMs:850,instruction:'Primeiro cante ou escute as notas; toque uma por vez, no seu ritmo.'},
  {id:'cla-desafio',title:'Meu primeiro desafio',summary:'A melodia vai e volta',goal:'Reconhecer e tocar a sequência completa.',unit:2,kind:'sound',notes:[67,65,64,62,60,62,64,65,67],holdMs:800,instruction:'Complete a escadinha descendente e ascendente, com pequenas pausas para respirar.'},
];
export const CLARINET_UNITS=[
  {title:'Conhecendo o clarinete',description:'A mão esquerda e os primeiros sons',color:'blue'},
  {title:'Três notas, muitas possibilidades',description:'Sol, Fá, Mi e Ré',color:'green'},
  {title:'Seu primeiro repertório',description:'Dó e pequenas melodias',color:'orange'},
] as const;
export function clarinetPitchMatches(frequency:number,midi:number,tolerance=65):boolean{
  if(!Number.isFinite(frequency)||frequency<=0)return false;
  const expected=440*2**((midi-2-69)/12);
  return Math.abs(1200*Math.log2(frequency/expected))<=tolerance;
}
