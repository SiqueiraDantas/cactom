import { formatWrittenNote, type PracticeNote } from './music.ts';

export type InstrumentProfile = { id:string; name:string; emoji:string; description:string; available:boolean; transpose:number; writtenRange:readonly [number,number] };
export const INSTRUMENTS:readonly InstrumentProfile[]=[
  {id:'trumpet-bb',name:'Trompete',emoji:'🎺',description:'Pistos, primeiros sons e melodias em Si♭',available:true,transpose:-2,writtenRange:[60,84]},
  {id:'recorder-soprano',name:'Flauta doce',emoji:'♫',description:'Soprano em Dó · furos, sons e primeiras melodias',available:true,transpose:12,writtenRange:[60,74]},
  {id:'conductor',name:'Regência · Maestro',emoji:'🎼',description:'Aprenda a reger com movimentos reais pela câmera',available:true,transpose:0,writtenRange:[60,84]},
  {id:'clarinet-bb',name:'Clarinete',emoji:'♬',description:'Notas, digitações e prática com microfone em Si♭',available:true,transpose:-2,writtenRange:[50,94]},
  {id:'alto-sax',name:'Saxofone',emoji:'🎷',description:'O som que tem personalidade',available:false,transpose:-9,writtenRange:[58,89]},
  {id:'trombone',name:'Trombone',emoji:'♬',description:'Notas que deslizam pelo sertão',available:false,transpose:0,writtenRange:[40,72]},
  {id:'flute',name:'Flauta transversal',emoji:'♪',description:'Leveza para a sua próxima descoberta',available:false,transpose:0,writtenRange:[60,96]},
];
export const TRUMPET=INSTRUMENTS[0];
export function availableInstrument(id:unknown):InstrumentProfile|null{return INSTRUMENTS.find(i=>i.id===id&&i.available)??null;}
const fingerings:readonly (readonly number[])[]=[[],[1,2,3],[1,3],[2,3],[1,2],[1],[2],[],[2,3],[1,2],[1],[2],[],[1,2],[1],[2],[],[1],[2],[],[2,3],[1,2],[1],[2],[]];
export function trumpetNote(midi:number):PracticeNote{
  if(!Number.isInteger(midi)||midi<60||midi>84)throw new Error('Use notas escritas de Dó4 a Dó6 para o curso atual de trompete.');
  const valves=fingerings[midi-60];
  return {id:`written-${midi}`,writtenMidi:midi,label:formatWrittenNote(midi),valves,valveDescription:valves.length?valves.join(' + '):'Aberto (0)'};
}
