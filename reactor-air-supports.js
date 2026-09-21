import {structuralKit} from './structural-kit.js';
import {componentEnvelope} from './access-review.js';
// Local clips supplement the shared-rack planner. Only already-grounded steel
// can carry them; this checks geometry, not bracket strength or allowable spans.
export function completeReactorAirSupports(h,air,system){
 if(!system)return null;
 const {T,parts,structure,edges,setContext,band}=h,s=structuralKit(h),V=a=>new T.Vector3(...a),byId=new Map(parts.map(p=>[p.id,p])),routes=new Set(air.consumers.map(c=>c.routeId));
 const graph=new Map();for(const j of structure.contacts)for(const[a,b]of[[j.a,j.b],[j.b,j.a]]){if(!graph.has(a))graph.set(a,[]);graph.get(a).push(b);}const grounded=new Set(structure.roots.map(r=>r.part)),queue=[...grounded];for(let i=0;i<queue.length;i++)for(const p of graph.get(queue[i])||[])if(!grounded.has(p)){grounded.add(p);queue.push(p);}
 const targets=parts.filter(p=>p.system==='frame'&&(p.geometry.type==='BoxGeometry'||p.geometry.parameters?.options?.bevelSize===.025)&&grounded.has(p.id)&&!p.containmentLayer).map(p=>({p,box:componentEnvelope(p),matrix:new T.Matrix4().compose(p.position,p.quaternion,p.scale),inv:new T.Matrix4().compose(p.position,p.quaternion,p.scale).invert()}));
 const obstacles=parts.filter(p=>!['fastener','internal'].includes(p.system)&&!p.containmentLayer).map(p=>({p,box:componentEnvelope(p),inv:new T.Matrix4().compose(p.position,p.quaternion,p.scale).invert()}));
 const zones=system.protectedAccessEnvelopes.map(z=>new T.Box3(V(z.min),V(z.max))),made=[],unresolved=[];const reject=()=>false;
 function clear(a,b,ignore){const d=V(b).sub(V(a)),len=d.length(),ray=new T.Ray(V(a),d.clone().normalize()),bb=new T.Box3().setFromPoints([V(a),V(b)]).expandByScalar(.018);
  for(const z of zones){if(!bb.intersectsBox(z))continue;const padded=z.clone().expandByScalar(.018),p=ray.intersectBox(padded,new T.Vector3());if(p&&(padded.containsPoint(V(a))||p.distanceTo(V(a))<len))return reject('zone '+system.protectedAccessEnvelopes[zones.indexOf(z)].id);}
  for(const o of obstacles){if(ignore.has(o.p.id)||!bb.intersectsBox(o.box))continue;const aa=V(a).applyMatrix4(o.inv),zz=V(b).applyMatrix4(o.inv),delta=zz.clone().sub(aa),length=delta.length(),pad=.016/Math.min(...o.p.scale.toArray().map(Math.abs)),box=o.p.geometry.boundingBox.clone().expandByScalar(pad);if(box.containsPoint(aa)||box.containsPoint(zz))return reject('part '+o.p.name);const hit=new T.Ray(aa,delta.normalize()).intersectBox(box,new T.Vector3());if(hit&&hit.distanceTo(aa)<length)return reject('part '+o.p.name);}return true;
 }
 for(const row of system.inventory.filter(r=>routes.has(r.lineId)&&r.status==='placement review')){
  const edge=edges.find(e=>e.part===row.partId),body=byId.get(row.partId),axis=V(edge.b).sub(V(edge.a)).normalize(),want=row.supportPoints.length-row.supportIds.length;
  let placed=0;for(let n=0;n<want;n++){
   const candidates=[];for(const t of[.5,.25,.75,.12,.88,.38,.62]){const at=V(edge.a).lerp(V(edge.b),t);for(const host of targets){if(host.p.reactor!==body.reactor&&host.p.position.distanceTo(at)>2)continue;const local=at.clone().applyMatrix4(host.inv),clamped=host.p.geometry.boundingBox.clampPoint(local,new T.Vector3()).applyMatrix4(host.matrix),distance=clamped.distanceTo(at);if(distance<.05||distance>1.5)continue;if(made.some(m=>m.partId===body.id&&V(m.position).distanceTo(at)<.5))continue;candidates.push({at,host,clamped,distance,t});}}
   candidates.sort((a,b)=>a.distance-b.distance);let success=false;
   for(const q of candidates){const normal=q.clamped.clone().sub(q.at).addScaledVector(axis,-q.clamped.clone().sub(q.at).dot(axis)).normalize();if(normal.length()<.9)continue;const start=q.at.clone().addScaledVector(normal,edge.radius+.012),end=q.clamped,ignore=new Set([body.id,q.host.p.id]);if(!clear(start.toArray(),end.toArray(),ignore))continue;
    const first=parts.length,tag='PS-A200-IA'+String(made.length+1).padStart(3,'0');setContext(body.reactor,tag+' local instrument tube bracket');const collar=band(tag+' tube clip','frame',edge.radius+.014,edge.radius-.001,.04,q.at.toArray(),'bright',axis.toArray()),arm=s.beam(start.toArray(),end.toArray(),.025,tag+' clip standoff');s.join(body,collar,q.at.clone().addScaledVector(normal,edge.radius).toArray(),tag+' tube / clip');s.join(collar,arm,start.toArray(),tag+' clip / bracket');s.join(arm,q.host.p,end.toArray(),tag+' bracket / grounded steel');s.load(body,row.lineName);
    const partIds=parts.slice(first).map(p=>p.id);for(const p of parts.slice(first))Object.assign(p,{pipeSupport:true,pipeSupportTag:tag,supportFor:[body.id],componentAssembly:tag,designStatus:'proposed',exploreRole:'context'});
    const item={id:tag,partId:body.id,lineId:row.lineId,position:q.at.toArray(),partIds,areaId:'A-200',equipmentId:body.reactor,hostPartId:q.host.p.id,qualification:'Geometric attachment only; tube span, bracket strength and host loads HOLD'};system.supports.push(item);made.push(item);row.supportIds.push(tag);air.partIds.push(...partIds);success=true;placed++;break;
   }
   if(!success)break;
  }
  const positions=system.supports.filter(q=>q.partId===row.partId).map(q=>V(q.position).sub(V(edge.a)).dot(axis)).sort((a,b)=>a-b);row.actualMaximumSpanM=positions.length>1?Math.max(...positions.slice(1).map((v,i)=>v-positions[i])):null;row.actualEndOverhangsM=positions.length?[positions[0],row.lengthM-positions.at(-1)]:null;row.spacingStatus='Local clip locations updated; allowable span and concentrated loads require qualification';
  if(placed===want){row.status='attached — calculation hold';system.holds=system.holds.filter(h=>h.partId!==row.partId);}else unresolved.push({partId:row.partId,lineId:row.lineId,missing:want-placed});
 }
 system.summary.supports=system.supports.length;system.summary.placementHolds=system.holds.length;system.summary.directAttachmentElements=system.inventory.filter(i=>i.supportIds.length).length;
 return{added:made,unresolved,qualification:'Registered attachment to existing grounded steel. Structural capacity and permissible spans require engineering calculations.'};
}
