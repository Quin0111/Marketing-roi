import { createServer, preview as createPreview } from 'vite';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { openSync, closeSync, mkdirSync, writeFileSync, writeSync } from 'node:fs';
import { resolve } from 'node:path';
import { createConnection } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { get } from 'node:http';
import { randomBytes } from 'node:crypto';

function backendReady(apiBase) {
  // Explicit loopback HTTP: independent of any fetch/proxy dispatcher installed
  // by the host running Playwright.
  return new Promise(resolve=>{
    const request=get(`${apiBase}/health`,response=>{
      let data='';response.on('data',chunk=>data+=chunk);
      response.on('end',()=>{try{resolve(response.statusCode===200&&JSON.parse(data).model_ready);}catch{resolve(false);}});
    });
    request.setTimeout(1000,()=>request.destroy());request.on('error',()=>resolve(false));
  });
}

export function portOpen(port) {
  return new Promise(resolve => {
    const socket=createConnection({host:'127.0.0.1',port});
    socket.once('connect',()=>{socket.destroy();resolve(true);});
    socket.once('error',()=>{socket.destroy();resolve(false);});
  });
}
async function deadline(promise,ms,label) {
  let timer;
  try{return await Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(`${label} exceeded ${ms}ms; no forced termination was used`)),ms);})]);}
  finally{clearTimeout(timer);}
}

// Avoid Playwright's Windows shell/taskkill WebServer teardown. Own the actual
// Vite server in-process, and request Uvicorn shutdown by a private control
// channel in the TEST launcher, awaiting real exit. No production stop endpoint.
export default async function setup() {
  const out=resolve(process.env.DM_TEST_RESULTS_DIR || 'tests/results');
  mkdirSync(out,{recursive:true});
  const usePreview=Boolean(process.env.DM_TEST_BUILD_DIR);
  const apiPort=Number(process.env.DM_TEST_API_PORT||8000);
  if(!Number.isInteger(apiPort)||apiPort<1||apiPort>65535)throw Error('Invalid test API port');
  const apiBase=`http://127.0.0.1:${apiPort}`;
  for(const port of [apiPort,5173,...(usePreview?[4173]:[])])if(await portOpen(port))throw Error(`Port ${port} occupied; refusing to reuse or terminate another server`);
  const log=openSync(`${out}/e2e-backend.log`,'w');
  const token=randomBytes(24).toString('hex');
  const child=spawn(resolve('backend/.venv/Scripts/python.exe'),['-X','utf8','tests/support/serve_backend.py'],{
    windowsHide:true,stdio:['ignore','pipe',log],env:{...process.env,PYTHONUNBUFFERED:'1',DM_TEST_CONTROL_TOKEN:token},
  });
  let controlPort,serverPid,stdoutBuffer='';
  child.stdout.setEncoding('utf8');child.stdout.on('data',data=>{
    writeSync(log,data);
    stdoutBuffer+=data;
    const lines=stdoutBuffer.split('\n');stdoutBuffer=lines.pop();
    for(const line of lines){try{const value=JSON.parse(line);if(value.controlPort){controlPort=value.controlPort;serverPid=value.serverPid;}}catch{}}
  });
  const exited=once(child,'close');
  let vite,preview;
  const cleanup=async()=>{
    const started=Date.now();
    try {
      if(preview)await deadline(new Promise((resolve,reject)=>preview.httpServer.close(error=>error?reject(error):resolve())),10000,'Preview close');
      if(vite)await deadline(vite.close(),10000,'Vite close');
      if(controlPort){
        await deadline(new Promise((resolve,reject)=>{
          const socket=createConnection({host:'127.0.0.1',port:controlPort});
          socket.on('connect',()=>socket.end(`${token}\n`));socket.on('error',reject);socket.on('close',resolve);
        }),3000,'Shutdown request');
      }
      const [code,signal]=await deadline(exited,10000,'Uvicorn graceful exit');
      const open={[apiPort]:await portOpen(apiPort),5173:await portOpen(5173),...(usePreview?{4173:await portOpen(4173)}:{}),...(controlPort?{[controlPort]:await portOpen(controlPort)}:{})};
      let backendStillAlive=false;
      if(serverPid){try{process.kill(serverPid,0);backendStillAlive=true;}catch(error){if(error.code!=='ESRCH')throw error;}}
      const report={launcherPid:child.pid,backendPid:serverPid,backendStillAlive,backendExitCode:code,backendSignal:signal,portsOpen:open,
        mechanism:'Vite.close + authenticated test-only loopback channel -> Uvicorn.should_exit; awaited exit, no process.exit/force kill',elapsedMs:Date.now()-started};
      writeFileSync(`${out}/e2e-cleanup.json`,JSON.stringify(report,null,2));
      if(code!==0||signal||backendStillAlive||Object.values(open).some(Boolean))throw Error(`Cleanup failed: ${JSON.stringify(report)}`);
    } finally {closeSync(log);}
  };
  try {
    const expiry=Date.now()+30000;
    while(true){
      if(child.exitCode!==null)throw Error('Backend exited during startup; see e2e-backend.log');
      if(await backendReady(apiBase))break;
      if(Date.now()>expiry)throw Error('Backend startup exceeded 30 seconds');
      await delay(100);
    }
    process.env.VITE_API_BASE_URL=apiBase;
    process.env.VITE_API_TIMEOUT_MS='1000';
    vite=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true,watch:{ignored:['**/tests/results/**','**/research/**']}}});
    await vite.listen();
    if(usePreview)preview=await createPreview({build:{outDir:resolve(process.env.DM_TEST_BUILD_DIR)},preview:{host:'127.0.0.1',port:4173,strictPort:true}});
    return cleanup;
  } catch(error) {await cleanup();throw error;}
}
