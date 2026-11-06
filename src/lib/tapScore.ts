/** Confere os toques de “bata o ritmo” / “sinta o pulso” contra os tempos esperados. */
export type TapVerdict={ok:boolean;early:number;late:number;missing:number;extra:number;firstEarlyBeat?:number};
/** Toques em unidades de semínima a partir do primeiro tempo do compasso. */
export function scoreTaps(expected:readonly number[],taps:readonly number[],quarterMs:number,toleranceMs=220):TapVerdict{
 const used=new Set<number>();let early=0,late=0,missing=0;let firstEarlyBeat:number|undefined;
 for(const beat of expected){
  let best=-1,bestDiff=Infinity;taps.forEach((t,i)=>{if(used.has(i))return;const d=Math.abs(t-beat)*quarterMs;if(d<bestDiff){bestDiff=d;best=i;}});
  if(best>=0&&bestDiff<=toleranceMs){used.add(best);continue;}
  missing++;
  const near=taps.findIndex((t,i)=>!used.has(i)&&t<beat&&beat-t<=1.6);
  if(near>=0){early++;used.add(near);if(firstEarlyBeat===undefined)firstEarlyBeat=Math.round(taps[near]);}
  else if(taps.some((t,i)=>!used.has(i)&&t>beat))late++;
 }
 const extra=taps.length-used.size;
 return {ok:missing===0&&extra===0,early,late,missing,extra,...(firstEarlyBeat!==undefined?{firstEarlyBeat}:{})};
}
