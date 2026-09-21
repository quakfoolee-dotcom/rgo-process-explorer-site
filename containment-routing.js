// Shortest visible plan route around dedicated retention cells; all coordinates in metres.
export function segmentEntersRect(a,b,r){
 let lo=0,hi=1;
 for(const [axis,min,max]of [[0,r[0]+1e-7,r[2]-1e-7],[2,r[1]+1e-7,r[3]-1e-7]]){const d=b[axis]-a[axis];if(Math.abs(d)<1e-10){if(a[axis]<=min||a[axis]>=max)return false;continue;}const u=(min-a[axis])/d,v=(max-a[axis])/d;lo=Math.max(lo,Math.min(u,v));hi=Math.min(hi,Math.max(u,v));if(hi<=lo)return false;}return hi>0&&lo<1;
}
export function planSpillRoute(start,end,obstacles){
 const clear=(a,b)=>!obstacles.some(r=>segmentEntersRect(a,b,r));if(clear(start,end))return [start,end];
 const points=[start,end,...obstacles.flatMap(r=>[[r[0]-.01,0,r[1]-.01],[r[0]-.01,0,r[3]+.01],[r[2]+.01,0,r[1]-.01],[r[2]+.01,0,r[3]+.01]])],n=points.length,dist=Array(n).fill(Infinity),prev=Array(n).fill(-1),seen=new Set();dist[0]=0;
 for(let count=0;count<n;count++){let u=-1;for(let j=0;j<n;j++)if(!seen.has(j)&&(u<0||dist[j]<dist[u]))u=j;if(u===1)break;if(u<0||!Number.isFinite(dist[u]))throw Error('No reserved spill route around retention foundations');seen.add(u);for(let v=0;v<n;v++){if(v===u||seen.has(v))continue;const d=Math.hypot(points[v][0]-points[u][0],points[v][2]-points[u][2]);if(dist[u]+d>=dist[v]||!clear(points[u],points[v]))continue;dist[v]=dist[u]+d;prev[v]=u;}}
 if(prev[1]<0)throw Error('No independent retention inlet route');const result=[];for(let u=1;u>=0;u=prev[u]){result.unshift(points[u]);if(u===0)break;}return result;
}
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),sub=(a,b)=>a.map((v,i)=>v-b[i]),clamp=x=>Math.max(0,Math.min(1,x));
export function segmentDistance(p1,q1,p2,q2){
 const d1=sub(q1,p1),d2=sub(q2,p2),r=sub(p1,p2),a=dot(d1,d1),e=dot(d2,d2),f=dot(d2,r);let s=0,t=0;
 if(a<1e-12&&e<1e-12)return Math.hypot(...r);
 if(a<1e-12)t=clamp(f/e);else{const c=dot(d1,r);if(e<1e-12)s=clamp(-c/a);else{const b=dot(d1,d2),den=a*e-b*b;s=den?clamp((b*f-c*e)/den):0;t=(b*s+f)/e;if(t<0){t=0;s=clamp(-c/a);}else if(t>1){t=1;s=clamp((b-c)/a);}}}
 return Math.hypot(...r.map((v,i)=>v+s*d1[i]-t*d2[i]));
}
export function gradeSpillRoute(intake,plan,previous,slope,clearance=.25){
 for(let attempt=0;attempt<100;attempt++){
  const y0=-.40-attempt*.15;let distance=0;const graded=plan.map((p,i)=>{if(i)distance+=Math.hypot(p[0]-plan[i-1][0],p[2]-plan[i-1][2]);return [p[0],y0-distance*slope,p[2]];});const path=[intake,...graded];
  let clash=false;for(const other of previous){for(let i=1;i<path.length&&!clash;i++)for(let j=1;j<other.length;j++)if(segmentDistance(path[i-1],path[i],other[j-1],other[j])<clearance){clash=true;break;}if(clash)break;}
  if(!clash)return path;
 }
 throw Error('Unable to assign independent gravity-drain elevation at '+JSON.stringify(intake));
}

// A single hydraulic compartment has one remote trunk. Local branches may join only that trunk.
// Distinct chemistry networks remain separated in space, including at their source downcomers.
export function captureDrainNetwork(intakes,target,obstacles,previous,slope,clearance=.25){
 const source=[...intakes].sort((a,b)=>a[2]-b[2])[0],hub=[source[0],0,source[2]],plans=intakes.map(start=>planSpillRoute(start,hub,obstacles)),trunk=planSpillRoute(hub,target,obstacles);
 const length=path=>path.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-path[i][0],p[2]-path[i][2]),0),maxLength=Math.max(...plans.map(length));
 for(let attempt=0;attempt<100;attempt++){
  const top=-.4-attempt*.15,hubY=top-maxLength*slope;
  const branches=plans.map((plan,j)=>{let d=0;const path=[intakes[j],...plan.map((p,i)=>{if(i)d+=Math.hypot(p[0]-plan[i-1][0],p[2]-plan[i-1][2]);return [p[0],top-d*slope,p[2]];})];path.push([hub[0],hubY,hub[2]]);return path.filter((p,i)=>!i||Math.hypot(...p.map((v,k)=>v-path[i-1][k]))>1e-7);});
  let distance=0;const main=trunk.map((p,i)=>{if(i)distance+=Math.hypot(p[0]-trunk[i-1][0],p[2]-trunk[i-1][2]);return [p[0],hubY-distance*slope,p[2]];});
  const network=[...branches,main];let clash=false;
  for(const path of network){for(const other of previous){for(let i=1;i<path.length&&!clash;i++)for(let j=1;j<other.length;j++)if(segmentDistance(path[i-1],path[i],other[j-1],other[j])<clearance){clash=true;break;}if(clash)break;}if(clash)break;}
  if(!clash)return {branches,main,hub:[hub[0],hubY,hub[2]]};
 }
 throw Error('Cannot separate local capture network at '+JSON.stringify(source));
}
