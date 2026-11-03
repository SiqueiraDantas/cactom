import { PitchDetector } from 'pitchy';

export type PitchSample = {
  frequency: number;
  clarity: number;
  rms: number;
  timestamp: number;
} | null;
export type SignalSnapshot={rms:number;clarity:number;frequency:number|null;status:'quiet'|'unpitched'|'pitched'|'inactive'};
export type MicrophoneOptions={deviceId?:string;minimumRms?:number};

/**
 * Iteration-1 acoustic input: AnalyserNode + Pitchy.
 * Processing will move to AudioWorklet in task AUD-05 after field validation.
 * Raw audio is processed only in-memory; nothing is sent to a server or recorded.
 */
export class MicrophonePitchMonitor {
  private readonly context: AudioContext;
  private readonly analyser: AnalyserNode;
  private readonly source: MediaStreamAudioSourceNode;
  private readonly stream: MediaStream;
  private readonly detector = PitchDetector.forFloat32Array(4096);
  private readonly buffer = new Float32Array(4096);
  private timer: number | null = null;
  get active():boolean{return this.context.state==='running'&&this.stream.getAudioTracks().some(track=>track.readyState==='live');}
  get label():string{return this.stream.getAudioTracks()[0]?.label||'Microfone padrão';}
  private readonly minimumRms:number;

  private constructor(stream: MediaStream, context: AudioContext,minimumRms=.008) {
    this.minimumRms=Math.min(.03,Math.max(.002,Number.isFinite(minimumRms)?minimumRms:.008));
    this.stream = stream;
    this.context = context;
    this.source = context.createMediaStreamSource(stream);
    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0;
    this.source.connect(this.analyser);
    // No connection to speakers: avoids monitoring feedback.
  }

  static async create(options:MicrophoneOptions={}): Promise<MicrophonePitchMonitor> {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('Este navegador não permite acessar o microfone neste contexto. Abra em localhost ou HTTPS.');
    }
    let stream:MediaStream;
    try{stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false,channelCount:{ideal:1},...(options.deviceId?{deviceId:{exact:options.deviceId}}:{}) },
      video: false,
    });}catch(error){
      const name=error instanceof DOMException?error.name:'';
      throw new Error(name==='NotAllowedError'?'O microfone não foi autorizado. Permita o acesso no navegador e tente novamente.':name==='NotFoundError'?'Nenhum microfone foi encontrado. Conecte um dispositivo e tente novamente.':name==='NotReadableError'?'O microfone está ocupado ou indisponível. Feche outros aplicativos que o utilizam.':'Não foi possível iniciar o microfone. Confira as permissões e tente novamente.');
    }
    let context:AudioContext|null=null;
    try {
      context = new AudioContext();
      await context.resume();
      return new MicrophonePitchMonitor(stream, context,options.minimumRms);
    } catch (error) {
      stream.getTracks().forEach((track) => track.stop());
      if(context)void context.close().catch(()=>{});
      throw error;
    }
  }

  listen(onSample: (sample: PitchSample) => void,onSignal?:(signal:SignalSnapshot)=>void): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      if(!this.active){onSignal?.({rms:0,clarity:0,frequency:null,status:'inactive'});onSample(null);return;}
      this.analyser.getFloatTimeDomainData(this.buffer);
      let sum = 0;
      for (const x of this.buffer) sum += x * x;
      const rms = Math.sqrt(sum / this.buffer.length);
      if (rms < this.minimumRms) {
        onSignal?.({rms,clarity:0,frequency:null,status:'quiet'});
        onSample(null);
        return;
      }
      const [frequency, clarity] = this.detector.findPitch(this.buffer, this.context.sampleRate);
      const inRange = frequency >= 160 && frequency <= 1400;
      onSignal?.({rms,clarity,frequency:inRange&&Number.isFinite(frequency)?frequency:null,status:inRange&&Number.isFinite(frequency)&&clarity>=.85?'pitched':'unpitched'});
      if (!inRange || !Number.isFinite(frequency) || clarity < 0.85) {
        onSample(null);
        return;
      }
      onSample({ frequency, clarity, rms, timestamp: performance.now() });
    }, 90);
  }

  async stop(): Promise<void> {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.source.disconnect();
    this.analyser.disconnect();
    this.stream.getTracks().forEach((track) => track.stop());
    if(this.context.state!=='closed')await this.context.close();
  }
}
