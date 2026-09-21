import * as T from './vendor/three.module.js';
import {componentEnvelope,componentIntersectsBox} from './access-review.js';
import {prepareNaturalGait} from './engineer-gait.js';
const V=p=>new T.Vector3(...p),ease=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*(3-2*t);};
const interpolateAngle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;

// Local service approaches are screened against the assembled model, regardless
// of display filters. A clear path is a geometric result, not an access approval.
export function screenTaskApproach(model,points,ground){
 const region=new T.Box3().setFromPoints(points.map(p=>V([p[0],0,p[1]])));region.max.y=1.8;region.expandByScalar(.4);
 const parts=model.parts.filter(p=>!p.floorAllocationLegacy&&componentEnvelope(p).intersectsBox(region)),findings=new Set();let count=0;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.08));
  for(let j=0;j<=n;j++){
   const x=T.MathUtils.lerp(a[0],b[0],j/n),z=T.MathUtils.lerp(a[1],b[1],j/n),box=new T.Box3(V([x-.26,.025,z-.26]),V([x+.26,1.78,z+.26]));count++;
   if(x-.26<ground[0]||x+.26>ground[2]||z-.26<ground[1]||z+.26>ground[3])findings.add('Approach leaves modeled ground');
   for(const c of model.containment?.cells||[])for(const r of c.patches)if(x+.26>r[0]&&x-.26<r[2]&&z+.26>r[1]&&z-.26<r[3])findings.add('Approach crosses '+c.tag+' containment recess');
   for(const p of parts)if(componentIntersectsBox(p,box))findings.add('Approach intersects '+p.name);
  }
 }
 return {problems:[...findings],samples:count};
}
const segment=(a,b)=>({a,b,ya:0,yb:0,length:Math.hypot(b[0]-a[0],b[1]-a[1]),speed:.6,obstacles:[],stopSeconds:0});
function walkDuration(segments){return segments.reduce((n,s)=>n+s.length/(s.speed??.75)+(s.stopSeconds||0),0);}
function walkAt(segments,time){
 let distance=0;
 for(let i=0;i<segments.length;i++){
  const s=segments[i],duration=s.length/(s.speed??.75),hold=s.stopSeconds||0;
  if(time<=duration+hold||i===segments.length-1){const fraction=T.MathUtils.clamp(time/duration,0,1),heading=Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1]);return {position:[T.MathUtils.lerp(s.a[0],s.b[0],fraction),T.MathUtils.lerp(s.ya??0,s.yb??0,fraction),T.MathUtils.lerp(s.a[1],s.b[1],fraction)],heading,distance:distance+s.length*fraction,walking:time<duration,step:s.articulated?{segment:s,fraction,heading}:null};}
  time-=duration+hold;distance+=s.length;
 }
}
function makeTask({id,label,kind,part,standing,approach,returnPath,problems=[],supportPartIds=[],target,parts=[],axis=[0,0,1],grip=[-.13,0,.025],turnAngle=.9}){
 const articulate=segments=>prepareNaturalGait(segments.flatMap(s=>{const n=Math.max(1,Math.ceil(s.length/.35));return Array.from({length:n},(_,i)=>({...segment(s.a.map((v,k)=>T.MathUtils.lerp(v,s.b[k],i/n)),s.a.map((v,k)=>T.MathUtils.lerp(v,s.b[k],(i+1)/n))),articulated:true}));}));
 if(!approach[0].articulated)approach=articulate(approach);
 if(!returnPath[0].articulated)returnPath=articulate(returnPath);
 const facing=part?.position||target,face=Math.atan2(facing.x-standing[0],facing.z-standing[2]),entryHeading=Math.atan2(approach.at(-1).b[0]-approach.at(-1).a[0],approach.at(-1).b[1]-approach.at(-1).a[1]);
 const phases=[{name:'Approach equipment',kind:'walk',segments:approach,duration:walkDuration(approach)},
  {name:'Face and inspect',kind:'face',duration:2.5},
  ...(kind==='inspection'?[{name:'Raise flashlight',kind:'take-tool',duration:1.5},{name:'Inspect upper connections with flashlight',kind:'look-up',duration:4},{name:'Inspect lower connections',kind:'look-down',duration:4},{name:'Lower and stow flashlight',kind:'stow-tool',duration:1.5},{name:'Record observation on tablet',kind:'record',duration:4}]:[
   {name:kind==='panel'?'Reach panel test control':'Grip manual valve lever',kind:'reach',duration:2},
   {name:kind==='panel'?'Press display-test control':'Turn lever · demonstration',kind:'operate',duration:4},
   {name:kind==='panel'?'Check simulated acknowledgement':'Check illustrated lever position',kind:'verify',duration:3},
   {name:'Withdraw hand',kind:'release',duration:2},
   {name:'Record observation on tablet',kind:'record',duration:3}]),
  {name:'Turn toward return path',kind:'turn-return',duration:2},
  {name:'Return to approach',kind:'return',segments:returnPath,duration:walkDuration(returnPath)}];
 let total=0;for(const phase of phases){phase.start=total;total+=phase.duration;}
 return {id,label,task:true,kind,partId:part?.id,target,standing,face,entryHeading,phases,duration:total,problems,supportPartIds,elevated:standing[1]>1,elevations:[...approach.map(s=>s.ya??0),approach.at(-1).yb??0],points:[...approach.map(s=>s.a),approach.at(-1).b],segments:[...approach,...returnPath],length:[...approach,...returnPath].reduce((n,s)=>n+s.length,0),machineParts:parts,axis,grip,turnAngle,note:kind==='inspection'?'External inspection. Covers and gates remain closed.':kind==='panel'?'Simulated display-test acknowledgement only; no pump command or process state changes.':'Manual XV-IA4001 lever demonstration. Process flow and isolation state are unchanged; this is not an operating sequence.'};
}
export function buildEngineerTasks(model,ground,walkRoutes){
 const result=[],panel=model.parts.find(p=>p.name==='CP-RO2001A display');
 if(panel){const x=panel.position.x,z=panel.position.z,standing=[x,0,z+.65],approach=[segment([x,z+4.25],[x,z+.65])],target=panel.position.clone().add(V([-.2,-.12,.155])),screen=screenTaskApproach(model,[approach[0].a,approach[0].b],ground);
  result.push(makeTask({id:'task-ro-panel',label:'Task · A-2000 panel operation',kind:'panel',part:panel,standing,target,approach,returnPath:[segment(approach[0].b,approach[0].a)],problems:screen.problems}));}
 const inspection=walkRoutes.find(r=>r.id==='dr601-inspection'),stop=inspection?.segments.findIndex(s=>s.inspection);
 if(inspection&&stop>=0){const s=inspection.segments[stop],standing=[s.b[0],s.yb,s.b[1]],target=V(inspection.inspectionTarget),approach=inspection.segments.slice(0,stop+1).map(s=>({...s,stopSeconds:s.inspection?0:s.stopSeconds})),returnPath=inspection.segments.slice(stop+1).map(s=>({...s,stopSeconds:0}));
  result.push(makeTask({id:'task-dr601',label:'Task · DR-601 flashlight inspection',kind:'inspection',standing,target,approach,returnPath,problems:[...inspection.problems],supportPartIds:inspection.supportPartIds||[]}));}
 const valve=model.valves.find(v=>v.tag==='XV-IA4001'&&v.type==='isolation'),lever=valve&&model.parts.find(p=>valve.partIds.includes(p.id)&&p.name.endsWith('lockable lever'));
 if(lever){const target=lever.position.clone(),standing=[target.x+.45,0,target.z],end=[standing[0],standing[2]],candidates=[[[target.x+2.1,target.z],end],[[target.x+.45,target.z+2],end],[[target.x+.45,target.z-2],end]],screened=candidates.map(points=>({points,...screenTaskApproach(model,points,ground)})),choice=screened.find(r=>!r.problems.length)||screened[0],approach=choice.points.slice(1).map((p,i)=>segment(choice.points[i],p)),returnPath=[...approach].reverse().map(s=>segment(s.b,s.a));
  result.push(makeTask({id:'task-manual-valve',label:'Task · A-4000 manual air valve',kind:'valve',part:lever,standing,target,approach,returnPath,parts:[lever],axis:[0,1,0],grip:[.065,.075,0],turnAngle:Math.PI/2,problems:choice.problems}));}
 return result;
}

export function sampleEngineerTask(task,time){
 const elapsed=T.MathUtils.clamp(time,0,task.duration),index=Math.max(0,task.phases.findIndex(p=>elapsed<p.start+p.duration)),phase=elapsed>=task.duration?task.phases.at(-1):task.phases[index],fraction=T.MathUtils.clamp((elapsed-phase.start)/phase.duration,0,1);
 const operation=task.phases.find(p=>p.kind==='operate'),machine=operation?(task.kind==='panel'?(elapsed>=operation.start+operation.duration*.5?1:0):ease((elapsed-operation.start)/operation.duration)):0;
 const state={elapsed,phase:task.phases.indexOf(phase),label:phase.name,complete:elapsed>=task.duration,fraction,kind:phase.kind,machine};
 if(phase.segments)return {...state,...walkAt(phase.segments,elapsed-phase.start)};
 if(phase.kind==='turn-return'){const s=task.phases.at(-1).segments[0],heading=Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1]);return {...state,position:[...task.standing],heading:interpolateAngle(task.face,heading,ease(fraction)),distance:fraction*.625,walking:true};}
 const heading=phase.kind==='face'?interpolateAngle(task.entryHeading,task.face,ease(fraction)):task.face,origin=V(task.standing),q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),heading),local=p=>V(p).applyQuaternion(q).add(origin),look=task.target.clone();
 let right,left,tool=null,weight=1;
 if(['take-tool','look-up','look-down','stow-tool'].includes(phase.kind)){look.y+=phase.kind==='look-up'?.6*ease(fraction):phase.kind==='look-down'?T.MathUtils.lerp(.6,-.65,ease(fraction)):phase.kind==='stow-tool'?-.65*(1-ease(fraction)):0;right=local([.22,1.23,.33]);tool='flashlight';weight=phase.kind==='take-tool'?ease(fraction):phase.kind==='stow-tool'?1-ease(fraction):1;}
 if(phase.kind==='record'){left=local([-.20,1.05,.18]);right=local([.02,1.08,.19]);weight=ease(Math.min(1,fraction*3,(1-fraction)*3));look.lerp(left,weight);tool='tablet';}
 if(['reach','operate','verify','release'].includes(phase.kind)){
  const turn=phase.kind==='operate'?ease(fraction):phase.kind==='reach'?0:1;state.machine=phase.kind==='reach'?0:phase.kind==='operate'?(task.kind==='panel'?(fraction>=.5?1:0):turn):1;
  if(task.kind==='panel'){right=task.target.clone();if(phase.kind==='operate')right.z+=.012*Math.cos(fraction*Math.PI*2);}
  else {right=task.target.clone().add(V(task.grip).applyAxisAngle(V(task.axis),turn*task.turnAngle));}
  weight=phase.kind==='reach'?ease(fraction):phase.kind==='release'?1-ease(fraction):1;
  if(task.kind==='valve'&&['reach','release'].includes(phase.kind)){
   const u=phase.kind==='reach'?fraction:1-fraction,rest=local([.24,.82,.06]),raised=local([.22,1.58,.10]);
   right=u<.5?rest.lerp(raised,ease(u*2)):raised.lerp(right,ease((u-.5)*2));weight=1;
  }
 }
 if(phase.kind==='record')state.machine=task.kind==='inspection'?0:1;
 return {...state,position:[...task.standing],heading,distance:0,walking:false,action:{look,right,left,tool,weight,raisedElbow:task.kind==='valve'&&['reach','operate','verify','release'].includes(phase.kind)}};
}
export function createEngineerTaskPlayer(task){
 let elapsed=0,playing=false;
 return {sample:()=>({...sampleEngineerTask(task,elapsed),playing}),play(){if(task.problems.length)return;if(elapsed>=task.duration)elapsed=0;playing=true;},pause(){playing=false;},reset(){elapsed=0;playing=false;},seek(f){elapsed=task.duration*T.MathUtils.clamp(Number.isFinite(f)?f:0,0,1);playing=false;},next(){const p=task.phases.find(p=>p.start>elapsed+1e-6);elapsed=p?.start??task.duration;playing=false;},update(dt){if(playing&&Number.isFinite(dt)&&dt>0){elapsed=Math.min(task.duration,elapsed+dt);if(elapsed===task.duration)playing=false;}return {...sampleEngineerTask(task,elapsed),playing};}};
}

// Animate only render instances. Engineering coordinates and valve logic stay intact.
export function createEngineerMachineEffect(scene,model){
 let activeTask=null;const overlay=new T.Group();overlay.name='Engineer simulated panel response';scene.add(overlay);
 const light=new T.Mesh(new T.CircleGeometry(.035,20),new T.MeshBasicMaterial({color:0xffc269,side:T.DoubleSide}));overlay.add(light);overlay.visible=false;
 const button=new T.Mesh(new T.CircleGeometry(.038,20),new T.MeshBasicMaterial({color:0x5b9dea,side:T.DoubleSide}));button.name='Illustrated display-test control';overlay.add(button);
 function reset(){if(activeTask)for(const p of activeTask.machineParts){if(!p.mesh)continue;p.mesh.setMatrixAt(p.index,new T.Matrix4().compose(p.position,p.quaternion,p.scale.clone().multiplyScalar(p.visible===false?0:1)));p.mesh.instanceMatrix.needsUpdate=true;}activeTask=null;overlay.visible=false;}
 function apply(task,amount){if(activeTask!==task){reset();activeTask=task;}
  if(task.kind==='panel'){overlay.visible=true;light.position.copy(task.target).add(V([.32,.18,-.047]));button.position.copy(task.target).add(V([0,0,-.047]));light.material.color.setHex(amount?0x77e5c0:0xffc269);}
  if(task.kind==='valve'){const q=new T.Quaternion().setFromAxisAngle(V(task.axis),amount*task.turnAngle);for(const p of task.machineParts){if(!p.mesh)continue;const position=p.position.clone().sub(task.target).applyQuaternion(q).add(task.target);p.mesh.setMatrixAt(p.index,new T.Matrix4().compose(position,q.clone().multiply(p.quaternion),p.scale.clone().multiplyScalar(p.visible===false?0:1)));p.mesh.instanceMatrix.needsUpdate=true;}}
 }
 return {apply,reset};
}
