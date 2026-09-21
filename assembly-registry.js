import {validatePhysicalHosts} from './physical-hosts.js?v=125';
import * as T from './vendor/three.module.js';
import {prepareModelContext} from './prepare-model-context.js';
const cache=new WeakMap();
const accessoryAsset=/^(?:ES-|FE-|AIT-|AR-|CP-|PCV-|FCV-|XV-|NRV-|RV-|DV-|PSV-|HD-|COMMON$)/;
const pointKey=a=>a.map(n=>Math.round(n*1e4)).join(',');
const matrix=p=>new T.Matrix4().compose(p.operatingPosition||p.position,p.quaternion,p.scale);
const bounds=p=>{if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();return p.geometry.boundingBox.clone().applyMatrix4(matrix(p));};

// Registry membership is a view boundary, independent of process ownership.
// Existing plant geometry, route membership and operating controls are preserved.
export function assemblyRegistry(model,external){
 let old=cache.get(model);if(old&&old.count===model.parts.length)return old;

 const groups=new Map(),byPart=new Map(),owned=new Map(),partMap=new Map(model.parts.map(p=>[p.id,p]));
 const legacy=new Map();
 // Backfill the exact multi-part instrument/gauge construction sequences.
 for(let i=0;i<model.parts.length;i++){
  const p=model.parts[i];if(p.componentAssembly||legacy.has(p.id))continue;
  let label,kind;
  if(p.name.endsWith(' sensing collar')){label=p.name.slice(0,-15);kind='instrument';}
  else if(/gauge (?:impulse stem|instrument elbow)/i.test(p.name)){label=p.name.replace(/ (?:impulse stem|instrument elbow).*$/,'');kind='gauge';}
  if(!label)continue;
  const key='legacy-'+kind+'-'+p.id;
  for(let j=i;j<Math.min(model.parts.length,i+160);j++){const q=model.parts[j];if(q.reactor!==p.reactor||!q.name.startsWith(label+' '))break;if(!q.componentAssembly)legacy.set(q.id,{key,kind,label});}
 }
 for(const p of model.parts){
  const l=legacy.get(p.id),family=p.name.includes(' · ')?p.name.split(' · ')[0].replace(/ tension bolt$/,''):null;
  const key=p.componentAssembly?String(p.reactor)+'|'+p.componentAssembly:l?.key||String(p.reactor)+'|'+(family?'family:'+p.assembly+'|'+family:'part:'+p.id);
  if(!groups.has(key))groups.set(key,{id:key,owner:Number(p.reactor),members:[],kind:l?.kind||null,label:l?.label||family||p.name,role:null,reason:null,hostGroups:[],attachmentParts:[]});
  const group=groups.get(key);group.members.push(p);byPart.set(p.id,group);
 }
 let ownershipChanged=false;
 const explicitSupports=new Map(),supportOwnerCache=new Map();
 // Package-builder support labels explicitly identify the supported equipment.
 for(const [id,e] of Object.entries(model.equipment))if(e.tag&&!e.tag.includes(' / '))explicitSupports.set(e.tag,Number(id));
 for(const group of groups.values()){
  const members=group.members,record=model.equipment[group.owner],ownTag=record?.tag||'';
  const support=members.every(p=>p.system==='frame'||p.system==='fastener')&&!members.some(p=>p.pipeSupport||p.walkProtection||p.containmentLayer);
  if(support){const assembly=members[0].assembly||'';if(!supportOwnerCache.has(assembly))supportOwnerCache.set(assembly,[...explicitSupports].filter(([tag])=>['support','drive mount','motor mount','pedestal','cradle'].some(role=>assembly.endsWith(tag+' '+role))));const targets=supportOwnerCache.get(assembly).filter(([,id])=>id!==group.owner);if(targets.length===1){group.owner=targets[0][1];group.reason='Explicit dedicated-support assembly label';ownershipChanged=true;for(const p of members){p.reactor=group.owner;p.equipmentOwnerId=group.owner;p.code=model.equipment[group.owner].tag+'-'+p.id;p.localZ=p.center.z-(model.equipment[group.owner].z||0);}}}
  const integral=members.some(p=>p.exploreRole==='equipment')&&!members.some(p=>p.exploreRole==='context');
  const service=members.some(p=>p.exploreRole==='context')||members.some(p=>external.has(p.id));
  const instrument=!!group.kind||members.some(p=>p.assemblyRole==='accessory'||/transmitter|pressure gauge|temperature gauge|flow indicator|sensing collar/i.test(p.name));
  const valve=members.some(p=>p.system==='valve')&&!integral;
  const fitting=members.some(p=>p.system==='pipe')&&!!members[0].name.match(/ferrule|blank cap|closure|gasket|clamp|flange|valve/i)&&!integral;
  const context=members.some(p=>p.floorAllocationLegacy||p.exploreRole==='context'||p.pipeSupport||/^(PS-|PR-)/.test(p.assembly||'')||(p.containmentLayer&&p.containmentLayer!=='emergency'));
  if(context){group.role='service';group.reason||='External service or shared infrastructure';}
  else if(integral){group.role='core';group.reason||='Explicit integral equipment assembly';}
  else if((instrument||valve||fitting)&&!accessoryAsset.test(ownTag)){group.role='candidate';group.reason='Accessory attachment requires verification';}
  else if(service){group.role='service';group.reason='External route';}
  else {group.role='core';group.reason||=support?'Dedicated equipment structure':'Equipment body, drive or internal component';}

 }
 
 const hostChanges=validatePhysicalHosts(model,groups,byPart);ownershipChanged ||= hostChanges.length>0;
 for(const group of groups.values()){if(!owned.has(group.owner))owned.set(group.owner,[]);owned.get(group.owner).push(group);}
 // Surface checks are narrow-phase ray tests, not ownership-by-distance.
 const geomBounds=new Map(),coreByOwner=new Map();
 for(const group of groups.values())if(group.role==='core')for(const p of group.members){if(!coreByOwner.has(group.owner))coreByOwner.set(group.owner,[]);coreByOwner.get(group.owner).push(p);}
 const endpoints=new Map();for(const edge of model.edges)for(const at of [edge.a,edge.b]){const k=pointKey(at);if(!endpoints.has(k))endpoints.set(k,new Set());endpoints.get(k).add(edge.part);}
 const contactGroups=new Map();const connect=(a,b)=>{if(a&&b&&a!==b&&a.role==='candidate'&&a.owner===b.owner&&['core','candidate','accessory'].includes(b.role)){if(!contactGroups.has(a.id))contactGroups.set(a.id,new Set());contactGroups.get(a.id).add(b.id);}};
 for(const ids of endpoints.values()){const gs=[...new Set([...ids].map(id=>byPart.get(id)).filter(Boolean))];for(const a of gs.filter(g=>g.role==='candidate')){const core=gs.find(b=>b.owner===a.owner&&b.role==='core');if(core)connect(a,core);for(const b of gs.filter(b=>b.role==='candidate'))connect(a,b);}}
 for(const c of model.structure?.contacts||[]){connect(byPart.get(c.a),byPart.get(c.b));connect(byPart.get(c.b),byPart.get(c.a));}
 const material=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(undefined,material),ray=new T.Raycaster(),dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(a=>new T.Vector3(...a));
 function touches(group){
  const roots=group.members.filter(p=>p.name.endsWith(' sensing collar')||p.name==='Tank level transmitter housing'||p.name.endsWith(' · process nut'));
  // Tagged instrument's root is a known sensor attachment location. Other parts
  // require explicit endpoint/contact evidence, never a bounding-box guess.
  for(const root of roots){const point=root.operatingPosition||root.position;
   for(const host of coreByOwner.get(group.owner)||[]){if(host.system==='fastener'||host.system==='frame')continue;let box=geomBounds.get(host.id);if(!box){box=bounds(host);geomBounds.set(host.id,box);}if(!box.clone().expandByScalar(.065).containsPoint(point))continue;
    mesh.geometry=host.geometry;mesh.matrixWorld.copy(matrix(host));for(const dir of dirs){ray.set(point.clone().addScaledVector(dir,.065),dir.clone().negate());ray.near=0;ray.far=.13;const hits=[];mesh.raycast(ray,hits);if(hits.length)return byPart.get(host.id);}
   }
  }return null;
 }
 for(const group of groups.values())if(group.role==='candidate'){
  const linked=[...(contactGroups.get(group.id)||[])].map(id=>groups.get(id)).filter(g=>g.owner===group.owner&&g.role==='core');
  const surface=linked.length?null:touches(group);if(surface)linked.push(surface);
  if(linked.length){group.role='accessory';group.reason=surface?'Sensor root contacts host geometry':'Recorded endpoint or support attachment';group.hostGroups=linked.map(g=>g.id);}
 }
 // Propagate through accessory groups only; never traverse the service network.
 for(let pass=0;pass<4;pass++){let changed=false;for(const group of groups.values())if(group.role==='candidate'){
  const hosts=[...(contactGroups.get(group.id)||[])].map(id=>groups.get(id)).filter(g=>g.owner===group.owner&&g.role==='accessory');
  if(hosts.length){group.role='accessory';group.hostGroups=hosts.map(g=>g.id);group.reason='Recorded connection to attached accessory';changed=true;}
 }if(!changed)break;}
 for(const group of groups.values())if(group.role==='candidate'){group.role=group.members.some(p=>external.has(p.id))?'service':'review';group.reason=group.role==='service'?'Accessory belongs to external piping':'No verified attachment to equipment';}
 material.dispose();
 const result={revision:'assembly-125',count:model.parts.length,groups,byPart,owned};cache.set(model,result);
 if(ownershipChanged){for(const edge of model.edges){const p=partMap.get(edge.part);if(p)edge.reactor=p.reactor;}model.preparedContext=prepareModelContext(model);}
 return result;
}
export function assemblySelection(registry,id,{showAccessories=false}={}){
 const groups=registry.owned.get(Number(id))||[],chosen=groups.filter(g=>g.role==='core'||showAccessories&&g.role==='accessory');
 return {members:chosen.flatMap(g=>g.members),groups:chosen,accessoryGroups:groups.filter(g=>g.role==='accessory').length,reviewGroups:groups.filter(g=>g.role==='review').length,serviceGroups:groups.filter(g=>g.role==='service').length};
}
export function registryReport(registry,equipment){return [...registry.owned].map(([id,groups])=>({id,tag:equipment[id]?.tag||String(id),ownershipCorrections:groups.filter(g=>g.processOwner!=null).map(g=>({group:g.id,label:g.label,physicalHost:g.physicalHostTag,previousProcessOwner:equipment[g.processOwner]?.tag||g.processOwner,parts:g.members.map(p=>p.id)})),verifiedNozzleGroups:groups.filter(g=>g.role==='core'&&g.attachmentParts.length).length,coreParts:groups.filter(g=>g.role==='core').reduce((n,g)=>n+g.members.length,0),accessoryGroups:groups.filter(g=>g.role==='accessory').length,serviceGroups:groups.filter(g=>g.role==='service').length,reviewGroups:groups.filter(g=>g.role==='review').map(g=>({group:g.id,label:g.label,reason:g.reason,parts:g.members.map(p=>p.id)}))}));}
