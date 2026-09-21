// B.C. conceptual fire-point schedule. Coordinates are metres, Y up.
// Locations and reach envelopes are project proposals, not issued fire protection design.
export const FIRE_BASIS={
 revision:'bc-fire-86',jurisdiction:'British Columbia, Canada',reviewed:'2026-09-12',
 status:'Proposed fire points — agent, rating and coverage approval outstanding',
 code:'BC Fire Code 2024 with provincial amendments. NFC 2020: 2.1.5.1 selection and installation; 6.2.1.1 inspection, testing and maintenance; referenced NFPA 10–2013 and applicable CAN/ULC performance and rating standards.',
 emergency:'WorkSafeBC 5.99–5.104: hazardous-substance inventory, qualified risk assessment, emergency response plan, training and drills. Coordinate hazardous-material information with the local fire department under 4.17 where applicable.',
 dimensions:{width:.84,depth:.48,height:1.96,unitBottom:.66,unitTop:1.35,approachWidth:1.2,approachDepth:1.2,headroom:2.1},
 dimensionNote:'Illustrative two-unit station. Actual extinguisher size, weight, mounting, anchorage, access and temperature range require supplier selection. Access dimensions are model screening allowances, not statutory minima.',
 coverageNote:'Distances follow screened model walking paths. This is geometric access screening only: agent suitability, extinguisher rating, floor-area allocation, fire compartments and final exits are not verified.',
 sources:[
  ['B.C. Fire Code and amendments','https://www2.gov.bc.ca/gov/content/industry/construction-industry/building-codes-standards/bc-codes/fire'],
  ['NFC 2020 · code and referenced standards','https://doi.org/10.4224/tx9t-j486'],
  ['WorkSafeBC · chemical emergency planning','https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-05-chemical-and-biological-substances'],
  ['WorkSafeBC · emergency preparedness','https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-04-general-conditions'],
  ['CCOHS · portable fire extinguishers','https://www.ccohs.ca/oshanswers/safety_haz/fire_extinguishers.html'],
  ['KBH₄ supplier hazard information','https://www.sigmaaldrich.com/US/en/product/mm/820747']
 ]
};
export const FIRE_AGENT_BASIS={
 chemical:{label:'Chemical compatibility review',candidate:'Select against actual SDS and process inventory. Ordinary-combustible/electrical protection requires a separately suitable listed unit.',restriction:'Do not credit a generic ABC, water, foam or CO₂ unit for a process-chemical reaction.'},
 general:{label:'General / electrical protection',candidate:'ABC candidate for suitable ordinary combustibles and electrical risks; exact agent, rating and listed unit remain unselected.',restriction:'C rating addresses energized electrical equipment; underlying fuel and nearby chemical incompatibilities still govern selection.'},
 powder:{label:'Powder / thermal hazard review',candidate:'Specialist selection for the actual GO/rGO powder and thermal duty; surrounding electrical/ordinary-combustible protection is separate.',restriction:'No credit for controlling an internal dryer, furnace or dust-collector event. Dust and process protection require separate assessment.'},
 reactive:{label:'KBH₄ specialist selection',candidate:'Agent and equipment selection HOLD pending actual supplier SDS Section 5, quantity, mixture and fire-protection specialist review.',restriction:'Water-reactive KBH₄ can release flammable gas. No water/foam assignment. A generic Class D designation is not proof of compatibility.'},
 utility:{label:'Utility equipment protection',candidate:'Select for electrical equipment, lubricants and surrounding combustibles after the utility inventory is confirmed.',restriction:'Argon is not a combustible fuel. Extinguishers do not control oxygen deficiency or a cryogenic release.'}
};
const point=(tag,areaId,label,x,z,yaw,agent)=>({tag,areaId,label,position:[x,0,z],yaw,agent,agentApproved:false,rating:null,listedUnit:null,installationApproved:false,inspection:{last:null,next:null,status:'Not commissioned'},modelId:120000+Number(tag.replace(/\D/g,''))});
export const FIRE_POINTS=[
 point('FE-101','A-100','Premix pedestrian approach',-42,-11.6,Math.PI/2,'chemical'),
 point('FE-141','A-140','Pre-G synthesis approach',-30,-27,Math.PI,'chemical'),
 point('FE-161','A-160','Washing / dryer approach',-20,-29,Math.PI,'powder'),
 point('FE-201','A-200','Oxidation south approach',-6,-26,Math.PI,'chemical'),
 point('FE-202','A-200','Oxidation north approach',-4.8,4.2,0,'chemical'),
 point('FE-301','A-300','Fixing area approach',10.4,13.4,0,'chemical'),
 point('FE-401','A-400','Washing rear access',23.4,15.5,0,'general'),
 point('FE-402','A-400','Washing front access',23,30.5,0,'general'),
 point('FE-501','A-500','Sonication operator approach',39,6.6,Math.PI,'general'),
 point('FE-601','A-600','Dryer stair approach',78,5.1,0,'powder'),
 point('FE-602','A-600','Dryer feed approach',46,18.5,Math.PI/2,'powder'),
 point('FE-701','A-700','Pyrolysis west approach',57,35.8,Math.PI,'powder'),
 point('FE-702','A-700','Pyrolysis east approach',83,35.8,Math.PI,'powder'),
 point('FE-801','A-800','Dry reagent stair approach',86,9,0,'reactive'),
 point('FE-802','A-800','Doping service frontage',107.4,43.4,Math.PI,'reactive'),
 point('FE-901','A-900','Future filling / dispatch approach',121,27, -Math.PI/2,'general'),
 point('FE-1001','A-1000','Under-rack aisle west side bay',28,6.8,Math.PI,'chemical'),
 point('FE-1002','A-1000','Wastewater central aisle',35,-13,Math.PI,'chemical'),
 point('FE-1003','A-1000','Wastewater east approach',55,-26,Math.PI/2,'chemical'),
 point('FE-2001','A-2000','RO front approach',77,4.9,Math.PI,'general'),
 point('FE-2002','A-2000','RO east / CIP approach',104.8,-24,-Math.PI/2,'chemical'),
 point('FE-3001','A-3000','Vent-treatment approach',-35,11.7,Math.PI,'chemical'),
 point('FE-4001','A-4000','Compressed-air approach',-25,11.7,Math.PI,'utility'),
 point('FE-5001','A-5000','Heating / cooling approach',-24,30.5,Math.PI,'utility'),
 point('FE-6001','A-6000','Argon source approach',40,51.7,Math.PI,'utility')
];
export const FIRE_REVIEW_HOLDS=[
 {id:'FP-PL601',areaId:'A-600',label:'Dryer elevated operating decks',reason:'Separate elevated stations and their brackets/service bays require platform layout and load review. Grade coverage is not credited upstairs.'},
 {id:'FP-PL801',areaId:'A-800',label:'Borohydride feeder platform',reason:'Specialist agent and unobstructed elevated retrieval location require joint process/fire/platform review.'},
 {id:'FP-PL166',areaId:'A-160',label:'Alternative B elevated filter platform',scenario:'enclosed',reason:'Select an elevated station and rated mounting after platform access review.'},
 {id:'FP-EXIT',areaId:'SHARED',label:'Final building exits, compartments and electrical rooms',reason:'Architectural exits, fire separations, room layouts and occupied floor areas are not defined in this process model.'},
 {id:'FP-HOTWORK',areaId:'SHARED',label:'Maintenance and temporary hot work',reason:'Provide task-specific equipment under the hot-work plan; a mobile point does not replace permanent coverage.'},
 {id:'FP-FIXED',areaId:'SHARED',label:'Fixed suppression, alarm and fire-water assessment',reason:'Portable points do not establish adequate process protection. Confirm the required fixed systems and emergency response arrangements.'}
];
