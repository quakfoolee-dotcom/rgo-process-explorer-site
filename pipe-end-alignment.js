// Give each known mating face a straight approach. A shared branch junction
// is handled separately: its several connected directions cannot define one axis.
export function alignPipeEnds(points,r,edges,T,branchPoints=[]){
 const V=p=>new T.Vector3(...p),clean=points.filter((p,i)=>!i||V(p).distanceTo(V(points[i-1]))>1e-8);
 if(clean.length<2)return clean;
 function approach(p,q){
  if(branchPoints.some(b=>V(b).distanceTo(V(p))<1e-6))return [];
  const candidates=[];
  for(const e of edges){if(e.internalTo||e.transport)continue;const path=e.path||[e.a,e.b];for(const [a,b] of [[0,1],[path.length-1,path.length-2]])if(V(path[a]).distanceTo(V(p))<1e-6)candidates.push(V(path[a]).sub(V(path[b])).normalize());}
  if(!candidates.length)return [];
  const axis=candidates[0];if(candidates.some(v=>v.dot(axis)<.99))return [];
  const toward=V(q).sub(V(p));if(toward.clone().normalize().dot(axis)>.999)return [];
  const distance=Math.max(.12,r*2),stub=V(p).addScaledVector(axis,distance);
  return [stub.toArray()];
 }
 const start=approach(clean[0],clean[1]),end=approach(clean.at(-1),clean.at(-2));
 return [clean[0],...start,...clean.slice(1,-1),...end.reverse(),clean.at(-1)].filter((p,i,a)=>!i||V(p).distanceTo(V(a[i-1]))>1e-8);
}
