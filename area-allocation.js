import {AREAS} from './engineering-register.js';
import {WATER_AREA_LAYOUT} from './a1000-basis.js';
import {floorRegion,floorDimensions} from './floor-geometry.js';
// Explicit planning decisions in assembled plant coordinates (m). Never inferred from pipe extents.
const waterRect=zone=>[zone.min[0],zone.min[2],zone.max[0],zone.max[2]];
const rects={
 'A-100':[[-42,-19,-31,-10]],'A-140':[[-31,-23,-22,-11]],
 'A-160':[[-22,-31.5,-10.2,-11]],'A-200':[[-8.5,-25,5.2,-11],[-12,-11,5.2,3.5]],
 'A-300':[[5.2,-10,12,3.5],[-2,3.5,12,14]],'A-400':[[7,16.7,35,29]],
 'A-500':[[27,6,46,16]],'A-600':[[46,5,79,18.5]],
 'A-700':[[57,18.5,87.2,32.5],[87.2,23,89,32.5]],'A-800':[[87.2,18.5,89,23],[89,12,109.7,41.6],[109.7,12,117,14.2],[109.7,31.1,117,41.6]],
 'A-900':[[109.7,14.2,117,31.1]],
 'A-1000':[waterRect(WATER_AREA_LAYOUT.wastewater)],'A-2000':[waterRect(WATER_AREA_LAYOUT.reclaimed)],
 'A-3000':[[-42,0,-32,10]],'A-4000':[[-29,0,-21,10]],'A-5000':[[-31.3,12.4,-13,28.5]],
 'A-6000':[[37,39,48.9,47.5]]
};
const allocationCache=new WeakMap();
export function buildAreaAllocations(model){if(!allocationCache.has(model))allocationCache.set(model,createAreaAllocations(model));return allocationCache.get(model);}
function createAreaAllocations(model){
 if(model.scope==='future')return {areas:[],shared:[],revision:'floor-allocation-39'};
 const zones=model.access?.zones||[];
 const shared=zones.filter(z=>(['vehicle','pedestrian','platform-access'].includes(z.kind)||(z.kind==='utility'&&/UTILITY|CORRIDOR/.test(z.id)))&&z.min[1]<.1).map(z=>({id:z.id,kind:z.kind,rect:[z.min[0],z.min[2],z.max[0],z.max[2]]}));
 const future=new Set(['A-900',...model.thermalUtilities?[]:['A-5000']]);
 const areas=AREAS.filter(a=>rects[a.id]).map(a=>{
  const polygons=structuredClone(rects[a.id]);
  if(a.id==='A-160'&&model.designScenario!=='baseline')polygons[0]=[-22,-32.2,-8.5,-11];
  const region=floorRegion(polygons,shared.map(s=>s.rect)),gross=floorRegion(polygons);
  const retention=(model.containment?.cells||[]).filter(c=>c.areaId===a.id).map(c=>({tag:c.tag,civilBlock:c.civilBlock,rect:[c.storage.min[0],c.storage.min[2],c.storage.max[0],c.storage.max[2]]}));
  const satelliteCapture=(model.containment?.cells||[]).filter(c=>c.areaId===a.id).flatMap(c=>c.patches.filter(r=>!polygons.some(p=>r[0]>=p[0]&&r[1]>=p[1]&&r[2]<=p[2]&&r[3]<=p[3])).map(r=>({tag:c.tag,rect:[...r]})));
  // Display and hit-test the intended allocation; corridor deductions belong to net accounting.
  return {...a,...gross,areaBasis:'gross allocation',dimensions:floorDimensions(gross),netRegion:region,netM2:region.areaM2,grossM2:gross.areaM2,sharedExcludedM2:gross.areaM2-region.areaM2,polygons,reserved:future.has(a.id),retention,satelliteCapture,status:future.has(a.id)?'Reserved · proposed':'Proposed floor allocation',basis:a.id==='A-2000'?WATER_AREA_LAYOUT.note:'Explicit floor allocation including local operating space. Shared grade corridors are deducted from net area only. Site limits, vendor maintenance envelopes and BC access qualification remain open.',platformBasis:'Elevated decks are separate; not added to ground area.',scenario:model.designScenario};
 });
 return {revision:'floor-allocation-39',units:'m',areas,shared,reservations:[{areaId:'A-2000',name:'Separate future expansion',...floorRegion([waterRect(WATER_AREA_LAYOUT.futureExpansion)])}],qualified:false};
}
