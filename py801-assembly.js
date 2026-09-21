import {buildPY801SupportFrames} from './py801-support-frames.js';
// Explicit physical ownership corrections. Geometry and shared structures stay intact.
const completed=new WeakSet();
export function correctPY801Assembly(model){
 if(completed.has(model))return model;
 const furnace=Object.entries(model.equipment).find(([,e])=>e.tag==='PY-801');
 if(!furnace)return model;const id=Number(furnace[0]);
 const dedicated=new Set(['PL-801 PY-801 support','PL-801 PY-801 drive mount']);
 for(const p of model.parts){
  if(dedicated.has(p.assembly)){
   p.supportPackageOwnerId=p.reactor;p.reactor=id;p.equipmentOwnerId=id;p.exploreRole='equipment';
   p.code='PY-801-'+String(p.id).padStart(4,'0');p.localZ=p.center.z-(furnace[1].z||0);
  }
  if(p.reactor!==id)continue;
  if(p.assembly==='PSV-801 independent relief route')p.exploreRole='context';
  if(p.assembly==='PY-801 cooling circuit'&&p.exploreRole!=='equipment'&&p.name!=='PY-801 sealed water annulus')p.exploreRole='context';
  // Attached nozzles and local sensing instruments remain equipment; complete
  // external valve assemblies and discharge instruments follow their service.
  if(p.assembly==='PY-801 connections'&&p.exploreRole!=='equipment'&&!/^(TT-801-[123] |AIT-801-PY801 |PT-801 )/.test(p.name))p.exploreRole='context';
 }
 const byId=new Map(model.parts.map(p=>[p.id,p]));
 for(const edge of model.edges){const p=byId.get(edge.part);if(p)edge.reactor=p.reactor;}
 buildPY801SupportFrames(model,id);
 completed.add(model);return model;
}
