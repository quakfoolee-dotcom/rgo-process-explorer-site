import {captureEmergencyReview,emergencySnapshotKey,inspectionAbort,yieldInspection} from './emergency-review-snapshot.js';

export function createEmergencyReviewService(model,{workerFactory=()=>new Worker(new URL('./emergency-review-worker.js',import.meta.url),{type:'module'})}={}){
 let cached=null;
 return {
  async run({force=false,signal,onProgress=()=>{}}={}){
   const check=()=>{if(signal?.aborted)throw inspectionAbort();};
   await yieldInspection();check();
   const snapshot=await captureEmergencyReview(model,{signal,onProgress}),key=await emergencySnapshotKey(snapshot);check();
   if(!force&&key&&cached?.key===key)return {...cached.result,reused:true};
   return new Promise((resolve,reject)=>{
    let worker,timeout,settled=false;
    const finish=(error,result)=>{if(settled)return;settled=true;clearTimeout(timeout);signal?.removeEventListener('abort',cancel);worker?.terminate();if(error)reject(error);else resolve(result);};
    const cancel=()=>finish(inspectionAbort());
    try{
     check();worker=workerFactory();signal?.addEventListener('abort',cancel,{once:true});
     worker.onmessage=({data})=>{
      if(settled||signal?.aborted)return;
      if(data.type==='progress')onProgress(data);
      else if(data.type==='error')finish(new Error(data.message));
      else if(data.type==='result'){const result={review:data.review,coverage:data.coverage,timing:data.timing,checkedAt:new Date().toISOString(),reused:false};if(key)cached={key,result};finish(null,result);}
     };
     worker.onerror=()=>finish(new Error('Background inspection could not start. Retry the check.'));
     worker.onmessageerror=()=>finish(new Error('Background inspection returned unreadable results. Retry the check.'));
     timeout=setTimeout(()=>finish(new Error('Inspection took too long. Retry the check.')),60000);
     onProgress({stage:'stations'});worker.postMessage(snapshot,[snapshot.data.buffer,snapshot.boxes.buffer]);
    }catch(error){finish(error);}
   });
  },
  clear(){cached=null;}
 };
}
