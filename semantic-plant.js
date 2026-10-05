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
export function createSemanticHost(before){const host=document.createElement('section');host.id='semantic-inspector';host.className='semantic-inspector';host.setAttribute('aria-label','Semantic Plant Core asset record');host.hidden=true;host.innerHTML='<div class="semantic-heading"><h3>Semantic Plant Core</h3><span class="semantic-version">Equipment data</span></div><p data-semantic-status class="semantic-status" role="status" aria-live="polite" hidden></p><label hidden>Asset record<select data-semantic-asset aria-label="Structured asset record"></select></label><div data-semantic-body class="semantic-body"></div>';before.before(host);return host;}
export function mountSemanticInspector({host,onHighlight,onSelectAsset}){
 const service=new SemanticPlantService(),body=host.querySelector('[data-semantic-body]'),status=host.querySelector('[data-semantic-status]');let bundle=null,token=0,componentId=null,register=null,selectedField=null,search='';const picker=host.querySelector('[data-semantic-asset]');picker.onchange=()=>openAsset(picker.value);
 function openAsset(assetId){const entry=register?.assets.find(a=>a.assetId===assetId);if(entry&&entry.equipmentId!=null&&onSelectAsset)onSelectAsset(entry);else show(assetId);}
 const TITLES={overview:'Overview',specifications:'Specifications',review:'Review items',sources:'Sources',process:'Connections',instrumentation:'Instrumentation',safety:'Safety',provenance:'Model provenance'};
 const openSections=new Set(['overview']);let selectedFrom='overview';
 function relationshipList(filter){return list(bundle.relationships.filter(filter),(li,rel)=>{const title=document.createElement('strong');title.textContent=`${rel.type} · ${rel.target}`;li.append(title,note(rel.role||rel.status,'semantic-inline'));if(register?.assets.some(a=>a.assetId===rel.target)){const open=document.createElement('button');open.textContent='Open '+rel.target;open.onclick=()=>openAsset(rel.target);li.append(open);}if(rel.geometry){const b=document.createElement('button');b.textContent='Highlight';b.onclick=()=>onHighlight(rel);li.append(b);}});}
 function evidenceList(rows){return list(rows,(li,r)=>{
  const label=r.identityHold?'Identity hold · '+r.status:r.status;
  li.append(Object.assign(document.createElement('strong'),{textContent:fieldLabel(r.property)+': '+formatValue(r.approvedValue||r.value)+(r.unit?' '+r.unit:'')}),note(label+' · '+r.sourceDocId+' '+r.sourceRevision+' · '+r.sourceLocation,'semantic-inline'));
  if(r.note)li.append(note(r.note,'semantic-inline'));if(r.identityHold)li.append(note(r.identityHold,'semantic-hold'));
  if(r.reviewer)li.append(note('Recorded review: '+r.reviewer+' · '+r.reviewDate,'semantic-inline'));
 });}
 function fieldTable(fields,from){const table=document.createElement('table');table.className='semantic-spec-table';table.setAttribute('role','table');const head=document.createElement('thead'),hr=document.createElement('tr');head.setAttribute('role','rowgroup');hr.setAttribute('role','row');for(const title of ['Property','Value','Unit','Status']){const th=document.createElement('th');th.textContent=title;th.setAttribute('scope','col');th.setAttribute('role','columnheader');hr.append(th);}head.append(hr);table.append(head);const tbody=document.createElement('tbody');tbody.setAttribute('role','rowgroup');
 for(const f of fields){const tr=document.createElement('tr'),name=document.createElement('td'),button=document.createElement('button');tr.setAttribute('role','row');name.setAttribute('role','cell');button.className='semantic-field-link';button.textContent=f.label;button.setAttribute('aria-label','Details for '+f.label);button.onclick=()=>{selectedField=f.path;selectedFrom=from;render();};name.append(button);tr.append(name);for(const text of [f.display,f.unit||'—',f.status]){const td=document.createElement('td');td.setAttribute('role','cell');td.textContent=text;if(text==='—')td.className='is-empty';if(text===f.status)td.dataset.status=text;tr.append(td);}tbody.append(tr);}table.append(tbody);return table;}
 const CONNECTION_TYPES=['connectedTo','feeds','receivesFrom','requiresUtility'];
 // Collapsible sections. Each header carries a count; a section builds its content the first time it is opened, and the open sections are remembered across records.
 function render(){if(!bundle)return;body.replaceChildren();const a=bundle.asset;
  const fields=[...propertyFields(a,bundle.evidenceRows,'design'),...propertyFields(a,bundle.evidenceRows,'operatingEnvelope')].map(presentField);
  const gaps=bundle.evidence.areas[a.hierarchy.area]?.gaps.filter(g=>g.assetId===a.assetId&&!/^closed\b/i.test(g.status))||[];
  const pending=fields.filter(f=>!['Approved','Model basis'].includes(f.status));
  if(bundle.evidence.error)body.append(note('Source details are unavailable. Reopen the record to retry.','semantic-hold'));
  if(selectedField){
   const f=fields.find(f=>f.path===selectedField),back=document.createElement('button');back.textContent='← Back to '+(TITLES[selectedFrom]||selectedFrom).toLowerCase();back.onclick=()=>{selectedField=null;render();};body.append(back);
   if(f){body.append(Object.assign(document.createElement('h4'),{textContent:f.label}),definition([['Displayed value',f.display],['Unit',f.unit||'—'],['Status',f.status]]));if(f.hold)body.append(note(f.hold,'semantic-hold'));body.append(note(f.evidence.length?'Documented values and review history':'No source value is recorded for this property.'),evidenceList(f.evidence));for(const g of gaps.filter(g=>g.subject===f.path))body.append(note('Required next action: '+g.requiredSource,'semantic-hold'));}
   return;
  }
  const fillers={
   overview(c){
    c.append(Object.assign(document.createElement('h4'),{textContent:a.name}),note(a.processFunction),note(a.assetId+' · '+a.hierarchy.area+' · '+a.assetClassId));
    if(a.dataLayer?.identityHold)c.append(note('Identity hold — see Review items.','semantic-hold'));
    c.append(fieldTable(overviewFields(fields),'overview'));
    const open=document.createElement('button');open.textContent='View all specifications ('+fields.length+')';open.onclick=()=>{openSections.add('specifications');render();};c.append(open,note(pending.length+' properties need review · '+gaps.length+' recorded source gaps','semantic-inline'));
    if(bundle.geometry.modelEquipmentId!=null){const locate=document.createElement('button');locate.textContent='Locate in model';locate.onclick=()=>onHighlight({id:'LOCATE-'+a.assetId,type:'representedBy',target:a.assetId,geometry:{equipmentIds:[bundle.geometry.modelEquipmentId]}});c.append(locate);}
   },
   specifications(c){
    const input=document.createElement('input');input.type='search';input.placeholder='Search specifications';input.setAttribute('aria-label','Search specifications');input.value=search;const results=document.createElement('div');
    const update=()=>{search=input.value;results.replaceChildren();const filtered=fields.filter(f=>(f.label+' '+f.path+' '+f.current+' '+f.status).toLowerCase().includes(search.toLowerCase()));
     if(!filtered.length)results.append(note('No matching specifications.'));
     for(const [i,group] of ['Capacity & dimensions','Operating conditions','Mechanical design','Materials','Utilities & duties'].entries()){const rows=filtered.filter(f=>f.group===group);if(!rows.length)continue;const section=document.createElement('details');section.className='semantic-group';section.open=!!search||i===0;section.append(Object.assign(document.createElement('summary'),{textContent:group+' ('+rows.length+')'}),fieldTable(rows,'specifications'));results.append(section);}
    };input.oninput=update;c.append(input,results);update();
   },
   review(c){
    if(a.dataLayer?.identityHold)c.append(note(a.dataLayer.identityHold.reason,'semantic-hold'));
    c.append(note('Open a property to compare values and read the recorded decision.'),fieldTable(pending,'review'));
    const section=document.createElement('details');section.className='semantic-group';section.append(Object.assign(document.createElement('summary'),{textContent:'Source gaps and required actions ('+gaps.length+')'}),list(gaps,(li,g)=>{li.append(note(fieldLabel(g.subject)),note(g.requiredSource,'semantic-inline'),note(g.gapId,'semantic-inline'));}));c.append(section);
    const notes=document.createElement('details');notes.className='semantic-group';notes.append(Object.assign(document.createElement('summary'),{textContent:'Model review notes'}),list(a.reviewFindings||[],(li,item)=>li.textContent=item));c.append(notes);
   },
   sources(c){
    c.append(note('Documents and recorded evidence. Source status does not establish equipment approval.'));
    const bySource=new Map();for(const r of bundle.evidenceRows){const key=r.sourceDocId+' · '+r.sourceRevision;if(!bySource.has(key))bySource.set(key,[]);bySource.get(key).push(r);}
    for(const [source,rows] of bySource){const d=document.createElement('details');d.className='semantic-group';d.append(Object.assign(document.createElement('summary'),{textContent:source+' ('+rows.length+' values)'}),evidenceList(rows));c.append(d);}
    const documents=document.createElement('details');documents.className='semantic-group';documents.append(Object.assign(document.createElement('summary'),{textContent:'Document register ('+bundle.documents.length+')'}),list(bundle.documents,(li,d)=>{li.append(note(d.documentId+' · '+d.title),note(value(d.revision)+' · '+d.status,'semantic-inline'));if(d.href?.startsWith('./')){const link=document.createElement('a');link.href=d.href;link.target='_blank';link.rel='noopener';link.textContent='Open source sheet';li.append(link);}}));c.append(documents);
   },
   process(c){
    for(const basis of a.processBasis||[])c.append(note(basis.label+': '+formatValue(basis.value)+' '+basis.unit+' · '+basis.status,'semantic-hold'));
    c.append(note('Connected equipment and streams'),relationshipList(r=>CONNECTION_TYPES.includes(r.type)),list(bundle.streams,(li,s)=>{li.append(Object.assign(document.createElement('strong'),{textContent:s.streamId+' · '+s.name}),note(`${s.source}${s.directionality==='bidirectional'?' ↔ ':' → '}${s.via?.length?s.via.join(' → ')+' → ':''}${s.destination}${s.alternativeVia?.length?' · alternative pumps: '+s.alternativeVia.join(' / '):''}`,'semantic-inline'),note(`${s.material} · ${s.phase} · ${s.operatingMode?s.operatingMode+' · ':''}${s.status}`,'semantic-inline'),note('Feed ratio: '+(s.feedRatio?s.feedRatio.value+' '+s.feedRatio.unit:'Unresolved')+' · Mass flow: '+(s.massFlow?s.massFlow.value+' '+s.massFlow.unit:'Unresolved'),'semantic-inline'));}));
   },
   instrumentation(c){c.append(relationshipList(r=>['monitoredBy','controlledBy'].includes(r.type)),list(bundle.instruments,(li,i)=>{li.append(Object.assign(document.createElement('strong'),{textContent:i.variable+' · '+i.functionId}),note(i.purpose,'semantic-inline'),note(i.status,'semantic-inline'));}),note('Function records are explicit; null tags and ranges remain controlled source gaps until an issued P&ID and instrument index are available.','semantic-hold'));},
   safety(c){c.append(relationshipList(r=>r.type==='protectedBy'),list(a.reviewFindings||[],(li,item)=>{li.textContent=item;}),note('Functional intent is shown; no alarm, trip, relief or SIL setpoint is asserted.','semantic-hold'));},
   provenance(c){c.append(definition([['Geometry binding',bundle.geometry.bindingId],['Equipment owner',bundle.geometry.modelEquipmentId],['Operational state',bundle.state.operational],['Maintenance state',bundle.state.maintenance],['Alarm state',bundle.state.alarm],['Simulation state',bundle.state.simulation]]),note(bundle.stateNote,'semantic-hold'),list(bundle.provenance,(li,p)=>{li.append(Object.assign(document.createElement('strong'),{textContent:p.property}),note(`${value(p.value)} · ${p.status} · ${p.source||'No approved source'}`,'semantic-inline'));}));}
  };
  const counts={overview:null,specifications:fields.length,review:pending.length,sources:bundle.evidenceRows.length,
   process:bundle.relationships.filter(r=>CONNECTION_TYPES.includes(r.type)).length+bundle.streams.length,
   instrumentation:bundle.relationships.filter(r=>['monitoredBy','controlledBy'].includes(r.type)).length+bundle.instruments.length,
   safety:bundle.relationships.filter(r=>r.type==='protectedBy').length+(a.reviewFindings||[]).length,
   provenance:bundle.provenance.length};
  for(const id of Object.keys(TITLES)){
   const count=counts[id];if(count===0&&['process','instrumentation','safety','provenance'].includes(id))continue;
   const section=document.createElement('details'),summary=document.createElement('summary'),title=document.createElement('span'),content=document.createElement('div');
   section.className='semantic-section';section.dataset.section=id;title.className='semantic-section-title';title.textContent=TITLES[id];summary.append(title);
   if(count!=null){const badge=document.createElement('span');badge.className='semantic-section-count';badge.textContent=String(count);summary.append(badge);}
   content.className='semantic-section-body';section.append(summary,content);
   let built=false;const build=()=>{if(!built){built=true;fillers[id](content);}};
   section.open=openSections.has(id);if(section.open)build();
   section.ontoggle=()=>{if(section.open){openSections.add(id);build();}else openSections.delete(id);};
   body.append(section);
  }
 }
 async function show(assetId,nextComponentId=null){
  const current=++token;bundle=null;componentId=nextComponentId;host.hidden=false;status.hidden=false;status.textContent='Loading structured record…';body.replaceChildren();
  try{
   register=await service.index();if(current!==token)return;
   const candidates=String(assetId||'').split(' / '),entry=register.assets.find(a=>candidates.includes(a.assetId));
   if(!entry){host.hidden=true;return;}
   picker.replaceChildren(...register.assets.map(a=>{const o=document.createElement('option');o.value=a.assetId;o.textContent=a.assetId+' · '+a.area+(a.recordScope==='external-interface'?' · interface':'');return o;}));picker.value=entry.assetId;
   const loaded=await service.assetBundle(entry.assetId);if(current!==token)return;bundle=loaded;status.hidden=true;selectedField=null;search='';render();
  }catch(error){if(current!==token)return;status.hidden=false;status.textContent=error.message;}
 }
 function hide(){token++;bundle=null;host.hidden=true;}
 return{show,hide};
}
