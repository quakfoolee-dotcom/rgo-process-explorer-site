// Pipe marker placement following the ANSI/ASME A13.1-2023 summary: adjacent to valves, at changes of direction, on both sides of wall
// penetrations, and at 25 ft to 50 ft intervals on straight runs, sized from the outside pipe diameter. Pure data: no rendering here.
import {BUILDING_SHELL} from './building-shell.js';
import {markerSize} from './pipe-identification.js';
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],len=a=>Math.hypot(a[0],a[1],a[2]);
const unit=a=>{const l=len(a);return l>1e-9?[a[0]/l,a[1]/l,a[2]/l]:null;},dist=(a,b)=>len(sub(a,b));
const along=(a,d,t)=>[a[0]+d[0]*t,a[1]+d[1]*t,a[2]+d[2]*t];
const DRAWN_PIPE=new Set(['pipe','valve']);
export const MARKER_RULES={spacing:12,cornerDeg:45,straightDeg:10,valveGap:.3};
// Flow direction: the route's A → B definition, propagated along the connected edges from end A. Returns the edges with oriented paths.
export function orientEdges(route,edgesAll){
 const edges=(route.edgeIndices||[]).map(i=>edgesAll[i]).filter(e=>e?.path?.length>1),near=(p,q)=>dist(p,q)<.06,cell=p=>Math.round(p[0]*40)+','+Math.round(p[1]*40)+','+Math.round(p[2]*40);
 const flip=new Map();
 if(route.direction==='A → B'&&route.endpoints?.[0]&&edges.length){const A=route.endpoints[0],nodes=new Map();
  edges.forEach((e,k)=>{for(const end of [e.path[0],e.path.at(-1)])for(const dx of [-1,0,1])for(const dz of [-1,0,1]){const key=Math.round(end[0]*40+dx)+','+Math.round(end[1]*40)+','+Math.round(end[2]*40+dz);if(!nodes.has(key))nodes.set(key,new Set());nodes.get(key).add(k);}});
  const queue=[];edges.forEach((e,k)=>{if(near(e.path[0],A))queue.push([k,false]);else if(near(e.path.at(-1),A))queue.push([k,true]);});
  const seen=new Set();while(queue.length){const [k,rev]=queue.shift();if(seen.has(k))continue;seen.add(k);flip.set(k,rev);const e=edges[k],exit=rev?e.path[0]:e.path.at(-1);
   for(const n of nodes.get(cell(exit))||[]){if(seen.has(n))continue;const f=edges[n];if(near(f.path[0],exit))queue.push([n,false]);else if(near(f.path.at(-1),exit))queue.push([n,true]);}}}
 return edges.map((e,k)=>({edge:e,directed:flip.has(k),path:flip.get(k)?[...e.path].reverse():e.path}));
}
// Split a path into straight pieces (a run ends where the direction turns more than straightDeg from the run's first segment).
function straightPieces(path,straightDeg){
 const out=[],cos=Math.cos(straightDeg*Math.PI/180);let from=0,d0=null;
 for(let i=1;i<path.length;i++){const d=unit(sub(path[i],path[i-1]));if(!d)continue;
  if(!d0){d0=d;from=i-1;continue;}
  if(dot(d,d0)<cos){out.push([from,i-1]);from=i-1;d0=d;}}
 if(d0)out.push([from,path.length-1]);return out;
}
export function buildPipeMarkers(model,routeRecords,rules={}){
 const R={...MARKER_RULES,...rules},markers=[],byReason={},pieces=[];let routes=0,directedRoutes=0,unmarked=0;
 const shell=BUILDING_SHELL,runs=shell.runs,half=(shell.thickness||.25)/2;
 const perRoute=new Map(),sys=model.parts?new Map(model.parts.map(p=>[p.id,p.system])):null;
 for(const r of model.routes){const rec=routeRecords.get(r.id);if(!rec?.asmeClass)continue;routes++;
  const oriented=orientEdges(r,model.edges);if(oriented.some(o=>o.directed))directedRoutes++;
  const mine=[];
  for(const o of oriented){if(sys&&!DRAWN_PIPE.has(sys.get(o.edge.part)))continue;// flow paths through equipment (shells, heads, pumps, internals) are not pipework
   const radius=o.edge.radius||.05,size=markerSize(radius*2000);
   for(const [i0,i1] of straightPieces(o.path,R.straightDeg)){const a=o.path[i0],b=o.path[i1],d=unit(sub(b,a)),L=dist(a,b);if(!d||L<.05)continue;
    const piece={routeId:r.id,rec,a,b,dir:d,len:L,radius,size,directed:o.directed,part:o.edge.part,lengthM:size.lengthMm/1000};mine.push(piece);pieces.push(piece);}}
  perRoute.set(r.id,{rec,mine,markers:[]});}
 const fits=(p,t)=>t>=p.lengthM/2+.03&&t<=p.len-p.lengthM/2-.03;
 const add=(p,t,reason)=>{const entry=perRoute.get(p.routeId);if(!fits(p,t))return false;const pos=along(p.a,p.dir,t);
  for(const m of entry.markers)if(dist(m.pos,pos)<Math.max(m.size.lengthMm,p.size.lengthMm)/1000*1.1)return false;
  const m={routeId:p.routeId,rec:p.rec,pos,dir:p.dir,directed:p.directed,radius:p.radius,part:p.part,size:p.size,reason};entry.markers.push(m);markers.push(m);byReason[reason]=(byReason[reason]||0)+1;return true;};
 // 1. both sides of wall penetrations
 for(const p of pieces)for(const side of runs){const ci=side.axis==='x'?0:2,cj=side.axis==='x'?2:0,da=p.a[ci]-side.c,db=p.b[ci]-side.c;if(da===0||db===0||Math.sign(da)===Math.sign(db))continue;
  const f=da/(da-db),s=p.a[cj]+(p.b[cj]-p.a[cj])*f;if(!(s>side.lo&&s<side.hi))continue;const tc=f*p.len,off=half+.15+p.lengthM/2;add(p,tc-off,'penetration');add(p,tc+off,'penetration');}
 // 2. adjacent to valves (both sides, on the nearest line)
 for(const v of model.valves||[]){if(!v.a||!v.b)continue;const c=[(v.a[0]+v.b[0])/2,(v.a[1]+v.b[1])/2,(v.a[2]+v.b[2])/2],near=[];
  for(const p of pieces){const t=Math.max(0,Math.min(p.len,dot(sub(c,p.a),p.dir))),d=dist(c,along(p.a,p.dir,t));if(d<.6)near.push({p,t});}
  near.sort((x,y)=>y.p.len-x.p.len);// the longest run at the valve has room for the markers
  for(const {p,t} of near){const off=R.valveGap+p.lengthM/2,a1=add(p,t-off,'valve'),a2=add(p,t+off,'valve');if(a1||a2)break;}}
 // 3. adjacent to changes of direction: where two straight pieces of a line end within an elbow's reach and turn by cornerDeg or more
 for(const entry of perRoute.values()){const P=entry.mine;
  for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const A=P[i],B=P[j],tol=.25+4*Math.max(A.radius,B.radius);
   for(const ea of [0,1])for(const eb of [0,1]){const pa=ea?A.b:A.a,pb=eb?B.b:B.a;if(dist(pa,pb)>tol)continue;
    const va=ea?[-A.dir[0],-A.dir[1],-A.dir[2]]:A.dir,vb=eb?[-B.dir[0],-B.dir[1],-B.dir[2]]:B.dir;// directions leaving the corner
    const turn=180-Math.acos(Math.max(-1,Math.min(1,dot(va,vb))))*180/Math.PI;if(turn<R.cornerDeg)continue;
    const piece=A.len>=B.len?A:B,atStart=piece===A?!ea:!eb,reach=tol+piece.lengthM/2+.05;add(piece,atStart?reach:piece.len-reach,'corner');}}}
 // 4. every spacing on straight runs
 for(const p of pieces){if(p.len<R.spacing)continue;const n=Math.round(p.len/R.spacing);for(let k=0;k<n;k++)add(p,(k+.5)*p.len/n,'run');}
 // 5. every line carries at least one marker where a straight run is long enough
 for(const entry of perRoute.values()){if(entry.markers.length)continue;let best=null;for(const p of entry.mine)if(!best||p.len>best.len)best=p;
  if(best&&add(best,best.len/2,'line'))continue;unmarked++;}
 return {markers,stats:{routes,directedRoutes,unmarked,byReason,total:markers.length}};
}
