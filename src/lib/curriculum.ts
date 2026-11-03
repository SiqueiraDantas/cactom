import { BEGINNER_NOTES, type PracticeNote } from './music.ts';
import type { Figure } from './rhythm.ts';

export type ExerciseStep = {
  id: string;
  note: PracticeNote;
  holdSeconds: number;
  figure?: Figure; // rhythm lessons: duration in quarter-note beats at BPM
  kind?: 'note' | 'rest';
  toleranceCents: number;
  stabilityLimitCents: number;
  instruction: string;
};

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  goal: string;
  concept: string;
  teacherTip: string;
  category: 'descoberta' | 'som' | 'sequencia' | 'desafio';
  steps: readonly ExerciseStep[];
  defaultBpm?: number;
  rhythmMode?: 'metered'; // exige ataque, soltura e silêncio no pulso (laboratório experimental)
  discoveryHoles?: readonly number[];
};

const [C, D, E, F, G] = BEGINNER_NOTES;
function exercise(id: string, note: PracticeNote, seconds: number, instruction: string, tolerance = 45, stability = 30): ExerciseStep {
  return { id, note, holdSeconds: seconds, toleranceCents: tolerance, stabilityLimitCents: stability, instruction };
}
function rhythmic(id:string, note:PracticeNote, figure:Figure, instruction:string):ExerciseStep {
  return {...exercise(id,note,1,instruction),figure};
}
function rest(id:string, figure:Figure, instruction:string):ExerciseStep {
  return {...rhythmic(id,G,figure,instruction),kind:'rest'};
}

/** Sequência didática proposta para teste com professores de trompete da escola.
 * Não equivale a um método presencial completo. A progressão é orientativa. */
export const LESSONS: readonly Lesson[] = [
  {
    id: 'pistos', title: 'Conheça seu trompete', summary: 'Mãos, pistos e cuidado com o instrumento',
    goal: 'Identificar os três pistos e os dedos correspondentes.',
    concept: 'O indicador aciona o pisto 1; o dedo médio, o pisto 2; e o anelar, o pisto 3. A mão esquerda sustenta o trompete.',
    teacherTip: 'Explore sem soprar. Evite força excessiva e observe a posição relaxada das mãos.',
    category: 'descoberta', steps: [],
  },
  {
    id: 'primeiro-sol', title: 'Seu primeiro Sol', summary: 'Experimente sustentar um único som',
    goal: 'Encontrar o Sol escrito e mantê-lo por 2 segundos.',
    concept: 'O Sol4 escrito para trompete em Si♭ é tocado com os três pistos soltos. Não é necessário tocar forte: busque um som confortável.',
    teacherTip: 'A emissão do som pode levar tempo. Se houver desconforto, pare, descanse e peça orientação ao professor.',
    category: 'som', steps: [exercise('sol-inicial', G, 2, 'Deixe os três pistos soltos e sustente o Sol por 2 segundos.')],
  },
  {
    id: 'mi-fa-sol', title: 'Descubra Mi e Fá', summary: 'Aprenda duas novas posições de pistos',
    goal: 'Reconhecer e sustentar Mi, Fá e Sol individualmente.',
    concept: 'O Mi usa os pistos 1 e 2; o Fá usa o pisto 1; o Sol é aberto. Ouça a diferença de altura entre eles.',
    teacherTip: 'Oriente a troca de pistos sem apertar as mãos e com pausas entre as tentativas.',
    category: 'som', steps: [
      exercise('mi-primeiro', E, 2, 'Pressione 1 + 2 e sustente um Mi.'),
      exercise('fa-primeiro', F, 2, 'Pressione apenas o pisto 1 e sustente um Fá.'),
      exercise('sol-revisao', G, 2, 'Solte os pistos e toque Sol novamente.'),
    ],
  },
  {
    id: 'primeira-frase', title: 'Subindo e descendo', summary: 'Troque as notas em uma pequena frase',
    goal: 'Repetir notas sem perder o controle de cada emissão.',
    concept: 'Faça um pequeno descanso entre as notas. O exercício testa cada emissão separadamente, ainda sem avaliar ritmo.',
    teacherTip: 'Explore as conexões Mi–Fá–Sol. O aplicativo valida a sequência, mas não certifica qualidade de articulação.',
    category: 'sequencia', steps: [
      exercise('frase-sol-1', G, 1.5, 'Comece pelo Sol com os pistos soltos.'),
      exercise('frase-fa-1', F, 1.5, 'Agora aperte somente o pisto 1.'),
      exercise('frase-mi-1', E, 1.5, 'Passe para os pistos 1 + 2.'),
      exercise('frase-fa-2', F, 1.5, 'Volte para Fá com o pisto 1.'),
      exercise('frase-sol-2', G, 1.5, 'Termine novamente no Sol, sem pistos.'),
    ],
  },
  {
    id: 'do-re', title: 'Conhecendo Dó e Ré', summary: 'Amplie seu repertório de notas graves',
    goal: 'Experimentar as posições de Dó e Ré escritos.',
    concept: 'O Dó4 é aberto e o Ré4 utiliza os pistos 1 e 3. A digitação aberta também é usada no Sol: a embocadura determina o harmônico.',
    teacherTip: 'O Ré grave pode demandar ajuste de afinação e o Dó grave pode ser mais difícil. Não force a emissão.',
    category: 'som', steps: [
      exercise('do-inicial', C, 2, 'Toque Dó4 grave com todos os pistos soltos.'),
      exercise('re-inicial', D, 2, 'Agora use os pistos 1 + 3 para Ré4.'),
    ],
  },
  {
    id: 'cinco-notas', title: 'A escada de cinco notas', summary: 'Dó, Ré, Mi, Fá e Sol',
    goal: 'Reconhecer e sustentar cinco notas em ordem.',
    concept: 'Observe a nota escrita e a digitação. A atividade só avança quando o som estiver dentro dos critérios de duração e afinação.',
    teacherTip: 'Antes de aumentar a velocidade, garanta que o aluno tenha conforto e som estável em todas as notas.',
    category: 'sequencia', steps: [C,D,E,F,G].map((note,i)=>exercise(`escada-${i}`,note,2,`Toque ${note.label}, observando os pistos indicados.`)),
  },
  {
    id: 'firmeza', title: 'Desafio da sustentação', summary: 'Controle o som por mais tempo',
    goal: 'Sustentar três notas por 3 segundos cada.',
    concept: 'A proposta é emitir um som contínuo, confortável e razoavelmente estável. Respire e descanse quando necessário.',
    teacherTip: 'Evite qualquer incentivo a prender a respiração ou soprar até sentir tontura. Qualidade vem antes de tempo.',
    category: 'desafio', steps: [
      exercise('firme-sol', G, 3, 'Mantenha o Sol por 3 segundos.', 40, 25),
      exercise('firme-fa', F, 3, 'Mantenha o Fá por 3 segundos.', 40, 25),
      exercise('firme-mi', E, 3, 'Mantenha o Mi por 3 segundos.', 40, 25),
    ],
  },
  {
    id: 'pequena-melodia', title: 'Primeira melodia', summary: 'Seis notas com digitações alternadas',
    goal: 'Reconhecer uma frase simples, nota por nota.',
    concept: 'Toque cada nota na ordem indicada. Esta primeira melodia é livre: ainda não há avaliação de ritmo ou andamento.',
    teacherTip: 'Peça ao aluno que cante a sequência antes de tocar. Use a atividade como leitura e memorização de notas.',
    category: 'sequencia', steps: [G,G,F,E,F,G].map((note,i)=>exercise(`melodia-${i}`,note,1.5,`Nota ${i+1} da frase: ${note.label}.`)),
  },
  {
    id: 'desafio-final', title: 'Missão cinco notas', summary: 'Revise tudo o que foi aprendido',
    goal: 'Completar a sequência sem pular nenhuma nota.',
    concept: 'Parabéns por chegar até aqui! Este desafio reúne as cinco notas estudadas. A ordem descendente exige atenção às posições.',
    teacherTip: 'Depois do desafio, faça uma devolutiva presencial sobre postura, respiração, articulação e sonoridade.',
    category: 'desafio', steps: [G,F,E,D,C].map((note,i)=>exercise(`final-${i}`,note,2.5,`Etapa ${i+1}: encontre ${note.label}.`,35,25)),
  },
  {
    id: 'pulso-primeiro', title: 'O pulso da música', summary: 'Semínimas e mínimas com metrônomo',
    goal: 'Reconhecer figuras de 1 e 2 pulsos e sustentar cada nota durante a duração indicada.',
    concept: 'A semínima ocupa 1 pulso e a mínima ocupa 2 pulsos. A duração em segundos muda com o andamento: ♪ a 60 BPM, 1 pulso = 1 segundo.',
    teacherTip: 'Conte 1–2–3–4 com o metrônomo antes de tocar. O protótipo valida a duração mínima, não a precisão do ataque ou da soltura em cada pulso.',
    category: 'sequencia', defaultBpm:60,
    steps: [
      rhythmic('pulso-sol-1',G,'quarter','Sol por uma semínima: 1 pulso.'),
      rhythmic('pulso-fa-2',F,'half','Fá por uma mínima: 2 pulsos.'),
      rhythmic('pulso-mi-1',E,'quarter','Mi por uma semínima: 1 pulso.'),
      rhythmic('pulso-sol-2',G,'half','Sol por uma mínima: 2 pulsos.'),
    ],
  },
  {
    id: 'figuras-longas', title: 'Lendo notas longas', summary: 'Semínima, mínima e semibreve',
    goal: 'Sustentar uma semibreve por 4 pulsos, além de mínimas e semínimas.',
    concept: 'Na fórmula 4/4, uma semibreve dura 4 pulsos, uma mínima dura 2 e uma semínima dura 1. Ouça os quatro tempos e toque com tranquilidade.',
    teacherTip: 'Inicie com 60 BPM. Descanse entre as notas longas e não force a respiração. Treine também ouvir os pulsos antes de tocar.',
    category: 'desafio', defaultBpm:60,
    steps: [
      rhythmic('fig-sol-1',G,'quarter','Semínima: Sol por 1 pulso.'),
      rhythmic('fig-fa-2',F,'half','Mínima: Fá por 2 pulsos.'),
      rhythmic('fig-mi-4',E,'whole','Semibreve: Mi por 4 pulsos.'),
      rhythmic('fig-sol-4',G,'whole','Semibreve: Sol por 4 pulsos.'),
    ],
  },

  {
    id: 'entrada-no-pulso', title: 'Entradas no tempo', summary: 'Ataque e soltura nas quatro semínimas',
    goal: 'Executar quatro notas respeitando os pulsos e as durações de um compasso 4/4.',
    concept: 'Ouça quatro pulsos de preparação. Depois toque cada semínima no pulso indicado, soltando o som antes da próxima nota. O sistema mede o início e o fim aproximados de cada som.',
    teacherTip: 'Use 60 BPM, com fones. O aplicativo estima o momento da nota pelo microfone; articulação e movimento de língua ainda exigem avaliação presencial.',
    category: 'sequencia', defaultBpm: 60, rhythmMode: 'metered',
    steps: [
      rhythmic('tempo-sol',G,'quarter','Sol no tempo 1.'),
      rhythmic('tempo-fa',F,'quarter','Fá no tempo 2.'),
      rhythmic('tempo-mi',E,'quarter','Mi no tempo 3.'),
      rhythmic('tempo-sol2',G,'quarter','Sol no tempo 4.'),
    ],
  },
  {
    id: 'compasso-pausa', title: 'Compasso com pausa', summary: 'Mínima, pausa e semínima',
    goal: 'Respeitar um compasso 4/4 com uma nota longa, uma pausa e uma nota curta.',
    concept: 'Na fórmula 4/4: Sol (mínima, 2 pulsos), pausa de semínima (1 pulso) e Fá (semínima, 1 pulso). Silêncio também é música!',
    teacherTip: 'Conte um, dois, três, quatro e indique a pausa com a mão. O som do metrônomo pode vazar para o microfone; prefira fones.',
    category: 'sequencia', defaultBpm: 60, rhythmMode: 'metered',
    steps: [
      rhythmic('pausa-sol',G,'half','Sustente Sol pelos tempos 1 e 2.'),
      rest('pausa-silencio','quarter','Não produza som no tempo 3.'),
      rhythmic('pausa-fa',F,'quarter','Execute Fá no tempo 4.'),
    ],
  },

];

export function lessonById(id: string): Lesson {
  return LESSONS.find(lesson=>lesson.id===id) ?? LESSONS[0];
}
export function lessonCompleted(lesson: Lesson, passed: readonly string[], seenValves: readonly number[]): boolean {
  if(lesson.discoveryHoles)return lesson.discoveryHoles.every(n=>seenValves.includes(n));
  if(lesson.id==='pistos') return [1,2,3].every(n=>seenValves.includes(n));
  return lesson.steps.every(step=>passed.includes(step.id));
}
export function firstIncompleteIndex(lesson: Lesson, passed: readonly string[]): number {
  const index=lesson.steps.findIndex(step=>!passed.includes(step.id));
  return index===-1 ? Math.max(0,lesson.steps.length-1) : index;
}
