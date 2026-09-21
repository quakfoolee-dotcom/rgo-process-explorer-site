import * as T from './vendor/three.module.js';
import {prepareModelContext} from './prepare-model-context.js';
// Proposed tube-support frames. Dimensions are model geometry, not rated steelwork.
export function buildPY801SupportFrames(model,id){
 if(model.py801SupportRevision==='paired-123')return;
 const old=model.parts.filter(p=>['PL-801 PY-801 support','PL-801 PY-801 drive mount'].includes(p.assembly));
 if(!old.length)return;
 const oldIds=new Set(old.map(p=>p.id)),template=old.find(p=>p.name.endsWith(' column'));
 const box=template.geometry;let next=model.parts.reduce((max,p)=>Math.max(max,p.id),0)+1;
 const created=[],contacts=[],roots=[],loads=[];
 const v=a=>new T.Vector3(...a),local=(p,a)=>v(a).sub(p.position).applyQuaternion(p.quaternion.clone().invert()).divide(p.scale).toArray();
 function add(name,geometry,position,scale,quaternion=new T.Quaternion(),material='steel'){
  const p={...template,id:next++,name,geometry,position:v(position),center:v(position),scale:v(scale),quaternion,material,offset:new T.Vector3(),reactor:id,equipmentOwnerId:id,assembly:'PY-801 paired support frames',exploreRole:'equipment',cut:false,py801Frame:true,designStatus:'proposed'};
  p.code='PY-801-'+p.id;p.localZ=p.position.z-30;p.bounds=new T.Box3().setFromBufferAttribute(geometry.attributes.position).applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale));created.push(p);return p;
 }
 function beam(name,a,b,width=.12,depth=width){const delta=v(b).sub(v(a));return add(name,box,v(a).add(v(b)).multiplyScalar(.5).toArray(),[width,delta.length(),depth],new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize()));}
 function join(a,b,point,label){contacts.push({a:a.id,b:b.id,localA:local(a,point),localB:local(b,point),label});}
 const stages=[{name:'front',old:'PY-801 mounting saddle 1',x:93.775,half:.96,host:'PY-801 pressure casing',fixed:true},{name:'rear',old:'PY-801 mounting saddle 2',x:108.2,half:.96,host:'PY-801 pressure casing',fixed:false},{name:'motor',old:'PY-801 drive mounting saddle 1',x:91.07,half:.70,host:'PY-801 drive motor',fixed:true}];
 for(const stage of stages){
  const saddle=old.find(p=>p.name===stage.old);if(!saddle)throw Error('Missing PY-801 support template: '+stage.old);
  const host=model.parts.find(p=>p.name===stage.host),radius=Math.max(...saddle.geometry.parameters.points.map(p=>p.x));
  const bottom=1.9-radius,beamY=bottom-.30,beamTop=beamY+.08;
  const collar=add('PY-801 '+stage.name+' bearing collar',saddle.geometry,[stage.x,1.9,30],[1,1,1],saddle.quaternion.clone(),'bright');
  join(host,collar,[stage.x,1.9-(radius-.035),30],'PY-801 '+stage.name+' tube / bearing collar');loads.push({part:host.id,reactor:id,tag:stage.host});
  const cross=beam('PY-801 '+stage.name+' transverse crossbeam',[stage.x,beamY,30-stage.half],[stage.x,beamY,30+stage.half],.16,.16);
  const shoe=add('PY-801 '+stage.name+(stage.fixed?' locating bearing shoe':' guided axial bearing shoe · travel TBD'),box,[stage.x,(beamTop+bottom)/2,30],[.16,bottom-beamTop,.24],new T.Quaternion(),stage.fixed?'steel':'bright');
  join(collar,shoe,[stage.x,bottom,30],'PY-801 collar / shoe');join(shoe,cross,[stage.x,beamTop,30],'PY-801 shoe / crossbeam');
  for(const side of [-1,1]){
   const z=30+side*stage.half,label='PY-801 '+stage.name+' '+(side<0?'left':'right');
   const foot=add(label+' anchored baseplate',box,[stage.x,.06,z],[.42,.12,.42]);roots.push({part:foot.id,local:local(foot,[stage.x,0,z]),elevation:0});
   const post=beam(label+' column',[stage.x,.12,z],[stage.x,beamY,z]);join(foot,post,[stage.x,.12,z],label+' base / column');join(post,cross,[stage.x,beamY,z],label+' column / crossbeam');
   const kneeA=[stage.x,Math.max(.3,beamY-.35),z],kneeB=[stage.x,beamY,z-side*.32];const knee=beam(label+' knee brace',kneeA,kneeB,.065);join(post,knee,kneeA,label+' column / brace');join(cross,knee,kneeB,label+' brace / crossbeam');
   // Reuse the complete existing four-anchor hardware set, translated to each foot.
   const anchorTemplate=old.filter(p=>p.name.startsWith('PY-801 support 1 foundation anchor'));
   for(const a of anchorTemplate){const delta=a.position.clone().sub(new T.Vector3(93.775,0,30.96));add(label+' '+a.name.replace('PY-801 support 1 ',''),a.geometry,[stage.x+delta.x,delta.y,z+delta.z],a.scale.toArray(),a.quaternion.clone(),a.material);}
  }
 }
 model.parts=model.parts.filter(p=>!oldIds.has(p.id));model.parts.push(...created);
 model.structure.contacts=model.structure.contacts.filter(c=>!oldIds.has(c.a)&&!oldIds.has(c.b));model.structure.contacts.push(...contacts);
 model.structure.roots=model.structure.roots.filter(r=>!oldIds.has(r.part));model.structure.roots.push(...roots);
 model.structure.loads=model.structure.loads.filter(l=>!oldIds.has(l.part));for(const load of loads)if(!model.structure.loads.some(l=>l.part===load.part))model.structure.loads.push(load);
 // Prepared visibility sets must be rebuilt after replacing support part IDs.
 model.preparedContext=prepareModelContext(model);
 model.py801SupportRevision='paired-123';
 model.equipment[id].reviewNote='Proposed paired tube-support frames and independent motor frame. Rear guided bearing: thermal travel TBD. Tube span, enclosure load transfer, bearing loads, steel sections, anchors and foundation capacity require furnace-vendor and structural confirmation.';
}
