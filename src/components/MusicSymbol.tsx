import type {Figure} from '../lib/rhythm';

/** Geometry, rather than Unicode music characters, keeps notation font-independent. */
export function MusicSymbolShape({figure='quarter',rest=false}:{figure?:Figure;rest?:boolean}){
  if(rest){
    if(figure==='whole')return <><path d="M8 24h32" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 24h24v8H12z" fill="currentColor"/></>;
    if(figure==='half')return <><path d="M8 36h32" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M12 28h24v8H12z" fill="currentColor"/></>;
    return <path d="m22 5 11 14-9 11 8 11c-8-5-17-2-16 4 0 4 3 7 7 10-13-3-16-15-7-21l5-3-8-9 11-7z" fill="currentColor"/>;
  }
  return <>
    <ellipse cx="20" cy="47" rx={figure==='whole'?12:10} ry="6.5" transform={figure==='whole'?undefined:'rotate(-18 20 47)'} fill={figure==='quarter'?'currentColor':'none'} stroke="currentColor" strokeWidth={figure==='whole'?3.5:2.5}/>
    {figure!=='whole'&&<path d="M29 45V9" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round"/>}
  </>;
}
export function MusicSymbol({figure='quarter',rest=false}:{figure?:Figure;rest?:boolean}){
  return <svg className="music-symbol" viewBox="0 0 48 64" aria-hidden="true" focusable="false"><MusicSymbolShape figure={figure} rest={rest}/></svg>;
}
