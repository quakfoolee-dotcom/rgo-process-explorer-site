const train=(s,services)=>services.map(t=>'XV-RO-'+s+'-'+t);
const duty=['XV-UF2001-FEED',...['A','B'].flatMap(s=>train(s,['FEED','BRINE','PERM']))];
export const A2000_UNIT={title:'A-2000 reclaimed-water operations',requires:['level','flow','pressure','capacity','membrane','drive','design'],states:{
 hold:{label:'Isolated hold',open:[],seed:'T-2001 to P-2001',requires:[],drives:[]},
 start:{label:'Startup / off-spec · recycle to T-2001',open:[...duty,'XV-RO-RECYCLE'],seed:'T-2001 to P-2001',drives:['P-2001','P-UF2001','P-2002A','P-2002B']},
 produce:{label:'Qualified production · A/B duty, C standby',open:[...duty,'XV-RO-PRODUCT','XV-RO-DISTRIBUTE'],seed:'T-2001 to P-2001',extra:['T-2002 to P-2005'],requires:['level','flow','pressure','capacity','membrane','drive','design','endpoint'],drives:['P-2001','P-UF2001','P-2002A','P-2002B','P-2005']},
 standby:{label:'A isolated · B/C duty',open:['XV-UF2001-FEED',...['B','C'].flatMap(s=>train(s,['FEED','BRINE','PERM'])),'XV-RO-PRODUCT','XV-RO-DISTRIBUTE'],seed:'T-2001 to P-2001',extra:['T-2002 to P-2005'],requires:['level','flow','pressure','capacity','membrane','drive','design','endpoint'],drives:['P-2001','P-UF2001','P-2002B','P-2002C','P-2005']},
 backwash:{label:'UF backwash · RO feed isolated',open:['XV-UF2001-BW','XV-UF2001-WASTE-0','XV-UF2001-WASTE-1'],seed:'UF filtrate pump suction',extra:['Backwash lift suction'],requires:['level','capacity','drive','pressure'],drives:['P-UF2001','P-BW2001']},
 cip:{label:'CIP train A · process outlets isolated',open:train('A',['CIP','CIPRET','CIPPERM']),seed:'CIP-2001 pump suction',requires:['level','capacity','drive','pressure','design'],drives:['P-CIP2001']},
 offspec:{label:'Stored product off-spec · recycle, users isolated',open:['XV-RO-STORED-RECYCLE'],seed:'T-2002 to P-2005',requires:['level','capacity','drive','pressure'],drives:['P-2005']}
},note:'Illustrative hydraulic states only. No live measurements or PLC/SIS control. PFD quality targets and measured feed acceptance must be qualified. Discharge boundaries remain blinded; receiver capacity limits production. Common pretreatment and distribution equipment are not redundant.'};
