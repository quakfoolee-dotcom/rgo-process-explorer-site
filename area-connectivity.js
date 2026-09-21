import {buildConnectionGraph} from './inspection.js';
// Reuse the plant's tee-aware connection graph. Filtering never edits that graph.
export function areaConnectivity(model){
 const graph=buildConnectionGraph(model.edges),byId=new Map(model.parts.map(p=>[p.id,p])),assemblies=new Map(),edgeIds=new Set(model.edges.map(e=>e.part));
 const key=a=>a.map(n=>Math.round(n*1e5)).join(','),terminals=new Set(model.terminals.map(t=>key(t.point)));
 for(const p of model.parts)if(p.componentAssembly){if(!assemblies.has(p.componentAssembly))assemblies.set(p.componentAssembly,[]);assemblies.get(p.componentAssembly).push(p.id);}
 const accessories=new Map();
 // Fittings without their own conduit edge stay with their named physical spool.
 for(const r of model.routes){const edges=r.edgeIndices.map(i=>model.edges[i]).filter(Boolean);for(const id of r.partIds){if(edgeIds.has(id))continue;const p=byId.get(id);if(!p||p.exploreRole==='equipment')continue;const matches=edges.filter(e=>p.name.startsWith(e.name));if(matches.length===1){const owner=matches[0].part;if(!accessories.has(owner))accessories.set(owner,[]);accessories.get(owner).push(id);}}}
 return function reconcile(ids){
  const surface=e=>{const p=byId.get(e.part);return p&&ids.has(p.id)&&!p.floorAllocationLegacy&&!['buried','level'].includes(p.containmentLayer);};
  const visible=model.edges.map(surface),seen=new Set(),removed=new Set(),islands=[];
  for(let i=0;i<model.edges.length;i++){
   if(!visible[i]||seen.has(i))continue;const queue=[i];seen.add(i);for(let q=0;q<queue.length;q++)for(const j of graph[queue[q]])if(visible[j]&&!seen.has(j)){seen.add(j);queue.push(j);}
   const hidden=[...new Set(queue.flatMap(j=>[...graph[j]].filter(k=>!visible[k])))];if(!hidden.length)continue;
   const protectedGroup=queue.some(j=>{const e=model.edges[j],p=byId.get(e.part);return p.containmentLayer||p.exploreRole==='equipment'||['shell','pump'].includes(p.system)||[e.a,e.b].some(a=>terminals.has(key(a)));});
   if(protectedGroup)continue;
   islands.push(queue.map(j=>model.edges[j].part));
   for(const j of queue){const e=model.edges[j],p=byId.get(e.part);removed.add(p.id);for(const id of assemblies.get(p.componentAssembly)||[])removed.add(id);for(const id of accessories.get(p.id)||[])removed.add(id);}
  }
  for(const id of removed)ids.delete(id);
  for(const p of model.parts)if(p.supportFor?.some(id=>removed.has(id)))ids.delete(p.id);
  const continuations=[],dedup=new Set();
  for(let i=0;i<model.edges.length;i++){const e=model.edges[i];if(!surface(e))continue;for(const j of graph[i]){const next=model.edges[j];if(ids.has(next.part))continue;const k=e.part+':'+(next.routeId||next.part);if(dedup.has(k))continue;dedup.add(k);const distance=point=>{const path=next.path||[next.a,next.b];let best=Infinity;for(let k=1;k<path.length;k++){const a=path[k-1],d=path[k].map((v,i)=>v-a[i]),l=d.reduce((s,v)=>s+v*v,0),t=l?Math.max(0,Math.min(1,d.reduce((s,v,i)=>s+v*(point[i]-a[i]),0)/l)):0;best=Math.min(best,point.reduce((s,v,i)=>s+(v-a[i]-t*d[i])**2,0));}return best;};const nearest=[e.a,e.b].sort((a,b)=>distance(a)-distance(b))[0];continuations.push({partId:e.part,point:[...nearest],routeId:next.routeId||e.routeId,label:next.name,hiddenPartId:next.part});}}
  return {removedPartIds:[...removed],isolatedGroups:islands,continuations};
 };
}
