import {areaConnectivity} from './area-connectivity.js';
import {externalServicePartIds} from './equipment-explore.js';
import {buildAreaAllocations} from './area-allocation.js';
import {componentEnvelope} from './access-review.js';

// Selection-only index. Physical geometry, ownership and structural connections
// remain unchanged. A shared skeleton is admitted whole or left in context.
export function localAreaMembership(model,register,connected){
 const allocations=buildAreaAllocations(model).areas,byId=new Map(model.parts.map(p=>[p.id,p])),bounds=new Map(),groups=new Map(),racks=model.pipeSupportSystem?.racks||[];
 const rackIds=new Set(racks.flatMap(r=>r.partIds)),serviceIds=externalServicePartIds(model);
 for(const p of model.parts){bounds.set(p.id,p.bounds||componentEnvelope(p));const key=p.componentAssembly||'part-'+p.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
 const memberships=new Map(),reviews=[],reconcile=areaConnectivity(model);
 for(const area of allocations){
  const regions=[...area.polygons,...(area.id==='A-3000'?(model.exhaustGroups?.allocations||[]).map(a=>a.rect):[])];
  // Small fittings may straddle a planning line. This is a viewing allowance,
  // never an engineering clearance or a change to allocated floor dimensions.
  const inside=(x,z)=>regions.some(r=>x>=r[0]-.35&&x<=r[2]+.35&&z>=r[1]-.35&&z<=r[3]+.35);
  const local=p=>{const b=bounds.get(p.id);return [[b.min.x,b.min.z],[b.min.x,b.max.z],[b.max.x,b.min.z],[b.max.x,b.max.z],[(b.min.x+b.max.x)/2,(b.min.z+b.max.z)/2]].every(([x,z])=>inside(x,z));};
  const ids=new Set(),related=connected.get(area.id)||new Set(),withheld=[];
  for(const members of groups.values()){
   const candidates=members.filter(p=>!rackIds.has(p.id)&&!p.floorAllocationLegacy);
   if(!candidates.length)continue;
   const native=candidates.some(p=>register[p.reactor]?.areaId===area.id||p.containmentOwners?.some(id=>register[id]?.areaId===area.id));
   const external=candidates.some(p=>p.exploreRole==='context'||(serviceIds.has(p.id)&&p.exploreRole!=='equipment')||p.system==='frame');
   if((native&&(!external||candidates.every(local)))||(!native&&candidates.some(p=>related.has(p.id))&&candidates.every(local)))for(const p of candidates)ids.add(p.id);
  }
  for(const rack of racks){
   const members=rack.partIds.map(id=>byId.get(id)).filter(Boolean),primary=members.filter(p=>!p.supportFor?.length);
   // Complete primary steel, baseplates and anchors must fit locally. Never
   // expose an entire remote rack merely because it carries an area's pipe.
   if(!primary.length||!primary.every(local)){if(rack.servedAreas.includes(area.id)||members.some(p=>related.has(p.id)))withheld.push(rack.id);continue;}
   const bearings=members.filter(p=>p.supportFor?.length&&p.supportFor.every(id=>ids.has(id))&&local(p));
   if(bearings.length||rack.areaId===area.id){for(const p of primary)ids.add(p.id);for(const p of bearings)ids.add(p.id);}
  }
  // Access towers are complete access assemblies. Keep those serving this area's
  // equipment, including their stair landings just beyond the floor outline.
  for(const tower of model.accessSystem?.towers||[])if(tower.served.some(id=>register[id]?.areaId===area.id))for(const id of tower.partIds)if(byId.has(id))ids.add(id);
  for(const station of model.fireSafety?.stations||[])if(station.areaId===area.id)for(const id of station.partIds)if(byId.has(id))ids.add(id);
  const connectivity=reconcile(ids);memberships.set(area.id,ids);reviews.push({areaId:area.id,...connectivity,localPartCount:ids.size,sharedRackIds:withheld,policy:'Local equipment and complete local support skeletons; crossing assemblies available as connected infrastructure.'});
 }
 return {memberships,reviews};
}
