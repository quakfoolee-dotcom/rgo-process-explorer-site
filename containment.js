import {CONTAINMENT_BLOCKS,CONTAINMENT_CELLS,CONTAINMENT_INPUTS,CONTAINMENT_HOLDS,EMERGENCY_STATIONS,sizeRetention,inventoryEnvelope} from './containment-basis.js';
import {BC_CONTAINMENT_BASIS} from './containment-bc.js';
import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';
import {floorRegion,floorTriangles,inRect} from './floor-geometry.js';
import {captureDrainNetwork} from './containment-routing.js';

export function buildContainment(h,{a160='baseline'}={}){
 const {T,parts,EQUIPMENT,setContext,b,c,add,geo,tube,terminal,edges,routes}=h,k=processKit(h,.10),s=structuralKit(h),first=parts.length,cells=[],accessZones=[],civilBlocks=[];
 const yards={preg:{x:-43,minX:-43,maxX:-11,z:-37,rowLength:0},oxidation:{x:-10,minX:-10,maxX:20,z:-37,rowLength:0},quench:{x:21,minX:21,maxX:48,z:-37,rowLength:0},washing:{x:49,minX:49,maxX:87,z:-37,rowLength:0},water:{x:14,minX:14,maxX:116,z:-53,rowLength:0}};
 const flag=(p,cell,layer)=>{Object.assign(p,{containmentCell:cell.key,containmentLayer:layer,designStatus:'proposed'});return p;};
 const box=(cell,name,size,point,layer='buried',mat='lining')=>flag(b('BND-'+cell.key+' '+name,'frame',size,point,mat),cell,layer);
 function root(p,at){h.structure.roots.push({part:p.id,local:new T.Vector3(...at).sub(p.position).divide(p.scale).toArray(),elevation:at[1]});return p;}
 function sourcePatches(def,owners){
  if(!def.automaticPatch){const out=structuredClone(def.scenarioPatches?.[a160]||def.patches);for(const p of parts.slice(0,first)){if(p.system!=='pump'||!owners.includes(p.reactor)||!/volute|pump body/.test(p.name))continue;const x=p.position.x,z=p.position.z;if(out.some(r=>x-.25>=r[0]&&x+.25<=r[2]&&z-.25>=r[1]&&z+.25<=r[3]))continue;const tray=[x-.55,z-.5,x+.55,z+.5];tray.pumpTag=p.name;out.push(tray);}return out;}
  const e=EQUIPMENT[owners[0]],r=e.radius+.85;
  const out=[[e.x-r,e.z-r-.4,e.x+r,e.z+r]];
  if(owners[0]===153)out[0][3]=-16.1; // Keep the continuous central wastewater aisle clear; tank edge is at -16.4 m.
  // Include the actual nearby transfer / metering-pump catch floor without one giant common basin.
  const related={125:141,126:142,127:143,128:144,129:145,131:136,132:137,133:138,134:139,135:140,150:151,153:154}[owners[0]],p=EQUIPMENT[related];
  if(p)out.push([p.x-.85,p.z-.65,p.x+.85,p.z+.65]);
  return out;
 }
 // Compact shared civil blocks: retain physical barriers without 1.8 m gaps between every cell.
 const sizingFor=def=>{const owners=def.scenarioOwners?.[a160]||def.owners;return sizeRetention([...new Set([...owners,...def.connectedInventoryOwners||[]])].reduce((n,id)=>n+inventoryEnvelope(EQUIPMENT[id]).m3,0)+(def.packageInventoryM3||0));};
 const layout=Array(CONTAINMENT_CELLS.length),blockFor=new Map();
 for(const block of [...CONTAINMENT_BLOCKS.filter(b=>b.yard!=='water'),...CONTAINMENT_BLOCKS.filter(b=>b.yard==='water')]){
  if(block.yard==='water'&&!civilBlocks.some(b=>b.yard==='water'))yards.water.z=Math.min(-53,Math.min(...civilBlocks.map(b=>b.min[2]))-3);
  const members=block.keys.map(key=>CONTAINMENT_CELLS.find(c=>c.key===key)),sizes=members.map(sizingFor),length=Math.max(...sizes.map(s=>s.length)),width=sizes.reduce((n,s)=>n+s.width,0)+.2*(members.length-1),yard=yards[block.yard];
  if(yard.x+width>yard.maxX){yard.x=yard.minX;yard.z-=Math.max(7,yard.rowLength)+2;yard.rowLength=0;}
  const placed={...block,min:[yard.x-.2,0,yard.z-length-.2],max:[yard.x+width+.2,0,yard.z+.2],partIds:[],cellTags:members.map(c=>'BND-'+c.key)};civilBlocks.push(placed);
  let x=yard.x;for(let j=0;j<members.length;j++){const def=members[j],i=CONTAINMENT_CELLS.indexOf(def);layout[i]=[x,yard.z-length,x+sizes[j].width,yard.z];blockFor.set(def.key,{block:placed,memberIndex:j});x+=sizes[j].width+.2;}
  yard.x+=width+1.8;yard.rowLength=Math.max(yard.rowLength,length);
 }
 const foundationEnvelopes=parts.slice(0,first).filter(p=>p.system==='frame'&&/foundation|foot$|foot plate|base plate|baseplate|anchored.*foot|support foot/.test(p.name)).map(p=>{p.geometry.computeBoundingBox();const bb=p.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale));return {p,bb,rect:[bb.min.x-.12,bb.min.z-.12,bb.max.x+.12,bb.max.z+.12]};}).filter(v=>v.bb.min.y<=.21&&v.bb.max.y>=-.1);
 function intakeFor(rect){const [a,d,e,f]=rect,obstacles=foundationEnvelopes.map(v=>v.rect),mid=(a+e)/2;
  const xs=[mid,...Array.from({length:Math.max(2,Math.ceil((e-a)/.1))},(_,i)=>a+.25+i*.1)].filter(x=>x>=a+.24&&x<=e-.24).sort((x,y)=>Math.abs(x-mid)-Math.abs(y-mid));
  for(let z=d+.25;z<=f-.24;z+=.10)for(const x of xs)if(!obstacles.some(r=>x-.14<r[2]&&x+.14>r[0]&&z-.14<r[3]&&z+.14>r[1]))return [x,-.20,z];
  throw Error('No clear capture inlet within '+JSON.stringify(rect));
 }
 const reservedIntakes=CONTAINMENT_CELLS.flatMap(def=>sourcePatches(def,def.scenarioOwners?.[a160]||def.owners).map(intakeFor));
 const completedPaths=[];
 for(const [index,def]of CONTAINMENT_CELLS.entries()){
  const id=def.modelId,owners=def.scenarioOwners?.[a160]||def.owners,patches=sourcePatches(def,owners),inventories=owners.map(owner=>({owner,tag:EQUIPMENT[owner].tag,...inventoryEnvelope(EQUIPMENT[owner])}));
  let inventory=inventories.reduce((n,e)=>n+e.m3,0)+(def.packageInventoryM3||0);
  for(const owner of def.connectedInventoryOwners||[]){const e=inventoryEnvelope(EQUIPMENT[owner]);inventories.push({owner,tag:EQUIPMENT[owner].tag,...e,basis:e.basis+'; included as connected inventory without crediting isolation'});inventory+=e.m3;}
  const sizing=sizeRetention(inventory);
  const [x0,z0,x1,z1]=layout[index],w=x1-x0,l=z1-z0;
  sizing.length=l;sizing.liquidDepth=Math.max(.4,Math.ceil(sizing.requiredM3*CONTAINMENT_INPUTS.storageMargin/(w*l*(1-CONTAINMENT_INPUTS.displacementFraction))*100)/100);sizing.displacementM3=w*l*sizing.liquidDepth*CONTAINMENT_INPUTS.displacementFraction;sizing.netM3=w*l*sizing.liquidDepth-sizing.displacementM3;
  const {block,memberIndex}=blockFor.get(def.key);
  const cell={...def,id,civilBlock:block.tag,owners,patches,inventories,...sizing,tag:'BND-'+def.key,chemistry:def.automaticPatch?EQUIPMENT[owners[0]].label:def.chemistry,pumpTrays:patches.map((r,i)=>r.pumpTag?{patchIndex:i,pump:r.pumpTag,footprint:[...r],floorY:.025,rimTopY:.225,segregation:'Liquid-tight local rim and sealed independent drain through underlying floor; capacity / capture hydraulics unqualified'}:null).filter(Boolean),partIds:[],capturePartIds:[],routeIds:[],intakes:[],accessMethod:'Grade indication and recovery connection from the reserved service aisle; isolated shutdown removal of covers with temporary guarding. No routine cell entry.',qualified:false};
  const begin=parts.length;setContext(id,cell.tag+' segregated spill capture and off-line retention');
  Object.assign(EQUIPMENT[id],{x:(x0+x1)/2,z:z1+.4,labelY:2.2,label:cell.chemistry+' · '+sizing.netM3.toFixed(1)+' m³ retention',capacityM3:sizing.netM3,reviewNote:`${sizing.netM3.toFixed(1)} m³ net geometric retention versus ${sizing.requiredM3.toFixed(1)} m³ selected release case. Independent off-line collection; no normal treatment connection. Inventories, spill capture, hydraulics, chemistry, excavation and site extension require qualification.`});
  // Recessed lined capture with continuous raised boundaries and protected foundation islands.
  // Its volume is NOT credited toward the retention calculation.
  for(const [n,rect]of patches.entries()){
   const [a,d,e,f]=rect,mid=(a+e)/2,low=intakeFor(rect);cell.intakes.push(low);
   const excluded=[],supportIslands=[];
   for(const p of parts.slice(0,first)){
    if(p.system!=='frame'||!/foundation|foot$|foot plate|base plate|baseplate|anchored.*foot|support foot/.test(p.name))continue;
    p.geometry.computeBoundingBox();const bb=p.geometry.boundingBox.clone().applyMatrix4(new T.Matrix4().compose(p.position,p.quaternion,p.scale));
    if(bb.min.y>.21||bb.max.y<-.1||bb.max.x<a-.15||bb.min.x>e+.15||bb.max.z<d-.15||bb.min.z>f+.15)continue;
    const r=[bb.min.x-.12,bb.min.z-.12,bb.max.x+.12,bb.max.z+.12];excluded.push(r);supportIslands.push({partId:p.id,name:p.name,rect:r,atBoundary:r[0]<=a||r[2]>=e||r[1]<=d||r[3]>=f});
   }
   if(cell.key==='164'&&a160==='enclosed'&&n===0){const r=[-12.28,-18.58,-11.9,-18.1];excluded.push(r);const fill=box(cell,'lined dry corner infill between support islands',[r[2]-r[0],.355,r[3]-r[1]],[(r[0]+r[2])/2,.1225,(r[1]+r[3])/2],'curb');root(fill,[fill.position.x,-.055,fill.position.z]);}
   const waterRegion=floorRegion([rect],excluded),inletRect=[low[0]-.12,low[2]-.12,low[0]+.12,low[2]+.12];
   const floorRegionData=floorRegion([rect],[...excluded,inletRect]);
   const maxDistance=Math.max(...[[a,d],[a,f],[e,d],[e,f]].map(([x,z])=>Math.hypot(x-low[0],z-low[2])));
   const floorY=(x,z)=>(rect.pumpTag ? .025 : .006)-.075*(1-Math.hypot(x-low[0],z-low[2])/maxDistance);
   const floorGeo=geo(cell.tag+'-floor-'+n+'-'+a160,()=>{const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(floorTriangles(floorRegionData.tiles,floorY),3));g.computeVertexNormals();return g;});
   const floor=flag(add(cell.tag+' sloped compatible-lined capture floor','frame',floorGeo,[0,0,0],'lining',new T.Quaternion(),[1,1,1],{center:[mid,0,(d+f)/2]}),cell,'capture');floor.captureFootprint=rect;cell.capturePartIds.push(floor.id);
   // Continuous boundary of the wet floor, including edge-intersecting support islands.
   // Narrow upstands surround retained foundations; they do not become a new structural load path.
   const crest=rect.pumpTag ? .225 : CONTAINMENT_INPUTS.localCurbTopM;
   const curbIds=[];
   for(const [u,v]of waterRegion.segments){
    const x=(u[0]+v[0])/2,z=(u[1]+v[1])/2,horizontal=Math.abs(u[1]-v[1])<1e-8,len=Math.hypot(v[0]-u[0],v[1]-u[1]);
    const pedestal=excluded.some(r=>x>=r[0]-1e-6&&x<=r[2]+1e-6&&z>=r[1]-1e-6&&z<=r[3]+1e-6),top=pedestal?Math.max(crest+.1,.30):crest;
    // Place the upstand to the wet side so a support's retained base and anchors stay accessible.
    let nx=-(v[1]-u[1])/len,nz=(v[0]-u[0])/len;
    if(!waterRegion.tiles.some(r=>inRect(x+nx*.005,z+nz*.005,r))){nx=-nx;nz=-nz;}
    const at=[x+nx*.05,(top-.055)/2,z+nz*.05],size=horizontal?[len+.002,top+.055,.10]:[.10,top+.055,len+.002];
    const wall=box(cell,pedestal?'lined pedestal protection upstand':'continuous raised capture perimeter',size,at,'curb');wall.capturePatch=n;wall.crestY=top;wall.pedestalDetail=pedestal?'Retained structural foundation in a dry island; continuous lined upstand and compatible movement joint. Existing anchors remain accessible. Splash sealing, civil loads and supplier lining system HOLD.':null;curbIds.push(wall.id);root(wall,[at[0],-.055,at[2]]);
    const joint=box(cell,'compatible waterstop / coved floor joint',horizontal?[len,.025,.035]:[.035,.025,len],[x+nx*.10,.003,z+nz*.10],'curb','dark');joint.capturePatch=n;
   }
   const conservativeAreaM2=Math.max(0,waterRegion.areaM2-waterRegion.segments.reduce((sum,[u,v])=>sum+Math.hypot(v[0]-u[0],v[1]-u[1])*.10,0));
   cell.captureDesign??=[];cell.captureDesign.push({patchIndex:n,footprint:[...rect],segments:waterRegion.segments,tiles:waterRegion.tiles,curbPartIds:curbIds,crestY:crest,freeboardM:CONTAINMENT_INPUTS.localFreeboardM,usableDepthM:Math.max(0,crest-CONTAINMENT_INPUTS.localFreeboardM-(rect.pumpTag ? .025 : .006)),conservativeAreaM2,geometricBufferM3:conservativeAreaM2*Math.max(0,crest-CONTAINMENT_INPUTS.localFreeboardM-(rect.pumpTag ? .025 : .006)),supportIslands,inletClear:!excluded.some(r=>r[0]<inletRect[2]&&r[2]>inletRect[0]&&r[1]<inletRect[3]&&r[3]>inletRect[1]),basis:'200 mm nominal perimeter above grade; 50 mm provisional freeboard. Higher support upstands keep retained foundations outside the wet floor. Geometry only; no approved spill or drain capacity.',hydraulicsVerified:false,structuralVerified:false});
   for(let bar=0;bar<8;bar++)box(cell,'removable intake grating '+(n+1),[.012,.025,.24],[low[0]-.105+bar*.03,rect.pumpTag ? -.05 : -.069,low[2]],'capture','steel');

  }
  // Independent buried drains: source invert and continuous fall are explicit model data.
  // No credit is taken for a normal wastewater pump or an always-available process tank.
  const receiver=[x0+.4,0,z1-.4],paths=[];
  const ownIntakes=cell.intakes;
  const obstacles=[...layout.filter((_,j)=>j!==index).map(r=>[r[0]-.35,r[1]-.35,r[2]+.35,r[3]+.35]),...reservedIntakes.filter(p=>!ownIntakes.some(start=>Math.hypot(p[0]-start[0],p[2]-start[2])<.01)).map(p=>[p[0]-.30,p[2]-.30,p[0]+.30,p[2]+.30])];
  const network=captureDrainNetwork(cell.intakes,receiver,obstacles,completedPaths,CONTAINMENT_INPUTS.pipeSlope);
  const networkPaths=[...network.branches,network.main];completedPaths.push(...networkPaths);
  for(const [n,path]of networkPaths.entries()){
   const remote=n===networkPaths.length-1,before=parts.length,r=k.line(path,CONTAINMENT_INPUTS.pipeRadiusM,cell.tag+(remote?' single gravity retention trunk':' local capture branch '+(n+1)),'Drain',remote?cell.tag+' local collection junction':cell.owners.map(o=>EQUIPMENT[o].tag).join(' / '),remote?cell.tag+' dedicated retention':cell.tag+' local collection junction',{bendRadius:.04,bendFactor:.1});
   Object.assign(r,{areaId:cell.areaId,designStatus:'proposed',spillCell:cell.key,buried:true,hydraulicStatus:'HOLD: provisional bore/slope; full release-rate, sediment, inlet capture, backwater and buried-services review required'});
   for(const p of parts.slice(before))flag(p,cell,'buried');
   cell.routeIds.push(r.id);paths.push({routeId:r.id,path,remote,nominalRadiusM:CONTAINMENT_INPUTS.pipeRadiusM,slope:CONTAINMENT_INPUTS.pipeSlope,qualification:'Unqualified gravity conveyance; connectivity and descending geometry only'});
  }
  cell.localJunction=network.hub;terminal(network.main.at(-1),cell.tag+' independent retention inlet');
  const lowestInlet=Math.min(...paths.filter(p=>p.remote).map(p=>p.path.at(-1)[1]-CONTAINMENT_INPUTS.pipeRadiusM)),maxLiquidY=lowestInlet-CONTAINMENT_INPUTS.freeboardAboveInletM,bottom=maxLiquidY-sizing.liquidDepth,wallTop=.15;
  Object.assign(cell,{storage:{min:[x0,bottom,z0],max:[x1,maxLiquidY,z1],wallTopY:wallTop,maximumLiquidY:maxLiquidY,inletClearanceM:CONTAINMENT_INPUTS.freeboardAboveInletM,foundationBaseY:bottom-.25},gravityPaths:paths,releaseDestination:cell.tag,recoveryDestination:'Positively blinded recovery coupling; sampling and approved disposal / treatment acceptance required',normalDischargeConnection:null,ventDestination:'Independent compatible vent termination; location and treatment HOLD',pipeSupportMethod:'Buried pipe bedding and thrust restraint; soil loads, trench detail and foundation separation unqualified. Vents and recovery dip tubes attach to the cover / common instrument stand.',bcWasteStorageScreenM3:Math.max(1.1*Math.max(...inventories.map(v=>v.m3),def.packageInventoryM3||0),.25*inventory),bcWasteApplicability:'Unconfirmed; conditional section 16 screening only',storageStatus:'Geometric storage provision only; no hydraulic or chemical safety credit'});
  const floor=root(box(cell,'lined retention base',[w+.2,.25,l+.4],[(x0+x1)/2,bottom-.125,(z0+z1)/2]),[(x0+x1)/2,bottom-.25,(z0+z1)/2]);
  for(const x of(memberIndex===block.keys.length-1?[x0-.10,x1+.10]:[x0-.10])){const wall=box(cell,'liquid-tight retaining wall',[.20,wallTop-bottom,l+.4],[x,(wallTop+bottom)/2,(z0+z1)/2]);s.join(floor,wall,[x,bottom,(z0+z1)/2],cell.tag+' wall / base');wall.cut=true;wall.partitionBlock=block.tag;wall.partitionWest=x===x0-.10;}
  for(const z of[z0-.10,z1+.10]){const wall=box(cell,'liquid-tight retaining wall',[w,wallTop-bottom,.20],[(x0+x1)/2,(wallTop+bottom)/2,z]);s.join(floor,wall,[(x0+x1)/2,bottom,z],cell.tag+' wall / base');wall.cut=true;}
  // Reserved internal footing/liner displacement is deducted from credited volume.
  box(cell,'uncredited internal displacement allowance',[w,sizing.liquidDepth*CONTAINMENT_INPUTS.displacementFraction,l],[(x0+x1)/2,bottom+sizing.liquidDepth*CONTAINMENT_INPUTS.displacementFraction/2,(z0+z1)/2]);
  const fill=box(cell,'maximum design liquid level · no actual liquid',[w,.008,l],[(x0+x1)/2,maxLiquidY,(z0+z1)/2],'level','blue');fill.cut=true;
  const cover=box(cell,'removable sealed cover · ventilated independently',[w+.2,.12,l+.4],[(x0+x1)/2,.21,(z0+z1)/2],'cover','steel');cover.cut=true;cover.serviceAccess={standing:[x0+.7,0,z1+1.05],method:'Shutdown cover removal from service aisle using a qualified lifting plan; temporary edge protection required'};
  for(const wall of parts.slice(begin).filter(p=>p.name.endsWith('liquid-tight retaining wall')))s.join(wall,cover,[wall.position.x,wallTop,wall.position.z],cell.tag+' cover bearing');
  // Vent and level indication share one anchored stand; no new forest of supports.
  const px=x0+.45,pz=z1-.4,foot=box(cell,'instrument stand foot',[.30,.10,.30],[px,.32,pz],'instrument','steel');s.join(cover,foot,[px,.27,pz],cell.tag+' stand foot / cover');
  const stand=s.beam([px,.37,pz],[px,1.7,pz],.06,cell.tag+' instrument stand');flag(stand,cell,'instrument');s.join(foot,stand,[px,.37,pz],cell.tag+' stand / base');
  const panelArm=s.beam([px,1.4,pz],[px,1.4,z1+.25],.045,cell.tag+' accessible panel bracket');flag(panelArm,cell,'instrument');s.join(stand,panelArm,[px,1.4,pz],cell.tag+' panel bracket / stand');const panel=flag(b(cell.tag+' level alarm display','valve',[.4,.24,.1],[px,1.4,z1+.25],'blue'),cell,'instrument');s.join(panelArm,panel,[px,1.4,z1+.25],cell.tag+' panel / bracket');panel.accessTag='LAH-'+cell.key;panel.serviceAccess={standing:[px,0,z1+.8],method:'Grade indication from the south-yard service aisle'};s.load(panel,cell.tag+' level indication');
  const ventStart=[x0+.9,-.10,z1-.45],ventEnd=[x0+.9,2.4,z1-.45],vent=flag(tube(ventStart,ventEnd,.05,cell.tag+' independent vent'),cell,'instrument');terminal(ventEnd,cell.tag+' vent location and treatment HOLD');
  const ventBracket=s.beam([px,1.5,pz],[x0+.85,1.5,z1-.45],.045,cell.tag+' vent bracket');flag(ventBracket,cell,'instrument');s.join(stand,ventBracket,[px,1.5,pz],cell.tag+' bracket / stand');s.join(ventBracket,vent,[x0+.85,1.5,z1-.45],cell.tag+' vent / bracket');s.load(vent,cell.tag+' independent vent');
  const recoveryBottom=[x1-.45,bottom+.1,z1-.45],recoveryElbow=[x1-.45,1.2,z1-.45],recoveryTop=[x1-.45,1.2,z1+.25],recovery=flag(tube(recoveryBottom,recoveryElbow,.05,cell.tag+' recovery dip tube'),cell,'instrument'),recoveryArm=flag(tube(recoveryElbow,recoveryTop,.05,cell.tag+' grade recovery coupling'),cell,'instrument');s.join(recovery,recoveryArm,recoveryElbow,cell.tag+' recovery elbow');flag(c(cell.tag+' recovery positive blind','valve',.10,.03,recoveryTop,'dark',[0,0,1]),cell,'instrument');terminal(recoveryTop,cell.tag+' normally blinded recovery coupling');s.join(cover,recovery,[x1-.45,.21,z1-.45],cell.tag+' recovery nozzle / cover');s.load(recovery,cell.tag+' recovery dip tube');
  cell.servicePositions=[{tag:'LAH-'+cell.key,category:'routine',point:[px,1.4,z1+.25],standing:[px,0,z1+.8],method:'Grade indication',horizontalReachM:.55},{tag:cell.tag+' recovery',category:'periodic',point:recoveryTop,standing:[x1-.45,0,z1+.8],method:'Grade coupling; sampled, isolated recovery with approved destination'},{tag:cell.tag+' cover',category:'periodic',standing:[x0+.7,0,z1+1.05],method:cover.serviceAccess.method}];
  cell.partIds=parts.slice(begin).map(p=>p.id);cells.push(cell);
  accessZones.push({id:'SERVICE-'+cell.tag,kind:'pedestrian',areaIds:[cell.areaId],min:[x0-.2,.02,z1+.45],max:[x1+.2,2.32,z1+1.65],note:'Retention-cell grade service aisle; approach, emergency access and vehicle design require site review',designStatus:'proposed'});
 }
 const emergencyStations=[];
 for(const e of EMERGENCY_STATIONS){const {id,tag,x,z}=e,cell={key:tag},begin=parts.length,edgeStart=edges.length,terminalStart=h.terminals.length;setContext(id,tag+' emergency shower and eyewash · proposed location');
  const foot=root(box(cell,'anchored emergency-station base',[.4,.10,.4],[x,.05,z],'emergency','steel'),[x,0,z]);
  const riser=flag(tube([x,.10,z],[x,2.2,z],.045,tag+' emergency-water riser'),cell,'emergency');s.join(foot,riser,[x,.10,z],tag+' riser / foot');s.load(riser,tag+' riser');
  const arm=flag(tube([x,2.2,z],[x,2.2,z+.65],.045,tag+' shower arm'),cell,'emergency');s.join(riser,arm,[x,2.2,z],tag+' arm / riser');const head=flag(c(tag+' shower head','head',.19,.06,[x,2.17,z+.65],'steel'),cell,'emergency');s.join(arm,head,[x,2.2,z+.65],tag+' head / arm');s.load(head,tag+' shower head');
  const eyeArm=flag(tube([x,1.0,z],[x,1.0,z+.38],.035,tag+' eyewash branch'),cell,'emergency');s.join(riser,eyeArm,[x,1,z],tag+' eyewash / riser');
  const bowl=flag(c(tag+' eyewash catch bowl','head',.21,.055,[x,.97,z+.42],'steel'),cell,'emergency');s.join(eyeArm,bowl,[x,.97,z+.38],tag+' bowl / branch');s.load(bowl,tag+' eyewash bowl');
  for(const dx of[-.09,.09])flag(c(tag+' eyewash nozzle','valve',.026,.06,[x+dx,1.025,z+.42],'blue'),cell,'emergency');
  const actuator=flag(b(tag+' shower valve linkage','valve',[.22,.15,.10],[x+.06,2.15,z+.25],'steel'),cell,'emergency');s.join(arm,actuator,[x,2.2,z+.25],tag+' valve / arm');
  const pull=flag(tube([x+.12,2.15,z+.25],[x+.12,1.35,z+.25],.01,tag+' shower pull rod'),cell,'emergency');const handle=flag(b(tag+' handle grip','valve',[.18,.04,.035],[x+.12,1.33,z+.25],'blue'),cell,'emergency');s.join(actuator,pull,[x+.12,2.15,z+.25],tag+' linkage / rod');s.join(pull,handle,[x+.12,1.35,z+.25],tag+' rod / grip');s.load(handle,tag+' activation grip');handle.accessTag=tag;handle.serviceAccess={standing:[x,0,z+.9],method:'Emergency operation from grade; unobstructed travel time and supplier geometry require verification'};
  const tie=flag(tube([x,.6,z],[x-.5,.6,z],.045,tag+' independent emergency-water supply interface'),cell,'emergency');terminal([x-.5,.6,z],tag+' dedicated tepid emergency-water source required');
  const act=flag(b(tag+' eyewash activation paddle','valve',[.12,.10,.025],[x+.20,1.03,z+.42],'blue'),cell,'emergency');act.serviceAccess=handle.serviceAccess;
  const drain=flag(tube([x,.94,z+.42],[x,.12,z+.42],.035,tag+' separate eyewash runoff'),cell,'emergency');terminal([x,.12,z+.42],tag+' emergency runoff collection destination HOLD; no connection to reactive-spill cell');
  for(const p of parts.slice(begin)){
   p.emergencyRole=/supply interface/.test(p.name)?'water':/runoff/.test(p.name)?'drain':/pull rod|valve linkage|handle grip/.test(p.name)?'metal':/nozzle|activation paddle/.test(p.name)?'sign':'body';
   if(p.emergencyRole==='body')p.material='safetyYellow';
   else if(p.emergencyRole==='sign')p.material='green';
  }
  const sign=flag(b(tag+' emergency identification sign','valve',[.38,.32,.025],[x,1.82,z+.055],'green'),cell,'emergency');sign.emergencyRole='sign';sign.emergencySign={tag,title:'EMERGENCY SHOWER / EYEWASH',directions:'Pull shower handle / push eyewash paddle; supplier instructions pending'};s.join(riser,sign,[x,1.82,z+.045],tag+' sign / column');
  // White identification cross remains legible in flow mode; ES tags identify individual stations.
  for(const size of[[.22,.045,.008],[.045,.22,.008]]){const mark=flag(b(tag+' emergency sign white cross','valve',size,[x,1.82,z+.072],'dial'),cell,'emergency');mark.emergencyRole='symbol';}
  // Rotate the complete local assembly, including explicit connection metadata.
  const yaw=e.yaw||0,q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw),origin=new T.Vector3(x,0,z);
  const transform=a=>new T.Vector3(...a).sub(origin).applyQuaternion(q).add(origin).toArray();
  const handledAccess=new Set();
  for(const p of parts.slice(begin)){
   p.position.copy(new T.Vector3(...transform(p.position.toArray())));p.quaternion.premultiply(q);
   if(p.center)p.center.copy(new T.Vector3(...transform(p.center.toArray())));
   if(p.centerline)p.centerline=p.centerline.map(transform);
   if(p.ports)p.ports=p.ports.map(transform);p.offset.applyQuaternion(q);p.localZ=p.center.z-z;
   if(p.serviceAccess&&!handledAccess.has(p.serviceAccess)){handledAccess.add(p.serviceAccess);p.serviceAccess.standing=transform(p.serviceAccess.standing);}
  }
  for(const edge of edges.slice(edgeStart)){edge.a=transform(edge.a);edge.b=transform(edge.b);if(edge.path)edge.path=edge.path.map(transform);}
  for(const t of h.terminals.slice(terminalStart))t.point=transform(t.point);
  emergencyStations.push({...e,partIds:parts.slice(begin).map(p=>p.id),standing:transform([x,0,z+.9]),supply:'Dedicated potable, tempered emergency water; source, capacity and freeze protection not yet designed',runoff:'Separate collection arrangement; not connected to reactive-spill retention',requirements:BC_CONTAINMENT_BASIS.eyewash,qualification:'Location reservation only; BC high-risk eye travel limit 5 seconds / 6 metres must be verified; travel time, supplier dimensions, flow, temperature and environmental protection require verification'});
 }
 for(const block of civilBlocks){
  const members=cells.filter(c=>c.civilBlock===block.tag),deepest=Math.min(...members.map(c=>c.storage.foundationBaseY)),[x,,z]=block.min,[xx,,zz]=block.max,owner=members[0];
  block.min[1]=deepest-.20;block.max[1]=.27;
  setContext(owner.id,block.tag+' shared civil construction');
  const begin=parts.length,mat=root(box(owner,block.tag+' common foundation mat',[xx-x,.20,zz-z],[(x+xx)/2,deepest-.10,(z+zz)/2]),[(x+xx)/2,deepest-.20,(z+zz)/2]);mat.civilBlock=block.tag;
  for(const cell of members){
   const slab=parts.find(p=>p.containmentCell===cell.key&&p.name.endsWith('lined retention base'));
   h.structure.roots=h.structure.roots.filter(r=>r.part!==slab.id);
   const height=cell.storage.foundationBaseY-deepest;
   if(height>.001){const pad=box(cell,'sealed foundation infill over common mat',[cell.width+.2,height,cell.length+.4],[slab.position.x,deepest+height/2,slab.position.z]);s.join(mat,pad,[slab.position.x,deepest,slab.position.z],block.tag+' mat / infill');s.join(pad,slab,[slab.position.x,cell.storage.foundationBaseY,slab.position.z],block.tag+' infill / floor');}else s.join(mat,slab,[slab.position.x,deepest,slab.position.z],block.tag+' mat / floor');
  }
  // Each common partition extends to the deeper of its two independently lined floors.
  for(let j=1;j<members.length;j++){
   const left=members[j-1],right=members[j],wall=parts.find(p=>p.containmentCell===right.key&&p.partitionWest),newBottom=Math.min(left.storage.min[1],right.storage.min[1]);
   if(wall){const oldPosition=wall.position.clone(),oldScale=wall.scale.clone(),worldContacts=h.structure.contacts.filter(c=>c.a===wall.id||c.b===wall.id).map(c=>({c,key:c.a===wall.id?'localA':'localB',point:new T.Vector3(...(c.a===wall.id?c.localA:c.localB)).multiply(oldScale).add(oldPosition)}));wall.position.y=(.15+newBottom)/2;wall.scale.y=.15-newBottom;for(const {c,key,point}of worldContacts)c[key]=point.sub(wall.position).divide(wall.scale).toArray();const leftFloor=parts.find(p=>p.containmentCell===left.key&&p.name.endsWith('lined retention base'));s.join(leftFloor,wall,[wall.position.x,left.storage.min[1],wall.position.z],block.tag+' shared partition / floor');}
  }
  block.partIds=[...members.flatMap(c=>c.partIds),...parts.slice(begin).map(p=>p.id)];
  for(const cell of members)cell.partIds.push(...parts.slice(begin).map(p=>p.id));
  for(let j=1;j<members.length;j++){const wall=parts.find(p=>p.containmentCell===members[j].key&&p.partitionWest);if(wall){wall.containmentOwners=[members[j-1].id,members[j].id];members[j-1].partIds.push(wall.id);}}
  for(const p of parts.slice(begin)){p.civilBlock=block.tag;p.containmentOwners=members.map(c=>c.id);}
 }
 const minZ=Math.min(...cells.map(c=>c.storage.min[2]))-2;
 // A continuous service spine along the new yard; no vertical pipe crosses it above grade.
 const serviceSpine={id:'WALK-RETENTION-WEST',kind:'pedestrian',areaIds:['all'],min:[-46,.02,minZ],max:[-44.5,2.32,-32],note:'Proposed retention-yard connection to the south plant aisle; site extension and egress review open',designStatus:'proposed'};
 accessZones.push(serviceSpine,{id:'WALK-RETENTION-LINK',kind:'pedestrian',areaIds:['all'],min:[-46,.02,-34],max:[-38,2.32,-32],note:'Connect the retention-yard spine to the existing south plant aisle',designStatus:'proposed'});
 // Each bank's front aisle connects to a side lane; no plant-wide stripe through another bank.
 const middleZ=Math.min(...civilBlocks.filter(b=>b.yard!=='water').map(b=>b.min[2]))-1.2;
 const lanes={preg:-44.5,oxidation:-11.5,quench:19.5,washing:47.5,water:12.5};
 for(const block of civilBlocks){const lane=lanes[block.yard],z=block.max[2]-.2,front=block.max[0];accessZones.push({id:'WALK-'+block.tag,kind:'pedestrian',areaIds:[...new Set(cells.filter(c=>c.civilBlock===block.tag).map(c=>c.areaId))],min:[lane-.6,.02,z+.45],max:[front+.2,2.32,z+1.65],note:'Civil-block front service aisle',designStatus:'proposed'});}
 for(const [yard,x]of Object.entries(lanes)){const blocks=civilBlocks.filter(b=>b.yard===yard);accessZones.push({id:'WALK-SIDE-'+yard,kind:'pedestrian',areaIds:['all'],min:[x-.6,.02,yard==='water'?minZ-1.5:middleZ-.6],max:[x+.6,2.32,Math.max(...blocks.map(b=>b.max[2]+1.5),...(yard==='water'?[middleZ+.6]:[]))],note:'Bank side lane to south cross-spine; civil/site qualification open',designStatus:'proposed'});}
 accessZones.push({id:'WALK-RETENTION-MIDDLE',kind:'pedestrian',areaIds:['all'],min:[-45.1,.02,middleZ-.6],max:[87,2.32,middleZ+.6],note:'Continuous cross-aisle between upper civil blocks and wastewater retention',designStatus:'proposed'});
 accessZones.push({id:'WALK-RETENTION-SOUTH',kind:'pedestrian',areaIds:['all'],min:[-45.1,.02,minZ-1.5],max:[118,2.32,minZ-.3],note:'South cross-spine joining bank service lanes',designStatus:'proposed'});
 for(const zone of accessZones){const cell=cells.at(-1);for(const z of[zone.min[2],zone.max[2]])box(cell,'service aisle marking',[zone.max[0]-zone.min[0],.008,.05],[(zone.min[0]+zone.max[0])/2,.006,z],'yard','blue');}
 h.containmentAccessZones=accessZones;
 return {revision:CONTAINMENT_INPUTS.revision,inputs:CONTAINMENT_INPUTS,holds:[...BC_CONTAINMENT_BASIS.decisions,...CONTAINMENT_HOLDS],bcBasis:BC_CONTAINMENT_BASIS,civilBlocks,retiredTags:[{tag:'BND-402',replacement:'BND-401',reason:'Same T-402 / VSEP circulating inventory counted once'}],cells,emergencyStations,partIds:parts.slice(first).map(p=>p.id),accessZones,siteExtension:{min:[-46,-.01,minZ],max:[118,0,-35],status:'Proposed reserved service strip; site boundary and geotechnical approval required'},oldA1000CurbsRemoved:true,qualified:false};
}
