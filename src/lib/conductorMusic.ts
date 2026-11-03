/** Arranjos de estudo autorais sintetizados com Web Audio.
 * Não utilizam gravações de terceiros nem enviam conteúdo pela rede.
 */
import type {Meter} from './conducting.ts';
import {clamp} from './conducting.ts';
export type ConductingAudioMode='gesture'|'music'|'orchestra';
export type Voice='lead'|'harmony'|'bass';
export type MusicalNote={midi:number;voice:Voice;durationBeats:number;level:number};
export type Arrangement={title:string;character:string;meter:Meter;progression:readonly (readonly number[])[];melody:readonly number[]};
export const ARRANGEMENTS:Record<Meter,Arrangement>={
  2:{title:'Marcha do Mandacaru',character:'Marcha leve para dois tempos',meter:2,
    progression:[[48,52,55],[43,47,50],[45,48,52],[41,45,48]],
    melody:[72,76,74,71,72,76,79,76]},
  3:{title:'Valsa das Flores',character:'Valsa delicada em três tempos',meter:3,
    progression:[[48,52,55],[45,48,52],[41,45,48],[43,47,50]],
    melody:[76,79,76,74,76,72,72,77,76,74,71,72]},
  4:{title:'Abertura do Sertão',character:'Pequena abertura em quatro tempos',meter:4,
    progression:[[48,52,55],[43,47,50],[45,48,52],[41,45,48]],
    melody:[72,76,79,76,74,71,74,79,81,79,76,72,77,76,74,72]},
};
export const midiToHz=(midi:number):number=>440*Math.pow(2,(midi-69)/12);
/** Retorna notas determinísticas por pulso: melodia, baixo e harmonias. */
export function notesForBeat(meter:Meter,beatIndex:number):MusicalNote[]{
  const piece=ARRANGEMENTS[meter];
  const index=Math.max(0,Math.floor(beatIndex));
  const beatInBar=index%meter;
  const chord=piece.progression[Math.floor(index/meter)%piece.progression.length];
  const melody=piece.melody[index%piece.melody.length];
  const notes:MusicalNote[]=[{midi:melody,voice:'lead',durationBeats:.84,level:.30}];
  if(beatInBar===0){
    notes.push({midi:chord[0]-12,voice:'bass',durationBeats:.75,level:.34});
    for(const tone of chord)notes.push({midi:tone+12,voice:'harmony',durationBeats:Math.min(meter*.87,3.1),level:.10});
  }else if(meter===3){
    for(const tone of chord.slice(1))notes.push({midi:tone+12,voice:'harmony',durationBeats:.37,level:.12});
  }else if(beatInBar%2===1){
    notes.push({midi:chord[0]-12,voice:'bass',durationBeats:.36,level:.16});
  }
  return notes;
}

/** Relógio de áudio com agendamento adiantado; recebe início alinhado ao metrônomo.
 * Modo orquestra: entrada e corte controlam o volume master, sem alterar o BPM.
 */
export class ConductingEnsemble{
  private ctx:AudioContext|null=null;
  private master:GainNode|null=null;
  private timer:ReturnType<typeof setInterval>|null=null;
  private oscillators=new Set<OscillatorNode>();
  private nextBeat=0;
  private firstTime=0;
  private bpm=72;
  private meter:Meter=4;
  private entered=false;
  private intensity=.65;
  private active=false;

  async start(options:{bpm:number;meter:Meter;startAtMs:number;mode:ConductingAudioMode}){
    this.stop();
    if(options.mode==='gesture')return;
    if(!Number.isFinite(options.bpm)||options.bpm<45||options.bpm>120||!Number.isFinite(options.startAtMs))throw new Error('Parâmetros musicais inválidos.');
    const context=new AudioContext();this.ctx=context;
    this.meter=options.meter;this.bpm=options.bpm;
    this.entered=options.mode==='music';this.intensity=.65;
    this.master=context.createGain();this.master.gain.value=0;this.master.connect(context.destination);
    try{await context.resume();}catch(e){this.stop();throw e;}
    this.firstTime=context.currentTime+(options.startAtMs-performance.now())/1000;
    this.nextBeat=0;this.active=true;
    this.setEntered(this.entered);
    this.schedule();
    this.timer=setInterval(()=>this.schedule(),25);
  }
  get isEntered(){return this.entered;}
  setEntered(value:boolean){
    this.entered=value;
    if(this.ctx&&this.master){
      const now=this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.setTargetAtTime(value?this.intensity*.65:0,now,value?.075:.11);
    }
  }
  setIntensity(value:number){
    const next=clamp(value,.24,1);
    if(Math.abs(next-this.intensity)<.04)return;
    this.intensity=next;
    if(this.entered&&this.ctx&&this.master){
      const now=this.ctx.currentTime;
      this.master.gain.setTargetAtTime(this.intensity*.65,now,.16);
    }
  }
  private play(note:MusicalNote,start:number,beatSeconds:number){
    const ctx=this.ctx,master=this.master;
    if(!ctx||!master)return;
    const time=Math.max(start,ctx.currentTime+.004);
    const duration=Math.max(.09,note.durationBeats*beatSeconds);
    const oscillator=ctx.createOscillator();const gain=ctx.createGain();
    const freq=midiToHz(note.midi);
    oscillator.type=note.voice==='lead'?'sine':note.voice==='bass'?'triangle':'triangle';
    oscillator.frequency.setValueAtTime(freq,time);
    // Vibrato discreto na melodia, não altera a afinação estrutural.
    if(note.voice==='lead')oscillator.frequency.setValueAtTime(freq*1.002,time+Math.min(.15,duration*.4));
    gain.gain.setValueAtTime(.0001,time);
    const attack=note.voice==='harmony'?.045:.015;
    gain.gain.linearRampToValueAtTime(note.level,time+attack);
    gain.gain.setTargetAtTime(note.level*.8,time+attack,.08);
    gain.gain.setTargetAtTime(.0001,time+Math.max(attack+.07,duration*.68),Math.max(.06,duration*.12));
    oscillator.connect(gain);gain.connect(master);
    oscillator.start(time);oscillator.stop(time+duration+.26);
    this.oscillators.add(oscillator);
    oscillator.onended=()=>{this.oscillators.delete(oscillator);try{oscillator.disconnect();gain.disconnect();}catch{/* áudio já finalizado */}};
  }
  private schedule(){
    const ctx=this.ctx;
    if(!this.active||!ctx||ctx.state!=='running')return;
    const beatSeconds=60/this.bpm;
    while(this.firstTime+this.nextBeat*beatSeconds<ctx.currentTime+.16){
      const time=this.firstTime+this.nextBeat*beatSeconds;
      if(time>=ctx.currentTime-.12){
        for(const note of notesForBeat(this.meter,this.nextBeat))this.play(note,time,beatSeconds);
      }
      this.nextBeat++;
    }
  }
  stop(){
    this.active=false;
    if(this.timer!==null){clearInterval(this.timer);this.timer=null;}
    for(const osc of this.oscillators){try{osc.onended=null;osc.stop();osc.disconnect();}catch{/* já terminou */}}
    this.oscillators.clear();
    if(this.master)try{this.master.disconnect();}catch{/* ignora */}
    this.master=null;
    const old=this.ctx;this.ctx=null;
    if(old)void old.close().catch(()=>{});
  }
}
