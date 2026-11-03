import { targetFrequencyFor, type PracticeNote } from './music.ts';
/** Short electronic reference. Never captures or stores audio. */
export class ReferenceTone{
  private context:AudioContext|null=null;
  private generation=0;
  async play(note:PracticeNote):Promise<void>{
    this.stop();const token=this.generation,ctx=new AudioContext();this.context=ctx;
    try{await ctx.resume();}catch(error){if(this.context===ctx)this.stop();throw error;}
    if(token!==this.generation){void ctx.close().catch(()=>{});return;}
    const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
    osc.type='sine';osc.frequency.value=targetFrequencyFor(note);
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.055,now+.03);gain.gain.exponentialRampToValueAtTime(.0001,now+1.1);
    osc.connect(gain);gain.connect(ctx.destination);osc.start();osc.stop(now+1.12);
    osc.onended=()=>{if(this.context===ctx)this.stop();};
  }
  stop():void{this.generation++;const ctx=this.context;this.context=null;if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
}
