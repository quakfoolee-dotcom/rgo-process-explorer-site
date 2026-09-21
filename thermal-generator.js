// Equipment-specific concept assemblies. No rated heat duty or vendor dimensions.
import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';

export function thermalGenerator(h,key,cfg,api){
 const {T,EQUIPMENT,parts,edges,setContext,b,c,band,nozzle,terminal}=h,{foundation,vessel,L,P,mounted,blind,mark,interfaces,access}=api;
 const s=structuralKit(h),k=processKit(h,.05),V=p=>new T.Vector3(...p),id=cfg.generation,{x,z,tag}=EQUIPMENT[id],first=parts.length;
 setContext(id,tag+' generation package');const pad=foundation(id,x,z,3,3.1,tag);
 const zone=(suffix,min,max,kind,note)=>access.push({id:suffix+'-'+tag,kind,areaIds:['A-5000'],min,max,note,qualification:'Proposed envelope; replace with selected vendor task dimensions'});
 zone('SERVICE',[x-1.45,.1,z+1.55],[x+1.45,2.2,z+2.65],'maintenance','1.10 m front service reservation; vendor opening and tools still require qualification');
 if(key==='hw'){
  const v=vessel(id,x,z,.45,.6,2.4,key,'generation',{pad}),a=v.port('water return',[x-.45,1,z],[-1,0,0],.05,'return'),out=v.port('conditioned water',[x+.45,1.5,z],[1,0,0],.05,'supply');
  const pass=P(v.body,[a.inside,[x,1,z],[x,1.5,z],out.inside],tag+' heater water passage',key,'generation');
  for(const dz of[-.18,0,.18]){const element=c(tag+' removable immersed heater element','internal',.024,1.70,[x,1.55,z+dz],'inner');s.join(v.roof,element,[x,2.4,z+dz],tag+' element mount');}
  const enclosure=b(tag+' electrical terminal enclosure','pump',[.55,.45,.3],[x,2.685,z],'blue');mounted(enclosure,v.roof,[x,2.46,z],tag+' terminal housing');
  v.finish();zone('REMOVE-ELEMENT',[x-.60,2.95,z-.6],[x+.60,5.0,z+.6],'removal','Vertical terminal/element withdrawal; lifting method, weight and vendor length HOLD');
  return {inlet:a.out,outlet:out.out,passageId:pass.id,packageType:'Electric immersion heater',partIds:parts.slice(first).map(p=>p.id)};
 }
 const height=key==='cw'?4.6:3.25,posts=[];
 for(const dx of[-1.35,1.35])for(const dz of[-1.35,1.35]){const p=s.beam([x+dx,.18,z+dz],[x+dx,height,z+dz],.1,tag+' package casing post');s.join(pad,p,[x+dx,.18,z+dz],tag+' casing foundation');posts.push(p);}
 const rail=(y,zz,name)=>{const p=s.beam([x-1.35,y,zz],[x+1.35,y,zz],.1,tag+' '+name);for(const dx of[-1.35,1.35]){const post=posts.find(p=>Math.abs(p.position.x-x-dx)<.01&&Math.abs(p.position.z-zz)<.01);if(post)s.join(post,p,[x+dx,y,zz],tag+' rail bearing');}return p;};
 const upper=rail(height-.15,z-1.35,'upper frame'),lower=rail(.55,z-1.35,'equipment bearer');rail(height-.15,z+1.35,'front upper frame');
 for(const dx of[-1.35,1.35]){const p=s.beam([x+dx,height-.15,z-1.35],[x+dx,height-.15,z+1.35],.1,tag+' side upper frame');s.join(posts.find(p=>p.position.x===x+dx&&p.position.z===z-1.35),p,[x+dx,height-.15,z-1.35],tag+' frame joint');}
 for(const dx of[-1.32,1.32])for(let y=1.8;y<height-.5;y+=.28){const fin=b(tag+' air inlet louvre','head',[.055,.1,2.6],[x+dx,y,z],'steel');fin.cut=true;mounted(fin,posts.find(p=>Math.sign(p.position.x-x)===Math.sign(dx)&&p.position.z<z),[x+dx,y,z-1.30],tag+' louvre seat');}
 const fan=band(tag+' fan discharge guard','head',.8,.7,.3,[x,height,z],'dark');
 const side=s.beam([x-1.35,height-.15,z-1.35],[x-1.35,height-.15,z+1.35],.1,tag+' fan side bearer');s.join(upper,side,[x-1.35,height-.15,z-1.35],tag+' fan bearer connection');
 for(const dz of[-.72,.72]){const p=s.beam([x-1.35,height-.15,z+dz],[x+1.35,height-.15,z+dz],.1,tag+' fan transverse bearer');s.join(side,p,[x-1.35,height-.15,z+dz],tag+' fan cross joint');s.join(p,fan,[x,height-.15,z+dz],tag+' fan guard seat');}
 const cross=s.beam([x-.74,height,z],[x+.74,height,z],.065,tag+' fan motor bridge');s.join(fan,cross,[x-.74,height,z],tag+' motor bridge seat');
 const motor=c(tag+' fan motor','pump',.16,.32,[x,height,z],'blue');s.join(cross,motor,[x,height,z],tag+' fan motor fixing');s.load(motor,tag+' fan motor');
 for(let j=0;j<6;j++)b(tag+' fan blade','internal',[.12,.04,.70],[x+Math.sin(j*Math.PI/3)*.30,height,z+Math.cos(j*Math.PI/3)*.30],'bright',new T.Quaternion().setFromAxisAngle(V([0,1,0]),j*Math.PI/3));
 zone('AIR-DISCHARGE',[x-1.25,height+.22,z-1.25],[x+1.25,height+3,z+1.25],'airflow','Unobstructed upward discharge planning envelope; plume and air recirculation study HOLD');
 zone('AIR-INTAKE-EAST',[x+1.43,1.75,z-1.30],[x+2.5,height-.4,z+1.30],'airflow','Outdoor inlet reservation; vendor airflow and hot-air recirculation qualification HOLD');
 zone('AIR-INTAKE-WEST',[x-2.7,1.75,z-1.30],[x-1.43,height-.4,z+1.30],'airflow','Outdoor inlet reservation; vendor airflow area and neighbouring exhaust review HOLD');
 const coilRoute=(points,label,circuit,role,r=.04)=>{const j=parts.length,e0=edges.length;const route=k.line(points,r,label,'Thermal package',{},{},{internalTo:tag});mark(j,circuit,role);for(const e of edges.slice(e0)){e.internalTo=tag;e.screenAsPipe=false;}for(const p of parts.slice(j)){p.exploreRole='equipment';p.componentAssembly='thermal-'+id;p.thermalPackageInternal=true;}return route;};
 let inlet,outlet,passageId;
 if(key==='cw'){
  inlet=[x-1.5,1,z];outlet=[x+1.5,1.5,z];
  const points=[inlet,[x-1.05,1,z],[x-1.05,1.35,z-.8]];
  for(let row=0;row<10;row++){const yy=1.35+row*.20,xx=x+(row%2?-.95:.95);points.push([xx,yy,z-.8]);if(row<9)points.push([xx,yy+.20,z-.8]);}
  points.push([x-1.12,3.15,z+.35],[x+1.10,3.15,z+.35],[x+1.10,1.5,z+.35],[x+1.10,1.5,z],outlet);
  const cr=coilRoute(points,tag+' continuous closed process-water coil',key,'generation',.05);passageId=cr.id;
  // The coil has a physical load path via its first straight inlet support.
  const coil=parts.find(p=>p.id===edges[cr.edgeIndices[0]].part),arm=s.beam([x-1.35,.55,z-1.35],[x-1.35,.55,z],.06,tag+' coil saddle arm'),seat=s.beam([x-1.35,.55,z],[x-1.35,.95,z],.06,tag+' coil saddle');s.join(lower,arm,[x-1.35,.55,z-1.35],tag+' coil bearer');s.join(arm,seat,[x-1.35,.55,z],tag+' coil seat');s.join(seat,coil,[x-1.35,.95,z],tag+' coil contact');s.load(coil,tag+' coil assembly');
  const basin=b(tag+' separate spray-water basin floor','head',[2.6,.10,2.6],[x,.30,z],'blue');for(const dx of[-1,1])b(tag+' spray basin rim','head',[.06,.35,2.6],[x+dx*1.27,.475,z],'blue');for(const dz of[-1,1])b(tag+' spray basin rim','head',[2.6,.35,.06],[x,.475,z+dz*1.27],'blue');
  const sprayPump=k.transferPump(x-.9,'P-SP5200','Tower spray recirculation',{z:z+.50}),suction=[x-.8,.4,z+.6],spray=[x-.9,3.6,z+.95];L([suction,[suction[0],.8,suction[2]],sprayPump.inlet],'Tower spray suction','spray','inactive');L([sprayPump.outlet,spray,[x+.9,3.6,z+.95]],'Tower spray distribution','spray','inactive');
  for(const dx of[-.6,0,.6]){const at=[x+dx,3.6,z+.95],end=[x+dx,3.50,z+.95];L([at,end],'Tower spray nozzle neck','spray','inactive',.025);c('Tower spray nozzle','valve',.04,.05,[x+dx,3.475,z+.95],'bright');terminal([x+dx,3.45,z+.95],'Intentional spray discharge into basin');}
  for(let dx=-1.15;dx<=1.15;dx+=.23){const p=b(tag+' drift eliminator cassette','head',[.15,.16,2.4],[x+dx,3.95,z],'steel');p.cut=true;}
  interfaces.push({tag:'A-5200 spray water',disposition:'intentional discharge',point:[x,3.45,z+.95],reason:'Spray circuit is physically separate from the closed process-water coil; water treatment and flow unqualified'});
  for(const [name,at,axis]of[['MAKEUP',[x-1.3,.5,z],[-1,0,0]],['BLOWDOWN',[x+1.3,.4,z],[1,0,0]],['OVERFLOW',[x+1.3,.55,z+.65],[1,0,0]]]){const end=V(at).addScaledVector(V(axis),.25).toArray();L([at,end],'Tower '+name,'spray','inactive',.025);if(name==='OVERFLOW'){terminal(end,'Tower overflow receiver unresolved');interfaces.push({tag:'A-5200 overflow',point:end,disposition:'unresolved',reason:'Route to a compatible visible receiving system after water-quality and drainage design; do not cap an operating overflow'});}else blind(end,axis,'BL-5200-'+name,'spray','Water quality, backflow protection and receiving system require design',.025);}
 }else{
  inlet=[x-1.5,1,z];outlet=[x+1.5,1.5,z];
  const evap=band(tag+' insulated evaporator water shell','shell',.32,.285,2.05,[x,.95,z],'steel',[1,0,0]);evap.cut=true;
  for(const dx of[-1.025,1.025]){const face=new T.Shape(),hole=new T.Path();face.absarc(0,0,.32,0,2*Math.PI,false);hole.absarc(0,.05,.05,0,2*Math.PI,true);face.holes.push(hole);const geometry=new T.ExtrudeGeometry(face,{depth:.04,bevelEnabled:false,curveSegments:32});geometry.translate(0,0,-.02);geometry.rotateY(Math.PI/2);const cap=h.add(tag+' evaporator removable end cover','head',geometry,[x+dx,.95,z],'bright');cap.cut=true;const sleeve=band(tag+' evaporator sealed water penetration','head',.05,.041,.04,[x+dx,1,z],'bright',[1,0,0]);sleeve.cut=true;}
  const wa=[x-1.045,1,z],wb=[x+1.045,1,z];L([inlet,wa],tag+' evaporator inlet',key,'generation');L([wb,[x+1.25,1,z],[x+1.25,1.5,z],outlet],tag+' evaporator outlet',key,'generation');const pass=P(evap,[wa,[x,.95,z],wb],tag+' evaporator water passage',key,'generation');passageId=pass.id;
  const foot=s.beam([x,.55,z-1.35],[x,.55,z],.08,tag+' evaporator bearer'),seat=b(tag+' evaporator saddle','frame',[.2,.16,.35],[x,.63,z]);s.join(lower,foot,[x,.55,z-1.35],tag+' evaporator bearer fixing');s.join(foot,seat,[x,.55,z],tag+' saddle bearing');s.join(seat,evap,[x,.64,z],tag+' evaporator contact');s.load(evap,tag+' evaporator');
  const compressor=c(tag+' refrigerant compressor','pump',.22,.70,[x-.75,.75,z+.75],'blue'),stand=b(tag+' compressor pedestal','frame',[.5,.22,.5],[x-.75,.29,z+.75]);s.join(pad,stand,[x-.75,.18,z+.75],tag+' compressor base');s.join(stand,compressor,[x-.75,.4,z+.75],tag+' compressor fixing');s.load(compressor,tag+' compressor');
  const ref='refrigerant-'+tag,a=[x-.75,1.10,z+.75],dis=[x-.75,.75,z+.97],tx=[x+.75,1.2,z+.75],txout=[x+.75,.95,z+.75],suc=[x-.75,.75,z+.53];P(compressor,[suc,[x-.75,.75,z+.75],a],tag+' compressor refrigerant passage',ref,'inactive');
  const condenser=[a,[x-.75,1.6,z+.75],[x-.95,1.6,z-1.08]];for(let j=0;j<6;j++){const yy=1.6+j*.18,xx=x+(j%2?-.95:.95);condenser.push([xx,yy,z-1.08]);if(j<5)condenser.push([xx,yy+.18,z-1.08]);}condenser.push([x-1.10,2.5,z+.75],[x+.75,2.5,z+.75],tx);coilRoute(condenser,tag+' condenser refrigerant coil',ref,'inactive',.025);
  for(let dx=-1.05;dx<=1.05;dx+=.15){const p=b(tag+' condenser fin','head',[.025,1.25,.18],[x+dx,2.05,z-1.08],'steel');p.cut=true;}
  const txv=band(tag+' refrigerant expansion valve','valve',.055,.018,.25,[x+.75,1.075,z+.75],'bright');P(txv,[tx,txout],tag+' expansion valve refrigerant passage',ref,'inactive');
  const refIn=[x+.65,.95,z+.26],refOut=[x-.65,.95,z+.26];coilRoute([txout,refIn],tag+' evaporator refrigerant inlet',ref,'inactive',.025);const refBody=band(tag+' separate evaporator refrigerant channel','internal',.029,.022,1.3,[x,.95,z+.26],'bright',[1,0,0]);P(refBody,[refIn,refOut],tag+' evaporator refrigerant passage',ref,'inactive');coilRoute([refOut,[x-.75,.95,z+.26],suc],tag+' compressor suction refrigerant line',ref,'inactive',.025);
  zone('REMOVE-EVAPORATOR',[x-4.3,.55,z-.5],[x-1.95,1.4,z+.5],'removal','Staging space beyond the connected inlet spool. Inlet spool and end cover must be isolated, removed and supported first; swept transfer and vendor extraction length HOLD');
 }
 for(const [at,axis]of[[inlet,[-1,0,0]],[outlet,[1,0,0]]]){h.flange(at,axis,.05,tag+' water package connection');interfaces.push({tag:tag+(at===inlet?' return flange':' supply flange'),point:at,disposition:'connected',reason:'Mating package water connection; pressure class and materials HOLD'});}
 for(const p of parts.slice(first)){p.exploreRole='equipment';if(!p.pumpAssetTag)p.componentAssembly='thermal-'+id;p.geometryBasis='A5000-detail-72';}
 return {inlet,outlet,passageId,packageType:key==='cw'?'Closed-circuit evaporative fluid cooler':'Air-cooled refrigeration package',partIds:parts.slice(first).map(p=>p.id)};
}
