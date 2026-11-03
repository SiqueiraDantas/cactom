import { recorderNote, type RecorderSystem } from './recorder.ts';
import { trumpetNote } from './instruments.ts';
import type { PracticeNote } from './music.ts';

export type ScoreSegment={cursorIndex:number;startBeat:number;beats:number};
export type ScoreEvent={id:string;kind:'note'|'rest';note:PracticeNote|null;startBeat:number;beats:number;measureIndex:number;segments:ScoreSegment[]};
export type ScoreMeasure={index:number;label:string;startBeat:number;beats:number};
export type ParsedScore={id:string;title:string;xml:string;events:ScoreEvent[];measures:ScoreMeasure[];beatsPerBar:number;bpm:number;totalBeats:number;instrumentId:string;warnings:string[]};
export const MAX_XML_SIZE=512*1024;
function children(element:Element,name?:string):Element[]{
  return Array.from(element.childNodes).filter((n):n is Element=>n.nodeType===1).filter(n=>!name||(n.localName||n.nodeName)===name);
}
function child(element:Element,name:string):Element|undefined{return children(element,name)[0];}
function text(element:Element,name:string,fallback=''):string{return child(element,name)?.textContent?.trim()??fallback;}
function number(element:Element,name:string,fallback?:number):number{
  const value=text(element,name);const n=value===''?fallback:Number(value);
  if(n===undefined||!Number.isFinite(n))throw new Error(`Valor musical inválido: ${name}.`);return n;
}
function reject(message:string):never{throw new Error(message);}
function scoreId(xml:string):string{let hash=2166136261;for(let i=0;i<xml.length;i++){hash^=xml.charCodeAt(i);hash=Math.imul(hash,16777619);}return `xml-${(hash>>>0).toString(16)}-${xml.length}`;}
export function parseMusicXml(source:string,parse:(xml:string)=>Document=xml=>new DOMParser().parseFromString(xml,'application/xml'),instrumentId='trumpet-bb',recorderSystem:RecorderSystem='baroque'):ParsedScore{
  const recorder=instrumentId==='recorder-soprano';
  if(!recorder&&instrumentId!=='trumpet-bb')reject('Este instrumento ainda não tem curso.');
  if(new TextEncoder().encode(source).length>MAX_XML_SIZE)reject('A partitura deve ter no máximo 512 KB.');
  if(/<!ENTITY|<!DOCTYPE[^>]*\[/i.test(source))reject('O arquivo contém entidades XML que não são aceitas.');
  // Common MusicXML exports reference a DTD. Remove the declaration; never fetch it.
  const xml=source.replace(/<!DOCTYPE[^>]*>/gi,'');
  const doc=parse(xml),root=doc.documentElement;
  if(!root||(root.localName||root.nodeName)!=='score-partwise'||doc.getElementsByTagName('parsererror').length)reject('Não foi possível ler o MusicXML. Use um arquivo .musicxml ou .xml válido do tipo partwise.');
  const all=Array.from(root.getElementsByTagName('*'));
  if(all.some(e=>['script','iframe','image','credit-image','style','link'].includes(e.localName||e.nodeName)||Array.from(e.attributes).some(a=>/^(href|src|xlink:href)$/i.test(a.name))))reject('Use uma partitura sem imagens, links ou conteúdo externo.');
  for(const tag of ['backup','forward','chord','grace','time-modification','repeat','multiple-rest','unpitched'])if(root.getElementsByTagName(tag).length)reject('Use uma linha melódica simples, sem acordes, vozes simultâneas, repetições, quiálteras ou notas de ornamento.');
  const parts=children(root,'part');if(parts.length!==1)reject('Importe uma partitura com uma única parte do instrumento.');
  const bars=children(parts[0],'measure');if(!bars.length||bars.length>64)reject('Use uma partitura com 1 a 64 compassos.');
  let divisions=1,beats=4,beatType=4,position=0,cursorIndex=0,tempo=60,voice:string|null=null,pendingTie:number|null=null,tempoSet=false;
  const events:ScoreEvent[]=[],measures:ScoreMeasure[]=[],warnings:string[]=[];
  const steps:Record<string,number>={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  const id=(recorder?'recorder-':'')+scoreId(xml);
  bars.forEach((bar,measureIndex)=>{
    const attributes=child(bar,'attributes');
    if(attributes){
      if(child(attributes,'divisions'))divisions=number(attributes,'divisions');
      if(divisions<=0||divisions>1000000)reject('A divisão rítmica do arquivo é inválida.');
      if(child(attributes,'staves')&&number(attributes,'staves')!==1)reject('Use uma única pauta.');
      const time=child(attributes,'time');
      if(time){const nextBeats=number(time,'beats'),nextType=number(time,'beat-type');if(measureIndex>0&&(nextBeats!==beats||nextType!==beatType))reject('Use o mesmo compasso em toda a partitura.');beats=nextBeats;beatType=nextType;}
      if(beatType!==4||![2,3,4].includes(beats))reject('Nesta etapa, use compassos 2/4, 3/4 ou 4/4.');
      const clef=child(attributes,'clef');if(clef&&(text(clef,'sign')!=='G'||number(clef,'line',2)!==2))reject('Use clave de Sol na segunda linha.');
      const transpose=child(attributes,'transpose');
      if(recorder){
        if(transpose&&(number(transpose,'chromatic',0)!==0||number(transpose,'octave-change',0)!==1))reject('Exporte as notas escritas para flauta doce soprano, com oitava acima do escrito.');
        if(clef&&child(clef,'clef-octave-change')&&number(clef,'clef-octave-change')!==1)reject('Use a clave de Sol com 8 acima para flauta doce soprano.');
      }else if(transpose&&(number(transpose,'chromatic')!==-2||number(transpose,'octave-change',0)!==0))reject('Exporte as notas escritas para trompete em Si♭, com transposição de dois semitons abaixo.');
    }
    const start=position;
    for(const item of children(bar)){
      const name=item.localName||item.nodeName;
      if(name==='direction'){
        const sound=child(item,'sound'),metronome=child(child(item,'direction-type')??item,'metronome');
        if(metronome&&(text(metronome,'beat-unit','quarter')!=='quarter'||child(metronome,'beat-unit-dot')))reject('Use andamento indicado pela semínima, sem mudanças de unidade.');
        const value=sound?.getAttribute('tempo')||metronome&&text(metronome,'per-minute');
        if(value){const n=Number(value);if(!Number.isFinite(n)||n<=0)reject('O andamento da partitura é inválido.');if((tempoSet||position>0)&&n!==tempo)reject('Use andamento constante durante todo o estudo.');tempo=n;tempoSet=true;}
        continue;
      }
      if(name!=='note')continue;
      if(cursorIndex>=512)reject('Use no máximo 512 notas ou pausas.');
      const currentVoice=text(item,'voice','1');if(voice!==null&&voice!==currentVoice)reject('Use uma única voz melódica.');voice=currentVoice;
      if(number(item,'staff',1)!==1)reject('Use apenas a primeira pauta.');
      const length=number(item,'duration')/divisions;if(length<=0||length>4||!Number.isInteger(length*4))reject('Use notas e pausas de semicolcheia a semibreve, incluindo figuras pontuadas que caibam no compasso.');
      const type=text(item,'type'),dots=children(item,'dot').length;
      const values:Record<string,number>={whole:4,half:2,quarter:1,eighth:.5,'16th':.25};
      if(type&&(!(type in values)||dots>2||Math.abs(values[type]*(2-2**(-dots))-length)>.00001))reject('A duração e a figura escrita divergem ou a figura não é suportada.');
      const rest=!!child(item,'rest');let note:PracticeNote|null=null;
      if(!rest){const pitch=child(item,'pitch');if(!pitch)reject('Uma nota está sem altura musical.');
        const letter=text(pitch,'step'),octave=number(pitch,'octave'),alter=number(pitch,'alter',0);
        if(!(letter in steps)||!Number.isInteger(octave)||!Number.isInteger(alter)||Math.abs(alter)>2)reject('A altura musical da nota não é compatível.');
        const midi=(octave+1)*12+steps[letter]+alter;note=recorder?recorderNote(midi,recorderSystem):trumpetNote(midi);
      }
      const ties=children(item,'tie').map(t=>t.getAttribute('type'));
      const segment={cursorIndex:cursorIndex++,startBeat:position,beats:length};
      if(ties.includes('stop')){
        const previous=events[events.length-1];
        if(rest||pendingTie!==note?.writtenMidi||!previous||previous.kind!=='note')reject('Há uma ligadura sem nota anterior compatível.');
        previous.beats+=length;previous.segments.push(segment);
      }else{
        if(pendingTie!==null)reject('Uma ligadura de prolongamento não foi fechada.');
        events.push({id:`${id}-event-${events.length}`,kind:rest?'rest':'note',note,startBeat:position,beats:length,measureIndex,segments:[segment]});
      }
      pendingTie=ties.includes('start')?note?.writtenMidi??null:null;
      position+=length;
    }
    if(Math.abs(position-start-beats)>.00001)reject(`O compasso ${bar.getAttribute('number')??measureIndex+1} precisa conter ${beats} tempos completos. Anacruses e compassos incompletos ainda não são aceitos.`);
    measures.push({index:measureIndex,label:bar.getAttribute('number')??String(measureIndex+1),startBeat:start,beats});
  });
  if(pendingTie!==null)reject('A última ligadura de prolongamento não foi fechada.');
  if(!events.some(e=>e.kind==='note'))reject('A partitura precisa ter pelo menos uma nota.');
  const clamped=Math.max(45,Math.min(120,tempo));
  if(clamped!==tempo)warnings.push(`Andamento original: ${tempo} BPM. O estudo foi ajustado para ${clamped} BPM, dentro da faixa de treino.`);
  const titleNode=root.getElementsByTagName('work-title')[0]??root.getElementsByTagName('movement-title')[0];
  return {id,title:titleNode?.textContent?.trim().slice(0,120)||'Minha partitura',xml,events,measures,beatsPerBar:beats,bpm:clamped,totalBeats:position,instrumentId,warnings};
}
