import { evaluatePitch, type PracticeNote } from './music.ts';

export type AcousticReading = { frequency: number; clarity: number; rms: number; timestamp: number };
export type ReadingStatus = 'silence' | 'wrong-note' | 'out-of-tune' | 'unstable' | 'valid';
export type ReadingResult = { status: ReadingStatus; valid: boolean; cents: number | null; detected: string | null; jitter: number | null };

// History of already plausible target pitches, only used to estimate short-term stability.
export function recentJitter(cents: readonly number[]): number | null {
  if (cents.length < 4) return null;
  const mean = cents.reduce((sum,x)=>sum+x,0)/cents.length;
  return Math.sqrt(cents.reduce((sum,x)=>sum+(x-mean)**2,0)/cents.length);
}

export function checkReading(
  sample: AcousticReading | null,
  target: PracticeNote,
  centsHistory: readonly number[],
  toleranceCents: number,
  stabilityLimitCents: number,
): ReadingResult {
  if(!sample || sample.clarity < 0.85 || sample.rms < 0.008 || !Number.isFinite(sample.frequency)) {
    return { status:'silence', valid:false, cents:null, detected:null, jitter:null };
  }
  const result = evaluatePitch(sample.frequency,target,toleranceCents);
  if(!result.correctNote) return { status:'wrong-note', valid:false, cents:result.cents, detected:result.detectedWritten, jitter:null };
  if(!result.inTune) return { status:'out-of-tune', valid:false, cents:result.cents, detected:result.detectedWritten, jitter:null };
  const jitter = recentJitter([...centsHistory, result.cents].slice(-8));
  if(jitter!==null && jitter>stabilityLimitCents) return { status:'unstable', valid:false, cents:result.cents, detected:result.detectedWritten, jitter };
  return { status:'valid', valid:true, cents:result.cents, detected:result.detectedWritten, jitter };
}

export function analysisGuidance(status: ReadingStatus, cents: number | null, targetLabel: string, detected: string | null): { title:string; description:string; tone:'neutral'|'positive'|'warning'|'negative' } {
  switch(status){
    case 'valid': return { title:'Muito bem! Continue assim.', description:'Nota certa e afinação dentro da faixa. Sustente o som até completar o círculo.', tone:'positive' };
    case 'wrong-note': return { title:`Você tocou ${detected??'outra nota'}`, description:`Estamos procurando ${targetLabel}. Confira a altura e a digitação indicada.`, tone:'negative' };
    case 'out-of-tune': return { title:(cents??0)>0?'Um pouco agudo':'Um pouco grave', description:'Ajuste suavemente o som em direção ao centro do afinador. Não force.', tone:'warning' };
    case 'unstable': return { title:'Encontre um som mais regular', description:'A altura está oscilando. Faça uma pausa e tente manter a nota confortável.', tone:'warning' };
    default: return { title:'Pronto para ouvir você', description:'Ative o microfone, toque a nota indicada e mantenha o som contínuo.', tone:'neutral' };
  }
}
