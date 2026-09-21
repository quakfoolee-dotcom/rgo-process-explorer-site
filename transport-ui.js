import {createCrossingPlayback} from './crossing-playback.js';
import {createEngineer} from './engineer-walk.js';
import * as T from './vendor/three.module.js';
import {TRANSPORT_ROUTES,transportFootprint,validateTransportProfile} from './transport-layout.js';
import {inspectTransport,supportMetrics} from './transport-review.js';
import {FORKLIFT_PROFILE,FORKLIFT_REFERENCE,validateForkliftEnvelope,createForklift,createForkliftPlayback} from './forklift.js';

export function mountTransportReview({model,scene,host,onEnter,onLeave,onFit,onFollow=()=>{},onPart,isAssembled,onStateChange=()=>{},onPanelChange=()=>{},onDismiss=()=>{},onBeforePlay=()=>{}}){
 const root=document.createElement('aside');root.id='transport-review';root.className='movement-panel';root.hidden=true;root.setAttribute('aria-labelledby','transport-heading');host.append(root);
 root.innerHTML=`<div class="transport-heading"><h3 id="transport-heading">Forklift tracing</h3><button id="transport-close" aria-label="Close forklift tracing">×</button></div>
 <label for="transport-route">Transport route</label><select id="transport-route"></select>
 <p id="transport-status" role="status">Choose a route to check the assembled plant.</p>
 <p id="transport-traffic" class="small-note" hidden></p>
 <label for="transport-position">Timeline · drag to move</label><input id="transport-position" type="range" min="0" max="1000" value="0" disabled><output id="transport-pose" for="transport-position"></output>
 <div class="transport-speed-row"><label for="transport-rate">Playback speed</label><select id="transport-rate"><option value="1">1× · preview</option><option value="3">3×</option><option value="6">6×</option></select></div>
 <div class="tool-row"><button id="transport-play" disabled>Play forklift</button><button id="transport-reset" disabled>Restart</button></div>
 <div class="tool-row"><button id="transport-fit-vehicle" disabled>Locate forklift</button><button id="transport-fit" disabled>Fit route</button></div>
 <label class="check-row"><input type="checkbox" id="transport-follow" disabled> Follow forklift</label><p class="small-note">Preview only · truck/load, traffic plan and slab capacity unverified.</p>
 <details><summary>Dimensions and clearance</summary>
 <p><strong>Design basis: B.C., Canada.</strong> Clearances below are planning assumptions. Pedestrian separation, the selected truck/load and structural capacity require site-specific review.</p>
 <p>CLARK ECX25 reference: 1.114 m truck width, 2.235 m overhead guard, 1.845 m outside turning radius. Reference model; truck selection is unconfirmed.</p>
 <p>Assumed: 1.2 × 1.2 m pallet, 1.6 m front axle to load front, 2.0 m to rear, 1.5 m wheelbase and 2.1 m lowered mast. Drums are illustrative; load mass is unspecified.</p>
 <p>Edit the screening envelope below. It must contain the illustrated truck and load. Checks include hidden equipment, insulation and support bases.</p>
 <div class="transport-inputs"></div>
 <button id="transport-check">Recheck route</button>
 <p>The 3.5 m front-axle path radius is a planning assumption, distinct from the 1.845 m outside radius. The sheet’s 2.279 m right-angle stacking base requires adding load length and clearance; it is not an aisle width.</p>
 <p class="small-note">Illustrative travel: 1 m/s, slowing to 0.5 m/s through turns. Playback multipliers compress time; they are not operating speed limits. Forks stay low while moving.</p></details>
 <details id="transport-results"><summary>Route check details <span id="transport-count"></span></summary>
 <p id="transport-route-note"></p><button id="transport-next" disabled>Next obstruction</button>
 <div id="transport-findings"></div><p id="transport-metrics"></p>
 <a href="./layout-review.html" target="_blank" rel="noopener">Route and support review ↗</a>
 <p class="small-note">Pink outlines identify modeled obstructions. Playback is unavailable when the route check finds an obstruction. This is a proposed access study; loading, traffic controls and slab capacity still need confirmation.</p></details>`;
 const $=id=>root.querySelector('#'+id),select=$('transport-route'),profile={...FORKLIFT_PROFILE};
 for(const r of TRANSPORT_ROUTES)select.add(new Option(r.label,r.id));select.value='west-delivery';
 const fields=[['width','Maximum truck/load width'],['front','Front axle to load front'],['rear','Front axle to rear'],['height','Maximum travel height'],['margin','Side/end allowance'],['headMargin','Overhead allowance'],['turnRadius','Front-axle path radius']];
 for(const [k,label]of fields){const wrap=document.createElement('label');wrap.textContent=label+' (m)';const input=document.createElement('input');input.type='number';input.min=k==='margin'||k==='headMargin'?'.1':'.01';input.max='20';input.step='.001';input.value=profile[k];input.dataset.profile=k;input.oninput=()=>{resetRoute();$('transport-status').textContent='Dimensions changed. Run the route check again.';};wrap.append(input);root.querySelector('.transport-inputs').append(wrap);}
 const group=new T.Group();group.name='Transport clearance review';group.visible=false;scene.add(group);
 let snapshot=null,result=null,active=false,vehicle=null,player=null,current=0,request=0,lastPose=null,bookmark=null,crossingEngineer=null;
 const controls=['transport-position','transport-fit','transport-fit-vehicle','transport-follow','transport-reset'];
 function dispose(){for(const c of [...group.children]){group.remove(c);c.traverse(o=>{o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();});}vehicle=null;crossingEngineer=null;lastPose=null;}
 function renderPose(p){
  if(!vehicle)return;current=p.index;
  if(crossingEngineer){const actor=p.traffic?.engineer;crossingEngineer.group.visible=!!actor;if(actor){crossingEngineer.group.position.set(actor.x,-.015,actor.z);crossingEngineer.group.rotation.y=actor.heading;crossingEngineer.pose(actor.distance,actor.moving);}}
  if(!p.traffic&&player?.stops.length){$('transport-traffic').hidden=false;$('transport-traffic').textContent='Crossing preview: forklift yields to the pedestrian; traffic plan unapproved.';}
  if(p.traffic){$('transport-traffic').hidden=false;$('transport-traffic').textContent=p.traffic.blocked||p.traffic.phase+' · forklift stopped; example engineer has exclusive crossing access. Illustrative control sequence; the site traffic plan is unapproved.';}
vehicle.group.position.set(p.x,0,p.z);vehicle.group.rotation.y=-p.yaw;vehicle.animate(p.distance,p.curvature);
  if($('transport-follow').checked&&lastPose)onFollow(p.x-lastPose.x,p.z-lastPose.z);lastPose=p;
  $('transport-position').value=Math.round(p.fraction*1000);
  $('transport-position').setAttribute('aria-valuetext',`${p.distance.toFixed(1)} of ${p.total.toFixed(1)} metres, ${p.complete?'arrived':p.playing?'moving':'paused'}`);
  $('transport-pose').textContent=`${Math.round(p.fraction*100)}% · ${p.distance.toFixed(1)} / ${p.total.toFixed(1)} m · ${p.complete?'Arrived':p.playing?'Moving':'Paused'}${result.blockedPoses.includes(current)?' · obstruction envelope':''}`;
  $('transport-play').textContent=p.playing?'Pause forklift':p.complete?'Replay forklift':'Play forklift';
  $('transport-play').disabled=!active||result.findings.length>0||!!p.traffic?.blocked;
 }
 function position(index){if(player)renderPose(player.seekIndex(index));}
 function draw(){
  dispose();const poses=result.poses;
  // Clearance uses the swept envelope numerically; playback shows the truck only.
  vehicle=createForklift();group.add(vehicle.group);
  for(const f of result.findings.slice(0,150)){const p=model.parts.find(p=>p.id===f.partId);if(!p)continue;if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();const bb=p.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale)),helper=new T.Box3Helper(bb,0xff6fa8);helper.material.depthTest=false;group.add(helper);}
  player=createCrossingPlayback(createForkliftPlayback(poses),{poses,profile,crossings:model.walkways?.crossings||[],routeClear:model.walkways?.review?.clear!==false});
  if(player.stops.length){crossingEngineer=createEngineer();crossingEngineer.group.visible=false;group.add(crossingEngineer.group);}group.visible=true;renderPose(player.sample());
 }
 // Replacing or invalidating a route stays inside the current tracing session.
 // Only close() releases the original view snapshot and restores the workspace.
 function resetRoute(){
  request++;bookmark=null;player?.pause();group.visible=false;dispose();player=null;result=null;current=0;
  for(const id of [...controls,'transport-play','transport-next'])$(id).disabled=true;
  $('transport-close').disabled=false;
  $('transport-check').disabled=false;$('transport-play').textContent='Play forklift';$('transport-follow').checked=false;$('transport-position').value=0;$('transport-pose').textContent='';$('transport-findings').replaceChildren();$('transport-count').textContent='';$('transport-route-note').textContent='';$('transport-traffic').hidden=true;$('transport-traffic').textContent='';
 }
 function reveal(){if(root.hidden){root.hidden=false;onPanelChange(true);}select.focus?.({preventScroll:true});}
 function close(){
  if(!active&&root.hidden)return;
  const restore=snapshot,wasActive=active,resume=player?{route:select.value,fraction:player.sample().fraction}:null;
  active=false;snapshot=null;root.hidden=true;resetRoute();bookmark=resume;
  if(wasActive&&restore)onLeave(restore);if(wasActive)onStateChange(false);onPanelChange(false);
 }
 async function open(){
  reveal();if(active)return true;
  const resume=bookmark,checked=await check();if(checked===false)return false;
  if(player&&resume?.route===select.value)renderPose(player.seek(resume.fraction));
  return true;
 }
 function fit(){if(!result)return;$('transport-follow').checked=false;const b=new T.Box3();for(const p of result.poses)for(const [x,z]of transportFootprint(p,profile))b.expandByPoint(new T.Vector3(x,profile.height/2,z));b.min.y=0;b.max.y=profile.height+profile.headMargin;onFit(b,'route');}
 function fitVehicle(){if(!player)return;const p=player.sample(),b=new T.Box3();for(const [x,z]of transportFootprint(p,profile))b.expandByPoint(new T.Vector3(x,0,z));b.max.y=profile.height;onFit(b,'vehicle');lastPose=p;}
 async function check(){
  if(root.hidden){root.hidden=false;onPanelChange(true);}
  resetRoute();const ticket=request,route=TRANSPORT_ROUTES.find(r=>r.id===select.value);
  $('transport-check').disabled=true;$('transport-status').textContent='Checking '+(route?.label||'selected route')+' against assembled geometry…';
  try{
   if(!route)throw Error('Select an available transport route.');
   const nextProfile={};for(const input of root.querySelectorAll('[data-profile]'))nextProfile[input.dataset.profile]=Number(input.value);
   validateTransportProfile(nextProfile);validateForkliftEnvelope(nextProfile);Object.assign(profile,nextProfile);
   if(!active){snapshot=onEnter();active=true;onStateChange(true);}
   $('transport-close').disabled=false;
   await new Promise(resolve=>setTimeout(resolve,30));if(ticket!==request)return false;
   result=inspectTransport(model,{routeId:route.id,profile}).routes[0];draw();
   $('transport-status').textContent=result.findings.length?'Playback blocked · '+result.findings.length+' obstructions. Drag the timeline to inspect.':'Route ready · '+result.status+'.';
   const shared=result.trafficControl.pedestrianZones.length>0;$('transport-traffic').hidden=!shared;
   if(shared){$('transport-status').textContent=result.findings.length?$('transport-status').textContent:'Geometry clear · shared pedestrian access';$('transport-traffic').textContent=model.walkways?'West crossing: forklift stops for the pedestrian. Parallel frontages remain vehicle-only pending a traffic plan.':'Vehicle-only preview: pedestrian access is assumed closed; engineer playback stops. Real use needs a pedestrian bypass or approved closure/control plan.';}
   $('transport-count').textContent=result.findings.length?'('+result.findings.length+')':'';$('transport-route-note').textContent=result.note;$('transport-results').open=!!result.findings.length;
   for(const f of result.findings.slice(0,30)){const button=document.createElement('button');button.className='transport-finding';button.textContent=f.equipment+' · '+f.name;button.onclick=()=>{position(f.firstPose);$('transport-follow').checked=false;onPart(f.partId);};$('transport-findings').append(button);}
   if(result.findings.length>30){const p=document.createElement('p');p.textContent=`${result.findings.length} component envelopes intersect; first 30 shown.`;$('transport-findings').append(p);}
   for(const id of controls)$(id).disabled=false;$('transport-next').disabled=!result.findings.length;fit();return true;
  }catch(e){if(ticket===request){resetRoute();$('transport-status').textContent=e.message;return true;}return false;}
  finally{if(ticket===request)$('transport-check').disabled=false;}
 }
 $('transport-check').onclick=check;$('transport-close').onclick=()=>{close();onDismiss();};$('transport-fit').onclick=fit;$('transport-fit-vehicle').onclick=fitVehicle;
 select.onchange=check;
 $('transport-play').onclick=()=>{if(!player||result.findings.length)return;if(!player.sample().playing)onBeforePlay();renderPose(player.sample().playing?player.pause():player.play());};
 $('transport-reset').onclick=()=>{if(player)renderPose(player.seek(0));};
 $('transport-position').oninput=e=>{if(player)renderPose(player.seek(Number(e.target.value)/1000));};
 $('transport-follow').onchange=()=>{if($('transport-follow').checked)fitVehicle();};
 document.addEventListener?.('visibilitychange',()=>{if(document.hidden&&player?.sample().playing)renderPose(player.pause());});
 $('transport-next').onclick=()=>{if(!result?.findings.length)return;const f=result.findings.find(f=>f.firstPose>current)||result.findings[0];position(f.firstPose);$('transport-follow').checked=false;onPart(f.partId);};
 const metrics=supportMetrics(model);$('transport-metrics').textContent=`A-5000 services: ${metrics.a5000.columns} columns (${metrics.a5000.localColumns} inside its footprint), ${metrics.a5000.racks} rack groups. ${metrics.a5000.placementElements} pipe elements still need support placement review.`;
 return {get active(){return active;},get shown(){return !root.hidden;},open,pause(){if(player)renderPose(player.pause());},reveal,close,check,update(dt=0){
  const show=active&&isAssembled();group.visible=show;if(!player)return;
  if(!show||document.hidden){if(player.sample().playing)renderPose(player.pause());return;}
  if(player.sample().playing)renderPose(player.update(dt,[1,3,6].includes(Number($('transport-rate').value))?Number($('transport-rate').value):1));
 },getState:()=>({active,shown:!root.hidden,speed:Number($('transport-rate').value)||1,route:select.value,reference:FORKLIFT_REFERENCE.model,profile:{...profile},playback:player?.sample()??null,obstructions:result?.findings.length??null,qualified:false})};
}
