// Swatches sampled from the user's supplied PFD legend. Classification is independent of service detail.
export const FLOW_SCHEMES={pfd:'PFD categories',detailed:'Detailed services'};
export const DEFAULT_FLOW_SCHEME='pfd';
export const FLOW_CATEGORIES={
 chemical:{label:'Chemical feeds',color:'#ffd966',colorName:'Orange / amber',example:'Acid, peroxide and reagent feeds'},
 water:{label:'Water utilities',color:'#66b2ff',colorName:'Dark blue',example:'RO water and cooling water'},
 offgas:{label:'Off-gas',color:'#99ffff',colorName:'Cyan',example:'Vents and off-gas treatment'},
 wastewater:{label:'Wastewater',color:'#66ff66',colorName:'Green',example:'Wastewater treatment streams'},
 drain:{label:'Drains',color:'#e6e6e6',colorName:'Grey',example:'Dedicated drain connections'},
 product:{label:'Product',color:'#e6d0de',colorName:'Purple',example:'Product and intermediate process transfers'},
 gas:{label:'Gas utilities',color:'#ffff99',colorName:'Light yellow',example:'Ar, N₂ and air supplies'}
};
export const FLOW_LEGEND_SOURCE={title:'User-supplied PFD stream legend',file:'514cf688-a57d-46cb-ab80-b400d36331e9.png',basis:'Seven stream-purpose categories; exact supplied swatches',revision:'2026-09-07'};
export const FLOW_ROUTE_OVERRIDES={
 'Lid lifting handle':{category:null,status:'non-flow',reason:'Mechanical handle, not a fluid stream'},
 'Top agitator cable conduit':{category:null,status:'non-flow',reason:'Electrical motor service, not a fluid stream'},
 'Motor cable conduit':{category:null,status:'non-flow',reason:'Electrical conduit, not a fluid stream'},
 'Receiver drain and discharge':{category:null,status:'review',reason:'Legacy combined drain / product description needs duty separation'},
 'TFF CIP return to package':{category:null,status:'review',reason:'Cleaning recovery return; disposal versus reuse is not specified'},
 'TFF CIP supply':{category:'chemical',reason:'Dedicated cleaning reagent supply; composition remains a design input'}
};
const services={
 chemical:['Antiscalant','CIP chemical','NaOH feed','Lime feed','BaCl2 feed','HCl feed','Flocculant feed','KBH4','Sulfuric acid','Phosphoric acid','Peroxide','HCl','KMnO4','K2S2O8','P2O5','Graphite','R-101 sulfuric dosing','Supply'],
 water:['UF filtrate','RO water','Cooling water','Cooling','Cooling utility','Cooling supply','Cooling return','Water','CIP water','Wash'],
 offgas:['Air relief','Argon relief','Acid vent','Peroxide vent','Acid wash vent','Vent','Relief','Pre-G dust','Oxidizer dust','Dust vent','Bin vent','Wash vent','Vapor','Vapor / condensate','Thermal off-gas','Argon / thermal off-gas','Argon purge exhaust','Oxygen sample','Pressure sensing','Pressure sample','Moist drying gas','Moist gas / fines','Treated exhaust','Air-side dust vent','Illustrative vacuum package envelope'],
 wastewater:['Scrubber liquor','Acid condensate','Scrubber blowdown','RO concentrate','Backwash wastewater','Segregated CIP waste','Wastewater','Treated wastewater','Sludge','Backwash wastewater','Segregated CIP waste','Scrubber blowdown','Waste','Acidic waste','Wash waste','Centrate','Filtrate','Permeate','Permeate disposal','Acidic decant','Cleaning effluent','Scrubber waste','Condensate','Acid wash supernatant decant','Acidic centrate wastewater','Fixing wastewater transfer','Filtrate wastewater transfer'],
 drain:['Compressor condensate','Drain','Process drain','Aqueous drain','Thermal utility drain'],
 product:['rGO','Doped rGO','rGO / KBH4 mixture','Pre-G','Pre-G slurry','Pre-G solids','Reaction slurry','Quenched slurry','Slurry','Wet cake','Concentrate','Retentate','Washed product','Washed slurry','Washed slurry transfer','Oxidized slurry transfer','TFF circulation / product transfer','GO suspension','Aqueous GO','Dry GO','Dry solid','Powder / argon','Powder / wash','Sonication recirculation','Accepted product transfer','Dryer feed / recycle','Premix distribution','Synthesis collection transfer','Fixing recycle / holding transfer','Holding slurry to filter press','Slurry feed'],
 gas:['Pneumatic exhaust','Compressed air','Service air','Process air','Liquid argon','Argon vaporization','Argon','Nitrogen','Instrument air','Pressure gas','Equalization gas','Drying gas','Hot drying gas']
};
const serviceCategory=new Map(Object.entries(services).flatMap(([category,names])=>names.map(name=>[name,category])));
const result=(category,reason,status=category?'classified':'review')=>({flowCategory:category,flowCategoryStatus:status,flowCategoryBasis:reason});
export function classifyFlow(route){
 const name=route.label??route.name??'',service=route.service??'',destination=route.to??'',o=FLOW_ROUTE_OVERRIDES[name];
 if(o)return result(o.category,o.reason,o.status);
 // Source/destination purpose takes precedence over the material name.
 if(/\b(?:drain|drainage|LPD)\b/i.test(name)||serviceCategory.get(service)==='drain')return result('drain','Dedicated drain duty');
 if(/wastewater|waste boundary|effluent|permeate disposal|BL-WW|BL-DEC161/i.test(name+' '+destination))return result('wastewater','Wastewater collection / treatment destination');
 if(/off-gas|exhaust|\bvent\b|\bvapor\b|oxygen sample/i.test(name))return result('offgas','Gas removal, vent or sample duty');
 if(service==='Receive'){
  if(/\b(?:P-305|P-306|P-403|P-163|P-165|T-304|T-403|T-163)\b/.test(name))return result('wastewater','Adapter on a defined wastewater equipment connection');
  if(/\b(?:P-101|T-102|H101|CH141[A-D]|CH142[A-D])\b/.test(name))return result('chemical','Adapter on a dedicated raw-chemical charging connection');
  if(/VP-164/.test(name))return result('offgas','Vacuum package adapter');
  if(/P-SC601|SC-601 sump/.test(name))return result(null,'Scrubber recirculating liquid composition is not specified');
  return result('product','Adapter / transfer on the process-material circuit');
 }
 if(service==='Local'){
  if(/Bottom outlet to pump|Recirculation suction to pump|Product branch|PI-201|Sample valve branch/.test(name))return result('product','Process outlet or process-side sample / pressure connection');
  if(name==='Tank sample valve')return result(route.reactor===3?'chemical':'product','Sample connection inherits the vessel duty');
  if(/PI-302 filtrate/.test(name))return result('wastewater','Filtrate-side pressure connection');
 }
 const category=serviceCategory.get(service);
 return category?result(category,'Defined service: '+service):result(null,'Service or utility medium needs category review: '+(service||'unspecified'));
}
export const categoryLabel=route=>FLOW_CATEGORIES[route?.flowCategory]?.label||(route?.flowCategoryStatus==='non-flow'?'Non-process geometry':'Category review');
export function flowColor(route,scheme='pfd',detailedColors={}){
 if(scheme==='pfd')return FLOW_CATEGORIES[route?.flowCategory]?.color||'#43546b';
 const color=detailedColors[route?.service];return typeof color==='number'?'#'+color.toString(16).padStart(6,'0'):color||'#52e2ee';
}
export function matchesFlowFocus(route,scheme,focus){if(!focus)return true;if(!route)return false;return scheme==='pfd'?(focus==='review'?route.flowCategoryStatus==='review':route.flowCategory===focus):route.service===focus;}
export function partFlowRegister(model,records,graph){
 const result=new Map(),edgeRecords=new Map();
 for(const r of model.routes){const record=records.get(r.id);for(const id of r.partIds)result.set(id,record);for(const i of r.edgeIndices)edgeRecords.set(i,record);}
 // A separate valve body inherits a category only from an unambiguous connected route.
 for(let pass=0;pass<4;pass++){let changed=false;for(let i=0;i<model.edges.length;i++){if(edgeRecords.has(i))continue;const adjacent=[...graph[i]].map(j=>edgeRecords.get(j)).filter(Boolean),categories=new Set(adjacent.map(r=>r.flowCategory));if(adjacent.length&&categories.size===1&&adjacent[0].flowCategory){edgeRecords.set(i,adjacent[0]);changed=true;}}if(!changed)break;}
 for(const [i,record] of edgeRecords)if(!result.has(model.edges[i].part))result.set(model.edges[i].part,record);
 for(const valve of model.valves){const i=model.edges.findIndex(e=>e.barrierTag&&e.barrierTag===valve.tag),record=edgeRecords.get(i);if(record)for(const id of valve.partIds||[])if(!result.has(id))result.set(id,record);}
 return result;
}
