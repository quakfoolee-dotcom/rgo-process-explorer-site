// Display dimensions only. Never infer a process bore from a valve casing or
// from the broad-phase edge radius used for geometry screening.
export function passageDisplayRadius(part){
 const g=part?.geometry,s=part?.scale;
 if(part?.mechanicalJoint?.boreRadius>0)return {radius:part.mechanicalJoint.boreRadius,basis:'modeled bore'};
 if(part?.system!=='pipe'||part.ports?.length!==2)return null;
 if(g?.type==='LatheGeometry'&&g.parameters?.points?.length&&Math.abs(Math.abs(s.x)-Math.abs(s.z))<1e-7){
  const radii=g.parameters.points.map(p=>p.x*Math.abs(s.x));
  if(radii.every(r=>r>0))return {radius:Math.min(...radii),basis:'modeled bore'};
 }
 if(g?.type==='TubeGeometry'&&g.parameters.radius>0){
  // Bend geometry defines an outer surface only. A conservative display proxy
  // keeps markers legible without presenting an invented hydraulic diameter.
  return {radius:g.parameters.radius*Math.min(Math.abs(s.x),Math.abs(s.y),Math.abs(s.z))*.45,basis:'display proxy; bend bore unresolved'};
 }
 return null;
}
export function annotateJourneyPassages(plan,parts){
 const byId=new Map(parts.map(p=>[p.id,p])),cache=new Map();
 for(const step of plan.steps)for(const path of step.paths){
  const known=path.segments.map(s=>{if(!cache.has(s.part))cache.set(s.part,passageDisplayRadius(byId.get(s.part)));return cache.get(s.part);});
  const before=[],after=[];let last=null;for(let i=0;i<known.length;i++){if(known[i])last=known[i];before[i]=last;}last=null;for(let i=known.length-1;i>=0;i--){if(known[i])last=known[i];after[i]=last;}
  path.segments.forEach((s,i)=>{const neighbors=[before[i],after[i]].filter(Boolean);const spec=known[i]||{radius:neighbors.length?Math.min(...neighbors.map(n=>n.radius)):.012,basis:'display proxy; device passage unresolved'};s.displayRadius=spec.radius;s.displayBasis=spec.basis;});
 }
 return plan;
}
export function journeyPathStation(path,fraction){
 if(!path.segments.length)return null;const distance=Math.max(0,Math.min(1,fraction))*path.length;
 const segment=path.segments.find(s=>s.end>=distance)||path.segments.at(-1),t=segment.length?(distance-segment.start)/segment.length:0;
 // At an elbow or reducer junction, use the smaller adjoining envelope.
 const index=path.segments.indexOf(segment),radius=Math.min(...path.segments.slice(Math.max(0,index-1),index+2).map(s=>s.displayRadius||.012));
 return {point:segment.a.map((v,k)=>v+(segment.b[k]-v)*t),radius,basis:segment.displayBasis};
}
export function journeyMarkerRadius(worldPixel,passageRadius,{overview=false,leading=false}={}){
 const pixels=worldPixel*(leading?3.5:2.2),cap=Math.max(1e-5,passageRadius)*.55;
 return overview?Math.max(.003,Math.min(.30,pixels)):Math.min(cap,Math.max(.001,pixels));
}
