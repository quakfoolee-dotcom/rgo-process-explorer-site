// Task-led concept register. Coordinates are proposed work positions, not a signed exposure survey.
const task=(id,area,label,point,material,work,extra={})=>({id:'EXP-'+id,area,label:area+' · '+label,point,elevationM:0,material,work,eyeRisk:'unassigned',skinRisk:'unassigned',riskAssumption:'high',exposureVerified:false,basis:'Proposed task position from current equipment geometry; confirm working reach, task, SDS and concentration',...extra});
export const ADDITIONAL_EMERGENCY_TASKS=[
 task('101-TRANSFER','A-100','Acid transfer / disconnection',[-41,-11.5],'Sulfuric acid / premix','Transfer connection, isolation and disconnection'),
 task('501-SAMPLE','A-500','T-501 sampling approach',[31,13.25],'Washed GO suspension / cleaning residue','Sampling and isolated cleaning; confirm residue and cleaning agents'),
 task('501-SERVICE','A-500','US-501 cleaning / service',[38,13.25],'GO suspension / cleaning residue','Isolated cell opening and maintenance'),
 task('601-FEED','A-600','T-601 feed-side work',[47,16.5],'Aqueous GO suspension','Feed connection, sampling and isolated tank service'),
 task('601-PUMP','A-600','P-601 feed / recycle service',[53.75,16.5],'Aqueous GO suspension','Isolated pump opening and feed/recycle connections'),
 task('602-TRANSFER','A-600','T-602 powder-transfer service',[62,13.25],'Dry GO / cleaning residue','Isolated receiver and transfer maintenance'),
 task('600-WASH','A-600','Wash return / collection',[74.25,18.5],'Aqueous cleaning effluent','Closed wash collection and disconnection; no solvent assumed'),
 task('701-FEED','A-700','Feed equipment grade service',[62,27],'Dry GO / deposits','Isolated feed equipment maintenance; elevated feeder work assessed separately'),
 task('702-TRANSFER','A-700','T-702 product-transfer service',[86.5,26.5],'rGO powder / deposits','Isolated collection and transfer maintenance'),
 task('701-OFFGAS','A-700','Off-gas equipment service',[83,22],'Off-gas condensate / deposits','Isolated cooler and knock-out maintenance; chemistry assessment pending'),
 task('801-FEED','A-800','RV-801 lower feed service',[93.75,32],'rGO / KBH4 mixture','Isolated lower feed equipment maintenance', {specialHold:'KBH4: qualify supplier-specific decontamination and prevent runoff reaching dry reagent or reactive spill retention.'}),
 task('801-PRODUCT','A-800','PY-801 discharge service',[111.5,31.75],'Doped product / residual reagent','Isolated discharge and product-transfer work'),
 task('801-OFFGAS','A-800','Off-gas maintenance approach',[107.75,37.25],'Off-gas deposits / residual reagent','Isolated cooler and fan service; assess residual reactivity'),
 task('2001-CIP','A-2000','CIP-2001 chemical-service approach',[93.75,-17.5],'Acid / alkaline CIP chemicals','Cleaning connection approach; final hose handling and connection reach require coordinated design'),
 task('2001-WASTE','A-2000','Spent-CIP transfer',[93.25,-25],'Spent acid / alkaline cleaning liquor','Waste transfer and isolated connection service'),
 task('2001-DOSE','A-2000','Antiscalant dosing service',[86,-22],'Antiscalant','Container/dosing service; supplier SDS and concentration pending'),
 task('2001-CEB','A-2000','UF chemical-backwash interface',[80.75,-26],'Vendor-selected CEB chemical','Blinded chemical-enhanced backwash connection; chemical selection pending'),
 task('2001-RO','A-2000','RO cleaning / membrane service',[87,-12],'Residual CIP liquor','Isolated membrane and cleaning manifold service'),
 task('1001-NAOH','A-1000','NaOH dosing service',[20.25,-20],'NaOH','Chemical dosing connection and isolated pump service'),
 task('1002-LIME','A-1000','Lime-slurry dosing service',[28.75,-20],'Lime slurry','Chemical dosing and isolated pump service'),
 task('1003-BARIUM','A-1000','Conditional BaCl2 dosing',[36.5,-20],'BaCl2, if adopted','Conditional chemical dosing connection and maintenance'),
 task('1004-HCL','A-1000','HCl dosing service',[42.5,-20],'HCl','Chemical dosing connection and isolated pump service'),
 task('1005-FLOC','A-1000','Flocculant preparation service',[49.25,-24],'Flocculant','Preparation / container change; supplier SDS pending'),
 task('201-UPPER','A-200','Upper reactor work',[-2.5,-.5],'Reactive acids / oxidizer','Charging, inspection or maintenance above grade',{elevationM:5,accessHold:'Confirm actual platform work position and same-level emergency washing provision; grade route not credited.'}),
 task('166-PLATFORM','A-160','Filter upper work',[-14.5,-17],'Acidic slurry / cleaning residue','Filter opening and maintenance above grade',{elevationM:4,accessHold:'Platform and task elevation require survey; grade station provides no elevated coverage credit.'}),
 task('601-ATOMIZER','A-600','DR-601 atomizer work',[58,12],'GO feed / cleaning residue','Isolated atomizer and chamber service',{elevationM:12.4,accessHold:'Equipment service elevation shown; standing platform and same-level washing provision require design.'}),
 task('601-FILTER','A-600','F-601 filter opening',[63.2,12],'GO dust / cleaning residue','Isolated filter opening and bag replacement',{elevationM:9.4,accessHold:'Equipment service elevation shown; confirm standing deck and same-level emergency access.'}),
 task('701-UPPER','A-700','LK-701 / H-701 upper feed work',[60.5,25],'Dry GO / deposits','Isolated lock and hopper maintenance',{elevationM:7.15,accessHold:'Elevated work position and local washing provision unresolved; do not project onto grade.'}),
 task('802-DOCK','A-800','LK-802 reagent docking',[92,29.5],'KBH4','Dry sealed reagent docking and connection maintenance',{elevationM:13.7,accessHold:'Docking interface elevation shown; operator position, platform and local combination station require coordinated design.',specialHold:'Supplier SDS and decontamination procedure required; keep station runoff away from dry KBH4.'}),
 task('802-FEEDER','A-800','PL-801 feeder service',[94.2,29.5],'KBH4 / rGO mixture','F-802 weighing feeder service from PL-801',{elevationM:7.08,accessHold:'Same-level station space, water and runoff design required; ground station is not credited.'})
];
export const EMERGENCY_AREA_SCOPE=[
 ['A-100','Feed / chemical handling','Complete unloading hose, container and maintenance task survey.'],
 ['A-140','Pre-G','Confirm reactor task positions, chemical quantities and elevated work.'],
 ['A-160','Filtration / fixing','Resolve three local distance gaps and upper filter access.'],
 ['A-200','Oxidation','Confirm dosing tasks, actual exposure positions and upper reactor access.'],
 ['A-300','Quench / separation','Confirm peroxide, HCl and separation task positions.'],
 ['A-400','Washing','Replace sampled viewpoints with final cleaning, sampling and membrane work positions.'],
 ['A-500','Sonication','Confirm cleaning agents, residue classification and operating reach.'],
 ['A-600','Spray drying','Confirm feed, powder, cleaning and elevated service exposures.'],
 ['A-700','Furnace','Confirm powder and condensate hazards; heat and oxygen deficiency need separate controls.'],
 ['A-800','Doping','Prioritize KBH4 handling, same-level access and reactive runoff separation.'],
 ['A-1000','Wastewater','Confirm chemical strengths, actual connections and vessel access.'],
 ['A-2000','Reclaimed water / RO','Confirm CIP, CEB, antiscalant and spent-cleaner tasks.'],
 ['A-3000','Vent gas','Assess scrubber chemical addition, sampling and maintenance exposures.'],
 ['A-4000','Compressed air','Assess condensate, treatment chemicals and maintenance tasks.'],
 ['A-5000','Heating / cooling','Assess thermal-fluid and treatment-chemical contact tasks.'],
 ['A-6000','Argon','Assess maintenance substances; oxygen-deficiency controls are separate.']
].map(([area,label,remaining])=>({area,label,remaining,assessmentComplete:false}));
export const EMERGENCY_REVIEW_ACTIONS=[
 {id:'HAZARDS',owner:'Process safety / industrial hygiene',action:'Approve each eye and skin assessment using actual SDS, concentration, quantity and task, including abnormal and maintenance work.',status:'Open'},
 {id:'ACCESS',owner:'Layout / operations',action:'Confirm exposure positions, clear walking width, same-level provision, final activation reach and measured access times.',status:'Open'},
 {id:'WATER',owner:'Mechanical / plumbing',action:'Calculate dedicated potable tempered-water demand, concurrent casualties, duration, residual pressure, backflow and freeze protection; specify equipment.',status:'Open'},
 {id:'RUNOFF',owner:'Civil / process safety',action:'Design slip-resistant drainage and chemically compatible collection, separated from reactive-spill storage and dry KBH4 handling.',status:'Open'},
 {id:'COMMISSION',owner:'Owner / qualified reviewers',action:'Record installed flow, temperature, duration, activation, signage, training and maintenance results before operational acceptance.',status:'Open'}
];
