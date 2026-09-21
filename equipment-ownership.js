import {correctPY801Assembly} from './py801-assembly.js';
import {equipmentRecord} from './engineering-register.js';

// Physical pump ownership is captured while generating the complete assembly.
// Registration does not move geometry or infer ownership from distance.
export function resolveEquipmentOwnership(model){
 const {parts,equipment,edges,routes,ports,valves}=model,assets=new Map();
 for(const p of parts)if(p.pumpAssetTag){if(!assets.has(p.pumpAssetTag))assets.set(p.pumpAssetTag,[]);assets.get(p.pumpAssetTag).push(p);}
 const explicitArea={'P-PG141':'A-140','P-203':'A-200'};
 const stableId=tag=>{let n=2166136261;for(const c of tag)n=Math.imul(n^c.charCodeAt(0),16777619);return 10000+(n>>>0);};
 for(const [tag,members]of assets){
  const existing=Object.entries(equipment).find(([,e])=>e.tag===tag||e.tag.split(/\s*\/\s*/).includes(tag));
  let id=existing?Number(existing[0]):stableId(tag);
  if(!existing){
   if(equipment[id])throw Error('Equipment identity collision: '+tag);
   const parent=members[0].reactor,record=equipmentRecord(parent,equipment),center=members.find(p=>p.name===tag+' pump volute').position;
   equipment[id]={tag,label:members[0].assembly.replace(tag+' ','').replace(/ transfer pump$/,''),x:center.x,z:center.z,labelY:center.y+1.4,radius:.7,areaId:explicitArea[tag]||record.areaId,designStatus:'proposed',primaryOperation:tag==='P-PG141'?'synthesis':tag==='P-203'?'supply':record.primaryOperation,packageParentId:parent,reviewNote:'Existing modeled pump made individually selectable; tag and duty require source-register reconciliation.'};
  }
  for(const p of members){p.reactor=id;p.code=tag+'-'+String(p.id).padStart(4,'0');p.localZ=p.center.z-(equipment[id].z||0);}
 }
 const byId=new Map(parts.map(p=>[p.id,p]));
 // Insulation follows its physical host after packaged pumps receive their final
 // equipment identity. It must not leave a jacket behind in the parent area.
 for(const p of parts)if(p.thermalInsulation){const host=byId.get(p.insulationFor);if(!host)continue;p.reactor=host.reactor;p.componentAssembly=host.componentAssembly;p.exploreRole=host.exploreRole;p.code=equipment[p.reactor].tag+'-'+String(p.id).padStart(4,'0');p.localZ=p.center.z-(equipment[p.reactor].z||0);}
 // Graph edges refer to physical components. Services remain on routes.
 for(const edge of edges)if(byId.has(edge.part))edge.reactor=byId.get(edge.part).reactor;
 for(const r of routes){const owners=new Set(r.partIds.map(id=>byId.get(id)?.reactor).filter(id=>id!==undefined));if(owners.size===1)r.reactor=owners.values().next().value;}
 for(const v of valves){const owners=new Set((v.partIds||[]).map(id=>byId.get(id)?.reactor).filter(id=>id!==undefined));if(owners.size===1)v.reactor=owners.values().next().value;}
 // Mating-body nozzle helpers set port ownership directly; no nearest-object matching.
 for(const p of parts)p.equipmentOwnerId=p.reactor;
 correctPY801Assembly(model);
}
