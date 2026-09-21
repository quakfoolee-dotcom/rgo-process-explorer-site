import * as T from './vendor/three.module.js';
import {journeyPathStation,journeyMarkerRadius} from './journey-marker-scale.js';
import {createExploreContext} from './equipment-explore.js';
import {pointOnJourneyPath,journeySegmentKey,journeyPathStates} from './product-journey.js';

export function createJourneyDrawing({scene,meshes,parts,getCamera,getHeight}){
 const group=new T.Group();group.name='Illustrative graphite to product route';scene.add(group);group.visible=false;
 const lineMaterial=new T.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.85,depthTest:false,depthWrite:false});
 const dashedMaterial=new T.LineDashedMaterial({vertexColors:true,transparent:true,opacity:.55,dashSize:.12,gapSize:.12,depthTest:false,depthWrite:false});
 let lines=null,inventoryLines=null,arrows=null,context=null,plan=null,stageColors=true,activeIds=new Set(),xray=true,overview=false;
 const dotGeometry=new T.SphereGeometry(1,8,6),dotMaterial=new T.MeshBasicMaterial({color:0xffffff,depthTest:false,depthWrite:false,toneMapped:false});
 const dots=new T.InstancedMesh(dotGeometry,dotMaterial,104);dots.frustumCulled=false;dots.count=0;dots.renderOrder=23;group.add(dots);
 const transform=new T.Object3D(),vector=new T.Vector3(),up=new T.Vector3(0,1,0),allIds=new Set(parts.map(p=>p.id));
 const stageColor=step=>new T.Color(stageColors?plan.stages.find(s=>s.id===step.stage).color:'#ffd166');
 function disposeLines(){for(const obj of [lines,inventoryLines,arrows])if(obj){group.remove(obj);obj.geometry.dispose();if(obj===arrows)obj.material.dispose();}lines=inventoryLines=arrows=null;}
 function build(){disposeLines();const positions=[],colors=[],inside=[],insideColors=[],arrowSpecs=[],seenSegments=new Set(),seenArrows=new Set();
  for(const step of plan.steps){if(step.status!=='connected')continue;const color=stageColor(step);
   for(const path of step.paths){for(const s of path.segments){const key=journeySegmentKey(s);if(seenSegments.has(key))continue;seenSegments.add(key);positions.push(...s.a,...s.b);colors.push(...color.toArray(),...color.toArray());}if(path.length>.1)for(const f of [.2,.55,.85]){const segment=path.segments.find(s=>s.end>=f*path.length),key=journeySegmentKey(segment);if(seenArrows.has(key))continue;seenArrows.add(key);const a=pointOnJourneyPath(path,f),b=pointOnJourneyPath(path,Math.min(.999,f+.002));arrowSpecs.push({a,b,color,radius:segment.displayRadius||.012});}}
   if(step.kind==='inventory'){for(const [a,b] of [[step.startPoint,step.center],[step.center,step.endPoint]]){inside.push(...a,...b);insideColors.push(...color.toArray(),...color.toArray());}}
  }
  const make=(pos,col,mat)=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));const line=new T.LineSegments(g,mat);line.renderOrder=20;line.frustumCulled=false;group.add(line);return line;};
  lines=make(positions,colors,lineMaterial);lines.name='Unique product passage segments';inventoryLines=make(inside,insideColors,dashedMaterial);inventoryLines.computeLineDistances();
  arrows=new T.InstancedMesh(new T.ConeGeometry(.07,.22,6),new T.MeshBasicMaterial({depthTest:false,depthWrite:false,toneMapped:false}),arrowSpecs.length);arrows.frustumCulled=false;arrows.renderOrder=21;
  arrowSpecs.forEach(({a,b,color,radius},i)=>{transform.position.set(...a);transform.quaternion.setFromUnitVectors(up,vector.set(...b).sub(transform.position).normalize());transform.scale.setScalar(Math.min(1,radius*.55/.07));transform.updateMatrix();arrows.setMatrixAt(i,transform.matrix);arrows.setColorAt(i,color);});group.add(arrows);
 }
 function syncXray(){if(!group.visible)return;if(!xray){context?.dispose();context=null;return;}context||=createExploreContext(scene,meshes);const opaque=new Set([...allIds].filter(id=>!activeIds.has(id)));context.set({ids:opaque},'faded');}
 function dot(point,color,size,index){transform.position.set(...point);transform.quaternion.identity();transform.scale.setScalar(size);transform.updateMatrix();dots.setMatrixAt(index,transform.matrix);dots.setColorAt(index,color);}
 return {
  setOverview(enabled){overview=enabled;},
  setPlan(next,byStage){plan=next;stageColors=byStage;group.visible=true;build();},
  setStage(ids,enabled){activeIds=ids;xray=enabled;syncXray();},
  setColors(enabled){if(stageColors===enabled)return;stageColors=enabled;if(plan)build();},
  update(player){if(!group.visible||!player)return;const {state}=player,step=plan.steps[state.index];dots.count=0;if(step.status!=='connected')return;
   const progress=Math.min(1,state.elapsed/step.duration),color=stageColor(step),camera=getCamera();
   const worldPixel=camera.isOrthographicCamera?(camera.top-camera.bottom)/camera.zoom/Math.max(1,getHeight()):camera.position.distanceTo(vector.set(...step.startPoint))*.0008;
   const size=Math.max(.025,Math.min(.30,worldPixel*3));let n=0;
   if(step.kind==='transfer'){const seen=new Set();for(const {path,available,block} of journeyPathStates(step,state.closed)){
    if(step.parallel&&!available){const key=block.point.join(',');if(!seen.has(key)){seen.add(key);dot(block.point,new T.Color('#ff677a'),size*1.5,n++);}continue;}
    for(let j=0;j<12;j++){const f=progress-j*.018;if(f<0)continue;const station=journeyPathStation(path,f);if(!station)continue;const point=station.point,key=point.map(v=>Math.round(v*1e5)).join(',');if(seen.has(key))continue;seen.add(key);const pixel=camera.isOrthographicCamera?worldPixel:2*camera.position.distanceTo(vector.set(...point))*Math.tan(camera.fov*Math.PI/360)/Math.max(1,getHeight());dot(point,color,journeyMarkerRadius(pixel,station.radius,{overview,leading:j===0}),n++);}
   }}
   else {const center=step.center,eq=plan.equipment?.[step.owner],r=Math.min(.48,(eq?.radius||.65)*.35);for(let j=0;j<10;j++){
    const angle=progress*Math.PI*4+j*Math.PI*.2,orbit=[center[0]+Math.cos(angle)*r,center[1]+Math.sin(angle*2)*r*.22,center[2]+Math.sin(angle)*r];let p;
    if(progress<.2){const f=progress/.2;p=step.startPoint.map((v,k)=>v+(orbit[k]-v)*f);}else if(progress>.8){const f=(progress-.8)/.2;p=orbit.map((v,k)=>v+(step.endPoint[k]-v)*f);}else p=orbit;
    dot(p,color,size*.8,n++);
   }}
   if(state.blocked?.point)dot(state.blocked.point,new T.Color('#ff677a'),size*2,n++);
   dots.count=n;dots.instanceMatrix.needsUpdate=true;if(dots.instanceColor)dots.instanceColor.needsUpdate=true;
  },
  hide(){group.visible=false;dots.count=0;context?.dispose();context=null;disposeLines();plan=null;},
  get drawCalls(){return group.visible?4:0;}
 };
}
