import {connectedFloor} from './floor-geometry.js';
import * as T from './vendor/three.module.js';
import {componentEnvelope} from './access-review.js';
import {segmentEntersRect,segmentDistance} from './containment-routing.js';

// Render the real local recesses instead of drawing collection floors through an opaque ground plane.
export function containmentGroundGeometry(width,depth,center,containment){
 const holes=containment.cells.flatMap(c=>[...c.patches,[c.storage.min[0]-.21,c.storage.min[2]-.21,c.storage.max[0]+.21,c.storage.max[2]+.21]]);
 const xmin=center.x-width/2,xmax=center.x+width/2,zmin=center.z-depth/2,zmax=center.z+depth/2;
 const xs=[...new Set([xmin,xmax,...holes.flatMap(r=>[r[0],r[2]])])].sort((a,b)=>a-b),zs=[...new Set([zmin,zmax,...holes.flatMap(r=>[r[1],r[3]])])].sort((a,b)=>a-b),p=[];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<zs.length-1;j++){const a=xs[i],b=xs[i+1],d=zs[j],e=zs[j+1],x=(a+b)/2,z=(d+e)/2;if(x<xmin||x>xmax||z<zmin||z>zmax||holes.some(r=>x>r[0]&&x<r[2]&&z>r[1]&&z<r[3]))continue;p.push(a,0,d,a,0,e,b,0,e,a,0,d,b,0,e,b,0,d);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.computeVertexNormals();return g;
}
const overlap=(a,b)=>Math.min(a[2],b[2])-Math.max(a[0],b[0])>1e-5&&Math.min(a[3],b[3])-Math.max(a[1],b[1])>1e-5;
export function inspectContainment(model){
 const c=model.containment;if(!c)return null;
 const findings=[],ids=new Set(model.parts.map(p=>p.id)),tags=new Set(),byId=new Map(model.parts.map(p=>[p.id,p]));
 for(const cell of c.cells){
  if(tags.has(cell.tag))findings.push({kind:'tag',cell:cell.tag,reason:'Duplicate containment tag'});tags.add(cell.tag);
  const [a,y,d]=cell.storage.min,[b,top,e]=cell.storage.max,net=(b-a)*(e-d)*(top-y)-cell.displacementM3;
  if(Math.abs(net-cell.netM3)>1e-6||net+1e-6<cell.requiredM3)findings.push({kind:'capacity',cell:cell.tag,reason:'Geometric net retention below selected release case'});
  if(cell.normalDischargeConnection!==null)findings.push({kind:'segregation',cell:cell.tag,reason:'Unexpected normal drain connection'});
  if(cell.partIds.some(id=>!ids.has(id)))findings.push({kind:'identity',cell:cell.tag,reason:'Missing modeled component'});
  for(const r of cell.gravityPaths){if(!model.routes.some(v=>v.id===r.routeId&&v.spillCell===cell.key))findings.push({kind:'route',cell:cell.tag,reason:'Missing dedicated route'});for(let i=1;i<r.path.length;i++)if(r.path[i][1]>r.path[i-1][1]+1e-7)findings.push({kind:'fall',cell:cell.tag,reason:'Rising gravity path'});if(r.remote&&r.path.at(-1)[1]-r.nominalRadiusM<cell.storage.maximumLiquidY+.149)findings.push({kind:'backwater',cell:cell.tag,reason:'Selected maximum liquid level reaches inlet'});}
  for(const floor of cell.captureDesign||[]){
   if(!connectedFloor(floor.tiles))findings.push({kind:'capture-pocket',cell:cell.tag,patch:floor.patchIndex,reason:'Wet floor has a disconnected undrained pocket'});
   const degrees=new Map();for(const [u,v]of floor.segments)for(const p of[u,v]){const key=p.map(v=>v.toFixed(6)).join(',');degrees.set(key,(degrees.get(key)||0)+1);}
   if([...degrees.values()].some(n=>n%2!==0)||floor.curbPartIds.length!==floor.segments.length)findings.push({kind:'perimeter-continuity',cell:cell.tag,patch:floor.patchIndex,reason:'Raised wet-floor boundary is not closed'});
   if(!floor.inletClear)findings.push({kind:'capture-inlet',cell:cell.tag,patch:floor.patchIndex,reason:'Retained support island obstructs the capture inlet'});
   if(floor.curbPartIds.some(id=>!ids.has(id)))findings.push({kind:'capture-curb',cell:cell.tag,reason:'Missing raised boundary component'});
  }
  const trunk=cell.gravityPaths.filter(r=>r.remote);if(trunk.length!==1||cell.gravityPaths.filter(r=>!r.remote).length!==cell.intakes.length)findings.push({kind:'collection-network',cell:cell.tag,reason:'Capture sources or single trunk missing'});
  for(const branch of cell.gravityPaths.filter(r=>!r.remote))if(!trunk.some(t=>branch.path.at(-1).every((v,i)=>Math.abs(v-t.path[0][i])<1e-7)))findings.push({kind:'collection-junction',cell:cell.tag,reason:'Local capture branch disconnected from trunk'});
  for(const pos of cell.servicePositions.filter(p=>p.category==='routine'))if(pos.point[1]-pos.standing[1]>1.7||pos.horizontalReachM>.65)findings.push({kind:'reach',cell:cell.tag,reason:'Routine indication beyond target reach'});
 }
 for(let i=0;i<c.cells.length;i++)for(let j=i+1;j<c.cells.length;j++){
  const a=c.cells[i],b=c.cells[j];for(const [pi,p]of a.patches.entries())for(const [qi,q]of b.patches.entries())if(overlap(p,q)&&!a.pumpTrays.some(t=>t.patchIndex===pi)&&!b.pumpTrays.some(t=>t.patchIndex===qi))findings.push({kind:'capture-overlap',cell:a.tag,other:b.tag,reason:'Independent chemistry capture floors overlap'});
  if(overlap([a.storage.min[0],a.storage.min[2],a.storage.max[0],a.storage.max[2]],[b.storage.min[0],b.storage.min[2],b.storage.max[0],b.storage.max[2]]))findings.push({kind:'liquid-volume-overlap',cell:a.tag,other:b.tag,reason:'Separate liquid storage interiors overlap'});
  if(a.civilBlock!==b.civilBlock&&overlap([a.storage.min[0]-.2,a.storage.min[2]-.2,a.storage.max[0]+.2,a.storage.max[2]+.2],[b.storage.min[0]-.2,b.storage.min[2]-.2,b.storage.max[0]+.2,b.storage.max[2]+.2]))findings.push({kind:'storage-overlap',cell:a.tag,other:b.tag,reason:'Separate civil block walls overlap'});
 }
 const allPaths=c.cells.flatMap(cell=>cell.gravityPaths.map(r=>({cell,r})));
 for(let i=0;i<allPaths.length;i++){const {cell,r}=allPaths[i];for(const other of c.cells){if(other===cell)continue;const box=[other.storage.min[0]-.30,other.storage.min[2]-.30,other.storage.max[0]+.30,other.storage.max[2]+.30];for(let k=1;k<r.path.length;k++)if(segmentEntersRect(r.path[k-1],r.path[k],box))findings.push({kind:'buried-foundation',cell:cell.tag,other:other.tag,reason:'Spill route enters another retention foundation footprint'});}for(let j=0;j<i;j++){const q=allPaths[j];if(q.cell===cell)continue;let hit=false;for(let a=1;a<r.path.length&&!hit;a++)for(let b=1;b<q.r.path.length;b++)if(segmentDistance(r.path[a-1],r.path[a],q.r.path[b-1],q.r.path[b])<.249){hit=true;break;}if(hit)findings.push({kind:'buried-crossing',cell:cell.tag,other:q.cell.tag,reason:'Independent spill pipes below separation allowance'});}}
 const newParts=c.partIds.map(id=>byId.get(id)).filter(Boolean),zones=(model.access?.zones||[]).filter(z=>['pedestrian','platform-access'].includes(z.kind));
 for(const p of newParts){if(['capture','yard','level'].includes(p.containmentLayer))continue;const b=componentEnvelope(p);if(b.max.y<.02)continue;for(const z of zones)if(b.intersectsBox(new T.Box3(new T.Vector3(...z.min),new T.Vector3(...z.max))))findings.push({kind:'access',cell:p.containmentCell,part:p.name,zone:z.id,reason:'New containment component enters protected access volume'});}
 return {revision:c.revision,civilBlocks:c.civilBlocks.length,cells:c.cells.length,capacityChecks:c.cells.length,geometricFindings:findings,geometryPass:findings.length===0,storageTotalM3:c.cells.reduce((n,v)=>n+v.netM3,0),scope:'Continuous raised floor boundaries, support-island / inlet exclusion, calculated storage, segregated identities, descending paths, inlet elevations, new spill-pipe separation and avoidance of retention foundations, routine reach and new components against pedestrian / stair-access reservations. Dynamic spill capture, existing buried services / foundation depths and civil design remain unqualified.',qualified:false};
}
