import test from 'node:test';
import assert from 'node:assert/strict';
import {attachFloatingFooter} from '../src/lib/floatingFooter.ts';
function environment(){
 const view=new EventTarget(),viewport=new EventTarget();
 Object.assign(view,{innerHeight:850,visualViewport:viewport});Object.assign(viewport,{height:850,offsetTop:0});
 const writes=new Map(),reserved=new Map(),frames=new Map();let id=0,height=76;
 view.requestAnimationFrame=callback=>{frames.set(++id,callback);return id;};view.cancelAnimationFrame=key=>frames.delete(key);
 const footer={style:{setProperty:(key,value)=>writes.set(key,value)},getBoundingClientRect:()=>({height,bottom:view.innerHeight-12-Number.parseFloat(writes.get('--activity-viewport-bottom')??'0')})};
 const content={style:{setProperty:(key,value)=>reserved.set(key,value)}};
 return {view,viewport,footer,content,writes,reserved,frames,setHeight:value=>height=value,flush:()=>{for(const [key,callback]of [...frames]){frames.delete(key);callback();}}};
}
test('scrolling never removes the control clearance and multiple events share one animation frame',()=>{
 const env=environment(),dispose=attachFloatingFooter(env.footer,env.content,env.view);
 assert.equal(env.reserved.get('--activity-footer-space'),'100px');
 env.view.dispatchEvent(new Event('scroll'));env.view.dispatchEvent(new Event('scroll'));env.viewport.dispatchEvent(new Event('scroll'));
 assert.equal(env.frames.size,1);env.flush();assert.equal(env.reserved.get('--activity-footer-space'),'100px');
 dispose();
});
test('visual viewport changes raise the control above the obscured bottom and restore it afterward',()=>{
 const env=environment(),dispose=attachFloatingFooter(env.footer,env.content,env.view);
 env.viewport.height=500;env.viewport.dispatchEvent(new Event('resize'));env.flush();
 assert.equal(env.writes.get('--activity-viewport-bottom'),'350px');assert.equal(env.reserved.get('--activity-footer-space'),'450px');
 env.viewport.height=780;env.viewport.offsetTop=20;env.viewport.dispatchEvent(new Event('scroll'));env.flush();
 assert.equal(env.writes.get('--activity-viewport-bottom'),'50px');
 env.viewport.height=850;env.viewport.offsetTop=0;env.viewport.dispatchEvent(new Event('resize'));env.flush();
 assert.equal(env.writes.get('--activity-viewport-bottom'),'0px');assert.equal(env.reserved.get('--activity-footer-space'),'100px');
 dispose();
});
test('feedback resizing updates content clearance and unmount removes pending work and observers',()=>{
 const saved=globalThis.ResizeObserver;let notify,disconnected=false;
 globalThis.ResizeObserver=class{constructor(callback){notify=callback;}observe(){}disconnect(){disconnected=true;}};
 try{
  const env=environment(),dispose=attachFloatingFooter(env.footer,env.content,env.view);
  env.setHeight(137);notify();env.flush();assert.equal(env.reserved.get('--activity-footer-space'),'161px');
  env.view.dispatchEvent(new Event('scroll'));assert.equal(env.frames.size,1);dispose();
  assert.equal(env.frames.size,0);assert.equal(disconnected,true);
  env.viewport.dispatchEvent(new Event('resize'));env.view.dispatchEvent(new Event('scroll'));notify();assert.equal(env.frames.size,0);
 }finally{if(saved===undefined)delete globalThis.ResizeObserver;else globalThis.ResizeObserver=saved;}
});
