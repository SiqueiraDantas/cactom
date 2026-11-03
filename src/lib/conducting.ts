/** Regência por câmera. Os pontos descrevem direções de referência, não posições obrigatórias.
 * A avaliação pedagógica é tolerante a estilos e amplitudes diferentes de regência.
 */
export type Point={x:number;y:number};
export type Meter=2|3|4;
export type ConductingLesson={id:string;title:string;description:string;meter:Meter;bpm:number;measures:number;unit:number};
export const CONDUCTING_LESSONS:readonly ConductingLesson[]=[
  {id:'pulso-2-60',title:'Os dois tempos',description:'Sinta o pulso: baixo e cima.',meter:2,bpm:60,measures:3,unit:0},
  {id:'pulso-2-76',title:'Dois tempos em movimento',description:'Regência binária com pulso constante.',meter:2,bpm:76,measures:3,unit:0},
  {id:'pulso-2-92',title:'Binário com confiança',description:'Três compassos com mais fluidez.',meter:2,bpm:92,measures:3,unit:0},
  {id:'pulso-3-56',title:'A valsa começa',description:'Baixo, fora e cima: três tempos.',meter:3,bpm:56,measures:3,unit:1},
  {id:'pulso-3-72',title:'Sentindo a valsa',description:'Acentue o primeiro tempo com seu gesto.',meter:3,bpm:72,measures:3,unit:1},
  {id:'pulso-3-88',title:'Valsa em andamento',description:'Mantenha regularidade no ternário.',meter:3,bpm:88,measures:3,unit:1},
  {id:'pulso-4-56',title:'Os quatro tempos',description:'Baixo, dentro, fora e cima.',meter:4,bpm:56,measures:3,unit:2},
  {id:'pulso-4-72',title:'Regendo em quatro',description:'Conduza os quatro tempos em sequência.',meter:4,bpm:72,measures:3,unit:2},
  {id:'pulso-4-90',title:'Meu primeiro concerto',description:'Desafio de regência quaternária.',meter:4,bpm:90,measures:4,unit:2},
];
export const CONDUCTING_UNITS=[
  {title:'O pulso nas mãos',description:'Compasso 2/4',color:'blue'},
  {title:'O balanço da valsa',description:'Compasso 3/4',color:'green'},
  {title:'Primeiros passos de maestro',description:'Compasso 4/4',color:'orange'},
] as const;
export const BEAT_POINTS:Record<Meter,readonly Point[]>={
  2:[{x:200,y:272},{x:200,y:65}],
  3:[{x:200,y:274},{x:292,y:196},{x:200,y:65}],
  4:[{x:200,y:274},{x:110,y:207},{x:292,y:185},{x:200,y:65}],
};
export const START:Point={x:200,y:65};
export const clamp=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
/** Conversão mais generosa: maior espaço físico de movimento antes de atingir as bordas. */
export function mapHand(raw:Point,origin:Point,gain=.85):Point{
  return {x:clamp(START.x+(raw.x-origin.x)*650*gain,4,396),y:clamp(START.y+(raw.y-origin.y)*630*gain,4,336)};
}
export function guidePosition(now:number,startAt:number,meter:Meter,bpm:number):Point{
  const interval=60000/bpm,beat=(now-startAt)/interval;
  if(beat<0){const t=clamp(1+beat,0,1);return {x:START.x+(BEAT_POINTS[meter][0].x-START.x)*t,y:START.y+(BEAT_POINTS[meter][0].y-START.y)*t};}
  const index=Math.floor(beat),current=BEAT_POINTS[meter][index%meter],next=BEAT_POINTS[meter][(index+1)%meter],t=clamp(beat-index,0,1);
  return {x:current.x+(next.x-current.x)*t,y:current.y+(next.y-current.y)*t};
}
export type MotionSample={at:number;point:Point};
export type GestureProgress={
  next:number;hits:number;misses:number;downbeats:number;errors:number[];
  recorded:readonly boolean[];finished:boolean;
  /** Amostras recentes permitem reconhecer a trajetória; uma mão parada nunca pontua. */
  samples:readonly MotionSample[];
};
export const freshGesture=():GestureProgress=>({next:0,hits:0,misses:0,downbeats:0,errors:[],recorded:[],finished:false,samples:[]});
/**
 * Avalia a DIREÇÃO do segmento de regência, sem exigir passar por um ponto exato.
 * Aceita amplitude individual e atraso/adiantamento moderado, mas não valida
 * mão parada, gesto invertido ou presença isolada no alvo.
 * Sensibilidade 1.25 (padrão) equivale à área ampla; 1.6 facilita mais.
 */
export function advanceConducting(
  progress:GestureProgress,point:Point|null,now:number,startAt:number,meter:Meter,bpm:number,measures:number,sensitivity=1.25,
):GestureProgress{
  if(progress.finished||now<startAt-650)return progress;
  const interval=60000/bpm,count=meter*measures;
  const reach=clamp(sensitivity,.8,1.65);
  const early=interval*.59,late=interval*.62;
  // Manter somente os dados recentes, evitando crescimento ao longo do exercício.
  const samples:MotionSample[]=progress.samples.filter(s=>now-s.at<=Math.max(1450,interval*1.6));
  if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))samples.push({at:now,point});
  let next=progress.next,hits=progress.hits,misses=progress.misses,downbeats=progress.downbeats;
  let errors=progress.errors,recorded=progress.recorded;
  while(next<count){
    const due=startAt+next*interval;
    if(now>due+late){recorded=[...recorded,false];misses++;next++;continue;}
    if(now<due-early)break;
    if(!point)break;
    const target=BEAT_POINTS[meter][next%meter];
    const source=next%meter===0?START:BEAT_POINTS[meter][(next-1)%meter];
    const expected={x:target.x-source.x,y:target.y-source.y};
    const expectedLength=Math.hypot(expected.x,expected.y);
    const windowSamples=samples.filter(s=>s.at>=due-early-100&&s.at<=now);
    // Para aceitar movimento deve haver ao menos duas imagens suficientemente separadas.
    const earliest=windowSamples.find(s=>now-s.at>=Math.min(95,interval*.12));
    if(!earliest)break;
    const gesture={x:point.x-earliest.point.x,y:point.y-earliest.point.y};
    const moved=Math.hypot(gesture.x,gesture.y);
    const projected=(gesture.x*expected.x+gesture.y*expected.y)/expectedLength;
    const agreement=moved>0?projected/moved:0;
    const closeEnough=distance(point,target)<=125*reach;
    // Caminho livre: mesmo sem tocar o alvo, uma trajetória coerente e ampla conta.
    const freePath=projected>=56/reach;
    const valid=moved>=34/reach&&projected>=24/reach&&agreement>=.38&&(closeEnough||freePath);
    if(valid){
      errors=[...errors,Math.abs(now-due)/interval];recorded=[...recorded,true];hits++;
      if(next%meter===0)downbeats++;
      next++;
    }
    break;
  }
  return {next,hits,misses,downbeats,errors,recorded,finished:next>=count,samples};
}
export function scoreGesture(progress:GestureProgress,meter:Meter,measures:number){
  const total=meter*measures;
  const precision=total?Math.round(progress.hits/total*100):0;
  const rhythm=progress.errors.length?Math.round(clamp(1-progress.errors.reduce((a,b)=>a+b,0)/progress.errors.length/.62,0,1)*100):0;
  const passed=precision>=65&&progress.downbeats>=Math.ceil(measures/2);
  return {precision,rhythm,passed,stars:precision>=92?3:precision>=78?2:passed?1:0};
}
