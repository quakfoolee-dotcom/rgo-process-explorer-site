import * as T from './vendor/three.module.js';
import {planBrowseRoute} from './plant-browse-route.js';
import {projectToEdge,edgeElevation,angleDelta} from './plant-browse-network.js';
import {buildStations,buildInstrumentStations,createOperatorSim,planRound} from './plant-operator-sim.js';

// Animated field operator for Browse plant. It walks the same checked walkway network
// as the visitor, climbs the same stair flights, and carries out tasks at tagged
// equipment and valves. Readings come from a simple illustrative simulation.
const WALK_SPEED=1.3,STAIR_FACTOR=.55,V=(x,y,z)=>new T.Vector3(x,y,z);
const WORK={reading:2.6,'check-valve':2.2,'operate-valve':3.4,pump:2.4,goto:.4,aside:.05};
const MIN_SEP=.62,KEEP_CLEAR=.95,PASS_LATERAL=.33,WAIT_LATERAL=.35,WAIT_GIVE_UP=8;

// Walkway standing points for an item, best first and at least 2.5 m apart: nearest, with a penalty when the walkway is too high or low to reach it.
export function accessCandidates(network,station,limit=5){
 const all=[];
 for(const edge of network.edges){
  if(edge.stair)continue;
  const hit=projectToEdge([station.x,station.z],edge),y=edgeElevation(edge,hit.t);
  const over=station.y>y+2.2?station.y-y-2.2:station.y<y-.6?y-.6-station.y:0,score=hit.distance+.8*over;
  if(score<=30)all.push({edge,t:hit.t,point:hit.point,y,score,distance:hit.distance});
 }
 all.sort((a,b)=>a.score-b.score);
 const out=[];
 for(const c of all){if(out.every(o=>Math.hypot(o.point[0]-c.point[0],o.point[1]-c.point[1])>2.5))out.push(c);if(out.length>=limit)break;}
 return out;
}
export const accessPoint=(network,station)=>accessCandidates(network,station,1)[0]||null;

export function routePath(route,start){
 const pts=[{x:start.point[0],y:edgeElevation(start.edge,start.t),z:start.point[1],stair:false}];
 for(const leg of route.legs){const e=leg.edge;pts.push({x:e.a[0]+(e.b[0]-e.a[0])*leg.to,y:edgeElevation(e,leg.to),z:e.a[1]+(e.b[1]-e.a[1])*leg.to,stair:!!e.stair||Math.abs((e.yb??0)-(e.ya??0))>.05,edge:e,from:leg.from,to:leg.to});}
 return pts;
}

function createFigure(palette={suit:0xc9480a,vest:0xa6d200,emissive:0x2a3a00}){
 const g=new T.Group(),body=new T.Group();g.add(body);
 const M=(c,extra={})=>new T.MeshStandardMaterial({color:c,roughness:.65,...extra});
 const suit=M(palette.suit),vest=M(palette.vest,{roughness:.55,emissive:palette.emissive,emissiveIntensity:.3}),skin=M(0xc99a78),hat=M(0xf6f6f2),boot=M(0x2a2a2a),glove=M(0x1f3d6b),stripe=M(0xdfe4e8);
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
   // A push, hold, release and rest every 1.3 s. At rest the upper arm hangs and the forearm is bent up in front of the chest;
   // the push swings the arm out to the control and straightens it. Eased, so it reads as a calm press.
   const u=(t/1.3)%1,ease=x=>.5-.5*Math.cos(Math.PI*Math.min(1,Math.max(0,x))),push=u<.3?ease(u/.3):u<.5?1:u<.8?1-ease((u-.5)/.3):0;
   set(lL,0,0);set(lR,0,0);set(aL,.05,-.2);set(aR,-.5+(-(Math.PI/2+aim.elev)+.5)*push,-(aim.bend+1.7*(1-push)));
   body.rotation.x=.06*push;head.rotation.x=-aim.elev*.5;}
  else{set(lL,0,0);set(lR,0,0);set(aL,.05,-.15,-.05);set(aR,.05,-.15,.05);body.position.y=Math.sin(t*1.5)*.004;}
 }
 const tp=new T.Vector3(),tq=new T.Quaternion(),gq=new T.Quaternion();
 // Tablet centre and screen normal in the operator's own frame (+z forward, +y up), for tests.
 function tabletInfo(){g.updateMatrixWorld(true);tablet.getWorldPosition(tp);tablet.getWorldQuaternion(tq);g.getWorldQuaternion(gq);
  const inv=gq.clone().invert(),pos=g.worldToLocal(tp.clone()),normal=new T.Vector3(0,0,1).applyQuaternion(tq).applyQuaternion(inv);return {visible:tablet.visible,pos:[pos.x,pos.y,pos.z],normal:[normal.x,normal.y,normal.z]};}
 const sp=new T.Vector3(),hp=new T.Vector3();
 // Distance from the shoulder to the glove, for tests of how far a push extends.
 function handReach(){g.updateMatrixWorld(true);aR.sh.getWorldPosition(sp);aR.end.getWorldPosition(hp);return sp.distanceTo(hp);}
 // Glove position relative to the shoulder in the operator's frame (+z forward, +y up).
 function handRel(){g.updateMatrixWorld(true);aR.sh.getWorldPosition(sp);aR.end.getWorldPosition(hp);const d=g.worldToLocal(hp.clone()).sub(g.worldToLocal(sp.clone()));return [d.x,d.y,d.z];}
 // World position of the right glove, for tests of how close the hands get to the item worked.
 function handWorld(){g.updateMatrixWorld(true);aR.end.getWorldPosition(hp);return [hp.x,hp.y,hp.z];}
 return {group:g,pose,armPitch:()=>aR.sh.rotation.x,tabletInfo,tablet,handReach,handRel,handWorld};
}

const nf=(n,d=0)=>Number(n).toFixed(d);
const clock=t=>{const s=Math.floor(t),m=Math.floor(s/60);return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const PALETTES=[{suit:0xc9480a,vest:0xa6d200,emissive:0x2a3a00},{suit:0x1f5f9f,vest:0xffd21a,emissive:0x3a3000}];
const REACH_STOP=1.05,STEP_OFF_MAX=3;

export function createFieldOperator({model,scene,viewport,root,network,entries=[],getCamera,applyCamera,restoreCamera,getOcclusion=()=>null}){
 const $=id=>root.querySelector('#'+id);
 const stations=buildStations(model),sim=createOperatorSim(stations);
 const viewCam=new T.PerspectiveCamera(66,1,.04,500);
 // Shared by every operator: camera view, speed, simulated clock, log, click-to-send.
 const ctx={view:'own',shown:false,fast:1,simT:0,log:[],clickMode:false,lastWall:0};
 const access=new Map(),workers=[];let active=null;
 const valveByPart=new Map();
 for(const v of model?.valves||[])if(v.tag)for(const id of v.partIds||[])valveByPart.set(id,v.tag);

 // ---- shared UI
 const areaIds=[...new Set(stations.map(s=>s.areaId).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const areaSel=$('op-area');areaSel.replaceChildren();
 for(const [value,text] of [['','All areas'],...areaIds.map(a=>[a,a])]){const o=document.createElement('option');o.value=value;o.textContent=text;areaSel.append(o);}
 const list=$('op-tags');list.replaceChildren();
 const addOption=s=>{const o=document.createElement('option');o.value=s.tag;o.textContent=s.label;list.append(o);};
 for(const s of stations)addOption(s);
 const setText=text=>{if($('op-status').textContent!==text)$('op-status').textContent=text;};
 function refreshStatus(){setText(workers.length>1?workers.map((w,i)=>'Operator '+(i+1)+': '+w.text).join(' · '):(workers[0]?.text||'Operator standing by'));}
 function renderLog(){
  const ol=$('op-log');ol.replaceChildren();
  for(const e of ctx.log.slice(-40).reverse()){const li=document.createElement('li');li.textContent=e.time+(workers.length>1&&e.op?' · Op '+e.op:'')+' · '+e.tag+' · '+e.task+' — '+e.result;if(e.flag)li.className='op-flag';ol.append(li);}
 }
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
 const joined=r=>r.map(x=>x.name+' '+x.value+(x.unit?' '+x.unit:'')).join(', ');
 const bandText=s=>{const b=s.band;if(!b)return '';const u=b.unit==='°C'||b.unit==='%'?b.unit:' '+b.unit;return b.lo!=null&&b.hi!=null?'source band '+b.lo+'–'+b.hi+u:b.setpoint!=null?'source setpoint '+b.setpoint+u+(b.hi!=null?', high alarm '+b.hi+u:''):'';};
 function valveNote(s,r){return r[0].status==='off-normal'?' — OFF NORMAL (normally '+s.normal+')':s.normal==null&&s.actuation!=='self-acting'?' (normal position not defined)':'';}

 function makeWorker(index,hit,palette){
  const figure=createFigure(palette),group=figure.group,label=document.createElement('div');
  group.name='Browse field operator '+(index+1);group.visible=false;scene.add(group);
  label.className='browse-op-label';label.hidden=true;viewport.append(label);
  const st={index,lat:0,push:{x:0,z:0},loc:null,pos:V(0,0,0),yaw:0,phase:0,t:0,mode:'idle',cur:null,queue:[],path:null,seg:0,segT:0,work:0,viewYaw:0,msg:'',msgT:0,tabletSide:-1};
  const w={st,figure,group,label,text:'Operator standing by'};
  function place(h){st.loc=h;st.pos.set(h.point[0],edgeElevation(h.edge,h.t),h.point[1]);st.yaw=h.edge.heading;st.viewYaw=st.yaw;}
  place(hit);

  const say=(text,hold=0)=>{st.msg=text;st.msgT=hold;w.text=text;refreshStatus();};
  function logEntry(tag,task,result,flag=false){ctx.log.push({time:clock(ctx.simT),op:index+1,tag,task,result,flag});renderLog();}
  function enqueue(kind,tag){
   const v=validate(kind,tag);
   if(v.error){logEntry(tag||'—','Task refused',v.error,true);say(v.error,4);return false;}
   st.queue.push({kind,station:v.station});say(st.cur?'Task queued ('+st.queue.length+' waiting)':'Task queued',2);return true;
  }
  function describe(t){const s=t.station;return t.kind==='aside'?'Stepping aside':t.kind==='goto'?'Walking to '+s.tag:t.kind==='operate-valve'?'Operating '+s.tag:t.kind==='pump'?'Pump '+s.tag:t.kind==='check-valve'?'Checking '+s.tag:s.type==='instrument'?'Reading instrument '+s.tag:'Reading '+s.tag;}

  // On ground level the operator walks off the walkway toward the item, around obstacles, until the hands can reach it
  // or as near as the body fits: a short A* search on a 0.3 m floor grid, every move checked with the body envelope.
  // Never onto a deck, and never further than STEP_OFF_MAX from the walkway.
  function stepOff(s,stand){
   const occ=getOcclusion();if(!occ||stand.y>.25)return null;
   const D0=Math.hypot(s.x-stand.x,s.z-stand.z);if(D0<REACH_STOP+.25)return null;
   const CELL=.3,key=(i,j)=>i*4001+j,toXZ=(i,j)=>[stand.x+i*CELL,stand.z+j*CELL],distS=(i,j)=>{const [x,z]=toXZ(i,j);return Math.hypot(s.x-x,s.z-z);};
   const open=[{i:0,j:0,g:0,f:distS(0,0)}],seen=new Map([[key(0,0),{i:0,j:0,g:0,parent:null}]]),closed=new Set();
   let best=seen.get(key(0,0)),bestD=D0,expanded=0,goal=null;
   while(open.length&&expanded<500){
    let bi=0;for(let k=1;k<open.length;k++)if(open[k].f<open[bi].f)bi=k;
    const cur=open.splice(bi,1)[0],ck=key(cur.i,cur.j);if(closed.has(ck))continue;closed.add(ck);expanded++;
    const dcur=distS(cur.i,cur.j);if(dcur<bestD){bestD=dcur;best=seen.get(ck);}
    if(dcur<=REACH_STOP){goal=seen.get(ck);break;}
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
     const ni=cur.i+di,nj=cur.j+dj,nk=key(ni,nj);if(closed.has(nk))continue;
     if(Math.hypot(ni*CELL,nj*CELL)>STEP_OFF_MAX)continue;
     const g=cur.g+Math.hypot(di,dj)*CELL,old=seen.get(nk);if(old&&old.g<=g)continue;
     const [x0,z0]=toXZ(cur.i,cur.j),[x1,z1]=toXZ(ni,nj);
     if(!occ.bodyClear([x0,stand.y,z0],[x1,stand.y,z1]))continue;
     const node={i:ni,j:nj,g,parent:ck};seen.set(nk,node);open.push({i:ni,j:nj,g,f:g+distS(ni,nj)*1.2});
    }
   }
   const end=goal||best;if(!end||D0-bestD<.35&&!goal)return null;
   const cells=[];for(let n=end;n;n=n.parent!=null?seen.get(n.parent):null)cells.unshift(n);
   let pts=cells.map(c=>{const [x,z]=toXZ(c.i,c.j);return [x,z];});
   // pull the string tight: drop waypoints the body can pass straight over
   const out=[pts[0]];let a=0;
   while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!occ.bodyClear([pts[a][0],stand.y,pts[a][1]],[pts[b][0],stand.y,pts[b][1]]))b--;out.push(pts[b]);a=b;}
   const route=out.slice(1).map(([x,z])=>({x,y:stand.y,z,stair:false,off:true}));
   return route.length?{route,m:Math.hypot(route.at(-1).x-stand.x,route.at(-1).z-stand.z),goal:!!goal}:null;
  }
  // Pick the walkway point from which the operator can get closest to the item (several are tried, nearest first;
  // the search stops as soon as one lets the hands reach it). Cached per item, shared by every operator.
  function chooseAccess(s){
   let best=null;
   for(const c of accessCandidates(network,s,5)){
    const stand={x:c.point[0],y:c.y,z:c.point[1]},off=stepOff(s,stand),finalD=off?Math.hypot(off.route.at(-1).x-s.x,off.route.at(-1).z-s.z):Math.hypot(stand.x-s.x,stand.z-s.z);
    if(!best||finalD<best.finalD-.25)best={dest:c,off,finalD};
    if(finalD<=REACH_STOP+.1)break;
   }
   return best;
  }
  function begin(t){
   st.cur=t;const s=t.station,aside=t.kind==='aside';
   let acc=null;
   if(!aside){if(!access.has(s.tag))access.set(s.tag,chooseAccess(s));acc=access.get(s.tag);}
   const dest=aside?t.hit:acc?.dest,route=dest&&planBrowseRoute(network,st.loc,dest);
   if(!dest||!route){if(!aside)logEntry(s.tag,describe(t),'no connected walkway within reach',true);st.cur=null;st.mode='idle';return;}
   const path=routePath(route,st.loc);
   // back onto the walkway first if the last task ended off it, by the same trail it left on
   if(st.trail?.length){const back=[...st.trail].reverse().map(p=>({...p,off:true}));back.unshift({x:st.pos.x,y:st.pos.y,z:st.pos.z,stair:false,off:true});path.unshift(...back);}
   else if(Math.hypot(st.pos.x-path[0].x,st.pos.z-path[0].z)>.05)path.unshift({x:st.pos.x,y:st.pos.y,z:st.pos.z,stair:false});
   st.trail=null;
   const stand=path[path.length-1],off=(t.kind==='goto'||aside)?null:acc.off;
   if(off){path.push(...off.route);st.trail=off.route.map(p=>({x:p.x,y:p.y,z:p.z,stair:false}));st.trail.unshift({x:stand.x,y:stand.y,z:stand.z,stair:false});}
   st.path=path;st.seg=0;st.segT=0;st.mode='walk';st.dest=dest;st.stepOff=off?off.m:0;st.reached=(t.kind==='goto'||aside)?null:acc.finalD<=REACH_STOP+.05;
   say(describe(t)+' · '+route.distance.toFixed(0)+' m');
  }
  function finishWork(){
   const t=st.cur,s=t.station;let result='',flag=false,task='';
   if(t.kind==='aside'){st.cur=null;st.mode='idle';st.loc=st.dest;return;}
   if(t.kind==='reading'){
    const r=sim.readings(s,ctx.simT);flag=r.some(x=>x.status==='high'||x.status==='low');
    if(s.type==='instrument'){task='Instrument';const bt=bandText(s);result=joined(r)+(bt?' ('+bt+')':'')+' · '+s.status+(s.asset?' on '+s.asset:'')+(!bt&&s.setpoint?' · setpoint: '+s.setpoint:'');if(flag)result+=' — OUT OF RANGE; alarm basis: '+(s.alarm||'not stated');}
    else if(s.type==='valve'){task='Valve check';result=joined(r)+valveNote(s,r);flag=r[0].status==='off-normal';}
    else{task='Readings';result=joined(r);if(flag)result+=' — OUT OF RANGE';}
   }
   else if(t.kind==='check-valve'){task='Valve check';const r=sim.readings(s,ctx.simT);result=s.valveClass+': '+joined(r)+valveNote(s,r);flag=r[0].status==='off-normal';}
   else if(t.kind==='operate-valve'){task='Valve operated';const open=!sim.valveOpen(s);sim.setValve(s,open);flag=s.normal!=null&&open!==(s.normal!=='closed');
    result=(s.actuation==='actuated'?'local control confirmed with control room, now ':'handwheel turned, now ')+(open?'open':'closed')+(flag?' — OFF NORMAL':s.normal==null?' (normal position not defined)':'');}
   else if(t.kind==='pump'){task='Pump';const run=!sim.pumpRunning(s);sim.setPump(s,run);result=run?'START pressed, running':'STOP pressed, stopped';}
   else{task='Walk to';result='arrived';}
   if(st.occupied){result+=' — item occupied by operator '+st.occupied.by+', done from '+st.occupied.d.toFixed(1)+' m away';st.occupied=null;}
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
   if(t.kind==='goto'||t.kind==='aside')return 'idle';
   return 'wheel';
  }
  // ---- keeping clear of the other operator
  // Head-on on a walkway: both keep to their own right. A higher-numbered operator waits behind a walker it would catch,
  // and everyone keeps about a metre and a half from anyone standing still; an operator who is idle and in the way steps aside.
  const isIdle=o=>!o.st.cur&&o.st.queue.length===0&&o.st.mode==='idle';
  function asideHit(from){
   let best=null;
   for(let k=0;k<12;k++){
    const a=k*Math.PI/6,p=[st.pos.x+Math.sin(a)*1.8,st.pos.z+Math.cos(a)*1.8],h=network.nearest(p,.3);
    if(!h||Math.abs(edgeElevation(h.edge,h.t)-st.pos.y)>.4)continue;
    const dFrom=Math.hypot(h.point[0]-from.x,h.point[1]-from.z),dMe=Math.hypot(st.pos.x-from.x,st.pos.z-from.z);if(dFrom<dMe+1)continue;// away from whoever is waiting, never past them
    if(!best||dFrom>best.dFrom)best={edge:h.edge,t:h.t,point:h.point,dFrom};
   }
   return best;
  }
  function yieldFrom(pos){
   if(!isIdle(w)||st.yieldedAt===ctx.simT)return;
   const hit=asideHit(pos);if(!hit)return;
   st.yieldedAt=ctx.simT;st.queue.unshift({kind:'aside',hit,station:{tag:'aside',x:hit.point[0],z:hit.point[1],y:st.pos.y,type:'equipment',kind:'equipment'}});
  }
  function traffic(dt){
   const a=st.path[st.seg],b=st.path[st.seg+1];if(!b||workers.length<2)return {block:null,lat:0};
   const ang=Math.atan2(b.x-a.x,b.z-a.z),dir=[Math.sin(ang),Math.cos(ang)],px=st.pos.x+dir[0]*.5,pz=st.pos.z+dir[1]*.5;
   let block=null,lat=0;
   for(const o of workers){
    if(o===w)continue;const os=o.st;if(Math.abs(os.pos.y-st.pos.y)>1.2)continue;
    const dNow=Math.hypot(os.pos.x-st.pos.x,os.pos.z-st.pos.z),dAhead=Math.hypot(os.pos.x-px,os.pos.z-pz);
    const ahead=((os.pos.x-st.pos.x)*dir[0]+(os.pos.z-st.pos.z)*dir[1])>0;
    if(os.mode==='walk'&&os.blockedBy!==w){
     const od=os.dirNow,headOn=od&&(od[0]*dir[0]+od[1]*dir[1])<-.5;
     if(headOn&&ahead&&dNow<4.5)lat=PASS_LATERAL;
     else if(ahead&&dAhead<KEEP_CLEAR&&index>o.st.index)block=o;
    }else if(os.mode!=='walk'&&ahead&&dAhead<KEEP_CLEAR+.5&&dNow>.2)block=o;
   }
   if(block&&st.t<(st.ignoreUntil||0))block=null;
   return {block,lat,ang,dir};
  }
  function walk(dt){
   const tr=traffic(dt);
   st.blockedBy=tr.block;
   if(tr.block){
    st.waitT=(st.waitT||0)+dt;
    // stand a little to the side while waiting for a walker; ask an idle operator in the way to move
    st.lat+=(WAIT_LATERAL-st.lat)*Math.min(1,dt*4);
    if(tr.block.st.mode==='walk'){/* the walker passes */}else if(isIdle(tr.block)&&st.waitT>.6)tr.block.yieldFrom(st.pos);
    st.dirNow=null;w.waitText='Waiting for operator '+(tr.block.st.index+1);
    // Never walk through someone: if they cannot make room, do the work from here and say so.
    if(st.waitT>WAIT_GIVE_UP&&tr.block.st.mode!=='walk'){st.occupied={by:tr.block.st.index+1,d:Math.hypot(st.pos.x-tr.block.st.pos.x,st.pos.z-tr.block.st.pos.z)};st.seg=st.path.length-1;st.segT=0;st.mode='work';st.work=0;st.waitT=0;st.lat=0;return 'idle';}
    if(st.waitT>WAIT_GIVE_UP){st.ignoreUntil=st.t+2.5;st.waitT=0;}
    return 'idle';
   }
   st.waitT=0;w.waitText=null;
   let left=dt*WALK_SPEED*ctx.fast,moved=false,stair=false,ang=tr.ang??0;
   while(left>1e-6&&st.seg<st.path.length-1){
    const a=st.path[st.seg],b=st.path[st.seg+1],len=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),sp=b.stair?STAIR_FACTOR:1;
    if(len<1e-6){st.seg++;st.segT=0;continue;}
    const remain=(1-st.segT)*len,go=Math.min(left*sp,remain);
    st.segT+=go/len;left-=go/sp;moved=true;stair=b.stair;
    const f=st.segT;st.pos.set(a.x+(b.x-a.x)*f,a.y+(b.y-a.y)*f,a.z+(b.z-a.z)*f);
    if(Math.hypot(b.x-a.x,b.z-a.z)>1e-3){ang=Math.atan2(b.x-a.x,b.z-a.z);const d=angleDelta(ang,st.yaw);st.yaw+=d*Math.min(1,dt*10);}
    if(st.segT>=1-1e-6){st.seg++;st.segT=0;}
   }
   st.dirNow=moved?[Math.sin(ang),Math.cos(ang)]:null;
   // keep to the right (local +x is (cos, -sin) of the heading) when passing someone head-on
   st.lat+=(tr.lat-st.lat)*Math.min(1,dt*7);
   if(Math.abs(st.lat)>.005){st.pos.x+=Math.cos(ang)*st.lat;st.pos.z+=-Math.sin(ang)*st.lat;}
   st.pos.x+=st.push.x;st.pos.z+=st.push.z;st.push.x*=.9;st.push.z*=.9;
   st.phase+=dt*7.5*ctx.fast*(stair?.8:1);
   if(st.seg>=st.path.length-1){st.mode='work';st.work=0;st.lat=0;}
   return moved?(stair?'stair':'walk'):'idle';
  }
  function faceStation(dt){const s=st.cur.station,d=angleDelta(Math.atan2(s.x-st.pos.x,s.z-st.pos.z),st.yaw);st.yaw+=d*Math.min(1,dt*6);}

  // ---- camera (only the selected operator is followed)
  function updateViewCamera(dt){
   if(ctx.view==='own')return;
   const cw=Math.max(1,viewport.clientWidth),ch=Math.max(1,viewport.clientHeight);viewCam.aspect=cw/ch;viewCam.updateProjectionMatrix();
   const k=Math.min(1,dt*4);st.viewYaw+=angleDelta(st.yaw,st.viewYaw)*k;
   if(ctx.view==='ride'){
    viewCam.position.set(st.pos.x,st.pos.y+1.6,st.pos.z);
    const aim=V(st.pos.x+Math.sin(st.viewYaw)*3,st.pos.y+1.45,st.pos.z+Math.cos(st.viewYaw)*3);
    if(st.mode==='work'&&st.cur){const s=st.cur.station;aim.set(s.x,s.y,s.z);}
    viewCam.lookAt(aim);viewCam.updateMatrixWorld();applyCamera(viewCam,aim);
   }else{
    const head=V(st.pos.x,st.pos.y+1.5,st.pos.z),target=chaseTarget(head,dt);
    if(!st.followInit||st.camBlocked){viewCam.position.copy(target);st.followInit=true;}else viewCam.position.lerp(target,k);
    const aim=V(st.pos.x,st.pos.y+(ctx.view==='side'?1.15:1.1),st.pos.z);viewCam.lookAt(aim);viewCam.updateMatrixWorld();applyCamera(viewCam,aim);
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
   const at=([off,dist,hgt])=>{const yaw=st.viewYaw+off;return V(head.x-Math.sin(yaw)*dist,st.pos.y+hgt,head.z-Math.cos(yaw)*dist);};
   const key=ctx.view==='follow'&&tabletOut()?'read':ctx.view,CHASE=key==='read'?[...VIEWS.read,...VIEWS.follow]:(VIEWS[key]||VIEWS.follow);
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
   if(!ctx.shown||!cam||(ctx.view==='ride'&&w===active)){label.hidden=true;return;}
   const p=V(st.pos.x,st.pos.y+2.1,st.pos.z).project(cam);
   if(p.z<-1||p.z>1||Math.abs(p.x)>1.1||Math.abs(p.y)>1.1){label.hidden=true;return;}
   label.hidden=false;label.style.transform='translate('+((p.x+1)/2*viewport.clientWidth).toFixed(0)+'px,'+((1-p.y)/2*viewport.clientHeight).toFixed(0)+'px) translate(-50%,-100%)';
   const text=(workers.length>1?(index+1)+' · ':'')+(st.cur?(st.mode==='work'?describe(st.cur):'Walking · '+st.cur.station.tag):'Standing by');
   if(label.textContent!==text)label.textContent=text;
  }

  function update(dt){
   st.t+=dt;
   if(!st.cur&&st.queue.length)begin(st.queue.shift());
   let pose='idle';
   if(st.cur&&st.mode==='walk')pose=walk(dt);
   else if(st.cur&&st.mode==='work'){
    faceStation(dt);st.work+=dt;pose=workPose();
    if(st.work>=WORK[st.cur.kind]/Math.max(1,ctx.fast*.6))finishWork();
   }
   figure.pose(pose,st.t,st.phase,aimToward(dt,pose));
   group.position.copy(st.pos);group.rotation.y=st.yaw;
   if(st.cur)w.text=(st.mode==='walk'&&w.waitText?w.waitText+' · ':'')+describe(st.cur)+(st.mode==='walk'&&st.queue.length?' · '+st.queue.length+' more':'');
   else if(st.msgT>0){st.msgT-=dt;w.text=st.msg;}
   else w.text=st.queue.length?'Task queued':'Operator standing by';
   if(w===active)updateViewCamera(dt);
   updateLabel();
  }
  function interrupt(){
   if(st.cur&&st.mode==='walk'&&st.path&&st.seg<st.path.length-1){const b=st.path[st.seg+1];if(b.edge)st.loc={edge:b.edge,t:b.from+(b.to-b.from)*st.segT,point:[st.pos.x,st.pos.z]};else if(b.off&&st.dest){st.loc=st.dest;const fo=st.path.findIndex(p=>p.off),from=Math.max(0,fo);st.trail=st.path.slice(from,st.seg+1).filter(p=>p.off||true).map(p=>({x:p.x,y:p.y,z:p.z,stair:false}));st.trail.push({x:st.pos.x,y:st.pos.y,z:st.pos.z,stair:false});}}
   st.queue=[];st.cur=null;st.mode='idle';st.path=null;
  }
  Object.assign(w,{enqueue,update,interrupt,say,logEntry,describe,yieldFrom});
  return w;
 }

 const startHitAt=i=>{const e=entries[Math.min(entries.length-1,i)]?.hit||network.nearest(network.edges[Math.min(network.edges.length-1,i)].a);return {edge:e.edge,t:e.t,point:[...e.point]};};
 workers.push(makeWorker(0,startHitAt(0),PALETTES[0]));active=workers[0];

 // ---- operators
 const whoSel=$('op-who');
 function fillWho(){whoSel.replaceChildren();workers.forEach((_,i)=>{const o=document.createElement('option');o.value=String(i);o.textContent='Operator '+(i+1);whoSel.append(o);});whoSel.value=String(workers.indexOf(active));}
 function resetCamera(){const st=active.st;st.followInit=false;st.viewYaw=st.yaw;st.chaseIdx=null;st.chaseTarget=null;st.tabletSide=-1;}
 function select(i){
  const next=workers[i];if(!next||next===active)return;
  active=next;whoSel.value=String(i);resetCamera();
  for(const w of workers)w.group.visible=ctx.shown&&!(ctx.view==='ride'&&w===active);
 }
 function setOperators(n){
  n=n>=2?2:1;
  if(n===2&&workers.length<2){const w2=makeWorker(1,startHitAt(Math.floor(entries.length/2)),PALETTES[1]);workers.push(w2);w2.group.visible=ctx.shown;}
  if(n===1&&workers.length>1){const w2=workers.pop();w2.interrupt();scene.remove(w2.group);w2.label.remove();if(active===w2){active=workers[0];resetCamera();}}
  fillWho();refreshStatus();renderLog();
  for(const [id,v] of [['op-count-1',1],['op-count-2',2]])$(id).setAttribute('aria-pressed',String(v===workers.length));
 }
 whoSel.onchange=()=>select(Number(whoSel.value));
 fillWho();

 function setView(view,{restore=true}={}){
  if(view===ctx.view)return;
  const was=ctx.view;ctx.view=view;ctx.lastWall=0;resetCamera();
  for(const w of workers)w.group.visible=ctx.shown&&!(view==='ride'&&w===active);
  for(const [id,v] of [['op-view-own','own'],['op-view-follow','follow'],['op-view-side','side'],['op-view-ride','ride']])$(id).setAttribute('aria-pressed',String(v===view));
  if(view==='own'&&was!=='own'&&restore)restoreCamera?.();
 }
 // Last resort: two bodies are never closer than MIN_SEP. The one that is moving gives way; a walker's nudge is kept for a few frames.
 function separate(){
  for(let i=0;i<workers.length;i++)for(let j=i+1;j<workers.length;j++){
   const a=workers[i].st,b=workers[j].st;if(Math.abs(a.pos.y-b.pos.y)>1.2)continue;
   let dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,d=Math.hypot(dx,dz);if(d>=MIN_SEP)continue;
   if(d<1e-3){dx=Math.cos(a.yaw);dz=-Math.sin(a.yaw);d=1;}
   const nx=dx/d,nz=dz/d,pen=MIN_SEP-Math.hypot(b.pos.x-a.pos.x,b.pos.z-a.pos.z);
   const aw=a.mode==='walk',bw=b.mode==='walk',fa=aw&&bw?.5:aw?1:bw?0:.5,fb=1-fa;
   for(const [o,f,sg] of [[a,fa,-1],[b,fb,1]]){if(!f)continue;const mx=nx*pen*f*sg,mz=nz*pen*f*sg;o.pos.x+=mx;o.pos.z+=mz;if(o.mode==='walk'){o.push.x+=mx;o.push.z+=mz;}}
  }
 }
 function update(dt,wall=false){
  if(!ctx.shown)return;
  // The host caps frame time at 0.05 s, which slows the operator on a heavy scene: use the wall clock when asked.
  if(wall){const now=performance.now();dt=ctx.lastWall?Math.min((now-ctx.lastWall)/1000,.5):dt;ctx.lastWall=now;}
  dt=Math.min(dt,.5);ctx.simT+=dt*ctx.fast;
  for(const w of workers)w.update(dt);
  separate();
  refreshStatus();
 }

 // ---- click an item in the 3D view to send the selected operator
 function stationForPart(part){
  const vt=valveByPart.get(part?.id);if(vt&&sim.byTag.get(vt))return sim.byTag.get(vt);
  const eq=model?.equipment?.[part?.reactor];return eq?.tag?sim.byTag.get(eq.tag)||null:null;
 }
 function pickPart(part){
  if(!ctx.clickMode||!ctx.shown)return false;
  const s=stationForPart(part);
  if(!s){active.say('That part has no tagged equipment or valve to visit',3);return true;}
  const preferred=$('op-task').value,fallback=s.type==='valve'?'check-valve':'reading';
  const kind=!validate(preferred,s.tag).error&&preferred!=='goto'?preferred:fallback;
  if(active.enqueue(kind,s.tag))active.say('Sent to '+s.tag+' · '+active.describe({kind,station:s}),3);
  return true;
 }
 function setClickMode(on){ctx.clickMode=!!on;$('op-click').setAttribute('aria-pressed',String(ctx.clickMode));if(ctx.clickMode)active.say('Click an item in the plant to send the operator',4);}
 $('op-click').onclick=()=>setClickMode(!ctx.clickMode);

 // ---- controls
 $('op-add').onclick=()=>{active.enqueue($('op-task').value,$('op-tag').value);};
 $('op-tag').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('op-add').onclick();}};
 $('op-round').onclick=()=>{
  // One operator does the round alone; two split it, the first half of the areas to operator 1 and the rest to operator 2.
  const areas=areaSel.value?[areaSel.value]:areaIds;
  const groups=workers.length===1?[areas]:areas.length>1?[areas.slice(0,Math.ceil(areas.length/2)),areas.slice(Math.ceil(areas.length/2))]:[areas,[]];
  let total=0;
  groups.forEach((group,gi)=>{
   let plan=group.flatMap(a=>planRound(stations,a));
   if(workers.length>1&&areas.length===1){const half=Math.ceil(plan.length/2);plan=gi===0?plan.slice(0,half):plan.slice(half);}
   for(const p of plan)workers[gi].st.queue.push({kind:p.kind,station:sim.byTag.get(p.tag)});
   if(plan.length)workers[gi].logEntry('ROUND','Round','started, '+plan.length+' stops in '+(group.length===1?group[0]:group.length+' areas'));
   total+=plan.length;
  });
  if(!total){active.say('No tagged equipment in this area',4);return;}
  active.say('Operator round started · '+total+' stops'+(workers.length>1?' between 2 operators':''),3);
 };
 $('op-cancel').onclick=()=>{let n=0;for(const w of workers){n+=w.st.queue.length+(w.st.cur?1:0);w.interrupt();}if(n)active.logEntry('—','Cancelled',n+' task(s)');active.say('Tasks cancelled',3);};
 $('op-fast').onclick=e=>{ctx.fast=ctx.fast===1?3:1;e.currentTarget.setAttribute('aria-pressed',String(ctx.fast>1));};
 $('op-view-own').onclick=()=>setView('own');
 $('op-view-follow').onclick=()=>setView('follow');
 $('op-view-side').onclick=()=>setView('side');
 $('op-view-ride').onclick=()=>setView('ride');
 $('op-count-1').onclick=()=>setOperators(1);
 $('op-count-2').onclick=()=>setOperators(2);
 $('op-csv').onclick=async()=>{
  const rows=[['time','operator','tag','task','result','flag'],...ctx.log.map(e=>[e.time,e.op||1,e.tag,e.task,e.result,e.flag?'yes':''])];
  const csv=rows.map(r=>r.map(c=>'"'+String(c).replace(/"/g,'""')+'"').join(',')).join('\n');
  try{await navigator.clipboard.writeText(csv);active.say('Log copied as CSV ('+ctx.log.length+' rows, simulated values)',4);}catch{active.say('Copy failed; select the log text instead',4);}
 };

 const api={
  update,setView,sim,stations,pickPart,setClickMode,setOperators,select,
  enqueue:(kind,tag)=>active.enqueue(kind,tag),
  get figure(){return active.figure;},
  get operators(){return workers.map(w=>({getState:()=>stateOf(w),enqueue:(k,t)=>w.enqueue(k,t),figure:w.figure}));},
  get clickMode(){return ctx.clickMode;},
  addInstruments(items){const added=buildInstrumentStations(items,stations);sim.addStations(added);for(const s of added)addOption(s);return added.length;},
  get viewing(){return ctx.view!=='own';},
  get view(){return ctx.view;},
  show(){ctx.shown=true;for(const w of workers)w.group.visible=!(ctx.view==='ride'&&w===active);$('browse-operator').hidden=false;},
  hide(){ctx.shown=false;ctx.clickMode=false;$('op-click').setAttribute('aria-pressed','false');for(const w of workers){w.group.visible=false;w.label.hidden=true;w.interrupt();}setView('own',{restore:false});},
  getState:()=>stateOf(active),
  get log(){return ctx.log;},
  dispose(){for(const w of workers){scene.remove(w.group);w.label.remove();}}
 };
 function stateOf(w){const st=w.st;return {shown:ctx.shown,mode:st.mode,view:ctx.view,yaw:st.yaw,aim:{...st.aim},armPitch:w.figure.armPitch(),handReach:w.figure.handReach(),handRel:w.figure.handRel(),handWorld:w.figure.handWorld(),tablet:w.figure.tabletInfo(),position:[st.pos.x,st.pos.y,st.pos.z],queue:st.queue.length,busy:!!st.cur,stepOff:st.stepOff||0,reached:st.reached??null,blockedBy:st.blockedBy?st.blockedBy.st.index:null,log:ctx.log.length,stations:stations.length,simTime:ctx.simT,operators:workers.length};}
 return api;
}
