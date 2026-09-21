import * as T from './vendor/three.module.js';
import {componentEnvelope} from './access-review.js';
import {makeScreeningData,pathBodyDistance} from './inspection.js';
import {ACCESS_DESIGN} from './access-design.js';

// Dimension and obstruction screening of the modeled access routes, not a code certificate.
export function inspectPermanentAccess(model){
 const system=model.accessSystem,C=ACCESS_DESIGN.criteria,findings=[],checks=[],parts=new Map(model.parts.map(p=>[p.id,p]));
 if(!system||model.scope==='future')return{passes:true,findings,checks,scope:'No active permanent access'};
 const data=makeScreeningData(model),bodyById=new Map(data.bodies.map(b=>[b.id,b])),bounds=model.parts.filter(p=>p.system!=='internal').map(p=>({p,bb:componentEnvelope(p,p.system==='pipe'?(p.insulationThickness??.08):0)})),fail=(tag,reason,extra={})=>findings.push({tag,reason,...extra});
 const volume=(tag,at,width,depth,exclude=[])=>{
  const min=[at[0]-width/2,at[1]+.035,at[2]-depth/2],max=[at[0]+width/2,at[1]+C.headroom,at[2]+depth/2],bb=new T.Box3(new T.Vector3(...min),new T.Vector3(...max)),ids=new Set(exclude);
  for(const {p,bb:ob} of bounds){if(ids.has(p.id)||!bb.intersectsBox(ob))continue;
   // An oriented body avoids the gross bounding-box overestimate of an inclined conveyor.
   const body=bodyById.get(p.id);if(body&&['box','cylinder'].includes(body.kind)&&Math.abs(p.quaternion.w)<.999){let hit=false;for(const x of[min[0],at[0],max[0]])for(const z of[min[2],at[2],max[2]])if(pathBodyDistance([[x,min[1],z],[x,max[1],z]],body)<.012)hit=true;if(!hit)continue;}
   fail(tag,'Access or headroom overlap',{partId:p.id,part:p.name,at,underside:ob.min.y});
  }
 };
 for(const f of system.flights){
  const treads=f.treads.map(id=>parts.get(id)).filter(Boolean);if(treads.length!==f.riserCount-1)fail(f.tag,'Missing tread');
  const heights=[f.y0,...treads.map((p,i)=>Math.max(componentEnvelope(p).max.y,parts.has(f.nosingIds?.[i])?componentEnvelope(parts.get(f.nosingIds[i])).max.y:-Infinity)),f.y1],risers=heights.slice(1).map((y,i)=>y-heights[i]),goings=treads.slice(1).map((p,i)=>Math.abs(p.position.z-treads[i].position.z));
  if(risers.some(r=>r<=0||r>C.maxRiser+.001)||Math.max(...risers)-Math.min(...risers)>.003)fail(f.tag,'Unequal or excessive riser');
  if(goings.some(g=>g<C.minGoing-.001)||f.y1-f.y0>C.maxFlightRise+.001)fail(f.tag,'Going or flight rise outside proposed criteria');
  if(treads.some(p=>componentEnvelope(p).max.x-componentEnvelope(p).min.x<C.minClearWidth))fail(f.tag,'Insufficient tread width');
  if(f.railIds.filter(id=>parts.has(id)).length!==4)fail(f.tag,'Missing handrail or midrail');
  for(const p of treads)volume(f.tag,[p.position.x,componentEnvelope(p).max.y,p.position.z],C.minClearWidth,Math.min(.12,f.going/2),[p.id]);
  checks.push({tag:f.tag,risers,minimumGoing:Math.min(...goings),flightRise:f.y1-f.y0,treads:treads.length});
 }
 for(const d of system.decks){const p=parts.get(d.partId);if(!p){fail(d.id,'Missing deck');continue;}if(Math.abs(componentEnvelope(p).max.y-d.min[1])>.025)fail(d.id,'Standing surface elevation differs from deck');
  if(d.min[1]>0){if(!d.guardParts?.length)fail(d.id,'Missing perimeter guarding');for(const id of d.guardParts||[])if(!parts.has(id))fail(d.id,'Missing guard component',{partId:id});}
  // Landing centers and long bridge centerlines; edges and task standing positions are checked separately.
  if(d.routeScreen===false)continue;const dx=d.max[0]-d.min[0],dz=d.max[2]-d.min[2],wide=dx>=dz,n=Math.ceil(Math.max(dx,dz)/.55);for(let i=0;i<n;i++){const t=(i+.5)/n,at=[wide?d.min[0]+dx*t:(d.min[0]+d.max[0])/2,d.min[1],wide?(d.min[2]+d.max[2])/2:d.min[2]+dz*t];
   // Short connecting panels join adjacent decks; keep samples away from closed end guards.
   if(wide&&(at[0]<d.min[0]+.6||at[0]>d.max[0]-.6)||!wide&&(at[2]<d.min[2]+.6||at[2]>d.max[2]-.6))continue;
   volume(d.id,at,wide?.12:Math.min(C.minClearWidth,dx-.14),wide?Math.min(C.minClearWidth,dz-.14):.12,[p.id]);
  }
 }
 const graph=new Map(),connect=(a,b)=>{if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());graph.get(a).add(b);graph.get(b).add(a);};for(const f of system.flights)connect(f.bottom,f.top);for(const [a,b] of system.links)connect(a,b);
 for(const [a,b]of system.links){const da=system.decks.find(d=>d.id===a),db=system.decks.find(d=>d.id===b);if(!da||!db){fail(a+' → '+b,'Missing connecting deck');continue;}const x0=Math.max(da.min[0],db.min[0]),x1=Math.min(da.max[0],db.max[0]),z0=Math.max(da.min[2],db.min[2]),z1=Math.min(da.max[2],db.max[2]);if(x1<x0-.025||z1<z0-.025||Math.abs(da.min[1]-db.min[1])>.025){fail(a+' → '+b,'Disconnected landing edge');continue;}if(Math.min(x1-x0,z1-z0)<.025&&Math.max(x1-x0,z1-z0)<C.minClearWidth)fail(a+' → '+b,'Connection narrower than proposed clear width');volume(a+' → '+b,[(x0+x1)/2,da.min[1],(z0+z1)/2],x1-x0<.025?.12:z1-z0<.025?C.minClearWidth:.5,z1-z0<.025?.12:x1-x0<.025?C.minClearWidth:.5,[da.partId,db.partId]);}
 const reached=new Set(system.towers.map(t=>t.landings[0])),queue=[...reached];for(let i=0;i<queue.length;i++)for(const id of graph.get(queue[i])||[])if(!reached.has(id)){reached.add(id);queue.push(id);}
 for(const task of system.tasks){const p=model.parts.find(p=>p.reactor===task.equipmentId&&p.name===task.partName),d=system.decks.find(d=>d.id===task.deckId);if(!p||!d||!reached.has(d.id)){fail(task.id,'Task has no connected stair route');continue;}if(task.standing[0]<d.min[0]||task.standing[0]>d.max[0]||task.standing[2]<d.min[2]||task.standing[2]>d.max[2])fail(task.id,'Standing position outside assigned deck');
  volume(task.id,task.standing,.9,.9,[p.id]);if(task.id.includes('MANWAY')){const h=p.position.y-task.standing[1],reach=Math.hypot(p.position.x-task.standing[0],p.position.z-task.standing[2]);if(h<.8||h>1.6||reach>.75)fail(task.id,'Cover service point outside proposed reach');}
 }
 const unique=[...new Map(findings.map(f=>[f.tag+'|'+f.reason+'|'+f.partId,f])).values()];return{passes:unique.length===0,findings:unique,checks,connectedDecks:[...reached],limits:'Proposed dimension and sampled clearance screen. Vendor envelopes, structural capacity, continuous swept human movement, lifting, gate operation and rescue require qualification.'};
}
