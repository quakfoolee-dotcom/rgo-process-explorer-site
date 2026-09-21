import {assemblyRegistry,assemblySelection,registryReport} from './assembly-registry.js?v=125';
import {correctPY801Assembly} from './py801-assembly.js';
import * as T from './vendor/three.module.js';

const indexes=new WeakMap();
function membershipIndex(model){
 correctPY801Assembly(model);
 let index=indexes.get(model);if(index&&index.partCount===model.parts.length&&index.routeCount===model.routes.length)return index;
 const owned=new Map();for(const p of model.parts){if(!owned.has(p.reactor))owned.set(p.reactor,[]);owned.get(p.reactor).push(p);}
 const external=new Set(model.routes.filter(r=>r.exploreRole==='context'||!r.transport||r.transport==='pipe').flatMap(r=>r.partIds));
 // A complete valve between two external pipe endpoints belongs to the service,
 // even when a legacy builder gives it the vessel's owner. No proximity guesses.
 const key=a=>a.map(n=>Math.round(n*10000)).join(','),externalEnds=new Set();
 for(const e of model.edges)if(external.has(e.part))for(const at of [e.a,e.b])externalEnds.add(key(at));
 const assemblies=new Map();for(const p of model.parts)if(p.componentAssembly){if(!assemblies.has(p.componentAssembly))assemblies.set(p.componentAssembly,[]);assemblies.get(p.componentAssembly).push(p.id);}
 const byId=new Map(model.parts.map(p=>[p.id,p]));
 for(const valve of model.valves||[]){
  if(!valve.a||!valve.b||!externalEnds.has(key(valve.a))||!externalEnds.has(key(valve.b)))continue;
  if(valve.tag&&model.equipment[valve.reactor]?.tag===valve.tag)continue;
  for(const id of valve.partIds||[]){external.add(id);for(const member of assemblies.get(byId.get(id)?.componentAssembly)||[])external.add(member);}
 }
 index={owned,partCount:model.parts.length,routeCount:model.routes.length,external,roots:new Set((model.structure?.roots||[]).map(r=>r.part))};index.registry=assemblyRegistry(model,external);index.edgePoints=new Map();for(const edge of model.edges)for(const at of [edge.a,edge.b]){const k=key(at);if(!index.edgePoints.has(k))index.edgePoints.set(k,{at,parts:new Set()});index.edgePoints.get(k).parts.add(edge.part);}indexes.set(model,index);return index;
}

function isEquipmentMember(p,external){return !p.floorAllocationLegacy&&(!p.containmentLayer||p.containmentLayer==='emergency')&&!p.pipeSupport&&!/^(PS-|PR-)/.test(p.assembly||'')&&p.exploreRole!=='context'&&(!external.has(p.id)||p.exploreRole==='equipment');}
export function explorableEquipmentIds(model){return new Set([...membershipIndex(model).registry.owned].filter(([,groups])=>groups.some(g=>g.role==='core')).map(([id])=>id));}

export function externalServicePartIds(model){return membershipIndex(model).external;}

// Ownership comes from the register, never from proximity. Pipe routes and shared
// racks are context even where legacy generators assign them to a vessel owner.
export function equipmentExplorePlan(model, equipmentId, options={}) {
 const {external,roots,owned:byOwner}=membershipIndex(model);
 const owned=(byOwner.get(Number(equipmentId))||[]).filter(p=>!p.floorAllocationLegacy);
 const classification=assemblySelection(membershipIndex(model).registry,equipmentId,options);
 const members=classification.members;
 const ids=new Set(members.map(p=>p.id)),bounds=new T.Box3();
 for(const p of members){if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();bounds.union(p.bounds||p.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale)));}
 if(bounds.isEmpty())return null;
 const mean=new T.Vector3();for(const p of members)mean.add(p.offset);mean.divideScalar(members.length);
 const limit=Math.min(3,Math.max(.7,bounds.getSize(new T.Vector3()).length()*.3)),offsets=new Map();
 for(const p of members){const fixed=roots.has(p.id)||/foundation|foundation anchor/i.test(p.name);const offset=fixed?new T.Vector3():p.offset.clone().sub(mean).clampLength(0,limit);offsets.set(p.id,offset);}
 const boundaries=[];for(const {at,parts} of membershipIndex(model).edgePoints.values()){const inside=[...parts].filter(id=>ids.has(id));if(inside.length&&inside.length<parts.size)for(const partId of inside)if(offsets.get(partId)?.lengthSq()>1e-10)boundaries.push({point:at,partId});}
 return {equipmentId:Number(equipmentId),members,ids,bounds,offsets,boundaries,contextCount:Math.max(0,owned.length-members.length),classification:{accessoryGroups:classification.accessoryGroups,reviewGroups:classification.reviewGroups,serviceGroups:classification.serviceGroups},showAccessories:!!options.showAccessories};
}

// Offset references are restored exactly; no assembled geometry or engineering
// dimensions are edited by exploration. Existing picking and measurements use
// the same transforms as the rendered model.
export function applyExploreOffsets(parts,plan){
 const saved=parts.map(p=>p.offset),zero=new T.Vector3();
 parts.forEach(p=>p.offset=plan.offsets.get(p.id)||zero);
 let restored=false;return ()=>{if(restored)return;parts.forEach((p,i)=>p.offset=saved[i]);restored=true;};
}

// Screen-door transparency keeps depth ordering correct without duplicate meshes,
// per-frame sorting, or additional draw calls. Original vertex buffers are shared.
export function createExploreContext(scene,meshes){
 const materials=new Map(),sliceEnabled={value:0},slicePlane={value:new T.Vector4(0,0,1,0)};
 const entries=meshes.map(mesh=>{
  const originalGeometry=mesh.geometry,originalMaterial=mesh.material;
  const geometry=new T.BufferGeometry();geometry.index=originalGeometry.index;geometry.attributes={...originalGeometry.attributes};geometry.groups=originalGeometry.groups;geometry.drawRange={...originalGeometry.drawRange};geometry.boundingBox=originalGeometry.boundingBox;geometry.boundingSphere=originalGeometry.boundingSphere;
  const alpha=new T.InstancedBufferAttribute(new Float32Array(mesh.count),1);geometry.setAttribute('exploreContext',alpha);const member=new T.InstancedBufferAttribute(new Float32Array(mesh.count),1);geometry.setAttribute('exploreMember',member);
  if(!materials.has(originalMaterial)){
   const material=originalMaterial.clone();
   material.onBeforeCompile=shader=>{
    shader.uniforms.exploreSliceEnabled=sliceEnabled;shader.uniforms.exploreSlicePlane=slicePlane;
    shader.vertexShader='attribute float exploreContext; attribute float exploreMember; varying float vExploreContext; varying float vExploreMember; varying vec3 vExploreWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvExploreContext = exploreContext; vExploreMember = exploreMember;');
    shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvec4 exploreWorld = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nexploreWorld = instanceMatrix * exploreWorld;\n#endif\nvExploreWorld = (modelMatrix * exploreWorld).xyz;');
    shader.fragmentShader='varying float vExploreContext; varying float vExploreMember; varying vec3 vExploreWorld; uniform float exploreSliceEnabled; uniform vec4 exploreSlicePlane;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif (exploreSliceEnabled > 0.5 && vExploreMember > 0.5 && dot(vec4(vExploreWorld, 1.0), exploreSlicePlane) < 0.0) discard;\nif (vExploreContext > 0.5) { float pattern = mod(floor(gl_FragCoord.x) + 2.0 * floor(gl_FragCoord.y), 4.0); if (pattern > 0.5) discard; }');
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nif (vExploreContext > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16,0.24,0.31), 0.65);');
   };
   materials.set(originalMaterial,material);
  }
  mesh.geometry=geometry;mesh.material=materials.get(originalMaterial);
  return {mesh,alpha,member,geometry,originalGeometry,originalMaterial,castShadow:mesh.castShadow};
 });
 return {set(plan,mode){for(const e of entries){e.mesh.userData.parts.forEach((p,i)=>{e.alpha.array[i]=mode==='faded'&&!plan.ids.has(p.id)?1:0;e.member.array[i]=plan.ids.has(p.id)?1:0;});e.alpha.needsUpdate=e.member.needsUpdate=true;e.mesh.castShadow=mode==='faded'?false:e.castShadow;}},setLocalSection(enabled,plane){sliceEnabled.value=enabled?1:0;slicePlane.value.set(plane.normal.x,plane.normal.y,plane.normal.z,plane.constant);for(const [original,m] of materials){const side=enabled?T.DoubleSide:original.side;if(m.side!==side){m.side=side;m.needsUpdate=true;}}},syncSection(planes){for(const m of materials.values()){m.clippingPlanes=planes;m.needsUpdate=true;}},dispose(){for(const e of entries){e.mesh.geometry=e.originalGeometry;e.mesh.material=e.originalMaterial;e.mesh.castShadow=e.castShadow;for(const key of Object.keys(e.geometry.attributes))if(!['exploreContext','exploreMember'].includes(key))e.geometry.deleteAttribute(key);e.geometry.setIndex(null);e.geometry.dispose();}for(const m of materials.values())m.dispose();}};
}

// A full sweep starts outside the assembly and finishes beyond its opposite face.
// Bounds include all selected members, independently of clipping or UI visibility.
export function equipmentSection(plan,amount,axis='z',fraction=.5,flip=false){
 const bounds=new T.Box3(),shift=new T.Vector3();
 for(const p of plan.members)bounds.union(p.bounds.clone().translate(shift.copy(p.offset).multiplyScalar(amount)));
 const pad=Math.max(.002,(bounds.max[axis]-bounds.min[axis])*1e-5),lo=bounds.min[axis]-pad,hi=bounds.max[axis]+pad;
 const value=T.MathUtils.lerp(flip?lo:hi,flip?hi:lo,T.MathUtils.clamp(fraction,0,1)),normal=new T.Vector3();normal[axis]=flip?1:-1;
 const plane=new T.Plane(normal,-normal[axis]*value),other=['x','y','z'].filter(a=>a!==axis),corners=[];
 for(const [a,b] of [[0,0],[1,0],[1,1],[0,1]]){const p=new T.Vector3();p[axis]=value;p[other[0]]=(a?bounds.max:bounds.min)[other[0]]+(a?.08:-.08);p[other[1]]=(b?bounds.max:bounds.min)[other[1]]+(b?.08:-.08);corners.push(p);}
 return {bounds,plane,corners,value};
}
export function sectionRetainsPoint(point,plane,enabled,member){return !enabled||!member||plane.distanceToPoint(point)>=-1e-6;}

export function equipmentAssemblyReport(model){return registryReport(membershipIndex(model).registry,model.equipment);}

export function equipmentAssemblyRegistry(model){return membershipIndex(model).registry;}
