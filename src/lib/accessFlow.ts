import {availableInstrument} from './instruments.ts';
export type AccessView='welcome'|'workshops'|'hello'|'journey'|'login'|'signup';
export type AccessFlow={view:AccessView;workshopId:string|null};
export type AccessAction={type:'start'|'login'|'signup'|'continue'|'back'|'edit-workshop'}|{type:'choose';id:string};
export const initialAccessFlow:AccessFlow={view:'welcome',workshopId:null};
/** Workshop choice, Tom says hello, onboarding journey (warm-up), then the home screen as a visitor; signup comes from the home card. */
export function accessFlow(state:AccessFlow,action:AccessAction):AccessFlow{
 switch(action.type){
  case 'start':return {...state,view:'workshops'};
  case 'login':return {view:'login',workshopId:state.view==='welcome'?null:state.workshopId};
  case 'choose':return state.view==='workshops'&&availableInstrument(action.id)?{...state,workshopId:action.id}:state;
  case 'continue':
   if(state.view==='workshops')return availableInstrument(state.workshopId)?{...state,view:'hello'}:state;
   return state.view==='hello'&&availableInstrument(state.workshopId)?{...state,view:'journey'}:state;
  case 'signup':return availableInstrument(state.workshopId)?{...state,view:'signup'}:state;
  case 'edit-workshop':return {...state,view:'workshops'};
  case 'back':return {...state,view:state.view==='journey'?'hello':state.view==='signup'||state.view==='hello'?'workshops':'welcome'};
 }
}
/** Leaving onboarding for the welcome screen abandons its course handoff. */
export function accessWorkshopIntent(state:AccessFlow):string|undefined{
 return (state.view==='signup'||state.view==='login')?availableInstrument(state.workshopId)?.id:undefined;
}
/** Only an explicit, available workshop skips the existing post-login picker. */
export function courseEntrySelection(preferred:unknown,saved:unknown):{selected:string|null;choosing:boolean}{
 const requested=availableInstrument(preferred);
 return {selected:requested?.id??availableInstrument(saved)?.id??null,choosing:!requested};
}
