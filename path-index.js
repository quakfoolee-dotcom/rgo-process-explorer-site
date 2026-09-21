// Spatial lookup for centreline contacts. Candidate pruning does not change the
// endpoint-on-path rule or its tolerance; pressure/valve logic remains separate.
export function pointSegmentDistanceSquared(p,a,b){
 const x=b[0]-a[0],y=b[1]-a[1],z=b[2]-a[2],length=x*x+y*y+z*z;
 const t=length?Math.max(0,Math.min(1,((p[0]-a[0])*x+(p[1]-a[1])*y+(p[2]-a[2])*z)/length)):0;
 const dx=p[0]-a[0]-t*x,dy=p[1]-a[1]-t*y,dz=p[2]-a[2]-t*z;
 return dx*dx+dy*dy+dz*dz;
}
export function createPathIndex(edges){
 // Degenerate paths have no path contact, matching the existing Line3 query.
 const segments=[];
 edges.forEach((e,edge)=>{const path=e.path||[e.a,e.b];if(path.some((p,i)=>i>0&&p.every((v,k)=>v===path[i-1][k])))return;for(let i=1;i<path.length;i++){const a=path[i-1],b=path[i];segments.push({edge,a,b,lo:a.map((v,k)=>Math.min(v,b[k])),hi:a.map((v,k)=>Math.max(v,b[k]))});}});
 function build(items){
  if(!items.length)return null;
  const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
  for(const s of items)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],s.lo[k]);hi[k]=Math.max(hi[k],s.hi[k]);}
  if(items.length<=12)return {lo,hi,items};
  const spans=hi.map((v,k)=>v-lo[k]),axis=spans.indexOf(Math.max(...spans));
  items.sort((a,b)=>a.lo[axis]+a.hi[axis]-b.lo[axis]-b.hi[axis]);
  const mid=items.length>>1;return {lo,hi,left:build(items.slice(0,mid)),right:build(items.slice(mid))};
 }
 const root=build(segments);
 return {at(point,tolerance=1e-5){
  const found=new Set(),queue=root?[root]:[],limit=tolerance*tolerance;
  while(queue.length){const n=queue.pop();if(point.some((v,k)=>v<n.lo[k]-tolerance||v>n.hi[k]+tolerance))continue;
   if(n.items){for(const s of n.items)if(!found.has(s.edge)&&pointSegmentDistanceSquared(point,s.a,s.b)<limit)found.add(s.edge);}
   else queue.push(n.left,n.right);
  }
  return [...found].sort((a,b)=>a-b);
 }};
}
