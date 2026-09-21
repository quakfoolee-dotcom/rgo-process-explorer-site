import * as T from './vendor/three.module.js';

export const MODEL_UNITS = Object.freeze({metresPerUnit:1,revision:'plant-30',label:'Model dimension'});
const vec=p=>new T.Vector3(...p);
export function formatDimension(metres,{fraction=8,mmDecimals=0}={}){
 if(!Number.isFinite(metres)||metres<0)return 'Unavailable';
 const ticks=Math.round(metres/.0254*fraction),feet=Math.floor(ticks/(12*fraction)),rest=ticks-feet*12*fraction,inch=Math.floor(rest/fraction),numerator=rest%fraction;
 const gcd=(a,b)=>b?gcd(b,a%b):a,d=gcd(numerator,fraction);
 return `${feet}' ${inch}${numerator?' '+numerator/d+'/'+fraction/d:''}" [${(metres*1000).toLocaleString('en-US',{minimumFractionDigits:mmDecimals,maximumFractionDigits:mmDecimals})} mm]`;
}
export function pointDimensions(points){
 if(points.length<2)return null;
 const a=vec(points[0]),b=vec(points.at(-1)),delta=b.clone().sub(a),scale=MODEL_UNITS.metresPerUnit;
 return {straight:delta.length()*scale,horizontal:Math.hypot(delta.x,delta.z)*scale,vertical:Math.abs(delta.y)*scale,dx:delta.x*scale,dy:delta.y*scale,dz:delta.z*scale,total:points.slice(1).reduce((n,p,i)=>n+vec(p).distanceTo(vec(points[i])),0)*scale};
}
export function localAnchor(part,point,kind='surface'){
 const matrix=new T.Matrix4().compose(part.position,part.quaternion,part.scale);
 return {partCode:part.code,partName:part.name,equipmentId:part.reactor,local:vec(point).applyMatrix4(matrix.invert()).toArray(),kind,revision:MODEL_UNITS.revision};
}
export function resolveAnchor(anchor,partByCode){
 if(anchor.fixed)return {point:anchor.fixed,valid:true};
 const p=partByCode.get(anchor.partCode);
 if(!p||p.name!==anchor.partName||anchor.revision!==MODEL_UNITS.revision)return {valid:false,reason:'Geometry changed — select this endpoint again.'};
 return {valid:true,part:p,point:vec(anchor.local).applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale)).toArray()};
}
export function edgeCenterline(edge,part){return edge.path||part?.centerline||[edge.a,edge.b];}
export function centerlineLength(points){return pointDimensions(points)?.total||0;}
const partIndexCache=new WeakMap();
function partIndex(model){let cached=partIndexCache.get(model);if(!cached||cached.parts!==model.parts||cached.count!==model.parts.length){cached={parts:model.parts,count:model.parts.length,index:new Map(model.parts.map(p=>[p.id,p]))};partIndexCache.set(model,cached);}return cached.index;}
export function routeDimension(model,route){
 const byId=partIndex(model),seen=new Set(),paths=[];let length=0;
 for(const index of route.edgeIndices||[]){if(seen.has(index))continue;seen.add(index);const e=model.edges[index],p=byId.get(e?.part);if(!e||e.transport&&e.transport!=='pipe')return {valid:false,reason:'Select external piping; equipment passage lengths are not pipe lengths.'};const path=edgeCenterline(e,p);paths.push(path);length+=centerlineLength(path);}
 return {valid:paths.length>0,length,paths,label:route.label,revision:MODEL_UNITS.revision};
}
export function closestOnPath(point,path){let best=null;for(let i=1;i<path.length;i++){const p=new T.Line3(vec(path[i-1]),vec(path[i])).closestPointToPoint(vec(point),true,new T.Vector3()),distance=p.distanceTo(vec(point));if(!best||distance<best.distance)best={point:p.toArray(),distance};}return best;}

export function buildPipeMeasurementIndex(model){
 const routes=new Map(model.routes.map(r=>[r.id,r])),partRoutes=new Map();
 for(const r of model.routes)if(routeDimension(model,r).valid)for(const id of r.partIds)partRoutes.set(id,r.id);
 for(const [i,e] of model.edges.entries())if((!e.transport||e.transport==='pipe')&&!partRoutes.has(e.part)){
  const id='MEASURE-EDGE-'+i,r={id,label:(model.equipment?.[e.reactor]?.tag||'')+' · '+e.name,partIds:[e.part],edgeIndices:[i]};routes.set(id,r);partRoutes.set(e.part,id);
 }
 for(const v of model.valves||[]){const id=(v.partIds||[]).map(p=>partRoutes.get(p)).find(Boolean);if(id)for(const p of v.partIds)if(!partRoutes.has(p))partRoutes.set(p,id);}
 return {routes,partRoutes};
}
export function routesAreConnected(ids,routes,graph){
 const edges=new Set(ids.flatMap(id=>routes.get(id)?.edgeIndices||[]));if(!edges.size)return true;
 const seen=new Set([edges.values().next().value]),queue=[...seen];for(let i=0;i<queue.length;i++)for(const j of graph[queue[i]]||[])if(edges.has(j)&&!seen.has(j)){seen.add(j);queue.push(j);}return seen.size===edges.size;
}
