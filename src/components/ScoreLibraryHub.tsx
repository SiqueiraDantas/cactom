import {useId,useRef} from 'react';
import type {InstrumentProfile} from '../lib/instruments';
import type {LibraryScore} from '../lib/scoreLibrary';
import type {ScoreReport} from '../lib/scoreStorage';
import {CactomWordmark} from './CactomBrand';
import {SheetArtwork} from './PracticeHub';
import type {ReactNode} from 'react';
import {HubAction,HubHeading,HubIcon,HubTomScene} from './CactomHub';

type Props={instrument:InstrumentProfile;library:readonly LibraryScore[];reports:readonly ScoreReport[];importing:boolean;error:string;storageError:string;onExit:()=>void;onChoose:(score:LibraryScore)=>void;onImport:(file:File|undefined)=>Promise<void>|void;
 /** Dentro da aba Partituras da página inicial: sem barra de topo própria. */
 embedded?:boolean;importStep?:string;extra?:ReactNode};
export function ScoreLibraryHub({instrument,library,reports,importing,error,storageError,onExit,onChoose,onImport,embedded=false,importStep='',extra}:Props){
 const id=useId(),input=useRef<HTMLInputElement>(null),recorder=instrument.id==='recorder-soprano';
 const pickFile=()=>input.current?.click();
 const Root=embedded?'div':'main';
 return <Root className={`score-library-page cactom-score-library cactom-dashboard library-hub${embedded?' library-hub--embedded':''}`}>
  {!embedded&&<header className="library-hub-topbar"><button type="button" className="brand-home" onClick={onExit} aria-label="Cactom: voltar ao início" title="Voltar ao início"><CactomWordmark/></button><button className="back-to-trail" type="button" onClick={onExit}><span aria-hidden="true">←</span> Voltar à trilha</button></header>}
  <div className="library-hub-content practice-hub course-hub">
   <HubHeading icon="book" eyebrow="UMA MELODIA POR VEZ" title="Suas" accent="partituras." intro="Do papel para o som, no seu ritmo."/>
   <section className="practice-feature" aria-labelledby={id+'-feature'}><div className="practice-feature-copy"><span className="practice-kicker"><i/>TUA PARTITURA EM PDF</span><p className="hub-library-course">{instrument.name}</p><h2 id={id+'-feature'}>Tem música nesse papel.</h2><p className="practice-lesson-description">Manda o PDF da tua partitura. O Cactom lê as notas, monta a pauta e acompanha tu tocando, nota por nota.</p></div><HubTomScene message="Uma nota por vez!"/><HubAction onClick={pickFile}>{importing?'Lendo partitura…':'Enviar minha partitura'}</HubAction></section>
   {importing&&importStep&&<p className="score-notice hub-library-notice" role="status">{importStep}</p>}
   {error&&<p className="activity-error hub-library-alert" role="alert">{error}</p>}{storageError&&<p className="score-notice hub-library-notice" role="status">{storageError}</p>}
   <section className="hub-library-collection" aria-labelledby={id+'-collection'}><div className="hub-section-heading"><h2 id={id+'-collection'}>Sua biblioteca</h2><span>{library.length} {library.length===1?'partitura':'partituras'}</span></div><div className="score-library-grid">{library.map((item,index)=>{
    const latest=reports.find(report=>report.scoreId===item.id);
    return <button type="button" className="score-library-card" key={item.id} data-score-status={latest?.passed?'passed':latest?'practicing':'new'} data-tone={index%3} onClick={()=>onChoose(item)}><span className="hub-score-art"><SheetArtwork/>{latest?.passed&&<i><HubIcon name="check"/></i>}</span><span className="hub-score-copy"><small>{item.imported?'DA SUA BIBLIOTECA':'ESTUDO DO CACTOM'}</small><span className="hub-score-title">{item.title}</span><span className="hub-score-description">{item.description}</span><span className="hub-score-action">{latest?.passed?'Última tentativa concluída':latest?'Continuar praticando':'Abrir partitura'}<HubIcon name="arrow"/></span></span></button>;
   })}</div></section>
   <section className="hub-score-import" aria-labelledby={id+'-import'}><span className="hub-import-icon"><HubIcon name="upload"/></span><div><span className="hub-import-kicker">SUA MÚSICA TAMBÉM TEM LUGAR AQUI</span><h2 id={id+'-import'}>Traga sua partitura</h2><p>Pode ser PDF (o Cactom lê as notas) ou MusicXML (.musicxml ou .xml).</p><button className="hub-import-button" type="button" disabled={importing} onClick={pickFile}><HubIcon name="upload"/>{importing?'Lendo arquivo…':'Escolher PDF ou MusicXML'}</button><input ref={input} hidden aria-label={`Enviar partitura em PDF ou MusicXML para ${instrument.name.toLocaleLowerCase('pt-BR')}`} type="file" accept=".pdf,application/pdf,.xml,.musicxml" disabled={importing} onChange={event=>{void onImport(event.target.files?.[0]);event.target.value='';}}/><details className="hub-import-formats"><summary>Quais arquivos posso usar?<HubIcon name="chevron"/></summary><p>{recorder?'Flauta doce soprano: notas escritas na clave de Sol (com ou sem o 8 em cima).':instrument.id==='clarinet-bb'?'Clarinete em Si♭: notas escritas de Mi3 a Lá♯6.':'Trompete em Si♭: notas escritas de Dó4 a Dó6.'} Uma melodia só (sem acordes), em 2/4, 3/4 ou 4/4.</p><p><b>PDF:</b> funciona melhor com partitura feita em programa (MuseScore, Finale, Sibelius) ou papel bem escaneado e reto, até {6} páginas. Partitura escrita à mão ou foto torta pode sair errada; por isso tu confere a leitura antes de tocar.</p><p><b>MusicXML:</b> arquivo descompactado de até 512 KB; .mxl não é aceito.</p></details></div></section>
   <details className="hub-disclosure hub-library-storage"><summary><span className="hub-related-icon"><HubIcon name="book"/></span><span>Sua biblioteca neste navegador</span><HubIcon name="chevron"/></summary><div><p>Os arquivos e resultados ficam neste navegador. Nenhum áudio é gravado ou enviado.</p></div></details>
   {extra}
  </div>
 </Root>;
}
