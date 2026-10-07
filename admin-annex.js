import {wallPanels} from './building-shell.js';
// Proposed administration annex (office, laboratory, control room) in the south-west corner of the process building.
// Stage 1 (V299): shell, floors, walls with doors and windows, blast wall on the plant side, roof layer. Furniture and equipment follow.
export const ANNEX={revision:'annex-1',x0:-41.9,x1:5.5,z0:31.7,z1:41.4,height:3.4,roof:{y0:3.4,y1:3.6},
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
 {id:'WC',axis:'z',c:36.9,lo:IX0,hi:-37.5,t:.1,color:'dial',openings:[door(-41.2,-40.4,1),door(-39.8,-39,1),door(-38.4,-37.8,1)]},
 {id:'WC1',axis:'x',c:-40.4,lo:RZ0,hi:36.9,t:.1,color:'dial',openings:[]},
 {id:'WC2',axis:'x',c:-39,lo:RZ0,hi:36.9,t:.1,color:'dial',openings:[]},
 {id:'P2',axis:'x',c:-24,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(39.2,40.2,-1)]},
 {id:'P3',axis:'x',c:-21,lo:RZ0,hi:37.5,t:.1,color:'dial',openings:[]},
 {id:'M',axis:'z',c:37.5,lo:-24,hi:-18,t:.1,color:'dial',openings:[]},
 {id:'P4',axis:'x',c:-18,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(35.6,36.8,1)]},
 {id:'P5',axis:'x',c:-8,lo:RZ0,hi:RZ1,t:.15,color:'dial',openings:[door(35.2,36.2,1),door(39.2,40.2,1)]},
 {id:'L',axis:'z',c:37.5,lo:-8,hi:-4,t:.1,color:'dial',openings:[]},
 {id:'P6',axis:'x',c:-4,lo:RZ0,hi:RZ1,t:.2,color:'lining',openings:[door(35.6,36.6,1)]},
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
 const ids=parts.slice(first).map(p=>{Object.assign(p,{annex:true,designStatus:'proposed',screenBody:null});p.offset.set(0,0,0);return p.id;});
 return {revision:ANNEX.revision,note:ANNEX.note,partIds:ids,roofIds,stats,rooms:ANNEX_ROOMS.map(r=>({...r,areaM2:roomArea(r)})),walls:ANNEX_WALLS.map(w=>({id:w.id,axis:w.axis,c:w.c,t:w.t,openings:w.openings.length})),owners:ANNEX.owners};
}
