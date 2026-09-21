import {EMERGENCY_LOCATION_PLAN} from './emergency-location-plan.js';
// Conceptual spill capture and OFF-LINE retention. Metres, Y up.
// Geometry is evidence of reserved storage, not proof of release capture or safe chemistry.
export const CONTAINMENT_INPUTS={revision:'containment-37',localCurbTopM:.20,localFreeboardM:.05,largestInventoryFactor:1.1,drainbackFraction:.05,isolationAllowanceFraction:.10,minimumAllowanceM3:1,storageMargin:1.15,displacementFraction:.05,minimumLiquidDepthM:1,pipeSlope:.005,pipeRadiusM:.10,freeboardAboveInletM:.15,qualified:false};
export const CONTAINMENT_HOLDS=[
 'Local 200 mm nominal curbs and 300 mm support upstands are proposed geometry, not regulatory minimums. Qualify transient accumulation, surge and splash, blocked drains, movement joints, support-island seals and safe crossings. Local buffer is not credited to remote storage.',
 'Release inventories upstream of A-400 use conservative geometric envelopes or explicit package allowances, not approved vessel capacities. Reconcile operating inventories and connected equipment.',
 'The inflow/isolation and drainback allowances are provisional. Firewater, rainfall, simultaneous failures, spray trajectory, surge overtopping and emergency-response water have not been quantified.',
 'Remote cells reserve usable storage. No safety credit is assigned until inlet capture, solids transport, drain capacity, blockage, backwater, venting and reactive-spill behavior are verified.',
 'The new south retention service strip is a proposed site extension. Confirm property limits, buried services, foundation influence zones, groundwater, flotation, excavation and vehicle access.',
 'Each cell has independent spill collection and venting. No emergency-spill connection to normal A-1000 treatment, stormwater or another cell is assumed.',
 'Lining, joints, waterstops, pipe materials, seals and covered-cell ventilation require qualification for the actual concentration, temperature and oxidizers. Do not neutralize spills in the cells.',
 'Flush intake gratings and raised retention covers require structural and slip-resistance design. Open-cover maintenance requires temporary guarding, isolation and an assessed confined-space / retrieval method.',
 'Proposed grade emergency stations do not cover elevated charging or PL-166 work. Same-level provision, safe approach, qualified emergency-water supply, runoff and winter protection remain to be designed.',
 'Reactor cooling, addition isolation, relief and gas treatment require a separate reaction-hazard study. Liquid retention does not qualify these protective functions.'
];
const C=(key,areaId,owners,patches,chemistry,options={})=>({key,areaId,owners,patches,chemistry,...options});
// [xMin,zMin,xMax,zMax]. Collection floors are recessed; walking routes remain at grade.
const ORIGINAL_CELLS=[
 C('101','A-100',[37],[[-41,-17,-36.2,-12.6]],'Sulfuric acid storage'),
 C('102','A-100',[36],[[-35.8,-17,-30.9,-11.8]],'Graphite / acid premix'),
 ...['A','B','C','D'].map((s,i)=>{const x=i%2?-25:-29,z=i<2?-15:-20;return C('141'+s,'A-140',[39+i],[[x-1.8,z-1.9,x+1.8,z+1.9]],'Pre-G reactive synthesis · independent '+s);}),
 C('161','A-160',[44],[[-21,-17,-17,-13]],'Pre-G fixing liquor'),
 C('162','A-160',[45],[[-21,-22.7,-17,-18]],'Pre-G holding slurry'),
 C('163','A-160',[51],[[-21,-27.4,-17,-23.5]],'Pre-G filtrate'),
 C('164','A-160',[46],[[-16.8,-23.2,-11.9,-18.1]],'Filter washing / slurry',{packageInventoryM3:8,scenarioPatches:{integrated:[[-16.8,-19.5,-12,-14.8]]},scenarioOwners:{integrated:[92]}}),
 C('201A','A-200',[1],[[-4.7,-3,-.25,2.2]],'Reactive GO oxidation · independent A'),
 C('201B','A-200',[2],[[.25,-3,5,2.2]],'Reactive GO oxidation · independent B'),
 C('201C','A-200',[54],[[-4.7,-19,-.25,-13.8]],'Reactive GO oxidation · independent C'),
 C('201D','A-200',[55],[[.25,-19,5,-13.8]],'Reactive GO oxidation · independent D'),
 C('202','A-200',[3],[[-9.8,-2.5,-5.2,2.5]],'Sulfuric acid day storage'),
 C('203','A-200',[19],[[-9.2,-8.5,-5.4,-5.1]],'Phosphoric acid day storage'),
 C('301','A-300',[26],[[5.7,-8.5,9.8,-4.9]],'Hydrogen peroxide · dedicated collection and vent'),
 C('302','A-300',[27],[[5.6,8.6,9.5,12.5]],'Hydrochloric acid storage'),
 C('303','A-300',[4],[[5.3,-2.5,9.5,2.5]],'Quench / fixing liquor · residual reactivity unverified'),
 C('304','A-300',[31,30],[[-.7,4.7,5,12.5]],'Decanter and acidic centrate',{packageInventoryM3:3}),
 C('305','A-300',[28],[[5.3,3.8,9.5,8]],'Acid washing liquor'),
 C('401','A-400',[33],[[14.5,20,25.815,22.2],[16.1,23.1,20.1,25.4]],'VSEP process liquor',{packageInventoryM3:8,connectedInventoryOwners:[32]}),
 C('402','A-400',[32],[[8.4,18,12.8,22.2],[10.2,22.2,11.0,22.9],[10.2,22.9,13.8,24.3]],'Diafiltration slurry'),
 C('403','A-400',[34],[[26.6,18.6,32,24],[28.8,24,33.4,25.7]],'Permeate · acidity and residual oxidizer unverified'),
 C('404','A-400',[124],[[21.5,23.25,25.7,25.45]],'CIP chemicals / spent cleaning liquor · separate from process',{packageInventoryM3:5}),
 ...[125,126,127,128,129,131,132,133,134,135,150,153].map((id,i)=>C('10'+String(i+1).padStart(2,'0'),'A-1000',[id],null,'Assigned wastewater vessel chemistry',{automaticPatch:true})),
];
// Preserve existing containment equipment IDs even after retiring the duplicate loop receiver.
const originalWithIds=ORIGINAL_CELLS.map((c,i)=>({...c,modelId:155+i}));
const wash=originalWithIds.find(c=>c.key==='401'),dia=originalWithIds.find(c=>c.key==='402');
export const CONTAINMENT_CELLS=originalWithIds.filter(c=>c.key!=='402').map(c=>c.key==='401'?{...c,owners:[33,32],patches:[...wash.patches,...dia.patches],connectedInventoryOwners:[],chemistry:'T-402 / VSEP connected washing loop',mergedTags:['BND-401','BND-402'],compatibilityBasis:'Existing common circulating process liquor; CIP isolation and all batch states require qualification'}:c);
// One civil construction block can contain several independently lined hydraulic compartments.
// No common vent, drain or recovery header is implied by a shared block.
export const CONTAINMENT_BLOCKS=[
 ['CB-101','Premix storage / process',['101','102'],'preg'],
 ['CB-140','Pre-G reactor bank',['141A','141B','141C','141D'],'preg'],
 ['CB-160','Pre-G wet processing',['161','162','163','164'],'preg'],
 ['CB-200','Oxidation reactor bank',['201A','201B','201C','201D'],'oxidation'],
 ['CB-202','Acid day storage',['202','203'],'oxidation'],
 ['CB-301','Dedicated peroxide',['301'],'quench'],
 ['CB-302','Hydrochloric acid',['302'],'quench'],
 ['CB-303','Quench / downstream process',['303','304','305'],'quench'],
 ['CB-401','Connected wash loop',['401'],'washing'],
 ['CB-403','Permeate / isolated CIP',['403','404'],'washing'],
 ['CB-1001','Equalization',['1001'],'water'],
 ['CB-1002','Treatment train',['1002','1003','1004','1005'],'water'],
 ['CB-1006','Alkaline reagents',['1006','1007'],'water'],
 ['CB-1008','Separate dosing chemicals',['1008','1009','1010'],'water'],
 ['CB-1011','Pre-G low receiver',['1011'],'preg'],
 ['CB-1012','Centrate receiver',['1012'],'water']
].map(([tag,label,keys,yard])=>({tag,label,keys,yard,sharedLiquid:false,qualification:'Civil grouping only; partitions, independent vents, differential loads and escalation require engineering review'}));
export const CONTAINMENT_EQUIPMENT=Object.fromEntries(CONTAINMENT_CELLS.map((c,i)=>[c.modelId,{tag:'BND-'+c.key,label:c.chemistry+' · capture and retention',areaId:c.areaId,x:c.patches?.[0][0]||0,z:c.patches?.[0][1]||0,labelY:1.7,designStatus:'proposed',primaryOperation:'containment-'+c.areaId,geometryStatus:'Proposed segregated capture floor and off-line retention; hydraulic, chemical and civil qualification open',reviewNote:CONTAINMENT_HOLDS.join(' ')}]));
export const EMERGENCY_STATIONS=EMERGENCY_LOCATION_PLAN;
Object.assign(CONTAINMENT_EQUIPMENT,Object.fromEntries(EMERGENCY_STATIONS.map(e=>[e.id,{...e,label:'Proposed emergency shower / eyewash',labelY:2.8,designStatus:'proposed',primaryOperation:'containment-'+e.areaId,geometryStatus:'Proposed location and indicative geometry; emergency-water supply and access response time unqualified',reviewNote:'Independent potable, tempered emergency-water supply required; do not depend on future reclaimed-water RO. Verify unobstructed emergency access, flow, temperature, pressure, winter protection, activation and separate runoff collection before operation.'}])));
export function inventoryEnvelope(e){
 if(e.capacityM3>0)return {m3:e.capacityM3,basis:'Current calculated nominal vessel volume; operating inventory unverified'};
 if(e.radius>0&&e.top>e.bottom)return {m3:Math.ceil(Math.PI*(e.radius+.10)**2*(e.top-e.bottom+.8)),basis:'Conservative cylindrical envelope including heads; not a PFD-rated capacity'};
 return {m3:0,basis:'Package allowance required'};
}
export function sizeRetention(inventoryM3,i=CONTAINMENT_INPUTS){
 if(!(inventoryM3>0))throw Error('Containment requires a positive inventory');
 const drainbackM3=Math.max(i.minimumAllowanceM3,inventoryM3*i.drainbackFraction),isolationAllowanceM3=Math.max(i.minimumAllowanceM3,inventoryM3*i.isolationAllowanceFraction);
 const requiredM3=Math.max(i.largestInventoryFactor*inventoryM3,inventoryM3+drainbackM3+isolationAllowanceM3);
 const width=inventoryM3>150?12:inventoryM3>50?7:inventoryM3>25?5:inventoryM3<3?2:inventoryM3<10?3:4;
 const targetDepth=1.5,length=Math.max(2.5,Math.ceil(requiredM3*i.storageMargin/(width*targetDepth*(1-i.displacementFraction))*2)/2);
 const liquidDepth=Math.max(.6,Math.ceil(requiredM3*i.storageMargin/(width*length*(1-i.displacementFraction))*100)/100);

 return {inventoryM3,drainbackM3,isolationAllowanceM3,requiredM3,width,length,liquidDepth,displacementM3:width*length*liquidDepth*i.displacementFraction,netM3:width*length*liquidDepth*(1-i.displacementFraction),emergencyWaterM3:null,rainfallM3:null,qualified:false};
}
