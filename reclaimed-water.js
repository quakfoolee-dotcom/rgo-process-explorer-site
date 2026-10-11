import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';
import {A2000_BASIS,A2000_IDS,RO2011} from './a2000-basis.js';
export function buildReclaimedWater(h){
 const k=processKit(h,.08),s=structuralKit(h),{T,parts,edges,routes,ports,terminals,EQUIPMENT,setContext,b,c,band,nozzle,terminal,bulkValve,boltCircle}=k;
 const first=parts.length,mappedStreams=[],controlLinks=[],trains=[],connections=[],vessels={},bunds=[],V=p=>new T.Vector3(...p);
 function L(points,label,service='Treated wastewater',stream=null,r=.08,meta={}){const out=k.line(points,r,label,service,meta.from||'',meta.to||'',meta.specs||{});Object.assign(out,{areaId:'A-2000',toArea:'A-2000',pfdStream:stream,source:stream?{id:'feed-pfd-v51',revision:'V5.1',page:16}:null,designStatus:stream?'listed':'proposed',...meta});if(stream)mappedStreams.push({stream,routeId:out.id,label});return out;}
 function G(a,z,tag,closed=true,r=.08){bulkValve(a,z,r,tag,tag+' isolation');const v=h.valves.at(-1);v.normalState=closed?'closed':'open';if(closed){const p=parts.find(p=>p.id===v.discId);p.quaternion.copy(p.closedQuaternion);}return z;}
 function root(p,at){h.structure.roots.push({part:p.id,local:V(at).sub(p.position).applyQuaternion(p.quaternion.clone().invert()).divide(p.scale).toArray(),elevation:0});return p;}
 function panel(id,tag,x,z){setContext(id,tag+' grade controls');const f=root(b(tag+' panel base','frame',[.4,.1,.4],[x,.05,z]),[x,0,z]),p=s.beam([x,.1,z],[x,1.4,z],.09,tag+' post'),d=b(tag+' display','valve',[.72,.6,.2],[x,1.4,z],'blue');s.join(f,p,[x,.1,z],tag+' anchor');s.join(p,d,[x,1.4,z],tag+' panel mounting');s.load(d,tag);d.serviceAccess={standing:[x,0,z+.75],method:'Grade control position',withdrawalAxis:[0,0,1]};d.accessTag=tag;return d;}
 function tank(id,service='Treated wastewater',agitated=false){const e=EQUIPMENT[id],{x,z,tag,radius:r,bottom:y0,top:y1}=e;setContext(id,e.label);
  const pad=root(c(tag+' foundation','frame',r+.18,.2,[x,.1,z],'dark'),[x,0,z]),floor=c(tag+' supported bottom','head',r,.06,[x,.23,z]),body=band(tag+' vessel shell','shell',r,r-.04,y1-y0,[x,(y0+y1)/2,z]),roof=c(tag+' roof','head',r,.06,[x,y1+.03,z]);body.cut=roof.cut=true;
  s.join(pad,floor,[x,.2,z],tag+' foundation / bottom');s.join(floor,body,[x+r-.02,y0,z],tag+' shell / bottom');s.join(body,roof,[x+r-.02,y1,z],tag+' shell / roof');for(const p of[body,roof])s.load(p,tag);
  const hub=[x,.65,z],port=(name,at,axis,rr=.08,medium=service)=>{setContext(id,tag+' '+name);const out=nozzle(at,axis,.22,tag+' '+name,rr),inside=V(at).addScaledVector(V(axis),-.045).toArray();k.passage(floor,[inside,hub],tag+' '+name+' internal passage',medium,{internalTo:tag});return out;};
  const input=port('inlet',[x-.45,y1+.06,z],[0,1,0]),out=port('outlet',[x,.65,z+r],[0,0,1]),vent=port('vent',[x+.45,y1+.06,z],[0,1,0],.05,'Vent');c(tag+' screened vent hood','head',.13,.08,[vent[0],vent[1]+.04,vent[2]],'dark');terminal(vent,tag+' independent atmospheric vent; sizing / chemical suitability HOLD');
  const man=port('access manway',[x,1.05,z-r],[0,0,-1],.24);c(tag+' manway cover','head',.29,.04,man,'bright',[0,0,1]);boltCircle(man,[0,0,-1],.265,10,.5,tag+' bolts');terminal(man,tag+' closed manway');
  if(agitated){const mount=b(tag+' agitator mounting','frame',[.7,.18,.7],[x,y1+.15,z]),motor=c(tag+' agitator motor','pump',.27,.65,[x,y1+.565,z],'blue');s.join(roof,mount,[x,y1+.06,z],tag+' mixer mounting');s.join(mount,motor,[x,y1+.24,z],tag+' drive');s.load(motor,tag+' mixer');c(tag+' agitator shaft','internal',.07,y1-.7,[x,(y1+.7)/2,z],'inner');for(const yy of[1.2,y1*.55])for(let j=0;j<3;j++){const angle=j*2*Math.PI/3;b(tag+' mixing blade','internal',[r*.55,.08,.35],[x+Math.cos(angle)*r*.25,yy,z+Math.sin(angle)*r*.25],'inner',new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-angle));}}
  const sensor=port('level probe',[x+r,1.3,z],[1,0,0],.025);terminal(sensor,tag+' sealed level transmitter');k.instrument('LIT-'+tag,sensor,'level',[1,0,0]);controlLinks.push({tag:'LIT-'+tag,equipment:tag,measurementPoint:sensor,setpoint:null,interlocks:['High-high stops incoming transfer','Low-low stops downstream pump'],status:'Proposed; capacity and levels not approved'});
  const t={id,tag,x,z,r,top:y1,input,out,hub,port,body,service};vessels[tag]=t;return t;
 }
 function pump(id){const e=EQUIPMENT[id];setContext(id,e.label);return k.transferPump(e.x,e.tag,e.label,{z:e.z});}
 function suction(t,p,label,stream=null){L([t.out,[t.x,.65,p.inlet[2]],[p.inlet[0],.65,p.inlet[2]],p.inlet],label,t.service,stream);}
 function endBoundary(tag,point,service,destination,closed=true,r=.08){k.boundary(tag,point,[1,0,0],r,service,destination);if(closed)c(tag+' positive blind','valve',r*1.7,.03,[point[0]+.36,point[1],point[2]],'dark',[1,0,0]);}
 function consume(tag){const p=ports.find(p=>p.id===tag);if(!p)throw Error('A-2000 missing source interface '+tag);p.role='interunit';for(let i=terminals.length-1;i>=0;i--)if(terminals[i].label===tag+' external battery limit')terminals.splice(i,1);for(const unit of[h.wastewater,h.preg,h.upstream,h.separations])for(const q of unit?.boundaries||[])if(q.tag===tag){q.kind='interunit';q.destination='Connected reclaimed water; release qualification required';}return p;}
 const stock=tank(501,'RO water'),product=tank(508,'Process water'),anti=tank(513,'Antiscalant'),spent=tank(521,'Segregated CIP waste');
 const pumps={};for(const id of[502,509,514])pumps[id]=pump(id);
 // City water (QFL 2026-10-10: Route 0, no A-1100 condensate; the A-1000 effluent goes to sewer). The city supply is dechlorinated by CF-2002, split at HDR-2002 into the RO-2011 feed (PW-4 RO water, 75 % recovery) and the T-2002 top-up (PW-6); the RO-2011 reject is reused in T-2002.
 // Carbon filter (CF-2002, about 32 m3/h): one O 1.2 m vessel, three 0.81 m bed layers (about 2.6 m3), backwash by upflow city water (V356), waste to an air-gapped floor drain.
 function carbon(id,r,y1,layers,layerH){const e=EQUIPMENT[id],{x,z,tag}=e,y0=.45,ym=(y0+y1)/2;setContext(id,tag+' activated-carbon filter');
  const base=root(c(tag+' plinth','frame',r+.12,.30,[x,.15,z]),[x,0,z]),shell=band(tag+' pressure vessel','shell',r,r-.012,y1-y0,[x,ym,z],'blue'),bot=c(tag+' bottom head','head',r,.2,[x,.4,z],'blue'),top=c(tag+' top head','head',r,.12,[x,y1+.06,z],'blue');shell.cut=true;
  s.join(base,bot,[x,.3,z],tag+' base');s.join(bot,shell,[x+r-.02,y0,z],tag+' shell');s.join(shell,top,[x+r-.02,y1,z],tag+' top');s.load(shell,tag+' vessel');
  for(let n=0;n<layers;n++)c(tag+' carbon bed layer '+n,'internal',r-.02,layerH,[x,.5+layerH*(n+.5),z],'dark');
  const i=nozzle([x,y1+.12,z],[0,1,0],.2,tag+' inlet',.06),o=nozzle([x+r,.9,z],[1,0,0],.2,tag+' outlet',.06),d=nozzle([x-r,.75,z],[-1,0,0],.2,tag+' backwash connection',.06);
  k.passage(shell,[[x,y1+.075,z],[x,ym,z],[x+r-.045,.9,z]],tag+' filtration passage','City water',{internalTo:tag});
  k.passage(shell,[[x-r+.045,.75,z],[x,ym,z],[x,y1+.075,z]],tag+' backwash passage','City water',{internalTo:tag});
  return {input:i,out:o,wash:d};
 }
 setContext(510,'City make-up to CF-2002');k.boundary('BL-A2000-CITY',[67.22,1.3,-.7],[0,0,1],.05,'City water','Municipal make-up (IF-A2000-CITY); supply quality and pressure are open holds (DAT-138 R3)');
 const cfUnit=carbon(510,.6,3.5,3,.81);
 L([[67.22,1.3,-.7],[67.22,1.3,-1.3]],'City make-up to CF-2002','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002',specs:{0:{type:'check',label:'BFP-2001 backflow preventer'}}});
 L([[67.22,1.3,-1.3],[67.22,1.65,-1.3]],'City make-up to XV-CF2002-IN','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});
 G([67.22,1.65,-1.3],[67.22,2,-1.3],'XV-CF2002-IN',false,.05);
 L([[67.22,2,-1.3],[67.22,4.3,-1.3],[67.5,4.3,-1.3],[67.5,4.3,-2.7]],'City make-up to CF-2002 inlet','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});k.instrument('FT-2005',[67.22,2.6,-1.3],'flow',[1,0,0]);
 L([[67.5,4.3,-2.7],[67.5,4.3,-3.6],cfUnit.input],'City make-up to CF-2002 inlet (top)','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});
 // Backwash (V356): upflow with city water tapped UPSTREAM of the inlet valve (tee after the backflow preventer) into the bottom connection; the waste leaves by the top connection and the inlet line through an air-gapped floor drain (closed boundary until the sewer connection is approved). IN and OUT are closed during the backwash. All valves are at 2 m or lower.
 setContext(510,'CF-2002 backwash');L([[67.22,1.3,-1.3],[66.75,1.3,-1.3]],'CF-2002 backwash supply','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});G([66.75,1.3,-1.3],[66.4,1.3,-1.3],'XV-CF2002-BW',true,.05);L([[66.4,1.3,-1.3],[66.4,.75,-1.3],[66.4,.75,-3.6],cfUnit.wash],'CF-2002 backwash supply to the bottom connection','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});
 L([[67.5,4.3,-2.7],[68,4.3,-2.7],[68,2,-2.7]],'CF-2002 backwash waste to drain','Backwash wastewater',null,.06,{from:'CF-2002',to:'BL-CF2002-WASTE'});G([68,2,-2.7],[68,1.65,-2.7],'XV-CF2002-WASTE',true,.06);L([[68,1.65,-2.7],[68,.8,-2.7]],'CF-2002 backwash waste drain leg','Backwash wastewater',null,.06,{from:'CF-2002',to:'BL-CF2002-WASTE'});endBoundary('BL-CF2002-WASTE',[68,.8,-2.7],'Backwash wastewater','Air-gapped floor drain to sewer; connection and approval open',true,.06);
 // HDR-2002: one outlet node, two branches.
 const hdr=[68.6,3,-3.6];setContext(510,'CF-2002 outlet header HDR-2002');L([cfUnit.out,[68.6,.9,-3.6]],'CF-2002 outlet to HDR-2002','City water',null,.06,{from:'CF-2002',to:'HDR-2002'});G([68.6,.9,-3.6],[68.6,1.25,-3.6],'XV-CF2002-OUT',false,.06);L([[68.6,1.25,-3.6],hdr],'CF-2002 outlet to HDR-2002 (downstream)','City water',null,.06,{from:'CF-2002',to:'HDR-2002'});
 const cityPort=product.port('city make-up inlet',[product.x+.9,product.top+.06,product.z],[0,1,0],.05,'City water'),rejPort=product.port('RO-2011 reject inlet',[product.x+Math.sqrt(product.r*product.r-(-5-product.z)*(-5-product.z)),.7,-5],[1,0,0],.05,'RO concentrate');
 setContext(508,'City top-up to T-2002');L([hdr,[68.6,3.4,-3.6]],'HDR-2002 to LV-2002','City water',null,.05);G([68.6,3.4,-3.6],[68.6,3.8,-3.6],'LV-2002',false,.05);L([[68.6,3.8,-3.6],[68.6,7.3,-3.6],[cityPort[0],7.3,-3.6],[cityPort[0],7.3,cityPort[2]],cityPort],'CF-2002 make-up to T-2002','City water',null,.05,{from:'CF-2002',to:'T-2002'});
 // RO-2011 feed: run north at x 69.7, outside the west walking zone (x <= 69.5), at 3 m above the floor.
 const gf=EQUIPMENT[522],gx=gf.x,gz=gf.z,injection=[69.7,3,-8.5];
 setContext(506,'HDR-2002 to RO-2011 feed');L([hdr,[69.7,3,-3.6],injection],'HDR-2002 to RO-2011 feed','City water',null,.06,{from:'HDR-2002',to:'RO-2011'});k.instrument('AIT-2001',injection,'pH / conductivity / oxidant');
 setContext(514,'Antiscalant dosing');suction(anti,pumps[514],'T-2004 to P-2004','2018');L([pumps[514].outlet,[81.75,1.5,-5.7],[81.75,4.6,-5.7],[81.75,4.6,-6.5],[69.7,4.6,-6.5],[69.7,4.6,-8.5],injection],'P-2004 antiscalant injection','Antiscalant','2019',.02,{specs:{1:{type:'check',label:'NRV-AS2001'}}});endBoundary('BL-AS2001-FILL',[79.45,1.2,-8],'Antiscalant','Closed delivery connection',true,.025);L([[79.45,1.2,-8],[79.45,3,-8],[80,3,-8],[80,3,-5.7],anti.input],'Antiscalant closed fill','Antiscalant','2017',.025);
 // CF-2003 guard housing and P-2012 (vertical multistage VFD pump); one pressure train, no standby.
 function guardFilter(){
  const id=522,tag=EQUIPMENT[id].tag,first=parts.length;
  setContext(id,tag+' guard cartridge filter housing');
  const body=band(tag+' housing wall','shell',.23,.20,1.2,[gx,1,gz],'bright');body.cut=true;
  const bottom=c(tag+' closed bottom head','head',.23,.06,[gx,.4,gz],'bright');
  const rim=band(tag+' closure flange','head',.27,.20,.06,[gx,1.58,gz],'bright');
  const seal=band(tag+' lid seal','internal',.245,.20,.012,[gx,1.616,gz],'dark');
  const lid=c(tag+' removable closed lid','head',.27,.05,[gx,1.647,gz],'bright');lid.cut=true;
  boltCircle([gx,1.676,gz],[0,1,0],.247,8,.35,tag+' lid fasteners');
  const plate=band(tag+' sealed outlet partition','internal',.20,.055,.035,[gx,.70,gz],'inner');
  const cartridge=band(tag+' replaceable cartridge medium','internal',.14,.055,.76,[gx,1.115,gz],'inner');
  band(tag+' cartridge bottom seal','internal',.145,.055,.018,[gx,.726,gz],'dark');
  c(tag+' cartridge closed top cap','internal',.145,.025,[gx,1.5075,gz],'inner');
  band(tag+' cartridge top seal','internal',.145,.055,.012,[gx,1.489,gz],'dark');
  c(tag+' lid hold-down stem','internal',.035,.12,[gx,1.57,gz],'steel');
  s.join(bottom,body,[gx+.215,.43,gz],tag+' shell / bottom');s.join(body,rim,[gx+.215,1.58,gz],tag+' shell / closure');
  s.join(rim,seal,[gx+.22,1.61,gz],tag+' closure / seal');s.join(seal,lid,[gx+.22,1.622,gz],tag+' seal / lid');s.load(body,tag);
  for(const dx of[-.18,.18]){const foot=root(b(tag+' baseplate','frame',[.18,.06,.30],[gx+dx,.03,gz]),[gx+dx,0,gz]),leg=s.beam([gx+dx,.06,gz],[gx+dx,.4,gz],.07,tag+' support leg');s.join(foot,leg,[gx+dx,.06,gz],tag+' leg / base');s.join(leg,bottom,[gx+dx,.4,gz],tag+' head / leg');boltCircle([gx+dx,.06,gz],[0,1,0],.06,4,.25,tag+' foundation anchors');}
  const gi=nozzle([gx,1.4,gz-.23],[0,0,-1],.20,tag+' inlet',.08),go=nozzle([gx,.6,gz-.23],[0,0,-1],.20,tag+' outlet',.08);
  k.passage(body,[[gx,1.4,gz-.185],[gx,1.4,gz-.14]],tag+' feed annulus','City water',{internalTo:tag});
  k.passage(cartridge,[[gx,1.4,gz-.14],[gx,1.4,gz]],tag+' outside-in filtration','City water',{internalTo:tag,transport:'filter medium permeation'});
  k.passage(plate,[[gx,1.4,gz],[gx,.6,gz],[gx,.6,gz-.185]],tag+' sealed clean outlet','City water',{internalTo:tag});
  lid.serviceAccess={standing:[gx-.7,0,gz],method:'Depressurize and isolate; lift lid then withdraw cartridge vertically. Proposed 0.9 m clear height above lid; vendor confirmation required.',withdrawalAxis:[0,1,0],withdrawalM:.9};lid.accessTag=tag;
  for(const p of parts.slice(first)){p.physicalHostTag=tag;p.processOwnerId=506;p.guardFilterTag=tag;}
  return {gi,go};
 }
 function hpPump(){const e=EQUIPMENT[506],x=e.x,z=e.z,tag=e.tag;setContext(506,tag+' vertical multistage pump');const base=root(b(tag+' foundation skid','frame',[1.0,.2,.8],[x,.1,z]),[x,0,z]),body=c(tag+' multistage barrel','pump',.13,.95,[x,.775,z],'bright'),motor=c(tag+' VFD motor','pump',.17,.6,[x,1.55,z],'blue');for(let j=0;j<5;j++)band(tag+' stage ring','pump',.145,.13,.03,[x,.45+j*.17,z],'dark');const foot=b(tag+' support foot','frame',[.5,.3,.5],[x,.35,z]);s.join(base,foot,[x,.2,z],tag+' base');s.join(foot,body,[x,.5,z],tag+' pump mount');s.join(body,motor,[x,1.25,z],tag+' drive coupling');s.load(body,tag+' pump');s.load(motor,tag+' drive');const i=nozzle([x-.13,.6,z],[-1,0,0],.2,tag+' inlet'),o=nozzle([x+.13,1,z],[1,0,0],.2,tag+' discharge');k.passage(body,[[x-.085,.6,z],[x+.085,1,z]],tag+' hydraulic passage','City water',{internalTo:tag});return {inlet:i,outlet:o,x,z};}
 const {gi,go}=guardFilter(),hp=hpPump(),{x:RX,zf:RF,zb:RB,elementsPerVessel:RN}=RO2011,pz=hp.z,px=hp.x,tag='RO-2011';
 setContext(506,'RO-2011 feed piping');L([injection,[69.7,3,-11.2],[gx,3,-11.2],[gx,1.4,-11.2],gi],'RO-2011 guard filter feed','City water');
 L([go,[gx,.6,go[2]-.5],[gx-.5,.6,go[2]-.5],[gx-.5,.6,pz],hp.inlet],'RO-2011 guarded suction','City water');
 L([hp.outlet,[px+.35,1,pz]],'P-2012 discharge','City water');L([[px+.35,1,pz],[px+.35,1.6,pz]],'P-2012 discharge riser','City water');G([px+.35,1.6,pz],[px+.35,1.95,pz],'XV-RO-FEED',false);
 const feedNode=[RX-1.35,2.8,RF];L([[px+.35,1.95,pz],[px+.35,2.8,pz],[px+.35,2.8,RF],feedNode],'P-2012 to RO-2011','City water','2009');
 const concNode=[RX+1.45,3.8,RF-.35],permNode=[RX-1.45,3.5,RF-.15],RC=RF-.35,EX=76,CX=77.4,cipRet=[CX,5.3,RC];
 setContext(507,tag+' membrane rack');const posts=[];for(const dx of[-1.15,1.15])for(const z of[RF+.8,RB-.8])posts.push(s.column(RX+dx,z,2.15,tag+' rack'));
 for(const y of[.58,1.28])for(const z of[RF+.8,RB-.8]){const beam=s.beam([RX-1.15,y,z],[RX+1.15,y,z],.09,tag+' saddle beam');for(const post of posts.filter(p=>Math.abs(p.z-z)<.31))s.join(post.post,beam,[post.x,y,z],tag+' rack beam');}
 for(let n=0;n<5;n++){const stage=n<3?1:2,xx=stage===1?RX+(n-1)*.6:RX+(n-3.5)*.6,y=stage===1?.9:1.6,front=[xx,y,RF],back=[xx,y,RB];
  const body=band(tag+' vessel '+(n+1)+' stage '+stage,'shell',.16,.145,RB-RF,[xx,y,(RF+RB)/2],'bright',[0,0,1]);body.cut=true;s.load(body,tag+' vessel '+(n+1));
  for(const z of[RF+.8,RB-.8]){const saddle=b(tag+' vessel saddle','frame',[.34,.18,.18],[xx,y-.25,z]);const beam=parts.find(p=>p.name===tag+' saddle beam'&&Math.abs(p.position.y-(y-.32))<.01&&Math.abs(p.position.z-z)<.01);if(beam)s.join(beam,saddle,[xx,y-.32,z],tag+' saddle support');s.join(saddle,body,[xx,y-.16,z],tag+' vessel / saddle');band(tag+' retaining strap','fastener',.172,.16,.04,[xx,y,z],'dark',[0,0,1]);}
  for(const z of[RF,RB]){c(tag+' end closure','head',.165,.04,[xx,y,z],'steel',[0,0,1]);boltCircle([xx,y,z],[0,0,1],.13,6,.4,tag+' closure bolts');}
  for(let j=0;j<RN;j++)c(tag+' element '+(n*RN+j+1),'internal',.11,1.016,[xx,y,RF+.85+j*1.04],'inner',[0,0,1]);
  k.passage(body,[front,back],tag+' vessel '+(n+1)+' feed to concentrate','RO concentrate',{internalTo:tag});const permPort=[xx+.2,y,RF],membrane=k.passage(body,[stage===1?front:back,permPort],tag+' vessel '+(n+1)+' permeation','RO water',{internalTo:tag,transport:'filter medium permeation'});edges[membrane.edgeIndices[0]].oneWay=true;
  L(stage===1?[[xx,2.8,RF],front]:[[xx,3.8,RB+.15],back],tag+' vessel '+(n+1)+' feed','City water',null,.04);
  L([stage===1?back:front,[xx,3.8,stage===1?RB+.15:RF-.35]],tag+' vessel '+(n+1)+' concentrate','RO concentrate',null,.04);L([permPort,[xx+.2,3.5,RF-.15]],tag+' vessel '+(n+1)+' permeate','RO water',null,.025);
 }
 L([feedNode,[RX-.6,2.8,RF],[RX,2.8,RF],[RX+.6,2.8,RF],[RX+1.5,2.8,RF],[75,2.8,RF]],tag+' feed manifold','City water',null,.04);L([[RX-.6,3.8,RB+.15],[RX-.3,3.8,RB+.15],[RX,3.8,RB+.15],[RX+.3,3.8,RB+.15],[RX+.6,3.8,RB+.15]],tag+' interstage manifold','RO concentrate',null,.04);L([[RX-.3,3.8,RF-.35],[RX+.3,3.8,RF-.35],[RX+1,3.8,RF-.35],concNode],tag+' stage 2 concentrate manifold','RO concentrate',null,.04);L([[RX+.8,3.5,RF-.15],[RX+.5,3.5,RF-.15],[RX+.2,3.5,RF-.15],[RX-.1,3.5,RF-.15],[RX-.4,3.5,RF-.15],[RX-1,3.5,RF-.15],permNode],tag+' permeate manifold','RO water',null,.025);
 // Package connections (QFL 2026-10-11 review): every operated valve is at 2 m or lower. The east side (the x 76 corridor and the x 77.4 valve column beside the x 78.5 aisle) takes the concentrate, the relief, the CIP feed and the CIP concentrate return; permeate, the guard filter and the pump are on the west side.
 L([concNode,[EX,3.8,RC],[EX,1.6,RC]],tag+' concentrate outlet','RO concentrate');
 G([EX,1.6,RC],[EX,1.25,RC],'XV-RO-BRINE',false);
 L([[EX,1.25,RC],[EX,.7,RC]],tag+' concentrate collection','RO concentrate','2014');
 // Relief on the high-pressure concentrate drop; it discharges into the reject trunk.
 L([[EX,2.8,RC],[75.5,2.8,RC]],tag+' relief takeoff','RO concentrate',null,.04);
 const rv=[75.5,3.15,RC],reliefBody=band('PSV-RO-2011 relief body','valve',.10,.04,.35,[75.5,2.975,RC],'bright');k.passage(reliefBody,[[75.5,2.8,RC],rv],'PSV-RO-2011 relief passage','RO concentrate',{internalTo:'PSV-RO-2011'});edges.at(-1).barrierTag='PSV-RO-2011';c('PSV-RO-2011 spring bonnet','valve',.065,.25,[75.64,3.1,RC],'bright');h.valves.push({tag:'PSV-RO-2011',label:'Spring-loaded pressure relief; vendor sizing HOLD',reactor:507,type:'relief',a:[75.5,2.8,RC],b:rv,normalState:'closed',partIds:[reliefBody.id]});
 L([rv,[75.5,3.5,RC],[75.5,3.5,-15.6],[75.5,.7,-15.6],[EX,.7,-15.6]],tag+' relief to T-2002 reject return','RO concentrate',null,.04,{qualification:'Relief sizing, backpressure, non-isolable path and destination capacity require vendor design'});
 // Reject trunk: low level along the skid east side, then west at z -5 (south of the element withdrawal strip) into a low nozzle on T-2002; FCV-RO-2011 sets the concentrate flow (recovery).
 L([[EX,.7,-15.6],[EX,.7,-13.5]],'RO-2011 reject to T-2002 (skid)','RO concentrate',null,.05);
 G([EX,.7,-13.5],[EX,.7,-13.15],'FCV-RO-2011',false,.05);
 setContext(507,'RO-2011 reject to T-2002');L([[EX,.7,-13.15],[EX,.7,-5],rejPort],'RO-2011 reject to T-2002','RO concentrate','2014',.05,{from:'RO-2011',to:'T-2002',specs:{1:{type:'check',label:'NRV-RO2011-REJ'}}});
 // CIP concentrate return: valve at 2 m on the concentrate drop, then overhead to the CIP skid.
 L([[EX,2,RC],[76.5,2,RC]],tag+' CIP concentrate return','CIP chemical');G([76.5,2,RC],[76.85,2,RC],'XV-RO-CIPRET');L([[76.85,2,RC],[CX,2,RC],[CX,5.3,RC]],tag+' CIP return header','CIP chemical');
 // Permeate (west side): drop to a low run, quality station, accepted-permeate valve and a low nozzle on T-2011.
 const WX=71.55,WZ=-15.35;
 L([permNode,[WX,3.5,WZ],[WX,1.6,WZ]],tag+' permeate outlet','RO water');G([WX,1.6,WZ],[WX,1.25,WZ],'XV-RO-PERM',false);
 L([[WX,1.25,WZ],[WX,.9,WZ],[69,.9,WZ]],tag+' permeate quality inlet','RO water');
 G([69,.9,WZ],[68.65,.9,WZ],'XV-RO-PRODUCT',false);
 const dzp=WZ-stock.z,t11=stock.port('RO-2011 permeate inlet',[stock.x+Math.sqrt(stock.r*stock.r-dzp*dzp),.9,WZ],[1,0,0],.05,'RO water');
 setContext(507,'RO-2011 permeate to T-2011');L([[68.65,.9,WZ],t11],'Accepted RO permeate to T-2011','RO water','2010');
 L([[70.6,.9,WZ],[70.6,1.45,WZ]],tag+' CIP permeate return','CIP chemical');G([70.6,1.45,WZ],[70.6,1.8,WZ],'XV-RO-CIPPERM');L([[70.6,1.8,WZ],[70.6,5.6,WZ],[70.6,5.6,-16.2],[CX,5.6,-16.2],[CX,5.6,RC],cipRet],tag+' CIP permeate header','CIP chemical');
 // Instruments on the skid, all within reach: pressure, flow, conductivity and sample points.
 setContext(507,'RO-2011 skid instruments');k.instrument('PIT-2011',[px+.35,2.35,pz],'feed pressure',[1,0,0]);k.instrument('SP-2011F',[px+.35,1.3,pz],'feed sample point',[-1,0,0]);k.instrument('PIT-2012',[EX,.7,-11],'concentrate pressure',[1,0,0]);k.instrument('FIT-2012',[EX,.7,-9.5],'concentrate flow',[1,0,0]);k.instrument('SP-2011C',[EX,.95,RC],'concentrate sample point',[1,0,0]);k.instrument('AIT-2002',[71,.9,WZ],'permeate conductivity',[0,0,-1]);k.instrument('SP-2011P',[70.2,.9,WZ],'permeate sample point',[0,0,-1]);k.instrument('FIT-2011',[69.6,.9,WZ],'permeate flow',[0,0,-1]);
 // Skid (V356): base frame under the rack, drip tray with a blinded sump drain, and a monorail over the rack for heads, elements and the pump.
 setContext(507,tag+' skid frame');
 const SX0=69.9,SX1=76.8,SZ0=-15.8,SZ1=-7.96,FX0=70.2,FX1=76.5;
 const rails=[FX0,FX1].map(x=>root(b(tag+' skid base rail','frame',[.16,.2,SZ1-SZ0-.2],[x,.1,(SZ0+SZ1)/2]),[x,0,(SZ0+SZ1)/2]));
 const crossMembers=[-15,-14,-11.4,-8.8,-8.3].map(z=>{const m=b(tag+' skid cross member','frame',[FX1-FX0,.16,.14],[(FX0+FX1)/2,.1,z]);for(const r of rails)s.join(r,m,[r.position.x,.1,z],tag+' skid frame joint');return m;});
 for(const p of posts){const m=crossMembers.find(mm=>Math.abs(mm.position.z-p.z)<.2);if(m)s.join(p.post,m,[p.x,.1,p.z],tag+' rack post / skid frame');}
 const tw=SX1-SX0,tl=SZ1-SZ0;
 root(b(tag+' drip tray floor pan','frame',[tw,.02,tl],[(SX0+SX1)/2,.01,(SZ0+SZ1)/2],'dark'),[(SX0+SX1)/2,0,(SZ0+SZ1)/2]);
 b(tag+' drip tray curb','frame',[.12,.25,tl],[SX1-.06,.125,(SZ0+SZ1)/2]);b(tag+' drip tray curb','frame',[.12,.25,SZ1+12.2],[SX0+.06,.125,(SZ1-12.2)/2]);
 // The grade-control panel stands on a tray extension north of the WALK-RO-MID zone.
 root(b(tag+' drip tray extension pan','frame',[1.5,.02,3.6],[69.15,.01,-14],'dark'),[69.15,0,-14]);b(tag+' drip tray extension curb','frame',[.12,.25,3.6],[68.46,.125,-14]);b(tag+' drip tray extension curb','frame',[1.38,.25,.12],[69.21,.125,-12.26]);
 for(const z of[SZ0+.06,SZ1-.06])b(tag+' drip tray curb','frame',[tw-.24,.25,.12],[(SX0+SX1)/2,.125,z]);
 b(tag+' drip tray sump','frame',[.3,.04,.3],[71.0,.02,-8.55],'dark');
 const sumpN=nozzle([71,.1,-8.55],[1,0,0],.3,tag+' tray sump drain nozzle',.05);L([sumpN,[71.7,.1,-8.55]],tag+' skid tray drain','Drain water',null,.05,{from:'RO-2011',to:'BL-RO2011-DRAIN'});endBoundary('BL-RO2011-DRAIN',[71.7,.1,-8.55],'Drain water','Closed tray sump drain to sewer; connection and approval open',true,.05);
 const mcols=[[FX0,-14.4],[FX1,-14.4],[FX0,-8.3],[FX1,-8.3]].map(([x,z])=>{const col=s.column(x,z,4.6,tag+' monorail column');const rail=rails[x===FX0?0:1];s.join(rail,col.post,[x,.2,z],tag+' monorail column base');return col;});
 const portal=[-14.4,-8.3].map((z,i)=>{const bm=s.beam([FX0,4.55,z],[FX1,4.55,z],.1,tag+' monorail portal beam');s.join(mcols[i*2].post,bm,[FX0,4.52,z],tag+' monorail portal joint');s.join(mcols[i*2+1].post,bm,[FX1,4.52,z],tag+' monorail portal joint');return bm;});
 const runway=s.beam([73.4,4.45,-14.4],[73.4,4.45,-8.3],.12,tag+' monorail runway beam');for(const bm of portal)s.join(bm,runway,[73.4,4.51,bm===portal[0]?-14.4:-8.3],tag+' monorail runway joint');s.load(runway,tag+' monorail');
 const trolley=b(tag+' monorail hoist trolley','frame',[.5,.4,.4],[73.4,4.25,-11.2],'blue');s.join(runway,trolley,[73.4,4.4,-11.2],tag+' hoist trolley');c(tag+' hoist chain','internal',.02,.5,[73.4,3.8,-11.2],'dark');
  panel(507,'CP-RO2011',69.1,-13);trains.push({suffix:'',duty:'duty',elements:5*RN,vessels:5,stages:[3,2],passes:1,partIds:parts.filter(p=>p.name.startsWith(tag)).map(p=>p.id)});
 // Permeate quality station, T-2011 and P-2011: the five existing RO-water consumers (A-400, A-160, A-200) are PW-4 users and are fed from P-2011.
 setContext(502,'T-2011 to P-2011');suction(stock,pumps[502],'T-2011 to P-2011','2011');
 const hx=EQUIPMENT[502].x,hz=EQUIPMENT[502].z;L([pumps[502].outlet,[hx,2,hz]],'P-2011 product quality station','RO water');G([hx,2,hz],[hx+.35,2,hz],'XV-RO-DISTRIBUTE');
 const distNode=[hx+.8,8.4,hz];L([[hx+.35,2,hz],[hx+.8,2,hz],distNode],'P-2011 to distribution header','RO water','2013',.08,{specs:{1:{type:'check',label:'NRV-RO2000-DIST'}}});k.instrument('PDIT-CF2002',[67.5,4.3,-2.5],'carbon-filter differential pressure',[1,0,0]);
 for(const [tg,lane,y]of[['BL-RO400',-2,9.3],['BL-RO161',-2.4,9.6],['BL-RO162',-3.2,10.2],['BL-RO-F161',-3.6,10.5],['BL-RO-201',-2.8,9.9]]){const p=ports.find(p=>p.id===tg);if(!p)continue;consume(tg);setContext(502,'Qualified RO water distribution to '+tg);const route=L([distNode,[distNode[0],y,hz],[distNode[0],y,lane],[p.point[0],y,lane],[p.point[0],y,p.point[2]],p.point],'A-2000 water to '+tg,'RO water','2013',.08,{toArea:EQUIPMENT[p.reactor].areaId,from:'P-2011',to:tg,specs:{0:{type:'check',label:'NRV-'+tg+'-SUPPLY'}}});connections.push({tag:tg,toArea:EQUIPMENT[p.reactor].areaId,routeIds:[route.id],partIds:route.partIds});}
 // PW-6 side: T-2002 and P-2005 end at a blinded boundary until the scrubber and lime-slurry consumers are modelled.
 setContext(509,'PW-6 process-water pump');suction(product,pumps[509],'T-2002 to P-2005','2013');const hx5=EQUIPMENT[509].x,hz5=EQUIPMENT[509].z;L([pumps[509].outlet,[hx5,2,hz5]],'P-2005 PW-6 discharge','Process water');G([hx5,2,hz5],[hx5+.35,2,hz5],'XV-PW6-SUPPLY');L([[hx5+.35,2,hz5],[hx5+.8,2,hz5],[hx5+.8,2.6,hz5]],'P-2005 to PW-6 boundary','Process water','2013',.08,{specs:{1:{type:'check',label:'NRV-PW6-SUPPLY'}}});endBoundary('BL-A2000-PW6',[hx5+.8,2.6,hz5],'Process water','PW-6 users (scrubber make-up, lime slurry): connection not modelled; qualified supply and approval required',true,.08);
 // Dedicated sequential cleaning circuit: no connection to normal product or concentrate discharge during CIP.
 setContext(515,'CIP-2001 acid / alkaline cleaning');const cf=root(b('CIP-2001 anchored skid','frame',[3.2,.2,3.2],[83.95,.1,-3.75]),[83.95,0,-3.75]),ct=band('CIP-2001 2 m³ cleaning tank','shell',.85,.82,1.1,[83.65,.85,-3.75],'bright');ct.cut=true;const cipFoot=b('CIP tank support pedestal','frame',[1.8,.1,1.8],[83.65,.25,-3.75]);s.join(cf,cipFoot,[83.65,.2,-3.75],'CIP pedestal mounting');s.join(cipFoot,ct,[83.65,.3,-3.75],'CIP tank mounting');s.load(ct,'CIP tank');const ci2=[83.65,1.5,-3.75],cs=[83.65,.5,-2.9];k.passage(ct,[ci2,cs],'CIP tank liquid passage','CIP chemical',{internalTo:'CIP-2001'});c('CIP-2001 tank lid','head',.85,.06,[83.65,1.43,-3.75]);const cp=k.transferPump(85.05,'P-CIP2001','CIP recirculation',{z:-3.25});L([cs,[83.65,.5,-2.55],[85.05,.5,-2.55],cp.inlet],'CIP-2001 pump suction','CIP chemical');L([cp.outlet,[85.05,4.1,-3.25],[85.05,4.1,RF],[CX,4.1,RF],[CX,1.6,RF]],'CIP-2001 cleaning supply','CIP chemical');G([CX,1.6,RF],[CX,1.25,RF],'XV-RO-CIP');L([[CX,1.25,RF],[75,1.25,RF],[75,2.8,RF]],tag+' CIP feed to membrane','CIP chemical');L([cipRet,[83.65,5.3,RC],[83.65,5.3,-3.75],ci2],'RO cleaning return to CIP-2001','CIP chemical');
 const wasteStart=[83.65,.5,-2.9];L([wasteStart,[83.65,.5,-2.25]],'CIP spent-liquor takeoff','Segregated CIP waste',null,.04);G([83.65,.5,-2.25],[83.95,.5,-2.25],'XV-CIP2001-WASTE',true,.04);L([[83.95,.5,-2.25],[86.85,.5,-2.25]],'CIP low drain collection','Segregated CIP waste',null,.04);endBoundary('BL-CIP2001-LOW',[86.85,.5,-2.25],'Segregated CIP waste','Closed pump-out connection to spent-CIP tank; portable pump required for lift',true,.04);
 // Pumped closed transfer shown as a separate package path; never depict an uphill gravity drain.
 const wp=k.transferPump(86.75,'P-CIP2001-W','Spent CIP transfer',{z:-5.75});L([[83.95,.5,-2.25],[86.75,.5,-2.25],[86.75,.5,-5.05],wp.inlet],'CIP waste pump suction','Segregated CIP waste',null,.04);L([wp.outlet,[86.75,3.8,-5.75],[86.75,3.8,-8.85],[84.4,3.8,-8.85],spent.input],'CIP spent liquor to TK-CIP2001-W','Segregated CIP waste','2022',.04);setContext(521,'Segregated CIP waste disposition');L([spent.out,[84.85,.65,-7.25],[85.95,.65,-7.25]],'Held CIP waste to approved EHS boundary','Segregated CIP waste','2022',.04);endBoundary('BL-CIP2000-EHS',[85.95,.65,-7.25],'Segregated CIP waste','Closed separate collection; approved EHS destination not assigned',true,.04);
 function bund(id,tag,rect,depth,inventory){setContext(id,tag+' separate chemical containment');const[a,d,z,e]=rect,w=z-a,l=e-d;root(b(tag+' chemically resistant floor','frame',[w,.08,l],[(a+z)/2,.04,(d+e)/2],'dark'),[(a+z)/2,0,(d+e)/2]);for(const x of[a+.06,z-.06])b(tag+' continuous raised curb','frame',[.12,depth,l],[x,depth/2,(d+e)/2]);for(const zz of[d+.06,e-.06])b(tag+' continuous raised curb','frame',[w-.24,depth,.12],[(a+z)/2,depth/2,zz]);bunds.push({tag,rect,curbM:depth,inventoryM3:inventory,freeboardM:.1,grossUsableM3:(w-.24)*(l-.24)*(depth-.1),qualification:'Closed lined bund; displacement, chemical compatibility, sealed penetrations and capacity require civil verification; no shared drain'});}
bund(513,'BND-AS2001',[79.15,-9.25,82.45,-6.25],.5,1);bund(515,'BND-CIP2001',[81.95,-6.45,87.45,-1.45],.5,2);bund(521,'BND-CIP2001-W',[83.25,-10.45,86.55,-7.15],.85,5);
 panel(516,'CP-2000',69,-2.4);for(const [tag,equipment,interlocks]of[['AIT-2001','CF-2002 / P-2012',['Feed pH, SDI, turbidity, oxidants and scaling accepted','ORP high-high stops P-2012']],['AIT-2002','RO-2011',['Fail closed on startup or off-spec; no off-spec diversion is modelled (hold)','Independent laboratory qualification before reuse']],['PIT/FIT/AIT-RO2011','RO-2011',['Low suction / flow stops pump','High pressure / differential pressure stops the train','T-2011 high-high stops production','T-2002 low level opens LV-2002 for city top-up','FCV-RO-2011 holds the concentrate flow (recovery)']],['CF-2002-BACKWASH','CF-2002',['Backwash closes XV-CF2002-IN and -OUT first','Waste only through the air-gapped drain once approved']],['CIP-2001-INTERLOCK','CIP-2001',['One isolated train at a time','Product and concentrate export isolated','Proven rinsing between acid and alkaline steps']]])controlLinks.push({tag,equipment,interlocks,setpoint:null,status:'Proposed inspection logic; not a PLC/SIS sequence'});
 for(const r of routes.filter(r=>r.reactor>=500&&r.reactor<=521))if(!r.areaId)Object.assign(r,{areaId:'A-2000',designStatus:'proposed'});
 h.wastewater.roBuilt=true;delete h.wastewater.vessels;
 return {basis:A2000_BASIS,equipment:A2000_IDS,streams:[...k.streams],boundaries:k.boundaries,mappedStreams,controlLinks,trains,connections,bunds,vesselEnvelopes:Object.values(vessels).map(v=>({tag:v.tag,x:v.x,z:v.z,radius:v.r,top:v.top})),partIds:parts.slice(first).map(p=>p.id),scope:'FEED-PFD-2000 conceptual reclaimed-water train re-based on QFL 2026-10-10 (Route 0, no A-1100 condensate): city make-up through carbon (CF-2002), RO-2011 polishing for the PW-4 users via T-2011 / P-2011, T-2002 / P-2005 for PW-6 with the RO-2011 reject reused; the A-1000 effluent is not routed to A-2000; qualified reuse only',approvedOperatingLimits:null};
}
