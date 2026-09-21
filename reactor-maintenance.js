// Layout screening only. These allowances are not a selected vendor lift procedure.
export const REACTOR_MAINTENANCE_BASIS={
 revision:'R201-maintenance-63',status:'Coordinated concept — lifting release remains HOLD',units:'m',
 envelope:{localMin:[-1.2,4.93,-1],localMax:[1.2,10.6,1],upperScreenStart:6.57},
 geometry:{shaftBottom:2.08,shaftTop:5.68,neckClearLevel:4.95,shaftOvertravelAllowance:.15,driveTop:6.42,riggingReservation:1.0,neckBoreDiameter:1.27,impellerEnvelopeDiameter:1.62},
 basis:'The reserved sweep begins at the cover, includes the offset motor, and extends above the translated drive plus an illustrative rigging allowance. It is not an approved lifting envelope or hoist capacity.',
 layout:'SC-164C/D use horizontal powered screws routed diagonally outside the rear reactor lifting reservations. Hopper fill points and branch-isolation tags are retained; no long lateral gravity chute is introduced.',
 shutdownInterfaces:[
  {interface:'SF-201 feeder, cradle and rails',action:'Withdraw the complete feeder carriage 2.25 m rearward on fixed guides. Hopper stays on its widened independent weigh frame; front cradle is set behind head services. Distribution supports and the acid supply rack are coordinated around the complete stroke. Vendor to qualify drive, locking pins, end stops, guide reactions and withdrawal actuation.',status:'Coordinated geometry; mechanism and structure qualification HOLD'},
  {interface:'Pre-G chute and reactor charging connection',action:'Removable hopper inlet neck and short reactor chute, with two split sleeve disconnects. Empty, isolate and decontaminate before disconnection; independently support and positively close all four exposed faces. Shown maintenance view includes closure plates.',status:'Modeled interfaces; containment and isolation procedure qualification HOLD'},
  {interface:'Liquid feeds, cleaning, vent and instrumentation',action:'Reconcile every head service against the lift sweep and P&ID. Define isolation, decontamination and supported spool removal. Relief protection must remain appropriate to every maintenance state.',status:'HOLD — head-service disconnect schedule required'},
  {interface:'R-201D upper sweep / rear dust trunks',action:'Pre-G trunk rerouted to X = 3.95 m; oxidizer trunk to X = 0.80 m, outside the reserved sweep. Dust systems remain segregated. Recalculate pressure loss, balance and support loads for the changed routing.',status:'Rerouted concept; hydraulic and support qualification HOLD'},
  {interface:'Drive, seal services and electrical conduit',action:'Vendor to confirm connection and removal sequence, energy isolation, independent support and reinstatement checks.',status:'HOLD — drive and seal package unselected'},
  {interface:'Impellers, shaft and cover',action:'The modeled impeller envelope exceeds the neck bore. Qualify split-impeller disassembly, tool access and retrieval before shaft withdrawal; do not assume passage through the neck.',status:'HOLD — disassembly access not demonstrated'},
  {interface:'Lifting equipment, structure and elevated access',action:'Establish lifted weights, centres of gravity, lifting points, rigging, rated hoist and supporting structure, landing space, exclusion zone and access method.',status:'HOLD — capacity and lift plan unselected'}
 ],
 ratings:{liftedMass_kg:null,hoistCapacity_kg:null,structureCapacity_kg:null,centreOfGravity:null},
 regulatory:[
  {reference:'WorkSafeBC OHSR 14.11',requirement:'Crane/hoist capacity must not exceed its supporting structure capacity; a clear model envelope does not establish load capacity.'},
  {reference:'WorkSafeBC OHSR 14.12',requirement:'Applicable manufacturer manuals or engineer instructions must be accessible for crane/hoist use.'},
  {reference:'WorkSafeBC OHSR 14.36',requirement:'Determine and communicate load weight. If it cannot be accurately determined, the crane/hoist requires a load-weight indicator or overload-prevention system. This model assigns no lifted weight.'}
 ],
 sources:['https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-14-cranes-and-hoists','https://www.ekato.com/products/agitators/reactor-agitators-ekato-hwl-n/']
};
export function reactorMaintenanceReview(suffix){return `SF-201${suffix} has a proposed 2.25 m withdrawal carriage, independent fixed guides and two contained disconnects. Rear dust trunks and SC-164 avoid the lifting reservation. Full cover lifting remains HOLD pending head-service spool removal, split-impeller access and qualified weights, lifting points, rigging, hoist, supporting structure and landing space. See R-201 service coordination in Engineering inspection.`;}

export const LIFT_QUALIFICATION=[
 {item:'Load inventory',evidence:'Vendor mass and CoG for cover, shaft, drive, residual contents, rigging and each separately handled impeller component.',owner:'Vessel / agitator supplier',reference:'14.36',status:'HOLD'},
 {item:'Load path and support',evidence:'Rated hoist → trolley/beam → columns/connections → anchors/foundation. Check parked feeder guides separately; process pipe racks are not designated lifting supports.',owner:'Structural engineer / hoist supplier',reference:'14.11',status:'HOLD'},
 {item:'Rigging and lifting points',evidence:'Certified lifting points, sling arrangement/angles, unequal loading and allowable reactions; vertical load line and stable CoG.',owner:'Lift planner / equipment supplier',reference:'14.38, 14.46',status:'HOLD'},
 {item:'Access and exclusion',evidence:'Qualified elevated access, landing stand and worker exclusion. The geometric lift box does not establish worker clearance.',owner:'Site / lift planner',reference:'14.41, 14.50',status:'HOLD'},
 {item:'Instructions and lift classification',evidence:'Applicable manufacturer/engineer instructions; assess whether critical or tandem lift planning requirements apply.',owner:'Site / lift planner',reference:'14.12, 14.42, 14.42.1',status:'HOLD'},
 {item:'Service disconnections',evidence:'P&ID isolation list, supported removable spools, containment, lockout, decontamination, reinstatement and leak testing; protect retained vessel inventories.',owner:'Process / mechanical engineer',reference:'Task-specific isolation review',status:'HOLD'}
];
export function liftScreen({loadMass,riggingMass,factor,hoistCapacity,supportCapacity}){
 const values=[loadMass,riggingMass,factor,hoistCapacity,supportCapacity];
 if(values.some(v=>!Number.isFinite(v))||loadMass<=0||riggingMass<0||factor<1||hoistCapacity<=0||supportCapacity<=0)return{status:'HOLD',reason:'Enter documented positive masses/capacities and an engineer-selected factor ≥ 1.'};
 const totalMass=loadMass+riggingMass,screenMass=totalMass*factor,force_kN=screenMass*9.80665/1000;
 return{totalMass,screenMass,force_kN,status:hoistCapacity>supportCapacity||screenMass>hoistCapacity||screenMass>supportCapacity?'FAIL':'Screen only — engineering release HOLD',reason:'Scalar screening cannot qualify beam reactions, anchors, rigging, CoG or a lift plan. Factor is a project input, not a prescribed regulatory multiplier.'};
}
