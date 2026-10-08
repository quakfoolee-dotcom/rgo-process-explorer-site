import * as T from './vendor/three.module.js';
import {buildForkliftGeometry,FORKLIFT_WHEELS} from './forklift-geometry.js';

// ECX25 is a reference illustration, not a procurement or load-capacity selection.
// Width / guard / outside radius / stacking base come from the supplied CLARK sheet.
export const FORKLIFT_REFERENCE=Object.freeze({model:'CLARK ECX25',width:1.114,guardHeight:2.235,outsideRadius:1.845,stackingBase:2.279});
// Unspecified longitudinal, mast, load and wheel dimensions remain assumptions.
export const FORKLIFT_ASSUMPTIONS=Object.freeze({rear:2,front:1.6,wheelbase:1.5,mastHeight:2.1,palletLength:1.2,palletWidth:1.2,forkHeight:.1,speed:1});
export const FORKLIFT_PROFILE=Object.freeze({width:1.2,front:1.6,rear:2,height:2.235,margin:.5,headMargin:.5,turnRadius:3.5});
export function validateForkliftEnvelope(p){
 for(const k of ['width','front','rear','height'])if(p[k]<FORKLIFT_PROFILE[k])throw Error(`The ${k} envelope must be at least ${FORKLIFT_PROFILE[k]} m to contain the illustrated forklift and load.`);
 const steer=Math.min(Math.atan(FORKLIFT_ASSUMPTIONS.wheelbase/p.turnRadius),Math.atan(FORKLIFT_WHEELS.rearRadius/FORKLIFT_WHEELS.rearHalfWidth));
 const wheelWidth=2*(FORKLIFT_WHEELS.rearHalfTrack+FORKLIFT_WHEELS.rearRadius*Math.sin(steer)+FORKLIFT_WHEELS.rearHalfWidth*Math.cos(steer));
 if(p.width+1e-7<wheelWidth)throw Error(`This turn needs a truck/load width envelope of at least ${wheelWidth.toFixed(3)} m to contain the steered rear tyres.`);
 return p;
}

// Local +X is forward; the front axle remains the tracing origin.
export function createForklift(){
 const truck=buildForkliftGeometry();truck.group.userData.reference=FORKLIFT_REFERENCE;
 return {...truck,setLift(height){truck.carriage.position.y=height;},animate(distance,curvature=0){
  for(const w of truck.wheels)w.spin.rotation.z=-distance/w.radius;
  for(const w of truck.rearSteering)w.rotation.y=Math.atan(FORKLIFT_ASSUMPTIONS.wheelbase*curvature);
 }};
}

const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
// Poses may carry manoeuvre fields (V321): phase, loaded, lift (fork carriage height change, m), reverse, hold (seconds). A run of poses at one position is a
// dwell: the truck stops there and the poses play in order over their hold times, so distance (metres travelled) never includes waiting time.
export function createForkliftPlayback(poses){
 const distances=[0];for(let i=1;i<poses.length;i++)distances.push(distances.at(-1)+Math.hypot(poses[i].x-poses[i-1].x,poses[i].z-poses[i-1].z));
 const total=distances.at(-1),rolls=[0];for(let i=1;i<poses.length;i++)rolls.push(rolls[i-1]+(poses[i].reverse?-1:1)*(distances[i]-distances[i-1]));
 const stops=[];for(let i=0;i<poses.length;){let j=i;while(j+1<poses.length&&distances[j+1]-distances[i]<1e-9)j++;if(j>i){const holds=poses.slice(i,j+1).map(p=>p.hold||0),duration=holds.reduce((n,h)=>n+h,0),ends=[];holds.reduce((n,h,k)=>(ends[k]=n+h,n+h),0);stops.push({at:distances[i],start:i,end:j,duration:duration||j-i,timed:duration>0,ends});}i=j+1;}
 let distance=0,playing=false,dwell=0,atStop=-1,passed=new Set();
 const extras=(a,b,t)=>({phase:a.phase,loaded:a.loaded,reverse:!!a.reverse,lift:typeof a.lift==='number'?a.lift+((typeof b.lift==='number'?b.lift:a.lift)-a.lift)*t:undefined});
 function sample(){
  if(atStop>=0){const s=stops[atStop],at=s.timed?(dwell<=0?s.start:Math.min(s.end,s.start+Math.max(0,s.ends.findIndex(e=>e>dwell)===-1?s.end-s.start:s.ends.findIndex(e=>e>dwell)))):Math.min(s.end,s.start+Math.floor(Math.min(.9999,dwell/s.duration)*(s.end-s.start+1))),pose=poses[at];
   return {x:pose.x,z:pose.z,yaw:pose.yaw,curvature:0,index:at,distance,total,fraction:total?distance/total:0,playing,complete:false,roll:rolls[at],dwelling:true,...extras(pose,pose,0)};}
  let lo=0,hi=poses.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(distances[m]<=distance)lo=m;else hi=m;}
  const a=poses[lo],b=poses[hi],length=distances[hi]-distances[lo],t=length?(distance-distances[lo])/length:0,delta=angleDelta(a.yaw,b.yaw);
  return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:a.yaw+delta*t,curvature:length?delta/length:0,index:Math.round(lo+t),distance,total,fraction:total?distance/total:0,playing,complete:distance>=total,roll:rolls[lo]+(rolls[hi]-rolls[lo])*t,...extras(a,b,t)};
 }
 const land=()=>{atStop=stops.findIndex(s=>Math.abs(s.at-distance)<1e-9);dwell=0;passed=new Set(stops.map((s,i)=>i).filter(i=>stops[i].at<distance-1e-9));if(atStop>=0)passed.delete(atStop);};
 return {sample,stops,play(){if(distance>=total){distance=0;land();}playing=total>0;return sample();},pause(){playing=false;return sample();},
  seek(fraction){playing=false;distance=total*Math.max(0,Math.min(1,Number.isFinite(fraction)?fraction:0));land();return sample();},
  seekIndex(index){playing=false;const i=Math.max(0,Math.min(poses.length-1,Math.round(index)));distance=distances[i];land();const k=stops.findIndex(s=>i>=s.start&&i<=s.end);if(k>=0){atStop=k;dwell=stops[k].timed?(i===stops[k].start?0:stops[k].ends[i-stops[k].start-1]):(i-stops[k].start)/(stops[k].end-stops[k].start+1)*stops[k].duration;passed=new Set(stops.map((s,n)=>n).filter(n=>stops[n].at<distance-1e-9));}return sample();},
  update(dt,rate=1){if(playing&&Number.isFinite(dt)&&dt>0){const step=Math.min(dt,.1);
   if(atStop>=0){dwell+=step*rate;if(dwell>=stops[atStop].duration){passed.add(atStop);atStop=-1;dwell=0;distance=Math.min(total,distance+1e-6);if(distance>=total)playing=false;}return sample();}
   const corner=Math.abs(sample().curvature)>.01,next=Math.min(total,distance+step*FORKLIFT_ASSUMPTIONS.speed*(corner?.5:1)*rate),k=stops.findIndex((s,n)=>!passed.has(n)&&s.at>=distance-1e-9&&s.at<=next+1e-9);
   if(k>=0){distance=stops[k].at;atStop=k;dwell=0;}else{distance=next;if(distance>=total)playing=false;}}return sample();}};
}
