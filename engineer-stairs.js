import * as T from './vendor/three.module.js';
import {prepareNaturalGait} from './engineer-gait.js';

// Uses existing physical tread and deck records. No virtual ramp or equipment changes.
export function dr601InspectionRoute(model){
 const access=model.accessSystem,parts=new Map(model.parts.map(p=>[p.id,p]));
 const task=access?.tasks.find(t=>t.id==='DR601-LOWER-MANWAY');
 const tower=access?.towers.find(t=>t.tag==='PL-601');
 const route={id:'dr601-inspection',label:'DR-601 · Stairs and platform inspection',points:[],segments:[],elevated:true,problems:[],obstaclesChecked:0,length:0,clearanceRadius:.32,clearanceHeight:1.8};
 if(!task||!tower){route.points=[[75.075,7.4]];route.elevations=[0];route.problems=['PL-601 stair or DR-601 inspection records are missing.'];return route;}
 const flights=access.flights.filter(f=>f.tag.startsWith('PL-601 ')&&f.y1<=task.standing[1]+.001).sort((a,b)=>a.y0-b.y0);
 const decks=access.decks.filter(d=>d.id.startsWith('PL-601'));
 const bounds=p=>{if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();return p.bounds||p.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale));};
 const nodes=[],surfaceIds=new Set(),add=(p,name,kind='deck',surface=null,stop=0,inspection=false)=>{
  if(surface)surfaceIds.add(surface);
  nodes.push({p:[...p],name,kind,surface,stop,inspection});
 };
 const deck=id=>decks.find(d=>d.id===id),center=d=>[(d.min[0]+d.max[0])/2,d.min[1],(d.min[2]+d.max[2])/2];
 const base=deck(tower.landings[0]);
 add([tower.entry[0],-.015,7.4],'PL-601 ground approach','ground');
 add([tower.entry[0],0,base.min[2]+.25],'PL-601 entry landing','deck',base.partId);
 for(const f of flights){
  const bottom=deck(f.bottom),top=deck(f.top),dir=Math.sign(f.z1-f.z0),bc=center(bottom),tc=center(top);
  add([f.x,f.y0,bc[2]],f.tag+' lower landing','deck',bottom.partId);
  add([f.x,f.y0,f.z0-dir*.28],f.tag+' first riser approach','deck',bottom.partId);
  for(let i=0;i<f.treads.length;i++){
   const p=parts.get(f.treads[i]);if(!p){route.problems.push('Missing '+f.tag+' tread '+(i+1));continue;}
   const b=bounds(p);add([p.position.x,b.max.y,p.position.z],f.tag+' · tread '+(i+1),'stair',p.id);
   if(f.nosingIds?.[i])surfaceIds.add(f.nosingIds[i]);
  }
  add([f.x,f.y1,f.z1+dir*.14],f.tag+' upper arrival','stair',top.partId);
  add([f.x,f.y1,tc[2]],f.tag+' upper landing','deck',top.partId,1);
  // Short flights have an extended landing connected to the main return landing.
  const levelIndex=tower.levels.indexOf(f.y1),main=deck(tower.landings[levelIndex]);
  if(main.id!==top.id)add([f.x,f.y1,center(main)[2]],'PL-601 return landing','deck',main.partId);
 }
 const link=deck('PL-601 7.6 tower bridge link'),bridge=deck('PL-601 lower service bridge'),bay=deck(task.deckId);
 if(!link||!bridge||!bay)route.problems.push('DR-601 platform connection is incomplete.');
 else{
  const y=task.standing[1],z=center(bridge)[2];
  add([73.7,y,14.7],'Platform entry link','deck',link.partId);
  add([73.7,y,z],'Lower platform junction','deck',link.partId);
  add([64,y,z],'Collector-side platform','deck',bridge.partId,2);
  add([task.standing[0],y,z],'DR-601 platform','deck',bridge.partId);
  add(task.standing,'Inspect DR-601 lower manway externally','deck',bay.partId,8,true);
 }
 const outbound=nodes.map(n=>({...n,p:[...n.p]}));
 for(const n of outbound.slice(0,-1).reverse())nodes.push({...n,p:[...n.p],stop:0,inspection:false,name:'Return · '+n.name});
 // Remove coincident points to avoid zero-length motion segments.
 const clean=nodes.filter((n,i)=>i===0||new T.Vector3(...n.p).distanceTo(new T.Vector3(...nodes[i-1].p))>1e-6);
 route.points=clean.map(n=>[n.p[0],n.p[2]]);route.elevations=clean.map(n=>n.p[1]);route.stops=clean.map(n=>n.name);
 const cover=model.parts.find(p=>p.reactor===task.equipmentId&&p.name===task.partName);
 route.inspectionTarget=cover?.position.toArray();
 if(!cover)route.problems.push('DR-601 inspection target is missing.');
 route.inspectionNote='External visual inspection of DR-601 lower manway and visible connections. Gate and cover stay closed. Simulation only; no equipment condition is assessed.';
 for(let i=1;i<clean.length;i++){
  const a=clean[i-1],b=clean[i],stair=Math.abs(a.p[1]-b.p[1])>.03;
  const length=new T.Vector3(...a.p).distanceTo(new T.Vector3(...b.p));
  const count=stair?1:Math.max(1,Math.ceil(length/.40));
  for(let j=0;j<count;j++){
   const from=new T.Vector3(...a.p).lerp(new T.Vector3(...b.p),j/count),to=new T.Vector3(...a.p).lerp(new T.Vector3(...b.p),(j+1)/count);
   route.segments.push({a:[from.x,from.z],b:[to.x,to.z],ya:from.y,yb:to.y,length:from.distanceTo(to),name:b.name,speed:stair?(to.y>from.y?.42:.32):.75,stair,articulated:true,stopSeconds:j===count-1?b.stop:0,inspection:j===count-1&&b.inspection,obstacles:[],sourceSurface:a.surface,targetSurface:b.surface});
  }
  route.length+=length;
 }
 prepareNaturalGait(route.segments);
 // Verify each footprint against the exact registered tread/deck supporting it.
 for(const n of clean){
  if(n.kind==='ground')continue;
  const p=parts.get(n.surface);if(!p){route.problems.push('Missing standing surface at '+n.name);continue;}
  const b=bounds(p),margin=n.kind==='stair'?.10:.12;
  if(n.p[0]<b.min.x+margin-.001||n.p[0]>b.max.x-margin+.001||n.p[2]<b.min.z+margin-.001||n.p[2]>b.max.z-margin+.001||Math.abs(n.p[1]-b.max.y)>.002)route.problems.push('Standing surface mismatch at '+n.name);
 }
 // Torso/head capsule versus oriented part envelopes. Feet follow verified surfaces with separately tested boot trajectories.
 const region=new T.Box3().setFromPoints(clean.map(n=>new T.Vector3(...n.p)));region.max.y+=route.clearanceHeight;region.expandByScalar(.6);
 const candidates=model.parts.filter(p=>!p.floorAllocationLegacy&&bounds(p).intersectsBox(region)).map(p=>{
  const box=p.geometry.boundingBox,c=box.getCenter(new T.Vector3()).multiply(p.scale).applyQuaternion(p.quaternion).add(p.position),half=box.getSize(new T.Vector3()).multiply(p.scale).multiplyScalar(.5);
  half.set(Math.abs(half.x),Math.abs(half.y),Math.abs(half.z));return {p,b:bounds(p),c,half,inv:p.quaternion.clone().invert()};
 });
 route.obstaclesChecked=candidates.length;
 for(const s of route.segments){
  const a=new T.Vector3(s.a[0],s.ya,s.a[1]),b=new T.Vector3(s.b[0],s.yb,s.b[1]);
  const sweep=new T.Box3().setFromPoints([a,b]);sweep.min.x-=.32;sweep.max.x+=.32;sweep.min.z-=.32;sweep.max.z+=.32;sweep.max.y+=1.8;
  const nearby=candidates.filter(o=>o.b.intersectsBox(sweep)&&!(surfaceIds.has(o.p.id)&&o.b.max.y<=Math.max(s.ya,s.yb)+.002));
  let hit=null;
  for(let i=0,n=Math.max(1,Math.ceil(s.length/.05));i<=n&&!hit;i++){
   const pos=a.clone().lerp(b,i/n);
   for(const o of nearby){
    const low=pos.clone().add(new T.Vector3(0,.85,0)).sub(o.c).applyQuaternion(o.inv),high=pos.clone().add(new T.Vector3(0,1.48,0)).sub(o.c).applyQuaternion(o.inv);
    const h=o.half.clone().addScalar(.32);let lo=0,hi=1;
    for(const axis of ['x','y','z']){const delta=high[axis]-low[axis];if(Math.abs(delta)<1e-10){if(low[axis]<-h[axis]||low[axis]>h[axis])hi=-1;}else{const u=(-h[axis]-low[axis])/delta,v=(h[axis]-low[axis])/delta;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));}}
    if(lo<=hi){hit=o;break;}
   }
  }
  if(hit)route.problems.push('Clearance at '+s.name+': '+hit.p.name);
 }
 const accessIds=new Set(surfaceIds);
 for(const f of flights)for(const id of f.railIds)accessIds.add(id);
 for(const d of decks.filter(d=>surfaceIds.has(d.partId)))for(const id of d.guardParts||[])accessIds.add(id);
 if([...accessIds].some(id=>!parts.has(id)))route.problems.push('Required stair, platform or guarding component is missing.');
 route.problems=[...new Set(route.problems)];route.nodes=clean;route.supportPartIds=[...accessIds];
 return route;
}
