import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { createProfileStorage } from '../lib/profileStorage';
const StorageContext=createContext(createProfileStorage(null));
export function ProfileStorageProvider({profileId,children}:{profileId:string|null;children:ReactNode}){
  const storage=useMemo(()=>createProfileStorage(profileId),[profileId]);
  return <StorageContext.Provider value={storage}>{children}</StorageContext.Provider>;
}
export function useProfileStorage(){return useContext(StorageContext);}
