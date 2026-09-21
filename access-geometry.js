import {AR_LAYOUT} from './argon-layout.js';
import {structuralKit} from './structural-kit.js';
// Remote indication does not alter a sensing tap, impulse line, relief path or valve.
export function buildAccessIndications(h,scenario){
 const {parts,b,setContext}=h,s=structuralKit(h),links=[],first=parts.length;
 const panels=[{tag:'A6000 supply indication panel',owner:117,owners:[117,118,119,120,121,122],x:52,z:45.2},{tag:'A600 local indication panel',owner:78,owners:[70,71,72,73,74,75,76,77,78],x:74.8,z:22.4},{tag:'A700 atmosphere indication panel',owner:90,owners:[79,80,81,82,83,84,85,86,87,88,89,90,91],x:89,z:30.5},{tag:'A800 atmosphere indication panel',owner:113,owners:[101,102,103,104,105,106,107,108,109,110,111,112,113,114,115,116],x:116.3,z:39.5}];
 if(scenario!=='baseline')panels.push({tag:'A160 local indication panel',owner:99,owners:[46,47,92,93,94,95,96,97,98,99,100],x:-6.5,z:-16});
 for(const panel of panels){
  const originals=parts.filter(p=>panel.owners.includes(p.reactor)&&/ display$/.test(p.name)&&p.position.y>1.7&&!Object.values(AR_LAYOUT.banks).some(bank=>bank.floor&&bank.owner===p.reactor&&Math.abs(p.position.z-bank.z-.249)<.02&&p.position.y-bank.floor>=1&&p.position.y-bank.floor<=1.7));if(!originals.length)continue;
  setContext(panel.owner,panel.tag);const body=b(panel.tag+' enclosure','valve',[1.3,1.25,.20],[panel.x,1.32,panel.z],'blue');
  const frame=s.boxFrame(body,panel.tag,{x:panel.x,z:panel.z,width:.95,depth:.16,bottom:.695});
  const pos=[panel.x,1.45,panel.z+.11],remote=b(panel.tag+' HMI display','valve',[.95,.55,.012],pos,'dial');remote.remoteSource=[];
  for(const original of originals){
   remote.remoteSource.push({partId:original.id,tag:original.name,point:original.position.toArray()});original.remoteDisplay={partId:remote.id,point:pos,panel:panel.tag};
   links.push({sourcePartId:original.id,displayPartId:remote.id,source:original.name,panel:panel.tag,connection:'Electrical indication / communications only; signal type and I/O HOLD',processTapMoved:false});
  }
 }
 const a400Hmi=parts.find(p=>p.name==='TFF-401 HMI display');
 if(a400Hmi){a400Hmi.remoteSource=[];for(const original of parts.filter(p=>[32,33,34,35,124].includes(p.reactor)&&p!==a400Hmi&&/ display$/.test(p.name)&&(/^(PT-|FI-401)/.test(p.name)||p.position.y>1.7))){a400Hmi.remoteSource.push({partId:original.id,tag:original.name,point:original.position.toArray()});original.remoteDisplay={partId:a400Hmi.id,point:a400Hmi.position.toArray(),panel:'TFF-401 HMI'};links.push({sourcePartId:original.id,displayPartId:a400Hmi.id,source:original.name,panel:'TFF-401 HMI',connection:'Electrical indication / communications only; signal type and I/O HOLD',processTapMoved:false});}}
 for(const p of parts.slice(first))p.designStatus='proposed';
 return {links,status:'Proposed remote indications; process instruments remain at their original measurement points'};
}

export function buildAccessPipeSupports(h){
 const {parts,edges,ring,setContext}=h,s=structuralKit(h),first=parts.length;
 function attach(x,y,z,axis,r,arm,label){const pipeEdge=edges.find(e=>e.path?.length===2&&e.path.every(p=>Math.abs(p[0]-x)<1e-6&&Math.abs(p[2]-z)<1e-6)&&Math.min(e.a[1],e.b[1])<y&&Math.max(e.a[1],e.b[1])>y);const clamp=ring(label+' clamp','frame',r+.01,.008,[x,y,z],'bright',axis);s.join(arm,clamp,[x,y,z+r+.01],label+' arm / clamp');if(pipeEdge){const pipe=parts.find(p=>p.id===pipeEdge.part);s.load(pipe,label);s.join(pipe,clamp,[x,y,z+r],label+' pipe / clamp');}}
 for(const [tag,cfg] of Object.entries(AR_LAYOUT.banks)){
  const radius=cfg.owner===89?.055:.035,level=cfg.floor+2.1,postXs=cfg.posts,back=cfg.z+.25;
  setContext(cfg.owner,tag+' compact manifold support');const cols=postXs.map(x=>s.column(x,back,Math.max(level,cfg.headerY)+.12,tag+' support',.10));const min=Math.min(...postXs,...cfg.branches)-.12,max=Math.max(...postXs,...cfg.branches)+.12,rail=s.beam([min,level,back],[max,level,back],.09,'Pipe support '+tag+' rail');for(const col of cols)s.join(col.post,rail,[col.x,level,back],tag+' rail / post');
  for(const x of cfg.branches){const arm=s.beam([x,level,back],[x,level,cfg.z],.065,'Pipe support '+tag+' saddle');s.join(rail,arm,[x,level,back],tag+' rail / saddle');attach(x,level,cfg.z,[0,1,0],radius,arm,tag+' branch '+x);}
 }
 // Cooling-water overhead spans use an existing utility-rack column and connected saddles.
 setContext(114,'PL-801 overhead cooling utility support');const post=parts.find(p=>p.name==='PL-801 utility rack column'&&Math.abs(p.position.x-103.3)<.01);
 if(post){const y=6.8,z=39,arm=s.beam([103.3,y,z],[105.5,y,z],.10,'Pipe support PL-801 cooling crossarm');s.join(post,arm,[103.3,y,z],'Cooling crossarm / existing rack');
  for(const x of [104.35,105.5]){const clamp=ring('PL-801 cooling-water clamp','frame',.055,.008,[x,y,z],'bright',[0,0,1]);s.join(arm,clamp,[x-.055,y,z],'Cooling crossarm / clamp');const e=edges.find(e=>e.path?.length===2&&e.path.every(p=>Math.abs(p[0]-x)<1e-6&&Math.abs(p[1]-y)<1e-6)&&Math.min(e.a[2],e.b[2])<z&&Math.max(e.a[2],e.b[2])>z);if(e){const pipe=parts.find(p=>p.id===e.part);s.load(pipe,'PL-801 cooling-water span');s.join(pipe,clamp,[x-.045,y,z],'Cooling-water pipe / saddle');}}
 }
 for(const p of parts.slice(first))p.designStatus='proposed';
}
