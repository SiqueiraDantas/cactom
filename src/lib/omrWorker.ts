/// <reference lib="webworker" />
import {readScorePages,type GrayImage} from './scoreOmr.ts';

/** Lê as páginas fora da tela principal, para o app não travar enquanto o PDF é lido. */
self.onmessage=(event:MessageEvent<{pages:GrayImage[]}>)=>{
 try{(self as unknown as Worker).postMessage({ok:true,result:readScorePages(event.data.pages)});}
 catch(error){(self as unknown as Worker).postMessage({ok:false,error:error instanceof Error?error.message:'Não consegui ler esta partitura.'});}
};
