// FEED-PFD-5000, parent V5.1, PDF page 19: draft temperatures, no rated capacity.
export const THERMAL_SERVICES={
 hw:{label:'Hot water',supplyLabel:'HWS',returnLabel:'HWR',supplyC:90,returnC:70,supplyRangeC:[80,95],returnRangeC:[60,80],pfdSupply:'80–95 °C',pfdReturn:'60–80 °C',generation:800,pumps:[801,802],buffer:803,header:804,z:15.2},
 cw:{label:'Cooling water',supplyLabel:'CWS',returnLabel:'CWR',supplyC:27,returnC:37,supplyRangeC:[25,30],returnRangeC:[35,40],pfdSupply:'25–30 °C',pfdReturn:'35–40 °C',generation:810,pumps:[811,812],buffer:813,header:814,z:19.5},
 chw:{label:'Chilled water',supplyLabel:'CHWS',returnLabel:'CHWR',supplyC:6,returnC:12,supplyRangeC:[5,7],returnRangeC:[10,15],pfdSupply:'5–7 °C',pfdReturn:'10–15 °C',generation:820,pumps:[821,822],buffer:823,header:824,z:23.8}
};
const eq=(tag,label,x,z,listed=false,extra={})=>({tag,label,x,z,labelY:3.8,areaId:'A-5000',primaryOperation:'a5000',designStatus:listed?'listed':'proposed',geometryBasis:'A5000-detail-73',geometryStatus:'Proposed dimensions; no thermal capacity or pressure rating',reviewNote:'Heat-load profile, flow, pressure loss, media compatibility, availability and vendor dimensions require qualification.',...extra});
export const A5000_EQUIPMENT={
 800:eq('A-5100','Hot-water generation · electric-heater concept',-27,15.2,true),
 801:eq('A-5110A','Hot-water circulation pump A',-20.6,14.5,true),802:eq('A-5110B','Hot-water circulation pump B',-18.8,14.5,true),
 803:eq('V-5110','Hot-water diaphragm expansion vessel',-23.1,16.3,true,{radius:.23,bottom:.9,top:1.85,labelY:2.4}),804:eq('HD-5100','Hot-water supply and return headers',-14.5,14.3),
 810:eq('A-5200','Closed-circuit evaporative fluid cooler',-27,19.5,true,{labelY:5.6}),
 811:eq('A-5210A','Cooling-water circulation pump A',-20.6,18.8,true),812:eq('A-5210B','Cooling-water circulation pump B',-18.8,18.8,true),
 813:eq('V-5210','Cooling-water diaphragm expansion vessel',-23.1,20.6,false,{radius:.23,bottom:.9,top:1.85,labelY:2.4}),814:eq('HD-5200','Cooling-water supply and return headers',-14.5,18.6),
 820:eq('A-5300','Air-cooled chiller package',-26.8,23.8,true),
 821:eq('A-5310A','Chilled-water circulation pump A',-20.6,23.1,true),822:eq('A-5310B','Chilled-water circulation pump B',-18.8,23.1,true),
 823:eq('V-5310','Chilled-water diaphragm expansion vessel',-23.1,24.9,false,{radius:.23,bottom:.9,top:1.85,labelY:2.4}),824:eq('HD-5300','Chilled-water supply and return headers',-14.5,22.9),
 830:eq('TCU-141','Pre-G isolated heating / cooling loop',-16,15.2),831:eq('TCU-201','Oxidation isolated cooling loop',-16,19.5),
 832:eq('TCU-1001','Wastewater isolated cooling loop',-16,23.8),833:eq('TCU-303','Quench isolated cooling loop',-19.7,26),
 834:eq('CP-5000','Thermal utility controls',-26.8,27.2,false,{labelY:2.2}),
 835:eq('TK-5111','Hot-water buffer',-23.1,15.2),836:eq('TK-5211','Cooling-water buffer',-23.1,19.5),837:eq('TK-5311','Chilled-water buffer',-23.1,23.8)
};
export const A5000_IDS=Object.keys(A5000_EQUIPMENT).map(Number);
export const A5000_HOLDS=[
 ['Thermal duties','Obtain consumer peak / normal kW, temperature windows, batch phase and simultaneous demand. Confirm jacket/exchanger UA and fouling. No rated capacity is assigned.'],
 ['Operating temperatures','Paired 90/70, 27/37 and 6/12 °C values are illustrative design scenarios within the draft ranges. PFD process temperatures are shown separately by equipment and phase. Secondary-loop temperatures remain unknown. No live measurements or calculated temperature field is shown.'],
 ['PFD temperature conflicts','R-141 oxidant shutdown: >88 versus >90 °C. R-201 operation: 45–50 °C versus a ≤49 °C safety note. These conflicts remain open; no protective setting is selected.'],
 ['R-201 cooldown','PFD page 7 specifies cooldown to 10 °C. The model already supplies TCU-201 with chilled water at a draft 5–7 °C, through a separate secondary circuit. Only 3–5 K separates that supply from the 10 °C process target; both exchanger/jacket approaches, flow, fouling and cooldown duration remain unqualified.'],
 ['Generation choices','Electric hot-water heating and an air-cooled chiller are proposed arrangements. Electrical service, efficiency, refrigerant, noise and winter conditions require supplier selection.'],
 ['Cooling-tower reconciliation','The process cooling circuit is closed inside the cooler coil. External evaporative spray water is a separate open circuit: makeup, water treatment, blowdown and winter control remain required.'],
 ['Pump identifiers','Retain PFD A-5110A/B, A-5210A/B and A-5310A/B verbatim. Resolve the A-prefix pump tags against the equipment register before changing them.'],
 ['Circulation and pressure','Duty/standby geometry does not establish 2 × 100% capacity. Confirm system curves, NPSH, minimum flow through generator/pumps, pressurization, expansion volume and relief design.'],
 ['Critical cooling','Reaction calorimetry, reagent accumulation and loss-of-cooling response remain unresolved. Two pumps share power, generation and headers; no emergency-cooling or safe-shutdown credit is assigned.'],
 ['Secondary circuits','TCU-141, TCU-201, TCU-303 and TCU-1001 separate central water from local circuits. Exchanger barrier, contamination detection, media, pressure hierarchy and water-ingress consequences require engineering review.'],
 ['Unselected heat users','HX-601 heating medium is explicitly TBD. Typical 140–145 °C inlet air cannot be produced by 80–95 °C hot water alone through ordinary heat exchange. Final dryer temperatures and A-160 thermal selection require qualification. Unselected interfaces remain blinded and traceable as unresolved.'],
 ['Layout and supports','18.3 × 16.1 m planning envelope, overhead distribution and maintenance spaces are proposed. Check real building limits, airflow, crane access, corrosion environment, seismic loads, insulation and thermal expansion.'],
 ['Reference-driven layout','Equipment-specific cooler and chiller assemblies, insulated pipe envelopes and consumer-side branch isolation. Horizontal header tiers are selected against existing geometry and reserved lifting spaces. Full building and vendor airflow qualification remain open.'],
 ['Insulation','HW 50 mm, CW 25 mm, CHW 40 mm and unselected secondary 50 mm are planning allowances only. Vapour barrier, temperature, dew point, materials and support inserts require specification.'],
 ['Secondary TCU location','Central locations retained pending a consumer-area service-space and chemical segregation study. Relocation is an explicit layout alternative, not a qualified requirement.'],
 ['Completion limits','No issued construction design, operating setpoint, flow guarantee, equipment command or measured temperature is represented.']
];
export const A5000_SOURCES=[['FEED-PFD-5000 · draft V5.1 · PDF page 19','./feed-pfd-5000.pdf'],['BAC · closed-circuit cooling tower separation','https://baltimoreaircoil.com/products/closed-circuit-cooling-towers'],['HSE · reaction hazards and cooling failure','https://www.hse.gov.uk/pubns/indg254.pdf'],['Alfa Laval · countercurrent heat exchange and temperature approach','https://energy.alfalaval.com/alfa-laval-2-pass-gasketed']];
export const A5000_BASIS={revision:'A5000-closeout-75',source:{title:'FEED-PFD-5000',parent:'FEED-PE-PFD-001 V5.1',page:19,status:'Draft — not for use'},footprint:{widthM:18.3,lengthM:16.1,grossM2:294.63},approvedCapacityKW:null,approvedPressureBar:null,operatingData:false,holds:A5000_HOLDS,sources:A5000_SOURCES};
export function temperatureColour(t){if(t===null||t===undefined||!Number.isFinite(t))return '#98a6b5';return t>=80?'#ff4949':t>=40?'#ffd84c':t>=10?'#2686ff':'#a9e5ff';}
export const TEMPERATURE_LEGEND=[['Hot · ≥80 °C','#ff4949'],['Warm · 40 to <80 °C','#ffd84c'],['Cold · 10 to <40 °C','#2686ff'],['Colder · <10 °C','#a9e5ff'],['Unknown temperature','#98a6b5']];
