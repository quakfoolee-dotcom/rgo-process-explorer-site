const train=(s,services)=>services.map(t=>'XV-RO-'+s+'-'+t);
const duty=s=>train(s,['FEED','BRINE','PERM']);
export const A2000_UNIT={title:'A-2000 reclaimed-water operations',requires:['level','flow','pressure','capacity','membrane','drive','design'],states:{
 hold:{label:'Isolated hold',open:[],seed:'T-2001 to CF-2001',requires:[],drives:[]},
 start:{label:'Startup / off-spec · recycle to T-2001',open:[...duty('A'),'XV-RO-RECYCLE'],seed:'T-2001 to CF-2001',drives:['P-2002A']},
 produce:{label:'Qualified production · A duty, B standby',open:[...duty('A'),'XV-RO-PRODUCT','XV-RO-DISTRIBUTE'],seed:'T-2001 to CF-2001',extra:['T-2002 to P-2005'],requires:['level','flow','pressure','capacity','membrane','drive','design','endpoint'],drives:['P-2002A','P-2005']},
 standby:{label:'A isolated · B duty',open:[...duty('B'),'XV-RO-PRODUCT','XV-RO-DISTRIBUTE'],seed:'T-2001 to CF-2001',extra:['T-2002 to P-2005'],requires:['level','flow','pressure','capacity','membrane','drive','design','endpoint'],drives:['P-2002B','P-2005']},
 backwash:{label:'CF-2001 backwash with RO permeate · RO feed isolated',open:['XV-CF2001-BW','XV-BW-CF-2001-0','XV-BW-CF-2001-1'],seed:'CF-2001 backwash supply from T-2002',extra:['T-2002 to P-2005'],requires:['level','capacity','drive','pressure'],drives:['P-2005']},
 cip:{label:'CIP train A · process outlets isolated',open:train('A',['CIP','CIPRET','CIPPERM']),seed:'CIP-2001 pump suction',requires:['level','capacity','drive','pressure','design'],drives:['P-CIP2001']},
 offspec:{label:'Stored product off-spec · recycle, users isolated',open:['XV-RO-STORED-RECYCLE'],seed:'T-2002 to P-2005',requires:['level','capacity','drive','pressure'],drives:['P-2005']}
},note:'Illustrative hydraulic states only. No live measurements or PLC/SIS control. Quality targets and the condensate and city water acceptance must be qualified. The reject return and the CIP waste boundary stay closed or blinded where noted; receiver capacity limits production. Common carbon-filter and distribution equipment are not redundant.'};
