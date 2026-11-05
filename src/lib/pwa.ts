/**
 * Instalação do Cactom como app (PWA).
 * - Registra o service worker só no site publicado (não no `npm run dev`).
 * - Guarda o pedido de instalação do Chrome/Android para o botão "Instalar o Cactom".
 * - No iPhone não existe esse pedido: mostramos como adicionar pela tela de Compartilhar.
 */
type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
let deferred:InstallPrompt|null=null;
const listeners=new Set<()=>void>();
const notify=()=>listeners.forEach(f=>f());

export function startPwa(env:{PROD?:boolean}={}){
 if(typeof window==='undefined')return;
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e as InstallPrompt;notify();});
 window.addEventListener('appinstalled',()=>{deferred=null;notify();});
 if(env.PROD&&'serviceWorker' in navigator){
  window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{/* sem service worker: o app segue normal */});});
 }
}
export function onInstallChange(f:()=>void){listeners.add(f);return ()=>{listeners.delete(f);};}
export const canPrompt=()=>!!deferred;
export async function promptInstall():Promise<boolean>{
 if(!deferred)return false;const d=deferred;deferred=null;notify();
 try{await d.prompt();return (await d.userChoice).outcome==='accepted';}catch{return false;}
}
/** Já está aberto como app instalado? */
export function isStandalone(){
 if(typeof window==='undefined')return false;
 return window.matchMedia?.('(display-mode: standalone)').matches===true||(navigator as Navigator&{standalone?:boolean}).standalone===true;
}
/** iPhone/iPad no Safari: instala por Compartilhar → Adicionar à Tela de Início. */
export function isIosSafari(ua=typeof navigator==='undefined'?'':navigator.userAgent){
 const ios=/iphone|ipad|ipod/i.test(ua)||(/macintosh/i.test(ua)&&typeof navigator!=='undefined'&&navigator.maxTouchPoints>1);
 return ios&&/safari/i.test(ua)&&!/crios|fxios|edgios|opios/i.test(ua);
}
const DISMISS='cactom-instalar-dispensado';
export function installDismissed(store:Pick<Storage,'getItem'>|undefined=globalThis.localStorage){try{const v=Number(store?.getItem(DISMISS));return v>0&&Date.now()-v<14*864e5;}catch{return false;}}
export function dismissInstall(store:Pick<Storage,'setItem'>|undefined=globalThis.localStorage){try{store?.setItem(DISMISS,String(Date.now()));}catch{/* sem armazenamento */}}
