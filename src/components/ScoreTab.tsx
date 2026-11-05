import {useEffect, useState} from 'react';
import type {InstrumentProfile} from '../lib/instruments';
import {scoresForInstrument, type LibraryScore} from '../lib/scoreLibrary';
import {importedScores, scoreReports, type ScoreReport} from '../lib/scoreStorage';
import type {ScoreStart} from './ScoreLab';
import {ScoreLibraryHub} from './ScoreLibraryHub';
import {useProfileStorage} from './ProfileStorage';

/** Aba Partituras da página inicial: biblioteca + enviar PDF. Tocar abre a tela da partitura. */
export function ScoreTab({instrument,onOpen}:{instrument:InstrumentProfile;onOpen:(start:ScoreStart)=>void}){
 const {profileId}=useProfileStorage();
 const [library,setLibrary]=useState<LibraryScore[]>([...scoresForInstrument(instrument.id)]),[reports,setReports]=useState<ScoreReport[]>([]),[storageError,setStorageError]=useState('');
 useEffect(()=>{let alive=true;
  void importedScores(profileId).then(items=>{if(alive)setLibrary([...scoresForInstrument(instrument.id),...items.filter(i=>typeof i.xml==='string'&&typeof i.title==='string'&&(i.instrumentId??'trumpet-bb')===instrument.id)]);}).catch(()=>{if(alive)setStorageError('As partituras que tu trouxer vão ficar só nesta sessão, porque este navegador não deixou salvar.');});
  void scoreReports(profileId).then(items=>{if(alive)setReports(items);}).catch(()=>{});
  return ()=>{alive=false;};
 },[profileId,instrument.id]);
 return <ScoreLibraryHub embedded instrument={instrument} library={library} reports={reports} importing={false} error="" storageError={storageError} onExit={()=>{}} onChoose={item=>onOpen({scoreId:item.id})} onImport={file=>{if(file)onOpen({file});}}/>;
}
