import {routeCrossings,emergencyWalkReview} from './safety-route-selection.js';
import {EMERGENCY_AREA_SCOPE} from './emergency-task-basis.js';
import * as T from './vendor/three.module.js';
import {componentEnvelope,componentIntersectsBox} from './access-review.js';
import {fireReservedZones} from './fire-safety-review.js';
import {inspectWalkways,walkwayGraph,shortestWalk} from './walkway-review.js';
import {EMERGENCY_BASIS,emergencyDistanceScreen} from './emergency-station-basis.js';
const V=p=>new T.Vector3(...p),B=v=>new T.Box3(V(v.min),V(v.max)),volume=b=>({min:b.min.toArray(),max:b.max.toArray()});

export function emergencyOperatingVolume(s){
 const matrix=new T.Matrix4().compose(V([s.x,0,s.z]),new T.Quaternion().setFromAxisAngle(V([0,1,0]),s.yaw||0),V([1,1,1]));
 return volume(B({min:[-.6,.035,.65],max:[.6,2.335,1.85]}).applyMatrix4(matrix));
}
export function inspectEmergencyStations(model){
 const stations=model.containment?.emergencyStations||[],w=model.walkways;
 const walkReview=w?inspectWalkways(model):null,graph=w?walkwayGraph(w,walkReview):null;
 const obstacles=model.parts.filter(p=>!p.floorAllocationLegacy&&p.system!=='internal').map(p=>({p,allowance:p.system==='pipe'?(p.insulationThickness??.05):0})).map(o=>({...o,box:componentEnvelope(o.p,o.allowance)}));
 const zones=fireReservedZones(model),results=stations.map(s=>{
  const own=new Set(s.partIds),stationObstacles=obstacles.filter(o=>own.has(o.p.id)),body=new T.Box3();for(const o of stationObstacles)body.union(o.box);
  if(body.isEmpty())body.set(V([s.x-.55,.035,s.z-.25]),V([s.x+.3,2.3,s.z+.85]));
  // A visual reservation only. Own washing fixtures occupy the operating zone;
  // supplier clearances and movement to the actuator are assessed separately.
  const operating=emergencyOperatingVolume(s),findings=[];
  for(const o of obstacles){if(own.has(o.p.id)||o.box.max.y<=.035||o.box.min.y>=2.335)continue;
   for(const [kind,target]of[['station',body],['operating',B(operating)]])if(o.box.intersectsBox(target)&&componentIntersectsBox(o.p,target,o.allowance,o.box))findings.push({kind,partId:o.p.id,name:o.p.name});
  }
  for(const z of zones.filter(z=>['vehicle','chemical-containment','utility','removal','maintenance'].includes(z.kind)))for(const [kind,target]of[['station',body],['operating',B(operating)]])if(target.intersectsBox(B(z)))findings.push({kind:kind+'-'+z.kind,name:z.id});
  const legacy=[];for(const z of (model.access?.zones||[]).filter(z=>z.kind==='pedestrian'&&!z.id.startsWith('WALKWAY-')))for(const o of stationObstacles)if(componentIntersectsBox(o.p,B(z),0,o.box))legacy.push({zone:z.id,name:o.p.name});
  const d=w?.destinations.find(d=>d.id===s.tag),connected=!!(d?.walkPoint&&graph?.nodes.has(graph.key(d.walkPoint)));
  return {tag:s.tag,areaId:s.areaId,body:volume(body),operating,findings,legacyConflicts:legacy,geometryClear:!findings.length,approachConnected:connected,walkPoint:connected?d.walkPoint:null,
   finalGapM:connected?Math.hypot(s.standing[0]-d.walkPoint[0],s.standing[2]-d.walkPoint[1]):null,
   activationVerified:false,supplyVerified:false,inspectionRecorded:false,complianceVerified:false};
 });
 return {revision:EMERGENCY_BASIS.revision,stations:results,connected:results.filter(s=>s.approachConnected).length,total:results.length,walkReview,complianceVerified:false};
}

export function calculateEmergencyAccess(model,review,tag){
 const w=model.walkways,station=review.stations.find(s=>s.tag===tag);if(!w||!station)return [];
 const graph=walkwayGraph(w,review.walkReview);
 return w.destinations.filter(d=>['operating','local-access'].includes(d.kind)).map(d=>{
  const point=d.walkPoint||d.point,route=station.approachConnected?shortestWalk(graph,point,station.walkPoint):null;
  const crossings=route? w.crossings.filter(c=>route.path.some((p,i)=>{if(!i)return false;const a=route.path[i-1];return Math.max(a[0],p[0])>=c.rect[0]&&Math.min(a[0],p[0])<=c.rect[2]&&Math.max(a[1],p[1])>=c.rect[1]&&Math.min(a[1],p[1])<=c.rect[3];})).map(c=>c.id):[];
  return {id:d.id,label:d.label,point:[point[0],.035,point[1]],declaredPoint:d.point,station:tag,distance:route?.distance??null,path:route?.path.map(p=>[p[0],.035,p[1]])||null,crossings,
   finalGapM:station.finalGapM,routeScope:'Checked grade path to the station approach. Final movement and actual exposure point are unverified.',
   responseTimeVerified:false,exposurePointVerified:false,complianceVerified:false};
 });
}
export function describeEmergencyDistance(point,risk){
 const total=point?.completeDistanceM??point?.distance,result=emergencyDistanceScreen(total,risk);if(!point?.path)return 'No checked walking connection to this station approach. No route or response-time credit.';
 const distance=point.distance.toFixed(1),gap=point.finalGapM.toFixed(2),base=`${total.toFixed(1)} m including ${distance} m on the checked walkway, ${(point.originGapM||0).toFixed(2)} m at the work position and ${gap} m at the station. Both end approaches and activation remain unverified.`;
 if(result.limitMetres===null)return base+' Select a risk assumption to compare the distance limit. Actual exposure-point coverage remains unverified.';
 const comparison=result.distanceWithinLimit?'Modelled distance is within':'Modelled distance exceeds';
 return base+` ${comparison} the ${result.limitMetres} m screening limit. Required walking time: ≤ ${result.limitSeconds} s; actual time unverified. No compliance credit.`;
}

export function calculateEmergencyCoverage(model,review,exposures=[]){
 const w=model.walkways,graph=walkwayGraph(w,emergencyWalkReview(review.walkReview));
 const destinations=w.destinations.filter(d=>['operating','local-access','emergency-task'].includes(d.kind));
 for(const e of exposures)if(!destinations.some(d=>d.id===e.id))destinations.push({...e,walkPoint:null,kind:'unconnected-task'});
 const rows=destinations.map(d=>{
  const exposure=exposures.find(e=>e.id===d.id),elevationM=exposure?.elevationM||0,origin=d.walkPoint||d.point,originConnected=!!d.walkPoint&&elevationM===0;
  const originGapM=originConnected?Math.hypot(origin[0]-d.point[0],origin[1]-d.point[1]):null;
  const candidates=review.stations.map(s=>{
   const route=originConnected&&s.approachConnected?shortestWalk(graph,origin,s.walkPoint):null;
   const crossings=routeCrossings(w,route?.path),conflict=!s.geometryClear||s.legacyConflicts.length>0;
   const usable=!!route&&!conflict&&!crossings.length;
   return {id:d.id,tag:s.tag,station:s.tag,label:d.label,point:[origin[0],.035,origin[1]],distance:usable?route.distance:null,path:usable?route.path.map(p=>[p[0],.035,p[1]]):null,finalGapM:s.finalGapM,
    originGapM,completeDistanceM:usable?originGapM+route.distance+s.finalGapM:null,crossings,reason:elevationM>0?'Same-level access unresolved':!originConnected?'Work-position access unresolved':conflict?'Station-space conflict':crossings.length?'Traffic crossing review required':'No checked connection',
    activationVerified:false,responseTimeVerified:false,exposurePointVerified:false,supplyVerified:false,complianceVerified:false};
  });
  // Include the displayed final approach in comparisons between stations.
  candidates.sort((a,b)=>(Number(!a.path)-Number(!b.path))||((a.completeDistanceM??Infinity)-(b.completeDistanceM??Infinity))||a.tag.localeCompare(b.tag));
  const nearest=candidates.find(c=>c.path),area=exposure?.area||d.area||({wastewater:'A-1000',reclaimed:'A-2000',washing:'A-400',thermal:'A-700',drying:'A-600'}[d.route]);return {id:d.id,label:d.label,area,elevationM,point:[origin[0],elevationM+.035,origin[1]],candidates,nearest};
 });
 const exposureRows=exposures.map(e=>{const row=rows.find(r=>r.id===e.id),nearest=row?.nearest,limit=emergencyDistanceScreen(nearest?.completeDistanceM,e.riskAssumption);
  return {...e,nearest:nearest?{tag:nearest.tag,checkedDistanceM:nearest.distance,originGapM:nearest.originGapM,finalGapM:nearest.finalGapM,completeDistanceM:nearest.completeDistanceM}:null,
   status:e.elevationM>0?'elevated-gap':!nearest?'access-gap':limit.distanceWithinLimit?'verification-pending':'distance-gap',distanceLimitM:limit.limitMetres,timeLimitS:limit.limitSeconds,complianceVerified:false};
 });
 const areas=EMERGENCY_AREA_SCOPE.map(a=>{const tasks=exposureRows.filter(e=>e.area===a.area);return {...a,stations:review.stations.filter(s=>s.areaId===a.area).length,tasks:tasks.length,withinDistanceScreen:tasks.filter(e=>e.status==='verification-pending').length,accessGaps:tasks.filter(e=>e.status==='access-gap').length,distanceGaps:tasks.filter(e=>e.status==='distance-gap').length,elevatedGaps:tasks.filter(e=>e.status==='elevated-gap').length,status:'assessment-incomplete'};});
 return {rows,exposures:exposureRows,total:exposureRows.length,withinDistanceScreen:exposureRows.filter(e=>e.status==='verification-pending').length,
  areas,gradeTotal:exposureRows.filter(e=>!e.elevationM).length,elevatedGaps:exposureRows.filter(e=>e.status==='elevated-gap').length,accessGaps:exposureRows.filter(e=>e.status==='access-gap').length,distanceGaps:exposureRows.filter(e=>e.status==='distance-gap').length,
  exposureRegisterApproved:false,elevatedPlatformsVerified:false,simultaneousCapacityVerified:false,complianceVerified:false};
}
