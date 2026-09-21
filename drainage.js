// Geometric screening only: no claim about trapped equipment inventory or two-phase hydraulics.
export function inspectGravityPath(points,tolerance=1e-7){
 let rise=0,drop=0;for(let i=1;i<points.length;i++){const dy=points[i][1]-points[i-1][1];rise=Math.max(rise,dy);drop-=dy;}
 return {passes:points.length>1&&points.flat().every(Number.isFinite)&&rise<=tolerance&&drop>tolerance,maxRise:rise,totalFall:drop};
}
export function drainRegister(model){return [...model.separations.drains,...model.separations.tff.drains,...model.sonication.drains,...model.sprayDrying.drains,...model.furnace.drains,...model.doping.drains];}
export function inspectDrain(model,d){
 const labels=[d.route,d.tag+' low takeoff'],routes=model.routes.filter(r=>labels.includes(r.label)),paths=routes.flatMap(r=>r.edgeIndices.map(i=>model.edges[i].path));
 const elevations=inspectGravityPath(d.points),rise=Math.max(0,...paths.flatMap(p=>p.slice(1).map((x,i)=>x[1]-p[i][1])));
 return {...elevations,passes:elevations.passes&&routes.length>0&&rise<=1e-7,modeledRise:rise,checkedRoutes:routes.map(r=>r.label),internalDrainability:'Vendor confirmation required'};
}
