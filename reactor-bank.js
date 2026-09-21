import {REACTOR_MECHANICAL_BASIS} from './reactor-mechanical.js';
import {reactorMaintenanceReview} from './reactor-maintenance.js';
import {processKit} from './process-kit.js';

export const REACTOR_BRANCHES=['A','B','C','D'];
export const REACTOR_IDS={A:1,B:2,C:54,D:55};
export const BANK_BASIS='Four reactors follow the V5.1 bank. Four dedicated recirculation / induction and solids-metering packages are a proposed configuration: the register lists P-205A/B and M-201 without assigning them to four reactors. P-206A/B are selectable transfer pumps; duty/standby and simultaneous operation are unconfirmed. No rated capacity or operating setpoint is implied.';

// Reuse the verified mechanical assemblies while giving every copy its own
// ports, routes, valves and identifiers. Geometry resources alone are shared.
export function expandOxidationBank(h){
 const k=processKit(h),{T,EQUIPMENT,parts,edges,terminals,ports,routes,valves,supports,upstream,setContext,line,boundary,bulkValve,instrument,nozzle,terminal,tube,passage,transferPump,b,beam}=k;
 for(const p of parts)if(p.name.startsWith('P-206A')){p.reactor=62;p.code='P-206A-'+String(p.id).padStart(4,'0');}for(const e of edges)if(e.name.startsWith('P-206A'))e.reactor=62;for(const r of routes)if(r.label.startsWith('P-206A'))r.reactor=62;for(const v of valves)if(v.label.startsWith('P-206A'))v.reactor=62;
 const original={parts:[...parts],edges:[...edges],terminals:[...terminals],ports:[...ports],routes:[...routes],valves:[...valves],supports:[...supports]};
 const translated=p=>[p[0],p[1],p[2]-16];
 for(const [from,to,mapping] of [['A','C',{1:54,20:56,22:58,24:60}],['B','D',{2:55,21:57,23:59,25:61}]]){
  const text=s=>typeof s==='string'?s.replace(new RegExp('((?:R|H|SF|SI|M|PI|P)-20[1256])'+from,'g'),'$1'+to).replace(new RegExp('((?:XV|NRV)-(?:SA|PA|PG|OX|COL|PGLOAD|BOT201)-)'+from,'g'),'$1'+to).replace(new RegExp(' '+from+'$'),' '+to):s;
  const partIds=new Map(),routeIds=new Map(),edgeIds=new Map();
  for(const p of original.parts.filter(p=>mapping[p.reactor])){
   const id=parts.length+1,q={...p,id,componentAssembly:p.componentAssembly?`${p.componentAssembly}-copy-${mapping[p.reactor]}`:undefined,reactor:mapping[p.reactor],name:text(p.name),assembly:text(p.assembly),code:EQUIPMENT[mapping[p.reactor]].tag+'-'+String(id).padStart(4,'0'),position:p.position.clone().add(new T.Vector3(0,0,-16)),center:p.center.clone().add(new T.Vector3(0,0,-16)),quaternion:p.quaternion.clone(),scale:p.scale.clone(),offset:p.offset.clone(),valveTag:text(p.valveTag)};
   if(p.ports)q.ports=p.ports.map(translated);if(p.centerline)q.centerline=p.centerline.map(translated);if(p.screenBody)q.screenBody={...p.screenBody,position:translated(p.screenBody.position)};
   if(p.closedQuaternion)q.closedQuaternion=p.closedQuaternion.clone();if(p.openQuaternion)q.openQuaternion=p.openQuaternion.clone();if(p.closedPosition)q.closedPosition=p.closedPosition.clone().add(new T.Vector3(0,0,-16));if(p.openPosition)q.openPosition=p.openPosition.clone().add(new T.Vector3(0,0,-16));parts.push(q);partIds.set(p.id,id);
  }
  for(const r of original.routes.filter(r=>mapping[r.reactor])){const id='LINE-'+String(routes.length+1).padStart(3,'0');routeIds.set(r.id,id);routes.push({...r,id,label:text(r.label),reactor:mapping[r.reactor],from:text(r.from),to:text(r.to),partIds:r.partIds.map(id=>partIds.get(id)).filter(Boolean),edgeIndices:[],endpoints:r.endpoints.map(translated)});}
  for(const [i,e] of original.edges.entries())if(mapping[e.reactor]){const n=edges.length;edges.push({...e,a:translated(e.a),b:translated(e.b),path:e.path?.map(translated),name:text(e.name),reactor:mapping[e.reactor],part:partIds.get(e.part),matesBody:partIds.get(e.matesBody),barrierTag:text(e.barrierTag),routeId:routeIds.get(e.routeId)||null});edgeIds.set(i,n);}
  for(const r of original.routes.filter(r=>routeIds.has(r.id))){const n=routes.find(n=>n.id===routeIds.get(r.id));n.edgeIndices=r.edgeIndices.map(i=>edgeIds.get(i)).filter(i=>i!==undefined);}
  for(const p of parts.filter(p=>Object.values(mapping).includes(p.reactor)))p.routeId=routeIds.get(p.routeId)||null;
  for(const p of original.ports.filter(p=>mapping[p.reactor]))ports.push({...p,id:text(p.id),label:text(p.label),reactor:mapping[p.reactor],point:translated(p.point),axis:[...p.axis]});
  for(const t of original.terminals.filter(t=>mapping[t.reactor]))terminals.push({...t,reactor:mapping[t.reactor],label:text(t.label),point:translated(t.point)});
  for(const v of original.valves.filter(v=>mapping[v.reactor]))valves.push({...v,label:text(v.label),tag:text(v.tag),reactor:mapping[v.reactor],a:translated(v.a),b:translated(v.b),partIds:v.partIds?.map(id=>partIds.get(id)),discId:partIds.get(v.discId)});
  for(const s of original.supports.filter(s=>mapping[s.reactor]))supports.push({...s,reactor:mapping[s.reactor],leg:partIds.get(s.leg)});
  for(const f of upstream.feeds){for(const id of [...f.equipment])if(mapping[id])f.equipment.push(mapping[id]);for(const d of [...f.destinations])if(mapping[d.reactor])f.destinations.push({...d,label:text(d.label),neck:text(d.neck),reactor:mapping[d.reactor]});if(f.sourceEdges[from]!==undefined)f.sourceEdges[to]=edgeIds.get(f.sourceEdges[from]);}
  upstream.recirculation.push({reactor:REACTOR_IDS[to],suffix:to,mixId:to==='C'?60:61});
 }
 setContext(29,'Four-reactor distribution rack');
 const L=(p,label,service)=>line(p,.055,label,service);
 // New header ends physically meet the cloned branch centerlines.
 L([[0,4.43,-1.85],[-.7,4.43,-1.85],[-.7,7.45,-1.85],[-.7,7.45,-17.62],[0,7.45,-17.62],[0,4.43,-17.62]],'Sulfuric supply to rear reactor pair','Sulfuric acid');
 L([[4.4,6.9,-8.8],[4.4,6.9,-24.8],[-2.4,6.9,-24.8]],'Phosphoric supply to rear reactor pair','Phosphoric acid');h.capped([-2.4,6.9,-24.8],[-1,0,0],.055,'Rear phosphoric header closure');
 for(const [y,r,label,service,start,end] of [[9.65,.045,'Acid vent','Acid vent',-4.0,4.5],[9.25,.025,'Pre-G dust','Pre-G dust',-3.0,3.2],[8.85,.025,'Oxidizer dust','Oxidizer dust',-4.5,1.2],[8.45,.025,'Nitrogen','Nitrogen',-4.5,1.2]]){
  const trunkX=service==='Acid vent'?7.9:service==='Pre-G dust'?3.95:service==='Oxidizer dust'?.80:1.05;
  line([[trunkX,y,-9],[trunkX,y,-25],[start,y,-25]],r,'Rear '+label+' header',service);h.capped([start,y,-25],[-1,0,0],r,'Rear '+label+' end');
 }
 // Product branches C and D join a low transfer header outside the vessels.
 setContext(0,'Selected reactor transfer manifold');
 L([[-1.79,.8,-13.8],[5.5,.8,-13.8],[5.5,.8,2.2],[4.3,.8,2.2]],'Rear reactor outlets to transfer manifold','Receive');
 // Independent branch inlet/return isolation is present on every jacket.
 for(const [suffix,id] of Object.entries(REACTOR_IDS)){
  const e=EQUIPMENT[id],z=e.z||0;setContext(id,'Reactor instruments and independent utility control');
  for(const [name,tag] of [['Jacket inlet valve','TCV-J-'+suffix],['Jacket return valve','XV-JR-'+suffix],['P-205'+suffix+' loop isolation','XV-RC-'+suffix]]){
   for(const ed of edges.filter(ed=>ed.reactor===id&&ed.name===name||ed.reactor===(suffix==='A'?24:suffix==='B'?25:suffix==='C'?60:61)&&ed.name===name))ed.barrierTag=tag;
   for(const v of valves.filter(v=>v.reactor===id&&v.label===name||v.label===name&&name.startsWith('P-205'))){v.tag=tag;v.partIds=parts.filter(p=>p.reactor===v.reactor&&p.name.startsWith(name+' ·')).map(p=>p.id);}
  }
  const tt=nozzle([e.x-.6,3.25,z+Math.sqrt(1.19**2-.6**2)],[0,0,1],.2,'TT-'+suffix+' process temperature',.022);terminal(tt,'TT-'+suffix+' sealed probe');b('TT-'+suffix+' transmitter','valve',[.15,.18,.10],[tt[0],tt[1],tt[2]+.05],'blue');
  instrument('FT-RC-'+suffix,[e.x-1.59,1.3,z-2.6],'recirculation flow',[0,0,1]);
  const lo=ports.find(p=>p.reactor===id&&p.label==='Lower jacket connection'),hi=ports.find(p=>p.reactor===id&&p.label==='Upper jacket connection');
  if(lo&&hi){const carrier=h.band(e.tag+' jacket hydraulic envelope','internal',1.15,1.075,2,[e.x,3.135,z],'jacket');passage(carrier,[edges.find(x=>x.reactor===id&&x.name===lo.label+' neck').a,[e.x+1.12,3.1,z-.34],edges.find(x=>x.reactor===id&&x.name===hi.label+' neck').a],e.tag+' jacket circulation','Cooling',{transport:'jacket utility passage'});}
  const roof=(dx,dz)=>4.27+.44*Math.sqrt(1-(dx*dx+dz*dz)/1.19**2);
  setContext(id,'Independent relief disposal');
  const relief=nozzle([e.x-.85,roof(-.85,.35),z+.35],[0,1,0],.2,e.tag+' relief inlet',.035);
  line([relief,[e.x-.85,5.5,z+.35]],.035,e.tag+' relief neck','Relief');h.valve([e.x-.85,5.5,z+.35],[e.x-.85,5.85,z+.35],.035,'blue','regulator','PSV-201'+suffix+' relief device');
  line([[e.x-.85,5.85,z+.35],[e.x-.85,6.35,z+.35],[e.x-.85,6.35,z+1.4],[e.x-1.8,6.35,z+1.4]],.035,e.tag+' dedicated relief disposal','Relief');boundary('BL-REL201-'+suffix,[e.x-1.8,6.35,z+1.4],[-1,0,0],.035,'Relief','Dedicated engineered relief disposal interface; rating and backpressure unresolved. No operating isolation valve.');
  setContext(id,'Separate cleaning inlet and drain');
  const clean=nozzle([e.x+.82,roof(.82,-.55),z-.55],[0,1,0],.2,e.tag+' cleaning inlet',.035),cip=boundary('BL-CIP201-'+suffix,[e.x+2.0,6.6,z-.75],[1,0,0],.035,'CIP','Qualified external cleaning supply; chemistry and recipe must be established');
  line([cip,[e.x+1.7,6.6,z-.75]],.035,e.tag+' cleaning source','CIP');bulkValve([e.x+1.7,6.6,z-.75],[e.x+1.45,6.6,z-.75],.035,'XV-CIP201-'+suffix,e.tag+' cleaning isolation');
  line([[e.x+1.45,6.6,z-.75],[e.x+.82,6.6,z-.75],[e.x+.82,6.6,z-.55],clean],.035,e.tag+' cleaning nozzle connection','CIP',null,null,{2:{type:'check',label:'NRV-CIP201-'+suffix}});
  // Shared central seat, separate downstream destinations. No second off-centre vessel drain.
  const dr=[e.x,1.29,z+.36],dv=[e.x-.25,1.29,z+.36];
  bulkValve(dr,dv,.035,'XV-DR201-'+suffix,e.tag+' closed drain isolation');
  line([dv,[e.x-.4,1.29,z+.36],[e.x-.5,1.20,z+.5],[e.x-.5,.35,z+1.6],[e.x-.5,.28,z+2.4],[e.x-.5,.15,z+2.55],[e.x-.5,.15,z+2.7]],.035,e.tag+' central cleaning drain downcomer','Drain');
  boundary('BL-DR201-'+suffix,[e.x-.5,.15,z+2.7],[0,0,1],.035,'Drain','Closed segregated cleaning drain from central flush-bottom valve; product branch isolated. Vendor valve, cleanability and full drainability qualification required.');
  Object.assign(e,{geometryStatus:REACTOR_MECHANICAL_BASIS.status,geometryBasis:REACTOR_MECHANICAL_BASIS.arrangement,reviewNote:reactorMaintenanceReview(suffix)+' '+REACTOR_MECHANICAL_BASIS.holds.join('; '),labelY:6.8});
  setContext(id,'Local actuator air interface');const air=boundary('BL-IA201-'+suffix,[e.x+1.95,2.7,z-1.9],[1,0,0],.018,'Instrument air','Local instrument-air supply to supported panel and individual actuator packages. Fail actions and duty require qualification.');
  line([air,[e.x+1.6,2.7,z-1.9],[e.x+1.6,2.4,z-1.9]],.018,e.tag+' actuator air manifold','Instrument air');terminal([e.x+1.6,2.4,z-1.9],e.tag+' internal actuator tubing boundary');
 }
 setContext(29,'Cooling supply and return battery limits');
 for(const [y,tag,service,x,level,tieX] of [[.76,'BL-CWS201','Cooling supply',6.0,.30,1.15],[4.65,'BL-CWR201','Cooling return',6.6,8.15,.7]]){
  const p=boundary(tag,[x,y,-27],[0,0,-1],.045,service,'External temperature-control utility; duty and common-failure assessment unresolved');
  line([p,[x,y,-26.6],[x,level,-26.6],[x,level,-1.35],[tieX,level,-1.35],[tieX,y,-1.35]],.045,tag+' connected front bank header',service);
  line([[x,level,-17.35],[tieX,level,-17.35],[tieX,y,-17.35]],.045,tag+' connected rear bank header',service);
 }

 const rearRackStart=parts.length;
 for(const x of[-5.0,5.0]){beam([x,.1,-25.5],[x,9.7,-25.5],.12,'Rear utility rack column');beam([x,9.5,-25.5],[x,9.5,-24.7],.09,'Rear rack bracket');}beam([-5,9.7,-25.5],[5,9.7,-25.5],.12,'Rear utility rack crossbeam');
 for(const p of parts.slice(rearRackStart))p.structureVisibility='support';
 // Both transfer pumps are modeled. The selector opens only one pump path.
 setContext(62,'P-206 transfer pump pair');const pb=transferPump(3.6,'P-206B','Oxidized slurry transfer',{z:3.7});
 L([[4.3,.8,2.2],[4.3,.45,2.2],[4.3,.45,4.85],[3.6,.45,4.85],[3.6,.8,4.85],[3.6,.8,4.60]],'P-206B suction manifold branch','Receive');bulkValve([3.6,.8,4.60],[3.6,.8,4.35],.055,'XV-P206B-IN','P-206B suction isolation');L([[3.6,.8,4.35],pb.inlet],'P-206B suction connection','Receive');
 L([pb.outlet,[3.6,1.7,3.7]],'P-206B discharge start','Receive');bulkValve([3.6,1.7,3.7],[3.6,2.0,3.7],.055,'XV-P206B-OUT','P-206B discharge isolation');line([[3.6,2,3.7],[3.6,3,3.7],[5.1,3,3.7],[5.1,3,1.3]],.055,'P-206B discharge to common transfer','Receive',null,null,{0:{type:'check',label:'NRV-P206B'}});
 upstream.feeds.push({key:'product',label:'Oxidized slurry transfer',formula:'GO slurry',service:'Receive',equipment:[1,2,54,55,62,4],phase:'collection',note:'One selected reactor and one transfer pump connect to T-303. Receiver capacity, cooling and transfer readiness are required; this is an inspection configuration.',sourceEdges:Object.fromEntries(Object.entries(REACTOR_IDS).map(([s,id])=>[s,edges.findIndex(e=>e.reactor===id&&e.name==='Product transfer outlet neck')])),destinations:[{label:'T-303 quench / fixing',neck:'Receiver product inlet neck',reactor:4}]});
 upstream.feeds.push({key:'cleaning',label:'Reactor cleaning supply',formula:'CIP',service:'CIP',equipment:[1,2,54,55],phase:'cip',note:'Dedicated cleaning inlet and centrally drained, isolated waste branch. Product transfer and reagent branches remain isolated. A route trace stops at the vessel inventory; no cleaning chemistry, temperature or recipe is prescribed.',sourceEdges:Object.fromEntries(Object.entries(REACTOR_IDS).map(([s,id])=>[s,routes.find(r=>r.label==='R-201'+s+' cleaning source').edgeIndices[0]])),destinations:Object.entries(REACTOR_IDS).map(([s,id])=>({label:'R-201'+s+' cleaning inlet',neck:'R-201'+s+' cleaning inlet neck',reactor:id}))});
 for(const p of parts)if([24,25,60,61].includes(p.reactor)||[1,2,54,55].includes(p.reactor)&&p.assembly==='Recirculation pump')p.designBasis='Proposed dedicated recirculation / induction package. Reconcile against register P-205A/B and M-201 before equipment specification.';
 upstream.stageIds.push(54,55,56,57,58,59,60,61,62);upstream.scope=BANK_BASIS+' Connected Pre-G manufacture, C-301 separation and TFF-401 washing continue to A500; optional F-301/DR-401 finishing is separately scoped.';upstream.checks[1]='R-201A/B/C/D have independently selectable feed and product connections; proposed package allocation is explicit.';
 return {equipment:[1,2,54,55,56,57,58,59,60,61,62],branches:REACTOR_BRANCHES,ids:REACTOR_IDS,basis:BANK_BASIS,mechanical:REACTOR_MECHANICAL_BASIS,boundaries:k.boundaries};
}
