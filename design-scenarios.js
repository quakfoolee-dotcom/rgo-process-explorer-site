import {buildAccessRegister} from './access-review.js';
// Design configuration is independent of color mode and of equipment maturity.
export const DESIGN_SCOPES={feed:'FEED study'};
export const ARCHIVE_KEY='filtration-drying-v22';
export const A160_DESIGNS={
 baseline:{label:'FEED baseline · press + tray dryer',short:'FEED baseline',description:'F-161 membrane press and staged cake washing → D-164 tray drying → A-200. The PFD lists the duties; the tray and handling geometry is conceptual.',replaces:[]},
 dryer:{label:'Alternative A · press + conical dryer',short:'Alternative A',description:'Retain F-161 filtration and washing. Replace the tray arrangement with D-164 conical vacuum drying and contained mechanical cake transfer.',replaces:['D-164 tray arrangement','TR-164']},
 enclosed:{label:'Alternative B · elevated Nutsche + conical dryer',short:'Alternative B',description:'PL-166 elevated F-161 Nutsche → H-166 contained wet-cake receiver → SC-166 horizontal transfer → D-164 conical vacuum dryer. Separation and drying require Pre-G trials.',replaces:['F-161 membrane press arrangement','D-164 tray arrangement','TR-164']},
 integrated:{label:'Alternative C · integrated filter-dryer',short:'Alternative C',description:'FD-166 combines filtration, washing and vacuum drying in one batch vessel. It replaces the F-161 / D-164 duties; batch capacity and filter-dryer prefix remain for project confirmation.',replaces:['F-161','D-164','TR-164']}
};
export const A160_TAG_RESERVATIONS={areaId:'A-160',status:'Provisional model reservations',checkedAgainst:'Supplied FEED PFD V5.1 and current 3D register; separate plant master tag register not supplied',equipment:['FD-166','F-166','E-166','T-166','VP-166','SC-166','SC-167','PL-166','H-166'],instruments:['TT-166','TIC-166','TCV-166','PT-167','PIC-167','PCV-167','FT-168','FIC-168','FCV-168'],rule:'Alternative replacements retain F-161 and D-164 functional tags. New duties use A-160 identifiers. FD is a proposed combined filter-dryer prefix. Scenario and stable model identity remain separate from displayed tag.'};
export function readDesignSelection(search=''){
 const p=new URLSearchParams(search),scope=p.get('archive')===ARCHIVE_KEY||p.get('scope')==='future'?'future':'feed',a160=scope==='feed'&&Object.hasOwn(A160_DESIGNS,p.get('a160'))?p.get('a160'):'baseline';return {scope,a160,argonSource:p.get('argon')==='cylinders'?'cylinders':'bulk'};
}
export function applyA160Equipment(e,design){
 if(design==='baseline')return;
 const review='Proposed A-160 alternative. Verify filtration, residual moisture/impurities, thermal stability, materials, cycle capacity and utility duties. Tags checked against supplied PFD and current model; master-register reconciliation remains open.';
 const put=(id,tag,label,data={})=>e[id]={...e[id],tag,label,areaId:'A-160',designStatus:'proposed',reviewNote:review,designScenario:design,primaryOperation:'pregdry',...data};
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
  if(!future&&design!=='baseline'&&['pregpress','pregdry'].includes(s.id)){
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
