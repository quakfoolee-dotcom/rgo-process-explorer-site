import {EMERGENCY_AREA_SCOPE,EMERGENCY_REVIEW_ACTIONS} from './emergency-task-basis.js';
import {EMERGENCY_EXPOSURE_POINTS} from './emergency-exposure-points.js';
import {stationRouteLabel} from './safety-route-selection.js';
import {createSafetyMarker,selectSafetyMarker} from './safety-marker.js';
import * as T from './vendor/three.module.js';
import {EMERGENCY_BASIS,EMERGENCY_RISKS,emergencyDistanceScreen} from './emergency-station-basis.js';
import {describeEmergencyDistance} from './emergency-station-review.js';
import {createEmergencyReviewService} from './emergency-review-service.js';
import {createWalkingFootprints} from './walking-footprints.js';

export function mountEmergencyStations({model,scene,host,viewport,getCamera,onEnter,onLeave,onLocate,onFitAll,onChange=()=>{},onDismiss=()=>{},reviewService=createEmergencyReviewService(model)}){
 const stations=model.containment.emergencyStations,root=document.createElement('aside');root.id='emergency-station-panel';root.hidden=true;root.setAttribute('aria-labelledby','emergency-station-heading');host.append(root);
 root.innerHTML=`<div class="emergency-heading"><h3 id="emergency-station-heading">Emergency shower &amp; eyewash</h3><button id="emergency-close" aria-label="Close emergency stations">×</button></div>
 <div class="assessment-notice"><strong>Design assessment: incomplete</strong><span>Installed performance: not verified</span></div>
 <p id="emergency-check-status" role="status" aria-live="polite">Access check pending.</p><button id="emergency-cancel" class="wide" hidden>Cancel check</button><label for="emergency-area">Review area</label><select id="emergency-area"></select>
 <label for="emergency-checkpoint">Starting work position</label><select id="emergency-checkpoint" disabled><option>Checking connections…</option></select><label for="emergency-station">Station · ranked from this position</label><select id="emergency-station"></select><p id="emergency-shortest" role="status"></p><button id="emergency-nearest" class="wide" disabled>Select shortest modelled route</button>
 <p id="emergency-task-hold" class="review-alert" role="status"></p><p id="emergency-station-alert" class="review-alert" role="status" hidden></p>
 <div class="tool-row"><button id="emergency-locate">Locate station</button><button id="emergency-fit">Fit stations</button></div>
 <label class="check-row"><input id="emergency-path" type="checkbox" disabled> Show this walking path</label><p id="emergency-path-label" class="small-note" hidden></p>
 <p id="emergency-distance" role="status"></p><p id="emergency-crossing" class="review-alert" hidden></p>
 <div class="tool-row"><button id="emergency-check">Recheck</button><button id="emergency-issues">View outstanding items</button></div><p id="emergency-check-time" class="small-note" hidden></p>
 <details id="emergency-coverage-details"><summary>Coverage and outstanding items</summary><p id="emergency-area-status" role="status"></p><p id="emergency-coverage-summary" role="status"></p><label class="check-row"><input id="emergency-coverage-show" type="checkbox"> Show assessed work positions</label><div id="emergency-coverage-list"></div><p class="small-note">Amber: distance check only · red: access/distance gap · purple: elevated access unresolved. Station icons show locations, not verified coverage.</p><details><summary>Coverage by process area</summary><div id="emergency-area-list"></div></details><details><summary>Engineering actions and acceptance</summary><div id="emergency-action-list"></div></details><button id="emergency-coverage-check" class="wide">Recheck coverage</button></details>
 <details><summary>Selected station and exposure basis</summary><p id="emergency-location"></p><p id="emergency-connection"></p><p id="emergency-geometry"></p><label class="check-row"><input id="emergency-space" type="checkbox"> Show proposed operating space</label><p id="emergency-task"></p><p id="emergency-material"></p><p id="emergency-task-risk"></p></details>
 <details><summary>Walking access assumptions</summary><p id="emergency-access-summary"></p>
 <p id="emergency-distance-detail"></p><label for="emergency-risk">Risk basis for distance screening</label><select id="emergency-risk"></select>
 <p class="small-note">Distances include both end approaches. Footprints show the checked walkway portion; final reach and activation require verification. Footprint spacing does not measure response time. Coverage uses a conservative 6 m planning check until eye and skin risks are assigned.</p></details>
 <details><summary>Water supply and readiness</summary><p id="emergency-supply"></p><p id="emergency-runoff"></p><p id="emergency-equipment"></p><p>Flow rate, simultaneous shower/eyewash capacity, inlet pressure, temperature and installed dimensions: supplier and engineering verification pending.</p><p id="emergency-testing"></p></details>
 <details><summary>Station-space findings and design decisions</summary><div id="emergency-findings"></div><ul id="emergency-holds"></ul></details>
 <details><summary>B.C. regulatory basis</summary><p id="emergency-code"></p><p>High-risk eyewash: within 5 seconds and no farther than 6 m. High-risk showers use the same starting criteria. Moderate-risk facilities normally use 10 seconds and 30 m. Low-risk facilities use 10 seconds and 30 m with risk-appropriate flushing equipment.</p><p id="emergency-exceptions"></p><p><a id="emergency-source" target="_blank" rel="noopener">WorkSafeBC emergency washing requirements ↗</a></p><p><a id="emergency-guidance" target="_blank" rel="noopener">WorkSafeBC risk assessment and equipment guidance ↗</a></p></details>
 <details><summary>Model check details</summary><p id="emergency-check-detail">No completed check.</p><p>Checks cover modeled geometry and access. Exposure suitability, activation, water performance and inspection records require separate verification.</p></details>
 <button id="emergency-export" class="wide">Download emergency-station review</button>`;
 const $=id=>root.querySelector('#'+id),select=$('emergency-station');
 const overlay=document.createElement('div');overlay.id='emergency-markers';overlay.hidden=true;viewport.append(overlay);
 const guides=new T.Group();guides.name='Emergency operating space';scene.add(guides);const footprints=createWalkingFootprints(scene),markers=new Map(),projected=new T.Vector3();
 let active=false,snapshot=null,review=null,coverage=null,points=[],busy=false,request=0,controller=null,rememberedOrigin='LOCAL-R201A',hasCompleted=false,checkInfo=null;
 for(const s of stations){select.add(new Option(s.tag+' · '+s.areaId,s.tag));const b=createSafetyMarker('emergency',s.tag,'Emergency shower and eyewash',()=>choose(s.tag,true));overlay.append(b);markers.set(s.tag,b);}
 $('emergency-area').disabled=true;$('emergency-area').add(new Option('All areas','all'));for(const a of EMERGENCY_AREA_SCOPE)$('emergency-area').add(new Option(a.area+' · '+a.label,a.area));
 for(const action of EMERGENCY_REVIEW_ACTIONS){const p=document.createElement('p');p.textContent=action.status+' · '+action.owner+': '+action.action;$('emergency-action-list').append(p);}
 for(const [key,risk]of Object.entries(EMERGENCY_RISKS))$('emergency-risk').add(new Option(risk.label,key));
 $('emergency-code').textContent=EMERGENCY_BASIS.location+' '+EMERGENCY_BASIS.assumptions;
 $('emergency-equipment').textContent=EMERGENCY_BASIS.equipment;$('emergency-testing').textContent=EMERGENCY_BASIS.testing;$('emergency-exceptions').textContent=EMERGENCY_BASIS.exceptions;
 $('emergency-source').href=EMERGENCY_BASIS.regulation;$('emergency-guidance').href=EMERGENCY_BASIS.guidance;
 for(const h of EMERGENCY_BASIS.holds){const li=document.createElement('li');li.textContent=h;$('emergency-holds').append(li);}
 const station=()=>stations.find(s=>s.tag===select.value),result=()=>review?.stations.find(s=>s.tag===select.value),origin=()=>coverage?.rows.find(p=>p.id===$('emergency-checkpoint').value),checkpoint=()=>origin()?.candidates.find(p=>p.tag===select.value);
 function clearSpace(){for(const child of [...guides.children]){guides.remove(child);child.geometry?.dispose();child.material?.dispose();}}
 function drawGuides(){clearSpace();footprints.clear();if(!active)return;
  if($('emergency-space').checked&&result()){const v=result().operating,helper=new T.Box3Helper(new T.Box3(new T.Vector3(...v.min),new T.Vector3(...v.max)),0x8febc0);helper.material.depthTest=true;guides.add(helper);}
  const p=checkpoint();if($('emergency-path').checked&&p?.path)footprints.setPath(p.path);
  $('emergency-path-label').hidden=!($('emergency-path').checked&&p?.path);
  $('emergency-path-label').textContent=`To ${select.value} · walkway portion only; final approach unverified`;
 }
 function renderPoint(){const task=EMERGENCY_EXPOSURE_POINTS.find(e=>e.id===origin()?.id);$('emergency-task').textContent=task?task.label+' · '+(task.work||task.basis):'Sampled walking viewpoint; actual exposure position not established.';$('emergency-material').textContent=task?'Material: '+task.material:'';$('emergency-task-risk').textContent=task?'Eye risk: unassigned · Skin risk: unassigned · '+(task.elevationM>0?'Service elevation '+task.elevationM+' m; standing position needs verification.':'Proposed grade position; working reach needs verification.'):'';$('emergency-task-hold').textContent=[task?.accessHold,task?.specialHold].filter(Boolean).join(' ');const p=checkpoint();const limit=emergencyDistanceScreen(p?.completeDistanceM,$('emergency-risk').value);$('emergency-distance-detail').textContent=p?.path?describeEmergencyDistance(p,$('emergency-risk').value):'';$('emergency-distance').textContent=p?.path?`${p.completeDistanceM.toFixed(1)} m to ${p.tag} · `+(limit.limitMetres===null?'eye / skin risk unassigned':(limit.distanceWithinLimit?'within':'exceeds')+` ${limit.limitMetres} m planning limit; ≤ ${limit.limitSeconds} s required, actual time unverified`):'No eligible modelled route: '+(p?.reason||'check access first')+'.';$('emergency-path').disabled=!p?.path;if(!p?.path)$('emergency-path').checked=false;
  $('emergency-task-hold').hidden=!$('emergency-task-hold').textContent;
  $('emergency-crossing').textContent=p?.crossings.length?'Forklift crossing: traffic protection and emergency access unverified.':'';$('emergency-crossing').hidden=!$('emergency-crossing').textContent;drawGuides();}
 function renderStation(){const s=station()||stations[0],r=result();if(!station())select.value=s.tag;$('emergency-location').textContent=s.areaId+' · combination shower / eyewash';
  $('emergency-connection').textContent=!r?'Access has not been checked.':r.approachConnected?'Grade approach connected. Final movement and activation remain unverified.':'Access gap · no full-width grade connection is credited.';
  $('emergency-geometry').textContent=!r?'Location check pending.':r.geometryClear?'No external obstruction found in the station and proposed operating reservations. Supplier layout still requires verification.':'Location needs review: '+r.findings.slice(0,3).map(f=>f.name).join('; ');
  if(r?.legacyConflicts.length)$('emergency-geometry').textContent+=' Existing walkway reservation overlaps station hardware; see open decisions.';
  const issues=[r&&!r.approachConnected?'Approach disconnected':'',r&&!r.geometryClear?'Operating space obstructed':'',r?.legacyConflicts.length?'Walkway overlaps station hardware':''].filter(Boolean);
  $('emergency-station-alert').textContent=issues.join(' · ');$('emergency-station-alert').hidden=!issues.length;
  $('emergency-supply').textContent=s.supply;$('emergency-runoff').textContent=s.runoff;
  selectSafetyMarker(markers,s.tag);
  if(coverage){
   const row=origin(),selected=select.value;points=row?.candidates||[];
   select.replaceChildren(...(row?points.map(p=>new Option(stationRouteLabel(stations.find(s=>s.tag===p.tag),p,p.tag===row?.nearest?.tag),p.tag)):stations.map(s=>new Option(s.tag+' · '+s.areaId,s.tag))));
   if(stations.some(s=>s.tag===selected))select.value=selected;
   $('emergency-shortest').textContent=row?.nearest?`Shortest modelled: ${row.nearest.tag} · ${row.nearest.completeDistanceM.toFixed(1)} m. Suitability and activation unverified.`:'No eligible modelled route from this position.';
   $('emergency-nearest').disabled=!row?.nearest;
   $('emergency-access-summary').textContent=`${points.filter(p=>p.path).length} connected station candidates from this fixed starting position. Stations with conflicts or unresolved traffic crossings are excluded from ranking.`;
  }renderPoint();
 }
 function renderFindings(){const nodes=[];for(const r of review?.stations||[]){if(!r.approachConnected||r.findings.length||r.legacyConflicts.length){const p=document.createElement('p');p.textContent=r.tag+': '+[!r.approachConnected?'full-width approach unresolved':'',...r.findings.map(f=>f.name),...r.legacyConflicts.map(f=>f.name+' overlaps '+f.zone)].filter(Boolean).join('; ');nodes.push(p);}}$('emergency-findings').replaceChildren(...nodes);}
 const exposureMarkers=new Map();
 for(const e of EMERGENCY_EXPOSURE_POINTS){const b=document.createElement('button');b.className='emergency-exposure';b.title=e.label;b.setAttribute('aria-label',e.label+' · coverage review');b.textContent='!';b.hidden=true;b.onclick=()=>selectExposure(e.id);overlay.append(b);exposureMarkers.set(e.id,b);}
 function selectExposure(id){const e=EMERGENCY_EXPOSURE_POINTS.find(e=>e.id===id);if(e&&$('emergency-area').value!=='all'&&$('emergency-area').value!==e.area){$('emergency-area').value=e.area;renderOrigins(id);} $('emergency-checkpoint').value=id;$('emergency-checkpoint').onchange();$('emergency-path').checked=!$('emergency-path').disabled;drawGuides();}
 function renderOrigins(preferred=$('emergency-checkpoint').value){
  const area=$('emergency-area').value,rows=(coverage?.rows||[]).filter(r=>area==='all'||r.area===area).sort((a,b)=>Number(!EMERGENCY_EXPOSURE_POINTS.some(e=>e.id===a.id))-Number(!EMERGENCY_EXPOSURE_POINTS.some(e=>e.id===b.id)));
  $('emergency-checkpoint').replaceChildren(...rows.map(p=>new Option(p.label+(p.elevationM?' · elevated access unresolved':''),p.id)));
  $('emergency-checkpoint').disabled=!rows.length;if(rows.some(r=>r.id===preferred))$('emergency-checkpoint').value=preferred;
 }
 function renderCoverage(){
  const area=$('emergency-area').value,all=area==='all',a=coverage.areas.find(a=>a.area===area),tasks=coverage.exposures.filter(e=>all||e.area===area);
  $('emergency-area-status').textContent=a?`${a.stations} proposed stations · ${a.tasks} work positions. ${a.remaining}`:'Registered work positions · eye and skin risks unassigned';
  const counts=a||coverage,gaps=(counts.distanceGaps||0)+(counts.accessGaps||0)+(counts.elevatedGaps||0);
  $('emergency-issues').textContent=gaps?`View ${gaps} access / distance gaps`:'View outstanding items';
  $('emergency-coverage-summary').textContent=`${counts.distanceGaps} distance gaps · ${counts.accessGaps} ground-access gaps · ${counts.elevatedGaps} elevated-access gaps. ${counts.withinDistanceScreen} / ${all?coverage.gradeTotal:tasks.filter(t=>!t.elevationM).length} registered ground positions meet the planning distance. Unregistered tasks remain unassessed.`;
  const status={ 'verification-pending':'Distance screen only · verification pending','distance-gap':'DISTANCE GAP','access-gap':'GRADE ACCESS GAP','elevated-gap':'ELEVATED ACCESS GAP'};
  $('emergency-coverage-list').replaceChildren(...[...tasks].sort((a,b)=>Number(a.status==='verification-pending')-Number(b.status==='verification-pending')).map(e=>{const b=document.createElement('button');b.className='coverage-row';b.setAttribute('data-status',e.status);b.textContent=e.label+' · '+(e.nearest?e.nearest.completeDistanceM.toFixed(1)+' m to '+e.nearest.tag:'No route credited')+' · '+status[e.status];b.onclick=()=>selectExposure(e.id);return b;}));
  if(!tasks.length){const p=document.createElement('p');p.textContent='No task positions registered for this area. No coverage credit.';$('emergency-coverage-list').append(p);}
  $('emergency-area-list').replaceChildren(...coverage.areas.map(a=>{const b=document.createElement('button');b.className='coverage-row';b.textContent=`${a.area} · ${a.stations} stations · ${a.tasks} work positions · ${a.accessGaps+a.distanceGaps+a.elevatedGaps} gaps`;b.onclick=()=>{$('emergency-area').value=a.area;$('emergency-area').onchange();};return b;}));
 }
 function choose(tag,locate=false){if(!stations.some(s=>s.tag===tag))return;select.value=tag;renderStation(true);if(locate)onLocate(station());}
 function pendingControls(value){busy=value;root.setAttribute('aria-busy',String(value));$('emergency-check').disabled=$('emergency-coverage-check').disabled=value;$('emergency-cancel').hidden=!value;}
 function clearResults(){
  if(origin())rememberedOrigin=origin().id;review=null;coverage=null;points=[];checkInfo=null;
  $('emergency-area').disabled=$('emergency-checkpoint').disabled=$('emergency-nearest').disabled=$('emergency-path').disabled=true;$('emergency-path').checked=false;
  $('emergency-shortest').textContent='';$('emergency-access-summary').textContent='No current route result.';
  $('emergency-coverage-summary').textContent='Check pending.';$('emergency-issues').textContent='View outstanding items';$('emergency-area-status').textContent='';$('emergency-check-time').hidden=true;
  for(const id of ['emergency-coverage-list','emergency-area-list','emergency-findings'])$(id).replaceChildren();
  select.replaceChildren(...stations.map(s=>new Option(s.tag+' · '+s.areaId,s.tag)));drawGuides();
 }
 async function check({force=true}={}){
  if(busy)return;const selected=select.value,initial=!hasCompleted,token=++request;controller=new AbortController();clearResults();select.value=selected;pendingControls(true);renderStation();
  $('emergency-check-status').hidden=false;$('emergency-check-status').className='';$('emergency-check-status').textContent='Preparing access check…';
  try{
   const data=await reviewService.run({force,signal:controller.signal,onProgress:p=>{if(token!==request)return;$('emergency-check-status').textContent=p.stage==='prepare'?`Preparing access check · ${Math.round(p.fraction*100)}%`:p.stage==='routes'?'Ranking walking routes…':'Checking station spaces and walkways…';}});
   if(token!==request||!active)return;review=data.review;coverage=data.coverage;hasCompleted=true;checkInfo={checkedAt:data.checkedAt||null,reused:!!data.reused};
   $('emergency-area').disabled=false;renderOrigins(rememberedOrigin);
   if(initial&&select.value===selected&&origin()?.nearest)select.value=origin().nearest.tag;
   renderFindings();renderCoverage();renderStation();$('emergency-check-status').textContent='Model check complete. Review outstanding items.';$('emergency-check-status').className='sr-only';
   const checkedAt=data.checkedAt?new Date(data.checkedAt):null;
   $('emergency-check-time').textContent=checkedAt?`Last model check: ${checkedAt.toLocaleString()}`:'Model check complete';$('emergency-check-time').hidden=false;
   $('emergency-check-detail').textContent=(data.reused?'Previous result reused; checked model inputs are unchanged.':'New model check completed.')+' Scope: station spaces and registered walking routes.';
  }catch(error){if(token!==request)return;
   $('emergency-check-status').textContent=error.name==='AbortError'?'Check cancelled. Select a station or retry the check.':error.message||'Access check failed. Retry the check.';
   $('emergency-coverage-summary').textContent='No current coverage result is credited.';
   $('emergency-connection').textContent='Access has not been checked.';
  }finally{if(token===request){controller=null;pendingControls(false);}}
 }
 function cancelCheck(){request++;controller?.abort();controller=null;pendingControls(false);$('emergency-check-status').textContent='Check cancelled. Select a station or retry the check.';}
 function open(){if(active){select.focus({preventScroll:true});return;}snapshot=onEnter();active=true;root.hidden=overlay.hidden=false;onChange(true);renderStation();select.focus({preventScroll:true});return check({force:false});}
 function close(){if(!active)return;cancelCheck();active=false;root.hidden=overlay.hidden=true;clearSpace();footprints.clear();const saved=snapshot;snapshot=null;onLeave(saved);onChange(false);}
 function draw(){if(!active)return;const camera=getCamera();footprints.draw(camera,viewport.clientHeight);for(const e of EMERGENCY_EXPOSURE_POINTS){const m=exposureMarkers.get(e.id),r=coverage?.exposures.find(r=>r.id===e.id);projected.set(e.point[0],(e.elevationM||0)+.35,e.point[1]).project(camera);m.hidden=($('emergency-area').value!=='all'&&e.area!==$('emergency-area').value)||!$('emergency-coverage-show').checked||!r||projected.z< -1||projected.z>1||Math.abs(projected.x)>.97||Math.abs(projected.y)>.94;m.setAttribute('data-gap',String(r?.status!=='verification-pending'));m.setAttribute('data-status',r?.status||'unassessed');m.title=e.label+' · '+(r?.status||'Unassessed');if(!m.hidden)m.style.transform=`translate(${(projected.x+1)*viewport.clientWidth/2}px,${(1-projected.y)*viewport.clientHeight/2}px) translate(-50%,-100%)`;}for(const s of stations){const m=markers.get(s.tag);projected.set(s.x,2.6,s.z).project(camera);const visible=projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<.97&&Math.abs(projected.y)<.94;m.hidden=!visible;if(visible)m.style.transform=`translate(${(projected.x+1)*viewport.clientWidth/2}px,${(1-projected.y)*viewport.clientHeight/2}px) translate(-50%,-100%)`;}}
 $('emergency-area').onchange=()=>{if(!coverage)return;renderOrigins();if(origin()?.nearest)select.value=origin().nearest.tag;renderCoverage();renderStation();draw();};
 $('emergency-issues').onclick=()=>{const details=$('emergency-coverage-details');details.open=true;details.setAttribute('tabindex','-1');details.focus({preventScroll:true});details.scrollIntoView?.({block:'nearest',behavior:'smooth'});};
 select.onchange=()=>renderStation();$('emergency-checkpoint').onchange=()=>{if(origin()?.nearest)select.value=origin().nearest.tag;renderStation();};$('emergency-nearest').onclick=()=>{if(origin()?.nearest)choose(origin().nearest.tag,true);};$('emergency-coverage-check').onclick=check;$('emergency-coverage-show').onchange=draw;$('emergency-risk').onchange=renderPoint;$('emergency-space').onchange=drawGuides;$('emergency-path').onchange=drawGuides;
 $('emergency-locate').onclick=()=>onLocate(station());$('emergency-fit').onclick=()=>onFitAll(stations);$('emergency-check').onclick=check;$('emergency-cancel').onclick=cancelCheck;$('emergency-close').onclick=()=>{close();onDismiss();};
 $('emergency-export').onclick=()=>{const data={basis:EMERGENCY_BASIS,configuration:model.designScenario,stations:stations.map(({partIds,...s})=>s),review,coverage,selectedStation:select.value,sampledAccess:points,riskAssumption:$('emergency-risk').value,engineeringActions:EMERGENCY_REVIEW_ACTIONS,modelCheck:checkInfo,commissioningRecords:[],complianceVerified:false};const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='BC-emergency-station-review.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 return {open,close,choose,check,draw,get shown(){return active;},getState:()=>({active,station:select.value,review,checkpoint:$('emergency-checkpoint').value,risk:$('emergency-risk').value,area:$('emergency-area').value,coverage,modelCheck:checkInfo,footprints:footprints.getState(),complianceVerified:false})};
}
