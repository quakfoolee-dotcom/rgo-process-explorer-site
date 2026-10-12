import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';
import {A2000_BASIS,A2000_IDS,RO2011} from './a2000-basis.js';
export function buildReclaimedWater(h){
 const k=processKit(h,.08),s=structuralKit(h),{T,parts,edges,routes,ports,terminals,EQUIPMENT,setContext,b,c,band,nozzle,terminal,bulkValve,boltCircle}=k;
 // Line sizes (V358): water lines r .0625 (125 mm), concentrate / reject r .05, permeate main r .045, cleaning lines r .08; every nozzle uses the radius of the line it serves.
 const RW=.0625,RC=.05,RP=.045,RCIP=.08;
 const first=parts.length,mappedStreams=[],controlLinks=[],trains=[],connections=[],vessels={},bunds=[],V=p=>new T.Vector3(...p);
 function L(points,label,service='Treated wastewater',stream=null,r=.08,meta={}){const out=k.line(points,r,label,service,meta.from||'',meta.to||'',meta.specs||{});Object.assign(out,{areaId:'A-2000',toArea:'A-2000',pfdStream:stream,source:stream?{id:'feed-pfd-v51',revision:'V5.1',page:16}:null,designStatus:stream?'listed':'proposed',...meta});if(stream)mappedStreams.push({stream,routeId:out.id,label});return out;}
 function G(a,z,tag,closed=true,r=.08){bulkValve(a,z,r,tag,tag+' isolation');const v=h.valves.at(-1);v.normalState=closed?'closed':'open';if(closed){const p=parts.find(p=>p.id===v.discId);p.quaternion.copy(p.closedQuaternion);}return z;}
 function root(p,at){h.structure.roots.push({part:p.id,local:V(at).sub(p.position).applyQuaternion(p.quaternion.clone().invert()).divide(p.scale).toArray(),elevation:0});return p;}
 function panel(id,tag,x,z){setContext(id,tag+' grade controls');const f=root(b(tag+' panel base','frame',[.4,.1,.4],[x,.05,z]),[x,0,z]),p=s.beam([x,.1,z],[x,1.4,z],.09,tag+' post'),d=b(tag+' display','valve',[.72,.6,.2],[x,1.4,z],'blue');s.join(f,p,[x,.1,z],tag+' anchor');s.join(p,d,[x,1.4,z],tag+' panel mounting');s.load(d,tag);d.serviceAccess={standing:[x,0,z+.75],method:'Grade control position',withdrawalAxis:[0,0,1]};d.accessTag=tag;return d;}
 function tank(id,service='Treated wastewater',agitated=false,o={}){const e=EQUIPMENT[id],{x,z,tag,radius:r,bottom:y0,top:y1}=e;setContext(id,e.label);
  const pad=root(c(tag+' foundation','frame',r+.18,.2,[x,.1,z],'dark'),[x,0,z]),floor=c(tag+' supported bottom','head',r,.06,[x,.23,z]),body=band(tag+' vessel shell','shell',r,r-.04,y1-y0,[x,(y0+y1)/2,z]),roof=c(tag+' roof','head',r,.06,[x,y1+.03,z]);body.cut=roof.cut=true;
  s.join(pad,floor,[x,.2,z],tag+' foundation / bottom');s.join(floor,body,[x+r-.02,y0,z],tag+' shell / bottom');s.join(body,roof,[x+r-.02,y1,z],tag+' shell / roof');for(const p of[body,roof])s.load(p,tag);
  const hub=[x,.65,z],port=(name,at,axis,rr=.08,medium=service)=>{setContext(id,tag+' '+name);const out=nozzle(at,axis,.22,tag+' '+name,rr),inside=V(at).addScaledVector(V(axis),-.045).toArray();k.passage(floor,[inside,hub],tag+' '+name+' internal passage',medium,{internalTo:tag});return out;};
  const [ox,oz]=o.outAxis||[0,1],input=port('inlet',[x-.45,y1+.06,z],[0,1,0],o.inR||.08),out=port('outlet',[x+ox*r,o.outY??.65,z+oz*r],[ox,0,oz],o.outR||.08),vent=port('vent',[x+.45,y1+.06,z],[0,1,0],.05,'Vent');c(tag+' screened vent hood','head',.13,.08,[vent[0],vent[1]+.04,vent[2]],'dark');terminal(vent,tag+' independent atmospheric vent; sizing / chemical suitability HOLD');
  if(o.blindInlet){terminal(input,tag+' spare roof inlet closed with a blind flange');c(tag+' spare inlet blind flange','head',(o.inR||.08)*1.7,.03,[input[0],input[1]+.02,input[2]],'dark');}
  const [mx,mz]=o.manAxis||[0,-1],man=port('access manway',[x+mx*r,1.05,z+mz*r],[mx,0,mz],.24);c(tag+' manway cover','head',.29,.04,man,'bright',[mx,0,mz]);boltCircle(man,[mx,0,mz],.265,10,.5,tag+' bolts');terminal(man,tag+' closed manway');
  if(agitated){const mount=b(tag+' agitator mounting','frame',[.7,.18,.7],[x,y1+.15,z]),motor=c(tag+' agitator motor','pump',.27,.65,[x,y1+.565,z],'blue');s.join(roof,mount,[x,y1+.06,z],tag+' mixer mounting');s.join(mount,motor,[x,y1+.24,z],tag+' drive');s.load(motor,tag+' mixer');c(tag+' agitator shaft','internal',.07,y1-.7,[x,(y1+.7)/2,z],'inner');for(const yy of[1.2,y1*.55])for(let j=0;j<3;j++){const angle=j*2*Math.PI/3;b(tag+' mixing blade','internal',[r*.55,.08,.35],[x+Math.cos(angle)*r*.25,yy,z+Math.sin(angle)*r*.25],'inner',new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-angle));}}
  const sensor=port('level probe',[x+r,1.3,z],[1,0,0],.025);terminal(sensor,tag+' sealed level transmitter');k.instrument('LIT-'+tag,sensor,'level',[1,0,0]);controlLinks.push({tag:'LIT-'+tag,equipment:tag,measurementPoint:sensor,setpoint:null,interlocks:['High-high stops incoming transfer','Low-low stops downstream pump'],status:'Proposed; capacity and levels not approved'});
  const t={id,tag,x,z,r,top:y1,input,out,hub,port,body,service};vessels[tag]=t;return t;
 }
 function pump(id,opts={}){const e=EQUIPMENT[id];setContext(id,e.label);return k.transferPump(e.x,e.tag,e.label,{z:e.z,...opts});}
 function suction(t,p,label,stream=null,r=RW){L([t.out,p.inlet],label,t.service,stream,r);}
 function endBoundary(tag,point,service,destination,closed=true,r=.08,axis=[1,0,0]){k.boundary(tag,point,axis,r,service,destination);if(closed)c(tag+' positive blind','valve',r*2.15,.05,[point[0]+axis[0]*.41,point[1]+axis[1]*.41,point[2]+axis[2]*.41],'red',axis);} // V359: a solid flange cap on the outer face of the flange (the old dark disc sat inside the ring and read as an open bore)
 function consume(tag){const p=ports.find(p=>p.id===tag);if(!p)throw Error('A-2000 missing source interface '+tag);p.role='interunit';for(let i=terminals.length-1;i>=0;i--)if(terminals[i].label===tag+' external battery limit')terminals.splice(i,1);for(const unit of[h.wastewater,h.preg,h.upstream,h.separations])for(const q of unit?.boundaries||[])if(q.tag===tag){q.kind='interunit';q.destination='Connected reclaimed water; release qualification required';}return p;}
 const stock=tank(501,'RO water',false,{outAxis:[1,0],outY:.8,outR:RW,inR:RW,blindInlet:true}),product=tank(508,'Process water',false,{outAxis:[0,1],outY:.8,outR:RW,blindInlet:true}),anti=tank(513,'Antiscalant',false,{outAxis:[0,-1],outY:.8,outR:.04,inR:.025,manAxis:[-1,0]}),spent=tank(521,'Segregated CIP waste',false,{outAxis:[1,0],outY:.65,outR:.04,inR:.04});
 // Pump suctions look at their tank outlets so every suction line is one straight run along the nozzle axis.
 const pumps={};pumps[502]=pump(502,{facing:[-1,0],pipeR:RW});pumps[509]=pump(509,{facing:[0,-1],pipeR:RW});pumps[514]=pump(514,{pipeR:.025});
 // City water (QFL 2026-10-10: Route 0, no A-1100 condensate; the A-1000 effluent goes to sewer). The city supply is dechlorinated by CF-2002, split at HDR-2002 into the RO-2011 feed (PW-4 RO water, 75 % recovery) and the T-2002 top-up (PW-6); the RO-2011 reject is reused in T-2002.
 // Carbon filter (CF-2002, about 32 m3/h): one O 1.2 m vessel, three 0.81 m bed layers (about 2.6 m3), backwash by upflow city water (V356), waste to an air-gapped floor drain.
 function carbon(id,r,y1,layers,layerH){const e=EQUIPMENT[id],{x,z,tag}=e,y0=.45,ym=(y0+y1)/2;setContext(id,tag+' activated-carbon filter');
  const base=root(c(tag+' plinth','frame',r+.12,.30,[x,.15,z]),[x,0,z]),shell=band(tag+' pressure vessel','shell',r,r-.012,y1-y0,[x,ym,z],'blue'),bot=c(tag+' bottom head','head',r,.2,[x,.4,z],'blue'),top=c(tag+' top head','head',r,.12,[x,y1+.06,z],'blue');shell.cut=true;
  s.join(base,bot,[x,.3,z],tag+' base');s.join(bot,shell,[x+r-.02,y0,z],tag+' shell');s.join(shell,top,[x+r-.02,y1,z],tag+' top');s.load(shell,tag+' vessel');
  for(let n=0;n<layers;n++)c(tag+' carbon bed layer '+n,'internal',r-.02,layerH,[x,.5+layerH*(n+.5),z],'dark');
  const i=nozzle([x,y1+.12,z],[0,1,0],.2,tag+' inlet',.05),o=nozzle([x+r,.9,z],[1,0,0],.2,tag+' outlet',.06),d=nozzle([x-r,.75,z],[-1,0,0],.2,tag+' backwash connection',.05);
  k.passage(shell,[[x,y1+.075,z],[x,ym,z],[x+r-.045,.9,z]],tag+' filtration passage','City water',{internalTo:tag});
  k.passage(shell,[[x-r+.045,.75,z],[x,ym,z],[x,y1+.075,z]],tag+' backwash passage','City water',{internalTo:tag});
  return {input:i,out:o,wash:d};
 }
 setContext(510,'City make-up to CF-2002');k.boundary('BL-A2000-CITY',[67.5,1.3,-.7],[0,0,1],.05,'City water','Municipal make-up (IF-A2000-CITY); supply quality and pressure are open holds (DAT-138 R3)');
 const cfUnit=carbon(510,.6,3.5,3,.81);
 L([[67.5,1.3,-.7],[67.5,1.3,-1.3]],'City make-up to CF-2002','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002',specs:{0:{type:'check',label:'BFP-2001 backflow preventer'}}});
 L([[67.5,1.3,-1.3],[67.5,1.65,-1.3]],'City make-up to XV-CF2002-IN','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});
 G([67.5,1.65,-1.3],[67.5,2,-1.3],'XV-CF2002-IN',false,.05);
 L([[67.5,2,-1.3],[67.5,4.3,-1.3],[67.5,4.3,-2.7]],'City make-up to CF-2002 inlet','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});k.instrument('FT-2005',[67.5,2.6,-1.3],'flow',[1,0,0]);
 L([[67.5,4.3,-2.7],[67.5,4.3,-3.6],cfUnit.input],'City make-up to CF-2002 inlet (top)','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});
 // Backwash (V356): upflow with city water tapped UPSTREAM of the inlet valve (tee after the backflow preventer) into the bottom connection; the waste leaves by the top connection and the inlet line through an air-gapped floor drain (closed boundary until the sewer connection is approved). IN and OUT are closed during the backwash. All valves are at 2 m or lower.
 setContext(510,'CF-2002 backwash');L([[67.5,1.3,-1.3],[66.75,1.3,-1.3]],'CF-2002 backwash supply','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});G([66.75,1.3,-1.3],[66.4,1.3,-1.3],'XV-CF2002-BW',true,.05);L([[66.4,1.3,-1.3],[66.4,.75,-1.3],[66.4,.75,-3.6],cfUnit.wash],'CF-2002 backwash supply to the bottom connection','City water',null,.05,{from:'BL-A2000-CITY',to:'CF-2002'});
 L([[67.5,4.3,-2.7],[68,4.3,-2.7],[68,2,-2.7]],'CF-2002 backwash waste to drain','Backwash wastewater',null,.06,{from:'CF-2002',to:'BL-CF2002-WASTE'});G([68,2,-2.7],[68,1.65,-2.7],'XV-CF2002-WASTE',true,.06);L([[68,1.65,-2.7],[68,.8,-2.7]],'CF-2002 backwash waste drain leg','Backwash wastewater',null,.06,{from:'CF-2002',to:'BL-CF2002-WASTE'});endBoundary('BL-CF2002-WASTE',[68,.8,-2.7],'Backwash wastewater','Air-gapped floor drain to sewer; connection and approval open',true,.06);
 // HDR-2002: one outlet node, two branches.
 const hdr=[68.6,3,-3.6];setContext(510,'CF-2002 outlet header HDR-2002');L([cfUnit.out,[68.6,.9,-3.6]],'CF-2002 outlet to HDR-2002','City water',null,.06,{from:'CF-2002',to:'HDR-2002'});G([68.6,.9,-3.6],[68.6,1.25,-3.6],'XV-CF2002-OUT',false,.06);L([[68.6,1.25,-3.6],hdr],'CF-2002 outlet to HDR-2002 (downstream)','City water',null,.06,{from:'CF-2002',to:'HDR-2002'});
 const cityPort=product.port('city make-up inlet',[product.x+.9,product.top+.06,product.z],[0,1,0],.05,'City water'),rejPort=product.port('RO-2011 reject inlet',[product.x+Math.sqrt(product.r*product.r-(-5-product.z)*(-5-product.z)),.7,-5],[1,0,0],.05,'RO concentrate');
 setContext(508,'City top-up to T-2002');L([hdr,[68.6,3.4,-3.6]],'HDR-2002 to LV-2002','City water',null,.05);G([68.6,3.4,-3.6],[68.6,3.8,-3.6],'LV-2002',false,.05);L([[68.6,3.8,-3.6],[68.6,7.3,-3.6],[cityPort[0],7.3,-3.6],[cityPort[0],7.3,cityPort[2]],cityPort],'CF-2002 make-up to T-2002','City water',null,.05,{from:'CF-2002',to:'T-2002'});
 // RO-2011 feed: run north at x 69.7, outside the west walking zone (x <= 69.5), at 3 m above the floor.
 const gf=EQUIPMENT[522],gx=gf.x,gz=gf.z,injection=[69.7,3,-14];
 setContext(506,'HDR-2002 to RO-2011 feed');L([hdr,[69.7,3,-3.6],injection],'HDR-2002 to RO-2011 feed','City water',null,.06,{from:'HDR-2002',to:'RO-2011'});k.instrument('AIT-2001',injection,'pH / conductivity / oxidant');
 setContext(514,'Antiscalant dosing');suction(anti,pumps[514],'T-2004 to P-2004','2018',.04);L([pumps[514].outlet,[80.45,5,-9.2],[69.7,5,-9.2],[69.7,5,-14],injection],'P-2004 antiscalant injection','Antiscalant','2019',.025,{specs:{1:{type:'check',label:'NRV-AS2001'}}});endBoundary('BL-AS2001-FILL',[79.5,2,-6.9],'Antiscalant','Closed delivery connection',true,.025,[0,0,1]);L([[79.5,2,-6.9],[79.5,2,-7.45],[80,2,-7.45],anti.input],'Antiscalant closed fill','Antiscalant','2017',.025);
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
  const gi=nozzle([gx,1.4,gz-.23],[0,0,-1],.20,tag+' inlet',RW),go=nozzle([gx,.6,gz-.23],[0,0,-1],.20,tag+' outlet',RW);
  k.passage(body,[[gx,1.4,gz-.185],[gx,1.4,gz-.14]],tag+' feed annulus','City water',{internalTo:tag});
  k.passage(cartridge,[[gx,1.4,gz-.14],[gx,1.4,gz]],tag+' outside-in filtration','City water',{internalTo:tag,transport:'filter medium permeation'});
  k.passage(plate,[[gx,1.4,gz],[gx,.6,gz],[gx,.6,gz-.185]],tag+' sealed clean outlet','City water',{internalTo:tag});
  lid.serviceAccess={standing:[gx-.7,0,gz],method:'Depressurize and isolate; lift lid then withdraw cartridge vertically. Proposed 0.9 m clear height above lid; vendor confirmation required.',withdrawalAxis:[0,1,0],withdrawalM:.9};lid.accessTag=tag;
  for(const p of parts.slice(first)){p.physicalHostTag=tag;p.processOwnerId=506;p.guardFilterTag=tag;}
  return {gi,go};
 }
 function hpPump(){const e=EQUIPMENT[506],x=e.x,z=e.z,tag=e.tag;setContext(506,tag+' vertical multistage pump');const base=root(b(tag+' foundation skid','frame',[1.0,.2,.8],[x,.1,z]),[x,0,z]),body=c(tag+' multistage barrel','pump',.13,.95,[x,.775,z],'bright'),motor=c(tag+' VFD motor','pump',.17,.6,[x,1.55,z],'blue');for(let j=0;j<5;j++)band(tag+' stage ring','pump',.145,.13,.03,[x,.45+j*.17,z],'dark');const foot=b(tag+' support foot','frame',[.5,.3,.5],[x,.35,z]);s.join(base,foot,[x,.2,z],tag+' base');s.join(foot,body,[x,.5,z],tag+' pump mount');s.join(body,motor,[x,1.25,z],tag+' drive coupling');s.load(body,tag+' pump');s.load(motor,tag+' drive');const i=nozzle([x-.13,.6,z],[-1,0,0],.2,tag+' inlet',RW),o=nozzle([x+.13,1,z],[1,0,0],.2,tag+' discharge',RW);k.passage(body,[[x-.085,.6,z],[x+.085,1,z]],tag+' hydraulic passage','City water',{internalTo:tag});return {inlet:i,outlet:o,x,z};}
 const {gi,go}=guardFilter(),hp=hpPump(),{x:RX,zf:RF,zb:RB,elementsPerVessel:RN}=RO2011,pz=hp.z,px=hp.x,tag='RO-2011';
 // RO-2011 skid (V357, QFL 2026-10-11): twelve 8-inch vessels of three 40-inch elements in a 3 x 4 grid, vessels along z. Stage 1 = the top two rows plus two vessels of row 3 (8), stage 2 = the other four (concentrate of stage 1 through the interstage header). North end (z RF): stage 1 feed, stage 2 concentrate and every permeate port; south end (z RB): the interstage header only.
 const ROWY=[3.1,2.55,2,1.45],COLX=[RX-.6,RX,RX+.6],XF=RX-1.1,XC=RX+1.1,XP=RX-1.4,SXL=RX-1.5,SXR=RX+1.5,ZFE=RF-.35,ZPE=RF-.7,ZIE=RB+.35,EX=RX+2.6,PORTDX=.1,PORTDY=.1;
 setContext(506,'RO-2011 feed piping');L([injection,[69.7,3,-15.45],[gx,3,-15.45],[gx,1.4,-15.45],gi],'RO-2011 guard filter feed','City water',null,RW);
 L([go,[gx,.6,go[2]-.45],[px-.55,.6,go[2]-.45],[px-.55,.6,pz],hp.inlet],'RO-2011 guarded suction','City water',null,RW);
 L([hp.outlet,[px+.5,1,pz]],'P-2012 discharge','City water',null,RW);L([[px+.5,1,pz],[px+.5,1,pz+.45]],'P-2012 discharge riser','City water',null,RW);G([px+.5,1,pz+.45],[px+.5,1,pz+.8],'XV-RO-FEED',false,RW);
 const feedNode=[XF,1,ZFE];L([[px+.5,1,pz+.8],[px+.5,1,ZFE],feedNode],'P-2012 to RO-2011','City water','2009',RW);
 const cipRet=[RX+2.3,5.3,ZFE];
 // Frame, rack posts and saddle beams: two cradle frames carry all twelve vessels.
 setContext(507,tag+' membrane rack');const SADZ=[RF+.7,RB-.7],posts=[];for(const x of[SXL,SXR])for(const z of SADZ)posts.push(s.column(x,z,3.4,tag+' rack'));
 const beams={};for(const [r,y] of ROWY.entries())for(const z of SADZ){const bm=s.beam([SXL,y-.32,z],[SXR,y-.32,z],.09,tag+' saddle beam');beams[r+':'+z]=bm;for(const post of posts.filter(p=>Math.abs(p.z-z)<.01))s.join(post.post,bm,[post.x,y-.32,z],tag+' rack beam');}
 const grid=[];for(const [r,y] of ROWY.entries())for(const [ci,xx] of COLX.entries())grid.push({r,ci,xx,y,stage:(r<2||(r===2&&ci<2))?1:2});
 for(const [n,v] of grid.entries()){const {r,xx,y,stage}=v,front=[xx,y,RF],back=[xx,y,RB];
  const body=band(tag+' vessel '+(n+1)+' stage '+stage,'shell',.16,.145,RB-RF,[xx,y,(RF+RB)/2],'bright',[0,0,1]);body.cut=true;s.load(body,tag+' vessel '+(n+1));
  for(const z of SADZ){const saddle=b(tag+' vessel saddle','frame',[.34,.18,.18],[xx,y-.25,z]);s.join(beams[r+':'+z],saddle,[xx,y-.32,z],tag+' saddle support');s.join(saddle,body,[xx,y-.16,z],tag+' vessel / saddle');band(tag+' retaining strap','fastener',.172,.16,.04,[xx,y,z],'dark',[0,0,1]);}
  for(const z of[RF,RB]){c(tag+' end closure','head',.165,.04,[xx,y,z],'steel',[0,0,1]);boltCircle([xx,y,z],[0,0,1],.13,6,.4,tag+' closure bolts');}
  for(let j=0;j<RN;j++)c(tag+' element '+(n*RN+j+1),'internal',.11,1.016,[xx,y,RF+.85+j*1.04],'inner',[0,0,1]);
  const permPort=[xx+PORTDX,y-PORTDY,RF];
  k.passage(body,[front,back],tag+' vessel '+(n+1)+' feed to concentrate','RO concentrate',{internalTo:tag});const membrane=k.passage(body,[stage===1?front:back,permPort],tag+' vessel '+(n+1)+' permeation','RO water',{internalTo:tag,transport:'filter medium permeation'});edges[membrane.edgeIndices[0]].oneWay=true;
  if(stage===1){L([[xx,y,ZFE],front],tag+' vessel '+(n+1)+' feed','City water',null,.04);L([back,[xx,y,ZIE]],tag+' vessel '+(n+1)+' concentrate','RO concentrate',null,.04);}
  else{L([[xx,y,ZIE],back],tag+' vessel '+(n+1)+' feed','City water',null,.04);L([front,[xx,y,ZFE]],tag+' vessel '+(n+1)+' concentrate','RO concentrate',null,.04);}
  L([permPort,[permPort[0],permPort[1],ZPE]],tag+' vessel '+(n+1)+' permeate','RO water',null,.025);
 }
 // Headers. Feed (west): rows 1-3 laterals; interstage (west, south end): every row; stage 2 concentrate (east): rows 3-4; permeate (far west, 0.35 m north of the feed header, 0.1 m below each row axis).
 L([feedNode,[XF,2,ZFE],[XF,2.55,ZFE],[XF,3.1,ZFE]],tag+' feed manifold','City water',null,RW);
 for(const r of[0,1,2])L([[XF,ROWY[r],ZFE],...COLX.slice(0,r<2?3:2).map(x=>[x,ROWY[r],ZFE])],tag+' feed lateral row '+(r+1),'City water',null,.04);
 L([[XF,1.45,ZIE],[XF,2,ZIE],[XF,2.55,ZIE],[XF,3.1,ZIE]],tag+' interstage manifold','RO concentrate',null,.04);
 for(const r of[0,1,2,3])L([[XF,ROWY[r],ZIE],...COLX.map(x=>[x,ROWY[r],ZIE])],tag+' interstage lateral row '+(r+1),'RO concentrate',null,.04);
 L([[COLX[2],ROWY[2],ZFE],[XC,ROWY[2],ZFE]],tag+' stage 2 concentrate lateral row 3','RO concentrate',null,.04);L([...COLX.map(x=>[x,ROWY[3],ZFE]),[XC,ROWY[3],ZFE]],tag+' stage 2 concentrate lateral row 4','RO concentrate',null,.04);
 L([[XC,2,ZFE],[XC,1.7,ZFE],[XC,1.45,ZFE],[XC,1,ZFE]],tag+' stage 2 concentrate manifold','RO concentrate',null,.04);
 for(const r of[0,1,2,3]){const yp=ROWY[r]-PORTDY;L([...COLX.slice().reverse().map(x=>[x+PORTDX,yp,ZPE]),[XP,yp,ZPE]],tag+' permeate lateral row '+(r+1),'RO water',null,.025);}
 L([[XP,ROWY[0]-PORTDY,ZPE],[XP,ROWY[1]-PORTDY,ZPE],[XP,ROWY[2]-PORTDY,ZPE],[XP,ROWY[3]-PORTDY,ZPE]],tag+' permeate manifold','RO water',null,RP);
 // Package connections: feed, concentrate, permeate, CIP in and out all leave at floor level or within 2 m. Valves are on the stubs at the frame edge.
 L([[XC,1,ZFE],[XC+.25,1,ZFE]],tag+' concentrate outlet','RO concentrate',null,RC);
 G([XC+.25,1,ZFE],[XC+.6,1,ZFE],'XV-RO-BRINE',false,RC);
 L([[XC+.6,1,ZFE],[EX,1,ZFE],[EX,.7,ZFE]],tag+' concentrate collection','RO concentrate','2014',RC);
 L([[XC,2,ZFE],[XC,2.8,ZFE]],tag+' relief takeoff','RO concentrate',null,.04);
 const rv=[XC,3.15,ZFE],reliefBody=band('PSV-RO-2011 relief body','valve',.10,.04,.35,[XC,2.975,ZFE],'bright');k.passage(reliefBody,[[XC,2.8,ZFE],rv],'PSV-RO-2011 relief passage','RO concentrate',{internalTo:'PSV-RO-2011'});edges.at(-1).barrierTag='PSV-RO-2011';c('PSV-RO-2011 spring bonnet','valve',.065,.25,[XC+.14,3.1,ZFE],'bright');h.valves.push({tag:'PSV-RO-2011',label:'Spring-loaded pressure relief; vendor sizing HOLD',reactor:507,type:'relief',a:[XC,2.8,ZFE],b:rv,normalState:'closed',partIds:[reliefBody.id]});
 L([rv,[XC,3.5,ZFE],[XC,3.5,-14.2],[EX,3.5,-14.2],[EX,.7,-14.2],[EX,.7,ZFE]],tag+' relief to T-2002 reject return','RO concentrate',null,.04,{qualification:'Relief sizing, backpressure, non-isolable path and destination capacity require vendor design'});
 // Reject trunk: low level along the skid east side, then west at z -5 (south of the element withdrawal strip) into a low nozzle on T-2002; FCV-RO-2011 sets the concentrate flow (recovery).
 L([[EX,.7,ZFE],[EX,.7,-11.8]],'RO-2011 reject to T-2002 (skid)','RO concentrate',null,.05);
 G([EX,.7,-11.8],[EX,.7,-11.45],'FCV-RO-2011',false,.05);
 setContext(507,'RO-2011 reject to T-2002');L([[EX,.7,-11.45],[EX,.7,-5],rejPort],'RO-2011 reject to T-2002','RO concentrate','2014',.05,{from:'RO-2011',to:'T-2002',specs:{1:{type:'check',label:'NRV-RO2011-REJ'}}});
 // CIP concentrate return: from the concentrate manifold, valve within reach, then overhead to the CIP skid.
 setContext(507,'RO-2011 CIP connections');L([[XC,1.7,ZFE],[XC+.35,1.7,ZFE]],tag+' CIP concentrate return','CIP chemical');G([XC+.35,1.7,ZFE],[XC+.7,1.7,ZFE],'XV-RO-CIPRET');L([[XC+.7,1.7,ZFE],[cipRet[0],1.7,ZFE],cipRet],tag+' CIP return header','CIP chemical');
 // Permeate (west): manifold, valve, low run with the quality station, accepted-permeate valve and a low nozzle on T-2011.
 G([XP,1.35,ZPE],[XP,1,ZPE],'XV-RO-PERM',false,RP);
 L([[XP,1,ZPE],[XP,.6,ZPE]],tag+' permeate outlet','RO water',null,RP);
 L([[XP,.6,ZPE],[70.6,.6,ZPE],[69.1,.6,ZPE]],tag+' permeate quality inlet','RO water',null,RP);
 G([69.1,.6,ZPE],[68.75,.6,ZPE],'XV-RO-PRODUCT',false,RP);
 const dzp=ZPE-stock.z,t11=stock.port('RO-2011 permeate inlet',[stock.x+Math.sqrt(stock.r*stock.r-dzp*dzp),.6,ZPE],[1,0,0],RP,'RO water');
 setContext(507,'RO-2011 permeate to T-2011');L([[68.75,.6,ZPE],t11],'Accepted RO permeate to T-2011','RO water','2010',RP);
 L([[70.6,.6,ZPE],[70.6,.95,ZPE]],tag+' CIP permeate return','CIP chemical',null,RP);G([70.6,.95,ZPE],[70.6,1.3,ZPE],'XV-RO-CIPPERM',true,RP);L([[70.6,1.3,ZPE],[70.6,5.6,ZPE],[cipRet[0],5.6,ZPE],[cipRet[0],5.6,ZFE],cipRet],tag+' CIP permeate header','CIP chemical',null,RP);
 // Instruments on the skid, all within reach: pressure, flow, conductivity and sample points.
 setContext(507,'RO-2011 skid instruments');k.instrument('PIT-2011',[px+.5,1,pz+.2],'feed pressure',[1,0,0]);k.instrument('SP-2011F',[px+.5,1,ZFE-.45],'feed sample point',[1,0,0]);k.instrument('PIT-2012',[EX,.7,-12.3],'concentrate pressure',[1,0,0]);k.instrument('FIT-2012',[EX,.7,-10.5],'concentrate flow',[1,0,0]);k.instrument('SP-2011C',[XC,1.2,ZFE],'concentrate sample point',[0,0,-1]);k.instrument('AIT-2002',[70.1,.6,ZPE],'permeate conductivity',[0,0,-1]);k.instrument('SP-2011P',[69.8,.6,ZPE],'permeate sample point',[0,0,-1]);k.instrument('FIT-2011',[69.5,.6,ZPE],'permeate flow',[0,0,-1]);
 // Skid: base frame under the rack, drip tray with a blinded sump drain, panel and the pump and guard filter inside the tray, and a monorail over the vessels and the pump.
 setContext(507,tag+' skid frame');
 const SX0=70,SX1=75.1,SZ0=-15.8,SZ1=-8.2;
 const rails=[SXL,SXR].map(x=>root(b(tag+' skid base rail','frame',[.16,.2,SZ1-SZ0-.2],[x,.1,(SZ0+SZ1)/2]),[x,0,(SZ0+SZ1)/2]));
 const crossMembers=[-15.5,...SADZ,-8.5].map(z=>{const m=b(tag+' skid cross member','frame',[SXR-SXL,.16,.14],[RX,.1,z]);for(const r of rails)s.join(r,m,[r.position.x,.1,z],tag+' skid frame joint');return m;});
 for(const p of posts){const m=crossMembers.find(mm=>Math.abs(mm.position.z-p.z)<.2);if(m)s.join(p.post,m,[p.x,.1,p.z],tag+' rack post / skid frame');}
 const tw=SX1-SX0,tl=SZ1-SZ0;
 root(b(tag+' drip tray floor pan','frame',[tw,.02,tl],[(SX0+SX1)/2,.01,(SZ0+SZ1)/2],'dark'),[(SX0+SX1)/2,0,(SZ0+SZ1)/2]);
 b(tag+' drip tray curb','frame',[.12,.25,tl],[SX1-.06,.125,(SZ0+SZ1)/2]);
 // West curb with a 0.24 m sleeved opening at z -9.2 for the sump drain (V360): the drain leaves the tray through a sealing sleeve, a closed manual valve and a closed boundary stub outside the tray.
 const DZ=-9.2,GAP=.12,wA=DZ-GAP-SZ0,wB=SZ1-(DZ+GAP);b(tag+' drip tray curb','frame',[.12,.25,wA],[SX0+.06,.125,SZ0+wA/2]);b(tag+' drip tray curb','frame',[.12,.25,wB],[SX0+.06,.125,SZ1-wB/2]);band(tag+' drip tray drain sleeve','frame',GAP,.06,.12,[SX0+.06,.125,DZ],'dark',[1,0,0]);
 for(const z of[SZ0+.06,SZ1-.06])b(tag+' drip tray curb','frame',[tw-.24,.25,.12],[(SX0+SX1)/2,.125,z]);
 b(tag+' drip tray sump','frame',[.3,.04,.3],[70.3,.02,-9.2],'dark');
 const sumpN=nozzle([70.15,.1,DZ],[-1,0,0],.2,tag+' tray sump drain nozzle',.05);L([sumpN,[69.75,.1,DZ]],tag+' skid tray drain','Drain water',null,.05,{from:'RO-2011',to:'BL-RO2011-DRAIN'});G([69.75,.1,DZ],[69.4,.1,DZ],'XV-RO-DRAIN',true,.05);L([[69.4,.1,DZ],[69.2,.1,DZ]],tag+' skid tray drain outside the tray','Drain water',null,.05,{from:'RO-2011',to:'BL-RO2011-DRAIN'});endBoundary('BL-RO2011-DRAIN',[69.2,.1,DZ],'Drain water','Closed tray sump drain to sewer through a sleeved wall opening; connection and approval open',true,.05,[-1,0,0]);
 const MZ=[-15.2,-8.5],mcols=[[SXL,MZ[0]],[SXR,MZ[0]],[SXL,MZ[1]],[SXR,MZ[1]]].map(([x,z])=>{const col=s.column(x,z,4.6,tag+' monorail column');const rail=rails[x===SXL?0:1];s.join(rail,col.post,[x,.2,z],tag+' monorail column base');return col;});
 const portal=MZ.map((z,i)=>{const bm=s.beam([SXL,4.55,z],[SXR,4.55,z],.1,tag+' monorail portal beam');s.join(mcols[i*2].post,bm,[SXL,4.52,z],tag+' monorail portal joint');s.join(mcols[i*2+1].post,bm,[SXR,4.52,z],tag+' monorail portal joint');return bm;});
 const runway=s.beam([RX,4.45,MZ[0]],[RX,4.45,MZ[1]],.12,tag+' monorail runway beam');for(const bm of portal)s.join(bm,runway,[RX,4.51,bm===portal[0]?MZ[0]:MZ[1]],tag+' monorail runway joint');s.load(runway,tag+' monorail');
 const trolley=b(tag+' monorail hoist trolley','frame',[.5,.4,.4],[RX,4.25,(RF+RB)/2],'blue');s.join(runway,trolley,[RX,4.4,(RF+RB)/2],tag+' hoist trolley');c(tag+' hoist chain','internal',.02,.5,[RX,3.8,(RF+RB)/2],'dark');
  panel(507,'CP-RO2011',70.55,-14.6);trains.push({suffix:'',duty:'duty',elements:12*RN,vessels:12,stages:[8,4],passes:1,partIds:parts.filter(p=>p.name.startsWith(tag)).map(p=>p.id)});
 // Permeate quality station, T-2011 and P-2011: the five existing RO-water consumers (A-400, A-160, A-200) are PW-4 users and are fed from P-2011.
 setContext(502,'T-2011 to P-2011');suction(stock,pumps[502],'T-2011 to P-2011','2011');
 const hx=EQUIPMENT[502].x,hz=EQUIPMENT[502].z;L([pumps[502].outlet,[hx,2,hz]],'P-2011 product quality station','RO water',null,RW);G([hx,2,hz],[hx+.35,2,hz],'XV-RO-DISTRIBUTE',true,RW);
 // PW-4 distribution (V358): one riser with a tee for each of the five branches (7.0 to 8.0 m, 0.25 m apart, below the 8.29 m clear height); the branch paths were found by an orthogonal search around every other area's parts, walkway clearance and the earlier branches, and each ends along its destination port axis.
 const RX2=hx+.8;L([[hx+.35,2,hz],[RX2,2,hz],[RX2,7,hz],[RX2,7.25,hz],[RX2,7.5,hz],[RX2,7.75,hz],[RX2,8,hz],[hx+.5,8,hz]],'P-2011 to distribution header','RO water','2013',RW,{specs:{1:{type:'check',label:'NRV-RO2000-DIST'}}});k.instrument('PDIT-CF2002',[67.5,4.3,-2.5],'carbon-filter differential pressure',[1,0,0]);
 // BL-RO-F161 sits 1.8 m higher in the elevated A-160 variant (port y 6.3), which has its own last stretch (F161_ELEVATED).
 const F161_ELEVATED=[[68.2,7.75,-14.3],[66.44,7.75,-14.3],[66.44,7.75,-10.85],[66.44,6,-10.85],[13.44,6,-10.85],[13.44,7.5,-10.85],[8.44,7.5,-10.85],[8.44,7.5,-14.1],[-0.06,7.5,-14.1],[-0.06,8,-14.1],[-6.31,8,-14.1],[-6.31,8,-24.6],[-17.81,8,-24.6],[-17.81,8,-20.1],[-17.81,6.3,-20.1],[-16.81,6.3,-20.1]];
 const DIST=[
  ['BL-RO162',[[67.9,8,-14.3],[53.8,8,-14.3],[53.8,8,-17],[53.8,6,-17],[5.8,6,-17],[5.8,6,-13.75],[-9.45,6,-13.75],[-9.45,6,-8],[-22.95,6,-8],[-22.95,6,-20],[-18.45,6,-20],[-18.45,5.61,-20]]],
  ['BL-RO-F161',[[68.2,7.75,-14.3],[66.39,7.75,-14.3],[66.39,7.75,-22.5],[9.64,7.75,-22.5],[9.64,7.75,-20.25],[-4.61,7.75,-20.25],[-4.61,7.75,-12.75],[-16.86,7.75,-12.75],[-16.86,7.75,-16.25],[-20.36,7.75,-16.25],[-20.36,5.25,-16.25],[-20.36,5.25,-19],[-18.86,5.25,-19],[-18.86,4.5,-19],[-17.36,4.5,-19]]],
  ['BL-RO161',[[68.2,7.5,-14.3],[56.55,7.5,-14.3],[56.55,7.5,-17.5],[56.55,6,-17.5],[5.8,6,-17.5],[5.8,5.5,-17.5],[5.8,5.5,-14],[-9.95,5.5,-14],[-9.95,6,-14],[-9.95,6,-11],[-19.7,6,-11],[-19.7,6,-15],[-18.45,6,-15],[-18.45,5.61,-15]]],
  ['BL-RO-201',[[68.2,7,-14.3],[67.28,7,-14.3],[67.28,6,-14.3],[67.28,6,-19.3],[12.28,6,-19.3],[12.28,1.2,-19.3],[12.28,1.2,-9],[11.28,1.2,-9]]],
  ['BL-RO400',[[68.2,7.25,-14.3],[60.61,7.25,-14.3],[60.61,7.25,8.7],[41.61,7.25,8.7],[41.61,7.25,26.45],[41.61,6.4,26.45],[27.36,6.4,26.45],[27.36,6.4,28],[26.36,6.4,28]]]];
 for(const [tg,pts0] of DIST){const p=ports.find(p=>p.id===tg);if(!p)continue;const pts1=tg==='BL-RO-F161'&&p.point[1]>5.5?F161_ELEVATED:pts0,l0=Math.hypot(pts1[1][0]-pts1[0][0],pts1[1][1]-pts1[0][1],pts1[1][2]-pts1[0][2]),pts=l0>2.4?[pts1[0],pts1[0].map((v,i)=>v+(pts1[1][i]-v)*1.2/l0),...pts1.slice(1)]:pts1;consume(tg);setContext(502,'Qualified RO water distribution to '+tg);const route=L(pts,'A-2000 water to '+tg,'RO water','2013',.05,{toArea:EQUIPMENT[p.reactor].areaId,from:'P-2011',to:tg,specs:{0:{type:'check',label:'NRV-'+tg+'-SUPPLY'}}});connections.push({tag:tg,toArea:EQUIPMENT[p.reactor].areaId,routeIds:[route.id],partIds:route.partIds});}
 // PW-6 side: T-2002 and P-2005 end at a blinded boundary until the scrubber and lime-slurry consumers are modelled.
 setContext(509,'PW-6 process-water pump');suction(product,pumps[509],'T-2002 to P-2005','2013');const hx5=EQUIPMENT[509].x,hz5=EQUIPMENT[509].z;L([pumps[509].outlet,[hx5,2,hz5]],'P-2005 PW-6 discharge','Process water');G([hx5,2,hz5],[hx5+.35,2,hz5],'XV-PW6-SUPPLY');L([[hx5+.35,2,hz5],[hx5+.8,2,hz5],[hx5+.8,2.6,hz5]],'P-2005 to PW-6 boundary','Process water','2013',.08,{specs:{1:{type:'check',label:'NRV-PW6-SUPPLY'}}});endBoundary('BL-A2000-PW6',[hx5+.8,2.6,hz5],'Process water','PW-6 users (scrubber make-up, lime slurry): connection not modelled; qualified supply and approval required',true,.08);
 // Dedicated sequential cleaning circuit: no connection to normal product or concentrate discharge during CIP.
 setContext(515,'CIP-2001 acid / alkaline cleaning');const cf=root(b('CIP-2001 anchored skid','frame',[3.2,.2,3.2],[83.95,.1,-3.75]),[83.95,0,-3.75]),ct=band('CIP-2001 2 m³ cleaning tank','shell',.85,.82,1.1,[83.65,.85,-3.75],'bright');ct.cut=true;const cipFoot=b('CIP tank support pedestal','frame',[1.8,.1,1.8],[83.65,.25,-3.75]);s.join(cf,cipFoot,[83.65,.2,-3.75],'CIP pedestal mounting');s.join(cipFoot,ct,[83.65,.3,-3.75],'CIP tank mounting');s.load(ct,'CIP tank');const ci2=[83.95,1.5,-3.75];c('CIP-2001 tank lid','head',.85,.06,[83.65,1.43,-3.75]);
 // Tank nozzles (V358): pump suction and spent-liquor takeoff on the east wall, low drain at the south foot; each pump looks at its nozzle so the suction is one straight run.
 const sn=nozzle([84.32,.8,-3.25],[1,0,0],.22,'CIP-2001 pump suction nozzle',RCIP),wn=nozzle([84.32,.8,-4.25],[1,0,0],.22,'CIP-2001 spent-liquor nozzle',.04),ld=nozzle([83.65,.35,-2.93],[0,0,1],.22,'CIP-2001 low drain nozzle',.04);
 k.passage(ct,[ci2,[84.3,.8,-3.25]],'CIP tank liquid passage','CIP chemical',{internalTo:'CIP-2001'});k.passage(ct,[ci2,[84.3,.8,-4.25]],'CIP tank spent-liquor passage','Segregated CIP waste',{internalTo:'CIP-2001'});k.passage(ct,[ci2,[83.65,.37,-2.95]],'CIP tank low drain passage','Segregated CIP waste',{internalTo:'CIP-2001'});
 const cp=k.transferPump(85.9,'P-CIP2001','CIP recirculation',{z:-3.25,facing:[-1,0],pipeR:RCIP});L([sn,cp.inlet],'CIP-2001 pump suction','CIP chemical',null,RCIP);L([cp.outlet,[85.9,4.1,-3.25],[85.9,4.1,-14.8],[70.9,4.1,-14.8],[70.9,4.1,ZFE],[70.9,2,ZFE]],'CIP-2001 cleaning supply','CIP chemical');G([70.9,2,ZFE],[70.9,1.65,ZFE],'XV-RO-CIP');L([[70.9,1.65,ZFE],[70.9,1,ZFE],feedNode],tag+' CIP feed to membrane','CIP chemical');L([cipRet,[83.95,5.3,ZFE],[83.95,5.3,-3.75],ci2],'RO cleaning return to CIP-2001','CIP chemical');
 L([wn,[84.74,.8,-4.25]],'CIP spent-liquor takeoff','Segregated CIP waste',null,.04);G([84.74,.8,-4.25],[85.09,.8,-4.25],'XV-CIP2001-WASTE',true,.04);
 L([ld,[83.65,.35,-2.2]],'CIP low drain collection','Segregated CIP waste',null,.04);endBoundary('BL-CIP2001-LOW',[83.65,.35,-2.2],'Segregated CIP waste','Closed pump-out connection to spent-CIP tank; portable pump required for lift',true,.04,[0,0,1]);
 // Pumped closed transfer shown as a separate package path; never depict an uphill gravity drain.
 const wp=k.transferPump(85.9,'P-CIP2001-W','Spent CIP transfer',{z:-4.25,facing:[-1,0],pipeR:.04});L([[85.09,.8,-4.25],wp.inlet],'CIP waste pump suction','Segregated CIP waste',null,.04);L([wp.outlet,[85.9,3.5,-4.25],[85.9,3.5,-8.85],[84.4,3.5,-8.85],spent.input],'CIP spent liquor to TK-CIP2001-W','Segregated CIP waste','2022',.04);setContext(521,'Segregated CIP waste disposition');L([spent.out,[86.3,.65,-8.85],[86.3,1.1,-8.85],[86.7,1.1,-8.85],[86.7,.65,-8.85],[86.95,.65,-8.85]],'Held CIP waste to approved EHS boundary','Segregated CIP waste','2022',.04);endBoundary('BL-CIP2000-EHS',[86.95,.65,-8.85],'Segregated CIP waste','Closed separate collection; approved EHS destination not assigned',true,.04);
 function bund(id,tag,rect,depth,inventory){setContext(id,tag+' separate chemical containment');const[a,d,z,e]=rect,w=z-a,l=e-d;root(b(tag+' chemically resistant floor','frame',[w,.08,l],[(a+z)/2,.04,(d+e)/2],'dark'),[(a+z)/2,0,(d+e)/2]);for(const x of[a+.06,z-.06])b(tag+' continuous raised curb','frame',[.12,depth,l],[x,depth/2,(d+e)/2]);for(const zz of[d+.06,e-.06])b(tag+' continuous raised curb','frame',[w-.24,depth,.12],[(a+z)/2,depth/2,zz]);bunds.push({tag,rect,curbM:depth,inventoryM3:inventory,freeboardM:.1,grossUsableM3:(w-.24)*(l-.24)*(depth-.1),qualification:'Closed lined bund; displacement, chemical compatibility, sealed penetrations and capacity require civil verification; no shared drain'});}
bund(513,'BND-AS2001',[79.15,-10.5,82.45,-6.25],.5,1);bund(515,'BND-CIP2001',[81.95,-6.45,87.45,-1.45],.5,2);bund(521,'BND-CIP2001-W',[83.25,-10.45,86.55,-7.15],.85,5);
 panel(516,'CP-2000',69,-2.4);for(const [tag,equipment,interlocks]of[['AIT-2001','CF-2002 / P-2012',['Feed pH, SDI, turbidity, oxidants and scaling accepted','ORP high-high stops P-2012']],['AIT-2002','RO-2011',['Fail closed on startup or off-spec; no off-spec diversion is modelled (hold)','Independent laboratory qualification before reuse']],['PIT/FIT/AIT-RO2011','RO-2011',['Low suction / flow stops pump','High pressure / differential pressure stops the train','T-2011 high-high stops production','T-2002 low level opens LV-2002 for city top-up','FCV-RO-2011 holds the concentrate flow (recovery)']],['CF-2002-BACKWASH','CF-2002',['Backwash closes XV-CF2002-IN and -OUT first','Waste only through the air-gapped drain once approved']],['CIP-2001-INTERLOCK','CIP-2001',['One isolated train at a time','Product and concentrate export isolated','Proven rinsing between acid and alkaline steps']]])controlLinks.push({tag,equipment,interlocks,setpoint:null,status:'Proposed inspection logic; not a PLC/SIS sequence'});
 for(const r of routes.filter(r=>r.reactor>=500&&r.reactor<=521))if(!r.areaId)Object.assign(r,{areaId:'A-2000',designStatus:'proposed'});
 h.wastewater.roBuilt=true;delete h.wastewater.vessels;
 return {basis:A2000_BASIS,equipment:A2000_IDS,streams:[...k.streams],boundaries:k.boundaries,mappedStreams,controlLinks,trains,connections,bunds,vesselEnvelopes:Object.values(vessels).map(v=>({tag:v.tag,x:v.x,z:v.z,radius:v.r,top:v.top})),partIds:parts.slice(first).map(p=>p.id),scope:'FEED-PFD-2000 conceptual reclaimed-water train re-based on QFL 2026-10-10 (Route 0, no A-1100 condensate): city make-up through carbon (CF-2002), RO-2011 polishing for the PW-4 users via T-2011 / P-2011, T-2002 / P-2005 for PW-6 with the RO-2011 reject reused; the A-1000 effluent is not routed to A-2000; qualified reuse only',approvedOperatingLimits:null};
}
