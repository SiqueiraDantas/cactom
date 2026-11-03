/** Keep content clear of a viewport-fixed control, including mobile viewport changes. */
export function attachFloatingFooter(footer:HTMLElement,content:HTMLElement,view:Window=window):()=>void{
  let scheduled:number|null=null,disposed=false;
  const viewport=view.visualViewport;
  const measure=()=>{
    if(disposed)return;
    const obscuredBottom=viewport?Math.max(0,view.innerHeight-viewport.height-viewport.offsetTop):0;
    footer.style.setProperty('--activity-viewport-bottom',`${Math.ceil(obscuredBottom)}px`);
    const bounds=footer.getBoundingClientRect();
    const bottomGap=Math.max(12,view.innerHeight-bounds.bottom);
    content.style.setProperty('--activity-footer-space',`${Math.ceil(bounds.height+bottomGap+12)}px`);
  };
  const schedule=()=>{
    if(disposed||scheduled!==null)return;
    scheduled=view.requestAnimationFrame(()=>{scheduled=null;measure();});
  };
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);
  observer?.observe(footer);
  view.addEventListener('resize',schedule,{passive:true});
  view.addEventListener('scroll',schedule,{passive:true});
  viewport?.addEventListener('resize',schedule,{passive:true});
  viewport?.addEventListener('scroll',schedule,{passive:true});
  measure();
  return ()=>{
    disposed=true;observer?.disconnect();
    if(scheduled!==null)view.cancelAnimationFrame(scheduled);
    view.removeEventListener('resize',schedule);view.removeEventListener('scroll',schedule);
    viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);
  };
}
