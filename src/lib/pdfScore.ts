import {binarize,readScorePages,runLengths,type GrayImage,type OmrResult} from './scoreOmr.ts';

/** PDF de partitura → páginas em tons de cinza → leitura das notas (OMR). Só roda no navegador. */
export const MAX_PDF_SIZE=15*1024*1024;
export const MAX_PDF_PAGES=6;
/** O leitor trabalha melhor com ~20 px entre as linhas da pauta. */
const TARGET_SPACE=20,MAX_SIDE=4200;

type PdfPage={getViewport:(o:{scale:number})=>{width:number;height:number};render:(o:{canvasContext:CanvasRenderingContext2D;viewport:unknown})=>{promise:Promise<void>};getTextContent?:()=>Promise<{items:unknown[]}>;getOperatorList?:()=>Promise<{fnArray:number[]}>};
/** Nome da música: o maior texto do alto da 1ª página (quando o PDF tem texto de verdade). */
async function titleOf(page:PdfPage):Promise<string>{
 try{
  const height=page.getViewport({scale:1}).height,content=await page.getTextContent?.();if(!content)return '';
  const items=(content.items as {str?:string;transform?:number[];height?:number}[]).filter(i=>i.str&&i.str.trim().length>=3&&i.transform&&i.transform[5]>height*.7);
  const best=items.sort((a,b)=>(b.height??0)-(a.height??0))[0];
  return best?.str?.trim().replace(/\s+/g,' ').slice(0,60)??'';
 }catch{return '';}
}

let OPS:Record<string,number>={};
/** Página feita de imagem (escaneada/foto) e não de desenho vetorial de programa de partitura. */
async function imageBased(page:PdfPage):Promise<boolean>{
 try{const list=await page.getOperatorList?.();if(!list)return false;
  const images=list.fnArray.filter(f=>f===OPS.paintImageXObject||f===OPS.paintInlineImageXObject||f===OPS.paintImageMaskXObject).length;
  const paths=list.fnArray.filter(f=>f===OPS.constructPath).length;
  return images>0&&paths<40;
 }catch{return false;}
}
/** O navegador amacia a imagem ao ampliar; escurecer (gama 2,2) devolve hastes e linhas finas. */
const DARKEN=Uint8Array.from({length:256},(_,v)=>Math.round(255*(v/255)**2.2));
async function loadPdf(data:ArrayBuffer){
 const pdfjs=await import('pdfjs-dist');OPS=pdfjs.OPS as unknown as Record<string,number>;
 const worker=(await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
 pdfjs.GlobalWorkerOptions.workerSrc=worker;
 return pdfjs.getDocument({data:new Uint8Array(data),isEvalSupported:false,disableFontFace:true}).promise;
}
async function rasterize(page:PdfPage,scale:number,darken=false):Promise<GrayImage>{
 const viewport=page.getViewport({scale});
 const canvas=document.createElement('canvas');canvas.width=Math.round(viewport.width);canvas.height=Math.round(viewport.height);
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw new Error('Este navegador não conseguiu abrir o PDF.');
 ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 await page.render({canvasContext:ctx,viewport}).promise;
 const rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data,gray=new Uint8Array(canvas.width*canvas.height);
 for(let i=0,j=0;j<gray.length;i+=4,j++)gray[j]=(rgba[i]*299+rgba[i+1]*587+rgba[i+2]*114)/1000;
 if(darken)for(let j=0;j<gray.length;j++)gray[j]=DARKEN[gray[j]];
 const width=canvas.width,height=canvas.height;canvas.width=canvas.height=0;
 return {width,height,data:gray};
}
function readInWorker(pages:GrayImage[]):Promise<OmrResult>{
 if(typeof Worker==='undefined')return Promise.resolve(readScorePages(pages));
 return new Promise((resolve,reject)=>{
  let worker:Worker;
  try{worker=new Worker(new URL('./omrWorker.ts',import.meta.url),{type:'module'});}catch{resolve(readScorePages(pages));return;}
  worker.onmessage=(e:MessageEvent<{ok:boolean;result?:OmrResult;error?:string}>)=>{worker.terminate();if(e.data.ok&&e.data.result)resolve(e.data.result);else reject(new Error(e.data.error??'Não consegui ler esta partitura.'));};
  worker.onerror=()=>{worker.terminate();try{resolve(readScorePages(pages));}catch(err){reject(err);}};
  worker.postMessage({pages},pages.map(p=>(p.data as Uint8Array).buffer));
 });
}
export type PdfReading={result:OmrResult;preview:string;pages:number;title:string};
/** Lê um PDF e devolve as notas reconhecidas e uma miniatura da 1ª página para conferência. */
export async function readPdfScore(file:File,onStep:(text:string)=>void=()=>{}):Promise<PdfReading>{
 if(file.size>MAX_PDF_SIZE)throw new Error('Escolha um PDF de até 15 MB.');
 onStep('Abrindo o PDF…');
 const pdf=await loadPdf(await file.arrayBuffer()).catch(()=>{throw new Error('Não consegui abrir este PDF. Ele pode estar protegido por senha ou corrompido.');});
 const total=Math.min(pdf.numPages,MAX_PDF_PAGES);
 const first=await pdf.getPage(1) as unknown as PdfPage;
 // 1ª passada em baixa resolução só para medir a distância entre as linhas
 const scanned=await imageBased(first);
 const probe=await rasterize(first,100/72,scanned);
 const {space}=runLengths(binarize(probe),probe.width,probe.height);
 const base=first.getViewport({scale:1});
 let scale=(100/72)*TARGET_SPACE/Math.max(4,space);
 scale=Math.min(scale,MAX_SIDE/Math.max(base.width,base.height),8);
 const pages:GrayImage[]=[];
 for(let i=1;i<=total;i++){onStep(`Lendo a página ${i} de ${total}…`);const page=(i===1?first:await pdf.getPage(i)) as unknown as PdfPage;pages.push(await rasterize(page,scale,i===1?scanned:await imageBased(page)));}
 const preview=await thumbnail(first),title=await titleOf(first);
 onStep('Procurando as notas na pauta…');
 const result=await readInWorker(pages);
 void pdf.destroy?.();
 return {result,preview,pages:pdf.numPages,title};
}
async function thumbnail(page:PdfPage):Promise<string>{
 const viewport=page.getViewport({scale:1}),scale=900/viewport.width,v=page.getViewport({scale});
 const canvas=document.createElement('canvas');canvas.width=Math.round(v.width);canvas.height=Math.round(v.height);
 const ctx=canvas.getContext('2d');if(!ctx)return '';ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
 await page.render({canvasContext:ctx,viewport:v}).promise;
 // corta o branco de cima e de baixo, para a miniatura mostrar só a música
 const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;let top=-1,bottom=-1;
 for(let y=0;y<canvas.height;y++){let ink=false;for(let x=0;x<canvas.width;x+=2){if(data[(y*canvas.width+x)*4]<160){ink=true;break;}}if(ink){if(top<0)top=y;bottom=y;}}
 if(top<0)return canvas.toDataURL('image/jpeg',.82);
 top=Math.max(0,top-16);bottom=Math.min(canvas.height,bottom+16);
 const out=document.createElement('canvas');out.width=canvas.width;out.height=bottom-top;out.getContext('2d')?.drawImage(canvas,0,top,canvas.width,bottom-top,0,0,canvas.width,bottom-top);
 return out.toDataURL('image/jpeg',.82);
}
