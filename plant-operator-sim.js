// Field-operator stations and a deliberately simple readings simulation.
// Values are illustrative only: they drift around nominal figures and are not
// derived from the process model. Valves and equipment come from tagged model items.
const SKIP_TAG=/^(BND|ES|FE|BL|COMMON)(-|d|$)/;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function hashTag(tag){let h=2166136261;for(let i=0;i<tag.length;i++){h^=tag.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
const unit=(tag,salt)=>((hashTag(tag+'|'+salt)%10000)/10000);

export function classifyEquipment(tag,label=''){
 const text=String(label);
 if(/^P-?\d/.test(tag)||/pump/i.test(text))return 'pump';
 if(/^(R|RV)-?\d/.test(tag)||/reactor|oxidation/i.test(text))return 'reactor';
 if(/^(T|TK|V|BIN|H|SL)-?\d/.test(tag)||/tank|vessel|hopper|silo|receiver/i.test(text))return 'tank';
 if(/^(F|GF|CF|UF|TFF|MMF)-?\d/.test(tag)||/filter|membrane/i.test(text))return 'filter';
 if(/^(HX|TCU|E|CH|DC)-?\d/.test(tag)||/exchanger|chiller|cooler|heater/i.test(text))return 'exchanger';
 return 'equipment';
}

// Tagged equipment and tagged valves with a plan position (x, z) and a reach height (y).
export function buildStations(model){
 const out=[],seen=new Set();
 const equipment=model?.equipment||{};
 for(const [id,e] of Object.entries(equipment)){
  const tag=e?.tag;if(!tag||SKIP_TAG.test(tag)||!Number.isFinite(e.x)||!Number.isFinite(e.z)||seen.has(tag))continue;
  seen.add(tag);
  out.push({key:'eq:'+tag,tag,label:e.label||tag,kind:classifyEquipment(tag,e.label),type:'equipment',areaId:e.areaId||'',x:e.x,z:e.z,y:(Number.isFinite(e.bottom)?e.bottom:0)+.8,equipmentId:id});
 }
 for(const v of model?.valves||[]){
  if(!v?.tag||seen.has(v.tag)||!Array.isArray(v.a)||!Array.isArray(v.b))continue;
  const x=(v.a[0]+v.b[0])/2,y=(v.a[1]+v.b[1])/2,z=(v.a[2]+v.b[2])/2;if(![x,y,z].every(Number.isFinite))continue;
  seen.add(v.tag);
  const owner=equipment[v.reactor];
  out.push({key:'valve:'+v.tag,tag:v.tag,label:v.label||v.tag,kind:v.type==='check'?'check-valve':'valve',type:'valve',areaId:owner?.areaId||'',x,z,y,normal:v.normalState==='closed'?'closed':'open'});
 }
 return out;
}

const SPECS={
 pump:[['Discharge pressure','bar',3.4,.25,1.5,5.5],['Motor current','A',18,1.2,6,30],['Vibration','mm/s',2.1,.5,0,7.1],['Bearing temperature','°C',54,3,10,85]],
 tank:[['Level','%',58,12,15,90],['Temperature','°C',32,3,5,60],['Pressure','kPa g',2,1,-1,10]],
 reactor:[['Temperature','°C',46,4,5,80],['Pressure','kPa g',12,3,-1,40],['Agitator current','A',22,1.5,8,40]],
 filter:[['Differential pressure','kPa',45,8,0,140],['Inlet pressure','bar',2.4,.2,.5,5],['Filtrate flow','m³/h',3.2,.4,.5,6]],
 exchanger:[['Inlet temperature','°C',72,3,10,110],['Outlet temperature','°C',48,3,5,90],['Differential pressure','kPa',35,6,0,100]],
 equipment:[['Local pressure','bar',1.8,.2,0,4],['Casing temperature','°C',38,3,5,70]]
};

// Late-running excursion for about one asset in seventeen, so a round has something to find.
function excursion(tag,t){return hashTag(tag)%17===3?clamp((t-90)/360,0,1):0;}

export function createOperatorSim(stations=[]){
 const byTag=new Map(stations.map(s=>[s.tag,s]));
 const valves=new Map(),pumps=new Map();
 const valveOpen=s=>valves.has(s.tag)?valves.get(s.tag):s.normal!=='closed';
 const pumpRunning=s=>pumps.has(s.tag)?pumps.get(s.tag):hashTag(s.tag)%7!==0;
 function readings(s,t){
  if(s.type==='valve')return [{name:'Position',unit:'',value:valveOpen(s)?'open':'closed',status:valveOpen(s)===(s.normal!=='closed')?'ok':'off-normal'}];
  const spec=SPECS[s.kind]||SPECS.equipment,run=s.kind==='pump'?pumpRunning(s):true,ex=excursion(s.tag,t),out=[];
  for(const [i,[name,unitText,nom,amp,lo,hi]] of spec.entries()){
   let value;
   if(!run)value=name==='Bearing temperature'?24:0;
   else{
    const phase=unit(s.tag,i)*6.283,wave=Math.sin(t/(40+unit(s.tag,'p'+i)*60)+phase),noise=Math.sin(t*1.7+phase*3)*.18;
    value=nom*(.9+unit(s.tag,'n'+i)*.2)+amp*(wave+noise);
    if(ex&&i===(s.kind==='pump'?2:0))value+=(hi-nom)*1.25*ex;
   }
   const dec=Math.abs(nom)>=20?0:Math.abs(nom)>=2?1:2;
   const status=!run?'stopped':value>hi?'high':value<lo?'low':'ok';
   out.push({name,unit:unitText,value:+value.toFixed(dec),status});
  }
  if(s.kind==='pump')out.unshift({name:'State',unit:'',value:run?'running':'stopped',status:run?'ok':'stopped'});
  return out;
 }
 return {
  byTag,stations,readings,valveOpen,pumpRunning,
  setValve(s,open){valves.set(s.tag,!!open);},
  setPump(s,run){pumps.set(s.tag,!!run);},
  reset(){valves.clear();pumps.clear();}
 };
}

// One round: per area, key equipment first (pumps, reactors, tanks, filters), then a few
// valves, each group ordered by nearest neighbour from the previous stop.
export function planRound(stations,areaId='',{equipmentPerArea=5,valvesPerArea=3}={}){
 const areas=[...new Set(stations.map(s=>s.areaId).filter(Boolean))].filter(a=>!areaId||a===areaId)
  .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const rank={pump:0,reactor:1,tank:2,filter:3,exchanger:4,equipment:5};
 const plan=[];let cursor=null;
 const order=list=>{const left=[...list],out=[];while(left.length){let bi=0;if(cursor){let bd=Infinity;left.forEach((s,i)=>{const d=Math.hypot(s.x-cursor.x,s.z-cursor.z);if(d<bd){bd=d;bi=i;}});}const s=left.splice(bi,1)[0];out.push(s);cursor=s;}return out;};
 for(const area of areas){
  const here=stations.filter(s=>s.areaId===area);
  const eq=here.filter(s=>s.type==='equipment').sort((a,b)=>rank[a.kind]-rank[b.kind]||a.tag.localeCompare(b.tag,undefined,{numeric:true})).slice(0,equipmentPerArea);
  const valves=here.filter(s=>s.kind==='valve').sort((a,b)=>a.tag.localeCompare(b.tag,undefined,{numeric:true}));
  const step=Math.max(1,Math.floor(valves.length/Math.max(1,valvesPerArea))),picked=valves.filter((_,i)=>i%step===0).slice(0,valvesPerArea);
  for(const s of order(eq))plan.push({kind:'reading',tag:s.tag});
  for(const s of order(picked))plan.push({kind:'check-valve',tag:s.tag});
 }
 return plan;
}
