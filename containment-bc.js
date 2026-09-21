// BC design references checked 2026-09-08. A conceptual model is not a code approval.
export const BC_CONTAINMENT_BASIS={
 jurisdiction:'British Columbia, Canada',checked:'2026-09-08',complianceStatus:'Not certified — project-specific qualification open',
 references:[
  {title:'WorkSafeBC OHS Regulation — Part 5',url:'https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-05-chemical-and-biological-substances',scope:'5.21 material resistance; 5.24 prevent incompatible mixing; 5.26 safe containment and access. 5.85–5.95 and Tables 5-2/5-3 govern emergency washing.'},
  {title:'BC Hazardous Waste Regulation',url:'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/63_88_01',scope:'Waste classification and facility applicability must be determined. Section 16(1)(b), where applicable: larger of 110% of largest free-liquid waste inventory or 25% of total storage. This is not a blanket rule for all process tanks.'},
  {title:'HSE secondary containment — supporting engineering guidance',url:'https://www.hse.gov.uk/comah/sragtech/techmeascontain.htm',scope:'Individual and shared bunds, local capture and controlled recovery. Supporting guidance, not BC law.'}
 ],
 decisions:[
  'Raised local curbs use a provisional 200 mm crest and 50 mm freeboard; BC Part 5 does not set a universal curb height. Actual event accumulation, access, splash and surge determine the required height.',
  'Support foundations intersecting a wet-floor edge are excluded with continuous lined protective upstands. The retained structural base is not supported on the containment curb. Anchor access and movement seals require a detailed civil design.',
  'Combine civil construction and access; maintain liquid-tight compartments, independent venting and separate recovery wherever compatibility is unresolved.',
  'Combine only the existing T-402 / VSEP circulating process capture zone. Count its connected inventory once, plus the package allowance. CIP remains separate; operation with incompatible cleaning fluids requires validated isolation and cleaning controls.',
  'No retention capacity is borrowed from a neighbouring compartment, the normal treatment tanks or a running pump.',
  'Retain conservative connected-inventory release cases. Firewater, rainfall, simultaneous failures, verified displacement, hydraulic capture and reactive gas generation require project data.',
  'Local capture floors are not credited as full-release storage. Remote storage remains necessary in this layout until adequate local bund volumes and access can be demonstrated.',
  'BC Fire Code, building/civil approvals, environmental discharge authorization and Hazardous Waste Regulation applicability remain authority/professional review items; no blanket compliance claim.'
 ],
 eyewash:{supply:'Potable water only for plumbed eyewash (5.86); qualified tempered supply and duration per risk assessment',highRiskEye:{maxWalkingSeconds:5,maxWalkingDistanceM:6,minimumDurationMinutes:15},access:'Unblocked access; actual travel path, exposure point and elevated work coverage unverified',testing:'Full-flow test at least monthly long enough to flush the supply branch (5.93); follow any additional supplier requirements',freezeProtection:'Facility and supply piping protected against freezing (5.95)',signs:'Location and operating directions required (5.92); model signs are indicative, supplier signage to be verified',colour:'Yellow is the selected visual identification convention, not a BC compliance certificate'}
};

export const EMERGENCY_COLOURS={body:'#ffd000',sign:'#09834b',symbol:'#ffffff',metal:'#d5dce3',water:'#66b2ff',drain:'#e6e6e6'};
export function emergencyPartColour(role){return EMERGENCY_COLOURS[role]||null;}
