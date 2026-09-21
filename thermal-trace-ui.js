import {temperatureCapability,renderThermalCapability} from './thermal-capability.js';
import * as T from './vendor/three.module.js';
import {compileThermalTrace,thermalConsumers,THERMAL_SCENARIOS,thermalSegmentKey} from './thermal-trace.js';
import {THERMAL_SERVICES,TEMPERATURE_LEGEND,A5000_HOLDS} from './a5000-basis.js';
import {journeyPathStation,journeyMarkerRadius} from './journey-marker-scale.js';
import {temperatureTargets,processTemperaturePlan,formatTemperature} from './pfd-temperatures.js';
import {renderTemperatureRecord} from './pfd-temperature-ui.js';

export function mountThermalTrace({model,scene,getCamera,getHeight,getArea,getEquipmentIds,onEnter,onLeave,onFit,onChange,onStateChange=()=>{}}){
 const $=id=>document.getElementById('thermal-'+id),root=$('tracing');if(!root||model.scope==='future')return null;
 let areaTouched=false,active=false,playing=false,snapshot=null,plan=null,elapsed=0,speed=1,lines=null,arrows=null,carriers=[],xray=true;
 const group=new T.Group();group.name='A-5000 illustrative thermal circulation';group.visible=false;scene.add(group);
 const material=new T.MeshBasicMaterial({vertexColors:false,depthTest:false,depthWrite:false,toneMapped:false}),dots=new T.InstancedMesh(new T.SphereGeometry(1,8,6),material,2048),dummy=new T.Object3D(),up=new T.Vector3(0,1,0);dots.count=0;dots.frustumCulled=false;dots.renderOrder=31;group.add(dots);
 const option=(label,value)=>new Option(label,value);
 $('area').replaceChildren(option('All areas','all'),...model.thermalUtilities.surveys.map(s=>option(s.area,s.area)),option('A-5000 · utility packages','A-5000'));
 $('scenario').replaceChildren(...Object.entries(THERMAL_SCENARIOS).map(([key,label])=>option(label,key)));
 $('legend').replaceChildren(...TEMPERATURE_LEGEND.map(([label,color])=>{const el=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=color;el.append(swatch,label);return el;}));
 const rows=Object.entries(THERMAL_SERVICES).map(([key,s])=>{const tr=document.createElement('tr');for(const text of[s.label,s.supplyC+' → '+s.returnC+' °C',s.pfdSupply+' / '+s.pfdReturn]){const td=document.createElement('td');td.textContent=text;tr.append(td);}return tr;});$('temperatures').replaceChildren(...rows);
 for(const [title,note]of A5000_HOLDS){const el=document.createElement('p'),b=document.createElement('strong');b.textContent=title+'. ';el.append(b,note);$('holds').append(el);}
 function choices(){return {area:$('area').value,service:$('service').value,consumer:$('consumer').value,extent:$('extent').value,scenario:$('scenario').value,mode:$('mode').value};}
 function filter(){const old=$('consumer').value,rows=thermalConsumers(model,choices());$('consumer').replaceChildren(option('All matching consumers','all'),...rows.map(c=>option(c.tag+' · '+c.area+(c.status==='unresolved'?' · HOLD':''),c.id)));$('consumer').value=rows.some(c=>c.id===old)?old:'all';$('count').textContent=rows.length+' mapped consumers · '+$('area').value;}
 function processFilter(){const old=$('process-target').value,rows=temperatureTargets(model,$('area').value);$('process-target').replaceChildren(...rows.map(r=>option(r.tag+' · '+r.label,r.id)));if(rows.some(r=>r.id===old))$('process-target').value=old;processPhase();}
 function processRecord(){return temperatureTargets(model,$('area').value).find(r=>r.id===$('process-target').value);}
 function processPhase(){const row=processRecord(),old=$('process-phase').value;$('process-phase').replaceChildren(...(row?.phases||[]).map(p=>option(p.label,p.id)));if(row?.phases.some(p=>p.id===old))$('process-phase').value=old;$('process-show').disabled=!row;processDetails();}
 function processDetails(){const row=processRecord();if(row){const phase=row.phases.find(p=>p.id===$('process-phase').value)||row.phases[0];renderTemperatureRecord($('process-detail'),row,phase);renderThermalCapability($('process-detail'),temperatureCapability(model,row,phase));}else $('process-detail').textContent='No numeric process temperature basis is mapped in this selection. Primary utility ranges are listed below.';}
 function clearDrawing(){for(const obj of[lines,arrows])if(obj){group.remove(obj);obj.geometry.dispose();obj.material.dispose();}lines=arrows=null;dots.count=0;carriers=[];}
 function draw(){clearDrawing();if(!plan)return;const positions=[],colors=[],car=new Map();
  if(plan.kind==='process'){material.depthTest=false;return;}
  const moving=new Set(plan.paths.filter(p=>p.available).flatMap(p=>p.segments.map(s=>thermalSegmentKey(s,p.circuit))));
  for(const s of plan.renderSegments){positions.push(...s.a,...s.b);const color=new T.Color(s.colour);colors.push(...color.toArray(),...color.toArray());if(!moving.has(thermalSegmentKey(s,s.circuit)))continue;const key=s.circuit+'|'+s.index;if(!car.has(key))car.set(key,[]);car.get(key).push(s);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));lines=new T.LineSegments(g,new T.LineBasicMaterial({vertexColors:true,depthTest:!xray,depthWrite:false,transparent:true,opacity:.95}));lines.renderOrder=30;lines.frustumCulled=false;group.add(lines);
  // One animation carrier per physical conduit edge. Shared headers never multiply by branch count.
  for(const seg of car.values()){let length=0;const segments=seg.map(s=>{const item={...s,start:length};length+=s.length;item.end=length;return item;});if(length>1e-6)carriers.push({segments,length});}
  arrows=new T.InstancedMesh(new T.ConeGeometry(1,2.8,5),new T.MeshBasicMaterial({color:'#ffffff',depthTest:!xray,depthWrite:false,toneMapped:false}),carriers.length);arrows.frustumCulled=false;arrows.renderOrder=31;
  carriers.forEach((path,i)=>{const at=journeyPathStation(path,.5),s=path.segments.find(s=>s.end>=path.length*.5)||path.segments[0];dummy.position.set(...at.point);dummy.quaternion.setFromUnitVectors(up,new T.Vector3(...s.b).sub(new T.Vector3(...s.a)).normalize());dummy.scale.setScalar(at.radius*.45);dummy.updateMatrix();arrows.setMatrixAt(i,dummy.matrix);});group.add(arrows);material.depthTest=!xray;
 }
 function status(){if(!plan)return;onStateChange({active,playing,kind:plan.kind});const run=plan.paths.filter(p=>p.available).length;const noRows=!plan.rows.length;
  for(const id of ['extent','scenario','speed','xray'])$(id).parentElement.hidden=plan.kind==='process';
  if(plan.kind==='process'){
   $('status').textContent=plan.record.tag+' · '+plan.selectedPhase.label+' · '+formatTemperature(plan.selectedPhase)+' · '+plan.location;
   $('state-note').textContent='Static PFD temperature marker at the process location. Multiple coloured dots represent a range crossing colour bands; no midpoint, surface temperature, heat field or live measurement is implied.';
   $('findings').replaceChildren(...plan.findings.map(f=>{const li=document.createElement('li');li.textContent=f.reason;return li;}));$('play').disabled=true;$('play').textContent='Static temperature marker';$('play').setAttribute('aria-pressed','false');$('open').setAttribute('aria-pressed','false');return;
  }
  $('status').textContent=noRows?'No qualified thermal consumer is mapped in this selection. See the area survey; no connection is assumed.':`${plan.paths.length} traced paths · ${run} available for illustration · ${plan.findings.length} unresolved. ${playing?'Playing.':'Paused.'}`;
  $('state-note').textContent=choices().scenario==='generationLoss'?'Water can circulate without useful heat transfer. Colours become grey because outlet temperatures are unknown.':choices().scenario==='pumpsOff'?'Primary circulation has stopped. Secondary pumps can still circulate locally, but central heat removal is unavailable.':choices().scenario==='powerLoss'?'All circulation is stopped. No emergency-cooling capability or safe shutdown is implied.':choices().scenario==='minimumFlow'?'Consumer admission is closed. Source recycle demonstrates a continuous generator/pump path; minimum flow and heat balance remain unqualified.':choices().scenario==='branchClosed'?'The selected consumer is isolated; shared headers remain part of the installed trace. For R-201, closure uses its own jacket valves.':'Primary supply / return values are illustrative pairs within PFD ranges. Secondary and internal heat-transfer temperatures remain unknown; no internal midpoint is inferred. Process targets are shown separately above.';
  $('findings').replaceChildren(...plan.findings.map(f=>{const el=document.createElement('li');el.textContent=(f.id?f.id+': ':'')+f.reason;return el;}));$('play').disabled=!run;$('play').textContent=playing?'Pause circulation':'Play circulation';$('play').setAttribute('aria-pressed',String(playing));$('open').setAttribute('aria-pressed',String(active));
 }
 function refresh(){playing=false;elapsed=0;plan=compileThermalTrace(model,choices());draw();status();onChange(plan);}
 function enter(animate=false){if(!active){if(!areaTouched)$('area').value=getArea?.()||'all';filter();processFilter();snapshot=onEnter();active=true;group.visible=true;$('controls').hidden=false;}refresh();playing=animate&&plan.paths.some(p=>p.available);status();onFit(plan.allIds);}
 function showProcess(){const row=processRecord();if(!row)return;if(!active){snapshot=onEnter();active=true;group.visible=true;$('controls').hidden=false;}playing=false;elapsed=0;plan=processTemperaturePlan(model,row,$('process-phase').value,getEquipmentIds);draw();status();onChange(plan);onFit(plan.allIds);}
 function leave(){if(!active)return;active=false;playing=false;onStateChange({active:false,playing:false});group.visible=false;clearDrawing();$('controls').hidden=true;$('open').setAttribute('aria-pressed','false');const saved=snapshot;snapshot=null;onLeave(saved);}
 for(const id of['area','service','mode'])$(id).onchange=()=>{if(id==='area'){areaTouched=true;processFilter();}filter();if(active){if(plan.kind==='process'){if(processRecord())showProcess();else leave();}else refresh();}};for(const id of['consumer','extent','scenario'])$(id).onchange=()=>{if(active)refresh();};
 $('process-target').onchange=()=>{processPhase();if(active&&plan.kind==='process')showProcess();};$('process-phase').onchange=()=>{processDetails();if(active&&plan.kind==='process')showProcess();};$('process-show').onclick=showProcess;
 $('open').onclick=()=>enter(false);$('play').onclick=()=>{playing=!playing;status();};$('exit').onclick=leave;$('fit').onclick=()=>onFit(plan.allIds);$('speed').onchange=()=>{speed=Number($('speed').value)||1;};$('xray').onchange=()=>{xray=$('xray').checked;if(active)draw();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden){playing=false;if(active)status();}});$('area').value=getArea?.()||'all';filter();processFilter();
 function syncArea(area){if(active)return;areaTouched=false;$('area').value=area||'all';filter();processFilter();}
 return {openArea(area){if(![...$('area').options].some(o=>o.value===area))return false;$('area').value=area;areaTouched=true;filter();processFilter();enter(false);return true;},get active(){return active;},get allIds(){return plan?.allIds||new Set();},getColor:id=>active?plan?.colours.get(id):null,enter,leave,syncArea,getState:()=>({active,playing,elapsed,kind:plan?.kind||'utility',temperature:plan?.kind==='process'?{record:plan.record.id,phase:plan.selectedPhase.id,text:formatTemperature(plan.selectedPhase),bands:plan.bands}:null,choices:choices(),paths:plan?.paths.map(p=>({id:p.id,circuit:p.circuit,available:p.available,lengthM:p.length,note:p.note})),findings:plan?.findings,markerCarriers:carriers.length,qualified:false}),
  update(dt){if(!active)return;if(playing)elapsed+=Math.min(.05,dt)*speed;const camera=getCamera();let count=0;
   if(plan.kind==='process'){
    const point=new T.Vector3(...plan.point),pixel=camera.isOrthographicCamera?(camera.top-camera.bottom)/camera.zoom/Math.max(1,getHeight()):2*camera.position.distanceTo(point)*Math.tan(camera.fov*Math.PI/360)/Math.max(1,getHeight()),right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion);
    plan.bands.forEach((band,i)=>{dummy.position.copy(point).addScaledVector(right,(i-(plan.bands.length-1)/2)*pixel*18);dummy.quaternion.identity();dummy.scale.setScalar(pixel*7);dummy.updateMatrix();dots.setMatrixAt(i,dummy.matrix);dots.setColorAt(i,new T.Color(band.colour));});dots.count=plan.bands.length;dots.instanceMatrix.needsUpdate=true;if(dots.instanceColor)dots.instanceColor.needsUpdate=true;return;
   }
   for(const path of carriers){const n=Math.max(1,Math.min(5,Math.ceil(path.length/6)));for(let j=0;j<n&&count<2048;j++){const f=((elapsed*.8/path.length+j/n)%1+1)%1,at=journeyPathStation(path,f),s=path.segments.find(s=>s.end>=f*path.length)||path.segments.at(-1),v=new T.Vector3(...at.point);const pixel=camera.isOrthographicCamera?(camera.top-camera.bottom)/camera.zoom/Math.max(1,getHeight()):2*camera.position.distanceTo(v)*Math.tan(camera.fov*Math.PI/360)/Math.max(1,getHeight());dummy.position.copy(v);dummy.quaternion.identity();dummy.scale.setScalar(journeyMarkerRadius(pixel,at.radius));dummy.updateMatrix();dots.setMatrixAt(count,dummy.matrix);dots.setColorAt(count,new T.Color(s.colour));count++;}}
   dots.count=count;dots.instanceMatrix.needsUpdate=true;if(dots.instanceColor)dots.instanceColor.needsUpdate=true;
  }
 };
}
