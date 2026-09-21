import {createPathIndex} from './path-index.js';
// Endpoint disposition is a geometric review, not proof of pressure integrity or qualification.
import * as T from './vendor/three.module.js';
export function reconcileA3000(model){
 const ids=new Set([...model.ventGas.equipment,...model.exhaustGroups.equipment]),V=p=>new T.Vector3(...p),eps=.0001;
 const pathIndex=createPathIndex(model.edges);
 const declared=[...model.ventGas.interfaces,...model.exhaustGroups.interfaces];
 function classify(point,ownEdges=[]){
  const declaration=declared.find(i=>i.status&&V(i.point).distanceTo(V(point))<eps);
  if(declaration)return {status:declaration.status,note:declaration.note||'Explicit mechanical interface',closure:declaration.closure};
  const ts=model.terminals.filter(t=>V(t.point).distanceTo(V(point))<eps),text=ts.map(t=>t.label).join('; ');
  if(/blind|Closed spare|sealed access|Closed stack sample/i.test(text))return {status:'positively blinded',note:text};
  if(/Internal condensate collection surface/.test(text))return {status:'connected',note:text+' — internal collection representation'};
  if(/air gap/i.test(text))return {status:'intentional air gap',note:text};
  if(/atmospheric permit|intentional outlet|Independent NaOH breathing|overflow to local/i.test(text))return {status:'intentional discharge',note:text};
  const links=pathIndex.at(point,eps).filter(i=>!ownEdges.includes(i));
  if(links.length)return {status:'connected',note:'Mating centreline or declared equipment passage; seal, bore and pressure qualification are separate',linkedEdges:links};
  return {status:'unresolved',note:text||'No independently connected endpoint found; resolve before operating release'};
 }
 const endpoints=model.routes.filter(r=>ids.has(r.reactor)).flatMap(r=>(r.endpoints||[]).map((point,end)=>({id:r.id+':'+end,equipment:model.equipment[r.reactor].tag,route:r.label,stream:r.pfdStream||null,point,...classify(point,r.edgeIndices)})));
 const nozzles=model.ports.filter(p=>ids.has(p.reactor)).map(p=>{
  const at=pathIndex.at(p.point,eps);
  const explicit=classify(p.point,at.length===1?at:[]);
  return {id:p.id,equipment:model.equipment[p.reactor].tag,name:p.label,point:p.point,radius:p.radius,...explicit};
 });
 for(const i of model.ventGas.interfaces)if(!i.status){const n=nozzles.find(n=>V(n.point).distanceTo(V(i.point))<eps);Object.assign(i,n?{status:n.status,note:n.note}:classify(i.point));}
 const summary={};for(const e of [...endpoints,...nozzles])summary[e.status]=(summary[e.status]||0)+1;
 return {revision:'A3000-45',basis:'Revised PFD P01 plus explicitly proposed independent exhaust packages',summary,endpoints,nozzles,unresolved:[...endpoints,...nozzles].filter(e=>e.status==='unresolved'),qualified:false,processRelease:false,limitations:['Centreline continuity does not certify leak tightness, suitable materials, hydraulic seals or relief capacity.','Stack emissions and height, fan/stack drain receivers, reactive package outlets, source compatibility and pressure limits remain HOLD.']};
}

// Preserve directly connected pipework when an A-3000 equipment owner is framed.
// Ownership is a drawing grouping, not a physical isolation boundary.
export function a3000ConnectionContext(model){
 const result=new Map(),index=createPathIndex(model.edges),routes=new Map(model.routes.map(r=>[r.id,r]));
 for(const port of model.ports){if(port.reactor<600||port.reactor>616)continue;const context=result.get(port.reactor)||new Set();
  for(const i of index.at(port.point,.0001)){const e=model.edges[i],r=routes.get(e.routeId);if(e.reactor===port.reactor||e.transport==='equipment passage'||!r)continue;for(const id of r.partIds)context.add(id);}
  if(context.size)result.set(port.reactor,context);
 }
 return result;
}
