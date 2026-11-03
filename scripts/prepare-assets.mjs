import { mkdir,copyFile,readdir,readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source=new URL('../node_modules/@mediapipe/tasks-vision/wasm/',import.meta.url);
const destination=new URL('../public/mediapipe/',import.meta.url);
await mkdir(destination,{recursive:true});
for(const file of await readdir(source))if(/\.(js|wasm)$/.test(file))await copyFile(new URL(file,source),new URL(file,destination));
const licenses=new URL('../public/licenses/',import.meta.url);
await mkdir(licenses,{recursive:true});
const lock=JSON.parse(await readFile(new URL('../package-lock.json',import.meta.url),'utf8'));
const notices=['Licenses and notices for installed runtime dependencies. Generated from the installed packages.'];
for(const [location,info] of Object.entries(lock.packages)){
  if(!location||info.dev||!location.includes('node_modules/'))continue;
  const folder=new URL('../'+location+'/',import.meta.url);
  try{
    const pkg=JSON.parse(await readFile(new URL('package.json',folder),'utf8'));
    const files=(await readdir(folder)).filter(name=>/^(licen[cs]e|copying|notice|authors)(\.|$)/i.test(name));
    notices.push(`\n${pkg.name} ${pkg.version} — ${pkg.license??'See package'}\n`);
    for(const name of files){
      const content=await readFile(new URL(name,folder),'utf8');
      notices.push(content);
      await writeFile(new URL(pkg.name.replace(/[@/]/g,'-')+'-'+name+'.txt',licenses),content);
    }
    if(!files.length){
      const readme=(await readdir(folder)).find(name=>/^readme(\.|$)/i.test(name));
      if(readme)notices.push(await readFile(new URL(readme,folder),'utf8'));
    }
  }catch(error){if(error.code!=='ENOENT')throw error;}
}
await writeFile(new URL('opensheetmusicdisplay-bundle-NOTICES.txt',licenses),notices.join('\n'));
console.log('Runtime MediaPipe preparado em '+fileURLToPath(destination));
