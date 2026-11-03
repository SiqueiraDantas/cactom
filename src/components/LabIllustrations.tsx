import { TomRojao } from './TomRojao';
import { useId } from 'react';
import './illustrations.css';

type SceneVariant = 'welcome' | 'streak' | 'practice' | 'victory' | 'empty';
type ArtworkInstrument = 'trumpet-bb' | 'recorder-soprano';

/** Original Made in Sertão artwork. The scene is decorative; label its enclosing UI. */
export function MascotScene({ variant = 'welcome', instrument = 'trumpet-bb', className = '' }: {
  variant: SceneVariant;
  instrument?: string;
  className?: string;
}) {
  const id = `mandacaru-${useId().replace(/:/g, '')}`;
  const festive = variant === 'victory' || variant === 'streak';
  return <svg className={`lab-illustration lab-mascot lab-mascot--${variant} ${className}`.trim()} viewBox="0 0 360 300" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-body`} x1="127" y1="96" x2="220" y2="230" gradientUnits="userSpaceOnUse"><stop stopColor="#52b561"/><stop offset="1" stopColor="#239143"/></linearGradient>
      <linearGradient id={`${id}-pot`} x1="142" y1="239" x2="204" y2="280" gradientUnits="userSpaceOnUse"><stop stopColor="#e5a56c"/><stop offset="1" stopColor="#c9824c"/></linearGradient>
      <linearGradient id={`${id}-halo`} x1="81" y1="46" x2="288" y2="258" gradientUnits="userSpaceOnUse"><stop stopColor={variant === 'streak' ? '#fff0c3' : '#fdf0cd'}/><stop offset="1" stopColor={variant === 'streak' ? '#ffddb0' : '#eaf3dc'}/></linearGradient>
    </defs>
    <ellipse cx="180" cy="278" rx="100" ry="10" fill="#2c5163" opacity=".07"/>
    <path d="M76 181C46 134 79 67 124 47C185 18 266 49 288 107C319 189 252 251 174 255C120 258 99 223 76 181Z" fill={`url(#${id}-halo)`}/>
    <circle cx="280" cy="73" r="21" fill="#f5a528" opacity={variant === 'streak' ? '.75' : '.22'}/>
    <path d="M280 42v-5m0 72v-5m31-31h5m-72 0h5m9-22-4-4m48 48 4 4m-48-4-4 4m48-48 4-4" stroke="#dfac52" strokeWidth="3" strokeLinecap="round" opacity=".55"/>
    <g className="lab-scene-notes" stroke="#2c5163" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M59 146v-25l15-4v24m-15-15 15-4"/><ellipse cx="54" cy="147" rx="5" ry="3.5" fill="#2c5163" stroke="none"/><ellipse cx="69" cy="142" rx="5" ry="3.5" fill="#2c5163" stroke="none"/>
      <path d="M298 186v-23l11 3"/><ellipse cx="293" cy="187" rx="5" ry="3.5" fill="#2c5163" stroke="none"/>
    </g>
    <g stroke="#d5a23f" strokeWidth="3" strokeLinecap="round"><path d="M101 70v10m-5-5h10M292 235v10m-5-5h10"/><path d="m78 212 4 6 7 1-5 5 1 7-7-3-6 3 1-7-5-5 7-1Z" fill="#f5a528" stroke="none"/></g>
    {festive && <g className="lab-scene-confetti" strokeWidth="4" strokeLinecap="round"><path d="m95 104-6-7m153-55 4-9M319 126l7-3" stroke="#f5a528"/><path d="m63 186-7 2m198 58 6 5m-128-210-1-7" stroke="#6aaf72"/><circle cx="112" cy="30" r="3" fill="#efb36f"/><circle cx="311" cy="211" r="3" fill="#6aaf72"/></g>}
    <g className="lab-mascot-character">
      <path d={variant === 'victory' ? 'M141 191h-29c-19 0-31-13-31-31v-40c0-10 7-17 16-17s16 7 16 17v30h28' : 'M141 196h-28c-20 0-31-13-31-31v-22c0-9 7-16 16-16s16 7 16 16v21h27'} fill="#309b4a"/>
      <path d={variant === 'victory' ? 'M214 189h25c20 0 32-12 32-31v-39c0-10-7-17-16-17s-16 7-16 17v29h-25' : variant === 'streak' ? 'M213 195h25c20 0 31-13 31-31v-31c0-9-7-16-16-16s-16 7-16 16v30h-24' : 'M212 194h24c20 0 32-12 32-31v-20c0-9-7-16-16-16s-16 7-16 16v19h-24'} fill="#239143"/>
      <path d={variant === 'victory' ? 'M98 121v39c0 7 3 11 11 11m145-50v36c0 7-2 11-9 12' : 'M98 144v20c0 8 3 12 11 12m144-32v17c0 8-3 12-10 12'} stroke="#6fc57b" strokeWidth="5" strokeLinecap="round" opacity=".75"/>
      <path d="M131 246V121c0-29 18-48 44-48s45 19 45 48v125Z" fill={`url(#${id}-body)`}/>
      <path d="M143 117v119m17-127v127m41-115v115" stroke="#82cb86" strokeWidth="5" strokeLinecap="round" opacity=".6"/>
      <path d="M217 132v100" stroke="#1b7b38" strokeWidth="5" strokeLinecap="round" opacity=".45"/>
      <g stroke="#b6db97" strokeWidth="2" strokeLinecap="round" opacity=".85"><path d="m136 151-4-2m5 33-4 2m82-32 5-2m-5 35 5 2m-62 26-3 4m41-6 3 4"/></g>
      <g className="lab-mascot-hat">
        <path d="M122 100c4-25 25-53 53-53s51 28 56 53c-33 14-75 14-109 0Z" fill="#a96b42"/>
        <path d="M132 94c10-18 24-36 43-36s35 18 44 36" stroke="#c98a51" strokeWidth="5" strokeLinecap="round"/>
        <path d="M121 96c33-11 76-12 108 0l5 11c-36 14-83 14-119-1Z" fill="#c1844c"/>
        <path d="M124 100c32-9 71-9 101 0" stroke="#f4ca7d" strokeWidth="5" strokeLinecap="round"/>
        <path d="m175 65 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#f8d994"/>
        <path d="m148 78 2 3-3 2-2-3Zm53 0 2 3-3 2-2-3Z" fill="#edbb71"/>
      </g>
      {variant === 'empty' ? <g stroke="#204d3a" strokeWidth="4" strokeLinecap="round"><path d="M150 141q6-6 12 0m24 0q6-6 12 0"/><path d="M167 163q10 5 20 0" strokeWidth="3"/></g> : <>
        {variant === 'victory' ? <g stroke="#204d3a" strokeWidth="4" strokeLinecap="round"><path d="M149 141q7-8 14 0m23 0q7-8 14 0"/></g> : <g fill="#204d3a"><ellipse cx="156" cy="141" rx="6" ry="8"/><ellipse cx="192" cy="141" rx="6" ry="8"/><circle cx="158" cy="138" r="2" fill="white"/><circle cx="194" cy="138" r="2" fill="white"/></g>}
        <path d="M166 161c5 11 17 11 23 0" fill="#204d3a"/><path d="M171 166q6-4 12 0" stroke="#efaa86" strokeWidth="3" strokeLinecap="round"/>
      </>}
      <ellipse cx="144" cy="158" rx="9" ry="5" fill="#e6ba81" opacity=".85"/><ellipse cx="204" cy="158" rx="9" ry="5" fill="#e6ba81" opacity=".85"/>
      <path d="M138 242h76l-9 31c-1 4-5 6-9 6h-40c-4 0-7-2-9-6Z" fill={`url(#${id}-pot)`}/>
      <path d="M142 250h67" stroke="#b67542" strokeWidth="3"/>
      <rect x="130" y="237" width="92" height="14" rx="5" fill="#e5a56c"/>
      <path d="M145 242h61" stroke="#f2c090" strokeWidth="3" strokeLinecap="round"/>
      <path d="m157 262 5 5 6-5 6 5 6-5 6 5 6-5" stroke="#f4ca9f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {variant === 'welcome' && (instrument === 'recorder-soprano' ? <g transform="translate(215 169) rotate(21) scale(.51)"><RecorderDrawing/></g> : <g transform="translate(181 177) rotate(-10) scale(.53)"><TrumpetDrawing/></g>)}
      {variant === 'practice' && <g transform="translate(118 181)"><path d="M0 0c18-6 36-4 56 6 20-10 38-12 56-6v57c-18-6-36-4-56 6-20-10-38-12-56-6Z" fill="#fffcf4" stroke="#d5dcca" strokeWidth="3" strokeLinejoin="round"/><path d="M56 6v54" stroke="#d5dcca" strokeWidth="3"/><path d="M12 18h30m-30 8h30m28-8h30m-30 8h30M12 34h30m28 0h30" stroke="#d1dbc9" strokeWidth="2"/><g fill="#2c5163" stroke="#2c5163" strokeWidth="2.5" strokeLinecap="round"><path d="M31 39V21l9 2m42 18V22"/><ellipse cx="27" cy="40" rx="4" ry="3"/><ellipse cx="78" cy="42" rx="4" ry="3"/></g><path d="M42-4h14l7 9v15l-8-5-8 5V5Z" fill="#f5a528"/></g>}
      {variant === 'streak' && <g transform="translate(224 67) rotate(5)"><circle cx="29" cy="39" r="39" fill="#fff5d9" stroke="#f8d58a" strokeWidth="2"/><TomRojao x={-14} y={2} width={86} height={76}/><path d="m-2 75 4 4m54-5 4-4" stroke="#edbb60" strokeWidth="3" strokeLinecap="round"/></g>}
      {variant === 'victory' && <g transform="translate(145 179)"><path d="m2-5 13 8 13 34 13-34 13-8-8 34-18 18L10 29Z" fill="#e89728"/><path d="m5-3 10 7 13 30L41 4l10-7" stroke="#f6c96c" strokeWidth="5"/><circle cx="28" cy="40" r="25" fill="#e6a328" stroke="#f9cd70" strokeWidth="4"/><path d="m28 25 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1Z" fill="#fff0bd"/></g>}
      {variant === 'empty' && <g transform="translate(219 217)"><path d="M0 35V13" stroke="#6eaa68" strokeWidth="4" strokeLinecap="round"/><path d="M0 23c-14 1-22-9-21-17 13-1 22 5 21 17Zm0-10C2 0 11-5 21-3c-1 12-9 18-21 16Z" fill="#8bbd76"/><path d="M-13 35h29l-4 18H-9Z" fill="#f3cc88"/></g>}
    </g>
  </svg>;
}

function TrumpetDrawing() {
  return <g strokeLinecap="round" strokeLinejoin="round">
    <path d="M29 48h112l53-31v76l-53-29H29Z" fill="#f5bd50" stroke="#ca892a" strokeWidth="4"/>
    <path d="M31 49h110l49-27" stroke="#ffe4a0" strokeWidth="5"/>
    <path d="M142 49v15l50 25V29Z" fill="#efa736"/>
    <ellipse cx="195" cy="55" rx="12" ry="40" fill="#d28a27" stroke="#f6ca68" strokeWidth="4"/>
    <ellipse cx="198" cy="55" rx="7" ry="30" fill="#9f6727"/>
    <path d="M48 64v29c0 20 16 30 36 30h10c22 0 33-10 33-27V64" stroke="#c6892c" strokeWidth="13"/>
    <path d="M48 64v29c0 20 16 30 36 30h10c22 0 33-10 33-27V64" stroke="#f5bc50" strokeWidth="8"/>
    <path d="M62 67v18c0 10 7 15 17 15h15c9 0 14-6 14-14V67" stroke="#df9b30" strokeWidth="8"/>
    {[65,88,111].map(x=><g key={x}><rect x={x-7} y="36" width="14" height="40" rx="5" fill="#e4a83f" stroke="#b67b2b" strokeWidth="2"/><path d={`M${x} 37V22`} stroke="#b47e32" strokeWidth="5"/><rect x={x-9} y="15" width="18" height="8" rx="3" fill="#ffdf8b" stroke="#cb9133" strokeWidth="2"/><path d={`M${x-3} 43v25`} stroke="#ffdc7c" strokeWidth="3"/></g>)}
    <path d="M5 50h26v12H5" fill="#e4bc74" stroke="#b68c50" strokeWidth="3"/><path d="M6 47v18" stroke="#d2aa69" strokeWidth="7"/>
    <path d="M78 118h21" stroke="#ffda79" strokeWidth="3"/>
  </g>;
}

function RecorderDrawing() {
  return <g strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 19C7 8 13 2 22 2s15 6 15 17l-3 24 1 117-4 13H13l-4-13L10 43Z" fill="#f0d69c" stroke="#b69253" strokeWidth="3"/>
    <path d="M13 42h18m-18 99h18m-18 13h18" stroke="#c4a064" strokeWidth="3"/>
    <path d="M15 16h14v13H15Z" fill="#a48049"/><path d="M17 18h10v7H17Z" fill="#795c37"/>
    <path d="M14 47v83" stroke="#fff0c9" strokeWidth="4"/>
    {[52,66,80,94,108].map(y=><g key={y}><ellipse cx="23" cy={y+1} rx="4.7" ry="4.4" fill="#c7a267"/><ellipse cx="22" cy={y} rx="4" ry="3.7" fill="#725d3f"/></g>)}
    {[122,134].map(y=><g key={y}><circle cx="20" cy={y} r="2.7" fill="#725d3f"/><circle cx="26" cy={y+1} r="2.2" fill="#725d3f"/></g>)}
    <path d="M14 163h16" stroke="#c4a064" strokeWidth="3"/>
  </g>;
}

export function InstrumentArtwork({ instrument, className = '' }: { instrument: ArtworkInstrument; className?: string }) {
  const recorder = instrument === 'recorder-soprano';
  return <svg className={`lab-illustration lab-instrument ${className}`.trim()} viewBox="0 0 240 180" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="123" cy="157" rx={recorder ? '56' : '85'} ry="7" fill="#2c5163" opacity=".07"/>
    <circle cx="121" cy="88" r="72" fill={recorder ? '#edf3e5' : '#fff1cf'}/>
    <path d="M43 61v9m-4-4h8m151 53v9m-4-4h8" stroke={recorder ? '#90b27d' : '#e2b65f'} strokeWidth="3" strokeLinecap="round"/>
    {recorder ? <g transform="translate(82 -1) rotate(22 22 86)"><RecorderDrawing/></g> : <g transform="translate(15 35) rotate(-11 108 61)"><TrumpetDrawing/></g>}
    <path d="m191 37 3 5 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1Z" fill={recorder ? '#b8cf98' : '#edbe58'}/>
  </svg>;
}

/** Ícone do Rojão (antes um foguinho): o Tom segurando firme a corda. */
export function StreakFlame({ active = true, size = 32 }: { active?: boolean; size?: number }) {
  return <TomRojao className="lab-streak-flame" active={active} size={size}/>;
}
