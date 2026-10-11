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

// A single hydraulic compartment has one remote trunk. Local branches may join only that trunk or another local branch.
// Distinct chemistry networks remain separated in space, including at their source downcomers.
// V352: branches no longer all run to the one hub on top of each other. They form a tree: the intake nearest the hub runs to it, and every other intake
// joins the nearest point of the pipes already placed (a tee) over the shortest route to the hub. Inverts follow the network distance to the hub, so a branch
// meets the pipe it joins at that pipe's own invert.
const planLen=path=>path.slice(1).reduce((n,p,i)=>n+Math.hypot(p[0]-path[i][0],p[2]-path[i][2]),0);
// The plan without its last `cut` metres (the joint itself is allowed to be close).
function trimEnd(plan,cut){const out=[plan[0]];let left=planLen(plan)-cut;for(let i=1;i<plan.length&&left>1e-9;i++){const a=plan[i-1],b=plan[i],L=Math.hypot(b[0]-a[0],b[2]-a[2]);if(L<=left){out.push(b);left-=L;}else{out.push([a[0]+(b[0]-a[0])*left/L,0,a[2]+(b[2]-a[2])*left/L]);left=0;}}return out;}
const planDistance=(A,B)=>{let d=Infinity;for(let i=1;i<A.length;i++)for(let j=1;j<B.length;j++)d=Math.min(d,segmentDistance([A[i-1][0],0,A[i-1][2]],[A[i][0],0,A[i][2]],[B[j-1][0],0,B[j-1][2]],[B[j][0],0,B[j][2]]));return d;};
// Nearest point of a plan to q that is a usable tee: at least `margin` from the plan's own vertices (its intake, bends and hub end).
function nearestJoin(plan,q,margin=.5){let best=null,run=0;for(let i=1;i<plan.length;i++){const a=plan[i-1],b=plan[i],dx=b[0]-a[0],dz=b[2]-a[2],L=Math.hypot(dx,dz);if(L>2*margin){const lo=margin/L,hi=1-margin/L;let u=((q[0]-a[0])*dx+(q[2]-a[2])*dz)/(L*L);u=Math.max(lo,Math.min(hi,u));const p=[a[0]+dx*u,0,a[2]+dz*u],d=Math.hypot(q[0]-p[0],q[2]-p[2]);if(!best||d<best.d)best={p,d,seg:i,from:run+u*L};}run+=L;}return best;}
export function captureDrainNetwork(intakes,target,obstacles,previous,slope,clearance=.25){
 const source=[...intakes].sort((a,b)=>a[2]-b[2])[0],hub=[source[0],0,source[2]],trunk=planSpillRoute(hub,target,obstacles);
 const order=intakes.map((p,j)=>j).sort((a,b)=>Math.hypot(intakes[a][0]-hub[0],intakes[a][2]-hub[2])-Math.hypot(intakes[b][0]-hub[0],intakes[b][2]-hub[2]));
 const pipes=new Array(intakes.length),placed=[];
 for(const j of order){
  const start=intakes[j];
  // Every branch runs to the hub unless its route would lie on top of one already placed (swept pipes of radius 0.10 m closer than 0.45 m away from the joint); then it tees into the nearest of those.
  const clearOf=plan=>placed.every(P=>planDistance(trimEnd(plan,.45),trimEnd(P.plan,.45))>=.45);
  let chosen=null;const hubPlan=planSpillRoute(start,hub,obstacles);
  if(!placed.length||clearOf(hubPlan))chosen={plan:hubPlan,q:hub,D:0,pipe:null,at:null};
  else{let best=null;
   for(const P of placed){const hit=nearestJoin(P.plan,start);if(!hit)continue;let plan;try{plan=planSpillRoute(start,hit.p,obstacles);}catch(e){continue;}
    // A tee must be a real junction: the last leg may not run within 45 degrees of the pipe it joins.
    const a=P.plan[hit.seg-1],b=P.plan[hit.seg],last=plan.at(-2),end=plan.at(-1),d1=[b[0]-a[0],b[2]-a[2]],d2=[end[0]-last[0],end[2]-last[2]],c=Math.abs(d1[0]*d2[0]+d1[1]*d2[1])/(Math.hypot(...d1)*Math.hypot(...d2)||1);if(c>.7071)continue;
    if(!placed.every(Q=>Q===P||planDistance(trimEnd(plan,.45),trimEnd(Q.plan,.45))>=.45))continue;
    const cost=planLen(plan);if(!best||cost<best.cost)best={plan,q:hit.p,D:P.endD+(planLen(P.plan)-hit.from),pipe:P,at:hit,cost};}
   chosen=best||{plan:hubPlan,q:hub,D:0,pipe:null,at:null};}
  const P={j,plan:chosen.plan,endD:chosen.D,joins:chosen.pipe};pipes[j]=P;placed.push(P);
  if(chosen.pipe)(chosen.pipe.nodes??=[]).push({q:chosen.q,seg:chosen.at.seg,from:chosen.at.from});
 }
 for(const P of placed)if(P.nodes){const seen=[];for(const n of P.nodes.sort((a,b)=>b.from-a.from)){if(seen.some(m=>Math.hypot(m[0]-n.q[0],m[2]-n.q[2])<1e-6))continue;seen.push(n.q);const k=P.plan.findIndex((p,i)=>i&&(()=>{const a=P.plan[i-1];return Math.hypot(n.q[0]-a[0],n.q[2]-a[2])+Math.hypot(n.q[0]-p[0],n.q[2]-p[2])-Math.hypot(p[0]-a[0],p[2]-a[2])<1e-6;})());if(k>0&&Math.hypot(n.q[0]-P.plan[k][0],n.q[2]-P.plan[k][2])>1e-6&&Math.hypot(n.q[0]-P.plan[k-1][0],n.q[2]-P.plan[k-1][2])>1e-6)P.plan.splice(k,0,n.q);}}
 const maxD=Math.max(...placed.map(P=>P.endD+planLen(P.plan)));
 for(let attempt=0;attempt<100;attempt++){
  const top=-.4-attempt*.15,hubY=top-maxD*slope;
  const branches=intakes.map((start,j)=>{const P=pipes[j],n=P.plan.length,D=new Array(n);D[n-1]=P.endD;for(let i=n-2;i>=0;i--)D[i]=D[i+1]+Math.hypot(P.plan[i+1][0]-P.plan[i][0],P.plan[i+1][2]-P.plan[i][2]);
   const path=[start,...P.plan.map((p,i)=>[p[0],hubY+slope*D[i],p[2]])];return path.filter((p,i)=>!i||Math.hypot(...p.map((v,k)=>v-path[i-1][k]))>1e-7);});
  let distance=0;const main=trunk.map((p,i)=>{if(i)distance+=Math.hypot(p[0]-trunk[i-1][0],p[2]-trunk[i-1][2]);return [p[0],hubY-distance*slope,p[2]];});
  const network=[...branches,main];let clash=false;
  for(const path of network){for(const other of previous){for(let i=1;i<path.length&&!clash;i++)for(let j=1;j<other.length;j++)if(segmentDistance(path[i-1],path[i],other[j-1],other[j])<clearance){clash=true;break;}if(clash)break;}if(clash)break;}
  if(!clash)return {branches,main,hub:[hub[0],hubY,hub[2]]};
 }
 throw Error('Cannot separate local capture network at '+JSON.stringify(source));
}
