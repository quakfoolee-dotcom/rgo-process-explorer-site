// Rendering detail only: no component is removed from the engineering model.
export function fastenerDetailVisible(camera,target,height,{force=false,previous=false}={}){
 if(force)return true;
 const span=camera.isOrthographicCamera?(camera.top-camera.bottom)/camera.zoom:2*camera.position.distanceTo(target)*Math.tan(camera.fov*Math.PI/360);
 // Hysteresis prevents flicker while zooming near a two-pixel fastener size.
 const pixelsPerMetre=height/Math.max(span,.01);return pixelsPerMetre>(previous?40:50);
}
export function createRenderDetail(meshes){
 const detail=meshes.filter(m=>m.userData.parts.every(p=>p.system==='fastener'));let shown=null;
 return {update(camera,target,height,force=false){const next=fastenerDetailVisible(camera,target,height,{force,previous:shown});if(next===shown)return false;shown=next;for(const mesh of detail)mesh.visible=next;return true;},get shown(){return shown;},batches:detail.length};
}
