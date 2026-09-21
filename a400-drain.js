import {structuralKit} from './structural-kit.js';
// Concept coordination only: the enclosed channel is secondary containment,
// not an open chemical drain. The process pipe remains closed throughout.
export const A400_DRAIN_LAYOUT={
 revision:'a400-drain-88',low:[12.9,.3,23.9],
 points:[[13.62,.202,23.9],[13.9,.195,23.9],[13.9,.175,24.6],[13.9,-.35,24.6],[13.9,-.43,27.8]],
 boundary:[13.9,-.43,27.8],axis:[0,-.025,1],
 channel:{min:[13.59,-.68,24.25],max:[14.21,.025,28.45]},
 formerExposedRunM:3.9,exposedRunM:.7,containedRunM:3.2,
 status:'Proposed closed pipe in a lined, covered drain channel',
 holds:['Confirm receiver invert, pressure, venting and segregation before crediting gravity discharge.','Verify drain bore, materials, solids flushing and leak monitoring against the actual waste streams.','Qualify channel lining, sealed penetrations, removable covers and civil/foundation clearances.']
};
export function buildA400DrainChannel(h){
 const {parts,b,band,c,setContext,structure}=h,d=A400_DRAIN_LAYOUT,first=parts.length,s=structuralKit(h);
 setContext(32,'A-400 contained low-point drainage');
 const base=b('DR-400 channel liner base','frame',[.62,.035,4.2],[13.9,-.6625,26.35],'dark');
 structure.roots.push({part:base.id,local:[0,-.5,0],elevation:-.68});
 for(const x of[13.6075,14.1925])b('DR-400 channel liner side','frame',[.035,.66,4.2],[x,-.315,26.35],'dark');
 for(const z of[24.2675,28.4325])b('DR-400 channel liner end','frame',[.55,.66,.035],[13.9,-.315,z],'dark');
 // Flush removable panels surround the sealed vertical penetration at Z24.6.
 for(const [x,w]of[[13.715,.25],[14.085,.25]])b('DR-400 split sealed inlet cover','frame',[w,.024,.7],[x,.012,24.6],'steel');
 for(const z of[24.36,24.84])b('DR-400 split inlet closure','frame',[.12,.024,.22],[13.9,.012,z],'steel');
 band('DR-400 sealed penetration boot','frame',.092,.056,.04,[13.9,.02,24.6],'dark');
 for(let i=0;i<5;i++)b('DR-400 removable inspection cover '+(i+1),'frame',[.62,.024,.7],[13.9,.012,25.3+i*.7],'steel');
 // Pipe-bearing saddles stay entirely inside the contained channel.
 const pipe=parts.find(p=>p.name==='A400 closed drain spool 4');
 for(const z of[25.15,26.55,27.75]){const y=-.35-(z-24.6)*.025;
  const pedestal=b('DR-400 channel saddle pedestal','frame',[.22,y+.595,.16],[13.9,(-.65+y-.055)/2,z],'steel');
  const saddle=band('DR-400 drain saddle','frame',.071,.054,.06,[13.9,y,z],'dark',[0,-.025,1]);
  s.join(base,pedestal,[13.9,-.65,z],'DR-400 saddle / channel base');
  s.join(pedestal,saddle,[13.9,y-.055,z],'DR-400 pedestal / saddle');
  if(pipe){s.load(pipe,'DR-400 closed drain on channel saddles');s.join(pipe,saddle,[13.9,y-.054,z],'DR-400 pipe / saddle');}
 }
 band('DR-400 sealed cleanout neck','pipe',.04,.035,.16,[13.9,.24,24.6],'steel');
 c('DR-400 cleanout blind cap','head',.065,.025,[13.9,.3325,24.6],'bright');
 for(const p of parts.slice(first)){p.drainChannel=true;p.designStatus='proposed';p.exploreRole='context';p.componentAssembly='DR-400-channel';}
 return structuredClone(d);
}

// The low drain crosses the pump-tray perimeter at X13.75. Model a shaped
// opening and a compressed annular seal, rather than intersecting a solid curb.
export function completeA400DrainPenetration(h,containment){
 const {T,parts,edges,band,setContext}=h,cell=containment.cells.find(c=>c.tag==='BND-401');
 const curb=parts.find(p=>p.name==='BND-401 continuous raised capture perimeter'&&Math.abs(p.position.x-13.75)<.01&&Math.abs(p.position.z-23.9)<p.scale.z/2);
 if(!curb)throw Error('A-400 containment penetration cannot find its perimeter');
 const x0=curb.position.x-curb.scale.x/2,x1=curb.position.x+curb.scale.x/2,z0=curb.position.z-curb.scale.z/2,z1=curb.position.z+curb.scale.z/2;
 const bottom=curb.position.y-curb.scale.y/2,top=curb.position.y+curb.scale.y/2,cy=.19875,cz=23.9,r=.075;
 const notch=Math.sqrt(r*r-(top-cy)**2),zs=[z0,...Array.from({length:25},(_,i)=>cz-notch+2*notch*i/24),z1].sort((a,b)=>a-b);
 const height=z=>Math.abs(z-cz)<notch+1e-8?Math.min(top,cy-Math.sqrt(Math.max(0,r*r-(z-cz)**2))):top,vertices=[];
 const quad=(a,b,c,d)=>vertices.push(...a,...b,...c,...a,...c,...d);
 for(let i=1;i<zs.length;i++){const a=zs[i-1],b=zs[i],ya=height(a),yb=height(b);
  quad([x0,bottom,a],[x0,bottom,b],[x0,yb,b],[x0,ya,a]);quad([x1,bottom,b],[x1,bottom,a],[x1,ya,a],[x1,yb,b]);
  quad([x0,ya,a],[x0,yb,b],[x1,yb,b],[x1,ya,a]);quad([x0,bottom,b],[x0,bottom,a],[x1,bottom,a],[x1,bottom,b]);
 }
 for(const z of[z0,z1])quad([x0,bottom,z],[x0,height(z),z],[x1,height(z),z],[x1,bottom,z]);
 for(let i=0;i<vertices.length;i+=3)for(let j=0;j<3;j++)vertices[i+j]=(vertices[i+j]-curb.position.getComponent(j))/curb.scale.getComponent(j);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.computeVertexNormals();curb.geometry=g;
 setContext(cell.id,'A-400 sealed containment penetration');
 const seal=band('BND-401 sealed closed-drain penetration','frame',r,.054,.12,[13.75,cy,cz],'dark',[1,0,0]);
 Object.assign(seal,{containmentCell:cell.key,containmentLayer:'capture',designStatus:'proposed',exploreRole:'context',sealedPenetration:true});
 cell.partIds.push(seal.id);containment.partIds.push(seal.id);
 const crossing=edges.filter(e=>e.name.startsWith('A400 closed drain')&&e.path.some(p=>p[0]>=13.62&&p[0]<=13.95&&Math.abs(p[2]-23.9)<.03));
 for(const e of crossing)e.matesBody=curb.id;
 seal.supportFor=crossing.map(e=>e.part);curb.sealedPenetration={tag:'SP-DR400',pipePartIds:crossing.map(e=>e.part),sealPartId:seal.id,liquidTightnessVerified:false};
 cell.penetrations=[...(cell.penetrations||[]),curb.sealedPenetration];
 return curb.sealedPenetration;
}
