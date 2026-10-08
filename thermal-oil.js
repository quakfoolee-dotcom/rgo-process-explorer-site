// D-MDL-05 (bases M5-1…M5-10, approved by QFL 2026-10-01): A-5400 thermal-oil package with real-world equipment geometry, the DN300
// thermal-oil mains to HX-601 and (Route 2 + 6 only) the DN150 branch to PK-1101 stage 2, on a dedicated rack. Built with the catch-up
// equipment, after the plant-wide pipe-support system, so no other rack re-flows (V241 lesson); the rack and supports here are explicit.
// Geometry follows FEED-PE-DAT-140 V1.1 where it gives values (14 MW rated, 280 / 250 °C, ≈ 715 m³/h, casing ≈ 3.6 × 10 m, stack ≈ 20 m);
// everything else is a model choice pending vendor data (hold U8): horizontal coil heater, expansion drum ≈ 11 m³, drain tank ≈ 30 m³.
// The corridor was taken from an occupancy scan of the built model: stacked supply (y 7.4) and return (y 6.6) below the A-5000 utility racks
// (y ≥ 10.5), along x 105, z 5.45 and x 78.3, into the existing HX-601 battery limits BL-HT601-IN / -RET at (73.36, 4.5 / 5.1, 20).
export const THERMAL_OIL_BASIS={revision:'D-MDL-05',decision:'D-MDL-05',mainRadius:.16,branchRadius:.085,insulationM:.10,supplyY:7.4,returnY:6.6,
 qualification:'Layout and routing for FEED review: no pipe stress, thermal-expansion or hydraulic calculation; DN300 from ≈ 715 m³/h at ≈ 2.8 m/s. Heater, drum and tank dimensions are model choices pending vendor data (U8). HX-601 heating nozzles are DN100 placeholders in the A-600 model (reducers at the battery limit) — HX-601 sizing follow-up.'};
const SUPPLY='Thermal oil 280 °C supply',RETURN='Thermal oil 250 °C return';
export function buildThermalOil(k,s,base,{acidRoute='r0'}={}){
 const {T,parts,EQUIPMENT,setContext,b,c,band,ring,nozzle,line}=k,first=parts.length,V=p=>new T.Vector3(...p);
 const {mainRadius:R,branchRadius:RB,insulationM:INS,supplyY:SY,returnY:RY}=THERMAL_OIL_BASIS,routes=[];
 const mark=(from,extra)=>{for(const p of parts.slice(from))Object.assign(p,{geometryBasis:'D-MDL-05',designStatus:'proposed',...extra});};
 // Insulation jackets on straight runs of hot lines (planning thickness only); flagged so support and access audits treat them as cladding.
 // V313: the cladding follows the route's real edges (the old spool-name lookup missed spools split at a valve, and skipped elbows and reducers):
// straight spools with 100 mm bare at each end, every segment of a formed elbow, and a stepped sleeve on a reducer. Valves stay bare.
 function insulate(route){const clad=(host,seg,i,len,a,z,radius)=>{const mid=a.clone().add(z).multiplyScalar(.5),d=z.clone().sub(a).normalize(),j=band(route.label+' · insulation cladding '+i,'pipe',radius+INS,radius+.002,len,mid.toArray(),'jacket',d.toArray());Object.assign(j,{insulationFor:host.id,routeId:route.id,thermalInsulation:true,insulationThickness:0,cut:true,exploreRole:'context',geometryBasis:'D-MDL-05 planning insulation 100 mm (280 °C)'});host.insulationThickness=INS;route.partIds.push(j.id);};
  let n=0;for(const ei of route.edgeIndices){const e=k.edges[ei],host=parts.find(p=>p.id===e.part);if(!host||host.system!=='pipe'||!e.path?.length)continue;let P=e.path;const r=e.radius;if(P.length===3&&/elbow/.test(e.name)){const q=P.map(V),pts=[];for(let t=0;t<=1.0001;t+=.1)pts.push(q[0].clone().multiplyScalar((1-t)*(1-t)).addScaledVector(q[1],2*t*(1-t)).addScaledVector(q[2],t*t).toArray());P=pts;}// a formed elbow is a quadratic curve through its corner
   if(host.portRadii){const [rA,rB]=host.portRadii,a=V(P[0]),z=V(P.at(-1)),h=a.distanceTo(z);for(let s=0;s<5;s++){const t0=s/5,t1=(s+1)/5,p0=a.clone().lerp(z,t0),p1=a.clone().lerp(z,t1);clad(host,e,++n,h/5*1.05,p0,p1,rA+(rB-rA)*(t0+t1)/2);}continue;}
   if(P.length===2){const a=V(P[0]),z=V(P[1]),seg=a.distanceTo(z),len=Math.max(seg-.2,seg*.6);if(len>=.1)clad(host,e,++n,len,a,z,r);continue;}
   // a bend: sleeves along the curve, each chord at least 0.1 m long so the small segments of a tight elbow merge
   let from=V(P[0]),acc=0;for(let i=1;i<P.length;i++){const to=V(P[i]);acc+=V(P[i-1]).distanceTo(to);if(acc>=.1||i===P.length-1){const chord=from.distanceTo(to);if(chord>.02)clad(host,e,++n,Math.max(chord,acc*.9)*1.04,from,to,r);from=to;acc=0;}}}
  return n;}
 function hot(points,r,label,service,from,to,spec={}){const route=line(points,r,label,service,from,to,spec);routes.push(route.id);insulate(route);return route;}
 function cold(points,r,label,service,from,to,spec={}){const route=line(points,r,label,service,from,to,spec);routes.push(route.id);return route;}
 // ---- Package pad (unchanged plot) and curbs.
 const ap=EQUIPMENT[663];setContext(663,ap.label);
 // V318: the pad is 11.1 x 19.4 m (was 10 x 18) so the curb stands 1.5 m or more from the T-5401 and V-5401 shells (BC Fire Code, CR-4); the west curb stays put.
 const PW=5.55,PL=9.7,apad=base(b('A-5400 package pad','frame',[2*PW+.1,.2,2*PL+.1],[ap.x,.1,ap.z],'dark'),[ap.x,0,ap.z]);
 for(const [lab,size,pos] of [['north',[2*PW,.3,.2],[ap.x,.35,ap.z+PL]],['south',[2*PW,.3,.2],[ap.x,.35,ap.z-PL]],['west',[.2,.3,2*PL],[ap.x-PW,.35,ap.z]],['east',[.2,.3,2*PL],[ap.x+PW,.35,ap.z]]]){const w=b('A-5400 spill curb '+lab,'frame',size,pos,'dark');s.join(apad,w,[pos[0],.2,pos[2]],'A-5400 curb '+lab+' / pad');}
 // ---- H-5400: horizontal cylindrical coil heater, burner end north, flue box and stack at the rear.
 const he=EQUIPMENT[664],HX=he.x,HZ=he.z,HR=1.8,HY=2.55,HL=10,front=HZ+HL/2,rear=HZ-HL/2;setContext(664,he.label);let from=parts.length;
 const saddles=[rear+1.5,HZ,front-1.5].map((z,i)=>{const sd=b('H-5400 saddle '+(i+1),'frame',[3.0,.95,.45],[HX,.2+.475,z],'steel');s.join(apad,sd,[HX,.2,z],'H-5400 saddle '+(i+1)+' / pad');return sd;});
 const shell=c('H-5400 coil heater shell · Ø 3.6 × 10 m','shell',HR,HL,[HX,HY,HZ],'steel',[0,0,1]);shell.cut=true;s.join(saddles[1],shell,[HX,HY-HR,HZ],'H-5400 shell / saddle');s.load(shell,'H-5400 shell');
 for(const z of [rear+.02,front-.02])ring('H-5400 head seam','head',HR,.02,[HX,HY,z],'weld',[0,0,1]);
 const fcover=c('H-5400 front end cover','head',HR+.05,.12,[HX,HY,front+.06],'blue',[0,0,1]);s.join(shell,fcover,[HX,HY,front],'H-5400 front cover / shell');
 const rcover=c('H-5400 rear end cover','head',HR+.03,.10,[HX,HY,rear-.05],'steel',[0,0,1]);s.join(shell,rcover,[HX,HY,rear],'H-5400 rear cover / shell');
 for(const dz of [-3,0,3])band('H-5400 shell stiffener ring','frame',HR+.06,HR,.08,[HX,HY,HZ+dz],'steel',[0,0,1]);
 const windbox=c('H-5400 burner windbox','pump',.75,.6,[HX,HY,front+.42],'red',[0,0,1]);s.join(fcover,windbox,[HX,HY,front+.12],'H-5400 windbox / front cover');
 const burner=c('H-5400 gas burner','pump',.38,.9,[HX,HY,front+1.17],'red',[0,0,1]);s.join(windbox,burner,[HX,HY,front+.72],'H-5400 burner / windbox');s.load(burner,'H-5400 burner');
 const fdb=b('H-5400 FD fan base','frame',[1.4,.25,1.2],[HX-1.6,.325,front+1.0],'steel');s.join(apad,fdb,[HX-1.6,.2,front+1.0],'H-5400 FD fan base / pad');
 const fan=c('H-5400 combustion-air FD fan','pump',.62,.55,[HX-1.6,1.07,front+1.0],'blue',[1,0,0]);s.join(fdb,fan,[HX-1.6,.45,front+1.0],'H-5400 FD fan / base');s.load(fan,'H-5400 FD fan');
 const fm=c('H-5400 FD fan motor','pump',.24,.6,[HX-2.175,1.07,front+1.0],'blue',[1,0,0]);s.join(fan,fm,[HX-1.875,1.07,front+1.0],'H-5400 fan motor / fan');
 const duct=b('H-5400 combustion-air duct','shell',[1.0,.5,.5],[HX-.83,1.6,front+.75],'steel');s.join(fan,duct,[HX-1.33,1.6,front+.75],'H-5400 air duct / fan');
 const flue=b('H-5400 flue gas box','shell',[1.7,1.0,1.7],[HX,HY+HR+.45,rear+1.2],'steel');s.join(shell,flue,[HX,HY+HR,rear+1.2],'H-5400 flue box / shell');
 const stackTop=20,stack=c('H-5400 stack · Ø 1.4 m to ≈ 20 m (provisional, dispersion study)','shell',.7,stackTop-(HY+HR+.95),[HX,(HY+HR+.95+stackTop)/2,rear+1.2],'dark');s.join(flue,stack,[HX,HY+HR+.95,rear+1.2],'H-5400 stack / flue box');s.load(stack,'H-5400 stack');
 const cap=c('H-5400 stack rain cap','head',1.0,.12,[HX,stackTop+.56,rear+1.2],'steel');
 for(const dx of [-.5,.5]){const st=b('H-5400 rain cap stay','frame',[.05,.5,.05],[HX+dx,stackTop+.25,rear+1.2],'steel');s.join(stack,st,[HX+dx,stackTop,rear+1.2],'H-5400 rain cap stay / stack');s.join(st,cap,[HX+dx,stackTop+.5,rear+1.2],'H-5400 rain cap / stay');}
 const sp=band('H-5400 stack sampling platform','frame',1.65,.72,.06,[HX,12,rear+1.2],'steel');s.join(stack,sp,[HX,12,rear+1.2],'H-5400 sampling platform / stack');
 band('H-5400 sampling platform handrail','frame',1.65,1.61,.05,[HX,13.05,rear+1.2],'steel');
 for(let i=0;i<8;i++){const a=i*Math.PI/4;b('H-5400 sampling platform handrail post','frame',[.05,1.05,.05],[HX+Math.cos(a)*1.63,12.55,rear+1.2+Math.sin(a)*1.63],'steel');}
 nozzle([HX+.7,12.6,rear+1.2],[1,0,0],.15,'H-5400 stack emission sampling port',.04);
 const lx=HX+.95,lz=rear+1.2;for(const dz of [-.22,.22])b('H-5400 stack ladder rail','frame',[.05,12-(HY+HR+.95),.05],[lx,(HY+HR+.95+12)/2,lz+dz],'steel');
 for(let y=HY+HR+1.25;y<12;y+=.3)b('H-5400 stack ladder rung','frame',[.04,.04,.44],[lx,y,lz],'steel');
 // Top service walkway over the shell front with handrails and a fixed ladder on the west side.
 const deck=b('H-5400 top service walkway','frame',[1.2,.06,3.2],[HX,HY+HR+.03,front-2.6],'steel');s.join(shell,deck,[HX,HY+HR,front-2.6],'H-5400 walkway / shell');
 for(const dx of [-.6,.6]){b('H-5400 walkway handrail','frame',[.05,.05,3.2],[HX+dx,HY+HR+1.2,front-2.6],'steel');for(const dz of [-1.5,0,1.5])b('H-5400 walkway handrail post','frame',[.05,1.05,.05],[HX+dx,HY+HR+.68,front-2.6+dz],'steel');}
 for(const dz of [-.22,.22])b('H-5400 access ladder rail','frame',[.05,HY+HR,.05],[HX-HR-.25,.2+(HY+HR)/2,front-1.2+dz],'steel');
 for(let y=.5;y<HY+HR;y+=.3)b('H-5400 access ladder rung','frame',[.04,.04,.44],[HX-HR-.25,y,front-1.2],'steel');
 for(const [lab,dz] of [['flame sight port',-.6],['inspection door',-3.5]])b('H-5400 '+lab,'valve',[.1,.45,.45],[HX-HR-.02,HY,front+dz],'dark');
 const panel=b('H-5400 burner management / local control panel','valve',[1.0,1.9,.45],[HX+1.6,1.15,front+1.2],'steel');s.join(apad,panel,[HX+1.6,.2,front+1.2],'H-5400 panel / pad');b('H-5400 panel display','valve',[.5,.3,.01],[HX+1.6,1.6,front+1.43],'dial');
 // Coil connections and natural-gas train.
 const coilIn=nozzle([HX+HR,1.7,front-2.0],[1,0,0],.32,'H-5400 coil inlet 250 °C',R);
 const coilOut=nozzle([HX,HY+HR,front-.2],[0,1,0],.3,'H-5400 coil outlet 280 °C',R);
 const coilDrain=nozzle([HX,HY-HR,rear+3.3],[0,-1,0],.3,'H-5400 coil low-point drain',.03);
 k.boundary('BL-NG-5400',[ap.x-PW-.5,HY+.3,front+1.5],[-1,0,0],.055,'Natural gas','Site natural-gas supply (not modelled)');
 cold([[ap.x-PW-.5,HY+.3,front+1.5],[ap.x-PW+.1,HY+.3,front+1.5],[ap.x-PW+.8,HY+.3,front+1.5],[HX-1.0,HY+.3,front+1.5],[HX-1.0,HY,front+1.5],[HX-.45,HY,front+1.5]],.055,'H-5400 natural-gas train','Natural gas','BL-NG-5400','H-5400 burner',{0:{type:'wheel',label:'H-5400 gas train manual isolation'},1:{type:'regulator',label:'H-5400 gas pressure regulator'}});
 mark(from,{});
 // ---- P-5401A/B: horizontal end-suction hot-oil pumps with motors on baseplates (1 + 1, ≈ 715 m³/h each).
 const pp=EQUIPMENT[665],PX=pp.x,pumps=[];setContext(665,pp.label);from=parts.length;
 for(const [i,pz] of [pp.z-1.1,pp.z+1.1].entries()){const tag='P-5401'+'AB'[i],p0=parts.length;
  const bp=b(tag+' baseplate','frame',[3.0,.2,1.0],[PX,.3,pz],'green');s.join(apad,bp,[PX,.2,pz],tag+' baseplate / pad');
  const casing=c(tag+' pump volute','pump',.45,.5,[PX-1.1,1.0,pz],'steel',[1,0,0]);const foot=b(tag+' casing support foot','frame',[.4,.15,.6],[PX-1.1,.475,pz],'steel');s.join(bp,foot,[PX-1.1,.4,pz],tag+' casing foot / baseplate');s.join(foot,casing,[PX-1.1,.55,pz],tag+' casing / foot');s.load(casing,tag+' casing');
  const frame=c(tag+' bearing frame','pump',.18,.55,[PX-.6,1.0,pz],'steel',[1,0,0]);s.join(casing,frame,[PX-.85,1.0,pz],tag+' bearing frame / casing');
  b(tag+' coupling guard','pump',[.5,.42,.42],[PX-.05,1.0,pz],'red');
  const motor=c(tag+' motor','pump',.34,1.1,[PX+.8,1.0,pz],'blue',[1,0,0]);const stool=b(tag+' motor stool','frame',[.7,.26,.5],[PX+.8,.53,pz],'steel');s.join(bp,stool,[PX+.8,.4,pz],tag+' motor stool / baseplate');s.join(stool,motor,[PX+.8,.66,pz],tag+' motor / stool');s.load(motor,tag+' motor');
  c(tag+' motor fan cowl','pump',.3,.22,[PX+1.45,1.0,pz],'blue',[1,0,0]);b(tag+' motor terminal box','pump',[.3,.25,.3],[PX+.8,1.45,pz],'dark');
  const suction=nozzle([PX-1.40,1.0,pz],[-1,0,0],.25,tag+' suction',R),discharge=nozzle([PX-1.1,1.50,pz],[0,1,0],.22,tag+' discharge',.13);
  for(const p of parts.slice(p0)){p.pumpAssetTag=tag;p.exploreRole='equipment';p.componentAssembly='pump-'+parts[p0].id;}
  k.passage(casing,[[PX-1.355,1.0,pz],[PX-1.1,1.0,pz],[PX-1.1,1.455,pz]],tag+' pumped thermal-oil passage','Thermal oil',{transport:'equipment passage'});
  pumps.push({tag,z:pz,suction,discharge});}
 mark(from,{});
 // ---- Air separator on the pump suction (part of the V-5401 assembly until LST-001 allocates a tag).
 const ve=EQUIPMENT[666];setContext(666,ve.label);from=parts.length;
 const ASX=PX-2.3,ASZ=he.z+4.0;let asStand;for(const [dx,dz] of [[-.28,-.28],[.28,-.28],[-.28,.28],[.28,.28]]){const leg=b('V-5401 air separator leg','frame',[.08,.9,.08],[ASX+dx,.65,ASZ+dz],'steel');s.join(apad,leg,[ASX+dx,.2,ASZ+dz],'Air separator leg / pad');asStand=asStand||leg;}
 const asPlate=band('V-5401 air separator leg plate (annular)','frame',.42,.19,.06,[ASX,1.07,ASZ],'steel');for(const [dx,dz] of [[-.28,-.28],[.28,-.28],[-.28,.28],[.28,.28]]){const leg=parts.find(p=>p.name==='V-5401 air separator leg'&&Math.abs(p.position.x-(ASX+dx))<1e-6&&Math.abs(p.position.z-(ASZ+dz))<1e-6);s.join(leg,asPlate,[ASX+dx,1.08,ASZ+dz],'Air separator leg / plate');}
 const asBody=c('V-5401 air separator (untagged, LST-001 allocation pending)','shell',.35,1.6,[ASX,1.9,ASZ],'steel');s.join(asPlate,asBody,[ASX,1.1,ASZ],'Air separator / plate');s.load(asBody,'Air separator');
 const asIn=nozzle([ASX,2.2,ASZ+.35],[0,0,1],.3,'V-5401 air separator return inlet',R),asOut=nozzle([ASX,1.1,ASZ],[0,-1,0],.25,'V-5401 air separator outlet to pump suction',R),asTop=nozzle([ASX,2.7,ASZ],[0,1,0],.25,'V-5401 air separator expansion connection',.045);
 // ---- V-5401: horizontal expansion drum on a frame above the loop high point, with platform and ladder.
 const VX=ve.x,VZ=ve.z,VR=ve.radius,VY=ve.bottom+VR,VL=4.5;
 const posts=[];for(const dx of [-2,2])for(const dz of [-.8,.8]){const p=b('V-5401 structure column','frame',[.2,ve.bottom-.32,.2],[VX+dx,.2+(ve.bottom-.32)/2,VZ+dz],'steel');s.join(apad,p,[VX+dx,.2,VZ+dz],'V-5401 column / pad');posts.push(p);}
 const vdeck=b('V-5401 support deck','frame',[4.4,.12,2.0],[VX,ve.bottom-.06,VZ],'steel');s.join(posts[0],vdeck,[VX-2,ve.bottom-.12,VZ-.8],'V-5401 deck / column');
 for(const dz of [-.8,.8])b('V-5401 deck handrail','frame',[4.4,.05,.05],[VX,ve.bottom+1.05,VZ+dz*1.2],'steel');
 const drum=c('V-5401 expansion drum · Ø 1.8 × 4.5 m (≈ 11 m³)','shell',VR,VL,[VX,VY,VZ],'steel',[1,0,0]);drum.cut=true;s.join(vdeck,drum,[VX,ve.bottom,VZ],'V-5401 drum / deck');s.load(drum,'V-5401 drum');
 for(const dx of [-VL/2,VL/2]){const hd=c('V-5401 dished head','head',VR,.25,[VX+dx+Math.sign(dx)*.12,VY,VZ],'steel',[1,0,0]);s.join(drum,hd,[VX+dx,VY,VZ],'V-5401 head / drum');}
 for(const dx of [-1.4,1.4])b('V-5401 drum saddle','frame',[.35,.3,1.4],[VX+dx,ve.bottom+.15,VZ],'steel');
 for(const dx of [-.22,.22])b('V-5401 access ladder rail','frame',[.05,ve.bottom,.05],[VX+1.5+dx,.2+ve.bottom/2,VZ-1.2],'steel');
 for(let y=.5;y<ve.bottom+.9;y+=.3)b('V-5401 access ladder rung','frame',[.44,.04,.04],[VX+1.5,y,VZ-1.2],'steel');
 const vIn=nozzle([VX-VL/2-.23,VY-.5,VZ],[-1,0,0],.25,'V-5401 expansion line inlet',.045),vN2=nozzle([VX,VY+VR,VZ],[0,1,0],.2,'V-5401 N₂ blanket / vent (N₂ supply not modelled)',.03),vOver=nozzle([VX+VL/2+.25,VY,VZ],[1,0,0],.2,'V-5401 overflow to T-5401',.045);
 nozzle([VX+.8,VY+VR,VZ],[0,1,0],.2,'V-5401 relief / vent to safe location',.04);c('V-5401 level gauge','valve',.05,1.2,[VX-.6,VY,VZ+VR+.12],'dial');
 mark(from,{});
 // ---- T-5401: horizontal drain / storage drum on saddles at grade (N₂-push drain-down; gravity drain needs a pit — vendor, U8).
 const te=EQUIPMENT[667],TX=te.x,TZ=te.z,TR=te.radius,TY=te.bottom+TR,TL=6;setContext(667,te.label);from=parts.length;
 const tsad=[-2,2].map(dz=>{const sd=b('T-5401 saddle','frame',[2.2,.6,.4],[TX,.2+.3,TZ+dz],'steel');s.join(apad,sd,[TX,.2,TZ+dz],'T-5401 saddle / pad');return sd;});
 const tank=c('T-5401 drain / storage drum · Ø 2.6 × 6 m (≈ 30 m³)','shell',TR,TL,[TX,TY,TZ],'steel',[0,0,1]);tank.cut=true;s.join(tsad[0],tank,[TX,te.bottom,TZ-2],'T-5401 drum / saddle');s.load(tank,'T-5401 drum');
 for(const dz of [-TL/2,TL/2]){const hd=c('T-5401 dished head','head',TR,.3,[TX,TY,TZ+dz+Math.sign(dz)*.15],'steel',[0,0,1]);s.join(tank,hd,[TX,TY,TZ+dz],'T-5401 head / drum');}
 const tTop=nozzle([TX,TY+TR,TZ+1.0],[0,1,0],.25,'T-5401 overflow inlet',.045),tDrain=nozzle([TX,te.bottom+.3,TZ-TL/2-.3],[0,0,-1],.25,'T-5401 drain-down inlet',.03),tRefill=nozzle([TX-TR,te.bottom+.3,TZ+1.5],[-1,0,0],.25,'T-5401 refill outlet',.03);
 nozzle([TX,TY+TR,TZ-1.5],[0,1,0],.2,'T-5401 vent / N₂',.03);c('T-5401 level gauge','valve',.05,1.6,[TX+TR+.12,TY,TZ],'dial');
 mark(from,{});
 // ---- Package piping: return → air separator → pump suction → pumps → heater coil → supply; expansion, overflow, drain-down, refill.
 setContext(663,'A-5400 package piping');from=parts.length;
 const tee=[ASX,.6,ASZ],teeB=[ASX,.6,pumps[1].z];
 hot([asOut,tee],R,'A-5400 air separator outlet','Thermal oil 250 °C return','V-5401 air separator','P-5401A/B suction header');
 hot([tee,teeB],R,'A-5400 pump suction header','Thermal oil 250 °C return','V-5401 air separator','P-5401A/B');
 hot([teeB,[ASX,.6,pumps[0].z],[ASX,1.0,pumps[0].z],pumps[0].suction],R,'P-5401A suction','Thermal oil 250 °C return','Suction header','P-5401A',{2:{type:'wheel',label:'P-5401A suction isolation'}});
 hot([teeB,[ASX,1.0,pumps[1].z],pumps[1].suction],R,'P-5401B suction','Thermal oil 250 °C return','Suction header','P-5401B',{1:{type:'wheel',label:'P-5401B suction isolation'}});
 const dTee=[PX-1.1,2.9,pumps[1].z];
 hot([pumps[0].discharge,[PX-1.1,2.9,pumps[0].z],dTee],.13,'P-5401A discharge','Thermal oil to heater','P-5401A','H-5400',{0:{type:'check',label:'P-5401A non-return valve'},1:{type:'wheel',label:'P-5401A discharge isolation'}});
 hot([pumps[1].discharge,dTee],.13,'P-5401B discharge','Thermal oil to heater','P-5401B','H-5400',{0:{type:'check',label:'P-5401B non-return valve'}});
 hot([dTee,[PX-1.1,2.9,front-2.0],[HX+HR+1.0,2.9,front-2.0],[HX+HR+1.0,1.7,front-2.0],coilIn],R,'A-5400 heater inlet header','Thermal oil to heater','P-5401A/B','H-5400 coil inlet');
 cold([asTop,[ASX,4.9,ASZ],[vIn[0],4.9,ASZ],[vIn[0],4.9,VZ],vIn],.045,'A-5400 expansion line','Thermal oil expansion','Air separator','V-5401');
 cold([vOver,[VX+VL/2+.6,VY,VZ],[VX+VL/2+.6,3.9,VZ],[VX+VL/2+.6,3.9,TZ+1.0],[TX,3.9,TZ+1.0],tTop],.045,'V-5401 overflow to T-5401','Thermal oil overflow','V-5401','T-5401');
 cold([coilDrain,[HX,.45,rear+3.3],[TX+TR+.2,.45,rear+3.3],[TX+TR+.2,.45,TZ-TL/2-1.0],[TX+TR+.2,te.bottom+.3,TZ-TL/2-1.0],[TX,te.bottom+.3,TZ-TL/2-1.0],tDrain],.03,'A-5400 drain-down header (N₂ push)','Thermal oil drain-down','H-5400 low point','T-5401',{1:{type:'wheel',label:'H-5400 drain-down valve (normally closed)'}});
 cold([tRefill,[ASX+.5,te.bottom+.3,TZ+1.5],[ASX+.5,.6,TZ+1.5],[ASX+.5,.6,ASZ+.6],[ASX,.6,ASZ+.6],tee],.03,'T-5401 refill to pump suction','Thermal oil refill','T-5401','P-5401A/B suction',{2:{type:'wheel',label:'T-5401 refill valve (normally closed)'}});
 mark(from,{});
 // ---- Mains to HX-601 (both acid routes): supply from the coil outlet, return to the air separator.
 setContext(663,'A-5400 thermal-oil mains to HX-601');from=parts.length;
 const pin=k.ports.find(p=>p.id==='BL-HT601-IN'),pret=k.ports.find(p=>p.id==='BL-HT601-RET');if(!pin||!pret)throw Error('D-MDL-05: HX-601 battery limits BL-HT601-IN / -RET not found');
 // V315: the package stands outside the east building wall and the perimeter road (x 125); the mains leave its north end on the z 5.45 line and run straight west, over the road and through the wall.
 const ZM=5.45,XN=78.3,BL=121,BLV=119;
 const sIn=[pin.point[0]+.84,pin.point[1],pin.point[2]],rIn=[pret.point[0]+.84,pret.point[1],pret.point[2]];
 const sPts=[coilOut,[HX,SY,front-.2],[HX,SY,ZM],[BL,SY,ZM],[BLV,SY,ZM],[XN,SY,ZM],[XN,SY,19.4],[sIn[0]+.4,SY,19.4],[sIn[0]+.4,sIn[1],19.4],[sIn[0]+.4,sIn[1],sIn[2]],sIn];
 // Split at the package corner so the Route 2 + 6 branch can tee off a route vertex.
 hot(sPts.slice(0,4),R,'A-5400 supply main (package)',SUPPLY,'H-5400 coil outlet','A-5400 battery limit');
 hot(sPts.slice(3),R,'A-5400 thermal-oil supply main to HX-601',SUPPLY,'A-5400 battery limit','HX-601 (BL-HT601-IN)',{0:{type:'wheel',label:'A-5400 supply battery-limit isolation'},3:{type:'wheel',label:'HX-601 supply isolation'}});
 k.reducer(sIn,pin.point,R,pin.radius,'A-5400 supply DN300 × DN100 at HX-601 (HX-601 nozzle placeholder)');
 const rPts=[rIn,[rIn[0],rIn[1],20.6],[rIn[0],RY,20.6],[XN,RY,20.6],[XN,RY,ZM],[BLV,RY,ZM],[BL,RY,ZM],[asIn[0],RY,ZM],[asIn[0],RY,asIn[2]],asIn];
 k.reducer(pret.point,rIn,pret.radius,R,'A-5400 return DN100 × DN300 at HX-601 (HX-601 nozzle placeholder)');
 hot(rPts.slice(0,7),R,'A-5400 thermal-oil return main from HX-601',RETURN,'HX-601 (BL-HT601-RET)','A-5400 battery limit',{2:{type:'wheel',label:'HX-601 return isolation'},5:{type:'wheel',label:'A-5400 return battery-limit isolation'}});
 hot(rPts.slice(6),R,'A-5400 return main (package)',RETURN,'A-5400 battery limit','V-5401 air separator');
 // The reducers at the battery limits and the HX-601 heating lines in A-600 (drawn before the heating medium was chosen, as 'Thermal utility') carry the oil.
 for(const label of ['A-5400 supply DN300 × DN100 at HX-601 (HX-601 nozzle placeholder)','A-5400 return DN100 × DN300 at HX-601 (HX-601 nozzle placeholder)']){const rt=k.routes.find(x=>x.label===label);if(!rt)throw Error('D-MDL-05: reducer '+label+' not found');rt.service=label.includes('supply')?SUPPLY:RETURN;insulate(rt);}
 for(const [label,service] of [['HX-601 heating supply route',SUPPLY],['A600 heating supply interface',SUPPLY],['HX-601 heating return route',RETURN]]){const rt=k.routes.find(x=>x.label===label&&x.service==='Thermal utility');if(!rt)throw Error('D-MDL-05: HX-601 heating line '+label+' not found');rt.service=service;const st=k.streams?.find?.(q=>q.id===rt.id);if(st)st.service=service;routes.push(rt.id);insulate(rt);}
 mark(from,{thermalOil:true});
 // ---- Route 2 + 6 only: DN150 branch to PK-1101 stage 2 (D-MDL-02 option).
 let branch=null;
 if(acidRoute==='r26'&&EQUIPMENT[662]&&k.ports.some(p=>p.id.endsWith('PK-1101 thermal oil supply (stage 2)'))){
  setContext(662,'A-5400 thermal-oil branch to PK-1101 (Route 2 + 6)');from=parts.length;
  const pkS=k.ports.find(p=>p.id.endsWith('PK-1101 thermal oil supply (stage 2)')).point,pkR=k.ports.find(p=>p.id.endsWith('PK-1101 thermal oil return (stage 2)')).point;
  hot([[104.4,SY,ZM],[104.4,SY,ZM-1.5],[104.4,SY,pkS[2]],[104.4,pkS[1],pkS[2]],pkS],RB,'A-5400 supply branch to PK-1101 stage 2',SUPPLY,'A-5400 supply main','PK-1101',{0:{type:'wheel',label:'PK-1101 supply branch isolation'}});
  hot([pkR,[103.8,pkR[1],pkR[2]],[103.8,RY,pkR[2]],[103.8,RY,ZM-1.5],[103.8,RY,ZM]],RB,'A-5400 return branch from PK-1101 stage 2',RETURN,'PK-1101','A-5400 return main',{3:{type:'wheel',label:'PK-1101 return branch isolation'}});
  mark(from,{thermalOil:true,acidRoute:'r26'});branch={supply:'PK-1101',radius:RB};
 }
 // ---- Dedicated rack: T-posts with cantilever arms under the stacked pair (arms just below each insulated pipe).
 setContext(663,'A-5400 thermal-oil pipe rack');from=parts.length;
 const armY=y=>y-R-INS-.06,posts2=[];
 function tpost(x,z,dir,len,label,ground=0){const top=armY(SY)+.12,col=b(label+' column','frame',[.2,top-ground-.05,.2],[x,ground+.05+(top-ground-.05)/2,z],'steel');const plate=b(label+' baseplate','frame',[.4,.05,.4],[x,ground+.025,z],'steel');if(ground>0)s.join(apad,plate,[x,ground,z],label+' baseplate / pad');else base(plate,[x,ground,z]);s.join(plate,col,[x,ground+.05,z],label+' column / baseplate');
  for(const y of [armY(RY),armY(SY)]){const c0=[x,y,z],c1=[x+dir[0]*len,y,z+dir[2]*len],mid=[(c0[0]+c1[0])/2,y,(c0[2]+c1[2])/2];const arm=b(label+' cantilever arm','frame',[Math.abs(dir[0])*len+.12,.12,Math.abs(dir[2])*len+.12],mid,'steel');s.join(col,arm,c0,label+' arm / column');s.load(arm,label+' pipe shoe');}
  posts2.push(label);return col;}
 for(const [i,x] of [121.2,116,111,101,98,92,86,80].entries())tpost(x,4.95,[0,0,1],.85,'TO-RACK post '+(1+i),0);// x offset from the A-5000 T003 rack columns (x = 42 + 6 n, z 4.6); 121.2 and 129.5 straddle the vehicle barrier (x 120.2) and the perimeter road (x 125); the east walkway PW-002 (x 119) stays clear
 for(const [i,z] of [9.5,14.5,18.6].entries())tpost(XN+.95,z,[-1,0,0],1.25,'TO-RACK post '+(10+i),0);
 {const x=75.4,z=20.0,top=armY(SY)+.12,col=b('TO-RACK post 13 column','frame',[.2,top-.05,.2],[x,.05+(top-.05)/2,z],'steel');const plate=b('TO-RACK post 13 baseplate','frame',[.4,.05,.4],[x,.025,z],'steel');base(plate,[x,0,z]);s.join(plate,col,[x,.05,z],'TO-RACK post 13 column / baseplate');
  for(const [y,z0,z1] of [[armY(RY),20.0,20.95],[armY(SY),19.05,20.0]]){const arm=b('TO-RACK post 13 cantilever arm','frame',[.12,.12,z1-z0+.12],[x,y,(z0+z1)/2],'steel');s.join(col,arm,[x,y,z],'TO-RACK post 13 arm / column');s.load(arm,'TO-RACK post 13 pipe shoe');}posts2.push('TO-RACK post 13');}
 tpost(HX+.8,front+2.0,[-1,0,0],.95,'TO-RACK package post (supply riser)',.2);
 tpost(130,-7.2,[-1,0,0],4.0,'TO-RACK package post (north)',.2);tpost(130,4.0,[-1,0,0],4.0,'TO-RACK package post (mains)',0);// the north legs cross the rerouted perimeter road (z 0, and x 125 north of it) on an 11 m span; the posts stand outside the lane
 if(branch)for(const [i,z] of [1.5,-3,-8,-14,-20,-26,-32,-36.5].entries())tpost(105.1,z,[-1,0,0],1.6,'TO-RACK branch post '+(i+1),0);
 mark(from,{});
 return {basis:THERMAL_OIL_BASIS,routes,branch,rackPosts:posts2.length,partIds:parts.slice(first).map(p=>p.id),consumer:{id:'HX-601',supply:'BL-HT601-IN',return:'BL-HT601-RET',medium:'thermal oil 280 / 250 °C (D-A5000-04)'}};
}
