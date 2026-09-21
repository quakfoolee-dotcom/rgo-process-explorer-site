import * as T from './vendor/three.module.js';
const V=a=>new T.Vector3(...a),clamp=x=>Math.max(0,Math.min(1,x));
export const thermalWater=e=>['hw','cw','chw'].includes(e.thermalCircuit)||e.thermalCircuit?.startsWith('secondary-');
export function segmentClearance(a,b,c,d){const p=V(a),q=V(c),u=V(b).sub(p),v=V(d).sub(q),r=p.clone().sub(q),A=u.dot(u),B=u.dot(v),C=v.dot(v),D=u.dot(r),E=v.dot(r);let s=0,t=0;if(A<1e-12)t=C?clamp(E/C):0;else if(C<1e-12)s=clamp(-D/A);else{const den=A*C-B*B;s=den?clamp((B*E-C*D)/den):0;t=(B*s+E)/C;if(t<0){t=0;s=clamp(-D/A);}else if(t>1){t=1;s=clamp((B-D)/A);}}const x=p.addScaledVector(u,s),y=q.addScaledVector(v,t);return {distance:x.distanceTo(y),pointA:x.toArray(),pointB:y.toArray(),s,t};}
export const thermalAllowance=c=>c==='hw'?.05:c==='cw'?.025:c==='chw'?.04:c?.startsWith('secondary-')?.05:0;
const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
export function inspectThermalClearance(model){
 const pm=new Map(model.parts.map(p=>[p.id,p])),rows=model.edges.filter(e=>!e.internalTo&&pm.get(e.part)?.system==='pipe').map((e,i)=>{const path=e.path||[e.a,e.b],r=e.radius||.025,outer=r+(pm.get(e.part)?.insulationThickness||0);return {e,i,path,r,outer,lo:[0,1,2].map(k=>Math.min(...path.map(p=>p[k]))-outer),hi:[0,1,2].map(k=>Math.max(...path.map(p=>p[k]))+outer)};}),findings=[],tapCandidates=[];
 for(const a of rows.filter(o=>thermalWater(o.e)))for(const b of rows){if(a.e.part===b.e.part||thermalWater(b.e)&&a.i>=b.i||a.lo.some((v,k)=>v>b.hi[k]||a.hi[k]<b.lo[k]))continue;const same=a.e.thermalCircuit===b.e.thermalCircuit,opposing=same&&['supply','return'].every(r=>[a.e.thermalRole,b.e.thermalRole].includes(r));if(same&&!opposing&&(a.e.routeId&&a.e.routeId===b.e.routeId||[a.e.a,a.e.b].some(p=>[b.e.a,b.e.b].some(q=>distance(p,q)<1e-5))))continue;
  let best={distance:Infinity};for(let i=1;i<a.path.length;i++)for(let j=1;j<b.path.length;j++){const d=segmentClearance(a.path[i-1],a.path[i],b.path[j-1],b.path[j]);if(d.distance<best.distance)best={...d,parallel:Math.abs(V(a.path[i]).sub(V(a.path[i-1])).normalize().dot(V(b.path[j]).sub(V(b.path[j-1])).normalize()))>.999};}
  const gap=best.distance-a.outer-b.outer;if(gap>=-.002)continue;const atEndpoint=[a.e.a,a.e.b].some(p=>distance(p,best.pointA)<.001)||[b.e.a,b.e.b].some(p=>distance(p,best.pointB)<.001);if(same&&!opposing&&atEndpoint&&!(best.parallel&&best.distance<.001))continue;
  const item={partA:a.e.part,partB:b.e.part,nameA:a.e.name,nameB:b.e.name,circuitA:a.e.thermalCircuit,circuitB:b.e.thermalCircuit||null,roleA:a.e.thermalRole,roleB:b.e.thermalRole,point:best.pointA,distance:best.distance,clearance:gap,kind:best.distance<.001?'centreline crossing':best.distance<a.r+b.r-.002?'bare-pipe clash':'insulation clash'};
  // Explicit legacy instrument / drain takeoffs are intentional hydraulic joints,
  // not automatic exemptions for other untagged pipes.
  if(!b.e.thermalCircuit&&/low takeoff|Jacket pressure branch|Central manifold utility tie/.test(b.e.name))tapCandidates.push(item);else findings.push(item);
 }
 return {scope:'Thermal external pipes against all external pipe paths; modeled insulation included',elements:rows.filter(o=>thermalWater(o.e)).length,findings,tapCandidates,qualified:false};
}

