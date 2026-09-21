import {Vector3,Matrix4,MathUtils} from './vendor/three.module.js';
const V=p=>new Vector3(...p),near=(a,b)=>Math.abs(a-b)<1e-7;
export const formatDiameter=m=>`${(m*1000).toLocaleString('en-US',{maximumFractionDigits:1})} mm [${(m/.0254).toFixed(3)} in]`;

// Read the cross-section that generated the mesh, never screen width, bounding
// boxes, valve-body radii, or edge.radius (which may be a screening fallback).
export function pipeDiameter(part,worldPoint){
 const unavailable=reason=>({valid:false,reason});
 if(!part||part.system!=='pipe'||!part.ports||part.ports.length!==2||!(part.conduitRadius>0))return unavailable('Select a pipe wall or nozzle neck. Flanges, weld rings and valve bodies are not pipe diameters.');
 const point=V(worldPoint),g=part.geometry,scale=part.scale,matrix=new Matrix4().compose(part.position,part.quaternion,scale);
 let center,axis,outer,inner=null,ends=null,station=null,kind='Pipe';
 if(part.mechanicalJoint){
  const j=part.mechanicalJoint;axis=V(j.axis).normalize();const root=V(j.root),end=V(part.ports[1]);
  const length=end.clone().sub(root).dot(axis),at=MathUtils.clamp(point.clone().sub(root).dot(axis),0,length);
  center=root.addScaledVector(axis,at);outer=j.outerRadius;inner=j.boreRadius;kind='Nozzle neck';
 }else if(g.type==='LatheGeometry'){
  if(!near(Math.abs(scale.x),Math.abs(scale.z)))return unavailable('This cross-section is not circular after scaling; a single diameter would be misleading.');
  const profile=g.parameters?.points;if(!profile?.length)return unavailable('The circular cross-section is not defined for this component.');
  const ys=[...new Set(profile.map(p=>p.y))].sort((a,b)=>a-b);if(ys.length!==2)return unavailable('This fitting has a varying profile; select an adjoining straight pipe.');
  const radii=ys.map(y=>profile.filter(p=>near(p.y,y)).map(p=>p.x));
  if(radii.some(r=>r.some(x=>x<=0)))return unavailable('The pipe bore is not defined by an annular cross-section.');
  const local=point.clone().applyMatrix4(matrix.clone().invert()),t=MathUtils.clamp((local.y-ys[0])/(ys[1]-ys[0]),0,1),s=Math.abs(scale.x);
  const ro=radii.map(r=>Math.max(...r)*s),ri=radii.map(r=>Math.min(...r)*s);
  outer=MathUtils.lerp(ro[0],ro[1],t);inner=ri.every((x,i)=>x<ro[i])?MathUtils.lerp(ri[0],ri[1],t):null;
  center=new Vector3(0,MathUtils.lerp(ys[0],ys[1],t),0).applyMatrix4(matrix);axis=new Vector3(0,1,0).transformDirection(matrix);
  if(!near(ro[0],ro[1])){kind='Reducer';station=t;ends=ro.map((r,i)=>({outer:2*r,inner:ri[i]<r?2*ri[i]:null}));}
 }else if(g.type==='TubeGeometry'&&part.centerline){
  if(!near(Math.abs(scale.x),Math.abs(scale.y))||!near(Math.abs(scale.x),Math.abs(scale.z)))return unavailable('This bend has nonuniform scaling; a single circular diameter is not established.');
  // Use the actual curve tangent at the selected station, not the chord of a bend.
  const curve=g.parameters?.path;if(!curve)return unavailable('No cross-section curve is available.');
  const local=point.clone().applyMatrix4(matrix.clone().invert());let best=0,d=Infinity;
  for(let i=0;i<=100;i++){const q=curve.getPoint(i/100),dd=q.distanceToSquared(local);if(dd<d){d=dd;best=i/100;}}
  let lo=Math.max(0,best-.01),hi=Math.min(1,best+.01);for(let i=0;i<20;i++){const a=lo+(hi-lo)/3,b=hi-(hi-lo)/3;if(curve.getPoint(a).distanceToSquared(local)<curve.getPoint(b).distanceToSquared(local))hi=b;else lo=a;}
  const t=(lo+hi)/2;center=curve.getPoint(t).applyMatrix4(matrix);axis=curve.getTangent(t).transformDirection(matrix);outer=g.parameters.radius*Math.abs(scale.x);kind='Elbow';
 }else return unavailable('This component has no supported circular pipe cross-section. Select a straight spool, reducer or modeled nozzle neck.');
 if(!(outer>0)||!Number.isFinite(outer)||!axis.lengthSq())return unavailable('Pipe cross-section data is incomplete.');
 return {valid:true,kind,name:part.name,partCode:part.code,parts:new Set([part.id]),center:center.toArray(),axis:axis.toArray(),outer:2*outer,inner:inner>0?2*inner:null,ends,station,nominal:'Not specified',basis:'Modeled geometry; nominal size and pipe schedule are not specified.'};
}

// A true diameter lies in the plane normal to the pipe axis. Choose its display
// direction for readability without changing the measured value.
export function diameterPaths(result,viewDirection){
 const axis=V(result.axis),center=V(result.center),u=new Vector3().crossVectors(axis,V(viewDirection));
 if(u.lengthSq()<1e-10)u.crossVectors(axis,Math.abs(axis.y)<.9?new Vector3(0,1,0):new Vector3(1,0,0));u.normalize();
 const v=new Vector3().crossVectors(axis,u).normalize(),paths=[];
 for(const diameter of [result.outer,result.inner].filter(Boolean))paths.push(Array.from({length:49},(_,i)=>center.clone().addScaledVector(u,Math.cos(i*Math.PI/24)*diameter/2).addScaledVector(v,Math.sin(i*Math.PI/24)*diameter/2).toArray()));
 paths.push([center.clone().addScaledVector(u,-result.outer/2).toArray(),center.clone().addScaledVector(u,result.outer/2).toArray()]);return paths;
}
