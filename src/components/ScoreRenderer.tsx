import { useEffect, useRef, useState } from 'react';
import type { OpenSheetMusicDisplay } from 'opensheetmusicdisplay';

export function ScoreRenderer({xml,cursorIndex,onReady}:{xml:string;cursorIndex:number|null;onReady:(ready:boolean)=>void}){
  const host=useRef<HTMLDivElement>(null),instance=useRef<OpenSheetMusicDisplay|null>(null);
  const desired=useRef(cursorIndex);desired.current=cursorIndex;
  const sync=useRef<()=>void>(()=>{});
  const [error,setError]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{
    let disposed=false,observer:ResizeObserver|null=null,timer:ReturnType<typeof setTimeout>|null=null,osmd:OpenSheetMusicDisplay|null=null;
    onReady(false);setError('');
    const element=document.createElement('div');host.current?.replaceChildren(element);
    void (async()=>{
      try{
        const {OpenSheetMusicDisplay:Renderer}=await import('opensheetmusicdisplay');
        if(disposed)return;
        osmd=new Renderer(element,{backend:'svg',autoResize:false,drawTitle:false,drawComposer:false,drawPartNames:false,drawCredits:false,followCursor:false});
        osmd.Zoom=.9;await osmd.load(xml);if(disposed){osmd.clear();return;}
        osmd.render();instance.current=osmd;
        let position=0;
        sync.current=()=>{
          if(!osmd||disposed)return;
          if(desired.current===null){osmd.cursor.hide();return;}
          if(desired.current<position){osmd.cursor.reset();position=0;}
          while(position<desired.current){osmd.cursor.next();position++;}
          osmd.cursor.show();
        };
        sync.current();onReady(true);
        let width=element.clientWidth;
        observer=new ResizeObserver(()=>{
          if(element.clientWidth===width)return;width=element.clientWidth;
          if(timer)clearTimeout(timer);
          timer=setTimeout(()=>{if(disposed||!osmd)return;osmd.render();osmd.cursor.reset();position=0;sync.current();},160);
        });observer.observe(element);
      }catch{if(!disposed){setError('Não foi possível desenhar esta partitura. Tente novamente ou escolha outro MusicXML.');onReady(false);}}
    })();
    return ()=>{disposed=true;observer?.disconnect();if(timer)clearTimeout(timer);osmd?.clear();instance.current=null;sync.current=()=>{};};
  },[xml,revision,onReady]);
  useEffect(()=>sync.current(),[cursorIndex]);
  return <div className="score-renderer"><div className="score-paper" ref={host} aria-label="Partitura musical em notação profissional"/>{error&&<div className="activity-error" role="alert">{error}<button className="activity-secondary" type="button" onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button></div>}</div>;
}
