// Concept service hardware. Dimensions reserve space; no vendor rating is assigned.
import {structuralKit} from './structural-kit.js';
import {processKit} from './process-kit.js';
export const SAMPLE_BASIS={revision:'R201-services-63',status:'Concept — vendor and process approval required',
 arrangement:'Independent lower-head sample connection → two normally closed sample isolations → enclosed receiver. Main bottom, product and waste valves remain closed during sample fill.',
 materials:{status:'HOLD',candidates:'Vendor-qualified fluoropolymer-lined or corrosion-resistant alloy assembly; stainless appearance is not a wetted-material specification.',required:['Full acid/oxidant composition and concentration','Maximum/minimum temperature and pressure, including cleaning','Solids size, rheology and plugging risk','Lining, seal, gasket and receiver compatibility','Thermal expansion, permeation and electrostatic assessment where applicable']},
 receiver:{status:'HOLD',volume_L:null,MAWP_bar:null,temperature_C:null,opening:'No open-bottle filling is modeled. Recovery connection remains positively blinded until a compatible closed recovery system and pressure protection are engineered.'},
 qualification:['Vendor to qualify flush seat/ram, nozzle reinforcement and vessel pressure boundary','Validate representative sample volume, line flushing and recovery without opening product/waste','Receiver pressure/temperature indication, isolation verification and depressurization must be qualified before opening','Maintenance access, valve orientation and sample cabinet ergonomics require review'],
 sources:['https://schuf.de/sampling-valves/']};

// Subtract a polygonal vertical bore from the actual head triangles, retaining the
// curved surface outside it. Each operation is half-plane clipping in world X/Z.
export function cutVerticalBore(T,part,x,z,r,axis='y',minimumAlong=-Infinity){
 const uAxis=axis==='x'?'y':'x',vAxis=axis==='z'?'y':'z';
 const source=part.geometry.index?part.geometry.toNonIndexed():part.geometry;
 const a=source.attributes.position,mat=new T.Matrix4().compose(part.position,part.quaternion,part.scale),inv=mat.clone().invert(),out=[];
 const clip=(poly,nx,nz,d,inside)=>{const result=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],u=nx*p[uAxis]+nz*p[vAxis]-d,v=nx*q[uAxis]+nz*q[vAxis]-d,ip=inside?u<=1e-10:u>=-1e-10,iq=inside?v<=1e-10:v>=-1e-10;if(ip)result.push(p);if(ip!==iq)result.push(p.clone().lerp(q,u/(u-v)));}return result;};
 for(let i=0;i<a.count;i+=3){let pending=[0,1,2].map(j=>new T.Vector3().fromBufferAttribute(a,i+j).applyMatrix4(mat));if(pending.every(p=>p[axis]<minimumAlong)){for(const p of pending)out.push(...p.clone().applyMatrix4(inv).toArray());continue;}const outside=[];
  for(let k=0;k<32&&pending.length>=3;k++){const angle=k*Math.PI/16,nx=Math.cos(angle),nz=Math.sin(angle),d=nx*x+nz*z+r;const fragment=clip(pending,nx,nz,d,false);if(fragment.length>=3)outside.push(fragment);pending=clip(pending,nx,nz,d,true);}
  for(const poly of outside)for(let j=1;j<poly.length-1;j++)for(const p of[poly[0],poly[j],poly[j+1]])out.push(...p.clone().applyMatrix4(inv).toArray());
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out,3));g.computeVertexNormals();g.computeBoundingBox();part.geometry=g;
}

export function buildReactorServices(h){
 const k=processKit(h),{T,EQUIPMENT,parts,edges,ports,valves,setContext,b,c,band,nozzle,line,bulkValve,capped,passage,terminal}=k;
 const sk=structuralKit(h);
 const sampling={...SAMPLE_BASIS,stations:[]},feed={key:'sampling',label:'Contained reactor sample',service:'Reaction slurry',equipment:[],sourceEdges:{},destinations:[],phase:'sample',note:SAMPLE_BASIS.arrangement+' '+SAMPLE_BASIS.receiver.opening};
 for(const[s,id,fid]of[['A',1,20],['B',2,21],['C',54,56],['D',55,57]]){
  const e=EQUIPMENT[id],x=e.x,z=e.z||0,fx=x+.30,fz=z-5.6,tag='SF-201'+s;
  // Tag the whole moving assembly after cloning; hopper and weigh frame stay fixed.
  for(const p of parts.filter(p=>p.name.startsWith(tag+' ')))Object.assign(p,{maintenanceMotion:'feeder',maintenanceBranch:s,maintenanceDelta:[0,0,-2.25]});
  for(const p of parts.filter(p=>p.reactor===fid&&p.name.startsWith('H-201'+s+' screw inlet')||p.reactor===id&&p.routeId&&h.routes.find(r=>r.id===p.routeId)?.label==='Pre-G chute '+s))Object.assign(p,{maintenanceRemove:true,maintenanceBranch:s});
  setContext(fid,tag+' fixed withdrawal guides');
  for(const dx of[-.86,.86]){
   const guide=b(tag+' fixed guide rail','frame',[.12,.10,7.55],[fx+dx,5.65,z-5.175]);
   for(const zz of[z-7.6,z-3.2]){const post=b(tag+' fixed guide column','frame',[.10,5.60,.10],[fx+dx,2.80,zz]),foot=b(tag+' fixed guide foundation','frame',[.32,.08,.32],[fx+dx,.04,zz]);h.structure.roots.push({part:foot.id,local:[0,-.5,0],elevation:0});sk.join(foot,post,[fx+dx,.04,zz],tag+' guide foundation');sk.join(post,guide,[fx+dx,5.60,zz],tag+' fixed guide bearing');}
   for(const zz of[z-6.2,z-1.6]){const q=b(tag+' guide carriage shoe','frame',[.40,.31,.25],[fx+dx,5.855,zz]);Object.assign(q,{maintenanceMotion:'feeder',maintenanceBranch:s,maintenanceDelta:[0,0,-2.25]});sk.join(q,guide,[fx+dx,5.70,zz],tag+' sliding bearing');const rail=parts.filter(p=>p.name===tag+' frame longitudinal rail').sort((a,b)=>Math.abs(a.position.x-fx-dx)-Math.abs(b.position.x-fx-dx))[0];sk.join(rail,q,[rail.position.x,6.0,zz],tag+' carriage shoe');}
  }
  const casing=parts.find(p=>p.name===tag+' enclosed casing'),cradle=parts.filter(p=>p.name===tag+' cradle crossmember').sort((a,b)=>b.position.z-a.position.z)[0];sk.load(casing,tag+' moving package — mass HOLD');sk.join(casing,cradle,[fx,6.145,z-1.0],tag+' casing cradle');for(const rail of parts.filter(p=>p.name===tag+' frame longitudinal rail'))sk.join(cradle,rail,[rail.position.x,6.07,z-1.0],tag+' cradle rail');
  // Visible closure plates are installed only in the disconnected maintenance view.
  for(const[name,p,axis,moving]of[
   ['hopper underside blind',[fx,6.64,fz],[0,1,0],false],
   ['feeder inlet blank',[fx,6.465,fz],[0,1,0],true],
   ['feeder outlet blank',[fx,6.14,z+.5],[0,1,0],true],
   ['reactor chute blind',[fx,5.93,z+.5],[0,1,0],false]]){
   const q=c(tag+' '+name,'pipe',.13,.018,p,'bright',axis);Object.assign(q,{maintenanceOnly:true,maintenanceBranch:s,...(moving?{maintenanceMotion:'feeder',maintenanceDelta:[0,0,-2.25]}:{})});
  }
  // Two manufactured split sleeve interfaces, in the operating position.
  for(const[p,name]of[[[fx,6.46,fz],'hopper dry disconnect'],[[fx,6.14,z+.5],'chute dry disconnect']]){const q=band(tag+' '+name,'pipe',.135,.1,.04,p,'bright');Object.assign(q,{maintenanceBranch:s,maintenanceRemove:true});}

  setContext(id,e.tag+' contained lower-head sampler');const first=parts.length,sx=x-.75;
  for(const p of parts.filter(p=>p.reactor===id&&/^(Inner|Outer) lower dished head/.test(p.name)))cutVerticalBore(T,p,sx,z,.028);
  const inner=2.055-.37*Math.sqrt(1-(.75/1.055)**2),root=[sx,inner,z];
  const tip=nozzle(root,[0,-1,0],.23,e.tag+' independent bottom sample',.035);const source=edges.length-1;
  const mid=[sx,tip[1]-.16,z];bulkValve(tip,mid,.028,'XV-SMP201-'+s,e.tag+' sample root isolation');
  // A compact downward-sloping branch occupies the former undefined service connection.
  const cx=x-1.8,inlet=[cx,1.23,z+1.18],outlet=[cx,1.23,z+1.36];
  line([mid,[sx,1.36,z],[sx,1.34,z+.45],[cx,1.30,z+.45],[cx,1.23,z+1.0],inlet],.022,e.tag+' contained sample line','Reaction slurry');
  bulkValve(inlet,outlet,.022,'XV-SMR201-'+s,e.tag+' receiver isolation');
  const top=[cx,1.10,z+1.7],bottom=[cx,.79,z+1.7];line([outlet,[cx,1.23,z+1.7],top],.022,e.tag+' sample receiver inlet','Reaction slurry');
  const shell=band(e.tag+' enclosed sample receiver','head',.09,.075,.31,[cx,.945,z+1.7],'bright');shell.cut=true;
  band(e.tag+' receiver top closure','head',.09,.022*.78,.025,[cx,1.10,z+1.7]);c(e.tag+' receiver sealed base','head',.09,.025,bottom);
  const samplePass=passage(shell,[top,bottom],e.tag+' sample receiver inventory','Reaction slurry');terminal(bottom,e.tag+' closed sample inventory');
  const recovery=[cx,1.07,z+1.7],end=[cx+.14,1.07,z+1.7];cutVerticalBore(T,shell,1.07,z+1.7,.012*.78,'x',cx);line([recovery,[cx+.10,1.07,z+1.7]],.012,e.tag+' receiver recovery takeoff','Reaction slurry');bulkValve([cx+.10,1.07,z+1.7],end,.012,'XV-SMV201-'+s,e.tag+' closed recovery isolation');capped(end,[1,0,0],.012,e.tag+' recovery positive blind');
  ports.push({id:'BL-SMP-REC-'+s,label:e.tag+' closed recovery — unresolved destination',reactor:id,point:end,axis:[1,0,0],radius:.012,role:'positively blinded future connection'});
  // Cabinet is secondary enclosure, never the receiver pressure boundary.
  const back=b(e.tag+' sample cabinet back','frame',[.48,.65,.025],[cx,1.075,z+1.50]);cutVerticalBore(T,back,cx,1.23,.026,'z');b(e.tag+' sample cabinet tray','frame',[.48,.025,.40],[cx,.75,z+1.7]);
  for(const dx of[-.235,.235])b(e.tag+' sample cabinet side','frame',[.025,.65,.40],[cx+dx,1.075,z+1.7]);
  b(e.tag+' sample cabinet lid','frame',[.48,.025,.40],[cx,1.40,z+1.7]);
  for(const dx of[-.17,.17])b(e.tag+' sample cabinet leg','frame',[.035,.75,.035],[cx+dx,.375,z+1.7]);
  // Secondary cabinet with a transparent closed inspection door.
  b(e.tag+' sample cabinet window','frame',[.43,.59,.006],[cx,1.075,z+1.90],'glass');
  for(const dx of[-.22,.22])b(e.tag+' sample cabinet door edge','frame',[.018,.60,.018],[cx+dx,1.075,z+1.90]);
  for(const p of parts.slice(first))Object.assign(p,{designStatus:'proposed',designMaterial:SAMPLE_BASIS.materials.candidates,samplingBranch:s});
  for(const v of valves.filter(v=>/^XV-SM[PRV]201-/.test(v.tag||'')))v.normalState='closed';
  feed.equipment.push(id);feed.sourceEdges[s]=source;feed.destinations.push({reactor:id,neck:e.tag+' sample receiver inventory',label:e.tag+' enclosed sample receiver'});
  sampling.stations.push({reactor:e.tag,reactorId:id,root,receiver:[cx,.945,z+1.7],valves:['XV-SMP201-'+s,'XV-SMR201-'+s,'XV-SMV201-'+s],receiverRoute:samplePass.id,partIds:parts.slice(first).map(p=>p.id),recoveryStatus:'Positively blinded; destination and pressure protection unqualified'});
 }
 h.upstream.feeds.push(feed);return sampling;
}

const NORMAL_PART_STATE={visible:true,removed:false,delta:[0,0,0]};
export function maintenancePartState(p,branch){if(!p.maintenanceBranch)return NORMAL_PART_STATE;const active=branch===p.maintenanceBranch;return{visible:!p.maintenanceOnly||active,removed:active&&p.maintenanceRemove,delta:active&&p.maintenanceMotion==='feeder'?p.maintenanceDelta:[0,0,0]};}

export function applyFeederMaintenance(T,parts,branch,structure=null){
 for(const p of parts){if(!p.maintenanceMotion)continue;p.operatingPosition??=p.position.clone();const delta=maintenancePartState(p,branch).delta;p.position.copy(p.operatingPosition).add(new T.Vector3(...delta));if(p.screenBody){p.operatingScreenPosition??=[...p.screenBody.position];p.screenBody.position=p.operatingScreenPosition.map((n,i)=>n+delta[i]);}if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();p.bounds=p.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale));}
 // A sliding contact follows the carriage along the fixed guide, without moving
 // the guide itself or changing the declared supported load.
 if(structure){const byId=new Map(parts.map(p=>[p.id,p]));for(const joint of structure.contacts){const a=byId.get(joint.a),b=byId.get(joint.b);for(const[fixed,moving,key]of[[a,b,'localA'],[b,a,'localB']]){if(!fixed?.name.includes('fixed guide rail')||!moving?.maintenanceMotion)continue;const base='operating'+key;joint[base]??=[...joint[key]];const shift=new T.Vector3(...maintenancePartState(moving,branch).delta).applyQuaternion(fixed.quaternion.clone().invert()).divide(fixed.scale);joint[key]=joint[base].map((n,i)=>n+shift.getComponent(i));}}}
}

export function reactorDisconnectSchedule(model){
 const rows=[];
 for(const[s,id]of[['A',1],['B',2],['C',54],['D',55]]){
  const e=model.equipment[id];
  for(const r of model.routes.filter(r=>r.reactor===id&&/Top feed header|Phosphoric (branch|nozzle)|Pre-G (chute|nozzle)|normal vent|cleaning inlet|CIP|relief|drive conduit/i.test(r.label))){
   rows.push({reactor:e.tag,routeId:r.id,service:r.service,label:r.label,endpoints:r.endpoints,partIds:r.partIds,status:'HOLD — P&ID and vendor disconnect approval',action:/vent|relief/i.test(r.label)?'Retained vessel protection must be resolved before removal; define supported removable spool and positive closures.':'Identify stationary and removable ends; isolate, decontaminate, support removed spool and positively close exposed interfaces. Verify reinstatement.'});
  }
  rows.push({reactor:e.tag,service:'Electrical / seal / instruments',status:'HOLD — vendor interface list',action:'Isolate drive power and stored energy; disconnect identified terminal, seal and instrument interfaces using supplier instructions. Do not use cables or tubing as lifting restraints.'});
 }
 return rows;
}
