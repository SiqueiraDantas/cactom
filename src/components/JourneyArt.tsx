import type {ArtId} from '../lib/recorderExercises';
/**
 * Ilustrações didáticas da trilha, com o mesmo traço: contorno 3 px #24433f, cantos arredondados,
 * preenchimentos lisos da paleta Cactom. Cada desenho mostra só o que a pergunta pede.
 */
const INK='#24433f',BODY='#fff4dc',WOOD='#e9c98f',GREEN='#3fae49',ORANGE='#f5a528',BLUE='#4a84c3';
function FluteBody({x=0,highlight=false}:{x?:number;highlight?:boolean}){
 return <g transform={`translate(${x} 0)`} fill={BODY} stroke={INK} strokeWidth="3" strokeLinejoin="round">
  <path d="M44 14h32l3 46H41z" fill={highlight?ORANGE:WOOD}/>
  <rect x="45" y="60" width="30" height="160" rx="6"/>
  <path d="M43 220h34l6 34H37z" fill={WOOD}/>
 </g>;
}
export function JourneyArt({id,holes=[],label}:{id:ArtId;holes?:readonly number[];label?:string}){
 const common={className:`journey-art journey-art--${id}`,role:'img' as const,'aria-label':label??ART_LABEL[id]};
 switch(id){
  case 'flute-parts':return <svg viewBox="0 0 220 270" {...common}>
   <FluteBody x={30}/>
   <rect x="96" y="30" width="14" height="8" rx="3" fill={INK}/>
   {[[37,'1'],[140,'2'],[237,'3']].map(([y,t])=><g key={t as string}><line x1="118" y1={y as number} x2="160" y2={y as number} stroke={INK} strokeWidth="2.5" strokeDasharray="4 4"/><circle cx="178" cy={y as number} r="17" fill={BLUE} stroke={INK} strokeWidth="3"/><text x="178" y={(y as number)+6} textAnchor="middle" fontSize="18" fontWeight="900" fill="white">{t as string}</text></g>)}
  </svg>;
  case 'flute-back':return <svg viewBox="0 0 160 270" {...common}><FluteBody x={20}/><text x="80" y="268" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>VISTA DE TRÁS</text></svg>;
  case 'hands-left-up':case 'hands-right-up':{const leftUp=id==='hands-left-up';const hand=(y:number,t:string,c:string)=><g><rect x="58" y={y} width="104" height="44" rx="22" fill={c} stroke={INK} strokeWidth="3" opacity=".92"/><text x="110" y={y+30} textAnchor="middle" fontSize="22" fontWeight="900" fill="white">{t}</text></g>;
   return <svg viewBox="0 0 220 270" {...common}><FluteBody x={50}/>{hand(78,leftUp?'E':'D',leftUp?GREEN:ORANGE)}{hand(150,leftUp?'D':'E',leftUp?ORANGE:GREEN)}<text x="110" y="12" textAnchor="middle" fontSize="11" fontWeight="800" fill={INK}>BOCAL</text></svg>;}
  case 'support-thumb':return <svg viewBox="0 0 220 200" {...common}><g transform="rotate(-90 110 100) translate(50 -10)"><FluteBody/></g><path d="M118 132q8 22 26 26" fill="none" stroke={INK} strokeWidth="3"/><circle cx="118" cy="128" r="13" fill={GREEN} stroke={INK} strokeWidth="3"/><path d="M60 70q8-16 16 0M86 70q8-16 16 0M150 70q8-16 16 0" fill="none" stroke={GREEN} strokeWidth="4" strokeLinecap="round"/><text x="110" y="190" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>POLEGAR APOIA · DEDOS LIVRES</text></svg>;
  case 'support-squeeze':return <svg viewBox="0 0 220 200" {...common}><g transform="rotate(-90 110 100) translate(50 -10)"><FluteBody/></g>{[40,70,100,130,160].map(x=><rect key={x} x={x} y="72" width="22" height="58" rx="10" fill={ORANGE} stroke={INK} strokeWidth="3"/>)}<text x="110" y="190" textAnchor="middle" fontSize="12" fontWeight="800" fill={INK}>TODOS OS DEDOS APERTAM</text></svg>;
  case 'card-si':return <svg viewBox="0 0 200 150" {...common}><rect x="30" y="18" width="140" height="110" rx="16" fill="white" stroke={INK} strokeWidth="4"/><text x="100" y="92" textAnchor="middle" fontSize="48" fontWeight="1000" fill={BLUE}>SI</text></svg>;
  case 'gesture-breath':return <svg viewBox="0 0 200 170" {...common}><circle cx="100" cy="60" r="34" fill={GREEN} stroke={INK} strokeWidth="3"/><circle cx="88" cy="56" r="5" fill={INK}/><circle cx="112" cy="56" r="5" fill={INK}/><ellipse cx="100" cy="76" rx="8" ry="6" fill={ORANGE} stroke={INK} strokeWidth="2"/><path d="M60 26q-12-14 4-20M140 26q12-14-4-20" fill="none" stroke={BLUE} strokeWidth="4" strokeLinecap="round"/><path d="M100 96v52" stroke={WOOD} strokeWidth="12" strokeLinecap="round"/><path d="M150 112l18-18m0 0v14m0-14h-14" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  case 'gesture-none':return <svg viewBox="0 0 200 170" {...common}><circle cx="100" cy="60" r="34" fill={GREEN} stroke={INK} strokeWidth="3"/><path d="M84 56h10M106 56h10" stroke={INK} strokeWidth="4" strokeLinecap="round"/><path d="M100 96v52" stroke={WOOD} strokeWidth="12" strokeLinecap="round"/><path d="M28 120h30M142 120h30" stroke={INK} strokeWidth="3" strokeDasharray="5 6"/></svg>;
  case 'diagram':default:return <svg viewBox="0 0 120 230" {...common}>
   <rect x="40" y="10" width="40" height="210" rx="16" fill={BODY} stroke={INK} strokeWidth="3"/>
   <circle cx="22" cy="42" r="11" fill={holes.includes(0)?INK:'white'} stroke={INK} strokeWidth="3"/><text x="22" y="66" textAnchor="middle" fontSize="10" fontWeight="800" fill={INK}>0</text>
   {[1,2,3,4,5,6,7].map(h=><g key={h}><circle cx="60" cy={30+h*24} r="9" fill={holes.includes(h)?INK:'white'} stroke={INK} strokeWidth="3"/><text x="94" y={34+h*24} fontSize="10" fontWeight="800" fill={INK}>{h}</text></g>)}
  </svg>;
 }
}
const ART_LABEL:Record<ArtId,string>={'flute-parts':'Flauta com três partes numeradas: 1 no alto, 2 no meio, 3 embaixo','flute-back':'Flauta vista de trás','hands-left-up':'Flauta com a mão E em cima e a mão D embaixo','hands-right-up':'Flauta com a mão D em cima e a mão E embaixo','support-thumb':'Flauta apoiada no polegar, com dedos livres','support-squeeze':'Flauta apertada por todos os dedos','card-si':'Cartão com a nota SI','gesture-breath':'Músico respira e levanta a flauta antes de tocar','gesture-none':'Músico parado, sem gesto de preparação','diagram':'Diagrama de furos da flauta'};
export function holesLabel(holes:readonly number[]){return holes.length?`Furos fechados: ${[...holes].sort((a,b)=>a-b).join(', ')}`:'Todos os furos abertos';}
