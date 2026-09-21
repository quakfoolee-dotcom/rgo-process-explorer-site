import * as T from './vendor/three.module.js';
import {componentEnvelope,componentIntersectsBox} from './access-review.js';
import {FIRE_BASIS} from './fire-safety-basis.js';
import {firePointVolumes} from './fire-safety.js';
import {TRANSPORT_ZONES} from './transport-layout.js';
const box=v=>new T.Box3(new T.Vector3(...v.min),new T.Vector3(...v.max));
export function fireReservedZones(model){return [...(model.access?.zones||[]).filter(z=>z.kind!=='vehicle'),...TRANSPORT_ZONES,...(model.containment?.cells||[]).flatMap(c=>[...c.patches,[c.storage.min[0]-.21,c.storage.min[2]-.21,c.storage.max[0]+.21,c.storage.max[2]+.21]].map((r,i)=>({id:c.tag+'-containment-'+i,kind:'chemical-containment',min:[r[0],.02,r[1]],max:[r[2],2.2,r[3]]})))];}
export function fireObstacles(model){return model.parts.filter(p=>!p.firePoint&&p.system!=='internal'&&!p.floorAllocationLegacy).map(p=>({p,bounds:componentEnvelope(p,p.system==='pipe'?(p.insulationThickness??.05):0)}));}
export function checkFireLocation(station,obstacles,zones=[]){
 const volumes=firePointVolumes(station),body=box(volumes.body),approach=box(volumes.approach),findings=[];
 for(const {p,bounds} of obstacles){
  if(bounds.max.y<=.03||bounds.min.y>=approach.max.y+.05)continue;
  for(const [kind,target]of[['station',body],['retrieval',approach]])if(componentIntersectsBox(p,target,p.system==='pipe'?(p.insulationThickness??.05):0,bounds))findings.push({kind,partId:p.id,name:p.name});
 }
 for(const z of zones.filter(z=>z.kind!=='emergency')){
  const reserved=box(z);if(body.intersectsBox(reserved))findings.push({kind:'reserved-'+z.kind,name:z.id});
  if(['vehicle','removal','maintenance','standing','airflow','utility','chemical-containment'].includes(z.kind)&&approach.intersectsBox(reserved))findings.push({kind:'retrieval-'+z.kind,name:z.id});
 }
 return {tag:station.tag,position:station.position,...volumes,findings,geometryClear:!findings.length};
}
export function inspectFireSafety(model){
 const fire=model.fireSafety;if(!fire)return null;
 const obstacles=fireObstacles(model),zones=fireReservedZones(model);
 const stations=fire.stations.map(s=>checkFireLocation(s,obstacles,zones));
 for(let i=0;i<stations.length;i++)for(let j=0;j<stations.length;j++)if(i!==j)for(const [kind,target]of[['station',stations[i].body],['retrieval',stations[i].approach]])if(box(target).intersectsBox(box(stations[j].body))){stations[i].findings.push({kind,name:stations[j].tag});stations[i].geometryClear=false;}
 return {revision:FIRE_BASIS.revision,stations,geometryClear:stations.every(s=>s.geometryClear),checkedParts:obstacles.length,qualified:false,scope:FIRE_BASIS.coverageNote};
}
