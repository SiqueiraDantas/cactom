import {ACCESS_COPY,type AccessLocale} from '../lib/accessLocale';

/** Abertura do Cactom saindo do celular: SVG + CSS puro em public/animacoes, roda em loop e respeita movimento reduzido. */
export const PHONE_SCENE_SRC='/animacoes/cactom-celular.svg';
export function WelcomePhoneScene({locale='pt-BR'}:{locale?:AccessLocale}){
 const t=ACCESS_COPY[locale];
 return <figure className="welcome-ensemble welcome-phone-scene">
  <img src={PHONE_SCENE_SRC} alt={t.artworkAlt} width={1000} height={625} decoding="async"/>
 </figure>;
}
