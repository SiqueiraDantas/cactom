import type {PitchSample,SignalSnapshot} from './audio';
type Input={stop:()=>Promise<void>;listen:(sample:(value:PitchSample)=>void,signal:(value:SignalSnapshot)=>void)=>void};
type Guide={stop:()=>void;play:()=>Promise<boolean>};
/** Owns one resource at a time, including resources granted after cancellation. */
export class ModuleOneMedia{
 private generation=0;
 private input:Input|null=null;
 private readonly createInput:()=>Promise<Input>;
 private readonly guide:Guide;
 constructor(createInput:()=>Promise<Input>,guide:Guide){this.createInput=createInput;this.guide=guide;}
 stop(){this.generation++;this.guide.stop();const input=this.input;this.input=null;if(input)void input.stop().catch(()=>{});}
 async playGuide():Promise<boolean>{
  this.stop();const token=this.generation;
  try{const finished=await this.guide.play();return token===this.generation&&finished;}
  catch(error){if(token!==this.generation)return false;this.stop();throw error;}
 }
 async openMicrophone(onSample:(value:PitchSample)=>void,onSignal:(value:SignalSnapshot)=>void):Promise<boolean>{
  this.stop();const token=this.generation;
  let input:Input;
  try{input=await this.createInput();}catch(error){if(token!==this.generation)return false;throw error;}
  if(token!==this.generation){await input.stop().catch(()=>{});return false;}
  this.input=input;
  try{input.listen(sample=>{if(this.input===input&&token===this.generation)onSample(sample);},signal=>{if(this.input===input&&token===this.generation)onSignal(signal);});}
  catch(error){this.stop();throw error;}
  return token===this.generation&&this.input===input;
 }
}
