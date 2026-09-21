import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';

// Hollow three-port welded reducing tee. Local X is the run, +Y the branch.
// Outer and inner junction contours meet the corresponding cylinder surfaces.
export function ufTeeGeometry(T,R,r,L=.10,H=.15){
 const pos=[],v=a=>new T.Vector3(...a);
 function quad(a,b,c,d,normal){let q=[a,b,c,a,c,d];if(v(b).sub(v(a)).cross(v(c).sub(v(a))).dot(v(normal))<0)q=[a,c,b,a,d,c];for(const p of q)pos.push(...p);}
 for(const [rr,br,inner] of [[R,r,false],[R*.78,r*.78,true]]){
  const angles=Array.from({length:129},(_,i)=>-Math.PI+i*Math.PI/64);
  for(let i=0;i<=64;i++)angles.push(Math.asin(br*Math.sin(i*Math.PI*2/64)/rr));
  const aa=[...new Set(angles.map(a=>a.toFixed(12)))].map(Number).sort((a,b)=>a-b);
  const pt=(x,t)=>[x,rr*Math.cos(t),rr*Math.sin(t)];
  const hole=t=>Math.cos(t)>0&&Math.abs(rr*Math.sin(t))<br?Math.sqrt(Math.max(0,br*br-(rr*Math.sin(t))**2)):0;
  for(let i=0;i<aa.length-1;i++){const a=aa[i],b=aa[i+1],ha=hole(a),hb=hole(b),n=[0,Math.cos((a+b)/2)*(inner?-1:1),Math.sin((a+b)/2)*(inner?-1:1)];
   quad(pt(-L,a),pt(-ha,a),pt(-hb,b),pt(-L,b),n);quad(pt(ha,a),pt(L,a),pt(L,b),pt(hb,b),n);
  }
  for(let i=0;i<64;i++){const a=i*Math.PI/32,b=(i+1)*Math.PI/32,p=t=>[br*Math.cos(t),Math.sqrt(rr*rr-(br*Math.sin(t))**2),br*Math.sin(t)],q=t=>[br*Math.cos(t),H,br*Math.sin(t)];quad(p(a),q(a),q(b),p(b),[Math.cos((a+b)/2)*(inner?-1:1),0,Math.sin((a+b)/2)*(inner?-1:1)]);}
 }
 for(let i=0;i<64;i++){const a=i*Math.PI/32,b=(i+1)*Math.PI/32;for(const sign of[-1,1])quad([sign*L,R*Math.cos(a),R*Math.sin(a)],[sign*L,R*Math.cos(b),R*Math.sin(b)],[sign*L,R*.78*Math.cos(b),R*.78*Math.sin(b)],[sign*L,R*.78*Math.cos(a),R*.78*Math.sin(a)],[sign,0,0]);quad([r*Math.cos(a),H,r*Math.sin(a)],[r*.78*Math.cos(a),H,r*.78*Math.sin(a)],[r*.78*Math.cos(b),H,r*.78*Math.sin(b)],[r*Math.cos(b),H,r*Math.sin(b)],[0,1,0]);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
}

export function buildUFManifolds(h){
 const k=processKit(h,.08),s=structuralKit(h),{T,parts,edges,routes,ports,setContext,b,c,band,nozzle,terminal,bulkValve}=k;
 const V=p=>new T.Vector3(...p),first=parts.length,firstEdge=edges.length,banks=[],junctions=[];
 const inlet=[77,1.15,-23.5],outlet=[81.16,3.3,-23.5],waste=[77,3.6,-24];
 setContext(505,'UF-2001 supported membrane skid');
 const markRoute=(points,label,service,r=.08)=>{const line=k.line(points,r,label,service,'UF-2001','UF-2001');Object.assign(line,{areaId:'A-2000',designStatus:'proposed',exploreRole:'equipment',ufCircuit:service});return line;};
 function tee(at,axis,branch,R,r,label){
  const L=r===R?.16:.10,H=r===R?.22:.15,ax=V(axis),br=V(branch),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(ax,br,ax.clone().cross(br)));
  const g=k.geo('UF tee '+[R,r,L,H].join('/'),()=>ufTeeGeometry(T,R,r,L,H));
  const ps=[V(at).addScaledVector(ax,-L).toArray(),V(at).addScaledVector(ax,L).toArray(),V(at).addScaledVector(br,H).toArray()];
  const p=k.add(label,'pipe',g,at,'bright',q,[1,1,1],{fittingType:r===R?'equal-tee':'reducing-tee',ports:ps,portAxes:[ax.clone().negate().toArray(),axis,branch],conduitRadius:R});
  const line={id:'LINE-'+String(routes.length+1).padStart(3,'0'),label,reactor:505,partIds:[p.id],edgeIndices:[],service:label.includes('filtrate')?'UF filtrate':label.includes('waste')?'Backwash wastewater':'Treated wastewater',exploreRole:'equipment',areaId:'A-2000',endpoints:ps,ufCircuit:true};routes.push(line);p.routeId=line.id;
  for(const point of ps){k.edge(at,point,label,p);const edge=edges.at(-1);edge.routeId=line.id;edge.screenAsPipe=false;line.edgeIndices.push(edges.length-1);}
  p.ufJunction=label;junctions.push({label,partId:p.id,point:at,ports:ps});return {part:p,ports:ps,point:at};
 }
 function cap(point,axis,r,label){c(label,'head',r,.018,V(point).addScaledVector(V(axis),.009).toArray(),'bright',axis);terminal(point,label);}
 function valve(a,z,tag){bulkValve(a,z,.08,tag,tag+' isolation');const val=h.valves.at(-1);val.normalState='closed';const disc=parts.find(p=>p.id===val.discId);disc.quaternion.copy(disc.closedQuaternion);return val;}
 // Common feed, collection and waste headers each own their shared runs once.
 const outletTee=tee([81,3.3,-23.5],[1,0,0],[0,1,0],.08,.08,'UF common filtrate backwash junction');
 const backwash=outletTee.ports[0];
 const feedTees=[],filtrateTees=[],wasteTees=[];
 for(let bank=0;bank<2;bank++){
  const z=-22.3+bank*2.4,zf=z-.5,zo=z+.5;
  feedTees.push(tee([76.8,1,zf],[0,0,1],[1,0,0],.08,.08,'UF common feed tee '+bank));
  filtrateTees.push(tee([81,3.65,zo],[0,0,1],[-1,0,0],.08,.08,'UF common filtrate tee '+bank));
  wasteTees.push(tee([76.1,3.6,zf],[0,0,1],[1,0,0],.08,.08,'UF common waste tee '+bank));
 }
 for(const [tt,service,prefix,begin] of [[feedTees,'Treated wastewater','feed',inlet],[filtrateTees,'UF filtrate','filtrate',outletTee.ports[2]],[wasteTees,'Backwash wastewater','waste',waste]]){
  const end=tt[0].ports[0];
  const points=prefix==='feed'?[begin,[77,1,-23.5],[76.8,1,-23.5],end]:prefix==='filtrate'?[begin,[81,3.65,-23.5],end]:[begin,[77,3.3,-24],[76.1,3.3,-24],[76.1,3.6,-24],end];
  markRoute(points,'UF common '+prefix+' connection',service);markRoute([tt[0].ports[1],tt[1].ports[0]],'UF common '+prefix+' shared run',service);cap(tt[1].ports[1],[0,0,1],.08,'UF common '+prefix+' terminal cap');
 }
 for(let bank=0;bank<2;bank++){
  const z=-22.3+bank*2.4,zf=z-.5,zo=z+.5,modules=[],feed=[],filtrate=[];
  const base=b('UF bank '+bank+' base','frame',[3.2,.16,1.5],[79,.08,z],'dark');h.structure.roots.push({part:base.id,local:[0,-.5,0],elevation:0});
  for(let j=0;j<10;j++){
   const x=77.7+j*.285,label='UF-2001 bank '+bank+' module '+j;
   const body=band(label,'shell',.115,.102,2.45,[x,1.9,z],'blue');body.cut=true;
   for(const y of[.675,3.125])band(label+' end head','head',.115,.035*.78,.035,[x,y,z],'blue');
   const collar=band(label+' support collar','frame',.13,.112,.08,[x,.74,z],'dark');s.join(body,collar,[x+.114,.74,z],label+' shell / collar');s.load(body,label);
   for(const sign of[-1,1]){const leg=s.beam([x+sign*.11,.16,z],[x+sign*.11,.74,z],.035,label+' saddle leg');s.join(base,leg,[x+sign*.11,.16,z],label+' skid / saddle');s.join(leg,collar,[x+sign*.11,.74,z],label+' saddle / collar');}
   const i=nozzle([x,.675,z],[0,-1,0],.15,'UF feed '+bank+'/'+j,.035),o=nozzle([x,3.125,z],[0,1,0],.15,'UF filtrate '+bank+'/'+j,.035);
   k.passage(body,[[x,.72,z],[x,3.08,z]],'UF membrane passage '+bank+'/'+j,'UF filtrate',{internalTo:'UF-2001',transport:'filter medium permeation'});
   const ft=tee([x,1,zf],[1,0,0],[0,-1,0],.08,.035,'UF bank '+bank+' feed reducing tee '+j),ot=tee([x,3.65,zo],[1,0,0],[0,0,-1],.08,.035,'UF bank '+bank+' filtrate reducing tee '+j);feed.push(ft);filtrate.push(ot);
   markRoute([ft.ports[2],[x,.32,zf],[x,.32,z],i],'UF module inlet '+bank+'/'+j,'Treated wastewater',.035);
   markRoute([o,[x,3.65,z],ot.ports[2]],'UF module filtrate '+bank+'/'+j,'UF filtrate',.035);
   body.serviceAccess={standing:[x,0,z-.95],method:'Isolate and drain bank; disconnect both clamped module joints and remove upper branch spool before vertical module withdrawal. Vendor lifting procedure required.',withdrawalAxis:[0,1,0],withdrawalM:2.6};body.accessTag=label;
   modules.push({bodyId:body.id,x,inlet:i,outlet:o,feedTee:ft.part.id,filtrateTee:ot.part.id});
  }
  const wt=tee([77.3,1,zf],[1,0,0],[0,1,0],.08,.08,'UF bank '+bank+' waste diversion tee');
  markRoute([feedTees[bank].ports[2],wt.ports[0]],'UF bank feed '+bank,'Treated wastewater');markRoute([wt.ports[1],feed[0].ports[0]],'UF bank '+bank+' feed header lead','Treated wastewater');
  for(let j=0;j<9;j++){markRoute([feed[j].ports[1],feed[j+1].ports[0]],'UF bank '+bank+' feed header span '+j,'Treated wastewater');markRoute([filtrate[j].ports[1],filtrate[j+1].ports[0]],'UF bank '+bank+' filtrate header span '+j,'UF filtrate');}
  markRoute([feed[9].ports[1],[80.5,1,zf]],'UF bank '+bank+' feed header tail','Treated wastewater');cap([80.5,1,zf],[1,0,0],.08,'UF bank '+bank+' feed end cap');
  markRoute([[77.45,3.65,zo],filtrate[0].ports[0]],'UF bank '+bank+' filtrate header tail','UF filtrate');cap([77.45,3.65,zo],[-1,0,0],.08,'UF bank '+bank+' filtrate end cap');
  markRoute([filtrate[9].ports[1],filtrateTees[bank].ports[2]],'UF bank filtrate '+bank,'UF filtrate');
  const va=[77.3,1.4,zf],vb=[77.3,1.75,zf];markRoute([wt.ports[2],va],'UF bank '+bank+' waste valve inlet','Backwash wastewater');valve(va,vb,'XV-UF2001-WASTE-'+bank);markRoute([vb,[77.3,3.6,zf],wasteTees[bank].ports[2]],'UF reject takeoff '+bank,'Backwash wastewater');
  // Dedicated saddles support both headers; side braces remain outside modules.
  const posts=[];
  for(const xx of[77.5,80.5])for(const [zz,yy] of[[zf,1],[zo,3.65]]){
   const post=s.column(xx,zz,yy-.09,'UF bank '+bank+' header support',.07);posts.push({...post,y:yy});
   const saddle=band('UF bank '+bank+' header saddle','frame',.095,.078,.065,[xx,yy,zz],'dark',[1,0,0]);s.join(post.post,saddle,[xx,yy-.09,zz],'UF header post / saddle');
   // Register physical contact to the containing straight header spool.
   const host=parts.slice(first).find(p=>p.system==='pipe'&&edges.some(e=>e.part===p.id&&Math.abs(e.a[1]-yy)<1e-6&&Math.abs(e.b[1]-yy)<1e-6&&Math.abs(e.a[2]-zz)<1e-6&&Math.abs(e.b[2]-zz)<1e-6&&Math.min(e.a[0],e.b[0])<=xx&&Math.max(e.a[0],e.b[0])>=xx));
   if(!host)throw Error('UF header support has no pipe host');s.join(saddle,host,[xx,yy-.079,zz],'UF header / saddle');s.load(host,'UF header');
  }
  for(const xx of[77.5,80.5]){const a=posts.find(p=>p.x===xx&&p.z===zf),zpost=posts.find(p=>p.x===xx&&p.z===zo),brace=s.beam([xx,.4,zf],[xx,3.4,zo],.035,'UF bank '+bank+' header side brace');s.join(a.post,brace,[xx,.4,zf],'UF brace low');s.join(zpost.post,brace,[xx,3.4,zo],'UF brace high');}
  banks.push({bank,z,modules,feedHeaderTeeIds:feed.map(t=>t.part.id),filtrateHeaderTeeIds:filtrate.map(t=>t.part.id),wasteValve:'XV-UF2001-WASTE-'+bank});
 }
 // Internal skid pipework is physically part of the package. External services
 // remain outside this range and keep the shared assembly registry's context role.
 for(const p of parts.slice(first)){p.ufSkid=true;p.exploreRole='equipment';p.physicalHostTag='UF-2001';p.componentAssembly||='uf-part-'+p.id;}
 // Record only actual coincident pipe ends as mounting continuity, not near misses.
 const at=new Map();for(const e of edges.slice(firstEdge))for(const point of[e.a,e.b]){const key=point.map(n=>Math.round(n*1e6)).join(',');if(!at.has(key))at.set(key,[]);at.get(key).push({id:e.part,point});}
 const byId=new Map(parts.slice(first).map(p=>[p.id,p]));for(const list of at.values()){const ids=[...new Set(list.map(v=>v.id))];for(const id of ids.slice(1))s.join(byId.get(ids[0]),byId.get(id),list[0].point,'UF skid pipe joint');}
 return {streams:k.streams,inlet,outlet,backwash,waste,banks,junctions,partIds:parts.slice(first).map(p=>p.id),designStatus:'proposed',connectionType:'Conceptual welded tees and elbows with removable clamped module joints; material, pressure rating, joint type and hydraulic sizing require vendor selection',ceb:{tag:'BL-UF2001-CEB',status:'Not modeled: source, nozzle location, isolation sequence and segregated recovery require vendor design'}};
}
