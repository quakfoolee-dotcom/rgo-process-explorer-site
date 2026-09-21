// A-4000: project-record duties; proposed geometry and unqualified design inputs.
const eq=(tag,label,x,z,listed=true,extra={})=>({tag,label,x,z,labelY:3.2,areaId:'A-4000',primaryOperation:'a4000',designStatus:listed?'listed':'proposed',geometryBasis:'A4000-64',geometryStatus:'Concept layout only; vendor dimensions, pressure ratings and capacity unresolved',reviewNote:'Consumer duty, ISO 8573-1 quality, compressor selection, relief sizing and BC pressure-equipment acceptance remain open.',...extra});
export const A4000_EQUIPMENT={
700:eq('K-4001A','Air compressor A',-27.5,1.65),701:eq('K-4001B','Air compressor B',-27.5,4.3),
702:eq('E-4001A','Aftercooler A',-25.65,1.65),703:eq('E-4001B','Aftercooler B',-25.65,4.3),
704:eq('D-4001A','Condensate separator A',-24.3,1.65),705:eq('D-4001B','Condensate separator B',-24.3,4.3),
706:eq('T-4001','Wet air receiver',-22.25,1.65,true,{radius:.56,bottom:.5,top:2.75}),
707:eq('AD-4001','Desiccant dryer · twin towers',-22.6,4.65),
708:eq('F-4001','Intake filtration · paired elements',-28,1.65),
709:eq('F-4002','Dryer outlet particulate filter',-24.55,6.4),710:eq('F-4003','Final air filter · grade unresolved',-25.55,6.4),
711:eq('PSV-4001','Wet receiver pressure relief',-22.25,1.65,true,{labelY:4}),
712:eq('PF-4001','Proposed dryer protective prefilter',-22.25,3.25,false),
713:eq('T-4002','Proposed protected dry-air reserve',-22.1,7,false,{radius:.48,bottom:.5,top:2.5}),
714:eq('HD-4001','Instrument-air distribution',-22.1,8.8,false),
715:eq('TK-CD4001','Closed condensate collection package',-27.5,6.6,false,{radius:.38,bottom:.25,top:1.3}),
716:eq('CP-4000','Compressor / air-quality controls',-25.5,7.5,false,{labelY:2.2}),
717:eq('BL-PA4000','Isolated service-air outlet',-27.4,8.8,false,{labelY:2.3}),
718:eq('BL-PC4000','Blinded process-contact air interface',-24,8.8,false,{labelY:2.3}),
719:eq('PSV-4002','Proposed dry receiver pressure relief',-22.1,7,false,{labelY:3.8})
};
export const A4000_IDS=Object.keys(A4000_EQUIPMENT).map(Number);
export const A4000_CONSUMERS=[
...['A','B','C','D'].map((s,i)=>({tag:'BL-IA201-'+s,area:'A-200',equipment:'R-201'+s,owner:[1,2,54,55][i],service:'Actuator manifold',status:'Connected in model; internal actuator tubing is vendor scope',normalNm3H:null,peakNm3H:null,minBarg:null,quality:null,reserveMinutes:null})),
...['A-100','A-140','A-160','A-300','A-400','A-500','A-600','A-700','A-800','A-900','A-1000','A-2000','A-3000','A-5000','A-6000'].map(area=>({tag:'SURVEY-'+area,area,equipment:'Consumer survey',service:area==='A-600'?'Confirm actuator / pulse-cleaning demands; BL-601 bulk air excluded':'Confirm pneumatic users with package supplier',status:'Unresolved demand; no invented consumer connection',normalNm3H:null,peakNm3H:null,minBarg:null,quality:null,reserveMinutes:null}))
];
export const A4000_SCENARIOS=[
['normal','Normal supply'],['aFault','Compressor A unavailable'],['bFault','Compressor B unavailable'],['powerLoss','Common power loss'],['dryerFault','Dryer unavailable'],['highDewPoint','High outlet dew point'],['filterDP','High filter differential pressure'],['lowPressure','Low instrument-air pressure'],['serviceDemand','Excessive service-air demand'],['maintenance','Dryer isolated for maintenance'],['reserveEmpty','Dry reserve depleted'],['condensateHigh','Condensate collection high level']
];
export const A4000_HOLDS=[
['Demand and pressure','Obtain normal / simultaneous peak consumption, minimum pressure and allowed pressure drop per consumer; state all flow reference conditions.'],
['Air quality','Agree ISO 8573-1 particles/water/oil classes, coldest downstream temperature, pressure dew point and direct-contact requirements. Oil-free compression alone does not establish delivered quality.'],
['Availability','Two compressors are modeled, but 2 × 100% duty is not established. AD-4001, filters, power and controls remain common failure points. Protected dry reserve only offers finite endurance.'],
['PFD reconciliation','Project records list streams 4001–4013. Exact stream-to-line assignment and filter duties require the source drawing; model route IDs are not asserted as PFD stream numbers. PF-4001, T-4002, PSV-4002 and associated controls are proposed tag reservations.'],
['Intake / cooling','A-3000 is adjacent. Intake heads show candidate geometry only; contaminant dispersion, heat rejection, noise and winter conditions may require ducting or relocation.'],
['Pressure equipment','Confirm MAWP, relief settings/capacity/backpressure, materials, CRN/design registration, applicable CSA B51 / piping code, permits and inspection with Technical Safety BC. Flat-ended receiver geometry is conceptual, not a pressure-vessel fabrication detail.'],
['Condensate','Auto-drain outlets enter a closed collection package with separate nonreturn paths. Package must include qualified depressurization, vent treatment, high-level shutdown and backflow prevention. Its pump-out remains blinded pending waste characterization and receiving acceptance.'],
['Isolation and fail states','Electrical and pneumatic energy must be isolated and pressure verified released before maintenance. Shared-loop isolation needs both directions controlled. Critical valve fail actions and safe process shutdown sequence require P&ID / HAZOP confirmation.'],
['Structure and access','Service envelopes and pipe supports are geometry allowances. Verify vendor removal dimensions, load paths, seismic restraint and supporting structure ratings.'],
['Reserve basis','Reserve calculation uses ideal-gas isothermal screening with absolute pressure and stated normal conditions. Rapid withdrawal, regulator dynamics and temperature changes require detailed verification.']
];
export const A4000_SOURCES=[
['Technical Safety BC · pressure equipment','https://www.technicalsafetybc.ca/technologies/boilers-pressure-vessels/boiler-pressure-vessel-design-registration'],
['WorkSafeBC · de-energization and lockout','https://www.worksafebc.com/en/law-policy/occupational-health-safety/searchable-ohs-regulation/ohs-regulation/part-10-de-energization-and-lockout'],
['Atlas Copco · compressed-air quality','https://www.atlascopco.com/en-us/compressors/wiki/compressed-air-articles/compressed-air-quality']
];
export const A4000_ACCESS_ZONES=[
{id:'WALK-A4000',kind:'pedestrian',areaIds:['A-4000'],min:[-28.8,.02,9.15],max:[-21.2,2.3,9.95],note:'Front approach; connect to site aisle. Final clear width subject to access review.'},
{id:'SERVICE-K4001',kind:'maintenance',areaIds:['A-4000'],min:[-28.65,.25,2.55],max:[-26.5,2.4,3.4],note:'Compressor service aisle between packages; vendor withdrawal dimensions HOLD.'},
{id:'REMOVE-AD4001',kind:'removal',areaIds:['A-4000'],min:[-23.55,3,4.2],max:[-21.6,4.7,5.1],note:'Vertical desiccant / cartridge withdrawal allowance; shutdown and lifting method HOLD.'}
];
export const A4000_BASIS={revision:'A4000-64',source:{title:'FEED-PFD-4000',parent:'FEED-PE-PFD-001 V5.1',page:18,status:'Draft project records; exact stream crosswalk pending drawing verification'},footprint:{widthM:8,lengthM:10,areaM2:80},flowsReference:'Nm³ at 0°C and 101.325 kPa absolute; convert supplier FAD before entry',geometryResizesWithInputs:false,approvedOperatingLimits:null,regulatoryQualified:false,holds:A4000_HOLDS,sources:A4000_SOURCES};
