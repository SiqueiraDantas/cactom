import {useEffect,useImperativeHandle,useRef,useState,forwardRef} from 'react';
import './rive-animation.css';

/**
 * Toca um arquivo .riv feito no Rive (rive.app). O motor do Rive só é baixado quando existe um arquivo
 * para tocar; o .wasm é servido pelo próprio projeto (public/rive), então funciona sem internet.
 * Se o arquivo tiver uma máquina de estados com o nome pedido, ela é usada; senão, a primeira animação.
 */
export type RiveHandle={replay:()=>void;pause:()=>void};
export const RIVE_FILES={abertura:'/animacoes/abertura.riv',tom:'/animacoes/tom.riv'} as const;

/** Confere se o arquivo existe de verdade (o servidor de desenvolvimento devolve o index.html para caminhos ausentes). */
export async function riveFileExists(src:string):Promise<boolean>{
 try{const r=await fetch(src,{method:'HEAD',cache:'no-store'});const type=r.headers.get('content-type')??'';return r.ok&&!type.includes('html');}catch{return false;}
}

type Props={src:string;stateMachine?:string;label:string;autoplay?:boolean;onReady?:()=>void;onError?:()=>void;className?:string};
export const RiveAnimation=forwardRef<RiveHandle,Props>(function RiveAnimation({src,stateMachine,label,autoplay=true,onReady,onError,className=''},ref){
 const canvas=useRef<HTMLCanvasElement>(null);
 const instance=useRef<{play:(n?:string|string[])=>void;pause:()=>void;reset:(p?:{stateMachines?:string|string[];animations?:string|string[];autoplay?:boolean})=>void;cleanup:()=>void;resizeDrawingSurfaceToCanvas:()=>void}|null>(null);
 const target=useRef<{stateMachines?:string;animations?:string}>({});
 const [ready,setReady]=useState(false);
 useImperativeHandle(ref,()=>({
  replay:()=>{const r=instance.current;if(!r)return;r.reset({...target.current,autoplay:true});},

  pause:()=>instance.current?.pause(),
 }),[]);
 useEffect(()=>{
  let disposed=false,loaded=false;
  (async()=>{
   try{
    const rive=await import('@rive-app/canvas');
    rive.RuntimeLoader.setWasmUrl('/rive/rive.wasm');
    if(disposed||!canvas.current)return;
    const r=new rive.Rive({src,canvas:canvas.current,autoplay:false,layout:new rive.Layout({fit:rive.Fit.Contain,alignment:rive.Alignment.Center}),
     onLoad:()=>{
      if(disposed||loaded)return;loaded=true;
      r.resizeDrawingSurfaceToCanvas();
      const machines=r.stateMachineNames??[],animations=r.animationNames??[];
      target.current=stateMachine&&machines.includes(stateMachine)?{stateMachines:stateMachine}:machines.length?{stateMachines:machines[0]}:{animations:animations[0]};
      if(autoplay)r.play(target.current.stateMachines??target.current.animations);
      setReady(true);onReady?.();
     },
     onLoadError:()=>{if(!disposed)onError?.();}});
    instance.current=r as unknown as typeof instance.current;
   }catch{if(!disposed)onError?.();}
  })();
  const resize=()=>instance.current?.resizeDrawingSurfaceToCanvas();
  window.addEventListener('resize',resize);
  return ()=>{disposed=true;window.removeEventListener('resize',resize);instance.current?.cleanup();instance.current=null;};
 },[src]);
 return <canvas ref={canvas} className={`rive-animation ${ready?'is-ready':''} ${className}`} role="img" aria-label={label}/>;
});
