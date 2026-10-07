import {wallPanels} from './building-shell.js';
// Proposed administration annex (office, laboratory, control room) in the south-west corner of the process building.
// Stage 1 (V299): shell, floors, walls with doors and windows, blast wall on the plant side, roof layer. Furniture and equipment follow.
export const ANNEX={revision:'annex-3',x0:-41.9,x1:5.5,z0:31.7,z1:41.4,height:3.4,roof:{y0:3.4,y1:3.6},
 note:'Proposed concept layout only: no structural, fire-rating, blast, ventilation or egress design. The north and east walls (plant side) are drawn as 0.4 m reinforced concrete for a control room that needs a blast study; ratings are unqualified.',
 corridor:{z0:31.9,z1:33.5,walkZ:32.7},
 owners:{shell:123000,lobby:123001,wc:123002,office:123003,lab:123004,control:123005,server:123006,corridor:123007}};
const IX0=-41.775,IX1=5.3,RZ0=33.675,RZ1=41.275;
const door=(s0,s1,swing,kind='door')=>({s0,s1,y0:0,y1:2.4,swing,kind});
const win=(s0,s1)=>({s0,s1,y0:.9,y1:2.5,kind:'window'});
// Walls: axis 'z' runs along x at z = c; axis 'x' runs along z at x = c. swing = side the leaf opens to (+1 / -1 along the other axis).
export const ANNEX_WALLS=[
 {id:'N',axis:'z',c:31.7,lo:-41.9,hi:5.5,t:.4,color:'lining',openings:[]},
 {id:'E',axis:'x',c:5.5,lo:31.5,hi:41.525,t:.4,color:'lining',openings:[door(32.0,33.4,-1,'blast door')]},
 {id:'S',axis:'z',c:41.4,lo:-41.9,hi:5.5,t:.25,color:'bright',openings:[door(-36.9,-35.1,-1,'entrance door'),win(-33,-31),win(-30,-28),win(-27,-25),win(-23.5,-19.5),win(-17,-14),win(-13,-10),win(-3,-.5)]},
 {id:'W',axis:'x',c:-41.9,lo:31.5,hi:41.525,t:.25,color:'bright',openings:[]},
 {id:'C',axis:'z',c:33.6,lo:IX0,hi:IX1,t:.15,color:'dial',openings:[door(-36.9,-35.1,1),door(-29.9,-28.1,1),door(-23.7,-22.7,1),door(-20.7,-19.7,1),door(-14,-12.4,1),door(-7,-6,1),door(-1.5,.5,1,'blast door')]},
 {id:'P1',axis:'x',c:-37.5,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(39.2,40.2,-1)]},
 {id:'P1b',axis:'x',c:-34,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(37.3,38.3,1)]},
 {id:'WC',axis:'z',c:36.9,lo:IX0,hi:-37.5,t:.1,color:'dial',openings:[door(-41.2,-40.4,1),door(-39.8,-39,1),door(-38.5,-37.6,1)]},
 {id:'WC1',axis:'x',c:-40.4,lo:RZ0,hi:36.9,t:.1,color:'dial',openings:[]},
 {id:'WC2',axis:'x',c:-39,lo:RZ0,hi:36.9,t:.1,color:'dial',openings:[]},
 {id:'P2',axis:'x',c:-24,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(39.2,40.2,-1)]},
 {id:'P3',axis:'x',c:-21,lo:RZ0,hi:37.5,t:.1,color:'dial',openings:[]},
 {id:'M',axis:'z',c:37.5,lo:-24,hi:-18,t:.1,color:'dial',openings:[]},
 {id:'P4',axis:'x',c:-18,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(35.6,36.8,1)]},
 {id:'P5',axis:'x',c:-8,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(35.2,36.2,1),door(39.2,40.2,1)]},
 {id:'L',axis:'z',c:37.5,lo:-8,hi:-4,t:.1,color:'dial',openings:[]},
 {id:'P6',axis:'x',c:-4,lo:RZ0,hi:RZ1,t:.2,color:'lining',openings:[]},
 {id:'P7',axis:'x',c:2.5,lo:RZ0,hi:RZ1,t:.2,color:'lining',openings:[door(38.0,39.0,1)]},
];
// Floors: one thin patch per room, owned by the room, top at y 0.03 so walking volumes stay clear.
export const ANNEX_ROOMS=[
 {id:'corridor',owner:'corridor',name:'Corridor',x0:IX0,x1:IX1,z0:31.9,z1:33.525,color:'weld'},
 {id:'wc',owner:'wc',name:'Restrooms',x0:IX0,x1:-37.5,z0:RZ0,z1:36.9,color:'bright'},
 {id:'lobby-r',owner:'lobby',name:'Reception',x0:IX0,x1:-37.5,z0:36.9,z1:RZ1,color:'inner'},
 {id:'lobby-h',owner:'lobby',name:'Entrance hall',x0:-37.5,x1:-34,z0:RZ0,z1:RZ1,color:'inner'},
 {id:'office-open',owner:'office',name:'Open office',x0:-34,x1:-24,z0:RZ0,z1:RZ1,color:'lining'},
 {id:'office-a',owner:'office',name:'Private office A',x0:-24,x1:-21,z0:RZ0,z1:37.5,color:'lining'},
 {id:'office-b',owner:'office',name:'Private office B',x0:-21,x1:-18,z0:RZ0,z1:37.5,color:'lining'},
 {id:'meeting',owner:'office',name:'Meeting room',x0:-24,x1:-18,z0:37.5,z1:RZ1,color:'lining'},
 {id:'lab-wet',owner:'lab',name:'Wet laboratory',x0:-18,x1:-8,z0:RZ0,z1:RZ1,color:'jacket'},
 {id:'lab-bal',owner:'lab',name:'Balance and instrument room',x0:-8,x1:-4,z0:RZ0,z1:37.5,color:'jacket'},
 {id:'lab-store',owner:'lab',name:'Chemical store',x0:-8,x1:-4,z0:37.5,z1:RZ1,color:'jacket'},
 {id:'control',owner:'control',name:'Control room',x0:-4,x1:2.5,z0:RZ0,z1:RZ1,color:'dark'},
 {id:'server',owner:'server',name:'Server and UPS room',x0:2.5,x1:IX1,z0:RZ0,z1:RZ1,color:'steel'},
];
const OWNER_INFO={shell:['ANX-SHELL','Administration annex shell (walls, roof, doors)'],lobby:['ANX-LOBBY','Annex entrance hall and reception'],wc:['ANX-WC','Annex restrooms'],office:['ANX-OFFICE','Annex office, private offices and meeting room'],lab:['ANX-LAB','Annex laboratory'],control:['ANX-CR','Blast-protected control room'],server:['ANX-SRV','Control-room server and UPS room'],corridor:['ANX-CORR','Annex corridor']};
export const roomArea=r=>(r.x1-r.x0)*(r.z1-r.z0);
export function buildAdminAnex(h){
 const {EQUIPMENT,parts,setContext,b}=h,first=parts.length,leaves=[],stats={panels:0,doors:0,windows:0,floors:0};
 const boxes=(wall,name,col)=>{for(const p of wallPanels(wall.lo,wall.hi,ANNEX.height,wall.openings)){const len=p.b-p.a,mid=(p.a+p.b)/2,ym=(p.y0+p.y1)/2;b(name+' panel','frame',wall.axis==='x'?[wall.t,p.y1-p.y0,len]:[len,p.y1-p.y0,wall.t],wall.axis==='x'?[wall.c,ym,mid]:[mid,ym,wall.c],col);stats.panels++;}};
 for(const key of Object.keys(OWNER_INFO)){const id=ANNEX.owners[key],r=ANNEX_ROOMS.filter(q=>q.owner===key),cx=r.length?r.reduce((n,q)=>n+(q.x0+q.x1)/2,0)/r.length:(ANNEX.x0+ANNEX.x1)/2,cz=r.length?r.reduce((n,q)=>n+(q.z0+q.z1)/2,0)/r.length:(ANNEX.z0+ANNEX.z1)/2;EQUIPMENT[id]={tag:OWNER_INFO[key][0],label:OWNER_INFO[key][1],areaId:'SHARED',x:cx,z:cz,labelY:key==='shell'?4:2.6,designStatus:'proposed',primaryOperation:'access',geometryStatus:'Proposed concept layout; no structural, fire, blast or ventilation design'};}
 // floors, owned per room
 for(const r of ANNEX_ROOMS){setContext(ANNEX.owners[r.owner],OWNER_INFO[r.owner][1]);b('Annex floor '+r.name,'frame',[r.x1-r.x0,.03,r.z1-r.z0],[(r.x0+r.x1)/2,.015,(r.z0+r.z1)/2],r.color);stats.floors++;}
 // walls, door leaves, window glass: shell owner
 setContext(ANNEX.owners.shell,OWNER_INFO.shell[1]);
 for(const w of ANNEX_WALLS){boxes(w,'Annex wall '+w.id,w.color);
  for(const o of w.openings){const mid=(o.s0+o.s1)/2,wd=o.s1-o.s0;
   if(o.kind==='window'){b('Annex window glass','frame',w.axis==='x'?[.04,o.y1-o.y0,wd]:[wd,o.y1-o.y0,.04],w.axis==='x'?[w.c,(o.y0+o.y1)/2,mid]:[mid,(o.y0+o.y1)/2,w.c],'glass');stats.windows++;continue;}
   const lw=Math.min(wd-.05,.95),blast=/blast/.test(o.kind),t=blast?.12:.05,hinge=o.s0+.02,side=o.swing;
   // leaf swung open 90 degrees against the room side, clear of the doorway
   const along=hinge,across=w.c+side*(w.t/2+lw/2+.03);
   b('Annex '+o.kind+' leaf','frame',w.axis==='x'?[lw,2.1,t]:[t,2.1,lw],w.axis==='x'?[across,1.05,along]:[along,1.05,across],blast?'steel':'inner');leaves.push({wall:w.id,kind:o.kind});stats.doors++;}}
 // roof: one slab, own display layer
 const rs=parts.length;b('Annex roof slab','frame',[ANNEX.x1-ANNEX.x0+.6,ANNEX.roof.y1-ANNEX.roof.y0,ANNEX.z1-ANNEX.z0+.4],[(ANNEX.x0+ANNEX.x1)/2,(ANNEX.roof.y0+ANNEX.roof.y1)/2,(ANNEX.z0+ANNEX.z1)/2],'glass');
 const roofIds=parts.slice(rs).map(p=>{Object.assign(p,{structureVisibility:'annexRoof'});return p.id;});
 const shellIds=parts.slice(first).map(p=>{Object.assign(p,{annex:true,designStatus:'proposed',screenBody:null});p.offset.set(0,0,0);return p.id;});
 const furniture=buildAnnexFurniture(h),ids=[...shellIds,...furniture.partIds];
 return {revision:ANNEX.revision,furniture:{...furniture,partIds:undefined,partCount:furniture.partIds.length},shellPartIds:shellIds,note:ANNEX.note,partIds:ids,roofIds,stats,rooms:ANNEX_ROOMS.map(r=>({...r,areaM2:roomArea(r)})),walls:ANNEX_WALLS.map(w=>({id:w.id,axis:w.axis,c:w.c,t:w.t,openings:w.openings.length})),owners:ANNEX.owners};
}

// ---- Stage 2 (V300): furniture, computers and fittings for the office, entrance, reception and restrooms ----
// Boxes only, in metres; every item belongs to a named group so a test can prove nothing overlaps.
export function annexFurniturePlan(){
 const items=[],groups=[];let gid=0;
 const add=(owner,group,name,x,y,z,w,hgt,d,color)=>items.push({owner,group,name,x,y,z,w,h:hgt,d,color});
 const grp=(owner,kind,label)=>{const g={id:++gid,owner,kind,label};groups.push(g);return g.id;};
 // dir = +1: the person sits on the south side of the desk and faces north (-z); dir = -1 the reverse
 function workstation(owner,x,z,dir,label,w=1.4){const g=grp(owner,'workstation',label),d=.7;
  add(owner,g,'Annex desk top',x,.74,z,w,.04,d,'inner');for(const s of[-1,1])add(owner,g,'Annex desk panel',x+s*(w/2-.03),.36,z,.04,.72,d-.1,'inner');
  for(const s of[-1,1]){add(owner,g,'Annex monitor screen',x+s*.3,1.02,z-dir*.2,.55,.32,.03,'blue');add(owner,g,'Annex monitor stand',x+s*.3,.86,z-dir*.2,.08,.2,.08,'dark');}
  add(owner,g,'Annex keyboard',x,.77,z+dir*.12,.42,.02,.14,'dark');add(owner,g,'Annex PC tower',x+w/2-.3,.22,z-dir*.1,.2,.4,.45,'dark');
  chair(owner,x,z+dir*.85,dir,label);return g;}
 function chair(owner,x,z,dir,label){const g=grp(owner,'chair',label+' chair');
  add(owner,g,'Annex chair seat',x,.46,z,.45,.06,.45,'dark');add(owner,g,'Annex chair back',x,.78,z+dir*.2,.45,.5,.05,'dark');add(owner,g,'Annex chair post',x,.23,z,.06,.4,.06,'steel');add(owner,g,'Annex chair base',x,.04,z,.5,.04,.5,'steel');return g;}
 const O=ANNEX.owners;
 // open office: 8 workstations in two rows, occupants face north
 let n=0;for(const z of[35.4,38.9])for(const x of[-32.9,-30.7,-28.5,-26.3])workstation(O.office,x,z,1,'Open office workstation '+(++n));
 // equipment along the east wall of the open office and the whiteboard on its west wall
 let g=grp(O.office,'printer','Office printer');add(O.office,g,'Annex printer stand',-24.7,.4,35.2,.8,.8,.6,'inner');add(O.office,g,'Annex printer',-24.7,.92,35.2,.55,.25,.45,'dial');
 for(const z of[36.5,37.2]){g=grp(O.office,'filing','Filing cabinet');add(O.office,g,'Annex filing cabinet',-24.6,.7,z,.45,1.4,.6,'steel');}
 g=grp(O.office,'whiteboard','Whiteboard');add(O.office,g,'Annex whiteboard',-33.9,1.5,36.3,.03,1,1.6,'dial');
 // private offices: desk against the south partition, occupant faces south
 for(const [x,label] of[[-22.5,'Private office A'],[-19.5,'Private office B']])workstation(O.office,x,37.0,-1,label,1.4);
 g=grp(O.office,'bookshelf','Bookshelf A');add(O.office,g,'Annex bookshelf',-21.23,.9,34.9,.3,1.8,1,'inner');
 g=grp(O.office,'bookshelf','Bookshelf B');add(O.office,g,'Annex bookshelf',-18.23,.9,34.9,.3,1.8,1,'inner');
 // meeting room: table, 8 chairs, wall display
 g=grp(O.office,'table','Meeting table');add(O.office,g,'Annex meeting table top',-21,.74,39.4,3,.05,1.1,'inner');for(const s of[-1,1])add(O.office,g,'Annex meeting table leg',-21+s*1.3,.36,39.4,.08,.72,.9,'steel');
 let c=0;for(const [z,dir] of[[38.35,-1],[40.45,1]])for(const x of[-22.1,-21.35,-20.6,-19.85])chair(O.office,x,z,-dir,'Meeting chair '+(++c));
 g=grp(O.office,'display','Meeting display');add(O.office,g,'Annex wall display',-18.12,1.5,39.4,.05,.7,1.2,'blue');
 // reception: desk and chair, 12 lockers, kitchenette
 g=grp(O.lobby,'desk','Reception desk');add(O.lobby,g,'Annex reception desk body',-39.8,.5,38.9,1.6,1,.55,'inner');add(O.lobby,g,'Annex reception desk top',-39.8,1.025,38.9,1.7,.05,.65,'dial');
 chair(O.lobby,-39.8,39.75,-1,'Reception');
 for(let i=0;i<12;i++){g=grp(O.lobby,'locker','Locker '+(i+1));add(O.lobby,g,'Annex locker',-41.575,.9,37.35+i*.3,.4,1.8,.3,'steel');}
 g=grp(O.lobby,'kitchenette','Kitchenette');add(O.lobby,g,'Annex kitchenette counter',-39.5,.44,40.95,2,.88,.6,'inner');add(O.lobby,g,'Annex kitchenette worktop',-39.5,.9,40.95,2.05,.04,.65,'dial');add(O.lobby,g,'Annex sink basin',-39.6,.93,40.95,.5,.04,.4,'bright');add(O.lobby,g,'Annex sink tap',-39.6,1.05,41.15,.03,.2,.03,'bright');add(O.lobby,g,'Annex microwave',-40.2,1.07,40.95,.5,.3,.4,'dark');
 g=grp(O.lobby,'fridge','Kitchenette fridge');add(O.lobby,g,'Annex fridge',-38.1,.9,40.95,.6,1.8,.6,'dial');
 // restrooms: three cubicles, each with a toilet and a basin
 for(const [xa,xb,label] of[[IX0,-40.4,'Restroom 1'],[-40.4,-39,'Restroom 2'],[-39,-37.5,'Restroom 3 (accessible)']]){const cx=(xa+xb)/2;g=grp(O.wc,'fixture',label+' toilet');add(O.wc,g,'Annex toilet bowl',cx,.2,34.2,.4,.4,.55,'dial');add(O.wc,g,'Annex toilet cistern',cx,.6,33.8,.4,.4,.2,'dial');
  g=grp(O.wc,'fixture',label+' basin');add(O.wc,g,'Annex basin',xa+.3,.85,35.9,.4,.15,.4,'dial');add(O.wc,g,'Annex basin pedestal',xa+.3,.4,35.9,.12,.8,.12,'dial');}
 // ceiling lights (flat panels under the roof)
 const light=(owner,x,z)=>{const gg=grp(owner,'light','Ceiling light');add(owner,gg,'Annex ceiling light',x,3.37,z,.6,.04,.6,'dial');};
 for(const z of[36.2,39.6])for(const x of[-32,-29,-26])light(O.office,x,z);for(const x of[-22.5,-19.5])light(O.office,x,35.6);for(const x of[-22,-20])light(O.office,x,39.4);
 for(const z of[35,38,40.5])light(O.lobby,-35.7,z);light(O.lobby,-39.6,39.2);for(const x of[-40.9,-39.6,-38.3])light(O.wc,x,35);
 for(const x of[-38,-30,-22,-14,-6,0])light(O.corridor,x,32.7);
 // ---- Stage 3 (V301): laboratory, balance room, chemical store, control room and server room ----
 // dirX = +1: the person sits on the east side of the desk and faces west (-x)
 function consoleX(owner,x,z,dirX,label,w=1.8,d=.9,seats=1){const g=grp(owner,'console',label);
  add(owner,g,'Annex console top',x,.74,z,d,.04,w,'dark');for(const s of[-1,1])add(owner,g,'Annex console panel',x,.36,z+s*(w/2-.03),d-.1,.72,.04,'dark');
  const screens=w>1.5?3:2;for(let i=0;i<screens;i++){const zz=z+(i-(screens-1)/2)*.55;add(owner,g,'Annex monitor screen',x-dirX*.25,1.04,zz,.03,.34,.5,'blue');add(owner,g,'Annex monitor stand',x-dirX*.25,.86,zz,.08,.2,.08,'dark');}
  add(owner,g,'Annex keyboard',x+dirX*.2,.77,z,.14,.02,.42,'dark');add(owner,g,'Annex PC tower',x-dirX*(d/2-.3),.22,z+w/2-.3,.45,.4,.2,'dark');
  for(let i=0;i<seats;i++)chairX(owner,x+dirX*(d/2+.5),z+(seats>1?(i-(seats-1)/2)*.9:0),dirX,label);return g;}
 function chairX(owner,x,z,dirX,label){const g=grp(owner,'chair',label+' chair');
  add(owner,g,'Annex chair seat',x,.46,z,.45,.06,.45,'dark');add(owner,g,'Annex chair back',x+dirX*.2,.78,z,.05,.5,.45,'dark');add(owner,g,'Annex chair post',x,.23,z,.06,.4,.06,'steel');add(owner,g,'Annex chair base',x,.04,z,.5,.04,.5,'steel');return g;}
 const bench=(owner,x,z,w,d,label)=>{const gg=grp(owner,'bench',label);add(owner,gg,'Annex lab bench base',x,.43,z,w,.86,d,'dial');add(owner,gg,'Annex lab bench top',x,.88,z,w+.04,.04,d+.04,'steel');return gg;};
 const onBench=(owner,gg,name,x,z,w,hgt,d,color)=>add(owner,gg,name,x,.9+hgt/2,z,w,hgt,d,color);
 const stool=(owner,x,z,label)=>{const gg=grp(owner,'stool',label);add(owner,gg,'Annex lab stool seat',x,.62,z,.35,.05,.35,'dark');add(owner,gg,'Annex lab stool leg',x,.3,z,.08,.6,.08,'steel');};
 const LAB=O.lab;
 // wet laboratory
 for(const [x,label] of[[-11.05,'Fume hood 1'],[-9.4,'Fume hood 2']]){g=grp(LAB,'fumehood',label);add(LAB,g,'Annex fume hood body',x,1.2,34.1,1.5,2.4,.8,'bright');add(LAB,g,'Annex fume hood sash',x,1.45,34.55,1.4,.9,.03,'glass');add(LAB,g,'Annex fume hood exhaust duct',x,2.9,34.1,.35,1,.35,'steel');}
 g=bench(LAB,-13.5,38.0,3.6,1.2,'Island bench');onBench(LAB,g,'Annex lab sink basin',-14.4,37.8,.5,.15,.4,'bright');onBench(LAB,g,'Annex lab sink basin',-12.6,37.8,.5,.15,.4,'bright');onBench(LAB,g,'Annex lab tap',-14.4,38.2,.04,.3,.04,'bright');onBench(LAB,g,'Annex lab tap',-12.6,38.2,.04,.3,.04,'bright');onBench(LAB,g,'Annex reagent shelf',-13.5,38.45,3,.4,.2,'inner');
 for(const [x,z] of[[-15.5,36.6],[-14.5,36.6],[-12.5,39.5],[-11.5,39.5]])stool(LAB,x,z,'Lab stool');
 g=bench(LAB,-17.55,39.0,.66,2.8,'West wall bench');onBench(LAB,g,'Annex drying oven',-17.55,38.2,.6,.7,.6,'steel');onBench(LAB,g,'Annex muffle furnace',-17.55,39.4,.5,.5,.5,'dark');onBench(LAB,g,'Annex conductivity meter',-17.5,40.1,.2,.3,.2,'dial');
 g=grp(LAB,'fridge','Sample fridge');add(LAB,g,'Annex sample fridge',-17.6,.9,36.8,.6,1.8,.6,'dial');
 g=bench(LAB,-13.5,40.9,6,.7,'South wall bench');onBench(LAB,g,'Annex spectrophotometer',-16.2,40.9,.5,.25,.4,'dial');onBench(LAB,g,'Annex pH meter',-14.6,40.9,.2,.3,.2,'dial');onBench(LAB,g,'Annex microscope',-13.2,40.9,.25,.4,.25,'dark');onBench(LAB,g,'Annex stirrer hotplate',-11.8,40.9,.3,.12,.3,'dark');onBench(LAB,g,'Annex lab computer',-10.9,40.9,.4,.3,.15,'blue');
 g=grp(LAB,'waste','Waste container 1');add(LAB,g,'Annex waste container',-9.3,.3,40.8,.4,.6,.4,'safetyYellow');g=grp(LAB,'waste','Waste container 2');add(LAB,g,'Annex waste container',-8.7,.3,40.8,.4,.6,.4,'safetyYellow');
 g=grp(LAB,'eyewash','Eyewash and safety shower');add(LAB,g,'Annex eyewash pedestal',-12.0,.45,35.4,.1,.9,.1,'steel');add(LAB,g,'Annex eyewash bowl',-12.0,.95,35.4,.4,.1,.4,'green');add(LAB,g,'Annex shower pipe',-12.0,1.65,35.7,.04,3.3,.04,'steel');add(LAB,g,'Annex shower head',-12.0,3.1,35.55,.3,.05,.3,'green');add(LAB,g,'Annex eyewash sign',-12.0,2.0,35.0,.3,.3,.02,'green');
 g=grp(LAB,'extinguisher','Lab fire extinguisher');add(LAB,g,'Annex lab fire extinguisher',-8.4,.45,35.2,.18,.9,.18,'red');add(LAB,g,'Annex fire extinguisher sign',-8.1,1.7,35.2,.02,.3,.3,'red');
 // balance and instrument room
 g=grp(LAB,'table','Balance table');add(LAB,g,'Annex balance table top',-5.0,.76,36.0,1.2,.05,.7,'steel');for(const s of[-1,1])add(LAB,g,'Annex balance table leg',-5.0+s*.5,.37,36.0,.06,.74,.6,'steel');add(LAB,g,'Annex analytical balance',-5.0,.9,36.0,.3,.2,.3,'dial');
 g=grp(LAB,'cabinet','Instrument cabinet');add(LAB,g,'Annex instrument cabinet',-4.45,.9,34.5,.5,1.8,.9,'inner');
 chairX(LAB,-6.3,36.0,1,'Balance room');
 // chemical store
 for(const [z,label,col] of[[38.2,'Flammables cabinet','red'],[39.3,'Acid cabinet','blue'],[40.4,'Alkali cabinet','safetyYellow']]){g=grp(LAB,'chemcabinet',label);add(LAB,g,'Annex '+label.toLowerCase(),-4.55,.95,z,.9,1.9,1,col);}
 g=grp(LAB,'shelf','Chemical shelving');add(LAB,g,'Annex chemical shelving',-6.1,.9,41.0,2,1.8,.4,'inner');
 g=grp(LAB,'spilltray','Spill tray');add(LAB,g,'Annex spill tray',-6.5,.06,38.5,1.4,.12,.8,'dark');
 // control room: three operator consoles facing a video wall on the west wall, a supervisor desk and an engineering desk
 const CR=O.control;
 g=grp(CR,'display','Control-room video wall');add(CR,g,'Annex video wall',-3.82,1.6,37.6,.08,1.8,5.6,'blue');
 for(const z of[36.0,37.7,39.4])consoleX(CR,-1.3,z,1,'Operator console '+(z===36.0?1:z===37.7?2:3),1.6,.9);
 consoleX(CR,1.0,35.4,1,'Shift supervisor desk',1.4,.7);consoleX(CR,1.0,40.0,1,'Engineering workstation',1.4,.7);
 g=grp(CR,'panel','Emergency shutdown panel');add(CR,g,'Annex emergency shutdown panel',-3.55,1.4,40.6,.2,.6,.5,'red');
 g=grp(CR,'table','Control-room table');add(CR,g,'Annex control-room table',.4,.74,37.6,.8,.05,1.2,'inner');
 // server and UPS room
 const SR=O.server;
 for(const [z,label] of[[34.6,'Server rack 1'],[35.5,'Server rack 2']]){g=grp(SR,'rack',label);add(SR,g,'Annex server rack',4.8,1.0,z,.9,2,.6,'dark');}
 g=grp(SR,'ups','UPS cabinet');add(SR,g,'Annex UPS cabinet',4.8,.8,40.5,.8,1.6,.6,'steel');g=grp(SR,'battery','Battery cabinet');add(SR,g,'Annex battery cabinet',4.8,.8,39.6,.8,1.6,.6,'steel');
 g=grp(SR,'ac','Air-conditioning unit');add(SR,g,'Annex air-conditioning unit',3.4,.9,41.0,.8,1.8,.5,'dial');
 for(const x of[3.1,3.5]){g=grp(SR,'cylinder','Clean-agent cylinder');add(SR,g,'Annex suppression cylinder',x,.6,34.1,.25,1.2,.25,'red');}
 // extra ceiling lights
 for(const z of[35,37.5,40])for(const x of[-16,-13,-10])light(LAB,x,z);light(LAB,-6,35.5);light(LAB,-6,39.5);
 for(const z of[35.5,38.5])for(const x of[-2,1])light(CR,x,z);light(SR,4,37.5);
 return {items,groups};
}
export function buildAnnexFurniture(h){
 const {parts,setContext,b}=h,{items,groups}=annexFurniturePlan(),first=parts.length,byOwner=new Map();
 for(const it of items){if(!byOwner.has(it.owner))byOwner.set(it.owner,[]);byOwner.get(it.owner).push(it);}
 for(const [owner,list] of byOwner){const info=Object.entries(ANNEX.owners).find(([,v])=>v===owner)[0];setContext(owner,OWNER_INFO[info][1]);for(const it of list){const p=b(it.name,'frame',[it.w,it.h,it.d],[it.x,it.y,it.z],it.color);p.annexGroup=it.group;}}
 const ids=parts.slice(first).map(p=>{Object.assign(p,{annex:true,annexFurniture:true,designStatus:'proposed',screenBody:null});p.offset.set(0,0,0);return p.id;});
 const count=k=>groups.filter(g=>g.kind===k).length;
 return {partIds:ids,groups:groups.length,workstations:count('workstation'),consoles:count('console'),chairs:count('chair'),lockers:count('locker'),lights:count('light'),fixtures:count('fixture')};
}
