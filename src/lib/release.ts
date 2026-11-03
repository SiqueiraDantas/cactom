/** Exige uma pausa acústica após um check para iniciar uma nova emissão. */
export type ReleaseState = { awaiting: boolean; silenceStarted: number|null };
export const waitingForRelease = (): ReleaseState => ({ awaiting:true, silenceStarted:null });
export function advanceRelease(state:ReleaseState, now:number, silent:boolean, silenceMs=260):ReleaseState {
  if(!state.awaiting)return state;
  if(!Number.isFinite(now))return state;
  if(!silent)return waitingForRelease();
  const silenceStarted=state.silenceStarted??now;
  if(now-silenceStarted>=silenceMs)return {awaiting:false,silenceStarted:null};
  return {awaiting:true,silenceStarted};
}
