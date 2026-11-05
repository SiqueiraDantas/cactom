import {barBeats,courseNote,type CourseMeter,type CourseNote} from '../lib/recorderFullCourse';
import {BASS_CLEF_PATH} from '../lib/trebleClef';
type Props={notes:readonly CourseNote[];meter:CourseMeter;active?:number;marks?:readonly number[];results?:readonly boolean[];onMark?:(index:number)=>void;slur?:boolean;single?:boolean;
 /** Partitura de flauta tem o “8” em cima da clave (soa 8ª acima). Trompete/clarinete não. */
 instrument?:string;
 /** Esconde o nome embaixo das notas (atividades de leitura: o nome é a resposta). */
 hideLabels?:boolean;
 /** Clave: sol (padrão) ou fá (curso de iniciação). */
 clef?:'sol'|'fa'};
/** Responsive, font-independent noteheads, flags and rests; four bars per staff row. */
export function RecorderCourseScore({notes,meter,active=-1,marks=[],results=[],onMark,slur=false,single=false,instrument='flauta doce soprano',hideLabels=false,clef='sol'}:Props){
 const shift=clef==='fa'?12:0;
 const bar=barBeats(meter);let offset=0;
 const items=notes.map((n,index)=>{const at=offset;offset+=n.beats;return {n,index,at,measure:Math.floor((at+1e-6)/bar)};});
 /** Colcheias seguidas dentro do mesmo tempo (ou do mesmo grupo de 3 no 6/8) ficam ligadas por barra. */
 const pulse=meter==='6/8'?1.5:1,xOf=(at:number,measure:number)=>122+(measure%2)*260+(at%bar)/bar*235;
 const yOf=(midi:number)=>102-([0,0,1,1,2,3,3,4,4,5,5,6][midi%12]+7*(Math.floor(midi/12)-5)+shift)*6;
 /** Haste para baixo a partir da 3ª linha (Si) pra cima; grupo com barra segue a média das notas. */
 const MIDDLE=66;
 const beams:{indexes:number[];y:number;x1:number;x2:number;row:number;down:boolean}[]=[];const beamOf=new Map<number,number>();
 for(let i=0;i<items.length;){
  const group=[items[i]];
  const eighth=(e:typeof items[number])=>e.n.midi!==null&&e.n.beats===.5&&!e.n.tie;
  if(eighth(items[i])){const slot=Math.floor((items[i].at+1e-6)/pulse);let j=i+1;while(j<items.length&&eighth(items[j])&&Math.floor((items[j].at+1e-6)/pulse)===slot&&items[j].measure===items[i].measure)group.push(items[j++]);}
  if(group.length>=2){const ys=group.map(e=>yOf(e.n.midi!)),down=ys.reduce((a,b)=>a+b,0)/ys.length<=MIDDLE,off=down?-7:7;const y=down?Math.max(...ys)+33:Math.min(...ys)-33;beams.push({indexes:group.map(e=>e.index),y:down?y-5.5:y,x1:xOf(group[0].at,group[0].measure)+off,x2:xOf(group[group.length-1].at,group[group.length-1].measure)+off,row:Math.floor(group[0].measure/2),down});group.forEach(e=>beamOf.set(e.index,beams.length-1));}
  i+=group.length;
 }
 const [top,bottom]=meter.split('/');
 const measures=Math.max(1,Math.ceil(offset/bar)),rows=Array.from({length:Math.ceil(measures/2)},(_,i)=>i);
 return <div className="recorder-course-score" role="group" aria-label={`Partitura em ${meter}, clave de ${clef==='fa'?'fá':'sol'}; ${instrument}${instrument==='flauta doce soprano'?', escrita uma oitava abaixo do som':''}`}>
  {rows.map(row=><svg key={row} viewBox={single?"0 0 364 156":"0 0 640 156"} role="img" aria-label={`Compassos ${row*2+1} a ${Math.min(row*2+2,measures)}`}>
   {[42,54,66,78,90].map(y=><line x1="15" x2={single?360:625} y1={y} y2={y} stroke="#bdccc7" strokeWidth="1.2" key={y}/>)}
   {clef==='fa'?<path d={BASS_CLEF_PATH} transform="translate(24 54) scale(0.036)" fill="#315c60"/>:<path d="M45 98c-26-8-14-32 3-38 18-6 25 17 12 25-14 8-30-7-19-20 16-20 25-36 20-47-15 6-7 43-3 67l4 25c2 13-17 20-20 6-2-8 8-9 11-4" fill="none" stroke="#315c60" strokeWidth="3" strokeLinecap="round"/>}
   {instrument==='flauta doce soprano'&&<text x="49" y="12" fontSize="11" textAnchor="middle" fill="#466e68">8</text>}
   {row===0&&<g fill="#315c60" fontSize="23" fontWeight="800" textAnchor="middle" aria-label={`Compasso ${meter}`}><text x="80" y="62">{top}</text><line x1="71" x2="89" y1="67.5" y2="67.5" stroke="#315c60" strokeWidth="2.6" strokeLinecap="round"/><text x="80" y="89">{bottom}</text></g>}
   {[1,2].map(m=><line key={m} x1={100+m*260} x2={100+m*260} y1="42" y2="90" stroke="#76928a" strokeWidth={m===2?2:1}/>)}
   {[0,1].map(m=><text key={m} x={108+m*260} y="24" fontSize="11" fill="#6e8478">{row*2+m+1<=measures?row*2+m+1:''}</text>)}
   {slur&&[0,1].map(measure=>{const own=items.filter(e=>e.measure===row*2+measure&&e.n.midi!==null).slice(0,3);if(own.length<2)return null;const first=own[0],last=own[own.length-1],x1=122+measure*260+(first.at%bar)/bar*235,x2=122+measure*260+(last.at%bar)/bar*235;return <path key={'slur-'+measure} d={`M${x1} 99Q${(x1+x2)/2} 119 ${x2} 99`} fill="none" stroke="#527569" strokeWidth="1.7" aria-label="Ligadura de expressão"/>;})}
   {items.filter(e=>Math.floor(e.measure/2)===row).map(({n,index,at,measure})=>{
    const x=122+(measure%2)*260+(at%bar)/bar*235;
    const degree=n.midi===null?0:[0,0,1,1,2,3,3,4,4,5,5,6][n.midi%12]+7*(Math.floor(n.midi/12)-5)+shift;
    const y=n.midi===null?66:102-degree*6;
    const color=results[index]===true?'#23823f':results[index]===false?'#b73c34':active===index?'#dd8b14':'#315c60';
    const label=n.midi===null?'Pausa':courseNote(n.midi).label,whole=n.beats===4,open=n.beats>=2;
    return <g key={index} color={color} onClick={onMark?()=>onMark(index):undefined} role={onMark?'button':undefined} tabIndex={onMark?0:undefined} onKeyDown={onMark?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onMark(index);}}:undefined} aria-label={`${label}, duração escrita ${n.beats===.5?'colcheia':n.beats===1?'semínima':n.beats===1.5?'semínima pontuada':n.beats===2?'mínima':n.beats===3?'mínima pontuada':'semibreve'}${marks.includes(index)?', marcado':''}`}>
     {(active===index||marks.includes(index))&&<rect x={x-17} y="27" width="35" height="89" rx="8" fill={marks.includes(index)?'#e5f2e3':'#fff0c9'}/>}
     {n.midi===null?<Rest x={x} beats={n.beats}/>:<>
      {[102,114,126].filter(l=>l<=y+0.5).map(l=><line key={l} x1={x-14} x2={x+14} y1={l} y2={l} stroke="currentColor" strokeWidth="1.5"/>)}
      <ellipse cx={x} cy={y} rx={whole?10:8} ry="5.2" transform={`rotate(-16 ${x} ${y})`} fill={open?'white':'currentColor'} stroke="currentColor" strokeWidth="1.8"/>
      {!whole&&(()=>{const beam=beamOf.has(index)?beams[beamOf.get(index)!]:null,down=beam?beam.down:y<=MIDDLE,sx=down?x-7:x+7,end=beam?(down?beam.y+5.5:beam.y):down?y+33:y-33;return <>
       <line x1={sx} x2={sx} y1={down?y+1:y-1} y2={end} stroke="currentColor" strokeWidth="2"/>
       {n.beats===.5&&!beam&&<path d={down?`M${sx} ${end}q17 -9 3 -20q8 12 -3 14`:`M${sx} ${end}q17 9 3 20q8-12-3-14`} fill="currentColor"/>}
      </>;})()}
      {n.beats===1.5||n.beats===3?<circle cx={x+15} cy={y-2} r="2" fill="currentColor"/>:null}
      {clef==='sol'&&[66,70].includes(n.midi)&&<text x={x-21} y={y+5} fontSize="21" fill="currentColor">{n.midi===66?'♯':'♭'}</text>}
     </>}
     {n.midi===null&&(n.beats===1.5||n.beats===3)&&<circle cx={x+13} cy={60} r="2.2" fill="currentColor"/>}
     {n.tie&&<path d={`M${x} ${y+10}q${235*n.beats/bar/2} 13 ${235*n.beats/bar} 0`} fill="none" stroke="currentColor" strokeWidth="1.7"/>}
     {!hideLabels&&<text x={x} y="135" textAnchor="middle" fill="currentColor" fontSize="10.5">{clef==='fa'?label.replace(/ \d$/,''):label.replace(' 4','').replace(' 5','↑')}</text>}
     {marks.includes(index)&&<text x={x} y="152" textAnchor="middle" fill="#49804a" fontSize="10">ponto</text>}
    </g>;
   })}
   {beams.filter(b=>b.row===row).map(b=>{const tone=b.indexes.map(i=>results[i]===true?'#23823f':results[i]===false?'#b73c34':'#315c60');return <rect key={'beam-'+b.indexes[0]} x={b.x1-1} y={b.y} width={b.x2-b.x1+2} height="5.5" fill={tone.every(t=>t===tone[0])?tone[0]:'#315c60'} aria-hidden="true"/>;})}
  </svg>)}
 </div>;
}

/** Pausas no tamanho da pauta (linhas a cada 12px; 3ª linha em y=66), centradas no pentagrama. */
function Rest({x,beats}:{x:number;beats:number}){
 if(beats>=4)return <rect x={x-8} y={54} width="16" height="7" fill="currentColor"/>;
 if(beats>=2)return <rect x={x-8} y={59} width="16" height="7" fill="currentColor"/>;
 if(beats>=1)return <path transform={`translate(${x-15.8} ${66-30*.72}) scale(.72)`} d="m22 5 11 14-9 11 8 11c-8-5-17-2-16 4 0 4 3 7 7 10-13-3-16-15-7-21l5-3-8-9 11-7z" fill="currentColor"/>;
 return <g fill="currentColor"><circle cx={x-4} cy={59} r="3.6"/><path d={`M${x-6} 61q6 3 11-3`} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><path d={`M${x+5} 58 ${x-2} 80`} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></g>;
}
