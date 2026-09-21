// B.C. screening basis. Neither a risk classification nor a commissioning record.
export const EMERGENCY_BASIS={
 revision:'emergency-stations-91',jurisdiction:'B.C., Canada',reviewed:'2026-09-12',
 regulation:'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-05-chemical-and-biological-substances',
 guidance:'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-guidelines/guidelines-part-05',
 location:'OHS 5.85–5.96; risk assessment Table 5-2; equipment and location Table 5-3.',
 assumptions:'1.2 m approach width and 2.3 m approach headroom are project reservations. Actual exposure points, operating space, activation reach and response time require verification.',
 equipment:'High/moderate risk: tempered continuous flushing for at least 15 minutes; high-risk materials may need longer. Plumbed eyewash requires potable water. Flow must continue hands-free after activation.',
 testing:'OHS 5.93 requires plumbed units to be full-flow tested at least monthly, long enough to flush the supply branch. Also follow the selected equipment maintenance instructions. No tests or inspections have been recorded here.',
 exceptions:'Table 5-3 contains conditional extensions for showers and moderate-risk facilities; this screening does not apply them. High-risk corrosive-gas facilities must be adjacent to, outside, the gas storage/use area. Tempered-water exceptions require medical advice under 5.89(2).',
 holds:[
  'Assign eye and skin risk separately using SDS, concentrations, quantities and tasks; approve the actual exposure-point register.',
  'Resolve final access, actuator reach and same-level elevated-platform provision; a ground approach is not complete emergency coverage.',
  'Qualify potable supply, simultaneous shower/eyewash flow, pressure, temperature, duration, backflow protection and availability during an emergency.',
  'Provide signs, use instructions, worker training and freeze protection for the unit and supply piping.',
  'Engineer runoff capacity, chemical compatibility, slip resistance and a collection destination separate from reactive-spill retention.',
  'Commission selected equipment and record measured performance and maintenance before assigning operational readiness.'
 ]
};
export const EMERGENCY_RISKS={
 unassigned:{label:'Unassigned · assessment needed',seconds:null,metres:null},
 high:{label:'High risk · screening assumption',seconds:5,metres:6},
 moderate:{label:'Moderate risk · screening assumption',seconds:10,metres:30},
 low:{label:'Low risk · screening assumption',seconds:10,metres:30}
};
export function emergencyDistanceScreen(distance,risk='unassigned'){
 const limit=EMERGENCY_RISKS[risk]||EMERGENCY_RISKS.unassigned;
 return {risk,limitMetres:limit.metres,limitSeconds:limit.seconds,distanceWithinLimit:Number.isFinite(distance)&&limit.metres!==null?distance<=limit.metres:null,responseTimeVerified:false,exposurePointVerified:false,complianceVerified:false};
}
