export const PROCESS_GROUPS=[
 {id:'production',title:'Production process',note:'Follow material from graphite premixing to the product interface.',areas:['A-100','A-140','A-160','A-200','A-300','A-400','A-500','A-600','A-700','A-800','A-900']},
 {id:'treatment',title:'Water & exhaust treatment',note:'Wastewater, reclaimed water and segregated vent-gas treatment.',areas:['A-1000','A-2000','A-3000']},
 {id:'utilities',title:'Plant utilities',note:'Compressed air, heating and cooling, and argon distribution.',areas:['A-4000','A-5000','A-6000']}
];
export const productStageByArea={'A-100':'graphite','A-140':'preg','A-160':'recovery','A-200':'oxidation','A-300':'washing','A-400':'membranes','A-500':'sonication','A-600':'drying','A-700':'thermal','A-800':'doping'};
export function processOperations(stages,area,train='feed'){return stages.filter(s=>s.train===train&&!s.containment&&(!area||s.areaId===area));}
export function adjacentProcessOperation(stages,id,delta){
 const current=stages.find(s=>s.id===id);if(!current)return null;
 const production=PROCESS_GROUPS[0].areas.includes(current.areaId);
 const sequence=processOperations(stages,null,current.train).filter(s=>production?PROCESS_GROUPS[0].areas.includes(s.areaId):s.areaId===current.areaId);
 return sequence[sequence.findIndex(s=>s.id===id)+delta]?.id||null;
}
export function mountProcessWorkspace({root=document,areas,stages,train,model,onArea,onStage,onAction}){
 const $=id=>root.getElementById(id),el=(tag,text,cls)=>{const n=root.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;};
 const overview=$('process-overview'),stageHost=$('process-stage'),allReviews=new Map();let group=null,area=null,currentStage=null,pending=false;
 const reviewStore=el('div');reviewStore.id='process-review-store';reviewStore.hidden=true;$('panel-process').append(reviewStore);
 const areaName=id=>areas.find(a=>a.id===id)?.label||id;
 const button=(title,note,fn)=>{const b=el('button',null,'process-destination');b.type='button';b.append(el('strong',title));if(note)b.append(el('span',note));b.onclick=fn;return b;};
 // Keep existing review DOM and event handlers, but give each review one home.
 const assignments={'a1000-basis':'A-1000','a2000-basis':'A-2000','a3000-basis':'A-3000','a4000-basis':'A-4000','reactor-air-review':'A-200','a5000-basis':'A-5000'};
 for(const [id,a]of Object.entries(assignments)){const card=$(id);if(card){reviewStore.append(card);if(!allReviews.has(a))allReviews.set(a,[]);allReviews.get(a).push(card);}}
 const containment=$('containment-tools');if(containment){$('panel-containment').append(containment);containment.open=true;}
 const archive=el('details',null,'method-note'),archiveTitle=el('summary','Process overview & interfaces');archive.append(archiveTitle);
 for(const id of ['train-description','scope-basis-note','scope-utilities'])if($(id))archive.append($(id));
 $('resources-dialog').append(archive);
 overview.replaceChildren();const back=el('button','← Process','back-link'),heading=el('h2','Process'),intro=el('p',null,'small-note'),list=el('div',null,'task-list'),reviews=el('div',null,'process-area-reviews');
 heading.tabIndex=-1;overview.append(back,heading,intro,list,reviews);
 // Legacy register host is retained for integrations, outside the visual UI.
 const legacy=el('ol');legacy.id='stage-list';legacy.hidden=true;overview.append(legacy);
 const menu=el('div',null,'task-list process-operation-menu'),detail=el('section',null,'process-operation-detail'),detailBack=el('button','← Operation','back-link'),detailTitle=el('h3','Operating illustrations'),detailBody=el('div');detail.hidden=true;detailTitle.tabIndex=-1;detail.append(detailBack,detailTitle,detailBody);
 const persistent=new Set(['process-overview-button','process-breadcrumb','process-stage-title','process-stage-tags','process-stage-description','stage-streams','stage-note']);
 for(const node of [...stageHost.children])if(!persistent.has(node.id)&&!node.matches('nav.stage-navigation'))detailBody.append(node);
 const connections=el('div',null,'process-connection-detail'),io=el('dl',null,'process-io-summary');
 connections.append($('stage-streams'));const routeDetails=detailBody.querySelector('#stage-routes')?.closest('details');if(routeDetails)connections.append(routeDetails);const framing=detailBody.querySelector('.stage-actions');if(framing)connections.append(framing);detailBody.insertBefore(connections,detailBody.firstElementChild||detailBody.children[0]);stageHost.insertBefore(io,$('stage-note'));
 const stageNav=stageHost.querySelector('nav.stage-navigation');stageHost.insertBefore(menu,stageNav);stageHost.insertBefore(detail,stageNav);
 $('process-overview-button').textContent='← Area overview';$('process-overview-button').onclick=()=>{currentStage=null;render();};
 detailBack.onclick=()=>{detail.hidden=true;menu.hidden=false;menu.querySelector('button')?.focus();};
 function showDetail(title,nodes,connectionsOnly=false){detailTitle.textContent=title;menu.hidden=true;detail.hidden=false;for(const node of [...detailBody.children])if(node.dataset.areaReview)reviewStore.append(node);if(nodes)for(const node of nodes){node.dataset.areaReview='true';detailBody.append(node);node.open=true;}
  // Operating controls keep their tool-owned hidden state; a wrapper selects
  // the destination without changing modeled operating conditions.
  detailBody.classList.toggle('show-area-review',!!nodes);detailBody.classList.toggle('show-connections',connectionsOnly);detailTitle.focus({preventScroll:true});$('sidebar-content').scrollTop=0;
 }
 function actions(target,ops){
  if(productStageByArea[target]&&train==='feed')menu.append(button('Trace product flow','Open the material journey at this area.',()=>onAction('product',target)));
  menu.append(button('Explore equipment','Browse equipment in '+target+'.',()=>onAction('equipment',target)));
  const thermal=target==='A-5000'||model.thermalUtilities?.consumers?.some(c=>c.area===target&&c.status!=='unresolved');
  if(thermal)menu.append(button('Thermal connections','Inspect mapped supply, heat-transfer passages and return.',()=>onAction('thermal',target)));
  if(model.containment?.cells.some(c=>c.areaId===target))menu.append(button('Spill containment','Inspect segregated capture and retention in Safety.',()=>onAction('containment',target)));
  if(allReviews.has(target))menu.append(button('Design basis & area review','Open the existing calculations, controls and findings.',()=>showDetail('Design basis · '+target,allReviews.get(target))));
 }
 function selected(stage){currentStage=stage;pending=false;if(!stage){render();return;}area=stage.areaId;group=PROCESS_GROUPS.find(g=>g.areas.includes(area))?.id||null;overview.hidden=true;stageHost.hidden=false;menu.replaceChildren();menu.hidden=false;detail.hidden=true;
  io.replaceChildren();for(const [label,rows]of [['In',stage.inputs],['Out',stage.outputs]])io.append(el('dt',label),el('dd',rows.map(row=>row[0]).join(' · ')));
  menu.append(button('Process & connections','Inputs, outputs, equipment sequence and connected routes.',()=>showDetail('Process & connections',null,true)));
  if(stage.unit||stage.feed||stage.state||stage.train==='finishing')menu.append(button('Operating illustrations','Inspect operation states and equipment sections.',()=>showDetail('Operating illustrations')));actions(area,[stage]);
 }
 function render(){pending=false;currentStage=null;overview.hidden=false;stageHost.hidden=true;for(const cards of allReviews.values())for(const card of cards)reviewStore.append(card);list.replaceChildren();reviews.replaceChildren();intro.hidden=false;
  if(area){const ops=processOperations(stages,area,train);back.hidden=false;back.textContent='← '+(PROCESS_GROUPS.find(g=>g.id===group)?.title||'Process');heading.textContent=areaName(area);intro.textContent=ops.length===1?ops[0].description:ops.length?'Choose an operation in process order.':'Review the area equipment and design basis.';
   for(const stage of ops)list.append(button(stage.title,stage.tags,()=>onStage(stage.id)));
   list.append(button('Explore equipment','Open the equipment browser for '+area+'.',()=>onAction('equipment',area)));
   if(productStageByArea[area]&&train==='feed')list.append(button('Trace product flow','Start the material journey in '+area+'.',()=>onAction('product',area)));
   if(area==='A-5000'||model.thermalUtilities?.consumers?.some(c=>c.area===area&&c.status!=='unresolved'))list.append(button('Thermal connections','Open mapped utility passages for '+area+'.',()=>onAction('thermal',area)));
   if(model.containment?.cells.some(c=>c.areaId===area))list.append(button('Spill containment','Open this area in Safety.',()=>onAction('containment',area)));
   for(const card of allReviews.get(area)||[]){card.open=false;reviews.append(card);}
  }else if(group){const g=PROCESS_GROUPS.find(g=>g.id===group);back.hidden=false;back.textContent='← Process';heading.textContent=g.title;intro.textContent=g.note;for(const id of g.areas){if(!areas.some(a=>a.id===id))continue;const ops=processOperations(stages,id,train);list.append(button(areaName(id),ops.length+' operation'+(ops.length===1?'':'s'),()=>onArea(id)));}}
  else {back.hidden=true;heading.textContent=train==='feed'?'Process':'Archived process';intro.textContent=train==='feed'?'Choose a process group or browse directly to an area.':'Independent filtration and drying concept.';if(train==='feed')for(const g of PROCESS_GROUPS)list.append(button(g.title,g.note,()=>{group=g.id;render();}));else for(const s of processOperations(stages,null,train))list.append(button(s.title,s.tags,()=>onStage(s.id)));}
 }
 back.onclick=()=>{if(area){const prior=group;area=null;onArea('all',{activate:false});group=prior;render();}else{group=null;render();}};
 function browse(value,{activate=true}={}){area=value==='all'?null:value;group=area?PROCESS_GROUPS.find(g=>g.areas.includes(area))?.id||null:null;currentStage=null;const ops=area?processOperations(stages,area,train):[];if(!activate){pending=true;return;}if(ops.length===1)onStage(ops[0].id);else render();}
 render();return {browse,selected,render,activate(){if(pending)browse(area||'all');},get state(){return {area,group,stage:currentStage?.id||null};}};
}
