import {walkwayFireAccess} from './walkway-fire-access.js';
import * as T from './vendor/three.module.js';
import {componentEnvelope,componentIntersectsBox} from './access-review.js';
import {fireReservedZones,inspectFireSafety} from './fire-safety-review.js';
import {ENGINEER_ROUTES} from './engineer-routes.js';
const V=a=>new T.Vector3(...a),B=v=>new T.Box3(V(v.min),V(v.max));

// A conservative walking graph on declared grade aisles. No straight-line radii,
// no passage through containment, and no credit across a forklift reservation.
export function calculateFireAccess(model,review=inspectFireSafety(model)){
 if(model.walkways)return walkwayFireAccess(model,review);
 const step=.5,radius=.3,height=2.1,nodes=new Map(),walk=model.access.zones.filter(z=>z.kind==='pedestrian'&&z.min[1]<.1);
 const key=(x,z)=>`${Math.round(x/step)},${Math.round(z/step)}`;
 const within=(x,z)=>walk.some(w=>x-radius>=w.min[0]-1e-8&&x+radius<=w.max[0]+1e-8&&z-radius>=w.min[2]-1e-8&&z+radius<=w.max[2]+1e-8);
 for(const w of walk)for(let x=Math.ceil(w.min[0]/step)*step;x<=w.max[0];x+=step)for(let z=Math.ceil(w.min[2]/step)*step;z<=w.max[2];z+=step)if(within(x,z))nodes.set(key(x,z),{key:key(x,z),point:[x,.035,z],edges:[]});
 const index=new Map(),bin=4;
 const keys=b=>{const a=[];for(let x=Math.floor(b.min.x/bin);x<=Math.floor(b.max.x/bin);x++)for(let z=Math.floor(b.min.z/bin);z<=Math.floor(b.max.z/bin);z++)a.push(x+','+z);return a;};
 const insert=o=>{for(const k of keys(o.bounds)){if(!index.has(k))index.set(k,[]);index.get(k).push(o);}};
 for(const p of model.parts){if(p.system==='internal'||p.floorAllocationLegacy)continue;const allowance=p.system==='pipe'?(p.insulationThickness??.05):0,bounds=componentEnvelope(p,allowance);if(bounds.max.y<=.03||bounds.min.y>=height+.04)continue;insert({p,bounds,allowance});}
 for(const z of fireReservedZones(model).filter(z=>['vehicle','chemical-containment'].includes(z.kind)))insert({bounds:B(z)});
 function clear(a,b){const target=new T.Box3(V([Math.min(a[0],b[0])-radius,.035,Math.min(a[2],b[2])-radius]),V([Math.max(a[0],b[0])+radius,height+.035,Math.max(a[2],b[2])+radius])),seen=new Set();for(const k of keys(target))for(const o of index.get(k)||[]){if(seen.has(o))continue;seen.add(o);if(o.bounds.intersectsBox(target)&&(!o.p||componentIntersectsBox(o.p,target,o.allowance,o.bounds)))return false;}return true;}
 for(const [k,n]of nodes)if(!clear(n.point,n.point))nodes.delete(k);
 for(const n of nodes.values())for(const [dx,dz]of[[step,0],[-step,0],[0,step],[0,-step]]){const other=nodes.get(key(n.point[0]+dx,n.point[2]+dz));if(other&&clear(n.point,other.point))n.edges.push({to:other.key,distance:step});}
 const grade=[...nodes.values()];
 function connect(id,point,max){const n={key:id,point,edges:[]};for(const other of grade){const d=Math.hypot(point[0]-other.point[0],point[2]-other.point[2]);if(d>max||!clear(point,other.point))continue;n.edges.push({to:other.key,distance:d});other.edges.push({to:id,distance:d});}nodes.set(id,n);return n;}
 const stations=model.fireSafety.stations.map(s=>{const geometryClear=review.stations.find(r=>r.tag===s.tag)?.geometryClear;return {tag:s.tag,node:geometryClear?connect(s.tag,s.retrieval,2.5):{edges:[]},geometryClear};});
 const checkpoints=ENGINEER_ROUTES.flatMap(route=>route.points.map((p,i)=>({id:route.id+'-'+i,label:route.label+' · '+route.stops[i],point:[p[0],.035,p[1]],routeId:route.id})));
 // Dijkstra from each connected, physically clear station. Ratings are deliberately
 // not credited: every resulting distance remains a geometric observation.
 const best=new Map();
 for(const station of stations.filter(s=>s.geometryClear&&s.node.edges.length)){
  const dist=new Map([[station.tag,0]]),parent=new Map(),queue=[[0,station.tag]];
  while(queue.length){queue.sort((a,b)=>b[0]-a[0]);const [d,id]=queue.pop();if(d!==dist.get(id))continue;for(const edge of nodes.get(id).edges){const nd=d+edge.distance;if(nd<(dist.get(edge.to)??Infinity)){dist.set(edge.to,nd);parent.set(edge.to,id);queue.push([nd,edge.to]);}}}
  for(const point of checkpoints){
   const options=grade.map(n=>({n,gap:Math.hypot(point.point[0]-n.point[0],point.point[2]-n.point[2])})).filter(o=>o.gap<=.75&&dist.has(o.n.key)&&clear(point.point,o.n.point));
   for(const option of options){const distance=dist.get(option.n.key)+option.gap;if(distance>=(best.get(point.id)?.distance??Infinity))continue;const path=[point.point];let id=option.n.key;while(id){path.push(nodes.get(id).point);id=parent.get(id);}best.set(point.id,{station:station.tag,distance,path});}
  }
 }
 const results=checkpoints.map(p=>({...p,...best.get(p.id),status:best.has(p.id)?'Geometric route found — suitability unverified':'No screened connection',codeCoverageVerified:false}));
 return {revision:model.fireSafety.basis.revision,gridStepM:step,personRadiusM:radius,headroomM:height,aisleNodes:grade.length,stationConnections:stations.map(s=>({tag:s.tag,connected:s.geometryClear&&s.node.edges.length>0})),checkpoints:results,connected:results.filter(p=>p.station).length,total:results.length,codeCoverageVerified:false,method:'0.5 m four-direction grid on declared grade pedestrian aisles; 0.3 m lateral allowance and 2.1 m headroom are project assumptions. Screened station-to-aisle connectors up to 2.5 m are proposed. Actual component envelopes, insulation, containment and all forklift reservations block travel. Elevated areas and unsampled work positions require separate review.'};
}
