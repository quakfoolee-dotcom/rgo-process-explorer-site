// Editable access arrangement. Dimensions are proposed screening targets in metres.
export const ACCESS_DESIGN={revision:'access-29',status:'proposed',jurisdiction:null,
 criteria:{maxRiser:.18,minGoing:.28,minClearWidth:1.1,maxFlightRise:3,landingDepth:1.2,headroom:2.3,handrail:.90,guardrail:1.07,toeboard:.15},
 sources:[{name:'WorkSafeBC Part 4: access, guarding and handrails',url:'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-04-general-conditions'},{name:'CCOHS fixed access ladders',url:'https://www.ccohs.ca/oshanswers/safety_haz/ladders/fixed.html'}],
 towers:{
  'PL-601':{owner:123,area:'A-600',x:74.4,z:8.7,levels:[0,2.8,5.6,7.6,10,11.3],served:[71,74],purpose:'Dryer manways, collector service and atomizer handling'},
  'PL-801':{owner:114,area:'A-800',x:87.2,z:12,levels:[0,2.36,4.72,7.08],served:[102,103,104,105,106,112],purpose:'Feeder and upper Ar-manifold access'},
  'PL-166':{owner:99,area:'A-160',x:-17,z:-30,levels:[0,2.95,5.9],served:[46],scenario:'enclosed',purpose:'Alternative B filter platform access'},
  'PL-161':{owner:99,area:'A-160',x:-17.9,z:-28.4,levels:[0,2.2,4.4],served:[46,47],scenario:'elevated',purpose:'Option E F-161 operating deck access over D-164'}
 },
 qualification:'Proposed layout, not construction approval. Confirm site jurisdiction, structural loads, foundations, fire/egress assessment, rescue, slip resistance, gate hardware and vendor maintenance/removal envelopes.',
 lifting:{atomizer:{capacity:null,method:'Powered handling concept with a reserved vertical withdrawal envelope; disconnect and isolate services before removal. Vendor lifting points and procedure HOLD.'},filter:{capacity:null,method:'Supported plenum-cover handling and bag withdrawal space; vendor lifting equipment and disassembly sequence HOLD.'}}
};
export const ACCESS_EQUIPMENT={123:{tag:'PL-601',label:'Dryer and filter access stair tower',areaId:'A-600',designStatus:'proposed',x:75.7,z:12,labelY:13.3,reviewNote:ACCESS_DESIGN.qualification}};
