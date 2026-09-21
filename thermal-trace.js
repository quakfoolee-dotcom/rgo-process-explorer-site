import {createJourneyNetwork} from './product-journey.js';
import {annotateJourneyPassages} from './journey-marker-scale.js';
import {temperatureColour} from './a5000-basis.js';

export const THERMAL_SCENARIOS={normal:'Normal illustrative circulation',branchClosed:'Selected consumer isolated',pumpA:'Pump A unavailable · demonstrate B',pumpsOff:'Both primary pumps unavailable',generationLoss:'Generation unavailable · circulation only',powerLoss:'Common power loss · circulation stopped',minimumFlow:'Low demand · minimum-flow recycle'};
const cache=new WeakMap(),roleMatch=(role,extent)=>extent==='whole'||role===extent||(extent==='passage'&&['generation','consumer'].includes(role));
export function thermalConsumers(model,{area='all',service='all',mode='heat'}={}){
 return (model.thermalUtilities?.consumers||[]).filter(c=>c.id!==(mode==='cool'?'TCU-141':'TCU-141-COOL')).filter(c=>area==='all'||c.area===area).filter(c=>service==='all'||(c.circuit==='secondary-830'?(mode==='cool'?'chw':'hw'):c.service)===service);
}
function networks(model){if(cache.has(model))return cache.get(model);const map=new Map();cache.set(model,map);return map;}
function network(model,circuit,bypass=false){const map=networks(model),key=circuit+'|'+bypass;if(!map.has(key))map.set(key,createJourneyNetwork(model,{acceptEdge:e=>e.thermalCircuit===circuit&&e.thermalRole!=='inactive'&&(bypass||e.thermalRole!=='bypass')}));return map.get(key);}
function pathThrough(net,points){const segments=[];for(let j=1;j<points.length;j++)segments.push(...net.path(points[j-1],points[j]).segments);let length=0;for(const s of segments){s.start=length;length+=s.length;s.end=length;}return {segments,length};}
export function thermalSegmentKey(s,circuit=''){return circuit+'|'+[s.a.map(x=>x.toFixed(5)).join(','),s.b.map(x=>x.toFixed(5)).join(',')].sort().join('|');}
export function compileThermalTrace(model,options={}){
 const choices={area:'all',service:'all',consumer:'all',extent:'whole',scenario:'normal',mode:'heat',...options},u=model.thermalUtilities,rows=thermalConsumers(model,choices).filter(c=>choices.consumer==='all'||c.id===choices.consumer),requested=new Map(rows.map(c=>[c.id,c])),valveStates={},findings=[],paths=[],allIds=new Set(),colours=new Map(),renderSegments=new Map(),selectedRows=new Set(rows.map(c=>c.id));
 if(!u)return {choices,paths,findings:[{reason:'Thermal system is unavailable in this model scope'}],allIds,colours,renderSegments:[],valveStates,rows:[]};
 // Bring a secondary circuit's actual primary exchanger into scope as context.
 for(const row of rows)if(u.secondaries[row.circuit]){const primary=row.circuit==='secondary-830'&&choices.mode==='cool'?'TCU-141-COOL':u.secondaries[row.circuit].primaryConsumer;requested.set(primary,u.consumers.find(c=>c.id===primary));}
 // Heating and cooldown never share primary fluid and are never admitted together.
 requested.delete(choices.mode==='cool'?'TCU-141':'TCU-141-COOL');
 for(const v of model.valves)if(v.thermal||/^(TCV-J-|XV-JR-)/.test(v.tag||''))valveStates[v.tag]=v.type==='check'?'open':'closed';
 const runningPrimary=!['pumpsOff','powerLoss'].includes(choices.scenario),thermalAvailable=runningPrimary&&choices.scenario!=='generationLoss',pumpIndex=choices.scenario==='pumpA'?1:0;
 function record(row,path,circuit,isSecondary,available,note){
  Object.assign(path,{id:row.id,label:row.tag,circuit,service:isSecondary?(circuit==='secondary-830'&&choices.mode==='cool'?'chw':row.service):row.service,secondary:isSecondary,available,note,owner:row.owner,area:row.area});
  const cfg=u.loops[path.service];for(const seg of path.segments){const e=model.edges[seg.index];seg.role=e.thermalRole;seg.circuit=circuit;seg.temperatureC=isSecondary||!thermalAvailable||row.status==='unresolved'?null:seg.role==='return'?cfg.returnC:['consumer','generation'].includes(seg.role)?null:cfg.supplyC;seg.temperatureBasis=seg.temperatureC===null?'Unknown; no internal midpoint or secondary temperature inferred':'Illustrative pair within PFD V5.1 page 19 ranges';seg.pfdRange=seg.temperatureC===null?null:seg.role==='return'?cfg.pfdReturn:cfg.pfdSupply;seg.colour=temperatureColour(seg.temperatureC);seg.internal=!!e.internalTo;}
  paths.push(path);for(const s of path.segments){if(available&&s.tag)valveStates[s.tag]='open';if(!roleMatch(s.role,choices.extent))continue;allIds.add(s.part);colours.set(s.part,s.colour);renderSegments.set(thermalSegmentKey(s,circuit),s);}
 }
 const usedServices=new Set();
 for(const row of requested.values()){
  if(!row){findings.push({reason:'Missing primary exchanger allocation'});continue;}
  const circuit=row.circuit||row.service,secondary=u.secondaries[circuit],isSecondary=!!secondary,closed=choices.scenario==='branchClosed'&&(choices.consumer==='all'?selectedRows.has(row.id):row.id===choices.consumer),baseAvailable=isSecondary?choices.scenario!=='powerLoss':runningPrimary;
  if(row.status==='unresolved'){
   findings.push({id:row.id,reason:row.note+(row.issue?' · '+row.issue:'')});
   if(row.passage)try{const p=pathThrough(network(model,circuit),[row.supplyPoint,row.passage.a,row.passage.b,row.returnPoint]);record(row,p,circuit,false,false,'Unresolved service · interfaces positively blinded');}catch{}continue;
  }
  // In low demand, close loads and demonstrate a source recycle instead.
  if(choices.scenario==='minimumFlow'){if(!isSecondary)usedServices.add(row.service);continue;}
  try{
   const net=network(model,circuit),source=secondary||u.loops[row.service],pump=isSecondary?source.pump:source.pumpSpecs[pumpIndex];
   const points=isSecondary?[source.return,pump.inlet,pump.outlet,source.supply,row.supplyPoint,row.passage.a,row.passage.b,row.returnPoint,source.return]:[source.gen.inlet,source.gen.outlet,pump.inlet,pump.outlet,source.supply,row.supplyPoint,row.passage.a,row.passage.b,row.returnPoint,source.return,source.gen.inlet];
   const path=pathThrough(net,points),available=baseAvailable&&!closed;
   record(row,path,circuit,isSecondary,available,closed?'Selected branch closed':choices.scenario==='powerLoss'?'Circulation stopped':isSecondary&&!thermalAvailable?'Secondary circulates, but heat removal is unavailable':!baseAvailable?'Primary circulation stopped':!thermalAvailable?'Circulation only; outlet temperature unknown':'Illustrative closed-loop circulation');
  }catch(error){findings.push({id:row.id,reason:'Route unresolved: '+error.message.replaceAll('product','thermal')});}
 }
 if(choices.scenario==='minimumFlow')for(const key of usedServices){const source=u.loops[key],net=network(model,key,true),pump=source.pumpSpecs[pumpIndex],recycle=model.valves.find(v=>v.tag===source.bypassTag);try{
  const p=pathThrough(net,[source.gen.inlet,source.gen.outlet,pump.inlet,pump.outlet,source.supply,recycle.a,recycle.b,source.return,source.gen.inlet]);record({id:key+'-recycle',tag:source.label+' minimum-flow recycle',service:key,owner:source.generation,area:'A-5000'},p,key,false,true,'Illustrative generator/pump recycle; minimum rate and capacity unqualified');
 }catch(e){findings.push({id:key,reason:'Recycle unresolved: '+e.message});}}
 // A branch in a parallel bank closes at its local valve, leaving shared headers available.
 if(choices.scenario==='branchClosed')for(const row of rows){if(/^R-201[ABCD]$/.test(row.id)){const suffix=row.id.at(-1);valveStates['TCV-J-'+suffix]='closed';valveStates['XV-JR-'+suffix]='closed';}else for(const tag of[row.supplyIsolation,row.returnIsolation])if(tag)valveStates[tag]='closed';}
 const pumpOff=!runningPrimary;for(const source of Object.values(u.loops))for(const [i,p]of source.pumpSpecs.entries())for(const tag of[p.inValve,p.outValve])if(pumpOff||i!==pumpIndex)valveStates[tag]='closed';
 // Partial extents affect drawing only; route and isolation validation still use complete loops.
 for(const valve of model.valves)if(paths.some(p=>p.segments.some(s=>s.tag===valve.tag&&roleMatch(s.role,choices.extent))))for(const id of valve.partIds||[]){allIds.add(id);if(!colours.has(id))colours.set(id,'#d9e4ef');}
 for(const p of model.parts)if(p.thermalInsulation&&allIds.has(p.insulationFor)){allIds.add(p.id);colours.set(p.id,colours.get(p.insulationFor)||'#98a6b5');}
 const plan={choices,paths,findings,allIds,colours,renderSegments:[...renderSegments.values()],valveStates,rows:[...requested.values()].filter(Boolean),thermalAvailable,primaryPump:pumpIndex?'B':'A',qualified:false};
 annotateJourneyPassages({steps:paths.map(p=>({paths:[p]}))},model.parts);return plan;
}
