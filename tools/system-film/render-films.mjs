import {spawn} from 'node:child_process';import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const cli=process.env.HYPERFRAMES_CLI||'/Users/carterjensen/.npm/_npx/30acb1c3e824064a/node_modules/hyperframes/dist/cli.js';
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{cwd:project,stdio:'inherit'});p.on('exit',code=>code===0?resolve():reject(new Error(cmd+' exit '+code)))});
for(const id of ['editorial-clean','editorial-portrait','big-type','night-rodeo']){
 const dir='tools/system-film/'+id,video='assets/media/system-'+id+'.mp4';
 await run(process.execPath,[cli,'render',dir,'--resolution','4k','--fps','30','--crf','14','--workers','1','--strict','--output',video]);
 await run('/opt/homebrew/bin/ffmpeg',['-y','-i',video,'-frames:v','1','-q:v','1','assets/media/system-'+id+'.jpg']);
 console.log('FILM COMPLETE',id,(await fs.stat(path.join(project,video))).size);
}
