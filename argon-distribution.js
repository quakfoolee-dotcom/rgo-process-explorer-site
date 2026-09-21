import {AR_SOURCE_EQUIPMENT,AR_SOURCE_CONTROL,buildArgonSource} from './argon-source.js';
import {AR_LAYOUT,argonTakeoff} from './argon-layout.js';
import {AR_ACCESS} from './access-layout.js';
import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';
// AR6001 / AR701 / AR702 / AR801 are PFD stream identifiers, not equipment tags.
export const ARGON_EQUIPMENT={...AR_SOURCE_EQUIPMENT,117:{tag:'HD-6201',label:'Common Ar distribution header',areaId:'A-6000',designStatus:'proposed',x:84,z:46,labelY:7.2,reviewNote:'Proposed A-6200 header arrangement. A-6100 source, pressure regulation and reserve bank are connected proposed equipment. Header diameter, pressure, peak simultaneous purge demand, reserve capacity and support spacing require detailed engineering.'}};
export const ARGON_SUPPLY={source:'BL-AR6000',seed:AR_SOURCE_CONTROL.primarySeed,main:'XV-AR6201-MAIN',branches:[
 {areaId:'A-700',unit:'furnace',owner:89,boundary:'BL-AR701',localMain:'XV-AR701-MAIN',localSeed:'A700 argon supply',isolation:'XV-AR6201-700',check:'NRV-AR6201-700',x:54.8},
 {areaId:'A-800',unit:'doping',owner:112,boundary:'BL-AR801',localMain:'XV-AR801-MAIN',localSeed:'A800 argon supply',isolation:'XV-AR6201-800',check:'NRV-AR6201-800',x:94}
]};
export function buildArgonDistribution(h,choice='bulk'){
 const source=buildArgonSource(h,choice);
 const k=processKit(h),s=structuralKit(h),{parts,edges,routes,setContext,ring}=k,first=parts.length;
 const L=(points,label,r=.055)=>k.line(points,r,label,'Argon','HD-6201','Local Ar supply');
 const G=(a,z,tag,r=.055)=>k.bulkValve(a,z,r,tag,tag+' supply isolation');
 setContext(117,'HD-6201 connected A-6100 supply');
 k.boundary(ARGON_SUPPLY.source,[52.8,1.8,46],[-1,0,0],.075,'Argon','Connected A-6100 regulated source outlet. Source capacity, protection ratings and distribution pressure require qualification.');
 L([[52.8,1.8,46],[53.3,1.8,46]],'A-6200 regulated inlet',.075);
 G([53.3,1.8,46],[53.6,1.8,46],ARGON_SUPPLY.main,.075);
 const header=L([[53.6,1.8,46],[54,1.8,46],[54,6,46],[115,6,46]],'A-6200 common Ar header',.075);
 h.capped([115,6,46],[1,0,0],.075,'HD-6201 header end blind');
 k.instrument('PT-6201',[54,2.8,46],'header supply pressure');
 const sourceTie=k.boundaries.find(b=>b.tag===ARGON_SUPPLY.source);Object.assign(sourceTie,{kind:'interunit',fromArea:'A-6100',toArea:'A-6200'});for(const t of h.terminals)if(t.label===ARGON_SUPPLY.source+' external battery limit')t.label=ARGON_SUPPLY.source+' connected source flange';
 const connections=[];
 for(const branch of ARGON_SUPPLY.branches){
  const local=h[branch.unit],tie=local.boundaries.find(b=>b.tag===branch.boundary),x=branch.x;
  if(!tie)throw Error('Missing local Ar interface '+branch.boundary);
  setContext(117,'HD-6201 supply to '+branch.areaId);
  L([[x,6,46],[x,1.5,46],[x,1.5,45.5]],branch.areaId+' Ar header takeoff');
  G([x,1.5,45.5],[x,1.5,45.2],branch.isolation);
  const at=parts.length;h.valve([x,1.5,45.2],[x,1.5,44.9],.055,'blue','check',branch.check+' non-return');
  Object.assign(h.valves.at(-1),{tag:branch.check,partIds:parts.slice(at).map(p=>p.id)});Object.assign(edges.at(-1),{oneWay:true,checkTag:branch.check});
  // Straight leads preserve tangent continuity through valve faces and existing tie-in flanges.
  const p=tie.point;const delivery=L([[x,1.5,44.9],[x,1.5,44.5],[x,6,44.5],[x,6,p[2]],[x,p[1],p[2]],[p[0],p[1],p[2]]],branch.areaId+' Ar supply from A-6200');
  Object.assign(delivery,{from:'HD-6201',fromArea:'A-6000',to:h.EQUIPMENT[branch.owner].tag,toArea:branch.areaId,designStatus:'proposed'});
  Object.assign(tie,{kind:'interunit',fromArea:'A-6000',toArea:branch.areaId,destination:'Connected HD-6201 branch → '+h.EQUIPMENT[branch.owner].tag+' local regulation; purity, pressure and demand qualification remain open.'});
  const port=h.ports.find(p=>p.id===tie.tag);if(port)port.role='interunit Ar supply';
  for(const t of h.terminals)if(t.label===tie.tag+' external battery limit')t.label=tie.tag+' connected interunit flange';
  connections.push({...branch,point:p,routeId:delivery.id,targets:local.argonBranches.map(b=>({tag:b.tag,target:b.target,check:b.check}))});
 }
 // PFD-defined future user interfaces are isolated and positively capped.
 const reservations=[];
 for(const [i,stream]of ['AR-901','AR-902','AR-903','AR-X'].entries()){
  setContext(117,'A-6200 '+stream+' reserved interface');const x=106+i*2,tag='XV-6200-'+stream.replace('AR-','');L([[x,6,46],[x,3,46],[x,3,45.8],[x,1.45,45.8]],stream+' reserved takeoff',.04);G([x,1.45,45.8],[x,1.15,45.8],tag,.04);const at=parts.length;h.valve([x,1.15,45.8],[x,.85,45.8],.04,'blue','check','NRV-'+tag);Object.assign(h.valves.at(-1),{tag:'NRV-'+tag,partIds:parts.slice(at).map(p=>p.id)});Object.assign(edges.at(-1),{oneWay:true,checkTag:'NRV-'+tag});L([[x,.85,45.8],[x,.55,45.8]],stream+' blind-ended branch',.04);h.capped([x,.55,45.8],[0,-1,0],.04,stream+' positive blind');h.terminal([x,.55,45.8],stream+' positively blinded future interface');reservations.push({stream,isolation:tag,destination:stream==='AR-X'?'Other qualified purge users':'A-900',point:[x,.55,45.8],status:'Reserved and positively blinded; no receiving equipment connected',defaultState:'closed'});
 }
 // Grounded frames and clamps support the common header and both descending supply legs.
 setContext(117,'HD-6201 connected pipe supports');
 const support=(x,y,z,axis,r,route)=>{
  const col=s.column(x,z+.5,y,'HD-6201 support',.12),arm=s.beam([x,y,z+.5],[x,y,z],.08,'Pipe support HD-6201 saddle arm');s.join(col.post,arm,[x,y,z+.5],'Header post / saddle arm');
  const clamp=ring('HD-6201 pipe saddle clamp','frame',r+.01,.01,[x,y,z],'bright',axis);s.join(arm,clamp,[x,y,z+r+.01],'Header saddle / arm');
  const e=route.edgeIndices.map(i=>edges[i]).find(e=>e.path.every(p=>Math.abs(p[1]-y)<1e-6)&&e.path.every(p=>Math.abs(p[2]-z)<1e-6)&&Math.min(e.a[0],e.b[0])<=x&&Math.max(e.a[0],e.b[0])>=x);
  if(e){const pipe=parts.find(p=>p.id===e.part);s.load(pipe,'HD-6201 header span');s.join(pipe,clamp,[x,y,z+r],'Header pipe / saddle');}
 };
 for(const x of[55.8,66,78,90,102,114])support(x,6,46,[1,0,0],.075,header);
 for(const branch of connections){const r=routes.find(r=>r.id===branch.routeId),x=branch.x,y=AR_ACCESS.commonHeaderY;
  // Overhead approach crosses the aisle; descent stays at the local service panel.
  for(const z of branch.areaId==='A-700'?[31.9,38,43]:[40.3,43.3]){
   const side=branch.areaId==='A-800'?-1:1,col=s.column(x+side*.35,z,y,'HD-6201 branch support',.10),arm=s.beam([x+side*.35,y,z],[x,y,z],.065,'Pipe support HD-6201 branch shoe');s.join(col.post,arm,[x+side*.35,y,z],'Branch post / shoe');
   const clamp=ring('HD-6201 branch pipe clamp','frame',.065,.01,[x,y,z],'bright',[0,0,1]);s.join(arm,clamp,[x+side*.065,y,z],'Branch shoe / clamp');
   const e=r.edgeIndices.map(i=>edges[i]).find(e=>e.path.every(p=>Math.abs(p[0]-x)<1e-6&&Math.abs(p[1]-y)<1e-6)&&Math.min(e.a[2],e.b[2])<=z&&Math.max(e.a[2],e.b[2])>=z);
   if(e){const pipe=parts.find(p=>p.id===e.part);s.load(pipe,'HD-6201 '+branch.areaId+' supply leg');s.join(pipe,clamp,[x+side*.055,y,z],'Branch pipe / clamp');}
  }
 }
 return {areaId:'A-6000',equipment:[...Object.keys(AR_SOURCE_EQUIPMENT).map(Number).filter(id=>parts.some(p=>p.reactor===id)),117],sourceSystem:source,pipingReview:{basis:'Modeled routed centerline length, including bends; standalone valve lengths excluded consistently. Geometry comparison only; pressure drop and cost are not calculated.',local:argonTakeoff({parts,edges,routes}).map(t=>({...t,previous:AR_LAYOUT.previousTakeoff[t.owner],reductionPercent:100*(1-t.lengthM/AR_LAYOUT.previousTakeoff[t.owner].lengthM)}))},layout:AR_LAYOUT,localManifolds:AR_LAYOUT.banks,reservedInterfaces:reservations,source:ARGON_SUPPLY.source,sourceRoute:ARGON_SUPPLY.seed,mainIsolation:ARGON_SUPPLY.main,connections,streams:k.streams,boundaries:[...source.boundaries,...k.boundaries],partIds:[...source.partIds,...parts.slice(first).map(p=>p.id)],approvedSetpoints:null,designStatus:'proposed',basis:'PFD V5.1, PDF page 20: A-6100 common supply / regulation → AR6001 → A-6200 distribution → area consumers. Local A-700 and A-800 supplies connect in parallel. A-6100 connects to the header. A-900 and other future users are positively blinded reserved interfaces.',viewPolicy:'Area ownership is unchanged. A-700 and A-800 include their local Ar systems. A-6000 includes both local manifolds, receiving nozzles, equipment context and supports.'};
}
// Unit illustrations include the real common supply barriers; another area's branch stays isolated.
export function connectArgonSupply(model,cfg){
 if(!model.argonDistribution)return cfg;
 const branch=ARGON_SUPPLY.branches.find(b=>b.unit===cfg.unit);if(!branch)return cfg;
 const supplying=cfg.valves[branch.localMain]==='open';
 cfg.valves[ARGON_SUPPLY.main]=supplying?'open':'closed';
 for(const tag of model.argonDistribution.sourceSystem.primaryValves)cfg.valves[tag]=supplying?'open':'closed';
 for(const tag of model.argonDistribution.sourceSystem.reserveValves)cfg.valves[tag]='closed';
 for(const tag of ['PSV-6101','PSV-6103','XV-6101-FILL'])cfg.valves[tag]='closed';cfg.valves[branch.isolation]=supplying?'open':'closed';
 cfg.seeds=cfg.seeds.flatMap(label=>label===branch.localSeed?model.argonDistribution.sourceSystem.primarySeeds:[label]);
 if(supplying&&!cfg.seeds.includes(ARGON_SUPPLY.seed))cfg.seeds.push(ARGON_SUPPLY.seed);
 return cfg;
}

export const ARGON_UNIT={title:'A-6000 source and distribution',states:{primary:{label:'Primary supply → area isolation stations',open:[],requires:['argon','pressure','design']},reserve:{label:'Reserve supply → area isolation stations',open:[],requires:['argon','pressure','design']},isolated:{label:'Source isolated · no area supply',open:[],requires:[]}},requires:[],note:'Connectivity inspection only. Local consumer valves remain closed in this supply view; inspect A-700/A-800 operations for delivery to equipment. Primary and reserve paths are mutually exclusive in these illustrations. Automatic changeover, usable reserve, gas quality and shutdown endurance require qualification.'};
export function argonDefinition(model){const source=model.argonDistribution.sourceSystem,shared=[ARGON_SUPPLY.main,...ARGON_SUPPLY.branches.map(b=>b.isolation)];return {...ARGON_UNIT,states:{primary:{...ARGON_UNIT.states.primary,open:[...source.primaryValves,...shared]},reserve:{...ARGON_UNIT.states.reserve,open:[...source.reserveValves,...shared]},isolated:{...ARGON_UNIT.states.isolated,open:[]}}};}
export function argonConfiguration(model,state,condition,conditions){const def=argonDefinition(model),op=def.states[state];if(!op||!conditions[condition])throw Error('Invalid argon inspection configuration');const enabled=!op.requires.includes(condition),valves=Object.fromEntries([...new Set(model.edges.map(e=>e.barrierTag).filter(Boolean))].map(tag=>[tag,'closed']));for(const tag of ['PSV-6101','PSV-6103'])valves[tag]='closed';if(enabled)for(const tag of op.open)valves[tag]='open';return {unit:'argon',state,condition,enabled,valves,seeds:state==='reserve'?model.argonDistribution.sourceSystem.reserveSeeds:model.argonDistribution.sourceSystem.primarySeeds,reasons:enabled?[]:[conditions[condition]],drives:[],heater:false,illustrative:true,protectiveNote:'Source connectivity only; this is not an automatic changeover or emergency shutdown sequence.'};}
