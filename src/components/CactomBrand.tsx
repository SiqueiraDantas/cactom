import type {TomExpression} from './CactomTomArt';
import {TomCharacter} from './TomCharacter';
/**
 * Logo oficial recortada do arquivo identidade-oficial.png (scripts/build-wordmark.py):
 * enquadramento justo, fundo transparente e proporção fixa, para alinhar à esquerda sem margem branca.
 */
export function CactomWordmark({tagline=false,className=''}:{tagline?:boolean;className?:string}){
  return tagline
   ?<img className={`cactom-wordmark ${className}`} src="/branding/cactom/cactom-wordmark-lema.png" width={459} height={183} alt="Cactom. A música floresce em você." decoding="async"/>
   :<img className={`cactom-wordmark ${className}`} src="/branding/cactom/cactom-wordmark.png" width={459} height={145} alt="Cactom" decoding="async"/>;
}
/**
 * Tom everywhere in the app: the vector mascot with an expression for the moment
 * (happy, excited, proud, focused, sad, surprised, celebrating, thinking, covering his eyes).
 * Changing the expression replays a small pop, like a Duolingo-style character reacting.
 */
export function TomOfficial({className='',decorative=false,expression='feliz'}:{className?:string;decorative?:boolean;expression?:TomExpression}){
  return <span className={`tom-official ${className}`} data-expression={expression} role={decorative?undefined:'img'} aria-label={decorative?undefined:TOM_EXPRESSION_LABEL[expression]} aria-hidden={decorative||undefined}>
    <span className="tom-official-pose" key={expression}><TomCharacter expression={expression}/></span>
  </span>;
}
const TOM_EXPRESSION_LABEL:Record<TomExpression,string>={feliz:'Tom, o cacto do Cactom, sorrindo',animado:'Tom, animado',orgulhoso:'Tom, orgulhoso',concentrado:'Tom, concentrado',triste:'Tom, um pouco triste, incentivando a tentar de novo',surpreso:'Tom, surpreso',comemorando:'Tom comemorando',pensativo:'Tom, pensativo',privacidade:'Tom cobrindo os olhos'};
