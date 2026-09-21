import * as T from './vendor/three.module.js';
import {projectToEdge,edgeElevation} from './plant-browse-network.js';
const xyz=(e,t)=>[e.a[0]+(e.b[0]-e.a[0])*t,edgeElevation(e,t),e.a[1]+(e.b[1]-e.a[1])*t];
const pause=()=>new Promise(r=>setTimeout(r,0));
// Navigation-only mesh built from registered surfaces; it never alters access geometry.
export async function addBrowseLevels(model,network,index,cancelled=()=>false){
 const system=model.accessSystem;if(!system)return network;
 const parts=new Map(model.parts.map(p=>[p.id,p])),decks=system.decks.filter(d=>parts.has(d.partId)),nodes=new Map(),deckNodes=new Map(),surfaces=[],findings=[],original=[...network.edges];let serial=Math.max(...original.map(e=>e.id),0)+1;
 const topY=p=>{if(!p.geometry.boundingBox)p.geometry.computeBoundingBox();return p.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale)).max.y;};
 const key=p=>p.map(v=>v.toFixed(5)).join('|'),get=p=>{const k=key(p);if(!nodes.has(k))nodes.set(k,{id:'level:'+k,p});return nodes.get(k);};
 const add=(a,b,meta={},screen=true)=>{if(Math.hypot(...a.map((v,i)=>v-b[i]))<1e-6)return null;if(screen&&!index.bodyClear(a,b,meta.exclude))return null;const na=get(a),nb=get(b),e={id:serial++,from:na.id,to:nb.id,a:[a[0],a[2]],b:[b[0],b[2]],ya:a[1],yb:b[1],length:Math.hypot(...a.map((v,i)=>v-b[i])),heading:Math.atan2(b[0]-a[0],b[2]-a[2]),width:.56,...meta};network.edges.push(e);for(const n of[e.from,e.to]){if(!network.adj.has(n))network.adj.set(n,[]);network.adj.get(n).push(e);}return e;};
 const inside=(d,x,z,margin=0)=>x>=d.min[0]+margin-1e-6&&x<=d.max[0]-margin+1e-6&&z>=d.min[2]+margin-1e-6&&z<=d.max[2]-margin+1e-6&&!(d.holes||[]).some(h=>x>=(h.min?.[0]??h[0])-margin&&x<=(h.max?.[0]??h[2])+margin&&z>=(h.min?.[1]??h[1])-margin&&z<=(h.max?.[1]??h[3])+margin);
 function supported(p){return [[0,0],[.27,.27],[-.27,.27],[.27,-.27],[-.27,-.27]].every(([dx,dz])=>decks.some(d=>Math.abs(d.min[1]-p[1])<.025&&inside(d,p[0]+dx,p[2]+dz)));}
 function deckPath(a,b){const steps=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[2]-b[2])/.12));for(let i=0;i<=steps;i++)if(!supported(a.map((v,k)=>v+(b[k]-v)*i/steps)))return false;return true;}
 const attach=(d,p)=>{const choices=(deckNodes.get(d.id)||[]).map(n=>({n,d:Math.hypot(n.p[0]-p[0],n.p[2]-p[2])})).sort((a,b)=>a.d-b.d);for(const c of choices.slice(0,12))if(deckPath(p,c.n.p)&&add(p,c.n.p,{deck:d.id}))return true;return choices.some(c=>c.d<1e-5);};
 for(const d of decks){if(cancelled())return null;await pause();const list=[],y=d.min[1],dx=Math.max(0,d.max[0]-d.min[0]-.64),dz=Math.max(0,d.max[2]-d.min[2]-.64);
  surfaces.push({kind:'deck',deck:d,y,exclude:new Set([d.partId])});
  if(Math.abs(topY(parts.get(d.partId))-y)>.025){findings.push(d.id+': deck elevation mismatch');continue;}
  if(y>0&&(!d.guardParts?.length||d.guardParts.some(id=>!parts.has(id)))){findings.push(d.id+': guarding records incomplete');continue;}
  const nx=Math.max(1,Math.ceil(dx/.45)),nz=Math.max(1,Math.ceil(dz/.45)),grid=new Map();
  for(let i=0;i<=nx;i++)for(let j=0;j<=nz;j++){const p=[dx?d.min[0]+.32+dx*i/nx:(d.min[0]+d.max[0])/2,y,dz?d.min[2]+.32+dz*j/nz:(d.min[2]+d.max[2])/2];if(!supported(p)||!index.bodyClear(p,p,new Set([d.partId])))continue;const n=get(p);list.push(n);grid.set(i+','+j,n);for(const [ii,jj]of[[i-1,j],[i,j-1]]){const prev=grid.get(ii+','+jj);if(prev&&deckPath(p,prev.p))add(p,prev.p,{deck:d.id});}}
  deckNodes.set(d.id,list);
 }
 // Only authored deck links may cross deck boundaries; no plan-view level merging.
 for(const [aid,bid]of system.links||[]){const a=decks.find(d=>d.id===aid),b=decks.find(d=>d.id===bid);if(!a||!b||Math.abs(a.min[1]-b.min[1])>.025)continue;const x0=Math.max(a.min[0],b.min[0]),x1=Math.min(a.max[0],b.max[0]),z0=Math.max(a.min[2],b.min[2]),z1=Math.min(a.max[2],b.max[2]);if(x1<x0-.025||z1<z0-.025)continue;const p=[(x0+x1)/2,a.min[1],(z0+z1)/2];attach(a,p);attach(b,p);}
 for(const f of system.flights||[]){if(cancelled())return null;await pause();const bottom=decks.find(d=>d.id===f.bottom),top=decks.find(d=>d.id===f.top),ids=[...f.treads,...f.nosingIds||[]],exclude=new Set([...ids,...f.stringers||[],...model.parts.filter(p=>p.name===f.tag+' upper bearing seat'||p.name===f.tag+' lower bearing seat').map(p=>p.id),bottom?.partId,top?.partId]);
  if(!bottom||!top||f.treads.length!==f.riserCount-1||[...ids,...f.railIds].some(id=>!parts.has(id))){findings.push(f.tag+': missing stair component');continue;}
  const dir=Math.sign(f.z1-f.z0),a=[f.x,f.y0,f.z0],b=[f.x,f.y1,f.z1],before=[f.x,f.y0,f.z0-dir*.32],after=[f.x,f.y1,f.z1+dir*.32];
  // Recorded geometry must agree with the actual treads before interpolating a flight.
  if(f.treads.some((id,i)=>{const p=parts.get(id);return Math.abs(topY(p)-(f.y0+(i+1)*f.riser))>.025||Math.abs(p.position.x-f.x)>.05||Math.abs(p.position.z-(f.z0+dir*(i+.5)*f.going))>.16;})){findings.push(f.tag+': tread geometry mismatch');continue;}
  if(!index.bodyClear(a,b,exclude)||!index.bodyClear(before,a,exclude)||!index.bodyClear(b,after,exclude)){findings.push(f.tag+': body/headroom obstruction · '+index.lastObstruction);continue;}
  if(!attach(bottom,before)||!attach(top,after)){findings.push(f.tag+': landing connection unavailable');continue;}
  add(before,a,{stair:true,flight:f.tag,exclude,visualExclude:new Set(ids)},false);const e=add(a,b,{stair:true,flight:f.tag,exclude,visualExclude:new Set(ids)},false);add(b,after,{stair:true,flight:f.tag,exclude,visualExclude:new Set(ids)},false);surfaces.push({kind:'stair',flight:f,edge:e,exclude:new Set(ids)});
 }
 // Split an existing ground edge at each verified stair approach.
 for(const tower of system.towers||[]){const d=decks.find(d=>d.id===tower.landings[0]);if(!d)continue;const p=[...tower.entry],hit=original.map(edge=>({...projectToEdge([p[0],p[2]],edge),edge})).sort((a,b)=>a.distance-b.distance)[0];if(!hit||hit.distance>5||!index.bodyClear([hit.point[0],0,hit.point[1]],p)||!attach(d,p)){findings.push(tower.tag+': ground approach unavailable');continue;}
  // Ground-to-entry connector also excludes containment openings.
  const bad=(model.containment?.cells||[]).some(c=>[...c.patches,[c.storage.min[0],c.storage.min[2],c.storage.max[0],c.storage.max[2]]].some(r=>{for(let t=0;t<=1;t+=.02){const x=hit.point[0]+(p[0]-hit.point[0])*t,z=hit.point[1]+(p[2]-hit.point[1])*t;if(x>r[0]-.28&&x<r[2]+.28&&z>r[1]-.28&&z<r[3]+.28)return true;}return false;}));if(bad){findings.push(tower.tag+': containment interrupts approach');continue;}
  const q=[hit.point[0],0,hit.point[1]],node=get(q),e=hit.edge;
  if(hit.t<1e-6)node.id=e.from;else if(hit.t>1-1e-6)node.id=e.to;else{
   network.edges=network.edges.filter(x=>x!==e);for(const id of[e.from,e.to])network.adj.set(id,(network.adj.get(id)||[]).filter(x=>x!==e));
   const left=add([e.a[0],0,e.a[1]],q,{kind:'ground'},false),right=add(q,[e.b[0],0,e.b[1]],{kind:'ground'},false);
   for(const [piece,end,id]of[[left,'from',e.from],[right,'to',e.to]]){const former=piece[end];network.adj.set(former,(network.adj.get(former)||[]).filter(x=>x!==piece));piece[end]=id;if(!network.adj.has(id))network.adj.set(id,[]);network.adj.get(id).push(piece);}
  }
  add(q,p,{kind:'approach'});
 }
 const reached=new Set(),queue=original.flatMap(e=>[e.from,e.to]);for(const n of queue)reached.add(n);for(let i=0;i<queue.length;i++)for(const e of network.adj.get(queue[i])||[]){const n=e.from===queue[i]?e.to:e.from;if(!reached.has(n)){reached.add(n);queue.push(n);}}
 network.edges=network.edges.filter(e=>reached.has(e.from)&&reached.has(e.to));network.adj=new Map();for(const e of network.edges)for(const n of[e.from,e.to]){if(!network.adj.has(n))network.adj.set(n,[]);network.adj.get(n).push(e);}
 for(const d of decks)if(!network.edges.some(e=>e.deck===d.id))findings.push(d.id+': no connected clear browsing route');
 network.levelSurfaces=surfaces;network.levelFindings=findings;network.levelSummary={flights:(system.flights||[]).length,availableFlights:new Set(network.edges.filter(e=>e.flight).map(e=>e.flight)).size,decks:decks.length,availableDecks:new Set(network.edges.filter(e=>e.deck).map(e=>e.deck)).size};
 network.nearest=(p,tolerance=.6,y=0)=>{let best=null;for(const edge of network.edges){const h=projectToEdge(p,edge);if(h.distance<=tolerance&&Math.abs(edgeElevation(edge,h.t)-y)<.15&&(!best||h.distance<best.distance))best={...h,edge};}return best;};
 network.pickLevel=ray=>{let best=null;const point=new T.Vector3();for(const s of surfaces){let h=null;if(s.kind==='deck'){if(!ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-s.y),point)||!inside(s.deck,point.x,point.z))continue;h=network.nearest([point.x,point.z],.65,s.y);if(h&&(!deckPath([point.x,s.y,point.z],xyz(h.edge,h.t))||!index.bodyClear([point.x,s.y,point.z],xyz(h.edge,h.t))))h=null;}
   else{const e=s.edge,a=new T.Vector3(e.a[0],e.ya,e.a[1]),b=new T.Vector3(e.b[0],e.yb,e.b[1]),normal=new T.Vector3(1,0,0).cross(b.clone().sub(a)).normalize();if(!ray.intersectPlane(new T.Plane().setFromNormalAndCoplanarPoint(normal,a),point)||Math.abs(point.x-s.flight.x)>s.flight.clearWidth/2)continue;const proj=projectToEdge([point.x,point.z],e);if(proj.distance>s.flight.clearWidth/2||Math.abs(point.y-edgeElevation(e,proj.t))>.03)continue;h=network.edges.includes(e)?{...proj,edge:e}:null;}
   const distance=ray.origin.distanceTo(point);if(distance>.001&&(!best||distance<best.distance))best={hit:h,point:point.clone(),exclude:s.exclude,distance};
  }return best;};
 return network;
}
export {xyz as browseXYZ};
