// Field-operator stations and a deliberately simple readings simulation.
// Stations are tagged equipment, tagged valves (with class, actuation and service taken from the
// model) and proposed instruments (from the semantic instrument records). Values are illustrative:
// they drift around generic figures and are not derived from the process model.
const SKIP_TAG=/^(BND|ES|FE|BL|COMMON)(-|\d|$)/;
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

// Model valve type to class and how the operator works it. Self-acting valves cannot be operated.
const VALVE_CLASS={
 lever:['Manual valve','manual'],wheel:['Manual valve','manual'],'bulk-isolation':['Isolation valve','manual'],isolation:['Isolation valve','manual'],
 'maintenance-blind':['Maintenance blind','manual'],'equipment-gate':['Equipment gate','manual'],'equipment-door':['Equipment door','manual'],
 'pneumatic-isolation':['Pneumatic isolation valve','actuated'],control:['Control valve','actuated'],automatic:['Automatic valve','actuated'],'powder-airlock':['Rotary airlock','actuated'],
 check:['Check valve','self-acting'],relief:['Relief valve','self-acting'],regulator:['Regulator','self-acting']
};
export function valveInfo(v){
 const [valveClass,base]=VALVE_CLASS[v.type]||['Valve','manual'];
 const actuation=base==='manual'&&(v.pneumatic||v.pneumaticIsolation||v.actuator)?'actuated':base;
 return {valveClass,actuation,control:v.type==='control'||/^(F|P|T|L)?CV-/.test(v.tag||'')};
}

function routeIndex(model){
 const byPart=new Map();
 for(const r of model?.routes||[])for(const id of r.partIds||[])if(!byPart.has(id))byPart.set(id,r);
 return byPart;
}

// Tagged equipment and tagged valves with a plan position (x, z) and a reach height (y).
export function buildStations(model,instruments=[]){
 const out=[],seen=new Set(),equipment=model?.equipment||{},routes=routeIndex(model);
 for(const [id,e] of Object.entries(equipment)){
  const tag=e?.tag;if(!tag||SKIP_TAG.test(tag)||!Number.isFinite(e.x)||!Number.isFinite(e.z)||seen.has(tag))continue;
  seen.add(tag);
  out.push({key:'eq:'+tag,tag,label:e.label||tag,kind:classifyEquipment(tag,e.label),type:'equipment',areaId:e.areaId||'',x:e.x,z:e.z,y:(Number.isFinite(e.bottom)?e.bottom:0)+.8,equipmentId:id});
 }
 for(const v of model?.valves||[]){
  if(!v?.tag||seen.has(v.tag)||!Array.isArray(v.a)||!Array.isArray(v.b))continue;
  const x=(v.a[0]+v.b[0])/2,y=(v.a[1]+v.b[1])/2,z=(v.a[2]+v.b[2])/2;if(![x,y,z].every(Number.isFinite))continue;
  seen.add(v.tag);
  const info=valveInfo(v),route=routes.get((v.partIds||[])[0]),owner=equipment[v.reactor];
  out.push({key:'valve:'+v.tag,tag:v.tag,label:v.label||v.tag,kind:info.actuation==='self-acting'?'check-valve':'valve',type:'valve',valveClass:info.valveClass,actuation:info.actuation,control:info.control,
   service:route?.service||'',areaId:owner?.areaId||'',x,z,y,normal:v.normalState==='closed'?'closed':v.normalState==='open'?'open':null});
 }
 out.push(...buildInstrumentStations(instruments,out,seen));
 return out;
}

// Instruments sit at the equipment they belong to. Records whose asset or tag is not a station here are left out.
export function buildInstrumentStations(instruments,stations,seen=new Set(stations.map(s=>s.tag))){
 const byTag=new Map(stations.filter(s=>s.type==='equipment').map(s=>[s.tag,s])),out=[];
 for(const i of instruments||[]){
  const host=byTag.get(i.asset);if(!host||seen.has(i.tag))continue;
  seen.add(i.tag);
  out.push({key:'inst:'+i.tag,tag:i.tag,label:i.variable+' on '+i.asset,kind:'instrument',type:'instrument',areaId:host.areaId||i.area,x:host.x,z:host.z,y:Math.min(host.y,2.4),
   asset:i.asset,also:i.also||[],variable:i.variable,purpose:i.purpose,setpoint:i.setpoint,alarm:i.alarm,interlock:i.interlock,status:i.status});
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

// Instrument signal by measured variable: unit, nominal, swing, low and high limits (illustrative).
export function instrumentSpec(i){
 const text=(i.variable+' '+i.tag).toLowerCase();
 if(/(^|[^a-z])ph([^a-z]|$)/i.test(i.variable)||/^pH/.test(i.tag)){
  const m=/pH\s*([\d.]+)\s*(?:-|to|–)\s*([\d.]+)/i.exec(i.variable+' '+i.setpoint);
  const lo=m?+m[1]:5,hi=m?+m[2]:8;return {unit:'pH',nom:(lo+hi)/2,amp:Math.max(.15,(hi-lo)/4),lo:lo-.5,hi:hi+.5,dec:2};
 }
 if(/diff|dp\b/.test(text))return {unit:'kPa',nom:35,amp:6,lo:0,hi:100,dec:0};
 if(/solid mass|^w[a-z]*-/.test(text)||/mass flow/.test(text))return {unit:'kg/h',nom:120,amp:15,lo:10,hi:300,dec:0};
 if(/level/.test(text)||/^l[a-z]*-/.test(i.tag.toLowerCase()))return {unit:'%',nom:55,amp:10,lo:15,hi:90,dec:0};
 if(/temp/.test(text)||/^t[a-z]*-/.test(i.tag.toLowerCase()))return {unit:'°C',nom:45,amp:4,lo:5,hi:90,dec:1};
 if(/press|draft/.test(text)||/^p[a-z]*-/.test(i.tag.toLowerCase()))return {unit:'bar',nom:2.5,amp:.3,lo:.5,hi:5,dec:2};
 if(/flow/.test(text)||/^f[a-z]*-/.test(i.tag.toLowerCase()))return {unit:'m³/h',nom:8,amp:1.5,lo:1,hi:20,dec:1};
 return {unit:'%',nom:50,amp:5,lo:5,hi:95,dec:0};
}

// Late-running excursion for about one asset in seventeen, so a round has something to find.
function excursion(tag,t){return hashTag(tag)%17===3?clamp((t-90)/360,0,1):0;}

export function createOperatorSim(stations=[]){
 const byTag=new Map(stations.map(s=>[s.tag,s]));
 const valves=new Map(),pumps=new Map();
 const valveOpen=s=>valves.has(s.tag)?valves.get(s.tag):s.normal!=='closed';
 const pumpRunning=s=>pumps.has(s.tag)?pumps.get(s.tag):hashTag(s.tag)%7!==0;
 function readings(s,t){
  if(s.type==='valve'){
   if(s.actuation==='self-acting')return [{name:'Condition',unit:'',value:s.valveClass==='Relief valve'?'seated, no weep':'in line, no leak or noise',status:'ok'}];
   const open=valveOpen(s),out=[{name:'Position',unit:'',value:open?'open':'closed',status:s.normal==null||open===(s.normal!=='closed')?'ok':'off-normal'}];
   if(s.control)out.push({name:'Opening',unit:'%',value:open?Math.round(35+unit(s.tag,'cv')*30+Math.sin(t/25+unit(s.tag,'p')*6)*4):0,status:'ok'});
   return out;
  }
  if(s.type==='instrument'){
   const spec=instrumentSpec(s),ex=excursion(s.tag,t),phase=unit(s.tag,'ip')*6.283;
   const value=spec.nom*(.92+unit(s.tag,'in')*.16)+spec.amp*(Math.sin(t/(30+unit(s.tag,'ipp')*50)+phase)+Math.sin(t*1.3+phase*3)*.15)+(spec.hi-spec.nom)*1.2*ex;
   const status=value>spec.hi?'high':value<spec.lo?'low':'ok';
   return [{name:s.variable,unit:spec.unit,value:+value.toFixed(spec.dec),status}];
  }
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
  addStations(list){for(const s of list){if(!byTag.has(s.tag)){byTag.set(s.tag,s);stations.push(s);}}},
  setValve(s,open){valves.set(s.tag,!!open);},
  setPump(s,run){pumps.set(s.tag,!!run);},
  reset(){valves.clear();pumps.clear();}
 };
}

// One round: per area, key equipment first (pumps, reactors, tanks, filters), then a few valves and
// instruments, each group ordered by nearest neighbour from the previous stop.
export function planRound(stations,areaId='',{equipmentPerArea=5,valvesPerArea=3,instrumentsPerArea=2}={}){
 const areas=[...new Set(stations.map(s=>s.areaId).filter(Boolean))].filter(a=>!areaId||a===areaId)
  .sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
 const rank={pump:0,reactor:1,tank:2,filter:3,exchanger:4,equipment:5};
 const plan=[];let cursor=null;
 const order=list=>{const left=[...list],out=[];while(left.length){let bi=0;if(cursor){let bd=Infinity;left.forEach((s,i)=>{const d=Math.hypot(s.x-cursor.x,s.z-cursor.z);if(d<bd){bd=d;bi=i;}});}const s=left.splice(bi,1)[0];out.push(s);cursor=s;}return out;};
 const spread=(list,n)=>{const step=Math.max(1,Math.floor(list.length/Math.max(1,n)));return list.filter((_,i)=>i%step===0).slice(0,n);};
 const byTag=(a,b)=>a.tag.localeCompare(b.tag,undefined,{numeric:true});
 for(const area of areas){
  const here=stations.filter(s=>s.areaId===area);
  const eq=here.filter(s=>s.type==='equipment').sort((a,b)=>rank[a.kind]-rank[b.kind]||byTag(a,b)).slice(0,equipmentPerArea);
  const valves=spread(here.filter(s=>s.kind==='valve').sort(byTag),valvesPerArea);
  const instruments=spread(here.filter(s=>s.type==='instrument'&&s.status==='proposed loop').sort(byTag),instrumentsPerArea);
  for(const s of order(eq))plan.push({kind:'reading',tag:s.tag});
  for(const s of order(valves))plan.push({kind:'check-valve',tag:s.tag});
  for(const s of order(instruments))plan.push({kind:'reading',tag:s.tag});
 }
 return plan;
}
