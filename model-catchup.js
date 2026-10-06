import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';
import {buildThermalOil,THERMAL_OIL_BASIS} from './thermal-oil.js';

// D-MDL-01 release 2 (bases R2-1…R2-8, approved by QFL 2026-09-28): equipment issued in the V219–V227 datasheets that the model did not
// carry. Standalone envelopes with nozzle stubs — no process routes are added (tie-ins deferred to the model engineer with the W3 / cascade
// re-routing, docs/model-catchup-handoff.md). Built after the pipe-support system so existing rack supports do not re-flow. Positions come
// from a clear-space search against every existing part. CL-1001 and SL-1001 are not placed: A-1000 has no clear space for them at datasheet
// size (decision pending with QFL).
// D-MDL-03 (QFL 2026-09-30): CL-1001 and SL-1001 moved inside A-1000 after the retired A-1000 equipment was removed and the interarea lines were
// re-routed off the south strip (A-2000 backwash return via the north utility corridor; dosing lines north-first; wet-vent lanes moved).
// Release 3 (LAY-10 ruled by QFL 2026-09-29, option L1, bases R3-1…R3-9): CL-1001 and the A-1100 set (T-1101 / T-1102 in a common acid
// bund with P-1101A/B and P-1102A/B, PK-1101) in a new south-east yard between the south pipe rack and the perimeter road (x 71–119,
// z −48…−34); A-5400 (H-5400, P-5401A/B, V-5401, T-5401) and SL-1001 in the future-expansion block (x 105–116). Every rectangle was checked
// clear against every ground-level part and walkway with 1 m clearance. PK-1101 and A-5400 are screening envelopes (vendor holds K1 / U8).
const note=(doc,extra='')=>`Envelope from ${doc} (D-MDL-01 release 2). Standalone — tie-ins deferred to the model engineer. Diameters and heights are model choices; vendor geometry unqualified.${extra}`;
const eq=(tag,label,areaId,primaryOperation,x,z,extra={})=>({tag,label,x,z,areaId,primaryOperation,designStatus:'proposed',labelY:3,geometryBasis:'D-MDL-01 R2',...extra});
const note3=(doc,extra='')=>`Envelope from ${doc} (D-MDL-01 release 3, LAY-10 ruling L1). Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified.${extra}`;
const r3=(tag,label,areaId,op,x,z,extra={})=>eq(tag,label,areaId,op,x,z,{geometryBasis:'D-MDL-01 R3',...extra});
// D-MDL-06 (QFL 2026-10-03) gave SL-1001 a conical hopper and re-sited it east of x 70; D-MDL-07 (QFL 2026-10-04) returned it to its A-1000 position
// (18, −24.5), where only Ø 4.5 m fits without moving lines (overhead lines at y 8.7–11.8 m start 2.56 m from the centre), and sized the volume
// from the storage rule instead of the datasheet number: two days at the bounding dose (CAL-034, 40.5 t/d Ca(OH)₂) at a settled bulk density of
// 0.6 t/m³ = 135 m³. DAT-127 implies 200 m³ (0.405 t/m³, loose); the density and the storage days are provisional until the datasheet owner and a
// lime supplier confirm them. The volume is shared between a 60° cone (0.5 m outlet, 3 m above grade for the rotary valve and screw) and a cylinder.
// Cone angle and outlet size are model choices pending the vendor flow test on the lime grade.
export const SL1001_BASIS=(()=>{const radius=2.25,outletRadius=.25,wallAngleDeg=60,outletY=3,boundingDoseTpd=40.5,storageDays=2,bulkDensityTpm3=.6,volumeM3=storageDays*boundingDoseTpd/bulkDensityTpm3,coneHeight=(radius-outletRadius)*Math.tan(wallAngleDeg*Math.PI/180),coneVolumeM3=Math.PI*coneHeight/3*(radius**2+radius*outletRadius+outletRadius**2),cylinderHeight=(volumeM3-coneVolumeM3)/(Math.PI*radius**2);return {radius,outletRadius,wallAngleDeg,outletY,boundingDoseTpd,storageDays,bulkDensityTpm3,volumeM3,coneHeight,coneVolumeM3,cylinderHeight,coneTop:outletY+coneHeight,top:outletY+coneHeight+cylinderHeight};})();
export const CATCHUP_EQUIPMENT={
 652:eq('F-160','Pre-G acid filter · 2.54 m² (FEED-PE-DAT-106)','A-160','fixing',-14.5,-24.5,{radius:.9,bottom:1.4,top:3.4,labelY:4.6,geometryStatus:note('FEED-PE-DAT-106',' Agitated pressure filter; placed south of F-161 (no clear space beside T-161), so the R-141 feed and the cake transfer to T-161 need a re-layout — deferred.')}),
 653:eq('T-160','Recovered-acid receiver · 10 m³ (FEED-PE-DAT-107)','A-160','pregpress',-14.5,-27.6,{radius:1.1,bottom:.26,top:.26+10/(Math.PI*1.06**2),labelY:4.2,geometryStatus:note('FEED-PE-DAT-107')}),
 654:eq('P-160','Recovered-acid transfer pumps A/B · 5 m³/h × 22 m (FEED-PE-DAT-108)','A-160','pregpress',-12.4,-28.6,{labelY:2.1,geometryStatus:note('FEED-PE-DAT-108',' 1 + 1 sealless pumps.')}),
 655:eq('HR-601','Dryer exhaust heat recuperator · 2.7 MW (FEED-PE-DAT-141)','A-600','a600',66.9,7.8,{labelY:6.9,geometryStatus:'HR-601 is a proposed air-to-air heat exchanger on the DR-601 spray-dryer package (A-600). It uses the hot dryer exhaust to pre-warm the incoming drying air. Envelope from FEED-PE-DAT-141 (D-MDL-01 release 2) for ≈ 408,000 m³/h exhaust, ducted in series between F-601 and FN-601 on the exhaust side and between the ambient-air battery limit and BL-601 on the air side. The exhaust-side bypass damper DV-601-BYP (datasheet item 3.2, normally closed) is modelled. Duct sizes are model choices; vendor geometry unqualified.'}),
 657:r3('CL-1001','HDS thickener · Ø 6.5 m (FEED-PE-DAT-118)','A-1000','wwseparate',41.75,-22.75,{radius:3.25,bottom:.26,top:3.8,labelY:6,geometryBasis:'D-MDL-03',geometryStatus:note3('FEED-PE-DAT-118',' Relocated inside A-1000 (D-MDL-03, QFL 2026-09-30) to the former T-1004 / P-1001 position after the retired equipment was removed and the interarea lines were re-routed; ≈ 17 m from R-1004, beside DC-1001 and T-1008. Tie-ins deferred: the gravity feed from R-1004 needs the thickener feedwell below the R-1004 overflow (≈ 1.0 m in the model) — sink CL-1001 or raise the cascade (W7, civil).')}),
 658:r3('T-1101','Concentrator feed tank · 125 m³ (FEED-PE-DAT-110)','A-1000','wwtreat',88,-41.5,{radius:2.75,bottom:.26,top:.26+5.4,labelY:7.2,geometryStatus:note3('FEED-PE-DAT-110',' A-1100 acid bund, south-east yard (Sheet 2 geometry Ø 5.5 × 5.4 m).')}),
 659:r3('T-1102','Recovered acid tank · 200 m³ (FEED-PE-DAT-111)','A-1000','wwtreat',96.5,-41.5,{radius:3,bottom:.26,top:.26+7.2,labelY:9,geometryStatus:note3('FEED-PE-DAT-111',' A-1100 acid bund, south-east yard (Sheet 2 geometry Ø 6.0 × 7.2 m).')}),
 660:r3('P-1101','Concentrator feed pumps A/B (FEED-PE-DAT-112)','A-1000','wwtreat',101.2,-44.8,{labelY:2.1,geometryStatus:note3('FEED-PE-DAT-112',' 1 + 1 inside the A-1100 bund.')}),
 661:r3('P-1102','Recovered acid return pumps A/B (FEED-PE-DAT-113)','A-1000','wwtreat',101.2,-39.6,{labelY:2.1,geometryStatus:note3('FEED-PE-DAT-113',' 1 + 1 inside the A-1100 bund; return to T-201 / T-102 on the south rack.')}),
 662:r3('PK-1101','Spent-acid concentrator package · screening 14 × 10 m (FEED-PE-DAT-109)','A-1000','wwtreat',112,-42,{labelY:19,geometryStatus:note3('FEED-PE-DAT-109',' Footprint, height and evaporator arrangement are vendor data (hold K1, REP-039 M5).')}),
 663:r3('A-5400','Thermal-oil heater package · 14 MW · 10 × 18 m pad (FEED-PE-DAT-140)','A-5000','a5000',111,-11,{labelY:3,geometryBasis:'D-MDL-05',geometryStatus:note3('FEED-PE-DAT-140',' Future-expansion block; ≈ 27 m from the A-600 edge (DR-601), ≈ 14 m from the A-800 block edge and ≈ 17 m from the A-1100 bund — HAZOP inputs (U8, FEED-PS-HOP-001), not a spacing ruling.').replace('Standalone — tie-ins deferred to the model engineer. Screening size; vendor geometry unqualified.','Connected: DN300 thermal-oil mains to HX-601 (and DN150 to PK-1101 under Route 2 + 6) on a dedicated rack, D-MDL-05 (QFL 2026-10-01).')}),
 664:r3('H-5400','Thermal-oil heater (gas-fired) · 14 MW rated (FEED-PE-DAT-140)','A-5000','a5000',108.6,-12,{radius:1.8,labelY:6.4,geometryBasis:'D-MDL-05',geometryStatus:'Horizontal cylindrical coil heater Ø 3.6 × 10 m on saddles, burner and FD fan at the north end, flue box and Ø 1.4 m stack to ≈ 20 m (provisional, dispersion study) at the rear (FEED-PE-DAT-140).'+' Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8).'}),
 665:r3('P-5401','Thermal-oil circulation pumps A/B · 900 m³/h (FEED-PE-DAT-140)','A-5000','a5000',113.2,-11.5,{labelY:2.1,geometryBasis:'D-MDL-05',geometryStatus:'1 + 1 horizontal end-suction hot-oil pumps with motors on baseplates, suction from the air separator, discharge to the heater coil (FEED-PE-DAT-140).'+' Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8).'}),
 666:r3('V-5401','Thermal-oil expansion vessel (FEED-PE-DAT-140)','A-5000','a5000',113,-16.5,{radius:.9,bottom:5.6,top:7.4,labelY:8.6,geometryBasis:'D-MDL-05',geometryStatus:'Horizontal N₂-blanketed expansion drum Ø 1.8 × 4.5 m (≈ 11 m³) on a frame above the loop high point, with deck, handrail and ladder; the air separator on the pump suction belongs to this assembly until LST-001 allocates a tag.'+' Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8).'}),
 667:r3('T-5401','Thermal-oil drain / storage tank (FEED-PE-DAT-140)','A-5000','a5000',114,-5.5,{radius:1.3,bottom:.7,top:3.3,labelY:4.4,geometryBasis:'D-MDL-05',geometryStatus:'Horizontal drain / storage drum Ø 2.6 × 6 m (≈ 30 m³) on saddles at grade inside the curbed pad; drain-down by N₂ push (a gravity drain would need a pit — vendor, U8).'+' Real-world geometry and the thermal-oil mains to HX-601 (and PK-1101 under Route 2 + 6) on a dedicated rack: D-MDL-05 (QFL 2026-10-01), dist/thermal-oil.js; dimensions are model choices pending vendor data (U8).'}),
 668:r3('SL-1001','Hydrated lime silo · 135 m³ · Ø 4.5 m with 60° cone (FEED-PE-DAT-127, provisional volume basis)','A-1000','wwtreat',18,-24.5,{radius:SL1001_BASIS.radius,bottom:SL1001_BASIS.outletY,top:SL1001_BASIS.top,outletRadius:SL1001_BASIS.outletRadius,coneHeight:SL1001_BASIS.coneHeight,wallAngleDeg:SL1001_BASIS.wallAngleDeg,volumeM3:SL1001_BASIS.volumeM3,labelY:15.5,geometryBasis:'D-MDL-07',geometryStatus:note3('FEED-PE-DAT-127',' Back at its A-1000 position (18, −24.5), ≈ 9 m from T-1002 (D-MDL-07, QFL 2026-10-04; D-MDL-06 had moved it east of x 70). Ø 4.5 m with a 60° conical hopper (0.5 m outlet at 3 m), cylinder to ≈ 13.7 m. The volume is 2 days at the 40.5 t/d bounding dose (CAL-034) at a settled bulk density of 0.6 t/m³ = 135 m³; DAT-127 implies 200 m³ (0.405 t/m³ loose), so the density and the storage days are provisional until the datasheet owner and a lime supplier confirm them. Only Ø 4.5 m fits here without moving the overhead lines at y 8.7–11.8 m (0.31 m clearance). Cone angle and outlet size are model choices pending the vendor flow test. Tanker access from the WATER-DELIVERY frontage (z −31.5…−28.5). Piping (D-MDL-08, QFL 2026-10-04): closed pneumatic tanker fill (coupling BL-FILLSL1001, isolation valve XV-SL1001-FILL, riser on the north side), roof dust filter with a vent to atmosphere, and a rotary valve plus inclined enclosed screw conveyor (≈ 34°, above the usual ≈ 30° limit; vendor to confirm) to a new roof nozzle on T-1002 — provisional until the powder-versus-slurry report. Make-up water to T-1002 and hopper aeration air are not modelled.')}),
 656:eq('IF-A2000-CITY','Municipal make-up battery limit (D-A2000-03)','A-2000','rodistribute',67.2,-0.7,{designStatus:'interface',labelY:2.2,geometryStatus:'Battery-limit marker only (D-MDL-01 release 2); municipal supply pressure, hardness and connection are site data.'}),
};
// HR-601 port table, shared with spray-drying.js so the A-600 ducts end exactly on the recuperator's nozzles.
// Exhaust side (F-601 -> HR-601 -> FN-601) uses the top face; air side (ambient -> HR-601 -> BL-601) uses the south face.
export function hr601Ports(hr){
 const top=5.6,len=.22,end=(root,axis)=>root.map((v,i)=>v+axis[i]*len);
 const port=(root,axis)=>({root,axis,end:end(root,axis)});
 return {
  exhaustIn:port([hr.x-1.65,top,hr.z-.9],[0,1,0]),
  exhaustOut:port([hr.x-.95,top,hr.z+.8],[0,1,0]),
  airOut:port([hr.x-2.9,2.3,hr.z-1.5],[0,0,-1]),
  airIn:port([hr.x+1.1,2.3,hr.z-1.5],[0,0,-1]),
  radius:.28,
 };
}
export const CATCHUP_IDS=Object.keys(CATCHUP_EQUIPMENT).map(Number);
// D-MDL-02 (QFL 2026-09-29, bases AR-1…AR-9): equipment that exists only under Route 2 + 6 (acid recovery), and the Route 0 reservation.
export const ACID_OPTION_IDS=[652,653,654,658,659,660,661,662];
export function applyAcidRoute(E,route){
 const byTag=tag=>Object.values(E).find(e=>e&&e.tag===tag);
 if(route==='r26'){
  for(const id of ACID_OPTION_IDS)if(E[id]){E[id].acidRoute='r26';E[id].label+=' · OPTION — Route 2 + 6';E[id].geometryStatus='OPTION — Route 2 + 6 acid recovery, gated on REP-039 M1–M3 (D-MDL-02). '+(E[id].geometryStatus||'');}
  const t162=byTag('T-162');if(t162&&!t162.retired){t162.retired={decisionId:'D-A160-04',reason:'Route 6: the hold moves into T-161, so T-162 is deleted',basis:'D-MDL-02 AR-4'};t162.label+=' · RETIRED (D-A160-04)';}
  return;
 }
 for(const id of ACID_OPTION_IDS)delete E[id];
 for(const tag of ['T-1007','P-1011']){const e=byTag(tag);if(e&&e.retired){delete e.retired;e.label=e.label.replace(/ · RETIRED \([^)]*\)$/,'');e.reviewNote=(e.reviewNote?e.reviewNote+' ':'')+'In service under Route 0 — its retirement (D-A1000-05, RS7) follows Route 6 (D-MDL-02 AR-4).';}}
 const a=E[663];if(a){a.acidRouteNote='Route 0: users ≈ 10.9 MW (no PK-1101 stage 2); 14 MW rated kept (D-MDL-02 AR-5)';a.label='Thermal-oil heater package · 14 MW (FEED-PE-DAT-140) — users ≈ 10.9 MW under Route 0 (no PK-1101 stage 2)';}
 for(const id of [657,668]){const e=E[id];if(e)e.geometryStatus+=' Under Route 0 the A-1000 envelope is the Route 2 + 6 residual size (CAL-034); a Route 0 A-1000 is not designed (REP-038 screening).';}
}

export function buildCatchup(h,acidRoute='r0'){
 const k=processKit(h,.08),s=structuralKit(h),{T,parts,EQUIPMENT,setContext,b,c,band,nozzle}=k,first=parts.length,V=p=>new T.Vector3(...p);
 const base=(part,point)=>{h.structure.roots.push({part:part.id,local:V(point).sub(part.position).applyQuaternion(part.quaternion.clone().invert()).divide(part.scale).toArray(),elevation:0});return part;};
 const stub=(tag,point,axis,r=.08)=>nozzle(point,axis,.22,tag+' (tie-in deferred)',r);
 function vessel(id){
  const e=EQUIPMENT[id],{x,z,radius:r,bottom:y0,top:y1,tag}=e;setContext(id,e.label);
  const pad=base(c(tag+' foundation','frame',r+.25,.2,[x,.1,z],'dark'),[x,0,z]);let support=pad;
  if(y0>.4){const sk=band(tag+' support skirt','frame',r*.92,r*.92-.05,y0-.2,[x,.2+(y0-.2)/2,z],'steel');s.join(pad,sk,[x,.2,z],tag+' skirt / foundation');support=sk;}
  else{const floor=c(tag+' supported tank bottom','head',r,.06,[x,.23,z],'steel');s.join(pad,floor,[x,.2,z],tag+' bottom / foundation');support=floor;}
  const body=band(tag+' shell','shell',r,r-.04,y1-y0,[x,(y0+y1)/2,z],'steel');body.cut=true;s.join(support,body,[x,y0,z],tag+' shell / support');s.load(body,tag+' shell');
  const roof=c(tag+' roof','head',r,.08,[x,y1+.04,z]);roof.cut=true;s.join(body,roof,[x,y1,z],tag+' roof / shell');
  return {e,x,z,r,y0,y1,tag,body,roof};
 }
 // F-160 — elevated agitated pressure filter.
 if(EQUIPMENT[652]){const f=vessel(652);setContext(652,f.e.label);
 const motor=c('F-160 agitator drive','pump',.22,.55,[f.x,f.y1+.36,f.z],'blue');s.join(f.roof,motor,[f.x,f.y1+.08,f.z],'F-160 drive / head');s.load(motor,'F-160 agitator');
 stub('F-160 R-141 slurry inlet',[f.x+.4,f.y1+.08,f.z],[0,1,0]);stub('F-160 cake discharge to T-161',[f.x-f.r,f.y0+.35,f.z],[-1,0,0],.15);stub('F-160 acid filtrate outlet',[f.x,f.y0-.05,f.z],[0,-1,0],.05);
 // T-160 and P-160A/B.
 const t=vessel(653);stub('T-160 filtrate inlet',[t.x,t.y1+.08,t.z],[0,1,0],.05);stub('T-160 outlet',[t.x,.6,t.z+t.r],[0,0,1],.05);
 setContext(654,EQUIPMENT[654].label);for(const [i,dz] of [0,1.3].entries()){const p=k.transferPump(EQUIPMENT[654].x,'P-160'+'AB'[i],EQUIPMENT[654].label,{z:EQUIPMENT[654].z-dz});stub('P-160'+'AB'[i]+' discharge',p.outlet,[0,1,0],.04);}}
 // HR-601 — air-to-air recuperator envelope on a slab.
 const hr=EQUIPMENT[655];setContext(655,hr.label);
 const slab=base(b('HR-601 foundation slab','frame',[7.4,.2,3.4],[hr.x,.1,hr.z],'dark'),[hr.x,0,hr.z]);
 const casing=b('HR-601 recuperator casing','shell',[7,5.4,3],[hr.x,.2+2.7,hr.z],'steel');s.join(slab,casing,[hr.x,.2,hr.z],'HR-601 casing / slab');s.load(casing,'HR-601 casing');
 const hp=hr601Ports(hr);for(const [lab,p] of [['exhaust inlet from F-601',hp.exhaustIn],['exhaust outlet to FN-601',hp.exhaustOut],['preheated air outlet to BL-601',hp.airOut],['ambient drying air inlet',hp.airIn]])nozzle(p.root,p.axis,.22,'HR-601 '+lab,hp.radius);
 // Gas passages through the casing join the nozzles, so the exhaust (F-601 → FN-601) and air (ambient → BL-601) paths stay connected through HR-601.
 const inside=p=>p.root.map((v,i)=>v-p.axis[i]*.045),xe=(p,y)=>[p.root[0],y,p.root[2]];
 k.passage(casing,[inside(hp.exhaustIn),xe(hp.exhaustIn,4.2),xe(hp.exhaustOut,4.2),inside(hp.exhaustOut)],'HR-601 exhaust gas passage','Moist drying gas');
 k.passage(casing,[inside(hp.airIn),[hp.airIn.root[0],2.3,hr.z],[hp.airOut.root[0],2.3,hr.z],inside(hp.airOut)],'HR-601 drying air passage','Drying gas');
 // IF-A2000-CITY — battery-limit marker.
 const ci=EQUIPMENT[656];setContext(656,ci.label);
 const post=base(b('IF-A2000-CITY battery-limit post','frame',[.12,1.6,.12],[ci.x,.8,ci.z],'steel'),[ci.x,0,ci.z]);const plate=b('IF-A2000-CITY battery-limit plate','valve',[.5,.3,.04],[ci.x,1.45,ci.z],'blue');s.join(post,plate,[ci.x,1.45,ci.z],'IF-A2000-CITY plate / post');
 // ---- Release 3 (LAY-10 ruling L1).
 // CL-1001 — thickener with bridge and drive.
 const cl=vessel(657);const bridge=b('CL-1001 bridge','frame',[cl.r*2,.35,.9],[cl.x,cl.y1+.08+.175,cl.z],'steel');s.join(cl.roof,bridge,[cl.x,cl.y1+.08,cl.z],'CL-1001 bridge / wall');
 const drive=c('CL-1001 rake drive','pump',.45,.7,[cl.x,cl.y1+.43+.35,cl.z],'blue');s.join(bridge,drive,[cl.x,cl.y1+.43,cl.z],'CL-1001 drive / bridge');s.load(drive,'CL-1001 drive');
 stub('CL-1001 feedwell inlet from R-1004',[cl.x-cl.r,cl.y1-.4,cl.z],[-1,0,0],.12);stub('CL-1001 underflow to P-1009',[cl.x,.35,cl.z+cl.r],[0,0,1],.08);stub('CL-1001 overflow',[cl.x+cl.r,cl.y1-.3,cl.z],[1,0,0],.12);
 // A-1100 acid bund with T-1101 / T-1102, the pumps and PK-1101 — Route 2 + 6 option only (D-MDL-02).
 if(EQUIPMENT[658]){
 setContext(658,EQUIPMENT[658].label);
 const bund=base(b('A-1100 acid bund floor','frame',[20,.2,11],[93,.1,-41.5],'dark'),[93,0,-41.5]);
 for(const [lab,size,pos] of [['north',[20,1.2,.25],[93,.8,-36.125]],['south',[20,1.2,.25],[93,.8,-46.875]],['west',[.25,1.2,11],[83.125,.8,-41.5]],['east',[.25,1.2,11],[102.875,.8,-41.5]]]){const w=b('A-1100 bund wall '+lab,'frame',size,pos,'dark');s.join(bund,w,[pos[0],.2,pos[2]],'A-1100 bund wall '+lab+' / floor');}
 const t1=vessel(658);stub('T-1101 filtrate / recovered-acid inlet',[t1.x,t1.y1+.08,t1.z],[0,1,0],.05);stub('T-1101 outlet to P-1101',[t1.x+t1.r,.6,t1.z],[1,0,0],.05);
 const t2=vessel(659);stub('T-1102 product inlet from PK-1101',[t2.x,t2.y1+.08,t2.z],[0,1,0],.05);stub('T-1102 outlet to P-1102',[t2.x+t2.r,.6,t2.z],[1,0,0],.05);
 for(const id of [660,661]){const e=EQUIPMENT[id];setContext(id,e.label);for(const [i,dz] of [0,1.3].entries()){const p=k.transferPump(e.x,e.tag+'AB'[i],e.label,{z:e.z+dz});stub(e.tag+'AB'[i]+' discharge',p.outlet,[0,1,0],.04);}}
 // PK-1101 — screening envelope: slab, package enclosure and evaporator column.
 const pk=EQUIPMENT[662];setContext(662,pk.label);
 const pslab=base(b('PK-1101 foundation slab','frame',[14,.2,10],[pk.x,.1,pk.z],'dark'),[pk.x,0,pk.z]);
 const encl=b('PK-1101 package envelope (screening)','shell',[13,10,9],[pk.x,.2+5,pk.z],'steel');s.join(pslab,encl,[pk.x,.2,pk.z],'PK-1101 envelope / slab');s.load(encl,'PK-1101 envelope');
 const col=c('PK-1101 stage 2 evaporator (screening)','shell',1.1,8,[pk.x+3.5,10.2+4,pk.z-2],'steel');s.join(encl,col,[pk.x+3.5,10.2,pk.z-2],'PK-1101 evaporator / envelope');
 for(const [lab,dx,dz] of [['feed from P-1101',-6.5,-3],['product to T-1102',-6.5,-1],['condensate',-6.5,3.5]])stub('PK-1101 '+lab,[pk.x+dx,1.4,pk.z+dz],[-1,0,0],.08);
 for(const [lab,dz] of [['supply',1],['return',2]])nozzle([pk.x-6.5,1.4,pk.z+dz],[-1,0,0],.22,'PK-1101 thermal oil '+lab+' (stage 2)',THERMAL_OIL_BASIS.branchRadius); // D-MDL-05: connected to the A-5400 branch
 }
 // A-5400 — real-world package, thermal-oil mains to HX-601 and (Route 2 + 6) the PK-1101 branch on a dedicated rack (D-MDL-05).
 const thermalOil=buildThermalOil(k,s,base,{acidRoute});
 // SL-1001 — silo on six legs with a 60° conical hopper (D-MDL-06, back at its A-1000 position by D-MDL-07). y0 is the hopper outlet, 3 m above grade for the rotary valve and screw.
 const sl=(()=>{const e=EQUIPMENT[668],{x,z,radius:r,bottom:y0,top:y1,tag}=e,yc=y0+SL1001_BASIS.coneHeight,hopper=inner=>k.geo(`SL-1001 hopper:${inner}`,()=>new T.CylinderGeometry(inner?r-.04:r,inner?SL1001_BASIS.outletRadius-.04:SL1001_BASIS.outletRadius,SL1001_BASIS.coneHeight,48,1,true));
  setContext(668,e.label);
  const pad=base(c(tag+' foundation','frame',r+.25,.2,[x,.1,z],'dark'),[x,0,z]);
  const ring=band(tag+' support ring','frame',r,r-.35,.3,[x,yc-.15,z],'steel');
  const legs=[]; // legs at 0°, 60°, … so the east side (90°) is open for the lime conveyor (D-MDL-08)
  for(let n=0;n<6;n++){const a=n*Math.PI/3,lx=x+Math.sin(a)*(r-.1),lz=z+Math.cos(a)*(r-.1),h=yc-.3-.2,leg=c(tag+' support leg','frame',.16,h,[lx,.2+h/2,lz],'steel');legs.push(leg);s.join(pad,leg,[lx,.2,lz],tag+' leg / foundation');s.join(leg,ring,[lx,yc-.3,lz],tag+' leg / ring');}
  const cone=k.add(tag+' hopper outer wall','shell',hopper(false),[x,y0+SL1001_BASIS.coneHeight/2,z],'steel',undefined,undefined,{cut:true});k.add(tag+' hopper inner wall','shell',hopper(true),[x,y0+SL1001_BASIS.coneHeight/2,z],'inner',undefined,undefined,{cut:true});
  s.join(ring,cone,[x+r,yc,z],tag+' hopper / ring');s.load(cone,tag+' hopper');
  const body=band(tag+' shell','shell',r,r-.04,y1-yc,[x,(yc+y1)/2,z],'steel');body.cut=true;s.join(ring,body,[x+r,yc,z],tag+' shell / ring');s.load(body,tag+' shell');
  const roof=c(tag+' roof','head',r,.08,[x,y1+.04,z]);roof.cut=true;s.join(body,roof,[x,y1,z],tag+' roof / shell');
  return {e,x,z,r,y0,y1,tag,body,roof,cone,legs};})();
 // SL-1001 piping (D-MDL-08, QFL 2026-10-04): tanker fill in, filtered vent out, lime discharge to T-1002 out. The routes were probed against every
 // part: the east side has the overhead vent and return lines at y 8.7–11.8 m and the west side the A-160 header, so the fill riser stands on the
 // north (delivery-strip) side, which is clear. The discharge runs east at low level, under those lines. Provisional until the powder-versus-slurry
 // report: a dry screw into T-1002 follows DAT-127; the incline is about 34°, above the usual ≈ 30° limit for an enclosed screw, so the vendor must
 // confirm it or a bucket elevator replaces it. Make-up water to T-1002 and hopper aeration air are not modelled.
 {const {x,z,r,y0,y1,tag,roof,cone,legs}=sl,V3=p=>new T.Vector3(...p),t1002=EQUIPMENT[132],routeStreams=k.streams;
  // Fill (in): coupling at the delivery-strip side → isolation valve → riser (0.5 m off the shell) → over the roof → roof fill nozzle.
  setContext(668,EQUIPMENT[668].label+' piping');
  const fill=nozzle([x,y1+.08,z],[0,1,0],.22,tag+' pneumatic fill',.05),zr=z-r-.5,zc=z-r-.75;
  k.line([fill,[x,y1+.8,z],[x,y1+.8,zr],[x,2.0,zr],[x,1.2,zr],[x,1.2,zc]],.05,tag+' tanker pneumatic fill','Lime feed','BL-FILLSL1001 tanker coupling',tag+' pneumatic fill nozzle',{3:{label:'XV-SL1001-FILL tanker fill isolation',color:'green'}});
  k.boundary('BL-FILLSL1001',[x,1.2,zc],[0,0,-1],.05,'Lime feed','Closed pneumatic tanker unloading; hose, dust control and spill containment required');
  const legN=legs.find(l=>Math.abs(l.position.x-x)<1e-6&&l.position.z<z);
  for(const [host,yy,zFace] of [[legN,3,z-(r-.1)-.16],[legN,5,z-(r-.1)-.16],[null,7.5,z-r],[null,10,z-r],[null,12.5,z-r]]){const len=zFace-(zr+.06),br=b(tag+' fill riser bracket','frame',[.12,.12,Math.abs(len)],[x,yy,(zFace+zr+.06)/2],'steel');s.join(host||sl.body,br,[x,yy,zFace],tag+' riser bracket / '+(host?'leg':'shell'));}
  // Filtered vent (out): roof dust filter → clean-air vent to atmosphere.
  const fx=x+1.2,fy=y1+.08,filter=c(tag+' roof dust filter','head',.32,1.1,[fx,fy+.55,z],'steel');s.join(roof,filter,[fx,fy,z],tag+' filter / roof');s.load(filter,tag+' roof dust filter');
  const vent=nozzle([fx,fy+1.1,z],[0,1,0],.25,tag+' filtered vent',.08);k.terminal(vent,tag+' filtered vent to atmosphere (open outlet)');
  // Discharge (out): hopper outlet flange → rotary valve → inclined enclosed screw conveyor → new roof nozzle on T-1002.
  const vh=.38,valve=c(tag+' rotary valve','valve',.30,vh,[x,y0-vh/2,z],'blue');s.join(cone,valve,[x,y0,z],tag+' rotary valve / hopper outlet');
  const vdrive=c(tag+' rotary valve drive','pump',.11,.34,[x+.47,y0-vh/2,z],'blue',[1,0,0]);s.join(valve,vdrive,[x+.3,y0-vh/2,z],tag+' valve drive / valve');
  k.terminal([x,y0,z],tag+' hopper outlet flange (to rotary valve)');k.passage(valve,[[x,y0,z],[x,y0-vh,z]],tag+' rotary valve passage','Lime feed',{transport:'bulk solids'});
  setContext(132,t1002.label+' lime transfer inlet');
  const tin=nozzle([25.5,t1002.top+.08,-23.3],[0,1,0],.22,'T-1002 lime transfer inlet',.1);
  setContext(668,EQUIPMENT[668].label+' piping');
  const cr=.18,A=V3([x,y0-vh-.28+.0,z]).setY(y0-vh-(cr+.10)),Z=V3([tin[0],tin[1]+.10+cr,tin[2]]),axis=Z.clone().sub(A).normalize(),a0=A.clone().addScaledVector(axis,-.3),z0=Z.clone().addScaledVector(axis,.3);
  const conv=k.closedConveyor(668,tag+' lime screw',a0.toArray(),z0.toArray(),cr),rt=conv.route;Object.assign(rt,{service:'Lime feed',from:tag+' rotary valve',to:'T-1002 lime transfer inlet'});const st=routeStreams.find(q=>q.id===rt.id);if(st)Object.assign(st,{service:'Lime feed',from:rt.from,to:rt.to});
  const drop=cr/Math.cos(Math.asin(axis.y)); // an inclined casing is lower than its axis by r / cos(incline); the saddle top meets that line exactly
  for(const [i,t] of [[1,.3],[2,.7]]){const p=A.clone().lerp(Z,t),top=p.y-drop-.1,foot=base(b(tag+' conveyor post foot','frame',[.5,.2,.5],[p.x,.1,p.z],'dark'),[p.x,0,p.z]),post=s.beam([p.x,.2,p.z],[p.x,top,p.z],.12,tag+' conveyor post '+i),saddle=b(tag+' conveyor saddle '+i,'frame',[.4,.1,.3],[p.x,top+.05,p.z],'steel');s.join(foot,post,[p.x,.2,p.z],tag+' post '+i+' / foot');s.join(post,saddle,[p.x,top,p.z],tag+' saddle '+i+' / post');s.join(saddle,conv.casing,[p.x,top+.1,p.z],tag+' saddle '+i+' / conveyor');}}
 return {partIds:parts.slice(first).map(p=>p.id),equipment:CATCHUP_IDS,tieIns:'deferred except A-5400 (D-MDL-05)',thermalOil};
}
