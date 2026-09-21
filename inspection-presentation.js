import * as T from './vendor/three.module.js';

const containmentPart=p=>!!p&&p.containmentLayer!=='emergency'&&(!!p.containmentCell||!!p.containmentLayer);
// A visual backdrop does not become engineering geometry. Explicit containment
// or below-grade review always keeps the real recesses and retention arrangement.
export function equipmentPresentationMode(state,containmentEquipment=new Set()){
 const {exploration,section={},isolated=false,selected,selectedEquipmentId,activePanel,containmentBelow=false}=state;
 const equipmentCut=section.enabled&&section.scope==='equipment'&&section.equipmentId!=null;
 const focusId=equipmentCut?section.equipmentId:exploration?.plan.equipmentId??selectedEquipmentId;
 const focused=equipmentCut||exploration?.context==='hidden'||isolated&&(selected||selectedEquipmentId!=null);
 if(!focused||containmentBelow||activePanel==='containment'||containmentPart(selected)||containmentEquipment.has(Number(focusId)))return false;
 return true;
}
export function createInspectionPresentation({model,ground,width,depth,center,getState}){
 const original=ground.geometry,containmentEquipment=new Set((model.containment?.cells||[]).map(c=>Number(c.id)));
 let neutral=null,active=false;
 function sync(){
  active=!!model.containment&&equipmentPresentationMode(getState(),containmentEquipment);
  if(active&&!neutral){neutral=new T.PlaneGeometry(width,depth);neutral.rotateX(-Math.PI/2);neutral.translate(center.x,0,center.z);neutral.name='Equipment inspection backdrop';}
  ground.geometry=active?neutral:original;
  return active;
 }
 return {sync,hides:p=>active&&containmentPart(p),get active(){return active;},restore(){active=false;ground.geometry=original;},dispose(){ground.geometry=original;neutral?.dispose();neutral=null;active=false;}};
}
