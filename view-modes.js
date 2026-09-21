import {localAreaMembership} from './area-selection.js';
import {ARGON_SUPPLY} from './argon-distribution.js';
import {DESIGN_STATUSES} from './engineering-register.js';
import {emergencyPartColour} from './containment-bc.js';
export const VIEW_MODES={material:'Physical appearance',status:'Design status',flow:'Flow routes'};
export const APPEARANCE_HELP='Realistic equipment colors and surface finishes.';
export const REVIEW_COLOR='#ffc66d';
export function viewAppearance(mode,record,{selected=false,clash=false,route=false,flowColor='#52e2ee',context=false,emergencyRole=null,firePoint=null,walkProtection=null,physicalColor='#ffffff'}={}){
 // Selection uses a separate white outline. Closed-valve markers do not recolor the fluid.
 if(clash)return {color:'#ff6692',reason:'Interference'};
 if(firePoint||walkProtection)return {color:mode==='material'?'#ffffff':physicalColor,reason:'Fire-point physical identification'};
 if(mode==='status')return {color:DESIGN_STATUSES[record.designStatus].color,reason:DESIGN_STATUSES[record.designStatus].label};
 if(mode==='flow'&&emergencyRole)return {color:emergencyPartColour(emergencyRole)||'#ffd000',reason:'Emergency equipment identification; separate from process route palette'};
 if(mode==='flow')return {color:route?flowColor:context?'#c6d4df':'#43546b',reason:route?'Service route':'Context'};
 return {color:'#ffffff',reason:'Material finish'};
}
export function recordVisible(record,areaId='all',showProposed=true){return (areaId==='all'||record.areaId===areaId)&&(showProposed||record.designStatus!=='proposed');}
// One visibility index serves geometry, hierarchy, routes and legend; owner records remain unchanged.
export function prepareAreaVisibility(model,register,supportContext=new Map()){
 const partIds=new Set(model.parts.map(p=>p.id)),extraParts=new Map(),extraRoutes=new Map(),extraFlowParts=new Map();
 const add=(map,area,ids)=>{if(!map.has(area))map.set(area,new Set());for(const id of ids)map.get(area).add(id);};
 for(const {areaId:area,owner,unit}of ARGON_SUPPLY.branches){
  const local=model[unit];
  if(!register[owner]||!local)continue;
  const owned=model.parts.filter(p=>p.reactor===owner).map(p=>p.id),ownedRoutes=model.routes.filter(r=>r.reactor===owner).map(r=>r.id);
  add(extraFlowParts,area,owned);add(extraFlowParts,'A-6000',owned);add(extraParts,area,owned);add(extraRoutes,area,ownedRoutes);
  add(extraParts,'A-6000',owned);add(extraRoutes,'A-6000',ownedRoutes);
  add(extraParts,'A-6000',local.argonSupportPartIds||[]);for(const tower of model.accessSystem?.towers||[])if(tower.served.includes(owner))add(extraParts,'A-6000',tower.partIds);
  const supplyRoutes=model.routes.filter(r=>r.reactor===117&&r.toArea===area);add(extraRoutes,area,supplyRoutes.map(r=>r.id));add(extraParts,area,supplyRoutes.flatMap(r=>r.partIds));add(extraFlowParts,area,supplyRoutes.flatMap(r=>r.partIds));
  for(const connection of local.argonConnections||[]){
   add(extraParts,'A-6000',[connection.bodyId,...connection.partIds,...supportContext.get(connection.owner)||[]]);
   // Consumer shells are context, not all of their product / cooling / vent routes.
   add(extraFlowParts,'A-6000',connection.partIds);const nozzleIds=new Set(connection.partIds);add(extraRoutes,'A-6000',model.routes.filter(r=>r.partIds.some(id=>nozzleIds.has(id))).map(r=>r.id));
   add(extraParts,'A-6000',model.parts.filter(p=>p.reactor===connection.owner&&p.system==='frame').map(p=>p.id));
  }
 }
 for(const connection of model.wastewater?.connections||[]){
  const area=connection.fromArea,source=model.ports.find(p=>p.id===connection.tag),near=source?model.parts.filter(p=>p.reactor===source.reactor&&p.position.distanceTo({x:source.point[0],y:source.point[1],z:source.point[2]})<.8).map(p=>p.id):[];
  add(extraParts,area,[...connection.partIds,...connection.contextPartIds||[]]);add(extraFlowParts,area,connection.partIds);add(extraRoutes,area,connection.routeIds);
  add(extraParts,'A-1000',near);add(extraFlowParts,'A-1000',near);
 }
 for(const route of model.routes.filter(r=>r.toArea==='A-2000'&&r.areaId==='A-1000')){add(extraParts,'A-2000',route.partIds);add(extraFlowParts,'A-2000',route.partIds);add(extraRoutes,'A-2000',[route.id]);}
 for(const connection of [...model.reclaimedWater?.connections||[],...model.ventGas?.connections||[],...model.compressedAir?.connections||[]]){const area=connection.fromArea&&connection.toArea==='A-3000'?connection.fromArea:connection.toArea;add(extraParts,area,connection.partIds);add(extraFlowParts,area,connection.partIds);add(extraRoutes,area,connection.routeIds);}
 for(const r of model.routes.filter(r=>['A-2000','A-3000'].includes(r.areaId)&&r.toArea==='A-1000')){add(extraParts,'A-1000',r.partIds);add(extraFlowParts,'A-1000',r.partIds);add(extraRoutes,'A-1000',[r.id]);}
 const bearingById=new Map((model.pipeSupportSystem?.supports||[]).map(s=>[s.id,s]));
 for(const area of new Set([...Object.values(register).map(e=>e.areaId),...extraParts.keys()]))for(const rack of model.pipeSupportSystem?.racks||[]){
  if(rack.servedAreas.includes(area)||rack.supportIds.some(id=>{const b=bearingById.get(id);return b&&(register[b.equipmentId]?.areaId===area||extraParts.get(area)?.has(b.partId));}))add(extraParts,area,rack.partIds);
 }
 for(const ids of extraParts.values())for(const id of ids)if(!partIds.has(id))ids.delete(id);
 const local=localAreaMembership(model,register,extraParts);
 return {extraParts,extraRoutes,extraFlowParts,local};
}
export function createAreaVisibility(model,register,supportContext=new Map(),prepared=null){
 const {extraParts,extraRoutes,extraFlowParts,local}=prepared||prepareAreaVisibility(model,register,supportContext);let includeConnected=false;
 const partVisible=(p,area='all',proposed=true)=>{
  if(!proposed&&(p.designStatus==='proposed'||register[p.reactor]?.designStatus==='proposed'))return false;
  if(area!=='all'&&!includeConnected&&local.memberships.has(area))return local.memberships.get(area).has(p.id);
  return (includeConnected&&local.memberships.get(area)?.has(p.id))||recordVisible(register[p.reactor],area,proposed)||(proposed&&p.containmentOwners?.some(id=>recordVisible(register[id],area,proposed)))||(proposed&&extraParts.get(area)?.has(p.id))||false;
 };
 const routeVisible=(r,area='all',proposed=true)=>((area!=='all'&&!includeConnected&&local.memberships.has(area))?r.partIds.some(id=>local.memberships.get(area).has(id)):(recordVisible(register[r.reactor],area,proposed)||(proposed&&extraRoutes.get(area)?.has(r.id))||false))&&(proposed||register[r.reactor]?.designStatus!=='proposed');
 const owners=new Map();for(const p of model.parts){if(!owners.has(p.reactor))owners.set(p.reactor,[]);owners.get(p.reactor).push(p);}
 return {partVisible,routeVisible,setConnected:value=>{includeConnected=!!value;},localMemberships:local.memberships,localReviews:local.reviews,flowVisible:(p,area='all')=>area==='all'||register[p.reactor].areaId===area||extraFlowParts.get(area)?.has(p.id)||false,equipmentVisible:(id,area,proposed)=>owners.get(id)?.some(p=>partVisible(p,area,proposed))||false,
  memberships:[...extraParts].map(([areaId,ids])=>({areaId,partIds:[...ids].sort((a,b)=>a-b),routeIds:[...extraRoutes.get(areaId)||[]].sort(),role:'Connected interarea service / receiving context; primary ownership retained'}))};
}
