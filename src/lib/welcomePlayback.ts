export type WelcomePlaybackState='waiting'|'playing'|'paused'|'finished'|'blocked'|'failed';
export type WelcomeVideoPort={muted:boolean;play:()=>Promise<void>|void;pause:()=>void};
/** In-memory page lifetime only. A full reload creates a fresh visit. */
export class WelcomePageVisit{
 private presented=false;
 get hasPresented(){return this.presented;}
 record(state:WelcomePlaybackState){
  if(['playing','finished','blocked','failed'].includes(state))this.presented=true;
 }
}
export const welcomePageVisit=new WelcomePageVisit();
/** A one-shot illustration: never loops or restarts after completion on visibility changes. */
export class WelcomePlayback{
 private video:WelcomeVideoPort;
 private notify:(state:WelcomePlaybackState)=>void;
 private generation=0;
 private disposed=false;
 private completed=false;
 private reduced=true;
 private visible=false;
 private starting=false;
 private playing=false;
 private started=false;
 private blocked=false;
 /** When true, playback waits for loaded(): the whole short clip is buffered, so it never stalls mid-motion. */
 private waitingForData:boolean;
 constructor(video:WelcomeVideoPort,notify:(state:WelcomePlaybackState)=>void,options:{waitForData?:boolean}={}){this.video=video;this.notify=notify;this.waitingForData=options.waitForData??false;}
 private emit(state:WelcomePlaybackState){if(!this.disposed)this.notify(state);}
 private stop(){this.generation++;this.starting=false;this.playing=false;this.video.pause();}
 private wantsPlayback(){return !this.disposed&&!this.completed&&!this.blocked&&!this.reduced&&this.visible&&!this.waitingForData;}
 private start(){
  if(!this.wantsPlayback()||this.starting||this.playing)return;
  const token=++this.generation;this.starting=true;this.video.muted=true;
  try{Promise.resolve(this.video.play()).then(()=>{
   if(token!==this.generation){if(!this.wantsPlayback())this.video.pause();return;}
   this.starting=false;this.playing=true;this.started=true;this.emit('playing');
  }).catch(()=>{if(token===this.generation&&!this.disposed){this.starting=false;this.playing=false;this.blocked=true;this.emit('blocked');}});}
  catch{this.starting=false;this.playing=false;this.blocked=true;this.emit('blocked');}
 }
 setEnvironment({reducedMotion,visible}:{reducedMotion:boolean;visible:boolean}){
  this.reduced=reducedMotion;this.visible=visible;
  if(this.disposed)return;
  if(this.completed)return;
  if(reducedMotion){this.completed=true;this.stop();this.emit('finished');return;}
  if(this.blocked){this.stop();this.emit('blocked');return;}
  if(!visible){this.stop();this.emit(this.started?'paused':'waiting');return;}
  this.start();
 }
 /** Enough data to play to the end without buffering. */
 loaded(){if(this.disposed||!this.waitingForData)return;this.waitingForData=false;if(!this.completed&&!this.reduced&&this.visible&&!this.blocked)this.start();}
 /** Data did not arrive in time: settle on the final pose instead of a stuttering start. */
 skip(){if(this.disposed||this.completed||this.started||!this.visible)return;this.completed=true;this.stop();this.emit('finished');}
 ended(){if(this.disposed)return;this.completed=true;this.stop();this.emit('finished');}
 failed(){if(this.disposed)return;this.completed=true;this.stop();this.emit('failed');}
 destroy(){if(this.disposed)return;this.disposed=true;this.stop();}
}
