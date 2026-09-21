import {EXHAUST_ACCESS} from './exhaust-groups.js';
import {A3000_ACCESS_ZONES} from './a3000-basis.js';
import {A2000_ACCESS_ZONES} from './a2000-basis.js';
import {TRANSPORT_ZONES} from './transport-layout.js';
import {REACTOR_MAINTENANCE_BASIS,reactorMaintenanceReview} from './reactor-maintenance.js';
// Editable proposed layout basis, established before utility routing.
// Metres, Y up. These are project screening targets, not jurisdictional/code approval.
export const ACCESS_BASIS={revision:'access-30',status:'proposed',units:'m',pedestrianHeadroom:2.3,routineHandHeight:[.8,1.6],routineDisplayHeight:[1,1.7],horizontalReach:.65,standingWidth:.9,standingDepth:.9,pipeInsulationAllowance:.05,insulationBasis:'Conservative screening allowance on external piping; replace with verified line-specific insulation thickness.',limits:'Concept layout only. Civil levels, egress, ergonomics, lift capacity, structural loading, isolation procedures and vendor withdrawal dimensions require detailed design.'};
const zone=(id,kind,areaIds,min,max,note)=>({id,kind,areaIds,min,max,note,designStatus:'proposed'});
import {WATER_ACCESS_ZONES} from './a1000-basis.js';
export const REACTOR_WITHDRAWAL_ZONES=[[-2.45,0,'A'],[2.45,0,'B'],[-2.45,-16,'C'],[2.45,-16,'D']].map(([x,z,s])=>{const e=REACTOR_MAINTENANCE_BASIS.envelope;return zone('REMOVE-R201'+s,'maintenance',['A-200'],[x+e.localMin[0],e.localMin[1],z+e.localMin[2]],[x+e.localMax[0],e.localMax[1],z+e.localMax[2]],'Full cover / drive / shaft sweep reservation. '+reactorMaintenanceReview(s));});
export const ACCESS_ZONES=[...TRANSPORT_ZONES,...REACTOR_WITHDRAWAL_ZONES,...EXHAUST_ACCESS,...WATER_ACCESS_ZONES,...A2000_ACCESS_ZONES,...A3000_ACCESS_ZONES,
 zone('WALK-PREG-NORTH','pedestrian',['A-140','A-160'],[-31,.035,-11.35],[-17,2.335,-10.15],'Continuous local approach below the delivery lane. Reserve before assigning pipe brackets; retain low process pipes below the equipment frontage.'),
 zone('WALK-PREG-SERVICE','pedestrian',['A-140','A-160'],[-23.1,.035,-24.6],[-21.9,2.335,-14.7],'Local approach between separate containment bays. Brackets must attach from the equipment side; retain the independent chemical containment edges.'),
 zone('SERVICE-RO402','maintenance',['A-400'],[8.35,.02,22.4],[10.0,2.5,24.2],'Reserved shutdown mobile access for overhead XV-DF402; supplier lift outreach, stabilizers and approach HOLD'),
 zone('WALK-A400-FRONT','pedestrian',['A-400'],[14.5,.02,26.05],[25.8,2.32,27.25],'Clear front service aisle beyond supplier package; low pipes remain in equipment bays'),
 zone('WALK-A400-REAR','pedestrian',['A-400'],[7,.02,16.7],[25.8,2.32,17.9],'Rear access to module retentate isolation; overhead crossings above clearance'),
 zone('WALK-A400-WEST','pedestrian',['A-400'],[7,.02,16.7],[8.2,2.32,34],'Connect rear module access to the plant cross aisle'),
 zone('WALK-A400-EXIT','pedestrian',['A-400'],[14.5,.02,26.05],[15.7,2.32,34],'Connect front service aisle without crossing the drain strip'),
 zone('WALK-A400-LINK','pedestrian',['A-400'],[7,.02,32.5],[50.5,2.32,34],'Connect both A-400 access sides to WALK-700 and the plant spine'),
 zone('SERVICE-VSEP401','maintenance',['A-400'],[14.5,4.95,20],[25.815,8,21.194],'Shutdown lifting envelope above VSEP packs; supplier withdrawal length and lift plan HOLD'),
 zone('SPARE-P401','maintenance',['A-400'],[17,.02,28],[20,3,30],'Reserved space for two supplier-mentioned hot spares; pump count / arrangement unresolved'),
 zone('A400-UTILITY','utility',['A-400'],[9.5,0,27.3],[34.6,7,28],'Closed drains and utility route; low lines remain outside the front aisle'),
 zone('A400-DRAIN-CHANNEL','utility',['A-400'],[13.59,0,24.25],[14.21,.35,28.45],'Covered segregated drain channel. Keep walking routes beside the removable covers; cover loading and sealed penetrations require civil review.'),

 zone('WALK-601','pedestrian',['A-600'],[74.4,.02,6.6],[120,2.32,8.2],'A-600 stair approach connected to east pedestrian spine'),
 zone('APPROACH-PL601','platform-access',['A-600'],[74.45,.02,8.0],[75.75,2.32,8.7],'Clear grade approach to PL-601 stairs'),
 zone('WALK-6100','pedestrian',['A-6000'],[37,.02,48],[49,2.32,50],'Source-service approach connected to north pedestrian spine'),
 zone('SOURCE-6100','utility',['A-6000'],[37,0,39],[48.9,8,47.5],'Proposed source yard; delivery access, protection distances and ventilation require supplier/site review'),
 zone('AR801-UPPER-STAND','standing',['A-800','A-6000'],[93.2,7.1,21.1],[96,9.2,22.05],'Permanent PL-801 positions for elevated Ar manifold; preserve deck passage'),
 zone('WALK-SOUTH','pedestrian',['all'],[-40,.02,-34],[120,2.32,-32],'Continuous south pedestrian spine'),
 zone('WALK-EAST','pedestrian',['all'],[118,.02,-34],[120,2.32,50],'East pedestrian connection'),
 zone('WALK-NORTH','pedestrian',['all'],[49,.02,48],[120,2.32,50],'North utility-side pedestrian spine'),
 zone('WALK-700','pedestrian',['A-700','A-6000'],[49,.02,32.5],[91,2.32,34],'A-700 cross aisle; Ar supply remains overhead'),
 zone('WALK-800','pedestrian',['A-800','A-6000'],[90.5,.02,41.6],[120,2.32,42.55],'A-800 service aisle; no pipe or control projection into walking space'),
 zone('WALK-UTILITY-WEST','pedestrian',['A-700','A-6000'],[49,.02,32.5],[50.5,2.32,50],'Connect A-700 aisle to the north pedestrian spine'),
 zone('WALK-700-800','pedestrian',['A-700','A-800'],[90.5,.02,32.5],[92,2.32,42.55],'Pedestrian connection between the two thermal areas'),
 zone('WALK-801-PLATFORM','pedestrian',['A-800'],[87.2,.02,10.2],[120,2.32,11.6],'Connect feeder-platform stair approach to east pedestrian spine'),
 zone('AR-700-STAND','standing',['A-700','A-6000'],[55,.02,30.55],[88,2.12,31.5],'Grade operating positions in front of AR-701 panel'),
 zone('AR-800-STAND','standing',['A-800','A-6000'],[94,.02,40.5],[113,2.12,41.4],'Grade operating positions in front of AR-801 panel'),
 zone('AR-6200-CORRIDOR','utility',['A-6000'],[52,0,44.4],[116,7,47.3],'Dedicated supply rack and regulation bays; not a pedestrian aisle'),
 zone('AR-700-CORRIDOR','utility',['A-700','A-6000'],[55,0,29.2],[88,11.1,30.55],'Local panel, risers and overhead distribution'),
 zone('AR-800-CORRIDOR','utility',['A-800','A-6000'],[94,0,39.1],[113,16,40.1],'Local panel and overhead distribution'),
 zone('REMOVE-PY701','removal',['A-700'],[79.5,3.29,24.29],[89,4.71,25.71],'Reserved axial cassette handling envelope; cooler removal sequence and lifting plan HOLD'),
 zone('REMOVE-PY801','removal',['A-800'],[110,.02,29],[117,4,31],'Reserved furnace withdrawal envelope; vendor withdrawal length HOLD'),
 zone('APPROACH-PL166','platform-access',['A-160'],[-16.85,.02,-32.2],[-15.65,2.32,-30.0],'Keep stair approach clear in Alternative B'),
 zone('APPROACH-PL801','platform-access',['A-800'],[87.25,.02,10.2],[88.55,2.32,12],'Keep feeder-platform stair approach clear'),
 zone('SERVICE-DR601','maintenance',['A-600'],[57.4,.02,8.6],[59.8,2.5,9.7],'Planned shutdown mobile lift base for hot-gas blind; reach, outrigger footprint and approach must be qualified'),
 zone('SERVICE-F601','maintenance',['A-600'],[64,.02,14.5],[66,2.5,17.2],'Collector maintenance and filter-handling space; lifting study HOLD'),
 zone('SERVICE-F161-UPPER','maintenance',['A-160'],[-13.4,.02,-23.9],[-11.6,2.5,-22.1],'Alternative B roof services: planned shutdown mobile access outside vessel; approach and reach HOLD'),
 zone('SERVICE-F166','maintenance',['A-160'],[-10.9,.02,-17.1],[-9.1,2.5,-15.3],'Vapor recovery rack: mobile maintenance access and component handling'),
];
export const AR_ACCESS={panelPipeY:1.2,branchTopY:1.85,branchValveBottomY:1.55,meterBottomY:1.3,checkBottomY:1.05,branchDisplayY:1.42,deliveryRiseZOffset:-.65,commonHeaderY:6};
export const ROUTING_RULES={containedSolids:'Retain contained gravity-chute slopes or the defined powered conveyor geometry; confirm powder flow and removal access before changes.',processTransfer:'Preserve process duty and connected endpoints; check pressure drop, cleanability and drainability before rerouting.',gasDischarge:'Preserve pressure-control and treatment destinations, condensate drainage and segregation from clean utility gas.',pressurizedUtility:'Use overhead racks across aisles; descend only inside the local service bay. Check underside including flanges and insulation.',gravityDrain:'Retain true low takeoff and continuous fall to closed collection; protect the service strip or engineer a covered crossing. Never lift a drain over an aisle.',pumpSuction:'Retain hydraulic profile and flooded suction where required; assess NPSH, gas pockets and drainability before elevation changes. Protect the footprint or redesign the aisle.',measurementProtection:'Retain sensing and relief process connections unless the measurement/protection basis is reviewed. Remote indication is an electrical connection, not a new fluid path.'};
