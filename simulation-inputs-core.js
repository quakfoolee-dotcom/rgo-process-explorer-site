export const INPUT_STATUSES={unresolved:'Unresolved',measured:'Measured',feed:'FEED estimate',assumed:'Assumed'};
export function validateInput(row){
 if(!Object.hasOwn(INPUT_STATUSES,row.status))return 'Choose a recognized source status.';
 if(typeof row.source!=='string'||row.source.length>1200)return 'Enter a source statement of at most 1,200 characters.';
 if(row.status==='unresolved')return row.value===null?null:'An unresolved input must have no value.';
 if(typeof row.source!=='string'||!row.source.trim())return 'A source or assumption statement is required.';
 if(row.source.length>1200)return 'Keep the source statement within 1,200 characters.';
 if(row.type==='text')return typeof row.value==='string'&&row.value.trim()&&row.value.length<=1200?null:'Enter a condition of 1–1,200 characters.';
 if(typeof row.value!=='number'||!Number.isFinite(row.value))return 'Enter a finite numeric value.';
 if(row.positive?row.value<=0:row.value<(row.min??0))return row.positive?'This input must be greater than zero.':'This input cannot be negative.';
 return null;
}
export function evaluateSimulationInputs(rows,inactive=[]){
 const byId=new Map(rows.map(r=>[r.id,r])),missing=ids=>ids.filter(id=>{const r=byId.get(id);return !r||r.status==='unresolved'||validateInput(r);}),value=id=>byId.get(id).value;
 const segmentIds=['segment-length','segment-bore','segment-flow'],segment={missing:missing(segmentIds)};
 if(!segment.missing.length){const q=value('segment-flow')/3600,d=value('segment-bore')/1000,l=value('segment-length');segment.velocity=q/(Math.PI*d*d/4);segment.holdup=Math.PI*d*d/4*l;segment.transitSeconds=q>0?segment.holdup/q:null;if(![segment.velocity,segment.holdup,...segment.transitSeconds==null?[]:[segment.transitSeconds]].every(Number.isFinite)||!(segment.holdup>0))segment.error='Inputs exceed the numerical range of this calculation.';segment.basis=segmentIds.some(id=>byId.get(id).status==='assumed')?'Assumed scenario':'Source-declared screening';}
 const branches=[...'ABCDEFGH'].filter(b=>!inactive.includes(b)),tffIds=['tff-header',...branches.map(b=>'tff-'+b)],tff={branches,missing:missing(tffIds)};
 if(!tff.missing.length){tff.header=value('tff-header');tff.sum=branches.reduce((sum,b)=>sum+value('tff-'+b),0);tff.residual=tff.header-tff.sum;tff.balanced=Math.abs(tff.residual)<=Math.max(1,tff.header)*1e-9;tff.noPaths=!branches.length;if(![tff.header,tff.sum,tff.residual].every(Number.isFinite))tff.error='Inputs exceed the numerical range of this calculation.';
  if(!missing(['tff-permeate']).length){tff.permeate=value('tff-permeate');tff.returnFlow=tff.header-tff.permeate;tff.removalValid=tff.permeate<=tff.header;}
 }
 const inventoryIds=['tff-makeup','tff-permeate','tff-product'],inventory={missing:missing(inventoryIds)};
 if(!inventory.missing.length){inventory.change=value('tff-makeup')-value('tff-permeate')-value('tff-product');if(!Number.isFinite(inventory.change))inventory.error='Inputs exceed the numerical range of this calculation.';}
 return {segment,tff,inventory,unresolved:rows.filter(r=>r.status==='unresolved').length,total:rows.length};
}
export function exportSimulationScenario(register,rows,inactive){return {schema:register.schema,layout:register.layout,exportedAt:new Date().toISOString(),inputs:rows.filter(r=>r.editable).map(({id,value,status,source})=>({id,value,status,source})),inactive:[...inactive]};}
export function importSimulationScenario(register,rows,data){
 if(!data||data.schema!==register.schema||data.layout!==register.layout||!Array.isArray(data.inputs))throw Error('Use a scenario exported from this register and reference layout.');
 const byId=new Map(rows.map(r=>[r.id,r])),updates=new Map();
 for(const input of data.inputs){const row=byId.get(input?.id);if(!row?.editable||updates.has(row.id))throw Error('Unknown, locked or duplicate input.');const next={...row,value:input.value,status:input.status,source:input.source};const error=validateInput(next);if(error)throw Error(row.asset+': '+error);updates.set(row.id,next);}
 if(!Array.isArray(data.inactive)||data.inactive.some(b=>typeof b!=='string'||b.length!==1||!'ABCDEFGH'.includes(b))||new Set(data.inactive).size!==data.inactive.length)throw Error('Invalid membrane availability.');
 return {rows:rows.map(r=>updates.get(r.id)||{...r}),inactive:[...data.inactive]};
}
