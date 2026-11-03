import {useId,useRef} from 'react';
import type {InstrumentProfile} from '../lib/instruments';
import type {LibraryScore} from '../lib/scoreLibrary';
import type {ScoreReport} from '../lib/scoreStorage';
import {CactomWordmark} from './CactomBrand';
import {SheetArtwork} from './PracticeHub';
import {HubAction,HubHeading,HubIcon,HubTomScene} from './CactomHub';

type Props={instrument:InstrumentProfile;library:readonly LibraryScore[];reports:readonly ScoreReport[];importing:boolean;error:string;storageError:string;onExit:()=>void;onChoose:(score:LibraryScore)=>void;onImport:(file:File|undefined)=>Promise<void>};
export function ScoreLibraryHub({instrument,library,reports,importing,error,storageError,onExit,onChoose,onImport}:Props){
 const id=useId(),input=useRef<HTMLInputElement>(null),first=library[0],recorder=instrument.id==='recorder-soprano';
 const pickFile=()=>input.current?.click();
 return <main className="score-library-page cactom-score-library cactom-dashboard library-hub">
  <header className="library-hub-topbar"><button type="button" className="brand-home" onClick={onExit} aria-label="Cactom: voltar ao início" title="Voltar ao início"><CactomWordmark/></button><button className="back-to-trail" type="button" onClick={onExit}><span aria-hidden="true">←</span> Voltar à trilha</button></header>
  <div className="library-hub-content practice-hub course-hub">
   <HubHeading icon="book" eyebrow="UMA MELODIA POR VEZ" title="Suas" accent="partituras." intro="Do papel para o som, no seu ritmo."/>
   <section className="practice-feature" aria-labelledby={id+'-feature'}><div className="practice-feature-copy"><span className="practice-kicker"><i/>{first?'UM ESTUDO PARA COMEÇAR':'SUA BIBLIOTECA MUSICAL'}</span><p className="hub-library-course">{instrument.name}</p><h2 id={id+'-feature'}>{first?.title??'Tem música neste papel.'}</h2><p className="practice-lesson-description">{first?.description??'Traga uma partitura e descubra uma nova melodia.'}</p></div><HubTomScene message="Uma nota por vez!"/><HubAction onClick={()=>first?onChoose(first):pickFile()}>{first?'Abrir este estudo':'Importar partitura'}</HubAction></section>
   {error&&<p className="activity-error hub-library-alert" role="alert">{error}</p>}{storageError&&<p className="score-notice hub-library-notice" role="status">{storageError}</p>}
   <section className="hub-library-collection" aria-labelledby={id+'-collection'}><div className="hub-section-heading"><h2 id={id+'-collection'}>Sua biblioteca</h2><span>{library.length} {library.length===1?'partitura':'partituras'}</span></div><div className="score-library-grid">{library.map((item,index)=>{
    const latest=reports.find(report=>report.scoreId===item.id);
    return <button type="button" className="score-library-card" key={item.id} data-score-status={latest?.passed?'passed':latest?'practicing':'new'} data-tone={index%3} onClick={()=>onChoose(item)}><span className="hub-score-art"><SheetArtwork/>{latest?.passed&&<i><HubIcon name="check"/></i>}</span><span className="hub-score-copy"><small>{item.imported?'DA SUA BIBLIOTECA':'ESTUDO DO CACTOM'}</small><span className="hub-score-title">{item.title}</span><span className="hub-score-description">{item.description}</span><span className="hub-score-action">{latest?.passed?'Última tentativa concluída':latest?'Continuar praticando':'Abrir partitura'}<HubIcon name="arrow"/></span></span></button>;
   })}</div></section>
   <section className="hub-score-import" aria-labelledby={id+'-import'}><span className="hub-import-icon"><HubIcon name="upload"/></span><div><span className="hub-import-kicker">SUA MÚSICA TAMBÉM TEM LUGAR AQUI</span><h2 id={id+'-import'}>Traga sua partitura</h2><p>Escolha um arquivo .musicxml ou .xml para tocar.</p><button className="hub-import-button" type="button" disabled={importing} onClick={pickFile}><HubIcon name="upload"/>{importing?'Lendo arquivo…':'Escolher MusicXML'}</button><input ref={input} hidden aria-label={recorder?'Importar MusicXML para flauta doce':'Importar MusicXML para trompete'} type="file" accept=".xml,.musicxml" disabled={importing} onChange={event=>{void onImport(event.target.files?.[0]);event.target.value='';}}/><details className="hub-import-formats"><summary>Quais arquivos posso usar?<HubIcon name="chevron"/></summary><p>{recorder?'Flauta doce soprano: notas escritas de Dó4 a Ré5, clave de Sol com 8 acima.':'Trompete em Si♭: notas escritas de Dó4 a Dó6.'} Uma voz, em 2/4, 3/4 ou 4/4. Arquivos descompactados de até 512 KB; .mxl não é aceito.</p></details></div></section>
   <details className="hub-disclosure hub-library-storage"><summary><span className="hub-related-icon"><HubIcon name="book"/></span><span>Sua biblioteca neste navegador</span><HubIcon name="chevron"/></summary><div><p>Os arquivos e resultados ficam neste navegador. Nenhum áudio é gravado ou enviado.</p></div></details>
  </div>
 </main>;
}
