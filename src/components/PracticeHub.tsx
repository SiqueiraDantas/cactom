import {useId, type ReactNode} from 'react';
import type {Lesson} from '../lib/curriculum';
import type {InstrumentProfile} from '../lib/instruments';
import type {RecorderSystem} from '../lib/recorder';
import {TomOfficial} from './CactomBrand';
import {CourseArtwork} from './CourseArtwork';
import './practice-hub.css';

type Props={
  instrument:InstrumentProfile;
  lesson:Lesson;
  lessonNumber:number;
  courseComplete:boolean;
  recorderSystem:RecorderSystem;
  onRecorderSystem:(system:RecorderSystem)=>void;
  onPractice:()=>void;
  onTouch:()=>void;
  onScores:()=>void;
  learningSupport:ReactNode;
};

function PracticeIcon({name}:{name:'arrow'|'settings'|'headphones'|'chevron'}){
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {name==='arrow'?<path d="M5 12h14m-6-6 6 6-6 6"/>:name==='chevron'?<path d="m8 10 4 4 4-4"/>:name==='headphones'?<><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="12" width="5" height="9" rx="2"/><rect x="16" y="12" width="5" height="9" rx="2"/></>:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="3" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="3" fill="currentColor" stroke="none"/></>}
  </svg>;
}

/** Decorative sheet illustration, independent from the exercises' notation. */
export function SheetArtwork(){
  return <svg className="practice-sheet-art" viewBox="0 0 160 120" fill="none" aria-hidden="true" focusable="false">
    <ellipse cx="82" cy="109" rx="48" ry="5" fill="#294f6310"/>
    <rect x="46" y="13" width="79" height="94" rx="11" fill="#cee2ee" transform="rotate(9 46 13)"/>
    <rect x="34" y="9" width="83" height="96" rx="11" fill="#fffefd" stroke="#b8d0de" strokeWidth="2" transform="rotate(-7 34 9)"/>
    <g transform="rotate(-7 77 57)">
      <path d="M49 39h52M49 48h52M49 57h52M49 66h52M49 75h52" stroke="#c9dce6" strokeWidth="1.5"/>
      <path d="M71 57V29m25 37V38" stroke="#3d7587" strokeWidth="2.5"/>
      <ellipse cx="65" cy="57" rx="7" ry="5" fill="#3d7587" transform="rotate(-20 65 57)"/>
      <ellipse cx="90" cy="66" rx="7" ry="5" fill="#3d7587" transform="rotate(-20 90 66)"/>
      <path d="M52 88h25" stroke="#c3d7df" strokeWidth="3" strokeLinecap="round"/>
    </g>
    <circle cx="124" cy="32" r="14" fill="#f9cd76"/>
    <path d="m124 24 2.5 5.5L132 32l-5.5 2.5L124 40l-2.5-5.5L116 32l5.5-2.5Z" fill="#b67c24"/>
  </svg>;
}

export function PracticeHub({instrument,lesson,lessonNumber,courseComplete,recorderSystem,onRecorderSystem,onPractice,onTouch,onScores,learningSupport}:Props){
  const recorder=instrument.id==='recorder-soprano';
  const id=useId();
  return <div className="practice-hub">
    <header className="practice-heading">
      <span className="practice-eyebrow"><PracticeIcon name="headphones"/> PRATICAR</span>
      <h1>Hora de soltar <span>o som.</span></h1>
      <p>Um espaço para experimentar e tocar do seu jeito.</p>
    </header>

    <section className="practice-feature" aria-labelledby={id+'-lesson'}>
      <div className="practice-feature-copy">
        <span className="practice-kicker"><i/>{courseComplete?'SEMPRE DÁ PARA TOCAR DE NOVO':'SEU PRÓXIMO PASSO'}</span>
        <p className="practice-lesson-meta">Aula {String(lessonNumber).padStart(2,'0')}<span aria-hidden="true">·</span>{instrument.name}</p>
        <h2 id={id+'-lesson'}>{lesson.title}</h2>
        <p className="practice-lesson-description">{lesson.summary}</p>
      </div>
      <div className="practice-tom-scene" aria-hidden="true">
        <span className="practice-tom-orbit"/>
        <span className="practice-tom-spark spark-one"/>
        <span className="practice-tom-spark spark-two"/>
        <TomOfficial decorative className="practice-tom" expression="animado"/>
        <span className="practice-tom-hello">Vamos nessa?</span>
      </div>
      <div className="practice-feature-action">
        <button type="button" className="practice-start" onClick={onPractice} aria-label={`${courseComplete?'Revisar aula':'Praticar agora'}: ${lesson.title}`}>
          <span>{courseComplete?'Revisar aula':'Praticar agora'}</span><PracticeIcon name="arrow"/>
        </button>
      </div>
    </section>

    <section className="practice-more" aria-labelledby={id+'-more'}>
      <div className="practice-section-heading"><h2 id={id+'-more'}>Experimente também</h2><span>No seu ritmo</span></div>
      <div className="practice-modes">
        <button type="button" className="practice-mode practice-mode--touch" onClick={onTouch} aria-label={recorder?'Explorar os furos':instrument.id==='clarinet-bb'?'Explorar posições do clarinete':'Explorar posições do trompete'}>
          <span className="practice-mode-art"><CourseArtwork instrument={instrument.id}/></span>
          <span className="practice-mode-copy"><span className="practice-mode-label">SEM INSTRUMENTO</span><span className="practice-mode-title">Música na ponta dos dedos</span><span className="practice-mode-description">{recorder?'Explore os furos por toque e ouça cada nota.':'Explore as posições e ouça os sons.'}</span><span className="practice-mode-link">{recorder?'Explorar os furos':'Explorar posições'}<PracticeIcon name="arrow"/></span></span>
        </button>
        <button type="button" className="practice-mode practice-mode--score" onClick={onScores} aria-label="Abrir biblioteca de partituras">
          <span className="practice-mode-art"><SheetArtwork/></span>
          <span className="practice-mode-copy"><span className="practice-mode-label">COM PARTITURA</span><span className="practice-mode-title">Do papel para o som</span><span className="practice-mode-description">Escolha um estudo ou traga sua partitura MusicXML.</span><span className="practice-mode-link">Abrir biblioteca<PracticeIcon name="arrow"/></span></span>
        </button>
      </div>
    </section>

    {learningSupport&&<div className="practice-reinforcement">{learningSupport}</div>}

    {recorder&&<details className="practice-config">
      <summary><span className="practice-config-icon"><PracticeIcon name="settings"/></span><span className="practice-config-title">Minha flauta doce<small>Ajustar o sistema de digitação</small></span><span className="practice-system-value">{recorderSystem==='baroque'?'Barroca':'Germânica'}</span><PracticeIcon name="chevron"/></summary>
      <div className="practice-config-content"><label htmlFor={id+'-system'}>Sistema de digitação<select id={id+'-system'} aria-label="Sistema de digitação da flauta doce" value={recorderSystem} onChange={e=>onRecorderSystem(e.target.value as RecorderSystem)}><option value="baroque">Digitação barroca</option><option value="german">Digitação germânica</option></select></label><p>Confira o sistema no instrumento ou com quem orienta você. A posição do Fá muda entre os dois sistemas. Na pauta com 8, a flauta soprano soa uma oitava acima.</p></div>
    </details>}
  </div>;
}
