import type {JourneyStop,StopStatus} from '../lib/recorderJourney';

/** Abrir uma lição da trilha (parada, lição e se é revisão). */
export type JourneyOpen={stopId:string;lessonId?:string;review?:boolean};

/** Ícone de cada parada da trilha (descoberta, prática, criação, missão, checkpoint) e dos estados concluída/revisão. */
export function StopIcon({kind,status}:{kind:JourneyStop['kind'];status:StopStatus}){
 const p={fill:'none',stroke:'currentColor',strokeWidth:2.6,strokeLinecap:'round' as const,strokeLinejoin:'round' as const};
 if(status==='concluida')return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} strokeWidth={3.4} d="m5 12.5 4.2 4.2L19 7"/></svg>;
 if(status==='revisao')return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5"/></svg>;
 switch(kind){
  case 'descoberta':return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect {...p} x="3" y="13" width="5" height="7" rx="2"/><rect {...p} x="16" y="13" width="5" height="7" rx="2"/></svg>;
  case 'pratica':return <svg viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(32 12 12)"><path {...p} d="M10 2.5h4l-.4 3.5h-3.2z"/><path {...p} d="M10.4 6h3.2v12.5l1.2 3h-5.6l1.2-3z"/><circle cx="12" cy="9.5" r="1" fill="currentColor"/><circle cx="12" cy="12.6" r="1" fill="currentColor"/><circle cx="12" cy="15.7" r="1" fill="currentColor"/></g></svg>;
  case 'criacao':return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M9 18V6l10-2v12"/><ellipse {...p} cx="6.5" cy="18" rx="2.5" ry="2"/><ellipse {...p} cx="16.5" cy="16" rx="2.5" ry="2"/></svg>;
  case 'desafio':return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="currentColor"/><path {...p} d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 13v4m-4 3h8"/></svg>;
  default:return <svg viewBox="0 0 24 24" aria-hidden="true"><path {...p} d="M5 21V4m0 0h11l-2 4 2 4H5"/></svg>;
 }
}
