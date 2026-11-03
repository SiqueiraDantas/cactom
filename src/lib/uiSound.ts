/**
 * Efeitos sonoros da interface, sintetizados com Web Audio (nenhum arquivo de áudio).
 * Só tocam depois de um toque da pessoa (o navegador exige) e podem ser desligados;
 * a preferência fica em `cactom-sons` neste aparelho.
 */
export type UiSound='tap'|'pop'|'certo'|'errado'|'fanfarra'|'pulo'|'chegou'|'fogo';
export const SOUND_KEY='cactom-sons';

export function soundsOn():boolean{try{return globalThis.localStorage?.getItem(SOUND_KEY)!=='off';}catch{return true;}}
export function setSoundsOn(on:boolean){try{globalThis.localStorage?.setItem(SOUND_KEY,on?'on':'off');}catch{/* sem armazenamento: vale só nesta visita */}}

let context:AudioContext|null=null;
function audio():AudioContext|null{
 if(typeof window==='undefined')return null;
 const Ctor=window.AudioContext??(window as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
 if(!Ctor)return null;
 try{context??=new Ctor();if(context.state==='suspended')void context.resume();return context;}catch{return null;}
}
type Tone={freq:number;at?:number;dur?:number;type?:OscillatorType;gain?:number;to?:number};
function tone(c:AudioContext,{freq,at=0,dur=.12,type='sine',gain=.16,to}:Tone){
 const start=c.currentTime+at,osc=c.createOscillator(),amp=c.createGain();
 osc.type=type;osc.frequency.setValueAtTime(freq,start);
 if(to)osc.frequency.exponentialRampToValueAtTime(to,start+dur);
 amp.gain.setValueAtTime(.0001,start);
 amp.gain.exponentialRampToValueAtTime(gain,start+.012);
 amp.gain.exponentialRampToValueAtTime(.0001,start+dur);
 osc.connect(amp).connect(c.destination);osc.start(start);osc.stop(start+dur+.02);
}
function whoosh(c:AudioContext,at=0,dur=.4){
 const start=c.currentTime+at,length=Math.floor(c.sampleRate*dur),buffer=c.createBuffer(1,length,c.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<length;i++)data[i]=(Math.random()*2-1)*(1-i/length);
 const source=c.createBufferSource(),filter=c.createBiquadFilter(),amp=c.createGain();
 source.buffer=buffer;filter.type='bandpass';filter.frequency.setValueAtTime(400,start);filter.frequency.exponentialRampToValueAtTime(2400,start+dur);
 amp.gain.setValueAtTime(.12,start);amp.gain.exponentialRampToValueAtTime(.0001,start+dur);
 source.connect(filter).connect(amp).connect(c.destination);source.start(start);
}

/** Toca um efeito curto. Falhas de áudio são ignoradas: o app nunca depende do som. */
export function playSound(name:UiSound){
 if(!soundsOn())return;
 const c=audio();if(!c)return;
 try{
  switch(name){
   case 'tap':tone(c,{freq:700,dur:.06,type:'triangle',gain:.07});break;
   case 'pop':tone(c,{freq:480,to:900,dur:.1,gain:.13});break;
   case 'certo':tone(c,{freq:880,dur:.12,type:'triangle',gain:.15});tone(c,{freq:1318,at:.09,dur:.26,type:'triangle',gain:.15});tone(c,{freq:1318,at:.09,dur:.26,gain:.06});break;
   case 'errado':tone(c,{freq:330,dur:.14,type:'square',gain:.06});tone(c,{freq:220,at:.12,dur:.24,type:'square',gain:.06});break;
   case 'fanfarra':[523,659,784,1047].forEach((f,i)=>tone(c,{freq:f,at:i*.11,dur:i===3?.5:.16,type:'triangle',gain:.14}));tone(c,{freq:1568,at:.45,dur:.4,gain:.05});break;
   case 'pulo':tone(c,{freq:280,to:760,dur:.13,gain:.1});break;
   case 'chegou':tone(c,{freq:1047,dur:.1,type:'triangle',gain:.1});tone(c,{freq:1568,at:.08,dur:.22,type:'triangle',gain:.1});break;
   case 'fogo':whoosh(c,0,.45);tone(c,{freq:392,to:784,at:.12,dur:.3,type:'triangle',gain:.1});break;
  }
 }catch{/* sem som */}
}
