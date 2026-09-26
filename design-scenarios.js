import {buildAccessRegister} from './access-review.js';
// Design configuration is independent of color mode and of equipment maturity.
export const DESIGN_SCOPES={feed:'FEED study'};
export const ARCHIVE_KEY='filtration-drying-v22';
export const A160_DESIGNS={
 baseline:{label:'FEED baseline · press + tray dryer',short:'FEED baseline',description:'F-161 membrane press and staged cake washing → D-164 tray drying → A-200. The PFD lists the duties; the tray and handling geometry is conceptual.',replaces:[]},
 dryer:{label:'Alternative A · press + conical dryer',short:'Alternative A',description:'Retain F-161 filtration and washing. Replace the tray arrangement with D-164 conical vacuum drying and contained mechanical cake transfer.',replaces:['D-164 tray arrangement','TR-164']},
 enclosed:{label:'Alternative B · elevated Nutsche + conical dryer',short:'Alternative B',description:'PL-166 elevated F-161 Nutsche → H-166 contained wet-cake receiver → SC-166 horizontal transfer → D-164 conical vacuum dryer. Separation and drying require Pre-G trials.',replaces:['F-161 membrane press arrangement','D-164 tray arrangement','TR-164']},
 integrated:{label:'Alternative C · integrated filter-dryer',short:'Alternative C',description:'FD-166 combines filtration, washing and vacuum drying in one batch vessel. It replaces the F-161 / D-164 duties; batch capacity and filter-dryer prefix remain for project confirmation.',replaces:['F-161','D-164','TR-164']},
 elevated:{label:'Option E · press over paddle dryer (FEED basis)',short:'Option E',description:'FEED-PE-CAL-026 / DAT-067…071 basis (REP-042 Option E): F-161 on the PL-161 deck at +4.4 m drops washed cake by gravity chute into the D-164 agitated vacuum paddle dryer → SC-167 → H-164 → EL-164 / SC-164. TR-164 deleted. Envelopes indicative (holds J3–J9); replaces the baseline only after the PFD-0160 MoC (hold J6).',replaces:['F-161 at-grade arrangement','D-164 tray arrangement','TR-164','VP-164 / KO-164 layout','H-164 tray unloading']}
};
export const A160_TAG_RESERVATIONS={areaId:'A-160',status:'Provisional model reservations',checkedAgainst:'Supplied FEED PFD V5.1 and current 3D register; separate plant master tag register not supplied',equipment:['FD-166','F-166','E-166','T-166','VP-166','SC-166','SC-167','PL-166','H-166','PL-161','RV-164'],instruments:['TT-166','TIC-166','TCV-166','PT-167','PIC-167','PCV-167','FT-168','FIC-168','FCV-168','TT-164','TIC-164','TCV-164','PT-164'],rule:'Alternative replacements retain F-161 and D-164 functional tags. New duties use A-160 identifiers. FD is a proposed combined filter-dryer prefix. Scenario and stable model identity remain separate from displayed tag.'};
export function readDesignSelection(search=''){
 const p=new URLSearchParams(search),scope=p.get('archive')===ARCHIVE_KEY||p.get('scope')==='future'?'future':'feed',a160=scope==='feed'&&Object.hasOwn(A160_DESIGNS,p.get('a160'))?p.get('a160'):'baseline';return {scope,a160,argonSource:p.get('argon')==='cylinders'?'cylinders':'bulk'};
}
export function applyA160Equipment(e,design){
 if(design==='baseline')return;
 const review='Proposed A-160 alternative. Verify filtration, residual moisture/impurities, thermal stability, materials, cycle capacity and utility duties. Tags checked against supplied PFD and current model; master-register reconciliation remains open.';
 const put=(id,tag,label,data={})=>e[id]={...e[id],tag,label,areaId:'A-160',designStatus:'proposed',reviewNote:review,designScenario:design,primaryOperation:'pregdry',...data};
 if(design==='elevated'){
  const basis='FEED-PE-CAL-026 bases G1–G7 (REP-042 Option E); indicative envelope, vendor GA to replace (holds J3–J9). Replaces the baseline only after the PFD-0160 MoC (hold J6).';
  put(46,'F-161','Membrane filter press on PL-161 deck',{x:-14.5,z:-17.4,labelY:8.5,primaryOperation:'pregpress',replaces:['F-161 at-grade arrangement'],reviewNote:basis+' FEED-PE-DAT-067 V1.1: 31 plates 1,000 × 1,000 mm, 30 chambers, 1.1 m plate-shifting space; gravity chute to D-164 (basis G6).'});
  put(47,'D-164','Agitated vacuum paddle dryer',{x:-14.5,z:-17.99,labelY:3.3,replaces:['D-164 tray arrangement'],reviewNote:basis+' FEED-PE-DAT-068: 733 kg wet cake per batch, 14 m² heated, ≈ 2 m³ gross, tempered water ≤ 70 °C, 100 mbar abs.'});
  put(49,'H-164 / SC-167','Dry Pre-G receiver and dryer discharge screw',{x:-11.95,z:-13.9,labelY:4.3,replaces:['H-164 tray unloading'],reviewNote:basis+' FEED-PE-DAT-070: 1.5 m³ receiver; bulk density 500 kg/m³ assumed (hold J4).'});
  put(53,'VP-164 / KO-164','Dryer vacuum and condensate package',{x:-12.7,z:-25.0,radius:.375,bottom:1.05,top:1.65,labelY:4.8,replaces:['VP-164 / KO-164 layout'],reviewNote:basis+' FEED-PE-DAT-069: 70 kW condenser, 0.4 m³ receiver, 150 m³/h dry screw pump; cooling water approach (hold J5).'});
  put(98,'P-164','A-160 slurry feed pump',{x:-17,z:-22,labelY:2.3,primaryOperation:'pregpress',reviewNote:basis+' The press inlet is now at +5.5 m; recheck the P-164 head (FEED-PE-DAT-028).'});
  put(99,'PL-161','F-161 operating deck and stair',{x:-15.9,z:-24.5,labelY:6.9,primaryOperation:'pregpress',reviewNote:basis+' Deck +4.4 m (DAT-067 5.10 indicative +3.0 m; set by the D-164 discharge, hold J6); loads and lifting are vendor data (hold J9).'});
  return;
 }
 if(design==='enclosed')put(46,'F-161','Agitated Nutsche filter',{x:-14.5,z:-20,radius:1.15,bottom:7.5,top:10.1,labelY:11.5,primaryOperation:'pregpress',replaces:['F-161 membrane press arrangement']});
 if(design!=='integrated')put(47,'D-164','Conical vacuum dryer',{x:-14.5,z:-15,radius:1.1,bottom:4,top:5.7,labelY:7.3,replaces:['D-164 tray arrangement']});
 else put(92,'FD-166','Integrated Nutsche filter-dryer',{x:-14.5,z:-17.2,radius:1.2,bottom:3.1,top:5.7,labelY:7.3,primaryOperation:'pregpress',replaces:['F-161','D-164'],reviewNote:review+' FD equipment prefix is provisional.'});
 put(49,'H-164 / SC-167','Contained dry receiving and discharge',{x:-12.95,z:-13.9,labelY:3.3});
 put(93,'F-166','Dryer vapor dust filter',{x:-11.3,z:-17.2,radius:.32,bottom:5.1,top:5.9,labelY:6.6});
 put(94,'E-166','Dryer vapor condenser',{x:-8.6,z:-17.2,radius:.35,bottom:3.2,top:4.7,labelY:5.4});
 put(95,'T-166','Condensate receiver',{x:-8.6,z:-17.2,radius:.45,bottom:1.6,top:2.45,labelY:3.2});
 put(96,'VP-166','Dryer vacuum package',{x:-5.8,z:-17.2,labelY:2.5});
 if(design!=='integrated')put(97,'SC-166','Enclosed wet-cake transfer',{x:-14.7,z:-17.8,labelY:4.7,primaryOperation:'pregpress',replaces:['TR-164']});
 put(99,'PL-166','A-160 equipment support and access',{x:-12.3,z:-18.8,labelY:design==='enclosed'?8.8:6.7,primaryOperation:'pregdry'});
 if(design==='enclosed')put(100,'H-166','Contained wet-cake receiver',{x:-12.817,z:-19.974,labelY:8.65,primaryOperation:'pregpress'});
 put(98,'P-164','A-160 slurry feed pump',{x:-17,z:-22,labelY:2.3,primaryOperation:'pregpress',reviewNote:review+(design==='enclosed'?' Elevated F-161 increases static lift; recheck P-164 pump head and allowable filtration pressure.':'')});
}
export const scopeContains=(id,scope)=>scope==='all'||(scope==='future'?(id>=5&&id<=18):!(id>=5&&id<=18));
export function selectModelScope(model,scope='all'){
 const parts=model.parts.filter(p=>scope==='all'||(model.equipment[p.reactor]?.areaId==='CONCEPT'?scope==='future':scopeContains(p.reactor,scope))),partIds=new Set(parts.map(p=>p.id)),owners=new Set(parts.map(p=>p.reactor)),map=new Map(),edges=[];
 model.edges.forEach((e,i)=>{if(partIds.has(e.part)){map.set(i,edges.length);edges.push(e);}});
 const routes=model.routes.filter(r=>r.partIds.some(id=>partIds.has(id))).map(r=>({...r,partIds:r.partIds.filter(id=>partIds.has(id)),edgeIndices:r.edgeIndices.map(i=>map.get(i)).filter(i=>i!==undefined)}));
 const equipment=Object.fromEntries(Object.entries(model.equipment).filter(([id])=>owners.has(Number(id))));
 const structure=model.structure?{contacts:model.structure.contacts.filter(c=>partIds.has(c.a)&&partIds.has(c.b)),roots:model.structure.roots.filter(r=>partIds.has(r.part)),loads:model.structure.loads.filter(l=>partIds.has(l.part)),access:model.structure.access.filter(a=>owners.has(a.equipment))}:undefined;
 const selected={...model,scope,pipeSupportSystem:scope==='future'?null:model.pipeSupportSystem,structure,parts,edges,routes,equipment,ports:model.ports.filter(p=>owners.has(p.reactor)),terminals:model.terminals.filter(p=>owners.has(p.reactor)),supports:model.supports.filter(p=>owners.has(p.reactor)),valves:model.valves.filter(v=>owners.has(v.reactor))};if(model.reactorAir){const present=new Set(selected.parts.map(p=>p.id));selected.reactorAir={...model.reactorAir,audit:model.reactorAir.audit.filter(a=>present.has(a.partId))};}if(model.thermalUtilities)selected.thermalUtilities=scope==='future'?null:{...model.thermalUtilities,consumers:model.thermalUtilities.consumers.map(c=>({...c,localEdgeIds:c.localEdgeIds?.map(i=>map.get(i)).filter(i=>i!==undefined)}))};if(model.access)selected.access=buildAccessRegister(selected);return selected;
}
export function scenarioStages(stages,model){
 const future=model.scope==='future',design=model.designScenario||'baseline';
 return stages.filter(s=>future?s.train==='finishing':s.train==='feed').map(s=>{
  let next={...s,equipment:s.equipment.filter(id=>model.equipment[id]),context:s.context.filter(id=>model.equipment[id])};
  if(!future&&design==='elevated'&&['pregpress','pregdry'].includes(s.id)){
   if(s.id==='pregpress')Object.assign(next,{title:'Membrane filtration on the deck & gravity cake discharge',tags:'P-164 → F-161 → chute → D-164',equipment:[46,98,99],context:[45,51,46,47,98,99],routes:model.preg.alternative.pressRoutes,description:'F-161 on PL-161 filters and displacement-washes the T-162 batch. Opening the drip trays drops the washed cake through the PP-lined chute and SDV-164-IN into D-164.',inputs:[['Pre-G slurry','T-162 → P-164'],['RO washing','A-2000 supply interface']],outputs:[['Filtrate','T-163 → P-165 → A-1000'],['Wet cake','Chute → D-164']]});
   else Object.assign(next,{title:'Paddle vacuum drying & distribution',tags:'D-164 → SC-167 → H-164 → EL-164 / SC-164',equipment:[47,49,50,53],context:[47,49,50,53,99],routes:model.preg.alternative.dryRoutes,description:'Batch vacuum drying at 100 mbar abs on a tempered-water jacket, then cooling and equalization before release to SC-167, H-164 and the powered distribution to the A-200 hoppers.',inputs:[['Wet cake','F-161 chute']],outputs:[['Dried Pre-G','H-164 → EL-164 → A-200'],['Vapour / condensate','KO-164 → VP-164 / T-163']]});
   next.note=A160_DESIGNS[design].description;
  }else if(!future&&design!=='baseline'&&['pregpress','pregdry'].includes(s.id)){
   const integrated=design==='integrated',unit=integrated?92:47,filter=integrated?92:46;
   if(s.id==='pregpress')Object.assign(next,{title:integrated?'Integrated filtration & cake washing':design==='dryer'?'Membrane filtration & contained transfer':'Elevated Nutsche filtration & cake transfer',tags:integrated?'P-164 → FD-166':design==='enclosed'?'F-161 → H-166 → SC-166':'P-164 → F-161 → SC-166',equipment:[filter,98,...integrated?[]:[97],...design==='enclosed'?[99,100]:[]],context:[45,51,filter,unit,98,49,99,...integrated?[]:[97],...design==='enclosed'?[100]:[]],routes:model.preg.alternative.pressRoutes,description:integrated?'FD-166 retains cake for in-vessel drying after filtration and RO-water cake washing.':design==='enclosed'?'F-161 is supported on PL-166. Washed cake descends into H-166 and is metered through horizontal SC-166 into D-164 after pressure equalization.':'Filtered, washed cake moves through the powered SC-166 enclosure into D-164 after pressure equalization.',inputs:[['Pre-G slurry','T-162 → P-164'],['RO washing','A-2000 supply interface']],outputs:[['Filtrate','T-163 → P-165 → A-1000'],['Retained cake',integrated?'FD-166 drying stage':'SC-166 → D-164']]});
   else Object.assign(next,{title:integrated?'Integrated drying & product discharge':'Conical vacuum drying & distribution',tags:(integrated?'FD-166':'D-164')+' → H-164 / SC-167 → EL-164',equipment:[unit,49,50,93,94,95,96,99],context:[unit,49,50,93,94,95,96,99],routes:model.preg.alternative.dryRoutes,description:'Vacuum drying, controlled cooling and equalization precede contained product discharge. Vapor dust filtration, condensation and vacuum are separate from the product and thermal circuits.',inputs:[['Washed cake',integrated?'Retained in FD-166':'SC-166 contained transfer']],outputs:[['Dried Pre-G','H-164 / SC-167 → EL-164 → A-200'],['Vapor / condensate','F-166 → E-166 → T-166 / VP-166']]});
   next.note=A160_DESIGNS[design].description+' Proposed comparison; rates, moisture endpoints and safe limits are unqualified.';
  }
  if(!future&&design==='integrated'&&s.id==='fixing'){const replace=v=>typeof v==='string'?v.replaceAll('F-161','FD-166'):Array.isArray(v)?v.map(replace):v;for(const key of ['description','inputs','outputs','note'])next[key]=replace(next[key]);}
  const children=Object.entries(model.equipment).filter(([,e])=>e.packageParentId!==undefined&&e.primaryOperation===s.id).map(([id])=>Number(id));
  next.equipment=[...new Set([...next.equipment,...children])];next.context=[...new Set([...next.context,...children])];
  return next;
 });
}
