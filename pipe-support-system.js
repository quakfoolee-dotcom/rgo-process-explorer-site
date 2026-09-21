import * as T from './vendor/three.module.js';
import {structuralKit} from './structural-kit.js';
import {ACCESS_ZONES,ACCESS_BASIS} from './access-layout.js';
import {ACCESS_DESIGN} from './access-design.js';
import {componentEnvelope,buildAccessRegister} from './access-review.js';
import {PIPE_RACK_LAYOUT} from './pipe-rack-layout.js';
import {consolidatePipeSupports} from './pipe-support-consolidation.js';
import {buildCoordinatedThermalRacks} from './thermal-racks.js';

// Editable concept layout targets. They are NOT allowable spans or steel ratings.
export const PIPE_SUPPORT_BASIS={revision:'pipe-support-71',architecture:PIPE_RACK_LAYOUT,units:'m',status:'proposed',stationPitch:2.4,smallBorePitch:1.8,minimumDirectSpan:1.2,beamWidth:.12,columnWidth:.16,contactAllowance:.008,spareSpaceTargetFraction:.2,qualification:'Geometry and attachment coverage only. Allowable spans, pipe stress, nozzle loads, member strength, foundations, wind/seismic and test loads require engineering calculation.',requiredLineData:['DN / OD and wall','verified material','contents density','operating and test cases','temperature range','insulation / lining','valve and instrument masses','equipment nozzle allowables','thermal displacement','corrosion / support contact requirements'],sources:[{title:'Pipe support movement',url:'https://pipingtech.com/resources/technical-bulletins/considering-all-movement-in-pipe-support-design/'},{title:'VSEP fixed / flexible interface',url:'https://www.vsep.com/technology/system-components/'}]};
const V=p=>new T.Vector3(...p),A=v=>v.toArray(),len=e=>V(e.b).distanceTo(V(e.a)),ARCHIVE=id=>id>=5&&id<=18;
const box=(a,b)=>new T.Box3(V(a),V(b));
function memberBox(a,b,w){return new T.Box3().setFromPoints([V(a),V(b)]).expandByScalar(w/2);}
function grid(){const cells=new Map(),size=3;return {add(item){const b=item.box;for(let x=Math.floor(b.min.x/size);x<=Math.floor(b.max.x/size);x++)for(let z=Math.floor(b.min.z/size);z<=Math.floor(b.max.z/size);z++){const key=x+','+z;(cells.get(key)||cells.set(key,[]).get(key)).push(item);}},remove(ids){for(const list of cells.values())for(const item of list)if(ids.has(item.id))item.active=false;},any(b,accept=()=>true){for(let x=Math.floor(b.min.x/size);x<=Math.floor(b.max.x/size);x++)for(let z=Math.floor(b.min.z/size);z<=Math.floor(b.max.z/size);z++)for(const item of cells.get(x+','+z)||[])if(item.active!==false&&item.box.intersectsBox(b)&&accept(item))return true;return false;},hits(b){const found=new Set();for(let x=Math.floor(b.min.x/size);x<=Math.floor(b.max.x/size);x++)for(let z=Math.floor(b.min.z/size);z<=Math.floor(b.max.z/size);z++)for(const item of cells.get(x+','+z)||[])if(item.active!==false&&!found.has(item)&&item.box.intersectsBox(b))found.add(item);return [...found];}};}
export function buildPipeSupportSystem(h,model){
 const {parts,edges,structure,setContext,b,band,c}=h,s=structuralKit(h),byId=new Map(parts.map(p=>[p.id,p])),routes=new Map(model.routes.map(r=>[r.id,r])),obstacles=grid(),members=grid();
 const protectedZones=[...ACCESS_ZONES,...model.thermalUtilities?.accessZones||[],...model.compressedAir?.accessZones||[],...model.reactorAir?.accessZones||[]].filter(z=>z.kind!=='utility').map(z=>({...z,box:box(z.min,z.max)}));
 for(const x of[-2.45,2.45])for(const z of[0,-16])protectedZones.push({id:'SF201-WITHDRAW-'+x+'-'+z,kind:'maintenance',box:box([x-.75,5.58,z-9.05],[x+1.35,6.56,z+1.05])});
 // Protect actual existing equipment, piping, hardware and platforms. Fastener-sized
 // details are included in the parent assembly envelope by the access audit.
 for(const p of parts){if(p.thermalInsulation||ARCHIVE(p.reactor)||['fastener','internal'].includes(p.system)||p.name.includes('boundary sector'))continue;const bounds=componentEnvelope(p,p.system==='pipe'?(p.insulationThickness??ACCESS_BASIS.pipeInsulationAllowance):.025);obstacles.add({id:p.id,box:bounds,name:p.name});}
 for(const [id,e]of Object.entries(model.equipment))if(!ARCHIVE(+id)&&e.radius&&e.top)obstacles.add({id:'vessel-'+id,box:box([e.x-e.radius,e.bottom,(e.z||0)-e.radius],[e.x+e.radius,e.top,(e.z||0)+e.radius]),name:e.tag});
 // Preserve usable standing and withdrawal positions, not just named aisles.
 // Existing blocked positions remain in the access register for separate review.
 const baseAccess=buildAccessRegister({...model,scope:'feed',parts:model.parts.filter(p=>!ARCHIVE(p.reactor)),valves:model.valves.filter(v=>!ARCHIVE(v.reactor)),routes:model.routes.filter(r=>!ARCHIVE(r.reactor))}),protectedTasks=[];
 for(const task of baseAccess.components){const own=new Set(task.partIds);for(const [kind,space]of[['standing',task.standingSpace],['maintenance',task.maintenanceEnvelope]]){
  if(kind==='standing'&&(task.category!=='routine'||task.mobileAccess))continue;
  const bb=box(space.min,space.max);if(obstacles.any(bb,o=>!own.has(o.id)))continue;
  const zone={id:'PIPE-'+kind+'-'+task.id,kind,box:bb,tag:task.tag,areaId:task.areaId};protectedZones.push(zone);protectedTasks.push({id:zone.id,tag:task.tag,kind,min:space.min,max:space.max});
 }}
 // Reserve continuous platform walking volumes and every stair tread's headroom.
 for(const d of model.accessSystem?.decks||[]){const bb=box([d.min[0],d.min[1]+.035,d.min[2]],[d.max[0],d.min[1]+ACCESS_DESIGN.criteria.headroom,d.max[2]]);protectedZones.push({id:'HEADROOM-'+d.id,kind:'platform-access',box:bb});}
 for(const f of model.accessSystem?.flights||[])for(const id of f.treads){const tread=byId.get(id);if(!tread)continue;const bb=componentEnvelope(tread),top=bb.max.y;bb.min.y=top+.035;bb.max.y=top+ACCESS_DESIGN.criteria.headroom;protectedZones.push({id:'HEADROOM-'+f.tag+'-'+id,kind:'stair-access',box:bb});}
 const protectedIndex=grid();for(const z of protectedZones)protectedIndex.add(z);
 const sharedRails=[],assigned=new Set();
 const existingLoads=new Set(structure.loads.map(l=>l.part)),inventory=[],groups=new Map(),supports=[],racks=[],holds=[],first=parts.length;
 const eligible=e=>!ARCHIVE(e.reactor)&&!byId.get(e.part)?.containmentCell&&e.screenAsPipe!==false&&!e.internalTo&&e.transport!=='bulk solids'&&byId.get(e.part)?.system==='pipe';
 function clear(a,z,w,ignore=new Set(),checkMembers=true){const bb=memberBox(a,z,w);return !protectedIndex.any(bb)&&!obstacles.any(bb,q=>!ignore.has(q.id))&&(!checkMembers||!members.any(bb,q=>!ignore.has(q.id)));}
 function mark(p,tag,meta={}){byId.set(p.id,p);Object.assign(p,{designStatus:'proposed',pipeSupportTag:tag,...meta});members.add({id:p.id,box:componentEnvelope(p),name:p.name});return p;}
 function beam(a,z,w,tag,meta={}){return mark(s.beam(a,z,w,tag),tag.split(' ')[0],meta);}
 function column(at,top,tag,base=0){const [x,,z]=at,foot=b(tag+' baseplate','frame',[.32,.10,.32],[x,base+.05,z]);mark(foot,tag);structure.roots.push({part:foot.id,local:[0,-.5,0],elevation:base});const post=beam([x,base+.10,z],[x,top,z],PIPE_SUPPORT_BASIS.columnWidth,tag+' column');s.join(foot,post,[x,base+.1,z],tag+' column / base');for(const dx of[-.10,.10])for(const dz of[-.10,.10])mark(c(tag+' anchor bolt envelope','fastener',.018,.12,[x+dx,base+.12,z+dz],'bright'),tag);return {foot,post,at:[x,top,z],base};}
 for(const [index,e]of edges.entries()){
  if(!eligible(e))continue;const p=byId.get(e.part),r=routes.get(e.routeId),length=len(e),area=model.equipment[e.reactor]?.areaId==='SHARED'?'A-200':model.equipment[e.reactor]?.areaId||'A-200',entry={partId:e.part,lineId:e.routeId,lineName:r?.label||e.name,equipmentId:e.reactor,areaId:area,service:r?.service||e.service||'Unconfirmed',lengthM:length,supportIds:[],status:null,qualification:'Span and load calculation outstanding'};inventory.push(entry);
  if(existingLoads.has(e.part)){entry.status='existing registered attachment';continue;}
  if(e.flexibleConnection||p.flexibleConnection||/flexible|flex hose/i.test(e.name)){entry.status='vendor flexible connection';entry.qualification='Support fixed ends; supplier hose length, bend radius, movement and vibration requirements HOLD';continue;}
  if(e.path?.length>2||length<PIPE_SUPPORT_BASIS.minimumDirectSpan){entry.status='short spool / fitting';entry.qualification='Included in connected-line support review; local cantilever and concentrated-load calculation HOLD';continue;}
  const d=V(e.b).sub(V(e.a)),vertical=Math.abs(d.y)>Math.hypot(d.x,d.z)*4,axis=vertical?0:Math.abs(d.x)>=Math.abs(d.z)?0:2,perp=axis===0?2:0,pitch=e.radius<.04?PIPE_SUPPORT_BASIS.smallBorePitch:PIPE_SUPPORT_BASIS.stationPitch;
  const count=Math.max(1,Math.ceil(length/pitch)),points=[],fractions=[];
  if(!vertical){const lo=Math.min(e.a[axis],e.b[axis]),hi=Math.max(e.a[axis],e.b[axis]);for(let u=Math.ceil((lo+.20)/pitch)*pitch;u<hi-.20;u+=pitch)fractions.push((u-e.a[axis])/d.getComponent(axis));}
  if(!fractions.length)for(let i=0;i<count;i++)fractions.push((i+.5)/count);
  if(fractions.length&&length*Math.min(...fractions)>pitch)fractions.push(.20/length);
  if(fractions.length&&length*(1-Math.max(...fractions))>pitch)fractions.push(1-.20/length);
  for(const t of fractions){const point=V(e.a).lerp(V(e.b),t).toArray(),along=vertical?Math.round(point[axis]/1.2)*1.2+.6:Math.round(point[axis]/1.2)*1.2,level=point[1]<1?'low':point[1]<3?'local':'overhead',region=area==='A-400'&&point[1]<3&&perp===2&&point[2]>=18&&point[2]<23?(point[2]>=21.5?'VSEP-front':'VSEP-rear'):Math.floor(point[perp]/8),key=[area,axis,along.toFixed(2),region,level].join('|');const item={entry,e,point,vertical,axis,perp,index,t};points.push(point);const g=groups.get(key)||{key,area,axis,perp,along,level,points:[]};g.points.push(item);groups.set(key,g);}
  entry.status='planned';entry.provisionalPitchM=pitch;entry.nominalEndOverhangM=length/count/2;entry.supportPoints=points;
 }
 function mountPlan(item,g,chosen,crossId=null){
  const {point,e,vertical}=item,r=e.supportRadius??e.radius,d=V(e.b).sub(V(e.a)).normalize(),low=g.level==='low',axis=g.axis,perp=g.perp,along=chosen.side[0][axis];
  const normal=vertical?new T.Vector3(axis===0?Math.sign(along-point[axis])||1:0,0,axis===2?Math.sign(along-point[axis])||1:0):new T.Vector3(0,1,0).addScaledVector(d,-d.y).normalize().multiplyScalar(low?-1:1);
  if(vertical&&Math.abs(along-point[axis])<r+.14)return null;
  const attach=V(point).addScaledVector(normal,r+.022).toArray(),ignore=new Set([e.part,...crossId?[crossId]:[]]);
  for(const offset of[0,.18,-.18,.35,-.35,.6,-.6]){
   const elbow=[...attach];elbow[axis]=along;elbow[perp]+=offset;
   if(elbow[perp]<Math.min(chosen.side[0][perp],chosen.side[1][perp])+.08||elbow[perp]>Math.max(chosen.side[0][perp],chosen.side[1][perp])-.08)continue;
   const onBeam=[...elbow];onBeam[1]=chosen.y;
   if((V(attach).distanceTo(V(elbow))>.02&&!clear(attach,elbow,.045,ignore))||(V(elbow).distanceTo(V(onBeam))>.02&&!clear(elbow,onBeam,.045,ignore)))continue;
   return {attach,elbow,onBeam,normal,d};
  }
  return null;
 }
 // Plan shared longitudinal steel from the service corridors BEFORE assigning
 // individual pipe bearings. Secondary support pitch never creates foundations.
 function railMount(item,rail){
  const {point,e,vertical}=item,d=V(e.b).sub(V(e.a)).normalize(),axis=rail.axis,perp=axis===0?2:0;
  if(point[axis]<rail.a[axis]+.08||point[axis]>rail.z[axis]-.08)return null;
  const toward=V([0,rail.y-point[1],0]);toward.setComponent(perp,rail.a[perp]-point[perp]);
  const normal=toward.addScaledVector(d,-toward.dot(d)).normalize();if(normal.length()<.5)return null;
  const attach=V(point).addScaledVector(normal,(e.supportRadius??e.radius)+.022).toArray(),onBeam=[...attach];onBeam[perp]=rail.a[perp];onBeam[1]=rail.y;
  if(Math.abs(onBeam[perp]-point[perp])>PIPE_RACK_LAYOUT.secondaryReachTargetM||Math.abs(onBeam[1]-point[1])>3.5)return null;
  const ignore=new Set([e.part,...rail.part?[rail.part.id]:[]]),bb=memberBox(point,point,(e.supportRadius??e.radius)*2+.06);
  if(protectedIndex.any(bb))return null;
  for(const order of [0,1]){const elbow=[...attach];if(order===0)elbow[perp]=onBeam[perp];else elbow[1]=onBeam[1];
   if(V(attach).distanceTo(V(elbow))>.02&&!clear(attach,elbow,.045,ignore))continue;
   if(V(elbow).distanceTo(V(onBeam))>.02&&!clear(elbow,onBeam,.045,ignore))continue;
   return {attach,elbow,onBeam,normal,d};
  }return null;
 }
 function attachRail(item,rail,mount){
  const {entry,e,point,vertical}=item,rack=rail.rack,sg='PS-'+entry.areaId.replace('-','')+'-'+String(supports.length+1).padStart(4,'0'),start=parts.length;
  const {attach,elbow,onBeam,normal,d}=mount;setContext(e.reactor,sg+' bearing on shared rail');
  const collar=band(sg+((e.supportRadius??e.radius)>e.radius?' insulation insert bearing collar':' bearing collar'),'frame',(e.supportRadius??e.radius)+.03,e.radius-.001,.10,point,'bright',A(d));mark(collar,sg,{supportFor:[e.part]});s.load(byId.get(e.part),entry.lineName);s.join(byId.get(e.part),collar,V(point).addScaledVector(normal,e.radius).toArray(),sg+' pipe / bearing');
  let previous=collar,at=attach;
  for(const target of [elbow,onBeam]){if(V(at).distanceTo(V(target))<=.02)continue;const arm=beam(at,target,.045,sg+' secondary bracket',{supportFor:[e.part]});s.join(previous,arm,at,sg+' secondary connection');previous=arm;at=target;}
  s.join(previous,rail.part,onBeam,sg+' shared rail connection');
  const record={id:sg,areaId:entry.areaId,rackId:rack.id,lineId:e.routeId,partId:e.part,equipmentId:e.reactor,position:point,type:vertical?'Riser bearing on shared steel — selection HOLD':'Bearing on shared longitudinal rail — selection HOLD',allowedMovement:'Pipe sliding, guide and anchor functions require line-specific stress and restraint design',loadCases:{empty:null,operating:null,test:null,thermal:null,windSeismic:null},designStatus:'proposed',qualification:'Connected geometry; secondary bracket strength and support movement unverified'};
  supports.push(record);entry.supportIds.push(sg);rack.supportIds.push(sg);assigned.add(item);
  if(!rack.equipmentIds.includes(e.reactor))rack.equipmentIds.push(e.reactor);if(!rack.servedAreas.includes(entry.areaId))rack.servedAreas.push(entry.areaId);
  for(const p of parts.slice(start)){p.rackId=rack.id;p.supportAreaId=rack.areaId;p.servedEquipmentIds=rack.equipmentIds;rack.partIds.push(p.id);}
 }
 const corridors=new Map(),allItems=[...groups.values()].flatMap(g=>g.points);
 buildCoordinatedThermalRacks({items:allItems,assigned,clear,column,beam,s,parts,setContext,racks,sharedRails,railMount,attachRail});
 for(const item of allItems){if(item.vertical)continue;const {entry,axis,perp,point}=item,low=point[1]<1,tier=low?'low':Math.floor((point[1]-1)/PIPE_RACK_LAYOUT.tierBandM),band=Math.floor(point[perp]/PIPE_RACK_LAYOUT.corridorBandM),vsep=entry.areaId==='A-400'&&point[1]<3&&axis===0?(point[2]>21.5?'front':'rear'):'';
  const key=[entry.areaId,axis,band,tier,vsep].join('|');if(!corridors.has(key))corridors.set(key,{key,area:entry.areaId,axis,perp,low,points:[]});corridors.get(key).points.push(item);
 }
 let sharedNo=0;
 function buildCorridor(g,depth=0){
  const items=g.points.filter(i=>!assigned.has(i)),axis=g.axis,perp=g.perp;if(items.length<PIPE_RACK_LAYOUT.minimumSharedBearings)return;
  const lo=Math.min(...items.map(i=>i.point[axis]))-.3,hi=Math.max(...items.map(i=>i.point[axis]))+.3;
  if(hi-lo<PIPE_RACK_LAYOUT.minimumSharedLengthM)return;
  const cross=items.reduce((s,i)=>s+i.point[perp],0)/items.length,initialY=g.low?Math.min(...items.map(i=>i.point[1]-i.e.radius))-.18:Math.max(2.6,...items.map(i=>i.point[1]+i.e.radius+.28));
  let chosen=null,score=0;
  if(g.fixed){const rail={axis:g.fixed.axis,a:g.fixed.from,z:g.fixed.to,y:g.fixed.from[1]},stations=g.fixed.columnStations,served=items.filter(i=>railMount(i,rail));
   if(clear(rail.a,rail.z,.12)&&stations.every(p=>clear([p[0],.02,p[2]],p,.34))){chosen={rail,stations,base:0,served};score=served.length;}
   if(!chosen||score<3)return;
  }
  for(const shift of g.fixed?[]:[0,.4,-.4,.8,-.8,1.2,-1.2,1.8,-1.8]){if(score===items.length)break;
   for(const lift of g.low?[0]:[0,.35,.7,1.1]){const y=initialY+lift,at=u=>{const p=[0,y,0];p[axis]=u;p[perp]=cross+shift;return p;},a=at(lo),z=at(hi),base=g.low?Math.min(0,y-.3):0;
    if(!clear(a,z,.12))continue;
    const n=Math.max(1,Math.ceil((hi-lo)/PIPE_RACK_LAYOUT.primaryBayTargetM)),stations=[];let feasible=true;
    for(let j=0;j<=n;j++){let pos=null;for(const offset of j===0||j===n?[0]:[0,.3,-.3,.6,-.6]){const q=at(lo+(hi-lo)*j/n+offset);if(clear([q[0],base+.02,q[2]],q,.34)){pos=q;break;}}if(!pos){feasible=false;break;}stations.push(pos);}
    if(!feasible)continue;
    const rail={axis,a,z,y},served=items.filter(i=>railMount(i,rail));if(served.length>score){score=served.length;chosen={rail,stations,base,served};}
    if(score===items.length)break;
   }
  }
  if(!chosen||score<3||(!g.fixed&&score/items.length<.4)){if(depth<5&&hi-lo>4.8){const mid=(lo+hi)/2;for(const side of [items.filter(i=>i.point[axis]<mid),items.filter(i=>i.point[axis]>=mid)])buildCorridor({...g,points:side},depth+1);}return;}
  const tag=g.fixed?.id||'PR-'+g.area.replace('-','')+'-S'+String(++sharedNo).padStart(3,'0'),owner=chosen.served[0].e.reactor,start=parts.length;setContext(owner,tag+' shared corridor · '+g.area);
  const columns=chosen.stations.map((p,j)=>column(p,p[1],tag+'-'+j,chosen.base)),rail=chosen.rail;rail.part=beam(rail.a,rail.z,.12,tag+' shared longitudinal rail');s.load(rail.part,tag+' shared service load');
  for(const col of columns)s.join(col.post,rail.part,col.at,tag+' primary rail / column');
  const rack={id:tag,areaId:g.area,servedAreas:[g.area],equipmentIds:[...new Set(chosen.served.map(i=>i.e.reactor))],designStatus:'proposed',kind:g.low?'Shared low service rail':'Shared corridor rack',stations:chosen.stations,foundationElevation:chosen.base,partIds:parts.slice(start).map(p=>p.id),supportIds:[],loadsStatus:'HOLD: combined reactions, secondary brackets, primary rail, lateral stability and foundations',spareSpaceTargetFraction:PIPE_SUPPORT_BASIS.spareSpaceTargetFraction,layoutPolicy:PIPE_RACK_LAYOUT.policies[g.area],bayLengthsM:chosen.stations.slice(1).map((p,j)=>V(p).distanceTo(V(chosen.stations[j])))};
  if(g.fixed){rack.layoutPolicy=g.fixed.purpose;rack.loadsStatus+='; '+g.fixed.qualification;}
  rail.rack=rack;racks.push(rack);sharedRails.push(rail);for(const p of parts.slice(start)){p.rackId=tag;p.supportAreaId=g.area;p.servedEquipmentIds=rack.equipmentIds;}
  for(const item of chosen.served){const mount=railMount(item,rail);if(mount)attachRail(item,rail,mount);}
 }
 for(const fixed of PIPE_RACK_LAYOUT.fixedCorridors){const axis=fixed.axis,perp=axis===0?2:0;buildCorridor({fixed,area:fixed.areaId,axis,perp,low:false,points:allItems.filter(i=>i.entry.areaId===fixed.areaId&&i.point[axis]>=fixed.from[axis]&&i.point[axis]<=fixed.to[axis]&&Math.abs(i.point[perp]-fixed.from[perp])<3&&Math.abs(i.point[1]-fixed.from[1])<3.5)});}
 for(const g of [...corridors.values()].sort((a,b)=>b.points.length-a.points.length||a.key.localeCompare(b.key)))buildCorridor(g);
 // Reuse the shared skeleton for crossing branches and risers before considering
 // local exception frames. Existing package/handrail steel is never presumed rated.
 for(const item of allItems){if(assigned.has(item))continue;for(const rail of sharedRails){const mount=railMount(item,rail);if(mount){attachRail(item,rail,mount);break;}}}
 // Rack membership only grows until consolidation; inspect each appended part once.
 const columnCache=new Map();
 function rackColumns(){return racks.flatMap(rack=>{let entry=columnCache.get(rack);if(!entry){entry={length:0,columns:[]};columnCache.set(rack,entry);}for(;entry.length<rack.partIds.length;entry.length++){const p=byId.get(rack.partIds[entry.length]);if(p?.name.endsWith(' column'))entry.columns.push({rack,p});}return entry.columns;});}
 function nearbyColumns(point,max){const found=[];for(const o of rackColumns()){const dist=Math.hypot(o.p.position.x-point[0],o.p.position.z-point[2]);if(dist>.15&&dist<max)found.push({...o,dist});}return found.sort((a,b)=>a.dist-b.dist);}
 function reuseSteel(item){
  for(const rail of sharedRails){const mount=railMount(item,rail);if(mount){attachRail(item,rail,mount);return true;}}
  const {e,point}=item,d=V(e.b).sub(V(e.a)).normalize();
  const columns=nearbyColumns(point,PIPE_RACK_LAYOUT.secondaryReachTargetM);
  for(const {rack,p} of columns){const toward=new T.Vector3(p.position.x-point[0],0,p.position.z-point[2]),normal=toward.clone().addScaledVector(d,-toward.dot(d));if(normal.length()<.08)normal.set(0,-1,0);normal.normalize();const attach=V(point).addScaledVector(normal,(e.supportRadius??e.radius)+.022).toArray(),target=[p.position.x,attach[1],p.position.z];
   if(Math.abs(attach[1]-p.position.y)>p.scale.y/2-.07)continue;
   if(!clear(attach,target,.045,new Set([e.part,p.id])))continue;
   bearingToColumn(item,p,rack,normal,attach);assigned.add(item);return true;
  }return false;
 }
 const groupList=[...groups.values()].map(g=>({...g,points:g.points.filter(i=>!assigned.has(i))})).filter(g=>g.points.length).sort((a,b)=>b.points.length-a.points.length||a.area.localeCompare(b.area)||a.axis-b.axis||a.along-b.along),counters={};
 for(const g of groupList){
  g.points=g.points.filter(item=>!reuseSteel(item));if(!g.points.length)continue;
  if(g.points.length===1){const i=g.points[0];holds.push({line:i.entry.lineName,partId:i.e.part,point:i.point,reason:'Local bearing requires shared-column bracket or single-post exception'});continue;}
  const rackNo=counters[g.area]=(counters[g.area]||0)+1,tag='PR-'+g.area.replace('-','')+'-'+String(rackNo).padStart(3,'0'),owner=g.points[0].e.reactor,axis=g.axis,perp=g.perp,low=g.level==='low',min=Math.min(...g.points.map(i=>i.point[perp])),max=Math.max(...g.points.map(i=>i.point[perp])),highest=Math.max(...g.points.map(i=>i.point[1]+i.e.radius)),lowest=Math.min(...g.points.map(i=>i.point[1]-i.e.radius)),base=low?Math.min(0,lowest-.45):0;
  let chosen=null;
  const initialY=low?lowest-.18:Math.max(highest+.38,2.6);
  let score=-1;
  for(const shift of[0,.3,-.3,.6,-.6,1.2,-1.2]){if(score===g.points.length)break;const at=(u,y)=>{const p=[0,y,0];p[axis]=g.along+shift;p[perp]=u;return p;};
   for(const lift of low?[0]:[0,.3,.6,1,1.5,2.2,3.2]){const y=initialY+lift,side=[];for(const sign of[-1,1]){let found=null;for(const distance of[.45,.75,1.05,1.5,2,2.7,3.5,4.5,6]){const u=(sign<0?min:max)+sign*distance,p=at(u,y);if(clear(at(u,base+.02),p,.34)){found=p;break;}}side.push(found);}if(!side.every(Boolean)||!clear(side[0],side[1],PIPE_SUPPORT_BASIS.beamWidth))continue;const candidate={side,y,base,at},n=g.points.filter(item=>mountPlan(item,g,candidate)).length;if(n>score){chosen=candidate;score=n;}if(n===g.points.length)break;}
  }
  if(!chosen){for(const i of g.points){i.entry.status='placement review';holds.push({line:i.entry.lineName,partId:i.e.part,point:i.point,reason:'No clear rack foundation / beam corridor; revise adjacent layout or use engineered attachment'});}continue;}
  setContext(owner,tag+' shared pipe rack · '+g.area);const start=parts.length,columns=chosen.side.map((p,i)=>column(p,chosen.y,tag+'-'+(i?'E':'W'),base)),cross=beam(chosen.side[0],chosen.side[1],PIPE_SUPPORT_BASIS.beamWidth,tag+' crossbeam');for(const col of columns)s.join(col.post,cross,col.at,tag+' crossbeam / column');s.load(cross,tag+' rack gravity load');
  // Knee braces stay above pedestrian headroom and are checked before insertion.
  if(!low)for(const [i,col]of columns.entries()){const a=col.at.map((v,j)=>j===1?v-.5:v),z=V(col.at).lerp(V(columns[1-i].at),Math.min(.5/V(col.at).distanceTo(V(columns[1-i].at)),.2)).toArray();if(a[1]<2.35)continue;const ignore=new Set([col.post.id,cross.id]);if(clear(a,z,.065,ignore)){const knee=beam(a,z,.065,tag+' knee brace');s.join(col.post,knee,a,tag+' knee lower');s.join(cross,knee,z,tag+' knee upper');}}
  const rack={id:tag,areaId:g.area,servedAreas:[g.area],equipmentIds:[...new Set(g.points.map(i=>i.e.reactor))],designStatus:'proposed',kind:low?'Low service sleeper':g.level==='local'?'Local service frame':'Overhead branch rack',stations:chosen.side,foundationElevation:base,partIds:[],supportIds:[],loadsStatus:'HOLD: calculate reactions, steel, bracing, foundations and site loads',spareSpaceTargetFraction:PIPE_SUPPORT_BASIS.spareSpaceTargetFraction};
  for(const item of g.points){
   const {point,e,entry,vertical}=item,r=e.radius,sg='PS-'+g.area.replace('-','')+'-'+String(supports.length+1).padStart(4,'0'),mount=mountPlan(item,g,chosen,cross.id);
   if(!mount){entry.status='placement review';holds.push({line:entry.lineName,partId:e.part,point,reason:'Support rod conflicts with another service; local bracket / rack tier review required'});continue;}
   const {attach,elbow,onBeam,normal,d}=mount;
   const collar=band(sg+((e.supportRadius??e.radius)>e.radius?' insulation insert bearing collar':' bearing collar'),'frame',(e.supportRadius??r)+.03,r-.001,.10,point,'bright',A(d));mark(collar,sg,{supportFor:[e.part]});s.load(byId.get(e.part),entry.lineName);s.join(byId.get(e.part),collar,V(point).addScaledVector(normal,r).toArray(),sg+' pipe / bearing');let previous=collar,at=attach;
   if(V(attach).distanceTo(V(elbow))>.02){const arm=beam(attach,elbow,.045,sg+' offset arm',{supportFor:[e.part]});s.join(previous,arm,attach,sg+' bearing / arm');previous=arm;at=elbow;}
   if(V(at).distanceTo(V(onBeam))>.02){const rod=beam(at,onBeam,.045,sg+' support rod',{supportFor:[e.part]});s.join(previous,rod,at,sg+' bearing / rod');s.join(rod,cross,onBeam,sg+' rod / crossbeam');}else s.join(previous,cross,onBeam,sg+' bearing / crossbeam');
   const record={id:sg,areaId:g.area,rackId:tag,lineId:e.routeId,partId:e.part,equipmentId:e.reactor,position:point,type:vertical?'Riser load collar / guide — selection HOLD':low?'Sliding shoe on low service frame':'Suspended sliding bearing — restraint selection HOLD',allowedMovement:vertical?'Axial load-bearing point and guide roles require stress review':'Axial thermal travel reserved; guide / anchor selection requires stress review',loadCases:{empty:null,operating:null,test:null,thermal:null,windSeismic:null},designStatus:'proposed',qualification:'Attachment modeled; capacity and movement unverified'};supports.push(record);entry.supportIds.push(sg);rack.supportIds.push(sg);
  }
  if(!rack.supportIds.length){const removed=new Set(parts.splice(start).map(p=>p.id));members.remove(removed);structure.contacts=structure.contacts.filter(c=>!removed.has(c.a)&&!removed.has(c.b));structure.roots=structure.roots.filter(r=>!removed.has(r.part));structure.loads=structure.loads.filter(l=>!removed.has(l.part));continue;}rack.partIds=parts.slice(start).map(p=>p.id);racks.push(rack);for(const p of parts.slice(start)){p.rackId=tag;p.supportAreaId=rack.areaId;p.servedEquipmentIds=rack.equipmentIds;}
  const a=[...chosen.side[0]],z=[...chosen.side[1]];if(a[perp]>z[perp])[a[perp],z[perp]]=[z[perp],a[perp]];sharedRails.push({axis:perp,a,z,y:chosen.y,part:cross,rack});
 }
 // Complete local attachments using existing rack columns before adding steel.
 // A local bracket is preferred to another overhead down-and-up support path.
 const pending=[...holds];holds.length=0;
 function bearingToColumn(item,col,rack,normal,attach,path=null){
  const {entry,e,point}=item,r=e.radius,sg='PS-'+entry.areaId.replace('-','')+'-'+String(supports.length+1).padStart(4,'0'),start=parts.length,d=V(e.b).sub(V(e.a)).normalize(),target=[col.position.x,attach[1],col.position.z];
  setContext(e.reactor,sg+' local pipe bearing · '+entry.areaId);
  const collar=band(sg+((e.supportRadius??e.radius)>e.radius?' insulation insert bearing collar':' bearing collar'),'frame',(e.supportRadius??r)+.03,r-.001,.10,point,'bright',A(d));mark(collar,sg,{supportFor:[e.part]});s.load(byId.get(e.part),entry.lineName);s.join(byId.get(e.part),collar,V(point).addScaledVector(normal,r).toArray(),sg+' pipe / bearing');
  let previous=collar,at=attach;for(const to of path||[target]){if(V(at).distanceTo(V(to))<.02)continue;const arm=beam(at,to,.045,sg+' local bracket',{supportFor:[e.part]});s.join(previous,arm,at,sg+' bearing / bracket');previous=arm;at=to;}s.join(previous,col,at,sg+' bracket / rack column');
  const record={id:sg,areaId:entry.areaId,rackId:rack.id,lineId:e.routeId,partId:e.part,equipmentId:e.reactor,position:point,type:item.vertical?'Riser bracket — axial load / guide selection HOLD':'Local pipe bearing — movement selection HOLD',allowedMovement:'Restraint and thermal travel require line stress review',loadCases:{empty:null,operating:null,test:null,thermal:null,windSeismic:null},designStatus:'proposed',qualification:'Connected bearing and foundation path; bracket strength, pipe attachment and travel unverified'};
  supports.push(record);entry.supportIds.push(sg);rack.supportIds.push(sg);if(!rack.equipmentIds.includes(e.reactor))rack.equipmentIds.push(e.reactor);if(!rack.servedAreas.includes(entry.areaId))rack.servedAreas.push(entry.areaId);
  for(const p of parts.slice(start)){p.rackId=rack.id;p.supportAreaId=rack.areaId;p.servedEquipmentIds=rack.equipmentIds;rack.partIds.push(p.id);}return true;
 }
 for(const hold of pending){
  const entry=inventory.find(i=>i.partId===hold.partId),e=edges.find(e=>e.part===hold.partId),d=V(e.b).sub(V(e.a)).normalize(),vertical=Math.abs(d.y)>.95;let resolved=false,point=hold.point;
  // Search the whole permitted bearing relocation range against shared steel
  // before accepting any additional freestanding column.
  for(const shift of[0,.15,-.15,.3,-.3,.5,-.5,.75,-.75,.95,-.95,1.15,-1.15]){const candidate=V(hold.point).addScaledVector(d,shift).toArray(),distance=V(candidate).sub(V(e.a)).dot(d);if(distance<.12||distance>len(e)-.12)continue;if(reuseSteel({entry,e,point:candidate,vertical})){point=candidate;resolved=true;break;}}
  if(resolved){const at=entry.supportPoints.findIndex(p=>V(p).distanceTo(V(hold.point))<1e-6);if(at>=0)entry.supportPoints[at]=point;continue;}
  for(const shift of[0,.15,-.15,.3,-.3,.5,-.5,.75,-.75,.95,-.95,1.15,-1.15]){point=V(hold.point).addScaledVector(d,shift).toArray();const distance=V(point).sub(V(e.a)).dot(d);if(distance<.12||distance>len(e)-.12)continue;const item={entry,e,point,vertical};
  if(reuseSteel(item)){resolved=true;break;}
  const options=nearbyColumns(point,3);
  for(const {rack,p}of options){const toward=new T.Vector3(p.position.x-point[0],0,p.position.z-point[2]),normal=toward.clone().addScaledVector(d,-toward.dot(d));if(normal.length()<.08)normal.set(0,-1,0);normal.normalize();const attach=V(point).addScaledVector(normal,(e.supportRadius??e.radius)+.022).toArray(),target=[p.position.x,attach[1],p.position.z];if(Math.abs(attach[1]-p.position.y)>p.scale.y/2-.07)continue;
   const ignore=new Set([e.part,p.id]);if(!clear(attach,target,.045,ignore))continue;bearingToColumn(item,p,rack,normal,attach);resolved=true;break;}
  if(resolved)break;
  // Tight service bays use a short independent bracket/stand; never a nozzle as a foundation.
  const tag='PR-'+entry.areaId.replace('-','')+'-L'+String(racks.length+1).padStart(3,'0');
  for(const distance of[.5,.8,1.2,1.8,2.5]){if(resolved)break;for(const angle of[0,Math.PI/2,Math.PI,Math.PI*1.5,Math.PI/4,Math.PI*.75,Math.PI*1.25,Math.PI*1.75]){const dx=Math.cos(angle)*distance,dz=Math.sin(angle)*distance,toward=new T.Vector3(dx,0,dz),normal=toward.clone().addScaledVector(d,-toward.dot(d));if(normal.length()<.1)continue;normal.normalize();const attach=V(point).addScaledVector(normal,(e.supportRadius??e.radius)+.022).toArray(),at=[point[0]+dx,attach[1],point[2]+dz],base=Math.min(0,attach[1]-.35),ignore=new Set([e.part]);
   if(!clear([at[0],base+.02,at[2]],at,.34)||!clear(attach,at,.045,ignore))continue;
   setContext(e.reactor,tag+' local service stand · '+entry.areaId);const start=parts.length,col=column(at,at[1],tag,base),rack={id:tag,areaId:entry.areaId,servedAreas:[entry.areaId],equipmentIds:[e.reactor],designStatus:'proposed',kind:point[1]<1?'Low service stand':'Local bracket stand',stations:[at],foundationElevation:base,partIds:parts.slice(start).map(p=>p.id),supportIds:[],loadsStatus:'HOLD: bracket, column, anchor and foundation calculation',spareSpaceTargetFraction:0};racks.push(rack);for(const p of parts.slice(start)){p.rackId=tag;p.supportAreaId=rack.areaId;p.servedEquipmentIds=rack.equipmentIds;}bearingToColumn(item,col.post,rack,normal,attach);resolved=true;break;
  }}
  if(resolved)break;
  }
  if(!resolved){
   // A bounded offset bracket can bypass a local obstruction without a new
   // foundation. Keep every leg outside protected access and equipment envelopes.
   const cols=rackColumns();
   for(const shift of [0,.25,-.25,.5,-.5,.8,-.8,1.15,-1.15]){if(resolved)break;point=V(hold.point).addScaledVector(d,shift).toArray();const distance=V(point).sub(V(e.a)).dot(d);if(distance<.12||distance>len(e)-.12)continue;
    const options=cols.map(o=>({...o,dist:Math.hypot(o.p.position.x-point[0],o.p.position.z-point[2])})).filter(o=>o.dist>.15&&o.dist<3).sort((a,b)=>a.dist-b.dist).slice(0,12);
    for(const {p,rack} of options){if(resolved)break;const toward=new T.Vector3(p.position.x-point[0],0,p.position.z-point[2]),normals=[toward.clone().addScaledVector(d,-toward.dot(d)),new T.Vector3().crossVectors(d,new T.Vector3(0,1,0)),new T.Vector3(0,1,0).addScaledVector(d,-d.y)].filter(n=>n.length()>.1).flatMap(n=>[n.clone().normalize(),n.clone().normalize().negate()]);
     for(const normal of normals){if(resolved)break;const attach=V(point).addScaledVector(normal,(e.supportRadius??e.radius)+.022).toArray(),ignore=new Set([e.part,p.id]);
      for(const step of [.25,.45,.7]){if(resolved)break;const bend=V(attach).addScaledVector(normal,step).toArray();
       for(const dy of [0,.3,-.3,.6,-.6]){const target=[p.position.x,attach[1]+dy,p.position.z];if(Math.abs(target[1]-p.position.y)>p.scale.y/2-.07)continue;const elbow=[bend[0],target[1],bend[2]],path=[bend,elbow,target];let at=attach,ok=true,total=0;for(const to of path){const length=V(at).distanceTo(V(to));total+=length;if(length>.02&&!clear(at,to,.045,ignore)){ok=false;break;}at=to;}if(!ok||total>4)continue;
        bearingToColumn({entry,e,point,vertical},p,rack,normal,attach,path);resolved=true;break;
       }
      }
     }
    }
   }
  }
  if(resolved){const at=entry.supportPoints.findIndex(p=>V(p).distanceTo(V(hold.point))<1e-6);if(at>=0)entry.supportPoints[at]=point;}else holds.push(hold);
 }
 const consolidation=consolidatePipeSupports({parts,structure,racks,supports,byId,clear,beam,s,setContext,members,first,model,edgeByPart:new Map(edges.map(e=>[e.part,e]))},PIPE_RACK_LAYOUT.consolidation);
 // Longitudinal coordination is the primary shared rail itself. Do not add
 // incidental ties between nearby frames: proximity is not a structural duty.
 const coordinationLinks=sharedRails.filter(r=>racks.includes(r.rack)&&r.rack.kind.startsWith('Shared')).map(r=>({partId:r.part.id,rackId:r.rack.id,from:r.a,to:r.z,columnStations:r.rack.stations,qualification:'Shared primary load path; lateral stability, connection and member forces require calculation'}));
 for(const row of inventory)if(row.supportPoints)row.status=row.supportIds.length===row.supportPoints.length?'attached — calculation hold':'placement review';
 for(const row of inventory)if(row.status==='planned')row.status=row.supportIds.length===row.supportPoints.length?'attached — calculation hold':'placement review';
 for(const row of inventory)if(row.supportPoints){const e=edges.find(e=>e.part===row.partId),d=V(e.b).sub(V(e.a)).normalize(),at=supports.filter(s=>s.partId===row.partId).map(s=>V(s.position).sub(V(e.a)).dot(d)).sort((a,b)=>a-b);row.actualMaximumSpanM=at.length>1?Math.max(...at.slice(1).map((x,i)=>x-at[i])):null;row.actualEndOverhangsM=at.length?[at[0],row.lengthM-at.at(-1)]:null;row.spacingStatus=row.actualMaximumSpanM>row.provisionalPitchM+.001?'Local relocation exceeds nominal pitch; allowable-span calculation HOLD':'Within nominal layout pitch; allowable-span calculation HOLD';}
 const allNew=parts.slice(first);for(const p of allNew)if(p.pipeSupportTag)p.code=p.pipeSupportTag+'-'+p.id;
 const structuralMembers=allNew.filter(p=>p.system==='frame'&&!/bearing collar|baseplate/.test(p.name)),columnCount=allNew.filter(p=>p.name.endsWith(' column')).length,memberLengthM=structuralMembers.reduce((sum,p)=>sum+p.scale.y,0),memberEnvelopeVolumeM3=structuralMembers.reduce((sum,p)=>sum+p.scale.x*p.scale.y*p.scale.z,0);
 const optimization={baseline:PIPE_RACK_LAYOUT.comparisonBaseline,frames:racks.filter(r=>!r.reuseExisting).length,columns:columnCount,sharedStructures:racks.filter(r=>r.kind.startsWith('Shared')).length,singleBearingStructures:racks.filter(r=>!r.reuseExisting&&r.supportIds.length===1).length,singleBearingAttachmentGroups:racks.filter(r=>r.reuseExisting&&r.supportIds.length===1).length,memberLengthM,memberEnvelopeVolumeM3,columnReductionPercent:100*(1-columnCount/PIPE_RACK_LAYOUT.comparisonBaseline.columns),frameReductionPercent:100*(1-racks.filter(r=>!r.reuseExisting).length/PIPE_RACK_LAYOUT.comparisonBaseline.frames),memberLengthReductionPercent:100*(1-memberLengthM/PIPE_RACK_LAYOUT.comparisonBaseline.memberLengthM),metricBasis:'Comparison with the published A5000-concept-70 plant including A-1000 and A-5000. '+'Geometry comparison only. Member envelope volume is not steel mass or a material take-off; sections and connections are unqualified.'};
 const prior=PIPE_RACK_LAYOUT.consolidation.comparisonBaseline;optimization.previousRevision={baseline:prior,frameReductionPercent:100*(1-optimization.frames/prior.frames),columnReductionPercent:100*(1-columnCount/prior.columns),memberLengthReductionPercent:100*(1-memberLengthM/prior.memberLengthM)};
 for(const rack of racks){rack.assignedBearingCount=rack.supportIds.length;rack.foundationCount=rack.stations.length;rack.supportDuty=rack.reuseExisting?'Proposed attachment to fixed existing steel; no new foundation':rack.kind.startsWith('Shared')?'Shared primary rail carrying multiple service bearings':'Local exception after shared rail and column attachment search';}
 const summary={externalElements:inventory.length,directAttachmentElements:inventory.filter(i=>i.supportIds.length).length,supports:supports.length,rackFrames:racks.filter(r=>!r.reuseExisting).length,existingSteelAttachmentGroups:racks.filter(r=>r.reuseExisting).length,columns:columnCount,sharedStructures:optimization.sharedStructures,placementHolds:holds.length,shortConnections:inventory.filter(i=>i.status==='short spool / fitting').length,vendorFlexible:inventory.filter(i=>i.status==='vendor flexible connection').length,structurallyQualified:false};
 return {basis:PIPE_SUPPORT_BASIS,summary,optimization,consolidation,protectedTasks,protectedAccessEnvelopes:protectedZones.map(z=>({id:z.id,kind:z.kind,min:z.box.min.toArray(),max:z.box.max.toArray()})),racks,supports,inventory,holds,coordinationLinks,layoutPolicy:'Shared utility corridors, area branch racks and local service frames. No drain or suction elevation is changed by support placement.',lineDataPolicy:'Null load values mean unknown, never zero. Tags are provisional area-based reservations.',routingChanges:[{areaId:'A-400',line:'RO makeup',change:'Removed grade-level U pocket; overhead actuated isolation and local command/feedback; shutdown mobile maintenance access requires qualification'},{areaId:'A-400',line:'CIP supply / return',change:'Shortened within equipment service bay; retained segregated valves and fixed supplier connections'}]};
}
