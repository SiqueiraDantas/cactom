import {barBeats,pulseBeats,type CourseMeter,type CourseNote} from './recorderFullCourse.ts';

/**
 * Sons-modelo da trilha da flauta doce.
 * 1. Gravações reais (quando existirem): `public/sons/flauta-doce/manifesto.json` lista
 *    `{ "71": "si.mp3", ... }` (MIDI escrito → arquivo na mesma pasta). A nota mais próxima
 *    gravada é usada e afinada pela velocidade de reprodução.
 * 2. Sem gravações: timbre de flauta doce sintetizado (fundamental forte, harmônicos fracos,
 *    sopro no começo e um leve ruído de ar), no lugar do antigo bipe senoidal.
 * `attack`: 'leve' (som-alvo) ou 'explosivo' (golpe de ar, para comparar com o modelo).
 */
export type RecorderAttack='leve'|'explosivo';
type PlayOptions={gate?:number;duo?:boolean;duoMidi?:number;sustained?:boolean;cents?:number;attack?:RecorderAttack;countIn?:boolean;
 /** Instrumento do modelo: flauta (soa 8ª acima do escrito), trompete e clarinete em Si♭ (soam 1 tom abaixo). */
 voice?:'flauta'|'trompete'|'trompete-do'|'clarinete'|'teclado'};
const VOICES={
 flauta:{transpose:12,imag:[0,1,.2,.1,.045,.02,.01],breath:.025},
 trompete:{transpose:-2,imag:[0,1,.75,.6,.45,.32,.22,.14,.09,.06],breath:.012},
 'trompete-do':{transpose:0,imag:[0,1,.75,.6,.45,.32,.22,.14,.09,.06],breath:.012},
 clarinete:{transpose:-2,imag:[0,1,.04,.55,.03,.3,.02,.16,.01,.08],breath:.018},
 /** curso de iniciação: som neutro de teclado, sem transposição */
 teclado:{transpose:0,imag:[0,1,.45,.18,.12,.05,.03],breath:0},
} as const;

const SAMPLE_DIR='/sons/flauta-doce/';
let manifest:Promise<Record<number,string>|null>|null=null;
function loadManifest(){
 manifest??=fetch(SAMPLE_DIR+'manifesto.json',{cache:'no-store'}).then(async r=>{
  if(!r.ok||(r.headers.get('content-type')??'').includes('html'))return null;
  const data=await r.json() as Record<string,string>;
  const out:Record<number,string>={};for(const [k,v] of Object.entries(data))if(Number.isFinite(Number(k))&&typeof v==='string')out[Number(k)]=v;
  return Object.keys(out).length?out:null;
 }).catch(()=>null);
 return manifest;
}
async function loadSamples(context:AudioContext){
 const map=await loadManifest();if(!map)return null;
 const buffers=new Map<number,AudioBuffer>();
 await Promise.all(Object.entries(map).map(async([midi,file])=>{
  try{const r=await fetch(SAMPLE_DIR+file);if(!r.ok)return;buffers.set(Number(midi),await context.decodeAudioData(await r.arrayBuffer()));}catch{/* arquivo ruim: usa o sintetizado */}
 }));
 return buffers.size?buffers:null;
}

export class RecorderCourseAudio{
 private context:AudioContext|null=null;private timer:ReturnType<typeof setTimeout>|null=null;private pending:((value:boolean)=>void)|null=null;private generation=0;
 stop(){this.generation++;if(this.timer!==null)clearTimeout(this.timer);this.timer=null;const resolve=this.pending;this.pending=null;resolve?.(false);const context=this.context;this.context=null;if(context&&context.state!=='closed')void context.close().catch(()=>{});}
 async play(notes:readonly CourseNote[],meter:CourseMeter,bpm:number,options:PlayOptions={}):Promise<boolean>{
  this.stop();const token=this.generation,context=new AudioContext();this.context=context;
  try{await context.resume();}catch(error){if(token!==this.generation)return false;this.stop();throw error;}
  const voice=VOICES[options.voice??'flauta'];
  const samples=(options.voice??'flauta')==='flauta'?await loadSamples(context):null;
  if(token!==this.generation){if(context.state!=='closed')void context.close().catch(()=>{});return false;}
  const quarter=60/(bpm*pulseBeats(meter)),count=options.countIn===false?0:barBeats(meter),start=context.currentTime+.08;
  const click=(frequency:number,at:number,peak=.11)=>{const osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=frequency;gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(peak,at+.005);gain.gain.exponentialRampToValueAtTime(.0001,at+.055);osc.connect(gain).connect(context.destination);osc.start(at);osc.stop(at+.07);};
  const wave=context.createPeriodicWave(new Float32Array(voice.imag.length),new Float32Array(voice.imag));
  const noise=(()=>{const length=context.sampleRate,buffer=context.createBuffer(1,length,context.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<length;i++)data[i]=Math.random()*2-1;return buffer;})();
  const breath=(frequency:number,at:number,duration:number,level:number)=>{if(!(level>0))return;
   const src=context.createBufferSource(),band=context.createBiquadFilter(),gain=context.createGain();
   src.buffer=noise;src.loop=true;band.type='bandpass';band.frequency.value=frequency*2;band.Q.value=1.4;
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(level,at+.01);gain.gain.exponentialRampToValueAtTime(Math.max(.0001,level*.12),at+Math.min(duration,.09));gain.gain.setValueAtTime(Math.max(.0001,level*.12),at+Math.max(.1,duration-.04));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   src.connect(band).connect(gain).connect(context.destination);src.start(at);src.stop(at+duration+.02);
  };
  const flute=(midi:number,at:number,duration:number,volume:number,attack:RecorderAttack)=>{
   const frequency=440*2**((midi+voice.transpose-69)/12+(options.cents??0)/1200),hard=attack==='explosivo';
   const gain=context.createGain(),rise=hard?.006:.035,peak=hard?volume*1.7:volume;
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(peak,at+rise);
   if(hard)gain.gain.exponentialRampToValueAtTime(volume,at+.09);
   gain.gain.setValueAtTime(volume,at+Math.max(.1,duration-.04));gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   gain.connect(context.destination);
   const nearest=samples?[...samples.keys()].sort((a,b)=>Math.abs(a-midi)-Math.abs(b-midi))[0]:undefined;
   if(samples&&nearest!==undefined){
    const src=context.createBufferSource();src.buffer=samples.get(nearest)!;src.playbackRate.value=2**((midi-nearest)/12+(options.cents??0)/1200);
    src.connect(gain);src.start(at);src.stop(at+duration+.02);
   }else{
    const osc=context.createOscillator();osc.setPeriodicWave(wave);osc.frequency.setValueAtTime(hard?frequency*1.025:frequency,at);
    if(hard)osc.frequency.exponentialRampToValueAtTime(frequency,at+.07);
    osc.connect(gain);osc.start(at);osc.stop(at+duration+.02);
   }
   breath(frequency,at,duration,hard?.09:voice.breath);
  };
  try{
   for(let beat=0;beat<count;beat+=pulseBeats(meter))click(beat===0?2600:2100,start+beat*quarter);
   let offset=count;const attack=options.attack??'leve';
   for(let i=0;i<notes.length;i++){
    const n=notes[i];if(n.midi!==null){let length=n.beats;while(notes[i]?.tie&&notes[i+1]?.midi===n.midi){i++;length+=notes[i].beats;}flute(n.midi,start+offset*quarter,length*quarter*(options.gate??.92),.11*Math.min(2.2,Math.max(.15,n.vol??1)),attack);offset+=length;}else offset+=n.beats;
   }
   // a marcação do tempo continua baixinha durante o exemplo (só quando houve contagem)
   if(count>0)for(let beat=count;beat<offset;beat+=pulseBeats(meter))click((beat-count)%barBeats(meter)===0?2400:2000,start+beat*quarter,.05);
   if(options.duo){const duoMidi=options.duoMidi??67;if(options.sustained)flute(duoMidi,start+count*quarter,(offset-count)*quarter*.96,.06,'leve');else for(let beat=0;beat<offset-count;beat+=2)flute(duoMidi,start+(count+beat)*quarter,Math.min(1.7,offset-count-beat)*quarter,.06,'leve');}
   return await new Promise<boolean>(resolve=>{this.pending=resolve;this.timer=setTimeout(()=>{if(token!==this.generation)return;this.pending=null;this.timer=null;resolve(true);this.stop();},Math.ceil((offset*quarter+.15)*1000));});
  }catch(error){this.stop();throw error;}
 }
}
