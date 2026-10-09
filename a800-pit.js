// A-800 feed pit (V330, D-MDL-11): civil and safety parts of the pit that holds the lower end of the lowered feed stack. Conceptual geometry for layout review:
// walls, floor slab, sump, a fixed access ladder with a gated opening, a perimeter guardrail, floor-level extraction and fresh-air ducts and an oxygen monitor.
// The pit is a confined space (argon is heavier than air and collects on its floor). Ventilation rates, oxygen alarm settings, rescue, the slab cut, drainage and
// the water table are not designed here. The parts belong to the PL-801 context (id 114), so no new equipment tag is needed.
import {A800_PIT} from './a800-basis.js';

export function buildA800Pit(k,s){
 const {b,c,setContext,V,T}=k,[x0,z0,x1,z1]=A800_PIT.rect,fy=A800_PIT.floorY,t=.25,cx=(x0+x1)/2,cz=(z0+z1)/2,w=x1-x0,d=z1-z0,first=k.parts.length,top=.08;
 setContext(114,'A-800 feed pit');
 const h=top-fy+.15,mid=(top+fy-.15)/2,ids={};
 ids.floor=b('PL-801 pit floor slab','frame',[w+2*t,.3,d+2*t],[cx,fy-.15,cz],'dark');
 ids.walls=[b('PL-801 pit wall north','frame',[w+2*t,h,t],[cx,mid,z0-t/2],'dark'),b('PL-801 pit wall south','frame',[w+2*t,h,t],[cx,mid,z1+t/2],'dark'),
  b('PL-801 pit wall west','frame',[t,h,d],[x0-t/2,mid,cz],'dark'),b('PL-801 pit wall east','frame',[t,h,d],[x1+t/2,mid,cz],'dark')];
 for(const wall of ids.walls){wall.cut=true;s.join(ids.floor,wall,[wall.position.x,fy,wall.position.z],'Pit wall / floor slab');}
 // Sump in the south-east corner for washdown and ingress water; drain destination and pump not designed.
 ids.sump=b('PL-801 pit sump grating','frame',[.9,.05,.9],[x1-.7,fy+.025,z1-.7],'steel');s.join(ids.floor,ids.sump,[x1-.7,fy,z1-.7],'Pit sump / floor slab');
 // Fixed access ladder on the west wall at z 29.6 (inside the wall, gate in the guardrail above it).
 const lz=29.6,lx=x0+.025;
 const rails=[-.22,.22].map(dz=>s.beam([lx,fy,lz+dz],[lx,top+1.0,lz+dz],.05,'PL-801 pit ladder rail'));
 for(const r of rails)s.join(ids.walls[2],r,[x0,fy+.5,r.position.z],'Pit ladder rail / wall bracket');
 for(let y=fy+.3;y<top+.9;y+=.3){const rung=s.beam([lx,y,lz-.22],[lx,y,lz+.22],.03,'PL-801 pit ladder rung');s.join(rails[0],rung,[lx,y,lz-.22],'Ladder rung / rail');}
 // Guardrail around the opening with a self-closing gate at the ladder.
 const post=(x,z)=>s.beam([x,0,z],[x,1.07,z],.05,'PL-801 pit guard post'),gate=[lz-.5,lz+.5];
 const run=(ax,az,bx,bz,gated)=>{const n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/1.5));const pts=[];for(let i=0;i<=n;i++)pts.push([ax+(bx-ax)*i/n,az+(bz-az)*i/n]);
  for(const [x,z] of pts)post(x,z);for(const y of[1.07,.55])s.beam([ax,y,az],[bx,y,bz],.04,gated?'PL-801 pit guard gate rail':'PL-801 pit guardrail');};
 run(x0,z0,x1,z0);run(x0,z1,x1,z1);run(x1,z0,x1,z1);run(x0,z0,x0,gate[0]);run(x0,gate[1],x0,z1);run(x0,gate[0],x0,gate[1],true);
 // Extraction duct at floor level (argon collects low) and a fresh-air duct at the other end, with the extract fan above grade.
 const exX=x1-.3,exZ=z0+.5,faX=x0+.5,faZ=z1-.5;
 ids.extract=c('PL-801 pit extraction duct','pipe',.2,3.4-fy-.3,[exX,(3.4+fy+.3)/2,exZ],'steel');ids.fan=c('PL-801 pit extract fan','pump',.3,.5,[exX,3.65,exZ],'blue');
 ids.supply=c('PL-801 pit fresh-air duct','pipe',.2,3.0-fy-.3,[faX,(3.0+fy+.3)/2,faZ],'steel');
 ids.o2=b('PL-801 pit oxygen monitor','valve',[.25,.3,.15],[x0+.2,fy+1.4,z0+1.0],'blue');
 ids.sign=b('PL-801 pit confined-space sign','valve',[.6,.4,.03],[cx,1.5,z0-.1],'dial');
 for(const p of[ids.extract,ids.fan,ids.supply,ids.o2,ids.sign])p.exploreRole='context';
 const partIds=k.parts.slice(first).map(p=>p.id);
 return {rect:A800_PIT.rect,floorY:fy,depth:A800_PIT.depth,partIds,hazard:'Confined space: argon collects on the floor; forced ventilation, oxygen monitoring and rescue are required and not designed.',note:A800_PIT.note};
}
