import {OrbitControls} from './vendor/OrbitControls.js';
import {Quaternion,Vector3,MathUtils} from './vendor/three.module.js';

export function visibleSpan(camera,target){
 return camera.isOrthographicCamera ? (camera.top-camera.bottom)/camera.zoom :
  2*camera.position.distanceTo(target)*Math.tan(MathUtils.degToRad(camera.fov)/2)/camera.zoom;
}
export function rotationSensitivity(camera,target,precision=false,localPivot=false){
 const span=Math.max(.0001,visibleSpan(camera,target));
 // Absolute span handles both wheel zoom and refitting the orthographic frustum.
 let speed=.65*Math.min(1,Math.sqrt(span/20));
 // A distant overview pivot needs a stronger reduction when inspecting by zoom alone.
 if(!localPivot)speed=Math.min(speed,span/Math.max(1,2*camera.position.distanceTo(target)));
 return Math.max(.0001,speed)*(precision?.25:1);
}

// Keep OrbitControls' aim target separate from the chosen world-space pivot.
// Rotate both camera and aim target around that pivot, preserving the pivot's
// screen position. Setting the pivot changes neither camera pose nor projection.
export class InspectionControls extends OrbitControls{
 constructor(camera,element){
  super(camera,element);
  this.inspectionPivot=null;this.pivotPartId=null;this.pivotEquipmentId=null;this.precision=false;
  this._aimBefore=new Vector3();this._orientationBefore=new Quaternion();
  this._orbitRotation=new Quaternion();this._pivotShift=new Vector3();
  this.addEventListener('end',()=>{if(this.precision)this.stopMotion();});
  this.setPrecision(false);
 }
 stopMotion(){this._sphericalDelta.set(0,0,0);this._panOffset.set(0,0,0);this._scale=1;this._performCursorZoom=false;}
 setPrecision(value){this.stopMotion();this.precision=!!value;this.enableDamping=!this.precision;this.dampingFactor=.22;this.zoomSpeed=this.precision?.45:.8;this.panSpeed=this.precision?.5:1;this.refreshSensitivity();}
 setInspectionPivot(point,partId=null){
  this.pivotEquipmentId=null;
  this.stopMotion();this.inspectionPivot=point.clone();this.pivotPartId=partId;
  // Move only the mathematical aim point along the existing sightline. This
  // gives perspective dolly an appropriate depth without turning the camera.
  const direction=this.object.getWorldDirection(new Vector3()),depth=point.clone().sub(this.object.position).dot(direction);
  this.target.copy(this.object.position).addScaledVector(direction,MathUtils.clamp(depth,this.minDistance,this.maxDistance));
  this._lastTargetPosition.copy(this.target);this.refreshSensitivity();
 }
 clearInspectionPivot(){this.stopMotion();this.inspectionPivot=null;this.pivotPartId=null;this.pivotEquipmentId=null;this.refreshSensitivity();}
 refreshSensitivity(){this.rotateSpeed=rotationSensitivity(this.object,this.target,this.precision,!!this.inspectionPivot);}
 update(deltaTime=null){
  this.refreshSensitivity();
  // The superclass constructor invokes update before our scratch vectors exist.
  if(!this.inspectionPivot)return super.update(deltaTime);
  this._aimBefore.copy(this.target);this._orientationBefore.copy(this.object.quaternion);
  const changed=super.update(deltaTime);
  this._orbitRotation.copy(this.object.quaternion).multiply(this._orientationBefore.invert());
  this._pivotShift.copy(this._aimBefore).sub(this.inspectionPivot);
  this._pivotShift.applyQuaternion(this._orbitRotation).add(this.inspectionPivot).sub(this._aimBefore);
  if(this._pivotShift.lengthSq()>1e-20){
   this.target.add(this._pivotShift);this.object.position.add(this._pivotShift);this.object.updateMatrixWorld();
   this._lastPosition.copy(this.object.position);this._lastTargetPosition.copy(this.target);
  }
  this.refreshSensitivity();return changed;
 }
}
