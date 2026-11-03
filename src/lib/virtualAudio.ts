import { midiToFrequency, writtenToConcertMidi } from './music.ts';

/** Low-volume synthetic trumpet-like guide, not a sampled real instrument. */
export class VirtualTrumpetAudio {
  private context: AudioContext | null=null;
  private gain: GainNode | null=null;
  private voices: OscillatorNode[]=[];
  private activeMidi: number | null=null;
  private volume=.65;

  setVolume(value:number):void{
    this.volume=Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
    if(this.context&&this.gain&&this.activeMidi!==null)this.gain.gain.setTargetAtTime(.06*this.volume,this.context.currentTime,.025);
  }

  async enable():Promise<void> {
    if(!this.context){
      const ctx=new AudioContext();
      this.context=ctx;
      this.gain=ctx.createGain();this.gain.gain.value=0;
      this.gain.connect(ctx.destination);
      const amplitudes=[0.50,0.20,0.08];
      amplitudes.forEach((volume,index)=>{
        const wave=ctx.createOscillator();const mix=ctx.createGain();
        wave.type=index===0?'triangle':'sine';mix.gain.value=volume;
        wave.frequency.value=220*(index+1);
        wave.connect(mix);mix.connect(this.gain!);wave.start();this.voices.push(wave);
      });
    }
    if(this.context.state==='suspended')await this.context.resume();
  }
  playWritten(writtenMidi:number|null):void {
    const ctx=this.context, gain=this.gain;
    if(!ctx||!gain)return;
    if(writtenMidi===this.activeMidi)return;
    this.activeMidi=writtenMidi;
    if(writtenMidi===null){gain.gain.setTargetAtTime(0,ctx.currentTime,.035);return;}
    const hz=midiToFrequency(writtenToConcertMidi(writtenMidi));
    this.voices.forEach((voice,i)=>voice.frequency.setTargetAtTime(hz*(i+1),ctx.currentTime,.03));
    gain.gain.setTargetAtTime(.06*this.volume,ctx.currentTime,.025);
  }
  success():void {
    if(!this.context)return;
    const ctx=this.context;
    const oscillator=ctx.createOscillator(),gain=ctx.createGain();
    oscillator.type='sine';oscillator.frequency.value=880;
    gain.gain.setValueAtTime(.0001,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(Math.max(.0001,.025*this.volume),ctx.currentTime+.025);
    gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+.21);
    oscillator.connect(gain);gain.connect(ctx.destination);
    oscillator.start();oscillator.stop(ctx.currentTime+.22);
  }
  async close():Promise<void> {
    this.playWritten(null);
    const ctx=this.context;
    this.context=null;this.gain=null;this.voices=[];this.activeMidi=null;
    if(ctx)try{await ctx.close();}catch{/* encerrado */}
  }
}
