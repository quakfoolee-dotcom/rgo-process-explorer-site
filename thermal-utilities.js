import {thermalRoutePlan} from './thermal-routes.js';
import {thermalGenerator} from './thermal-generator.js';
import {buildThermalInsulation} from './thermal-insulation.js';
import {selectThermalHeaderLayout} from './thermal-header-layout.js';
import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';
import {ventMechanical} from './vent-mechanical.js';
import {createJourneyNetwork} from './product-journey.js';
import {A5000_BASIS,A5000_IDS,THERMAL_SERVICES} from './a5000-basis.js';

export function buildThermalUtilities(h,{design='baseline',routePlanner=thermalRoutePlan}={}){
 const k=processKit(h,.05),s=structuralKit(h),vm=ventMechanical(h),{T,EQUIPMENT,parts,edges,routes,ports,terminals,setContext,b,c,band,nozzle,terminal}=h,V=p=>new T.Vector3(...p);
 const headerLayout=selectThermalHeaderLayout(h),router=routePlanner(h,{design});
 const first=parts.length,firstEdge=edges.length,firstRoute=routes.length,interfaces=[],vessels=[],valves=[],consumers=[],loops={},secondaries={},thermalLinks=[],access=[];
 const tagPart=(p,circuit,role)=>{p.thermalCircuit=circuit;p.thermalRole=role;return p;};
 function mark(start,circuit,role){for(const p of parts.slice(start))tagPart(p,circuit,role);for(const e of edges)if(e.part>=parts[start]?.id){e.thermalCircuit=circuit;e.thermalRole=role;}}
 function L(points,label,circuit,role='supply',r=.05,area='A-5000'){
  const start=parts.length,p=/branch to service station|single secondary .* riser|(?:supply|return) riser$/.test(label)?router.route(points,circuit,r,label):points,route=k.line(p,r,label,'Thermal utility');
  Object.assign(route,{areaId:'A-5000',toArea:area,thermalCircuit:circuit,thermalRole:role,designStatus:'proposed'});mark(start,circuit,role);return route;
 }
 function P(body,path,label,circuit,role){const route=k.passage(body,path,label,'Thermal utility',{internalTo:label});const e=edges.at(-1);e.thermalCircuit=circuit;e.thermalRole=role;route.thermalCircuit=circuit;route.thermalRole=role;tagPart(body,circuit,role);return route;}
 function foundation(id,x,z,w,d,tag){setContext(id,tag+' supports');const pad=b(tag+' anchored skid','frame',[w,.18,d],[x,.09,z],'dark');h.structure.roots.push({part:pad.id,local:[0,-.5,0],elevation:0});return pad;}
 function mounted(p,pad,at,tag){s.join(pad,p,at,tag+' attachment');s.load(p,tag);return p;}
 function valve(a,z,tag,circuit,role,normal='open',type='isolation',r=.05){
  const start=parts.length,axis=V(z).sub(V(a)).normalize(),mid=V(a).lerp(V(z),.5).toArray();
  const body=band(tag+' pressure body','valve',r*1.75,r*.78,V(a).distanceTo(V(z)),mid,'bright',axis.toArray());P(body,[a,z],tag+' passage',circuit,role);edges.at(-1).barrierTag=tag;if(type==='check')edges.at(-1).oneWay=true;
  for(const end of[a,z])h.flange(end,axis.toArray(),r,tag+' mating flange');
  const disc=c(tag+' closure disc','internal',r*.77,.012,mid,'dark',axis.toArray());disc.valveTag=tag;disc.closedQuaternion=disc.quaternion.clone();disc.openQuaternion=new T.Quaternion().setFromAxisAngle(Math.abs(axis.y)>.8?V([1,0,0]):V([0,1,0]),Math.PI/2).multiply(disc.closedQuaternion);disc.quaternion.copy(normal==='open'?disc.openQuaternion:disc.closedQuaternion);
  if(type!=='check'){const stem=Math.abs(axis.y)>.8?[1,0,0]:[0,1,0],base=V(mid).addScaledVector(V(stem),r*1.75),end=base.clone().addScaledVector(V(stem),.14);c(tag+' sealed stem','valve',.018,.14,base.clone().lerp(end,.5).toArray(),'bright',stem);b(tag+' supported actuator','valve',[.14,.14,.14],end.clone().addScaledVector(V(stem),.07).toArray(),'blue');}
  const rec={tag,label:tag,reactor:body.reactor,partIds:parts.slice(start).map(p=>p.id),type,normalState:normal,a,b:z,thermal:true,discId:disc.id,circuit,role};h.valves.push(rec);valves.push(rec);mark(start,circuit,role);
  const pump=EQUIPMENT[body.reactor];if(pump?.tag?.startsWith('A-5')&&(type==='check'||/-(IN|OUT)$/.test(tag))){body.serviceAccess={standing:[pump.x+.875,0,pump.z+.745],method:'Assigned pump-side service bay; isolate and depressurize. Elevated actuator maintenance still requires qualified access.'};}
  return rec;
 }
 function blind(at,axis,tag,circuit,reason,r=.05){const plate=c(tag+' positive blind','head',r*1.65,.035,at,'dark',axis);tagPart(plate,circuit,'inactive');terminal(at,tag+' positively blinded');interfaces.push({tag,point:at,partId:plate.id,disposition:'blinded',reason});}
 function vessel(id,x,z,r,lo,hi,circuit,role,options={}){
  const tag=options.tag||EQUIPMENT[id].tag;setContext(id,tag+' closed liquid enclosure');const start=parts.length,pad=options.pad||foundation(id,x,z,r*2+.3,r*2+.3,tag);
  const floor=c(tag+' lower closure','head',r,.06,[x,lo,z],'steel'),body=band(tag+' shell','shell',r,r-.035,hi-lo,[x,(lo+hi)/2,z],'steel'),roof=c(tag+' upper closure','head',r,.06,[x,hi+.03,z],'steel');body.cut=roof.cut=floor.cut=true;
  const v={id,tag,x,z,r,lo,hi,body,floor,roof,holes:[],pad,centre:[x,(lo+hi)/2,z]};
  for(const dx of[-r*.7,r*.7]){const leg=b(tag+' leg','frame',[.08,lo-.18,.08],[x+dx,(lo+.18)/2,z]);s.join(pad,leg,[x+dx,.18,z],tag+' base');s.join(leg,floor,[x+dx,lo,z],tag+' seat');}s.join(floor,body,[x+r-.017,lo,z],tag+' lower weld');s.join(body,roof,[x+r-.017,hi,z],tag+' upper weld');s.load(body,tag);
  v.port=(label,at,axis,rr=.05,pr=role,neck=.20)=>{setContext(id,tag+' nozzles');const j=parts.length,name=tag+' '+label,out=nozzle(at,axis,neck,name,rr),inside=V(at).addScaledVector(V(axis),-.045).toArray();v.holes.push({p:at,axis,r:rr,name});mark(j,circuit,pr);interfaces.push({tag:name,point:out,axis,disposition:'connected',host:tag});return {out,inside};};
  v.finish=()=>{vm.finishVessel(v);for(const p of parts.slice(start).filter(p=>p.reactor===id)){p.exploreRole='equipment';p.componentAssembly='thermal-'+id;}vessels.push({id,tag,x,z,r,lo,hi,holes:v.holes});};return v;
 }
 function cappedService(v,label,at,axis,circuit,type='drain'){
  const lowDrain=type==='drain'&&axis[1]<0,n=v.port(label,at,axis,.025,'inactive',lowDrain?.10:.20);
  // Take the low-point drain outside the skid before its valve and cap. The
  // previous downward valve/cap terminated at -0.01 m, below the floor.
  const endAxis=lowDrain?[0,0,-1]:axis,a=lowDrain?[v.x,.29,v.z-1.05]:V(n.out).addScaledVector(V(axis),.12).toArray(),z=V(a).addScaledVector(V(endAxis),.16).toArray();
  L(lowDrain?[n.out,[v.x,.29,v.z],a]:[n.out,a],v.tag+' '+label+' neck',circuit,'inactive',.025);
  const dv=valve(a,z,'XV-'+v.tag+'-'+type,circuit,'inactive','closed','isolation',.025);
  if(lowDrain){const body=parts.find(p=>p.id===dv.partIds[0]);body.serviceAccess={standing:[v.x-.65,0,v.z-1.60],method:'Southwest low drain service position; isolated and depressurized maintenance. Coupling reach, collection hose fall and receiving arrangement require qualification.'};}
  blind(z,endAxis,'BL-'+v.tag+'-'+type,circuit,'Isolated '+type+' interface; receiving / filling procedure and pressure qualification required',.025);P(v.body,[n.inside,v.centre],v.tag+' '+label+' internal connection',circuit,'inactive');
 }
 function genPackage(key,cfg){return thermalGenerator(h,key,cfg,{foundation,vessel,L,P,mounted,blind,mark,interfaces,access});}
 for(const [i,[key,cfg]]of Object.entries(THERMAL_SERVICES).entries()){
  const gen=genPackage(key,cfg),z=cfg.z;
  const buffer=vessel(835+i,-23.1,z,.55,.5,2.9,key,'return'),br=buffer.port('return',[-22.55,1.1,z],[1,0,0]),bo=buffer.port('generator feed',[-23.65,1.1,z],[-1,0,0]);P(buffer.body,[br.inside,buffer.centre,bo.inside],buffer.tag+' buffer passage',key,'return');
  cappedService(buffer,'low drain',[-23.1,.47,z],[0,-1,0],key);cappedService(buffer,'fill / vent',[-23.1,2.96,z],[0,1,0],key,'fill');
  const relief=buffer.port('pressure relief',[-22.9,2.96,z-.2],[0,1,0],.025,'inactive'),ra=V(relief.out).add(V([0,.15,0])).toArray(),rb=V(ra).add(V([0,.22,0])).toArray(),rend=V(rb).add(V([.3,0,0])).toArray();L([relief.out,ra],buffer.tag+' unobstructed relief inlet',key,'inactive',.025);const rv=band(buffer.tag+' relief valve pressure enclosure','valve',.06,.0195,.22,V(ra).lerp(V(rb),.5).toArray(),'bright');P(rv,[ra,rb],buffer.tag+' relief device passage',key,'inactive');L([rb,rend],buffer.tag+' relief discharge interface',key,'inactive',.025);terminal(rend,buffer.tag+' relief disposal unresolved');interfaces.push({tag:'PSV-'+buffer.tag,point:rend,disposition:'unresolved',reason:'Relief capacity / setting and safe discharge destination require design. No blind or operating isolation on this relief path.'});P(buffer.body,[relief.inside,buffer.centre],buffer.tag+' relief connection',key,'inactive');
  buffer.finish();
  const expansion=vessel(cfg.buffer,-23.1,z+1.1,.23,.9,1.85,key,'inactive'),ep=expansion.port('liquid',[-23.1,.87,z+1.1],[0,-1,0],.03,'inactive');P(expansion.body,[ep.inside,expansion.centre],expansion.tag+' liquid pocket',key,'inactive');c(expansion.tag+' diaphragm boundary','internal',.19,.035,expansion.centre,'gasket');L([[-22.25,.8,z+.65],[-22.25,.6,z+.65],[-22.25,.6,z+1.1],[-23.1,.6,z+1.1],ep.out],expansion.tag+' pump-suction pressure reference',key,'inactive',.03);expansion.finish();
  setContext(cfg.generation,'Generation and buffer connections');L([bo.out,[-24.4,1.1,z],[-24.4,.8,z-.9],[gen.inlet[0]-.3,.8,z-.9],[gen.inlet[0]-.3,1,z-.9],[gen.inlet[0]-.3,1,z],gen.inlet],cfg.label+' buffer to generator',key,'return');
  const pumpSpecs=[];for(const [j,id]of cfg.pumps.entries()){
   const e=EQUIPMENT[id];access.push({id:'REMOVE-MOTOR-'+e.tag,kind:'removal',areaIds:['A-5000'],min:[e.x-.43,.1,e.z-2.0],max:[e.x+.43,1.8,e.z-.95],note:'Axial motor/coupling withdrawal reservation; isolate, disconnect and verify vendor length and lifting loads'});access.push({id:'OPERATE-'+e.tag,kind:'maintenance',areaIds:['A-5000'],min:[e.x+.45,.02,z-.40],max:[e.x+1.30,2.12,z+.49],note:'Pump-side standing reservation; verify actual operating reach and local service procedure'});setContext(id,e.tag+' circulation');const st=parts.length,pump=k.transferPump(e.x,e.tag,cfg.label+' circulation',{z:e.z});mark(st,key,'supply');for(const p of parts.slice(st).filter(p=>/pump volute$|electric motor$/.test(p.name)))p.serviceAccess={standing:[e.x+.875,0,e.z+.745],method:'Assigned pump-side service bay; isolate and depressurize. Vendor tool reach and axial motor withdrawal remain unqualified.'};const ia=[e.x,.8,e.z+1.05],ib=[e.x,.8,e.z+.82];L([[e.x,.8,z+.65],ia],e.tag+' separate suction branch',key,'supply');valve(ia,ib,'XV-'+e.tag+'-IN',key,'supply',j?'closed':'open');const sa=[e.x,.8,z+.02],sb=[e.x,.8,z-.14];L([ib,sa],e.tag+' inlet isolation outlet',key,'supply');const strainer=band(e.tag+' removable suction strainer','valve',.095,.038,.16,V(sa).lerp(V(sb),.5).toArray(),'bright',[0,0,1]);P(strainer,[sa,sb],e.tag+' strainer water passage',key,'supply');const basket=c(e.tag+' strainer screen','internal',.037,.13,V(sa).lerp(V(sb),.5).toArray(),'inner',[0,0,1]);strainer.serviceAccess={standing:[e.x+.75,0,z+.10],method:'Isolate pump branch and drain before withdrawing strainer; vendor clearance HOLD',withdrawalAxis:[1,0,0]};L([sb,pump.inlet],e.tag+' suction neck',key,'supply');k.instrument('PT-'+e.tag+'-IN',pump.inlet,'pump suction pressure',[0,0,1]);
   const ca=[e.x,1.55,e.z],cb=[e.x,1.75,e.z],oa=[e.x,2,e.z],ob=[e.x,2.2,e.z];L([pump.outlet,ca],e.tag+' discharge neck',key,'supply');valve(ca,cb,'NRV-'+e.tag,key,'supply','open','check');L([cb,oa],e.tag+' check outlet',key,'supply');valve(oa,ob,'XV-'+e.tag+'-OUT',key,'supply',j?'closed':'open');L([ob,[e.x,2.4,e.z]],e.tag+' separate discharge branch',key,'supply');pumpSpecs.push({...pump,id,tag:e.tag,inValve:'XV-'+e.tag+'-IN',outValve:'XV-'+e.tag+'-OUT'});
  }
  setContext(cfg.header,cfg.label+' shared manifolds');
  const sepa=[-25,1.5,z],sepb=[-24.5,1.5,z];L([gen.outlet,sepa],cfg.label+' generator outlet',key,'supply');const separator=band(cfg.label+' air and dirt separator body','valve',.16,.05,.5,[-24.75,1.5,z],'bright',[1,0,0]);P(separator,[sepa,sepb],cfg.label+' air and dirt separator passage',key,'supply');
  const spad=foundation(cfg.header,-24.75,z,.4,.4,cfg.label+' separator'),support=b(cfg.label+' separator pedestal','frame',[.1,1.18,.1],[-24.75,.77,z]);s.join(spad,support,[-24.75,.18,z],cfg.label+' separator base');s.join(support,separator,[-24.75,1.35,z],cfg.label+' separator seat');s.load(separator,cfg.label+' air and dirt separator');
  const ventIn=[-24.75,1.65,z],ventOut=[-24.0,1.92,z];L([ventIn,[-24.0,1.65,z],ventOut],cfg.label+' air-removal neck',key,'inactive',.025);const av=c(cfg.label+' automatic air vent enclosure','valve',.06,.12,[-24.0,1.98,z],'bright');terminal(ventOut,cfg.label+' automatic vent connection');interfaces.push({tag:'AV-'+cfg.supplyLabel,point:ventOut,disposition:'unresolved',reason:'Automatic air removal represented; discharge management, service isolation and vent pressure/temperature rating require design'});
  L([sepb,[-24.3,1.5,z],[-24.3,1.5,z+.65],[-24.3,.8,z+.65],[EQUIPMENT[cfg.pumps[0]].x,.8,z+.65],[EQUIPMENT[cfg.pumps[1]].x,.8,z+.65],[EQUIPMENT[cfg.pumps[1]].x+.2,.8,z+.65]],cfg.label+' single suction manifold',key,'supply');
  L([[EQUIPMENT[cfg.pumps[0]].x-.4,2.4,z-.7],[EQUIPMENT[cfg.pumps[0]].x,2.4,z-.7],[EQUIPMENT[cfg.pumps[1]].x,2.4,z-.7],[-17.3,2.4,z-.7]],cfg.label+' single discharge manifold',key,'supply');blind([EQUIPMENT[cfg.pumps[0]].x-.4,2.4,z-.7],[-1,0,0],'BL-'+key+'-DISCHARGE',key,'Closed manifold end');blind([EQUIPMENT[cfg.pumps[1]].x+.2,.8,z+.65],[1,0,0],'BL-'+key+'-SUCTION',key,'Closed manifold end');

  const sup=[-17.3,2.4,z-.7],ret=[-17.3,1.1,z+1.3];L([ret,[-22.3,1.1,z+1.3],[-22.3,1.1,z],br.out],cfg.label+' return to buffer',key,'return');
  const ba=[-17.3,2.4,z-.2],bb=[-17.3,2.4,z+.05];L([sup,ba],cfg.label+' minimum-flow takeoff',key,'bypass');valve(ba,bb,'CV-'+(5111+i*100),key,'bypass','closed','control');L([bb,[-17.3,1.1,z+.05],ret],cfg.label+' minimum-flow recycle',key,'bypass');
  const mainY=headerLayout.primary[key],spineS=[-14.1,mainY,3.8],spineR=[-13.5,mainY+.32,3.8],minX=-31.6,maxX=key==='hw'?-8:key==='cw'?118:47;
  L([sup,[-14.1,2.4,z-.7],[-14.1,mainY,z-.7],spineS],cfg.label+' supply riser',key,'supply');L([spineR,[-13.5,mainY+.32,z+1.3],[-13.5,1.1,z+1.3],ret],cfg.label+' return riser',key,'return');
  // Main header ends are real positive blinds; junctions split at branch points.
  L([[minX,mainY,3.8],[maxX,mainY,3.8]],cfg.supplyLabel+' distribution header',key,'supply');L([[maxX,mainY+.32,3.8],[minX,mainY+.32,3.8]],cfg.returnLabel+' distribution header',key,'return');
  for(const [label,y]of[[cfg.supplyLabel,mainY],[cfg.returnLabel,mainY+.32]])for(const [x,axis]of[[minX,[-1,0,0]],[maxX,[1,0,0]]])blind([x,y,3.8],axis,'BL-'+label+'-'+(x===minX?'WEST':'EAST'),key,'Closed header end; no continuous flow');
  loops[key]={...cfg,gen,pumpSpecs,supply:sup,return:ret,headerY:mainY,headerZ:3.8,minX,maxX,bypassTag:'CV-'+(5111+i*100),buffer:{inlet:br.out,outlet:bo.out}};
  k.instrument('TT-'+cfg.supplyLabel,sup,'supply temperature · design scenario');k.instrument('TT-'+cfg.returnLabel,ret,'return temperature · design scenario');k.instrument('DPT-'+cfg.supplyLabel,[-17.3,2.4,z-.7],'distribution differential pressure');
 }

 // Local secondary loops: separate exchanger sides, no primary/secondary fluid edge.
 function secondary(id,key){const e=EQUIPMENT[id],{x,z,tag}=e,circuit='secondary-'+id;setContext(id,tag+' isolated temperature control');const pad=foundation(id,x,z,1.65,1.9,tag);
  const a=[x-.45,1.65,z-.30],aout=[x+.45,1.65,z-.30],bin=[x+.45,1.05,z+.30],bout=[x-.45,1.05,z+.30];
  const casing=b(tag+' plate exchanger frame','frame',[1.0,1.3,.85],[x,1.45,z],'steel');for(const dx of[-.4,.4]){const leg=b(tag+' exchanger foot','frame',[.08,.62,.08],[x+dx,.49,z]);s.join(pad,leg,[x+dx,.18,z],tag+' foot');s.join(leg,casing,[x+dx,.8,z],tag+' exchanger support');}for(let j=0;j<9;j++){const plate=b(tag+' separated plate '+j,'head',[.75,1.1,.025],[x,1.45,z-.3+j*.075],'bright');plate.cut=true;}
  const primary=band(tag+' primary sealed passage','internal',.065,.039,1.0,[x,1.65,z-.30],'bright',[1,0,0]);P(primary,[a,[x,1.65,z-.30],aout],tag+' primary heat exchange',key,'consumer');
  const secondaryBody=band(tag+' secondary sealed passage','internal',.065,.039,1.0,[x,1.05,z+.30],'bright',[1,0,0]);P(secondaryBody,[bin,[x,1.05,z+.30],bout],tag+' secondary heat exchange',circuit,'generation');
  for(const [p,ax]of[[a,[-1,0,0]],[aout,[1,0,0]],[bin,[1,0,0]],[bout,[-1,0,0]]])h.flange(p,ax,.05,tag+' exchanger port');
  const start=parts.length,pump=k.transferPump(x,tag+'-P','Secondary circulation',{z:z+.75});mark(start,circuit,'supply');
  let pumpSource=bout;
  if(id===830){const sin=[x-.45,3.12,15.15],sout=[x+.45,3.12,15.15],cool=band(tag+' secondary cooldown passage','internal',.065,.039,.9,[x,3.12,15.15],'bright',[1,0,0]);P(cool,[sin,sout],tag+' secondary cooldown heat exchange',circuit,'generation');L([bout,[x-.85,1.05,z+.3],[x-.85,3.12,z+.3],sin],tag+' secondary to cooldown exchanger',circuit,'generation');pumpSource=sout;
   for(const dx of[-.4,.4]){const post=s.beam([x+dx,2.1,z],[x+dx,3.4,z],.07,tag+' upper exchanger frame');s.join(casing,post,[x+dx,2.1,z],tag+' upper frame seat');}
   for(let j=0;j<8;j++)b(tag+' cooldown exchanger plate','head',[.75,.6,.023],[x,3.05,14.88+j*.05],'steel').cut=true;
  }
  L(id===830?[pumpSource,[x+.85,3.12,15.15],[x+.85,3.12,z+1.9],[x+.85,.8,z+1.9],[x-.4,.8,z+1.9],[x-.4,.8,z+1.25],[x,.8,z+1.25],pump.inlet]:[pumpSource,[x-.8,pumpSource[1],z+.45],[x-.8,.8,z+1.25],[x-.4,.8,z+1.25],[x,.8,z+1.25],pump.inlet],tag+' local pump suction',circuit,'supply');
  const sup=[x+.65,2.5,z+.75],ret=[x+.65,1.05,z+.30];L([pump.outlet,[x,2.5,z+.75],sup],tag+' secondary supply',circuit,'supply');L([ret,bin],tag+' secondary return',circuit,'return');
  const cap=[x+.65,2.5,z+1.1];L([sup,cap],tag+' secondary fill branch',circuit,'inactive',.025);blind(cap,[0,0,1],'BL-'+tag+'-FILL',circuit,'Secondary fill / vent and expansion package qualification HOLD',.025);
  const exp=vessel(id,x-.60,z-.70,.15,.6,1.55,circuit,'inactive',{tag:tag+'-EXP'}),ep=exp.port('secondary expansion',[x-.60,.57,z-.70],[0,-1,0],.025,'inactive');P(exp.body,[ep.inside,exp.centre],tag+' expansion pocket',circuit,'inactive');c(tag+' expansion diaphragm','internal',.12,.025,exp.centre,'gasket');L([[x-.4,.8,z+1.25],[x-.4,.25,z+1.25],[x-.85,.25,z+1.25],[x-.85,.25,z-.70],[x-.60,.25,z-.70],ep.out],tag+' secondary expansion connection',circuit,'inactive',.025);exp.finish();
  const primaryConsumer={id:tag,tag,area:'A-5000',owner:id,service:key,supplyPoint:a,returnPoint:aout,passageName:tag+' primary heat exchange',secondary:circuit,status:'proposed',note:'Central utility serves isolated secondary loop; no fluid mixing across exchanger',dutyKW:null,flowM3H:null};consumers.push(primaryConsumer);
  const result={id,tag,circuit,service:key,supply:sup,return:ret,primaryConsumer:tag,pump,temperatureBasis:'Unknown secondary operating temperatures'};secondaries[circuit]=result;thermalLinks.push({primary:key,secondary:circuit,exchanger:tag,type:'heat transfer only',fluidConnection:false});return result;
 }
 const s141=secondary(830,'hw'),s201=secondary(831,'chw'),s1001=secondary(832,'cw'),s303=secondary(833,'chw');
 // Separate CHW exchanger for Pre-G cooldown. Heating and cooling branch valves
 // are mutually exclusive in the operating illustration; fluid circuits never mix.
 setContext(830,'TCU-141 separate cooldown exchanger');const coolA=[-16.45,2.9,15],coolB=[-15.55,2.9,15],coolBody=band('TCU-141 cooling primary passage','internal',.065,.039,.9,[-16,2.9,15],'bright',[1,0,0]);P(coolBody,[coolA,coolB],'TCU-141 cooling primary heat exchange','chw','consumer');for(const[p,a]of[[coolA,[-1,0,0]],[coolB,[1,0,0]]])h.flange(p,a,.05,'TCU-141 cooling port');
 consumers.push({id:'TCU-141-COOL',tag:'TCU-141 cooldown',owner:830,area:'A-5000',service:'chw',supplyPoint:coolA,returnPoint:coolB,passageName:'TCU-141 cooling primary heat exchange',secondary:s141.circuit,status:'proposed',note:'Separate CHW primary circuit; cooldown selection excludes hot-water admission',dutyKW:null,flowM3H:null});thermalLinks.push({primary:'chw',secondary:s141.circuit,exchanger:'TCU-141 cooldown',type:'heat transfer only',fluidConnection:false});

 function port(tag){const matches=ports.filter(p=>p.id===tag);if(matches.length!==1)throw Error('A5000 interface unresolved: '+tag);return matches[0];}
 function connected(p,circuit){p.role='interunit';p.thermalCircuit=circuit;for(let i=terminals.length-1;i>=0;i--)if(terminals[i].label===p.id+' external battery limit')terminals.splice(i,1);interfaces.push({tag:p.id,point:p.point,axis:p.axis,disposition:'connected',reason:'Proposed thermal distribution; duty / rating HOLD'});}
 function addConsumer(tag,owner,area,service,inTag,outTag,passageName,secondary=null,note='Proposed utility allocation; load and allowable temperature remain unresolved'){
  const a=port(inTag),z=port(outTag);const row={id:tag,tag,owner,area,service,circuit:secondary?.circuit||service,inTag,outTag,supplyPoint:a.point,returnPoint:z.point,passageName,secondary:secondary?.circuit||null,status:'proposed',note,dutyKW:null,flowM3H:null,pressureDropBar:null,requiredTemperatureC:null};consumers.push(row);return row;
 }
 for(const [i,letter]of[...'ABCD'].entries()){
  const id=39+i,e=EQUIPMENT[id];setContext(id,e.tag+' closed thermal jacket');const lo=edges.find(p=>p.reactor===id&&p.name===e.tag+' thermal SUP neck'),hi=edges.find(p=>p.reactor===id&&p.name===e.tag+' thermal RET neck'),body=parts.find(p=>p.reactor===id&&p.name===e.tag+' thermal jacket');
  P(body,[lo.a,[e.x-e.radius-.05,2.7,e.z],hi.a],e.tag+' jacket thermal passage',s141.circuit,'consumer');
  addConsumer(e.tag,id,'A-140','hw','BL-TH-'+letter+'-SUP','BL-TH-'+letter+'-RET',e.tag+' jacket thermal passage',s141);
 }
 for(const [letter,id]of[['A',1],['B',2],['C',54],['D',55]])addConsumer('R-201'+letter,id,'A-200','chw','BL-CWS201','BL-CWR201','R-201'+letter+' jacket circulation',s201);
 addConsumer('T-303',4,'A-300','chw','BL-CWS-Q','BL-CWR-Q','T-303 cooling coil passage',s303);
 addConsumer('E-501',66,'A-500','cw','BL-CWS501','BL-CWR501','E-501 cooling-side passage');
 addConsumer('E-701',86,'A-700','cw','BL-E701-CWS','BL-E701-CWR','E701 utility passage');addConsumer('E-702',84,'A-700','cw','BL-E702-CWS','BL-E702-CWR','E702 utility passage');
 addConsumer('PY-801',109,'A-800','cw','BL-PY-801-CWS','BL-PY-801-CWR','PY-801 cooling annulus');addConsumer('E-801',110,'A-800','cw','BL-E-801-CWS','BL-E-801-CWR','E-801 cooling annulus');addConsumer('R-1001',126,'A-1000','cw','BL-CWS1000','BL-CWR1000','R-1001 jacket utility passage',s1001);
 if(design==='baseline'){
  setContext(47,'D-164 closed shelf thermal circuit');const a=edges.find(e=>e.name==='D-164 shelf heat SUP neck'),z=edges.find(e=>e.name==='D-164 shelf heat RET neck');const pipe=h.tube(a.a,z.a,.035,'D-164 internal shelf utility riser');edges.pop();P(pipe,[a.a,z.a],'D-164 conceptual shelf utility passage','hw','consumer');
  addConsumer('D-164',47,'A-160','hw','BL-TH164-SUP','BL-TH164-RET','D-164 conceptual shelf utility passage',null,'Hot water is a proposed shelf-heating allocation; drying temperature / vacuum / duty require qualification');
 }else{
  addConsumer('E-166',94,'A-160','cw','BL-XV-166-CS','BL-XV-166-CR','E-166 cooling jacket passage');
 }
 // Unselected thermal media remain closed, grey, and available for local tracing.
 const unresolved=[{id:'HX-601',tag:'HX-601',owner:73,area:'A-600',service:'unresolved',inTag:'BL-HT601-IN',outTag:'BL-HT601-RET',passageName:'HX-601 separate thermal passage',note:'PFD typical dryer air inlet 140–145 °C; outlet 80–90 °C. Final values, heating medium and evaporation duty remain unselected. 90 °C hot water alone cannot provide this inlet-air target; no connection is assumed'}];
 if(design!=='baseline')unresolved.push({id:EQUIPMENT[design==='integrated'?92:47].tag,tag:EQUIPMENT[design==='integrated'?92:47].tag,owner:design==='integrated'?92:47,area:'A-160',service:'unresolved',inTag:'BL-166-HEAT',outTag:'BL-166-HRET',passageName:'A-160 dryer thermal jacket passage',otherPorts:['BL-166-COOL','BL-166-CRET'],note:'Alternative dryer hot/cold selection needs isolated TCU and qualified temperatures; all four primary interfaces remain blinded'});
 for(const row of unresolved){row.status='unresolved';row.circuit='unresolved-'+row.id;row.supplyPoint=port(row.inTag).point;row.returnPoint=port(row.outTag).point;row.dutyKW=null;row.flowM3H=null;consumers.push(row);for(const tag of[row.inTag,row.outTag,...row.otherPorts||[]]){const p=port(tag);setContext(p.reactor,row.tag+' unresolved utility boundary');blind(p.point,p.axis,tag,row.circuit,row.note,p.radius);p.role='blinded';}}

 // Explicitly resolve existing utility-only geometry before adding distribution.
 const byId=new Map(parts.map(p=>[p.id,p])),byRoute=new Map(routes.map(r=>[r.id,r]));
 const eligible=(e,r)=>{
  if(e.thermalCircuit)return true;
  if(/drain|vent|off.gas|gas cooling passage/i.test(e.name))return false;
  if(/cool|thermal|heating/i.test(r?.service||''))return !/off.gas|drain/.test(r?.service||'');
  return /jacket|coolant|cooling|shelf heat|thermal (SUP|RET)|BL-(CWS|CWR|TH-|TH164|HT601)|(Lower|Upper) utility header|HX-601 heating (supply|return) neck|XV-601-HEAT|XV-(E70[12]|PY-801|E-801)-CW/i.test(e.name+' '+(byId.get(e.part)?.assembly||''));
 };
 const localNet=createJourneyNetwork({edges,routes,ports},{acceptEdge:eligible});
 for(const row of consumers){
  const matches=edges.filter(e=>e.name===row.passageName);if(matches.length!==1){row.status='unresolved';row.issue='Missing or ambiguous utility passage';continue;}const passage=matches[0];row.passage={a:passage.a,b:passage.b};
  try{
   const a=localNet.path(row.supplyPoint,passage.a),z=localNet.path(passage.b,row.returnPoint),path=[...a.segments,{...passage,index:edges.indexOf(passage),part:passage.part},...z.segments];
   row.localEdgeIds=[...new Set(path.map(e=>e.index))];row.localPartIds=[...new Set(path.map(e=>e.part))];
   for(const index of row.localEdgeIds){const ed=edges[index];ed.thermalCircuit=row.circuit||row.service;ed.thermalRole=index===edges.indexOf(passage)?'consumer':a.segments.some(e=>e.index===index)?'supply':'return';tagPart(byId.get(ed.part),ed.thermalCircuit,ed.thermalRole);}
  }catch(error){row.status='unresolved';row.issue='Local thermal path: '+error.message;}
 }
 const secondaryHeaders={};
 for(const [circuit,source]of Object.entries(secondaries)){
  const rows=consumers.filter(c=>c.status==='proposed'&&c.circuit===circuit),xs=rows.flatMap(c=>[c.supplyPoint[0],c.returnPoint[0]]),minX=Math.min(source.supply[0],...xs)-3,maxX=Math.max(source.supply[0],...xs)+3,y=headerLayout.secondary[circuit];setContext(source.id,source.tag+' paired secondary distribution');
  for(const role of ['supply','return']){const yy=y+(role==='return'?.32:0),zz=role==='supply'?3.1:2.5,at=role==='supply'?source.supply:source.return,laneX=at[0]+(role==='return'?1.2:.6),root=[laneX,yy,zz],run=[at,[laneX,at[1],at[2]],[laneX,yy,at[2]],root];L(role==='supply'?run:run.slice().reverse(),source.tag+' single secondary '+role+' riser',circuit,role);L(role==='supply'?[[minX,yy,zz],[maxX,yy,zz]]:[[maxX,yy,zz],[minX,yy,zz]],source.tag+' single secondary '+role+' header',circuit,role);for(const [xx,axis]of[[minX,[-1,0,0]],[maxX,[1,0,0]]])blind([xx,yy,zz],axis,'BL-'+source.tag+'-'+role+'-'+xx,circuit,'Closed secondary distribution end');}
  secondaryHeaders[circuit]={minX,maxX};
 }
 const occupiedBranchLanes=new Map();
 const linked=new Map();
 function distribution(row,start,end,role,source){
  const plant=loops[row.service],useSecondary=source.circuit?.startsWith('secondary'),height=useSecondary?headerLayout.secondary[source.circuit]+(role==='return'?.32:0):plant.headerY+(role==='return'?.32:0),r=.05,circuit=row.circuit||row.service;
  const consumerPoint=role==='supply'?end:start,tag=(role==='supply'?row.inTag:row.outTag)||row.id+'-'+role,owner=useSecondary?source.id:plant.header,connectKey=source.circuit+'|'+tag+'|'+role;
  if(linked.has(connectKey))return;
  setContext(owner,row.tag+' '+role+' thermal branch');
  const compact=row.id.startsWith('TCU-'),registered=ports.find(p=>p.id===tag),axis=registered?.axis||[role==='supply'?-1:1,0,0],rr=registered?.radius||r,stub=V(consumerPoint).addScaledVector(V(axis),compact?.18:.35).toArray(),station=V(stub).addScaledVector(V(axis),compact?.22:.36).toArray();
  const laneSide=Math.abs(axis[0])>.5?Math.sign(axis[0]):role==='supply'?-1:1;let laneX=station[0]+laneSide*(compact?.38:.7);const laneKey=circuit;const used=occupiedBranchLanes.get(laneKey)||[];while(used.some(x=>Math.abs(x-laneX)<.34))laneX+=laneSide*.4;used.push(laneX);occupiedBranchLanes.set(laneKey,used);
  if(row.id==='PY-801')laneX+=role==='supply'?-.6:.6;
  if(row.id==='R-141D')laneX-=.65;
  if(row.id==='E-702'&&role==='supply')laneX+=2.3;
  if(row.id==='TCU-141')laneX+=laneSide*(role==='supply'?.6:.2);
  const limits=useSecondary?secondaryHeaders[circuit]:plant,headerZ=useSecondary?(role==='supply'?3.1:2.5):plant.headerZ,root=[Math.max(limits.minX+.4,Math.min(limits.maxX-.4,laneX)),height,headerZ],detour=Math.abs(root[0]-laneX)>.01;
  const approach=V(station).addScaledVector(V(axis),compact?.20:.30).toArray();
  // Separate the drops and terminal approaches in plan as well as elevation.
  const dropOffset=role==='supply'?(row.id==='TCU-141-COOL'?-1.1:row.id==='E-702'?-2.2:-.65):(row.id==='TCU-141'?-1.4:row.id==='TCU-141-COOL'?-.65:row.id==='E-702'?1.2:.65);
  const planeZ=approach[2]+(Math.abs(axis[0])>.5?dropOffset:0);
  let points=[root,...detour?[[root[0],height,headerZ+.55],[laneX,height,headerZ+.55]]:[],[laneX,height,planeZ],[laneX,approach[1],planeZ],...Math.abs(planeZ-approach[2])>.01?[[approach[0],approach[1],planeZ]]:[],approach,station];
  points=points.filter((p,i)=>!i||V(p).distanceTo(V(points[i-1]))>1e-7);
  const isSupply=role==='supply',va=station,vb=V(stub).addScaledVector(V(axis),compact?.04:.12).toArray();
  // Maintain the terminal approach axis through the valve and reducer.
  const run=[...points.slice(0,-1),va];
  L(isSupply?run:run.slice().reverse(),row.tag+' '+role+' branch to service station',circuit,role,r,row.area);
  const valveTag='XV-5000-'+tag,localValve=valve(isSupply?va:vb,isSupply?vb:va,valveTag,circuit,role);
  localValve.serviceArea=row.area;localValve.servicePolicy='Consumer isolation with proposed actuator; control energy, I/O and fail action require design. Local maintenance requires isolation and verified grade/platform/mobile access.';
  const short=[vb,stub];L(isSupply?short:short.slice().reverse(),row.tag+' '+role+' service station outlet',circuit,role,r,row.area);
  const j=parts.length;h.reducer(isSupply?stub:consumerPoint,isSupply?consumerPoint:stub,isSupply?r:rr,isSupply?rr:r,row.tag+' '+role+' mating reducer');const route=routes.at(-1);Object.assign(route,{service:'Thermal utility',thermalCircuit:circuit,thermalRole:role,areaId:'A-5000',toArea:row.area,designStatus:'proposed'});mark(j,circuit,role);
  linked.set(connectKey,valveTag);
 }
 for(const row of consumers.filter(c=>c.status==='proposed')){
  if(row.inTag){connected(port(row.inTag),row.circuit);connected(port(row.outTag),row.circuit);}
  const circuit=row.circuit||row.service,secondary=secondaries[circuit],source=secondary||{...loops[row.service],circuit:row.service,service:row.service};
  distribution(row,source.supply,row.supplyPoint,'supply',source);distribution(row,row.returnPoint,source.return,'return',source);
  row.supplyIsolation=linked.get(source.circuit+'|'+(row.inTag||row.id+'-supply')+'|supply');row.returnIsolation=linked.get(source.circuit+'|'+(row.outTag||row.id+'-return')+'|return');
 }
 // Interfaces that could not be reconciled stay positively closed.
 for(const row of consumers.filter(c=>c.status==='unresolved'&&c.issue))for(const tag of[row.inTag,row.outTag]){const p=port(tag);if(p.role==='blinded')continue;setContext(row.owner,row.tag+' unresolved thermal connection');blind(p.point,p.axis,tag,row.circuit||row.service,row.issue,p.radius);p.role='blinded';}
 // Survey every process area. Absence of a modeled consumer is explicit.
 const surveyedAreas=['A-100','A-140','A-160','A-200','A-300','A-400','A-500','A-600','A-700','A-800','A-900','A-1000','A-2000','A-3000','A-4000','A-6000'];
 const surveys=surveyedAreas.map(area=>({area,consumers:consumers.filter(c=>c.area===area).map(c=>c.id),status:consumers.some(c=>c.area===area)?'Modeled consumers listed; completeness / duty qualification open':'No qualified thermal consumer mapped; equipment / vendor survey required'}));
 setContext(834,'CP-5000 controls');const post=s.column(-26.8,27.2,1.3,'CP-5000',.07),panel=b('CP-5000 thermal operator panel','valve',[.7,.5,.2],[-26.8,1.45,27.2],'blue');s.join(post.post,panel,[-26.8,1.3,27.2],'Control panel support');panel.serviceAccess={standing:[-26.8,0,27.9],method:'Grade operator interface; illustrative controls',withdrawalAxis:[0,0,1]};
 const display=b('CP-5000 HMI display','valve',[.56,.34,.012],[-26.8,1.45,27.306],'dial');display.serviceAccess={standing:[-26.8,0,27.9],method:'Grade indication at CP-5000; signal wiring and I/O require detailed design'};display.remoteSource=[];
 const displayLinks=[];for(const p of parts.slice(first).filter(p=>p!==display&&/ display$/.test(p.name))){display.remoteSource.push({partId:p.id,tag:p.name,point:p.position.toArray()});p.remoteDisplay={partId:display.id,point:display.position.toArray(),panel:'CP-5000'};displayLinks.push({sourcePartId:p.id,displayPartId:display.id,source:p.name,panel:'CP-5000',processTapMoved:false,status:'Proposed signal mapping; wiring, I/O and commissioning HOLD'});}
 for(const p of parts.slice(first))if(!p.exploreRole)p.exploreRole=p.routeId?'context':'equipment';
 const insulation=buildThermalInsulation(h);
 return {displayLinks,routingReview:router.decisions,headerLayout,secondaryHeaders,insulation,basis:A5000_BASIS,equipment:A5000_IDS,loops,secondaries,thermalLinks,consumers,surveys,interfaces,valveTags:valves.map(v=>v.tag),valves,accessZones:access,vessels,partIds:parts.slice(first).map(p=>p.id),routeIds:routes.slice(firstRoute).map(r=>r.id),edgeCount:edges.length-firstEdge,temperatureBasis:'Illustrative design scenarios; no live data',qualified:false};
}
