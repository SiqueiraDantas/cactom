/**
 * Leitor de partitura em imagem (OMR) para melodias simples em clave de Sol.
 * Entrada: página em tons de cinza. Saída: compassos com notas, pausas e ligaduras.
 * Pensado para PDFs feitos em programas de notação e impressões limpas escaneadas;
 * fotos tortas e partituras à mão podem errar, por isso o app sempre mostra a leitura para conferência.
 */
export type GrayImage={width:number;height:number;data:Uint8Array|Uint8ClampedArray};
export type OmrNote={midi:number|null;beats:number;step?:string;octave?:number;alter?:number;tieStart?:boolean;wholeBar?:boolean;x:number;staff:number};
export type OmrMeasure={items:OmrNote[]};
export type OmrStaff={top:number;bottom:number;x0:number;x1:number;space:number;lines:number[]};
export type OmrResult={measures:OmrMeasure[];beats:number;fifths:number;staves:OmrStaff[];warnings:string[];space:number;angle:number};

type Comp={id:number;x0:number;y0:number;x1:number;y1:number;n:number};
type Stem={x0:number;x1:number;y0:number;y1:number};
type Head={x:number;y:number;x0:number;x1:number;y0:number;y1:number;hollow:boolean;stem:Stem|null;up:boolean;comp:number;beams:number;dots:number;acc:number|null};

const STEPS=['C','D','E','F','G','A','B'],SEMI=[0,2,4,5,7,9,11];
const SHARP_ORDER=['F','C','G','D','A','E','B'],FLAT_ORDER=['B','E','A','D','G','C','F'];

export function otsu(data:ArrayLike<number>):number{
 const h=new Float64Array(256);for(let i=0;i<data.length;i++)h[data[i]]++;
 let sum=0;for(let i=0;i<256;i++)sum+=i*h[i];
 let sb=0,wb=0,best=0,t=128;const total=data.length;
 for(let i=0;i<256;i++){wb+=h[i];if(!wb)continue;const wf=total-wb;if(!wf)break;sb+=i*h[i];const mb=sb/wb,mf=(sum-sb)/wf,v=wb*wf*(mb-mf)**2;if(v>best){best=v;t=i;}}
 return t;
}
export function binarize(img:GrayImage):Uint8Array{
 const t=Math.min(200,otsu(img.data)),out=new Uint8Array(img.width*img.height);
 for(let i=0;i<out.length;i++)out[i]=img.data[i]<=t?1:0;return out;
}
/** Inclinação da página (graus), pela projeção horizontal mais "pontuda". */
export function estimateSkew(ink:Uint8Array,w:number,h:number):number{
 const pts:number[]=[];const step=Math.max(1,Math.floor(w*h/1.5e6));
 for(let i=0;i<ink.length;i+=step)if(ink[i])pts.push(i);
 let best=0,bestScore=-1;
 for(let a=-3;a<=3.0001;a+=.1){
  const t=Math.tan(a*Math.PI/180),bins=new Float64Array(h+2);
  for(const p of pts){const x=p%w,y=(p-x)/w,yy=Math.round(y-x*t);if(yy>=0&&yy<h)bins[yy]++;}
  let s=0;for(let i=0;i<h;i++)s+=bins[i]*bins[i];
  if(s>bestScore){bestScore=s;best=a;}
 }
 return Math.abs(best)<.05?0:best;
}
function rotate(ink:Uint8Array,w:number,h:number,deg:number):Uint8Array{
 if(!deg)return ink;const out=new Uint8Array(w*h),t=Math.tan(deg*Math.PI/180);
 // cisalhamento vertical (suficiente para ângulos pequenos)
 for(let x=0;x<w;x++){const dy=Math.round(x*t);for(let y=0;y<h;y++){const sy=y+dy;if(sy>=0&&sy<h&&ink[sy*w+x])out[y*w+x]=1;}}
 return out;
}
/** Espessura da linha (T) e distância entre linhas (S), pelas corridas verticais. */
export function runLengths(ink:Uint8Array,w:number,h:number):{thickness:number;space:number}{
 const black=new Float64Array(64),pair=new Float64Array(200);
 for(let x=0;x<w;x+=2){let y=0;let lastBlack=-1;
  while(y<h){const v=ink[y*w+x];let e=y;while(e<h&&ink[e*w+x]===v)e++;const len=e-y;
   if(v){if(len<64)black[len]++;if(lastBlack>=0){const white=y-lastBlack;if(white+len<200&&len<12)pair[white+len]++;}lastBlack=-1;lastBlack=e;}
   y=e;}
 }
 let T=1;for(let i=1;i<64;i++)if(black[i]>black[T])T=i;
 let S=4;for(let i=4;i<200;i++)if(pair[i]>pair[S])S=i;
 // pair mede (branco + preto seguinte); com linhas de espessura T, S ≈ distância centro a centro
 return {thickness:T,space:S};
}
function findStaves(ink:Uint8Array,w:number,h:number,T:number,S:number):OmrStaff[]{
 const minRun=Math.max(8,Math.round(3*S)),rows:{y:number;x0:number;x1:number;cov:number}[]=[];
 for(let y=0;y<h;y++){let cov=0,x0=w,x1=0;let x=0;const o=y*w;
  while(x<w){if(!ink[o+x]){x++;continue;}let e=x;while(e<w&&ink[o+e])e++;if(e-x>=minRun){cov+=e-x;if(x<x0)x0=x;if(e>x1)x1=e;}x=e;}
  if(cov>=Math.max(5*S,minRun*1.5))rows.push({y,x0,x1,cov});
 }
 const lines:{y:number;x0:number;x1:number}[]=[];
 for(let i=0;i<rows.length;){let j=i;while(j+1<rows.length&&rows[j+1].y-rows[j].y<=1)j++;
  const all=rows.slice(i,j+1),peak=Math.max(...all.map(r=>r.cov)),g=all.filter(r=>r.cov>=peak*.5);if(g.length&&g[g.length-1].y-g[0].y+1<=Math.max(3,T*2.5))lines.push({y:(g[0].y+g[g.length-1].y)/2,x0:Math.min(...g.map(r=>r.x0)),x1:Math.max(...g.map(r=>r.x1))});i=j+1;}
 if((globalThis as {__omrDebug?:boolean}).__omrDebug)console.log('lines',JSON.stringify(lines.map(l=>Math.round(l.y))),'rows',rows.length);
 const staves:OmrStaff[]=[];
 const usedLine=new Set<number>();
 for(let i=0;i+4<lines.length;i++){
  if(usedLine.has(i))continue;
  // escolhe 5 linhas igualmente espaçadas, pulando traços longos soltos (ligaduras, travessões)
  const chain=[i];let gap=0;
  for(let k=1;k<5;k++){const prev=lines[chain[chain.length-1]];let best=-1,bestErr=Infinity;
   for(let j=chain[chain.length-1]+1;j<lines.length&&lines[j].y-prev.y<S*1.5;j++){const g=lines[j].y-prev.y,ref=gap||S,err=Math.abs(g-ref);if(err<bestErr&&err<=Math.max(1.5,ref*.22)){bestErr=err;best=j;}}
   if(best<0)break;if(!gap)gap=lines[best].y-prev.y;chain.push(best);}
  if(chain.length<5)continue;
  const L=chain.map(k=>lines[k]),gaps=L.slice(1).map((l,k)=>l.y-L[k].y),mean=gaps.reduce((a,b)=>a+b,0)/4;
  if(mean>S*.7&&mean<S*1.35&&gaps.every(g=>Math.abs(g-mean)<=Math.max(1.5,mean*.2))){
   const x0s=L.map(l=>l.x0).sort((a,b)=>a-b),x1s=L.map(l=>l.x1).sort((a,b)=>a-b);
   staves.push({top:L[0].y,bottom:L[4].y,x0:x0s[2],x1:x1s[2],space:mean,lines:L.map(l=>l.y)});
   for(let k=chain[0];k<=chain[4];k++)usedLine.add(k);
  }
 }
 return staves;
}
function removeLines(ink:Uint8Array,w:number,h:number,staves:OmrStaff[],T:number){
 let limit=Math.max(T+1,Math.round(T*1.6));
 const clearAt=(x:number,yc:number,band:number)=>{
  for(let y=Math.max(0,Math.floor(yc-band));y<=Math.min(h-1,Math.ceil(yc+band));y++){
   if(!ink[y*w+x])continue;let a=y,b=y;while(a>0&&ink[(a-1)*w+x])a--;while(b<h-1&&ink[(b+1)*w+x])b++;
   if(b-a+1<=limit)for(let k=a;k<=b;k++)ink[k*w+x]=0;
  }
 };
 for(const s of staves){
  // em PDF que é imagem (escaneado), a linha pode sair mais grossa que a espessura típica medida
  limit=Math.max(T+1,Math.round(T*1.6),Math.round(s.space*.16));let band=Math.max(T/2+1.5,limit/2+1);
  // espessura real de cada linha (percentil 75 das colunas); linha borrada de escaneado sai mais grossa
  const runs:number[]=[];
  for(const yc of s.lines)for(let x=s.x0;x<=s.x1;x+=3){const y=Math.round(yc);if(!ink[y*w+x])continue;let a=y,b=y;while(a>0&&ink[(a-1)*w+x])a--;while(b<h-1&&ink[(b+1)*w+x])b++;runs.push(b-a+1);}
  runs.sort((p,q)=>p-q);const p75=runs.length?runs[Math.floor(runs.length*.75)]:0;
  if(p75>=limit&&p75<=s.space*.3){limit=p75+1;band=Math.max(band,limit/2+1);}
  for(const yc of s.lines)for(let x=Math.max(0,s.x0-2);x<=Math.min(w-1,s.x1+2);x++)clearAt(x,yc,band);
  // linhas suplementares: segmentos curtos e finos acima/abaixo da pauta
  for(let k=1;k<=4;k++)for(const yc of [s.top-k*s.space,s.bottom+k*s.space]){
   if(yc<0||yc>=h)continue;
   for(let y=Math.max(0,Math.floor(yc-band));y<=Math.min(h-1,Math.ceil(yc+band));y++){
    let x=Math.max(0,s.x0);const o=y*w;
    while(x<=s.x1&&x<w){if(!ink[o+x]){x++;continue;}let e=x;while(e<w&&ink[o+e])e++;
     if(e-x>=s.space*1.1&&e-x<=s.space*3.2)for(let k2=x;k2<e;k2++)clearAt(k2,y,0);
     x=e;}
   }
  }
 }
}
function components(ink:Uint8Array,w:number,h:number):{label:Int32Array;comps:Comp[]}{
 const label=new Int32Array(w*h),comps:Comp[]=[{id:0,x0:0,y0:0,x1:0,y1:0,n:0}];const stack=new Int32Array(w*h);
 for(let i=0;i<ink.length;i++){if(!ink[i]||label[i])continue;
  const id=comps.length,c:Comp={id,x0:w,y0:h,x1:0,y1:0,n:0};comps.push(c);let sp=0;stack[sp++]=i;label[i]=id;
  while(sp){const p=stack[--sp],x=p%w,y=(p-x)/w;c.n++;if(x<c.x0)c.x0=x;if(x>c.x1)c.x1=x;if(y<c.y0)c.y0=y;if(y>c.y1)c.y1=y;
   for(let dy=-1;dy<=1;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;for(let dx=-1;dx<=1;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;const q=yy*w+xx;if(ink[q]&&!label[q]){label[q]=id;stack[sp++]=q;}}}}
 }
 return {label,comps};
}
function integral(ink:Uint8Array,w:number,h:number):Uint32Array{
 const I=new Uint32Array((w+1)*(h+1));
 for(let y=0;y<h;y++){let row=0;for(let x=0;x<w;x++){row+=ink[y*w+x];I[(y+1)*(w+1)+x+1]=I[y*(w+1)+x+1]+row;}}
 return I;
}
function boxSum(I:Uint32Array,w:number,x0:number,y0:number,x1:number,y1:number){const W=w+1;return I[y1*W+x1]-I[y0*W+x1]-I[y1*W+x0]+I[y0*W+x0];}

export function readScoreImage(img:GrayImage):OmrResult{
 const w=img.width,h=img.height,warnings:string[]=[];const T0=Date.now(),tick=(l:string)=>{if((globalThis as {__omrDebug?:boolean}).__omrDebug)console.log(l,Date.now()-T0);};
 let ink=binarize(img);const angle=estimateSkew(ink,w,h);ink=rotate(ink,w,h,angle);
 const {thickness:T,space:S0}=runLengths(ink,w,h);
 tick('pre');const staves=findStaves(ink,w,h,T,S0);tick('staves');
 if(!staves.length)throw new Error('Não encontrei pautas nesta página. Use um PDF nítido, com a partitura reta.');
 const S=staves.reduce((a,s)=>a+s.space,0)/staves.length;
 const original=ink.slice();
 removeLines(ink,w,h,staves,T);
 tick('remove');const {label,comps}=components(ink,w,h);tick('cc '+comps.length);
 const I=integral(ink,w,h);
 const at=(x:number,y:number)=>x>=0&&y>=0&&x<w&&y<h&&ink[y*w+x]===1;
 const vrun=(x:number,y:number)=>{if(!at(x,y))return [y,y-1] as const;let a=y,b=y;while(at(x,a-1))a--;while(at(x,b+1))b++;return [a,b] as const;};
 const hrun=(x:number,y:number)=>{if(!at(x,y))return [x,x-1] as const;let a=x,b=x;while(at(a-1,y))a--;while(at(b+1,y))b++;return [a,b] as const;};
 // pautas agrupadas em sistemas (piano/conjunto): usamos só a de cima de cada sistema
 const zoneOf=(s:OmrStaff,i:number)=>{const prev=staves[i-1],next=staves[i+1];return {top:prev?Math.max(s.top-6*S,(prev.bottom+s.top)/2):s.top-6*S,bottom:next?Math.min(s.bottom+6*S,(s.bottom+next.top)/2):s.bottom+6*S};};
 const measures:OmrMeasure[]=[];let fifths=0,keyKnown=false,current:OmrNote[]=[];const allNotes:OmrNote[]=[];
 const bars:number[][]=[];
 const used=staves.map(()=>true);
 // detecção de sistemas: uma barra contínua ligando duas pautas
 for(let i=0;i+1<staves.length;i++){const a=staves[i],b=staves[i+1];const x=a.x0+1;let joined=0;
  for(let dx=0;dx<Math.max(3,S*.4);dx++){let ok=true;for(let y=Math.round(a.bottom);y<=Math.round(b.top);y++)if(!original[y*w+x+dx]){ok=false;break;}if(ok)joined++;}
  if(joined)used[i+1]=false;}
 if(used.some(u=>!u))warnings.push('Encontrei mais de uma pauta tocando junto (sistema). Li só a pauta de cima de cada sistema.');

 staves.forEach((st,si)=>{
  if(!used[si])return;
  const sp=st.space,zone=zoneOf(st,si),bottom=st.bottom;
  const inZone=(c:Comp)=>{const cy=(c.y0+c.y1)/2;return cy>=zone.top&&cy<=zone.bottom&&c.x1>=st.x0-sp&&c.x0<=st.x1+sp;};
  const mine=comps.filter(c=>c.n>0&&inZone(c));
  // 1. hastes e barras: corridas verticais longas, agrupadas por colunas vizinhas
  const segs:Stem[]=[];
  for(let x=Math.max(0,Math.round(st.x0-sp));x<=Math.min(w-1,Math.round(st.x1+sp));x++){
   let y=Math.max(0,Math.round(zone.top));const yEnd=Math.min(h-1,Math.round(zone.bottom));
   while(y<=yEnd){if(!at(x,y)){y++;continue;}let e=y;while(e+1<h&&at(x,e+1))e++;
    if(e-y+1>=sp*2.1){const last=segs.find(s=>s.x1>=x-1&&Math.min(s.y1,e)-Math.max(s.y0,y)>(Math.min(s.y1-s.y0,e-y))*.5);
     if(last){last.x1=x;last.y0=Math.min(last.y0,y);last.y1=Math.max(last.y1,e);}else segs.push({x0:x,x1:x,y0:y,y1:e});}
    y=e+1;}
  }
  // emenda hastes com buraquinho (escaneado/borrado): mesma coluna, distância vertical pequena
  {const gap=Math.max(3,sp*.3);let merged=true;
   while(merged){merged=false;
    for(let i=0;i<segs.length&&!merged;i++)for(let j=i+1;j<segs.length;j++){const a=segs[i],b=segs[j];
     if(Math.min(a.x1,b.x1)<Math.max(a.x0,b.x0)-1)continue;
     const g=Math.max(a.y0,b.y0)-Math.min(a.y1,b.y1);if(g<=0||g>gap)continue;
     a.x0=Math.min(a.x0,b.x0);a.x1=Math.max(a.x1,b.x1);a.y0=Math.min(a.y0,b.y0);a.y1=Math.max(a.y1,b.y1);segs.splice(j,1);merged=true;break;}}}
  tick('segs '+segs.length);
  // 2. clave: primeiro símbolo bem alto no início da pauta
  const clef=mine.filter(c=>c.x0<st.x0+5*sp&&c.y1-c.y0>4.2*sp&&c.x1-c.x0<3.5*sp).sort((a,b)=>a.x0-b.x0)[0];
  const startX=clef?clef.x1+1:st.x0;
  if(!clef&&si===0)warnings.push('Não reconheci a clave no começo da pauta; considerei clave de Sol.');
  // 3. cabeças de nota na ponta das hastes
  const heads:Head[]=[];
  const bw=Math.max(3,Math.round(sp*.62)),bh=Math.max(3,Math.round(sp*.46));
  const filledAround=(cx:number,cy:number)=>{let best=0,bx=cx,by=cy;const r=Math.round(sp*.55);
   for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){const x0=x-(bw>>1),y0=y-(bh>>1);if(x0<0||y0<0||x0+bw>=w||y0+bh>=h)continue;const f=boxSum(I,w,x0,y0,x0+bw,y0+bh)/(bw*bh);if(f>best){best=f;bx=x;by=y;}}
   return {fill:best,x:bx,y:by};};
  const blobBox=(x0:number,x1:number,y0:number,y1:number,skip:Stem,up:boolean,ey:number)=>{let bx0=w,bx1=-1,by0=h,by1=-1,n=0;
   x0=Math.max(0,x0);x1=Math.min(w-1,x1);y0=Math.max(0,y0);y1=Math.min(h-1,y1);
   const seen=new Set<number>(),stack:number[]=[];
   for(const sx of up?[skip.x0-2,skip.x0-3]:[skip.x1+2,skip.x1+3])for(let y=Math.round(ey-.6*sp);y<=Math.round(ey+.6*sp);y++)if(sx>=x0&&sx<=x1&&y>=y0&&y<=y1&&at(sx,y)){const k=y*w+sx;if(!seen.has(k)){seen.add(k);stack.push(k);}}
   while(stack.length){const k=stack.pop()!,x=k%w,y=(k-x)/w;n++;if(x<bx0)bx0=x;if(x>bx1)bx1=x;if(y<by0)by0=y;if(y>by1)by1=y;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<x0||xx>x1||yy<y0||yy>y1)continue;if(xx>=skip.x0-1&&xx<=skip.x1+1)continue;const q=yy*w+xx;if(!seen.has(q)&&ink[q]){seen.add(q);stack.push(q);}}}
   return {x0:bx0,x1:bx1,y0:by0,y1:by1,n};};
  for(const s of segs){
   if(s.x0<startX)continue;const sw=s.x1-s.x0+1;if(sw>sp*.45)continue;
   const barLike=Math.abs(s.y0-st.top)<sp*.3&&Math.abs(s.y1-st.bottom)<sp*.3; // pode ser barra de compasso
   const options:Head[]=[];
   for(const end of ['bottom','top'] as const){
    // haste para cima: cabeça embaixo, à esquerda; para baixo: cabeça em cima, à direita
    const up=end==='bottom',ey=up?s.y1:s.y0;
    const rx0=up?Math.round(s.x0-1.6*sp):s.x1+1,rx1=up?s.x0-1:Math.round(s.x1+1.6*sp);
    const ry0=Math.round(ey-.9*sp),ry1=Math.round(ey+.9*sp);
    const box=blobBox(rx0,rx1,ry0,ry1,s,up,ey);const dbx=(globalThis as {__omrX?:number}).__omrX;if(dbx!==undefined&&Math.abs(s.x0-dbx)<30)console.log('seg',s,end,box,(box.x1-box.x0+1)/sp,(box.y1-box.y0+1)/sp);if(box.n<sp*sp*.15)continue;
    if(box.n&&(box.x1-box.x0+1<sp*1.05||box.y1-box.y0+1<sp*.8)){
     // anel partido pela remoção das linhas: junta os pedaços que cabem no tamanho de uma cabeça
     const wx0=up?Math.round(box.x1-1.5*sp):box.x0,wx1=up?box.x1:Math.round(box.x0+1.5*sp),wy0=Math.min(box.y0-sp*.2,ey-sp*.75),wy1=Math.max(box.y1+sp*.2,ey+sp*.75);
     const near=new Set<number>();for(let y=Math.max(0,Math.round(wy0));y<=Math.min(h-1,Math.round(wy1));y++)for(let x=Math.max(0,wx0);x<=Math.min(w-1,wx1);x++){const l=label[y*w+x];if(l)near.add(l);}
     for(const l of near){const c=comps[l];if(c.x0>=wx0-1&&c.x1<=wx1+1&&c.y0>=wy0&&c.y1<=wy1&&!(c.x0<=s.x1+1&&c.x1>=s.x0-1)){box.x0=Math.min(box.x0,c.x0);box.x1=Math.max(box.x1,c.x1);box.y0=Math.min(box.y0,c.y0);box.y1=Math.max(box.y1,c.y1);box.n+=c.n;}}
    }
    const bwid=box.x1-box.x0+1,bhei=box.y1-box.y0+1;
    if(bwid<sp*.75||bwid>sp*2.1||bhei<sp*.55||bhei>sp*1.6)continue;
    // a cabeça encosta na haste
    if(up?box.x1<s.x0-Math.max(2,sp*.2):box.x0>s.x1+Math.max(2,sp*.2))continue;
    // não pode haver outro traço vertical longo dentro (sustenido/bequadro)
    let otherStroke=false;for(let x=box.x0;x<=box.x1&&!otherStroke;x++){if(x>=s.x0-1&&x<=s.x1+1)continue;for(let y=box.y0;y<=box.y1;y++){if(!at(x,y))continue;const [a,b]=vrun(x,y);if(b-a+1>=sp*1.25){otherStroke=true;break;}y=b;}}
    if(otherStroke)continue;
    const cx=Math.round((box.x0+box.x1)/2),cy=Math.round((box.y0+box.y1)/2),f=filledAround(cx,cy);
    const fillBox=box.n/(bwid*bhei);
    let hollow:boolean;
    if(f.fill>=.9){const [ha,hb]=hrun(f.x,f.y),[va,vb]=vrun(f.x,f.y);if(hb-ha+1>sp*2.2||vb-va+1>sp*1.6||vb-va+1<sp*.6)continue;hollow=false;}
    else if(fillBox>=.2&&fillBox<=.8&&!barLike){hollow=true;}else continue;
    options.push({x:cx,y:cy,x0:box.x0,x1:box.x1,y0:box.y0,y1:box.y1,hollow,stem:s,up,comp:label[Math.round(ey)*w+s.x0]||label[cy*w+cx],beams:0,dots:0,acc:null});
   }
   if(!options.length)continue;
   const hd=options.find(o=>!o.hollow)??options[0];
   // feixes/colchetes: travessões perto da ponta da haste
   const tip=hd.up?s.y0:s.y1,dir=hd.up?1:-1,len=s.y1-s.y0,range=Math.min(2.4*sp,len-1.3*sp);
   let beams=0;
   for(const off of [-.55,.55,.9]){const x=Math.round(off<0?s.x0+off*sp:s.x1+off*sp);let groups=0,inGroup=false,thick=0;
    for(let k=0;k<=range;k++){const y=tip+dir*k;const v=at(x,Math.round(y));if(v){thick++;if(!inGroup){inGroup=true;}}else{if(inGroup&&thick>=Math.max(2,sp*.18))groups++;inGroup=false;thick=0;}}
    if(inGroup&&thick>=Math.max(2,sp*.18))groups++;
    beams=Math.max(beams,Math.min(3,groups));}
   hd.beams=hd.hollow?0:beams;heads.push(hd);
  }
  tick('heads '+heads.length);
  // colcheia sozinha (colchete) x grupo com travessão
  {const perComp=new Map<number,number>();for(const hd of heads)perComp.set(hd.comp,(perComp.get(hd.comp)??0)+1);
   for(const hd of heads){if(hd.hollow)continue;if((perComp.get(hd.comp)??0)<=1)hd.beams=hd.beams>=3?2:hd.beams>=1?1:0;else hd.beams=Math.min(2,hd.beams);}}
  const stemUsed=new Set(heads.map(hd=>hd.stem));
  const segBars=segs.filter(s=>!stemUsed.has(s)&&s.x1-s.x0+1<=sp*.9&&Math.abs(s.y0-st.top)<sp*.45&&Math.abs(s.y1-st.bottom)<sp*.45).map(s=>(s.x0+s.x1)/2);
  // semibreves: anel sem haste
  const stemComps=new Set(heads.map(h2=>h2.comp));
  const loose=mine.filter(c=>c.x0>startX&&!stemComps.has(c.id));
  const looseUsed=new Set<number>();
  for(const c of loose){
   if(looseUsed.has(c.id)||c.y1-c.y0+1>sp*1.6||c.y1-c.y0+1<sp*.3)continue;
   const cyc=(c.y0+c.y1)/2;if(cyc<st.top-5*sp||cyc>st.bottom+5*sp)continue;
   // junta pedaços próximos (anel partido pela remoção das linhas, ligadura encostada)
   const group=new Set([c.id]);let x0=c.x0,x1=c.x1,y0=c.y0,y1=c.y1,grew=true;
   while(grew){grew=false;for(const d of loose){if(group.has(d.id)||looseUsed.has(d.id)||d.y1-d.y0+1>sp*1.6)continue;
    if(d.x0<=x1+sp*.6&&d.x1>=x0-sp*.6&&d.y0<=y1+sp*.2&&d.y1>=y0-sp*.2&&Math.abs((d.y0+d.y1)/2-cyc)<sp*.7){group.add(d.id);x0=Math.min(x0,d.x0);x1=Math.max(x1,d.x1);y0=Math.min(y0,d.y0);y1=Math.max(y1,d.y1);grew=true;}}}
   // colunas com altura de cabeça
   const ext:number[]=[],top:number[]=[],bot:number[]=[];
   for(let x=x0;x<=x1;x++){let a=-1,b=-1;for(let y=y0;y<=y1;y++)if(ink[y*w+x]&&group.has(label[y*w+x])){if(a<0)a=y;b=y;}top.push(a);bot.push(b);ext.push(a<0?0:b-a+1);}
   const runs:[number,number][]=[];let rs=-1,lastTall=-1e9;
   ext.forEach((e,k)=>{if(e>=sp*.55){if(rs<0||k-lastTall>sp*.8){if(rs>=0)runs.push([rs,lastTall]);rs=k;}lastTall=k;}});if(rs>=0)runs.push([rs,lastTall]);
   for(const [a,b] of runs){
    const ww=b-a+1;if(ww<sp*1.2||ww>sp*2.4)continue;
    let ty=Infinity,by=-1;for(let k=a;k<=b;k++)if(top[k]>=0){ty=Math.min(ty,top[k]);by=Math.max(by,bot[k]);}
    const hh=by-ty+1;if(hh<sp*.7||hh>sp*1.35)continue;
    const cx=x0+Math.round((a+b)/2),cy=Math.round((ty+by)/2);if(at(cx,cy))continue;
    let left=false,right=false;for(let x=cx;x>=x0+a;x--)if(at(x,cy)){left=true;break;}for(let x=cx;x<=x0+b;x++)if(at(x,cy)){right=true;break;}
    if(!left||!right)continue;
    let n=0;for(let y=ty;y<=by;y++)for(let x=x0+a;x<=x0+b;x++)if(ink[y*w+x])n++;const fill=n/(ww*hh);if(fill<.22||fill>.78)continue;
    group.forEach(g=>looseUsed.add(g));
    heads.push({x:cx,y:cy,x0:x0+a,x1:x0+b,y0:ty,y1:by,hollow:true,stem:null,up:true,comp:c.id,beams:0,dots:0,acc:null});
   }
  }
  heads.sort((a,b)=>a.x-b.x);
  // remove cabeças repetidas (mesma haste lida duas vezes) e acordes (fica a de cima)
  for(let i=heads.length-1;i>0;i--){if(Math.abs(heads[i].x-heads[i-1].x)<sp*.5){if(Math.abs(heads[i].y-heads[i-1].y)>sp*.6&&!warnings.includes('acorde'))warnings.push('acorde');const drop=heads[i].y<heads[i-1].y?i-1:i;heads.splice(drop,1);}}
  tick('loose');const headComps=new Set(heads.map(h2=>h2.comp));for(const c of mine)if(heads.some(hd=>c.x0>=hd.x0-2&&c.x1<=hd.x1+2&&c.y0>=hd.y0-2&&c.y1<=hd.y1+2))headComps.add(c.id);
  // 4. demais símbolos
  const strokes=(c:Comp)=>{const out:{x:number;y0:number;y1:number}[]=[];for(let x=c.x0;x<=c.x1;x++){for(let y=c.y0;y<=c.y1;y++){if(!ink[y*w+x]||label[y*w+x]!==c.id)continue;const [a,b]=vrun(x,y);if(b-a+1>=sp*1.1){const prev=out[out.length-1];if(prev&&x-prev.x<=1&&Math.min(prev.y1,b)-Math.max(prev.y0,a)>=Math.min(prev.y1-prev.y0,b-a)*.5){prev.x=x;prev.y0=Math.min(prev.y0,a);prev.y1=Math.max(prev.y1,b);}else out.push({x,y0:a,y1:b});}y=b;}}return out;};
  type Item={kind:'note'|'rest'|'bar';x:number;head?:Head;beats?:number;whole?:boolean};
  const items:Item[]=[...heads.map(hd=>({kind:'note' as const,x:hd.x,head:hd})),...segBars.filter(x=>x>startX).map(x=>({kind:'bar' as const,x}))];
  const accs:{x0:number;x1:number;cy:number;type:number;y0:number;y1:number}[]=[];
  const dots:{x:number;y:number}[]=[];const ties:Comp[]=[];
  const lineY=(i:number)=>st.lines[i];
  if((globalThis as {__omrDebug?:boolean}).__omrDebug)for(const c of mine){if(headComps.has(c.id)||c===clef)continue;let mr=0;for(let x=c.x0;x<=c.x1;x++)for(let y=c.y0;y<=c.y1;y++){if(label[y*w+x]!==c.id)continue;const [a2,b2]=vrun(x,y);mr=Math.max(mr,b2-a2+1);y=b2;}console.log('comp',si,c.x0,((c.x1-c.x0+1)/sp).toFixed(2),((c.y1-c.y0+1)/sp).toFixed(2),(c.n/((c.x1-c.x0+1)*(c.y1-c.y0+1))).toFixed(2),'cy',(((c.y0+c.y1)/2-st.top)/sp).toFixed(2),'mr',(mr/sp).toFixed(2));}
  // bemol partido em dois (haste + barriga) pela remoção das linhas
  const flatUsed=new Set<number>();
  for(const c of mine){if(headComps.has(c.id)||c===clef)continue;const cw=c.x1-c.x0+1,ch=c.y1-c.y0+1;
   if(cw<sp*.35&&ch>=sp*1.8&&ch<=sp*3.2&&c.x0>startX-sp*0){const bulb=mine.find(d=>d!==c&&!headComps.has(d.id)&&d.x0-c.x1<=3&&d.x0>=c.x0&&d.x1-c.x0<=sp*1.1&&d.y1<=c.y1+sp*.3&&d.y0>=c.y0+ch*.4&&d.y1-d.y0<=sp*1.3);
    if(bulb&&!stemUsed.has(segs.find(sg=>sg.x0<=c.x1&&sg.x1>=c.x0)??null)){flatUsed.add(c.id);flatUsed.add(bulb.id);accs.push({x0:c.x0,x1:Math.max(c.x1,bulb.x1),cy:c.y1-sp*.55,type:-1,y0:c.y0,y1:c.y1});}}}
  // fórmula de compasso: dois algarismos empilhados (ou um bloco alto) logo no começo
  const timeSig=new Set<number>();
  {const firstHead=heads.length?heads[0].x0:Infinity;const mid=(st.top+st.bottom)/2;
   const cand=mine.filter(c=>c.x1<firstHead&&c.x0>startX-2&&!headComps.has(c.id)&&c!==clef);
   for(const a2 of cand){const ah=a2.y1-a2.y0+1;
    if(ah>=sp*3.4&&ah<=sp*4.6&&a2.x1-a2.x0+1>=sp*.9&&a2.x1-a2.x0+1<=sp*2&&Math.abs(a2.y0-st.top)<sp*.5){timeSig.add(a2.id);continue;}
    if(ah<sp*1.1||ah>sp*3||(a2.y0+a2.y1)/2>=mid)continue;
    const b2=cand.find(d=>d!==a2&&(d.y0+d.y1)/2>mid&&d.y1-d.y0+1>=sp*1.1&&d.y1-d.y0+1<=sp*3&&Math.min(a2.x1,d.x1)-Math.max(a2.x0,d.x0)>Math.min(a2.x1-a2.x0,d.x1-d.x0)*.4);
    if(b2){timeSig.add(a2.id);timeSig.add(b2.id);}}
   // pedaços dos algarismos que a remoção das linhas separou
   const sig=cand.filter(c=>timeSig.has(c.id));if(sig.length){const x0=Math.min(...sig.map(c=>c.x0)),x1=Math.max(...sig.map(c=>c.x1));for(const c of cand)if(c.x0>=x0-2&&c.x1<=x1+2&&c.y0>=st.top-sp*.5&&c.y1<=st.bottom+sp*.5)timeSig.add(c.id);}}
  for(const c of mine){
   if(headComps.has(c.id)||c===clef||looseUsed.has(c.id)||flatUsed.has(c.id)||timeSig.has(c.id))continue;
   const cw=c.x1-c.x0+1,ch=c.y1-c.y0+1,fill=c.n/(cw*ch),cy=(c.y0+c.y1)/2;
   // barra de compasso: traço fino da 1ª à 5ª linha
   if(cw<=sp*.9&&Math.abs(c.y0-st.top)<sp*.45&&Math.abs(c.y1-st.bottom)<sp*.45&&fill>.6){items.push({kind:'bar',x:(c.x0+c.x1)/2});continue;}
   if(c.x1<startX)continue;
   // ponto de aumento: redondinho e sempre num espaço (nunca em cima de uma linha da pauta)
   if(cw<=sp*.7&&ch<=sp*.7&&cw>=sp*.18&&ch>=sp*.18&&fill>=.5){const onLine=st.lines.some(l=>Math.abs(l-cy)<sp*.18);if(!onLine&&cw/ch>=.55&&cw/ch<=1.8)dots.push({x:(c.x0+c.x1)/2,y:cy});continue;}
   if(cw>=sp*1&&ch<=sp*1.1&&fill<.5){ties.push(c);continue;}
   if(cw>=sp*.8&&cw<=sp*1.8&&ch>=sp*.28&&ch<=sp*.8&&fill>=.75&&cy>st.top&&cy<st.bottom){
    const whole=Math.abs(c.y0-lineY(1))<Math.abs(c.y1-lineY(2));items.push({kind:'rest',x:(c.x0+c.x1)/2,beats:whole?4:2,whole});continue;}
   const allSt=ch>=sp*1.4&&ch<=sp*3.8&&cw>=sp*.35&&cw<=sp*1.4?strokes(c):[];
   let st2=allSt.filter(k=>k.y1-k.y0+1>=sp*1.8);
   // bemol mais curto (fontes como a do LilyPond): traço fino à esquerda, barriga embaixo à direita
   if(!st2.length){const f2=allSt.filter(k=>k.y1-k.y0+1>=sp*1.4);if(f2.length===1&&f2[0].x-c.x0<=sp*.3&&Math.abs(f2[0].y1-c.y1)<=sp*.3&&f2[0].y1-f2[0].y0+1>=ch*.75&&cw>=sp*.45&&cw<=sp*1.1)st2=f2;}
   // bemol: o traço fica na esquerda e desce até a barriga, embaixo (pausa de semínima tem traço no meio)
   if(st2.length===1&&!(st2[0].x-c.x0<=Math.max(sp*.3,cw*.35)&&c.y1-st2[0].y1<=sp*.4))st2=[];
   if(st2.length===1||st2.length===2){
    let type:number;
    if(st2.length===1)type=-1;
    else{const [a,b]=st2;type=Math.abs(a.y0-b.y0)<sp*.45&&Math.abs(a.y1-b.y1)<sp*.45?1:0;}
    const ccy=type===-1?c.y1-sp*.55:cy;
    accs.push({x0:c.x0,x1:c.x1,cy:ccy,type,y0:c.y0,y1:c.y1});continue;
   }
   if(cy>st.top-sp*.2&&cy<st.bottom+sp*.2&&cw>=sp*.45&&cw<=sp*1.4){
    let maxRun=0;for(let x=c.x0;x<=c.x1;x++)for(let y=c.y0;y<=c.y1;y++){if(label[y*w+x]!==c.id)continue;const [a,b]=vrun(x,y);maxRun=Math.max(maxRun,b-a+1);y=b;}
    if(ch>=sp*2&&ch<=sp*3.5&&maxRun<sp*1.9){items.push({kind:'rest',x:(c.x0+c.x1)/2,beats:1});continue;}
    if(ch>=sp*1.1&&ch<sp*2&&maxRun<sp*1.6){items.push({kind:'rest',x:(c.x0+c.x1)/2,beats:.5});continue;}
   }
  }
  tick('symbols');
  if((globalThis as {__omrDebug?:boolean}).__omrDebug)console.log('dots',JSON.stringify(dots.map(d=>[Math.round(d.x),Math.round(d.y)])),'heads',JSON.stringify(heads.map(hd=>[hd.x0,hd.x1,hd.y,hd.hollow?'o':'*',hd.beams])));
  // armadura: acidentes antes do primeiro símbolo musical
  const firstX=Math.min(...items.filter(i=>i.kind!=='bar').map(i=>i.x),Infinity);
  const keyAccs=accs.filter(a=>a.x1<firstX-sp*.4&&!heads.some(hd=>hd.x0-a.x1>=-sp*.1&&hd.x0-a.x1<sp*.9&&Math.abs(hd.y-a.cy)<sp*.6));
  if(!keyKnown&&(keyAccs.length||items.length)){const sharps=keyAccs.filter(a=>a.type===1).length,flats=keyAccs.filter(a=>a.type===-1).length;fifths=sharps>=flats?Math.min(7,sharps):-Math.min(7,flats);keyKnown=true;}
  // acidentes de nota
  for(const a of accs){if(keyAccs.includes(a))continue;const hd=heads.find(hd2=>hd2.x0-a.x1>=-sp*.15&&hd2.x0-a.x1<sp*1.2&&Math.abs(hd2.y-a.cy)<sp*.75);if(hd)hd.acc=a.type;}
  // pontos de aumento
  for(const d of dots){const it=items.filter(i=>i.kind!=='bar'&&i.x<d.x).sort((a,b)=>b.x-a.x).slice(0,1).find(i=>{if(i.kind==='bar')return false;const dx=d.x-i.x;return dx>sp*.55&&dx<sp*(i.head?2:1.8)&&Math.abs(d.y-(i.head?i.head.y:(st.top+st.bottom)/2))<(i.head?sp*.8:sp*1.6);});if(it){if(it.head)it.head.dots=Math.min(1,it.head.dots+1);else if(it.beats)it.beats*=1.5;}}
  items.sort((a,b)=>a.x-b.x);
  // remove barras duplas/finais repetidas
  const clean:Item[]=[];for(const it of items){const prev=clean[clean.length-1];if(it.kind==='bar'&&prev?.kind==='bar'&&it.x-prev.x<sp*1.2)continue;clean.push(it);}
  // ligaduras de prolongamento
  const notes=clean.filter(i=>i.kind==='note').map(i=>i.head!);
  const tieFrom=new Set<Head>();
  const barXs=clean.filter(i=>i.kind==='bar').map(i=>i.x);
  // restos de linha (da pauta ou suplementar) não contam como ligadura
  const lineYs=[...st.lines,...[1,2,3,4].flatMap(k=>[st.top-k*sp,st.bottom+k*sp])];
  const onAnyLine=(y:number)=>lineYs.some(l=>Math.abs(l-y)<sp*.16);
  const arcBetween=(a:Head,xa:number,xb:number)=>{let cols=0,above=0,below=0,aboveOff=0,belowOff=0;
   for(let x=Math.round(xa);x<=Math.round(xb);x++){if(barXs.some(b=>Math.abs(b-x)<sp*.35))continue;cols++;
    let up=false,down=false;
    let upOff=false,downOff=false;
    for(let y=Math.round(a.y-1.7*sp);y<=Math.round(a.y-.4*sp);y++){if(!at(x,y))continue;const [r0,r1]=vrun(x,y);if(r1-r0+1<=sp*.45){up=true;if(!onAnyLine((r0+r1)/2))upOff=true;}y=r1;}
    for(let y=Math.round(a.y+.4*sp);y<=Math.round(a.y+1.7*sp);y++){if(!at(x,y))continue;const [r0,r1]=vrun(x,y);if(r1-r0+1<=sp*.45){down=true;if(!onAnyLine((r0+r1)/2))downOff=true;}y=r1;}
    if(up)above++;if(down)below++;if(upOff)aboveOff++;if(downOff)belowOff++;}
   if((globalThis as {__omrDebug?:boolean}).__omrDebug)console.log('arc',Math.round(a.x),Math.round(xa),Math.round(xb),cols,above,below);
   // a curva precisa sair da linha em boa parte do caminho (resto de linha reto não é ligadura)
   return cols>=sp*.5&&(above>=cols*.6&&aboveOff>=cols*.3||below>=cols*.6&&belowOff>=cols*.3);};
  notes.forEach((a,k)=>{const b=notes[k+1];
   if(b){if(Math.round((st.bottom-b.y)/(sp/2))===Math.round((st.bottom-a.y)/(sp/2))&&b.x0-a.x1>sp*.7&&arcBetween(a,a.x1+sp*.25,b.x0-sp*.25))tieFrom.add(a);}
   else if(st.x1-a.x1>sp*1.2&&arcBetween(a,a.x1+sp*.6,Math.min(st.x1-sp*.15,a.x1+sp*3)))tieFrom.add(a);});
  if((globalThis as {__omrDump?:unknown[]}).__omrDump)(globalThis as unknown as {__omrDump:unknown[]}).__omrDump.push(...clean.map(i=>({k:i.kind,x:Math.round(i.x),y:i.head?i.head.y:Math.round(st.top),b:i.head?{x0:i.head.x0,x1:i.head.x1,y0:i.head.y0,y1:i.head.y1,o:i.head.hollow,bm:i.head.beams,d:i.head.dots,a:i.head.acc,t:tieFrom.has(i.head)}:null,r:i.beats})),...accs.map(a2=>({k:'acc',x:a2.x0,y:Math.round(a2.cy),t:a2.type,y0:a2.y0,y1:a2.y1,x1:a2.x1})),...dots.map(d=>({k:'dot',x:Math.round(d.x),y:Math.round(d.y)})));
  // monta os compassos
  for(const it of clean){
   if(it.kind==='bar'){if(current.length){measures.push({items:current});current=[];}continue;}
   if(it.kind==='rest'){const n:OmrNote={midi:null,beats:it.beats??1,wholeBar:it.whole,x:it.x,staff:si};current.push(n);allNotes.push(n);continue;}
   const hd=it.head!;
   const base=hd.hollow?(hd.stem?2:4):hd.beams>=2?.25:hd.beams===1?.5:1;
   const beatsLen=base*(hd.dots?1.5:1);
   const pos=Math.round((bottom-hd.y)/(sp/2)),d=pos+2;
   const step=STEPS[((d%7)+7)%7],octave=4+Math.floor(d/7);
   const n:OmrNote={midi:0,beats:beatsLen,step,octave,alter:hd.acc??undefined,tieStart:tieFrom.has(hd),x:hd.x,staff:si};
   current.push(n);allNotes.push(n);
  }
  bars.push(clean.filter(i=>i.kind==='bar').map(i=>i.x));
 });
 if(current.length)measures.push({items:current});
 if(warnings.includes('acorde')){warnings.splice(warnings.indexOf('acorde'),1,'Encontrei notas empilhadas (acorde). Fiquei só com a nota de cima.');}
 // altura com armadura e acidentes que valem até o fim do compasso
 const keyAlter=(step:string)=>fifths>0&&SHARP_ORDER.slice(0,fifths).includes(step)?1:fifths<0&&FLAT_ORDER.slice(0,-fifths).includes(step)?-1:0;
 for(const m of measures){const carry:Record<string,number>={};
  for(const n of m.items){if(n.midi===null||!n.step)continue;const k=n.step+n.octave;
   let alter:number;if(n.alter!==undefined){alter=n.alter;carry[k]=alter;}else alter=k in carry?carry[k]:keyAlter(n.step);
   n.alter=alter;n.midi=12*((n.octave??4)+1)+SEMI[STEPS.indexOf(n.step)]+alter;}}
 const beats=inferBeats(measures,warnings);
 return {measures,beats,fifths,staves:staves.filter((_,i)=>used[i]),warnings,space:S,angle};
}

function inferBeats(measures:OmrMeasure[],warnings:string[]):number{
 // fórmula de compasso pela soma mais comum dos compassos do meio
 const sums=measures.map(m=>m.items.filter(n=>!n.wholeBar).reduce((a,n)=>a+n.beats,0));
 const inner=sums.slice(1,-1).length?sums.slice(1,-1):sums;const count=new Map<number,number>();
 for(const s of inner)if(s>0)count.set(s,(count.get(s)??0)+1);
 let beats=4,bestCount=0;for(const [s,c] of count)if(c>bestCount||c===bestCount&&[2,3,4].includes(s)&&![2,3,4].includes(beats)){beats=s;bestCount=c;}
 if(![2,3,4].includes(beats)){warnings.push(`Os compassos parecem ter ${beats} tempos; ajustei para 4/4. Confira a fórmula de compasso.`);beats=4;}
 for(const m of measures)for(const n of m.items)if(n.wholeBar)n.beats=beats;
 return beats;
}
/** Várias páginas: junta os compassos na ordem. */
export function readScorePages(pages:readonly GrayImage[]):OmrResult{
 const results:OmrResult[]=[],warnings:string[]=[];
 pages.forEach((p,i)=>{try{results.push(readScoreImage(p));}catch{if(i===0||pages.length===1)throw new Error('Não encontrei pautas na primeira página. Use um PDF nítido, com a partitura reta.');warnings.push(`Página ${i+1}: não encontrei pautas.`);}});
 const first=results[0];const measures=results.flatMap(r=>r.measures);
 for(const r of results)for(const w2 of r.warnings)if(!warnings.includes(w2)&&!/compassos parecem/.test(w2))warnings.push(w2);
 for(const m of measures)for(const n of m.items)if(n.wholeBar)n.beats=4;
 const beats=inferBeats(measures,warnings);
 return {measures,beats,fifths:first.fifths,staves:results.flatMap(r=>r.staves),warnings,space:first.space,angle:first.angle};
}
const TYPE:Record<string,string>={'4':'whole','3':'half','2':'half','1.5':'quarter','1':'quarter','0.75':'eighth','0.5':'eighth','0.25':'16th'};
/** Quebra uma duração em figuras escrevíveis (com ligadura entre elas). */
function splitBeats(b:number):number[]{const out:number[]=[];let left=Math.round(b*4)/4;for(const v of [4,3,2,1.5,1,.75,.5,.25])while(left>=v-1e-6){out.push(v);left=Math.round((left-v)*4)/4;}return out;}
export function omrMeasuresFix(result:OmrResult,beats:number):{measures:OmrNote[][];notes:string[]}{
 const fixed:OmrNote[][]=[],notes:string[]=[];
 result.measures.forEach((m,i)=>{
  let items=m.items.map(n=>n.wholeBar?{...n,beats}:{...n});let sum=items.reduce((a,n)=>a+n.beats,0);
  if(Math.abs(sum-beats)<1e-6){fixed.push(items);return;}
  if(sum<beats){
   if(i===0){items=[{midi:null,beats:beats-sum,x:0,staff:0},...items];notes.push('O primeiro compasso é uma anacruse (começo incompleto): completei com pausa no início.');}
   else{items.push({midi:null,beats:beats-sum,x:0,staff:0});notes.push(`Compasso ${i+1}: faltavam tempos na leitura; completei com pausa. Confira esse compasso.`);}
   fixed.push(items);return;
  }
  // sobrou tempo: corta o excesso no fim
  let acc=0;const cut:OmrNote[]=[];for(const n of items){if(acc>=beats-1e-6)break;const b=Math.min(n.beats,beats-acc);cut.push({...n,beats:b,tieStart:b<n.beats?false:n.tieStart});acc+=b;}
  notes.push(`Compasso ${i+1}: a leitura deu mais tempos do que cabem; cortei o final. Confira esse compasso.`);
  fixed.push(cut);
 });
 return {measures:fixed,notes};
}
export function omrToMusicXml(result:OmrResult,{title='Minha partitura',beats=result.beats,fifths=result.fifths,bpm=72,instrumentId='recorder-soprano'}:{title?:string;beats?:number;fifths?:number;bpm?:number;instrumentId?:string}={}):{xml:string;notes:string[]}{
 const {measures,notes}=omrMeasuresFix(result,beats);
 const esc=(s:string)=>s.replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]!));
 const recorder=instrumentId==='recorder-soprano';
 const transpose=recorder?'':'<transpose><diatonic>-1</diatonic><chromatic>-2</chromatic></transpose>';
 const clef=recorder?'<clef><sign>G</sign><line>2</line><clef-octave-change>1</clef-octave-change></clef>':'<clef><sign>G</sign><line>2</line></clef>';
 let xml=`<?xml version="1.0" encoding="UTF-8"?><score-partwise version="3.1"><work><work-title>${esc(title)}</work-title></work><part-list><score-part id="P1"><part-name>Melodia</part-name></score-part></part-list><part id="P1">`;
 let tieOpen:number|null=null;
 measures.forEach((m,i)=>{
  xml+=`<measure number="${i+1}">`;
  if(i===0)xml+=`<attributes><divisions>4</divisions><key><fifths>${fifths}</fifths></key><time><beats>${beats}</beats><beat-type>4</beat-type></time>${clef}${transpose}</attributes><direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;
  m.forEach((n,k)=>{
   const whole=n.midi===null&&n.beats===beats&&m.length===1;
   const parts=whole?[beats]:splitBeats(n.beats);
   parts.forEach((b,pi)=>{
    const type=TYPE[String(b)]??'quarter',dot=b===3||b===1.5||b===.75?'<dot/>':'';
    if(n.midi===null){xml+=`<note><rest${whole?' measure="yes"':''}/><duration>${Math.round(b*4)}</duration>${whole?'':`<type>${type}</type>${dot}`}</note>`;return;}
    const stop=pi>0||(pi===0&&tieOpen===n.midi&&k===0&&i>0)||(pi===0&&tieOpen===n.midi&&k>0);
    const start=pi<parts.length-1||(pi===parts.length-1&&!!n.tieStart);
    const step=n.step!,alter=n.alter??0;
    xml+=`<note><pitch><step>${step}</step>${alter?`<alter>${alter}</alter>`:''}<octave>${n.octave!+(recorder?1:0)}</octave></pitch><duration>${Math.round(b*4)}</duration>${stop?'<tie type="stop"/>':''}${start?'<tie type="start"/>':''}<type>${type}</type>${dot}${stop||start?`<notations>${stop?'<tied type="stop"/>':''}${start?'<tied type="start"/>':''}</notations>`:''}</note>`;
   });
   tieOpen=n.midi!==null&&n.tieStart?n.midi:null;
   if(n.midi===null)tieOpen=null;
  });
  xml+='</measure>';
 });
 xml+='</part></score-partwise>';
 // ligadura que ficou aberta sem nota igual depois: remove
 return {xml:fixDanglingTies(xml),notes};
}
function fixDanglingTies(xml:string):string{
 // garante que todo "start" tem um "stop" na nota seguinte com a mesma altura
 const notes=[...xml.matchAll(/<note>.*?<\/note>/g)];let out=xml;
 for(let i=notes.length-1;i>=0;i--){const n=notes[i][0];if(!n.includes('<tie type="start"/>'))continue;const next=notes[i+1]?.[0]??'';const pitch=(s:string)=>s.match(/<pitch>.*?<\/pitch>/)?.[0];
  if(!next.includes('<tie type="stop"/>')||pitch(next)!==pitch(n)){const fixed=n.replace('<tie type="start"/>','').replace('<tied type="start"/>','').replace('<notations></notations>','');out=out.slice(0,notes[i].index!)+fixed+out.slice(notes[i].index!+n.length);}}
 // e todo "stop" tem um "start" antes
 const again=[...out.matchAll(/<note>.*?<\/note>/g)];
 for(let i=again.length-1;i>=0;i--){const n=again[i][0];if(!n.includes('<tie type="stop"/>'))continue;const prev=again[i-1]?.[0]??'';if(!prev.includes('<tie type="start"/>')){const fixed=n.replace('<tie type="stop"/>','').replace('<tied type="stop"/>','').replace('<notations></notations>','');out=out.slice(0,again[i].index!)+fixed+out.slice(again[i].index!+n.length);}}
 return out;
}
/** Sequência simples (altura/duração), com ligaduras fundidas e pausas seguidas somadas — usada nos testes. */
export function omrSequence(measures:readonly (readonly OmrNote[])[]):{midi:number|null;beats:number}[]{
 const out:{midi:number|null;beats:number}[]=[];let tie=false;
 for(const m of measures)for(const n of m){const last=out[out.length-1];
  if(n.midi===null){if(last&&last.midi===null)last.beats+=n.beats;else out.push({midi:null,beats:n.beats});tie=false;continue;}
  if(tie&&last&&last.midi===n.midi)last.beats+=n.beats;else out.push({midi:n.midi,beats:n.beats});tie=!!n.tieStart;}
 return out;
}
