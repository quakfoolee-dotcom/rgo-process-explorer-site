import * as T from './vendor/three.module.js';
import {createBrowseWalker,angleDelta} from './plant-browse-network.js';

// Preview with the very same walker used for movement, including bend and branch stops.
export function browseArrowTargets(network,state,heading,distance=2){
 const e=state.edge,node=state.t<1e-6?e.from:state.t>1-1e-6?e.to:null;
 const starts=node==null?[{edge:e,t:state.t,heading:e.heading},{edge:e,t:state.t,heading:e.heading+Math.PI}]:(network.adj.get(node)||[]).map(edge=>({edge,t:edge.from===node?0:1,heading:edge.heading+(edge.from===node?0:Math.PI)}));
 return starts.map(start=>{const hit={edge:start.edge,t:start.t,point:[...state.point]},preview=createBrowseWalker(network,hit);preview.advance(distance,start.heading);const s=preview.state,a=angleDelta(start.heading,heading),label=Math.abs(a)<.6?'Move forward':Math.abs(a)>2.6?'Move back':a>0?'Take left walkway':'Take right walkway';return {hit,heading:start.heading,point:[...s.point],endHeading:s.heading,y:s.y,stair:s.edge.stair,exclude:s.edge.visualExclude,distance:s.distance,label};}).filter(t=>t.distance>.15);
}
export function createBrowseArrows(scene){
 const group=new T.Group();group.name='Walkway navigation arrows';scene.add(group);group.visible=false;
 const circle=new T.CircleGeometry(.43,48),shape=new T.Shape();shape.moveTo(0,.3);shape.lineTo(.26,-.08);shape.lineTo(.12,-.08);shape.lineTo(0,.08);shape.lineTo(-.12,-.08);shape.lineTo(-.26,-.08);shape.closePath();const chevron=new T.ShapeGeometry(shape),ray=new T.Raycaster();
 let items=[],lastKey='';
 function clear(){for(const item of items){group.remove(item.mesh);item.mesh.traverse(o=>o.material?.dispose());}items=[];}
 function set(targets){const key=JSON.stringify(targets.map(t=>[t.point,t.y,t.endHeading,t.heading,t.destination,t.label,t.exclude]));if(key===lastKey){items.forEach((item,i)=>item.target=targets[i]);return;}lastKey=key;clear();for(const target of targets){const mesh=new T.Group(),disc=new T.Mesh(circle,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.65,side:T.DoubleSide,depthWrite:false})),arrow=new T.Mesh(chevron,new T.MeshBasicMaterial({color:0x153d49,side:T.DoubleSide}));disc.rotation.x=arrow.rotation.x=-Math.PI/2;arrow.position.y=.004;mesh.add(disc,arrow);mesh.position.set(target.point[0],(target.y??0)+(target.stair?.23:.075),target.point[1]);mesh.rotation.y=target.endHeading+Math.PI;group.add(mesh);items.push({mesh,target,disc});}group.updateMatrixWorld(true);}
 function update(camera,occlusion,enabled){group.visible=enabled;if(!enabled)return;for(const item of items){const p=item.mesh.position,project=p.clone().project(camera);ray.ray.origin.copy(camera.position);ray.ray.direction.copy(p).sub(camera.position).normalize();item.mesh.visible=project.z>=-1&&project.z<=1&&Math.abs(project.x)<1.1&&Math.abs(project.y)<1.1&&!occlusion.blocked(ray,p,item.target.exclude);}}
 function pick(event,canvas,camera){if(!group.visible)return null;const r=canvas.getBoundingClientRect();ray.setFromCamera(new T.Vector2((event.clientX-r.left)/r.width*2-1,1-(event.clientY-r.top)/r.height*2),camera);group.updateMatrixWorld(true);return items.find(item=>item.mesh.visible&&ray.intersectObject(item.mesh,true).length)?.target||null;}
 function hover(target){for(const i of items){i.disc.material.color.setHex(i.target===target?0xffce79:0xffffff);i.disc.material.opacity=i.target===target?.9:.65;}}
 return {group,set,update,pick,hover,hide(){group.visible=false;},dispose(){clear();circle.dispose();chevron.dispose();scene.remove(group);}};
}
