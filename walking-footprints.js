import * as T from './vendor/three.module.js';

// Navigation glyphs on a supplied checked path. No path finding, gap closing or
// safety/time credit is performed by the renderer. Positive local Z is the toe.
export function footprintPoses(path,{spacing=.58,lateral=.105,length=.28}={}){
 if(!Array.isArray(path)||path.length<2||!path.every(p=>Array.isArray(p)&&p.length===3&&p.every(Number.isFinite)))return [];
 if(!(spacing>0&&length>0&&lateral>=0))return [];
 const legs=[];let total=0;
 for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i],distance=Math.hypot(b[0]-a[0],b[2]-a[2]);
  // This guide currently supports screened grade paths only.
  if(Math.abs(b[1]-a[1])>1e-6)return [];
  if(distance>1e-8){legs.push({a,b,start:total,distance});total+=distance;}
 }
 if(!legs.length)return [];
 function at(s){const leg=legs.find(l=>s<=l.start+l.distance)||legs.at(-1),t=T.MathUtils.clamp((s-leg.start)/leg.distance,0,1);return leg.a.map((v,k)=>v+(leg.b[k]-v)*t);}
 const poses=[];
 for(let d=length/2+.04;d<=total-length/2-.04;d+=spacing){const p=at(d),a=at(Math.max(0,d-.16)),b=at(Math.min(total,d+.16)),yaw=Math.atan2(b[0]-a[0],b[2]-a[2]),side=poses.length%2?-1:1;
  poses.push({position:[p[0]+Math.cos(yaw)*lateral*side,p[1]+.018,p[2]-Math.sin(yaw)*lateral*side],yaw,side,distance:d});
 }
 return poses;
}
function soleGeometry(){
 const toe=new T.Shape();toe.moveTo(-.046,-.022);toe.bezierCurveTo(-.063,.035,-.058,.139,-.012,.15);toe.bezierCurveTo(.034,.158,.061,.127,.054,.067);toe.lineTo(.041,-.017);toe.quadraticCurveTo(0,-.037,-.046,-.022);
 const heel=new T.Shape();heel.moveTo(-.035,-.066);heel.lineTo(.036,-.066);heel.lineTo(.039,-.125);heel.quadraticCurveTo(0,-.153,-.036,-.13);heel.closePath();
 return new T.ShapeGeometry([toe,heel],8).rotateX(Math.PI/2);
}
export function createWalkingFootprints(parent){
 const group=new T.Group();group.name='Selected walking path';group.visible=false;parent.add(group);
 let prints=null,outline=null,guide=null,arrows=null,path=null,poses=[];
 function clear(){const geometries=new Set(),materials=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();group.clear();group.visible=false;prints=outline=guide=arrows=null;poses=[];path=null;}
 function setPath(points){clear();poses=footprintPoses(points);if(!poses.length)return;path=points.map(p=>[...p]);
  const material=new T.MeshBasicMaterial({color:0xffffff,side:T.DoubleSide,depthTest:true}),dark=new T.MeshBasicMaterial({color:0x142c38,side:T.DoubleSide,depthTest:true});
  prints=new T.Group();outline=new T.Group();const dummy=new T.Object3D();
  // Mirror the geometry, keeping every instance transform positively scaled.
  for(const side of [-1,1]){const items=poses.filter(p=>p.side===side);if(!items.length)continue;const geo=soleGeometry();if(side<0)geo.scale(-1,1,1);
   const fill=new T.InstancedMesh(geo,material,items.length),border=new T.InstancedMesh(geo,dark,items.length);
   items.forEach((p,i)=>{dummy.position.fromArray(p.position);dummy.rotation.set(0,p.yaw,0);dummy.scale.set(1,1,1);dummy.updateMatrix();fill.setMatrixAt(i,dummy.matrix);dummy.position.y-=.002;dummy.scale.set(1.17,1,1.09);dummy.updateMatrix();border.setMatrixAt(i,dummy.matrix);});
   fill.instanceMatrix.needsUpdate=border.instanceMatrix.needsUpdate=true;prints.add(fill);outline.add(border);
  }group.add(outline,prints);
  guide=new T.Line(new T.BufferGeometry().setFromPoints(path.map(p=>new T.Vector3(p[0],p[1]+.014,p[2]))),new T.LineBasicMaterial({color:0xf6fcff,transparent:true,opacity:.65,depthTest:true}));guide.visible=false;group.add(guide);
  const arrowShape=new T.Shape();arrowShape.moveTo(-.18,-.14);arrowShape.lineTo(0,.16);arrowShape.lineTo(.18,-.14);arrowShape.lineTo(0,-.03);arrowShape.closePath();const arrowPoses=footprintPoses(points,{spacing:3,lateral:0,length:.4});
  arrows=new T.InstancedMesh(new T.ShapeGeometry(arrowShape).rotateX(Math.PI/2),material,arrowPoses.length);arrowPoses.forEach((p,i)=>{dummy.position.fromArray(p.position);dummy.rotation.set(0,p.yaw,0);dummy.scale.set(1,1,1);dummy.updateMatrix();arrows.setMatrixAt(i,dummy.matrix);});arrows.instanceMatrix.needsUpdate=true;arrows.visible=false;group.add(arrows);group.visible=true;
 }
 function draw(camera,height){if(!path||!prints)return;const middle=path[Math.floor(path.length/2)],distance=Math.max(1,camera.position.distanceTo(new T.Vector3(...middle))),pixels=camera.isOrthographicCamera ? .28*height*camera.zoom/(camera.top-camera.bottom) : .28*height/(2*distance*Math.tan(T.MathUtils.degToRad(camera.fov||50)/2));const detailed=pixels>=3;prints.visible=outline.visible=detailed;guide.visible=arrows.visible=!detailed;}
 return {setPath,clear,draw,group,getState:()=>({visible:group.visible,count:poses.length,destination:path?.at(-1)||null,poses:poses.map(p=>({...p,position:[...p.position]}))})};
}
