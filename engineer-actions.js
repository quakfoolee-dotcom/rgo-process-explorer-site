import * as T from './vendor/three.module.js';

export const ARM_LENGTHS={upper:.285,lower:.285};
export function solveArm(shoulder,target,side=1,raised=false){
 const delta=target.clone().sub(shoulder),requested=delta.length(),length=T.MathUtils.clamp(requested,.04,.568),dir=delta.normalize();
 if(!dir.lengthSq())dir.set(0,-1,0);
 const pole=new T.Vector3(side*.8,raised?.9:-.65,-.35),bend=pole.addScaledVector(dir,-pole.dot(dir)).normalize();
 const elbow=shoulder.clone().addScaledVector(dir,length/2).addScaledVector(bend,Math.sqrt(Math.max(0,.285**2-length**2/4)));
 return {shoulder,elbow,hand:shoulder.clone().addScaledVector(dir,length),reachable:requested<=.568+1e-7,error:Math.max(0,requested-.568)};
}

// Adds independent neck, elbows, wrists and hand-held tools to the existing gait.
export function attachEngineerActions({group,upper,arms,materials,box,sphere,clipboard}){
 const neck=new T.Group();neck.name='Engineer neck';neck.position.set(0,.425,0);upper.add(neck);
 for(const child of [...upper.children])if(child!==neck&&child.position.y>=.42){upper.remove(child);child.position.sub(neck.position);neck.add(child);}
 const layer=new T.Group();layer.name='Engineer task arms';upper.add(layer);layer.visible=false;
 const limbs=[];
 for(const side of [-1,1]){
  const sleeve=box(layer,[.11,1,.12],[0,0,0],'shirt'),forearm=box(layer,[.085,1,.09],[0,0,0],'shirt');
  const elbow=sphere(layer,[.06,.06,.06],[0,0,0],'shirt'),hand=new T.Group();layer.add(hand);
  hand.name=side===1?'Engineer right hand':'Engineer left hand';sleeve.name=(side===1?'Right':'Left')+' upper arm';forearm.name=(side===1?'Right':'Left')+' forearm';
  sphere(hand,[.048,.068,.033],[0,0,0],'boots');
  for(const x of [-.029,0,.029])box(hand,[.023,.07,.028],[x,-.025,.026],'boots');
  sphere(hand,[.025,.044,.03],[side*.046,.006,.008],'boots');
  limbs.push({side,sleeve,forearm,elbow,hand});
 }
 const torch=new T.Group();torch.name='Engineer flashlight';limbs[1].hand.add(torch);
 const barrel=new T.Mesh(new T.CylinderGeometry(.033,.033,.17,12),materials.trim);barrel.rotation.x=Math.PI/2;barrel.position.z=.06;torch.add(barrel);
 const lens=new T.Mesh(new T.CircleGeometry(.032,16),new T.MeshBasicMaterial({color:0xffedaf,side:T.DoubleSide}));lens.position.z=.151;torch.add(lens);
 const beam=new T.Mesh(new T.ConeGeometry(.24,1.4,20,1,true),new T.MeshBasicMaterial({color:0xffedaf,transparent:true,opacity:.055,depthWrite:false,side:T.DoubleSide}));beam.rotation.x=-Math.PI/2;beam.position.z=.85;torch.add(beam);
 const tablet=new T.Group();tablet.name='Engineer inspection tablet';limbs[0].hand.add(tablet);
 box(tablet,[.18,.24,.02],[0,0,.035],'trim');box(tablet,[.15,.20,.006],[0,0,.049],'reflective');
 const limb=(m,a,b)=>{m.position.copy(a).add(b).multiplyScalar(.5);m.scale.y=a.distanceTo(b);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());};
 let evidence={reachable:true,hands:[],head:{yaw:0,pitch:0}};
 function reset(){neck.rotation.set(0,0,0);layer.visible=false;arms.forEach(a=>a.visible=true);torch.visible=tablet.visible=false;evidence={reachable:true,hands:[],head:{yaw:0,pitch:0}};}
 function apply({look,right,left,tool=null,weight=1,raisedElbow=false}){
  weight=T.MathUtils.clamp(weight,0,1);clipboard.visible=false;layer.visible=true;arms.forEach(a=>a.visible=false);group.updateMatrixWorld(true);
  if(look){const local=upper.worldToLocal(look.clone()).sub(neck.position),yaw=T.MathUtils.clamp(Math.atan2(local.x,local.z),-.85,.85),pitch=T.MathUtils.clamp(-Math.atan2(local.y,Math.hypot(local.x,local.z)),-.6,.65);neck.rotation.set(pitch*weight,yaw*weight,0);evidence.head={yaw:neck.rotation.y,pitch:neck.rotation.x};}
  evidence.reachable=true;evidence.hands=[];
  for(const a of limbs){
   const shoulder=new T.Vector3(a.side*.22,.33,0),rest=new T.Vector3(a.side*.24,-.16,.06),target=(a.side===1?right:left),local=target?upper.worldToLocal(target.clone()):rest;
   const requested=rest.clone().lerp(local,weight),j=solveArm(shoulder,requested,a.side,raisedElbow&&a.side===1);
   limb(a.sleeve,j.shoulder,j.elbow);limb(a.forearm,j.elbow,j.hand);a.elbow.position.copy(j.elbow);a.hand.position.copy(j.hand);a.hand.quaternion.identity();
   if(look&&a.side===1&&tool==='flashlight'){const direction=upper.worldToLocal(look.clone()).sub(j.hand).normalize();a.hand.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),direction);}
   evidence.reachable&&=j.reachable;evidence.hands.push({side:a.side,shoulder:j.shoulder.clone(),elbow:j.elbow.clone(),hand:j.hand.clone(),error:j.error});
  }
  torch.visible=tool==='flashlight'&&weight>1e-4;tablet.visible=tool==='tablet'&&weight>1e-4;group.updateMatrixWorld(true);
  return evidence;
 }
 return {reset,apply,getEvidence:()=>evidence,neck,layer};
}
