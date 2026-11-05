import {useCallback, useMemo, useState} from 'react';
import type {OmrResult} from '../lib/scoreOmr';
import {omrToMusicXml} from '../lib/scoreOmr';
import {ScoreRenderer} from './ScoreRenderer';
import {CactomWordmark} from './CactomBrand';
import {HubHeading, HubTomScene} from './CactomHub';
import './score-pdf.css';

const KEYS:{fifths:number;label:string}[]=[
 {fifths:-4,label:'4 bemóis (Lá♭ maior / Fá menor)'},{fifths:-3,label:'3 bemóis (Mi♭ maior / Dó menor)'},{fifths:-2,label:'2 bemóis (Si♭ maior / Sol menor)'},{fifths:-1,label:'1 bemol (Fá maior / Ré menor)'},
 {fifths:0,label:'Sem sustenido nem bemol (Dó maior / Lá menor)'},
 {fifths:1,label:'1 sustenido (Sol maior / Mi menor)'},{fifths:2,label:'2 sustenidos (Ré maior / Si menor)'},{fifths:3,label:'3 sustenidos (Lá maior / Fá♯ menor)'},{fifths:4,label:'4 sustenidos (Mi maior / Dó♯ menor)'},
];

/** Mensagens do leitor em linguagem de criança (as técnicas ficam de fora). */
function friendly(warnings:readonly string[],notes:readonly string[]):string[]{
 const out:string[]=[];
 for(const w of [...warnings,...notes]){
  if(w==='acorde'){out.push('Achei notas empilhadas (acorde). Fiquei só com a de cima.');continue;}
  if(/clave/i.test(w)){out.push('Não achei a clave no começo. Considerei clave de Sol.');continue;}
  if(/anacruse/i.test(w)){out.push('A música começa no meio do compasso. Completei o começo com pausa.');continue;}
  const bar=w.match(/Compasso (\d+)/);
  if(bar){out.push(`Confira o compasso ${bar[1]}: a leitura não fechou certinho.`);continue;}
  if(/Página \d+/.test(w)){out.push(w);continue;}
 }
 return [...new Set(out)];
}

type Props={result:OmrResult;preview:string;fileName:string;pdfTitle?:string;pages:number;instrumentId:string;onCancel:()=>void;onConfirm:(xml:string,title:string)=>void;error:string};
export function ScorePdfReview({result,preview,fileName,pdfTitle='',pages,instrumentId,onCancel,onConfirm,error}:Props){
 const [beats,setBeats]=useState([2,3,4].includes(result.beats)?result.beats:4);
 const [fifths,setFifths]=useState(Math.max(-4,Math.min(4,result.fifths)));
 const [title,setTitle]=useState(pdfTitle||fileName.replace(/\.pdf$/i,'').replace(/[_-]+/g,' ').trim().slice(0,60)||'Minha partitura');
 const [ready,setReady]=useState(false);const onReady=useCallback((v:boolean)=>setReady(v),[]);
 const built=useMemo(()=>omrToMusicXml(result,{title,beats,fifths,instrumentId}),[result,title,beats,fifths,instrumentId]);
 const tips=friendly(result.warnings,built.notes);
 const noteCount=result.measures.reduce((a,m)=>a+m.items.filter(n=>n.midi!==null).length,0);
 return <main className="score-library-page cactom-score-library cactom-dashboard library-hub pdf-review">
  <header className="library-hub-topbar"><span className="brand-home"><CactomWordmark/></span><button className="back-to-trail" type="button" onClick={onCancel}><span aria-hidden="true">←</span> Escolher outro PDF</button></header>
  <div className="library-hub-content practice-hub course-hub">
   <HubHeading icon="book" eyebrow="CONFERE COMIGO" title="Li tua" accent="partitura!" intro={`Achei ${noteCount} ${noteCount===1?'nota':'notas'} em ${result.measures.length} ${result.measures.length===1?'compasso':'compassos'}. Olha se ficou igual ao teu papel.`}/>
   <div className="pdf-review-compare">
    <figure><figcaption>Teu PDF{pages>1?` (página 1 de ${pages})`:''}</figcaption>{preview?<img src={preview} alt="Primeira página do PDF enviado"/>:null}</figure>
    <figure><figcaption>Como o Cactom leu</figcaption><div className="pdf-review-score" aria-busy={!ready}><ScoreRenderer xml={built.xml} cursorIndex={null} onReady={onReady}/></div></figure>
   </div>
   {tips.length>0&&<section className="pdf-review-tips" aria-label="Pontos para conferir"><HubTomScene message="Bora conferir, visse?"/><ul>{tips.map(t=><li key={t}>{t}</li>)}</ul></section>}
   <section className="pdf-review-fix" aria-label="Ajustes da leitura">
    <p>Se algo não bater com teu papel, ajusta aqui:</p>
    <label>Nome da música<input value={title} maxLength={60} onChange={e=>setTitle(e.target.value)}/></label>
    <label>Compasso (número de cima)<select value={beats} onChange={e=>setBeats(Number(e.target.value))}>{[2,3,4].map(b=><option key={b} value={b}>{b}/4</option>)}</select></label>
    <label>Armadura (sustenidos ou bemóis do começo)<select value={fifths} onChange={e=>setFifths(Number(e.target.value))}>{KEYS.map(k=><option key={k.fifths} value={k.fifths}>{k.label}</option>)}</select></label>
   </section>
   {error&&<p className="activity-error hub-library-alert" role="alert">{error}</p>}
   <div className="pdf-review-actions"><button type="button" className="session-text-button" onClick={onCancel}>Escolher outro PDF</button><button type="button" className="activity-primary" onClick={()=>onConfirm(built.xml,title.trim()||'Minha partitura')}>Tá igual! Bora tocar</button></div>
   <p className="pdf-review-note">O leitor funciona melhor com PDF feito em programa de partitura (MuseScore, Finale, Sibelius) ou com papel bem escaneado e reto: uma melodia só, na clave de Sol. Partitura escrita à mão ou foto torta pode sair errada.</p>
  </div>
 </main>;
}
