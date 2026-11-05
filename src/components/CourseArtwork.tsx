import {TREBLE_CLEF_PATH} from '../lib/trebleClef';
/**
 * Ilustrações dos cursos no estilo “desenho plano com volume”: formas cheias, sem contorno,
 * um tom de sombra e um de brilho por material, leve inclinação e fundo redondo colorido.
 * Decorativas; os exercícios de dedilhado continuam com os diagramas exatos.
 */
const PAL={
 gold:{base:'#ffc31f',shade:'#e8a000',light:'#ffe27a',deep:'#b97800'},
 silver:{base:'#dfe9ef',shade:'#b6c7d1',light:'#ffffff',deep:'#8aa0ad'},
 cream:{base:'#fff0cf',shade:'#f2d49b',light:'#ffffff',deep:'#9a6a3c'},
 ebony:{base:'#3d4350',shade:'#2a2e37',light:'#5d6574',deep:'#1d2027'},
};
const BG:Record<string,[string,string]>={'trumpet-bb':['#fff3d1','#ffe3a1'],'recorder-soprano':['#e6f7dc','#c9eeb4'],'conductor':['#e8f1ff','#c9dcff'],'clarinet-bb':['#ececff','#d6d5ff'],'alto-sax':['#fff0dc','#ffd9a8'],'trombone':['#ffefe6','#ffd2bb'],'flute':['#e3f6f7','#bfe9ec'],'iniciacao':['#ffe6ef','#ffc7da']};

function Sparkles({color}:{color:string}){
 return <g fill={color}>
  <path d="M50 40l3.5 8 8 3.5-8 3.5-3.5 8-3.5-8-8-3.5 8-3.5z"/>
  <path d="M194 120l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5z"/>
  <circle cx="190" cy="36" r="4.5"/>
 </g>;
}

function Trumpet(){const g=PAL.gold;
 return <g transform="rotate(-14 120 92)">
  <path d="M66 98q0 30 26 30h34q24 0 24-24V96" fill="none" stroke={g.shade} strokeWidth="13" strokeLinecap="round"/>
  <path d="M66 98q0 26 26 26h34q20 0 20-20" fill="none" stroke={g.base} strokeWidth="7" strokeLinecap="round"/>
  <rect x="30" y="72" width="120" height="16" rx="8" fill={g.base}/>
  <rect x="30" y="80" width="120" height="8" rx="4" fill={g.shade}/>
  <rect x="36" y="74" width="100" height="4" rx="2" fill={g.light}/>
  <path d="M146 80 L198 50 Q212 80 198 110 Z" fill={g.base}/>
  <path d="M146 80 L198 80 Q206 96 198 110 Z" fill={g.shade}/>
  <ellipse cx="200" cy="80" rx="10" ry="31" fill={g.deep}/>
  <ellipse cx="203" cy="80" rx="6" ry="25" fill="#7a4c00" opacity=".55"/>
  <path d="M190 57q-8 23 0 46" stroke={g.light} strokeWidth="4" fill="none" strokeLinecap="round"/>
  {[72,96,120].map(x=><g key={x}>
   <rect x={x-8} y="52" width="16" height="44" rx="6" fill={g.base}/>
   <rect x={x} y="52" width="8" height="44" rx="4" fill={g.shade}/>
   <rect x={x-11} y="42" width="22" height="12" rx="6" fill={g.light}/>
   <rect x={x-11} y="49" width="22" height="5" rx="2.5" fill={g.shade}/>
  </g>)}
  <rect x="18" y="74" width="16" height="12" rx="4" fill={PAL.silver.base}/>
  <ellipse cx="18" cy="80" rx="5" ry="10" fill={PAL.silver.shade}/>
 </g>;
}
function Recorder(){const c=PAL.cream;
 return <g transform="translate(14 10) scale(.88) rotate(28 120 90)">
  <path d="M106 16h28l-3 30h-22z" fill="#a8703f"/>
  <path d="M120 16h14l-3 30h-11z" fill="#8a5a30"/>
  <rect x="104" y="44" width="32" height="104" rx="13" fill={c.base}/>
  <rect x="122" y="44" width="14" height="104" rx="7" fill={c.shade}/>
  <rect x="109" y="50" width="6" height="92" rx="3" fill={c.light}/>
  <rect x="110" y="54" width="16" height="9" rx="3" fill="#6b4425"/>
  <path d="M102 146h36l6 18q-24 10-48 0z" fill={c.base}/>
  <path d="M120 146h18l6 18q-12 5-24 5z" fill={c.shade}/>
  <rect x="103" y="76" width="34" height="5" rx="2.5" fill={c.shade}/>
  {[90,104,118,132].map(y=><circle key={y} cx="120" cy={y} r="5" fill="#6b4425"/>)}
  <circle cx="116" cy="142" r="3" fill="#6b4425"/><circle cx="124" cy="142" r="3" fill="#6b4425"/>
 </g>;
}
function Clarinet(){const e=PAL.ebony,s=PAL.silver;
 return <g transform="translate(14 8) scale(.88) rotate(26 120 90)">
  <path d="M112 12h16l-2 16h-12z" fill={e.deep}/>
  <rect x="110" y="26" width="20" height="14" rx="3" fill={s.base}/>
  <rect x="108" y="38" width="24" height="108" rx="9" fill={e.base}/>
  <rect x="121" y="38" width="11" height="108" rx="5" fill={e.shade}/>
  <rect x="112" y="44" width="4" height="96" rx="2" fill={e.light}/>
  {[66,104].map(y=><rect key={y} x="106" y={y} width="28" height="7" rx="3.5" fill={s.base}/>)}
  {[56,80,92,116,128].map((y,i)=><g key={y}><circle cx={i%2?126:115} cy={y} r="5.5" fill={s.base}/><circle cx={i%2?126:115} cy={y} r="2.3" fill={s.deep}/></g>)}
  <path d="M106 144h28l14 22q-28 12-56 0z" fill={e.base}/>
  <path d="M120 144h14l14 22q-14 6-28 6z" fill={e.shade}/>
  <rect x="104" y="142" width="32" height="7" rx="3.5" fill={s.base}/>
 </g>;
}
function Conductor(){const c=PAL.cream;
 return <g>
  <path d="M58 132q50-70 128-62" fill="none" stroke="#9cbcf2" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 14"/>
  <path d="M70 148q46-48 112-46" fill="none" stroke="#b8cff6" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14"/>
  <g transform="rotate(-48 116 96)">
   <rect x="112" y="16" width="9" height="120" rx="4.5" fill="#ffffff"/>
   <rect x="117" y="16" width="4" height="120" rx="2" fill={PAL.silver.shade}/>
   <path d="M106 126h21l3 34q-13 8-27 0z" fill="#c9884a"/>
   <path d="M117 126h10l3 34q-6 4-13 4z" fill="#a46a32"/>
   <rect x="108" y="130" width="4" height="26" rx="2" fill="#e7b37a"/>
   <ellipse cx="116.5" cy="126" rx="12" ry="4" fill={c.shade}/>
  </g>
  <path d="M176 34l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" fill="#ffc31f"/>
  <path d="M196 74l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#7aa7f5"/>
 </g>;
}
function Sax(){const g=PAL.gold;
 return <g transform="rotate(12 120 90)">
  <path d="M138 20h18v14h-18z" fill={PAL.ebony.base}/>
  <path d="M130 30h22v86q0 40-40 40-38 0-38-34v-14" fill="none" stroke={g.shade} strokeWidth="30" strokeLinejoin="round" strokeLinecap="round"/>
  <path d="M128 30h18v84q0 34-34 34-30 0-30-26v-12" fill="none" stroke={g.base} strokeWidth="22" strokeLinejoin="round" strokeLinecap="round"/>
  <path d="M136 36v74" stroke={g.light} strokeWidth="4" strokeLinecap="round"/>
  <path d="M60 92h50l-6 22H66z" fill={g.base}/>
  <ellipse cx="85" cy="92" rx="26" ry="9" fill={g.deep}/>
  <ellipse cx="85" cy="92" rx="18" ry="5" fill="#7a4c00" opacity=".5"/>
  {[52,70,88,106].map(y=><g key={y}><circle cx="137" cy={y} r="6.5" fill={g.light}/><circle cx="137" cy={y} r="3" fill={g.shade}/></g>)}
 </g>;
}
function Trombone(){const g=PAL.gold;
 return <g transform="rotate(-12 120 92)">
  <path d="M40 112h120" stroke={g.shade} strokeWidth="9" strokeLinecap="round"/>
  <path d="M40 84h120" stroke={g.base} strokeWidth="9" strokeLinecap="round"/>
  <path d="M40 84v28" stroke={g.shade} strokeWidth="9" strokeLinecap="round"/>
  <path d="M60 98h96" stroke={g.base} strokeWidth="8" strokeLinecap="round"/>
  <path d="M160 84l38-24q12 34 0 66l-38-14z" fill={g.base}/>
  <path d="M160 98l38 0q6 14 0 28l-38-14z" fill={g.shade}/>
  <ellipse cx="200" cy="93" rx="9" ry="33" fill={g.deep}/>
  <path d="M190 68q-6 25 0 50" stroke={g.light} strokeWidth="4" fill="none" strokeLinecap="round"/>
  <path d="M48 80h104" stroke={g.light} strokeWidth="3" strokeLinecap="round"/>
 </g>;
}
function Flute(){const s=PAL.silver;
 return <g transform="rotate(-22 120 90)">
  <rect x="24" y="78" width="192" height="20" rx="10" fill={s.base}/>
  <rect x="24" y="88" width="192" height="10" rx="5" fill={s.shade}/>
  <rect x="32" y="81" width="170" height="4" rx="2" fill={s.light}/>
  <ellipse cx="52" cy="87" rx="7" ry="5" fill={s.deep}/>
  {[96,116,136,156,176].map(x=><g key={x}><circle cx={x} cy="88" r="8" fill={s.light}/><circle cx={x} cy="88" r="5" fill={s.shade}/></g>)}
  <rect x="200" y="76" width="10" height="24" rx="3" fill={s.shade}/>
 </g>;
}
/** Iniciação musical: pauta com clave de Sol e duas colcheias, sem instrumento. */
function Notes(){
 return <g>
  <rect x="44" y="56" width="152" height="70" rx="14" fill="#ffffff"/>
  {[70,80,90,100,110].map(y=><rect key={y} x="56" y={y} width="128" height="2.4" rx="1.2" fill="#f3a3bf"/>)}
  <path d={TREBLE_CLEF_PATH} transform="translate(60 100) scale(0.035)" fill="#c2185b"/>
  <g fill="#c2185b">
   <ellipse cx="118" cy="105" rx="8.5" ry="6" transform="rotate(-18 118 105)"/>
   <ellipse cx="152" cy="95" rx="8.5" ry="6" transform="rotate(-18 152 95)"/>
   <rect x="124" y="64" width="3.4" height="41" rx="1.5"/>
   <rect x="158" y="54" width="3.4" height="41" rx="1.5"/>
   <path d="M124 64 L161.4 54 V63 L124 73 Z"/>
  </g>
  <path d="M182 44l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ff8fb1"/>
 </g>;
}
export function CourseArtwork({instrument}:{instrument:string}){
 const [bg,bg2]=BG[instrument]??BG['recorder-soprano'];
 return <svg className="course-artwork" viewBox="28 8 184 160" aria-hidden="true" focusable="false">
  <circle cx="120" cy="88" r="74" fill={bg}/>
  <path d="M46 106a74 74 0 0 0 148 0q-74 28-148 0z" fill={bg2} opacity=".7"/>
  {instrument==='trumpet-bb'&&<Trumpet/>}
  {instrument==='recorder-soprano'&&<Recorder/>}
  {instrument==='clarinet-bb'&&<Clarinet/>}
  {instrument==='conductor'&&<Conductor/>}
  {instrument==='alto-sax'&&<Sax/>}
  {instrument==='trombone'&&<Trombone/>}
  {instrument==='flute'&&<Flute/>}
  {instrument==='iniciacao'&&<Notes/>}
  <Sparkles color={bg2}/>
 </svg>;
}
