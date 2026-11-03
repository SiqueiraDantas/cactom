/**
 * Sons curtos da trilha: cliques de pulso/contagem e o acorde de conclusão.
 * O acorde de conclusão só é chamado na tela de conclusão, nunca durante escuta ou execução.
 */
export class LessonSound{
 private context:AudioContext|null=null;private timer:ReturnType<typeof setTimeout>|null=null;private resolve:((v:boolean)=>void)|null=null;
 stop(){if(this.timer)clearTimeout(this.timer);this.timer=null;const r=this.resolve;this.resolve=null;r?.(false);const c=this.context;this.context=null;if(c&&c.state!=='closed')void c.close().catch(()=>{});}
 private async open(){this.stop();const C=globalThis.AudioContext??(globalThis as unknown as {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;if(!C)throw new Error('Áudio indisponível neste navegador.');const c=new C();this.context=c;await c.resume().catch(()=>{});return c;}
 private tone(c:AudioContext,f:number,at:number,d:number,v:number,type:OscillatorType='sine'){const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(v,at+.008);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g);g.connect(c.destination);o.start(at);o.stop(at+d+.02);}
 /** Toca `beats` cliques; o primeiro de cada grupo é acentuado. Resolve true ao terminar. */
 async clicks(beats:number,bpm:number,group=4):Promise<boolean>{
  const c=await this.open(),q=60/bpm,t0=c.currentTime+.06;
  for(let i=0;i<beats;i++)this.tone(c,i%group===0?2600:2000,t0+i*q,.05,i%group===0?.16:.1);
  return new Promise(res=>{this.resolve=res;this.timer=setTimeout(()=>{this.resolve=null;res(true);this.stop();},Math.ceil((beats*q+.1)*1000));});
 }
 async celebrate(){try{const c=await this.open(),t=c.currentTime+.05;[523.25,659.25,783.99,1046.5].forEach((f,i)=>this.tone(c,f,t+i*.09,.32,.06,'triangle'));this.timer=setTimeout(()=>this.stop(),900);}catch{/* silencioso */}}
 async chime(ok:boolean){try{const c=await this.open(),t=c.currentTime+.03;if(ok){this.tone(c,880,t,.14,.05,'triangle');this.tone(c,1318.5,t+.08,.2,.05,'triangle');}else this.tone(c,330,t,.22,.05,'triangle');this.timer=setTimeout(()=>this.stop(),500);}catch{/* silencioso */}}
}
