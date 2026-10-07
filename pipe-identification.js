// Pipe identification by fluid hazard, following the class structure of ANSI/ASME A13.1-2023 as summarised in a vendor guide
// (colour field, upper-case legend, flow arrow, size chart, placement). Project convention only: the standard text, owner
// requirements and CAN/CGSB-24.3 are still to be confirmed, and every class is a proposed default pending a hazard review against
// the safety data sheets. The last four classes are the standard's user-defined colours.
export const ASME_BASIS={title:'Pipe identification · ANSI/ASME A13.1-2023 class structure',status:'Proposed defaults, hazard review pending',
 note:'Colour field, upper-case legend, flow arrow, size chart and placement follow a vendor summary of ANSI/ASME A13.1-2023. Classes by fluid hazard, not by service name. Project convention: confirm against the standard text, owner requirements and CAN/CGSB-24.3 before issue.'};
// color: display colour of the piping in the model; field and letters: the marker colours (border: marker outline, abandoned piping only).
// reserved: no routes use the class yet, so it is not held to the on-screen visibility check.
export const ASME_CLASSES={
 fire:{label:'Fire-fighting fluids',color:'#e5242b',field:'#e5242b',letters:'#ffffff',rank:1,userDefined:false,example:'Fire water, sprinkler water'},
 toxic:{label:'Toxic and corrosive fluids (liquids and gases)',color:'#f5832b',field:'#f5832b',letters:'#101820',rank:2,userDefined:false,example:'Acids, alkalis, cleaning chemicals, chemical drains; acid vent gas is in this class, tagged GAS'},
 flammable:{label:'Flammable, oxidizing and combustible fluids',color:'#dba400',field:'#dba400',letters:'#101820',rank:3,userDefined:false,example:'Natural gas, borohydride streams, thermal oil, peroxide, permanganate'},
 steam:{label:'Steam',color:'#a3adb8',field:'#a3adb8',letters:'#101820',rank:4,userDefined:false,example:'Steam (none modelled yet)'},
 water:{label:'Cold and tepid water (cooling, chilled, RO, waste)',color:'#2fa65a',field:'#2fa65a',letters:'#ffffff',rank:5,userDefined:false,example:'RO, city, cooling, chilled water; wastewater; process drains. Hot water: class to confirm'},
 air:{label:'Compressed air',color:'#2f78e0',field:'#2f78e0',letters:'#ffffff',rank:6,userDefined:false,example:'Instrument, process and service air'},
 abandoned:{label:'Abandoned piping',color:'#e9eef3',field:'#ffffff',letters:'#101820',border:'#101820',rank:7,userDefined:false,reserved:true,example:'Abandoned piping (none modelled yet)'},
 inert:{label:'Inert and asphyxiant gases · user-defined',color:'#4d5b6b',field:'#1a1f26',letters:'#ffffff',rank:8,userDefined:true,example:'Argon, nitrogen (white on black)'},
 product:{label:'Process product and slurry · user-defined',color:'#7b4fc4',field:'#7b4fc4',letters:'#ffffff',rank:9,userDefined:true,example:'Pre-G, GO suspension, rGO, pellets (white on purple)'},
 vent:{label:'Vents, off-gas and dust · user-defined',color:'#8a5a2b',field:'#8a5a2b',letters:'#ffffff',rank:10,userDefined:true,example:'Vents, exhaust, dust collection, thermal off-gas (white on brown)'},
 review:{label:'Not classified · hazard review',color:'#c9b88a',field:'#ffffff',letters:'#101820',rank:11,userDefined:true,example:'Service or medium needs a hazard assessment (black on white)'}
};
// Marker size chart (outside pipe diameter including covering), ANSI/ASME A13.1-2023 summary: label height x length and text height.
export const MARKER_SIZES=[
 {maxOdMm:33,heightMm:25,lengthMm:203,textMm:13},{maxOdMm:61,heightMm:25,lengthMm:203,textMm:18},{maxOdMm:170,heightMm:51,lengthMm:305,textMm:33},
 {maxOdMm:254,heightMm:76,lengthMm:610,textMm:64},{maxOdMm:Infinity,heightMm:102,lengthMm:813,textMm:89}];
export const markerSize=odMm=>{const index=MARKER_SIZES.findIndex(x=>odMm<=x.maxOdMm);return {...MARKER_SIZES[index],index,permanentTag:odMm<18};};
// Hazard review register: one line per class. Set status to 'approved' with reviewer and date once the SDS review is signed off.
export const ASME_REVIEW=Object.fromEntries(Object.keys(ASME_CLASSES).map(k=>[k,{status:'proposed',reviewer:'',date:'',sds:'Check against the safety data sheets of every service listed for this class'}]));
ASME_REVIEW.steam.sds='No steam line is modelled yet; add the class lines when steam is part of the design';
ASME_REVIEW.abandoned.sds='No abandoned piping is modelled; the class is reserved for future use';
ASME_REVIEW.water.sds='Hot-water lines (thermal utility) are not cold or tepid water: confirm their class against the standard text';
ASME_REVIEW.fire.sds='No fire-water line is modelled yet; add the class lines with the fire-protection design';
const set=(cls,names)=>names.map(n=>[n,cls]);
const SERVICE_CLASS=new Map([
 ...set('toxic',['Acid vent','Acid wash vent','Acid condensate','Acidic waste','Acidic decant','Scrubber liquor','Scrubber blowdown','Scrubber waste','Phosphoric acid','Sulfuric acid','HCl','NaOH','NaOH feed','Lime feed','BaCl2 feed','Antiscalant','CIP chemical','CIP','CIP return','CIP circulation','Segregated CIP waste','Flocculant feed','P2O5','Wash waste','Drain']),
 ...set('flammable',['Natural gas','KBH4','rGO / KBH4 mixture','Dry reactive exhaust','Reactive thermal off-gas']),
 ...set('flammable',['Thermal oil','Thermal oil 250 °C return','Thermal oil 280 °C supply','Thermal oil overflow','Thermal oil drain-down','Thermal oil to heater','Thermal oil refill','Thermal oil expansion']),
 ...set('water',['RO water','Cooling water','Cooling return','Cooling supply','Cooling','Cooling utility','Cooling water circulation','Chilled water circulation','Hot water circulation','City water','Condensate','CIP water','Water','UF filtrate','Permeate','Permeate disposal','Filtrate','Filtrate wastewater transfer','RO concentrate','Wastewater','Treated wastewater','Backwash wastewater','Cleaning effluent','Compressor condensate','Thermal utility drain','Aqueous drain','Process drain','Secondary circulation','Thermal package','Utility','Thermal utility']),
 ...set('air',['Instrument air','Compressed air','Service air','Process air','Air relief','Pneumatic exhaust']),
 ...set('flammable',['Peroxide','Peroxide vent','KMnO4','K2S2O8','Oxidizer dust','Oxygen sample']),
 ...set('inert',['Argon','Liquid argon','Argon vaporization','Argon relief','Argon purge exhaust','Nitrogen','Powder / argon']),
 ...set('product',['Pre-G slurry','Pre-G','Pre-G solids','GO suspension','Aqueous GO','Retentate','Concentrate','Slurry','Quenched slurry','Washed slurry','Washed product','Wet cake','rGO','Doped rGO','Dry GO','Reaction slurry','Centrate','Formed pellets','Accepted pellets','Packaged pellets','Off-size pellets / recoverable product','Graphite','Holding slurry to filter press','Fixing recycle / holding transfer','Dryer feed / recycle','TFF circulation / product transfer','Sludge']),
 ...set('vent',['Vent','Off-gas','Treated exhaust','Dust vent','Bin vent','Air-side dust vent','Pre-G dust','Moist drying gas','Drying gas','Hot drying gas','Moist gas / fines','Thermal off-gas','Argon / thermal off-gas','Powder-laden inert exhaust','Vapor','Relief','Wash vent'])
]);
const FLOW_TO_ASME={chemical:'toxic',water:'water',offgas:'vent',wastewater:'water',drain:'water',product:'product',gas:'inert'};
const THERMAL=[[/CHWS|chilled water supply/i,'CHILLED WATER SUPPLY'],[/CHWR|chilled water return/i,'CHILLED WATER RETURN'],[/CWS|cooling water supply/i,'COOLING WATER SUPPLY'],[/CWR|cooling water return/i,'COOLING WATER RETURN'],[/hot water return|heating return/i,'HOT WATER RETURN'],[/hot water|heating supply/i,'HOT WATER SUPPLY']];
// Phase tag shown on the legend for gases and solids; liquids are untagged.
const GAS=/vent|off-gas|offgas|exhaust|\bair\b|argon|nitrogen|natural gas|vapou?r|relief|purge|\bgas\b/i,SOLID=/pellet|graphite|dry go|wet cake|solids|powder|packaged|dust|fines|sludge/i;
export const asmePhase=(service,label)=>{const t=service+' '+label;return GAS.test(t)?'gas':SOLID.test(t)?'solids':'liquid';};
const upper=s=>String(s||'').toUpperCase().replace(/\s+/g,' ').trim();
// route: a model route; flow: the PFD classification already attached to the route record (optional fallback)
export function classifyPipe(route,flow={}){
 const service=route.service||'',label=route.label??route.name??'';
 if(flow.flowCategoryStatus==='non-flow')return {asmeClass:null,asmeLegend:'',asmeStatus:'non-flow',asmeBasis:'Not a fluid line'};
 let cls=SERVICE_CLASS.get(service),basis=cls?'Service: '+service:null,legend=upper(service);
 if(service==='Thermal utility'||service==='Utility'||service==='Thermal package'){legend='THERMAL UTILITY WATER';for(const [re,text] of THERMAL)if(re.test(label)){legend=text;break;}if(/thermal oil/i.test(label)){cls='flammable';legend='THERMAL OIL';}}
 if(service==='Drain'&&/aqueous|module drain|closed module|low point|casing/i.test(label)){cls='water';legend='DRAIN';}
 if(!cls&&flow.flowCategory&&FLOW_TO_ASME[flow.flowCategory]){cls=FLOW_TO_ASME[flow.flowCategory];basis='Follows the PFD category '+flow.flowCategory+' for service '+(service||'unspecified');legend=legend||upper(flow.flowCategory);}
 if(!cls)return {asmeClass:'review',asmeLegend:upper(service)||'UNSPECIFIED',asmeStatus:'review',asmeBasis:'Service needs a hazard classification: '+(service||'unspecified')};
 if(!legend)legend=upper(label).slice(0,28);
 const phase=asmePhase(service,label),tag=phase==='gas'?' · GAS':phase==='solids'?' · SOLIDS':'';
 if(tag&&['toxic','flammable','product','review'].includes(cls)&&!new RegExp(phase==='gas'?'GAS':'SOLIDS').test(legend))legend=legend.slice(0,30-tag.length).trim()+tag;
 const confirm=/HOT WATER/.test(legend);
 return {asmeClass:cls,asmeConfirm:confirm,asmePhase:phase,asmeLegend:legend.length>30?legend.slice(0,30).trim():legend,asmeStatus:ASME_REVIEW[cls].status,asmeBasis:basis||'Proposed default'};
}
export const asmeServices=()=>{const out={};for(const [service,cls] of SERVICE_CLASS)(out[cls]??=[]).push(service);return out;};
export const asmeColor=route=>ASME_CLASSES[route?.asmeClass]?.color||'#43546b';
export const asmeLabel=route=>route?.asmeClass?route.asmeLegend+' · '+ASME_CLASSES[route.asmeClass].label+(route.asmeConfirm?' (class to confirm)':route.asmeStatus==='proposed'?' (proposed)':''):'';
