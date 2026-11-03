export type TomFocus='none'|'identity'|'password';
export type TomOutcome='idle'|'success'|'error';
export type TomMood='idle'|'listening'|'privacy'|'waiting'|'success'|'error';
export type TomGaze={x:number;y:number};
export type TomPresentation={mood:TomMood;covered:boolean;gaze:TomGaze};
/** Pupil travel in units of the 1254px original; kept inside the eye whites by a mask. */
export const TOM_GAZE_LIMIT={x:22,y:14} as const;
export function boundedTomGaze(point:{x:number;y:number},bounds:{left:number;top:number;width:number;height:number}):TomGaze{
  if(![point.x,point.y,bounds.left,bounds.top,bounds.width,bounds.height].every(Number.isFinite)||bounds.width<=0||bounds.height<=0)return {x:0,y:0};
  const clamp=(value:number)=>Math.max(-1,Math.min(1,value));
  return {x:clamp((point.x-bounds.left-bounds.width/2)/(bounds.width*.7))*TOM_GAZE_LIMIT.x,y:clamp((point.y-bounds.top-bounds.height/2)/(bounds.height*.7))*TOM_GAZE_LIMIT.y};
}
export function tomPresentation({focus,busy,outcome,showPassword=false,reducedMotion=false,gaze={x:0,y:0}}:{focus:TomFocus;busy:boolean;outcome:TomOutcome;showPassword?:boolean;reducedMotion?:boolean;gaze?:TomGaze}):TomPresentation{
  const mood:TomMood=outcome==='success'?'success':busy?'waiting':outcome==='error'?'error':focus==='password'?'privacy':focus==='identity'?'listening':'idle';
  const covered=outcome!=='success'&&(focus==='password'||showPassword);
  const limit=(value:number,max:number)=>Number.isFinite(value)?Math.max(-max,Math.min(max,value)):0;
  const safeGaze={x:limit(gaze.x,TOM_GAZE_LIMIT.x),y:limit(gaze.y,TOM_GAZE_LIMIT.y)};
  return {mood,covered,gaze:covered||reducedMotion?{x:0,y:0}:safeGaze};
}
export function tomCaption(presentation:Pick<TomPresentation,'mood'|'covered'>):string{
  if(presentation.covered)return presentation.mood==='waiting'?'Espero sem espiar!':'Não vou espiar!';
  return {idle:'Oi, eu sou o Tom!',listening:'Pode digitar!',privacy:'Não vou espiar!',waiting:'Um instante…',success:'Vamos nessa!',error:'Vamos tentar de novo?'}[presentation.mood];
}
/** Where Tom looks when no mouse is guiding him: down at the form while listening, up while thinking. */
export function tomRestingGaze(mood:TomMood):TomGaze{
  return {listening:{x:4,y:11},waiting:{x:-6,y:-11},error:{x:0,y:9},success:{x:0,y:-4},idle:{x:0,y:0},privacy:{x:0,y:0}}[mood];
}
/** Critically damped approach used by the pupils; frame-rate independent. */
export function tomGazeStep(current:TomGaze,target:TomGaze,elapsedMs:number,timeConstantMs=85):TomGaze{
  const dt=Number.isFinite(elapsedMs)?Math.max(0,Math.min(64,elapsedMs)):16;
  const k=1-Math.exp(-dt/timeConstantMs);
  return {x:current.x+(target.x-current.x)*k,y:current.y+(target.y-current.y)*k};
}
