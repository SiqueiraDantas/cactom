import {readJourney,JOURNEY_STOPS,JOURNEY_UNITS,currentStop,stopState,dueReviews,type JourneyStop,type LegacyResponse} from './recorderJourney.ts';
import {readCourse} from './recorderFullCourse.ts';
import {readModuleOne} from './recorderModuleOne.ts';
import {readDiagnostic} from './recorderDiagnostic.ts';
import type {KeyValueStorage} from './profileStorage.ts';

/**
 * Resumo da trilha da flauta (aba Aprender) para as outras abas: Rojão, Praticar, Conquistas e
 * Progresso leem daqui, então uma lição feita na trilha aparece em todo lugar.
 */
export type JourneyOpenTarget={stopId:string;lessonId?:string;review?:boolean};
export type JourneyOverview={
 xp:number;lessonsDone:number;lessonsTotal:number;stopsDone:number;stopsTotal:number;unitsDone:number;unitsTotal:number;
 percent:number;reviews:JourneyStop[];reviewsDone:number;current:JourneyStop;currentDone:number;open:JourneyOpenTarget;
 units:{number:number;title:string;goal:string;stops:{stop:JourneyStop;status:ReturnType<typeof stopState>['status'];done:number;total:number}[]}[];
};
export function journeyOverview(storage:Pick<KeyValueStorage,'getItem'>):JourneyOverview{
 const {ledger}=readJourney(storage);
 const legacy:Record<string,LegacyResponse|undefined>={...readDiagnostic(storage as KeyValueStorage).ledger.responses,...readModuleOne(storage as KeyValueStorage).ledger.responses,...readCourse(storage as KeyValueStorage).ledger.responses};
 const states=new Map(JOURNEY_STOPS.map(s=>[s.id,stopState(s,ledger,legacy)]));
 const finished=(id:string)=>{const st=states.get(id)!.status;return st==='concluida'||st==='revisao';};
 const stopsDone=JOURNEY_STOPS.filter(s=>finished(s.id)).length;
 const lessonsTotal=JOURNEY_STOPS.reduce((n,s)=>n+s.lessonIds.length,0),lessonsDone=JOURNEY_STOPS.reduce((n,s)=>n+states.get(s.id)!.done,0);
 const units=JOURNEY_UNITS.map(u=>({number:u.number,title:u.title,goal:u.goal,stops:u.stops.map(stop=>{const st=states.get(stop.id)!;return {stop,status:st.status,done:st.done,total:st.total};})}));
 const current=currentStop(ledger,legacy),cur=states.get(current.id)!;
 const reviewsDone=Object.values(ledger.lessons).filter(l=>l.review).length;
 const xp=ledger.xp||Object.values(ledger.lessons).reduce((n,l)=>n+l.xp,0);
 return {xp,lessonsDone,lessonsTotal,stopsDone,stopsTotal:JOURNEY_STOPS.length,unitsDone:units.filter(u=>u.stops.every(s=>finished(s.stop.id))).length,unitsTotal:units.length,
  percent:Math.round(lessonsDone/lessonsTotal*100),reviews:dueReviews(ledger,legacy),reviewsDone,current,currentDone:cur.done,
  open:{stopId:current.id,lessonId:cur.nextLesson??current.lessonIds[0],review:cur.status==='revisao'},units};
}
