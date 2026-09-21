import {floorRegion} from './floor-geometry.js';
export const formatArea=m2=>`${m2.toLocaleString('en-CA',{maximumFractionDigits:2})} m² · ${(m2/0.09290304).toLocaleString('en-CA',{maximumFractionDigits:2})} ft²`;
export function polygonArea(points){
 if(points.length<3)return {valid:false,reason:'Add at least three points.'};
 if(points.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v))))return {valid:false,reason:'Enter valid X and Z coordinates.'};
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const on=(a,b,p)=>Math.abs(cross(a,b,p))<1e-8&&p[0]>=Math.min(a[0],b[0])-1e-8&&p[0]<=Math.max(a[0],b[0])+1e-8&&p[1]>=Math.min(a[1],b[1])-1e-8&&p[1]<=Math.max(a[1],b[1])+1e-8;
 const intersects=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
 const n=points.length;
 for(let i=0;i<n;i++){
  if(Math.hypot(points[i][0]-points[(i+1)%n][0],points[i][1]-points[(i+1)%n][1])<1e-7)return {valid:false,reason:'Remove duplicate neighbouring points.'};
  for(let j=i+1;j<n;j++)if(j!==i+1&&!(i===0&&j===n-1)&&intersects(points[i],points[(i+1)%n],points[j],points[(j+1)%n]))return {valid:false,reason:'Boundary crosses or touches itself. Move or undo a point.'};
 }
 let sum=0;const origin=points[0];for(let i=0;i<n;i++){const a=points[i],b=points[(i+1)%n];sum+=(a[0]-origin[0])*(b[1]-origin[1])-(b[0]-origin[0])*(a[1]-origin[1]);}
 const areaM2=Math.abs(sum)/2;if(areaM2<1e-8)return {valid:false,reason:'Boundary must enclose an area.'};
 return {valid:true,areaM2,bounds:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]};
}
export function wholePlantRegion(allocation){
 return floorRegion([...allocation.areas.flatMap(a=>a.polygons),...allocation.shared.map(s=>s.rect),...allocation.areas.flatMap(a=>[...a.retention,...a.satelliteCapture].map(r=>r.rect)),...(allocation.reservations||[]).flatMap(r=>r.tiles)]);
}
// Includes every gap inside one enclosing rectangle; never treats union area as building area.
export function buildingEnvelope(allocation,ids,margin=0){
 if(!Number.isFinite(margin)||margin<0)return {valid:false,reason:'Enter a non-negative perimeter allowance.'};
 const selected=allocation.areas.filter(a=>ids.includes(a.id));
 if(!selected.length)return {valid:false,reason:'Select the systems to include inside this proposed building.'};
 const rects=selected.flatMap(a=>a.polygons),r=rectangleEnvelope(rects);if(!r.bounds)return {valid:false,reason:'Selected systems have no defined boundary.'};
 const [x,z,xx,zz]=r.bounds,b=[x-margin,z-margin,xx+margin,zz+margin];
 return {...floorRegion([b]),valid:true,selectedIds:selected.map(a=>a.id),allocationM2:rectangleUnionArea(rects),margin};
}

export const wholePlantRects=a=>[...a.areas.flatMap(a=>a.polygons),...a.shared.map(s=>s.rect),...a.areas.flatMap(a=>[...a.retention,...a.satelliteCapture].map(r=>r.rect)),...(a.reservations||[]).flatMap(r=>r.tiles)];
export function rectangleEnvelope(rects){if(!rects.length)return floorRegion([]);return floorRegion([[Math.min(...rects.map(r=>r[0])),Math.min(...rects.map(r=>r[1])),Math.max(...rects.map(r=>r[2])),Math.max(...rects.map(r=>r[3]))]]);}
// Exact union area without materializing the Cartesian grid of small tiles.
export function rectangleUnionArea(rects){
 const xs=[...new Set(rects.flatMap(r=>[r[0],r[2]]))].sort((a,b)=>a-b);let area=0;
 for(let i=1;i<xs.length;i++){const left=xs[i-1],right=xs[i],intervals=rects.filter(r=>r[0]<right&&r[2]>left).map(r=>[r[1],r[3]]).sort((a,b)=>a[0]-b[0]);let end=-Infinity,length=0;for(const[a,b]of intervals){if(b>end){length+=b-Math.max(a,end);end=b;}}area+=(right-left)*length;}return area;
}
