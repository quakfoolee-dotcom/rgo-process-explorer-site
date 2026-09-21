// Draft PFD requirements are separate from proposed screening and layout assumptions.
export const A3000_INPUTS={normalM3H:5000,temperatureC:40,absoluteKPa:99,waterVapourFraction:.05,superficialMS:1.5,liquidGasLM3:3,pressureDropPa:3500,fanEfficiency:.65,hclKgH:5,h2so4KgH:2,naohMassFraction:.25,naohExcess:1.15};
export function calculateA3000(i=A3000_INPUTS){
 for(const k of ['normalM3H','absoluteKPa','superficialMS','liquidGasLM3','pressureDropPa','fanEfficiency','naohMassFraction','naohExcess'])if(!Number.isFinite(i[k])||i[k]<=0)throw Error('Positive input required: '+k);
 if(!Number.isFinite(i.temperatureC)||i.temperatureC<=-273.15||!Number.isFinite(i.waterVapourFraction)||i.waterVapourFraction<0||i.waterVapourFraction>=1||i.fanEfficiency>1||i.naohMassFraction>1)throw Error('Invalid gas or liquid basis');
 for(const k of ['hclKgH','h2so4KgH'])if(!Number.isFinite(i[k])||i[k]<0)throw Error('Invalid captured acid load');
 const actual=i.normalM3H*(i.temperatureC+273.15)/273.15*101.325/i.absoluteKPa/(1-i.waterVapourFraction),area=actual/3600/i.superficialMS,stoich=i.hclKgH*40/36.4609+i.h2so4KgH*80/98.079;
 return {actualWetM3H:actual,towerAreaM2:area,screenDiameterM:Math.sqrt(4*area/Math.PI),modeledDiameterM:2,diameterFits:Math.sqrt(4*area/Math.PI)<=2,liquorM3H:actual*i.liquidGasLM3/1000,fanShaftKW:actual/3600*i.pressureDropPa/i.fanEfficiency/1000,naohPureKgH:stoich*i.naohExcess,naohSolutionKgH:stoich*i.naohExcess/i.naohMassFraction,saltKgH:i.hclKgH*58.4428/36.4609+i.h2so4KgH*142.04/98.079,blowdownM3H:null,removalEfficiency:null,qualified:false};
}
const common={areaId:'A-3000',designStatus:'listed',geometryBasis:'A3000-42',geometryStatus:'Proposed review arrangement; gas loads, vendor dimensions and materials unqualified',reviewNote:'Draft PFD-3000. Wet acid service only; source compatibility, emissions limits and protective responses remain open.'};
const e=(tag,label,x,z,primaryOperation,extra={})=>({...common,tag,label,x,z,labelY:4,primaryOperation,...extra});
const tank=(tag,label,x,z,r,bottom,top,op,extra={})=>e(tag,label,x,z,op,{radius:r,bottom,top,...extra});
export const A3000_EQUIPMENT={
 600:tank('V-3110','Wet acid vent knock-out drum',-39,2,.9,1.1,4.5,'vgcollect'),
 601:tank('T-3140','Counter-current packed acid-gas scrubber',-35.4,2,1,2.5,8.3,'vgtreat'),
 602:tank('T-3180','Scrubber liquor tank',-35.4,7,.95,.26,2.4,'vgliquor'),
 603:e('P-3181A','Recirculation pump · duty',-37.3,5.4,'vgliquor'),
 604:e('P-3181B','Recirculation pump · standby',-37.3,7.65,'vgliquor'),
 605:e('FN-3160','Induced-draft fan · VFD proposed',-38.9,5,'vgtreat'),
 606:e('ST-3170','Acid vent stack · height unqualified',-39,7.4,'vgtreat',{labelY:12}),
 607:tank('T-3182','Proposed closed NaOH day tank',-33.3,6.9,.45,.26,1.5,'vgliquor',{designStatus:'proposed'}),
 608:e('P-3182','Proposed NaOH metering pump',-33.3,8,'vgliquor',{designStatus:'proposed'}),
 609:tank('ME-3150','Proposed fine-mist polishing vessel',-35.4,4.6,.65,2.5,6.6,'vgtreat',{designStatus:'proposed'}),
 610:tank('TK-3111','Proposed sealed acidic condensate receiver',-40,3.6,.45,.26,1.2,'vgwaste',{designStatus:'proposed'}),
 611:e('P-3111','Proposed condensate transfer pump',-40.3,5.7,'vgwaste',{designStatus:'proposed'}),
 612:e('P-3183','Proposed controlled blowdown pump',-33.3,4.4,'vgwaste',{designStatus:'proposed'}),
 613:e('CP-3000','Vent treatment control station',-33.2,2,'vgcollect',{designStatus:'proposed'}),
 615:tank('TK-3184','Proposed air-gap makeup buffer',-32.6,.7,.3,.26,1.5,'vgliquor',{designStatus:'proposed'}),
 616:e('P-3184','Proposed makeup and wash pump',-33.5,.7,'vgliquor',{designStatus:'proposed'}),
 614:e('HD-3100','Compatible wet vent collection header',-39,0.8,'vgcollect',{designStatus:'proposed'}),
};
export const A3000_IDS=Object.keys(A3000_EQUIPMENT).map(Number);
export const A3000_ACCESS_ZONES=[
 {id:'WALK-VG-WEST',kind:'pedestrian',areas:['A-3000'],min:[-42,.02,0],max:[-41,2.32,10],note:'Continuous west approach; proposed 1 m clearance'},
 {id:'WALK-VG-FRONT',kind:'pedestrian',areas:['A-3000'],min:[-41,.02,8.9],max:[-32,2.32,10],note:'Grade operating and emergency-wash frontage'},
 {id:'REMOVE-T3140',kind:'removal',areas:['A-3000'],min:[-36.5,8.4,.9],max:[-34.3,12.3,3.1],note:'Vertical packing/distributor handling; vendor lifting and access plan required'},
 {id:'REMOVE-ME3150',kind:'removal',areas:['A-3000'],min:[-36.15,6.7,3.85],max:[-34.65,9.9,5.35],note:'Fine-mist element withdrawal; supplier envelope unqualified'}
];
export const A3000_REVIEW=[
 ['Critical','Common wet/dry header and General Note 1','The drawing joins A-600/700/800/900 gas with wet acid vents before V-3110.','Limit this train to qualified wet acid vents. Keep furnace/H₂/CO/borohydride, oxidizer dust, carbon dust, peroxide breathing and emergency relief separate. A caustic absorber does not establish combustible-gas destruction or explosion protection.'],
 ['Critical','No normal/peak/upset source schedule','Flow, composition, temperature, moisture, aerosol size, pressure limits and simultaneous batch peaks are absent.','Obtain measured source envelopes, oxygen and flammability assessment, credible residual reaction and emergency loads. Normal vent sizing cannot be credited for runaway relief.'],
 ['High','V-3110 is not a fine-mist guarantee','A knock-out drum removes bulk liquid; the PFD demister has no rated aerosol cut size.','Characterize sulfuric/phosphoric mist and solids. Proposed ME-3150 reserves a fiber-bed polishing duty; supplier testing must qualify efficiency, plugging and materials. Consider Venturi or WESP only when the measured duty justifies them and ignition risks are resolved.'],
 ['Critical','Scrubber bypass EX3003','The PFD shows a normally closed bypass directly to the fan.','Remove the installed bypass from the operating design. Retain a positively blinded review stub only. Maintenance requires cessation of emissions and a qualified residual-gas plan or an independently available treatment train; never use routine untreated bypass.'],
 ['High','Negative pressure and failure response','A single fan is shown; no pressure budget or upstream protective response is specified.','Coordinate local vessel pressure limits and fan controls. Loss of draft, liquid circulation, pH control or high differential pressure inhibits new feed/heat and alarms. Keep available treatment running for residual emissions; do not automatically close every vessel vent. Assess standby fan and backup power from residual-emission risk.'],
 ['High','Liquid drainage under suction','EX3010 return and condensate drains lack seal and pressure-balance details.','Provide closed pressure-balanced liquid return, maintained seals/leg height and a sealed condensate receiver with pumped export. Avoid air ingress, gas bypass, siphoning and overhead gravity drains. Verify maximum differential pressure and all low points.'],
 ['High','Liquor control and salt loading','NaOH, water and blowdown are shown without control criteria.','Add pH/level/flow/temperature and conductivity monitoring, pump suction/discharge isolation and non-return valves. Determine blowdown from measured salt and water balance. Neutralization creates salts; A-1000 does not necessarily remove dissolved chloride/sulfate before A-2000 RO.'],
 ['High','Fine-mist and fan drainage','Demister wash, dirty-side differential pressure, fan casing drain and stack condensate management are not detailed.','Add controlled washing, differential-pressure indication, closed low-point collection and corrosion-compatible fan/ductwork. Stack height, velocity, sampling access and dispersion must follow the selected permit basis.'],
 ['High','Materials and temperature','Corrosion-resistant is stated without a chemical/thermal envelope.','Select resin, thermoplastic, alloy, gasket and fan materials using acids, oxidants, caustic, chlorides, temperature and fire/structural constraints. Add gas cooling only if measured conditions require it; a KO drum is not a condenser without a heat-removal duty.'],
 ['Medium','T-3180 / TK-3180 mismatch','The drawing labels T-3180; General Notes 4 and 6 use TK-3180.','Use T-3180 consistently in the model and reconcile the equipment register. P-3181A/B remain the listed duty/standby recirculation pumps.'],
 ['Medium','Area-source inconsistencies','A-900 is labeled Furnace Gas, although the area index names Cartridge Filling. A-400/500 are omitted.','Confirm the A-900 stream against PFD-900. Review aqueous A-400/500 tank vents, A-160 dryer vacuum exhaust and each A-1000 vessel individually; an area name is not a compatibility classification.'],
 ['High','Emission acceptance and BC jurisdiction','Permit point is shown without pollutant limits or site jurisdiction.','Confirm location and the applicable air authorization; within Metro Vancouver consult its air permitting program. Address WorkSafeBC Part 5 source capture, failure warning, makeup air and combustible-exhaust segregation; qualify pressure equipment, electrical, access, containment and structural requirements as applicable.']
];
export const A3000_SOURCES=[
 ['Revised FEED-PFD-3000 · proposed P01 · two sheets','./feed-pfd-3000-p01.pdf'],
 ['FEED-PFD-3000 · V5.1 page 17 · draft','./feed-pfd-3000.pdf'],
 ['US EPA · thermal oxidation mechanism','https://www.epa.gov/air-emissions-monitoring-knowledge-base/monitoring-control-technique-thermal-oxidizer'],
 ['Envitech · treatment systems','https://envitechinc.com/systems/'],
 ['Envitech · gas conditioning, absorption and particulate equipment','https://envitechinc.com/products/'],
 ['US EPA · wet scrubbers for gaseous control','https://www.epa.gov/air-emissions-monitoring-knowledge-base/monitoring-control-technique-wet-scrubber-gaseous-control'],
 ['US EPA · packed-bed scrubber fact sheet','https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P1008OGN.TXT'],
 ['Elessent MECS Brink · fine-aerosol fiber beds','https://elessentct.com/technologies/mecs/mecsr-brinkr-fiber-bed-mist-eliminators/'],
 ['WorkSafeBC · Part 5 chemical agents and ventilation','https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-05-chemical-and-biological-substances'],
 ['Metro Vancouver · air permit application','https://metrovancouver.org/services/environmental-regulation-enforcement/air-quality-regulatory-program/apply-for-a-permit'],
 ['BC · Environmental Management Act','https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/03053_02']
];
export const A3000_BASIS={revision:'A3000-42',source:{id:'feed-pfd-v51',revision:'V5.1',page:17,status:'Draft – Not for Use'},inputs:A3000_INPUTS,calculated:calculateA3000(),review:A3000_REVIEW,sources:A3000_SOURCES,approvedSetpoints:null,sourceGasAnalysis:null,emissionsPermit:null,qualified:false,scope:'Proposed compatible wet acid-gas train; separate thermal/reactive and dry packages are proposed layout envelopes; treatment selection and operating release remain HOLD.'};
