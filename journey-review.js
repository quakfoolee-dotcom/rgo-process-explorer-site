import {journeySegmentKey} from './product-journey.js';

// Repeatable visual checks. These definitions choose real compiled paths; they
// neither fabricate connections nor infer visual acceptance from graph tests.
export const JOURNEY_REVIEW_REVISION='2026-09-10-guided-1';
export const JOURNEY_REVIEWS=[
 {id:'headers',title:'1 · Shared headers',expect:'Check that the shared passage is drawn once, arrows agree with the active transfer, and markers follow the junction without a visible jump.',variants:[
  {id:'feed',title:'R-141 common supply',operation:'preg-0',branch:'A',frame:'shared'},
  {id:'collection',title:'R-201 common collection',operation:'oxidation-collect',branch:'A',pump:'A',frame:'shared'}]},
 {id:'membranes',title:'2 · Membrane circulation',expect:'Follow feed into the modules and retentate back to T-402. Check nozzle joins and flow direction. Circulating markers illustrate paths; they do not specify equal branch flow.',variants:[
  {id:'bank',title:'TFF-401 · complete bank',operation:'membrane-circulate'},
  {id:'branch-c',title:'TFF-401C · feed and return',operation:'membrane-circulate',frame:'C'}]},
 {id:'isolation',title:'3 · Local and shared isolation',expect:'Compare the three states. Open: eight available paths. Local C closure: C inlet and return close, seven paths remain. Shared closure: no branch movement. Reopening must resume the available paths.',variants:[
  {id:'open',title:'All eight paths available',operation:'membrane-circulate'},
  {id:'local',title:'Close TFF-C inlet',operation:'membrane-circulate',closure:'XV-TFF-C-IN',frame:'C'},
  {id:'shared',title:'Close common header',operation:'membrane-circulate',closure:'shared'}]},
 {id:'transitions',title:'4 · Reactor and pump alternatives',expect:'Play this short segment. At the branch change the demonstration restarts at a common source. Check that it does not imply transfer from reactor A into B or simultaneous duty of both pumps.',variants:[
  {id:'preg',title:'R-141A discharge → R-141B fill',operation:'preg-2',branch:'A',transition:true},
  {id:'pump',title:'R-201A · P-206A → P-206B',operation:'oxidation-collect',branch:'A',pump:'A',transition:true},
  {id:'reactor',title:'R-201A discharge → R-201B feed',operation:'oxidation-collect',branch:'A',pump:'B',transition:true}]},
 {id:'markers',title:'5 · Marker scale and X-ray',expect:'Zoom into the C-branch nozzles and compare all four settings. Inspection markers stay within the display envelope; Overview symbols intentionally enlarge. X-ray changes assembly transparency. Route markers remain a visibility overlay, so visibility through a wall is not evidence of a physical opening.',variants:[
  {id:'inspection-solid',title:'Inspection · X-ray off',operation:'membrane-circulate',frame:'C'},
  {id:'inspection-xray',title:'Inspection · X-ray on',operation:'membrane-circulate',frame:'C',xray:true},
  {id:'overview-solid',title:'Overview · X-ray off',operation:'membrane-circulate',frame:'C',overview:true},
  {id:'overview-xray',title:'Overview · X-ray on',operation:'membrane-circulate',frame:'C',overview:true,xray:true}]},
 {id:'restoration',title:'6 · Restore the prior view',expect:'Return from an active journey. Compare the camera, area, section, explosion and selection with the saved starting view. A numerical match supports this check; confirm the rendered view yourself. Returning also restores the previous tool panel: reopen Inspect → Route tracing to record your observation.',variants:[
  {id:'return',title:'End journey and compare',restore:true}]}
];
export function reviewVariant(caseId,variantId){
 const check=JOURNEY_REVIEWS.find(c=>c.id===caseId),variant=check?.variants.find(v=>v.id===variantId);
 if(!variant)throw new Error('Unknown review view.');return {check,variant,key:caseId+'/'+variantId};
}
export function resolveJourneyReview(plan,variant){
 if(Object.values(plan.choices).some(c=>c!=='All'))throw new Error('Review requires All production branches.');
 const index=plan.steps.findIndex(s=>s.operation===variant.operation&&(!variant.branch||s.branch===variant.branch)&&(!variant.pump||s.pumpBranch===variant.pump));
 if(index<0)throw new Error('This review operation is unavailable in the selected configuration.');
 const step=plan.steps[index],endIndex=variant.transition?index+1:index,next=plan.steps[endIndex];
 if(!next||step.status!=='connected'||next.status!=='connected')throw new Error('Review path is unresolved. Inspect the connection finding first.');
 if(variant.transition&&!next.alternativeStart)throw new Error('The next step is not the expected alternative.');
 let closure=variant.closure||'';
 if(closure==='shared')closure=[...step.tags].find(tag=>step.paths.every(p=>p.segments.some(s=>s.tag===tag)));
 if(variant.closure&&!closure)throw new Error('No common isolation was resolved.');
 if(closure&&!step.tags.has(closure))throw new Error('The requested isolation is not on this path.');
 let frameIds=new Set(step.frameIds||step.partIds);
 if(variant.frame==='shared'){
  const alternatives=plan.steps.filter(s=>s.operation===step.operation),first=step.paths.flatMap(p=>p.segments);
  const sets=alternatives.map(s=>new Set(s.paths.flatMap(p=>p.segments.map(journeySegmentKey))));
  frameIds=new Set(first.filter(s=>sets.every(keys=>keys.has(journeySegmentKey(s)))).map(s=>s.part));
 }else if(variant.frame){
  const path=step.paths.find(p=>p.branch===variant.frame);if(!path)throw new Error('Requested membrane branch is unavailable.');
  // Include both common legs and the local branch; the reviewer may zoom further.
  frameIds=new Set(path.segments.map(s=>s.part));
 }
 if(variant.transition)for(const id of next.frameIds||next.partIds)frameIds.add(id);
 if(!frameIds.size)throw new Error('No modeled parts are available for framing this review.');
 return {index,endIndex,closure,frameIds,fraction:variant.transition?.82:closure?0:.35,overview:!!variant.overview,xray:!!variant.xray};
}
export function compareReviewViews(before,after,tolerance=1e-7){
 const differences=[];
 function compare(a,b,path){
  if(typeof a==='number'&&typeof b==='number'){if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>tolerance)differences.push(path);return;}
  if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const key of new Set([...Object.keys(a),...Object.keys(b)]))compare(a[key],b[key],path?path+'.'+key:key);return;}
  if(a!==b)differences.push(path);
 }
 if(!before||!after)return {matches:false,differences:['missing view evidence']};
 compare(before,after,'');return {matches:differences.length===0,differences,tolerance};
}
export function createJourneyReviewLog(){
 const records=new Map();
 return {
  record(key,{status,note,prepared,observed,screenshot=null}){
   const [caseId,variantId]=key.split('/');reviewVariant(caseId,variantId);
   if(!['clear','issue','pending'].includes(status))throw new Error('Choose a valid observation.');
   if(status!=='pending'&&(!prepared||!observed?.webglAvailable))throw new Error('Prepare this view in a working 3D session before recording an observation.');
   if(status!=='pending'&&!note?.trim())throw new Error('Describe what you observed before saving.');
   const record={status,note:note?.trim()||'',recordedAt:new Date().toISOString(),prepared,observed,screenshot};
   records.set(key,structuredClone(record));return record;
  },
  get:key=>records.get(key),
  export(){return {schema:'rgo-journey-visual-review/v1',reviewRevision:JOURNEY_REVIEW_REVISION,exportedAt:new Date().toISOString(),basis:'User-recorded visual observations of an illustrative animation. Pending views are not accepted. No quantitative or engineering qualification.',records:JOURNEY_REVIEWS.flatMap(c=>c.variants.map(v=>({key:c.id+'/'+v.id,check:c.title,view:v.title,expected:c.expect,...(records.get(c.id+'/'+v.id)||{status:'pending',note:''})}))) };}
 };
}
