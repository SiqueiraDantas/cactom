/**
 * Tom, the Cactom mascot, as vector art drawn from the official character sheet
 * (green ribbed cactus, big eyes, orange beak and flower). Every part is its own group,
 * so the same rig shows many expressions (like a Duolingo-style mascot) and can move:
 * arms, eyes (blink), pupils (look), brows, mouth, flower, instrument.
 */
import './tom-art.css';

export type TomVariant='lead'|'trumpet'|'flute'|'drum'|'maestro';
export type TomExpression='feliz'|'animado'|'orgulhoso'|'concentrado'|'triste'|'surpreso'|'comemorando'|'pensativo'|'privacidade';
export const TOM_EXPRESSIONS:TomExpression[]=['feliz','animado','orgulhoso','concentrado','triste','surpreso','comemorando','pensativo','privacidade'];

const GREEN='#62c442',GREEN_DARK='#4fae36',GREEN_ARM='#5abd3c',GREEN_LIGHT='#86da66',SPINE='#2d5e27',ORANGE='#f68a2a',INK='#14221d';
const arm=(d:string)=><path d={d} fill="none" stroke={GREEN_ARM} strokeWidth="25" strokeLinecap="round" strokeLinejoin="round"/>;

type ArmPose='up'|'cheer'|'cover'|'chin'|'flute'|'trumpet'|'drum'|'low';
function Arms({pose,baton}:{pose:ArmPose;baton:boolean}){
 const L:Record<ArmPose,string>={up:'M46 136H34Q22 136 22 122V100',cheer:'M48 122L30 104Q22 96 18 80L14 64',cover:'M46 136H34Q22 136 22 122V100',chin:'M46 136H34Q22 136 22 122V100',flute:'M46 132H34Q24 132 24 122V112',trumpet:'M46 136H34Q22 136 22 122V100',drum:'M46 140H36Q26 140 26 150V156',low:'M46 140H34Q24 140 24 152V160'};
 const R:Record<ArmPose,string>={up:'M154 136H166Q178 136 178 122V100',cheer:'M152 122L170 104Q178 96 182 80L186 64',cover:'M154 136H166Q178 136 178 122V100',chin:'M154 136H166Q178 136 178 122V100',flute:'M154 132H166Q176 132 176 122V112',trumpet:'M154 132H166Q176 132 176 122V112',drum:'M154 140H164Q174 140 174 150V156',low:'M154 140H166Q176 140 176 152V160'};
 return <>
  {pose!=='cover'&&<g className="ct-arm ct-arm--left">{arm(L[pose])}</g>}
  {pose!=='cover'&&<g className="ct-arm ct-arm--right">{pose!=='chin'&&arm(R[pose])}
   {baton&&pose!=='chin'&&<g className="ct-baton"><path d="M178 100L206 58" stroke="#20352f" strokeWidth="4" strokeLinecap="round"/><circle cx="206" cy="58" r="3.2" fill="#fff8e8" stroke="#20352f" strokeWidth="1.5"/></g>}
  </g>}
 </>;
}
/** Arms drawn in front of the face (privacy, thinking). */
function FrontArms({pose}:{pose:ArmPose}){
 if(pose==='cover')return <g className="ct-front-arms">
  {arm('M44 152Q30 136 52 118')}{arm('M156 152Q170 136 148 118')}
  <ellipse cx="74" cy="110" rx="29" ry="31" fill={GREEN_ARM}/><ellipse cx="126" cy="110" rx="29" ry="31" fill={GREEN_ARM}/>
  <path d="M58 96Q74 86 90 96M110 96Q126 86 142 96" stroke={GREEN_LIGHT} strokeWidth="4" fill="none" strokeLinecap="round"/>
  <path d="M100 92V128" stroke={GREEN_DARK} strokeWidth="3" strokeLinecap="round" opacity=".6"/>
 </g>;
 if(pose==='chin')return <g className="ct-front-arms">{arm('M160 150Q166 176 132 174')}<ellipse cx="124" cy="171" rx="13" ry="11" fill={GREEN_ARM}/></g>;
 return null;
}

function Instrument({variant}:{variant:TomVariant}){
 if(variant==='trumpet')return <g className="ct-instrument ct-trumpet">
  <path d="M106 150H160" stroke="#e9a21e" strokeWidth="9" strokeLinecap="round"/>
  <path d="M156 132Q184 126 196 112V188Q184 174 156 168Z" fill="#f7c33a"/>
  <path d="M196 112V188" stroke="#d98e15" strokeWidth="5" strokeLinecap="round"/>
  <g fill="#d98e15"><rect x="124" y="136" width="5" height="12" rx="2"/><rect x="133" y="136" width="5" height="12" rx="2"/><rect x="142" y="136" width="5" height="12" rx="2"/></g>
  <path d="M112 147H152" stroke="#ffe08a" strokeWidth="2.4" strokeLinecap="round"/>
 </g>;
 if(variant==='flute')return <g className="ct-instrument ct-flute">
  <path d="M8 154L196 142" stroke="#c6d1d6" strokeWidth="9" strokeLinecap="round"/>
  <path d="M12 151L192 139.6" stroke="#eef3f5" strokeWidth="2.5" strokeLinecap="round"/>
  <g fill="#8a9aa1"><circle cx="128" cy="146" r="2.6"/><circle cx="142" cy="145" r="2.6"/><circle cx="156" cy="144" r="2.6"/><circle cx="170" cy="143" r="2.6"/></g>
 </g>;
 if(variant==='drum')return <g className="ct-instrument ct-drum">
  <g className="ct-drum-shell"><rect x="52" y="164" width="96" height="44" rx="10" fill="#e5583a"/>
  <ellipse cx="100" cy="164" rx="48" ry="12" fill="#fff6e3" stroke="#c9432a" strokeWidth="4"/>
  <path d="M56 178L72 202L88 178L104 202L120 178L136 202L146 186" fill="none" stroke="#fff1d6" strokeWidth="3" strokeLinejoin="round"/>
  <path d="M52 202Q100 214 148 202" stroke="#b83a24" strokeWidth="5" fill="none"/></g>
  <g className="ct-stick ct-stick--left"><path d="M28 154L76 166" stroke="#b97a3d" strokeWidth="5" strokeLinecap="round"/><circle cx="76" cy="166" r="4.5" fill="#f0d2a4"/></g>
  <g className="ct-stick ct-stick--right"><path d="M172 154L124 166" stroke="#b97a3d" strokeWidth="5" strokeLinecap="round"/><circle cx="124" cy="166" r="4.5" fill="#f0d2a4"/></g>
 </g>;
 if(variant==='maestro')return <g className="ct-bowtie"><path d="M100 172L84 164V182Z M100 172L116 164V182Z" fill="#1f3b33"/><circle cx="100" cy="172" r="4.5" fill="#2c5163"/></g>;
 return null;
}

/* ——— Face pieces ——— */
const BROWS:Record<TomExpression,[string,string]>={
 feliz:['M60 80Q73 72 87 78','M113 78Q127 72 140 80'],
 animado:['M60 74Q73 64 87 70','M113 70Q127 64 140 74'],
 orgulhoso:['M60 82Q73 78 87 82','M113 74Q127 66 140 72'],
 concentrado:['M60 76Q74 78 88 86','M112 86Q126 78 140 76'],
 triste:['M60 86Q72 80 86 74','M114 74Q128 80 140 86'],
 surpreso:['M62 66Q74 56 88 62','M112 62Q126 56 138 66'],
 comemorando:['M60 72Q73 62 87 68','M113 68Q127 62 140 72'],
 pensativo:['M60 80Q73 76 87 80','M113 72Q127 62 140 70'],
 privacidade:['M60 80Q73 74 87 78','M113 78Q127 74 140 80'],
};
type EyeKind='open'|'happy'|'half'|'wide'|'down'|'side';
const EYES:Record<TomExpression,EyeKind>={feliz:'open',animado:'happy',orgulhoso:'half',concentrado:'down',triste:'down',surpreso:'wide',comemorando:'happy',pensativo:'side',privacidade:'open'};
type MouthKind='open'|'laugh'|'small'|'o'|'frown'|'smile';
const MOUTH:Record<TomExpression,MouthKind>={feliz:'open',animado:'laugh',orgulhoso:'smile',concentrado:'small',triste:'frown',surpreso:'o',comemorando:'laugh',pensativo:'small',privacidade:'smile'};
const BLUSH:TomExpression[]=['animado','orgulhoso','comemorando'];

function Eyes({kind}:{kind:EyeKind}){
 if(kind==='happy')return <g className="ct-eyes ct-eyes--happy" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round"><path d="M60 114Q76 94 92 114"/><path d="M108 114Q124 94 140 114"/></g>;
 const wide=kind==='wide';
 const rx=wide?25:23,ry=wide?30:27;
 const pupil={open:[81,113,11.5,15],half:[80,116,11.5,13],wide:[77,111,8.5,10.5],down:[79,120,11,13.5],side:[86,106,10.5,13.5]}[kind];
 const pupilR={open:[119,113],half:[120,116],wide:[123,111],down:[121,120],side:[126,106]}[kind];
 return <g className={`ct-eyes ct-eyes--${kind}`}>
  <ellipse cx="76" cy="109" rx={rx} ry={ry} fill="#fff"/><ellipse cx="124" cy="109" rx={rx} ry={ry} fill="#fff"/>
  <g className="ct-pupils">
   <ellipse cx={pupil[0]} cy={pupil[1]} rx={pupil[2]} ry={pupil[3]} fill={INK}/><ellipse cx={pupilR[0]} cy={pupilR[1]} rx={pupil[2]} ry={pupil[3]} fill={INK}/>
   <circle cx={pupil[0]+4} cy={pupil[1]-7} r="3.8" fill="#fff"/><circle cx={pupilR[0]+4} cy={pupilR[1]-7} r="3.8" fill="#fff"/>
  </g>
  {kind==='half'&&<g fill={GREEN}><path d="M50 82H102V106Q76 98 50 106Z"/><path d="M98 82H150V106Q124 98 98 106Z"/><path d="M53 106Q76 98 99 106M101 106Q124 98 147 106" stroke={SPINE} strokeWidth="3.5" fill="none" strokeLinecap="round"/></g>}
 </g>;
}
function Mouth({kind}:{kind:MouthKind}){
 switch(kind){
  case 'laugh':return <g className="ct-mouth"><path d="M84 138Q100 132 116 138Q113 164 100 172Q87 164 84 138Z" fill="#f47b20"/><path d="M90 150Q100 155 110 150Q106 166 100 169Q94 166 90 150Z" fill="#b8481a"/><path d="M95 161Q100 158 105 161Q103 167 100 168Q97 167 95 161Z" fill="#ff9d7a"/></g>;
  case 'small':return <g className="ct-mouth"><path d="M91 142Q100 139 109 142Q106 152 100 156Q94 152 91 142Z" fill="#f47b20"/><path d="M93 144Q100 142 107 144" stroke="#ffa65a" strokeWidth="2" fill="none" strokeLinecap="round"/></g>;
  case 'o':return <g className="ct-mouth"><ellipse cx="100" cy="150" rx="10" ry="12" fill="#f47b20"/><ellipse cx="100" cy="152" rx="5.5" ry="7" fill="#b8481a"/></g>;
  case 'frown':return <g className="ct-mouth"><path d="M90 150Q100 140 110 150Q106 157 100 158Q94 157 90 150Z" fill="#f47b20"/></g>;
  case 'smile':return <g className="ct-mouth"><path d="M86 140Q100 136 114 140Q110 156 100 161Q90 156 86 140Z" fill="#f47b20"/><path d="M90 140Q100 147 110 140" stroke="#b8481a" strokeWidth="3" fill="none" strokeLinecap="round"/></g>;
  default:return <g className="ct-mouth"><path d="M87 140Q100 135 113 140Q110 158 100 165Q90 158 87 140Z" fill="#f47b20"/><path d="M92 149Q100 153 108 149Q105 160 100 163Q95 160 92 149Z" fill="#b8481a"/><path d="M91 140Q100 137 109 140" stroke="#ffa65a" strokeWidth="2.4" fill="none" strokeLinecap="round"/></g>;
 }
}
function Extras({expression}:{expression:TomExpression}){
 if(expression==='surpreso')return <g className="ct-extra" stroke={ORANGE} strokeWidth="5" strokeLinecap="round"><path d="M30 46L40 58M22 66L36 70M170 46L160 58M178 66L164 70"/></g>;
 if(expression==='triste')return <path className="ct-extra ct-drop" d="M150 70Q158 84 150 90Q142 84 150 70Z" fill="#7cc6f2"/>;
 if(expression==='pensativo')return <g className="ct-extra ct-think" fill="#d7e3de"><circle cx="168" cy="60" r="5"/><circle cx="180" cy="44" r="8"/><circle cx="194" cy="22" r="12"/></g>;
 if(expression==='comemorando')return <g className="ct-extra ct-sparkles" fill="#f5a528"><path d="M18 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z"/><path d="M182 34l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#4a84c3"/></g>;
 return null;
}

export function CactomTomArt({variant='lead',expression='feliz'}:{variant?:TomVariant;expression?:TomExpression}){
 const playing=variant==='trumpet'||variant==='flute';
 const pose:ArmPose=variant==='flute'?'flute':variant==='trumpet'?'trumpet':variant==='drum'?'drum':expression==='comemorando'?'cheer':expression==='privacidade'?'cover':expression==='pensativo'?'chin':expression==='triste'?'low':'up';
 const eyes=playing&&expression==='feliz'?'open':EYES[expression];
 return <svg className={`ct-tom ct-tom--${variant}`} data-expression={expression} viewBox="-12 0 224 230" aria-hidden="true" focusable="false">
  <ellipse className="ct-shadow" cx="100" cy="215" rx="54" ry="6" fill="#1d3b2a" opacity=".1"/>
  <g fill="#48a432"><ellipse cx="78" cy="204" rx="18" ry="10.5"/><ellipse cx="122" cy="204" rx="18" ry="10.5"/></g>
  <Arms pose={pose} baton={variant==='maestro'}/>
  <g className="ct-body">
   <path d="M100 46C142 46 162 78 162 120V160C162 187 140 203 100 203S38 187 38 160V120C38 78 58 46 100 46Z" fill={GREEN}/>
   <path d="M100 203C140 203 162 187 162 160V150C158 176 134 192 100 192S42 176 38 150V160C38 187 60 203 100 203Z" fill={GREEN_DARK} opacity=".55"/>
   <path d="M53 92C49 112 49 150 54 176C46 166 43 150 43 132V114C43 102 47 96 53 92Z" fill={GREEN_LIGHT}/>
   <g fill="none" stroke={GREEN_DARK} strokeWidth="4" strokeLinecap="round" opacity=".7"><path d="M73 63C67 100 67 160 73 195"/><path d="M127 63C133 100 133 160 127 195"/></g>
   <g stroke={SPINE} strokeWidth="3.6" strokeLinecap="round"><path d="M41 104l-6-2M41 160l-6 2M159 104l6-2M159 160l6 2M60 64l-4-5M140 64l4-5M62 192l-3 5M138 192l3 5"/></g>
  </g>
  <g className="ct-flower">
   <g fill={ORANGE}><ellipse cx="82" cy="46" rx="14" ry="12"/><ellipse cx="118" cy="46" rx="14" ry="12"/><circle cx="100" cy="36" r="15"/><circle cx="91" cy="50" r="10"/><circle cx="109" cy="50" r="10"/></g>
   <circle cx="100" cy="48" r="5" fill="#e46f17" opacity=".7"/>
   <path d="M91 33Q100 28 109 33" stroke="#ffb565" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
  </g>
  <g className="ct-face">
   {BLUSH.includes(expression)&&<g className="ct-blush" fill="#ff8a8a" opacity=".38"><ellipse cx="58" cy="138" rx="11" ry="7"/><ellipse cx="142" cy="138" rx="11" ry="7"/></g>}
   <g className="ct-brows" fill="none" stroke={SPINE} strokeWidth="4.2" strokeLinecap="round"><path d={BROWS[expression][0]}/><path d={BROWS[expression][1]}/></g>
   <Eyes kind={eyes}/>
   {playing?<g className="ct-mouth"><ellipse cx="100" cy="150" rx="9" ry="7" fill="#f47b20"/></g>:<Mouth kind={MOUTH[expression]}/>}
  </g>
  <FrontArms pose={pose}/>
  <Extras expression={expression}/>
  <Instrument variant={variant}/>
 </svg>;
}
