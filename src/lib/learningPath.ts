/** One geometry source for responsive path nodes and their SVG connections. */
export function learningPathLayout(count:number){
 if(!Number.isInteger(count)||count<0)throw new Error('Quantidade de aulas inválida.');
 const pattern=[50,30,70,34,60],step=112,size=72;
 const nodes=Array.from({length:count},(_,index)=>({x:pattern[index%pattern.length],y:size/2+index*step}));
 const finish={x:50,y:size/2+count*step};
 const points=[...nodes,finish];
 const segments=nodes.map((point,index)=>{
  const next=points[index+1],middle=(point.y+next.y)/2;
  return {index,d:`M${point.x*10} ${point.y}C${point.x*10} ${middle} ${next.x*10} ${middle} ${next.x*10} ${next.y}`};
 });
 return {nodes,finish,segments,height:count*step+size,step,size};
}
