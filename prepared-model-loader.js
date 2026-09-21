import {PREPARED_MODEL_MANIFEST as manifest} from './prepared-model-manifest.js';
import {decodePreparedModel} from './prepared-model-codec.js';

export const configurationKey=s=>[s.scope||'feed',s.a160||'baseline',s.argonSource||'bulk'].join('|')+(s.a400?'|a400:'+s.a400:'');
async function cache(action,key,value){
 if(!globalThis.indexedDB)return null;
 return new Promise(resolve=>{
  let db,done=false;const finish=v=>{if(done)return;done=true;clearTimeout(timer);db?.close();resolve(v??null);},timer=setTimeout(()=>finish(),1500);
  let open;try{open=indexedDB.open('rgo-prepared-model-v1',1);}catch{finish();return;}open.onupgradeneeded=()=>open.result.createObjectStore('models');open.onerror=()=>finish();open.onblocked=()=>finish();
  open.onsuccess=()=>{db=open.result;if(done){db.close();return;}try{const tx=db.transaction('models',action==='get'?'readonly':'readwrite'),store=tx.objectStore('models');let result;
   if(action==='get'){const request=store.get(key);request.onsuccess=()=>{result=request.result;};}
   else {store.clear();store.put(value,key);}
   tx.oncomplete=()=>finish(result);tx.onerror=()=>finish();tx.onabort=()=>finish();
  }catch{finish();}};
 });
}
async function inflate(buffer,encoding="gzip"){
 if(!globalThis.DecompressionStream)throw Error('This browser needs an update to load the prepared plant.');
 return new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream(encoding))).arrayBuffer();
}
function buildInWorker(selection,onProgress,signal){
 return new Promise((resolve,reject)=>{
  if(!globalThis.Worker){reject(Error('This configuration needs browser worker support. Please use an up-to-date browser.'));return;}
  const worker=new Worker(new URL('./prepared-model-worker.js',import.meta.url),{type:'module'}),timer=setTimeout(()=>finish(Error('Preparing this configuration took too long. Please retry.')),120000);
  const abort=()=>finish(new DOMException('Loading cancelled','AbortError'));
  function finish(error,bytes){clearTimeout(timer);signal?.removeEventListener('abort',abort);worker.terminate();error?reject(error):resolve(bytes);}
  worker.onmessage=({data})=>{if(data.error)finish(Error(data.error));else if(data.bytes)finish(null,data.bytes);else onProgress(data.progress);};
  worker.onerror=e=>finish(Error(e.message||'Could not prepare this configuration. Please retry.'));
  signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted){abort();return;}worker.postMessage({selection});
 });
}
export async function loadPreparedModel(selection,{onProgress=()=>{},signal,force=false,fetcher=globalThis.fetch,baseURL=globalThis.document?.baseURI||import.meta.url}={}){
 const started=performance.now(),key=configurationKey(selection),asset=manifest.models[key],cacheKey=manifest.revision+'|'+key;let bytes,source,encoding="gzip",downloadMs=0;
 if(asset){
  onProgress({phase:'Loading prepared plant',progress:0});
  let brotli=false;
  const format=asset.formats[brotli?'brotli':'gzip'];encoding=format.encoding;let complete=0;
  const downloadStart=performance.now();
  const pieces=await Promise.all(format.pieces.map(async piece=>{
   const response=await fetcher(new URL(piece.url,baseURL),{signal,cache:force?'reload':'force-cache'});
   if(!response.ok)throw Error('The plant download did not finish. Please retry.');
   const bytes=await response.arrayBuffer(),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
   if(hash!==piece.sha256)throw Error('The downloaded plant is incomplete or out of date. Please retry.');
   complete+=bytes.byteLength;onProgress({phase:'Loading prepared plant',progress:complete/format.bytes});return new Uint8Array(bytes);
  }));
  const joined=new Uint8Array(format.bytes);let offset=0;for(const piece of pieces){joined.set(piece,offset);offset+=piece.length;}bytes=joined.buffer;source='prepared';downloadMs=performance.now()-downloadStart;
 }else{
  onProgress({phase:'Loading selected configuration',progress:0});
  if(!force)bytes=await cache('get',cacheKey);
  if(bytes){source='cached configuration';try{const model=await decodePreparedModel(await inflate(bytes),{onProgress});if(configurationKey(model.preparedSelection)!==key)throw Error('Configuration mismatch');return {model,timing:{source,totalMs:performance.now()-started}};}catch{bytes=null;}}
  onProgress({phase:'Preparing selected configuration',progress:0});bytes=await buildInWorker(selection,onProgress,signal);source='background build';
  void cache('put',cacheKey,bytes);
 }
 onProgress({phase:'Opening plant geometry',progress:0});const decodeStart=performance.now(),inflated=await inflate(bytes,encoding),inflateMs=performance.now()-decodeStart,reconstructStart=performance.now(),model=await decodePreparedModel(inflated,{onProgress}),reconstructMs=performance.now()-reconstructStart;
 if(model.preparedSelection&&configurationKey(model.preparedSelection)!==key)throw Error('Prepared plant configuration mismatch');
 return {model,timing:{source,downloadMs,inflateMs,reconstructMs,decodeMs:performance.now()-decodeStart,totalMs:performance.now()-started}};
}
