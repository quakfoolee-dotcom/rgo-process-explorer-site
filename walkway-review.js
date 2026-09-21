import * as T from './vendor/three.module.js';
import {componentEnvelope,componentIntersectsBox} from './access-review.js';
import {TRANSPORT_ZONES} from './transport-layout.js';
import {walkwayVolume} from './walkway-system.js';
const V=a=>new T.Vector3(...a),B=v=>new T.Box3(V(v.min),V(v.max));
function* scanWalkways(model){
 const w=model.walkways;if(!w)return null;const index=new Map(),bin=4;
 const keys=b=>{const a=[];for(let x=Math.floor(b.min.x/bin);x<=Math.floor(b.max.x/bin);x++)for(let z=Math.floor(b.min.z/bin);z<=Math.floor(b.max.z/bin);z++)a.push(x+','+z);return a;};
 function add(o){for(const k of keys(o.box)){if(!index.has(k))index.set(k,[]);index.get(k).push(o);}}
 let scanned=0;for(const p of model.parts){if(++scanned%2500===0)yield; if(p.floorAllocationLegacy||p.system==='internal')continue;const allowance=p.system==='pipe'?(p.insulationThickness??.05):0,box=componentEnvelope(p,allowance);if(box.max.y<=.035||box.min.y>=2.335)continue;add({p,box,allowance});}
 for(const cell of model.containment?.cells||[])for(const r of [...cell.patches,[cell.storage.min[0]-.21,cell.storage.min[2]-.21,cell.storage.max[0]+.21,cell.storage.max[2]+.21]])add({id:cell.tag,box:B({min:[r[0],.035,r[1]],max:[r[2],2.335,r[3]]})});
 for(const z of model.access?.zones||[])if(z.id==='A400-DRAIN-CHANNEL')add({id:z.id,box:B({min:[z.min[0],.035,z.min[2]],max:[z.max[0],2.335,z.max[2]]})});
 const segments=[];for(const s of w.segments){yield;const target=B(walkwayVolume(s)),seen=new Set(),findings=[];for(const k of keys(target))for(const o of index.get(k)||[]){if(seen.has(o))continue;seen.add(o);if(target.intersectsBox(o.box)&&(!o.p||componentIntersectsBox(o.p,target,o.allowance,o.box)))findings.push({id:o.p?.id||o.id,name:o.p?.name||o.id});}
  const crossings=[];for(const z of TRANSPORT_ZONES){const intersect=target.clone().intersect(B(z));if(intersect.isEmpty())continue;const c=w.crossings.find(c=>intersect.min.x>=c.rect[0]-1e-6&&intersect.max.x<=c.rect[2]+1e-6&&intersect.min.z>=c.rect[1]-1e-6&&intersect.max.z<=c.rect[3]+1e-6);if(c)crossings.push(c.id);else findings.push({id:z.id,name:'Undesignated forklift overlap'});}
  segments.push({id:s.id,clear:!findings.length,findings,crossings:[...new Set(crossings)]});}
 const result={revision:w.revision,segments,clear:segments.every(s=>s.clear),widthM:w.widthM,headroomM:w.headroomM,qualified:false};w.review=result;return result;
}
// Both callers consume the same clearance algorithm; browsing yields between
// bounded batches so cancellation and the interface remain responsive.
export function inspectWalkways(model){const scan=scanWalkways(model);let step;do{step=scan.next();}while(!step.done);return step.value;}
export async function inspectWalkwaysAsync(model,cancelled=()=>false){const scan=scanWalkways(model);let step;do{if(cancelled())return null;step=scan.next();if(!step.done)await new Promise(resolve=>setTimeout(resolve,0));}while(!step.done);return step.value;}
export function walkwayGraph(w,review=w.review){
 const segments=w.segments.filter(s=>!review||review.segments.find(r=>r.id===s.id)?.clear),nodes=new Map(),key=p=>p.map(n=>Math.round(n*1e6)/1e6).join(','),on=(p,s)=>Math.abs(Math.hypot(p[0]-s.a[0],p[1]-s.a[1])+Math.hypot(p[0]-s.b[0],p[1]-s.b[1])-Math.hypot(s.a[0]-s.b[0],s.a[1]-s.b[1]))<1e-6;
 const get=p=>{const k=key(p);if(!nodes.has(k))nodes.set(k,{id:k,point:[...p],edges:[]});return nodes.get(k);};
 const candidates=segments.flatMap(s=>[s.a,s.b]);for(const a of segments)for(const b of segments){const p=[a.a[0],b.a[1]],q=[b.a[0],a.a[1]];if(on(p,a)&&on(p,b))candidates.push(p);if(on(q,a)&&on(q,b))candidates.push(q);}
 for(const d of w.destinations)if(d.walkPoint)candidates.push(d.walkPoint);for(const s of segments){const points=[...new Map(candidates.filter(p=>on(p,s)).map(p=>[key(p),p])).values()].sort((p,q)=>Math.hypot(p[0]-s.a[0],p[1]-s.a[1])-Math.hypot(q[0]-s.a[0],q[1]-s.a[1]));for(let i=1;i<points.length;i++){const a=get(points[i-1]),b=get(points[i]),distance=Math.hypot(a.point[0]-b.point[0],a.point[1]-b.point[1]);if(distance<1e-8)continue;a.edges.push({to:b.id,distance,segment:s.id});b.edges.push({to:a.id,distance,segment:s.id});}}
 return {nodes,key};
}
export function shortestWalk(graph,from,to){const start=graph.key(from),end=graph.key(to);if(!graph.nodes.has(start)||!graph.nodes.has(end))return null;const dist=new Map([[start,0]]),parent=new Map(),queue=[[0,start]];while(queue.length){queue.sort((a,b)=>b[0]-a[0]);const [d,id]=queue.pop();if(d!==dist.get(id))continue;if(id===end){const path=[];for(let k=end;k;k=parent.get(k))path.push(graph.nodes.get(k).point);return {distance:d,path:path.reverse()};}for(const e of graph.nodes.get(id).edges){const nd=d+e.distance;if(nd<(dist.get(e.to)??Infinity)){dist.set(e.to,nd);parent.set(e.to,id);queue.push([nd,e.to]);}}}return null;}
