import * as T from './vendor/three.module.js';
import {segmentDistance} from './inspection.js';

// Reassign complete support duties before retiring a structure. This operates on
// geometry and declared load paths; it never assigns a structural load rating.
export function consolidatePipeSupports(ctx, policy) {
  const {parts,structure,racks,supports,byId,clear,beam,s,setContext,members,first}=ctx;
  const V=p=>new T.Vector3(...p),removed=new Set(),decisions=[],hostGroups=new Map();
  const collars=new Map(parts.filter(p=>/bearing collar$/.test(p.name)).map(p=>[p.pipeSupportTag,p]));
  const rackMembers=new Map(racks.map(r=>[r,r.partIds.map(id=>byId.get(id)).filter(p=>p&&!p.supportFor&&/column$|crossbeam$|shared longitudinal rail$/.test(p.name))]));
  const excluded=new RegExp(policy.exclusionPattern,'i');
  const allow=policy.existingMemberNames.map(p=>new RegExp(p));
  const graph=new Map();
  const isFixed=p=>p&&p.system==='frame'&&!excluded.test(p.name);
  for(const c of structure.contacts){if(!isFixed(byId.get(c.a))||!isFixed(byId.get(c.b)))continue;for(const [a,b] of [[c.a,c.b],[c.b,c.a]]){if(!graph.has(a))graph.set(a,[]);graph.get(a).push(b);}}
  const paths=new Map(),queue=[];
  for(const r of structure.roots){if(isFixed(byId.get(r.part))){paths.set(r.part,[r.part]);queue.push(r.part);}}
  for(let i=0;i<queue.length;i++)for(const id of graph.get(queue[i])||[])if(!paths.has(id)){paths.set(id,[id,...paths.get(queue[i])]);queue.push(id);}
  const existing=parts.slice(0,first).filter(p=>isFixed(p)&&allow.some(re=>re.test(p.name))&&paths.has(p.id));
  const rootIds=new Set(structure.roots.map(r=>r.part)),hostContext=new Map();
  function foundationWithout(start,skip){const seen=new Set([skip,start]),queue=[[start]];for(let i=0;i<queue.length;i++){const path=queue[i],last=path.at(-1);if(rootIds.has(last))return path;for(const next of graph.get(last)||[])if(!seen.has(next)){seen.add(next);queue.push([...path,next]);}}return null;}
  for(const p of existing){const context=new Set(paths.get(p.id));
    // A girder can have more than one supporting end. Include the independent
    // foundation paths of its structural neighbours when showing its context.
    if(/girder|crossbeam/.test(p.name))for(const next of graph.get(p.id)||[]){const n=byId.get(next);if(!/column|girder|crossbeam|bearing arm/.test(n?.name||''))continue;const path=foundationWithout(next,p.id);if(path)for(const id of path)context.add(id);}
    hostContext.set(p.id,[...context]);
  }
  const admitted=existing.map(p=>({partId:p.id,name:p.name,areaId:ctx.model.equipment[p.reactor]?.areaId,foundationPath:paths.get(p.id),supportingContext:hostContext.get(p.id),capacity:null,qualification:policy.qualification}));
  function ends(p){const d=new T.Vector3(0,p.scale.y/2,0).applyQuaternion(p.quaternion);return [p.position.clone().sub(d),p.position.clone().add(d)];}
  function closest(point,p){const [a,b]=ends(p),d=b.clone().sub(a),t=T.MathUtils.clamp(V(point).sub(a).dot(d)/d.lengthSq(),.01,.99);return {q:a.addScaledVector(d,t),d:d.normalize()};}
  function candidates(victim){
    const own=new Set(victim.partIds);
    return [...racks.filter(r=>r!==victim&&!r.reuseExisting).flatMap(r=>(rackMembers.get(r)||[]).map(p=>({p,rack:r}))).filter(({p})=>p&&!removed.has(p.id)&&!p.supportFor&&/column$|crossbeam$|shared longitudinal rail$/.test(p.name)),...existing.map(p=>({p,rack:null}))].filter(({p})=>!own.has(p.id));
  }
  function planBearing(bearing,victim,hosts,planned){
    const own=new Set(victim.partIds),collar=collars.get(bearing.id);
    if(!collar||removed.has(collar.id))return null;
    const edge=ctx.edgeByPart.get(bearing.partId);if(!edge)return null;
    const point=bearing.position,d=V(edge.b).sub(V(edge.a)).normalize(),radius=edge.supportRadius??edge.radius;
    const options=hosts.map(h=>({...h,...closest(point,h.p)})).map(h=>({...h,distance:h.q.distanceTo(V(point))})).filter(h=>h.distance<policy.maximumAttachmentDistanceM).sort((a,b)=>a.distance-b.distance).slice(0,30);
    for(const host of options){
      for(const shift of [0,.2,-.2,.4,-.4]){
        const q=host.q.clone().addScaledVector(host.d,shift),[ha,hb]=ends(host.p);if(q.distanceTo(ha)+q.distanceTo(hb)>ha.distanceTo(hb)+.001)continue;
        const toward=q.clone().sub(V(point)),normals=[toward.clone().addScaledVector(d,-toward.dot(d)),new T.Vector3(0,1,0).addScaledVector(d,-d.y),new T.Vector3(1,0,0).addScaledVector(d,-d.x)].filter(n=>n.length()>.01).map(n=>n.normalize());
        const ignore={has:id=>own.has(id)||removed.has(id)||id===bearing.partId||id===host.p.id};
        for(const normal of normals){
          const attach=V(point).addScaledVector(normal,radius+.022).toArray(),target=q.toArray(),pathsToTry=[[target]];
          for(const order of [[0,1,2],[2,1,0],[1,0,2],[1,2,0],[0,2,1],[2,0,1]]){const at=[...attach],path=[];for(const axis of order){at[axis]=target[axis];path.push([...at]);}pathsToTry.push(path);}
          for(const path of pathsToTry){
            let at=attach,length=0,valid=true;const segments=[];
            for(const to of path){const span=V(at).distanceTo(V(to));if(span<.02)continue;length+=span;
              if(length>policy.maximumBracketLengthM||!clear(at,to,.045,ignore)){valid=false;break;}
              if(planned.some(e=>segmentDistance(at,to,e.a,e.b)<.045&&!(V(to).distanceTo(V(e.b))<.06&&host.p.id===e.host))){valid=false;break;}
              segments.push({a:[...at],b:[...to],host:host.p.id});at=to;
            }
            if(valid&&segments.length)return {bearing,collar,host,attach,target,segments,length};
          }
        }
      }
    }return null;
  }
  function hostRack(host){
    if(host.rack)return host.rack;
    if(hostGroups.has(host.p.id))return hostGroups.get(host.p.id);
    const areaId=ctx.model.equipment[host.p.reactor]?.areaId||'SHARED',id='PR-'+areaId.replace('-','')+'-H'+String(hostGroups.size+1).padStart(3,'0');
    const rack={id,areaId,servedAreas:[areaId],equipmentIds:[],designStatus:'proposed',kind:'Existing fixed steel attachment',reuseExisting:true,stations:[],foundationElevation:0,partIds:[...hostContext.get(host.p.id)],supportIds:[],loadsStatus:'HOLD: host reactions, connection strength, lateral stability and existing foundation capacity',spareSpaceTargetFraction:0,hostMember:{id:host.p.id,name:host.p.name,capacity:null,foundationPath:[...paths.get(host.p.id)],supportingContext:[...hostContext.get(host.p.id)]},layoutPolicy:policy.qualification};
    racks.push(rack);hostGroups.set(host.p.id,rack);return rack;
  }
  function overlapping(victim){
    const rail=victim.partIds.map(id=>byId.get(id)).find(p=>p?.name.endsWith('shared longitudinal rail'));if(!rail)return false;
    const [a,b]=ends(rail),axis=b.clone().sub(a).normalize();
    return racks.some(r=>r!==victim&&!r.reuseExisting&&r.partIds.some(id=>{const p=byId.get(id);if(!p?.name.endsWith('shared longitudinal rail'))return false;const [c,d]=ends(p);return Math.abs(axis.dot(d.clone().sub(c).normalize()))>.99&&segmentDistance(a.toArray(),b.toArray(),c.toArray(),d.toArray())<.6;}));
  }
  for(let pass=0;pass<policy.passes;pass++){
    let changed=false;
    const order=racks.filter(r=>!r.reuseExisting).map(r=>({r,overlap:overlapping(r),height:Math.max(0,...r.stations.map(p=>p[1]-r.foundationElevation))})).sort((a,b)=>Number(b.overlap)-Number(a.overlap)||Number(a.r.supportIds.length>2)-Number(b.r.supportIds.length>2)||b.height-a.height);
    for(const {r:victim} of order){
      if(!racks.includes(victim))continue;
      const hosts=candidates(victim),plans=[],planned=[];
      for(const id of victim.supportIds){const bearing=supports.find(b=>b.id===id),plan=planBearing(bearing,victim,hosts,planned);if(!plan)break;plans.push(plan);planned.push(...plan.segments);}
      if(!plans.length||plans.length!==victim.supportIds.length)continue;
      const keep=new Set(plans.map(p=>p.collar.id)),retire=new Set(victim.partIds.filter(id=>!keep.has(id)));
      const oldLength=[...retire].map(id=>byId.get(id)).filter(p=>p?.system==='frame'&&!/baseplate/.test(p.name)).reduce((sum,p)=>sum+p.scale.y,0),newLength=plans.reduce((sum,p)=>sum+p.length,0);
      if(newLength>=oldLength-.05)continue;
      // Only commit after every bearing has a clear replacement attachment.
      const destinations=new Set();
      for(const plan of plans){
        const rack=hostRack(plan.host),bearing=plan.bearing;destinations.add(rack.id);setContext(bearing.equipmentId,bearing.id+' consolidated bearing');
        let previous=plan.collar;
        for(const segment of plan.segments){const p=beam(segment.a,segment.b,.045,bearing.id+' consolidated bracket',{supportFor:[bearing.partId]});p.rackId=rack.id;p.supportAreaId=rack.areaId;p.servedEquipmentIds=rack.equipmentIds;s.join(previous,p,segment.a,bearing.id+' consolidated bracket connection');rack.partIds.push(p.id);previous=p;}
        s.join(previous,plan.host.p,plan.target,bearing.id+' host structural connection');
        plan.collar.assembly=bearing.id+' consolidated bearing';plan.collar.rackId=rack.id;plan.collar.supportAreaId=rack.areaId;plan.collar.servedEquipmentIds=rack.equipmentIds;rack.partIds.push(plan.collar.id);rack.supportIds.push(bearing.id);
        if(!rack.equipmentIds.includes(bearing.equipmentId))rack.equipmentIds.push(bearing.equipmentId);if(!rack.servedAreas.includes(bearing.areaId))rack.servedAreas.push(bearing.areaId);
        bearing.previousRackId=victim.id;bearing.rackId=rack.id;bearing.hostMemberId=plan.host.p.id;bearing.hostMemberName=plan.host.p.name;bearing.qualification='Attachment reassigned with unchanged pipe bearing position. Host loads, bracket strength and movement selection remain HOLD.';
      }
      for(const id of retire)removed.add(id);members.remove(retire);
      structure.contacts=structure.contacts.filter(c=>!retire.has(c.a)&&!retire.has(c.b));structure.roots=structure.roots.filter(r=>!retire.has(r.part));structure.loads=structure.loads.filter(l=>!retire.has(l.part));
      racks.splice(racks.indexOf(victim),1);changed=true;
      decisions.push({retiredRackId:victim.id,areaId:victim.areaId,bearingIds:plans.map(p=>p.bearing.id),destinationRackIds:[...destinations],removedColumns:victim.stations.length,oldMemberLengthM:oldLength,newBracketLengthM:newLength,reason:'Every bearing reassigned to clear fixed steel; original pipe and bearing positions retained',qualification:'Geometry-only consolidation; combined host loads and connection design HOLD'});
    }
    if(!changed)break;
  }
  for(let i=parts.length-1;i>=first;i--)if(removed.has(parts[i].id))parts.splice(i,1);
  for(const r of racks){r.partIds=[...new Set(r.partIds.filter(id=>!removed.has(id)))];r.supportIds=[...new Set(r.supportIds)];}
  for(const decision of decisions)decision.finalDestinationRackIds=[...new Set(decision.bearingIds.map(id=>supports.find(s=>s.id===id).rackId))];
  return {revision:'support-consolidation-33',admittedExistingMembers:admitted,decisions,removedPartIds:[...removed],qualification:policy.qualification};
}
