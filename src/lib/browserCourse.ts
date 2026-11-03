import {availableInstrument} from './instruments.ts';

/**
 * Curso escolhido neste navegador, guardado fora do perfil: vale para visitante e para quem entra
 * com conta. Quem escolheu a flauta doce volta para a flauta doce, com ou sem login.
 */
export const BROWSER_COURSE_KEY='cactom-curso-navegador';
export function readBrowserCourse():string|null{
 try{return availableInstrument(globalThis.localStorage?.getItem(BROWSER_COURSE_KEY))?.id??null;}catch{return null;}
}
export function saveBrowserCourse(id:string){
 if(!availableInstrument(id))return;
 try{globalThis.localStorage?.setItem(BROWSER_COURSE_KEY,id);}catch{/* sem armazenamento: vale só nesta visita */}
}
