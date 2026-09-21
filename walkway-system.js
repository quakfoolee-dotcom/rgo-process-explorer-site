import {EMERGENCY_ACCESS_LAYOUT} from './emergency-access-layout.js';
import {EMERGENCY_LOCATION_PLAN} from './emergency-location-plan.js';
import {WALKWAY_LAYOUT} from './walkway-layout.js';
export function walkwayVolume(s){const r=s.width/2;return {min:[Math.min(s.a[0],s.b[0])-r,.035,Math.min(s.a[1],s.b[1])-r],max:[Math.max(s.a[0],s.b[0])+r,2.335,Math.max(s.a[1],s.b[1])+r]};}
export function buildWalkways(h){
 const {T,EQUIPMENT,parts,setContext,b,c}=h,w=structuredClone(WALKWAY_LAYOUT);w.qualified=false;w.revision=EMERGENCY_ACCESS_LAYOUT.revision;
 w.segments.push(...structuredClone(EMERGENCY_ACCESS_LAYOUT.segments));
 w.holds.push(...structuredClone(EMERGENCY_ACCESS_LAYOUT.holds));
 for(const d of EMERGENCY_ACCESS_LAYOUT.connections)w.destinations.push({...d,kind:'emergency-task',finalReachUnverified:true});
 w.holds=w.holds.filter(h=>!['ES-101','ES-201','ES-401','ES3000-LEGACY'].includes(h.id));
 w.holds.push({id:'EMERGENCY-COVERAGE',label:'Emergency stations have revised concept positions. Check Emergency stations for current geometry, exposure-distance gaps, final activation and water-system qualification.'});
 w.destinations=w.destinations.filter(d=>!d.id.startsWith('ES-'));
 for(const s of EMERGENCY_LOCATION_PLAN)w.destinations.push({id:s.tag,label:s.tag+' · '+s.areaId,kind:'eyewash',point:s.walkPoint,walkPoint:s.walkPoint,area:s.areaId,finalReachUnverified:true});
 const owner=121000;EQUIPMENT[owner]={tag:'PW-100',label:'Walkway traffic protection',areaId:'SHARED',x:119,z:49,labelY:1.4,designStatus:'proposed',primaryOperation:'access',geometryStatus:'Proposed traffic protection; impact performance and anchorage unqualified'};setContext(owner,'Pedestrian traffic protection');
 for(const g of w.barriers){const start=parts.length,points=g.bollard?[g.a]:[g.a,g.b];
  for(const [x,z]of points){b(g.id+' anchored base','frame',[.35,.035,.35],[x,.018,z],'dark');c(g.id+' protective post','frame',g.bollard?.09:.065,1.1,[x,.57,z],'safetyYellow');c(g.id+' reflective post band','frame',g.bollard?.091:.066,.1,[x,.89,z],'dial');for(const dx of[-.12,.12])for(const dz of[-.12,.12])c(g.id+' anchor head','fastener',.015,.022,[x+dx,.047,z+dz],'bright');}
  if(!g.bollard){const length=Math.hypot(g.b[0]-g.a[0],g.b[1]-g.a[1]),axis=[(g.b[0]-g.a[0])/length,0,(g.b[1]-g.a[1])/length];for(const y of[.45,.98])c(g.id+' traffic rail','frame',.055,length,[(g.a[0]+g.b[0])/2,y,(g.a[1]+g.b[1])/2],'safetyYellow',axis);}
  g.partIds=parts.slice(start).map(p=>{Object.assign(p,{walkProtection:g.id,designStatus:'proposed',structureVisibility:'equipment',exploreRole:'equipment'});p.offset.set(0,0,0);return p.id;});
 }
 w.accessZones=w.segments.map(s=>({id:s.id,kind:'pedestrian',areaIds:['SHARED'],...walkwayVolume(s),note:'Proposed full-width pedestrian route; see Walkway settings for checked connections and open holds.',walkway:true,designStatus:'proposed'}));return w;
}
