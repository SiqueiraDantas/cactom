import { LESSONS, type Lesson } from './curriculum.ts';
import { recorderLessons, RECORDER_HOLES, type RecorderSystem } from './recorder.ts';
export type CourseUnit={title:string;description:string;from:number;to:number};
export function courseFor(instrumentId:string,system:RecorderSystem='baroque'):{
  lessons:readonly Lesson[];units:readonly CourseUnit[];discoveryIds:readonly number[];discoveryName:string;
}{
  const recorder=instrumentId==='recorder-soprano';
  return {lessons:recorder?recorderLessons(system):LESSONS,discoveryIds:recorder?RECORDER_HOLES:[1,2,3],discoveryName:recorder?'furos':'pistos',
    units:[{title:recorder?'Primeiros sons na flauta doce':'Primeiros passos com o trompete',description:'Conheça seu instrumento e descubra suas primeiras notas.',from:0,to:recorder?4:5},
      {title:'Uma nota puxa a outra',description:'Conecte as notas e explore suas primeiras melodias.',from:recorder?4:5,to:recorder?8:9},
      {title:'Entre no ritmo',description:recorder?'Novas notas, pulsos e pausas.':'Descubra o pulso, as figuras musicais e as pausas.',from:recorder?8:9,to:13}]};
}
export function progressStorageKey(instrumentId:string):string{return instrumentId==='recorder-soprano'?'mis-music-lab-recorder-v1':'mis-music-lab-v03';}
export function isDiscovery(lesson:Lesson):boolean{return lesson.id==='pistos'||!!lesson.discoveryHoles;}
