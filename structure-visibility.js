// Display layers only: never remove parts, alter transforms or traverse load paths.
// Reviewed, complete external assemblies from the legacy generators. A support's
// shape, name, system, equipment tag or attachment to a rack does not establish
// ownership. Unclassified parts stay with the model, including integral frames,
// legs, feet, mounting hardware and supplier access assemblies.
const EXTERNAL_SUPPORT_ASSEMBLIES = new Set([
 'Pipe rack and brackets', 'Transfer pipe supports', // model.js
 'PL-166 connected vapor recovery support rack', // structural-kit.js
 'PL-801 utility rack', 'PL-801 overhead cooling utility support', // doping.js / access-geometry.js
 'HD-6201 connected pipe supports', // argon-distribution.js
]);
const EXTERNAL_ACCESS_ASSEMBLIES = new Set([
 'PL-166 elevated filter platform and access', // structural-kit.js
 'PL-801 feeder access platform', // doping.js; includes its columns and anchors
 'PL-601 permanent access', 'PL-801 permanent access', 'PL-166 permanent access', // access-stairs.js
]);

export function createStructureVisibility(model) {
 const supportIds=new Set(),accessIds=new Set(),layers=new Map();
 const registeredAccess=new Set(model.accessSystem?.partIds||[]);
 for(const deck of model.accessSystem?.decks||[]){registeredAccess.add(deck.partId);for(const id of deck.guardParts||[])registeredAccess.add(id);for(const id of deck.gates||[])registeredAccess.add(id);}
 const conduits=new Set((model.edges||[]).map(e=>e.part));
 for(const p of model.parts){
  let layer=null;
  // Equipment ownership takes precedence even if a shared register references it.
  if(conduits.has(p.id)||p.structureVisibility==='equipment'||p.exploreRole==='equipment')continue;
  if(p.structureVisibility==='access'||p.structureVisibility==='support')layer=p.structureVisibility;
  else if(p.accessGeometry||registeredAccess.has(p.id))layer='access';
  else if(p.pipeSupportTag||p.pipeSupport)layer='support';
  else if(['frame','fastener'].includes(p.system)){
   if(EXTERNAL_ACCESS_ASSEMBLIES.has(p.assembly))layer='access';
   else if(EXTERNAL_SUPPORT_ASSEMBLIES.has(p.assembly))layer='support';
  }
  if(layer){layers.set(p.id,layer);(layer==='access'?accessIds:supportIds).add(p.id);}
 }
 const state={supports:true,access:true};
 return {
  supportIds,accessIds,
  layerFor:p=>layers.get(typeof p==='number'?p:p.id)||null,
  isVisible(p){const layer=layers.get(p.id);return layer==='support'?state.supports:layer==='access'?state.access:true;},
  set(next){for(const key of ['supports','access'])if(typeof next[key]==='boolean')state[key]=next[key];return {...state};},
  getState:()=>({...state}),
  counts:{supports:supportIds.size,access:accessIds.size},
 };
}
