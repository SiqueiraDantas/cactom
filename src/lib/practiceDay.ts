import { recordPracticeDay } from './streak.ts';
import type { ProfileStorage } from './profileStorage.ts';
/** Called only after a verified course step or virtual gesture. */
export function markPracticeDay(storage:ProfileStorage,now=Date.now()){
  const recorded=recordPracticeDay(storage,now);
  const result={...recorded,persisted:recorded.persisted&&storage.isPersistent()};
  if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('mis-practice-day',{detail:{profileId:storage.profileId,ledger:result.ledger,persisted:result.persisted}}));
  return result;
}
