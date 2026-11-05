import type {ReactElement} from 'react';
/**
 * Ícones dos cursos no formato “bandeirinha” da escolha de oficina: quadrado arredondado
 * colorido com o instrumento desenhado em formas planas. Decorativos (aria-hidden).
 */
const TILE:Record<string,string>={'trumpet-bb':'#58B9F5','recorder-soprano':'#7FD05B','clarinet-bb':'#FFCB3D','conductor':'#A98BF7','iniciacao':'#FF8FB1'};
const GOLD={base:'#FFC51F',shade:'#E39A00',light:'#FFE58A'},SILVER={base:'#EEF3F6',shade:'#B9C7D0'};

function Trumpet(){
 return <g>
  <path d="M38 50 Q30 64 44 64 H72 Q82 64 80 50" fill="none" stroke={GOLD.shade} strokeWidth="7" strokeLinecap="round"/>
  <path d="M38 48 Q31 61 44 61 H72 Q80 61 79 48" fill="none" stroke={GOLD.base} strokeWidth="4" strokeLinecap="round"/>
  <rect x="17" y="35" width="74" height="8" rx="4" fill={GOLD.base}/>
  <rect x="17" y="39" width="74" height="4" rx="2" fill={GOLD.shade}/>
  <path d="M86 35 L108 22 Q114 39 108 56 L86 43 Z" fill={GOLD.base}/>
  <path d="M86 39 L110 39 Q111 48 108 56 L86 43 Z" fill={GOLD.shade}/>
  <ellipse cx="109" cy="39" rx="4" ry="17" fill="#B97400"/>
  {[48,59,70].map(x=><g key={x}>
   <rect x={x-4} y="29" width="8" height="26" rx="3" fill={GOLD.base}/>
   <rect x={x} y="29" width="4" height="26" rx="2" fill={GOLD.shade}/>
   <rect x={x-1.5} y="22" width="3" height="8" fill={SILVER.shade}/>
   <rect x={x-5} y="19" width="10" height="5" rx="2.5" fill={SILVER.base}/>
  </g>)}
  <path d="M8 37 H18 V41 H8 Q5 39 8 37 Z" fill={SILVER.base}/>
  <rect x="20" y="36" width="20" height="2" rx="1" fill={GOLD.light}/>
 </g>;
}
function Recorder(){
 const wood='#F6DEAE',woodShade='#E3BF82',dark='#7A4B26',ring='#C89058';
 return <g transform="rotate(40 60 45) translate(0 -3)">
  <path d="M54 0 H66 L65.5 13 H54.5 Z" fill="#A8703F"/>
  <path d="M60 0 H66 L65.5 13 H60 Z" fill="#8C5A30"/>
  <rect x="52" y="12" width="16" height="20" rx="4" fill={wood}/>
  <rect x="60" y="12" width="8" height="20" rx="3" fill={woodShade}/>
  <rect x="56" y="17" width="8" height="4" rx="1" fill={dark}/>
  <rect x="51.5" y="30" width="17" height="4" rx="2" fill={ring}/>
  <rect x="53" y="33" width="14" height="50" rx="4" fill={wood}/>
  <rect x="60" y="33" width="7" height="50" rx="3" fill={woodShade}/>
  {[39,46,53,61,68].map(y=><circle key={y} cx="59.5" cy={y} r="2.3" fill={dark}/>)}
  <circle cx="57.6" cy="75" r="1.5" fill={dark}/><circle cx="61.4" cy="75" r="1.5" fill={dark}/>
  <rect x="51.5" y="81" width="17" height="4" rx="2" fill={ring}/>
  <path d="M53 84 H67 L70 95 H50 Z" fill={wood}/>
  <path d="M60 84 H67 L70 95 H60 Z" fill={woodShade}/>
 </g>;
}
function Clarinet(){
 const ebony='#2F343E',ebonyLight='#4A5160',key=SILVER.base,keyShade=SILVER.shade;
 return <g transform="rotate(-40 60 45) translate(0 -3)">
  <path d="M56.5 0 H63.5 L64 12 H56 Z" fill={ebony}/>
  <rect x="55" y="7" width="10" height="3" rx="1.5" fill={key}/>
  <rect x="54" y="12" width="12" height="10" rx="3" fill={ebony}/>
  <rect x="53.5" y="12" width="13" height="2.5" rx="1.2" fill={key}/>
  <rect x="53.5" y="20" width="13" height="2.5" rx="1.2" fill={key}/>
  <rect x="55" y="22" width="10" height="58" rx="2" fill={ebony}/>
  <rect x="55.5" y="23" width="3" height="56" rx="1.5" fill={ebonyLight}/>
  <rect x="54" y="50" width="12" height="3" rx="1.5" fill={key}/>
  {[29,36,43,59,66,73].map(y=><g key={y}><circle cx="60" cy={y} r="2.8" fill={key}/><circle cx="60" cy={y} r="1.3" fill={ebony}/></g>)}
  <path d="M65 31 V46 M65 61 V74" stroke={keyShade} strokeWidth="1.6" strokeLinecap="round"/>
  <rect x="53.5" y="79" width="13" height="3" rx="1.5" fill={key}/>
  <path d="M55 82 H65 L72 96 H48 Z" fill={ebony}/>
  <path d="M48 95 H72" stroke={key} strokeWidth="2.4" strokeLinecap="round"/>
 </g>;
}
function Baton(){
 return <g>
  <path d="M22 62 Q40 18 72 24 Q96 28 98 52" fill="none" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 7"/>
  <path d="M36 66 L94 20" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round"/>
  <path d="M36 66 L94 20" stroke="#E1D8FF" strokeWidth="1.4" strokeLinecap="round" transform="translate(1 1)"/>
  <ellipse cx="33" cy="69" rx="6.5" ry="9" transform="rotate(52 33 69)" fill="#C98A4B"/>
  <ellipse cx="31.5" cy="70.5" rx="3" ry="6" transform="rotate(52 31.5 70.5)" fill="#E2AC6C"/>
  <g fill="#FFFFFF">
   <ellipse cx="86" cy="68" rx="5" ry="3.8" transform="rotate(-20 86 68)"/>
   <rect x="89.5" y="50" width="2.2" height="18" rx="1.1"/>
   <path d="M91 50 Q99 54 97 62 Q95 56 91 56 Z"/>
  </g>
 </g>;
}
function Notes(){
 return <g fill="#FFFFFF">
  <ellipse cx="44" cy="64" rx="9" ry="6.5" transform="rotate(-18 44 64)"/>
  <ellipse cx="80" cy="56" rx="9" ry="6.5" transform="rotate(-18 80 56)"/>
  <rect x="50.5" y="22" width="3.6" height="42" rx="1.6"/>
  <rect x="86.5" y="14" width="3.6" height="42" rx="1.6"/>
  <path d="M50.5 22 L90.1 14 V24 L50.5 32 Z"/>
 </g>;
}
const ART:Record<string,()=>ReactElement>={'iniciacao':Notes,'trumpet-bb':Trumpet,'recorder-soprano':Recorder,'clarinet-bb':Clarinet,'conductor':Baton};
export function InstrumentTile({instrument}:{instrument:string}){
 const Art=ART[instrument];
 return <svg className="instrument-tile" viewBox="0 0 120 90" aria-hidden="true" focusable="false">
  <rect width="120" height="90" rx="14" fill={TILE[instrument]??'#E5ECE8'}/>
  {Art&&<Art/>}
 </svg>;
}
