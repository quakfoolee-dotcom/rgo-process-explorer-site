import {temperatureCapability} from './thermal-capability.js';
import {temperatureColour} from './a5000-basis.js';

// Transcribed from the supplied draft. Process observations never supply a
// secondary-fluid temperature, casing temperature, alarm setting or live value.
export const PFD_TEMPERATURE_SOURCE={title:'FEED-PE-PFD-001',revision:'V5.1',status:'Draft — not for use',href:'./pfd-temperature-sheets.pdf'};
const phase=(id,label,minC,maxC=minC,status='PFD design target')=>({id,label,minC,maxC,status});
const unknown=(label='Normal operation')=>phase('normal',label,null,null,'Not specified in PFD');
const row=(id,tag,area,label,page,phases,extra={})=>({id,tag,area,label,page,phases,kind:'process',note:'Process contents; not the jacket fluid or external surface.',...extra});
export const PFD_TEMPERATURES=[
 ...[...'ABCD'].map(b=>row('R-141'+b,'R-141'+b,'A-140','Reaction slurry',5,[phase('reaction','Reaction / hold',80),phase('cooldown','Cooled slurry before transfer',10,20,'Approximate PFD target')],{limits:['Conflicting oxidant shutdown notes: >88 °C and >90 °C. Reconcile before selecting a protective setting.']})),
 row('T-161','T-161','A-160','Fixing inventory',6,[unknown()],{limits:['Stop Pre-G feed above 50 °C if the fixing tank is HDPE. Conditional PFD limit; not a normal setpoint.']}),
 row('D-164','D-164','A-160','Drying material',6,[unknown('Drying')],{note:'PFD lists dryer alternatives without a numeric operating temperature. Heating-medium selection remains open.'}),
 row('FD-166','FD-166','A-160','Drying material · integrated alternative',6,[unknown('Drying')],{note:'Proposed integrated alternative; no PFD operating temperature is assigned.'}),
 ...[...'ABCD'].map(b=>row('R-201'+b,'R-201'+b,'A-200','Reaction slurry',7,[phase('reaction','Oxidation / hold',45,50),phase('cooldown','Cooldown before transfer',10)],{note:'PFD nominal reaction target: 47.5 ±2.5 °C. Cooldown target: 10 °C. Neither establishes jacket supply / return.',limits:['45–50 °C operating range conflicts with a separate ≤49 °C safety note. Reconcile before selecting operating and protective settings.']})),
 row('T-303','T-303','A-300','Quench inventory',8,[unknown()],{note:'Cooling is identified, but normal process and secondary-coil supply / return temperatures are not specified. The HCl limit belongs to the acid-addition/transfer operation.'}),
 row('T-305','T-305','A-300','HCl acid wash',8,[unknown()],{limits:['≤50 °C during HCl addition / transfer. This is an operational limit, not a specified normal temperature.']}),
 row('HX-501-out','E-501','A-500','Conditioned TLGO outlet',10,[phase('outlet','Outlet to A-600',30,40)],{pfdTag:'HX-501',note:'PFD HX-501 duty is modeled as E-501; tag reconciliation remains open. Target applies to TLGO leaving conditioning, not cooling-water return.'}),
 row('DR-601-in','DR-601','A-600','Drying-air inlet',11,[phase('drying','Drying',140,145,'Typical PFD range · provisional')],{port:'DR-601 hot gas inlet',note:'Typical inlet indication. General notes still call final inlet / outlet temperatures TBD; vendor confirmation required.'}),
 row('DR-601-out','DR-601','A-600','Dryer exhaust outlet',11,[phase('drying','Drying',80,90,'Typical PFD range · provisional')],{port:'DR-601 powder laden exhaust',note:'Outlet gas / entrained fines toward F-601. This is not the liquid-feed or discharged-product temperature.'}),
 row('T-602-out','T-602','A-600','Discharged dry product',11,[phase('discharge','Product discharge',60,100,'Approximate PFD range · explicitly TBD')],{note:'PFD discharge range remains TBD. No temperature is inferred for the receiving tank surface.'}),
 row('HX-601-medium','HX-601','A-600','Heating medium',11,[unknown('Heating service')],{kind:'utility',note:'Heating medium is TBD (steam / gas / electric). A 95 °C hot-water source alone cannot produce 140–145 °C drying air by ordinary heat exchange.'}),
 row('PY-701-zone','PY-701','A-700','Reaction / holding zone',12,[phase('reaction','Reaction zone',1100)],{zone:'PY-701 Reaction / holding insulation sleeve',note:'Reaction-zone temperature only. Heating ramp is 5 °C/min in the PFD; no timed ramp is simulated. Cooling zone, jacket and outer casing are separate.'}),
 row('T-702-product','T-702','A-700','Cooled solids / storage handoff',12,[phase('cooled','After cooling',60,80)],{note:'PFD solids target before storage. Model adds E-702; allocation between PY-701 internal cooling and E-702 remains unresolved.'}),
 row('E-701-out','E-701','A-700','Cooled off-gas before fan',12,[phase('outlet','Cooler outlet',60,90)],{route:'E-701 condensate slope to KO-701',note:'Off-gas temperature after cooling and before the fan. Cooling-water temperatures are separate.'}),
 row('PY-801-zone','PY-801','A-800','Furnace operating zone',13,[phase('reaction','Furnace operation',750)],{note:'Furnace process temperature only. PFD ramp: 5 °C/min; no timed ramp or outer-surface temperature is inferred.'}),
 row('E-801-out','E-801','A-800','Cooled off-gas before fan',13,[phase('outlet','Cooler outlet',60,90)],{route:'E-801 cooled off-gas to fan',note:'Off-gas outlet target before FN-801. Cooling-water inlet / return and cooled product temperature remain separate.'}),
 row('R-1001','R-1001','A-1000','Neutralization inventory',15,[unknown()],{note:'PFD identifies temperature monitoring and possible exothermic cooling duty without a numerical process setpoint.'})
];
export const PFD_TEMPERATURE_FINDINGS=[
 {id:'TEMP-R141',area:'A-140',page:5,title:'R-141 shutdown conflict',reason:'Oxidant shutdown appears as >88 °C and >90 °C. Reconcile the control and protective limits; neither is used as a normal temperature.'},
 {id:'TEMP-R201',area:'A-200',page:7,title:'R-201 range conflict',reason:'45–50 °C operation conflicts with the separate ≤49 °C requirement. TCU-201 is already connected to chilled water in the model. Its draft 5–7 °C supply leaves only 3–5 K to the 10 °C process target across the primary exchanger and reactor jacket; cooldown performance remains unqualified.'},
 {id:'TEMP-HX601',area:'A-600',page:11,title:'Dryer heat source unresolved',reason:'140–145 °C inlet air is a typical draft target. Heating medium is explicitly TBD; 80–95 °C hot water alone cannot achieve that air temperature by ordinary heat exchange.'},
 {id:'TEMP-DR601',area:'A-600',page:11,title:'Dryer ranges remain provisional',reason:'Typical inlet / outlet ranges are shown, while general notes leave final temperatures TBD. Product discharge 60–100 °C is also explicitly TBD.'}
];
export function formatTemperature(value){
 if(value.minC==null||value.maxC==null)return 'Unknown';
 return (value.minC===value.maxC?String(value.minC):value.minC+'–'+value.maxC)+' °C';
}
export function temperatureBands(value){
 if(value.minC==null||value.maxC==null)return [{colour:temperatureColour(null),label:'Unknown'}];
 const bands=[[-Infinity,10,'Colder'],[10,40,'Cold'],[40,80,'Warm'],[80,Infinity,'Hot']];
 return bands.filter(([a,b])=>value.maxC>=a&&value.minC<b).map(([a,,label])=>({colour:temperatureColour(Math.max(value.minC,a)),label}));
}
export function temperatureTargets(model,area='all'){
 const present=new Set(model.parts.map(p=>Number(p.reactor)));
 return PFD_TEMPERATURES.filter(r=>area==='all'||r.area===area).flatMap(r=>{
  const found=Object.entries(model.equipment).find(([id,e])=>e.tag===r.tag&&present.has(Number(id)));
  return found?[{...r,owner:Number(found[0])}]:[];
 });
}
export function equipmentTemperatures(tag){return PFD_TEMPERATURES.filter(r=>r.tag===tag);}
export function temperatureSourceHref(page){
 const pages=[5,6,7,8,10,11,12,13,15,19];
 return PFD_TEMPERATURE_SOURCE.href+'#page='+(pages.indexOf(page)+1);
}
export function processTemperaturePlan(model,record,phaseId,getEquipmentIds){
 const selectedPhase=record.phases.find(p=>p.id===phaseId)||record.phases[0];
 const allIds=new Set(getEquipmentIds?.(record.owner)||model.parts.filter(p=>p.reactor===record.owner).map(p=>p.id));
 const e=model.equipment[record.owner],port=record.port&&model.ports.find(p=>p.label===record.port&&p.reactor===record.owner),route=record.route&&model.routes.find(r=>r.label===record.route),zone=record.zone&&model.parts.find(p=>p.name===record.zone&&p.reactor===record.owner);
 const edge=route&&model.edges[route.edgeIndices?.[0]];
 // Outlet markers use named nozzles / routes. Otherwise the marker is an
 // equipment-location annotation, not a fabricated sensing point or field.
 const point=port?.point||edge?.a||zone?.position.toArray()||[e.x||0,Number.isFinite(e.top)&&Number.isFinite(e.bottom)?(e.top+e.bottom)/2:Math.max(1,(e.labelY||3)-.8),e.z||0];
 const capability=temperatureCapability(model,record,selectedPhase),findings=[...PFD_TEMPERATURE_FINDINGS.filter(f=>f.area===record.area),{id:'CAPABILITY-'+record.id,reason:capability.headline+'. '+capability.reason+' '+capability.required}];
 return {kind:'process',record,selectedPhase,capability,point,location:port||edge||zone?'Named process location':'Equipment-location annotation',bands:temperatureBands(selectedPhase),allIds,colours:new Map(),paths:[],renderSegments:[],valveStates:{},rows:[record],findings,qualified:false};
}
