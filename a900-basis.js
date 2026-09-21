export const A900_SOURCE={document:null,revision:null,drawing:'FEED-PFD-0900',page:14,status:'Required source not available'};
export const A900_LAYOUT={revision:'A900-layout-162',allocation:[109.7,14.2,117,31.1],a800Outlet:[108.8,.80,31.65],basis:'Compact north-south package immediately downstream of PY-801. The allocation stops south of the emergency-access corridor.'};
export const A900_BASIS={source:A900_SOURCE,status:'Proposed pelletization functional foundation; not for construction or operation',decisions:[
 {id:'A900-01',status:'Proposed',subject:'Compact modular line beside A-800',basis:'A-800 has one product outlet and unnecessary transfer distance adds containment, cleaning, support and access burdens.',implementation:'A short sealed transfer supplies one receiving, metering, pellet-formation, cooling/classification and collection line beside PY-801.'},
 {id:'A900-02',status:'Proposed',subject:'Short product transfer',basis:'BL-A900 is at the cooled PY-801 outlet. The former route crossed the plant and obstructed three checked walkway segments.',implementation:'TR-901 is now a short contained lift into H-901. Transfer technology, capacity and motive service remain HOLD.'},
 {id:'A900-03',status:'Open',subject:'Pelletization technology',basis:'The product composition, binder, pellet strength, size and end use are unavailable. Plastic melt-extrusion examples do not establish a process for rGO powder.',implementation:'PG-901 reserves a contained pellet-formation function. Dry compaction, binder agglomeration and polymer compounding remain alternatives pending representative-material trials.'},
 {id:'A900-04',status:'Open',subject:'Argon, dust and exhaust',basis:'AR-901, AR-902 and AR-903 are capped reservations and no qualified emissions characterization or treatment destination is available.',implementation:'The package reserves inerting and local capture functions without declaring a live branch or permitted discharge.'},
 {id:'A900-05',status:'Open',subject:'Product finishing and release',basis:'Cooling duty, classification limits, pellet acceptance, package format, containment, cleaning and reject requirements are unavailable.',implementation:'SC-901 and PK-901 are functional envelopes with no asserted capacity, setpoints, pellet dimensions or package format.'}
]};
const eq=(tag,label,x,z,labelY,operation='a900pelletize',extra={})=>({tag,label,x,z,labelY,areaId:'A-900',designStatus:'proposed',primaryOperation:operation,reviewNote:'Proposed A-900 pelletization envelope; tag, technology, capacity, ratings, materials and operating criteria require an approved source and representative-material trials.',...extra});
export const A900_EQUIPMENT={
 200:eq('TR-901','Short contained product transfer · proposed',109.7,30.5,4.6,'a900receive'),
 201:eq('H-901','Inerted surge / weigh hopper · proposed',112,29.2,5.8,'a900receive',{radius:.65,bottom:2.7,top:4.0}),
 202:eq('F-901','Controlled metering feeder · proposed',112,26.6,3.5),
 203:eq('PG-901','Contained pellet-formation module · technology HOLD',112,23.4,4.8),
 204:eq('SC-901','Cooling and classification module · proposed',112,19.9,3.5,'a900finish'),
 205:eq('PK-901','Product collection / packaging · proposed',112,16.4,3.8,'a900finish'),
 206:eq('RB-901','Sealed reject / recovery receiver · proposed',115,19.9,2.8,'a900reject'),
 207:eq('DC-901','Local dust capture / filter envelope · proposed',115,24.0,5.5,'a900dust'),
 208:eq('CP-901','Control and traceability panel · proposed',115,28.2,2.8,'a900finish')
};
