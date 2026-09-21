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
 500:tank('T-2001','RO feed equalization · 1,000 m³ nominal screening',67,-20,6,calc.feedTankNominalM3,'ropretreat'),
 501:eq('P-2001','Feed / media backwash pump',74,-13.7,'ropretreat'),
 502:eq('MMF-2001','Multimedia filtration · parallel vessel allowance',64,-6.7,'ropretreat'),
 503:eq('GF-2001','Greensand Fe / Mn filtration · parallel allowance',70,-6.7,'ropretreat'),
 504:eq('CF-2001','Carbon filtration · oxidant / organic reduction',76,-6.7,'ropretreat'),
 505:eq('UF-2001','Dead-end ultrafiltration · two backwash banks',79,-21,'ropretreat',{reviewNote:'Conceptual supported feed and filtrate manifolds with separate bank waste isolation. Welded tees/elbows and removable clamped module joints are illustrative; material, pressure rating, hydraulic sizing and vendor connection specification remain open. Disconnect upper branch spools before vertical module removal. BL-UF2001-CEB is a design hold with no modeled pipe connection.'}),
 506:eq('P-2002','RO high-pressure pump package · A/B duty, C standby',85.5,-15.2,'rorecover'),
 507:eq('RO-2001','Single-pass RO · A/B duty, C standby',85.5,-9,'rorecover'),
 508:tank('T-2002','RO permeate storage · 140 m³ screening',97,-6,3.2,calc.productTankNominalM3,'rodistribute'),
 509:eq('P-2005','RO permeate distribution pump',97,-1.7,'rodistribute'),
 510:eq('CF-2002','Final cartridge polishing · 0.2–1 µm PFD range',100,-2,'rodistribute'),
 511:tank('T-2003','RO concentrate storage · 95 m³ screening',97,-21,2.7,calc.brineTankNominalM3,'rowaste'),
 512:eq('P-2003','Concentrate transfer pump',100.7,-21,'rowaste'),
 513:tank('T-2004','Contained antiscalant day tank · 1 m³ allowance',86,-24.2,.65,1,'roclean'),
 514:eq('P-2004','Antiscalant metering pump',87.3,-24.2,'roclean'),
 515:eq('CIP-2001','RO cleaning skid · sequential acid / alkaline service',89.5,-20.5,'roclean'),
 516:eq('CP-2000','Reclaimed-water control and quality station',91.7,-2,'rorecover',{designStatus:'proposed',labelY:2.3}),
 517:tank('TK-UF2001','UF filtrate / backwash buffer · 10 m³ allowance',83,-21,1.15,10,'ropretreat',{designStatus:'proposed'}),
 518:eq('P-UF2001','UF filtrate transfer / backwash pump',84.7,-21,'ropretreat',{designStatus:'proposed'}),
 519:tank('TK-BW2001','Backwash collection · 10 m³ allowance',76,-26.1,1.1,10,'rowaste',{designStatus:'proposed'}),
 520:eq('P-BW2001','Backwash lift to A-1000',77.7,-26.1,'rowaste',{designStatus:'proposed'}),
 521:tank('TK-CIP2001-W','Segregated spent CIP hold · 5 m³ allowance',90.4,-25.6,.95,5,'roclean',{designStatus:'proposed'}),
};
for(const [i,x] of [81,85.5,90].entries()) A2000_EQUIPMENT[522+i]=eq('GF-RO2001'+String.fromCharCode(65+i),'Guard cartridge filter housing',x-1.3,-16.3,'ropretreat',{radius:.23,labelY:2.1,designStatus:'proposed',packageParentId:506,processAssociation:'P-2002'+String.fromCharCode(65+i),reviewNote:'Conceptual cartridge, seals, closure and supports; vendor selection, pressure rating, filtration duty and removal clearance require confirmation.'});
export const A2000_IDS=Object.keys(A2000_EQUIPMENT).map(Number);
const zone=(id,kind,min,max,note)=>({id,kind,areaIds:['A-2000'],min,max,note,designStatus:'proposed'});
export const A2000_ACCESS_ZONES=[
 zone('WALK-RO-MID','pedestrian',[60,.02,-12],[73,2.32,-10.5],'RO feed tank / media access, connected to the west link'),
 zone('WALK-RO-WEST','pedestrian',[58.5,.02,-12],[60,2.32,2],'Connect water-area link to RO front approach'),
 zone('WALK-RO-FRONT','pedestrian',[61,.02,.25],[103,2.32,2],'Continuous RO service frontage; joins the water-area front aisle'),
 zone('WALK-RO-EAST','pedestrian',[101.5,.02,-28],[103,2.32,.25],'East-side passage connects concentrate, CIP and product services'),
 ...[81,85.5,90].map((x,i)=>zone('REMOVE-RO2001-'+String.fromCharCode(65+i),'removal',[x-1.55,.02,-5.4],[x+1.55,4,-2.8],'2 m end withdrawal allowance; six 40-inch elements removed sequentially; vendor tooling / access HOLD')),
 ...[0,1].flatMap(bank=>Array.from({length:10},(_,j)=>{const x=77.7+j*.285,z=-22.3+bank*2.4;return zone('REMOVE-UF2001-'+bank+'-'+j,'removal',[x-.14,3.125,z-.14],[x+.14,6,z+.14],'Single-module vertical withdrawal: isolate and drain bank; remove upper connection spool first. Vendor lifting envelope provisional.');})),
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
 '100 m³/h is inherited from the A-1000 screening case, not measured centrate production. The 98% media yield is an added allowance; UF 92.5% is within the PFD 90–95% range. Returned backwash, off-spec recycle, CIP, outages and batch peaks require a plant-wide balance.',
 'T-2001 uses the lower PFD recommendation of 8–12 hours: 800 m³ working / 1,000 m³ nominal at 80% fill. At 12 hours it becomes 1,500 m³ nominal. Agitation is included; civil, seismic, vent, overflow and access design are unqualified.',
 'RO base recovery is the PFD 60%. Higher 70–75% cases require measured Ba, Ca, sulfate, silica and full ionic analysis, membrane projection and an accepted concentrate outlet. UF does not remove dissolved salts; antiscalant does not make an incompatible feed safe.',
 'Three conceptual 72-element trains implement N=2 duty plus one standby. Each 30 m³/h allowance uses a proposed 12-vessel, six-element, 8:4 staging arrangement. It is not the supplier S-28800 skid geometry or a vendor performance guarantee. S-28800 / S-36000 areas are references, not gallons-per-day ratings.',
 'PFD P-2002 specifies horizontal multistage VFD pumps and a draft 12–16 bar / ≥82% combined efficiency target. Pressure, cold-water flux, pump curves, NPSH, minimum flows and maximum shutoff pressure require vendor verification. Common pretreatment/distribution pumps remain availability bottlenecks.',
 'Carbon protects against oxidants but removal capacity and H₂O₂ breakthrough need testing. Greensand regeneration chemistry and carryover are unqualified. Do not add chlorination or a second RO pass without an approved need. Post-UF guard cartridges are proposed for pump/membrane protection.',
 'Product targets are transcribed from the draft PFD, not demonstrated quality or permit limits. Conductivity alone cannot prove all targets. Release needs qualified online instruments plus laboratory acceptance; pH adjustment or polishing may be needed after trials.',
 'At the base screening case, permeate is below the existing 71 m³/h A-400 washing duty alone. Reclaimed water supplements process supply; it is not a proven closed water loop or a substitute for independent potable emergency water.',
 'UF and media backwash collect in TK-BW2001 and are lifted to A-1000 T-1006. Chemical CEB requires a vendor-designed, separately isolated route to spent-CIP collection; the interface remains unmodeled pending design. Concentrate and CIP retain distinct, closed disposal boundaries pending characterization and authorized destinations. No routine concentrate recycle to A-1000 is credited.',
 'Raised, closed antiscalant and spent-CIP bunds are geometric allowances only. Large water-tank rupture/flooding, emergency capture volume, liner compatibility, blocked drains, support loading and site containment must be qualified; no emergency-spill credit is assigned to normal process tanks.',
 'Pipe-support screening flags unresolved header supports, tank-nozzle attachments and local skid brackets. These findings remain visible in the support review; automatic rack geometry is not a completed support design. Vendor withdrawal space, structural loads and seismic attachments require detailed coordination.',
 'Apply BC pressure-equipment/piping registration, applicable codes, electrical approval, safe access and isolation requirements to the selected package. Determine TSBC applicability from the final pressure, volume, materials and piping design; supplier marketing marks do not establish BC acceptance.',
 'Waste discharge requires the applicable Environmental Management Act authorization and receiving-system acceptance. A proposed yellow ES-2000 shower/eyewash serves the chemical-service frontage; verify exposure-based placement, unobstructed access, potable supply, flow and freeze protection under WorkSafeBC Part 5. Keep process-water and potable/emergency-water systems segregated; qualify backflow protection. This model is a FEED review arrangement, not a construction issue or an operating control system.'
];
export const A2000_BASIS={revision:'A2000-40',source:{title:'FEED-PFD-2000',parent:'FEED-PE-PFD-001 V5.1',page:16,status:'Draft – Not for Use'},inputs:A2000_INPUTS,calculated:calc,qualityTargets:A2000_QUALITY,holds:A2000_HOLDS,sources:A2000_SOURCES,approvedSetpoints:null,feedAnalysis:null,regulatoryQualified:false};
