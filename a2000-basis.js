import {A1000_INPUTS} from './a1000-basis.js';
// PFD requirements and adjustable screening assumptions are deliberately separate.
export const A2000_INPUTS={feedM3H:A1000_INPUTS.designFlowM3H,mediaRecovery:.98,ufRecovery:.925,roRecovery:.60,equalizationHours:8,maxFill:.8,productBufferHours:2,brineBufferHours:2,dutyTrains:2,standbyTrains:1,trainPermeateM3H:30,elementsPerTrain:72,elementAreaM2:37.16,qualified:false};
export function calculateA2000(i=A2000_INPUTS){
 for(const k of ['feedM3H','equalizationHours','productBufferHours','brineBufferHours','trainPermeateM3H','elementsPerTrain','elementAreaM2'])if(!Number.isFinite(i[k])||i[k]<=0)throw Error('Positive A-2000 input required: '+k);
 for(const k of ['mediaRecovery','ufRecovery','roRecovery','maxFill'])if(!Number.isFinite(i[k])||i[k]<=0||i[k]>=1)throw Error('A-2000 fraction must lie between zero and one: '+k);
 if(!Number.isInteger(i.dutyTrains)||i.dutyTrains<1||!Number.isInteger(i.standbyTrains)||i.standbyTrains<1)throw Error('A-2000 requires at least one duty and one standby train');
 const ufFeed=i.feedM3H*i.mediaRecovery,roFeed=ufFeed*i.ufRecovery,permeate=roFeed*i.roRecovery,brine=roFeed-permeate,mediaWaste=i.feedM3H-ufFeed,ufWaste=ufFeed-roFeed,round=v=>Math.ceil(v/5)*5;
 return {ufFeedM3H:ufFeed,roFeedM3H:roFeed,permeateM3H:permeate,brineM3H:brine,mediaWasteM3H:mediaWaste,ufWasteM3H:ufWaste,overallRecovery:permeate/i.feedM3H,concentrationFactor:1/(1-i.roRecovery),feedTankWorkingM3:i.feedM3H*i.equalizationHours,feedTankNominalM3:round(i.feedM3H*i.equalizationHours/i.maxFill),productTankNominalM3:round(permeate*i.productBufferHours/i.maxFill),brineTankNominalM3:round(brine*i.brineBufferHours/i.maxFill),dutyCapacityM3H:i.dutyTrains*i.trainPermeateM3H,trainFluxLmh:permeate/i.dutyTrains*1000/(i.elementsPerTrain*i.elementAreaM2),capacityFits:permeate<=i.dutyTrains*i.trainPermeateM3H,massBalanceError:i.feedM3H-permeate-brine-mediaWaste-ufWaste,plantNetRecovery:null};
}
const calc=calculateA2000();
export const A2000_QUALITY=[['TDS','< 250 mg/L'],['Chloride','< 50 mg/L'],['Sulfate','< 30 mg/L'],['Hardness as CaCO₃','< 10 mg/L'],['Iron','< 0.05 mg/L'],['Manganese','< 0.02 mg/L'],['Turbidity','< 0.2 NTU'],['Product pH','5.5–6.5'],['H₂O₂ / free chlorine','Non-detect; analytical detection limits to be agreed']];
const common={areaId:'A-2000',designStatus:'listed',geometryBasis:'A2000-40',geometryStatus:'Proposed arrangement from PFD-2000; vendor dimensions, capacities and materials unqualified',reviewNote:'Draft PFD basis. Feed chemistry, demand balance, membrane projection, pressure ratings and waste acceptance remain open.'};
const eq=(tag,label,x,z,op,extra={})=>({...common,tag,label,x,z,primaryOperation:op,labelY:3.7,...extra});
const tank=(tag,label,x,z,r,capacityM3,op,extra={})=>eq(tag,label,x,z,op,{radius:r,bottom:.26,top:.26+capacityM3/(Math.PI*(r-.04)**2),capacityM3,...extra});
export const A2000_EQUIPMENT={
 500:tank('T-2001','Condensate receiver · 15 m³ (FEED-PE-DAT-132, D-A2000-03)',66,-14.3,1.5,15,'ropretreat',{geometryStatus:'Re-purposed as the A-1100 condensate receiver, 15 m³ nominal (FEED-PE-DAT-132, D-A2000-03); diameter is a model choice. Condensate arrives at a positively blinded battery limit (Route 2 + 6 option); city make-up and NaOH pH trim enter the roof (FEED-PE-DAT-132 / 138 / 139)'}),
 504:eq('CF-2001','Condensate carbon filter · Ø 0.8 m, 0.74 m³ bed (FEED-PE-DAT-133)',70.2,-12.5,'ropretreat'),
 506:eq('P-2002','RO high-pressure pump package · A/B, 1 duty + 1 standby (FEED-PE-DAT-135; third train removed, D-A2000-03)',77.5,-15.2,'rorecover'),
 507:eq('RO-2001','Condensate polishing RO · A/B, 1 duty + 1 standby (FEED-PE-DAT-134; third train removed, D-A2000-03)',75.25,-10.15,'rorecover'),
 508:tank('T-2002','Process water tank · 100 m³ (FEED-PE-DAT-136)',64.5,-6.5,2.25,100,'rodistribute',{geometryStatus:'100 m³ nominal from FEED-PE-DAT-136 (D-A2000-03); Ø 4.5 m and about 6.5 m tall to save plot area (model choice, D-MDL-01 MC-2)'}),
 509:eq('P-2005','RO permeate distribution pump',64.5,-2.2,'rodistribute'),
 510:eq('CF-2002','Municipal make-up cartridge filter · 20 m³/h, 5 µm (FEED-PE-DAT-138)',68.5,-3.6,'rodistribute'),
 513:tank('T-2004','RO dosing skid · antiscalant 0.2 m³ + NaOH IBC (FEED-PE-DAT-139)',82.2,-9.2,.65,1,'roclean'),
 514:eq('P-2004','Antiscalant / NaOH metering pumps (FEED-PE-DAT-139)',83.5,-9.2,'roclean'),
 515:eq('CIP-2001','RO cleaning skid · sequential acid / alkaline service',85.7,-5.5,'roclean'),
 516:eq('CP-2000','Reclaimed-water control and quality station',71.8,-2.4,'rorecover',{designStatus:'proposed',labelY:2.3}),
 521:tank('TK-CIP2001-W','Segregated spent CIP hold · 5 m³ allowance',86.6,-10.6,.95,5,'roclean',{designStatus:'proposed'}),
};
for(const [i,x] of [73,77.5].entries()) A2000_EQUIPMENT[522+i]=eq('GF-RO2001'+String.fromCharCode(65+i),'Guard cartridge filter housing',x-1.3,-16.3,'ropretreat',{radius:.23,labelY:2.1,designStatus:'proposed',packageParentId:506,processAssociation:'P-2002'+String.fromCharCode(65+i),reviewNote:'Conceptual cartridge, seals, closure and supports; vendor selection, pressure rating, filtration duty and removal clearance require confirmation.'});
// D-A2000-03 (QFL 2026-09-27, basis A2-7) put A-2000 on clean sources only. The media / UF train, the backwash and brine handling and the third RO train were
// kept in place as retired by D-MDL-01 MC-1 and are removed from the model (V280): MMF-2001, GF-2001, UF-2001, P-2001, TK-UF2001, P-UF2001, TK-BW2001, P-BW2001, T-2003, P-2003, GF-RO2001C, RO-2001C, P-2002C.
export const A2000_RETIRED=[];
export const A2000_IDS=Object.keys(A2000_EQUIPMENT).map(Number);
const zone=(id,kind,min,max,note)=>({id,kind,areaIds:['A-2000'],min,max,note,designStatus:'proposed'});
export const A2000_ACCESS_ZONES=[
 zone('WALK-RO-MID','pedestrian',[60,.02,-11.5],[70,2.32,-10],'Condensate receiver / permeate tank / carbon filter access, connected to the west link'),
 zone('WALK-RO-WEST','pedestrian',[58.5,.02,-12],[60,2.32,2],'Connect water-area link to RO front approach'),
 zone('WALK-RO-FRONT','pedestrian',[61,.02,.25],[90,2.32,2],'Continuous RO service frontage; joins the water-area front aisle'),
 zone('WALK-RO-EAST','pedestrian',[79.65,.02,-18.8],[80.85,2.32,.25],'North-south aisle between the RO and the chemical block; connects the dosing, CIP, pump and RO services to the front aisle'),
 ...[73,77.5].map((x,i)=>zone('REMOVE-RO2001-'+String.fromCharCode(65+i),'removal',[x-1.55,.02,-7.7],[x+1.55,4,-5.1],'2 m end withdrawal allowance; six 40-inch elements removed sequentially; vendor tooling / access HOLD')),
];
export const A2000_SOURCES=[
 {title:'FEED-PFD-2000 · V5.1 page 16 (draft)',url:'./feed-pfd-2000.pdf'},
 {title:'WesTech · UF and RO water reuse',url:'https://www.westechwater.com/blog/water-reuse-ultrafiltration-and-reverse-osmosis'},
 {title:'Aomi · RO package examples',url:'https://aomiwater.com/tap-water-ro-systemssro/'},
 {title:'New Logic Research · S-28800 reference',url:'./s-28800-reference.pdf'},
 {title:'New Logic Research · S-36000 reference',url:'./s-36000-reference.pdf'},
 {title:'DuPont FilmTec technical manual · August 2026',url:'https://www.dupont.com/content/dam/dupont/amer/us/en/water-solutions/public/documents/en/RO-NF-FilmTec-Manual-45-D01504-en.pdf'},
 {title:'Technical Safety BC · pressure equipment design registration',url:'https://www.technicalsafetybc.ca/technologies/boilers-pressure-vessels/boiler-pressure-vessel-design-registration'},
 {title:'WorkSafeBC · chemical exposure and emergency washing',url:'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-05-chemical-and-biological-substances'},
 {title:'BC Environmental Management Act · discharge authorization',url:'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03053_02'}
];
export const A2000_HOLDS=[
 'The design basis is D-A2000-03 (FEED-PE-CAL-036): clean sources only. The RO polishes A-1100 concentrator condensate (2.62 m³/h normal, 2.97 m³/h at the 150 t/d rating), which exists only under the Route 2 + 6 option and whose tie-in is not modelled (a positively blinded battery limit is provided). The A-1000 effluent goes to sewer and no longer feeds A-2000. The screening calculator below still uses the superseded PFD-2000 inputs (100 m³/h feed, 60% recovery) and is kept for reference only.',
 'T-2001 is the 15 m³ condensate receiver (FEED-PE-DAT-132): 4 hours at the 2.97 m³/h rating. The condensate is acidic (about 100 mg/L H₂SO₄, pH ≈ 3), so a NaOH pH trim (about 5.1 kg/d from the T-2004 skid, P-2004B) is modelled into the receiver (HOLD R2). Agitation, civil, seismic, vent, overflow and access design are unqualified.',
 'RO recovery is 85% at 10 bar on low-TDS condensate (FEED-PE-DAT-134 / 135), giving 2.22–2.55 m³/h of permeate per duty train. Membrane projection, scaling limits (BaSO₄ / CaSO₄), the oxidant limit and the array must come from the RO vendor. Antiscalant does not make an incompatible feed safe.',
 'Two trains, one duty and one standby (A / B), follow the datasheet (the third train was removed, D-A2000-03). Each train is drawn as a compact 5-vessel 3:2 array of four 4-inch (4040) elements, 20 elements and about 150 m² of membrane, sized to the 3 m³/h datasheet duty (about 17 L/m²·h flux at 85% recovery). It is a model allowance, not the vendor array or a performance guarantee.',
 'FEED-PE-DAT-135 specifies vertical multistage VFD pumps, 3.5 m³/h at 113 m differential head (10 bar feed + 10%); the model draws vertical multistage pumps with a VFD motor; vendor dimensions are open. Pressure, pump curves, NPSH, minimum flows and maximum shutoff pressure require vendor verification. There is no pump between T-2001 and P-2002: the feed pumps draw through CF-2001 and the guard filters, which needs an NPSH and pressure-drop check.',
 'CF-2001 removes volatile organics from the pH-trimmed condensate (FEED-PE-DAT-133: one Ø 0.8 m vessel, 0.74 m³ bed, 15 min empty-bed contact time) and is backwashed with RO permeate from T-2002. The model draws one Ø 0.8 m vessel with two 0.81 m bed layers (0.73 m³). Loading capacity, ΔP rise and backwash frequency need testing. Do not add chlorination or a second RO pass without an approved need.',
 'Product targets are transcribed from the draft PFD, not demonstrated quality or permit limits. Conductivity alone cannot prove all targets. Release needs qualified online instruments plus laboratory acceptance; pH adjustment or polishing may be needed after trials.',
 'RO permeate (about 2.2 m³/h) supplies about 12% of the 18 m³/h design demand; the rest (about 15.8 m³/h) is city make-up filtered by CF-2002 (5 µm cartridge, FEED-PE-DAT-138) into T-2002. A cartridge filter removes no hardness, TDS or chlorine, so the city water must already meet the permeate specification (TDS below 250, SO₄ below 30, hardness below 10 mg/L). Supply data (HOLD R3) and the demand (HOLD R1) are open. Reclaimed water supplements process supply; it is not a potable emergency substitute.',
 'RO reject (0.45 m³/h per duty train), the relief lines and the carbon-filter backwash waste return to A-1000 T-1006 through one line; receiving acceptance, flow and chemistry are unqualified. The carbon filter is backwashed with RO permeate from T-2002. Spent CIP keeps a distinct, closed boundary with no assigned destination. No routine recycle to A-1000 is credited.',
 'Raised, closed antiscalant and spent-CIP bunds are geometric allowances only. Large water-tank rupture/flooding, emergency capture volume, liner compatibility, blocked drains, support loading and site containment must be qualified; no emergency-spill credit is assigned to normal process tanks.',
 'Pipe-support screening flags unresolved header supports, tank-nozzle attachments and local skid brackets. These findings remain visible in the support review; automatic rack geometry is not a completed support design. Vendor withdrawal space, structural loads and seismic attachments require detailed coordination.',
 'Apply BC pressure-equipment/piping registration, applicable codes, electrical approval, safe access and isolation requirements to the selected package. Determine TSBC applicability from the final pressure, volume, materials and piping design; supplier marketing marks do not establish BC acceptance.',
 'Waste discharge requires the applicable Environmental Management Act authorization and receiving-system acceptance. A proposed yellow ES-2000 shower/eyewash serves the chemical-service frontage; verify exposure-based placement, unobstructed access, potable supply, flow and freeze protection under WorkSafeBC Part 5. Keep process-water and potable/emergency-water systems segregated; qualify backflow protection. This model is a FEED review arrangement, not a construction issue or an operating control system.'
];
export const A2000_BASIS={revision:'A2000-40',source:{title:'FEED-PFD-2000',parent:'FEED-PE-PFD-001 V5.1',page:16,status:'Draft – Not for Use'},inputs:A2000_INPUTS,calculated:calc,qualityTargets:A2000_QUALITY,holds:A2000_HOLDS,sources:A2000_SOURCES,approvedSetpoints:null,feedAnalysis:null,regulatoryQualified:false};
