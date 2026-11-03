import {useEffect,useState} from 'react';

/** Conservative SSR state: preferences are read before any automatic motion. */
export function useAccessMotion(){
 const [environment,setEnvironment]=useState({ready:false,reducedMotion:true,visible:true});
 useEffect(()=>{
  const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const update=()=>setEnvironment({ready:true,reducedMotion:query?.matches??true,visible:!document.hidden});
  update();query?.addEventListener?.('change',update);document.addEventListener('visibilitychange',update);
  return ()=>{query?.removeEventListener?.('change',update);document.removeEventListener('visibilitychange',update);};
 },[]);
 return environment;
}
