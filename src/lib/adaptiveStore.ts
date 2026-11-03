import { useCallback, useEffect, useRef, useState } from 'react';
import { appendAttempt, validAttempt, HISTORY_LIMIT, type PracticeAttempt } from './adaptive';
import { useProfileStorage } from '../components/ProfileStorage';
import type { ProfileStorage } from './profileStorage';
import { markPracticeDay } from './practiceDay';
const KEY='mis-music-lab-v07';
function initial(key:string,storage:ProfileStorage):PracticeAttempt[]{
  try{const value:unknown=JSON.parse(storage.getItem(key)??'[]');return Array.isArray(value)?value.filter(validAttempt).slice(-HISTORY_LIMIT):[];}catch{return [];}
}
export function usePracticeHistory(instrumentId='trumpet-bb'){
  const storage=useProfileStorage();
  const key=instrumentId==='recorder-soprano'?'mis-music-lab-v07-recorder':KEY;
  const [history,setHistory]=useState(()=>initial(key,storage));const ref=useRef(history);ref.current=history;
  useEffect(()=>{try{storage.setItem(key,JSON.stringify(history));}catch{/* The session remains usable if storage is unavailable. */}},[history,key,storage]);
  const record=useCallback((attempt:Omit<PracticeAttempt,'id'|'at'|'instrumentId'>)=>{
    const value:PracticeAttempt={...attempt,id:crypto.randomUUID(),at:new Date().toISOString(),instrumentId};
    if(validAttempt(value)&&value.passed&&value.task!=='rest')markPracticeDay(storage,Date.parse(value.at));
    const next=appendAttempt(ref.current,value);ref.current=next;setHistory(next);
  },[instrumentId,storage]);
  return {history,record};
}
