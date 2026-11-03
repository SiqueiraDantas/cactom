import { formatWrittenNote, type PracticeNote } from './music.ts';
import type { Lesson, ExerciseStep } from './curriculum.ts';
export type RecorderSystem='baroque'|'german';
export const RECORDER_ID='recorder-soprano';
export const RECORDER_HOLES=[0,1,2,3,4,5,6,7] as const;
export const HOLE_FINGERS=['Polegar esquerdo · atrás','Indicador esquerdo','Médio esquerdo','Anelar esquerdo','Indicador direito','Médio direito','Anelar direito','Mínimo direito'] as const;
// Traditional soprano notation: written C4 sounds C5. Hole 0 is the rear thumb.
const positions:Record<number,readonly number[]>={60:[0,1,2,3,4,5,6,7],62:[0,1,2,3,4,5,6],64:[0,1,2,3,4,5],65:[0,1,2,3,4,6,7],67:[0,1,2,3],69:[0,1,2],71:[0,1],72:[0,2],74:[2]};
export function recorderNote(midi:number,system:RecorderSystem='baroque'):PracticeNote{
  if(!Number.isInteger(midi)||!positions[midi])throw new Error('Neste curso, use notas naturais escritas de Dó4 a Ré5 para flauta doce soprano.');
  const holes=system==='german'&&midi===65?[0,1,2,3,4]:positions[midi];
  return {id:'recorder-'+midi,writtenMidi:midi,label:formatWrittenNote(midi),valves:[],valveDescription:'Furos '+holes.join(' · '),holes,transposeSemitones:12};
}
export const RECORDER_NOTES=[71,69,67,72,74,65,64,62,60].map(n=>recorderNote(n));
export function recorderLessons(system:RecorderSystem='baroque'):readonly Lesson[]{
  const [B,A,G,C,D,F,E,d,c]=[71,69,67,72,74,65,64,62,60].map(n=>recorderNote(n,system));
  const step=(id:string,note:PracticeNote,seconds=2):ExerciseStep=>({id:'rec-'+id,note,holdSeconds:seconds,toleranceCents:45,stabilityLimitCents:30,instruction:'Cubra os furos indicados com suavidade e mantenha '+note.label+'.'});
  const sequence=(prefix:string,notes:PracticeNote[])=>notes.map((n,i)=>step(prefix+'-'+i,n));
  const lesson=(id:string,title:string,summary:string,goal:string,concept:string,steps:ExerciseStep[],category:Lesson['category']='som'):Lesson=>({
    id:'recorder-'+id,title,summary,goal,concept,category,steps,
    teacherTip:'Mão esquerda em cima. Cubra cada furo por inteiro, sem apertar. Experimente um “tu” suave e descanse entre tentativas. O microfone avalia o som, não a posição real dos dedos.',
  });
  return [
    {...lesson('furos','Conheça sua flauta doce','Duas mãos e oito posições para descobrir','Conhecer o polegar de trás e os sete furos da frente.','O furo 0 fica atrás e recebe o polegar esquerdo. Os furos 1–3 são da mão esquerda; 4–7, da direita. Nos furos duplos 6 e 7, cubra as duas aberturas para as notas naturais.',[],'descoberta'),discoveryHoles:RECORDER_HOLES},
    lesson('primeiro-si','Seu primeiro Si','Um som suave para começar','Sustentar Si por dois segundos.','Feche o polegar de trás (0) e o indicador esquerdo (1). Deixe os demais furos abertos. A flauta soprano soa uma oitava acima da pauta tradicional.',[step('si-inicial',B)]),
    lesson('descubra-la','Um novo som: Lá','Mais um dedo, outra nota','Sustentar Lá e voltar ao Si.','Para Lá, cubra 0, 1 e 2. Mantenha os dedos próximos dos furos.',sequence('la-si',[A,B,A])),
    lesson('chegou-sol','Chegou o Sol','Complete a primeira família de notas','Sustentar Sol, Lá e Si com pausas entre eles.','Para Sol, cubra 0, 1, 2 e 3. A mão direita ajuda a equilibrar a flauta, sem fechar outros furos.',sequence('sol-la-si',[G,A,B])),
    lesson('tres-notas','Três notas na bagagem','Si, Lá e Sol em uma sequência','Trocar de posição e reencontrar cada nota.','Ouça a diferença de altura entre Si, Lá e Sol. Faça uma pequena pausa a cada troca neste treino.',sequence('bag',[B,A,G,A,B]),'sequencia'),
    lesson('notas-repetidas','Uma nota, duas vezes','Aprenda a separar os sons','Produzir duas emissões independentes de cada nota.','Deixe um pequeno silêncio entre as notas iguais. Uma única nota longa não vale como duas.',sequence('repetidas',[B,B,A,A,G,G]),'sequencia'),
    lesson('do-re-agudos','Dó e Ré lá em cima','Descubra novas posições','Tocar Dó5 e Ré5 escritos, sem forçar o sopro.','Dó5: furos 0 e 2 fechados. Ré5: apenas 2 fechado; solte o polegar. Oitava escrita e altura sonora são conferidas.',sequence('do-re',[C,D,C])),
    lesson('primeira-melodia','Uma melodia de cinco notas','Si, Lá, Sol, Dó e Ré','Executar uma pequena sequência de alturas.','Leia uma nota de cada vez. Neste treino, descanse entre os sons para encontrar cada posição.',sequence('melodia',[B,A,G,A,B,C,D,C,B]),'sequencia'),
    lesson('fa-mi','Fá e Mi entram na roda','A mão direita também faz música','Aprender Fá e Mi, respeitando o sistema escolhido.','Fá '+(system==='german'?'germânico: feche 0–4.':'barroco: feche 0–4, 6 e 7; deixe 5 aberto.')+' Mi: feche 0–5. Se a nota falhar, confira os furos antes de soprar mais forte.',sequence('fa-mi',[F,E,F,G])),
    lesson('do-re-graves','Descendo até o Dó','Ré e Dó da região grave','Cobrir os furos inferiores e sustentar os sons graves.','Ré4: cubra 0–6. Dó4: cubra 0–7. Nos furos duplos, feche as duas aberturas. Busque uma emissão leve.',sequence('graves',[E,d,c,d,E])),
    {...lesson('pulso','Seu som encontra o pulso','Semínimas e mínimas','Sustentar cada nota pelo número de tempos indicado.','Ligue o metrônomo. A semínima dura um tempo; a mínima dura dois. Aqui se avalia a sustentação, sem exigir a entrada exata no pulso.',[ {...step('pulso-si',B),figure:'quarter'}, {...step('pulso-la',A),figure:'half'}, {...step('pulso-sol',G),figure:'half'}]),defaultBpm:60},
    {...lesson('compasso','Quatro tempos, uma música','Si, Lá, Sol e Lá em 4/4','Entrar e soltar cada nota junto com o tempo.','Espere quatro tempos de preparação. Toque Si, Lá, Sol e Lá, uma nota por tempo.',sequence('compasso',[B,A,G,A]).map(s=>({...s,figure:'quarter' as const})),'sequencia'),defaultBpm:60,rhythmMode:'metered'},
    {...lesson('pausa','O silêncio também toca','Nota longa, pausa e nota curta','Tocar Si por dois tempos, silenciar no terceiro e tocar Lá no quarto.','A pausa é parte do compasso: Si nos tempos 1–2, silêncio no 3 e Lá no 4.',[{...step('pausa-si',B),figure:'half'},{...step('pausa-silencio',B),figure:'quarter',kind:'rest'},{...step('pausa-la',A),figure:'quarter'}],'desafio'),defaultBpm:60,rhythmMode:'metered'},
  ];
}
