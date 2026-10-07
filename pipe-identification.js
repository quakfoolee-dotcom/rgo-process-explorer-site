// Pipe identification by fluid hazard, following the class structure of ASME A13.1 (colour field, legend, flow arrow).
// Project convention only: edition, owner requirements and CAN/CGSB-24.3 are to be confirmed, and every class below is a
// proposed default pending a hazard review against the safety data sheets. Classes 7 to 10 are user-defined colours.
export const ASME_BASIS={title:'Pipe identification · ASME A13.1 class structure',status:'Proposed defaults, hazard review pending',
 note:'Colour field, upper-case legend and flow arrow. Classes by fluid hazard, not by service name. Project convention: confirm the A13.1 edition, owner requirements and CAN/CGSB-24.3 before issue.'};
export const ASME_CLASSES={
 fire:{label:'Fire-quenching fluids',color:'#e5242b',letters:'#ffffff',rank:1,userDefined:false,example:'Fire water'},
 toxic:{label:'Toxic and corrosive fluids',color:'#f5832b',letters:'#101820',rank:2,userDefined:false,example:'Acids, alkalis, cleaning chemicals, acid vents, chemical drains'},
 flammable:{label:'Flammable fluids',color:'#dba400',letters:'#101820',rank:3,userDefined:false,example:'Natural gas, borohydride streams'},
 combustible:{label:'Combustible fluids',color:'#a06a3c',letters:'#ffffff',rank:4,userDefined:false,example:'Thermal oil'},
 water:{label:'Water: potable, cooling, boiler feed, other',color:'#2fa65a',letters:'#ffffff',rank:5,userDefined:false,example:'RO, city, cooling, chilled and hot water; wastewater; process drains'},
 air:{label:'Compressed air',color:'#2f78e0',letters:'#ffffff',rank:6,userDefined:false,example:'Instrument, process and service air'},
 oxidiser:{label:'Oxidising fluids · user-defined',color:'#9b6be0',letters:'#ffffff',rank:7,userDefined:true,example:'Peroxide, permanganate, persulfate, oxygen samples'},
 inert:{label:'Inert and asphyxiant gases · user-defined',color:'#26b3b0',letters:'#101820',rank:8,userDefined:true,example:'Argon, nitrogen'},
 product:{label:'Process product and slurry · user-defined',color:'#d94fa6',letters:'#ffffff',rank:9,userDefined:true,example:'Pre-G, GO suspension, rGO, pellets'},
 vent:{label:'Vents, off-gas and dust · user-defined',color:'#9aa6b2',letters:'#101820',rank:10,userDefined:true,example:'Vents, exhaust, dust collection, thermal off-gas'},
 review:{label:'Not classified · hazard review',color:'#5a6b82',letters:'#ffffff',rank:11,userDefined:true,example:'Service or medium needs a hazard assessment'}
};
// Hazard review register: one line per class. Set status to 'approved' with reviewer and date once the SDS review is signed off.
export const ASME_REVIEW=Object.fromEntries(Object.keys(ASME_CLASSES).map(k=>[k,{status:'proposed',reviewer:'',date:'',sds:'Check against the safety data sheets of every service listed for this class'}]));
ASME_REVIEW.fire.sds='No fire-water line is modelled yet; add the class lines with the fire-protection design';
const set=(cls,names)=>names.map(n=>[n,cls]);
const SERVICE_CLASS=new Map([
 ...set('toxic',['Acid vent','Acid wash vent','Acid condensate','Acidic waste','Acidic decant','Scrubber liquor','Scrubber blowdown','Scrubber waste','Phosphoric acid','Sulfuric acid','HCl','NaOH','NaOH feed','Lime feed','BaCl2 feed','Antiscalant','CIP chemical','CIP','CIP return','CIP circulation','Segregated CIP waste','Flocculant feed','P2O5','Wash waste','Drain']),
 ...set('flammable',['Natural gas','KBH4','rGO / KBH4 mixture','Dry reactive exhaust','Reactive thermal off-gas']),
 ...set('combustible',['Thermal oil','Thermal oil 250 °C return','Thermal oil 280 °C supply','Thermal oil overflow','Thermal oil drain-down','Thermal oil to heater','Thermal oil refill','Thermal oil expansion']),
 ...set('water',['RO water','Cooling water','Cooling return','Cooling supply','Cooling','Cooling utility','Cooling water circulation','Chilled water circulation','Hot water circulation','City water','Condensate','CIP water','Water','UF filtrate','Permeate','Permeate disposal','Filtrate','Filtrate wastewater transfer','RO concentrate','Wastewater','Treated wastewater','Backwash wastewater','Cleaning effluent','Compressor condensate','Thermal utility drain','Aqueous drain','Process drain','Secondary circulation','Thermal package','Utility','Thermal utility']),
 ...set('air',['Instrument air','Compressed air','Service air','Process air','Air relief','Pneumatic exhaust']),
 ...set('oxidiser',['Peroxide','Peroxide vent','KMnO4','K2S2O8','Oxidizer dust','Oxygen sample']),
 ...set('inert',['Argon','Liquid argon','Argon vaporization','Argon relief','Argon purge exhaust','Nitrogen','Powder / argon']),
 ...set('product',['Pre-G slurry','Pre-G','Pre-G solids','GO suspension','Aqueous GO','Retentate','Concentrate','Slurry','Quenched slurry','Washed slurry','Washed product','Wet cake','rGO','Doped rGO','Dry GO','Reaction slurry','Centrate','Formed pellets','Accepted pellets','Packaged pellets','Off-size pellets / recoverable product','Graphite','Holding slurry to filter press','Fixing recycle / holding transfer','Dryer feed / recycle','TFF circulation / product transfer','Sludge']),
 ...set('vent',['Vent','Off-gas','Treated exhaust','Dust vent','Bin vent','Air-side dust vent','Pre-G dust','Moist drying gas','Drying gas','Hot drying gas','Moist gas / fines','Thermal off-gas','Argon / thermal off-gas','Powder-laden inert exhaust','Vapor','Relief','Wash vent'])
]);
const FLOW_TO_ASME={chemical:'toxic',water:'water',offgas:'vent',wastewater:'water',drain:'water',product:'product',gas:'inert'};
const THERMAL=[[/CHWS|chilled water supply/i,'CHILLED WATER SUPPLY'],[/CHWR|chilled water return/i,'CHILLED WATER RETURN'],[/CWS|cooling water supply/i,'COOLING WATER SUPPLY'],[/CWR|cooling water return/i,'COOLING WATER RETURN'],[/hot water return|heating return/i,'HOT WATER RETURN'],[/hot water|heating supply/i,'HOT WATER SUPPLY']];
const upper=s=>String(s||'').toUpperCase().replace(/\s+/g,' ').trim();
// route: a model route; flow: the PFD classification already attached to the route record (optional fallback)
export function classifyPipe(route,flow={}){
 const service=route.service||'',label=route.label??route.name??'';
 if(flow.flowCategoryStatus==='non-flow')return {asmeClass:null,asmeLegend:'',asmeStatus:'non-flow',asmeBasis:'Not a fluid line'};
 let cls=SERVICE_CLASS.get(service),basis=cls?'Service: '+service:null,legend=upper(service);
 if(service==='Thermal utility'||service==='Utility'||service==='Thermal package'){legend='THERMAL UTILITY WATER';for(const [re,text] of THERMAL)if(re.test(label)){legend=text;break;}if(/thermal oil/i.test(label)){cls='combustible';legend='THERMAL OIL';}}
 if(service==='Drain'&&/aqueous|module drain|closed module|low point|casing/i.test(label)){cls='water';legend='DRAIN';}
 if(!cls&&flow.flowCategory&&FLOW_TO_ASME[flow.flowCategory]){cls=FLOW_TO_ASME[flow.flowCategory];basis='Follows the PFD category '+flow.flowCategory+' for service '+(service||'unspecified');legend=legend||upper(flow.flowCategory);}
 if(!cls)return {asmeClass:'review',asmeLegend:upper(service)||'UNSPECIFIED',asmeStatus:'review',asmeBasis:'Service needs a hazard classification: '+(service||'unspecified')};
 if(!legend)legend=upper(label).slice(0,28);
 return {asmeClass:cls,asmeLegend:legend.length>30?legend.slice(0,30).trim():legend,asmeStatus:ASME_REVIEW[cls].status,asmeBasis:basis||'Proposed default'};
}
export const asmeServices=()=>{const out={};for(const [service,cls] of SERVICE_CLASS)(out[cls]??=[]).push(service);return out;};
export const asmeColor=route=>ASME_CLASSES[route?.asmeClass]?.color||'#43546b';
export const asmeLabel=route=>route?.asmeClass?route.asmeLegend+' · '+ASME_CLASSES[route.asmeClass].label+(route.asmeStatus==='proposed'?' (proposed)':''):'';
