import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';

// D-MDL-01 release 2 (bases R2-1…R2-8, approved by QFL 2026-09-28): equipment issued in the V219–V227 datasheets that the model did not
// carry. Standalone envelopes with nozzle stubs — no process routes are added (tie-ins deferred to the model engineer with the W3 / cascade
// re-routing, docs/model-catchup-handoff.md). Built after the pipe-support system so existing rack supports do not re-flow. Positions come
// from a clear-space search against every existing part. CL-1001 and SL-1001 are not placed: A-1000 has no clear space for them at datasheet
// size (decision pending with QFL).
const note=(doc,extra='')=>`Envelope from ${doc} (D-MDL-01 release 2). Standalone — tie-ins deferred to the model engineer. Diameters and heights are model choices; vendor geometry unqualified.${extra}`;
const eq=(tag,label,areaId,primaryOperation,x,z,extra={})=>({tag,label,x,z,areaId,primaryOperation,designStatus:'proposed',labelY:3,geometryBasis:'D-MDL-01 R2',...extra});
export const CATCHUP_EQUIPMENT={
 652:eq('F-160','Pre-G acid filter · 2.54 m² (FEED-PE-DAT-106)','A-160','fixing',-14.5,-24.5,{radius:.9,bottom:1.4,top:3.4,labelY:4.6,geometryStatus:note('FEED-PE-DAT-106',' Agitated pressure filter; placed south of F-161 (no clear space beside T-161), so the R-141 feed and the cake transfer to T-161 need a re-layout — deferred.')}),
 653:eq('T-160','Recovered-acid receiver · 10 m³ (FEED-PE-DAT-107)','A-160','pregpress',-14.5,-27.6,{radius:1.1,bottom:.26,top:.26+10/(Math.PI*1.06**2),labelY:4.2,geometryStatus:note('FEED-PE-DAT-107')}),
 654:eq('P-160','Recovered-acid transfer pumps A/B · 5 m³/h × 22 m (FEED-PE-DAT-108)','A-160','pregpress',-12.4,-28.6,{labelY:2.1,geometryStatus:note('FEED-PE-DAT-108',' 1 + 1 sealless pumps.')}),
 655:eq('HR-601','Dryer exhaust heat recuperator · 2.7 MW (FEED-PE-DAT-141)','A-600','a600',66,7.8,{labelY:6.9,geometryStatus:note('FEED-PE-DAT-141',' Air-to-air envelope for ≈ 408,000 m³/h exhaust; ducting to the F-601 exhaust and the BL-601 intake deferred.')}),
 656:eq('IF-A2000-CITY','Municipal make-up battery limit (D-A2000-03)','A-2000','rodistribute',103.4,-2,{designStatus:'interface',labelY:2.2,geometryStatus:'Battery-limit marker only (D-MDL-01 release 2); municipal supply pressure, hardness and connection are site data.'}),
};
export const CATCHUP_IDS=Object.keys(CATCHUP_EQUIPMENT).map(Number);

export function buildCatchup(h){
 const k=processKit(h,.08),s=structuralKit(h),{T,parts,EQUIPMENT,setContext,b,c,band,nozzle}=k,first=parts.length,V=p=>new T.Vector3(...p);
 const base=(part,point)=>{h.structure.roots.push({part:part.id,local:V(point).sub(part.position).applyQuaternion(part.quaternion.clone().invert()).divide(part.scale).toArray(),elevation:0});return part;};
 const stub=(tag,point,axis,r=.08)=>nozzle(point,axis,.22,tag+' (tie-in deferred)',r);
 function vessel(id){
  const e=EQUIPMENT[id],{x,z,radius:r,bottom:y0,top:y1,tag}=e;setContext(id,e.label);
  const pad=base(c(tag+' foundation','frame',r+.25,.2,[x,.1,z],'dark'),[x,0,z]);let support=pad;
  if(y0>.4){const sk=band(tag+' support skirt','frame',r*.92,r*.92-.05,y0-.2,[x,.2+(y0-.2)/2,z],'steel');s.join(pad,sk,[x,.2,z],tag+' skirt / foundation');support=sk;}
  else{const floor=c(tag+' supported tank bottom','head',r,.06,[x,.23,z],'steel');s.join(pad,floor,[x,.2,z],tag+' bottom / foundation');support=floor;}
  const body=band(tag+' shell','shell',r,r-.04,y1-y0,[x,(y0+y1)/2,z],'steel');body.cut=true;s.join(support,body,[x,y0,z],tag+' shell / support');s.load(body,tag+' shell');
  const roof=c(tag+' roof','head',r,.08,[x,y1+.04,z]);roof.cut=true;s.join(body,roof,[x,y1,z],tag+' roof / shell');
  return {e,x,z,r,y0,y1,tag,body,roof};
 }
 // F-160 — elevated agitated pressure filter.
 const f=vessel(652);setContext(652,f.e.label);
 const motor=c('F-160 agitator drive','pump',.22,.55,[f.x,f.y1+.36,f.z],'blue');s.join(f.roof,motor,[f.x,f.y1+.08,f.z],'F-160 drive / head');s.load(motor,'F-160 agitator');
 stub('F-160 R-141 slurry inlet',[f.x+.4,f.y1+.08,f.z],[0,1,0]);stub('F-160 cake discharge to T-161',[f.x-f.r,f.y0+.35,f.z],[-1,0,0],.15);stub('F-160 acid filtrate outlet',[f.x,f.y0-.05,f.z],[0,-1,0],.05);
 // T-160 and P-160A/B.
 const t=vessel(653);stub('T-160 filtrate inlet',[t.x,t.y1+.08,t.z],[0,1,0],.05);stub('T-160 outlet',[t.x,.6,t.z+t.r],[0,0,1],.05);
 setContext(654,EQUIPMENT[654].label);for(const [i,dz] of [0,1.3].entries()){const p=k.transferPump(EQUIPMENT[654].x,'P-160'+'AB'[i],EQUIPMENT[654].label,{z:EQUIPMENT[654].z-dz});stub('P-160'+'AB'[i]+' discharge',p.outlet,[0,1,0],.04);}
 // HR-601 — air-to-air recuperator envelope on a slab.
 const hr=EQUIPMENT[655];setContext(655,hr.label);
 const slab=base(b('HR-601 foundation slab','frame',[7.4,.2,3.4],[hr.x,.1,hr.z],'dark'),[hr.x,0,hr.z]);
 const casing=b('HR-601 recuperator casing','shell',[7,5.4,3],[hr.x,.2+2.7,hr.z],'steel');s.join(slab,casing,[hr.x,.2,hr.z],'HR-601 casing / slab');s.load(casing,'HR-601 casing');
 for(const [lab,dx] of [['exhaust inlet from F-601',-2.2],['exhaust outlet to FN-601',-.8],['drying air inlet',.8],['preheated air to HX-601',2.2]])stub('HR-601 '+lab,[hr.x+dx,4.4,hr.z+1.5],[0,0,1],.45);
 // IF-A2000-CITY — battery-limit marker.
 const ci=EQUIPMENT[656];setContext(656,ci.label);
 const post=base(b('IF-A2000-CITY battery-limit post','frame',[.12,1.6,.12],[ci.x,.8,ci.z],'steel'),[ci.x,0,ci.z]);const plate=b('IF-A2000-CITY battery-limit plate','valve',[.5,.3,.04],[ci.x,1.45,ci.z],'blue');s.join(post,plate,[ci.x,1.45,ci.z],'IF-A2000-CITY plate / post');
 return {partIds:parts.slice(first).map(p=>p.id),equipment:CATCHUP_IDS,tieIns:'deferred'};
}
