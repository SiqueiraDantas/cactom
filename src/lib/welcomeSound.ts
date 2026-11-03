import {CONCERT_BEATS} from './welcomeConcert.ts';
/** Som opcional da abertura, sintetizado no navegador e alinhado aos mesmos instantes da animação. */
export class WelcomeSound{
 private context:AudioContext|null=null;
 stop(){const c=this.context;this.context=null;if(c&&c.state!=='closed')void c.close().catch(()=>{});}
 async play(from=0){
  this.stop();const C=globalThis.AudioContext;if(!C)return;const c=new C();this.context=c;try{await c.resume();}catch{return;}
  const t0=c.currentTime+.05-from,out=c.createGain();out.gain.value=.8;out.connect(c.destination);
  const env=(at:number,attack:number,decay:number,peak:number)=>{const g=c.createGain();g.gain.setValueAtTime(.0001,Math.max(c.currentTime,at));g.gain.exponentialRampToValueAtTime(peak,Math.max(c.currentTime,at)+attack);g.gain.exponentialRampToValueAtTime(.0001,Math.max(c.currentTime,at)+attack+decay);g.connect(out);return g;};
  const drum=(at:number)=>{if(at<c.currentTime)return;const o=c.createOscillator();o.frequency.setValueAtTime(120,at);o.frequency.exponentialRampToValueAtTime(48,at+.25);o.connect(env(at,.005,.32,.5));o.start(at);o.stop(at+.4);};
  const flute=(at:number,f:number,len=.26)=>{if(at<c.currentTime)return;const o=c.createOscillator(),lfo=c.createOscillator(),depth=c.createGain();o.type='sine';o.frequency.value=f;lfo.frequency.value=5.5;depth.gain.value=f*.004;lfo.connect(depth);depth.connect(o.frequency);o.connect(env(at,.03,len,.16));o.start(at);lfo.start(at);o.stop(at+len+.1);lfo.stop(at+len+.1);};
  const strum=(at:number,chord:number[])=>{chord.forEach((f,i)=>{const s=at+i*.022;if(s<c.currentTime)return;const o=c.createOscillator();o.type='triangle';o.frequency.value=f;o.connect(env(s,.004,.7,.07));o.start(s);o.stop(s+.8);});};
  CONCERT_BEATS.drum.forEach(t=>drum(t0+t));
  [987.77,880,783.99].forEach((f,i)=>flute(t0+CONCERT_BEATS.flute[i],f));
  CONCERT_BEATS.strum.forEach(t=>strum(t0+t,[196,246.94,293.66,392]));
  drum(t0+CONCERT_BEATS.final);strum(t0+CONCERT_BEATS.final,[196,246.94,293.66,392,493.88]);flute(t0+CONCERT_BEATS.final,783.99,.7);
  setTimeout(()=>{if(this.context===c)this.stop();},Math.ceil((CONCERT_BEATS.final-from+1.5)*1000));
 }
}
