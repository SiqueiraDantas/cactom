import {useRef,useState} from 'react';
import type {InstrumentProfile} from '../lib/instruments';
import type {LibraryScore} from '../lib/scoreLibrary';
import type {ScoreReport} from '../lib/scoreStorage';
import {CactomWordmark,TomOfficial} from './CactomBrand';
import './score-shelf.css';
import {SheetArtwork} from './PracticeHub';
import type {ReactNode} from 'react';
import {HubIcon} from './CactomHub';

const FILTERS=[{id:'all',label:'Todas'},{id:'cactom',label:'Estudos do Cactom'},{id:'mine',label:'Minhas partituras'}] as const;
type Props={instrument:InstrumentProfile;library:readonly LibraryScore[];reports:readonly ScoreReport[];importing:boolean;error:string;storageError:string;onExit:()=>void;onChoose:(score:LibraryScore)=>void;onImport:(file:File|undefined)=>Promise<void>|void;
 /** Dentro da aba Partituras da página inicial: sem barra de topo própria. */
 embedded?:boolean;importStep?:string;extra?:ReactNode};
export function ScoreLibraryHub({instrument,library,reports,importing,error,storageError,onExit,onChoose,onImport,embedded=false,importStep='',extra}:Props){
 const input=useRef<HTMLInputElement>(null),recorder=instrument.id==='recorder-soprano';
 const pickFile=()=>input.current?.click();
 const [filter,setFilter]=useState<'all'|'cactom'|'mine'>('all');
 const shown=library.filter(item=>filter==='all'||(filter==='mine'?item.imported:!item.imported));
 const Root=embedded?'div':'main';
 return <Root className={`score-library-page cactom-score-library cactom-dashboard library-hub${embedded?' library-hub--embedded':''}`}>
  {!embedded&&<header className="library-hub-topbar"><button type="button" className="brand-home" onClick={onExit} aria-label="Cactom: voltar ao início" title="Voltar ao início"><CactomWordmark/></button><button className="back-to-trail" type="button" onClick={onExit}><span aria-hidden="true">←</span> Voltar à trilha</button></header>}
  <div className="library-hub-content practice-hub course-hub score-shelf">
   <header className="shelf-head">
    <div className="shelf-head-copy"><p className="shelf-eyebrow">{instrument.name} · Partituras</p><h1>Tua estante de músicas</h1><p>Escolhe uma música e toca nota por nota com o Tom.</p></div>
    <button className="shelf-add" type="button" disabled={importing} onClick={pickFile}><HubIcon name="upload"/>{importing?'Lendo partitura…':'Adicionar partitura'}</button>
   </header>
   <nav className="shelf-filters" aria-label="Filtrar partituras">{FILTERS.map(f=><button key={f.id} type="button" aria-pressed={filter===f.id} className={filter===f.id?'on':''} onClick={()=>setFilter(f.id)}>{f.label}{f.id==='all'?` · ${library.length}`:''}</button>)}</nav>
   {importing&&importStep&&<p className="score-notice hub-library-notice" role="status">{importStep}</p>}
   {error&&<p className="activity-error hub-library-alert" role="alert">{error}</p>}{storageError&&<p className="score-notice hub-library-notice" role="status">{storageError}</p>}
   <section className="shelf-grid" aria-label="Partituras">
    
    {shown.map((item,index)=>{
     const latest=reports.find(report=>report.scoreId===item.id),status=latest?.passed?'passed':latest?'practicing':'new';
     return <button type="button" className="shelf-card" key={item.id} data-score-status={status} data-tone={index%3} onClick={()=>onChoose(item)}>
      <span className="shelf-cover"><small>{item.imported?'DA TUA BIBLIOTECA':'ESTUDO DO CACTOM'}</small><SheetArtwork/></span>
      <span className="shelf-body">
       <span className="shelf-title">{item.title}</span>
       <span className="shelf-desc">{item.description}</span>
       <span className={`shelf-status ${status}`}>{status==='passed'?<><HubIcon name="check"/>Concluída</>:status==='practicing'?<><i/>Praticando</>:<><i/>Nova</>}<span className="shelf-open">{status==='new'?'Abrir':'Continuar'}<HubIcon name="arrow"/></span></span>
      </span>
     </button>;
    })}
    <button type="button" className="shelf-card shelf-upload" disabled={importing} onClick={pickFile}>
     <span className="shelf-upload-tom" aria-hidden="true"><TomOfficial decorative expression="animado"/></span>
     <span className="shelf-title">{importing?'Lendo partitura…':'Traz tua partitura'}</span>
     <span className="shelf-desc">PDF ou MusicXML. O Tom lê as notas e monta a lição.</span>
    </button>
   </section>
   {!shown.length&&<p className="shelf-empty">{filter==='mine'?'Tu ainda não trouxe nenhuma partitura. Toca em “Traz tua partitura”.':'Nada por aqui ainda.'}</p>}
   <input ref={input} hidden aria-label={`Enviar partitura em PDF ou MusicXML para ${instrument.name.toLocaleLowerCase('pt-BR')}`} type="file" accept=".pdf,application/pdf,.xml,.musicxml" disabled={importing} onChange={event=>{void onImport(event.target.files?.[0]);event.target.value='';}}/>
   <details className="hub-import-formats shelf-formats">
    <summary>Quais arquivos posso usar?<HubIcon name="chevron"/></summary>
    <p>{recorder?'Flauta doce soprano: notas escritas na clave de Sol (com ou sem o 8 em cima).':instrument.id==='clarinet-bb'?'Clarinete em Si♭: notas escritas de Mi3 a Lá♯6.':'Trompete em Si♭: notas escritas de Dó4 a Dó6.'} Uma melodia só (sem acordes), em 2/4, 3/4 ou 4/4.</p>
    <p><b>PDF:</b> funciona melhor com partitura feita em programa (MuseScore, Finale, Sibelius) ou papel bem escaneado e reto, até {6} páginas. Partitura escrita à mão ou foto torta pode sair errada; por isso tu confere a leitura antes de tocar.</p>
    <p><b>MusicXML:</b> arquivo descompactado de até 512 KB; .mxl não é aceito.</p>
   </details>
   <p className="shelf-note">Tuas partituras e resultados ficam neste aparelho. Nenhum áudio é gravado ou enviado.</p>
   {extra}
  </div>
 </Root>;
}
