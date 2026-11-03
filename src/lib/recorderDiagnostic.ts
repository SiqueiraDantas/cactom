import type {KeyValueStorage} from './profileStorage';

export const RECORDER_DIAGNOSTIC_KEY='cactom-recorder-discipline-v1';
export const DIAGNOSTIC_IDS=['D01','D02','D03','D04','D05','D06','D07','D08'] as const;
export type DiagnosticId=(typeof DIAGNOSTIC_IDS)[number];
const support=[{value:'sozinho',label:'Fiz sem ajuda'},{value:'pistas',label:'Fiz com algumas pistas'},{value:'apoio',label:'Precisei de ajuda'},{value:'depois',label:'Quero tentar com alguém me acompanhando'}];
export const DIAGNOSTIC_TASKS=[
 {id:'D01',title:'Encontre o tempo',instruction:'Ouça oito tempos e acompanhe com palmas. Se preferir, marque os tempos no botão da tela.',hint:'Procure seguir o espaço entre os sons, sem correr.',sound:true,tapping:true,choices:[...support,{value:'sem-audio',label:'Estou sem áudio agora'}]},
 {id:'D02',title:'Um ritmo para repetir',instruction:'Ouça o ritmo de quatro tempos. Depois repita com palmas ou toques na tela.',hint:'Você pode ouvir o modelo mais de uma vez antes de responder.',sound:true,tapping:true,choices:[...support,{value:'sem-audio',label:'Estou sem áudio agora'}]},
 {id:'D03',title:'Qual som é mais agudo?',instruction:'Ouça os dois sons. Qual deles parece mais agudo?',hint:'Compare o primeiro som com o segundo. Não precisa saber o nome das notas.',sound:true,tapping:false,choices:[{value:'primeiro',label:'O primeiro som'},{value:'segundo',label:'O segundo som'},{value:'sem-audio',label:'Estou sem áudio agora'}]},
 {id:'D04',title:'Para onde a música vai?',instruction:'Ouça as três notas. O caminho dos sons sobe, desce ou fica na mesma altura?',hint:'Imagine a direção do som, sem precisar ler uma partitura.',sound:true,tapping:false,choices:[{value:'sobe',label:'Sobe'},{value:'desce',label:'Desce'},{value:'repete',label:'Fica na mesma altura'},{value:'sem-audio',label:'Estou sem áudio agora'}]},
 {id:'D05',title:'Faça um pequeno eco',instruction:'Ouça a frase e imite com a voz ou outro recurso que seja confortável para você.',hint:'Sua voz pode usar outra oitava. Aqui queremos conhecer seu ponto de partida.',sound:true,tapping:false,choices:[...support,{value:'sem-audio',label:'Estou sem áudio agora'}]},
 {id:'D06',title:'Como a flauta cabe nas suas mãos?',instruction:'Segure sua flauta com a mão esquerda em cima. Com quem acompanha você, confira se seus dedos alcançam os furos sem forçar.',hint:'Se não alcançar com conforto, peça ajuda para ajustar o instrumento ou o percurso.',sound:false,tapping:false,choices:[{value:'confortavel',label:'Alcanço os furos com conforto'},{value:'ajustar',label:'Preciso ajustar com quem me acompanha'},{value:'sem-instrumento',label:'Estou sem instrumento agora'}]},
 {id:'D07',title:'Experimente seu primeiro som',instruction:'Depois de ouvir o exemplo, experimente um som suave. Para o Si, feche o polegar esquerdo atrás e o primeiro furo da frente.',hint:'O exemplo eletrônico mostra a altura. Mãos, emissão e conforto precisam de acompanhamento presencial.',sound:true,tapping:false,choices:[{value:'tentei',label:'Experimentei produzir o som'},{value:'apoio',label:'Quero tentar com ajuda'},{value:'sem-instrumento',label:'Estou sem instrumento agora'},{value:'sem-audio',label:'Estou sem áudio agora'}]},
 {id:'D08',title:'A música que você traz',instruction:'Conte um pouco da sua experiência. Se quiser, diga uma música que gostaria de aprender.',hint:'Você pode apresentar uma música conhecida a quem está com você. Não precisa gravar nem enviar nada.',sound:false,tapping:false,choices:[{value:'primeiro-contato',label:'Este é meu primeiro contato'},{value:'ja-experimentei',label:'Já experimentei música ou outro instrumento'},{value:'ja-toco',label:'Já toco algumas músicas'}]},
] as const;

export type DiagnosticResponse={id:DiagnosticId;at:string;choice:string;modelPlayed:boolean;tapOffsetsMs:number[];toneDetected:boolean;interest?:string};
export type DiagnosticLedger={version:1;courseId:'recorder-discipline-v1';responses:Partial<Record<DiagnosticId,DiagnosticResponse>>};
export const emptyDiagnostic=():DiagnosticLedger=>({version:1,courseId:'recorder-discipline-v1',responses:{}});
export function normalizeDiagnosticResponse(value:unknown):DiagnosticResponse|null{
 if(!value||typeof value!=='object')return null;
 const record=value as Partial<DiagnosticResponse>,task=DIAGNOSTIC_TASKS.find(item=>item.id===record.id);
 if(!task||typeof record.at!=='string'||!Number.isFinite(Date.parse(record.at))||!task.choices.some(option=>option.value===record.choice)||typeof record.modelPlayed!=='boolean'||typeof record.toneDetected!=='boolean'||!Array.isArray(record.tapOffsetsMs)||record.tapOffsetsMs.length>32)return null;
 if(record.tapOffsetsMs.some((time,index,list)=>!Number.isFinite(time)||time<0||time>60000||index>0&&time<list[index-1]))return null;
 return {id:task.id,at:record.at,choice:record.choice!,modelPlayed:record.modelPlayed,tapOffsetsMs:task.tapping?[...record.tapOffsetsMs]:[],toneDetected:task.id==='D07'&&record.toneDetected,...(task.id==='D08'&&typeof record.interest==='string'?{interest:record.interest.trim().slice(0,120)}:{})};
}
export function readDiagnostic(storage:KeyValueStorage):{ledger:DiagnosticLedger;safeToWrite:boolean;warning:string}{
 const unavailable={ledger:emptyDiagnostic(),safeToWrite:false,warning:'O histórico deste diagnóstico não pôde ser lido. Suas respostas ficarão nesta sessão.'};
 try{
  const raw=storage.getItem(RECORDER_DIAGNOSTIC_KEY);
  if(raw===null)return {ledger:emptyDiagnostic(),safeToWrite:true,warning:''};
  if(raw.length>75000)return unavailable;
  const parsed=JSON.parse(raw) as Partial<DiagnosticLedger>;
  if(!parsed||parsed.version!==1||parsed.courseId!=='recorder-discipline-v1'||!parsed.responses||typeof parsed.responses!=='object'||Array.isArray(parsed.responses))return unavailable;
  const ledger=emptyDiagnostic();
  for(const [key,value] of Object.entries(parsed.responses)){
   const record=normalizeDiagnosticResponse(value);
   if(!record||record.id!==key)return unavailable;
   ledger.responses[record.id]=record;
  }
  return {ledger,safeToWrite:true,warning:''};
 }catch{return unavailable;}
}
export function recordDiagnostic(ledger:DiagnosticLedger,response:DiagnosticResponse):DiagnosticLedger{
 const normalized=normalizeDiagnosticResponse(response);
 if(!normalized)throw new Error('Resposta de diagnóstico inválida.');
 return {...ledger,responses:{...ledger.responses,[normalized.id]:normalized}};
}
export function diagnosticChoiceMatch(response:DiagnosticResponse):boolean|null{
 if(!response.modelPlayed||response.choice==='sem-audio')return null;
 return response.id==='D03'?response.choice==='segundo':response.id==='D04'?response.choice==='desce':null;
}
