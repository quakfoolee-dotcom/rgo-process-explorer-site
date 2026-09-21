import {propertyFields,formatValue,fieldLabel,presentField,overviewFields} from './semantic-fields.js?v=168';
const BASE=new URL('./semantic/v1/',document.baseURI);
async function json(path){const response=await fetch(new URL(path,BASE));if(!response.ok)throw Error(`Semantic record unavailable (${response.status}).`);return response.json();}
export class SemanticPlantService{
 constructor(){this.cache=new Map();this.indexPromise=null;this.evidencePromise=null;}
 async index(){if(!this.indexPromise)this.indexPromise=json('index.json').catch(error=>{this.indexPromise=null;throw error;});return this.indexPromise;}
 async evidence(){if(!this.evidencePromise)this.evidencePromise=fetch(new URL('./semantic-evidence.json',document.baseURI)).then(r=>{if(!r.ok)throw Error('Source evidence unavailable');return r.json();}).catch(error=>{this.evidencePromise=null;return {error:error.message,assets:{},areas:{}};});return this.evidencePromise;}
 async assetBundle(assetId){if(this.cache.has(assetId))return this.cache.get(assetId);const safe=encodeURIComponent(assetId),request=Promise.all([
  json(`assets/${safe}.json`),json(`relationships/${safe}.json`),json(`streams/${safe}.json`),json(`documents/${safe}.json`),json(`state/${safe}.json`),json(`geometry/${safe}.json`),json(`provenance/${safe}.json`),json(`instruments/${safe}.json`),this.evidence()
 ]).then(([asset,relationships,streams,documents,state,geometry,provenance,instruments,evidence])=>({evidence,evidenceRows:(evidence.assets[assetId]?.rows||[]).filter(r=>r.area===asset.hierarchy.area),asset,relationships:relationships.relationships,streams:streams.streams,documents:documents.documents,state:state.state,stateNote:state.note,geometry,provenance:provenance.properties,instruments:instruments.instruments}));request.then(b=>{if(b.evidence.error)this.cache.delete(assetId);},()=>{});this.cache.set(assetId,request);request.catch(()=>this.cache.delete(assetId));return request;}
}
const value=v=>v==null?'Unresolved':String(v);
function row(label,content){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value(content);return[dt,dd];}
function definition(rows){const dl=document.createElement('dl');for(const item of rows)dl.append(...row(...item));return dl;}
function note(text,className='semantic-note'){const p=document.createElement('p');p.className=className;p.textContent=text;return p;}
function list(items,render){const ul=document.createElement('ul');ul.className='semantic-list';for(const item of items){const li=document.createElement('li');render(li,item);ul.append(li);}return ul;}
export function createSemanticHost(before){const host=document.createElement('section');host.id='semantic-inspector';host.className='semantic-inspector';host.setAttribute('aria-label','Semantic Plant Core asset record');host.hidden=true;host.innerHTML='<div class="semantic-heading"><h3>Semantic Plant Core</h3><span class="semantic-version">Equipment data</span></div><p data-semantic-status class="semantic-status" role="status" aria-live="polite" hidden></p><label>Asset record<select data-semantic-asset aria-label="Structured asset record"></select></label><div data-semantic-tabs class="semantic-tabs" role="tablist" aria-label="Semantic asset information"></div><div data-semantic-body class="semantic-body"></div>';before.before(host);return host;}
export function mountSemanticInspector({host,onHighlight,onSelectAsset}){
 const service=new SemanticPlantService(),tabs=host.querySelector('[data-semantic-tabs]'),body=host.querySelector('[data-semantic-body]'),status=host.querySelector('[data-semantic-status]');let bundle=null,active='overview',token=0,componentId=null,register=null,selectedField=null,search='';const picker=host.querySelector('[data-semantic-asset]');picker.onchange=()=>openAsset(picker.value);
 function openAsset(assetId){const entry=register?.assets.find(a=>a.assetId===assetId);if(entry&&entry.equipmentId!=null&&onSelectAsset)onSelectAsset(entry);else show(assetId);}
 const sections=['overview','specifications','review','sources'];
 function tabButtons(){tabs.replaceChildren(...sections.map(id=>{const b=document.createElement('button');b.textContent=({review:'Review items'})[id]||id[0].toUpperCase()+id.slice(1);b.dataset.semanticTab=id;b.setAttribute('aria-pressed',String(active===id));b.onclick=()=>{active=id;selectedField=null;render();};return b;}));
 const more=document.createElement('select');more.setAttribute('aria-label','More equipment information');for(const [id,label] of [['','More…'],['process','Connections'],['instrumentation','Instrumentation'],['safety','Safety'],['provenance','Model provenance']]){const option=document.createElement('option');option.value=id;option.textContent=label;more.append(option);}more.value=sections.includes(active)?'':active;more.onchange=()=>{if(more.value){active=more.value;selectedField=null;render();}};tabs.append(more);}
 function relationshipList(filter){return list(bundle.relationships.filter(filter),(li,rel)=>{const title=document.createElement('strong');title.textContent=`${rel.type} · ${rel.target}`;li.append(title,note(rel.role||rel.status,'semantic-inline'));if(register?.assets.some(a=>a.assetId===rel.target)){const open=document.createElement('button');open.textContent='Open '+rel.target;open.onclick=()=>openAsset(rel.target);li.append(open);}if(rel.geometry){const b=document.createElement('button');b.textContent='Highlight';b.onclick=()=>onHighlight(rel);li.append(b);}});}
 function evidenceList(rows){return list(rows,(li,r)=>{
  const label=r.identityHold?'Identity hold · '+r.status:r.status;
  li.append(Object.assign(document.createElement('strong'),{textContent:fieldLabel(r.property)+': '+formatValue(r.approvedValue||r.value)+(r.unit?' '+r.unit:'')}),note(label+' · '+r.sourceDocId+' '+r.sourceRevision+' · '+r.sourceLocation,'semantic-inline'));
  if(r.note)li.append(note(r.note,'semantic-inline'));if(r.identityHold)li.append(note(r.identityHold,'semantic-hold'));
  if(r.reviewer)li.append(note('Recorded review: '+r.reviewer+' · '+r.reviewDate,'semantic-inline'));
 });}
 function fieldTable(fields){const table=document.createElement('table');table.className='semantic-spec-table';const head=document.createElement('thead'),hr=document.createElement('tr');for(const title of ['Property','Value','Unit','Status']){const th=document.createElement('th');th.textContent=title;th.setAttribute('scope','col');hr.append(th);}head.append(hr);table.append(head);const tbody=document.createElement('tbody');
 for(const f of fields){const tr=document.createElement('tr'),name=document.createElement('td'),button=document.createElement('button');button.className='semantic-field-link';button.textContent=f.label;button.setAttribute('aria-label','Details for '+f.label);button.onclick=()=>{selectedField=f.path;render();};name.append(button);tr.append(name);for(const text of [f.display,f.unit||'—',f.status]){const td=document.createElement('td');td.textContent=text;tr.append(td);}tbody.append(tr);}table.append(tbody);return table;}
 function render(){if(!bundle)return;tabButtons();body.replaceChildren();const a=bundle.asset;
  const fields=[...propertyFields(a,bundle.evidenceRows,'design'),...propertyFields(a,bundle.evidenceRows,'operatingEnvelope')].map(presentField);
  const gaps=bundle.evidence.areas[a.hierarchy.area]?.gaps.filter(g=>g.assetId===a.assetId&&!/^closed\b/i.test(g.status))||[];
  if(bundle.evidence.error)body.append(note('Source details are unavailable. Reopen the record to retry.','semantic-hold'));
  if(selectedField){
   const f=fields.find(f=>f.path===selectedField),back=document.createElement('button');back.textContent='← Back to '+({specifications:'specifications',review:'review items',sources:'sources',overview:'overview'}[active]||active);back.onclick=()=>{selectedField=null;render();};body.append(back);
   if(f){body.append(Object.assign(document.createElement('h4'),{textContent:f.label}),definition([['Displayed value',f.display],['Unit',f.unit||'—'],['Status',f.status]]));if(f.hold)body.append(note(f.hold,'semantic-hold'));body.append(note(f.evidence.length?'Documented values and review history':'No source value is recorded for this property.'),evidenceList(f.evidence));for(const g of gaps.filter(g=>g.subject===f.path))body.append(note('Required next action: '+g.requiredSource,'semantic-hold'));}
   return;
  }
  if(active==='overview'){
   body.append(Object.assign(document.createElement('h4'),{textContent:a.name}),note(a.processFunction),note(a.assetId+' · '+a.hierarchy.area+' · '+a.assetClassId));
   if(a.dataLayer?.identityHold)body.append(note('Identity hold — see Review items.','semantic-hold'));
   body.append(fieldTable(overviewFields(fields)));
   const pending=fields.filter(f=>!['Approved','Model basis'].includes(f.status)).length;
   const open=document.createElement('button');open.textContent='View all specifications ('+fields.length+')';open.onclick=()=>{active='specifications';render();};body.append(open,note(pending+' properties need review · '+gaps.length+' recorded source gaps','semantic-inline'));
   if(bundle.geometry.modelEquipmentId!=null){const locate=document.createElement('button');locate.textContent='Locate in model';locate.onclick=()=>onHighlight({id:'LOCATE-'+a.assetId,type:'representedBy',target:a.assetId,geometry:{equipmentIds:[bundle.geometry.modelEquipmentId]}});body.append(locate);}
  }
  if(active==='specifications'){
   const input=document.createElement('input');input.type='search';input.placeholder='Search specifications';input.setAttribute('aria-label','Search specifications');input.value=search;const results=document.createElement('div');
   const update=()=>{search=input.value;results.replaceChildren();const filtered=fields.filter(f=>(f.label+' '+f.path+' '+f.current+' '+f.status).toLowerCase().includes(search.toLowerCase()));
    if(!filtered.length)results.append(note('No matching specifications.'));
    for(const [i,group] of ['Capacity & dimensions','Operating conditions','Mechanical design','Materials','Utilities & duties'].entries()){const rows=filtered.filter(f=>f.group===group);if(!rows.length)continue;const section=document.createElement('details');section.className='semantic-group';section.open=!!search||i===0;section.append(Object.assign(document.createElement('summary'),{textContent:group+' ('+rows.length+')'}),fieldTable(rows));results.append(section);}
   };input.oninput=update;body.append(input,results);update();
  }
  if(active==='review'){
   if(a.dataLayer?.identityHold)body.append(note(a.dataLayer.identityHold.reason,'semantic-hold'));
   const pending=fields.filter(f=>!['Approved','Model basis'].includes(f.status));body.append(note('Open a property to compare values and read the recorded decision.'),fieldTable(pending));
   const section=document.createElement('details');section.className='semantic-group';section.append(Object.assign(document.createElement('summary'),{textContent:'Source gaps and required actions ('+gaps.length+')'}),list(gaps,(li,g)=>{li.append(note(fieldLabel(g.subject)),note(g.requiredSource,'semantic-inline'),note(g.gapId,'semantic-inline'));}));body.append(section);
   const notes=document.createElement('details');notes.className='semantic-group';notes.append(Object.assign(document.createElement('summary'),{textContent:'Model review notes'}),list(a.reviewFindings||[],(li,item)=>li.textContent=item));body.append(notes);
  }
  if(active==='sources'){
   body.append(note('Documents and recorded evidence. Source status does not establish equipment approval.'));
   const bySource=new Map();for(const r of bundle.evidenceRows){const key=r.sourceDocId+' · '+r.sourceRevision;if(!bySource.has(key))bySource.set(key,[]);bySource.get(key).push(r);}
   for(const [source,rows] of bySource){const d=document.createElement('details');d.className='semantic-group';d.append(Object.assign(document.createElement('summary'),{textContent:source+' ('+rows.length+' values)'}),evidenceList(rows));body.append(d);}
   const documents=document.createElement('details');documents.className='semantic-group';documents.append(Object.assign(document.createElement('summary'),{textContent:'Document register'}),list(bundle.documents,(li,d)=>{li.append(note(d.documentId+' · '+d.title),note(value(d.revision)+' · '+d.status,'semantic-inline'));if(d.href?.startsWith('./')){const link=document.createElement('a');link.href=d.href;link.target='_blank';link.rel='noopener';link.textContent='Open source sheet';li.append(link);}}));body.append(documents);
  }
  if(active==='process')for(const basis of a.processBasis||[])body.append(note(basis.label+': '+formatValue(basis.value)+' '+basis.unit+' · '+basis.status,'semantic-hold'));
  if(active==='process')body.append(note('Connected equipment and streams'),relationshipList(r=>['connectedTo','feeds','receivesFrom','requiresUtility'].includes(r.type)),list(bundle.streams,(li,s)=>{li.append(Object.assign(document.createElement('strong'),{textContent:s.streamId+' · '+s.name}),note(`${s.source}${s.directionality==='bidirectional'?' ↔ ':' → '}${s.via?.length?s.via.join(' → ')+' → ':''}${s.destination}${s.alternativeVia?.length?' · alternative pumps: '+s.alternativeVia.join(' / '):''}`,'semantic-inline'),note(`${s.material} · ${s.phase} · ${s.operatingMode?s.operatingMode+' · ':''}${s.status}`,'semantic-inline'),note('Feed ratio: '+(s.feedRatio?s.feedRatio.value+' '+s.feedRatio.unit:'Unresolved')+' · Mass flow: '+(s.massFlow?s.massFlow.value+' '+s.massFlow.unit:'Unresolved'),'semantic-inline'));}));
  if(active==='instrumentation')body.append(relationshipList(r=>['monitoredBy','controlledBy'].includes(r.type)),list(bundle.instruments,(li,i)=>{li.append(Object.assign(document.createElement('strong'),{textContent:i.variable+' · '+i.functionId}),note(i.purpose,'semantic-inline'),note(i.status,'semantic-inline'));}),note('Function records are explicit; null tags and ranges remain controlled source gaps until an issued P&ID and instrument index are available.','semantic-hold'));
  if(active==='safety')body.append(relationshipList(r=>r.type==='protectedBy'),list(a.reviewFindings,(li,item)=>{li.textContent=item;}),note('Functional intent is shown; no alarm, trip, relief or SIL setpoint is asserted.','semantic-hold'));
  if(active==='documents')body.append(list(bundle.documents,(li,d)=>{li.append(Object.assign(document.createElement('strong'),{textContent:d.documentId}),note(`${d.title} · ${value(d.revision)}${d.page?(d.file?' · excerpt page ':' · page ')+d.page:''} · ${d.status}`,'semantic-inline'));if(d.href?.startsWith('./')){const link=document.createElement('a');link.href=d.href;link.target='_blank';link.rel='noopener';link.textContent='Open reviewed source sheet';li.append(link);}if(d.revisionNote)li.append(note(d.revisionNote,'semantic-inline'));}));
  if(active==='provenance')body.append(definition([['Geometry binding',bundle.geometry.bindingId],['Equipment owner',bundle.geometry.modelEquipmentId],['Operational state',bundle.state.operational],['Maintenance state',bundle.state.maintenance],['Alarm state',bundle.state.alarm],['Simulation state',bundle.state.simulation]]),note(bundle.stateNote,'semantic-hold'),list(bundle.provenance,(li,p)=>{li.append(Object.assign(document.createElement('strong'),{textContent:p.property}),note(`${value(p.value)} · ${p.status} · ${p.source||'No approved source'}`,'semantic-inline'));}));
 }
 async function show(assetId,nextComponentId=null){
  const current=++token;bundle=null;componentId=nextComponentId;host.hidden=false;status.hidden=false;status.textContent='Loading structured record…';body.replaceChildren();
  try{
   register=await service.index();if(current!==token)return;
   const candidates=String(assetId||'').split(' / '),entry=register.assets.find(a=>candidates.includes(a.assetId));
   if(!entry){host.hidden=true;return;}
   picker.replaceChildren(...register.assets.map(a=>{const o=document.createElement('option');o.value=a.assetId;o.textContent=a.assetId+' · '+a.area+(a.recordScope==='external-interface'?' · interface':'');return o;}));picker.value=entry.assetId;
   const loaded=await service.assetBundle(entry.assetId);if(current!==token)return;bundle=loaded;status.hidden=true;active='overview';selectedField=null;search='';render();
  }catch(error){if(current!==token)return;status.hidden=false;status.textContent=error.message;}
 }
 function hide(){token++;bundle=null;host.hidden=true;}
 tabButtons();return{show,hide};
}
