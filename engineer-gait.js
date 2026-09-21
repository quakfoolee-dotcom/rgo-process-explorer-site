import * as T from './vendor/three.module.js';
const ease=t=>{t=T.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
const angle=(a,b,t)=>a+Math.atan2(Math.sin(b-a),Math.cos(b-a))*t;
const yaw=s=>Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1]);
const posture=s=>!s?.stair?{hip:.82,lean:0}:s.yb>s.ya?{hip:.69,lean:.08}:{hip:.78,lean:-.025};
const anchor=(p,y,heading,side)=>({p:new T.Vector3(p[0],y,p[1]).add(new T.Vector3((side===0?-1:1)*.09,0,-.04).applyAxisAngle(new T.Vector3(0,1,0),heading)),yaw:heading});

// Contact planning is independent of frame rate. A stance boot keeps its world
// position and orientation until that foot's next swing, including on landings.
export function prepareNaturalGait(segments){
 let planted=null,lead=0;
 for(let i=0;i<segments.length;i++){
  const s=segments[i],prev=segments[i-1],next=segments[i+1],heading=yaw(s),p=posture(s),before=posture(prev),after=posture(next);
  if(!planted)planted=[0,1].map(k=>anchor(s.a,s.ya,heading,k));
  const turnBefore=!!prev&&Math.abs(angle(yaw(prev),heading,1)-yaw(prev))>.1;
  const turnAfter=!!next&&Math.abs(angle(heading,yaw(next),1)-heading)>.1;
  // Gather on arrivals/turns and the longer first riser approach. Interior
  // treads use a reciprocal gait: the trailing foot passes the planted foot.
  const gather=!next||s.stopSeconds>0||turnAfter||(s.stair&&(!prev?.stair||!next?.stair));
  const targets=[0,1].map(k=>anchor(s.b,s.yb,heading,k));
  s.gait={lead,gather,start:planted.map(v=>({p:v.p.clone(),yaw:v.yaw})),end:targets,
   yaw0:turnBefore?yaw(prev):heading,yaw1:heading,
   hip0:!prev||prev.stopSeconds>0?.88:(before.hip+p.hip)/2,hip1:!next||s.stopSeconds>0?.88:(p.hip+after.hip)/2,
   lean0:!prev||prev.stopSeconds>0?0:(before.lean+p.lean)/2,lean1:!next||s.stopSeconds>0?0:(p.lean+after.lean)/2};
  planted[lead]=targets[lead];if(gather)planted[1-lead]=targets[1-lead];lead=1-lead;
  if(turnBefore||turnAfter)s.speed=Math.min(s.speed,.5);
 }
 return segments;
}

export function naturalGaitPose(segment,fraction,heading=yaw(segment)){
 const t=T.MathUtils.clamp(fraction,0,1),g=segment.gait;
 const root=new T.Vector3(T.MathUtils.lerp(segment.a[0],segment.b[0],t),T.MathUtils.lerp(segment.ya,segment.yb,t),T.MathUtils.lerp(segment.a[1],segment.b[1],t));
 const inverse=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-heading),feet=[],footYaw=[],contacts=[];
 for(let k=0;k<2;k++){
  const moving=k===g.lead,phase=g.gather?T.MathUtils.clamp(moving?t/.60:(t-.60)/.40,0,1):moving?t:0;
  const start=g.start[k],end=g.end[k],world=start.p.clone();let direction=start.yaw;
  if(phase>0){
   const descending=end.p.y<start.p.y-.03,progress=descending?ease((phase-.14)/.54):ease((phase-.24)/.58),peak=Math.max(start.p.y,end.p.y)+(segment.stair?.18:.065);
   world.lerp(end.p,progress);
   // Cubic arch with eased parameter: zero touchdown/liftoff vertical speed.
   const u=ease(phase),v=1-u;world.y=v*v*v*start.p.y+3*v*v*u*peak+3*v*u*u*peak+u*u*u*end.p.y;
   direction=angle(start.yaw,end.yaw,progress);
  }
  feet.push(world.sub(root).applyQuaternion(inverse));footYaw.push(direction-heading);contacts.push(phase===0||phase===1);
 }
 const sway=(g.lead===0?1:-1)*.012*Math.sin(Math.PI*t)**2;
 let hip=T.MathUtils.lerp(g.hip0,g.hip1,ease(t))+.008*Math.sin(Math.PI*t)**2;
 // Limit hip height continuously to reachable joint geometry, without stretching.
 for(let k=0;k<2;k++){const f=feet[k],dx=(k===0?-.09:.09)+sway-f.x,dz=-f.z;hip=Math.min(hip,f.y+.10+Math.sqrt(Math.max(0,.832**2-dx*dx-dz*dz)));}
 return {feet,footYaw,contacts,hip,sway,lean:T.MathUtils.lerp(g.lean0,g.lean1,ease(t)),heading:angle(g.yaw0,g.yaw1,ease(t)),arm:(g.lead===0?1:-1)*.16*Math.sin(Math.PI*t)};
}

export function stairFeet(segment,fraction,heading){
 if(segment.gait)return naturalGaitPose(segment,fraction,heading).feet;
 const a=new T.Vector3(segment.a[0],segment.ya,segment.a[1]),b=new T.Vector3(segment.b[0],segment.yb,segment.b[1]);
 const root=a.clone().lerp(b,fraction),inverse=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),-heading),feet=[];
 for(let side=0;side<2;side++){
  const phase=T.MathUtils.clamp(fraction*2-side,0,1),lift=Math.max(a.y,b.y)+.12,foot=a.clone();
  if(phase<=.25)foot.y=T.MathUtils.lerp(a.y,lift,phase*4);
  else if(phase<.75){foot.lerp(b,(phase-.25)*2);foot.y=lift;}
  else{foot.copy(b);foot.y=T.MathUtils.lerp(lift,b.y,(phase-.75)*4);}
  foot.sub(root).applyQuaternion(inverse);foot.x+=(side===0?-1:1)*.09;foot.z-=.04;
  feet.push(foot);
 }
 return feet;
}
export function legJoints(hip,sole){
 const ankle=sole.clone().add(new T.Vector3(0,.10,0)),delta=ankle.clone().sub(hip),length=delta.length(),limb=.42;
 const direction=delta.clone().normalize(),forward=new T.Vector3(0,0,1).addScaledVector(direction,-direction.z).normalize();
 const knee=hip.clone().addScaledVector(direction,length/2).addScaledVector(forward,Math.sqrt(Math.max(0,limb*limb-length*length/4)));
 return {hip,knee,ankle,reach:length,limit:2*limb};
}

// SAT narrow phase prevents a long inclined pipe's world bounding box from
// falsely blocking a boot that is actually outside its oriented envelope.
export function footIntersectsPart(foot,p,tolerance=.001){
 const world=[new T.Vector3(1,0,0),new T.Vector3(0,1,0),new T.Vector3(0,0,1)],axes=world.map(a=>a.clone().applyQuaternion(p.quaternion));
 const box=p.geometry.boundingBox,center=box.getCenter(new T.Vector3()).multiply(p.scale).applyQuaternion(p.quaternion).add(p.position),half=box.getSize(new T.Vector3()).multiply(p.scale).multiplyScalar(.5).toArray().map(Math.abs);
 const fcenter=foot.getCenter(new T.Vector3()),fhalf=foot.getSize(new T.Vector3()).multiplyScalar(.5).toArray(),delta=center.sub(fcenter);
 const tests=[...world,...axes,...world.flatMap(a=>axes.map(b=>a.clone().cross(b)))];
 for(const axis of tests){if(axis.lengthSq()<1e-12)continue;axis.normalize();let radius=0;for(let i=0;i<3;i++)radius+=fhalf[i]*Math.abs(axis.dot(world[i]))+half[i]*Math.abs(axis.dot(axes[i]));if(Math.abs(delta.dot(axis))>=radius-tolerance)return false;}
 return true;
}
