// Proposed spatial design only. Flow, pressure, inventory and relief ratings remain unqualified.
export const AR_SOURCE_OPTIONS={bulk:{label:'Bulk liquid Ar + reserve cylinders',description:'Proposed commercial source: TK-6101 storage → E-6101 vaporizer → PCV-6101 regulation. Independent reserve bank via changeover; capacity and endurance HOLD.'},cylinders:{label:'Cylinder duty / reserve banks',description:'Proposed alternative: independently isolated cylinder banks with regulated changeover. Cylinder count, usable inventory and delivery interval HOLD.'}};
export const AR_LAYOUT={revision:'argon-28',previousTakeoff:{revision:'Published layout 27',89:{lengthM:286.81535974358485,elbowParts:50},112:{lengthM:580.3756502789448,elbowParts:78}},defaultSource:'bulk',sourceArea:'A-6100',distributionArea:'A-6200',headerY:6,gradeHeaderY:2.4,
 banks:{
  'AR701-INLET':{owner:89,areaId:'A-700',floor:0,z:30,headerY:2.4,posts:[58.5,69],branches:[59,61,64,66,68],purpose:'Charging, feeder seal and furnace inlet'},
  'AR701-PRODUCT':{owner:89,areaId:'A-700',floor:0,z:30,headerY:2.4,posts:[81,87.5],branches:[82,84,86],purpose:'Furnace end seal, cooling and product collection'},
  'AR801-GRADE':{owner:112,areaId:'A-800',floor:0,z:40,headerY:2.4,posts:[97.5,101.6,111.5],branches:[98,99,100,101,110],purpose:'Mixer, intermediate holding, transfer, furnace and end seal'},
  'AR801-UPPER':{owner:112,areaId:'A-800',floor:7.08,z:20.5,headerY:10.1,posts:[94,96.3],branches:[93.7,94.15,94.6,95.05,95.5],platform:'PL-801',purpose:'Elevated charge lock, hoppers and gravimetric feeders'}
 },
 upperTargets:['H-801','H-802','F-801','F-802','LK-802'],gradeTargets:['H-803','MX-801','PY-801','TR-801'],
 sourceBasis:{pfd:'FEED-PFD-6000 · PDF page 20 · V5.1 draft',pfdDistributionPressure:'Typical 2–4 bar(g); not an approved operating setpoint',sourceCapacity:null,peakFlow:null,minimumSupplyPressure:null,oxygenLimit:null,moistureLimit:null,reserveDuration:null,pressureDrop:null,qualification:'Source pressure reduction, regulator failure protection, reserve endurance, simultaneous purges, vaporizer cold-weather performance, trapped-liquid thermal relief, tank inventory indication and safe vent locations require supplier/FEED confirmation.'}
};
export const argonBranchBank=(target)=>AR_LAYOUT.upperTargets.includes(target)?'AR801-UPPER':'AR801-GRADE';
export function argonTakeoff(model,owners=[89,112]){return owners.map(owner=>{const routes=model.routes.filter(r=>r.reactor===owner),ids=new Set(routes.flatMap(r=>r.edgeIndices));return {owner,lengthM:[...ids].reduce((sum,i)=>sum+(model.edges[i]?.path||[]).slice(1).reduce((s,p,j)=>s+Math.hypot(...p.map((v,k)=>v-model.edges[i].path[j][k])),0),0),elbowParts:model.parts.filter(p=>p.reactor===owner&&/elbow/i.test(p.name)).length};});}
