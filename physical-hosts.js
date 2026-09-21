import * as T from './vendor/three.module.js';

// Validate attachment at assembled coordinates. Process association is retained
// separately when a registered physical host differs from the legacy owner.
export function validatePhysicalHosts(model,groups,byPart){
 const tags=new Map(Object.entries(model.equipment).map(([id,e])=>[e.tag,Number(id)]));
 const changed=[];
 const identify=p=>p.physicalHostTag||p.pumpAssetTag||p.name.match(/^([A-Z][A-Z0-9]*-[A-Z0-9]+)(?=\s)/)?.[1];
 for(const g of groups.values()){
  if(g.role!=='core')continue;
  const named=[...new Set(g.members.map(identify).filter(t=>tags.has(t)))];
  if(named.length>1){g.role='review';g.reason='Conflicting physical hosts within component group';continue;}
  const tag=named[0];g.physicalHostTag=tag||model.equipment[g.owner]?.tag;
  if(tag&&tags.get(tag)!==g.owner){const previous=g.owner;g.owner=tags.get(tag);g.processOwner=previous;g.reason='Registered physical host '+tag;changed.push(g.id);for(const p of g.members){p.processOwnerId??=p.reactor;p.reactor=g.owner;p.physicalHostTag=tag;p.equipmentOwnerId=g.owner;p.code=tag+'-'+p.id;p.localZ=p.center.z-(model.equipment[g.owner].z||0);}}
 }
 const hosts=new Map(),boxes=new Map();
 const isNozzle=g=>g.members.some(p=>String(p.componentAssembly||'').startsWith('nozzle-'));
 for(const g of groups.values())if(g.role==='core'&&!isNozzle(g))for(const p of g.members)if(['shell','head','pump','internal'].includes(p.system)){if(!hosts.has(g.owner))hosts.set(g.owner,[]);hosts.get(g.owner).push(p);}
 const edgesByPart=new Map();for(const e of model.edges){if(!edgesByPart.has(e.part))edgesByPart.set(e.part,[]);edgesByPart.get(e.part).push(e);}
 const endpoints=new Map();for(const e of model.edges)for(const point of [e.a,e.b]){const key=point.map(n=>Math.round(n*1e4)).join(',');if(!endpoints.has(key))endpoints.set(key,new Set());endpoints.get(key).add(e.part);}
 const material=new T.MeshBasicMaterial({side:T.DoubleSide}),mesh=new T.Mesh(undefined,material),ray=new T.Raycaster();
 const dirs=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(p=>new T.Vector3(...p));
 const matrix=p=>new T.Matrix4().compose(p.operatingPosition||p.position,p.quaternion,p.scale);
 for(const g of groups.values())if(g.role==='core'&&isNozzle(g)){
  const candidates=hosts.get(g.owner)||[],hostIds=new Set(candidates.map(p=>p.id)),links=new Set();
  // Only direct equipment-body endpoints count, never a route through piping.
  for(const p of g.members)for(const e of (edgesByPart.get(p.id)||[]))for(const point of [e.a,e.b])for(const id of endpoints.get(point.map(n=>Math.round(n*1e4)).join(','))||[])if(hostIds.has(id))links.add(id);
  const root=g.members.find(p=>p.name.endsWith(' · welded root'));
  if(!links.size&&root){const point=root.operatingPosition||root.position;for(const host of candidates){let box=boxes.get(host.id);if(!box){if(!host.geometry.boundingBox)host.geometry.computeBoundingBox();box=host.geometry.boundingBox.clone().applyMatrix4(matrix(host));boxes.set(host.id,box);}if(!box.clone().expandByScalar(.065).containsPoint(point))continue;mesh.geometry=host.geometry;mesh.matrixWorld.copy(matrix(host));for(const dir of dirs){ray.set(point.clone().addScaledVector(dir,.065),dir.clone().negate());ray.near=0;ray.far=.13;const hits=[];mesh.raycast(ray,hits);if(hits.length){links.add(host.id);break;}}if(links.size)break;}}
  if(links.size){g.attachmentParts=[...links];g.hostGroups=[...new Set([...links].map(id=>byPart.get(id).id))];g.reason='Physical host verified by body endpoint or root contact';}
  else{g.role='review';g.reason='Integral nozzle has no verified physical-body attachment';}
 }
 material.dispose();return changed;
}
