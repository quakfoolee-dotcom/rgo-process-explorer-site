import {perforatedShellGeometry} from './perforated-shell.js';
// Review geometry only: real apertures and mating interfaces, no pressure-rating claim.
export function ventMechanical(h){
 const {T,add,b,c,band,boltCircle,parts}=h;
 function disk(name,x,y,z,r,t,holes=[]){const shape=new T.Shape();shape.absarc(0,0,r,0,Math.PI*2,false);for(const p of holes){const hole=new T.Path();hole.absarc(p.p[0]-x,-(p.p[2]-z),p.r,0,Math.PI*2,true);shape.holes.push(hole);}const g=new T.ExtrudeGeometry(shape,{depth:t,bevelEnabled:false,curveSegments:48});g.rotateX(-Math.PI/2);return add(name,'head',g,[x,y,z],'steel');}
 // Radial openings use the cylinder/cylinder intersection, independently on
 // each wall face. The removed opening is the flow bore; the fitted neck wall
 // overlaps the vessel wall continuously, without relying on a decorative ring.
 function shell(name,x,z,r,lo,hi,holes){
  const recipe={x,z,r,lo,hi,holes},g=perforatedShellGeometry(recipe);g.userData.preparedShell=recipe;
  return add(name,'shell',g,[x,0,z],'steel');
 }
 function fitNozzle(v,hole){
  const {p:root,axis,r:radius,name}=hole;if(!name||Math.abs(axis[1])>.5)return;
  const a=new T.Vector3(...axis),tangent=new T.Vector3(-a.z,0,a.x),up=new T.Vector3(0,1,0),base=new T.Vector3(...root);
  const neck=parts.find(p=>p.name===name+' neck'&&p.ports?.some(q=>new T.Vector3(...q).distanceTo(base.clone().addScaledVector(a,-.045))<1e-6));if(!neck)throw Error('Missing radial nozzle '+name);
  const end=new T.Vector3(...neck.ports[1]).sub(base).dot(a),inner=v.r-.035,pos=[],samples=[];
  const point=(rr,theta,atEnd)=>{const lateral=rr*Math.cos(theta),height=rr*Math.sin(theta),depth=atEnd?end:Math.sqrt(Math.max(0,inner*inner-lateral*lateral))-v.r;return base.clone().addScaledVector(tangent,lateral).addScaledVector(up,height).addScaledVector(a,depth);};
  const triangle=(a,b,c)=>pos.push(...a.toArray(),...b.toArray(),...c.toArray());
  for(let i=0;i<96;i++){const t=i*Math.PI*2/96,n=(i+1)*Math.PI*2/96;
   for(const [rr,reverse] of [[radius,false],[radius*.78,true]]){const p=[point(rr,t,false),point(rr,n,false),point(rr,n,true),point(rr,t,true)];if(reverse){triangle(p[0],p[2],p[1]);triangle(p[0],p[3],p[2]);}else{triangle(p[0],p[1],p[2]);triangle(p[0],p[2],p[3]);}}
   for(const atEnd of [false,true]){const p=[point(radius,t,atEnd),point(radius,n,atEnd),point(radius*.78,n,atEnd),point(radius*.78,t,atEnd)];triangle(p[0],p[1],p[2]);triangle(p[0],p[2],p[3]);}
   samples.push(point(radius,t,false).toArray());
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();g.applyMatrix4(new T.Matrix4().compose(neck.position,neck.quaternion,neck.scale).invert());neck.geometry=g;
  neck.mechanicalJoint={type:'Curvature-fitted radial nozzle',host:v.tag,root:[...root],axis:[...axis],vesselRadius:v.r,wallThickness:.035,outerRadius:radius,boreRadius:radius*.78,innerRim:samples,qualification:'Modeled geometry only; joint construction, material and pressure rating require vendor design'};
  // Replace the planar marker with a bead following the actual outer intersection.
  const weld=parts.find(p=>p.name===name+' · welded root'&&p.position.distanceTo(base)<1e-6);
  if(weld){const pts=Array.from({length:97},(_,i)=>{const t=i*Math.PI*2/96,lateral=radius*Math.cos(t);return base.clone().addScaledVector(tangent,lateral).addScaledVector(up,radius*Math.sin(t)).addScaledVector(a,Math.sqrt(Math.max(0,v.r*v.r-lateral*lateral))-v.r);});const curve=new T.CatmullRomCurve3(pts);const wg=new T.TubeGeometry(curve,192,.006,6,false);wg.applyMatrix4(new T.Matrix4().compose(weld.position,weld.quaternion,weld.scale).invert());weld.geometry=wg;}
 }
 function finishVessel(v){const {holes,x,z,r,lo,hi}=v;v.body.measurementShell={outerRadius:r,innerRadius:r-.035,height:hi-lo};for(const hole of holes)fitNozzle(v,hole);function replace(old,fresh){const inv=new T.Matrix4().compose(old.position,old.quaternion,old.scale).invert(),world=new T.Matrix4().compose(fresh.position,fresh.quaternion,fresh.scale);const transform=inv.multiply(world);fresh.geometry.applyMatrix4(transform);if(fresh.geometry.userData.preparedShell)fresh.geometry.userData.preparedShell.matrix=transform.toArray();old.geometry=fresh.geometry;parts.pop();}replace(v.body,shell(v.tag+' perforated shell',x,z,r,lo,hi,holes.filter(p=>Math.abs(p.axis[1])<.5)));replace(v.roof,disk(v.tag+' perforated roof',x,hi,z,r,.06,holes.filter(p=>p.axis[1]>.5)));replace(v.floor,disk(v.tag+' perforated bottom',x,lo-.03,z,r,.06,holes.filter(p=>p.axis[1]<-.5)));}
 function ductFlange(p,axis,r,name){for(const d of [-.0235,.0235])band(name+' flange face','pipe',r+.06,r*.78,.035,p.map((v,i)=>v+axis[i]*d),'bright',axis);const gasket=band(name+' gasket','pipe',r+.045,r*.78,.012,p,'gasket',axis);gasket.mechanicalFlange={gasketThickness:.012,faceThickness:.035,boreRadius:r*.78};boltCircle(p,axis,r+.032,8,.55,name+' bolting');}
 function ductNozzle(p,axis,len,name,r){const start=parts.length,end=h.nozzle(p,axis,len,name,r);for(let i=parts.length-1;i>=start;i--)if(parts[i].name.startsWith(name+' connection'))parts.splice(i,1);ductFlange(end,axis,r,name);return end;}
 function voluteShape(rad,right,top,left){const p=new T.Shape();p.moveTo(0,rad);p.absarc(0,0,rad,Math.PI/2,Math.PI*2,false);p.lineTo(right,0);p.lineTo(right,top);p.lineTo(left,top);p.lineTo(left,rad);p.closePath();return p;}
 function fan(s,root){
  const x=-38.9,y=1.65,z=5,outer=voluteShape(.58,.65,.85,.2),inner=voluteShape(.54,.61,.85,.24);outer.holes.push(new T.Path(inner.getPoints(48)));
  const casing=add('FN-3160 enclosed volute','pump',new T.ExtrudeGeometry(outer,{depth:.7,bevelEnabled:false,curveSegments:48}),[x,y,z-.35],'blue');casing.cut=true;
  for(const [side,zz,rr] of [['inlet',z-.37,.30],['drive',z+.35,.036]]){const sh=voluteShape(.58,.65,.85,.2),hole=new T.Path();hole.absarc(0,0,rr,0,2*Math.PI,true);sh.holes.push(hole);if(side==='inlet'){const drain=new T.Path();drain.absarc(0,1.13-y,.025,0,Math.PI*2,true);sh.holes.push(drain);}const p=add('FN-3160 '+side+' casing plate','head',new T.ExtrudeGeometry(sh,{depth:.02,bevelEnabled:false,curveSegments:48}),[x,y,zz],'blue');p.cut=true;s.join(casing,p,[x+.56,y,Math.max(4.65,zz)],'Fan sealed casing plate');}
  const foundation=root(b('FN-3160 foundation','frame',[1.7,.22,2.3],[x,.11,5.4]),[x,0,5.4]),seat=b('FN-3160 bearing pedestal','frame',[.8,.85,.65],[x,.645,5]);s.join(foundation,seat,[x,.22,5],'Fan foundation / pedestal');s.join(seat,casing,[x,1.07,5],'Fan pedestal / casing');s.load(casing,'FN-3160 enclosed fan');
  const intake=ductNozzle([x,y,4.65],[0,0,-1],.25,'FN-3160 inlet neck',.30);
  // Tangential rectangular outlet transitions to the round external duct.
  const out=[x+.425,2.85,z],vertices=[];for(let i=0;i<64;i++){const point=(j,top)=>{const a=j*2*Math.PI/64,co=Math.cos(a),si=Math.sin(a);if(top)return[out[0]+co*.30,2.85,z+si*.30];const scale=1/Math.max(Math.abs(co)/.225,Math.abs(si)/.35);return[out[0]+co*scale,2.5,z+si*scale];};vertices.push(...point(i,false),...point(i+1,false),...point(i+1,true),...point(i,false),...point(i+1,true),...point(i,true));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();const transition=add('FN-3160 tangential discharge transition','pipe',g,[0,0,0],'bright');h.edge([out[0],2.5,z],out,'FN-3160 discharge neck',transition);ductFlange(out,[0,1,0],.30,'FN-3160 discharge');
  for(let j=0;j<10;j++){const a=j*Math.PI/5;b('FN-3160 impeller blade','internal',[.07,.38,.42],[x+Math.cos(a)*.25,y+Math.sin(a)*.25,z],'inner',new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),a));}
  c('FN-3160 impeller hub','internal',.12,.48,[x,y,z],'inner',[0,0,1]);c('FN-3160 shaft','internal',.032,1.15,[x,y,5.42],'bright',[0,0,1]);band('FN-3160 shaft seal','head',.09,.033,.09,[x,y,5.37],'dark',[0,0,1]);
  const motor=c('FN-3160 coaxial VFD motor','pump',.23,.55,[x,y,6.10],'blue',[0,0,1]),mp=b('FN-3160 motor pedestal','frame',[.5,1.2,.65],[x,.82,6.1]);s.join(foundation,mp,[x,.22,6.1],'Motor pedestal / foundation');s.join(mp,motor,[x,1.42,6.1],'Motor / pedestal');s.load(motor,'FN-3160 direct drive');c('FN-3160 flexible coupling','internal',.085,.18,[x,y,5.70],'dark',[0,0,1]);band('FN-3160 coupling guard','head',.15,.13,.48,[x,y,5.60],'blue',[0,0,1]);
  motor.accessTag='FN-3160';motor.serviceAccess={standing:[-38.05,0,6.05],method:'Isolated drive service; vendor withdrawal and lift clearance HOLD',withdrawalAxis:[0,0,1]};
  return {body:casing,inlet:intake,outlet:out,gasIn:[x,y,4.695],gasOut:[out[0],2.5,z],foundation};
 }
 return {disk,shell,finishVessel,fitNozzle,ductFlange,ductNozzle,fan};
}
