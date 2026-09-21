import * as T from './vendor/three.module.js';
export const rectanglePoints=(a,b)=>[[Math.min(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.min(a[1],b[1])],[Math.max(a[0],b[0]),Math.max(a[1],b[1])],[Math.min(a[0],b[0]),Math.max(a[1],b[1])]];
export function mountAreaDrag({canvas,getCamera,getControls=()=>null,enabled,getPoints,onPreview,onCommit,onCancel}){
 const caster=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0);let gesture=null;
 const eat=e=>{e.preventDefault();e.stopImmediatePropagation();};
 function point(e){const r=canvas.getBoundingClientRect();caster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),getCamera());const p=caster.ray.intersectPlane(plane,new T.Vector3());return p&&[p.x,p.z];}
 function corner(e,points){const r=canvas.getBoundingClientRect();return points.findIndex(p=>{const v=new T.Vector3(p[0],0,p[1]).project(getCamera());return v.z>=-1&&v.z<=1&&Math.hypot((v.x+1)*r.width/2+r.left-e.clientX,(1-v.y)*r.height/2+r.top-e.clientY)<=12;});}
 function finish(commit){if(!gesture)return;const g=gesture;gesture=null;if(g.controls){g.controls.enabled=g.wasEnabled;g.controls.autoRotate=g.autoRotate;}if(canvas.hasPointerCapture?.(g.id))canvas.releasePointerCapture(g.id);if(commit&&g.valid)onCommit(g.points);else onCancel(g.previous);}
 canvas.addEventListener('pointerdown',e=>{if(gesture||!enabled()||e.button!==0||e.ctrlKey||e.metaKey||e.shiftKey)return;const p=point(e);if(!p)return;eat(e);const previous=getPoints(),i=corner(e,previous),controls=getControls();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,start:i>=0?previous[(i+2)%4]:p,previous,controls,wasEnabled:controls?.enabled,autoRotate:controls?.autoRotate,valid:false};if(controls){controls.stopMotion?.();controls.enabled=false;controls.autoRotate=false;}canvas.setPointerCapture?.(e.pointerId);},true);
 function move(e){if(!gesture||e.pointerId!==gesture.id)return;eat(e);const p=point(e);if(!p){gesture.valid=false;return;}const points=rectanglePoints(gesture.start,p);gesture.points=points;gesture.valid=Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>=4&&(points[1][0]-points[0][0])>.001&&(points[2][1]-points[0][1])>.001;if(gesture.valid)onPreview(points);}
 canvas.addEventListener('pointermove',move,true);
 canvas.addEventListener('pointerup',e=>{if(!gesture||e.pointerId!==gesture.id)return;move(e);finish(true);},true);
 canvas.addEventListener('pointercancel',e=>{if(gesture&&e.pointerId===gesture.id){eat(e);finish(false);}},true);
 canvas.addEventListener('lostpointercapture',()=>finish(false));
 canvas.addEventListener('wheel',e=>{if(gesture)eat(e);},{capture:true,passive:false});
 window.addEventListener('blur',()=>finish(false));
 return {cancel:()=>finish(false),get dragging(){return !!gesture;}};
}
