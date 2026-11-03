import test from 'node:test';
import assert from 'node:assert/strict';
import {PitchDetector} from 'pitchy';
import {scoreSoundBar,recorderRhythmSample,recorderQuietThreshold} from '../src/lib/guidedRhythm.ts';
import {targetFrequencyFor} from '../src/lib/music.ts';
import {barEvents} from '../src/lib/pulseAssessment.ts';
import {recorderLessons} from '../src/lib/recorder.ts';
const lessons=recorderLessons(),twelve=lessons[11].steps,thirteen=lessons[12].steps;
const quiet={rms:.001,clarity:0,frequency:null,status:'quiet'};
const tone={rms:.06,clarity:.98,frequency:880,status:'pitched'};
const noise={rms:.04,clarity:.2,frequency:null,status:'unpitched'};
function frame(at,signal,threshold=.008){
 const sample=signal.status==='pitched'?{frequency:signal.frequency,rms:signal.rms,clarity:signal.clarity,timestamp:at}:null;
 return recorderRhythmSample(sample,signal,at,threshold);
}
const frames=(fn,bpm=60)=>Array.from({length:Math.ceil(240000/bpm/90)+2},(_,i)=>frame(10000+i*90,fn(i*90)));
const verdicts=(steps,samples,bpm=60)=>scoreSoundBar(steps,samples,bpm,10000).map(v=>v.passed);
function correctInput(steps,t,bpm=60,cents=0){
 const event=barEvents(steps,bpm,0).find(e=>t>=e.start&&t<e.end);
 return !event||event.step.kind==='rest'?quiet:{...tone,frequency:targetFrequencyFor(event.step.note)*2**(cents/1200)};
}

test('silence and unpitched noise cannot approve notes; real silence approves the written rest',()=>{
 assert.deepEqual(verdicts(twelve,frames(()=>quiet)),[false,false,false,false]);
 assert.deepEqual(verdicts(twelve,frames(()=>noise)),[false,false,false,false]);
 assert.deepEqual(verdicts(thirteen,frames(()=>quiet)),[false,true,false]);
 assert.deepEqual(verdicts(thirteen,frames(()=>noise)),[false,false,false]);
});
test('four written notes accept the indicated pitches without invented rests',()=>{
 assert.deepEqual(verdicts(twelve,frames(t=>correctInput(twelve,t))),[true,true,true,true]);
});
test('Sol instead of Si fails, but the written pause and correct A still pass',()=>{
 const played=frames(t=>t<2000?{...tone,frequency:targetFrequencyFor(twelve[2].note)}:correctInput(thirteen,t));
 const results=scoreSoundBar(thirteen,played,60,10000);
 assert.deepEqual(results.map(v=>v.passed),[false,true,true]);
 assert.equal(results[0].reason,'note');
 assert.match(results[0].message,/Si 4/);
});
test('small detuning is accepted, but semitones and wrong octaves are rejected',()=>{
 for(const cents of [-60,-45,0,45,60])assert.deepEqual(verdicts(twelve,frames(t=>correctInput(twelve,t,60,cents))),[true,true,true,true]);
 for(const cents of [-1200,-100,-70,70,100,1200])assert.deepEqual(verdicts(twelve,frames(t=>correctInput(twelve,t,60,cents))),[false,false,false,false]);
});
test('a brief correct pitch or an average of wrong pitches cannot approve the written note',()=>{
 const short=frames(t=>t<2000?{...tone,frequency:targetFrequencyFor(thirteen[0].note)*2**((t<300?0:-400)/1200)}:correctInput(thirteen,t));
 assert.equal(verdicts(thirteen,short)[0],false);
 const mixed=frames(t=>({...tone,frequency:targetFrequencyFor(twelve[Math.min(3,Math.floor(t/1000))].note)*2**((t%180===0?-200:200)/1200)}));
 assert.deepEqual(verdicts(twelve,mixed),[false,false,false,false]);
});
test('2+1+1 follows the score at 45, 60 and 120 BPM',()=>{
 for(const bpm of [45,60,120]){
  assert.deepEqual(verdicts(thirteen,frames(t=>correctInput(thirteen,t,bpm),bpm),bpm),[true,true,true]);
 }
 assert.equal(verdicts(thirteen,frames(()=>tone))[1],false);
 assert.equal(verdicts(thirteen,frames(t=>t<300?tone:quiet))[0],false);
});
test('unavailable, invalid or missing input cannot count as a played note or a performed rest',()=>{
 for(const signal of [{...quiet,status:'inactive'},{...quiet,rms:NaN}]){
  assert.deepEqual(verdicts(thirteen,frames(()=>signal)),[false,false,false]);
 }
 assert.deepEqual(verdicts(thirteen,[]),[false,false,false]);
 assert.deepEqual(verdicts(twelve,[frame(10200,tone)]),[false,false,false,false]);
 assert.deepEqual(verdicts(twelve,[frame(10330,tone)],120),[false,false,false,false]);
});
test('ambient floor recognizes room silence without approving its steady noise as notes',()=>{
 const threshold=recorderQuietThreshold([.006,.0062,.0061,.006,.0063,.0061],.008);
 assert.ok(threshold>.012);
 const room={...noise,rms:.0062};
 assert.deepEqual(verdicts(thirteen,frames(()=>room).map(s=>frame(s.at,room,threshold))),[false,true,false]);
 assert.throws(()=>recorderQuietThreshold([.001],.008));
 assert.throws(()=>recorderQuietThreshold([NaN,NaN,NaN,NaN],.008));
});
test('click-frequency or unclear sound is not an instrumental note',()=>{
 for(const signal of [{...tone,frequency:1450},{...tone,frequency:1800},{...tone,clarity:.3},{...tone,frequency:0},{...tone,frequency:NaN}]){
  assert.deepEqual(verdicts(twelve,frames(()=>signal)),[false,false,false,false]);
 }
});
test('even a tonal artefact restricted to click windows cannot approve a note or invalidate the pause',()=>{
 for(const bpm of [45,60,120]){
  const beat=60000/bpm;
  const clicks=frames(t=>t%beat<180?tone:quiet,bpm);
  assert.deepEqual(verdicts(twelve,clicks,bpm),[false,false,false,false]);
  assert.deepEqual(verdicts(thirteen,clicks,bpm),[false,true,false]);
 }
});

/** Synthetic waveform through the same Pitchy detector, not real hardware validation. */
function detectedPerformance(frequencyAt,bpm){
 const sampleRate=44100,size=4096,detector=PitchDetector.forFloat32Array(size),buffer=new Float32Array(size),beat=60000/bpm;
 const result=[];
 for(let t=0;t<4*beat+180;t+=90){
  for(let i=0;i<size;i++){
   const at=t-(size-1-i)*1000/sampleRate;
   const wanted=at>=0?frequencyAt(at):null;
   let value=wanted?Math.sin(2*Math.PI*wanted*at/1000)*.13:0;
   if(at>=0){
    const beatIndex=Math.floor(at/beat),phase=(at-beatIndex*beat)/1000;
    if(phase<.05){
     const peak=beatIndex%4===0?.144:.084;
     const gain=phase<.004?.0001*Math.pow(peak/.0001,phase/.004):phase<.038?peak*Math.pow(.0001/peak,(phase-.004)/.034):.0001;
     value+=Math.sin(2*Math.PI*(beatIndex%4===0?1800:1450)*phase)*gain;
    }
   }
   buffer[i]=value;
  }
  const rms=Math.sqrt(buffer.reduce((sum,n)=>sum+n*n,0)/size);
  const [frequency,clarity]=rms>=.008?detector.findPitch(buffer,sampleRate):[0,0];
  const status=rms<.008?'quiet':frequency>=160&&frequency<=1400&&clarity>=.85?'pitched':'unpitched';
  result.push(frame(10000+t,{rms,clarity,frequency,status}));
 }
 return result;
}
test('synthetic loud metronome through Pitchy cannot complete either activity; the pause remains valid',()=>{
 for(const bpm of [60,120]){
  const clicks=detectedPerformance(()=>null,bpm);
  assert.deepEqual(verdicts(twelve,clicks,bpm),[false,false,false,false]);
  assert.deepEqual(verdicts(thirteen,clicks,bpm),[false,true,false]);
 }
});
test('synthetic recorder tone plus clicks passes 2+1+1 with a genuine quiet third beat',()=>{
 for(const bpm of [60,120]){
  assert.deepEqual(verdicts(thirteen,detectedPerformance(t=>correctInput(thirteen,t,bpm).frequency,bpm),bpm),[true,true,true]);
 }
});

test('synthetic Sol in place of Si is rejected through Pitchy, even at the right time',()=>{
 for(const bpm of [60,120]){
  const beat=60000/bpm;
  const detected=detectedPerformance(t=>t<2*beat?targetFrequencyFor(twelve[2].note):correctInput(thirteen,t,bpm).frequency,bpm);
  assert.deepEqual(verdicts(thirteen,detected,bpm),[false,true,true]);
 }
});
test('synthetic recorder sequence 12 keeps four adjacent notes with small detuning, without extra silence',()=>{
 for(const bpm of [60,120])for(const cents of [-45,45]){
  const detected=detectedPerformance(t=>correctInput(twelve,t,bpm,cents).frequency,bpm);
  assert.deepEqual(verdicts(twelve,detected,bpm),[true,true,true,true]);
 }
});
