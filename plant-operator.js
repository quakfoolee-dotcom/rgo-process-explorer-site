import * as T from './vendor/three.module.js';
import {planBrowseRoute} from './plant-browse-route.js';
import {projectToEdge,edgeElevation,angleDelta} from './plant-browse-network.js';
import {buildStations,buildInstrumentStations,createOperatorSim,planRound} from './plant-operator-sim.js';

// Animated field operator for Browse plant. It walks the same checked walkway network
// as the visitor, climbs the same stair flights, and carries out tasks at tagged
// equipment and valves. Readings come from a simple illustrative simulation.
const WALK_SPEED=1.3,STAIR_FACTOR=.55,V=(x,y,z)=>new T.Vector3(x,y,z);
const WORK={reading:2.6,'check-valve':2.2,'operate-valve':3.4,pump:2.4,goto:.4};

export function accessPoint(network,station){
 let best=null;
 for(const edge of network.edges){
  if(edge.stair)continue;
  const hit=projectToEdge([station.x,station.z],edge),y=edgeElevation(edge,hit.t);
  const over=station.y>y+2.2?station.y-y-2.2:station.y<y-.6?y-.6-station.y:0,score=hit.distance+.8*over;
  if(!best||score<best.score)best={edge,t:hit.t,point:hit.point,y,score,distance:hit.distance};
 }
 return best&&best.score<=30?best:null;
}

export function routePath(route,start){
 const pts=[{x:start.point[0],y:edgeElevation(start.edge,start.t),z:start.point[1],stair:false}];
 for(const leg of route.legs){const e=leg.edge;pts.push({x:e.a[0]+(e.b[0]-e.a[0])*leg.to,y:edgeElevation(e,leg.to),z:e.a[1]+(e.b[1]-e.a[1])*leg.to,stair:!!e.stair||Math.abs((e.yb??0)-(e.ya??0))>.05,edge:e,from:leg.from,to:leg.to});}
 return pts;
}

function createFigure(){
 const g=new T.Group(),body=new T.Group();g.add(body);
 const M=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.65,...extra});
 const suit=M(0xc9480a),vest=M(0xa6d200,{roughness:.55,emissive:0x2a3a00,emissiveIntensity:.3}),skin=M(0xc99a78),hat=M(0xf6f6f2),boot=M(0x2a2a2a),glove=M(0x1f3d6b),stripe=M(0xdfe4e8);
 const add=(geo,mat,pos,parent)=>{const m=new T.Mesh(geo,mat);m.position.copy(pos);(parent||g).add(m);return m;};
 add(new T.CylinderGeometry(.16,.15,.56,16),suit,V(0,1.24,0),body);
 add(new T.CylinderGeometry(.168,.16,.38,16),vest,V(0,1.3,0),body);
 for(const y of [1.2,1.36])add(new T.CylinderGeometry(.171,.171,.03,16),stripe,V(0,y,0),body);
 add(new T.CylinderGeometry(.15,.15,.14,16),suit,V(0,.98,0),body);
 const head=new T.Group();head.position.set(0,1.56,0);body.add(head);
 add(new T.CylinderGeometry(.045,.05,.08,10),skin,V(0,-.02,0),head);
 add(new T.SphereGeometry(.105,16,12),skin,V(0,.1,0),head);
 add(new T.SphereGeometry(.122,16,10,0,Math.PI*2,0,Math.PI/2),hat,V(0,.14,0),head);
 add(new T.CylinderGeometry(.155,.155,.015,20),hat,V(0,.145,.02),head);
 add(new T.BoxGeometry(.13,.035,.02),M(0x222831),V(0,.12,.1),head);
 const limb=(x,y,l1,l2,r,endGeo,endMat)=>{
  const sh=new T.Group();sh.position.set(x,y,0);body.add(sh);
  add(new T.CylinderGeometry(r,r*.9,l1,10),suit,V(0,-l1/2,0),sh);
  const el=new T.Group();el.position.set(0,-l1,0);sh.add(el);
  add(new T.CylinderGeometry(r*.9,r*.8,l2,10),suit,V(0,-l2/2,0),el);
  const end=add(endGeo,endMat,V(0,-l2-.03,0),el);return {sh,el,end};
 };
 const aL=limb(-.2,1.47,.29,.27,.045,new T.SphereGeometry(.045,10,8),glove),aR=limb(.2,1.47,.29,.27,.045,new T.SphereGeometry(.045,10,8),glove);
 const lL=limb(-.085,.93,.45,.44,.062,new T.BoxGeometry(.1,.08,.24),boot),lR=limb(.085,.93,.45,.44,.062,new T.BoxGeometry(.1,.08,.24),boot);
 lL.end.position.z=.05;lR.end.position.z=.05;
 // Tablet held in front of the chest: dark frame with a lit screen on its +z face (which faces the operator's face once the forearm is raised), turned a little outward so it reads from the side.
 const tablet=new T.Group();tablet.position.set(-.09,-.25,.04);tablet.rotation.y=-.55;aR.el.add(tablet);tablet.visible=false;
 add(new T.BoxGeometry(.22,.3,.02),M(0x16202b),V(0,0,0),tablet);
 // The screen is unlit and exempt from tone mapping, so it stays bright whatever the lighting or angle; a few dark lines read as text.
 const screenMat=new T.MeshBasicMaterial({color:0xcff2ff,toneMapped:false}),textMat=new T.MeshBasicMaterial({color:0x2f7fb0,toneMapped:false});
 const screen=add(new T.BoxGeometry(.19,.26,.006),screenMat,V(0,0,.0115),tablet);screen.name='Tablet screen';
 for(const [y,w] of [[.09,.15],[.04,.12],[-.01,.14],[-.06,.09]])add(new T.BoxGeometry(w,.014,.002),textMat,V(-(.15-w)/2,y,.0155),tablet);
 g.traverse(o=>{if(o.isMesh)o.frustumCulled=false;});
 // aim: arm elevation above horizontal toward the item worked (radians) and how far the elbows bend (0 straight)
 function pose(mode,t,phase,aim={elev:0,bend:.5,turn:-.55}){
  const s=Math.sin(phase),c=Math.cos(phase),set=(l,a,b,z=0)=>{l.sh.rotation.set(a,0,z);l.el.rotation.set(b,0,0);};
  tablet.visible=mode==='inspect';body.position.y=0;body.rotation.x=0;head.rotation.set(0,0,0);
  if(mode==='walk'||mode==='stair'){const A=mode==='stair'?.75:.5,K=mode==='stair'?1.1:.7;set(lL,-s*A,Math.max(0,s)*K);set(lR,s*A,Math.max(0,-s)*K);set(aL,s*.45,-.35);set(aR,-s*.45,-.35);body.position.y=Math.abs(c)*.03;}
  else if(mode==='wheel'||mode==='wheelHigh'){const w=t*3.2,base=-(Math.PI/2+aim.elev),e=-aim.bend;set(lL,0,0);set(lR,0,0);set(aL,base+.22*Math.sin(w),e,.18*Math.cos(w));set(aR,base-.22*Math.sin(w),e,-.18*Math.cos(w));head.rotation.x=-aim.elev*.5;}
  else if(mode==='inspect'){set(lL,0,0);set(lR,0,0);set(aR,-.55,-1.85,-.22);set(aL,-.6+.04*Math.sin(t*2),-1.7,.25);head.rotation.x=.28+Math.sin(t*1.3)*.05;tablet.rotation.y+=((aim.turn??-.55)-tablet.rotation.y)*.3;}
  else if(mode==='press'){
   // A push, hold, release and rest every 1.1 s: the forearm folds back, shoots out to the control, holds, and folds back, with a lean into it.
   const u=(t/1.1)%1,push=u<.3?Math.sin(u/.3*Math.PI/2):u<.45?1:u<.75?Math.cos((u-.45)/.3*Math.PI/2):0;
   set(lL,0,0);set(lR,0,0);set(aL,.05,-.2);set(aR,-(Math.PI/2+aim.elev),-(aim.bend+1.5*(1-push)));
   body.rotation.x=.12*push;head.rotation.x=-aim.elev*.5;}
  else{set(lL,0,0);set(lR,0,0);set(aL,.05,-.15,-.05);set(aR,.05,-.15,.05);body.position.y=Math.sin(t*1.5)*.004;}
 }
 const tp=new T.Vector3(),tq=new T.Quaternion(),gq=new T.Quaternion();
 // Tablet centre and screen normal in the operator's own frame (+z forward, +y up), for tests.
 function tabletInfo(){g.updateMatrixWorld(true);tablet.getWorldPosition(tp);tablet.getWorldQuaternion(tq);g.getWorldQuaternion(gq);
  const inv=gq.clone().invert(),pos=g.worldToLocal(tp.clone()),normal=new T.Vector3(0,0,1).applyQuaternion(tq).applyQuaternion(inv);return {visible:tablet.visible,pos:[pos.x,pos.y,pos.z],normal:[normal.x,normal.y,normal.z]};}
 const sp=new T.Vector3(),hp=new T.Vector3();
 // Distance from the shoulder to the glove, for tests of how far a push extends.
 function handReach(){g.updateMatrixWorld(true);aR.sh.getWorldPosition(sp);aR.end.getWorldPosition(hp);return sp.distanceTo(hp);}
 return {group:g,pose,armPitch:()=>aR.sh.rotation.x,tabletInfo,tablet,handReach};
}

const nf=(n,d=0)=>Number(n).toFixed(d);
const clock=t=>{const s=Math.floor(t),m=Math.floor(s/60);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};

export function createFieldOperator({model,scene,viewport,root,network,entries=[],getCamera,applyCamera,restoreCamera,getOcclusion=()=>null}){
 const $=id=>root.querySelector('#'+id);
 const stations=buildStations(model),sim=createOperatorSim(stations),figure=createFigure(),group=figure.group;
 group.name='Browse field operator';group.visible=false;scene.add(group);
 const viewCam=new T.PerspectiveCamera(66,1,.04,500),label=document.createElement('div');
 label.className='browse-op-label';label.hidden=true;viewport.append(label);
 const access=new Map();
 const st={loc:null,pos:V(0,0,0),yaw:0,phase:0,t:0,simT:0,mode:'idle',cur:null,queue:[],path:null,seg:0,segT:0,work:0,fast:1,view:'own',log:[],shown:false,viewYaw:0,viewPos:V(0,0,0)};

 function startHit(){const e=entries[0]?.hit||network.nearest(network.edges[0].a);return {edge:e.edge,t:e.t,point:[...e.point]};}
 function place(hit){st.loc=hit;st.pos.set(hit.point[0],edgeElevation(hit.edge,hit.t),hit.point[1]);st.yaw=hit.edge.heading;st.viewYaw=st.yaw;}
 place(startHit());

 // ---- UI
 const areaIds=[...new Set(stations.map(s=>s.areaId).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const areaSel=$('op-area');areaSel.replaceChildren();
 for(const [value,text] of [['','All areas'],...areaIds.map(a=>[a,a])]){const o=document.createElement('option');o.value=value;o.textContent=text;areaSel.append(o);}
 const list=$('op-tags');list.replaceChildren();
 const addOption=s=>{const o=document.createElement('option');o.value=s.tag;o.textContent=s.label;list.append(o);};
 for(const s of stations)addOption(s);
 const show=text=>{if($('op-status').textContent!==text)$('op-status').textContent=text;};
 const status=(text,hold=0)=>{st.msg=text;st.msgT=hold;show(text);};
 function renderLog(){
  const ol=$('op-log');ol.replaceChildren();
  for(const e of st.log.slice(-40).reverse()){const li=document.createElement('li');li.textContent=e.time+' · '+e.tag+' · '+e.task+' — '+e.result;if(e.flag)li.className='op-flag';ol.append(li);}
 }
 function logEntry(tag,task,result,flag=false){st.log.push({time:clock(st.simT),tag,task,result,flag});renderLog();}

 // ---- tasks
 function stationFor(tag){return sim.byTag.get(String(tag||'').trim().toUpperCase())||sim.byTag.get(String(tag||'').trim());}
 function validate(kind,tag){
  const s=stationFor(tag);
  if(!s)return {error:'Unknown tag '+(tag||'(empty)')};
  if(kind==='check-valve'||kind==='operate-valve'){
   if(s.type!=='valve')return {error:s.tag+' is not a valve'};
   if(kind==='operate-valve'&&s.actuation==='self-acting')return {error:s.tag+' is a '+s.valveClass.toLowerCase()+' (self-acting)'};
  }
  if(kind==='pump'&&(s.type!=='equipment'||s.kind!=='pump'))return {error:s.tag+' is not a pump'};
  if(kind==='reading'&&s.type==='valve'&&s.actuation==='self-acting')return {error:'Check '+s.tag+' with Check valve'};
  return {station:s};
 }
 function enqueue(kind,tag){
  const v=validate(kind,tag);
  if(v.error){logEntry(tag||'—','Task refused',v.error,true);status(v.error,4);return false;}
  st.queue.push({kind,station:v.station});status(st.cur?'Task queued ('+st.queue.length+' waiting)':'Task queued',2);return true;
 }
 function describe(t){const s=t.station;return t.kind==='goto'?'Walking to '+s.tag:t.kind==='operate-valve'?'Operating '+s.tag:t.kind==='pump'?'Pump '+s.tag:t.kind==='check-valve'?'Checking '+s.tag:s.type==='instrument'?'Reading instrument '+s.tag:'Reading '+s.tag;}
 function begin(t){
  st.cur=t;const s=t.station;
  if(!access.has(s.tag))access.set(s.tag,accessPoint(network,s));
  const dest=access.get(s.tag),route=dest&&planBrowseRoute(network,st.loc,dest);
  if(!dest||!route){logEntry(s.tag,describe(t),'no connected walkway within reach',true);st.cur=null;st.mode='idle';return;}
  st.path=routePath(route,st.loc);st.seg=0;st.segT=0;st.mode='walk';st.dest=dest;
  status(describe(t)+' · '+route.distance.toFixed(0)+' m');
 }
 const joined=r=>r.map(x=>x.name+' '+x.value+(x.unit?' '+x.unit:'')).join(', ');
 function valveNote(s,r){return r[0].status==='off-normal'?' — OFF NORMAL (normally '+s.normal+')':s.normal==null&&s.actuation!=='self-acting'?' (normal position not defined)':'';}
 function finishWork(){
  const t=st.cur,s=t.station;let result='',flag=false,task='';
  if(t.kind==='reading'){
   const r=sim.readings(s,st.simT);flag=r.some(x=>x.status==='high'||x.status==='low');
   if(s.type==='instrument'){task='Instrument';result=joined(r)+' · '+s.status+(s.asset?' on '+s.asset:'')+(s.setpoint?' · setpoint: '+s.setpoint:'');if(flag)result+=' — OUT OF RANGE; alarm basis: '+(s.alarm||'not stated');}
   else if(s.type==='valve'){task='Valve check';result=joined(r)+valveNote(s,r);flag=r[0].status==='off-normal';}
   else{task='Readings';result=joined(r);if(flag)result+=' — OUT OF RANGE';}
  }
  else if(t.kind==='check-valve'){task='Valve check';const r=sim.readings(s,st.simT);result=s.valveClass+': '+joined(r)+valveNote(s,r);flag=r[0].status==='off-normal';}
  else if(t.kind==='operate-valve'){task='Valve operated';const open=!sim.valveOpen(s);sim.setValve(s,open);flag=s.normal!=null&&open!==(s.normal!=='closed');
   result=(s.actuation==='actuated'?'local control confirmed with control room, now ':'handwheel turned, now ')+(open?'open':'closed')+(flag?' — OFF NORMAL':s.normal==null?' (normal position not defined)':'');}
  else if(t.kind==='pump'){task='Pump';const run=!sim.pumpRunning(s);sim.setPump(s,run);result=run?'START pressed, running':'STOP pressed, stopped';}
  else{task='Walk to';result='arrived';}
  logEntry(s.tag,task,result,flag);
  st.cur=null;st.mode='idle';st.loc=st.dest;
 }
 // Arms point at the item worked: elevation from the shoulder to the station, elbows straighter the further it is.
 const SHOULDER=1.47,ARM=.62;
 st.aim={elev:0,bend:.5};
 function aimToward(dt,pose){
  let elev=0,bend=.5;
  if((pose==='wheel'||pose==='wheelHigh'||pose==='press')&&st.cur){
   const s=st.cur.station,dx=s.x-st.pos.x,dz=s.z-st.pos.z,d=Math.hypot(dx,dz),dy=s.y-(st.pos.y+SHOULDER);
   elev=Math.max(-.9,Math.min(1.4,Math.atan2(dy,Math.max(.05,d))));
   bend=Math.max(.05,Math.min(1.5,(1-Math.hypot(d,dy)/ARM)*1.8));
  }
  const k=Math.min(1,dt*8);st.aim.elev+=(elev-st.aim.elev)*k;st.aim.bend+=(bend-st.aim.bend)*k;st.aim.turn=(st.tabletSide||-1)*.55;return st.aim;
 }
 function workPose(){
  const t=st.cur,s=t.station;
  if(t.kind==='reading'||(t.kind==='check-valve'&&s.actuation==='self-acting'))return 'inspect';
  if(t.kind==='pump'||(t.kind==='operate-valve'&&s.actuation==='actuated'))return 'press';
  if(t.kind==='goto')return 'idle';
  return 'wheel';
 }

 // ---- motion
 function walk(dt){
  let left=dt*WALK_SPEED*st.fast,moved=false,stair=false;
  while(left>1e-6&&st.seg<st.path.length-1){
   const a=st.path[st.seg],b=st.path[st.seg+1],len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),sp=b.stair?STAIR_FACTOR:1;
   if(len<1e-6){st.seg++;st.segT=0;continue;}
   const remain=(1-st.segT)*len,go=Math.min(left*sp,remain);
   st.segT+=go/len;left-=go/sp;moved=true;stair=b.stair;
   const f=st.segT;st.pos.set(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,a.z+(b.z-a.z)*f);
   if(Math.hypot(b.x-a.x,b.z-a.z)>1e-3){const d=angleDelta(Math.atan2(b.x-a.x,b.z-a.z),st.yaw);st.yaw+=d*Math.min(1,dt*10);}
   if(st.segT>=1-1e-6){st.seg++;st.segT=0;}
  }
  st.phase+=dt*7.5*st.fast*(stair?.8:1);
  if(st.seg>=st.path.length-1){st.mode='work';st.work=0;}
  return moved?(stair?'stair':'walk'):'idle';
 }
 function faceStation(dt){const s=st.cur.station,d=angleDelta(Math.atan2(s.x-st.pos.x,s.z-st.pos.z),st.yaw);st.yaw+=d*Math.min(1,dt*6);}

 function updateViewCamera(dt){
  if(st.view==='own')return;
  const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight);viewCam.aspect=w/h;viewCam.updateProjectionMatrix();
  const k=Math.min(1,dt*4);st.viewYaw+=angleDelta(st.yaw,st.viewYaw)*k;
  if(st.view==='ride'){
   viewCam.position.set(st.pos.x,st.pos.y+1.6,st.pos.z);
   const aim=V(st.pos.x+Math.sin(st.viewYaw)*3,st.pos.y+1.45,st.pos.z+Math.cos(st.viewYaw)*3);
   if(st.mode==='work'&&st.cur){const s=st.cur.station;aim.set(s.x,s.y,s.z);}
   viewCam.lookAt(aim);viewCam.updateMatrixWorld();applyCamera(viewCam,aim);
  }else{
   const head=V(st.pos.x,st.pos.y+1.5,st.pos.z),target=chaseTarget(head,dt);
   if(!st.followInit||st.camBlocked){viewCam.position.copy(target);st.followInit=true;}else viewCam.position.lerp(target,k);
   const aim=V(st.pos.x,st.pos.y+(st.view==='side'?1.15:1.1),st.pos.z);viewCam.lookAt(aim);viewCam.updateMatrixWorld();applyCamera(viewCam,aim);
   // the tablet is turned to whichever side the camera is on (local +x is (cos yaw, -sin yaw) in the world)
   const side=(viewCam.position.x-st.pos.x)*Math.cos(st.yaw)-(viewCam.position.z-st.pos.z)*Math.sin(st.yaw),len=Math.hypot(viewCam.position.x-st.pos.x,viewCam.position.z-st.pos.z);
   if(len>.5&&Math.abs(side)/len>.35)st.tabletSide=side>0?1:-1;
  }
 }
 // Chase camera that stays out of columns and decks: candidates behind, beside and closer in, checked against the exact geometry.
 const ray=new T.Raycaster(),H=Math.PI/2;
 // [yaw offset from the operator's facing, distance, camera height above the floor]; the first clear one wins.
 const VIEWS={
  follow:[[0,5.5,3.2],[.6,5.5,3.2],[-.6,5.5,3.2],[1.2,5,3],[-1.2,5,3],[0,3.6,2.4],[.8,3.2,2.2],[-.8,3.2,2.2],[Math.PI,4,2.6],[1.6,3,2],[-1.6,3,2],[0,2,1.6],[Math.PI,2.4,1.8]],
  // while a tablet is out: a rear-quarter on the left, wide enough to clear the torso and see the screen, then the usual chase positions
  read:[[1.1,4.4,2.8],[1.3,4.0,2.6],[.9,4.6,2.9],[1.5,3.8,2.4],[H,3.4,1.9]],
  side:[[H,3.4,1.7],[-H,3.4,1.7],[H,2.4,1.6],[-H,2.4,1.6],[H*.75,3.4,1.9],[-H*.75,3.4,1.9],[H*1.25,3.4,1.9],[-H*1.25,3.4,1.9],[H,4.6,2.4],[-H,4.6,2.4],[H,1.7,1.5],[-H,1.7,1.5]]
 };
 function clearLine(occ,from,to){const dir=to.clone().sub(from),len=dir.length();if(len<1e-3)return true;ray.set(from,dir.normalize());ray.far=len;return !occ.blocked(ray,to);}
 function tabletOut(){return st.mode==='work'&&!!st.cur&&workPose()==='inspect';}
 function chaseTarget(head,dt){
  const occ=getOcclusion();st.chaseT=(st.chaseT||0)-dt;st.camBlocked=false;
  const at=([off,dist,h])=>{const yaw=st.viewYaw+off;return V(head.x-Math.sin(yaw)*dist,st.pos.y+h,head.z-Math.cos(yaw)*dist);};
  const key=st.view==='follow'&&tabletOut()?'read':st.view,CHASE=key==='read'?[...VIEWS.read,...VIEWS.follow]:(VIEWS[key]||VIEWS.follow);
  if(st.chaseKey!==key){st.chaseKey=key;st.chaseIdx=null;st.chaseTarget=null;st.chaseT=0;}
  if(!occ){return at(CHASE[0]);}
  if(st.chaseTarget&&st.chaseT>0)return st.chaseTarget;
  st.chaseT=.15;
  // keep the last good choice while it is still clear; otherwise take the first clear candidate
  const order=st.chaseIdx==null?CHASE.map((_,i)=>i):[st.chaseIdx,...CHASE.map((_,i)=>i).filter(i=>i!==st.chaseIdx)];
  let pick=null;
  for(const i of order){const p=at(CHASE[i]);if(clearLine(occ,head,p)){pick=p;st.chaseIdx=i;break;}}
  if(!pick){pick=V(head.x,head.y+.9,head.z);st.chaseIdx=null;}
  // if the camera itself drifted behind something, snap rather than glide through it
  if(st.followInit&&!clearLine(occ,head,viewCam.position))st.camBlocked=true;
  st.chaseTarget=pick;return pick;
 }
 function updateLabel(){
  const cam=getCamera?.();
  if(!st.shown||!cam||st.view==='ride'){label.hidden=true;return;}
  const p=V(st.pos.x,st.pos.y+2.1,st.pos.z).project(cam);
  if(p.z<-1||p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1){label.hidden=true;return;}
  label.hidden=false;label.style.transform='translate('+((p.x+1)/2*viewport.clientWidth).toFixed(0)+'px,'+((1-p.y)/2*viewport.clientHeight).toFixed(0)+'px) translate(-50%,-100%)';
  const text=st.cur?(st.mode==='work'?describe(st.cur):'Walking · '+st.cur.station.tag):'Standing by';
  if(label.textContent!==text)label.textContent=text;
 }

 function update(dt,wall=false){
  if(!st.shown)return;
  // The host caps frame time at 0.05 s, which slows the operator on a heavy scene: use the wall clock when asked.
  if(wall){const now=performance.now();dt=st.lastWall?Math.min((now-st.lastWall)/1000,.5):dt;st.lastWall=now;}
  dt=Math.min(dt,.5);st.t+=dt;st.simT+=dt*st.fast;
  if(!st.cur&&st.queue.length)begin(st.queue.shift());
  let pose='idle';
  if(st.cur&&st.mode==='walk')pose=walk(dt);
  else if(st.cur&&st.mode==='work'){
   faceStation(dt);st.work+=dt;pose=workPose();
   if(st.work>=WORK[st.cur.kind]/Math.max(1,st.fast*.6))finishWork();
  }
  figure.pose(pose,st.t,st.phase,aimToward(dt,pose));
  group.position.copy(st.pos);group.rotation.y=st.yaw;
  if(st.cur)show(describe(st.cur)+(st.mode==='walk'&&st.queue.length?' · '+st.queue.length+' more':''));
  else if(st.msgT>0){st.msgT-=dt;show(st.msg);}
  else show(st.queue.length?'Task queued':'Operator standing by');
  updateViewCamera(dt);updateLabel();
 }

 function setView(view,{restore=true}={}){
  if(view===st.view)return;
  const was=st.view;st.view=view;st.lastWall=0;group.visible=st.shown&&view!=='ride';st.followInit=false;st.viewYaw=st.yaw;
  st.chaseIdx=null;st.chaseTarget=null;st.tabletSide=-1;
  for(const [id,v] of [['op-view-own','own'],['op-view-follow','follow'],['op-view-side','side'],['op-view-ride','ride']])$(id).setAttribute('aria-pressed',String(v===view));
  if(view==='own'&&was!=='own'&&restore)restoreCamera?.();
 }

 function interrupt(){
  if(st.cur&&st.mode==='walk'&&st.path&&st.seg<st.path.length-1){const b=st.path[st.seg+1];if(b.edge)st.loc={edge:b.edge,t:b.from+(b.to-b.from)*st.segT,point:[st.pos.x,st.pos.z]};}
  st.queue=[];st.cur=null;st.mode='idle';st.path=null;
 }
 // ---- controls
 $('op-add').onclick=()=>{const kind=$('op-task').value,tag=$('op-tag').value;enqueue(kind,tag);};
 $('op-tag').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('op-add').onclick();}};
 $('op-round').onclick=()=>{const plan=planRound(stations,areaSel.value);if(!plan.length){status('No tagged equipment in this area',4);return;}for(const p of plan)st.queue.push({kind:p.kind,station:sim.byTag.get(p.tag)});status('Operator round started · '+plan.length+' stops',3);logEntry('ROUND','Round','started, '+plan.length+' stops'+(areaSel.value?' in '+areaSel.value:''));};
 $('op-cancel').onclick=()=>{const n=st.queue.length+(st.cur?1:0);interrupt();if(n)logEntry('—','Cancelled',n+' task(s)');status('Tasks cancelled',3);};
 $('op-fast').onclick=e=>{st.fast=st.fast===1?3:1;e.currentTarget.setAttribute('aria-pressed',String(st.fast>1));};
 $('op-view-own').onclick=()=>setView('own');
 $('op-view-follow').onclick=()=>setView('follow');
 $('op-view-side').onclick=()=>setView('side');
 $('op-view-ride').onclick=()=>setView('ride');
 $('op-csv').onclick=async()=>{
  const rows=[['time','tag','task','result','flag'],...st.log.map(e=>[e.time,e.tag,e.task,e.result,e.flag?'yes':''])];
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  try{await navigator.clipboard.writeText(csv);status('Log copied as CSV ('+st.log.length+' rows, simulated values)',4);}catch{status('Copy failed; select the log text instead',4);}
 };

 return {
  update,setView,enqueue,sim,stations,figure,
  addInstruments(items){const added=buildInstrumentStations(items,stations);sim.addStations(added);for(const s of added)addOption(s);return added.length;},
  get viewing(){return st.view!=='own';},
  get view(){return st.view;},
  show(){st.shown=true;group.visible=st.view!=='ride';$('browse-operator').hidden=false;},
  hide(){st.shown=false;group.visible=false;label.hidden=true;interrupt();setView('own',{restore:false});},
  getState:()=>({shown:st.shown,mode:st.mode,view:st.view,yaw:st.yaw,aim:{...st.aim},armPitch:figure.armPitch(),handReach:figure.handReach(),tablet:figure.tabletInfo(),position:[st.pos.x,st.pos.y,st.pos.z],queue:st.queue.length,busy:!!st.cur,log:st.log.length,stations:stations.length,simTime:st.simT}),
  get log(){return st.log;},
  dispose(){scene.remove(group);label.remove();}
 };
}
