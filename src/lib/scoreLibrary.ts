export type LibraryScore={id:string;title:string;description:string;xml:string;imported?:boolean;instrumentId?:string};
function note(step:string|null,beats:number):string{
  const duration=beats*4,type=beats===4?'whole':beats===2?'half':beats===.5?'eighth':'quarter';
  return `<note>${step?`<pitch><step>${step[0]}</step><octave>${step.slice(1)||4}</octave></pitch>`:'<rest/>'}<duration>${duration}</duration><type>${type}</type></note>`;
}
export function studyXml(title:string,bars:readonly (readonly [string|null,number][])[],instrumentId='trumpet-bb'):string{
  const recorder=instrumentId==='recorder-soprano',name=recorder?'Flauta doce soprano':'Trompete em Si♭';
  const clef=recorder?'<clef-octave-change>1</clef-octave-change>':'';
  const transpose=recorder?'<diatonic>0</diatonic><chromatic>0</chromatic><octave-change>1</octave-change>':'<diatonic>-1</diatonic><chromatic>-2</chromatic>';
  const attributes=`<attributes><divisions>4</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line>${clef}</clef><transpose>${transpose}</transpose></attributes><direction placement="above"><direction-type><words>Com calma</words></direction-type><sound tempo="60"/></direction>`;
  const measures=bars.map((bar,i)=>`<measure number="${i+1}">${i===0?attributes:""}${bar.map(([s,b])=>note(s,b)).join("")}</measure>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><work><work-title>${title}</work-title></work><part-list><score-part id="P1"><part-name>${name}</part-name></score-part></part-list><part id="P1">${measures}</part></score-partwise>`;
}
export const SCORE_LIBRARY:readonly LibraryScore[]=[
  {id:'sertao-primeiros-passos',title:'Primeiros passos no sertão',description:'Duas notas longas e pausas para respirar. 2 compassos.',xml:studyXml('Primeiros passos no sertão',[[['G',2],[null,2]],[['F',2],[null,2]]])},
  {id:'sertao-caminho',title:'O caminho de cinco notas',description:'Dó, Ré, Mi, Fá e Sol em uma melodia de 4 compassos.',xml:studyXml('O caminho de cinco notas',[[['C',1],['D',1],['E',1],['F',1]],[['G',2],[null,2]],[['G',1],['F',1],['E',1],['D',1]],[['C',2],[null,2]]])},
  {id:'sertao-pulso',title:'O silêncio também canta',description:'Pratique notas repetidas e pausas. 4 compassos.',xml:studyXml('O silêncio também canta',[[['G',1],[null,1],['G',1],[null,1]],[['F',1],['E',1],['F',1],[null,1]],[['G',2],['F',1],[null,1]],[['E',2],[null,2]]])},
];
export const RECORDER_SCORE_LIBRARY:readonly LibraryScore[]=[
 {id:'recorder-si-la-sol',instrumentId:'recorder-soprano',title:'Si, Lá, Sol no sertão',description:'Três notas, dois compassos e pausas para descansar.',xml:studyXml('Si, Lá, Sol no sertão',[[['B',1],['A',1],['G',1],[null,1]],[['G',2],[null,2]]],'recorder-soprano')},
 {id:'recorder-conversa',instrumentId:'recorder-soprano',title:'Conversa de flautas',description:'Uma melodia original com Si, Lá, Sol, Dó e Ré.',xml:studyXml('Conversa de flautas',[[['B',1],['A',1],['G',2]],[['A',1],['B',1],['C5',1],['D5',1]],[['C5',2],['B',1],['A',1]],[['G',2],[null,2]]],'recorder-soprano')},
 {id:'recorder-silencio',instrumentId:'recorder-soprano',title:'O sopro e o silêncio',description:'Notas repetidas, mínimas e pausas em quatro compassos.',xml:studyXml('O sopro e o silêncio',[[['B',1],[null,1],['B',1],[null,1]],[['A',2],[null,1],['G',1]],[['A',1],['B',1],['A',1],[null,1]],[['G',2],[null,2]]],'recorder-soprano')},
];
export function scoresForInstrument(id:string):readonly LibraryScore[]{return id==='recorder-soprano'?RECORDER_SCORE_LIBRARY:SCORE_LIBRARY;}

