// Proposed R-201 mechanical arrangement. Metres; no vendor rating or operating setpoint.
import {REACTOR_MAINTENANCE_BASIS} from './reactor-maintenance.js';
export const REACTOR_MECHANICAL_BASIS={
 revision:'R201-mechanical-62',status:'Top-entry agitator and central flush-bottom outlet — conceptual; ratings unverified',
 maintenanceReview:REACTOR_MAINTENANCE_BASIS,
 scope:['R-201A','R-201B','R-201C','R-201D'],
 arrangement:'Top-entry agitator with an offset motor/gearbox clear of the Pre-G feeder, on a reinforced removable cover; separate recirculation suction; central flush-bottom outlet with separately isolated product and cleaning-waste branches.',
 drainage:'The central seat meets the inner head low point. A lowering poppet opens into a side-discharge chamber; the actuator remains below the chamber, outside the liquid path. Downstream drain routing falls to the existing closed-drain interface. Residual heel, valve internals and cleanability require vendor confirmation.',
 controls:'XV-BOT201 opens only for the selected reactor in illustrated collection or cleaning states. XV-COL and XV-DR201 select mutually exclusive destinations. This is an inspection simulation, not a commissioned interlock or safety system.',
 maintenance:'Removable drive/cover requires shutdown, isolation and a qualified lifting procedure. The split impellers require a qualified disassembly sequence before shaft withdrawal through the smaller cover neck. Elevated access, service disconnects and lifting remain HOLD; screening envelopes are illustrative.',
 holds:['Mixing duty, viscosity, solids, shaft bending/critical speed, impeller clearance, motor power and speed','Seal, valve, gasket and wetted-material compatibility with the qualified process and cleaning chemistry','Pressure-boundary reinforcement, drive torque and weight, nozzle loads and applicable BC pressure-equipment registration','Valve drainability, dead legs, pump NPSH, line sizing, cleaning of recirculation and transfer piping','Elevated maintenance access, shaft withdrawal envelope, lifting plan and head-service disconnect sequence','P&ID / cause-and-effect update, valve fail positions and independent engineering review'],
 sources:['https://www.ekato.com/products/agitators/reactor-agitators-ekato-hwl-n/','https://schuf.de/disc-bottom-outlet-valves/','https://www.technicalsafetybc.ca/technologies/boilers-pressure-vessels/boiler-pressure-vessel-design-registration','https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-12-tools-machinery-and-equipment']
};
export const R201_DRAIN_SEAT_Y=2.055-.37*Math.sqrt(1-(.065/1.055)**2);

export function buildTopDrive(h){
 const {T,b,c,band,ring,boltCircle,route,terminal,parts,edges,reactor}=h,first=parts.length,mat=reactor===2?'green':'blue';
 band('Agitator cover reinforcement','head',.28,.07,.075,[0,5.0725,0],'bright');
 band('Top-entry seal chamber','pump',.15,.052,.25,[0,5.235,0],'bright');
 ring('Top seal static gasket','pump',.121,.012,[0,5.115,0],'gasket');
 boltCircle([0,5.12,0],[0,1,0],.21,8,.7,'Top drive mount');
 band('Agitator lantern mounting flange','pump',.265,.052,.045,[0,5.3825,0],'bright');
 band('Complete coupling guard','pump',.235,.213,.26,[0,5.535,0],'dark');
 c('Guarded drive coupling','pump',.085,.20,[0,5.54,0],'bright');
 c('Gearbox output shaft','pump',.055,.19,[0,5.735,0],'bright');
 b('Top-entry gearbox','pump',[1.18,.25,.42],[-.375,5.79,0],'dark');
 c('Top agitator motor housing','pump',.175,.43,[-.75,6.155,0],mat);
 c('Top motor mounting flange','pump',.20,.055,[-.75,5.935,0],mat);
 c('Top motor end cover','pump',.185,.055,[-.75,6.3925,0],'dark');
 for(let k=0;k<20;k++){const a=k*Math.PI/10;b('Top motor cooling fin','pump',[.024,.34,.037],[-.75+Math.sin(a)*.18,6.155,Math.cos(a)*.18],mat,new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),a));}
 boltCircle([-.75,5.935,0],[0,1,0],.157,6,.55,'Top motor fastener');
 const terminalBox=b('Top motor terminal box','pump',[.16,.14,.11],[-.75,6.155,.205],mat);
 // Electrical service follows the vessel side, clear of the reagent and vent nozzles.
 const cableStart=edges.length;route([[-.75,6.155,.26],[-.75,6.155,1.12],[1.035,6.155,1.12],[1.035,5.5,1.12],[1.35,4.75,.92],[1.35,.48,.92],[1.035,.32,.265]],.018,'Top agitator cable conduit');
 edges[cableStart].matesBody=terminalBox.id;terminal([-.75,6.155,.26],'Top motor cable entry');terminal([1.035,.32,.265],'Skid cable entry');
 for(const p of parts.slice(first)){p.exploreRole='equipment';p.designBasis=REACTOR_MECHANICAL_BASIS.status;}
}

export function buildCentralOutlet(h){
 const {T,add,c,band,ring,boltCircle,tube,edge,terminal,clamp,world,parts,edges,ports,valves,reactor,tag}=h,first=parts.length;
 const floor=1.29-.055*.78,bodyBottom=floor-.015,sideHeight=1.595-bodyBottom,sideCentre=(1.595+bodyBottom)/2;
 const seat=R201_DRAIN_SEAT_Y,entry=[0,1.61,0],exit=[0,1.29,.145],outlet=[0,1.29,.36],valveTag='XV-BOT201-'+tag.at(-1);
 // Head skins end at the throat. Neither the cover nor the lower head closes this bore.
 const neck=band('Product transfer outlet neck','pipe',.08,.065,seat-1.61,[0,(seat+1.61)/2,0],'bright');
 edge([0,seat,0],entry,'Product transfer outlet neck',neck);terminal([0,seat,0],'Central outlet vessel inventory');
 band('Flush-bottom welded reinforcing boss','head',.13,.08,.045,[0,1.6325,0],'bright');
 band('Flush-bottom seat ring','valve',.085,.065,.012,[0,seat-.006,0],'bright');
 // Cavity floor meets the side-discharge bore invert; no geometric sump below the outlet.
 // Closed shell with real entry, side-discharge and sealed-stem openings.
 // Plate construction illustrates the flow cavity; vendor body geometry/rating remains unselected.
 const plate=(name,w,hh,pos,q,hole)=>{const s=new T.Shape();s.moveTo(-w/2,-hh/2);s.lineTo(w/2,-hh/2);s.lineTo(w/2,hh/2);s.lineTo(-w/2,hh/2);s.closePath();if(hole){const p=new T.Path();p.absarc(hole[0],hole[1],hole[2],0,Math.PI*2,true);s.holes.push(p);}const g=new T.ExtrudeGeometry(s,{depth:.015,bevelEnabled:false,curveSegments:32});g.translate(0,0,-.0075);return add(name,'valve',g,pos,'bright',q);};
 const qx=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2),qy=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2),identity=new T.Quaternion();
 plate('Flush-bottom chamber top',.29,.29,[0,1.6025,0],qx,[0,0,.065]);
 plate('Flush-bottom chamber bonnet',.29,.29,[0,floor-.0075,0],qx,[0,0,.018]);
 for(const x of [-.1375,.1375])plate('Flush-bottom chamber side',.29,sideHeight,[x,sideCentre,0],qy);
 plate('Flush-bottom chamber back',.29,sideHeight,[0,sideCentre,-.1375],identity);
 const body=plate('Flush-bottom chamber outlet face',.29,sideHeight,[0,sideCentre,.1375],identity,[0,1.29-sideCentre,.055]);
 body.conduitRadius=.065;body.centerline=[world(entry),world([0,1.48,0]),world([0,1.29,0]),world(exit)];
 edge(entry,exit,tag+' central flush-bottom valve',body);Object.assign(edges.at(-1),{barrierTag:valveTag,path:body.centerline,transport:'equipment passage',screenAsPipe:false});
 const poppet=c('Flush-bottom lowering poppet','internal',.064,.016,[0,seat-.008,0],'inner');
 const stem=c('Flush-bottom poppet stem','internal',.015,.85,[0,seat-.016-.425,0],'bright');
 for(const p of [poppet,stem]){p.valveTag=valveTag;p.closedQuaternion=p.quaternion.clone();p.openQuaternion=p.quaternion.clone();p.closedPosition=p.position.clone();p.openPosition=p.position.clone().add(new T.Vector3(0,-.20,0));}
 band('Flush-bottom stem seal','valve',.05,.015,.06,[0,bodyBottom-.025,0],'dark');
 band('Flush-bottom actuator lantern','valve',.09,.065,.10,[0,bodyBottom-.105,0],'bright');
 c('Flush-bottom pneumatic actuator','valve',.105,.48,[0,bodyBottom-.395,0],'blue');
 c('Flush-bottom actuator end cap','valve',.115,.045,[0,bodyBottom-.6575,0],'dark');
 boltCircle([0,bodyBottom,0],[0,1,0],.10,4,.5,'Flush-bottom bonnet fastener');
 tube(exit,outlet,.055,tag+' central outlet discharge neck');clamp(outlet,[0,0,1],.055,tag+' central outlet flange');
 ring('Flush-bottom side outlet weld','pipe',.063,.006,exit,'weld',[0,0,1]);
 ports.push({id:tag+':Product transfer outlet',reactor,label:'Product transfer outlet',point:world(outlet),axis:[0,0,1],radius:.055});
 const partIds=parts.slice(first).map(p=>p.id);valves.push({tag:valveTag,label:tag+' central flush-bottom valve',reactor,a:world(entry),b:world(exit),type:'bulk-isolation',normalState:'closed',actuator:'lowering poppet',partIds,discId:poppet.id});
 for(const p of parts.slice(first)){p.componentAssembly='central-outlet-'+neck.id;p.exploreRole='equipment';p.designBasis=REACTOR_MECHANICAL_BASIS.status;}
 return outlet;
}
