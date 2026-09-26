import {structuralKit} from './structural-kit.js';
import {processKit} from './process-kit.js';
import {buildF161Press} from './f161-press.js';

// REP-042 Option E on FEED-PE-CAL-026 bases G1–G7 (datasheets FEED-PE-DAT-067…071): F-161 stands on an operating deck over the
// D-164 agitated vacuum paddle dryer and discharges wet cake by gravity chute; TR-164 is deleted. The deck is at +4.4 m because the
// dryer's bottom discharge must clear the SC-167 screw inlet above grade. Geometry is indicative (holds J3–J9); the PFD-0160 MoC
// (hold J6) decides whether this arrangement replaces the baseline.
export const A160_ELEVATED={deck:4.4,deckMin:[-16.2,-21.0],deckMax:[-13.0,-14.7],pressOrigin:[-14.5,4.4,-19.7],pressPlateCentre:1.1,
 dryer:{x:-14.5,z:-17.99,y:1.88,r:.55,length:2.4},receiver:{x:-11.95,z:-13.9,r:.7,bottom:1.95,top:3.3},condenser:{x:-12.7,z:-23.7},
 bridge:{x:[-15.2,-13.95]},sources:['FEED-PE-DAT-067 V1.1','FEED-PE-DAT-068','FEED-PE-DAT-069','FEED-PE-DAT-070','FEED-PE-DAT-071','FEED-PE-CAL-026']};

export function buildA160Elevated(h,{holding,filtrateIn}){
 const k=processKit(h,.05),{T,edges,setContext,geo,add,c,b,band,boltCircle,nozzle,terminal,bulkValve,line,passage,boundary,closedConveyor,transferPump,instrument,tank}=k,sk=structuralKit(h);
 const V=p=>new T.Vector3(...p),Y=new T.Vector3(0,1,0),E=A160_ELEVATED,DK=E.deck,[dx0,dz0]=E.deckMin,[dx1,dz1]=E.deckMax;
 const valveTags=[],drains=[],controlLoops=[];
 const G=(a,z,r,tag)=>{bulkValve(a,z,r,tag,tag+' isolation');valveTags.push(tag);};
 const L=(points,label,service='Pre-G slurry',spec={})=>line(points,.05,label,service,null,null,spec);
 const S=(points,label,service='Pre-G solids')=>{const r=line(points,.07,label,service);for(const i of r.edgeIndices)edges[i].transport='bulk solids';return r;};
 const hollow=(name,sys,size,pos,mat='steel')=>{const g=geo(name+' hollow shell',()=>{const acc=[];for(let ax=0;ax<3;ax++)for(const sign of[-1,1]){if(ax===1)continue;const sz=[...size];sz[ax]=.02;const gg=new T.BoxGeometry(...sz).toNonIndexed(),off=[0,0,0];off[ax]=sign*(size[ax]-.02)/2;gg.translate(...off);acc.push(...gg.attributes.position.array);}const gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(acc,3));gg.computeVertexNormals();return gg;});const p=add(name,sys,g,pos,mat);p.cut=true;return p;};

 // ---- PL-161 operating deck: six columns, girders, grating panels around every penetration, guarding with the south stair gate.
 setContext(99,'PL-161 F-161 operating deck over D-164');
 const chuteHole=[-15.15,-19.58,-13.85,-16.40],feedAt=[-14.5,-20.3],filtrateAt=[-15.95,-20.1];
 const holes=[chuteHole,[feedAt[0]-.13,feedAt[1]-.13,feedAt[0]+.13,feedAt[1]+.13],[filtrateAt[0]-.13,filtrateAt[1]-.13,filtrateAt[0]+.13,filtrateAt[1]+.13]];
 let rects=[[dx0,dz0,dx1,dz1]];for(const [hx0,hz0,hx1,hz1] of holes){const next=[];for(const r of rects){const x0=Math.max(r[0],hx0),x1=Math.min(r[2],hx1),z0=Math.max(r[1],hz0),z1=Math.min(r[3],hz1);if(x0>=x1||z0>=z1){next.push(r);continue;}if(r[1]<z0)next.push([r[0],r[1],r[2],z0]);if(z1<r[3])next.push([r[0],z1,r[2],r[3]]);if(r[0]<x0)next.push([r[0],z0,x0,z1]);if(x1<r[2])next.push([x1,z0,r[2],z1]);}rects=next;}
 const colX=[dx0+.5,dx1-.13],colZ=[dz0+.13,-17.85,dz1-.13],cols=[];
 for(const x of colX)for(const z of colZ)cols.push(sk.column(x,z,DK-.27,'PL-161 deck',.20));
 const girders=colX.map(x=>{const g=sk.beam([x,DK-.15,dz0+.02],[x,DK-.15,dz1-.02],.24,'PL-161 longitudinal girder');for(const p of cols.filter(p=>p.x===x))sk.join(p.post,g,[x,DK-.27,p.z],'PL-161 girder / column');return g;});
 const trimmers=[chuteHole[0]-.08,chuteHole[2]+.08].map(x=>sk.beam([x,DK-.09,chuteHole[1]-.3],[x,DK-.09,chuteHole[3]+.3],.12,'PL-161 opening trimmer'));
 const crossZ=[dz0+.13,chuteHole[1]-.3,chuteHole[3]+.3,dz1-.13],cross=crossZ.map(z=>{const g=sk.beam([dx0+.02,DK-.09,z],[dx1-.02,DK-.09,z],.12,'PL-161 cross beam');for(const side of girders)sk.join(side,g,[side.position.x,DK-.09,z],'PL-161 cross beam / girder');for(const t of trimmers)if(z===chuteHole[1]-.3||z===chuteHole[3]+.3)sk.join(g,t,[t.position.x,DK-.09,z],'PL-161 trimmer / cross beam');return g;});
 const span=g=>{const h=g.scale.y/2,dz=Math.abs(new T.Vector3(0,1,0).applyQuaternion(g.quaternion).z)*h;return [g.position.z-dz,g.position.z+dz];};
 const panels=rects.map(([x0,z0,x1,z1])=>{const p=b('PL-161 deck grating','frame',[x1-x0,.03,z1-z0],[(x0+x1)/2,DK-.015,(z0+z1)/2]);for(const g of[...girders,...trimmers]){const [g0,g1]=span(g),a=Math.max(z0,g0),c=Math.min(z1,g1);if(g.position.x>x0-.01&&g.position.x<x1+.01&&c-a>.05)sk.join(g,p,[g.position.x,DK-.03,(a+c)/2],'PL-161 grating / girder');}for(const [i,z] of crossZ.entries())if(z>z0-.01&&z<z1+.01)sk.join(cross[i],p,[(x0+x1)/2,DK-.03,z],'PL-161 grating / cross beam');sk.load(p,'PL-161 deck grating');return {p,x0,z0,x1,z1};});
 // Adjacent grating panels are one deck: join them along each shared edge so the small strips between pipe openings carry load.
 for(const [i,a] of panels.entries())for(const c of panels.slice(i+1)){const ox=Math.min(a.x1,c.x1)-Math.max(a.x0,c.x0),oz=Math.min(a.z1,c.z1)-Math.max(a.z0,c.z0);if(ox>.05&&Math.abs(oz)<1e-6)sk.join(a.p,c.p,[(Math.max(a.x0,c.x0)+Math.min(a.x1,c.x1))/2,DK-.015,Math.max(a.z0,c.z0)],'PL-161 grating / grating');else if(oz>.05&&Math.abs(ox)<1e-6)sk.join(a.p,c.p,[Math.max(a.x0,c.x0),DK-.015,(Math.max(a.z0,c.z0)+Math.min(a.z1,c.z1))/2],'PL-161 grating / grating');}
 const panelAt=([x,,z])=>(panels.find(q=>x>=q.x0-1e-6&&x<=q.x1+1e-6&&z>=q.z0-1e-6&&z<=q.z1+1e-6)||panels[0]).p;
 const guardIds=[],edge=(a,z)=>{const len=V(z).distanceTo(V(a)),n=Math.max(1,Math.ceil(len/1.3)),alongX=Math.abs(a[0]-z[0])>.01,rails=[.535,1.07].map(dy=>sk.beam(V(a).addScaledVector(Y,dy).toArray(),V(z).addScaledVector(Y,dy).toArray(),.045,'PL-161 perimeter guardrail')),mid=V(a).add(V(z)).multiplyScalar(.5).addScaledVector(Y,.075),toe=b('PL-161 toe plate','frame',alongX?[len,.15,.025]:[.025,.15,len],mid.toArray());guardIds.push(toe.id,...rails.map(r=>r.id));
  for(let i=0;i<=n;i++){const at=V(a).lerp(V(z),i/n),post=sk.beam(at.toArray(),at.clone().addScaledVector(Y,1.07).toArray(),.045,'PL-161 guardrail post');guardIds.push(post.id);sk.join(panelAt(at.toArray()),post,at.toArray(),'PL-161 guard post / grating');sk.load(post,'PL-161 guardrail post');for(const [j,dy] of[.535,1.07].entries())sk.join(post,rails[j],at.clone().addScaledVector(Y,dy).toArray(),'PL-161 rail / post');sk.join(post,toe,at.clone().addScaledVector(Y,.075).toArray(),'PL-161 toe / post');}
  for(const r of rails)sk.load(r,'PL-161 guardrail');sk.load(toe,'PL-161 toeboard');};
 const [gx0,gx1]=E.bridge.x,e=.03;
 for(const [a,z] of[[[dx0+e,DK,dz0+e],[gx0,DK,dz0+e]],[[gx1,DK,dz0+e],[dx1-e,DK,dz0+e]],[[dx0+e,DK,dz1-e],[dx1-e,DK,dz1-e]],[[dx0+e,DK,dz0+e],[dx0+e,DK,dz1-e]],[[dx1-e,DK,dz0+e],[dx1-e,DK,dz1-e]]])edge(a,z);

 // ---- F-161 on the deck, fixed head to the south (feed, filtrate and wash nozzles face P-164 and T-163), axis north–south.
 setContext(46,'F-161 membrane filter press');
 const pr=buildF161Press(k,sk,{origin:E.pressOrigin,along:'z',pc:E.pressPlateCentre,support:'deck',onDeck:(plate,p)=>sk.join(panelAt(p),plate,p,'F-161 bearing plate / deck grating'),hpu:[4.125,1.15],panel:[-.75,-1.175,1],curtainU:[-.18,3.57],curtainV:1.0});
 const W=pr.W,PC=pr.PC,out=[0,0,-1],N=(name,v,y,r)=>nozzle(W(0,y,v),out,.20,'F-161 '+name,r);
 const n1=N('N1 slurry feed',0,PC,.057),n2=N('N2 filtrate outlet A',-.40,.72,.045),n3=N('N3 filtrate outlet B',.40,.72,.045),n4=N('N4 cake wash inlet',.40,1.48,.035);
 for(const [name,v,y] of[['N5 core blow outlet',-.40,1.48],['N6 membrane squeeze-water inlet',-.22,1.62],['N7 membrane squeeze-water drain',.22,.58]]){const p=N(name,v,y,.035);h.capped(p,out,.035,'F-161 '+name+' reserved (vendor, holds J2 / J9)');}
 const manifold=band('F-161 slurry manifold','pipe',.085,.055,pr.P1+.03,W((pr.P1+.03)/2,PC,0),'bright',pr.U),axis=(u)=>W(u,PC,0);
 passage(manifold,[axis(.045),axis(pr.P1)],'F-161 chamber feed passage','Pre-G slurry');terminal(axis(pr.P1),'F-161 closed feed manifold');
 const channels=b('F-161 fixed-head filtrate and wash channels','internal',pr.S([.10,1.0,1.0]),W(pr.TH/2,PC,0),'inner');
 passage(channels,[axis(.07),W(.045,.72,-.40)],'F-161 filtrate separation A','Filtrate',{transport:'filter medium permeation'});passage(channels,[axis(.09),W(.045,.72,.40)],'F-161 filtrate separation B','Filtrate',{transport:'filter medium permeation'});
 passage(channels,[W(.045,1.48,.40),axis(.11)],'F-161 cake wash distribution','RO water');
 // The two drip-tray leaves are the cake-discharge barrier: closed while filtering, opened to drop washed cake into the chute.
 for(const [i,leaf] of pr.trays.entries()){const s=i===0?-1:1;leaf.valveTag='GD-F161';leaf.closedQuaternion=leaf.quaternion.clone();leaf.closedPosition=leaf.position.clone();leaf.openQuaternion=new T.Quaternion().setFromAxisAngle(new T.Vector3(...pr.U),-s*1.35);leaf.openPosition=V(W((pr.P0+pr.T0)/2,PC-.9,s*.62));}
 h.valves.push({tag:'GD-F161',type:'equipment-gate',label:'F-161 drip trays (cake discharge)',reactor:46,partIds:pr.trays.map(p=>p.id)});valveTags.push('GD-F161');

 // ---- Cake chute through the deck to D-164 (PP-lined, with anti-bridging vibrators).
 setContext(46,'F-161 cake discharge chute to D-164');
 const d=E.dryer,cx=d.x,cz=d.z,topY=DK+.4,botY=3.16,spigotY=2.96,[u0,u1]=[pr.P0+.02,pr.T0-.05],half=.30;
 const chuteGeo=geo('F-161 elevated cake chute',()=>{const top=[[u0,-.6],[u1,-.6],[u1,.6],[u0,.6]].map(([u,v])=>V(W(u,.4,v)).sub(V([cx,DK,cz])).toArray()),bot=[[-half,-half],[half,-half],[half,half],[-half,half]].map(([dx,dz])=>[dx,botY-DK,dz]),pos=[];for(let i=0;i<4;i++){const j=(i+1)%4;pos.push(...top[i],...top[j],...bot[j],...top[i],...bot[j],...bot[i]);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.computeVertexNormals();return g;});
 const chute=add('F-161 cake discharge chute (PP-lined)','head',chuteGeo,[cx,DK,cz],'lining');chute.cut=true;
 for(const s of[-1,1])b('F-161 chute anti-bridging vibrator','pump',[.14,.16,.2],[cx+s*.52,3.75,cz],'blue');
 passage(chute,[[cx,topY,cz],[cx,botY,cz]],'F-161 cake release','Wet cake',{transport:'mechanical cake release',barrierTag:'GD-F161'});terminal([cx,topY,cz],'F-161 drip-tray discharge from the opened plate pack');
 const spigot=hollow('F-161 chute outlet spigot','head',[.62,botY-spigotY,.62],[cx,(botY+spigotY)/2,cz],'lining');passage(spigot,[[cx,botY,cz],[cx,spigotY,cz]],'F-161 cake chute to D-164','Wet cake',{transport:'bulk solids'});

 // ---- D-164 agitated vacuum paddle dryer (DAT-068): 2 m³ class trough, hollow heated shaft and paddles, tempered-water jacket.
 setContext(47,'D-164 agitated vacuum paddle dryer');
 const ZA=[0,0,1],z0=cz-d.length/2,z1=cz+d.length/2,top=d.y+d.r,bot=d.y-d.r;
 const shell=band('D-164 trough shell','shell',d.r,d.r-.02,d.length,[cx,d.y,cz],'steel',ZA);shell.cut=true;for(const z of[z0,z1])c('D-164 end plate','head',d.r,.04,[cx,d.y,z],'steel',ZA);
 const jacket=band('D-164 tempered-water jacket','shell',d.r+.05,d.r+.025,d.length-.2,[cx,d.y,cz],'jacket',ZA);jacket.cut=true;
 c('D-164 hollow heated shaft','internal',.08,d.length+.5,[cx,d.y,cz+.25],'inner',ZA);for(let i=0;i<8;i++)b('D-164 hollow heated paddle','internal',[.86,.05,.12],[cx,d.y,z0+.25+i*.27],'inner',new T.Quaternion().setFromAxisAngle(new T.Vector3(...ZA),i*Math.PI/4));
 b('D-164 agitator gearbox','pump',[.46,.46,.36],[cx,d.y,z1+.26],'blue');c('D-164 agitator drive motor','pump',.19,.46,[cx,d.y,z1+.67],'blue',ZA);sk.load(shell,'D-164 dryer');
 for(const zs of[z0+.35,z1-.55]){const saddle=b('D-164 support saddle','frame',[1.2,.18,.26],[cx,bot-.06,zs]);sk.join(shell,saddle,[cx,bot,zs],'D-164 shell / saddle');for(const s of[-1,1]){const post=sk.column(cx+s*.48,zs,bot-.15,'D-164 support',.14);sk.join(saddle,post.post,[cx+s*.48,bot-.15,zs],'D-164 saddle / column');}}
 const surf=dx=>d.y+Math.sqrt(d.r*d.r-dx*dx),inlet=nozzle([cx,top,cz],[0,1,0],.2,'D-164 material inlet',.22);
 G([cx,spigotY,cz],inlet,.22,'SDV-164-IN');
 const outZ=z1-.18,product=nozzle([cx,bot,outZ],[0,-1,0],.2,'D-164 dry product outlet',.07);
 passage(shell,[[cx,top-.045,cz],[cx,bot+.045,outZ]],'D-164 contained product inventory','Pre-G solids',{transport:'batch solids inventory',internalTo:47});
 const domeZ=z0+.24,dome=band('D-164 vapour dome filter housing','shell',.24,.215,.55,[cx,top+.225,domeZ],'steel');dome.cut=true;c('D-164 dome filter cover','head',.26,.04,[cx,top+.52,domeZ]);
 passage(shell,[[cx,top-.045,cz],[cx,top-.045,domeZ]],'D-164 vapour headspace','Vapor',{internalTo:47});passage(dome,[[cx,top-.045,domeZ],[cx,top+.495,domeZ]],'D-164 dome filtration','Vapor',{internalTo:47});
 const vap=nozzle([cx,top+.54,domeZ],[0,1,0],.2,'D-164 vapor outlet',.05);
 // Equalization and relief sit at the north end, clear of the chute walls above.
 const eqX=cx+.28,eqZ=z1-.35,eq=nozzle([eqX,surf(.28),eqZ],[0,1,0],.2,'D-164 equalization inlet',.035),eqV=[eqX,eq[1]+.33,eqZ],eqB=[eqX,eq[1]+.7,eqZ];
 G(eq,eqV,.035,'XV-EQ164');line([eqB,eqV],.035,'D-164 equalization source','Equalization gas',null,null,{0:{type:'check',label:'NRV-164-EQ gas backflow protection'}});boundary('BL-EQ164',eqB,[0,1,0],.035,'Equalization gas','Compatible inert gas (nitrogen or argon, hold J8); vacuum isolation precedes equalization');
 const rl=nozzle([cx-.28,surf(.28),eqZ],[0,1,0],.2,'D-164 independent relief',.035),rlEnd=[cx-.28,rl[1]+.45,eqZ];line([rl,rlEnd],.035,'PSV-164 unrestricted relief connection','Relief');band('PSV-164 relief body','valve',.09,.035,.20,[cx-.28,rl[1]+.3,eqZ]);boundary('BL-164-REL',rlEnd,[0,1,0],.035,'Relief','Dedicated compatible relief disposal; sizing and settings unqualified (DAT-068 4.1)');
 // Jacket thermal circuit (west side), separate from the product: tempered water ≤ 70 °C from A-5100 via a local tempering loop.
 setContext(47,'D-164 jacket thermal circuit');
 const js=nozzle([cx-d.r-.05,d.y-.3,z0+.3],[-1,0,0],.2,'D-164 jacket inlet',.035),jr=nozzle([cx-d.r-.05,d.y+.3,z1-.3],[-1,0,0],.2,'D-164 jacket return',.035);
 passage(jacket,[[cx-d.r-.005,d.y-.3,z0+.3],[cx-d.r-.005,d.y+.3,z1-.3]],'D-164 jacket thermal passage','Thermal utility',{internalTo:47});
 const jsV=[js[0]-.1,js[1],js[2]],jsB=[js[0]-.43,js[1],js[2]];line([js,jsV],.035,'D-164 jacket supply connection','Thermal utility');G(jsV,jsB,.035,'TCV-164');boundary('BL-TH164-SUP',jsB,[-1,0,0],.035,'Thermal SUP','A-5100 tempered hot water ≤ 70 °C via a local tempering loop (DAT-068 3.3; loop not modeled)');
 const jrV=[jr[0]-.1,jr[1],jr[2]],jrB=[jr[0]-.43,jr[1],jr[2]];line([jr,jrV],.035,'D-164 jacket return connection','Thermal utility');G(jrV,jrB,.035,'XV-HR164');boundary('BL-TH164-RET',jrB,[-1,0,0],.035,'Thermal RET','A-5100 tempered hot-water return');
 setContext(47,'D-164 instrumentation');
 for(const [tag,kind,y,z] of[['TT-164','temperature',d.y,cz-.6],['PT-164','pressure',d.y+.25,cz+.5]]){const tip=nozzle([cx+Math.sqrt(d.r*d.r-(y-d.y)**2)+.05,y,z],[1,0,0],.18,'D-164 '+tag+' tap',.025);instrument(tag,tip,kind,[1,0,0]);terminal(tip,tag+' sealed measurement');}
 controlLoops.push({tag:'TIC-164',measurement:'TT-164',finalElement:'TCV-164',duty:'D-164 product temperature ≤ 60 °C (DAT-068 2.4)',limits:null});

 // ---- VP-164 / KO-164 (DAT-069) south of the deck: surface condenser, 0.4 m³ condensate receiver, dry screw vacuum pump.
 setContext(53,'KO-164 dryer vapour condenser');
 const cd=E.condenser,cdLo=2.35,cdHi=3.85,cond=band('KO-164 condenser shell','shell',.225,.2,cdHi-cdLo,[cd.x,(cdLo+cdHi)/2,cd.z]);cond.cut=true;
 for(const y of[cdLo,cdHi]){band('KO-164 condenser tube sheet','head',.25,.04,.05,[cd.x,y,cd.z]);boltCircle([cd.x,y,cd.z],[0,1,0],.23,8,.5,'KO-164 condenser closure bolt');}
 for(const [dx,dz] of[[-.09,-.06],[.09,-.06],[0,.09]])band('KO-164 condenser tube','internal',.03,.024,cdHi-cdLo-.06,[cd.x+dx,(cdLo+cdHi)/2,cd.z+dz]);
 const ci=nozzle([cd.x,cdHi+.025,cd.z],[0,1,0],.2,'KO-164 condenser vapour inlet',.05),co=nozzle([cd.x,cdLo-.025,cd.z],[0,-1,0],.2,'KO-164 condenser condensate outlet',.05);
 passage(cond,[[cd.x,cdHi-.02,cd.z],[cd.x,cdLo+.02,cd.z]],'KO-164 condensation passage','Vapor / condensate',{internalTo:53});
 sk.verticalSupport(cond,'KO-164 condenser',{x:cd.x,z:cd.z,r:.225,y:(cdLo+cdHi)/2,back:cd.z+.7});
 const vt=[vap[0],vap[1]+.33,vap[2]];G(vap,vt,.05,'XV-VAC164');
 L([vt,[cx,3.75,domeZ],[-13.5,3.75,domeZ],[-13.5,3.75,-21.7],[cd.x,3.75,-21.7],[cd.x,4.3,-21.7],[cd.x,4.3,cd.z],ci],'D-164 vapor to KO-164','Vapor');
 setContext(53,'KO-164 condenser cooling utility');
 const cs=nozzle([cd.x,cdLo+.2,cd.z+.225],[0,0,1],.18,'KO-164 condenser cooling inlet',.035),cr=nozzle([cd.x,cdHi-.2,cd.z+.225],[0,0,1],.18,'KO-164 condenser cooling outlet',.035);
 passage(cond,[[cd.x,cdLo+.2,cd.z+.2],[cd.x,cdHi-.2,cd.z+.2]],'KO-164 condenser cooling passage','Cooling water',{internalTo:53});
 for(const [p,tag,svc] of[[cs,'XV-CS164','Cooling supply'],[cr,'XV-CR164','Cooling return']]){const at=[p[0],p[1],p[2]+.12],end=[at[0],at[1],at[2]+.33];line([p,at],.035,tag+' connection',svc);G(at,end,.035,tag);boundary('BL-'+tag.slice(3),end,[0,0,1],.035,svc,'A-5200 cooling water 32 / 37 °C (DAT-069 3.3; hold J5)');}
 setContext(53,'KO-164 vacuum condensate receiver');const ko=tank(53),ki=ko.port('condensate inlet',0,.2);
 L([co,[cd.x,co[1],ki[2]],ki],'KO-164 condensate to receiver','Condensate');
 const kge=h.EQUIPMENT[53],gas=nozzle([kge.x+kge.radius,kge.top-.2,kge.z],[1,0,0],.2,'KO-164 noncondensable outlet',.05);
 const koInner=c('KO-164 internal pressure boundary','internal',kge.radius-.02,kge.top-kge.bottom+.12,[kge.x,(kge.top+kge.bottom)/2+.06,kge.z],'inner');koInner.cut=true;
 passage(koInner,[[ki[0],ki[1]-.245,ki[2]],[kge.x+kge.radius-.045,kge.top-.2,kge.z]],'KO-164 receiver headspace','Vapor',{internalTo:53});
 const vpX=-11.9,vpZ=-26.3;setContext(53,'VP-164 dry screw vacuum pump');const vp=transferPump(vpX,'VP-164','Dry screw vacuum pump 150 m³/h (DAT-069 3.4)',{z:vpZ});
 L([gas,[vpX,gas[1],gas[2]],[vpX,gas[1],vpZ+.8],[vpX,.8,vpZ+.8],vp.inlet],'KO-164 to VP-164','Vapor');
 L([vp.outlet,[vpX,2.0,vpZ],[vpX,2.0,vpZ-.7]],'VP-164 closed exhaust','Vapor');boundary('BL-VAC164',[vpX,2.0,vpZ-.7],[0,0,-1],.05,'Vapor','A-3000 compatible off-gas treatment interface');
 setContext(53,'KO-164 isolated condensate emptying');const kb=ko.bottom,kv=[kb[0],kb[1]-.3,kb[2]];G(kb,kv,.05,'XV-COND164');const drainPoints=[kv,[kv[0],kv[1],kv[2]-.6]];L(drainPoints,'KO-164 low-point condensate drain','Condensate');boundary('BL-COND164',drainPoints.at(-1),[0,0,-1],.05,'Condensate','Closed condensate collection to T-163 / A-1000 (DAT-069 3.5); isolate vacuum and equalize the receiver first');
 drains.push({tag:'XV-COND164',source:'KO-164 bottom outlet',takeoff:kb,points:[kb,...drainPoints],route:'KO-164 low-point condensate drain',vent:'KO-164 controlled gas admission after isolation'});
 const adm=ko.vent,admE=[adm[0],adm[1]+.33,adm[2]];G(adm,admE,.035,'XV-KOEQ164');boundary('BL-KOEQ164',admE,[0,1,0],.035,'Equalization gas','Compatible gas admission through the receiver roof; isolate the condenser / receiver before admission');

 // ---- Dry product: D-164 → SC-167 screw → H-164 receiver (DAT-070) → rotary feeder → existing EL-164 / SC-164 (DAT-071).
 setContext(47,'D-164 dry discharge isolation');const pv=[cx,product[1]-.33,outZ];G(product,pv,.07,'SDV-164-OUT');
 const R=E.receiver,rTop=R.top,inEnd=[R.x,rTop+.2,R.z];
 let a=[cx,.24,outZ],zEnd=[R.x,4.0,R.z];for(let it=0;it<6;it++){const dir=V(zEnd).sub(V(a)).normalize(),ip=V(a).addScaledVector(dir,.3).addScaledVector(Y,.15),op=V(zEnd).addScaledVector(dir,-.3).addScaledVector(Y,-.15);a=[a[0]+cx-ip.x,a[1],a[2]+outZ-ip.z];zEnd=[zEnd[0]+R.x-op.x,zEnd[1]+(inEnd[1]+.22)-(op.y-.10),zEnd[2]+R.z-op.z];}
 const screw=closedConveyor(49,'SC-167',a,zEnd,.15);
 setContext(49,'SC-167 dryer discharge screw');S([pv,screw.inPort],'D-164 dry discharge to SC-167');sk.conveyor(screw,'SC-167',{side:-1,offset:.62});
 setContext(49,'H-164 dry Pre-G receiver');
 const rg=geo('H-164 elevated-option receiver',()=>new T.LatheGeometry([[.07,R.bottom],[R.r,R.bottom+.6],[R.r,rTop],[.07,rTop+.08],[.07,rTop+.055],[R.r-.02,rTop-.02],[R.r-.02,R.bottom+.6],[.055,R.bottom+.015],[.07,R.bottom]].map(p=>new T.Vector2(...p)),32));
 const receiver=add('H-164 dry Pre-G receiver shell','shell',rg,[R.x,0,R.z],'steel');receiver.cut=true;
 const rin=nozzle([R.x,rTop+.08,R.z],[0,1,0],.12,'H-164 receiving inlet',.07);S([screw.outPort,rin],'A-160 dried product to H-164');
 passage(receiver,[[R.x,rTop+.035,R.z],[R.x,R.bottom+.045,R.z]],'H-164 gravity receiving passage','Pre-G solids',{transport:'bulk solids'});
 const rvent=nozzle([R.x+.4,rTop-.02+.1*(1-.4/R.r),R.z],[0,1,0],.15,'H-164 vent filter connection',.05);boundary('BL-H164-VENT',rvent,[0,1,0],.05,'Dust vent','H-164 vent filter to a contained dust collection interface (DAT-070 4.3; hold J8)');
 const rout=nozzle([R.x,R.bottom,R.z],[0,-1,0],.15,'H-164 discharge',.07),rv=[R.x,1.55,R.z];G(rout,rv,.07,'RV-164');S([rv,[-11.4,1.55,-13.9]],'H-164 rotary feeder discharge');
 sk.verticalSupport(receiver,'H-164 dry receiver',{x:R.x,z:R.z,r:R.r,y:rTop-.3,back:R.z+1.05,span:1.0});

 // ---- P-164 and the T-162 → F-161 feed, filtrate return to T-163 and the RO wash supply.
 setContext(98,'P-164 A-160 filtration feed');const pump=transferPump(-17,'P-164','Pre-G slurry',{z:-22});
 L([holding.bottom,[-19,.3,-20],[-19,.3,-21.05]],'T-162 press product outlet');G([-19,.3,-21.05],[-19,.3,-21.38],.05,'XV-PRESS162');L([[-19,.3,-21.38],[-19,.3,-23],[-16.3,.3,-23],[-16.3,.3,-21],[-17,.3,-21],[-17,.8,-21],pump.inlet],'P-164 holding suction');
 setContext(46,'F-161 feed, filtrate and wash connections');
 const fx=feedAt[0],fz=feedAt[1];L([pump.outlet,[-17,3.8,-22],[-17,3.8,fz],[fx,3.8,fz],[fx,DK+.3,fz]],'P-164 filter press feed');G([fx,DK+.3,fz],[fx,DK+.63,fz],.05,'XV-F161');L([[fx,DK+.63,fz],[fx,n1[1],fz],n1],'F-161 inlet connection');
 const hz=-20.1,hy=DK+.22,[flx,flz]=filtrateAt;L([n2,[n2[0],n2[1],hz],[n2[0],hy,hz],[flx,hy,hz],[flx,3.9,flz]],'F-161 filtrate header','Filtrate');L([n3,[n3[0],n3[1],hz],[n3[0],hy,hz]],'F-161 filtrate outlet B','Filtrate');
 G([flx,3.9,flz],[flx,3.57,flz],.05,'XV-FIL161');L([[flx,3.57,flz],[flx,3.57,-21.6],[-18.55,3.57,-21.6],[-18.55,3.57,-25.5],filtrateIn],'F-161 filtrate to T-163','Filtrate');
 const wash=boundary('BL-RO-F161',[-16.45,DK+1.9,hz],[-1,0,0],.05,'RO water','Filter press displacement washing supply (DAT-067 2.8; hold J1)');
 line([wash,[-15.6,DK+1.9,hz]],.05,'F-161 RO washing supply','RO water','Dedicated wash supply','Filter chambers',{0:{type:'check',label:'NRV-W161 wash backflow protection'}});G([-15.6,DK+1.9,hz],[-15.27,DK+1.9,hz],.05,'XV-WASH161');L([[-15.27,DK+1.9,hz],[n4[0],DK+1.9,hz],[n4[0],n4[1],hz],n4],'F-161 wash inlet tie','RO water');

 // ---- Operating states: filtration, washing, gravity cake discharge, drying, cooling, equalization, unloading, condensate emptying.
 const op=(label,open,seed,extra=[],requires=['capacity','pressure','drive'],drives=[],heater=false)=>({label,open,seed,extra,requires,drives,heater});
 const vacuum=['XV-VAC164','XV-CS164','XV-CR164'],vapor='D-164 vapor to KO-164',productFlow='A-160 dried product to H-164';
 const states={
  press:op('P-164 → F-161 filtration · drip trays closed',['XV-PRESS162','XV-F161','XV-FIL161'],'T-162 press product outlet',[],['capacity','pressure','drive'],['P-164']),
  presswash:op('F-161 displacement wash · feed isolated',['XV-WASH161','XV-FIL161'],'F-161 RO washing supply',[],['capacity','pressure']),
  load:op('Washed cake → chute → D-164 · dryer at atmosphere',['GD-F161','SDV-164-IN'],'F-161 cake release',[],['endpoint','pressure','capacity']),
  dry:op('D-164 vacuum drying · solids isolated',[...vacuum,'TCV-164','XV-HR164'],vapor,['D-164 jacket supply connection','XV-CS164 connection'],['capacity','pressure','temperature','cooling','exhaust','drive','design'],['D-164 agitator','VP-164'],true),
  cool:op('D-164 cooling · heat off, vacuum held',vacuum,vapor,['XV-CS164 connection'],['pressure','cooling','exhaust','drive'],['D-164 agitator','VP-164']),
  equalize:op('Equalize D-164 · heat and vacuum isolated',['XV-EQ164'],'D-164 equalization source',[],['temperature','pressure']),
  unload:op('Dry Pre-G → H-164 → selected A-200 hopper',['SDV-164-OUT','RV-164','XV-PGLOAD-{d}'],'D-164 contained product inventory',[],['endpoint','temperature','pressure','capacity','drive'],['D-164 agitator','SC-167','EL-164','SC-164']),
  condensate:op('Empty isolated, equalized KO-164',['XV-KOEQ164','XV-COND164'],'KO-164 low-point condensate drain',[],['pressure','capacity'])
 };
 return {design:'elevated',dryerTag:'D-164',equipment:[46,47,49,53,98,99],valveTags,states,drains,controlLoops,streams:k.streams,boundaries:k.boundaries,deck:{tag:'PL-161',panelIds:panels.map(q=>q.p.id),southPanel:panelAt([(gx0+gx1)/2,DK,dz0+.05]).id,guardIds,min:[dx0,DK,dz0],max:[dx1,DK,dz1],gate:[gx0,gx1]},
  pressRoutes:['T-162 press product outlet','F-161 filtrate to T-163','F-161 RO washing supply','F-161 cake release','F-161 cake chute to D-164'],dryRoutes:[vapor,'KO-164 condensate to receiver','KO-164 to VP-164',productFlow,'H-164 rotary feeder discharge'],
  checks:['F-161 stands on PL-161 at +4.4 m over D-164; washed cake drops through the drip trays and a PP-lined chute into D-164 (TR-164 deleted).','Feed, filtrate and wash nozzles are on the south fixed head; the filtrate returns to T-163 and never enters the cake route.','D-164 dries under vacuum with the chute and discharge valves closed; vapour passes the dome filter to the KO-164 condenser, receiver and VP-164.','Dried Pre-G leaves by SC-167 into H-164 and the existing EL-164 / SC-164 distribution; release requires moisture endpoint, cooling and equalization.','Jacket tempered water and condenser cooling water are separate circuits from the product.','Deck level, chute angle and equipment envelopes are indicative (holds J3–J9); the PFD-0160 MoC (hold J6) is open.']};
}
