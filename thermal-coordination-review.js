import * as T from './vendor/three.module.js';
import {inspectThermalClearance,thermalWater} from './thermal-clearance.js';
import {componentEnvelope,componentIntersectsBox} from './access-review.js';
import {createJourneyNetwork} from './product-journey.js';
const V=a=>new T.Vector3(...a);

// This is an offline review, not work performed on every animation frame.
export function inspectThermalCoordination(model){
 const u=model.thermalUtilities,pm=new Map(model.parts.map(p=>[p.id,p]));
 const clearance=inspectThermalClearance(model),circuits=[];
 for(const [circuit,source]of [...Object.entries(u.loops),...Object.entries(u.secondaries)]){
  const net=createJourneyNetwork(model,{acceptEdge:e=>e.thermalCircuit===circuit&&['supply','return'].includes(e.thermalRole)});
  let bypass=null;try{bypass=net.path(source.supply,source.return);}catch{}
  circuits.push({circuit,unintendedBypass:!!bypass,scope:'Supply and return edges only; consumer, generator and declared bypass passages excluded'});
 }
 const envelopes=model.parts.filter(p=>p.system!=='internal'&&!p.thermalInsulation&&p.exploreRole!=='annotation').map(p=>({p,allowance:p.system==='pipe'?(p.insulationThickness??.05):0,b:componentEnvelope(p,p.system==='pipe'?(p.insulationThickness??.05):0)}));
 const frames=envelopes.filter(o=>o.p.system==='frame'&&/column|beam|post|leg|bearer/i.test(o.p.name)&&!/collar|baseplate|foundation|skid|saddle/.test(o.p.name));
 const frameCrossings=[],material=new T.MeshBasicMaterial({side:T.DoubleSide});
 for(const e of model.edges.filter(e=>thermalWater(e)&&!e.internalTo&&['supply','return'].includes(e.thermalRole)&&pm.get(e.part)?.system==='pipe')){
  const path=e.path||[e.a,e.b],bounds=new T.Box3().setFromPoints(path.map(V)).expandByScalar(e.supportRadius||e.radius);
  for(const f of frames){if(!f.b.intersectsBox(bounds))continue;const mesh=new T.Mesh(f.p.geometry,material);mesh.position.copy(f.p.position);mesh.quaternion.copy(f.p.quaternion);mesh.scale.copy(f.p.scale);mesh.updateMatrixWorld(true);let hit=null;
   for(let i=1;i<path.length&&!hit;i++){const start=V(path[i-1]),delta=V(path[i]).sub(start),length=delta.length();if(length<.1)continue;hit=new T.Raycaster(start,delta.normalize(),.04,length-.04).intersectObject(mesh)[0];}
   if(hit)frameCrossings.push({pipe:e.name,partId:e.part,frame:f.p.name,framePartId:f.p.id,point:hit.point.toArray()});
  }
 }
 material.dispose();
 const ids=new Set(u.partIds),access=model.access.components.filter(c=>c.partIds.some(id=>ids.has(id))).map(c=>{
  const own=new Set(c.partIds),box=new T.Box3(V(c.standingSpace.min),V(c.standingSpace.max));
  const conflicts=envelopes.filter(o=>!own.has(o.p.id)&&o.b.intersectsBox(box)&&componentIntersectsBox(o.p,box,o.allowance,o.b)).map(o=>({partId:o.p.id,name:o.p.name}));
  return {tag:c.tag,area:c.areaId,category:c.category,point:c.interactionPoint,standing:c.standingPosition,method:c.method,remoteDisplay:c.remoteDisplay||null,mobileAccess:c.mobileAccess,conflicts,routineReach:c.routineReach,status:conflicts.length?'Obstructed candidate service position':c.mobileAccess?'Clear candidate envelope; mobile access unqualified':'Clear proposed envelope; task qualification open',qualification:c.servicePolicy||c.accessQualification||'Vendor task, isolation and rated access arrangement require verification'};
 });
 return {revision:'thermal-coordination-73',clearance,circuits,frameCrossings,access,accessSummary:{records:access.length,obstructedCandidates:access.filter(c=>c.conflicts.length).length,mobileAccessHolds:access.filter(c=>c.mobileAccess).length,routineReachFailures:access.filter(c=>!c.routineReach).length},displayLinks:u.displayLinks,unreviewedRoutes:u.routingReview.filter(r=>r.status!=='coordinated'),supportPlacementHolds:model.pipeSupportSystem?.inventory.filter(i=>i.areaId==='A-5000'&&i.status==='placement review')||[],openInterfaces:u.interfaces.filter(i=>i.disposition==='unresolved'),visualAcceptance:'Pending assembled WebGL review',qualified:false,scope:'Insulated pipe-path screening and selected steel mesh penetrations. Same-service endpoint contacts require joint detailing. Does not certify every equipment body, flange, insulation seam, access task, support capacity or pressure boundary.'};
}
