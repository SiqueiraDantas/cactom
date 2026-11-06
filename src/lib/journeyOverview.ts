import type {createJourneyEngine,JourneyStop,JourneyLedger,LegacyResponse} from './recorderJourney.ts';

/**
 * Resumo da trilha (aba Aprender) para as outras abas: Rojão, Praticar, Conquistas e Progresso leem
 * daqui, então uma lição feita na trilha aparece em todo lugar.
 */
export type JourneyOpenTarget={stopId:string;lessonId?:string;review?:boolean};
export type JourneyOverview={
 xp:number;lessonsDone:number;lessonsTotal:number;stopsDone:number;stopsTotal:number;unitsDone:number;unitsTotal:number;
 percent:number;reviews:JourneyStop[];reviewsDone:number;current:JourneyStop;currentDone:number;open:JourneyOpenTarget;
 units:{number:number;title:string;goal:string;stops:{stop:JourneyStop;status:import('./recorderJourney.ts').StopStatus;done:number;total:number}[]}[];
};
type Engine=ReturnType<typeof createJourneyEngine>;
type UnitList=readonly {number:number;title:string;goal:string;stops:readonly JourneyStop[]}[];
/** Resumo de qualquer trilha (flauta, trompete, clarinete) a partir do registro e das regras dela. */
export function overviewOf(ledger:JourneyLedger,engine:Engine,unitList:UnitList,legacy:Record<string,LegacyResponse|undefined>={}):JourneyOverview{
 const {stopState,currentStop,dueReviews}=engine,ALL=engine.stops;
 const states=new Map(ALL.map(s=>[s.id,stopState(s,ledger,legacy)]));
 const finished=(id:string)=>{const st=states.get(id)!.status;return st==='concluida'||st==='revisao';};
 const stopsDone=ALL.filter(s=>finished(s.id)).length;
 const lessonsTotal=ALL.reduce((n,s)=>n+s.lessonIds.length,0),lessonsDone=ALL.reduce((n,s)=>n+states.get(s.id)!.done,0);
 const units=unitList.map(u=>({number:u.number,title:u.title,goal:u.goal,stops:u.stops.map(stop=>{const st=states.get(stop.id)!;return {stop,status:st.status,done:st.done,total:st.total};})}));
 const current=currentStop(ledger,legacy),cur=states.get(current.id)!;
 const reviewsDone=Object.values(ledger.lessons).filter(l=>l.review).length;
 const xp=ledger.xp||Object.values(ledger.lessons).reduce((n,l)=>n+l.xp,0);
 return {xp,lessonsDone,lessonsTotal,stopsDone,stopsTotal:ALL.length,unitsDone:units.filter(u=>u.stops.every(s=>finished(s.stop.id))).length,unitsTotal:units.length,
  percent:lessonsDone?Math.max(1,Math.round(lessonsDone/lessonsTotal*100)):0,reviews:dueReviews(ledger,legacy),reviewsDone,current,currentDone:cur.done,
  open:{stopId:current.id,lessonId:cur.nextLesson??current.lessonIds[0],review:cur.status==='revisao'},units};
}
