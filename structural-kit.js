// Conceptual support geometry with explicit attachment points and foundation paths.
// Connections describe modeled attachment, not structural capacity or fabrication approval.
export function structuralKit(h){
 const {T,parts,structure,b,band,bolt,boltCircle,setContext}=h,V=p=>new T.Vector3(...p),Y=new T.Vector3(0,1,0);
 const point=(p,v)=>V(v).sub(p.position).applyQuaternion(p.quaternion.clone().invert()).divide(p.scale).toArray();
 function join(a,b,p,label){structure.contacts.push({a:a.id,b:b.id,localA:point(a,p),localB:point(b,p),label});return b;}
 function load(p,tag){if(!structure.loads.some(l=>l.part===p.id))structure.loads.push({part:p.id,reactor:p.reactor,tag});return p;}
 function beam(a,z,w,name,d=w){const delta=V(z).sub(V(a)),p=b(name,'frame',[w,delta.length(),d],V(a).add(V(z)).multiplyScalar(.5).toArray(),'steel',new T.Quaternion().setFromUnitVectors(Y,delta.normalize()));return p;}
 function column(x,z,top,tag,w=.12){
  const foot=b(tag+' anchored baseplate','frame',[.42,.12,.42],[x,.06,z]);structure.roots.push({part:foot.id,local:point(foot,[x,0,z]),elevation:0});
  const post=beam([x,.12,z],[x,top,z],w,tag+' column');join(foot,post,[x,.12,z],tag+' base connection');
  for(const dx of[-.13,.13])for(const dz of[-.13,.13])bolt([x+dx,.12,z+dz],[0,1,0],.8,tag+' foundation anchor');
  return {foot,post,x,z,top};
 }
 function conveyor(cv,tag,{stations=[.16,.84],side=1,offset=.62,drive=true,driveShift=0}={}){
  const axis=V(cv.z).sub(V(cv.a)).normalize(),normal=new T.Vector3(axis.z,0,-axis.x).normalize().multiplyScalar(side);if(normal.length()<.1)normal.set(side,0,0);
  const radius=cv.casing.geometry.parameters?.outerRadius||cv.radius||.18,supports=[];
  function cradle(body,center,r,number){
   const collar=band(tag+' mounting saddle '+number,'frame',r+.035,r-.003,.12,center,'bright',axis.toArray());
   const contact=V(center).addScaledVector(normal,r).toArray();join(body,collar,contact,tag+' casing / saddle '+number);
   const at=V(center).addScaledVector(normal,offset);if(number==='drive'&&driveShift)at.addScaledVector(new T.Vector3(axis.x,0,axis.z).normalize(),driveShift);const post=column(at.x,at.z,at.y+.065,tag+' support '+number);
   const inner=V(center).addScaledVector(normal,r+.016),arm=beam(inner.toArray(),at.toArray(),.12,tag+' saddle crossarm '+number);
   join(collar,arm,inner.toArray(),tag+' saddle / crossarm '+number);join(arm,post.post,at.toArray(),tag+' crossarm / column '+number);
   const kneeStart=at.clone().addScaledVector(Y,-Math.min(.42,at.y*.5)),kneeEnd=inner.clone().lerp(at,.25),knee=beam(kneeStart.toArray(),kneeEnd.toArray(),.065,tag+' knee brace '+number);
   join(post.post,knee,kneeStart.toArray(),tag+' brace / post '+number);join(knee,arm,kneeEnd.toArray(),tag+' brace / arm '+number);
   supports.push(post);return collar;
  }
  load(cv.casing,tag+' casing');for(const [i,t] of stations.entries())cradle(cv.casing,V(cv.a).lerp(V(cv.z),t).toArray(),radius,i+1);
  if(drive){const motor=parts.find(p=>p.name===tag+' drive motor');if(motor){load(motor,tag+' drive');cradle(motor,motor.position.toArray(),radius*.8,'drive');}}
  return supports;
 }
 function verticalSupport(body,tag,{x,z,r,y,back=z-.85,levels=[y],side=1,span=.65}={}){
  load(body,tag);const posts=[column(x-span,back,Math.max(...levels)+.22,tag+' left'),column(x+span,back,Math.max(...levels)+.22,tag+' right')];
  for(const yy of levels){const rail=beam([x-span,yy,back],[x+span,yy,back],.12,tag+' crossbeam');for(const p of posts)join(p.post,rail,[p.x,yy,back],tag+' crossbeam / column');
   const collar=band(tag+' housing support collar','frame',r+.03,r-.003,.12,[x,yy,z]);join(body,collar,[x,yy,z+side*r],tag+' housing / collar');
   const edge=z+Math.sign(back-z)*(r+.012),arm=beam([x,yy,back],[x,yy,edge],.12,tag+' housing bracket');join(rail,arm,[x,yy,back],tag+' rail / bracket');join(arm,collar,[x,yy,edge],tag+' bracket / collar');
  }
  const y0=.35,y1=Math.max(...levels)-.25;if(y1>y0){const brace=beam([posts[0].x,y0,back],[posts[1].x,y1,back],.07,tag+' rack brace');join(posts[0].post,brace,[posts[0].x,y0,back],tag+' brace lower');join(posts[1].post,brace,[posts[1].x,y1,back],tag+' brace upper');}
  return posts;
 }
 function auxiliaryRack(filter,condenser){
  setContext(99,'PL-166 connected vapor recovery support rack');
  const back=-18.8,x0=-11.95,x1=-7.95,posts=[column(x0,back,6.3,'PL-166 rack west',.16),column(x1,back,6.3,'PL-166 rack east',.16)];
  for(const [body,tag,x,z,r,levels] of[[filter,'F-166',-11.3,-17.2,.32,[5.25,5.75]],[condenser,'E-166',-8.6,-17.2,.35,[3.55,4.35]]]){
   load(body,tag);for(const y of levels){const rail=beam([x0,y,back],[x1,y,back],.14,tag+' rack crossbeam');for(const p of posts)join(p.post,rail,[p.x,y,back],tag+' rail / post');
    const collar=band(tag+' structural mounting collar','frame',r+.032,r-.003,.10,[x,y,z]);join(body,collar,[x,y,z-r],tag+' shell / collar');
    const edge=z-r-.012,arm=beam([x,y,back],[x,y,edge],.14,tag+' mounting bracket');join(rail,arm,[x,y,back],tag+' rail / bracket');join(arm,collar,[x,y,edge],tag+' bracket / collar');
    boltCircle([x,y+.05,z],[0,1,0],r+.015,6,.45,tag+' support fixing');
   }
  }
  const brace=beam([x0,.4,back],[x1,6.0,back],.09,'PL-166 rack diagonal brace');join(posts[0].post,brace,[x0,.4,back],'Rack brace lower');join(posts[1].post,brace,[x1,6,back],'Rack brace upper');
  return posts;
 }
 function boxFrame(body,tag,{x,z,width,depth,bottom,top=bottom}){
  load(body,tag);const posts=[];
  for(const xx of[x-width/2,x+width/2])for(const zz of[z-depth/2,z+depth/2]){const p=column(xx,zz,bottom,tag);posts.push(p);join(body,p.post,[xx,bottom,zz],tag+' bearing seat');}
  if(top>bottom+.3)for(const xx of[x-width/2,x+width/2]){const a=[xx,bottom,z-depth/2],end=[xx,top,z-depth/2],upright=beam(a,end,.1,tag+' tower upright');join(posts.find(p=>p.x===xx&&p.z===z-depth/2).post,upright,a,tag+' tower base');const tie=beam([xx,top,z-depth/2],[xx,top,z+depth/2],.1,tag+' upper casing tie');join(upright,tie,end,tag+' tower top');join(body,tie,[xx,top,z],tag+' upper casing restraint');}
  return posts;
 }
 function filterPlatform(vessel,feet){
  setContext(99,'PL-166 elevated filter platform and access');const x0=-16.25,x1=-12.6,z0=-21.75,z1=-18.25,level=5.9;
  const posts=[];for(const x of[x0,x1])for(const z of[z0,z1])posts.push(column(x,z,level-.1,'PL-166 platform',.20));
  for(const z of[z0,z1]){const rail=beam([x0,level-.1,z],[x1,level-.1,z],.2,'PL-166 edge girder');for(const p of posts.filter(p=>p.z===z))join(p.post,rail,[p.x,level-.1,z],'Platform girder / post');}
  const side=[];for(const x of[x0,x1]){const rail=beam([x,level-.1,z0],[x,level-.1,z1],.2,'PL-166 longitudinal girder');for(const p of posts.filter(p=>p.x===x))join(p.post,rail,[x,level-.1,p.z],'Platform side / post');side.push(rail);}
  for(const f of feet){const y=level-.1,rail=beam([x0,y,f.z],[x1,y,f.z],.2,'F-161 dedicated load-bearing crossbeam');join(side[0],rail,[x0,y,f.z],'Filter beam west seat');join(side[1],rail,[x1,y,f.z],'Filter beam east seat');join(f.foot,rail,[f.x,level,f.z],'Filter foot / supporting girder');}
  // Open grating panels leave a real central penetration for the filtrate outlet.
  for(let x=x0+.15;x<x1-.1;x+=.16)for(const [a,z] of[[z0,z0+1.1],[z0+1.1,z1]]){
   if(Math.abs(x-vessel.x)<.28){for(const [lo,hi] of[[a,Math.min(z,vessel.z-.30)],[Math.max(a,vessel.z+.30),z]])if(hi>lo)beam([x,level-.035,lo],[x,level-.035,hi],.035,'PL-166 grating strip',.025);}else beam([x,level-.035,a],[x,level-.035,z],.035,'PL-166 grating strip',.025);
  }
  for(const x of[x0,x1]){const brace=beam([x,.45,z0],[x,level-.4,z1],.09,'PL-166 platform diagonal brace');join(posts.find(p=>p.x===x&&p.z===z0).post,brace,[x,.45,z0],'Platform brace lower');join(posts.find(p=>p.x===x&&p.z===z1).post,brace,[x,level-.4,z1],'Platform brace upper');}
  // Permanent stairs and their landing connections are built by the shared access system.
  const stairX=-13.675;
  for(const [a,z] of[[[x0,level,z0],[stairX-.625,level,z0]],[[stairX+.625,level,z0],[x1,level,z0]],[[x0,level,z0],[x0,level,z1]],[[x1,level,z0],[x1,level,z1]],[[x0,level,z1],[x1,level,z1]]]){
   const len=V(z).distanceTo(V(a)),alongX=Math.abs(a[0]-z[0])>.01,rails=[.535,1.07].map(dy=>beam(V(a).addScaledVector(Y,dy).toArray(),V(z).addScaledVector(Y,dy).toArray(),.045,'PL-166 perimeter guardrail')),center=V(a).add(V(z)).multiplyScalar(.5).addScaledVector(Y,.075),toe=b('PL-166 toe plate','frame',alongX?[len,.15,.025]:[.025,.15,len],center.toArray()),girder=parts.find(p=>p.name===(alongX?'PL-166 edge girder':'PL-166 longitudinal girder')&&Math.abs(p.position[alongX?'z':'x']-a[alongX?2:0])<.01);
   for(let i=0;i<=Math.ceil(len/1.3);i++){const at=V(a).lerp(V(z),i/Math.ceil(len/1.3)),post=beam(at.toArray(),at.clone().addScaledVector(Y,1.07).toArray(),.045,'PL-166 guardrail post');join(girder,post,at.toArray(),'PL-166 guard / platform girder');load(post,'PL-166 guardrail post');for(const [j,dy]of[.535,1.07].entries())join(post,rails[j],at.clone().addScaledVector(Y,dy).toArray(),'PL-166 rail / post');join(post,toe,at.clone().addScaledVector(Y,.075).toArray(),'PL-166 toe / post');}for(const rail of rails)load(rail,'PL-166 guardrail');load(toe,'PL-166 toeboard');
  }
  structure.access.push({tag:'PL-166',equipment:46,deckElevation:level,stairs:true,guardrails:true,filtratePenetration:true,limits:'Illustrative access geometry. Load capacity, headroom, lifting plan and code dimensions require detailed design.'});
 }
 return {beam,column,join,load,conveyor,verticalSupport,auxiliaryRack,filterPlatform,boxFrame};
}

export function inspectStructuralConnections(model){
 const {structure}=model,parts=new Map(model.parts.map(p=>[p.id,p])),V=p=>model.parts[0].position.clone().set(...p),failures=[],graph=new Map();
 const world=(p,v)=>V(v).multiply(p.scale).applyQuaternion(p.quaternion).add(p.position);
 for(const c of structure.contacts){const a=parts.get(c.a),b=parts.get(c.b);if(!a||!b){failures.push({label:c.label,reason:'Missing attachment part'});continue;}const gap=world(a,c.localA).distanceTo(world(b,c.localB));
  for(const [p,at]of[[a,c.localA],[b,c.localB]]){p.geometry.computeBoundingBox();if(!p.geometry.boundingBox.clone().expandByScalar(.012).containsPoint(V(at)))failures.push({label:c.label,reason:'Attachment misses part geometry',part:p.name});}
  if(gap>.012)failures.push({label:c.label,reason:'Disconnected attachment',gap});else{if(!graph.has(a.id))graph.set(a.id,new Set());if(!graph.has(b.id))graph.set(b.id,new Set());graph.get(a.id).add(b.id);graph.get(b.id).add(a.id);}
 }
 const grounded=new Set(),queue=[];for(const r of structure.roots){const p=parts.get(r.part);if(!p||Math.abs(world(p,r.local).y-r.elevation)>.012){failures.push({label:'Foundation',reason:'Base misses foundation',part:r.part});continue;}grounded.add(p.id);queue.push(p.id);}
 for(let i=0;i<queue.length;i++)for(const id of graph.get(queue[i])||[])if(!grounded.has(id)){grounded.add(id);queue.push(id);}
 for(const l of structure.loads)if(!grounded.has(l.part))failures.push({label:l.tag,reason:'No continuous attachment path to foundation'});
 return {passes:failures.length===0,loads:structure.loads.length,contacts:structure.contacts.length,foundations:structure.roots.length,failures,method:'Declared mounting points checked against part geometry and assembled transforms, with graph reachability to foundations. Structural strength is not calculated.'};
}

// Keep shared support assemblies visible when their supported equipment is framed.
export function equipmentSupportContext(model){
 const parts=new Map(model.parts.map(p=>[p.id,p])),graph=new Map(),result=new Map(),assemblyParts=new Map(),ownerLoads=new Map();
 for(const p of model.parts){const key=p.reactor+'|'+p.assembly;if(!assemblyParts.has(key))assemblyParts.set(key,[]);assemblyParts.get(key).push(p);}
 for(const l of model.structure.loads){if(!ownerLoads.has(l.reactor))ownerLoads.set(l.reactor,[]);ownerLoads.get(l.reactor).push(l.part);}
 // Pipe rack context is assigned by served equipment below; do not traverse an entire connected plant rack for a single equipment selection.
 for(const c of model.structure.contacts){if(parts.get(c.a)?.pipeSupportTag||parts.get(c.b)?.pipeSupportTag)continue;for(const [a,b] of[[c.a,c.b],[c.b,c.a]]){if(!graph.has(a))graph.set(a,new Set());graph.get(a).add(b);}}
 for(const [owner,loads] of ownerLoads){
  const visited=new Set(),queue=[...loads],assemblies=new Set();
  for(let i=0;i<queue.length;i++){const id=queue[i],p=parts.get(id);if(visited.has(id)||!p||(p.reactor!==owner&&p.system!=='frame'))continue;visited.add(id);if(p.reactor!==owner)assemblies.add(p.reactor+'|'+p.assembly);for(const next of graph.get(id)||[])queue.push(next);}
  const context=new Set();for(const key of assemblies)for(const p of assemblyParts.get(key)||[])if(p.reactor!==owner)context.add(p.id);if(context.size)result.set(owner,context);
 }
 for(const t of model.accessSystem?.towers||[])for(const owner of t.served){const context=result.get(owner)||new Set();for(const id of t.partIds)if(parts.has(id))context.add(id);result.set(owner,context);}
 for(const rack of model.pipeSupportSystem?.racks||[])for(const owner of rack.equipmentIds){const context=result.get(owner)||new Set();for(const id of rack.partIds)if(parts.has(id))context.add(id);result.set(owner,context);}
 return result;
}
