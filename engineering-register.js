import {A5000_BASIS} from './a5000-basis.js';
import {A4000_BASIS} from './a4000-basis.js';
import {A3000_BASIS} from './a3000-basis.js';
import {A2000_BASIS} from './a2000-basis.js';
import {A1000_BASIS} from './a1000-basis.js';
import {A400_BASIS} from './a400-basis.js';
import {ARGON_SUPPLY,ARGON_EQUIPMENT} from './argon-distribution.js';
import {A800_BASIS} from './a800-basis.js';
import {classifyFlow,FLOW_CATEGORIES,FLOW_LEGEND_SOURCE} from './flow-palette.js';
// Stable equipment IDs belong to geometry; area, source and review data belong here.
// Document updates must be reconciled with explicit project decisions before changing routes.
export const REGISTER_REVISION='2026-09-10 · Physical equipment ownership and complete Explore assemblies';
export const SOURCE={id:'feed-pfd-v51',title:'FEED-PE-PFD-001',revision:'V5.1',issue:'Draft',areaIndexPage:2};
const area=(id,name,page,scope='modeled')=>({id,name,page,scope,sourceId:SOURCE.id});
export const AREAS=[
 area('A-100','Pre-Mix Graphite with Acid',4),area('A-140','Pre-G Synthesis',5),
 area('A-160','Pre-G Washing and Drying',6),area('A-200','TLGO Synthesis',7),
 area('A-300','TLGO Fixing',8),area('A-400','TLGO Washing',9),
 area('A-500','Sonication',10),area('A-600','TLGO Drying',11),
 area('A-700','High Temperature Pyrolysis',12),
 area('A-800','rGO Doping and Pyrolysis',13),
 area('A-900','Cartridge Filling Station',14),
 area('A-1000','Wastewater Treatment',15,'utility system'),
 area('A-2000','Reclaimed Water Generation (RO) System',16,'utility system'),
 area('A-3000','Vent Gas Treatment System',17,'utility system'),
 area('A-4000','Compressed Air Distribution',18,'utility system'),
 area('A-5000','Centralized Heating and Cooling Utility System',19,'utility system'),
 area('A-6000','Argon Gas Distribution System',20,'utility system'),
 area('CONCEPT','Archived independent concept',null,'separate concept'),
 area('SHARED','Shared model context',null,'shared')
];
export const PROCESS_AREAS=AREAS.filter(a=>a.scope==='modeled');
export const areaById=id=>AREAS.find(a=>a.id===id);
export const formatAreaText=text=>String(text).replace(/(?<![\w-])A(100|140|160|200|300|400|500|600|700|800|900|1000|2000|3000|4000|5000|6000)\b/g,'A-$1');
export const areaTitle=id=>{const a=areaById(id);return a?`${a.id} · ${a.name}`:id;};
export const MAIN_ROUTE=PROCESS_AREAS.map(a=>`${a.id} ${a.name}`).join(' → ');
export const OPERATION_AREAS={a5000:'A-5000',a4000:'A-4000',vgcollect:'A-3000',vgtreat:'A-3000',vgliquor:'A-3000',vgwaste:'A-3000',wwcollect:'A-1000',wwtreat:'A-1000',wwchem:'A-1000',wwseparate:'A-1000',ropretreat:'A-2000',rorecover:'A-2000',rodistribute:'A-2000',roclean:'A-2000',rowaste:'A-2000',a6000:'A-6000',premix:'A-100',synthesis:'A-140',fixing:'A-160',pregpress:'A-160',pregdry:'A-160',supply:'A-200',reaction:'A-200',receiving:'A-300',decanter:'A-300',acidwash:'A-300',tff:'A-400',a500:'A-500',a600:'A-600',a700:'A-700',a800feed:'A-800',a800thermal:'A-800',a800atmosphere:'A-800',a900receive:'A-900',a900pelletize:'A-900',a900finish:'A-900',a900reject:'A-900',a900dust:'A-900',filtration:'CONCEPT',transfer:'CONCEPT',drying:'CONCEPT',product:'CONCEPT'};
Object.assign(OPERATION_AREAS,Object.fromEntries(['A-100','A-140','A-160','A-200','A-300','A-400','A-500','A-600','A-700','A-800','A-900','A-1000','A-2000','A-3000'].map(area=>['containment-'+area,area])));
// Primary ownership drives the tree; operation context may still include adjacent equipment.
const primaryOperations={1:'reaction',2:'reaction',4:'receiving',24:'reaction',25:'reaction',26:'receiving',27:'acidwash',28:'acidwash',30:'decanter',31:'decanter',44:'fixing',45:'fixing',46:'pregpress',47:'pregdry',48:'pregpress',49:'pregdry',50:'pregdry',51:'pregpress',53:'pregdry',54:'reaction',55:'reaction',60:'reaction',61:'reaction',62:'reaction',8:'transfer',10:'drying',11:'drying',12:'drying',13:'drying',14:'drying',15:'product',16:'transfer',17:'drying'};
// Add reviewed tag/name/area amendments here; geometry IDs and saved component references stay stable.
export const EQUIPMENT_OVERRIDES={};
const membership={
 'A-100':[36,37,38], 'A-140':[39,40,41,42,43], 'A-160':[44,45,46,47,48,49,50,51,53],
 'A-200':[1,2,3,19,20,21,22,23,24,25,29,54,55,56,57,58,59,60,61,62],
 'A-300':[4,26,27,28,30,31], 'A-400':[32,33,34,35], 'A-500':[63,64,65,66,67,68],
 'A-600':[69,70,71,72,73,74,75,76,77,78], 'A-700':[79,80,81,82,83,84,85,86,87,88,90,91],
 'A-900':[200,201,202,203,204,205,206,207,208], 'A-6000':[89], 'CONCEPT':Array.from({length:14},(_,i)=>i+5),'SHARED':[0,52]
};
const listed=new Set([1,2,3,4,19,26,27,28,30,31,32,33,34,36,37,38,39,40,41,42,44,45,46,47,51,54,55,62,63,64,65,69,70,71,72,73,74,75,76,77,82,83,85,86,88]);
const interfaces=new Set([0,9,17,29,35,52,68,78,91]);
export const DESIGN_STATUSES={listed:{label:'PFD-listed',color:'#c6d4df'},proposed:{label:'Proposed addition',color:'#42c7be'},interface:{label:'Interface',color:'#8bacc6'}};
export const REVIEW_ITEMS={
 20:'Branch-specific Pre-G feeder quantities and allocation require reconciliation with the draft register.',
 22:'Branch-specific oxidizer feeder quantities require reconciliation with the draft register.',
 24:'Induction and recirculation package allocation requires vendor and FEED confirmation.',
 33:'Supplier-scaled eight-unit VSEP proposal. V17 screening capacity 62.208 m³/h versus 71 m³/h required. Membrane area, flux, chemistry, pump arrangement and batch schedule require qualification.',
 47:'D-164 is listed; the vacuum tray configuration is a proposed implementation of the drying duty.',
 62:'Two transfer pumps are modeled. Duty / standby allocation is unresolved.',
 65:'US-501 is listed. The three-cell arrangement and rated duty require trials and vendor selection.',
 66:'Modeled E-501 cooling duty corresponds to draft HX-501. Tag and cooler arrangement need reconciliation.',
 83:'Draft A-700 gives both +2 psig and slight negative pressure. Pressure sign and operating setpoints remain HOLD.',
 84:'E-702 is an added indirect product cooler, absent from draft A-700. Reconcile its duty with PY-701 internal cooling before specification.',
 89:'Connected to proposed HD-6201 in A-6200. AR-701 remains utility-owned and also appears in A-700. A-6100 source and protection are connected proposed equipment; supply capacity, pressure and reserve endurance require qualification.',
 90:'Oxygen verification and pressure-control arrangement are proposed; thresholds and protective sequences require review.'
};
for(const id of [200,201,202,203,204,205,206,207,208])REVIEW_ITEMS[id]='A-900 is a proposed functional foundation. Equipment tags, technology, capacity, ratings, containment, operating criteria and interfaces require an approved A-900 source package.';
for(const ids of [[20,21,56,57],[22,23,58,59],[24,25,60,61]])for(const id of ids)REVIEW_ITEMS[id]=REVIEW_ITEMS[ids[0]];
export const PROJECT_DECISIONS=[
 {id:'scenario-scope',source:'User instruction',value:'FEED is the main scope. The original independent assembly is available only as an archived reference. A-160 alternative equipment follows A-160 tags; one configuration is active at a time'},
 {id:'aqueous-basis',source:'User instruction',value:'Aqueous GO suspension through sonication and water removal',override:'Retain when reconciling future source revisions'},
 {id:'four-reactors',source:'PFD V5.1 and user instruction',value:'Four R-201 oxidation branches'},
 {id:'argon-atmosphere',source:'PFD V5.1 and user instruction',value:'Argon supply, oxygen verification, seals and pressure control form one atmosphere system'},
 {id:'added-cooling',source:'Concept development',value:'Retain E-702 as a proposed additional cooler pending duty reconciliation'}
];
export const CHANGE_LOG=[{revision:'2026-09-10 · R-201 local instrument-air completion',changes:['Four anchored panels with accessible isolation, regulation, indication and silenced bleed','32 mounted valve packages with tagged supply, two working ports, solenoids and silenced exhausts','Eight air / control inspection conditions; unqualified fail actions never represented as proven safe positions','Other modeled pneumatic actuators surveyed by area; individual completion and engineering qualifications remain explicit']},{revision:'2026-09-10 · A-4000 compressed air',changes:['PFD-record compressors, coolers, separators, wet receiver, dryer, filters and relief modeled','Proposed quality release, protected dry reserve, instrument / service segregation and four reactor air connections','Consumer surveys, unqualified duty calculator, twelve failure / maintenance inspection cases and connection dispositions']},{revision:REGISTER_REVISION,changes:['Completed FN-3160 enclosure, aligned drive and gas connections; real tank apertures, sealed liquid returns and protected makeup opening','Added independent A-700 / A-800 thermal and dry package envelopes, with source chemistry, pressure and treatment holds','Reconciled 402 endpoint and nozzle entries; six unresolved external interfaces remain positively blinded','Assembled mesh aperture, attachment, access and scoped interference checks recorded with review projections','A-3000 wet acid train, fine-mist polishing, segregated source review and independent waste transfer modeled','Draft PFD-3000 common-header, bypass, tag, mist and failure-response findings made explicit','Actual-versus-normal gas flow, neutralization load and hydraulic screening exposed as assumptions']},{revision:'2026-09-08 · A-2000 reclaimed water UF and RO',changes:['FEED-PFD-2000 media, UF, N+1 RO, product distribution, concentrate and CIP modeled in the reserved area','A-1000 centrate and backwash connected; conditional bypass remains blinded','PFD recovery, quality targets, eight-hour equalization and supplemental-water shortfall made explicit','Separate waste boundaries, membrane withdrawal, grade controls and BC design qualifications recorded']},{revision:'2026-09-08 · Gross floor boundaries and separate net area accounting',changes:['Blue boundaries follow gross intended allocations; A-400 has a continuous rectangular perimeter','Internal shared corridors remain separate access reservations and net-area deductions','Gross dimensions, gross area, shared-space deduction and net area are explicitly identified; genuine irregular allocations are preserved']},{revision:'2026-09-08 · Compact area labels and independent blue boundaries',changes:['Compact area-number tags with screen-space collision suppression and selected-area priority','Blue floor boundaries remain visible with area labels off; separate boundary control and dashed future reservations','Delayed hover measurements hide during navigation; selected details appear in the side panel','Dimensions appear only where screen space permits; consolidated wastewater outlines use the allocation geometry']},{revision:'2026-09-08 · Floor allocations and raised capture perimeters',changes:['17 explicit process-area floor allocations with dual-unit dimensions, polygon areas, shared-corridor exclusions and reserved future areas','Continuous nominal 200 mm lined capture boundaries and protected retained support islands, including edge intersections','Capture inlets relocated clear of foundations; floor slopes follow local collection points; undrained corner removed in enclosed alternative','Perimeter continuity, inlet clearance, floor connectivity, segregated descending routes and protected aisles checked across four layouts','Blocked-drain accumulation screening added; chemical, hydraulic and structural design qualification remains open']},{revision:'2026-09-08 · Compact containment and BC basis',changes:['16 shared civil blocks retain independent chemistry compartments','T-402 / VSEP connected capture merged; duplicate BND-402 retired without renumbering other tags','One remote trunk per zone and local branch collection; shallow liquid-depth target with explicit capacity calculations','Yellow emergency assemblies persist in physical and flow views; BC potable supply, travel, signs, testing and freeze-protection requirements recorded','BC Hazardous Waste Regulation applicability and all construction qualifications remain open']},{revision:'2026-09-08 · Segregated spill capture and calculated retention',changes:['Independent A-100 through A-400 and A-1000 spill capture and off-line retention cells','Replaced undersized A-1000 tank-ring curbs; geometric capacities include explicit allowances and deductions','Preserved equipment and process-pipe geometry; protected grade access with buried spill conveyance','Separate recovery blinds, vents, accessible level indication and below-grade inspection; hydraulic, chemical and civil qualification open']},{revision:'2026-09-08 · A-1000 wastewater and A-2000 reservation',changes:['Connected A-160 / A-300 / A-400 wastewater to the PFD-listed A-1000 chemical treatment train','Editable flow and inventory screening basis with unqualified chemistry and hydraulic inputs','Low gravity receivers and pumps before overhead transfers; segregated containment and access reservations','Adjacent A-2000 footprint and positively blinded tie-ins; no operational RO equipment']},{revision:'2026-09-08 · Final support consolidation and fixed-steel attachments',changes:['Final-layout support reassignment before retiring complete frames and stands','Consolidated overlapping corridors and multiple support elevations onto shared fixed steel','Explicit existing-member eligibility and foundation paths; weighing and vibrating assemblies excluded','Pipe and bearing coordinates retained; new host reactions and connections remain unqualified']},{revision:'2026-09-08 · Shared pipe racks and support consolidation',changes:['Shared longitudinal corridors and compact local exceptions replace repeated independent frames','Existing bearing locations reassigned to shared rails and columns before new foundations are considered','Frame, column, member-length and direct-attachment coverage comparisons against the previous layout','Process piping and protected access profiles retained; unqualified loads and mounting holds remain explicit']},{revision:'2026-09-08 · Coordinated piping and pipe supports',changes:['Direct overhead A-400 RO makeup with grade command/feedback and separate maintenance access','Shorter A-400 CIP supply and return inside service bays','Plant-wide proposed area-tagged racks, bearings, longitudinal connections and explicit foundation attachment paths','Support coverage, actual spans, unknown loads and local placement reviews included in configuration register']},{revision:'2026-09-08 · Supplier-scaled A-400 and plant dimensions',changes:['Replaced the illustrative tubular module rack with eight supplier-scaled VSEP filter packs and proposed feed/CIP skids','T-402 and T-403 geometry uses calculated retained/surge inventory with editable assumptions; default nominal volumes are 30 and 65 m³','V17 screening shows 71 m³/h permeate duty against 62.208 m³/h eight-module capacity; operating count and supplier pump count remain open','Plant-wide measurement supports surface/center/plane points, projected dimensions and connected external pipe routes in feet/inches and millimetres']},{revision:'2026-09-08 · Permanent stairs and task-based access',changes:['Replaced DR-601 vertical ladder with shared PL-601 stairs and task-based dryer/filter platforms','Added intermediate stair landings and continuous guarding to PL-801 and Alternative B PL-166','DR-601 manways and platform elevations aligned to service tasks; provisional vendor arrangement','Access criteria, service tasks and lifting/rescue HOLD items are exported']},{revision:'2026-09-08 · A-6000 source and compact Ar manifolds',changes:['Connected selectable bulk/vaporizer or cylinder source with independent reserve, source regulation, quality indication and relief interfaces','Compact A-700 grade manifolds and A-800 grade / PL-801 elevated manifold share upstream feeds','Preserved 18 controlled delivery branches; A-900 / other purge connections are reserved and positively blinded','Source and manifold dimensions are editable; capacity, pressure-drop and reserve ratings remain HOLD']},{revision:'2026-09-08 · Access layout and operability review',changes:['Reserved pedestrian, standing, maintenance, removal and utility zones before rerouting','Grade Ar control banks and regulator knobs at 1.56 m; overhead aisle crossings','Remote indication retains original sensing taps; A-800 supply pockets have separate drains','Component access positions, actuator/control/isolation requirements and open clearance findings are exported']},{revision:'2026-09-08 · Connected A-6000 Ar distribution',changes:['Proposed HD-6201 common header with independent checked supply branches to AR-701 and AR-801','Area views, tree, routes and legend share connected Ar membership without reassigning equipment','A-6100 remains the qualified external supply interface; local BL-AR701 / BL-AR801 are connected interunit flanges']},{revision:'2026-09-07 · A-800 doping and pyrolysis integration',changes:['A-800 connected rGO / KBH₄ dosing, mixing, pyrolysis and cooling','Dedicated Ar, O₂ / moisture / H₂ verification, off-gas, relief and segregated utility drains','Proposed TR-801, LK-802 and PL-801 with PFD-listed duty tags retained','A-900 is now the downstream interface; draft values and source conflicts remain open']},{revision:'2026-09-07 · A-160 platform integration',changes:['PL-166 elevated Nutsche platform and vapor recovery rack; connected screw supports and H-166 receiver','FEED-only main navigation with a secondary design archive','A-160 baseline plus three mutually exclusive design alternatives','Provisional A-160 equipment, control and isolation tags; original assembly identity retained in archive']},{revision:'2026-09-07 · Area / operation / equipment reconciliation',changes:['Explicit area ownership and source pages','T-161 fixing → P-162 → T-162 holding → P-164 → F-161','A-300 P-304 slurry / P-305 decant / P-306 wastewater duties reconciled','E-702 classified as proposed; pressure conflict retained for review']}];
export function equipmentRecord(id,equipment){
 const e={...equipment[id],...EQUIPMENT_OVERRIDES[id]},areaId=e.areaId||Object.keys(membership).find(a=>membership[a].includes(Number(id)));
 if(!e||!areaId)throw Error('Equipment missing an explicit engineering record: '+id);
 const a=areaById(areaId),designStatus=e.designStatus||(interfaces.has(Number(id))?'interface':listed.has(Number(id))?'listed':'proposed');
 const operationIds=Object.keys(OPERATION_AREAS).filter(op=>OPERATION_AREAS[op]===areaId);
 return {id:`equipment-${id}`,modelId:Number(id),tag:e.tag,name:formatAreaText(e.label),areaId,subArea:e.subArea||null,primaryOperation:e.primaryOperation||primaryOperations[id]||operationIds[0]||null,operationIds,designStatus,designScenario:e.designScenario||'baseline',replaces:e.replaces||[],reviewStatus:(e.reviewNote||REVIEW_ITEMS[id])?'open':'no-open-item',reviewNote:e.reviewNote||REVIEW_ITEMS[id]||'',source:designStatus==='listed'?{...SOURCE,page:a.page}:null,basisReference:a.page?{...SOURCE,page:a.page}:null,geometryStatus:e.geometryStatus||'Conceptual arrangement; dimensions and ratings unverified',geometryBasis:e.geometryBasis||null,capacityM3:e.capacityM3||null};
}
export function equipmentRegister(equipment){return Object.fromEntries(Object.keys(equipment).map(id=>[id,equipmentRecord(id,equipment)]));}
export function operationTitle(stage){return `${areaTitle(OPERATION_AREAS[stage.id])} → ${stage.title}`;}
export const UTILITY_LINKS=[
 {areaId:'A-1000',service:'Connected collection → equalization → staged chemical treatment → centrifuge; sizing and chemistry HOLD'},
 {areaId:'A-2000',service:'Connected pretreatment / UF → N+1 RO → qualified process-water distribution; separate concentrate and CIP waste'},
 {areaId:'A-3000',service:'Qualified wet acid vent collection, absorption and fine-mist polishing; dry/reactive services remain separate'},
 {areaId:'A-4000',service:'Compression → drying / quality release → protected instrument-air reserve; isolated service and contact branches'},
 {areaId:'A-5000',service:'Three closed primary circuits, isolated secondary loops and temperature tracing; duties and pressure ratings HOLD'},
 {areaId:'A-6000',service:'A-6100 supply / regulation → AR6001 → A-6200 header → A-700 AR701 / AR702 and A-800 AR801 consumers',equipment:[...Object.keys(ARGON_EQUIPMENT).map(Number),...ARGON_SUPPLY.branches.map(b=>b.owner)],consumerAreas:ARGON_SUPPLY.branches.map(b=>b.areaId),viewPolicy:'Shared supply and both local manifolds with receiving connections and support context; equipment keeps its primary area',unmodeledConsumers:['A-900 receiving equipment','Other purge users'],reservedStreams:['AR-901','AR-902','AR-903','AR-X']}
];
// Only explicitly reconciled PFD streams receive PFD numbers. LINE IDs remain model routes.
export const PFD_ROUTE_LINKS={
 'AR-6001 regulated supply to A-6200':['AR-6001','A-6000','A-6100 source regulation','A-6000','A-6200 distribution header'],
 'A-800 Ar supply from A-6200':['AR-801','A-6000','A-6200 distribution header','A-800','Local Ar manifolds'],
 'XV-AR701-SEAL delivery':['AR-701','A-6000','Local Ar manifold','A-700','C-701'],
 'XV-AR701-PROD delivery':['AR-702','A-6000','Local Ar manifold','A-700','T-702'],

 'H-801 to F-801 refill':['801','A-800','H-801','A-800','F-801'],
 'F-801 flexible discharge':['802','A-800','F-801','A-800','MX-801'],
 'H-802 to F-802 refill':['803','A-800','H-802','A-800','F-802'],
 'F-802 flexible discharge':['804','A-800','F-802','A-800','MX-801'],
 'MX-801 to H-803 mixed solids':['805','A-800','MX-801','A-800','H-803'],
 'H-803 to RV-801 feed':['806','A-800','H-803','A-800','RV-801'],
 'RV-801 to PY-801 feed':['807','A-800','RV-801','A-800','PY-801'],
 'A-800 qualified product to A-900':['808','A-800','PY-801','A-900','Contained cartridge filling interface'],
 'PY-801 off-gas to E-801':['FG801','A-800','PY-801','A-800','E-801'],
 'E-801 cooled off-gas to fan':['FG802','A-800','E-801','A-800','FN-801'],
 'FN-801 to A-3000 treatment':['FG803','A-800','FN-801','A-3000','Off-gas treatment'],
 'F-802 separate EX802 off-gas':['EX802','A-800','F-802','A-3000','Compatible separate treatment'],
 'PSV-801 to dedicated relief treatment':['EX803','A-800','PSV-801','A-3000','Assessed relief destination'],
 'PY-801 cooling supply':['U801','A-800','A-5000 CWS','A-800','PY-801 cooling zone'],
 'PY-801 cooling return boundary':['U802','A-800','PY-801 cooling zone','A-5000','CWR'],
 'E-801 cooling supply':['U803','A-800','A-5000 CWS','A-800','E-801'],
 'E-801 cooling return boundary':['U804','A-800','E-801','A-5000','CWR'],
 'P-PG141 to fixing header':['165','A-140','R-141 bank','A-160','T-161'],
 'P-162 transfer to T-162':['169','A-160','P-162','A-160','T-162'],
 'P-162 recycle to T-161':['168','A-160','P-162','A-160','T-161'],
 'P-164 filter press feed':['171','A-160','P-164','A-160','F-161'],
 'F-161 filtrate to T-163':['175','A-160','F-161','A-160','T-163'],
 'P-165 filtrate to wastewater':['177','A-160','P-165','A-1000','Wastewater interface'],
 'P-163 fixing waste to wastewater':['178','A-160','P-163','A-1000','Wastewater interface'],
 'P-303 to C-301 feed':['310','A-300','P-303','A-300','C-301'],
 'C-301 concentrate chute to T-305':['313','A-300','C-301','A-300','T-305'],
 'C-301 centrate to T-304':['312','A-300','C-301','A-300','T-304'],
 'P-304 to T-402 diafiltration':['317','A-300','P-304','A-400','T-402'],
 'P-305 decant to wastewater':['318','A-300','P-305','A-1000','Wastewater interface'],
 'P-306 to acidic wastewater boundary':['319','A-300','P-306','A-1000','Wastewater interface']
};
export function routeRecord(r,register){const mapped=PFD_ROUTE_LINKS[r.label],owner=register[r.reactor];return {...classifyFlow(r),id:r.id,name:r.label,service:r.service,areaId:owner.areaId,pfdStream:mapped?.[0]||r.pfdStream||null,fromArea:mapped?.[1]||r.fromArea||owner.areaId,from:mapped?.[2]||r.from||owner.tag,toArea:mapped?.[3]||r.toArea||null,to:mapped?.[4]||r.to||'Local connection / endpoint',source:mapped?{...SOURCE,page:areaById(mapped[1]).page}:r.source||null,designStatus:r.designStatus||owner.designStatus,reviewStatus:r.pfdStream?'geometry-and-process-basis-open':mapped?'no-open-item':'mapping-unconfirmed'};}
export function registerSnapshot(model,stages){const equipment=equipmentRegister(model.equipment);return {thermalUtilities:model.scope==='future'?null:model.thermalUtilities,a5000Basis:model.scope==='future'?null:A5000_BASIS,reactorAir:model.scope==='future'?null:model.reactorAir,a4000Basis:model.scope==='future'?null:A4000_BASIS,compressedAir:model.scope==='future'?null:model.compressedAir,revision:REGISTER_REVISION,scope:model.scope||'all',designScenario:model.designScenario||'baseline',source:model.scope==='future'?null:SOURCE,flowLegend:{source:FLOW_LEGEND_SOURCE,categories:FLOW_CATEGORIES},areas:model.scope==='all'||!model.scope?AREAS:AREAS.filter(a=>Object.values(equipment).some(e=>e.areaId===a.id)),mainRoute:model.scope==='future'?'Archived reference: independent filtration → cake transfer → drying → product':MAIN_ROUTE,operations:stages.map(s=>({id:s.id,areaId:OPERATION_AREAS[s.id],name:s.title,equipment:s.equipment.map(id=>`equipment-${id}`)})),equipment:Object.values(equipment).map(e=>({...e,serviceAccess:model.access?.components.filter(c=>c.equipmentId===e.modelId)||[]})),pipeSupportSystem:model.pipeSupportSystem,accessLayout:model.access,permanentAccess:model.scope==='future'?null:model.accessSystem,routes:model.routes.map(r=>routeRecord(r,equipment)),utilities:model.scope==='future'?[]:UTILITY_LINKS,projectDecisions:model.scope==='future'?PROJECT_DECISIONS.filter(d=>d.id==='scenario-scope'):PROJECT_DECISIONS,changes:CHANGE_LOG,containment:model.scope==='future'?null:model.containment,reclaimedWater:model.scope==='future'?null:model.reclaimedWater,ventGas:model.scope==='future'?null:model.ventGas,exhaustGroups:model.scope==='future'?null:model.exhaustGroups,a3000Basis:model.scope==='future'?null:A3000_BASIS,a2000Basis:model.scope==='future'?null:A2000_BASIS,a1000Basis:model.scope==='future'?null:A1000_BASIS,wastewater:model.scope==='future'?null:model.wastewater,a400Basis:model.scope==='future'?null:A400_BASIS,a800Basis:model.scope==='future'?null:A800_BASIS,argonDistribution:model.scope==='future'?null:model.argonDistribution,updatePolicy:'Keep stable equipment IDs. Reconcile document changes against project decisions. Modify connections only with explicit topology changes; geometry and labels consume the same register.'};}
