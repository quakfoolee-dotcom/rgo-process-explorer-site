import {FIRE_BASIS,FIRE_POINTS,FIRE_AGENT_BASIS,FIRE_REVIEW_HOLDS} from './fire-safety-basis.js';

export function firePointVolumes(station){
 const [x,y,z]=station.position,c=Math.cos(station.yaw),s=Math.sin(station.yaw);
 const box=(min,max)=>{const corners=[];for(const a of[min[0],max[0]])for(const b of[min[2],max[2]])corners.push([x+a*c+b*s,z-a*s+b*c]);return {min:[Math.min(...corners.map(p=>p[0])),y+min[1],Math.min(...corners.map(p=>p[1]))],max:[Math.max(...corners.map(p=>p[0])),y+max[1],Math.max(...corners.map(p=>p[1]))]};};
 return {body:box([-.46,.01,-.25],[.46,1.97,.25]),approach:box([-.6,.035,.30],[.6,2.135,1.50]),retrieval:[x+.9*s,y+.02,z+.9*c]};
}

export function buildFireSafety(h,{a160='baseline'}={}){
 const {T,EQUIPMENT,parts,setContext,b,c,add,geo}=h,stations=[];
 for(const def of FIRE_POINTS){
  const station=structuredClone(def),agent=FIRE_AGENT_BASIS[station.agent];
  EQUIPMENT[station.modelId]={tag:station.tag,label:station.label+' · fire point',x:station.position[0],z:station.position[2],labelY:2.5,areaId:station.areaId,designStatus:'proposed',primaryOperation:'fire-safety',geometryStatus:'Proposed fire point; listed unit, agent, rating, mounting and code coverage unverified',geometryBasis:FIRE_BASIS.code,reviewNote:agent.candidate+' '+agent.restriction,firePoint:true};
  setContext(station.modelId,station.tag+' permanent fire point');const start=parts.length;
  const box=(name,size,p,mat='red')=>b(station.tag+' '+name,'frame',size,p,mat);
  box('flush foundation',[.88,.10,.46],[0,-.05,0],'lining');
  box('anchored base plate',[.78,.03,.40],[0,.015,0],'dark');
  for(const x of[-.35,.35]){box('upright',[.045,1.82,.045],[x,.94,-.18]);for(const z of[-.14,.14])c(station.tag+' anchor head','fastener',.016,.02,[x,.04,z],'bright');}
  box('weather back panel',[.74,1.45,.025],[0,1.03,-.195]);
  box('unit shelf',[.74,.035,.36],[0,.64,.015],'dark');
  box('identification header',[.82,.36,.035],[0,1.72,-.155]);
  box('weather canopy',[.84,.035,.48],[0,1.94,0]);
  // A geometric extinguisher pictogram, independent of a selected product/agent.
  box('white extinguisher pictogram body',[.085,.15,.009],[-.015,1.7,-.132],'dial');
  box('white extinguisher pictogram neck',[.025,.05,.009],[-.015,1.80,-.132],'dial');
  box('white extinguisher pictogram handle',[.09,.017,.009],[.012,1.824,-.132],'dial');
  box('white extinguisher pictogram hose',[.012,.14,.009],[.073,1.73,-.132],'dial');
  box('header lower stripe',[.65,.025,.009],[0,1.57,-.132],'dial');
  for(const x of[-.18,.18]){
   c(station.tag+' illustrative extinguisher cylinder','shell',.10,.44,[x,.92,.05],'red');
   const cap=geo('fire-cylinder-domed-cap',()=>new T.SphereGeometry(1,16,10));
   add(station.tag+' domed cylinder shoulder','shell',cap,[x,1.14,.05],'red',new T.Quaternion(),[.1,.075,.1]);
   add(station.tag+' rounded cylinder base','shell',cap,[x,.70,.05],'red',new T.Quaternion(),[.1,.04,.1]);
   c(station.tag+' valve neck','valve',.025,.08,[x,1.22,.05],'bright');
   box('carry handle',[.13,.025,.035],[x+.02,1.31,.05],'dark');
   box('release lever',[.12,.015,.035],[x+.02,1.35,.05],'red');
   c(station.tag+' gauge bezel','valve',.027,.018,[x,1.24,.09],'bright',[0,0,1]);
   c(station.tag+' gauge face without live indication','valve',.021,.02,[x,1.24,.103],'dial',[0,0,1]);
   c(station.tag+' rating pending label band','shell',.101,.15,[x,.98,.05],'dial');
   c(station.tag+' retaining strap','shell',.103,.022,[x,.83,.05],'dark');
   box('quick-release strap tab',[.025,.055,.025],[x,.83,.16],'bright');
   const curve=new T.CatmullRomCurve3([[x+.025,1.26,.05],[x+.13,1.23,.05],[x+.15,.92,.06],[x+.13,.77,.09]].map(p=>new T.Vector3(...p)));
   add(station.tag+' discharge hose','valve',geo('fire-hose-'+x,()=>new T.TubeGeometry(curve,12,.012,6,false)),[0,0,0],'gasket');
  }
  const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),station.yaw),origin=new T.Vector3(...station.position);
  station.partIds=parts.slice(start).map(p=>{p.position.applyQuaternion(q).add(origin);p.center.copy(p.position);p.quaternion.premultiply(q);p.offset.set(0,0,0);Object.assign(p,{firePoint:station.tag,fireAgent:station.agent,designStatus:'proposed',structureVisibility:'equipment',exploreRole:'equipment'});return p.id;});
  Object.assign(station,firePointVolumes(station));stations.push(station);
 }
 return {basis:FIRE_BASIS,stations,holds:FIRE_REVIEW_HOLDS.filter(r=>!r.scenario||r.scenario===a160),accessZones:stations.map(s=>({id:'ACCESS-'+s.tag,kind:'emergency',areaIds:[s.areaId],...s.approach,note:'Keep fire-point retrieval space clear. '+FIRE_BASIS.dimensionNote,designStatus:'proposed'})),qualified:false};
}
