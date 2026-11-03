import type {AccessLocale} from '../lib/accessLocale';
import './cactom-loader.css';

/** Tela de carregamento: Tom de perfil andando e pensando (SVG + CSS em public/animacoes). */
export const LOADER_SRC='/animacoes/cactom-carregando.svg';
export const LOADER_MS=2000;
const LABEL:Record<string,string>={'pt-BR':'Carregando…','en':'Loading…','es':'Cargando…'};
export function CactomLoader({locale='pt-BR'}:{locale?:AccessLocale}){
 return <div className="cactom-loader" role="status" aria-live="polite">
  <img src={LOADER_SRC} alt="" width={420} height={474} decoding="async"/>
  <span className="cactom-loader__label">{LABEL[locale]??LABEL['pt-BR']}</span>
 </div>;
}
