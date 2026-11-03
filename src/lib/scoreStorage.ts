import type { LibraryScore } from './scoreLibrary';
import type { ScoreVerdict } from './scoreAssessment';
export type ScoreReport={id:string;scoreId:string;scoreTitle:string;at:string;bpm:number;passed:boolean;results:ScoreVerdict[]};
import { profileDatabaseName } from './profileStorage';
const DB='mis-music-lab-v08';
function openDb(profileId:string|null):Promise<IDBDatabase>{
  return new Promise((resolve,reject)=>{
    if(!globalThis.indexedDB){reject(new Error('O navegador não disponibilizou o armazenamento local.'));return;}
    const request=indexedDB.open(profileDatabaseName(DB,profileId),1);
    request.onupgradeneeded=()=>{const db=request.result;db.createObjectStore('scores',{keyPath:'id'});db.createObjectStore('reports',{keyPath:'id'});};
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('Não foi possível abrir o armazenamento de partituras.'));
  });
}
async function transact<T>(store:string,mode:IDBTransactionMode,operation:(s:IDBObjectStore)=>IDBRequest<T>,profileId:string|null):Promise<T>{
  const db=await openDb(profileId);
  return new Promise((resolve,reject)=>{
    const transaction=db.transaction(store,mode),request=operation(transaction.objectStore(store));
    let result:T;
    request.onsuccess=()=>{result=request.result;};
    transaction.oncomplete=()=>{db.close();resolve(result);};
    transaction.onerror=transaction.onabort=()=>{db.close();reject(new Error('Não foi possível salvar os dados neste navegador.'));};
  });
}
export async function importedScores(profileId:string|null=null):Promise<LibraryScore[]>{return transact('scores','readonly',s=>s.getAll(),profileId);}
export async function saveScore(score:LibraryScore,profileId:string|null=null):Promise<void>{await transact('scores','readwrite',s=>s.put(score),profileId);}
export async function scoreReports(profileId:string|null=null):Promise<ScoreReport[]>{const all=await transact<ScoreReport[]>('reports','readonly',s=>s.getAll(),profileId);return all.sort((a,b)=>b.at.localeCompare(a.at));}
export async function saveReport(report:ScoreReport,profileId:string|null=null):Promise<void>{
  await transact('reports','readwrite',s=>s.put(report),profileId);
  const all=await scoreReports(profileId);
  for(const old of all.slice(200))await transact('reports','readwrite',s=>s.delete(old.id),profileId);
}
