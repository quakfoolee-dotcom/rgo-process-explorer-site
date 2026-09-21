import {A400_BASIS} from './a400-basis.js';

// Editable layout inputs, kept separate from PFD facts and unverified process duties.
export const A1000_INPUTS={revision:'A1000-34',designFlowM3H:100,otherSourcesAllowanceM3H:29,maximumFillFraction:.8,equalizationNormalM3:30,interruptionHours:1,peakFactor:1.2,drainbackM3:10,residenceMinutes:{R1001:15,R1002:30,R1003:20,R1004:20},qualified:false};
export function calculateA1000(i=A1000_INPUTS){
 for(const key of ['designFlowM3H','maximumFillFraction','interruptionHours','peakFactor'])if(!(i[key]>0))throw Error('Positive A-1000 input required: '+key);
 if(i.maximumFillFraction>=1)throw Error('A-1000 fill fraction must leave freeboard');
 const round=v=>Math.ceil(v/5)*5,reactors={};
 for(const [tag,minutes]of Object.entries(i.residenceMinutes)){if(!(minutes>0))throw Error('Positive residence time required');reactors[tag]={minutes,workingM3:i.designFlowM3H*minutes/60,nominalM3:round(i.designFlowM3H*minutes/60/i.maximumFillFraction)};}
 return {a400PermeateM3H:A400_BASIS.calculated.permeateM3H,a400EightModuleCapacityM3H:A400_BASIS.calculated.eightModuleRate,designFlowM3H:i.designFlowM3H,equalizationNominalM3:round((i.equalizationNormalM3+i.designFlowM3H*i.peakFactor*i.interruptionHours+i.drainbackM3)/i.maximumFillFraction),reactors,otherSourcesMeasuredM3H:null,totalWastewaterVerified:false};
}
const calc=calculateA1000(),tank=(tag,label,x,z,radius,capacityM3,operation,extra={})=>({tag,label,x,z,radius,bottom:.26,top:.26+capacityM3/(Math.PI*(radius-.04)**2),capacityM3,areaId:'A-1000',primaryOperation:operation,designStatus:'listed',geometryStatus:'Calculated layout envelope from explicit screening inputs; process sizing and materials unqualified',geometryBasis:'A1000-34',reviewNote:'Concept only. Wastewater characterization, titration, kinetics, mixing, metallurgy, containment, venting and vendor design require confirmation.',...extra});
const pump=(tag,label,x,z,operation,extra={})=>({tag,label,x,z,labelY:2.15,areaId:'A-1000',primaryOperation:operation,designStatus:'listed',geometryStatus:'Illustrative pump envelope; flow, head, NPSH, wetted materials and duty/standby selection HOLD',...extra});
export const A1000_EQUIPMENT={
 125:tank('T-1006',`Wastewater equalization · ${calc.equalizationNominalM3} m³ screening`,20,-6,3.2,calc.equalizationNominalM3,'wwcollect'),
 126:tank('R-1001',`Initial neutralization · ${calc.reactors.R1001.nominalM3} m³ screening`,29,-8,1.6,calc.reactors.R1001.nominalM3,'wwtreat'),
 127:tank('R-1002',`Lime precipitation · ${calc.reactors.R1002.nominalM3} m³ screening`,36,-8,2.05,calc.reactors.R1002.nominalM3,'wwtreat'),
 128:tank('R-1003',`Conditional sulfate polishing · ${calc.reactors.R1003.nominalM3} m³ screening`,43,-8,1.8,calc.reactors.R1003.nominalM3,'wwtreat'),
 129:tank('R-1004',`Conditioning / flocculation · ${calc.reactors.R1004.nominalM3} m³ screening`,50,-8,1.8,calc.reactors.R1004.nominalM3,'wwtreat'),
 130:pump('DC-1001','Wastewater decanter centrifuge',48,-18,'wwseparate',{labelY:3.8}),
 131:tank('T-1001','NaOH storage · provisional inventory',19,-24,1.25,20,'wwchem'),
 132:tank('T-1002','Lime slurry storage · provisional inventory',27,-24,1.25,20,'wwchem'),
 133:tank('T-1003','BaCl₂ storage · conditional duty',35,-24,.85,5,'wwchem'),
 134:tank('T-1004','HCl storage · provisional inventory',41,-24,.85,5,'wwchem'),
 135:tank('T-1005','Floc aid preparation / storage',47,-24,.65,2,'wwchem'),
 136:pump('P-1004','NaOH dosing pump',20.9,-21.6,'wwchem'),137:pump('P-1003','Lime slurry dosing pump',28.9,-21.6,'wwchem'),
 138:pump('P-1002','Conditional BaCl₂ dosing pump',36.5,-21.6,'wwchem'),139:pump('P-1001','HCl dosing pump',42.5,-21.6,'wwchem'),
 140:pump('M-1001','Floc aid metering feeder',48.3,-21.6,'wwchem'),
 141:pump('P-1005','Equalization transfer pump',24.5,-4,'wwcollect'),142:pump('P-1006','Stage 1 transfer pump',31.4,-4,'wwtreat'),
 143:pump('P-1007','Stage 2 transfer pump',38.7,-4,'wwtreat'),144:pump('P-1008','Stage 3 transfer pump',45.5,-4,'wwtreat'),
 145:pump('P-1009','Flocculated slurry feed pump',52.5,-4,'wwseparate'),146:pump('P-1010','Conditional centrifuge-bypass pump',55,-8,'wwseparate'),
 147:{tag:'BL-A2000',label:'A-2000 interarea tie-in station',x:62,z:-12,labelY:2.7,areaId:'A-2000',primaryOperation:'ropretreat',designStatus:'interface',geometryStatus:'Interarea transfer and isolated spare return interfaces; full RO train modeled separately',reviewNote:'T-2001, pretreatment, RO, product, concentrate and CIP are modeled in the A-2000 package. Footprint, inventory and site access remain provisional.'},
 148:{tag:'PL-1001',label:'A-1000 containment and access',x:15,z:-16,labelY:2.5,areaId:'A-1000',primaryOperation:'wwcollect',designStatus:'proposed',geometryStatus:'Proposed containment and access envelopes; civil design unqualified'},
 149:{tag:'BIN-1001',label:'Covered sludge collection · classification pending',x:50.4,z:-19.5,labelY:2.2,areaId:'A-1000',primaryOperation:'wwseparate',designStatus:'proposed',geometryStatus:'Proposed removable sludge container; waste classification and capacity HOLD'},
 150:tank('T-1007','Pre-G gravity-decant receiving sump',-25.5,-29.2,1.15,5,'wwcollect',{designStatus:'proposed',geometryStatus:'Proposed low receiver preserves descending Pre-G decant; capacity and vent compatibility HOLD'}),
 151:pump('P-1011','Pre-G decant lift pump',-27.2,-29.2,'wwcollect',{designStatus:'proposed'}),
 153:tank('T-1008','Low centrate receiver · 8 m³ allowance',54,-18,1.6,8,'wwseparate',{designStatus:'proposed',geometryStatus:'Proposed shallow gravity receiver. Pump control volume, flood level and required surge inventory HOLD'}),
 154:pump('P-1012','Centrate transfer / recycle pump',55.9,-20.2,'wwseparate',{designStatus:'proposed'}),
 152:{tag:'CP-1001',label:'Wastewater control and sample station',x:36,z:-1.6,labelY:2.1,areaId:'A-1000',primaryOperation:'wwtreat',designStatus:'proposed',geometryStatus:'Proposed accessible indication; no live data or approved interlocks'},
};
export const A1000_IDS=Object.keys(A1000_EQUIPMENT).map(Number);
export const WATER_AREA_LAYOUT={units:'m',wastewater:{min:[14,0,-28],max:[58,10,2]},reclaimed:{min:[60,0,-28],max:[103,10,2]},futureExpansion:{min:[105,0,-28],max:[116,10,2]},note:'Approved relative location only. Block dimensions are provisional reservations; no surveyed building, road, wind or site boundary supplied.'};
const zone=(id,kind,min,max,note,areaIds=['A-1000'])=>({id,kind,areaIds,min,max,note,designStatus:'proposed'});
export const WATER_ACCESS_ZONES=[
 zone('WALK-WATER-FRONT','pedestrian',[14,.02,2],[116,2.32,3.5],'Continuous treatment / RO approach connected to the east plant spine',['A-1000','A-2000']),
 zone('WALK-WATER-EAST','pedestrian',[116,.02,-28],[118,2.32,3.5],'Connection to existing east pedestrian spine',['A-1000','A-2000']),
 zone('WALK-WW-WEST','pedestrian',[13,.02,-28],[14.2,2.32,3.5],'Independent west access to wastewater area'),
 zone('WALK-WW-CENTRAL','pedestrian',[14.2,.02,-16],[58,2.32,-14.5],'Continuous service passage between chemical/dewatering and reactor bays'),
 zone('WALK-WATER-LINK','pedestrian',[57,.02,-28],[58.5,2.32,3.5],'Clear connection between upper service frontage and lower approach',['A-1000','A-2000']),
 zone('WATER-DELIVERY','maintenance',[14,.02,-31.5],[116,4.5,-28.5],'Reserved unloading / service frontage; actual vehicle approach and turning envelope require site plan',['A-1000','A-2000']),
 zone('REMOVE-DC1001','removal',[40,.02,-19.4],[44.3,3.6,-16.6],'Proposed axial bowl / scroll withdrawal; vendor envelope and handling plan HOLD'),
 zone('SERVICE-BIN1001','maintenance',[49.5,.02,-23.3],[52.5,3.0,-20.4],'Sludge-container exchange space; lifting route and vehicle handling HOLD'),
 zone('A1000-UTILITY','utility',[14,0,-.8],[116,9,1.7],'Overhead interarea utilities separate from pedestrian aisle',['A-1000','A-2000']),
];
export const A1000_HOLDS=[
 '100 m³/h is a proposed layout case: 71 m³/h A-400 plus 29 m³/h allowance, not a reconciled total. Actual A-160, A-300, CIP, scrubber and A-2000 return flows are unknown.',
 'Eight VSEP units screen at 62.208 m³/h versus 71 m³/h duty. Preserve the required-flow case pending capacity reconciliation.',
 'Equalization inventory uses 30 m³ normal volume, one hour at 1.2 times design flow, 10 m³ drainback and 80% maximum fill. Coordinate T-403, T-1006 and T-2001 against the batch schedule.',
 'Residence times of 15 / 30 / 20 / 20 minutes and chemical-storage inventories are provisional layout assumptions, not treatment-test results or procurement capacities.',
 'PFD R-1002 notes conflict: pH 7–10.5 versus 8.5–10.5. Manganese removal, redox requirements, flocculation, dissolved salts and sludge properties need testing.',
 'BaCl₂ is conditional, isolated by default and not an approved dosing recipe. Residual Ba / Ca / sulfate scaling and disposal limits require qualification; the draft 1500 mg/L note is not an established site permit.',
 'HCl trim before separation requires a metals-redissolution review. No pH target, chemical dose, cooling duty, relief limit or automatic trip setpoint is approved.',
 'DC-1001 bypass stays closed and blinded until the complete A-2000 acceptance basis is qualified. Centrifuge downtime alone does not permit bypass.',
 'Centrate recycle is a controlled solids-capture loop; it does not remove dissolved salts. Sludge classification remains pending characterization and applicable disposal acceptance.',
 'Unused legacy UF/backwash, CIP and scrubber tie-ins remain capped; A-2000 uses a separately modeled normal backwash return. No unverified drain, Ar or dry A-800 process connection is made.',
 'Maintenance access remains open: tank manways and low drains need a coordinated contained service arrangement; pump, actuator and decanter removal envelopes require vendor dimensions and an isolation/handling plan. Routine grade panels and reserved aisles are screened separately.',
 'Pump hydraulics, chemistry-compatible wetted materials, heat removal, mixing, vent treatment, containment capacity, foundations, vehicle access and maintenance lifting require design verification.',
];
export const A1000_BASIS={revision:'A1000-34',source:{title:'FEED-PE-PFD-001',revision:'V5.1',pages:[15,16],status:'Draft'},inputs:A1000_INPUTS,calculated:calc,layout:WATER_AREA_LAYOUT,holds:A1000_HOLDS,chemicalInventoriesBasis:'20 / 20 / 5 / 5 / 2 m³ geometric allowances only; titration and delivery schedule required',approvedSetpoints:null,measuredComposition:null,roScope:'Connected A-2000 feed / backwash interfaces; full reclaimed-water basis in A2000-40',sources:['https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1001QTR.TXT','https://www.hse.gov.uk/comah/sragtech/techmeasplantlay.htm']};
