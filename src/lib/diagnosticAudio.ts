import {targetFrequencyFor} from './music.ts';
import {recorderNote} from './recorder.ts';
import type {DiagnosticId} from './recorderDiagnostic';
export type DiagnosticSound={at:number;duration:number;frequency:number;click?:boolean};
const note=(midi:number,at:number,duration=.5):DiagnosticSound=>({at,duration,frequency:targetFrequencyFor(recorderNote(midi))});
export function diagnosticStimulus(id:DiagnosticId):readonly DiagnosticSound[]{
 if(id==='D01')return Array.from({length:8},(_,i)=>({at:i*.7,duration:.065,frequency:1000,click:true}));
 if(id==='D02')return [0,1,1.5,3].map(beat=>({at:beat*.7,duration:.065,frequency:1000,click:true}));
 if(id==='D03')return [note(67,0,.7),note(71,1.15,.7)];
 if(id==='D04')return [note(71,0),note(69,.7),note(67,1.4)];
 if(id==='D05')return [note(71,0),note(69,.7),note(71,1.4)];
 if(id==='D07')return [note(71,0,1.2)];
 return [];
}
/** Electronic listening models only. Never records audio or certifies instrumental tone. */
export class DiagnosticAudio{
 private context:AudioContext|null=null;
 private generation=0;
 private pending:((finished:boolean)=>void)|null=null;
 stop(){this.generation++;const resolve=this.pending;this.pending=null;resolve?.(false);const ctx=this.context;this.context=null;if(ctx&&ctx.state!=='closed')void ctx.close().catch(()=>{});}
 async play(id:DiagnosticId):Promise<boolean>{
  this.stop();const token=this.generation,events=diagnosticStimulus(id);
  if(!events.length)return false;
  const ctx=new AudioContext();this.context=ctx;
  try{await ctx.resume();}catch(error){if(token!==this.generation)return false;this.stop();throw error;}
  if(token!==this.generation){if(ctx.state!=='closed')void ctx.close().catch(()=>{});return false;}
  return new Promise<boolean>((resolve,reject)=>{
   this.pending=resolve;const start=ctx.currentTime+.06;
   try{events.forEach((event,index)=>{
    const osc=ctx.createOscillator(),gain=ctx.createGain(),at=start+event.at;
    osc.type='sine';osc.frequency.value=event.frequency;
    gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(event.click ? .18 : .075,at+.012);gain.gain.exponentialRampToValueAtTime(.0001,at+event.duration);
    osc.connect(gain);gain.connect(ctx.destination);osc.start(at);osc.stop(at+event.duration+.025);
    if(index===events.length-1)osc.onended=()=>{if(token!==this.generation)return;this.pending=null;resolve(true);this.stop();};
   });}catch(error){this.pending=null;this.stop();reject(error);}
  });
 }
}
