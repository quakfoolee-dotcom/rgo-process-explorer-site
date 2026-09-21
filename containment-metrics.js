export function containmentMetrics(containment){
 const paths=containment.cells.flatMap(c=>c.gravityPaths),length=p=>p.slice(1).reduce((n,v,i)=>n+Math.hypot(...v.map((x,k)=>x-p[i][k])),0);
 return {civilBlocks:containment.civilBlocks.length,liquidCompartments:containment.cells.length,remoteTrunks:paths.filter(p=>p.remote).length,drainLengthM:paths.reduce((n,p)=>n+length(p.path),0),netStorageM3:containment.cells.reduce((n,c)=>n+c.netM3,0),deepestFloorM:Math.min(...containment.cells.map(c=>c.storage.min[1])),deepestFoundationM:Math.min(...containment.civilBlocks.map(b=>b.min[1])),costEstimate:null};
}
