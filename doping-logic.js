const branches=['H801','H802','F801','F802','H803','MX801','PY801','TR801'];
const AR=['XV-AR801-MAIN',...branches.map(t=>'FCV-AR801-'+t),'FCV-AR801-SEAL'];
const VENTS=['H801','H802','F801','F802','H803','MX801','TR801'].map(t=>'XV-VT801-'+t);
const CW=['XV-PY-801-CWS','XV-PY-801-CWR','XV-E-801-CWS','XV-E-801-CWR'];
const PROTECT=[...AR,...VENTS,...CW,'DV-801-EXH','XV-E801-GASIN'];
const ready=['argon','dryness','oxygen','analyzer','hydrogen','seals','pressure','exhaust','cooling','capacity','drive','design'];
export const DOPING_CONDITIONS={dryness:'Dryness / moisture acceptance unavailable',hydrogen:'Hydrogen condition or monitoring unavailable',ratio:'Feeder weighing or dosing-ratio verification unavailable'};
export const DOPING_UNIT={title:'A-800 doping / pyrolysis',requires:[],states:{
 purge:{label:'Purge protected train · feed and heat off',open:PROTECT,seed:'A800 argon supply',requires:['argon','dryness','pressure','exhaust','seals'],drives:['FN-801'],purge:true},
 receive:{label:'Receive accepted T-702 rGO into H-801',open:[...PROTECT,'XV-702-OUT','XV-801-IN'],seed:'T-702 internal inventory',extra:['A800 argon supply'],requires:[...ready,'temperature','endpoint'],drives:['TR-801','FN-801']},
 charge:{label:'Dock dry reagent into LK-802 · lower gate shut',open:[...PROTECT,'XV-LK802-UP','XV-VT801-LK802'],seed:'LK-802 sealed container feed',requires:['seals','dryness','hydrogen','capacity','pressure','exhaust','design'],drives:['FN-801']},
 lockpurge:{label:'Purge reagent lock · both solids gates shut',open:[...PROTECT,'FCV-AR801-LK802','XV-VT801-LK802'],seed:'A800 argon supply',requires:['argon','dryness','exhaust','pressure','seals'],drives:['FN-801'],purge:true},
 lockrelease:{label:'Release qualified lock into H-802',open:[...PROTECT,'FCV-AR801-LK802','XV-VT801-LK802','XV-LK802-LOW'],seed:'LK-802 inventory',extra:['A800 argon supply'],requires:[...ready,'endpoint'],drives:['FN-801']},
 refill:{label:'Refill weighing feeders · metering stopped',open:[...PROTECT,'XV-801-REFILL','XV-802-REFILL'],seed:'H-801 inventory',extra:['H-802 inventory','A800 argon supply'],requires:[...ready,'level'],drives:['FN-801']},
 mix:{label:'Ratio-meter and mix · furnace inlet shut',open:[...PROTECT,'RUN-F801','RUN-F802'],seed:'F-801 inventory',extra:['F-802 inventory','A800 argon supply'],requires:[...ready,'ratio','level'],drives:['F-801','F-802','MX-801','FN-801']},
 process:{label:'Continuous mixing and thermal treatment',open:[...PROTECT,'RUN-F801','RUN-F802','XV-803-OUT','RUN-RV801','XV-PY801-IN','XV-801-PROD'],seed:'F-801 inventory',extra:['F-802 inventory','A800 argon supply','PY-801 cooling supply','E-801 cooling supply'],requires:[...ready,'ratio','level','temperature','endpoint'],drives:['F-801','F-802','MX-801','RV-801','PY-801 conveying screw','FN-801'],heater:true},
 cooldown:{label:'Controlled cooldown · new feed and heat off',open:PROTECT,seed:'PY-801 process passage',extra:['A800 argon supply','PY-801 cooling supply','E-801 cooling supply'],requires:['argon','pressure','exhaust','cooling','seals'],drives:['PY-801 conveying screw','FN-801']},
 product:{label:'Release accepted cooled product to A-900',open:[...PROTECT,'XV-801-PROD'],seed:'PY-801 process passage',extra:['A800 argon supply'],requires:[...ready,'temperature','endpoint'],drives:['PY-801 conveying screw','FN-801']},
 relief:{label:'Relief-path inspection · feed and heat off',open:['PSV-801'],seed:'PSV-801 protected header takeoff',requires:[],drives:[]},
 utilitydrain:{label:'Isolated cooling-water drain inspection',open:['XV-DR-PY-801-CWS','XV-DR-E-801-CWS','XV-VT-PY-801-CWS','XV-VT-E-801-CWS','XV-DR-PY-801-CW','XV-VT-PY-801-CW','XV-DR-E-801-CW','XV-VT-E-801-CW','XV-DR-PY-801-CWR','XV-DR-E-801-CWR'],seed:'PY-801 cooling annulus',extra:['E-801 cooling annulus'],requires:['pressure','temperature','capacity'],drives:[]},
 residue:{label:'Isolated cold off-gas residue drain inspection',open:['XV-DR801-RES'],seed:'E-801 residue low point internal passage',requires:['pressure','temperature','capacity','dryness','design'],drives:[]},
 isolated:{label:'Cold maintenance isolation',open:[],seed:'PY-801 process passage',requires:['pressure','temperature'],drives:[]}
},note:'Inspection states illustrate connections and required conditions; no live measurements or executable control logic. Draft ratio, thermal program, pressure and oxygen values are held in the source register. Qualified dry Ar, monitoring, seals, off-gas and cooling are required before feed or heat. A rotary valve is not credited as positive isolation; feeder refill accuracy, valve failure responses and residual reactive inventory require detailed design.'};
export function dopingConfiguration(model,state,condition,labels){
 const st=DOPING_UNIT.states[state];if(!st||!labels[condition])throw Error('Invalid A-800 configuration');
 const enabled=condition==='ready'||!st.requires.includes(condition),valves=Object.fromEntries(model.edges.filter(e=>e.barrierTag).map(e=>[e.barrierTag,'closed']));
 let open=enabled?st.open:[],drives=enabled?[...st.drives]:[],seeds=[st.seed,...st.extra||[]],protectionActive=false;
 if(!enabled&&!['isolated','utilitydrain','residue','relief'].includes(state)){
  protectionActive=true;open=[...PROTECT];drives=condition==='exhaust'?[]:['FN-801'];seeds=['PY-801 process passage'];
  if(condition==='argon'||condition==='dryness')open=open.filter(t=>!AR.includes(t));else seeds.push('A800 argon supply');
  if(condition==='cooling')open=open.filter(t=>!CW.includes(t));else seeds.push('PY-801 cooling supply','E-801 cooling supply');
 }
 for(const t of open)valves[t]='open';
 return {unit:'doping',state,condition,enabled,protectionActive,valves,seeds,drives,heater:enabled&&!!st.heater,ultrasound:false,illustrative:true,reasons:enabled?[]:[labels[condition]],argonMode:condition==='argon'?'Unavailable':condition==='dryness'?'Moisture acceptance unavailable':st.purge?'Initial purge':'Regulated protection demand',oxygenStatus:'O₂ / moisture / H₂: illustrated verification only; no live readings.',pressureStatus:'PT-801 → PIC-801 → FN-801; approved settings HOLD.',protectiveNote:protectionActive?'Feed and heat blocked. Available protection is shown as a demand; approved failure responses and residual-inventory management remain open.':''};
}
