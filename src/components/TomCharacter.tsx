import type {TomExpression} from './CactomTomArt';
import './tom-character.css';

/**
 * Tom no desenho aprovado em 01/11/2026 (o mesmo do “Oi! Eu sou o Tom!”), com as nove expressões
 * que o app usa. Cada parte é um grupo próprio: braços, olhos, pupilas (`.ct-pupils`, seguidas pelo
 * olhar no login), sobrancelhas, boca e flor. A expressão muda pose, rosto e animação pelo CSS.
 */
export function TomCharacter({expression='feliz'}:{expression?:TomExpression}){
 const happyEyes=expression==='orgulhoso';
 return <svg className="ct-tom tc" data-expression={expression} viewBox="0 0 400 420" aria-hidden="true" focusable="false">
  <ellipse className="tc-shadow" cx="200" cy="374" rx="108" ry="12" fill="#000" opacity=".1"/>
  <g className="tc-all">
   <g className="tc-feet">
    <ellipse cx="158" cy="356" rx="38" ry="20" fill="#4B9E2B"/><ellipse cx="242" cy="356" rx="38" ry="20" fill="#4B9E2B"/>
    <ellipse cx="156" cy="352" rx="35" ry="17" fill="#5CB531"/><ellipse cx="240" cy="352" rx="35" ry="17" fill="#5CB531"/>
   </g>
   <g className="tc-body">
    <g className="tc-flower">
     <circle cx="170" cy="112" r="25" fill="#E36F05"/><circle cx="230" cy="112" r="25" fill="#E36F05"/>
     <circle cx="170" cy="107" r="24" fill="#FF8A12"/><circle cx="230" cy="107" r="24" fill="#FF8A12"/>
     <circle cx="200" cy="100" r="29" fill="#E36F05"/><circle cx="200" cy="94" r="28" fill="#FF8A12"/>
     <ellipse cx="191" cy="84" rx="8" ry="5" fill="#FFB057"/>
    </g>
    <g className="tc-arm tc-arm--left">
     <path d="M118 252 Q62 254 60 194" fill="none" stroke="#4B9E2B" strokeWidth="46" strokeLinecap="round" transform="translate(3 5)"/>
     <path d="M118 252 Q62 254 60 194" fill="none" stroke="#5CB531" strokeWidth="46" strokeLinecap="round"/>
     <ellipse cx="54" cy="188" rx="6" ry="11" fill="#7FCD52" transform="rotate(-8 54 188)"/>
     <g fill="#1F5A32"><rect x="-3" y="-4.5" width="20" height="9" rx="4.5" transform="translate(40 232) rotate(160)"/><rect x="-3" y="-4.5" width="20" height="9" rx="4.5" transform="translate(36 192) rotate(185)"/></g>
    </g>
    <g className="tc-arm tc-arm--right">
     <path d="M282 252 Q338 254 340 194" fill="none" stroke="#4B9E2B" strokeWidth="46" strokeLinecap="round" transform="translate(3 5)"/>
     <path d="M282 252 Q338 254 340 194" fill="none" stroke="#5CB531" strokeWidth="46" strokeLinecap="round"/>
     <ellipse cx="334" cy="188" rx="6" ry="11" fill="#7FCD52" transform="rotate(8 334 188)"/>
     <g fill="#1F5A32"><rect x="-3" y="-4.5" width="20" height="9" rx="4.5" transform="translate(360 232) rotate(20)"/><rect x="-3" y="-4.5" width="20" height="9" rx="4.5" transform="translate(364 192) rotate(-5)"/></g>
    </g>
    <g fill="#1F5A32">
     {[[109.9,167,-153.8],[97,211,-173.2],[100,261.6,166.3],[122.7,309.6,142.5],[138.9,129.3,-130.4],[290.1,167,-26.2],[303,211,-6.8],[300,261.6,13.7],[277.3,309.6,37.5],[261.1,129.3,-49.6]].map(([x,y,a])=>
      <rect key={`${x}-${y}`} x="-3" y="-4.5" width="22" height="9" rx="4.5" transform={`translate(${x} ${y}) rotate(${a})`}/>)}
    </g>
    <g>
     <ellipse cx="200" cy="228" rx="104" ry="122" fill="#4B9E2B"/>
     <ellipse cx="194" cy="222" rx="98" ry="116" fill="#5CB531"/>
     <g fill="none" stroke="#4A9628" strokeWidth="7" strokeLinecap="round">
      <path d="M148 130 Q114 228 148 334"/><path d="M252 130 Q286 228 252 334"/>
      <path d="M182 112 Q174 140 176 164"/><path d="M218 112 Q226 140 224 164"/><path d="M200 290 Q198 318 200 342"/>
     </g>
     <ellipse cx="146" cy="150" rx="15" ry="30" fill="#7FCD52" transform="rotate(24 146 150)"/>
    </g>
    <g className="tc-face">
     <g className="tc-brows" fill="none" stroke="#1F5A32" strokeWidth="8" strokeLinecap="round">
      <path className="tc-brow tc-brow--left" d={expression==='triste'?'M132 150 Q154 156 176 146':'M132 158 Q154 144 176 156'}/>
      <path className="tc-brow tc-brow--right" d={expression==='triste'?'M268 150 Q246 156 224 146':'M268 158 Q246 144 224 156'}/>
     </g>
     {happyEyes?<g className="tc-happy-eyes" fill="none" stroke="#1C2A28" strokeWidth="9" strokeLinecap="round">
      <path d="M130 206 Q156 178 182 206"/><path d="M218 206 Q244 178 270 206"/>
     </g>:<g className="tc-eyes"><g className="tc-eyes-size">
      <ellipse cx="156" cy="200" rx="31" ry="35" fill="#FDF5E2"/><ellipse cx="244" cy="200" rx="31" ry="35" fill="#FDF5E2"/>
      <g className="ct-pupils"><g className="tc-look">
       <ellipse cx="160" cy="204" rx="14" ry="17" fill="#1C2A28"/><ellipse cx="240" cy="204" rx="14" ry="17" fill="#1C2A28"/>
       <circle cx="165" cy="197" r="5" fill="#FFFFFF"/><circle cx="245" cy="197" r="5" fill="#FFFFFF"/>
      </g></g>
     </g></g>}
     <Mouth expression={expression}/>
    </g>
    {expression==='privacidade'&&<g className="tc-cover ct-front-arms">
     <path d="M118 256 Q112 232 146 206" fill="none" stroke="#4B9E2B" strokeWidth="46" strokeLinecap="round"/>
     <path d="M118 252 Q112 230 146 204" fill="none" stroke="#5CB531" strokeWidth="40" strokeLinecap="round"/>
     <path d="M282 256 Q288 232 254 206" fill="none" stroke="#4B9E2B" strokeWidth="46" strokeLinecap="round"/>
     <path d="M282 252 Q288 230 254 204" fill="none" stroke="#5CB531" strokeWidth="40" strokeLinecap="round"/>
     <ellipse cx="156" cy="198" rx="38" ry="32" fill="#4B9E2B"/><ellipse cx="154" cy="195" rx="35" ry="29" fill="#5CB531"/>
     <ellipse cx="244" cy="198" rx="38" ry="32" fill="#4B9E2B"/><ellipse cx="246" cy="195" rx="35" ry="29" fill="#5CB531"/>
     <ellipse cx="140" cy="184" rx="9" ry="6" fill="#7FCD52"/><ellipse cx="260" cy="184" rx="9" ry="6" fill="#7FCD52"/>
    </g>}
   </g>
  </g>
 </svg>;
}
function Mouth({expression}:{expression:TomExpression}){
 const ink='#6A2A14',tongue='#FF7B1C';
 switch(expression){
  case 'animado':case 'comemorando':return <g className="tc-mouth">
   <path d="M168 236 H232 Q234 274 200 286 Q166 274 168 236 Z" fill={ink}/>
   <path d="M184 270 Q200 260 216 270 Q216 286 200 289 Q184 286 184 270 Z" fill={tongue}/>
  </g>;
  case 'orgulhoso':return <path className="tc-mouth" d="M174 244 Q200 272 226 244" fill="none" stroke={ink} strokeWidth="9" strokeLinecap="round"/>;
  case 'concentrado':return <g className="tc-mouth"><path d="M184 254 Q200 264 216 254" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round"/><ellipse cx="210" cy="264" rx="7" ry="6" fill={tongue}/></g>;
  case 'triste':return <path className="tc-mouth" d="M180 266 Q200 248 220 266" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round"/>;
  case 'surpreso':return <ellipse className="tc-mouth" cx="200" cy="258" rx="14" ry="18" fill={ink}/>;
  case 'pensativo':return <path className="tc-mouth" d="M182 258 Q191 250 200 258 T218 256" fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round"/>;
  case 'privacidade':return <path className="tc-mouth" d="M184 252 Q200 264 216 252" fill="none" stroke={ink} strokeWidth="8" strokeLinecap="round"/>;
  default:return <g className="tc-mouth">
   <path d="M174 238 H226 Q228 266 200 276 Q172 266 174 238 Z" fill={ink}/>
   <path d="M186 264 Q200 256 214 264 Q215 282 200 285 Q185 282 186 264 Z" fill={tongue}/>
  </g>;
 }
}
