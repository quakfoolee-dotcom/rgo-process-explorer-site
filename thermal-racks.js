// Coordinate stacked thermal rails on common columns before fallback supports.
// All pipe bearing positions are retained. Sections and reactions remain HOLD.
import {TRANSPORT_ZONES} from './transport-layout.js';
import {PIPE_RACK_LAYOUT} from './pipe-rack-layout.js';
export function buildCoordinatedThermalRacks(ctx){
 const {items,assigned,clear,column,beam,s,parts,setContext,racks,sharedRails,railMount,attachRail}=ctx,groups=new Map();
 for(const i of items){if(i.entry.areaId!=='A-5000'||i.vertical||i.point[1]<2.6)continue;const key=i.axis+'|'+Math.floor(i.point[i.perp]/4);if(!groups.has(key))groups.set(key,{axis:i.axis,perp:i.perp,items:[]});groups.get(key).items.push(i);}
 let serial=0;
 function build(g,depth=0){
  const todo=g.items.filter(i=>!assigned.has(i));if(todo.length<6)return;const {axis,perp}=g,lo=Math.min(...todo.map(i=>i.point[axis])),hi=Math.max(...todo.map(i=>i.point[axis]));if(hi-lo<3)return;
  const tiers=new Map();for(const i of todo){const k=Math.floor((i.point[1]-2.6)/2.2);if(!tiers.has(k))tiers.set(k,[]);tiers.get(k).push(i);}
  const cross=todo.reduce((a,i)=>a+i.point[perp],0)/todo.length;let best=null;
  for(const below of[true,false])for(const shift of[0,.5,-.5,1,-1,1.5,-1.5,2,-2]){
   const plans=[...tiers.values()].map(list=>({list,y:below?Math.min(...list.map(i=>i.point[1]-i.e.radius))-.25:Math.max(...list.map(i=>i.point[1]+i.e.radius))+.35,from:Math.floor((Math.min(...list.map(i=>i.point[axis]))-.3)/6)*6,to:Math.ceil((Math.max(...list.map(i=>i.point[axis]))+.3)/6)*6}));
   const min=Math.min(...plans.map(p=>p.from)),max=Math.max(...plans.map(p=>p.to)),stations=[];let valid=true,bridged=false;
   for(let u=min;u<=max+.01;u+=6){const top=Math.max(...plans.filter(p=>u>=p.from&&u<=p.to).map(p=>p.y));if(!Number.isFinite(top))continue;let point=null;for(const dx of[0,.35,-.35,.7,-.7,1.1,-1.1]){const q=[0,top,0];q[axis]=u+dx;q[perp]=cross+shift;if(clear([q[0],.02,q[2]],q,.34)){point=q;break;}}if(!point){
    const q=[0,top,0];q[axis]=u;q[perp]=cross+shift;
    const inEntrance=TRANSPORT_ZONES.some(z=>z.id.startsWith('TR-wash-wastewater-')&&q[0]+.17>=z.min[0]&&q[0]-.17<=z.max[0]&&q[2]+.17>=z.min[2]&&q[2]-.17<=z.max[2]);
    // Bridge only an interior station blocked by this nominated vehicle route.
    // End columns and every beam/attachment still need a clear physical path.
    if(u>min&&u<max&&inEntrance){bridged=true;continue;}
    valid=false;break;
   }stations.push({u,point,top});}
   if(bridged&&stations.some((p,i)=>i&&p.point[axis]-stations[i-1].point[axis]>PIPE_RACK_LAYOUT.vehicleCrossingMaximumConceptSpanM))valid=false;
   if(!valid)continue;const rails=[];let count=0;
   for(const p of plans){const first=stations.findLast(s=>s.u<=p.from),last=stations.find(s=>s.u>=p.to);if(!first||!last){valid=false;break;}const a=[...first.point],z=[...last.point];a[1]=z[1]=p.y;if(!clear(a,z,.12)){valid=false;break;}const rail={axis,a,z,y:p.y},served=p.list.filter(i=>railMount(i,rail));count+=served.length;rails.push({rail,served});}
   // An extended tier also extends its end-column duty; check the taller column.
   if(valid)for(const station of stations){station.top=Math.max(station.top,...rails.filter(p=>station.point[axis]>=p.rail.a[axis]&&station.point[axis]<=p.rail.z[axis]).map(p=>p.rail.y));station.point[1]=station.top;if(!clear([station.point[0],.02,station.point[2]],station.point,.34)){valid=false;break;}}
   if(valid&&count>=6&&(!best||count>best.count))best={stations,rails,count,bridged};if(count===todo.length&&valid)break;
  }
  if(!best||best.count/todo.length<.45){if(depth<6&&hi-lo>6){const mid=(lo+hi)/2;build({...g,items:todo.filter(i=>i.point[axis]<mid)},depth+1);build({...g,items:todo.filter(i=>i.point[axis]>=mid)},depth+1);}return;}
  const tag='PR-A5000-T'+String(++serial).padStart(3,'0'),owner=todo[0].e.reactor,start=parts.length;setContext(owner,tag+' coordinated thermal rack');
  const rack={id:tag,areaId:'A-5000',servedAreas:['A-5000'],equipmentIds:[],designStatus:'proposed',kind:'Shared multi-tier thermal rack',stations:best.stations.map(s=>s.point),foundationElevation:0,partIds:[],supportIds:[],loadsStatus:'HOLD: combined pipe reactions, lateral stability, guide/anchor loads, connection strength and foundations',spareSpaceTargetFraction:.2,layoutPolicy:'Common columns carry separate thermal rails; vehicle and maintenance reservations govern placement',coordinated:true};
  rack.bayLengthsM=best.stations.slice(1).map((p,j)=>p.point[axis]-best.stations[j].point[axis]);
  rack.vehicleCrossing=best.bridged;
  if(best.bridged){rack.layoutPolicy+='; entrance portal replaces obstructing intermediate columns while retaining attached pipe bearings';rack.loadsStatus+='; entrance portal span, deflection and lateral/seismic load paths require calculation before construction';}
  const cols=best.stations.map((p,j)=>({...column(p.point,p.top,tag+'-'+j),...p}));
  for(const {rail}of best.rails){rail.part=beam(rail.a,rail.z,.12,tag+' shared longitudinal rail');rail.rack=rack;s.load(rail.part,tag+' multi-tier gravity duty');for(const col of cols)if(col.point[axis]>=rail.a[axis]-.01&&col.point[axis]<=rail.z[axis]+.01){const at=[...col.point];at[1]=rail.y;s.join(col.post,rail.part,at,tag+' tier / common column');}sharedRails.push(rail);}
  rack.partIds=parts.slice(start).map(p=>p.id);for(const p of parts.slice(start)){p.rackId=tag;p.supportAreaId='A-5000';p.servedEquipmentIds=rack.equipmentIds;}racks.push(rack);
  for(const {rail,served}of best.rails)for(const item of served){const mount=railMount(item,rail);if(mount)attachRail(item,rail,mount);}
 }
 for(const g of [...groups.values()].sort((a,b)=>b.items.length-a.items.length))build(g);
}
