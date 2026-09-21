import {buildEngineerTasks,createEngineerTaskPlayer,createEngineerMachineEffect} from './engineer-tasks.js';
import {attachEngineerActions} from './engineer-actions.js';
import * as T from './vendor/three.module.js';
import {ENGINEER_ROUTES} from './engineer-routes.js';
import {dr601InspectionRoute} from './engineer-stairs.js';
import {stairFeet,legJoints,naturalGaitPose} from './engineer-gait.js';

// Metres, Y up. The envelope is a visualization allowance, not an access standard.
export const ENGINEER = Object.freeze({height:1.7, radius:.6, clearanceHeight:1.8, speed:1, floorY:-.015});
export function segmentHitsRect(a,b,r){
 let lo=0,hi=1;
 for(const [i,min,max] of [[0,r[0],r[2]],[1,r[1],r[3]]]){
  const d=b[i]-a[i];
  if(Math.abs(d)<1e-10){if(a[i]<min||a[i]>max)return false;continue;}
  let u=(min-a[i])/d,v=(max-a[i])/d;if(u>v)[u,v]=[v,u];
  lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>hi)return false;
 }
 return true;
}
const expanded=r=>[r[0]-ENGINEER.radius,r[1]-ENGINEER.radius,r[2]+ENGINEER.radius,r[3]+ENGINEER.radius];
export function walkObstacles(model){
 const obstacles=[],matrix=new T.Matrix4();
 for(const p of model.parts){
  if(p.floorAllocationLegacy)continue;
  if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();
  const b=p.bounds||p.geometry.boundingBox.clone().applyMatrix4(matrix.compose(p.position,p.quaternion,p.scale));
  if(b.max.y<=ENGINEER.floorY+.03||b.min.y>=ENGINEER.floorY+ENGINEER.clearanceHeight)continue;
  obstacles.push({id:p.code||p.id,rect:expanded([b.min.x,b.min.z,b.max.x,b.max.z])});
 }
 // Treat every floor recess and retention cover as unavailable ground, even if hidden.
 for(const c of model.containment?.cells||[]){
  const s=c.storage;
  for(const r of [...c.patches,[s.min[0]-.21,s.min[2]-.21,s.max[0]+.21,s.max[2]+.21]])obstacles.push({id:c.tag,rect:expanded(r)});
 }
 return obstacles;
}
export function screenWalkRoute(route,obstacles,ground,zones){
 const points=route.points.map(p=>[...p]);
 const segments=points.slice(1).map((b,i)=>({a:points[i],b,length:Math.hypot(b[0]-points[i][0],b[1]-points[i][1]),name:route.stops[i+1]}));
 const problems=[],aisles=zones.filter(z=>route.zones.includes(z.id)&&z.kind==='pedestrian'&&z.min[1]<.1);
 if(aisles.length!==route.zones.length)problems.push('Required internal aisle is missing from this model.');
 for(const p of points)if(p[0]-ENGINEER.radius<ground[0]||p[1]-ENGINEER.radius<ground[1]||p[0]+ENGINEER.radius>ground[2]||p[1]+ENGINEER.radius>ground[3])problems.push('Route leaves modeled ground');
 for(const s of segments){
  s.obstacles=obstacles.filter(o=>segmentHitsRect(s.a,s.b,o.rect));
  if(s.obstacles.length)problems.push('Clearance blocked by '+s.obstacles[0].id);
  // Exact interval union: do not bridge an undeclared gap between aisle rectangles.
  const intervals=[];
  for(const z of aisles){
   let lo=0,hi=1;
   for(const [i,j] of [[0,0],[1,2]]){const d=s.b[i]-s.a[i],mn=z.min[j]-1e-8,mx=z.max[j]+1e-8;if(Math.abs(d)<1e-10){if(s.a[i]<mn||s.a[i]>mx)hi=-1;}else{const u=(mn-s.a[i])/d,v=(mx-s.a[i])/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}}
   if(lo<=hi)intervals.push([lo,hi]);
  }
  intervals.sort((a,b)=>a[0]-b[0]);let covered=0;
  for(const [lo,hi] of intervals){if(lo>covered+1e-7)break;covered=Math.max(covered,hi);}
  if(covered<1-1e-7)problems.push('Route leaves the declared internal aisles.');
 }
 return {...route,points,segments,obstaclesChecked:obstacles.length,length:segments.reduce((n,s)=>n+s.length,0),problems:[...new Set(problems)]};
}
export function planWalkRoutes(model,ground){
 const obstacles=walkObstacles(model);
 const definitions=model.walkways?model.walkways.routes.map(r=>({...r,zones:model.walkways.accessZones.map(z=>z.id)})):ENGINEER_ROUTES;
 const walks=definitions.map(route=>screenWalkRoute(route,obstacles,ground,model.access?.zones||[]));if(model.walkways&&!model.walkways.review?.clear)for(const r of walks)r.problems.push('Walkway geometry requires review. Open Walkway settings.');
 return [...walks,dr601InspectionRoute(model)];
}
export function planWalk(model,ground){return planWalkRoutes(model,ground)[0];}
export function createWalkerState(plan){
 const holds=plan.segments.map((s,i)=>i===plan.segments.length-1?0:s.stopSeconds??3);
 const duration=plan.segments.reduce((n,s,i)=>n+s.length/(s.speed??ENGINEER.speed)+holds[i],0);
 const heading=s=>Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1]);
 const initial=()=>({running:false,segment:0,along:0,distance:0,elapsed:0,dwell:0,dwellTotal:0,complete:false,blocked:null,position:[...plan.points[0]],elevation:plan.elevations?.[0]??ENGINEER.floorY,inspection:false,stopName:'',heading:heading(plan.segments[0]),stopHeading:0,moving:false,turning:false,turnFraction:0});
 const state=initial();
 function reset(){Object.assign(state,initial());}
 function advance(dt){
  if(!state.running||!(dt>0)||!Number.isFinite(dt))return;
  if(plan.problems.length){state.running=false;state.blocked=plan.problems[0];return;}
  let remaining=dt;
  while(remaining>1e-9&&state.running){
   if(state.dwell>0){
    const t=Math.min(remaining,state.dwell);state.dwell-=t;state.elapsed+=t;remaining-=t;state.moving=false;
    const next=plan.segments[state.segment],previous=plan.segments[state.segment-1];
    if(next&&!next.articulated&&!previous.articulated){
     const f=T.MathUtils.clamp(1-state.dwell/Math.min(1.5,state.dwellTotal),0,1),angle=Math.atan2(Math.sin(heading(next)-state.stopHeading),Math.cos(heading(next)-state.stopHeading));
     state.turnFraction=f;state.turning=f>0&&f<1&&Math.abs(angle)>.1;state.heading=state.stopHeading+angle*f*f*(3-2*f);
    }
    continue;
   }
   const s=plan.segments[state.segment],speed=s.speed??ENGINEER.speed,travel=Math.min(remaining*speed,s.length-state.along),next=state.along+travel,t=next/s.length;
   const point=[s.a[0]+(s.b[0]-s.a[0])*t,s.a[1]+(s.b[1]-s.a[1])*t];
   const hit=s.obstacles.find(o=>segmentHitsRect(state.position,point,o.rect));
   if(hit){state.running=false;state.blocked='Blocked by '+hit.id;break;}
   state.heading=heading(s);state.position=point;state.elevation=T.MathUtils.lerp(s.ya??ENGINEER.floorY,s.yb??ENGINEER.floorY,t);state.inspection=false;state.along=next;state.distance+=travel;state.elapsed+=travel/speed;remaining-=travel/speed;state.moving=true;state.turning=false;
   if(state.along>=s.length-1e-8){state.segment++;state.along=0;state.moving=false;if(state.segment===plan.segments.length){state.running=false;state.complete=true;state.elapsed=duration;}else{state.dwell=state.dwellTotal=holds[state.segment-1];state.stopName=s.name;state.stopHeading=state.heading;state.turnFraction=0;state.inspection=!!s.inspection;}}
  }
 }
 function seek(fraction){
  if(plan.problems.length||!Number.isFinite(fraction))return false;
  reset();state.running=true;advance(duration*T.MathUtils.clamp(fraction,0,1));state.running=false;return !state.blocked;
 }
 function next(){let time=0;for(const [i,s] of plan.segments.entries()){time+=s.length/(s.speed??ENGINEER.speed);if(time>state.elapsed+1e-6)return seek(time/duration);time+=holds[i];}return seek(1);}
 return {state,advance,reset,seek,next,duration};
}

export function createEngineer(){
 const group=new T.Group();group.name='Engineer · 1700 mm standing height';
 const body=new T.Group();group.add(body);
 const materials=Object.fromEntries(Object.entries({shirt:0x246078,vest:0xffdd26,trousers:0x23576c,boots:0x182534,skin:0xd69a70,helmet:0xffce24,trim:0x3a4652,reflective:0xe5eceb}).map(([k,color])=>[k,new T.MeshStandardMaterial({color,roughness:.72})]));
 const box=(parent,size,at,mat)=>{const m=new T.Mesh(new T.BoxGeometry(...size),materials[mat]);m.position.set(...at);parent.add(m);return m;};
 const sphere=(parent,scale,at,mat)=>{const m=new T.Mesh(new T.SphereGeometry(1,16,12),materials[mat]);m.scale.set(...scale);m.position.set(...at);parent.add(m);return m;};
 box(body,[.33,.40,.21],[0,1.17,0],'shirt');box(body,[.34,.29,.025],[0,1.20,.115],'vest');box(body,[.34,.29,.025],[0,1.20,-.115],'vest');
 for(const z of [-.133,.133])for(const y of [1.10,1.19])box(body,[.34,.028,.008],[0,y,z],'reflective');
 for(const x of [-.10,.10])box(body,[.022,.29,.008],[x,1.2,.132],'reflective');
 box(body,[.30,.16,.20],[0,.91,0],'trousers');box(body,[.32,.035,.22],[0,.985,0],'trim');
 sphere(body,[.06,.07,.06],[0,1.405,0],'skin');sphere(body,[.108,.137,.102],[0,1.51,0],'skin');
 sphere(body,[.027,.032,.035],[0,1.50,.102],'skin');
 for(const x of [-.049,.049]){box(body,[.09,.047,.017],[x,1.54,.100],'trim');box(body,[.065,.029,.010],[x,1.54,.111],'reflective');}
 const helmet=new T.Mesh(new T.SphereGeometry(1,20,12,0,Math.PI*2,0,Math.PI/2),materials.helmet);helmet.scale.set(.143,.13,.137);helmet.position.y=1.57;body.add(helmet);
 const brim=new T.Mesh(new T.CylinderGeometry(.163,.163,.018,24),materials.helmet);brim.scale.z=.92;brim.position.y=1.575;body.add(brim);
 const legs=[],arms=[],stairLegs=[];
 const clipboard=box(body,[.18,.24,.018],[-.09,1.05,.20],'trim');clipboard.visible=false;
 box(clipboard,[.15,.21,.005],[0,0,.013],'reflective');
 for(const side of [-1,1]){
  const leg=new T.Group();leg.position.set(side*.09,.88,0);body.add(leg);legs.push(leg);
  box(leg,[.13,.72,.15],[0,-.40,0],'trousers');box(leg,[.145,.12,.26],[0,-.82,.04],'boots');
  const articulated=new T.Group();group.add(articulated);articulated.visible=false;
  stairLegs.push({group:articulated,upper:box(articulated,[.12,1,.12],[0,0,0],'trousers'),lower:box(articulated,[.105,1,.105],[0,0,0],'trousers'),boot:box(articulated,[.145,.12,.26],[0,0,0],'boots')});
  const arm=new T.Group();arm.position.set(side*.22,1.31,0);body.add(arm);arms.push(arm);
  box(arm,[.115,.24,.13],[0,-.11,0],'shirt');box(arm,[.09,.24,.095],[0,-.34,0],'shirt');sphere(arm,[.052,.07,.052],[0,-.485,0],'boots');
 }
 const upper=new T.Group();upper.position.y=.98;body.add(upper);for(const child of [...body.children])if(child!==upper&&child.position.y>.99){body.remove(child);child.position.y-=.98;upper.add(child);}
 const actions=attachEngineerActions({group,upper,arms,materials,box,sphere,clipboard});
 function pose(distance,walking,step=null,inspection=false){
  actions.reset();
  legs.forEach(l=>l.visible=!step);stairLegs.forEach(l=>l.group.visible=!!step);clipboard.visible=inspection;
  const a=walking?Math.sin(distance*Math.PI*2/1.25)*.27:0;
  legs[0].rotation.x=a;legs[1].rotation.x=-a;arms[0].rotation.x=-a;arms[1].rotation.x=a;
  // Correct the lowest rotating boot corner so feet never sink below grade.
  const motion=step?.segment.gait?naturalGaitPose(step.segment,step.fraction,step.heading):null;
  body.position.set(motion?.sway||0,motion?motion.hip-.88:step?(step.segment.stair?-.18:-.08):Math.max(0,.88*Math.cos(a)+.17*Math.abs(Math.sin(a))-.88),0);upper.rotation.x=motion?.lean||0;
  if(motion){arms[0].rotation.x=motion.arm;arms[1].rotation.x=-motion.arm;}
  if(inspection){arms[0].rotation.x=-.35;arms[1].rotation.x=-.25;}
  if(step){
   const feet=motion?.feet||stairFeet(step.segment,step.fraction,step.heading);
   const limb=(mesh,a,b)=>{mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());};
   for(let i=0;i<2;i++){const leg=stairLegs[i],j=legJoints(new T.Vector3((i===0?-1:1)*.09+(motion?.sway||0),motion?.hip??(step.segment.stair?.70:.80),0),feet[i]);limb(leg.upper,j.hip,j.knee);limb(leg.lower,j.knee,j.ankle);leg.boot.rotation.y=motion?.footYaw[i]||0;leg.boot.position.copy(feet[i]).add(new T.Vector3(0,.06,.04).applyAxisAngle(new T.Vector3(0,1,0),leg.boot.rotation.y));}
  }
 }
 pose(0,false);
 return {group,pose,perform:actions.apply,getActionEvidence:actions.getEvidence};
}

export function mountEngineerWalk({model,scene,ground,prepare,isAssembled,isRouteVisible=()=>true,getCamera,getControls,locate,onFollowChange,restore=()=>{}}){
 const $=id=>document.getElementById(id),button=$('walk-plant'),panel=$('walk-panel');
 const walks=planWalkRoutes(model,ground),routes=[...buildEngineerTasks(model,ground,walks),...walks],figure=createEngineer(),machineEffect=createEngineerMachineEffect(scene,model);
 let plan=routes.find(r=>!r.problems.length)||routes[0],walker=createWalkerState(plan),state=walker.state,taskPlayer=plan.task?createEngineerTaskPlayer(plan):null,snapshot=null;
 let follow=false,lastMessage='',shown=false,playbackSpeed=1,scrubbing=false,resumeAfterScrub=false;
 const ready=()=>isAssembled()&&isRouteVisible(plan)&&(!plan.partId||model.parts.find(p=>p.id===plan.partId)?.visible!==false);
 const blocked=()=>!!plan.problems.length||!!state.blocked||!ready();
 const playing=()=>taskPlayer?taskPlayer.sample().playing:state.running;
 const duration=()=>taskPlayer?plan.duration:walker.duration;
 const elapsed=()=>taskPlayer?taskPlayer.sample().elapsed:state.elapsed;
 const complete=()=>taskPlayer?taskPlayer.sample().complete:state.complete;
 const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 scene.add(figure.group);figure.group.visible=false;
 const routeGeometry=()=>new T.BufferGeometry().setFromPoints(plan.points.map((p,i)=>new T.Vector3(p[0],(plan.elevations?.[i]??0)+.012,p[1])));
 const line=new T.Line(routeGeometry(),new T.LineBasicMaterial({color:0xf5c45d,transparent:true,opacity:.65}));line.visible=false;scene.add(line);
 panel.innerHTML=`<div class="walk-heading"><strong>Engineer tasks and walks</strong><button id="walk-close" aria-label="Close engineer tasks and walks">×</button></div>
 <label for="walk-tour">Task or walking route</label><select id="walk-tour"></select><p id="walk-route-detail"></p><p id="walk-status" role="status" aria-live="polite"></p>
 <div class="walk-timeline-heading"><label for="walk-task-position">Timeline · drag to move</label><output id="walk-time" for="walk-task-position"></output></div>
 <input id="walk-task-position" type="range" min="0" max="1000" step="1" value="0" aria-label="Engineer playback timeline">
 <div class="walk-speed-row"><label for="walk-speed">Playback speed</label><select id="walk-speed"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></div>
 <div class="walk-actions"><button id="walk-pause">Play</button><button id="walk-reset">Restart</button><button id="walk-next">Next step</button><button id="walk-locate">Locate engineer</button></div>
 <label><input id="walk-follow" type="checkbox"> Follow engineer</label><label><input id="walk-route" type="checkbox" checked> Show walking route</label><details class="method-note"><summary>Human model and access assumptions</summary><p id="walk-scale"></p><p id="walk-method" class="walk-note"></p></details>`;
 for(const route of routes){const option=document.createElement('option');option.value=route.id;option.textContent=route.label+(route.problems.length?' · unavailable':'');$('walk-tour').appendChild(option);}
 $('walk-tour').value=plan.id;$('walk-speed').value='1';
 function routeDetails(){
  $('walk-next').textContent=plan.task?'Next step':'Next stop';
  $('walk-route-detail').textContent=plan.problems.length?plan.problems.slice(0,4).join(' '):`${plan.task?plan.phases.length+' steps':Math.round(plan.length)+' m · '+plan.segments.length+' legs'} · ${clock(duration())} at 1×`;
  if(plan.task){$('walk-scale').textContent='Human model: 1.70 m standing height';$('walk-method').textContent=plan.note+' Access and limb clearance are screened against the modeled arrangement.';return;}
  $('walk-scale').textContent=plan.elevated?'1.70 m standing · ascent 0.42 · descent 0.32 m/s':'1.70 m · boots to helmet · walking at 1.0 m/s';
  $('walk-method').textContent=(plan.note?plan.note+' ':'')+(plan.elevated?(plan.inspectionNote||'DR-601 access is unavailable in this model.')+' Tread placement and torso/head clearance screened; detailed access qualification remains open.':'Internal aisle tour with 3-second review stops. Screened against modeled obstacles and recesses using a 0.60 m radius / 1.80 m high envelope. A scale study; not verified site access or egress.');
 }
 function stopFollow(){follow=false;$('walk-follow').checked=false;onFollowChange?.(false);}
 function pausePlayback(){state.running=false;taskPlayer?.pause();}
 function cancelScrub(){scrubbing=false;resumeAfterScrub=false;}
 function sync(){
  const t=taskPlayer?.sample(),segment=plan.segments[Math.min(state.segment,plan.segments.length-1)];
  const walkingMessage=state.turning?'Turning · '+state.stopName:state.dwell>0?(state.inspection?'Inspecting DR-601 externally':state.stopName||'Review stop'):(segment.stair?(segment.yb>segment.ya?'Climbing · ':'Descending · '):'Walking toward ')+segment.name;
  const message=plan.problems[0]||state.blocked||(!ready()?'Paused: restore assembled equipment, visible access and sectioning off.':`${complete()?'Complete':playing()?'Playing':scrubbing?'Seeking':'Paused'} · ${t?t.label:walkingMessage}${t?'':' · '+Math.round(state.distance)+' / '+Math.round(plan.length)+' m'}`);
  if(message!==lastMessage){$('walk-status').textContent=message;lastMessage=message;}
  $('walk-pause').textContent=playing()?'Pause':complete()?'Replay':elapsed()===0?(plan.task?'Play task':'Start route'):'Resume';
  $('walk-pause').disabled=$('walk-next').disabled=$('walk-task-position').disabled=$('walk-speed').disabled=blocked();
  $('walk-next').disabled||=complete();
  if(!scrubbing)$('walk-task-position').value=Math.round(elapsed()/duration()*1000);
  $('walk-task-position').setAttribute('aria-valuetext',`${clock(elapsed())} of ${clock(duration())}`);
  $('walk-time').textContent=`${clock(elapsed())} / ${clock(duration())}`;
  $('walk-locate').disabled=$('walk-follow').disabled=!!plan.problems.length;
 }
 function update(dt){
  if(!shown)return;
  const assembled=ready();if(!assembled||document.hidden){cancelScrub();pausePlayback();machineEffect.reset();stopFollow();}
  figure.group.visible=assembled&&!plan.problems.length;line.visible=assembled&&!plan.problems.length&&$('walk-route').checked;
  const previous=figure.group.position.clone(),stepTime=assembled&&!document.hidden&&!scrubbing?dt*playbackSpeed:0;
  if(taskPlayer){
   const t=taskPlayer.update(stepTime);figure.group.position.fromArray(t.position);figure.group.rotation.y=t.step?.segment.gait?naturalGaitPose(t.step.segment,t.step.fraction).heading:t.heading;if(t.step)t.step.heading=figure.group.rotation.y;
   figure.pose(t.distance,t.walking,t.step,false);
   if(t.action){const evidence=figure.perform(t.action);if(!evidence.reachable){taskPlayer.pause();state.blocked='Control is outside the engineer’s reach. Task paused.';}}
   if(assembled&&!plan.problems.length)machineEffect.apply(plan,t.machine);
  }else{
   walker.advance(stepTime);figure.group.position.set(state.position[0],state.elevation,state.position[1]);
   if(state.inspection&&plan.inspectionTarget)state.heading=Math.atan2(plan.inspectionTarget[0]-state.position[0],plan.inspectionTarget[2]-state.position[1]);
   const current=plan.segments[state.segment],active=state.dwell>0||state.complete?plan.segments[Math.max(0,state.segment-1)]:current;
   const fraction=state.dwell>0||state.complete?1:active?state.along/active.length:0;
   const direction=active?.gait&&!state.inspection?naturalGaitPose(active,fraction).heading:state.heading;
   figure.group.rotation.y=direction;const step=active?.articulated?{segment:active,fraction,heading:direction}:null;
   figure.pose(state.turning?state.turnFraction*.625:state.distance,state.turning||state.moving,step,state.inspection&&state.dwell>0);
  }
  if(follow){const d=figure.group.position.clone().sub(previous);getCamera().position.add(d);getControls().target.add(d);}
  sync();
 }
 function beginScrub(){if(blocked()||!shown)return;if(!scrubbing){resumeAfterScrub=playing();scrubbing=true;pausePlayback();}}
 function finishScrub(){if(!scrubbing)return;const resume=resumeAfterScrub;cancelScrub();if(resume&&shown&&!blocked()&&!complete()&&!document.hidden){if(taskPlayer)taskPlayer.play();else state.running=true;}update(0);}
 function open(){snapshot=prepare();shown=true;cancelScrub();panel.hidden=false;button.setAttribute('aria-expanded','true');button.setAttribute('aria-pressed','true');pausePlayback();update(0);if(!plan.problems.length&&ready())locate(figure.group.position);}
 function close(){const prior=snapshot,wasShown=shown;snapshot=null;cancelScrub();pausePlayback();machineEffect.reset();shown=false;stopFollow();panel.hidden=true;figure.group.visible=false;line.visible=false;button.setAttribute('aria-expanded','false');button.setAttribute('aria-pressed','false');if(wasShown&&prior)restore(prior);}
 $('walk-tour').onchange=()=>{
  cancelScrub();machineEffect.reset();pausePlayback();stopFollow();plan=routes.find(r=>r.id===$('walk-tour').value);walker=createWalkerState(plan);state=walker.state;taskPlayer=plan.task?createEngineerTaskPlayer(plan):null;
  line.geometry.dispose();line.geometry=routeGeometry();routeDetails();update(0);if(!plan.problems.length&&ready())locate(figure.group.position);
 };
 $('walk-close').onclick=close;
 $('walk-pause').onclick=()=>{if(blocked())return;cancelScrub();if(playing())pausePlayback();else if(taskPlayer)taskPlayer.play();else{if(state.complete)walker.reset();state.running=true;}update(0);};
 $('walk-reset').onclick=()=>{cancelScrub();machineEffect.reset();stopFollow();walker.reset();taskPlayer?.reset();update(0);};
 $('walk-next').onclick=()=>{if(blocked())return;cancelScrub();pausePlayback();taskPlayer?taskPlayer.next():walker.next();update(0);};
 const timeline=$('walk-task-position');
 timeline.onpointerdown=beginScrub;
 timeline.oninput=e=>{if(blocked())return;beginScrub();const fraction=Number(e.target.value)/1000;taskPlayer?taskPlayer.seek(fraction):walker.seek(fraction);update(0);};
 timeline.onchange=timeline.onpointerup=finishScrub;
 timeline.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].includes(e.key))beginScrub();};
 timeline.onkeyup=finishScrub;
 timeline.onblur=()=>{cancelScrub();update(0);};
 document.addEventListener('pointerup',finishScrub);
 document.addEventListener('pointercancel',()=>{if(scrubbing){cancelScrub();pausePlayback();update(0);}});
 $('walk-speed').onchange=()=>{const value=Number($('walk-speed').value);if([1,2,4].includes(value))playbackSpeed=value;$('walk-speed').value=String(playbackSpeed);sync();};
 $('walk-locate').onclick=()=>locate(figure.group.position);
 $('walk-follow').onchange=()=>{follow=$('walk-follow').checked;if(follow){locate(figure.group.position);getControls().clearInspectionPivot();}onFollowChange?.(follow);};
 $('walk-route').onchange=()=>update(0);
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelScrub();pausePlayback();stopFollow();sync();}});
 routeDetails();
 return {open,close,update,navigation:stopFollow,get shown(){return shown;},getState:()=>({...state,elapsed:elapsed(),duration:duration(),playbackSpeed,scrubbing,position:taskPlayer?[taskPlayer.sample().position[0],taskPlayer.sample().position[2]]:[...state.position],elevation:taskPlayer?.sample().position[1]??state.elevation,running:playing(),follow,task:taskPlayer?.sample()||null,actionEvidence:figure.getActionEvidence(),routeId:plan.id,routeLabel:plan.label,routes:routes.map(r=>({id:r.id,label:r.label,problems:r.problems,length:r.length})),height:ENGINEER.height,routeLength:plan.length,obstaclesChecked:plan.obstaclesChecked,problems:plan.problems})};
}
