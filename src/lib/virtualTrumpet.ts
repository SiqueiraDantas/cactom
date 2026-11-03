import { BEGINNER_NOTES, type PracticeNote } from './music.ts';
import { trumpetNote } from './instruments.ts';

export type Landmark = { x: number; y: number; z?: number };
export type FingerAngles = [number, number, number];
export type ValveCalibration = { open: FingerAngles; closed: FingerAngles };
export type GestureState = { candidate: string | null; candidateSince: number; stable: string | null; stableSince: number };

export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],[0,17]
];

export function jointAngle(a: Landmark, b: Landmark, c: Landmark): number {
  const ux=a.x-b.x, uy=a.y-b.y, uz=(a.z??0)-(b.z??0);
  const vx=c.x-b.x, vy=c.y-b.y, vz=(c.z??0)-(b.z??0);
  const dot=ux*vx+uy*vy+uz*vz;
  const mag=Math.hypot(ux,uy,uz)*Math.hypot(vx,vy,vz);
  if(mag<1e-10)return 0;
  return Math.acos(Math.max(-1,Math.min(1,dot/mag)))*180/Math.PI;
}

/** PIP angle from index, middle, ring. Values decrease as each finger curls. */
export function readFingerAngles(points: readonly Landmark[]): FingerAngles | null {
  if(points.length<21)return null;
  const triplets=[[5,6,8],[9,10,12],[13,14,16]] as const;
  const angles=triplets.map(([a,b,c])=>jointAngle(points[a],points[b],points[c]));
  if(angles.some(v=>!Number.isFinite(v)||v<15))return null;
  return angles as FingerAngles;
}

export function validCalibration(cal: ValveCalibration): boolean {
  return cal.open.every((v,i)=>Number.isFinite(v)&&Number.isFinite(cal.closed[i])&&v<=180&&cal.closed[i]>=15&&v-cal.closed[i]>=22);
}

export function visibleHandAngles(points:readonly Landmark[]):FingerAngles|null{
  if(points.length!==21||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)||!Number.isFinite(p.z??0)||p.x<0||p.x>1||p.y<0||p.y>1))return null;
  return readFingerAngles(points);
}
export function smoothAngles(previous:FingerAngles|null,current:FingerAngles|null):FingerAngles|null{
  if(!current)return null;
  return previous?current.map((v,i)=>previous[i]+.4*(v-previous[i])) as FingerAngles:[...current];
}
export function anglesToValves(angles: FingerAngles, calibration: ValveCalibration | null, last: readonly number[]=[],sensitivity=0): number[] {
  return angles.flatMap((angle,index)=>{
    const threshold=calibration && validCalibration(calibration)
      ? (calibration.open[index]+calibration.closed[index])/2 : 145;
    // Hysteresis prevents noisy frame-to-frame toggling.
    const cut=threshold + Math.max(-15,Math.min(15,sensitivity)) + (last.includes(index+1)?8:-8);
    return angle<cut?[index+1]:[];
  });
}

export function valveKey(valves: readonly number[]): string {
  return [...new Set(valves)].sort((a,b)=>a-b).join('-');
}
export function sameValves(a: readonly number[],b:readonly number[]):boolean{return valveKey(a)===valveKey(b);}

export function advanceGesture(previous: GestureState, observed: readonly number[] | null, now: number, settleMs=180): GestureState {
  const key=observed===null?null:valveKey(observed);
  if(key!==previous.candidate){return { ...previous,candidate:key,candidateSince:now,stable:null };}
  if(now-previous.candidateSince>=settleMs && previous.stable!==key){return { ...previous,stable:key,stableSince:now };}
  return previous;
}
export function initialGesture():GestureState {return {candidate:null,candidateSince:0,stable:null,stableSince:0};}

export const VIRTUAL_SEQUENCE: readonly PracticeNote[]=[
  BEGINNER_NOTES[4],BEGINNER_NOTES[3],BEGINNER_NOTES[2],BEGINNER_NOTES[1],BEGINNER_NOTES[0],
  BEGINNER_NOTES[2],BEGINNER_NOTES[3],BEGINNER_NOTES[4]
];

export type VirtualStep = {id:string; note:PracticeNote; targetMs:number; tip:string};
const originalSteps: readonly VirtualStep[] = VIRTUAL_SEQUENCE.map((note,i)=>({
  id:`virtual-06-${i+1}`,note,targetMs:i<3?900:1250,
  tip:i===0?'Estenda os três dedos para deixar os pistos soltos.':
    note.valves.length?`Dobre ${note.valves.length===1?'o dedo do pisto':'os dedos dos pistos'} ${note.valveDescription}.`:
    'Mantenha os três dedos estendidos. A nota depende do registro escolhido.'
}));
// Original IDs remain first, so existing progress is never renumbered.
export const VIRTUAL_STEPS:readonly VirtualStep[]=[...originalSteps,...[
  {note:trumpetNote(66),tip:'Fá sustenido: use apenas o segundo pisto, com o dedo médio.'},
  {note:trumpetNote(63),tip:'Mi bemol: mantenha os pistos 2 e 3 juntos.'},
  {note:trumpetNote(61),tip:'Dó sustenido: combine os três pistos, sem apertar a mão.'},
  {note:BEGINNER_NOTES[1],tip:'Volte para Ré: troque para os pistos 1 e 3.'},
  {note:BEGINNER_NOTES[2],tip:'Agora Mi: solte o 3 e pressione o 2, mantendo o 1.'},
  {note:BEGINNER_NOTES[4],tip:'Finalize com Sol: os três pistos ficam soltos.'},
].map((item,i)=>({id:`virtual-06-extra-${i+1}`,...item,targetMs:1250}))];

export type VirtualProgress = {matchedSince:number|null;readyForDifferentPose:boolean;awaySince:number|null;completed:boolean;lastAt?:number};
export function freshVirtualProgress():VirtualProgress{return {matchedSince:null,readyForDifferentPose:true,awaySince:null,completed:false};}

/** A note is awarded only after a continuous period with a stable camera-detected fingering.
 * If the previous note uses identical fingering, require an observable reset gesture.
 */
export function advanceVirtualProgress(
  prev:VirtualProgress, observed: readonly number[] | null, target:readonly number[],
  now:number,requiredMs:number,requireReset=false
):VirtualProgress {
  if(prev.completed)return prev;
  if(!Number.isFinite(now)||!Number.isFinite(requiredMs)||requiredMs<=0)return {...freshVirtualProgress(),readyForDifferentPose:prev.readyForDifferentPose};
  if(prev.lastAt!==undefined&&(now<prev.lastAt||now-prev.lastAt>300))prev={...prev,matchedSince:null,awaySince:null};
  const match=observed!==null && sameValves(observed,target);
  let ready=prev.readyForDifferentPose;
  let away=prev.awaySince;
  if(requireReset&&!ready){
    if(observed!==null&&!match){away??=now;if(now-away>=320)ready=true;}
    else away=null;
  }
  if(!match||!ready)return {matchedSince:null,readyForDifferentPose:ready,awaySince:away,completed:false,lastAt:now};
  const start=prev.matchedSince??now;
  return {matchedSince:start,readyForDifferentPose:true,awaySince:null,completed:now-start>=requiredMs,lastAt:now};
}
