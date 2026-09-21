import * as T from './vendor/three.module.js';

// Collision checks use local boxes and rigid transforms, never triangle buffers
// or current display visibility. Preserve hidden physical obstructions.
const STRIDE=14;
export const inspectionAbort=()=>new DOMException('Inspection cancelled','AbortError');
export const yieldInspection=()=>new Promise(resolve=>setTimeout(resolve,0));
export async function captureEmergencyReview(model,{signal,onProgress=()=>{}}={}){
 const check=()=>{if(signal?.aborted)throw inspectionAbort();};check();
 const data=new Float64Array(model.parts.length*STRIDE),names=[],boxes=[],geometryIds=new Map();let count=0,deadline=performance.now()+6;
 for(let i=0;i<model.parts.length;i++){
  const p=model.parts[i];
  if(!p.floorAllocationLegacy&&p.system!=='internal'){
   let g=geometryIds.get(p.geometry);
   if(g===undefined){p.geometry.computeBoundingBox();g=boxes.length/6;geometryIds.set(p.geometry,g);boxes.push(...p.geometry.boundingBox.min.toArray(),...p.geometry.boundingBox.max.toArray());}
   const offset=count++*STRIDE;
   data.set([p.id,g,p.system==='pipe'?1:0,p.insulationThickness??.05,p.position.x,p.position.y,p.position.z,p.quaternion.x,p.quaternion.y,p.quaternion.z,p.quaternion.w,p.scale.x,p.scale.y,p.scale.z],offset);names.push(p.name);
  }
  if(performance.now()>=deadline){onProgress({stage:'prepare',fraction:(i+1)/model.parts.length});await yieldInspection();check();deadline=performance.now()+6;}
 }
 const walkways=model.walkways?Object.fromEntries(['revision','widthM','headroomM','segments','destinations','crossings'].map(k=>[k,model.walkways[k]])):null;
 const metadata=structuredClone({configuration:model.designScenario,scope:model.scope,walkways,access:{zones:model.access?.zones||[]},containment:{emergencyStations:model.containment?.emergencyStations||[],cells:(model.containment?.cells||[]).map(c=>({tag:c.tag,patches:c.patches,storage:c.storage}))}});
 check();return {data,boxes:new Float64Array(boxes),names,count,metadata};
}
export function restoreEmergencyReview(snapshot){
 const {data,boxes,names,count,metadata}=snapshot,geometries=[];
 for(let i=0;i<boxes.length;i+=6)geometries.push({boundingBox:new T.Box3(new T.Vector3(...boxes.subarray(i,i+3)),new T.Vector3(...boxes.subarray(i+3,i+6))),computeBoundingBox(){}});
 const parts=[];
 for(let i=0;i<count;i++){const o=i*STRIDE;parts.push({id:data[o],name:names[i],geometry:geometries[data[o+1]],system:data[o+2]?'pipe':'frame',insulationThickness:data[o+3],position:new T.Vector3(...data.subarray(o+4,o+7)),quaternion:new T.Quaternion(...data.subarray(o+7,o+11)),scale:new T.Vector3(...data.subarray(o+11,o+14))});}
 return {...metadata,parts};
}
export async function emergencySnapshotKey(snapshot){
 if(!globalThis.crypto?.subtle)return null; // Unavailable hashing disables reuse.
 const payload=new TextEncoder().encode(JSON.stringify([snapshot.count,snapshot.names,snapshot.metadata]));
 const hashes=await Promise.all([snapshot.data,snapshot.boxes,payload].map(a=>crypto.subtle.digest('SHA-256',a)));
 return hashes.map(b=>Array.from(new Uint8Array(b),n=>n.toString(16).padStart(2,'0')).join('')).join(':');
}
