// Source facts and proposed implementation choices stay separate from geometry.
export const A800_SOURCE={document:'FEED-PE-PFD-001',revision:'V5.1',drawing:'FEED-PFD-0800',page:13,status:'Draft — not for use'};
// D-MDL-11 (QFL 2026-10-08, 30 ft building ceiling): the feed stack (lock, hoppers, feeders, mixer, surge hopper and rotary valve), its access platform and the
// upper argon bank stand 5 m lower, and the elevator discharges 5.3 m lower. The pit under the lower end of the stack is 4.5 m deep; the furnace feed
// climbs out of it on an enclosed lift. Levels follow from lowerBy; nothing else in A-800 moves.
export const A800_PIT={revision:'V330',decision:'D-MDL-11',date:'2026-10-08',lowerBy:5,elevatorLowerBy:5.3,depth:4.5,floorY:-4.5,rect:[88.6,28.4,95.8,30.9],upperFloor:7.08-5,
 note:'Pit and lowered stack for a 30 ft building ceiling. The pit is a confined space (argon is heavier than air): forced ventilation, oxygen monitoring and rescue provisions are required and are not designed. Slab cut, sump, drainage and the water table are not assessed.'};
export const A800_BASIS={source:A800_SOURCE,carrierGas:'Ar',approvedSetpoints:null,
 draftValues:{reagentRatio:{value:1,unit:'kg KBH₄ / kg rGO'},temperature:{value:750,unit:'°C'},ramp:{value:5,unit:'°C/min'},residence:{value:2,unit:'h'},pressure:{value:2,unit:'psig'},oxygen:{value:10,unit:'ppm maximum stated in draft'},fanInlet:{value:[60,90],unit:'°C'}},
 decisions:[
  {id:'A800-01',status:'Open',subject:'RV-801 destination',basis:'Drawing arrows 806 / 807 connect H-803 → RV-801 → PY-801. General Note 2 instead names F-801.',implementation:'Follow the drawn route for this concept; obtain document-owner confirmation.'},
  {id:'A800-02',status:'Open',subject:'Thermal and reagent basis',basis:'Draft ratio, thermal program, residence, pressure and oxygen values are source references, not approved operating setpoints.',implementation:'Qualification requires reaction testing, gas evolution, residence distribution, product quality and vendor design.'},
  {id:'A800-03',status:'Proposed',subject:'Contained transfer and refill',basis:'Low T-702 outlet and elevated H-801 need powered transfer. H-802 needs dry contained charging.',implementation:'TR-801 enclosed elevator and LK-802 double-isolation charge chamber; leakage, material behavior and capacities remain unqualified.'},
  {id:'A800-04',status:'Open',subject:'Off-gas and relief',basis:'PSV-801 note mentions a cyclone without a tagged cyclone symbol. F-802 EX802 has a separate treatment route.',implementation:'Retain E-801 → FN-801 and separate EX802 / relief paths. No unlisted cyclone is assumed; characterize H₂ and boron-bearing particulate / condensate.'},
  {id:'A800-05',status:'Open',subject:'Moisture and cooling separation',basis:'Dry KBH₄ handling and cooling water are separate PFD services.',implementation:'No process-water cleaning connection. Cooling circuits are indirect; leak detection, dew point and disposal method require qualification.'},
  {id:'A800-06',status:'Open',subject:'Continuous operation',basis:'Feeder refill, mixing, surge capacity and furnace residence jointly constrain throughput.',implementation:'Separate refill inspection states; no guarantee of continuous mass-flow accuracy during refill. RV-801 leakage is not credited as positive isolation.'}
 ],references:[{title:'Potassium borohydride supplier safety information',url:'https://www.sigmaaldrich.com/US/en/product/mm/820747'}]};
const eq=(tag,label,x,z,labelY,listed=false,extra={})=>({tag,label,x,z,labelY,areaId:'A-800',designStatus:listed?'listed':'proposed',primaryOperation:'a800feed',reviewNote:listed?'PFD-listed duty; geometry, capacity, materials and operating limits remain conceptual.':'Proposed A-800 addition; master tag register, equipment sizing and detailed design require review.',...extra});
export const A800_EQUIPMENT={
 101:eq('TR-801','Contained rGO elevator',90,25,14-A800_PIT.elevatorLowerBy),
 102:eq('H-801','rGO feed hopper',92,25,11.8-A800_PIT.lowerBy,true,{radius:.68,bottom:9.7-A800_PIT.lowerBy,top:10.8-A800_PIT.lowerBy,apex:8.8-A800_PIT.lowerBy}),
 103:eq('H-802','Dry KBH₄ feed hopper',92,28.3,11.8-A800_PIT.lowerBy,true,{radius:.62,bottom:9.7-A800_PIT.lowerBy,top:10.8-A800_PIT.lowerBy,apex:8.8-A800_PIT.lowerBy}),
 104:eq('F-801','rGO weighing feeder',92,25,8.4-A800_PIT.lowerBy,true,{radius:.43,bottom:7.55-A800_PIT.lowerBy,top:8.05-A800_PIT.lowerBy,apex:7.1-A800_PIT.lowerBy}),
 105:eq('F-802','KBH₄ weighing feeder',92,28.3,8.4-A800_PIT.lowerBy,true,{radius:.40,bottom:7.55-A800_PIT.lowerBy,top:8.05-A800_PIT.lowerBy,apex:7.1-A800_PIT.lowerBy}),
 106:eq('MX-801','Inerted ploughshare mixer',92,27.2,6.8-A800_PIT.lowerBy,true),
 107:eq('H-803','Mixed solids surge hopper',92,30,5.1-A800_PIT.lowerBy,true,{radius:.52,bottom:4.0-A800_PIT.lowerBy,top:4.7-A800_PIT.lowerBy,apex:3.3-A800_PIT.lowerBy}),
 108:eq('RV-801','Furnace feed rotary valve',92,30,3.4-A800_PIT.lowerBy,true),
 109:eq('PY-801','Doping pyrolysis and cooling furnace',101,30,4.2,true,{primaryOperation:'a800thermal'}),
 110:eq('E-801','A-800 off-gas cooler',104,35,5.8,true,{primaryOperation:'a800atmosphere'}),
 111:eq('FN-801','A-800 pressure-control fan',110,35,5.6,true,{primaryOperation:'a800atmosphere'}),
 112:eq('AR-801','Dry argon regulation and branches',96,40,3.4,false,{primaryOperation:'a800atmosphere'}),
 113:eq('AIT-801','O₂ / moisture / H₂ verification',106,40,3.7,false,{primaryOperation:'a800atmosphere'}),
 114:eq('PL-801','Feeder access and equipment supports',94,21.7,8.1-A800_PIT.lowerBy),
 115:eq('LK-802','Dry reagent charge lock',92,28.3,14.2-A800_PIT.lowerBy,false,{radius:.36,bottom:12.1-A800_PIT.lowerBy,top:12.8-A800_PIT.lowerBy,apex:11.65-A800_PIT.lowerBy}),
 116:eq('BL-800-UTIL','A-800 utilities and A-900 interface',116,37,4.9,false,{designStatus:'interface',primaryOperation:'a800atmosphere'})
};
export const A800_TAG_RESERVATIONS={areaId:'A-800',status:'Proposed; reconcile master register',equipment:['TR-801','AR-801','AIT-801','PL-801','LK-802'],rule:'PFD-listed H / F / MX / RV / PY / E / FN / PSV tags retained. Added local instruments and isolation valves use the 800 area series.'};
