import * as T from './vendor/three.module.js';

export const isContainmentPart=p=>!!p&&p.containmentLayer!=='emergency'&&(!!p.containmentCell||!!p.containmentLayer);
// A visual backdrop does not become engineering geometry. Explicit containment
// or below-grade review always keeps the real recesses and retention arrangement.
export function equipmentPresentationMode(state,containmentEquipment=new Set()){
 const {exploration,section={},isolated=false,selected,selectedEquipmentId,activePanel,containmentBelow=false}=state;
 const equipmentCut=section.enabled&&section.scope==='equipment'&&section.equipmentId!=null;
 const focusId=equipmentCut?section.equipmentId:exploration?.plan.equipmentId??selectedEquipmentId;
 const focused=equipmentCut||exploration?.context==='hidden'||isolated&&(selected||selectedEquipmentId!=null);
 if(!focused||containmentBelow||activePanel==='containment'||isContainmentPart(selected)||containmentEquipment.has(Number(focusId)))return false;
 return true;
}
// compact: {width,depth,center} of the plant without the containment cells. Used when the user hides
// spill capture and retention (setUserHidden): the cells and the ground under them go, and the ground
// shrinks to the plant. The Containment panel and below-grade view always show the real cells again.
export function createInspectionPresentation({model,ground,width,depth,center,getState,compact=null}){
 const original=ground.geometry,containmentEquipment=new Set((model.containment?.cells||[]).map(c=>Number(c.id)));
 let neutral=null,compactGround=null,active=false,userHidden=false,compactActive=false;
 function plane(w,d,c,name){const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);g.translate(c.x,0,c.z);g.name=name;return g;}
 function sync(){
  const state=getState(),inspecting=!!model.containment&&equipmentPresentationMode(state,containmentEquipment);
  compactActive=!inspecting&&userHidden&&!!model.containment&&!!compact&&!state.containmentBelow&&state.activePanel!=='containment';
  active=inspecting||compactActive;
  if(inspecting&&!neutral)neutral=plane(width,depth,center,'Equipment inspection backdrop');
  if(compactActive&&!compactGround)compactGround=plane(compact.width,compact.depth,compact.center,'Plant ground without containment');
  ground.geometry=inspecting?neutral:compactActive?compactGround:original;
  return active;
 }
 return {sync,setUserHidden(value){userHidden=!!value;},hides:p=>active&&isContainmentPart(p),get active(){return active;},get compactActive(){return compactActive;},restore(){active=false;compactActive=false;ground.geometry=original;},dispose(){ground.geometry=original;neutral?.dispose();compactGround?.dispose();neutral=compactGround=null;active=compactActive=false;}};
}
