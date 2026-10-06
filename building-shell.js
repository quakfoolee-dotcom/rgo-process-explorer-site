import {WALKWAY_LAYOUT} from './walkway-layout.js';
import {EMERGENCY_ACCESS_LAYOUT} from './emergency-access-layout.js';
import {TRANSPORT_ROUTES} from './transport-layout.js';
// Proposed outside walls of the process building, as a display layer: the building-footprint envelope of every area except A-6000
// (x -42...117, z -31.5...41.6) with the wall just outside it; the argon yard stays outside (V291). The south wall steps 1.1 m south
// 2.6 m at x 89 so the A-800 service aisle and its fire point FE-802 stay inside, and the west wall stays inside the plant walkway at x -43.
export const BUILDING_SHELL={revision:'bldg-2',rect:[-42.25,-32,117.5,45],runs:[
 {id:'W',axis:'x',c:-42.25,lo:-32,hi:41.7},{id:'N',axis:'z',c:-32,lo:-42.25,hi:117.5},{id:'E',axis:'x',c:117.5,lo:-32,hi:45},
 {id:'S1',axis:'z',c:41.7,lo:-42.25,hi:89},{id:'J',axis:'x',c:89,lo:41.7,hi:45},{id:'S2',axis:'z',c:45,lo:89,hi:117.5}],height:12,thickness:.15,doorHeight:3,doorExtra:.8,vehicleDoor:{width:6,height:4.5},columnPitch:6,
 // Lines and fire points that stand outside the wall on purpose. Insulation, heat trace and containment are open design items (V293).
 outdoorService:{
  firePoints:['FE-6001','FE-901'],
  groups:[
   {id:'north-rack',label:'North outdoor rack',routes:['HD-3100 sloped wet collection trunk','P-3111 qualified return to T-1006','P-3183 qualified return to T-1006'],open:['insulation and heat trace (frost, wet condensate in the vent trunk)','drip tray or containment under the acid-condensate and scrubber-blowdown lines','slope and drain verification of the vent trunk']},
   {id:'argon',label:'Argon header and takeoffs',routes:['A-6200 common Ar header','AR-6001 regulated supply to A-6200'],open:['supplier confirmation of the outdoor header route and wall penetrations']},
   {id:'abatement',label:'Off-gas and exhaust to the outdoor abatement units',routes:['BL-OFF801 to AB-3801','BL-VENT801 to DC-3811'],open:['trace and insulation of wet exhaust runs','wall penetration design']},
   {id:'retention',label:'Gravity drains to the remote retention tanks',routes:['BND-1005 single gravity retention trunk','BND-161 single gravity retention trunk'],open:['burial or containment of the drain trunks']}]},
 note:'Proposed outer walls only: no roof, no base slab, no structural design. Openings follow the modelled walkway, forklift and pipe crossings; fire rating, doors and wall penetrations are not designed.'};
const SIDES=BUILDING_SHELL.runs;
const r3=v=>Math.round(v*1000)/1000;
function crossings(side,a,b){const c=side.c,i=side.axis==='x'?0:1,j=1-i;
 const da=a[i]-c,db=b[i]-c;if(da===0||db===0||Math.sign(da)===Math.sign(db))return null;
 const t=da/(da-db),s=a[j]+(b[j]-a[j])*t;return s>side.lo&&s<side.hi?{s,t}:null;}
function collect(){
 const out=Object.fromEntries(SIDES.map(x=>[x.id,[]]));
 const door=(side,s,width,height,kind)=>out[side.id].push({s0:s-width/2,s1:s+width/2,y0:0,y1:height,kind});
 // A walkway needs a door wherever its walking volume touches a wall run (it crosses the wall, or ends at or inside it).
 for(const seg of [...WALKWAY_LAYOUT.segments,...EMERGENCY_ACCESS_LAYOUT.segments])for(const side of SIDES){const i=side.axis==='x'?0:1,j=1-i,w=(seg.width||1.2)/2,lo=[Math.min(seg.a[0],seg.b[0])-w,Math.min(seg.a[1],seg.b[1])-w],hi=[Math.max(seg.a[0],seg.b[0])+w,Math.max(seg.a[1],seg.b[1])+w];
  if(lo[i]<side.c+BUILDING_SHELL.thickness/2&&hi[i]>side.c-BUILDING_SHELL.thickness/2&&lo[j]<side.hi&&hi[j]>side.lo){const s0=Math.max(side.lo,lo[j]-BUILDING_SHELL.doorExtra/2),s1=Math.min(side.hi,hi[j]+BUILDING_SHELL.doorExtra/2);out[side.id].push({s0,s1,y0:0,y1:BUILDING_SHELL.doorHeight,kind:'pedestrian door'});}}
 for(const route of TRANSPORT_ROUTES){const pts=route.loop?[...route.points,route.points[0]]:route.points;for(let k=1;k<pts.length;k++)for(const side of SIDES){const x=crossings(side,pts[k-1],pts[k]);if(x)door(side,x.s,BUILDING_SHELL.vehicleDoor.width,BUILDING_SHELL.vehicleDoor.height,'vehicle door');}}
 return out;
}
// A window where a pipe's footprint (radius + 0.35 m for fittings and bends) meets the wall: the pipe is clipped to the wall band first,
// so a pipe that crosses gets a window at its crossing height, and one that only runs close gets one along that stretch.
function pipeWindows(edges,out){
 for(const e of edges){const P=e.path;if(!P||P.length<2)continue;const m=(e.radius||.05)+.35;
  for(let k=1;k<P.length;k++){const a=P[k-1],b=P[k];
   for(const side of SIDES){const i=side.axis==='x'?0:2,j=side.axis==='x'?2:0,band=m+BUILDING_SHELL.thickness/2,d=b[i]-a[i];let t0=0,t1=1;
    if(Math.abs(d)<1e-9){if(Math.abs(a[i]-side.c)>band)continue;}else{const u=(side.c-band-a[i])/d,v=(side.c+band-a[i])/d;t0=Math.max(0,Math.min(u,v));t1=Math.min(1,Math.max(u,v));if(t0>=t1)continue;}
    const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],p=at(t0),q=at(t1),s0=Math.min(p[j],q[j])-m,s1=Math.max(p[j],q[j])+m,y0=Math.min(p[1],q[1])-m,y1=Math.max(p[1],q[1])+m;
    if(s1>side.lo&&s0<side.hi&&y0<BUILDING_SHELL.height)out[side.id].push({s0:Math.max(side.lo,s0),s1:Math.min(side.hi,s1),y0:Math.max(0,y0),y1,kind:'pipe penetration'});}}}
}
// A recess where a fire point stands in the wall line, so the cabinet and its approach stay reachable.
function firePointRecesses(parts,out){
 const seen=new Set();for(const p of parts){if(!p.firePoint||seen.has(p.firePoint))continue;seen.add(p.firePoint);const x=p.position.x,z=p.position.z;
  for(const side of SIDES){const i=side.axis==='x'?0:1,j=1-i,pos=[x,z],half=.95;if(Math.abs(pos[i]-side.c)<half&&pos[j]>side.lo-half&&pos[j]<side.hi+half)out[side.id].push({s0:Math.max(side.lo,pos[j]-half),s1:Math.min(side.hi,pos[j]+half),y0:0,y1:2.6,kind:'fire point recess'});}}
}
// Merge openings that overlap or lie within 0.6 m of each other so a pipe bundle becomes one window.
const area=o=>(o.s1-o.s0)*(o.y1-o.y0);
// Two openings join only when the joined opening is no more than 1.6 times their combined area plus 1 m², so a chain of doors and pipes never becomes one long hole.
const grows=(a,b)=>area({s0:Math.min(a.s0,b.s0),s1:Math.max(a.s1,b.s1),y0:Math.min(a.y0,b.y0),y1:Math.max(a.y1,b.y1)})<=1.6*(area(a)+area(b))+1;
function merge(list){
 const g=.6;let rects=list.map(o=>({...o,kinds:new Set([o.kind])}));let again=true;
 while(again){again=false;outer:for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(a.s0<=b.s1+g&&b.s0<=a.s1+g&&a.y0<=b.y1+g&&b.y0<=a.y1+g&&grows(a,b)){rects[i]={s0:Math.min(a.s0,b.s0),s1:Math.max(a.s1,b.s1),y0:Math.min(a.y0,b.y0),y1:Math.max(a.y1,b.y1),kinds:new Set([...a.kinds,...b.kinds])};rects.splice(j,1);again=true;break outer;}}}
 return rects.map(o=>({s0:r3(o.s0),s1:r3(o.s1),y0:r3(o.y0),y1:r3(o.y1),kinds:[...o.kinds].sort()}));
}
// Solid wall panels = side rectangle minus the openings, cut into vertical strips and joined where neighbouring strips match.
export function wallPanels(lo,hi,height,openings){
 const cuts=[...new Set([lo,hi,...openings.flatMap(o=>[Math.max(lo,Math.min(hi,o.s0)),Math.max(lo,Math.min(hi,o.s1))])])].sort((a,b)=>a-b),strips=[];
 for(let k=1;k<cuts.length;k++){const a=cuts[k-1],b=cuts[k];if(b-a<1e-6)continue;const mid=(a+b)/2,cover=openings.filter(o=>o.s0<=mid&&o.s1>=mid).map(o=>[Math.max(0,o.y0),Math.min(height,o.y1)]).sort((p,q)=>p[0]-q[0]),solid=[];let y=0;
  for(const [y0,y1]of cover){if(y0>y+1e-6)solid.push([y,y0]);y=Math.max(y,y1);}if(y<height-1e-6)solid.push([y,height]);strips.push({a,b,solid});}
 const panels=[];for(const st of strips)for(const [y0,y1]of st.solid){const last=panels.find(p=>p.b===st.a&&Math.abs(p.y0-y0)<1e-6&&Math.abs(p.y1-y1)<1e-6);if(last)last.b=st.b;else panels.push({a:st.a,b:st.b,y0,y1});}
 return panels.filter(p=>p.b-p.a>.05&&p.y1-p.y0>.05);
}
export function planBuildingShell(edges,parts=[]){
 const openings=collect();pipeWindows(edges,openings);firePointRecesses(parts,openings);
 const sides=SIDES.map(side=>{const list=merge(openings[side.id]);return {...side,line:side.c,openings:list,panels:wallPanels(side.lo,side.hi,BUILDING_SHELL.height,list)};});
 return {...BUILDING_SHELL,sides};
}
export function buildBuildingShell(h){
 const {EQUIPMENT,parts,edges,setContext,b}=h,plan=planBuildingShell(edges,parts),owner=122000,H=BUILDING_SHELL.height,t=BUILDING_SHELL.thickness;
 EQUIPMENT[owner]={tag:'BLD-WALLS',label:'Proposed building outside walls',areaId:'SHARED',x:(plan.rect[0]+plan.rect[2])/2,z:(plan.rect[1]+plan.rect[3])/2,labelY:H+1,designStatus:'proposed',primaryOperation:'access',geometryStatus:'Proposed envelope only: no structure, roof, slab, fire rating or door design. Openings follow modelled walkway, forklift and pipe crossings.'};
 setContext(owner,'Building outside walls');
 const first=parts.length;let panelCount=0,columnCount=0;
 for(const side of plan.sides){
  for(const p of side.panels){const len=p.b-p.a,mid=(p.a+p.b)/2,ym=(p.y0+p.y1)/2,dims=side.axis==='x'?[t,p.y1-p.y0,len]:[len,p.y1-p.y0,t],pos=side.axis==='x'?[side.line,ym,mid]:[mid,ym,side.line];b('Building wall '+side.id+' panel','frame',dims,pos,'glass');panelCount++;}
  const n=Math.ceil((side.hi-side.lo)/BUILDING_SHELL.columnPitch);
  for(let k=0;k<=n;k++){const s=side.lo+(side.hi-side.lo)*k/n;if(side.openings.some(o=>o.s0-.2<=s&&o.s1+.2>=s))continue;b('Building wall '+side.id+' column','frame',[.3,H,.3],side.axis==='x'?[side.line,H/2,s]:[s,H/2,side.line],'steel');columnCount++;}
 }
 const ids=parts.slice(first).map(p=>{Object.assign(p,{buildingShell:true,structureVisibility:'building',designStatus:'proposed'});p.offset.set(0,0,0);return p.id;});
 return {revision:plan.revision,rect:plan.rect,height:H,thickness:t,note:plan.note,outdoorService:BUILDING_SHELL.outdoorService,partIds:ids,panelCount,columnCount,sides:plan.sides.map(s=>({id:s.id,line:s.line,openings:s.openings}))};
}
