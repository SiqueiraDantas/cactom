/** Utilities for a Bb trumpet. Written C4 sounds concert Bb3. */
export type PracticeNote = {
  id: string;
  writtenMidi: number;
  label: string;
  valveDescription: string;
  valves: readonly number[];
  holes?: readonly number[];
  transposeSemitones?: number;
};

export const TRUMPET_TRANSPOSE_SEMITONES = -2;

export const BEGINNER_NOTES: readonly PracticeNote[] = [
  { id: 'C4', writtenMidi: 60, label: 'Dó 4', valveDescription: 'Aberto (0)', valves: [] },
  { id: 'D4', writtenMidi: 62, label: 'Ré 4', valveDescription: '1 + 3', valves: [1, 3] },
  { id: 'E4', writtenMidi: 64, label: 'Mi 4', valveDescription: '1 + 2', valves: [1, 2] },
  { id: 'F4', writtenMidi: 65, label: 'Fá 4', valveDescription: '1', valves: [1] },
  { id: 'G4', writtenMidi: 67, label: 'Sol 4', valveDescription: 'Aberto (0)', valves: [] },
];

const PT_NAMES = ['Dó', 'Dó♯', 'Ré', 'Mi♭', 'Mi', 'Fá', 'Fá♯', 'Sol', 'Lá♭', 'Lá', 'Si♭', 'Si'];

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

export function frequencyToMidi(frequency: number): number | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  return 69 + 12 * Math.log2(frequency / 440);
}

export function writtenToConcertMidi(writtenMidi: number): number {
  return writtenMidi + TRUMPET_TRANSPOSE_SEMITONES;
}

export function concertToWrittenMidi(concertMidi: number): number {
  return concertMidi - TRUMPET_TRANSPOSE_SEMITONES;
}

export function formatWrittenNote(midi: number): string {
  const rounded = Math.round(midi);
  const name = PT_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return `${name} ${octave}`;
}

export function centsBetween(frequency: number, targetFrequency: number): number {
  if (frequency <= 0 || targetFrequency <= 0) return 0;
  return 1200 * Math.log2(frequency / targetFrequency);
}

export function targetFrequencyFor(note: PracticeNote): number {
  return midiToFrequency(note.writtenMidi+(note.transposeSemitones??TRUMPET_TRANSPOSE_SEMITONES));
}

export function evaluatePitch(frequency: number, note: PracticeNote, toleranceCents = 30): {
  cents: number;
  correctNote: boolean;
  inTune: boolean;
  detectedWritten: string;
} {
  const target = targetFrequencyFor(note);
  const cents = centsBetween(frequency, target);
  const detectedMidi = frequencyToMidi(frequency);
  const transpose=note.transposeSemitones??TRUMPET_TRANSPOSE_SEMITONES;
  const detectedWritten = detectedMidi === null ? '—' : formatWrittenNote(detectedMidi-transpose);
  return {
    cents,
    correctNote: detectedMidi !== null && Math.round(detectedMidi) === note.writtenMidi+transpose,
    inTune: Math.abs(cents) <= toleranceCents,
    detectedWritten,
  };
}
