import {processKit} from './process-kit.js';
import {structuralKit} from './structural-kit.js';
import {A400_BASIS,VSEP_LAYOUT as D} from './a400-basis.js';
export const TFF_BASIS='Proposed eight-unit VSEP 84 package. Supplier envelope 11.315 × 5.464 m, maximum height 4.929 m; 84 inches is filter-pack height. Frame footprint 1.194 m square; 0.229 m gaps are not walkways. V17 screening: 62.208 m³/h available versus 71 m³/h required. Detailed connections, materials, vibration loads and capacity require vendor qualification.';
export function buildVSEP(h){
 const k=processKit(h),s=structuralKit(h),{parts,b,c,band,boltCircle,nozzle,line,passage,bulkValve,boundary,instrument,setContext}=k;
 const assemblies=[],drains=[],valveTags=[],L=(p,n,service='Retentate',r=.055)=>line(p,r,n,service),G=(a,z,tag)=>{bulkValve(a,z,.055,tag,tag+' isolation');valveTags.push(tag);};
 const x0=D.origin[0]+D.frameWidth/2,z=D.origin[2]+D.frameWidth/2,x1=x0+7*(D.frameWidth+D.frameGap),fz=22.6,rz=19.0,pz=22.5,dy=x=>.55-(x-x0)*.01;
 setContext(33,'TFF-401 supplier-scaled VSEP package');
 L([[14.7,1.35,fz],[x1+.4,1.35,fz]],'TFF-401 feed manifold passage');h.capped([x1+.4,1.35,fz],[1,0,0],.055,'TFF feed header end');
 L([[x0-.3,1.2,rz],[x1+.4,1.2,rz]],'TFF-401 retentate header');h.capped([x1+.4,1.2,rz],[1,0,0],.055,'TFF return header end');
 L([[x0-.3,1.0,pz],[x1+.9,1.0,pz]],'TFF-401 permeate header','Permeate');h.capped([x0-.3,1.0,pz],[-1,0,0],.055,'TFF permeate header end');
 L([[x0,dy(x0),21.6],[x1,dy(x1),21.6]],'TFF-401 branch drain header','Drain');h.capped([x0,dy(x0),21.6],[-1,.01,0],.055,'TFF drain header end');
 L([[x1,dy(x1),21.6],[26.3,.42,21.6],[26.3,.22,27.8]],'TFF-401 closed module drain','Drain');boundary('BL-TFF401-DRAIN',[26.3,.22,27.8],[0,-.2/6.2,1],.055,'Drain','Closed segregated collection below module drain header');
 for(let j=0;j<8;j++){
  const suffix=String.fromCharCode(65+j),tag='TFF-401'+suffix,x=x0+j*(D.frameWidth+D.frameGap),yb=2.65,yt=yb+D.packHeight;
  setContext(33,tag+' vibrating filter pack and independent frame');
  const deck=b(tag+' load-bearing frame plate','frame',[D.frameWidth,.10,D.frameWidth],[x,D.frameHeight-.05,z]);const framePosts=s.boxFrame(deck,tag,{x,z,width:D.frameWidth-.12,depth:D.frameWidth-.12,bottom:D.frameHeight-.1});
  const mount=c(tag+' isolation mounting seat','frame',.50,.125,[x,2.5875,z],'dark');s.join(deck,mount,[x,2.525,z],tag+' mounting seat');
  const shell=band(tag+' FRP filter-pack envelope','head',D.packRadius,D.packRadius-.03,D.packHeight,[x,(yb+yt)/2,z],'jacket');shell.cut=true;shell.screenBody={kind:'cylinder',position:[x,(yb+yt)/2,z],quaternion:[0,0,0,1],radius:D.packRadius,height:D.packHeight};s.load(shell,tag+' pack');s.join(mount,shell,[x+.475,yb,z],tag+' pack mounting');
  for(const y of[yb,yt]){band(tag+' bolted filter-pack endplate','head',.535,.07,.10,[x,y+.02,z]);boltCircle([x,y+.07,z],[0,1,0],.49,8,.55,tag+' closure fixing');}
  c(tag+' top connection cap','head',.16,.045,[x,D.height-.0225,z]);
  for(let q=0;q<18;q++){const plate=band(tag+' membrane tray '+(q+1),'internal',.445,.07,.015,[x,yb+.12+q*.11,z],'inner');plate.cut=true;}
  c(tag+' torsion spring shaft','pump',.07,1.65,[x,1.7,z],'dark');c(tag+' eccentric vibration drive','pump',.30,.3,[x,.8,z],'dark');c(tag+' 20 hp vibration motor envelope','pump',.19,.5,[x+.28,1.15,z],'blue');const driveRails=[];for(const xx of[x-.537,x+.537]){const rail=s.beam([xx,.6,z-.537],[xx,.6,z+.537],.1,tag+' drive support rail');for(const post of framePosts.filter(p=>Math.abs(p.x-xx)<.001))s.join(post.post,rail,[post.x,.6,post.z],tag+' drive rail bearing');driveRails.push(rail);}const cross=s.beam([x-.537,.6,z],[x+.537,.6,z],.1,tag+' vibration drive crossbeam');driveRails.forEach((rail,i)=>s.join(rail,cross,[x+(i?.537:-.537),.6,z],tag+' drive crossbeam bearing'));b(tag+' eccentric housing foot','frame',[.5,.05,.4],[x,.675,z]);b(tag+' motor mounting pedestal','frame',[.25,.2,.35],[x+.28,.75,z]);b(tag+' motor mounting plate','frame',[.50,.10,.45],[x+.28,.85,z]);
  const feed=nozzle([x,2.83,z+D.packRadius],[0,0,1],.20,tag+' feed',.055),ret=nozzle([x,yt-.16,z-D.packRadius],[0,0,-1],.16,tag+' retentate',.055),perm=nozzle([x+D.packRadius,yt-.35,z],[1,0,0],.16,tag+' permeate',.055);
  const feedRoot=[x,2.83,z+D.packRadius-.045];
  passage(shell,[feedRoot,[x,yt-.16,z],[x,yt-.16,z-D.packRadius+.045]],tag+' filter-pack retentate passage','Retentate',{transport:'membrane retentate'});passage(shell,[feedRoot,[x+D.packRadius-.045,yt-.35,z]],tag+' membrane permeation','Permeate',{transport:'membrane permeation'});
  setContext(33,tag+' accessible branch isolation and flexible connections');
  L([[x,1.35,fz],[x,1.35,22.3]],tag+' feed branch');G([x,1.35,22.3],[x,1.35,22.06],'XV-TFF-'+suffix+'-IN');L([[x,1.35,22.06],[x,1.35,21.6]],tag+' flexible feed connection');L([[x,1.35,21.6],[x,2.83,21.6],feed],tag+' flexible feed rise');
  L([ret,[x,ret[1],19.6],[x,1.2,19.6],[x,1.2,19.5]],tag+' flexible retentate connection');G([x,1.2,19.5],[x,1.2,19.26],'XV-TFF-'+suffix+'-RET');L([[x,1.2,19.26],[x,1.2,rz]],tag+' retentate header connection');
  L([perm,[x+.76,perm[1],z],[x+.76,perm[1],21.7],[x+.76,1.0,21.7],[x+.76,1.0,22.0]],tag+' flexible permeate connection','Permeate');G([x+.76,1.0,22.0],[x+.76,1.0,22.24],'XV-TFF-'+suffix+'-PERM');L([[x+.76,1.0,22.24],[x+.76,1.0,pz]],tag+' permeate header connection','Permeate');instrument('FI-401'+suffix,[x+.76,1.0,22.37],'permeate flow',[0,0,1]);
  L([[x,1.35,21.6],[x,1.15,21.6]],tag+' module drain takeoff','Drain');G([x,1.15,21.6],[x,.91,21.6],'XV-TFF-'+suffix+'-DR');L([[x,.91,21.6],[x,dy(x),21.6]],tag+' module drain connection','Drain');
  drains.push({tag:'XV-TFF-'+suffix+'-DR',source:tag+' feed low tee',takeoff:[x,1.35,21.6],route:tag+' module drain connection',points:[[x,1.35,21.6],[x,dy(x),21.6]],destination:'BL-TFF401-DRAIN',vent:'Depressurize; compatible gas admission and vendor internal drainability review required',kind:'external pipe geometry'});
  assemblies.push({tag,suffix,elements:null,filterPacks:1,feed,retentate:ret,permeate:perm,position:[x,5.15,z],frame:{width:D.frameWidth,height:D.frameHeight},packHeight:D.packHeight,valves:['IN','RET','PERM','DR'].map(a=>'XV-TFF-'+suffix+'-'+a)});
 }
 setContext(33,'TFF-401 closed header vent');L([[16.05,1.2,rz],[16.05,1.2,18.6],[16.05,1.7,18.6]],'TFF-401 high point vent','Vent');G([16.05,1.7,18.6],[16.05,1.94,18.6],'XV-TFF-VENT');L([[16.05,1.94,18.6],[16.05,5.3,18.6],[16.05,5.3,18]],'TFF-401 closed vent outlet','Vent');boundary('BL-TFF401-VENT',[16.05,5.3,18],[0,0,-1],.055,'Vent','Closed compatible depressurization collection; filter-pack vent sequence vendor HOLD');
 setContext(33,'P-401 VSEP feed-pump skid · proposed hydraulic arrangement');const skid=b('P-401 supplier feed-pump skid envelope','frame',[D.feedSkid.width,.12,D.feedSkid.depth],[D.feedSkid.x,.30,D.feedSkid.z]);s.boxFrame(skid,'P-401',{x:D.feedSkid.x,z:D.feedSkid.z,width:3.6,depth:1.8,bottom:.24});
 const pump=(x,z,tag)=>{const body=c(tag+' multistage casing','pump',.15,1.05,[x,.825,z]);c(tag+' motor','pump',.23,.45,[x,1.575,z],'blue');b(tag+' mounting foot','frame',[.48,.12,.42],[x,.30,z]);const inlet=nozzle([x-.15,.55,z],[-1,0,0],.18,tag+' suction',.055),outlet=nozzle([x+.15,.55,z],[1,0,0],.18,tag+' discharge',.055);passage(body,[[x-.105,.55,z],[x+.105,.55,z]],tag+' hydraulic passage','Retentate',{transport:'pump hydraulic passage'});return {inlet,outlet};};
 const pumpFeed=[16.3,.55,23.15],pumpOut=[19.7,1.8,23.2];L([pumpFeed,[16.3,.55,25.0]],'P-401 common suction header');h.capped([16.3,.55,25],[0,0,1],.055,'P-401 suction header end');L([pumpOut,[19.7,1.8,25]],'P-401 common discharge header');h.capped([19.7,1.8,25],[0,0,1],.055,'P-401 discharge header end');
 for(const [j,zz]of[23.65,24.65].entries()){const a=pump(17,zz,'P-401'+(j?'B':'A')+'1'),bb=pump(18.4,zz,'P-401'+(j?'B':'A')+'2');L([[16.3,.55,zz],a.inlet],'P-401 train '+j+' suction');L([a.outlet,bb.inlet],'P-401 train '+j+' interstage');L([bb.outlet,[19.1,.55,zz],[19.1,1.8,zz],[19.7,1.8,zz]],'P-401 train '+j+' discharge');}
 L([pumpOut,[19.7,1.8,22.9],[20.4,1.8,22.9],[20.4,1.8,fz],[20.4,1.35,fz]],'P-401 package discharge to membrane feed');
 const hmi=b('TFF-401 HMI cabinet','frame',[.65,.65,.25],[15.9,1.35,25.05],'blue');b('TFF-401 HMI display','valve',[.5,.35,.015],[15.9,1.42,25.184],'dark');const hmiPost=s.column(15.9,25.05,1.025,'TFF-401 HMI stand',.1);s.join(hmiPost.post,hmi,[15.9,1.025,25.05],'TFF-401 HMI bearing');
 for(const p of parts)if(p.reactor===33){p.designBasis=TFF_BASIS;p.designStatus='proposed';if(p.name.includes('flexible')&&p.system==='pipe'){p.material='dark';p.flexibleConnection=true;}}
 return {assemblies,drains,valveTags,boundaries:k.boundaries,basis:TFF_BASIS,membraneArea:null,ratedCapacity:null,supplier:D,inventoryBasis:A400_BASIS,feed:pumpFeed,retentate:[x0-.3,1.2,rz],permeate:[x1+.9,1.0,pz],cipFeed:[14.7,1.35,fz],cipReturn:[x0+.3,1.2,rz]};
}
