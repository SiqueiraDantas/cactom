import type {SVGProps} from 'react';
import './tom-rojao.css';

/**
 * Ícone do Rojão: o Tom inclinado pra trás, segurando firme uma corda e fazendo força
 * (“segurar o rojão” = aguentar firme). Substitui o foguinho da antiga ofensiva.
 * `active=false` deixa o desenho apagado (rojão ainda sem dias); `animated` liga o puxão.
 */
export function TomRojao({active=true,animated=false,size,className='',...rest}:{active?:boolean;animated?:boolean;size?:number}&Omit<SVGProps<SVGSVGElement>,'children'>){
 return <svg className={`tom-rojao${active?' is-active':' is-off'}${animated?' is-animated':''} ${className}`} viewBox="0 0 480 420" width={size} height={size} aria-hidden="true" focusable="false" {...rest}>
  <ellipse cx="200" cy="378" rx="120" ry="12" fill="#000" opacity=".1"/>
  <g className="tr-dust" fill="#E8DCC4">
   <ellipse cx="96" cy="366" rx="20" ry="11"/><ellipse cx="72" cy="356" rx="13" ry="8"/><ellipse cx="58" cy="370" rx="10" ry="6"/>
  </g>
  {/* corda: sai das mãos e some na direita, esticada */}
  <g className="tr-rope">
   <path d="M300 298 L490 276" stroke="#9A6A34" strokeWidth="17" strokeLinecap="round"/>
   <path d="M300 298 L490 276" stroke="#C99555" strokeWidth="11" strokeLinecap="round" strokeDasharray="12 9"/>
   <path d="M318 304 Q292 344 318 376" fill="none" stroke="#9A6A34" strokeWidth="14" strokeLinecap="round"/>
   <path d="M318 304 Q292 344 318 376" fill="none" stroke="#C99555" strokeWidth="8" strokeLinecap="round" strokeDasharray="11 8"/>
  </g>
  <g className="tr-lean">
   <g className="tr-feet">
    <ellipse cx="150" cy="360" rx="38" ry="19" fill="#4B9E2B" transform="rotate(-8 150 360)"/><ellipse cx="236" cy="362" rx="38" ry="19" fill="#4B9E2B"/>
    <ellipse cx="148" cy="356" rx="35" ry="16" fill="#5CB531" transform="rotate(-8 148 356)"/><ellipse cx="234" cy="358" rx="35" ry="16" fill="#5CB531"/>
   </g>
   <g className="tr-body">
    <g>
     <circle cx="162" cy="116" r="24" fill="#E36F05"/><circle cx="222" cy="112" r="24" fill="#E36F05"/>
     <circle cx="162" cy="111" r="23" fill="#FF8A12"/><circle cx="222" cy="107" r="23" fill="#FF8A12"/>
     <circle cx="192" cy="102" r="28" fill="#E36F05"/><circle cx="192" cy="96" r="27" fill="#FF8A12"/>
     <ellipse cx="183" cy="86" rx="8" ry="5" fill="#FFB057"/>
    </g>
    <g fill="#1F5A32">
     {[[101,170,-153],[89,214,-173],[92,264,166],[115,312,142],[131,132,-130],[282,170,-26],[295,214,-7],[292,264,14],[269,312,38],[253,132,-50]].map(([x,y,a])=>
      <rect key={`${x}-${y}`} x="-3" y="-4.5" width="21" height="9" rx="4.5" transform={`translate(${x} ${y}) rotate(${a})`}/>)}
    </g>
    <ellipse cx="192" cy="230" rx="104" ry="122" fill="#4B9E2B"/>
    <ellipse cx="186" cy="224" rx="98" ry="116" fill="#5CB531"/>
    <g fill="none" stroke="#4A9628" strokeWidth="7" strokeLinecap="round"><path d="M140 132 Q106 230 140 336"/><path d="M244 132 Q278 230 244 336"/><path d="M192 292 Q190 320 192 344"/></g>
    <ellipse cx="138" cy="152" rx="15" ry="30" fill="#7FCD52" transform="rotate(24 138 152)"/>
    {/* rosto de esforço */}
    <g fill="none" stroke="#1F5A32" strokeWidth="9" strokeLinecap="round"><path d="M118 160 L166 178"/><path d="M266 160 L218 178"/></g>
    <g className="tr-eyes" fill="none" stroke="#1C2A28" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"><path d="M124 190 L158 204 L124 218"/><path d="M260 190 L226 204 L260 218"/></g>
    <ellipse cx="120" cy="240" rx="16" ry="9" fill="#FF8A12" opacity=".35"/><ellipse cx="264" cy="240" rx="16" ry="9" fill="#FF8A12" opacity=".35"/>
    <g className="tr-mouth"><rect x="160" y="236" width="64" height="30" rx="12" fill="#FFFDF4" stroke="#6A2A14" strokeWidth="6"/><path d="M162 251 H222 M181 238 V264 M203 238 V264" stroke="#6A2A14" strokeWidth="4"/></g>
    <path className="tr-sweat" d="M92 120 Q80 140 86 150 Q94 158 102 150 Q108 140 92 120 Z" fill="#7FD3F7" stroke="#3BA7D8" strokeWidth="3"/>
    {/* braços esticados até a corda */}
    <g className="tr-arms">
     <path d="M252 314 Q296 318 318 302" fill="none" stroke="#4B9E2B" strokeWidth="40" strokeLinecap="round"/>
     <path d="M252 310 Q294 314 316 299" fill="none" stroke="#5CB531" strokeWidth="34" strokeLinecap="round"/>
     <path d="M262 268 Q310 276 348 290" fill="none" stroke="#4B9E2B" strokeWidth="40" strokeLinecap="round"/>
     <path d="M262 264 Q308 272 346 287" fill="none" stroke="#5CB531" strokeWidth="34" strokeLinecap="round"/>
     <circle cx="322" cy="300" r="22" fill="#4B9E2B"/><circle cx="320" cy="297" r="19" fill="#5CB531"/>
     <circle cx="352" cy="292" r="22" fill="#4B9E2B"/><circle cx="350" cy="289" r="19" fill="#5CB531"/>
     <path d="M310 290 Q320 284 330 290 M340 282 Q350 276 360 282" fill="none" stroke="#4A9628" strokeWidth="4" strokeLinecap="round"/>
    </g>
   </g>
  </g>
  <g className="tr-effort" stroke="#FF8A12" strokeWidth="7" strokeLinecap="round"><path d="M40 160 L62 172"/><path d="M30 200 H56"/><path d="M40 240 L62 228"/></g>
 </svg>;
}
