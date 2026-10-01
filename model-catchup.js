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
export const CATCHUP_EQUIPMENT={
 652:eq('F-160','Pre-G acid filter · 2.54 m² (FEED-PE-DAT-106)','A-160','fixing',-14.5,-24.5,{radius:.9,bottom:1.4,top:3.4,labelY:4.6,geometryStatus:note('FEED-PE-DAT-106',' Agitated pressure filter; placed south of F-161 (no clear space beside T-161), so the R-141 feed and the cake transfer to T-161 need a re-layout — deferred.')}),
 653:eq('T-160','Recovered-acid receiver · 10 m³ (FEED-PE-DAT-107)','A-160','pregpress',-14.5,-27.6,{radius:1.1,bottom:.26,top:.26+10/(Math.PI*1.06**2),labelY:4.2,geometryStatus:note('FEED-PE-DAT-107')}),
 654:eq('P-160','Recovered-acid transfer pumps A/B · 5 m³/h × 22 m (FEED-PE-DAT-108)','A-160','pregpress',-12.4,-28.6,{labelY:2.1,geometryStatus:note('FEED-PE-DAT-108',' 1 + 1 sealless pumps.')}),
 655:eq('HR-601','Dryer exhaust heat recuperator · 2.7 MW (FEED-PE-DAT-141)','A-600','a600',66,7.8,{labelY:6.9,geometryStatus:note('FEED-PE-DAT-141',' Air-to-air envelope for ≈ 408,000 m³/h exhaust; ducting to the F-601 exhaust and the BL-601 intake deferred.')}),
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
 668:r3('SL-1001','Hydrated lime silo · 200 m³ · Ø 4.5 m (FEED-PE-DAT-127)','A-1000','wwtreat',18,-24.5,{radius:2.25,bottom:3,top:3+200/(Math.PI*2.25**2),labelY:17,geometryBasis:'D-MDL-03',geometryStatus:note3('FEED-PE-DAT-127',' Relocated inside A-1000 (D-MDL-03, QFL 2026-09-30) to the former T-1001 position, ≈ 9 m from T-1002; Ø 4.5 m chosen so the ≈ 15.6 m silo clears the overhead lines (diameter is a model choice — DAT-127 gives the volume). Tanker access from the WATER-DELIVERY frontage (z −31.5…−28.5).')}),
 656:eq('IF-A2000-CITY','Municipal make-up battery limit (D-A2000-03)','A-2000','rodistribute',103.4,-2,{designStatus:'interface',labelY:2.2,geometryStatus:'Battery-limit marker only (D-MDL-01 release 2); municipal supply pressure, hardness and connection are site data.'}),
};
CATCHUP_EQUIPMENT[669]=eq('RSV-A1100','Reserved plot — A-1100 acid concentration (Route 2 + 6 option, D-MDL-02)','A-1000','wwtreat',101,-41.5,{labelY:1.6,geometryBasis:'D-MDL-02',geometryStatus:'Plot outline only (Route 0). Holds the south-east yard for PK-1101, T-1101 / T-1102 and P-1101 / P-1102 if Route 2 + 6 is chosen after REP-039 M1–M3.'});
export const CATCHUP_IDS=Object.keys(CATCHUP_EQUIPMENT).map(Number);
// D-MDL-02 (QFL 2026-09-29, bases AR-1…AR-9): equipment that exists only under Route 2 + 6 (acid recovery), and the Route 0 reservation.
export const ACID_OPTION_IDS=[652,653,654,658,659,660,661,662];
export function applyAcidRoute(E,route){
 const byTag=tag=>Object.values(E).find(e=>e&&e.tag===tag);
 if(route==='r26'){
  delete E[669];
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
 for(const [lab,dx] of [['exhaust inlet from F-601',-2.2],['exhaust outlet to FN-601',-.8],['drying air inlet',.8],['preheated air to HX-601',2.2]])stub('HR-601 '+lab,[hr.x+dx,4.4,hr.z+1.5],[0,0,1],.45);
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
 // Route 0: the south-east yard reserved for the option — a low plot outline with a marker post (D-MDL-02 AR-6).
 if(EQUIPMENT[669]){const rv=EQUIPMENT[669];setContext(669,rv.label);
  const post=base(b('RSV-A1100 reservation marker post','frame',[.12,1.4,.12],[rv.x,.7,rv.z],'steel'),[rv.x,0,rv.z]);const sign=b('RSV-A1100 reservation sign','valve',[1.2,.5,.04],[rv.x,1.2,rv.z],'blue');s.join(post,sign,[rv.x,1.2,rv.z],'RSV-A1100 sign / post');
  for(const [lab,size,pos] of [['north',[36,.08,.15],[101,.04,-36]],['south',[36,.08,.15],[101,.04,-47]],['west',[.15,.08,11],[83,.04,-41.5]],['east',[.15,.08,11],[119,.04,-41.5]]])base(b('RSV-A1100 plot outline '+lab,'frame',size,pos,'dark'),[pos[0],0,pos[2]]);
 }
 // A-5400 — real-world package, thermal-oil mains to HX-601 and (Route 2 + 6) the PK-1101 branch on a dedicated rack (D-MDL-05).
 const thermalOil=buildThermalOil(k,s,base,{acidRoute});
 // SL-1001 — silo on a skirt.
 const sl=vessel(668);
 stub('SL-1001 pneumatic fill',[sl.x,sl.y1+.08,sl.z],[0,1,0],.05);stub('SL-1001 lime discharge to T-1002',[sl.x+sl.r,sl.y0+.4,sl.z],[1,0,0],.1);
 return {partIds:parts.slice(first).map(p=>p.id),equipment:CATCHUP_IDS,tieIns:'deferred except A-5400 (D-MDL-05)',thermalOil};
}
