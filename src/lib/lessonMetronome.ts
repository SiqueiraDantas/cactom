/**
 * Metrônomo das atividades de tocar: os bipes da contagem (mais fortes, o 1º mais agudo) e depois
 * os bipes continuam durante toda a música, mais baixinhos, marcando o tempo pra criança não se perder.
 * O primeiro tempo de cada compasso soa um pouco mais agudo. Bipes curtos e agudos (acima da faixa
 * das notas) atrapalham o mínimo possível o microfone.
 */
export type MetronomeRef={current:AudioContext|null};
export function startLessonMetronome(ref:MetronomeRef,{countIn,playing,pulseMs,perBar}:{countIn:number;playing:number;pulseMs:number;perBar:number}):number{
 try{
  const c=ref.current??=new AudioContext();void c.resume();
  const lead=.06,t0=c.currentTime+lead;
  for(let i=0;i<countIn+playing;i++){
   const at=t0+i*pulseMs/1000,inCount=i<countIn,strong=(i-countIn)%perBar===0;
   const o=c.createOscillator(),g=c.createGain();o.type='triangle';
   o.frequency.value=inCount?(i===0?1760:1320):(strong?2200:1760);
   const peak=inCount?.35:(strong?.16:.1),len=inCount?.07:.045;
   g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(peak,at+.004);g.gain.exponentialRampToValueAtTime(.0001,at+len);
   o.connect(g).connect(c.destination);o.start(at);o.stop(at+len+.02);
  }
  return lead*1000;
 }catch{return 0;}
}
/** Para os bipes na hora (fecha o contexto com os bipes já agendados). */
export function stopLessonMetronome(ref:MetronomeRef){const c=ref.current;ref.current=null;if(c&&c.state!=='closed')void c.close().catch(()=>{});}
