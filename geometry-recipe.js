import {perforatedShellGeometry} from './perforated-shell.js';
import * as T from './vendor/three.module.js';
const argumentsByType={
 BoxGeometry:['width','height','depth','widthSegments','heightSegments','depthSegments'],
 CylinderGeometry:['radiusTop','radiusBottom','height','radialSegments','heightSegments','openEnded','thetaStart','thetaLength'],
 ConeGeometry:['radius','height','radialSegments','heightSegments','openEnded','thetaStart','thetaLength'],
 SphereGeometry:['radius','widthSegments','heightSegments','phiStart','phiLength','thetaStart','thetaLength'],
 TorusGeometry:['radius','tube','radialSegments','tubularSegments','arc'],
 LatheGeometry:['points','segments','phiStart','phiLength'],
 ExtrudeGeometry:['shapes','options'],TubeGeometry:['path','tubularSegments','radius','radialSegments','closed'],
 PlaneGeometry:['width','height','widthSegments','heightSegments'],CircleGeometry:['radius','segments','thetaStart','thetaLength'],
 RingGeometry:['innerRadius','outerRadius','thetaSegments','phiSegments','thetaStart','thetaLength']
};
export function geometryFromRecipe(type,parameters,custom){if(custom){const g=perforatedShellGeometry(custom);if(custom.matrix)g.applyMatrix4(new T.Matrix4().fromArray(custom.matrix));return g;}const keys=argumentsByType[type];return keys&&parameters?new T[type](...keys.map(k=>parameters[k])):null;}
export function recipeIsExact(geometry){
 let generated;try{generated=geometryFromRecipe(geometry.type,geometry.parameters,geometry.userData.preparedShell);}catch{return false;}if(!generated)return false;
 const same=(a,b)=>{if(!a||!b)return a===b;if(a.itemSize!==b.itemSize||a.normalized!==b.normalized||a.array.constructor!==b.array.constructor||a.array.byteLength!==b.array.byteLength)return false;const aa=new Uint8Array(a.array.buffer,a.array.byteOffset,a.array.byteLength),bb=new Uint8Array(b.array.buffer,b.array.byteOffset,b.array.byteLength);for(let i=0;i<aa.length;i++)if(aa[i]!==bb[i])return false;return true;};
 const result=JSON.stringify(Object.keys(geometry.attributes))===JSON.stringify(Object.keys(generated.attributes))&&same(geometry.index,generated.index)&&Object.keys(geometry.attributes).every(k=>same(geometry.attributes[k],generated.attributes[k]));generated.dispose();return result;
}
