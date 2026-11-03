/** WebAudio look-ahead clock: audio timestamps, not JS timer wake-ups, control clicks. */
export class Metronome {
  private context: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private nextTime = 0;
  private firstBeatTime = 0;
  private nextBeat = 0;
  private bpm = 60;
  private beatsPerBar=4;
  private clickAfterCountIn=true;
  private clickNodes = new Set<OscillatorNode>();
  private onBeat: (beat: number) => void = () => {};
  private lastDisplayed = -1;
  async start(bpm:number,onBeat:(beat:number)=>void,beatsPerBar=4):Promise<void> {
    this.stop();
    if(!Number.isFinite(bpm)||bpm<45||bpm>120||![2,3,4].includes(beatsPerBar))throw new Error('Andamento ou compasso inválido.');
    this.beatsPerBar=beatsPerBar;
    this.bpm=bpm;this.onBeat=onBeat;
    const ctx=new AudioContext();this.context=ctx;
    try{await ctx.resume();}catch(err){this.stop();throw err;}
    this.nextTime=ctx.currentTime+0.12;this.firstBeatTime=this.nextTime;this.nextBeat=0;this.lastDisplayed=-1;
    this.scheduler();
    this.timer=setInterval(()=>this.scheduler(),25);
  }
  /** Conta o compasso preparatório com som, podendo silenciar os cliques quando a música entrar. */
  setClickAfterCountIn(enabled:boolean){this.clickAfterCountIn=enabled;}
  private scheduler():void{
    const ctx=this.context;
    if(!ctx||ctx.state!=='running')return;
    const now=ctx.currentTime;
    while(this.nextTime<now+0.12){
      const beat=(this.nextBeat%this.beatsPerBar)+1;
      const t=this.nextTime;
      if(!this.clickAfterCountIn&&this.nextBeat>=this.beatsPerBar){
        this.nextBeat++;this.nextTime+=60/this.bpm;continue;
      }
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type='sine'; osc.frequency.setValueAtTime(beat===1?1800:1450,t);
      gain.gain.setValueAtTime(0.0001,t);
      gain.gain.exponentialRampToValueAtTime(beat===1?0.144:0.084,t+0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001,t+0.038);
      osc.connect(gain);gain.connect(ctx.destination);osc.start(t);osc.stop(t+0.05);
      this.clickNodes.add(osc);
      osc.onended=()=>{osc.disconnect();gain.disconnect();this.clickNodes.delete(osc);};
      this.nextBeat++;this.nextTime+=60/this.bpm;
    }
    // UI follows audio context clock, not when interval happened to run.
    const beatsElapsed=Math.floor(Math.max(0,(ctx.currentTime-(this.nextTime-this.nextBeat*60/this.bpm))*this.bpm/60));
    if(beatsElapsed!==this.lastDisplayed&&ctx.currentTime>=this.nextTime-this.nextBeat*60/this.bpm){
      this.lastDisplayed=beatsElapsed;this.onBeat(beatsElapsed%this.beatsPerBar+1);
    }
  }
  /** Scheduled start after exactly one count-in bar in the configured meter. */
  nextExerciseBarStartMs(): number | null {
    const ctx = this.context;
    if (!ctx || ctx.state !== 'running') return null;
    const quarter = 60 / this.bpm;
    // Restart the clock's origin so the student always hears exactly one count-in bar.
    for(const osc of this.clickNodes){try{osc.stop();}catch{/* Already ended. */}}
    this.clickNodes.clear();
    this.firstBeatTime=ctx.currentTime+.12;this.nextTime=this.firstBeatTime;this.nextBeat=0;this.lastDisplayed=-1;
    this.scheduler();
    const exerciseAt = this.firstBeatTime + this.beatsPerBar * quarter;
    // performance.now and AudioContext.currentTime use different origins.
    return performance.now() + (exerciseAt - ctx.currentTime) * 1000;
  }
  stop():void{
    if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
    for(const osc of this.clickNodes){try{osc.onended=null;osc.stop();osc.disconnect();}catch{/**/}}
    this.clickNodes.clear();
    const ctx=this.context;this.context=null;
    if(ctx)void ctx.close().catch(()=>{});
  }
}
