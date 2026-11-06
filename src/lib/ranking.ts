import {listLocalProfiles,type LocalProfile} from './localAuth.ts';
import {createProfileStorage,type KeyValueStorage} from './profileStorage.ts';
import type {JourneyLedger} from './recorderJourney.ts';
import {readBandJourney,isBand} from './bandTrail.ts';
import {readStreak,streakSummary} from './streak.ts';

/**
 * Ranking por instrumento entre quem tem login. Hoje lê as contas deste navegador; com servidor,
 * troque a fonte (`RankingSource`) e a tela continua igual. Mostra só o primeiro nome.
 */
export type RankEntry={profileId:string;name:string;xp:number;lessons:number;answered:number;correct:number;accuracy:number|null;streak:number;lastAt:string|null};
export type RankMode='xp'|'acertos'|'rojao';
export type RankingSource=(instrumentId:string)=>RankEntry[];
export const MIN_ANSWERS_FOR_ACCURACY=10;
export const firstName=(name:string)=>name.trim().split(/\s+/)[0]?.slice(0,18)||'Aluno';
function summarize(ledger:JourneyLedger){
 const records=Object.entries(ledger.lessons);
 const lessons=records.filter(([id,r])=>!id.startsWith('review:')&&!r.review).length;
 const answered=records.reduce((n,[,r])=>n+(r.total||0),0),correct=records.reduce((n,[,r])=>n+(r.correctFirst||0),0);
 const lastAt=records.map(([,r])=>r.at).sort().pop()??null;
 return {xp:ledger.xp||records.reduce((n,[,r])=>n+r.xp,0),lessons,answered,correct,lastAt};
}
export function entryFor(profile:Pick<LocalProfile,'id'|'name'>,instrumentId:string,backing?:KeyValueStorage):RankEntry|null{
 let store;try{store=createProfileStorage(profile.id,backing);}catch{return null;}
 const ledger=isBand(instrumentId)?readBandJourney(store,instrumentId).ledger:null;
 if(!ledger)return null;
 const s=summarize(ledger);let chosen=false;try{chosen=store.getItem('mis-music-lab-instrument')===instrumentId;}catch{/* nada */}
 if(!s.lessons&&!chosen)return null;
 let streak=0;try{streak=streakSummary(readStreak(store)).currentStreak;}catch{/* nada */}
 return {profileId:profile.id,name:firstName(profile.name),...s,accuracy:s.answered?Math.round(s.correct/s.answered*100):null,streak};
}
export const localRanking:RankingSource=instrumentId=>listLocalProfiles().map(p=>entryFor(p,instrumentId)).filter((e):e is RankEntry=>!!e);
export function sortRanking(list:readonly RankEntry[],mode:RankMode):RankEntry[]{
 const key=(e:RankEntry)=>mode==='xp'?e.xp:mode==='rojao'?e.streak:(e.answered>=MIN_ANSWERS_FOR_ACCURACY?e.accuracy??-1:-1);
 return [...list].sort((a,b)=>key(b)-key(a)||b.xp-a.xp||b.lessons-a.lessons||a.name.localeCompare(b.name,'pt-BR'));
}
