import type {Lesson} from '../lib/curriculum';
import {TomOfficial} from './CactomBrand';

export type IntroductionContent={title:string;goal:string;explanation:string;preparation:string};
export function lessonIntroduction(lesson:Lesson):IntroductionContent{
  return {
    title:lesson.title,
    goal:lesson.goal,
    explanation:lesson.concept,
    preparation:lesson.category==='descoberta'
      ?'Explore o desenho com calma. Nesta descoberta, você não precisa ligar o microfone.'
      :lesson.rhythmMode==='metered'
        ?'Use fones. Ao começar, fique em silêncio no breve ajuste do microfone. Espere os quatro tempos de preparação e siga as notas e pausas da partitura.'
        :lesson.steps.some(s=>s.figure)
          ?'Ouça a referência, ligue o metrônomo e depois ative o microfone. Acompanhe a duração indicada para cada nota.'
          :'Ouça a referência antes de ligar o microfone. Depois, toque a nota indicada e acompanhe o tempo de sustentação.',
  };
}
export function ActivityIntroduction({content,onProceed}:{content:IntroductionContent;onProceed:()=>void}){
  return <section className="activity-introduction" aria-labelledby="activity-introduction-title">
    <span className="activity-introduction-kicker">ANTES DE COMEÇAR</span>
    <div className="activity-introduction-tom"><TomOfficial expression="animado"/></div>
    <div className="activity-introduction-speech">
      <span className="activity-introduction-speaker">Tom</span>
      <h1 id="activity-introduction-title">{content.title}</h1>
      <p className="activity-introduction-goal">{content.goal}</p>
      <p>{content.explanation}</p>
      <p className="activity-introduction-preparation">{content.preparation}</p>
    </div>
    <div className="activity-introduction-actions">
      <button className="activity-introduction-skip" type="button" onClick={onProceed}>Pular</button>
      <button className="activity-primary" type="button" onClick={onProceed}>Avançar <span aria-hidden="true">→</span></button>
    </div>
  </section>;
}
