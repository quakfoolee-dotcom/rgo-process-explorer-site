import {explorableEquipmentIds} from './equipment-explore.js';

export function createExploreCatalog(model,register,order=Object.keys(register).map(Number)){
 const available=explorableEquipmentIds(model),entries=order.filter(id=>available.has(+id)&&register[id]).map(id=>({id:String(id),areaId:register[id].areaId,proposed:register[id].designStatus==='proposed',label:register[id].tag+' · '+register[id].name}));
 return {entries,options:({areaId='all',showProposed=true}={})=>entries.filter(e=>(areaId==='all'||e.areaId===areaId)&&(showProposed||!e.proposed))};
}
// The picker uses registered ownership, independently of visible shared services.
export function createExplorePicker({select,assembled,exploded,status,catalog,getState,option}){
 let signature='',eligible=new Set();
 function refresh(preferred=select.value){
  const state=getState(),key=state.areaId+'|'+state.showProposed;
  if(key!==signature){
   signature=key;const entries=catalog.options(state);eligible=new Set(entries.map(e=>e.id));
   const area=state.areaId==='all'?'all areas':state.areaId;
   const placeholder=entries.length?(state.areaId==='all'?'Select equipment…':'Select equipment in '+area+'…'):'No equipment available in this area';
   select.replaceChildren(option(placeholder,''),...entries.map(e=>option(e.label,e.id)));
   select.disabled=!entries.length;status.textContent=entries.length+' equipment items · '+area+(state.showProposed?'':' · proposed additions hidden');
  }
  select.value=eligible.has(String(preferred))?String(preferred):'';
  assembled.disabled=exploded.disabled=!eligible.has(select.value);
  return select.value;
 }
 return {refresh,allowed:id=>id!==''&&id!=null&&catalog.options(getState()).some(e=>e.id===String(id))};
}
