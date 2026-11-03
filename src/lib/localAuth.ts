export type LocalProfile={id:string;username:string;name:string};
type LocalAccount=LocalProfile&{salt:string;passwordHash:string;iterations:number;createdAt:string};
type AccountStorage=Pick<Storage,'getItem'|'setItem'>;
export const ACCOUNTS_KEY='mis-music-lab-local-accounts-v1';
export const KDF_ITERATIONS=600000;
const USERNAME=/^[\p{L}\p{N}][\p{L}\p{N}._-]{2,31}$/u;
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
export function normalizeUsername(value:string):string{return value.normalize('NFKC').trim().toLocaleLowerCase('pt-BR');}
function validAccount(value:unknown):value is LocalAccount{
  if(!value||typeof value!=='object')return false;const a=value as Partial<LocalAccount>;
  return typeof a.id==='string'&&UUID.test(a.id)&&typeof a.username==='string'&&USERNAME.test(a.username)&&a.username===normalizeUsername(a.username)&&typeof a.name==='string'&&a.name.trim().length>0&&a.name.length<=40&&typeof a.salt==='string'&&/^[a-f0-9]{32}$/.test(a.salt)&&typeof a.passwordHash==='string'&&/^[a-f0-9]{64}$/.test(a.passwordHash)&&a.iterations===KDF_ITERATIONS&&typeof a.createdAt==='string'&&Number.isFinite(Date.parse(a.createdAt));
}
function accounts(storage:AccountStorage):LocalAccount[]{
  let raw:string|null;try{raw=storage.getItem(ACCOUNTS_KEY);}catch{throw new Error('O navegador não permitiu ler as contas locais. Você pode experimentar a demo.');}
  if(raw===null)return [];
  try{
    const values:unknown=JSON.parse(raw);
    if(!Array.isArray(values)||values.length>20||!values.every(validAccount)||new Set(values.map(a=>a.username)).size!==values.length||new Set(values.map(a=>a.id)).size!==values.length)throw new Error();
    return values;
  }catch{throw new Error('Não foi possível ler os cadastros locais. Seus dados não foram substituídos; a demo continua disponível.');}
}
function cryptoApi():Crypto{if(!globalThis.crypto?.subtle)throw new Error('O login local precisa de localhost ou HTTPS neste navegador. A demo continua disponível.');return globalThis.crypto;}
const hex=(bytes:Uint8Array)=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
async function derive(password:string,salt:Uint8Array<ArrayBuffer>):Promise<string>{
  const api=cryptoApi(),key=await api.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await api.subtle.deriveBits({name:'PBKDF2',salt,iterations:KDF_ITERATIONS,hash:'SHA-256'},key,256);
  return hex(new Uint8Array(bits));
}
function profile(a:LocalAccount):LocalProfile{return {id:a.id,username:a.username,name:a.name};}
function equalHash(a:string,b:string):boolean{let mismatch=a.length^b.length;for(let i=0;i<a.length;i++)mismatch|=a.charCodeAt(i)^(b.charCodeAt(i)||0);return mismatch===0;}
export async function createLocalAccount(input:{name:string;username:string;password:string;confirmation:string},storage:AccountStorage=localStorage):Promise<LocalProfile>{
  const name=input.name.trim(),username=normalizeUsername(input.username),password=input.password;
  if(!name||name.length>40)throw new Error('Informe um nome ou apelido de até 40 caracteres.');
  if(!USERNAME.test(username))throw new Error('Use um usuário de 3 a 32 caracteres: letras, números, ponto, hífen ou sublinhado, sem espaços.');
  if(password.length<8||password.length>128||!password.trim())throw new Error('Escolha uma senha de 8 a 128 caracteres.');
  if(password!==input.confirmation)throw new Error('As senhas precisam ser iguais.');
  const previous=accounts(storage);
  if(previous.some(a=>a.username===username))throw new Error('Esse usuário já existe neste navegador. Escolha outro ou entre na sua conta.');
  if(previous.length>=20)throw new Error('Este navegador já tem 20 contas de teste. Use uma conta existente ou experimente a demo.');
  const api=cryptoApi(),salt=api.getRandomValues(new Uint8Array(16)),passwordHash=await derive(password,salt);
  const record:LocalAccount={id:api.randomUUID(),name,username,salt:hex(salt),passwordHash,iterations:KDF_ITERATIONS,createdAt:new Date().toISOString()};
  const commit=()=>{
    const latest=accounts(storage);
    if(latest.some(a=>a.username===username))throw new Error('Esse usuário já foi criado. Entre na sua conta.');
    if(latest.length>=20)throw new Error('O limite de contas locais foi atingido.');
    try{storage.setItem(ACCOUNTS_KEY,JSON.stringify([...latest,record]));}catch{throw new Error('Não foi possível salvar a conta neste navegador. Você pode usar a demo.');}
    return profile(record);
  };
  return globalThis.navigator?.locks?globalThis.navigator.locks.request('mis-music-lab-local-register',async()=>commit()):commit();
}
export async function signInLocal(usernameValue:string,password:string,storage:AccountStorage=localStorage):Promise<LocalProfile>{
  const username=normalizeUsername(usernameValue);
  if(!USERNAME.test(username)||!password||password.length>128)throw new Error('Usuário ou senha incorretos.');
  const account=accounts(storage).find(a=>a.username===username);
  // Derive even for an unknown user, keeping the negative response similar.
  const salt=account?Uint8Array.from(account.salt.match(/../g)!,s=>parseInt(s,16)):new Uint8Array(16);
  const hash=await derive(password,salt);
  if(!account||!equalHash(hash,account.passwordHash))throw new Error('Usuário ou senha incorretos.');
  return profile(account);
}
