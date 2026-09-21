import * as T from './vendor/three.module.js';
// Exact shell aperture construction shared by model preparation and restoration.
export function perforatedShellGeometry({x,z,r,lo,hi,holes}){
  const pos=[],centres=holes.map(p=>Math.atan2(p.p[2]-z,p.p[0]-x));
  const delta=a=>Math.atan2(Math.sin(a),Math.cos(a));
  let seam=0,best=-Infinity;
  for(let j=0;j<96;j++){const candidate=j*Math.PI*2/96,score=Math.min(...holes.map((p,i)=>Math.abs(delta(candidate-centres[i]))-Math.asin(Math.min(.999,p.r*.78/(r-.035)))));if(score>best){best=score;seam=candidate;}}
  const origin=seam+Math.PI;
  for(const [rad,reverse] of [[r,false],[r-.035,true]]){
   const shape=new T.Shape();shape.moveTo(-Math.PI*rad,lo);shape.lineTo(Math.PI*rad,lo);shape.lineTo(Math.PI*rad,hi);shape.lineTo(-Math.PI*rad,hi);shape.closePath();
   holes.forEach((p,j)=>{const hole=new T.Path(),u=delta(centres[j]-origin)*rad,bore=p.r*.78;for(let i=0;i<96;i++){const t=-i*Math.PI*2/96,xx=u+rad*Math.asin(Math.max(-1,Math.min(1,bore*Math.cos(t)/rad))),yy=p.p[1]+bore*Math.sin(t);if(i===0)hole.moveTo(xx,yy);else hole.lineTo(xx,yy);}hole.closePath();shape.holes.push(hole);});
   const flat=new T.ShapeGeometry(shape,24),a=flat.attributes.position,index=flat.index.array;
   // Clip planar triangles into narrow angular strips before wrapping. This
   // bounds curvature error without exponentially splitting long thin triangles.
   function clip(poly,bound,keepGreater){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],ia=keepGreater?a[0]>=bound:a[0]<=bound,ib=keepGreater?b[0]>=bound:b[0]<=bound;if(ia)out.push(a);if(ia!==ib){const t=(bound-a[0])/(b[0]-a[0]);out.push([bound,a[1]+t*(b[1]-a[1])]);}}return out;}
   function tri(...vs){const step=rad*Math.PI*2/128,lo=Math.floor(Math.min(...vs.map(p=>p[0]))/step),hi=Math.floor(Math.max(...vs.map(p=>p[0]))/step);for(let k=lo;k<=hi;k++){const poly=clip(clip(vs,k*step,true),(k+1)*step,false);for(let j=1;j<poly.length-1;j++){const q=[poly[0],poly[j],poly[j+1]];for(const i of reverse?[2,1,0]:[0,1,2]){const v=q[i];pos.push(Math.cos(v[0]/rad+origin)*rad,v[1],Math.sin(v[0]/rad+origin)*rad);}}}}
   for(let i=0;i<index.length;i+=3)tri(...[0,1,2].map(j=>[a.getX(index[i+j]),a.getY(index[i+j])]));flat.dispose();
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;
 }
