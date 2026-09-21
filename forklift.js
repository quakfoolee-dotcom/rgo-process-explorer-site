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
 return {...truck,animate(distance,curvature=0){
  for(const w of truck.wheels)w.spin.rotation.z=-distance/w.radius;
  for(const w of truck.rearSteering)w.rotation.y=Math.atan(FORKLIFT_ASSUMPTIONS.wheelbase*curvature);
 }};
}

const angleDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
export function createForkliftPlayback(poses){
 const distances=[0];for(let i=1;i<poses.length;i++)distances.push(distances.at(-1)+Math.hypot(poses[i].x-poses[i-1].x,poses[i].z-poses[i-1].z));
 const total=distances.at(-1);let distance=0,playing=false;
 function sample(){let lo=0,hi=poses.length-1;while(lo+1<hi){const m=(lo+hi)>>1;if(distances[m]<=distance)lo=m;else hi=m;}
  const a=poses[lo],b=poses[hi],length=distances[hi]-distances[lo],t=length?(distance-distances[lo])/length:0,delta=angleDelta(a.yaw,b.yaw);
  return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:a.yaw+delta*t,curvature:length?delta/length:0,index:Math.round(lo+t),distance,total,fraction:total?distance/total:0,playing,complete:distance>=total};
 }
 return {sample,play(){if(distance>=total)distance=0;playing=total>0;return sample();},pause(){playing=false;return sample();},seek(fraction){playing=false;distance=total*Math.max(0,Math.min(1,Number.isFinite(fraction)?fraction:0));return sample();},seekIndex(index){playing=false;distance=distances[Math.max(0,Math.min(poses.length-1,Math.round(index)))];return sample();},update(dt,rate=1){if(playing&&Number.isFinite(dt)&&dt>0){const corner=Math.abs(sample().curvature)>.01;distance=Math.min(total,distance+Math.min(dt,.1)*FORKLIFT_ASSUMPTIONS.speed*(corner?.5:1)*rate);if(distance>=total)playing=false;}return sample();}};
}
