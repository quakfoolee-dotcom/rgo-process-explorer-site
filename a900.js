import {processKit} from './process-kit.js';
export function buildA900(h){
 const k=processKit(h),{T,EQUIPMENT,setContext,b,c,band,ring,line,passage,boundary,tank,boxShell,instrument}=k,service='Doped rGO';
 const source=h.doping.boundaries.find(x=>x.tag==='BL-A900');if(!source)throw Error('A-900 requires BL-A900');
 // Keep the A-800 handoff local. The sealed lift function is deliberately technology-neutral.
 setContext(200,'TR-901 short contained transfer function');const transferEnd=[111.55,4.45,29.2];
 line([source.point,[109.25,1.05,31.05],[109.7,3.9,29.2],transferEnd],.10,'A-900 short contained product transfer',service,'BL-A900','H-901',{transport:'powered bulk solids',technology:'HOLD'});
 const hopper=tank(201,{topPorts:false});setContext(201,'H-901 receipt and inerted surge');const inlet=hopper.port('contained product inlet',-.45,0,.10);
 line([transferEnd,inlet],.10,'TR-901 to H-901 receipt',service,'TR-901','H-901',{transport:'bulk solids'});instrument('WIT-901',[112.72,3.3,29.2],'inventory / weight indication',[1,0,0]);
 boundary('BL-A900-AR',[111.3,4.15,29.85],[-1,0,0],.035,'Argon','Reserved inerting supply; branch selection and demand unresolved');

 // Controlled solids metering runs south, directly into the reserved formation module.
 setContext(202,'F-901 controlled feeder');const feeder=band('F-901 sealed feeder casing','shell',.22,.16,2,[112,2.1,26.6],'steel',[0,0,1]);feeder.cut=true;c('F-901 metering screw','internal',.055,2,[112,2.1,26.6],'inner',[0,0,1]);c('F-901 drive motor','pump',.18,.48,[112,2.1,25.35],'blue',[0,0,1]);
 passage(feeder,[[112,2.1,27.6],[112,2.1,25.6]],'F-901 metered product passage',service,{transport:'powered solids transport'});line([hopper.bottom,[112,2.1,29.2],[112,2.1,27.6]],.10,'H-901 to F-901 feed',service,'H-901','F-901',{transport:'bulk solids'});

 setContext(203,'PG-901 contained pellet-formation module');boxShell('PG-901 containment enclosure',[2.5,3.4,2.4],[112,2.2,23.4]);const chamber=band('PG-901 process chamber','shell',.45,.38,1.75,[112,2.25,23.4],'steel');chamber.cut=true;passage(chamber,[[112,3.12,23.4],[112,1.38,23.4]],'PG-901 pellet-formation passage',service,{transport:'technology selection HOLD'});c('PG-901 drive envelope','pump',.28,.65,[113.0,2.25,23.4],'blue',[1,0,0]);
 line([[112,2.1,25.6],[112,3.55,24.45],[112,3.12,23.4]],.10,'F-901 to PG-901 contained feed',service,'F-901','PG-901',{transport:'bulk solids'});instrument('SIT-901',[112.65,2.8,24.1],'pellet formation condition',[1,0,0]);

 // Cooling and classification are functional reservations; no medium or acceptance limit is inferred.
 setContext(204,'SC-901 cooling and classification module');boxShell('SC-901 guarded enclosure',[2.4,2.6,2.3],[112,1.65,19.9]);const screen=band('SC-901 enclosed classifier screen','internal',.62,.54,.10,[112,1.55,19.9],'inner');const cooler=band('SC-901 cooling conveyor casing','shell',.24,.18,1.8,[112,2.1,20.15],'steel',[0,0,1]);cooler.cut=true;passage(cooler,[[112,2.1,21.05],[112,2.1,19.25]],'SC-901 cooling and classification passage','Formed pellets',{transport:'contained solids finishing'});
 line([[112,1.38,23.4],[112,2.1,21.05]],.09,'PG-901 formed product to SC-901','Formed pellets','PG-901','SC-901',{transport:'contained solids handling'});instrument('TIT-901',[112.7,2.25,19.25],'product cooling endpoint',[1,0,0]);

 setContext(205,'PK-901 product collection and packaging');boxShell('PK-901 contained collection enclosure',[2.4,2.8,2.2],[112,1.75,16.4]);const receiver=c('PK-901 product receiver','shell',.50,1.3,[112,1.0,16.4],'steel');ring('PK-901 receiver lid seal','head',.51,.018,[112,1.63,16.4],'gasket');passage(receiver,[[112,1.55,16.4],[112,.45,16.4]],'PK-901 accepted product passage','Accepted pellets',{transport:'contained collection'});
 line([[112,2.1,19.25],[112,1.55,16.4]],.08,'SC-901 accepted pellets to PK-901','Accepted pellets','SC-901','PK-901',{transport:'contained solids handling'});instrument('WIT-902',[112.7,1.35,16.9],'collected product weight',[1,0,0]);line([[112,.45,16.4],[112,.45,15.2]],.07,'PK-901 accepted product release','Packaged pellets','PK-901','BL-A900-PRODUCT',{transport:'contained package handling'});boundary('BL-A900-PRODUCT',[112,.45,15.2],[0,0,-1],.07,'Packaged pellets','Pellet and package acceptance criteria unresolved');

 setContext(206,'RB-901 reject and recovery');c('RB-901 sealed recovery receiver','shell',.48,1.15,[115,.75,19.9],'steel');ring('RB-901 lid seal','head',.49,.018,[115,1.34,19.9],'gasket');line([[112,1.45,19.9],[113.6,1.45,19.9],[115,.9,19.9]],.07,'SC-901 reject to RB-901','Off-size pellets / recoverable product','SC-901','RB-901',{transport:'contained reject handling'});boundary('BL-A900-REJECT',[115.55,.75,19.9],[1,0,0],.07,'Quarantined reject','Disposition and product recovery unresolved');

 setContext(207,'DC-901 local dust capture envelope');const filter=band('DC-901 filter housing','shell',.48,.40,1.55,[115,3.5,24],'steel');filter.cut=true;for(let y=3;y<=4;y+=.25)band('DC-901 filter element','internal',.33,.28,.06,[115,y,24],'inner');c('DC-901 extraction fan envelope','pump',.25,.55,[115,3.5,22.9],'blue',[0,0,1]);line([[112,3.8,24.6],[113.8,5.1,24],[115,4.28,24]],.09,'PG-901 local dust capture to DC-901','Powder-laden inert exhaust','PG-901','DC-901',{transport:'gas / entrained dust'});boundary('BL-A900-DUST',[115.55,3.5,24],[1,0,0],.09,'Filtered dust exhaust','Independent treatment destination unresolved');

 setContext(208,'CP-901 control and traceability panel');b('CP-901 panel enclosure','valve',[1.4,2,.45],[115,1.2,28.2],'blue');b('CP-901 operator display','valve',[.8,.55,.03],[114.74,1.45,28.2],'dial');
 // Provisional supports: member sizes, anchors and vibration isolation require vendor loads.
 function beam(name,a,d){const v=d.map((n,i)=>n-a[i]),length=Math.hypot(...v);c(name,'frame',.045,length,a.map((n,i)=>(n+d[i])/2),'steel',v.map(n=>n/length));}
 function skid(id,tag,x,z,width,depth,top,braced=false){
  setContext(id,tag+' provisional equipment supports');
  const xs=[x-width/2,x+width/2],zs=[z-depth/2,z+depth/2];
  for(const xx of xs)for(const zz of zs){
   b(tag+' support baseplate','frame',[.24,.06,.24],[xx,.03,zz],'steel');
   b(tag+' support leg','frame',[.10,top-.06,.10],[xx,(top+.06)/2,zz],'steel');
  }
  for(const xx of xs)b(tag+' skid longitudinal rail','frame',[.10,.10,depth+.10],[xx,top-.05,z],'steel');
  for(const zz of zs)b(tag+' skid crossmember','frame',[width+.10,.10,.10],[x,top-.05,zz],'steel');
  if(braced)for(const xx of xs){beam(tag+' side diagonal brace',[xx,.18,zs[0]],[xx,top-.10,zs[1]]);beam(tag+' side diagonal brace',[xx,.18,zs[1]],[xx,top-.10,zs[0]]);}
 }
 skid(203,'PG-901',112,23.4,2.2,2.1,.50);
 skid(204,'SC-901',112,19.9,2.1,2,.35);
 skid(205,'PK-901',112,16.4,2.1,1.9,.35);
 skid(202,'F-901',112,26.4,.9,2.6,1.80,true);
 for(const zz of [25.8,27.25]){b('F-901 saddle crossmember','frame',[1,.10,.18],[112,1.75,zz],'steel');b('F-901 casing bearing pad','frame',[.24,.08,.18],[112,1.84,zz],'steel');}
 b('F-901 motor pedestal','frame',[.4,.12,.5],[112,1.86,25.35],'steel');
 // Motor pedestal bridges to the front skid crossmember.
 b('F-901 motor mounting rail','frame',[.4,.10,.60],[112,1.75,25.35],'steel');
 skid(206,'RB-901',115,19.9,.65,.65,.175);
 b('RB-901 receiver support tray','frame',[1,.035,1],[115,.1575,19.9],'steel');
 skid(207,'DC-901',115,23.55,1.3,2.2,2.725,true);
 b('DC-901 filter bearing crossmember','frame',[1.4,.10,.4],[115,2.675,24],'steel');
 b('DC-901 fan mounting crossmember','frame',[1.4,.10,.4],[115,2.675,22.9],'steel');
 for(const xx of [114.8,115.2])b('DC-901 fan pedestal','frame',[.10,.525,.35],[xx,2.9875,22.9],'steel');
 b('DC-901 fan mounting plate','frame',[.6,.06,.55],[115,3.25,22.9],'steel');
 skid(208,'CP-901',115,28.2,1.15,.25,.20);
 b('CP-901 cabinet plinth','frame',[1.4,.14,.45],[115,.13,28.2],'steel');
 return {equipmentIds:[200,201,202,203,204,205,206,207,208],streams:k.streams,boundaries:k.boundaries,sourceBoundary:source};
}
