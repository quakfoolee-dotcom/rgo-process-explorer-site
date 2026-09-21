import {buildWalkways} from './walkway-system.js';
import {completeA400DrainPenetration} from './a400-drain.js';
import {inspectWalkways} from './walkway-review.js';
import {buildFireSafety} from './fire-safety.js';
import {completeReactorAirSupports} from './reactor-air-supports.js';
import {A5000_EQUIPMENT} from './a5000-basis.js';
import {buildThermalUtilities} from './thermal-utilities.js';
import {buildReactorAir} from './reactor-air.js';
import {A4000_EQUIPMENT} from './a4000-basis.js';
import {buildCompressedAir} from './compressed-air.js';
import {buildReactorServices,reactorDisconnectSchedule} from './reactor-service.js';
import {buildTopDrive,buildCentralOutlet,REACTOR_MECHANICAL_BASIS} from './reactor-mechanical.js';
import {resolveEquipmentOwnership} from './equipment-ownership.js';
import {reconcileA3000} from './vent-review.js';
import {EXHAUST_EQUIPMENT,buildExhaustGroups} from './exhaust-groups.js';
import {A3000_EQUIPMENT} from './a3000-basis.js';
import {buildVentGas} from './vent-gas.js';
import {A2000_EQUIPMENT} from './a2000-basis.js';
import {buildReclaimedWater} from './reclaimed-water.js';
import {A1000_EQUIPMENT} from './a1000-basis.js';
import {CONTAINMENT_EQUIPMENT} from './containment-basis.js';
import {buildContainment} from './containment.js';
import {buildWastewater} from './wastewater.js';
import {A400_EQUIPMENT} from './a400-basis.js';
import {buildPipeSupportSystem} from './pipe-support-system.js';
import {ACCESS_EQUIPMENT} from './access-design.js';
import {buildPlantAccess} from './access-stairs.js';
import {buildAccessIndications,buildAccessPipeSupports} from './access-geometry.js';
import {buildAccessRegister} from './access-review.js';
import {applyA160Equipment,selectModelScope,A160_DESIGNS} from './design-scenarios.js';
import {equipmentRegister} from './engineering-register.js';
import * as T from './vendor/three.module.js';
import {buildFiltration} from './filtration.js';
import {buildDrying} from './drying.js';
import {buildCakeTransfer} from './cake-transfer.js';
import {buildUpstream} from './upstream.js';
import {buildSeparations} from './separations.js';
import {buildSprayDrying} from './spray-drying.js';
import {buildFurnace} from './furnace.js';
import {buildArgonDistribution,ARGON_EQUIPMENT} from './argon-distribution.js';
import {buildDoping} from './doping.js';
import {A800_EQUIPMENT} from './a800-basis.js';
import {buildA900} from './a900.js';
import {A900_EQUIPMENT} from './a900-basis.js';
import {buildSonication} from './sonication.js';
import {buildPreG} from './preg.js';
import {expandOxidationBank} from './reactor-bank.js';
export const SYSTEMS={all:['All components','#f6bf62'],shell:['Vessel & jackets','#bfd0de'],head:['Heads & lids','#e4e9ed'],internal:['Internal assembly','#dfb469'],pipe:['Pipes, ducts & fittings','#82b8dc'],valve:['Valves & instruments','#ed7480'],pump:['Pumps & drives','#6db492'],frame:['Support frames','#b1bac7'],fastener:['Bolts, nuts & washers','#b1a3d9']};
export const EQUIPMENT={0:{tag:'COMMON',label:'Shared piping & transfer pumps',x:0},1:{tag:'R-201A',label:'GO oxidation A',x:-2.45,radius:1.19,bottom:2.02,top:4.27},2:{tag:'R-201B',label:'GO oxidation B',x:2.45,radius:1.19,bottom:2.02,top:4.27},3:{tag:'T-201',label:'Sulfuric acid day tank',x:-7.3,radius:1.45,bottom:1.50,top:4.65},4:{tag:'T-303',label:'Quench / fixing tank',x:7.3,radius:1.45,bottom:1.50,top:4.65}};
Object.assign(EQUIPMENT,{5:{tag:'F-301',label:'Agitated Nutsche filter',x:12.2,radius:1.35,bottom:1.98,top:4.05,labelY:6.80},6:{tag:'TK-301',label:'Filtrate receiver',x:15.6,z:-2.6,radius:.72,bottom:.90,top:1.85,labelY:2.90},7:{tag:'TK-302',label:'Wash supply',x:12.2,z:-4.7,radius:.60,bottom:1.2,top:2.7,labelY:3.65},8:{tag:'H-401',label:'Wet cake receiving hopper',x:15.15,z:.85,radius:.52,bottom:7.03,top:7.65,labelY:8.50},9:{tag:'BL-301',label:'Plant utility tie-ins',x:16.5,z:-4.7,labelY:4.2}});
Object.assign(EQUIPMENT,{10:{tag:'DR-401',label:'Conical vacuum dryer',x:20.3,radius:1.42,bottom:3.25,top:5.0,labelY:7.55},11:{tag:'F-401',label:'Vapor dust filter',x:23,z:-1,radius:.35,bottom:5.3,top:6.15,labelY:7.05},12:{tag:'E-401',label:'Vapor condenser',x:25,z:-2.5,radius:.45,bottom:2.55,top:4.65,labelY:5.7},13:{tag:'TK-401',label:'Condensate separator',x:25,z:-2.5,radius:.72,bottom:.65,top:1.60,labelY:2.6},14:{tag:'VP-401',label:'Dry vacuum pump',x:27.1,z:-2.5,labelY:2.1},15:{tag:'BIN-401',label:'Dry product receiver',x:20.3,radius:.65,bottom:.30,top:1.20,labelY:2.3},16:{tag:'SC-401',label:'Enclosed cake screw feeder',x:17.5,z:.85,labelY:7.1},17:{tag:'BL-401',label:'Drying plant interfaces',x:29.85,z:-4.8,labelY:6.8}});
EQUIPMENT[18]={tag:'PL-301',label:'Filter access platform',x:12.2,z:0,labelY:5.5};
Object.assign(EQUIPMENT,{
19:{tag:'T-202',label:'Phosphoric acid day tank',x:-7.3,z:-6.8,radius:1.0,bottom:1.1,top:3.9,labelY:5.1},
20:{tag:'H-201A / SF-201A',label:'Pre-G dosing A',x:-2.15,z:-5.6,radius:.60,bottom:7.0,top:8.2,labelY:9.1},
21:{tag:'H-201B / SF-201B',label:'Pre-G dosing B',x:2.75,z:-5.6,radius:.60,bottom:7.0,top:8.2,labelY:9.1},
22:{tag:'H-202A / SF-202A',label:'KMnO₄ dosing A',x:-4.04,z:-5.6,radius:.44,bottom:7.0,top:8.1,labelY:8.9},
23:{tag:'H-202B / SF-202B',label:'KMnO₄ dosing B',x:.86,z:-5.6,radius:.44,bottom:7.0,top:8.1,labelY:8.9},
24:{tag:'SI-201A / M-201A',label:'Powder induction A',x:-4.04,z:-3.8,labelY:4.8},
25:{tag:'SI-201B / M-201B',label:'Powder induction B',x:.86,z:-3.8,labelY:4.8},
26:{tag:'T-301',label:'Hydrogen peroxide supply',x:7.3,z:-6.8,radius:.72,bottom:1.0,top:2.85,labelY:3.9},
27:{tag:'T-302',label:'Hydrochloric acid supply',x:7.3,z:10.5,radius:.85,bottom:1.0,top:3.25,labelY:4.3},
28:{tag:'T-305',label:'Acid wash vessel',x:7.3,z:5.7,radius:1.15,bottom:1.0,top:3.4,labelY:4.8},
29:{tag:'BL-A200',label:'Feed and vent interfaces',x:-10.5,z:-9,labelY:5.1}
});
Object.assign(EQUIPMENT,{
30:{tag:'C-301',label:'Decanter centrifuge',x:4.1,z:6.15,labelY:6.8},31:{tag:'T-304',label:'Acidic centrate collection',x:1,z:10.5,radius:.85,bottom:1.05,top:2.4,labelY:3.5},
...A400_EQUIPMENT,
36:{tag:'R-101',label:'Graphite / acid premix',x:-34,z:-15,radius:1,bottom:1.2,top:4.2,labelY:5.6},37:{tag:'T-102',label:'Premix sulfuric acid supply',x:-38,z:-15,radius:.8,bottom:1,top:3,labelY:4.1},38:{tag:'H-101 / SF-101',label:'Graphite charging',x:-34.55,z:-15,labelY:7.5},
39:{tag:'R-141A',label:'Pre-G synthesis A',x:-29,z:-15,radius:.9,bottom:1.2,top:4.2,labelY:5.6},40:{tag:'R-141B',label:'Pre-G synthesis B',x:-25,z:-15,radius:.9,bottom:1.2,top:4.2,labelY:5.6},41:{tag:'R-141C',label:'Pre-G synthesis C',x:-29,z:-20,radius:.9,bottom:1.2,top:4.2,labelY:5.6},42:{tag:'R-141D',label:'Pre-G synthesis D',x:-25,z:-20,radius:.9,bottom:1.2,top:4.2,labelY:5.6},43:{tag:'CH-141 / CH-142',label:'Dedicated reagent charging stations',x:-27,z:-18,labelY:7.8},
44:{tag:'T-161',label:'Pre-G fixing tank',x:-19,z:-15,radius:.95,bottom:1.1,top:3.6,labelY:5.0},45:{tag:'T-162',label:'Pre-G holding tank',x:-19,z:-20,radius:.95,bottom:1.1,top:3.6,labelY:5.0},46:{tag:'F-161',label:'Membrane filter press',x:-14.5,z:-20,labelY:4.0},47:{tag:'D-164',label:'Vacuum tray dryer',x:-14.5,z:-15,labelY:4.2},48:{tag:'TR-164',label:'Contained wet-cake tray handling',x:-14.5,z:-18,labelY:2.1},49:{tag:'H-164',label:'Contained dry tray unloading',x:-11.8,z:-13.9,labelY:3.4},50:{tag:'EL-164 / SC-164',label:'Dry Pre-G distribution',x:-10.8,z:-13.9,labelY:11.7},51:{tag:'T-163',label:'Pre-G filtrate holding tank',x:-19,z:-25.5,radius:.9,bottom:1.05,top:2.4,labelY:3.4},52:{tag:'BL-A100',label:'Pre-G utilities and waste interfaces',x:-40,z:-23,labelY:5.4},53:{tag:'VP-164 / KO-164',label:'Dryer vacuum and condensate',x:-10.8,z:-18.3,labelY:3.3}
});
for(const [id,source,suffix] of [[54,1,'C'],[55,2,'D'],[56,20,'C'],[57,21,'D'],[58,22,'C'],[59,23,'D'],[60,24,'C'],[61,25,'D']]){const e=EQUIPMENT[source];EQUIPMENT[id]={...e,tag:e.tag.replace(/([12]01|202)([AB])/g,'$1'+suffix),label:e.label.replace(/ [AB]$/, ' '+suffix),z:(e.z||0)-16};}
EQUIPMENT[62]={tag:'P-206A / P-206B',label:'Selectable transfer pump pair',x:4.35,z:2.5,labelY:2.6};
Object.assign(EQUIPMENT,{
63:{tag:'T-501',label:'Sonication conditioning tank',x:31,z:10.5,radius:1.1,bottom:1.6,top:4.4,labelY:5.9,provisional:true},
64:{tag:'P-501',label:'Sonication circulation pump',x:33.6,z:10.5,labelY:2.4,provisional:true},
65:{tag:'US-501',label:'Inline sonication · three cells',x:38,z:10.5,labelY:6.7},
66:{tag:'E-501',label:'Sonication loop cooler',x:42,z:10.5,labelY:4.8,provisional:true},
67:{tag:'P-502',label:'Accepted product transfer',x:29,z:10.5,labelY:2.4,provisional:true},
68:{tag:'BL-A500',label:'Sonication utilities / A600 outlet',x:45,z:15,labelY:5.5,provisional:true}
});
Object.assign(EQUIPMENT,{
69:{tag:'T-601',label:'Aqueous dryer-feed buffer',x:49,z:16.5,radius:1.2,bottom:1.6,top:4.3,labelY:5.8},
70:{tag:'P-601',label:'Metered dryer feed / recycle',x:52,z:16.5,labelY:2.5},
71:{tag:'DR-601',label:'Aqueous GO spray dryer',x:58,z:12,radius:2,bottom:8,top:12,labelY:14.7},
72:{tag:'BL-601',label:'Filtered drying-air blower',x:51,z:8,labelY:3.8},
73:{tag:'HX-601',label:'Indirect drying-gas heater',x:54,z:8,labelY:4.3},
74:{tag:'F-601',label:'Powder recovery bag filter',x:63.2,z:12,radius:1.05,bottom:6.7,top:9.2,labelY:10.3},
75:{tag:'FN-601',label:'Induced-draft fan',x:66.8,z:12,labelY:10.2},
76:{tag:'SC-601',label:'Wet exhaust polishing',x:70,z:12,radius:1,bottom:1.8,top:7.3,labelY:8.7},
77:{tag:'T-602',label:'Contained dried-GO receiver',x:60.5,z:12,radius:1.0,bottom:2.0,top:2.8,labelY:3.9},
78:{tag:'BL-A600',label:'Drying utilities / A700 interface',x:73,z:18.5,labelY:5.8}
});
Object.assign(EQUIPMENT,{
79:{tag:'TR-701',label:'Contained powder lift · proposed',x:60.5,z:19,labelY:7,provisional:true},
80:{tag:'LK-701',label:'Argon purge transfer lock · proposed',x:60.5,z:25,radius:.45,bottom:7.45,top:8.45,labelY:9.4,provisional:true},
81:{tag:'H-701',label:'Sealed continuous-feed buffer · proposed',x:60.5,z:25,radius:.7,bottom:5.3,top:6.2,labelY:6.8,provisional:true},
82:{tag:'C-701',label:'Metered screw feeder',x:63,z:25,labelY:5.3},
83:{tag:'PY-701',label:'Continuous three-zone furnace',x:72,z:25,labelY:6.5},
84:{tag:'E-702',label:'Indirect product screw cooler',x:82,z:25,labelY:3.6},
85:{tag:'T-702',label:'Cooled pyrolyzed product receiver',x:85.2,z:25,radius:.65,bottom:1.3,top:1.9,labelY:2.9},
86:{tag:'E-701',label:'Furnace off-gas cooler',x:80,z:20,labelY:4.5},
87:{tag:'KO-701',label:'Condensate separator · proposed',x:83,z:20,radius:.5,bottom:1.9,top:3.4,labelY:4.1,provisional:true},
88:{tag:'FN-701',label:'Pressure-control exhaust fan',x:86,z:20,labelY:4.5},
89:{tag:'AR-701',label:'Argon purge / process manifold · proposed',x:58,z:30,labelY:4.4,provisional:true},
90:{tag:'AIT-701',label:'Oxygen verification / pressure control',x:73,z:29.5,labelY:3.2,provisional:true},
91:{tag:'BL-700-UTIL',label:'Argon, cooling and gas treatment interfaces',x:91,z:28,labelY:6,provisional:true}
});
Object.assign(EQUIPMENT,A5000_EQUIPMENT,A4000_EQUIPMENT,A800_EQUIPMENT,A900_EQUIPMENT,ARGON_EQUIPMENT,ACCESS_EQUIPMENT,A1000_EQUIPMENT,A2000_EQUIPMENT,A3000_EQUIPMENT,EXHAUST_EQUIPMENT,CONTAINMENT_EQUIPMENT);
const BASE_EQUIPMENT=structuredClone(EQUIPMENT);
export const EQUIPMENT_ORDER=[37,38,36,39,40,41,42,43,44,45,51,46,48,47,49,50,53,52,3,19,20,21,22,23,24,25,1,2,54,55,56,57,58,59,60,61,62,26,4,30,31,27,28,32,33,34,35,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,123,79,80,81,82,83,84,85,86,87,88,89,90,91,...Object.keys(A800_EQUIPMENT).map(Number),...Object.keys(A900_EQUIPMENT).map(Number),29,5,6,7,8,16,10,11,12,13,14,15,18,9,17,0];
const Y=new T.Vector3(0,1,0),Z=new T.Vector3(0,0,1),TAU=Math.PI*2,V=a=>new T.Vector3(...a),A=v=>v.toArray();
const geos=new Map();function geo(key,fn){if(!geos.has(key))geos.set(key,fn());return geos.get(key)}
const cyl=geo('cylinder',()=>new T.CylinderGeometry(1,1,1,32));
const cube=geo('beveled-box',()=>{const shape=new T.Shape();shape.moveTo(-.5,-.5);shape.lineTo(.5,-.5);shape.lineTo(.5,.5);shape.lineTo(-.5,.5);shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:1,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:3,steps:1,curveSegments:1});g.translate(0,0,-.5);g.scale(1/1.05,1/1.05,1/1.05);return g;});
const hex=geo('hex',()=>new T.CylinderGeometry(1,1,1,6));
const sphere=geo('sphere',()=>new T.SphereGeometry(1,20,12));
function annulus(r,hole,h){return geo(`annulus:${r}:${hole}:${h}`,()=>new T.LatheGeometry([new T.Vector2(hole,-h/2),new T.Vector2(r,-h/2),new T.Vector2(r,h/2),new T.Vector2(hole,h/2),new T.Vector2(hole,-h/2)],32))}
function tubeGeo(r){return geo(`pipe:${r}`,()=>new T.LatheGeometry([new T.Vector2(r*.78,-.5),new T.Vector2(r,-.5),new T.Vector2(r,.5),new T.Vector2(r*.78,.5),new T.Vector2(r*.78,-.5)],24))}
function orient(axis){return new T.Quaternion().setFromUnitVectors(Y,V(axis).normalize())}
function basis(axis){const d=V(axis).normalize(),u=new T.Vector3().crossVectors(d,Math.abs(d.y)<.9?Y:Z).normalize(),v=new T.Vector3().crossVectors(d,u).normalize();return{d,u,v}}
const move=(p,axis,l)=>A(V(p).addScaledVector(V(axis),l));
export function buildModel({a160='baseline',scope='all',argonSource='bulk',pipeRacks=true,onPhase=null,thermalRoutePlanner}={}){if(!A160_DESIGNS[a160])throw Error('Unknown A-160 configuration');const EQUIPMENT=structuredClone(BASE_EQUIPMENT);applyA160Equipment(EQUIPMENT,a160);const structure={contacts:[],roots:[],loads:[],access:[]};const parts=[],edges=[],terminals=[],supports=[],valves=[],routes=[],ports=[];let activeRoute=null;let reactor=1,cx=-2.45,assembly='';
function add(name,system,g,p,material='steel',q=new T.Quaternion(),scale=[1,1,1],extra={}){const center=extra.center||p,id=(parts.at(-1)?.id||0)+1;const rad=Math.atan2(cx+center[0]-EQUIPMENT[reactor].x,center[2]-(EQUIPMENT[reactor].z||0)),sign=Math.sign(EQUIPMENT[reactor].x);const offset=new T.Vector3(Math.sin(rad)*(1.7+(id%5)*.045)+sign*1.5,(center[1]-2.7)*.72,Math.cos(rad)*(1.7+(id%7)*.035));if(system==='fastener'){offset.x+=Math.sin(id*2.399)*.20;offset.y+=(id%7-3)*.08;offset.z+=Math.cos(id*2.399)*.20}const part={...extra,routeId:activeRoute?.id||null,id,code:`${EQUIPMENT[reactor].tag}-${String(id).padStart(4,'0')}`,name,system,reactor,assembly,geometry:g,material,position:new T.Vector3(cx+p[0],p[1],p[2]),center:new T.Vector3(cx+center[0],center[1],center[2]),quaternion:q,scale:V(scale),offset,cut:!!extra.cut,localZ:center[2]-(EQUIPMENT[reactor].z||0)};parts.push(part);if(activeRoute)activeRoute.partIds.push(part.id);return part}
function c(name,sys,r,h,p,mat='steel',axis=[0,1,0]){return add(name,sys,cyl,p,mat,orient(axis),[r,h,r])}
function b(name,sys,size,p,mat='steel',q=new T.Quaternion()){return add(name,sys,cube,p,mat,q,size)}
function band(name,sys,r,hole,h,p,mat='bright',axis=[0,1,0]){return add(name,sys,annulus(r,hole,h),p,mat,orient(axis))}
function ring(name,sys,r,t,p,mat='bright',axis=[0,1,0],arc=TAU,rotation=0){const g=geo(`tor:${r}:${t}:${arc}`,()=>new T.TorusGeometry(r,t,8,arc===TAU?48:24,arc));const q=new T.Quaternion().setFromUnitVectors(Z,V(axis)).multiply(new T.Quaternion().setFromAxisAngle(Z,rotation));const mid=new T.Vector3(Math.cos(arc/2)*r,Math.sin(arc/2)*r,0).applyQuaternion(q).add(V(p));return add(name,sys,g,p,mat,q,[1,1,1],arc<TAU?{center:A(mid)}:{})}
function world(p){return[cx+p[0],p[1],p[2]]}function edge(a,z,name,part){const e={a:world(a),b:world(z),name,reactor,part:part?.id,routeId:activeRoute?.id||null,internalTo:activeRoute?.internalTo||null,radius:part?.conduitRadius||(part?.geometry.type==='CylinderGeometry'?part.scale.x:.045),path:part?.centerline||[world(a),world(z)]};edges.push(e);if(activeRoute)activeRoute.edgeIndices.push(edges.length-1);}function terminal(p,label){terminals.push({point:world(p),label,reactor})}
function tube(a,z,r=.045,name='Sanitary pipe spool'){const d=V(z).sub(V(a)),h=d.length();if(h<1e-8)throw Error('Zero length tube '+name);const part=add(name,'pipe',tubeGeo(r),A(V(a).add(V(z)).multiplyScalar(.5)),'bright',orient(A(d.normalize())),[1,h,1],{ports:[world(a),world(z)],conduitRadius:r});edge(a,z,name,part);return part}
function bolt(p,axis=[0,1,0],size=1,label='Flange bolt'){const d=V(axis).normalize(),q=orient(A(d));const point=t=>A(V(p).addScaledVector(d,t*size));add(label+' · shank','fastener',cyl,p,'bright',q,[.012*size,.09*size,.012*size]);const profile=[];for(let j=0;j<=48;j++)profile.push(new T.Vector2(j%4===0?.012:.015,-.043+j*.086/48));const thread=geo('bolt-thread',()=>new T.LatheGeometry(profile,12));add(label+' · thread','fastener',thread,p,'bright',q,[size,size,size]);add(label+' · hex head','fastener',hex,point(.055),'bright',q,[.026*size,.023*size,.026*size]);for(const side of [-1,1])band(label+` · ${side<0?'lower':'upper'} washer`,'fastener',.030*size,.013*size,.005*size,point(side*.041),'bright',A(d));add(label+' · hex nut','fastener',hex,point(-.057),'bright',q,[.024*size,.024*size,.024*size]);ring(label+' · lock washer','fastener',.020*size,.003*size,point(-.038),'dark',A(d),TAU*.91);}
function boltCircle(p,axis,r,n,size,label){const{u,v}=basis(axis);for(let k=0;k<n;k++){const a=k*TAU/n;bolt(A(V(p).addScaledVector(u,Math.cos(a)*r).addScaledVector(v,Math.sin(a)*r)),axis,size,`${label} ${k+1}`)}}
function clamp(p,axis=[0,1,0],r=.045,label='Sanitary clamp'){const{d,u,v}=basis(axis),outer=r*1.85;
for(const s of [-1,1])band(label+' · ferrule','pipe',outer,r*.79,.033,move(p,A(d),s*.024),'bright',A(d));band(label+' · gasket','pipe',outer*.95,r*.78,.012,p,'gasket',A(d));
for(const k of [0,1])ring(label+' · clamp half','pipe',outer,.015,p,'bright',A(d),Math.PI-.055,k*Math.PI+.028);
const hinge=A(V(p).addScaledVector(u,-outer-.014));c(label+' · hinge pin','pipe',.018,.07,hinge,'bright',A(d));for(const s of [-1,1])b(label+' · closure lug','pipe',[.043,.036,.04],A(V(p).addScaledVector(u,outer+.02).addScaledVector(d,s*.028)),'steel',orient(A(d)));
bolt(A(V(p).addScaledVector(u,outer+.035)),A(d),.65,label+' tension bolt');}
function capped(p,axis=[0,1,0],r=.045,label='Capped service connection'){const first=parts.length;clamp(p,axis,r,label);c(label+' · blank cap','pipe',r*1.7,.03,move(p,axis,.018),'bright',axis);terminal(p,label);for(const part of parts.slice(first)){part.componentAssembly='closure-'+parts[first].id;part.assemblyRole='accessory';part.attachmentPoint=world(p);}}
function flange(p,axis=[0,1,0],r=.065,label='Bolted flange'){for(const s of [-1,1])band(label+' · flange face','pipe',r*2.15,r*.8,.043,move(p,axis,s*.027),'bright',axis);band(label+' · gasket','pipe',r*1.9,r*.79,.01,p,'gasket',axis);boltCircle(p,axis,r*1.72,8,.72,label+' stud');}
function valve(a,z,r=.045,color='red',type='lever',label='Isolation valve'){const first=parts.length,vi=valves.length;try{const dir=V(z).sub(V(a)).normalize(),axis=A(dir),p=A(V(a).add(V(z)).multiplyScalar(.5)),h=V(z).distanceTo(V(a));valves.push({label,reactor,a:world(a),b:world(z),type});const part=c(label+' · body','valve',r*1.95,h,p,'bright',axis);part.conduitRadius=r*1.95;edge(a,z,label,part);clamp(a,axis,r,label+' inlet');clamp(z,axis,r,label+' outlet');
if(type==='check'){c(label+' · check disc','internal',r*.82,.018,p,'dark',axis);for(let k=0;k<5;k++)ring(label+' · spring turn','internal',r*.38,.004,move(p,axis,.025+k*.013),'bright',axis);boltCircle(p,axis,r*1.45,4,.42,label+' cover bolt');return;}
if(type==='regulator'){c(label+' · diaphragm connection','valve',.038,.09,move(p,[0,1,0],.04));c(label+' · diaphragm casing','valve',.12,.12,move(p,[0,1,0],.12),'blue');c(label+' · spring bonnet','valve',.065,.15,move(p,[0,1,0],.25),'blue');c(label+' · pressure adjusting knob','valve',.044,.07,move(p,[0,1,0],.36),'dark');for(let k=0;k<7;k++)ring(label+' · regulator spring','internal',.025,.004,move(p,[0,1,0],.19+k*.018),'bright');boltCircle(move(p,[0,1,0],.12),[0,1,0],.10,6,.45,label+' diaphragm fixing');return;}
const stemDir=Math.abs(dir.z)<.8?[0,0,1]:[0,1,0];const stemBase=move(p,stemDir,r*1.4),stemEnd=move(p,stemDir,.20);c(label+' · stem','valve',.023,.17,move(p,stemDir,.13),'bright',stemDir);band(label+' · packing gland','valve',.052,.023,.038,move(p,stemDir,.095),'bright',stemDir);ring(label+' · gland seal','valve',.035,.007,move(p,stemDir,.115),'gasket',stemDir);c(label+' · spindle cap','valve',.044,.032,stemEnd,'dark',stemDir);
if(type==='wheel'){ring(label+' · handwheel rim','valve',.14,.022,move(p,stemDir,.22),'blue',stemDir);const{u,v}=basis(stemDir);for(let k=0;k<5;k++){const d=u.clone().multiplyScalar(Math.cos(k*TAU/5)).addScaledVector(v,Math.sin(k*TAU/5));const pa=V(move(p,stemDir,.22)).addScaledVector(d,.074);c(label+' · handwheel spoke','valve',.012,.13,A(pa),'blue',A(d))}c(label+' · hub','valve',.05,.035,move(p,stemDir,.22),'blue',stemDir)}else{const hd=Math.abs(dir.y)>.8?[1,0,0]:[0,1,0];c(label+' · handle arm','valve',.019,.22,move(stemEnd,hd,.10),'bright',hd);c(label+' · handle grip','valve',.031,.19,move(stemEnd,hd,.215),color,hd);b(label+' · locking tab','valve',[.035,.05,.024],move(stemEnd,hd,.04),'bright')}
bolt(move(p,stemDir,.235),stemDir,.53,label+' handle fixing');for(const k of [-1,1])bolt(move(p,[1,0,0],k*.07),stemDir,.46,label+' body fixing');}finally{const ids=parts.slice(first).map(p=>p.id);for(const p of parts.slice(first))p.componentAssembly='valve-'+ids[0];Object.assign(valves[vi],{partIds:ids});}}
function bulkValve(a,z,r,tag,label){const start=parts.length,axis=A(V(z).sub(V(a)).normalize()),mid=A(V(a).add(V(z)).multiplyScalar(.5)),height=V(a).distanceTo(V(z));const body=band(label+' · body','valve',r*1.72,r*.79,height,mid,'bright',axis);body.conduitRadius=r*1.72;edge(a,z,label,body);edges.at(-1).barrierTag=tag;const closed=orient(axis),rotationAxis=Math.abs(axis[0])>.8?[0,0,1]:[1,0,0];const disc=c(label+' · sealing disc','internal',r*.78,.014,mid,'dark',axis);disc.valveTag=tag;disc.closedQuaternion=closed.clone();disc.openQuaternion=new T.Quaternion().setFromAxisAngle(V(rotationAxis),Math.PI/2).multiply(closed);disc.quaternion.copy(disc.openQuaternion);c(label+' · spindle','valve',.018,r*3.8,mid,'bright',rotationAxis);const actuator=move(mid,rotationAxis,r*2.4);b(label+' · pneumatic actuator','valve',[.19,.12,.17],actuator,'blue');b(label+' · position switch','valve',[.075,.065,.06],move(actuator,[0,1,0],.09),'dark');clamp(a,axis,r,label+' upstream flange');clamp(z,axis,r,label+' downstream flange');valves.push({tag,label,reactor,a:world(a),b:world(z),type:'bulk-isolation',partIds:parts.slice(start).map(p=>p.id),discId:disc.id});for(const p of parts.slice(start))p.componentAssembly='valve-'+body.id;return body;}
function segment(a,z,r,name,spec){if(!spec)return tube(a,z,r,name);const len=V(a).distanceTo(V(z));if(len<.30)throw Error('Valve run too short '+name);const d=A(V(z).sub(V(a)).normalize()),mid=A(V(a).add(V(z)).multiplyScalar(.5)),v1=move(mid,d,-.12),v2=move(mid,d,.12);tube(a,v1,r,name+' upstream');valve(v1,v2,r,spec.color||'red',spec.type||'lever',spec.label||name+' valve');tube(v2,z,r,name+' downstream')}
function route(points,r=.045,name='Process line',specs={}){const previous=activeRoute;const entry={id:`LINE-${String(routes.length+1).padStart(3,'0')}`,label:name,reactor,partIds:[],edgeIndices:[],service:specs.service||null,direction:specs.direction||null,internalTo:specs.internalTo||null,endpoints:[world(points[0]),world(points.at(-1))]};routes.push(entry);activeRoute=entry;const entries=[],exits=[];for(let i=0;i<points.length;i++){if(i===0||i===points.length-1){entries[i]=exits[i]=points[i];continue}const prev=V(points[i-1]).sub(V(points[i])),next=V(points[i+1]).sub(V(points[i]));if(prev.clone().normalize().dot(next.clone().normalize())<-.999999){entries[i]=exits[i]=points[i];continue;}const trim=Math.min(specs.bendRadius||.14,prev.length()*(specs.bendFactor||.22),next.length()*(specs.bendFactor||.22));entries[i]=A(V(points[i]).addScaledVector(prev.normalize(),trim));exits[i]=A(V(points[i]).addScaledVector(next.normalize(),trim));}
for(let i=0;i<points.length-1;i++)segment(exits[i],entries[i+1],r,name+` spool ${i+1}`,specs[i]);for(let i=1;i<points.length-1;i++){if(V(entries[i]).distanceTo(V(exits[i]))<1e-8)continue;const origin=V(points[i]),curve=new T.QuadraticBezierCurve3(V(entries[i]).sub(origin),new T.Vector3(),V(exits[i]).sub(origin));const g=new T.TubeGeometry(curve,12,r,12,false);const part=add(name+` · formed elbow ${i}`,'pipe',g,A(origin),'bright',new T.Quaternion(),[1,1,1],{center:points[i],ports:[world(entries[i]),world(exits[i])],conduitRadius:r,fittingType:'formed-elbow',portAxes:[A(curve.getTangent(0).negate()),A(curve.getTangent(1))],centerline:curve.getPoints(16).map(v=>world(v.add(origin).toArray()))});edge(entries[i],exits[i],name+' elbow',part);for(const [p,d] of [[entries[i],A(V(points[i]).sub(V(entries[i])).normalize())],[exits[i],A(V(exits[i]).sub(V(points[i])).normalize())]])ring(name+' · orbital weld','pipe',r,.003,p,'weld',d)}activeRoute=previous;return points.at(-1)}
function nozzle(root,axis,length,name,r=.055,owner=reactor){const previousOwner=reactor,first=parts.length;reactor=owner;const inside=move(root,axis,-.045),end=move(root,axis,length);tube(inside,end,r,name+' neck');terminal(inside,name+' vessel penetration');ring(name+' · welded root','pipe',r*1.17,.009,root,'weld',axis);clamp(end,axis,r,name+' connection');ports.push({id:`${EQUIPMENT[reactor].tag}:${name}`,reactor,label:name,point:world(end),axis:[...axis],radius:r});for(const p of parts.slice(first)){p.componentAssembly='nozzle-'+parts[first].id;p.exploreRole='equipment';p.attachmentPoint=world(root);p.physicalHostTag=name.match(/^([A-Z][A-Z0-9]*-[A-Z0-9]+)(?=\s)/)?.[1]||EQUIPMENT[owner].tag;}reactor=previousOwner;return end}
function gauge(connection,label='Pressure gauge',entryAxis=[0,1,0]){const first=parts.length,attachment=world(connection);if(Math.abs(entryAxis[1])<.99){const turn=move(connection,entryAxis,.14),rise=move(turn,[0,1,0],.14);route([connection,turn,rise],.022,label+' instrument elbow',{bendRadius:.075,bendFactor:.45});connection=rise;}const base=move(connection,[0,1,0],.12),center=move(base,[0,1,0],.125);tube(connection,base,.022,label+' impulse stem');terminal(base,label+' instrument socket');band(label+' · process nut','valve',.04,.023,.047,move(connection,[0,1,0],.04));c(label+' · casing','valve',.135,.073,center,'bright',[0,0,1]);c(label+' · white dial','valve',.119,.007,move(center,[0,0,1],.041),'dial',[0,0,1]);ring(label+' · bezel','valve',.125,.012,move(center,[0,0,1],.045),'bright',[0,0,1]);for(let k=0;k<13;k++){const a=(-.76+k*1.52/12)*Math.PI;const pp=V(center).add(new T.Vector3(Math.sin(a)*.094,Math.cos(a)*.094,.05));b(label+' · dial tick','valve',[.004,.018,.003],A(pp),'dark',new T.Quaternion().setFromAxisAngle(Z,-a))}b(label+' · needle','valve',[.006,.084,.004],move(center,[0,0,1],.053),'red',new T.Quaternion().setFromAxisAngle(Z,-.6));c(label+' · needle pin','valve',.012,.012,move(center,[0,0,1],.057),'dark',[0,0,1]);for(const part of parts.slice(first)){part.componentAssembly='gauge-'+parts[first].id;part.assemblyRole='accessory';part.attachmentPoint=[...attachment];}}
const processVents=[],oxidationPorts={};
const sharedPorts={upper:[],middle:[],lower:[],utility:[]};
for(reactor=1;reactor<=2;reactor++){cx=reactor===1?-2.45:2.45;const sign=reactor===1?-1:1;assembly='Vessel pressure boundary';
for(const[label,r,rows,h,mat]of[['Outer stainless jacket',1.19,2,2.25,'steel'],['Thermal jacket layer',1.125,2,2.23,'jacket'],['Inner process shell',1.055,2,2.25,'inner']]){const step=TAU/24;const g=geo(label,()=>new T.CylinderGeometry(r,r,h/rows,5,1,true,-step/2,step));for(let row=0;row<rows;row++)for(let k=0;k<24;k++){const a=k*step,y=2.02+(row+.5)*h/rows;add(`${label} · band ${row+1}, sector ${k+1}`,'shell',g,[0,y,0],mat,new T.Quaternion().setFromAxisAngle(Y,a),[1,1,1],{cut:true,center:[Math.sin(a)*r,y,Math.cos(a)*r]})}}
for(const top of[false,true])for(const inner of[false,true]){const rr=inner?1.055:1.19,hh=top?.44:.37,profile=[],opening=top?.635:(inner?.065:.08);for(let j=0;j<=16;j++){const t=j/16*Math.acos(opening/rr);profile.push(new T.Vector2(rr*Math.cos(t),top?4.27+hh*Math.sin(t):2.02-hh*Math.sin(t)+(inner?.035:0)))}const g=geo(`dome:${top}:${inner}`,()=>new T.LatheGeometry(profile,5,-TAU/48,TAU/24));for(let k=0;k<24;k++){const a=k*TAU/24;add(`${inner?'Inner':'Outer'} ${top?'upper':'lower'} dished head · sector ${k+1}`,'head',g,[0,0,0],inner?'inner':'bright',new T.Quaternion().setFromAxisAngle(Y,a),[1,1,1],{cut:true,center:[Math.sin(a)*rr*.7,top?4.5:1.84,Math.cos(a)*rr*.7]})}}
for(const y of[2.025,4.267])for(let k=0;k<24;k++){const a=k*TAU/24;ring('Jacket edge weld segment','head',1.19,.016,[0,y,0],'weld',[0,1,0],TAU/24,a).cut=true;}
assembly='Manway closure';band('Manway welded neck','head',.69,.635,.34,[0,4.76,0]);band('Neck reinforcing flange','head',.765,.635,.060,[0,4.90,0]);band('Reinforced removable agitator cover','head',.77,.07,.073,[0,4.985,0],'bright');ring('Manway lid rolled edge','head',.752,.025,[0,5.008,0]);ring('Manway lid gasket','head',.705,.018,[0,4.938,0],'gasket');band('Agitator cover crown','head',.68,.07,.035,[0,5.03,0],'bright');
for(let k=0;k<12;k++){const a=k*TAU/12,x=Math.sin(a)*.757,z=Math.cos(a)*.757;b('Manway swing-bolt clevis','head',[.08,.12,.075],[x,4.81,z]);c('Manway clevis pivot','head',.025,.10,[x,4.80,z],'bright',[1,0,0]);b('Manway clamp dog','head',[.095,.055,.105],[x,4.947,z]);bolt([x,4.967,z],[0,1,0],1.2,`Manway closure ${k+1}`);for(const s of[-1,1])c('Manway wing-nut grip','head',.018,.068,[x+s*.044,5.04,z],'bright',[1,0,0]);}
for(const x of[-.58,.58]){band('Cover lifting lug','head',.075,.037,.035,[x,5.12,0],'bright',[1,0,0]);b('Cover lifting lug root','head',[.055,.075,.13],[x,5.07,0],'bright');}
assembly='Mixing internals';c('Continuous agitator shaft','internal',.043,3.60,[0,3.88,0],'inner');for(const y of[2.3,3.3]){band('Impeller split hub','internal',.15,.044,.14,[0,y,0],'inner');boltCircle([0,y,0],[0,1,0],.108,6,.56,'Impeller hub bolt');for(let k=0;k<4;k++){const a=k*Math.PI/2;const q=new T.Quaternion().setFromEuler(new T.Euler(.28,a,0));b('Pitched mixing blade','internal',[.22,.035,.76],[Math.sin(a)*.43,y,Math.cos(a)*.43],'inner',q)}}for(let k=0;k<4;k++){const a=k*Math.PI/2+.5,x=Math.sin(a)*.99,z=Math.cos(a)*.99;b('Anti-swirl baffle','internal',[.11,1.98,.045],[x,3.12,z],'inner',new T.Quaternion().setFromAxisAngle(Y,a));for(const y of[2.42,3.82]){b('Baffle mounting tab','internal',[.12,.05,.11],[x,y,z],'inner');bolt([x,y,z],[0,1,0],.55,'Baffle attachment')}}
assembly='Vessel supports';for(const x of[-.92,.92])for(const z of[-.60,.60]){const rr=Math.hypot(x,z),surfaceY=2.02-.37*Math.sqrt(1-(rr/1.19)**2),top=surfaceY+.05;const foot=c('Levelling foot pad','frame',.105,.055,[x,.028,z],'dark');c('Foot adjustment stem','frame',.028,.23,[x,.17,z]);band('Foot lock nut','frame',.054,.029,.04,[x,.22,z]);const leg=c('Support leg tube','frame',.065,top-.25,[x,(top+.25)/2,z]);c('Welded leg collar','frame',.10,.13,[x,top-.06,z]);b('Vessel welded support pad','frame',[.19,.16,.18],[x,surfaceY+.025,z]);ring('Leg-to-pad weld','frame',.071,.008,[x,top-.09,z],'weld');b('Skid leg mounting plate','frame',[.27,.06,.25],[x,.30,z]);for(const dx of[-.084,.084])for(const dz of[-.075,.075])bolt([x+dx,.31,z+dz],[0,1,0],.65,'Skid mounting bolt');supports.push({reactor,leg:leg.id,legTop:top,vesselContact:surfaceY,padBottom:surfaceY-.055,padTop:surfaceY+.105});}
for(const z of[-.60,.60])b('Skid transverse member','frame',[2.20,.13,.13],[0,.32,z]);for(const x of[-1.035,1.035])b('Skid longitudinal member','frame',[.13,.13,1.60],[x,.32,0]);b('Pump mounting tray','frame',[.72,.09,.72],[-1.13,.43,-.10]);
assembly='Top-entry agitator drive';buildTopDrive({T,b,c,band,ring,boltCircle,route,terminal,parts,edges,reactor});
Object.assign(EQUIPMENT[reactor],{geometryStatus:REACTOR_MECHANICAL_BASIS.status,geometryBasis:REACTOR_MECHANICAL_BASIS.arrangement,reviewNote:REACTOR_MECHANICAL_BASIS.holds.join('; '),labelY:6.8});
assembly='Recirculation pump';const pump=[-1.13,.78,-.03];const recircVolute=c('Centrifugal pump volute','pump',.265,.25,pump,'bright',[0,0,1]);c('Pump front casing','pump',.234,.035,[-1.13,.78,.107],'bright',[0,0,1]);ring('Pump cover rim','pump',.235,.017,[-1.13,.78,.128],'bright',[0,0,1]);boltCircle([-1.13,.78,.125],[0,0,1],.203,10,.65,'Pump cover bolt');c('Pump coupling bell','pump',.16,.16,[-1.13,.78,-.23],'steel',[0,0,1]);c('Pump motor barrel','pump',.18,.40,[-1.13,.78,-.46],'steel',[0,0,1]);c('Pump fan cover','pump',.185,.05,[-1.13,.78,-.685],'dark',[0,0,1]);for(let k=0;k<18;k++){const a=k*TAU/18;b('Pump motor cooling fin','pump',[.024,.028,.31],[-1.13+Math.sin(a)*.18,.78+Math.cos(a)*.18,-.46],'steel',new T.Quaternion().setFromAxisAngle(Z,-a))}for(const x of[-1.28,-.98])b('Pump mounting foot','pump',[.09,.13,.40],[x,.535,-.24]);boltCircle([-1.13,.78,-.255],[0,0,1],.13,6,.55,'Pump coupling fastener');
const pumpIn=[-1.13,.78,.23],pumpOut=[-1.13,1.125,-.03];tube([-1.13,.78,.095],pumpIn,.07,'Pump suction nozzle');terminal([-1.13,.78,.095],'Pump suction chamber');clamp(pumpIn,[0,0,1],.07,'Pump suction clamp');tube([-1.13,.98,-.03],pumpOut,.055,'Pump discharge nozzle');terminal([-1.13,.98,-.03],'Pump discharge chamber');clamp(pumpOut,[0,1,0],.055,'Pump discharge clamp');
recircVolute.conduitRadius=.065;recircVolute.centerline=[world([-1.13,.78,.095]),world([-1.13,.78,-.03]),world([-1.13,.98,-.03])];edge([-1.13,.78,.095],[-1.13,.98,-.03],EQUIPMENT[reactor].tag+' P-205 hydraulic passage',recircVolute);
assembly='Connected vessel piping';
// Every endpoint is either shared with another modeled conduit or terminates in equipment / a modeled closure.
const drainRoot=[.62,2.02-.37*Math.sqrt(1-(Math.hypot(.62,.42)/1.19)**2),.42],drain=nozzle(drainRoot,[0,-1,0],.16,'Recirculation suction outlet',.065);
route([drain,[.62,1.05,.42],[.62,.95,1.20],[-1.13,.88,1.20],[-1.13,.78,.60],pumpIn],.065,'Recirculation suction to pump',{0:{color:reactor===2?'green':'blue',label:'Recirculation suction butterfly valve'},2:{color:'blue',type:'wheel',label:'Suction isolation valve'}});
const returnPort=nozzle([-Math.sqrt(1.19**2-.22**2),3.91,-.22],[-1,0,0],.23,'Recirculation return',.055);
oxidationPorts[reactor]={pumpOut:world(pumpOut),returnPort:world(returnPort)};
const lowJacket=nozzle([Math.sqrt(1.19**2-.34**2),2.19,-.34],[1,0,0],.22,'Lower jacket connection',.045);const upJacket=nozzle([Math.sqrt(1.19**2-.34**2),4.08,-.34],[1,0,0],.22,'Upper jacket connection',.045);
// Continue each riser through its bend before handing off to a separate header route.
const jBottom=[1.60,.76,-.74],jTop=[1.60,4.65,-.74];route([lowJacket,[1.60,2.19,-.34],[1.60,.76,-.34],jBottom],.045,'Jacket inlet riser',{1:{color:'red',label:'Jacket inlet valve'}});route([upJacket,[1.60,4.08,-.34],[1.60,4.65,-.34],jTop],.045,'Jacket outlet riser',{1:{type:'wheel',label:'Jacket return valve'}});
// Gauge branch shares the exact side-riser centerline.
route([[1.60,1.95,-.34],[1.60,1.95,.06],[1.60,2.48,.06]],.022,'Jacket pressure branch');gauge([1.60,2.48,.06],'Jacket pressure gauge');
const lowerTie=[reactor===1?2.45:-2.45,.76,-1.35];route([jBottom,[1.60,.76,-1.35],lowerTie],.045,'Lower utility header');sharedPorts.utility.push(world(lowerTie));
const upperTie=[reactor===1?2.45:-2.45,4.65,-1.35];route([jTop,[1.60,4.65,-1.35],upperTie],.045,'Upper utility header');sharedPorts.upper.push(world(upperTie));
const feed=nozzle([-.32,5.045,-.35],[0,1,0],.23,'Top feed nozzle',.055);const feedTie=[reactor===1?2.45:-2.45,4.43,-1.62];route([feed,[-.32,5.62,-.35],[-.32,5.62,-1.62],[-.32,4.43,-1.62],feedTie],.055,'Top feed header',{2:{type:'check',label:'Sulfuric acid branch non-return'},3:{color:'blue',type:'wheel',label:'Top feed isolation valve'}});sharedPorts.middle.push(world(feedTie));
const vent=nozzle([.35,5.045,-.25],[0,1,0],.19,'Top vent nozzle',.045);processVents.push({reactor,point:world(vent),radius:.045});
const lidGauge=nozzle([-.46,5.045,.19],[0,1,0],.22,'Lid instrument nozzle',.025);gauge(lidGauge,'Vessel pressure gauge');
const spare=nozzle([.43,5.045,.26],[0,1,0],.17,'Lid service nozzle',.045);capped(spare,[0,1,0],.045,'Lid service blank');

assembly='Product collection branch';
assembly='Central flush-bottom outlet';
const collect=buildCentralOutlet({T,add,b,c,band,ring,boltCircle,tube,edge,terminal,clamp,world,parts,edges,ports,valves,reactor,tag:EQUIPMENT[reactor].tag});
assembly='Product collection branch';
route([collect,[0,1.29,.64],[.36,1.25,.96],[.36,1.02,2.20],[.36,.80,2.20],...(reactor===1?[[.66,.80,2.20]]:[])],.055,'Product branch to receiver',{bendFactor:.45,2:{color:'green',label:`${EQUIPMENT[reactor].tag} product isolation valve`}});
// The right unit has an extra visible instrument branch and green handle, preserving asymmetry.
if(reactor===2){const ip=nozzle([.76,4.27+.44*Math.sqrt(1-(.76/1.19)**2),0],[1,0,0],.17,'Right upper instrument port',.025);route([ip,[1.23,ip[1],0],[1.23,5.28,0]],.025,'Right instrument branch');gauge([1.23,5.28,0],'Right auxiliary gauge');}
assembly='Pipe rack and brackets';for(const x of[-1.77,1.77]){b('Pipe rack upright','frame',[.065,5.55,.065],[x,2.825,-1.77]);b('Pipe rack foot plate','frame',[.22,.07,.22],[x,.035,-1.77]);for(const dx of[-.065,.065])bolt([x+dx,.04,-1.77],[0,1,0],.6,'Rack anchor');}b('Pipe rack upper crossbar','frame',[3.61,.065,.065],[0,5.55,-1.77]);b('Pipe rack lower crossbar','frame',[3.61,.065,.065],[0,.55,-1.77]);
for(const [x,py,pz,axis] of[[1.60,1.9,-.34,[0,1,0]],[1.35,4.65,-1.35,[1,0,0]]]){const rackX=x<0?-1.77:1.77;b('Pipe support standoff','frame',[.065,.05,Math.abs(pz+1.77)],[rackX,py,(pz-1.77)/2]);b('Pipe support cross-tab','frame',[Math.abs(rackX-x)+.1,.05,.065],[(rackX+x)/2,py,pz]);ring('Pipe support saddle','frame',.075,.012,[x,py,pz],'bright',axis);bolt([x+.09,py,pz],[0,1,0],.55,'Pipe saddle fixing');}
}
// Center skid: two vertical sanitary assemblies, paired gauges and small handwheel valves.
reactor=0;cx=0;assembly='Central sanitary manifold';const baseZ=-.80;
route([[-1.05,.53,baseZ],[1.05,.53,baseZ]],.045,'Central lower manifold');capped([-1.05,.53,baseZ],[-1,0,0],.045,'Manifold left service end');capped([1.05,.53,baseZ],[1,0,0],.045,'Manifold right service end');
for(const x of[-.49,.49]){const bottom=[x,.53,baseZ],top=[x,1.82,baseZ];route([bottom,[x,.86,baseZ]],.045,'Central column inlet');band('Central column bottom ferrule','pipe',.095,.045,.07,[x,.86,baseZ]);const part=c('Central vertical sanitary housing','pipe',.080,.75,[x,1.27,baseZ],'bright');edge([x,.895,baseZ],[x,1.645,baseZ],'Central vertical housing',part);tube([x,.86,baseZ],[x,.895,baseZ],.052,'Housing bottom neck');for(const y of[.895,1.66])flange([x,y,baseZ],[0,1,0],.052,'Central housing flange');tube([x,1.645,baseZ],[x,1.68,baseZ],.052,'Housing top neck');tube([x,1.68,baseZ],top,.025,'Central gauge neck');gauge(top,'Central column pressure gauge');for(const s of[-1,1]){const end=[x+s*.24,1.03,baseZ];route([[x,1.03,baseZ],end,[end[0],1.50,baseZ]],.026,'Central valve branch',{1:{color:'blue',type:'wheel',label:'Central manifold handwheel valve'}});capped([end[0],1.50,baseZ],[0,1,0],.026,'Central branch cap');}for(const dx of[-.14,.14]){c('Central housing support rod','frame',.015,.66,[x+dx,.66,baseZ-.18]);b('Central support attachment','frame',[.17,.05,.235],[x+dx/2,.97,baseZ-.09]);}}
// Tie manifold into the shared lower utility line, with a connected branch tee.
route([[0,.53,baseZ],[0,.76,baseZ],[0,.76,-1.35]],.045,'Central manifold utility tie');
for(const [y,z,r,label]of[[4.65,-1.35,.045,'Utility header'],[4.43,-1.62,.055,'Feed header'],[.76,-1.35,.045,'Utility return']]){clamp([0,y,z],[1,0,0],r,label+' center union');}
for(const y of[.30]){b('Center skid front rail','frame',[2.20,.12,.12],[0,y,-.55]);b('Center skid rear rail','frame',[2.20,.12,.12],[0,y,-1.25]);for(const x of[-1.04,1.04])b('Center skid cross member','frame',[.12,.12,.82],[x,y,-.90]);}
for(const x of[-1.02,1.02])for(const z of[-.55,-1.25]){c('Center skid adjustable foot','frame',.07,.26,[x,.15,z]);bolt([x,.28,z],[0,1,0],.9,'Center frame fixing');}
b('Central equipment mounting deck','frame',[1.55,.05,.78],[0,.38,-.90]);
// Reference-inspired storage tanks. Nominal proportions are visualization coordinates, not fabrication dimensions.
const tankPorts={};
for(reactor of[3,4]){cx=EQUIPMENT[reactor].x;const tag=EQUIPMENT[reactor].tag,R=1.45,step=TAU/32;
assembly='Storage vessel boundary';
for(const inner of[false,true]){const radius=inner?R-.035:R,g=geo(`tank-barrel:${inner}`,()=>new T.CylinderGeometry(radius,radius,1.05,5,1,true,-step/2,step));for(let row=0;row<3;row++)for(let k=0;k<32;k++){const a=k*step,y=1.50+(row+.5)*1.05;add(`${tag} ${inner?'inner':'outer'} shell · course ${row+1}, sector ${k+1}`,'shell',g,[0,y,0],inner?'inner':'steel',new T.Quaternion().setFromAxisAngle(Y,a),[1,1,1],{cut:true,center:[Math.sin(a)*radius,y,Math.cos(a)*radius]});}}
for(const top of[false,true])for(const inner of[false,true]){const dr=inner?.025:0,profile=top?[new T.Vector2(R-dr,4.65),new T.Vector2(.04,5.03-dr)]:[new T.Vector2(.07,1.03+dr),new T.Vector2(R-dr,1.50)];const g=geo(`tank-head:${top}:${inner}`,()=>new T.LatheGeometry(profile,5,-step/2,step));for(let k=0;k<32;k++){const a=k*step;add(`${tag} ${inner?'inner':'outer'} ${top?'sloped roof':'cone bottom'} · sector ${k+1}`,'head',g,[0,0,0],inner?'inner':'bright',new T.Quaternion().setFromAxisAngle(Y,a),[1,1,1],{cut:true,center:[Math.sin(a)*R*.65,top?4.82:1.22,Math.cos(a)*R*.65]});}}
for(const y of[1.50,2.55,3.60,4.65])for(let k=0;k<32;k++)ring(`${tag} shell orbital weld`,'head',R,.009,[0,y,0],'weld',[0,1,0],step,k*step).cut=true;
b(`${tag} equipment tag plate`,'shell',[.34,.16,.016],[0,3.62,R+.01],'bright');for(const x of[-.145,.145])bolt([x,3.62,R+.026],[0,0,1],.35,'Equipment plate fixing');
assembly='Tank supports and bracing';
for(const x of[-1.08,1.08])for(const z of[-.88,.88]){const top=1.61,contact=1.50;const leg=c(`${tag} tubular support leg`,'frame',.115,1.36,[x,.93,z]);c('Tank foot adjustment stem','frame',.04,.22,[x,.17,z]);c('Tank levelling foot','frame',.17,.065,[x,.045,z],'dark');band('Tank foot lock nut','frame',.076,.041,.043,[x,.20,z]);b('Tank welded support pad','frame',[.27,.23,.26],[x,1.53,z]);ring('Tank leg weld collar','frame',.119,.012,[x,1.53,z],'weld');b('Tank foot mounting plate','frame',[.31,.06,.30],[x,.26,z]);for(const dx of[-.105,.105])for(const dz of[-.10,.10])bolt([x+dx,.26,z+dz],[0,1,0],.75,'Tank leg mounting bolt');supports.push({reactor,leg:leg.id,legTop:top,vesselContact:contact,padBottom:1.415,padTop:1.645});}
for(const z of[-.88,.88])c('Tank transverse tubular brace','frame',.046,2.16,[0,.40,z],'steel',[1,0,0]);for(const x of[-1.08,1.08])c('Tank longitudinal tubular brace','frame',.046,1.76,[x,.40,0],'steel',[0,0,1]);
assembly='Tank manway closure';const mx=.48,mz=.38,my=5.025;
band('Tank manway welded neck','head',.49,.435,.25,[mx,4.925,mz]);band('Tank manway lower flange','head',.55,.435,.05,[mx,my,mz]);ring('Tank manway gasket','head',.48,.013,[mx,my+.033,mz],'gasket');c('Tank dished manway lid','head',.55,.060,[mx,my+.077,mz],'bright');ring('Tank lid rolled edge','head',.54,.018,[mx,my+.10,mz]);
for(let k=0;k<10;k++){const a=k*TAU/10,x=mx+Math.sin(a)*.535,z=mz+Math.cos(a)*.535;b('Tank manway swing-bolt lug','head',[.068,.15,.075],[x,my-.04,z]);c('Tank manway hinge pin','head',.019,.105,[x,my-.073,z],'bright',[1,0,0]);b('Tank manway clamp dog','head',[.10,.04,.08],[x,my+.05,z]);bolt([x,my+.035,z],[0,1,0],1.15,`Tank manway swing bolt ${k+1}`);for(const s of[-1,1])c('Tank manway wing grip','head',.015,.07,[x+s*.048,my+.12,z],'bright',[1,0,0]);}
for(const x of[mx-.17,mx+.17])c('Tank lid handle pedestal','head',.022,.11,[x,my+.15,mz]);c('Tank lid handle crossbar','head',.022,.34,[mx,my+.205,mz],'bright',[1,0,0]);
assembly='Tank agitator and internals';const ax=-.38,az=-.19;
c('Tank top agitator shaft','internal',.042,4.40,[ax,3.10,az],'inner');for(const y of[1.72,3.0]){band('Tank impeller hub','internal',.13,.043,.12,[ax,y,az],'inner');boltCircle([ax,y,az],[0,1,0],.10,6,.55,'Tank impeller clamp');for(let k=0;k<3;k++){const a=k*TAU/3;b('Tank pitched mixing blade','internal',[.22,.032,.85],[ax+Math.sin(a)*.46,y,az+Math.cos(a)*.46],'inner',new T.Quaternion().setFromEuler(new T.Euler(.30,a,0)));}}
for(let k=0;k<4;k++){const a=k*TAU/4+.42,x=Math.sin(a)*1.38,z=Math.cos(a)*1.38;b('Tank internal baffle','internal',[.15,2.55,.038],[x,3.0,z],'inner',new T.Quaternion().setFromAxisAngle(Y,a));for(const y of[1.95,4.05]){b('Tank baffle attachment','internal',[.16,.05,.10],[x,y,z],'inner');bolt([x,y,z],[0,1,0],.55,'Tank baffle fixing');}}
band('Agitator roof reinforcing pad','pump',.29,.07,.05,[ax,4.955,az]);c('Agitator bearing pedestal','pump',.18,.31,[ax,5.14,az]);c('Agitator seal collar','pump',.115,.07,[ax,5.31,az],'dark');band('Agitator mounting flange','pump',.255,.06,.065,[ax,5.35,az]);boltCircle([ax,5.35,az],[0,1,0],.207,8,.8,'Top agitator mounting');b('Blue geared agitator reducer','pump',[.48,.35,.38],[ax,5.55,az],'blue');c('Gearbox inspection cover','pump',.12,.026,[ax,5.55,az+.202],'blue',[0,0,1]);boltCircle([ax,5.55,az+.22],[0,0,1],.09,6,.42,'Gearbox cover bolt');
c('Agitator motor flange','pump',.205,.06,[ax-.275,5.60,az],'blue',[1,0,0]);c('Agitator electric motor barrel','pump',.18,.49,[ax-.55,5.60,az],'blue',[1,0,0]);c('Agitator motor fan cover','pump',.19,.08,[ax-.835,5.60,az],'dark',[1,0,0]);for(let k=0;k<24;k++){const a=k*TAU/24;b('Tank motor longitudinal cooling fin','pump',[.40,.022,.028],[ax-.56,5.60+Math.sin(a)*.181,az+Math.cos(a)*.181],'blue',new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-a));}b('Tank motor terminal enclosure','pump',[.20,.11,.18],[ax-.55,5.83,az],'blue');boltCircle([ax-.275,5.60,az],[1,0,0],.16,6,.63,'Tank motor coupling bolt');
assembly='Tank service nozzles';
const roofY=(x,z)=>5.03-.38*Math.hypot(x,z)/R;
const inlet=nozzle([.65,roofY(.65,-.5),-.5],[0,1,0],.23,reactor===4?'Receiver product inlet':'Supply fill inlet',.065);
if(reactor===3)capped(inlet,[0,1,0],.065,'Supply fill connection blank');
const roofAux=nozzle([1.06,roofY(1.06,0),0],[0,1,0],.16,'Tank roof service nozzle',.038);
route([roofAux,[1.06,5.03,0],[1.75,5.03,0],[1.75,3.55,0],[1.94,3.55,0]],.038,'Tank roof service drop',{2:{color:'red',label:'Tank roof service isolation'}});capped([1.94,3.55,0],[1,0,0],.038,'Tank service drop closure');
const vent=nozzle([-.82,roofY(-.82,.55),.55],[0,1,0],.18,'Tank vent connection',.04);processVents.push({reactor,point:world(vent),radius:.04});
const sample=nozzle([0,2.12,R],[0,0,1],.18,'Tank sample outlet',.033);route([sample,[0,2.12,2.03]],.033,'Tank sample valve',{0:{color:'red',label:'Tank sample isolation'}});capped([0,2.12,2.03],[0,0,1],.033,'Tank sample connection cap');
const level=nozzle([-.55,1.86,Math.sqrt(R*R-.55*.55)],[-.55/R,0,Math.sqrt(R*R-.55*.55)/R],.13,'Tank level instrument',.025);c('Tank level transmitter housing','valve',.082,.085,move(level,[-.55/R,0,Math.sqrt(R*R-.55*.55)/R],.0425),'dark',[-.55/R,0,Math.sqrt(R*R-.55*.55)/R]);terminal(level,'Tank level instrument socket');
const bottom=nozzle([0,1.03,0],[0,-1,0],.19,'Tank bottom outlet',.065);tankPorts[reactor]={inlet:world(inlet),bottom:world(bottom)};
if(reactor===4){route([bottom,[0,.57,0],[0,.57,1.75],[.70,.57,1.75]],.065,'Receiver drain and discharge',{bendFactor:.45,2:{color:'green',label:'Receiver bottom discharge valve'}});clamp([.70,.57,1.75],[1,0,0],.065,'Receiver downstream transfer union');tankPorts[4].discharge=world([.70,.57,1.75]);}
}
// Connected transfer pump modules have explicit suction, hydraulic passage and discharge geometry.
// Pump duty, seal selection and process compatibility are intentionally not inferred from photographs.
reactor=0;cx=0;
function transferPump(x,tag,service,options={}){const pumpStart=parts.length;assembly=`${tag} ${service} transfer pump`;const z=options.z??1.30,y=options.y??.80,previous=activeRoute;
const entry={id:`LINE-${String(routes.length+1).padStart(3,'0')}`,label:`${tag} ${service} pump passage`,reactor,service,transport:'equipment passage',partIds:[],edgeIndices:[],endpoints:[[x,y,z+.26],[x,y+.35,z]]};routes.push(entry);activeRoute=entry;
const volute=c(`${tag} pump volute`,'pump',.265,.24,[x,y,z],'bright',[0,0,1]);volute.conduitRadius=.065;volute.centerline=[[x,y,z+.10],[x,y,z],[x,y+.19,z]];edge([x,y,z+.10],[x,y+.19,z],`${tag} hydraulic passage`,volute);edges.at(-1).path=volute.centerline;
band(`${tag} bored front casing`,'pump',.232,.076,.032,[x,y,z+.133],'bright',[0,0,1]);ring(`${tag} casing rim`,'pump',.235,.016,[x,y,z+.15],'bright',[0,0,1]);boltCircle([x,y,z+.151],[0,0,1],.195,10,.7,`${tag} casing bolt`);
c(`${tag} coupling bell`,'pump',.16,.17,[x,y,z-.205],'steel',[0,0,1]);c(`${tag} electric motor`,'pump',.19,.45,[x,y,z-.50],'blue',[0,0,1]);c(`${tag} motor end cover`,'pump',.20,.06,[x,y,z-.755],'dark',[0,0,1]);for(let k=0;k<20;k++){const a=k*TAU/20;b(`${tag} motor cooling fin`,'pump',[.026,.028,.35],[x+Math.sin(a)*.195,y+Math.cos(a)*.195,z-.50],'blue',new T.Quaternion().setFromAxisAngle(Z,-a));}b(`${tag} motor terminal box`,'pump',[.16,.12,.19],[x,y+.23,z-.5],'blue');boltCircle([x,y,z-.265],[0,0,1],.132,6,.6,`${tag} coupling bolt`);
b(`${tag} pump base plate`,'frame',[.74,.08,1.15],[x,.35,z-.20]);for(const dx of[-.17,.17]){b(`${tag} pump mounting foot`,'frame',[.10,.235,.59],[x+dx,.5075,z-.20]);for(const dz of[-.48,.16])bolt([x+dx,.40,z+dz],[0,1,0],.7,`${tag} hold-down bolt`);}for(const dx of[-.28,.28])for(const dz of[-.66,.27]){c(`${tag} skid foot`,'frame',.062,.29,[x+dx,.165,z+dz]);c(`${tag} ground pad`,'frame',.09,.036,[x+dx,.024,z+dz],'dark');}
const inlet=[x,y,z+.26],outlet=[x,y+.35,z];tube([x,y,z+.10],inlet,.065,`${tag} suction neck`);clamp(inlet,[0,0,1],.065,`${tag} suction union`);tube([x,y+.19,z],outlet,.055,`${tag} discharge neck`);clamp(outlet,[0,1,0],.055,`${tag} discharge union`);activeRoute=previous;for(const p of parts.slice(pumpStart)){p.pumpAssetTag=tag;p.componentAssembly='pump-'+parts[pumpStart].id;p.exploreRole='equipment';}return{inlet,outlet};}
const supplyPump=transferPump(-5.10,'P-203','Supply'),receivePump=transferPump(5.10,'P-206A','Receive');
function reducer(a,z,rA,rB,label){const previous=activeRoute,entry={id:`LINE-${String(routes.length+1).padStart(3,'0')}`,label,reactor,service:'Receive',partIds:[],edgeIndices:[],endpoints:[world(a),world(z)]};routes.push(entry);activeRoute=entry;const h=V(a).distanceTo(V(z)),axis=A(V(z).sub(V(a)).normalize()),g=geo(`reducer:${rA}:${rB}:${h}`,()=>new T.LatheGeometry([new T.Vector2(rA*.78,-h/2),new T.Vector2(rA,-h/2),new T.Vector2(rB,h/2),new T.Vector2(rB*.78,h/2),new T.Vector2(rA*.78,-h/2)],32));const part=add(label,'pipe',g,A(V(a).add(V(z)).multiplyScalar(.5)),'bright',orient(axis),[1,1,1],{ports:[world(a),world(z)],portRadii:[rA,rB],conduitRadius:Math.max(rA,rB)});edge(a,z,label,part);clamp(z,axis,rB,label+' small-end union');activeRoute=previous;return z;}
assembly='Product collection network';
const collectionPumpEnd=reducer(receivePump.inlet,move(receivePump.inlet,[0,0,1],.24),.065,.055,'P-206 suction reducer');
const receiverInletEnd=reducer(tankPorts[4].inlet,move(tankPorts[4].inlet,[0,1,0],.24),.065,.055,'T-303 inlet reducer');
assembly='Supply transfer network';
route([tankPorts[3].bottom,[-7.3,.57,0],[-7.3,.57,2.20],[-5.1,.57,2.20],[-5.1,.80,2.20],supplyPump.inlet],.065,'T-201 outlet to P-203',{bendFactor:.45,2:{color:'blue',label:'T-201 outlet isolation'}});
route([supplyPump.outlet,[-5.1,5.85,1.30],[-5.1,5.85,-1.25],[0,5.85,-1.05],[0,4.43,-1.05],[0,4.43,-1.25],[0,4.43,-1.62]],.055,'Supply header to both reactors',{0:{color:'blue',label:'P-203 discharge isolation'}});
clamp([0,4.43,-1.85],[0,0,1],.055,'Supply tee branch union');
assembly='Product collection network';
route([[-1.79,.80,2.20],[2.81,.80,2.20]],.055,'R-201A collection header');
route([[2.81,.80,2.20],[5.10,.80,2.20],[5.10,.80,2.02]],.055,'Both reactor outlets to P-206');
bulkValve([5.10,.80,2.02],[5.10,.80,1.82],.055,'XV-P206A-IN','P-206A suction isolation');tube([5.10,.80,1.82],collectionPumpEnd,.055,'P-206A suction connection');
clamp([-1.79,.80,2.20],[1,0,0],.055,'R-201A product branch union');clamp([2.81,.90,2.20],[0,1,0],.055,'R-201B product tee branch union');
route([receivePump.outlet,[5.1,1.60,1.30]],.055,'P-206A discharge start');bulkValve([5.1,1.60,1.30],[5.1,1.90,1.30],.055,'XV-P206A-OUT','P-206A discharge isolation');
route([[5.1,1.90,1.30],[5.1,2.55,1.30]],.055,'P-206A discharge nonreturn',{0:{type:'check',label:'NRV-P206A'}});
route([[5.1,2.55,1.30],[5.10,6.15,1.30],[5.10,6.15,-.50],[7.95,6.15,-.50],receiverInletEnd],.055,'P-206 discharge to T-303',{0:{color:'green',label:'P-206 discharge isolation'},3:{color:'green',label:'T-303 inlet isolation'}});
assembly='Transfer pipe supports';
// Stanchions are behind the risers; their saddles contact the actual pipe centerline.
for(const x of[-5.10,5.10]){b('Transfer rack upright','frame',[.085,x<0?5.46:5.76,.085],[x,x<0?2.80:2.95,.78]);b('Transfer rack foot','frame',[.28,.08,.28],[x,.07,.78]);for(const dx of[-.085,.085])bolt([x+dx,.09,.78],[0,1,0],.75,'Transfer rack anchor');for(const y of[2.65,4.95]){b('Pipe support riser standoff','frame',[.065,.07,.52],[x,y,1.04]);ring('Pipe saddle riser clamp','frame',.066,.010,[x,y,1.30],'bright',[0,1,0]);bolt([x+.075,y,1.30],[0,1,0],.5,'Riser saddle fixing');}}
for(const x of[-1.0,1.4,4.4]){c('Collection pipe pedestal','frame',.035,.68,[x,.36,2.20]);c('Collection pedestal foot','frame',.11,.05,[x,.045,2.20]);b('Pipe support collection saddle','frame',[.18,.09,.16],[x,.725,2.20]);ring('Pipe saddle collection clamp','frame',.068,.012,[x,.80,2.20],'bright',[1,0,0]);}
for(const x of[-5.10,0]){b('Supply header rack post','frame',[.075,5.82,.075],[x,2.97,-1.0]);b('Supply header rack foot','frame',[.25,.08,.25],[x,.06,-1.0]);for(const dx of[-.08,.08])bolt([x+dx,.075,-1.0],[0,1,0],.75,'Header rack anchor');}
b('Supply header rack beam','frame',[5.10,.08,.075],[-2.55,5.75,-1.0]);
for(const x of[-4.30,-2.55,-.70]){b('Pipe support header outrigger','frame',[.075,.10,.25],[x,5.79,-1.125]);ring('Pipe saddle supply header','frame',.067,.011,[x,5.85,-1.25],'bright',[1,0,0]);bolt([x,5.79,-1.14],[0,1,0],.5,'Header saddle fixing');}
const helpers={T,EQUIPMENT,structure,parts,edges,terminals,supports,valves,routes,ports,geo,add,c,b,band,ring,bolt,boltCircle,clamp,flange,nozzle,tube,route,valve,gauge,capped,terminal,edge,world,move,transferPump,reducer,bulkValve,tankPorts,oxidationPorts,processVents,setContext:(r,label)=>{reactor=r;cx=0;assembly=label;}};
onPhase?.('base');
const upstream=buildUpstream(helpers);
onPhase?.('upstream');
const reactorBank=expandOxidationBank({...helpers,upstream});
reactorBank.sampling=buildReactorServices({...helpers,upstream});
const separations=buildSeparations({...helpers,upstream});
onPhase?.('separations');
const sonication=buildSonication({...helpers,separations});
onPhase?.('sonication');
const sprayDrying=buildSprayDrying({...helpers,sonication});
onPhase?.('sprayDrying');
const furnace=buildFurnace({...helpers,sprayDrying});
onPhase?.('furnace');
const doping=buildDoping({...helpers,furnace});
onPhase?.('doping');
const a900=buildA900({...helpers,doping});
onPhase?.('a900');
const argonDistribution=buildArgonDistribution({...helpers,furnace,doping},argonSource);
onPhase?.('argonDistribution');
const preg=buildPreG({...helpers,upstream,separations},a160);
onPhase?.('preg');
const filtration=buildFiltration({...helpers,upstream});
onPhase?.('filtration');
const drying=buildDrying({...helpers,filtration});
onPhase?.('drying');
const cakeTransfer=buildCakeTransfer({...helpers,filtration,drying});
onPhase?.('cakeTransfer');
const accessSystem=buildPlantAccess(helpers,{a160});
onPhase?.('accessSystem');
buildAccessPipeSupports({...helpers,furnace,doping});
const accessIndications=buildAccessIndications(helpers,a160);
onPhase?.('accessIndications');
const wastewater=buildWastewater({...helpers,preg,separations});
onPhase?.('wastewater');
const ventGas=buildVentGas({...helpers,wastewater,preg,upstream,separations,sonication,sprayDrying});
onPhase?.('ventGas');
const exhaustGroups=buildExhaustGroups({...helpers,furnace,doping});
onPhase?.('exhaustGroups');
const reclaimedWater=buildReclaimedWater({...helpers,wastewater,preg,upstream,separations});
onPhase?.('reclaimedWater');
const compressedAir=buildCompressedAir(helpers);
const reactorAir=buildReactorAir(helpers,compressedAir);
const thermalUtilities=buildThermalUtilities(helpers,{design:a160,routePlanner:thermalRoutePlanner});
onPhase?.('compressedAir');
// Service metadata describes the proposed route, never a live process state.
for(const r of routes){r.service=r.service||(/Supply|T-201|Top feed/i.test(r.label)?'Supply':/receive|product|collection|T-303|P-206/i.test(r.label)?'Receive':/utility|jacket|central/i.test(r.label)?'Utility':'Local');}

// Duty/source status is separate from physical material appearance.
const register=equipmentRegister(EQUIPMENT);for(const [id,e] of Object.entries(register)){Object.assign(EQUIPMENT[id],{tag:e.tag,label:e.name,areaId:e.areaId,designStatus:e.designStatus,reviewStatus:e.reviewStatus,provisional:e.designStatus==='proposed'});}
// Material names and identifiers are explorer labels, not manufacturer specifications.
const pipeSupportSystem=scope==='future'||!pipeRacks?null:buildPipeSupportSystem(helpers,{thermalUtilities,reactorAir,compressedAir,parts,edges,routes,valves,accessSystem,designScenario:a160,equipment:EQUIPMENT});
reactorAir.localSupports=completeReactorAirSupports(helpers,reactorAir,pipeSupportSystem);
onPhase?.('pipeSupportSystem');
// Fit new lined floors around the established foundations; do not relocate pipe supports for a floor finish.
const containment=scope==='future'?null:buildContainment(helpers,{a160});
if(containment)separations.drainChannel.penetration=completeA400DrainPenetration(helpers,containment);
onPhase?.('containment');
const fireSafety=scope==='future'?null:buildFireSafety(helpers,{a160});
const walkways=scope==='future'?null:buildWalkways(helpers);

for(const [id,e]of Object.entries(equipmentRegister(EQUIPMENT)))Object.assign(EQUIPMENT[id],{areaId:e.areaId,designStatus:e.designStatus,reviewStatus:e.reviewStatus,provisional:e.designStatus==='proposed'});
const result=selectModelScope({walkways,fireSafety,thermalUtilities,reactorAir,compressedAir,designScenario:a160,argonSource,wastewater,reclaimedWater,ventGas,exhaustGroups,containment,pipeSupportSystem,accessSystem,structure,parts,edges,terminals,supports,valves,routes,ports,equipment:EQUIPMENT,reactorBank,upstream,separations,sonication,sprayDrying,furnace,doping,a900,argonDistribution,preg,filtration,drying,cakeTransfer,accessIndications,geometries:geos},scope);resolveEquipmentOwnership(result);if(scope!=='future'){result.reactorBank.serviceDisconnections=reactorDisconnectSchedule(result);const present=new Set(result.parts.map(p=>p.id));result.reactorAir.audit=result.reactorAir.audit.filter(a=>present.has(a.partId));for(const c of result.reactorAir.consumers.filter(c=>c.headService))result.reactorBank.serviceDisconnections.push({reactor:c.reactor,routeId:c.routeId,service:'Instrument air / electrical control',label:c.tag+' pneumatic head-service disconnect',status:'HOLD — vendor removal procedure',action:'Isolate and verify local panel and actuator chambers; disconnect tagged tubing / sealed control connector at valve package, cap and support fixed ends; prove correct A/B routing and leak-test on reinstatement. Do not lift with tubing attached.'});}result.access=buildAccessRegister(result);if(result.walkways){result.access.zones.push(...result.walkways.accessZones);inspectWalkways(result);}if(scope!=='future')result.ventGas.connectionReview=reconcileA3000(result);return result;}
