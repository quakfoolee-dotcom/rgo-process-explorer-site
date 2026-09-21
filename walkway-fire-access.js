import {rankSafetyRoutes,routeCrossings,emergencyWalkReview} from './safety-route-selection.js';
import {walkwayGraph,shortestWalk,inspectWalkways} from './walkway-review.js';
export function walkwayFireAccess(model,fireReview){
 const w=model.walkways,review=inspectWalkways(model),graph=walkwayGraph(w,emergencyWalkReview(review)),stations=model.fireSafety.stations.filter(s=>fireReview.stations.find(r=>r.tag===s.tag)?.geometryClear);
 const stationConnections=model.fireSafety.stations.map(s=>({tag:s.tag,connected:stations.includes(s)&&graph.nodes.has(graph.key([s.retrieval[0],s.retrieval[2]]))}));
 const checkpoints=w.destinations.filter(d=>['operating','local-access'].includes(d.kind)).map(d=>{
  const point=d.walkPoint||d.point;
  const candidates=rankSafetyRoutes(model.fireSafety.stations.map(s=>{const connection=stationConnections.find(c=>c.tag===s.tag),route=connection.connected?shortestWalk(graph,point,[s.retrieval[0],s.retrieval[2]]):null;
   const crossings=routeCrossings(w,route?.path),usable=!!route&&!crossings.length;
   return {tag:s.tag,station:s.tag,distance:usable?route.distance:null,path:usable?route.path.map(p=>[p[0],.035,p[1]]):null,crossings,reason:crossings.length?'Traffic crossing review required':!stations.includes(s)?'Station-space conflict':'No checked connection',suitabilityVerified:false,complianceVerified:false};}));
  const best=candidates.find(c=>c.path);
  return {id:d.id,label:d.label,routeId:d.route,point:[point[0],.035,point[1]],originalPoint:d.original,station:best?.tag,distance:best?.distance,path:best?.path,candidates,status:best?'Shortest modelled route · agent / rating unverified':'No screened connection',codeCoverageVerified:false};
 });
 return {revision:w.revision,gridStepM:null,personRadiusM:.6,headroomM:2.3,aisleNodes:graph.nodes.size,stationConnections,checkpoints,connected:checkpoints.filter(p=>p.station).length,total:checkpoints.length,codeCoverageVerified:false,method:'Exact connected centreline graph on proposed 1.2 m clear walkways with 2.3 m headroom. Actual component envelopes, insulation and containment are checked independently of display. Designated vehicle crossings are excluded from emergency route ranking pending an approved traffic plan. Geometric distances do not establish agent suitability, extinguisher ratings, evacuation or code coverage.'};
}
