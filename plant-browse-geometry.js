import {componentIntersectsBox} from './access-review.js';
import * as T from './vendor/three.module.js';

// Runtime cache identity: authored geometry is immutable; editable transforms,
// attribute versions, containment and walkway definitions invalidate reuse.
export function browseGeometryKey(model){
 let h=2166136261,k=5381;const bytes=new DataView(new ArrayBuffer(8));
 const number=n=>{bytes.setFloat64(0,n??0);for(let i=0;i<8;i++){const v=bytes.getUint8(i);h=Math.imul(h^v,16777619);k=Math.imul(k,33)^v;}};
 const text=s=>{for(const c of String(s)){h=Math.imul(h^c.charCodeAt(0),16777619);k=Math.imul(k,33)^c.charCodeAt(0);}};
 number(model.parts.length);
 for(const p of model.parts){text(p.id);for(const v of [p.position.x,p.position.y,p.position.z,p.quaternion.x,p.quaternion.y,p.quaternion.z,p.quaternion.w,p.scale.x,p.scale.y,p.scale.z,p.insulationThickness])number(v);text(p.geometry.uuid);number(p.geometry.attributes.position?.version);number(p.geometry.index?.version);}
 text(JSON.stringify({segments:model.walkways.segments,crossings:model.walkways.crossings,width:model.walkways.widthM,headroom:model.walkways.headroomM,revision:model.walkways.revision,cells:model.containment?.cells,zones:model.access?.zones,accessSystem:model.accessSystem}));
 return (h>>>0).toString(16)+'-'+(k>>>0).toString(16);
}
const yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0));
export async function buildBrowseOcclusion(model,onProgress=()=>{},cancelled=()=>false){
 const bins=new Map(),large=[],matrix=new T.Matrix4(),size=4,material=new T.MeshBasicMaterial({side:T.DoubleSide}),proxy=new T.Mesh(undefined,material);
 proxy.matrixAutoUpdate=false;let count=0;
 for(const p of model.parts){
  if(cancelled()){material.dispose();return null;}
  if(!p.floorAllocationLegacy&&p.system!=='internal'){
   if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();
   const box=p.geometry.boundingBox.clone().applyMatrix4(matrix.compose(p.position,p.quaternion,p.scale));
   if(box.max.y>.04){const o={p,box},x0=Math.floor(box.min.x/size),x1=Math.floor(box.max.x/size),z0=Math.floor(box.min.z/size),z1=Math.floor(box.max.z/size);
    if((x1-x0+1)*(z1-z0+1)>256)large.push(o);else for(let x=x0;x<=x1;x++)for(let z=z0;z<=z1;z++){const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(o);}
   }
  }
  if(++count%2500===0){onProgress(count/model.parts.length);await yieldTask();}
 }
 const test=new T.Vector3();
 function blocked(raycaster,point,exclude=new Set()){
  const distance=raycaster.ray.origin.distanceTo(point),steps=Math.max(1,Math.ceil(Math.hypot(point.x-raycaster.ray.origin.x,point.z-raycaster.ray.origin.z)/1.5)),candidates=new Set(large);
  // Query every crossed grid cell, with neighbours at cell boundaries.
  for(let i=0;i<=steps;i++){const t=i/steps,x=raycaster.ray.origin.x+(point.x-raycaster.ray.origin.x)*t,z=raycaster.ray.origin.z+(point.z-raycaster.ray.origin.z)*t;for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const o of bins.get((Math.floor(x/size)+dx)+','+(Math.floor(z/size)+dz))||[])candidates.add(o);}
  for(const {p,box} of candidates){if(exclude.has(p.id))continue;if(!raycaster.ray.intersectBox(box,test)||test.distanceTo(raycaster.ray.origin)>=distance-.04)continue;
   proxy.geometry=p.geometry;proxy.matrixWorld.compose(p.position,p.quaternion,p.scale);const hits=[];proxy.raycast(raycaster,hits);if(hits.some(h=>h.distance<distance-.04&&h.point.y>.04))return true;
  }return false;
 }
 let lastObstruction=null;
 function bodyClear(a,b,exclude=new Set()){lastObstruction=null;
  const length=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]),steps=Math.max(1,Math.ceil(length/.15));
  for(let i=0;i<=steps;i++){const t=i/steps,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t,box=new T.Box3(new T.Vector3(x-.28,y+.035,z-.28),new T.Vector3(x+.28,y+2.3,z+.28)),candidates=new Set(large);
   for(let ix=Math.floor((x-.4)/size);ix<=Math.floor((x+.4)/size);ix++)for(let iz=Math.floor((z-.4)/size);iz<=Math.floor((z+.4)/size);iz++)for(const o of bins.get(ix+','+iz)||[])candidates.add(o);
   for(const o of candidates){if(exclude.has(o.p.id)&&o.box.max.y<=y+.4)continue;const allowance=o.p.system==='pipe'?(o.p.insulationThickness??.05):0,bb=allowance?o.box.clone().expandByScalar(allowance):o.box;if(bb.intersectsBox(box)&&componentIntersectsBox(o.p,box,allowance,bb)){lastObstruction=o.p.name;return false;}}
  }return true;
 }
 return {blocked,bodyClear,get lastObstruction(){return lastObstruction;},dispose(){bins.clear();large.length=0;material.dispose();}};
}
