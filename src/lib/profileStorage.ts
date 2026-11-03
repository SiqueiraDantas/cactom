export type KeyValueStorage=Pick<Storage,'getItem'|'setItem'|'removeItem'>;
export type ProfileStorage=KeyValueStorage&{profileId:string|null;isPersistent:()=>boolean};
export function profilePrefix(profileId:string|null):string{
  if(profileId===null)return '';
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(profileId))throw new Error('Perfil local inválido.');
  return 'mis-user:'+profileId+':';
}
const browserStorage:KeyValueStorage={
  getItem:key=>globalThis.localStorage?.getItem(key)??null,
  setItem:(key,value)=>{if(!globalThis.localStorage)throw new Error('Armazenamento indisponível');globalThis.localStorage.setItem(key,value);},
  removeItem:key=>globalThis.localStorage?.removeItem(key),
};
export function createProfileStorage(profileId:string|null,backing:KeyValueStorage=browserStorage):ProfileStorage{
  const prefix=profilePrefix(profileId);
  // Keep failed writes for this mounted profile only; successful reads stay live.
  // A null entry is a pending deletion, so stale backing data cannot reappear.
  const pending=new Map<string,string|null>();
  return {
    profileId,
    isPersistent:()=>pending.size===0,
    getItem:key=>pending.has(key)?pending.get(key)!:backing.getItem(prefix+key),
    setItem:(key,value)=>{
      try{backing.setItem(prefix+key,value);pending.delete(key);}
      catch(error){pending.set(key,value);throw error;}
    },
    removeItem:key=>{
      try{backing.removeItem(prefix+key);pending.delete(key);}
      catch(error){pending.set(key,null);throw error;}
    },
  };
}
export function profileDatabaseName(base:string,profileId:string|null):string{profilePrefix(profileId);return profileId?base+'-user-'+profileId:base;}
