/**
 * Duas vistas da flauta doce lado a lado: FRENTE (furos 1 a 7, com a janela do bocal) e TRÁS
 * (só o furo 0, do polegar esquerdo). Os furos são botões: a criança toca neles nas duas vistas.
 */
const FRONT:{n:number;y:number}[]=[{n:1,y:34},{n:2,y:41},{n:3,y:48},{n:4,y:58},{n:5,y:65},{n:6,y:72},{n:7,y:79}];
const BACK_Y=30;
const FINGER:Record<number,string>={0:'polegar esquerdo',1:'indicador esquerdo',2:'médio esquerdo',3:'anelar esquerdo',4:'indicador direito',5:'médio direito',6:'anelar direito',7:'mínimo direito'};

function FluteArt({side}:{side:'frente'|'tras'}){
 return <svg className="ffb-art" viewBox="0 0 100 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <defs><linearGradient id={`ffb-ivory-${side}`} x1="0" x2="1"><stop stopColor="#c9b892"/><stop offset=".3" stopColor="#f3ecd9"/><stop offset=".55" stopColor="#fffbef"/><stop offset="1" stopColor="#bba67f"/></linearGradient></defs>
  <ellipse cx="50" cy="392" rx="26" ry="5" fill="#000" opacity=".08"/>
  <path d="M38 6Q50 2 62 6L64 40Q72 52 69 72L64 92 62 110 61 330Q61 348 69 360L72 376Q50 390 28 376L31 360Q39 348 39 330L38 110 36 92 31 72Q28 52 36 40Z" fill={`url(#ffb-ivory-${side})`} stroke="#a8987b" strokeWidth="1.5"/>
  <path d="M38 6Q50 2 62 6L63 26Q50 30 37 26Z" fill="#4a4034"/>
  <path d="M35 74Q50 80 65 74M38 96H62M39 334H61M33 362Q50 370 67 362" fill="none" stroke="#b5a383" strokeWidth="2"/>
  {side==='frente'?<><rect x="43" y="50" width="14" height="10" rx="1.5" fill="#4a4034"/><path d="m43 61 7 12 7-12" fill="#d8c7a3" stroke="#b7a27a"/></>:null}
  <path d="M44 112v214" stroke="#fff" strokeOpacity=".5" strokeWidth="2.5"/>
 </svg>;
}

export function FluteFrontBack({holes,interactive,onToggle}:{holes:readonly number[];interactive:boolean;onToggle:(hole:number)=>void}){
 const hole=(n:number,y:number)=><button key={n} type="button" className={`ffb-hole ${n>=6?'is-double':''} ${holes.includes(n)?'is-covered':''}`} style={{top:`${y}%`}} disabled={!interactive} aria-pressed={holes.includes(n)} aria-label={`Furo ${n}${n===0?', atrás':', na frente'}, ${FINGER[n]}, ${holes.includes(n)?'fechado':'aberto'}`} onClick={()=>onToggle(n)}><b>{n}</b></button>;
 return <div className="ffb" role="group" aria-label="Flauta doce vista de frente e de trás">
  <figure className="ffb-view"><div className="ffb-flute"><FluteArt side="frente"/>{FRONT.map(h=>hole(h.n,h.y))}</div><figcaption><b>FRENTE</b><span>furos 1 a 7</span></figcaption></figure>
  <span className="ffb-turn" aria-hidden="true"><svg viewBox="0 0 40 24"><path d="M6 14Q20 -2 34 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="m28 6 7 7-9 3" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>vire</span>
  <figure className="ffb-view"><div className="ffb-flute"><FluteArt side="tras"/>{hole(0,BACK_Y)}</div><figcaption><b>TRÁS</b><span>só 1 furo</span></figcaption></figure>
 </div>;
}
