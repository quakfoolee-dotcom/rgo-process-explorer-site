// A-2000 process water on the city supply (QFL 2026-10-10: Route 0 baseline, no A-1100 condensate, A-1000 effluent to sewer).
// Basis: FEED-PE-MDL-008 V25 city-water side at the modelled user draw (PW-4 RO water, PW-6 process water). PFD requirements and adjustable screening assumptions are deliberately separate.
export const A2000_INPUTS={pw4M3H:19.6,pw6M3H:12.4,roRecovery:.75,rejection:.99,pw4BufferHours:2,maxFill:.8,fluxLmh:14.7,elementAreaM2:37.16,elementsPerVessel:3,qualified:false};
export function calculateA2000(i=A2000_INPUTS){
 for(const k of ['pw4M3H','pw6M3H','pw4BufferHours','fluxLmh','elementAreaM2','elementsPerVessel'])if(!Number.isFinite(i[k])||i[k]<=0)throw Error('Positive A-2000 input required: '+k);
 for(const k of ['roRecovery','rejection','maxFill'])if(!Number.isFinite(i[k])||i[k]<=0||i[k]>=1)throw Error('A-2000 fraction must lie between zero and one: '+k);
 const roFeed=i.pw4M3H/i.roRecovery,reject=roFeed-i.pw4M3H,balance=i.pw6M3H-reject,cityTotal=roFeed+Math.max(balance,0),round=v=>Math.ceil(v/5)*5,elements=Math.ceil(i.pw4M3H*1000/(i.fluxLmh*i.elementAreaM2)),vessels=Math.ceil(elements/i.elementsPerVessel);
 return {demandM3H:i.pw4M3H+i.pw6M3H,roFeedM3H:roFeed,permeateM3H:i.pw4M3H,rejectM3H:reject,cityBalanceM3H:Math.max(balance,0),cityTotalM3H:cityTotal,rejectFitsPw6:balance>=0,concentrationFactor:1/(1-i.roRecovery),pw4TankNominalM3:round(i.pw4M3H*i.pw4BufferHours/i.maxFill),elements,vessels,fluxLmh:i.pw4M3H*1000/(vessels*i.elementsPerVessel*i.elementAreaM2),massBalanceError:cityTotal-i.pw4M3H-i.pw6M3H+Math.min(balance,0),plantNetRecovery:null};
}
const calc=calculateA2000();
export const A2000_QUALITY=[['TDS','< 250 mg/L'],['Chloride','< 50 mg/L'],['Sulfate','< 30 mg/L'],['Hardness as CaCO₃','< 10 mg/L'],['Iron','< 0.05 mg/L'],['Manganese','< 0.02 mg/L'],['Turbidity','< 0.2 NTU'],['Product pH','5.5–6.5'],['H₂O₂ / free chlorine','Non-detect; analytical detection limits to be agreed']];
// RO-2011 skid (V357): twelve 8-inch vessels of three 40-inch elements in a 3 x 4 grid (8 + 4 array), vessels along z. Shared with reclaimed-water.js and the access zones.
export const RO2011={x:73,zf:-12.7,zb:-8.9,elementsPerVessel:3};
const common={areaId:'A-2000',designStatus:'listed',geometryBasis:'A2000-43',geometryStatus:'Proposed arrangement from PFD Rev G and the MDL-008 V25 flowsheet; vendor dimensions, capacities and materials unqualified',reviewNote:'Draft basis. City water quality, demand balance, membrane projection, pressure ratings and waste acceptance remain open.'};
const eq=(tag,label,x,z,op,extra={})=>({...common,tag,label,x,z,primaryOperation:op,labelY:3.7,...extra});
const tank=(tag,label,x,z,r,capacityM3,op,extra={})=>eq(tag,label,x,z,op,{radius:r,bottom:.26,top:.26+capacityM3/(Math.PI*(r-.04)**2),capacityM3,...extra});
export const A2000_EQUIPMENT={
 501:tank('T-2011','PW-4 RO water tank · about 50 m³ (MDL-008 provisional)',63.5,-14.3,1.75,50,'rodistribute',{designStatus:'proposed',geometryStatus:'About 2 h of the 19.6 m³/h PW-4 draw; provisional tag from the MDL-008 V25 flowsheet (ruling A20-03). Diameter and height are model choices.'}),
 502:eq('P-2011','PW-4 RO water pump · A/B (provisional)',66.2,-12.17,'rodistribute',{designStatus:'proposed'}),
 506:eq('P-2012','RO-2011 feed pump · vertical multistage VFD (provisional)',73.3,-14.7,'rorecover',{designStatus:'proposed'}),
 507:eq('RO-2011','City-water RO · 75 % recovery, twelve 8-inch vessels of three elements (provisional)',73,-12,'rorecover',{designStatus:'proposed'}),
 508:tank('T-2002','Process water tank · 100 m³ (FEED-PE-DAT-136)',63.5,-6.5,2.25,100,'rodistribute',{geometryStatus:'100 m³ nominal from FEED-PE-DAT-136 (D-A2000-03); Ø 4.5 m and about 6.5 m tall to save plot area (model choice, D-MDL-01 MC-2). PW-6 process water: RO-2011 reject plus carbon-filtered city make-up'}),
 509:eq('P-2005','PW-6 process-water pump',63.5,-2.2,'rodistribute'),
 510:eq('CF-2002','City make-up carbon filter · dechlorination, about 32 m³/h (FEED-PE-DAT-138 reconcile)',67.5,-3.6,'rodistribute'),
 513:tank('T-2004','RO dosing skid · antiscalant 0.2 m³ (FEED-PE-DAT-139)',80.45,-7.45,.65,1,'roclean'),
 514:eq('P-2004','Antiscalant metering pump (FEED-PE-DAT-139)',81.75,-7.45,'roclean'),
 515:eq('CIP-2001','RO cleaning skid · sequential acid / alkaline service',83.95,-3.75,'roclean'),
 516:eq('CP-2000','Reclaimed-water control and quality station',69,-2.4,'rorecover',{designStatus:'proposed',labelY:2.3}),
 521:tank('TK-CIP2001-W','Segregated spent CIP hold · 5 m³ allowance',84.85,-8.85,.95,5,'roclean',{designStatus:'proposed'}),
 522:eq('CF-2003','RO-2011 guard cartridge filter housing',72,-14.7,'ropretreat',{radius:.23,labelY:2.1,designStatus:'proposed',packageParentId:506,processAssociation:'P-2012',reviewNote:'Conceptual cartridge, seals, closure and supports; vendor selection, pressure rating, filtration duty and removal clearance require confirmation.'}),
};
// D-A2000-03 (QFL 2026-09-27) put A-2000 on clean sources only; V280 removed the media / UF train, the backwash and brine handling and the third RO train: MMF-2001, GF-2001, UF-2001, P-2001, TK-UF2001, P-UF2001, TK-BW2001, P-BW2001, T-2003, P-2003, GF-RO2001C, RO-2001C, P-2002C.
// QFL 2026-10-10: Route 0 is the baseline, so there is no A-1100 condensate. The condensate train is removed: T-2001, CF-2001, P-2002 A/B, RO-2001 A/B, GF-RO2001A/B, the NaOH pH-trim pump P-2004B and the blinded condensate inlet BL-A2000-COND. RO-2011, T-2011, P-2011, P-2012 and CF-2003 reuse their equipment ids.
export const A2000_RETIRED=[];
export const A2000_IDS=Object.keys(A2000_EQUIPMENT).map(Number);
const zone=(id,kind,min,max,note)=>({id,kind,areaIds:['A-2000'],min,max,note,designStatus:'proposed'});
export const A2000_ACCESS_ZONES=[
 zone('WALK-RO-MID','pedestrian',[58.35,.02,-11.5],[69.5,2.32,-10],'T-2011 / T-2002 tank and pump access, connected to the west link'),
 zone('WALK-RO-WEST','pedestrian',[57.15,.02,-12],[58.35,2.32,2],'Connect water-area link to RO front approach'),
 zone('WALK-RO-FRONT','pedestrian',[61,.02,.25],[88.25,2.32,2],'Continuous RO service frontage; joins the water-area front aisle'),
 zone('WALK-RO-EAST','pedestrian',[77.9,.02,-17.05],[79.1,2.32,.25],'North-south aisle between the RO and the chemical block; connects the dosing, CIP, pump and RO services to the front aisle'),
 zone('REMOVE-RO2011','removal',[RO2011.x-1.55,.02,RO2011.zb+.05],[RO2011.x+1.55,4,RO2011.zb+2.65],'2 m end withdrawal allowance; three 40-inch elements per vessel removed sequentially; vendor tooling / access HOLD'),
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
 'The design basis is QFL 2026-10-10 on the FEED-PE-MDL-008 V25 flowsheet: Route 0 (no acid recovery) is the baseline, so there is no A-1100 condensate and A-2000 treats the city supply only. The A-1000 effluent goes to sewer (hold A10-10) and its battery limit stays blinded; reclaim of that effluent was closed because the design effluent is about 21,000 mg/L TDS and needs seawater-class RO and gypsum control. Under Route 2 + 6 a condensate train would have to be re-added.',
 'The model users draw 32.0 m³/h (PW-4 RO water 19.6, PW-6 process water 12.4) against the 18 m³/h CAL-036 A2-1 design demand (ruling A20-02); CAL-036 needs a re-rate. At the 32 m³/h draw the city supplies about 32 m³/h in total. The calculator below uses that draw; city water quality (HOLD R3) and the demand (HOLD R1) are open.',
 'RO-2011 (provisional tag, ruling A20-03) polishes the carbon-filtered city water at 75 % recovery: 26.1 m³/h feed, 19.6 m³/h permeate to T-2011 for the PW-4 users, 6.5 m³/h reject reused in T-2002 for PW-6. The reject carries about four times the city TDS, so PW-6 stays under TDS 250 mg/L only while the city TDS is below about 62 mg/L. There is no standby train: availability is an open design point.',
 'The model draws one packaged skid of twelve 8-inch vessels (an 8 + 4 array) with three 40-inch elements each, 36 elements and about 1,340 m² of membrane (about 14.7 L/m²·h; the earlier allowance was 30 elements at about 18 L/m²·h). It is a model allowance, not the vendor array or a performance guarantee. Membrane projection, scaling limits, the oxidant limit and the array must come from the RO vendor. Antiscalant does not make an incompatible feed safe.',
 'P-2012 is a vertical multistage VFD pump for the RO-2011 feed; pressure, pump curves, NPSH, minimum flow and shutoff pressure require vendor verification. CF-2003 is the RO-2011 guard cartridge filter. An ORP high-high interlock on the feed stops P-2012 to protect the membrane (proposed, not a PLC / SIS sequence).',
 'CF-2002 is a carbon filter that removes the chlorine residual from the city water ahead of T-2002 and RO-2011. The workbook shows carbon while FEED-PE-DAT-138 shows a 5 µm cartridge: reconcile the datasheet. The model carbon vessel is sized for about 32 m³/h; loading, ΔP rise and backwash frequency need testing. Backwash is not drawn.',
 'Product targets are transcribed from the draft PFD, not demonstrated quality or permit limits. Conductivity alone cannot prove all targets. Release needs qualified online instruments plus laboratory acceptance; pH adjustment or polishing may be needed after trials.',
 'T-2011 holds about 2 h of the PW-4 draw (about 50 m³) and T-2002 100 m³ for PW-6. LV-2002 tops T-2002 up with city water on level; BFP-2001 and the meter FT-2005 protect and measure the city supply. The five existing RO-water consumers (A-400, A-160, A-200) are PW-4 users and are fed from P-2011; the PW-6 consumers (scrubber make-up, lime slurry) are not modelled yet and P-2005 ends at a blinded boundary.',
 'RO-2011 reject and the relief lines return to T-2002. Spent CIP keeps a distinct, closed boundary with no assigned destination. The A-1000 effluent is not routed to A-2000.',
 'Raised, closed antiscalant and spent-CIP bunds are geometric allowances only. Large water-tank rupture/flooding, emergency capture volume, liner compatibility, blocked drains, support loading and site containment must be qualified; no emergency-spill credit is assigned to normal process tanks.',
 'Pipe-support screening flags unresolved header supports, tank-nozzle attachments and local skid brackets. These findings remain visible in the support review; automatic rack geometry is not a completed support design. Vendor withdrawal space, structural loads and seismic attachments require detailed coordination.',
 'Apply BC pressure-equipment/piping registration, applicable codes, electrical approval, safe access and isolation requirements to the selected package. Determine TSBC applicability from the final pressure, volume, materials and piping design; supplier marketing marks do not establish BC acceptance.',
 'Waste discharge requires the applicable Environmental Management Act authorization and receiving-system acceptance. A proposed yellow ES-2000 shower/eyewash serves the chemical-service frontage; verify exposure-based placement, unobstructed access, potable supply, flow and freeze protection under WorkSafeBC Part 5. Keep process-water and potable/emergency-water systems segregated; qualify backflow protection. This model is a FEED review arrangement, not a construction issue or an operating control system.'
];
export const A2000_BASIS={revision:'A2000-43',source:{title:'FEED-PFD-2000',parent:'FEED-PE-PFD-001 V5.1',page:16,status:'Draft – Not for Use'},inputs:A2000_INPUTS,calculated:calc,qualityTargets:A2000_QUALITY,holds:A2000_HOLDS,sources:A2000_SOURCES,approvedSetpoints:null,feedAnalysis:null,regulatoryQualified:false};
