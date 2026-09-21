const AR=['XV-AR701-MAIN','XV-AR701-BUF','XV-AR701-SEAL','XV-AR701-END','XV-AR701-COOL','XV-AR701-PROD','XV-H701-BAL'];
const GAS=['DV-701-EXH','XV-AIT-701-F','XV-AIT-701-B'];
const CW=['XV-E701-CWS','XV-E701-CWR','XV-E702-CWS','XV-E702-CWR'];
const PROTECT=[...AR,...GAS,...CW,'FCV-AR701-RUN'];
const CONDITIONS=['argon','oxygen','analyzer','seals','pressure','exhaust','cooling','level','capacity','temperature','drive','design'];
export const FURNACE_CONDITIONS={argon:'Required argon supply / branch flow unavailable',oxygen:'Oxygen acceptance not verified',analyzer:'Oxygen analyzer or sample-flow verification unavailable',seals:'Required seal / isolation position unverified'};
export const FURNACE_UNIT={title:'A700 continuous furnace / argon atmosphere',requires:[],states:{
 lockload:{label:'Fill transfer lock · furnace side closed',open:[...PROTECT,'XV-602-OUT','XV-LK701-UP','XV-LK701-AIR','BLD-602-VENT'],seed:'T-602 product outlet',extra:['A700 argon supply'],requires:['endpoint','capacity','drive','seals','argon','pressure','exhaust'],drives:['TR-701','FN-701']},
 lockpurge:{label:'Purge filled lock · both powder gates closed',open:[...PROTECT,'XV-AR701-LOCK','XV-LK701-VENT','XV-AIT-701-L'],seed:'A700 argon supply',requires:['argon','pressure','exhaust','seals'],drives:['FN-701'],purge:true},
 equalize:{label:'Equalize qualified lock with sealed buffer',open:[...PROTECT,'XV-LK701-EQ','XV-AIT-701-L'],seed:'LK-701 internal inventory',extra:['A700 argon supply'],requires:['argon','oxygen','analyzer','pressure','seals','capacity'],drives:['FN-701']},
 lockdischarge:{label:'Transfer qualified lock inventory to H-701',open:[...PROTECT,'XV-LK701-LOW','XV-LK701-EQ','XV-AIT-701-L'],seed:'LK-701 internal inventory',extra:['A700 argon supply'],requires:['argon','oxygen','analyzer','pressure','seals','capacity','endpoint'],drives:['FN-701']},
 purge:{label:'Initial furnace purge · feed and heat disabled',open:[...AR,...GAS,...CW,'XV-AR701-PURGE'],seed:'A700 argon supply',requires:['argon','pressure','exhaust','seals'],drives:['FN-701'],purge:true},
 process:{label:'Continuous processing from protected buffer',open:[...PROTECT,'XV-PY701-IN'],seed:'H-701 internal inventory',extra:['A700 argon supply','E702 cooling supply','E701 cooling supply'],requires:CONDITIONS,drives:['C-701','PY-701 internal transport','E-702','FN-701'],heater:true},
 cooldown:{label:'Controlled cooldown · feed and heat disabled',open:PROTECT,seed:'A700 argon supply',extra:['E702 cooling supply','E701 cooling supply'],requires:['argon','exhaust','pressure','cooling','seals'],drives:['PY-701 internal transport','E-702','FN-701']},
 product:{label:'Release cooled accepted product to A800',open:[...PROTECT,'XV-702-OUT'],seed:'T-702 internal inventory',extra:['A700 argon supply'],requires:['argon','oxygen','analyzer','temperature','pressure','capacity','endpoint','seals'],drives:['FN-701']},
 drain:{label:'Isolated condensate drain inspection',open:['XV-DRKO701'],seed:'KO-701 condensate takeoff',requires:['pressure','temperature','capacity'],drives:[]},
 isolated:{label:'Cold maintenance isolation · all drives stopped',open:[],seed:'PY-701 argon process volume',requires:['temperature','pressure'],drives:[]}
},note:'Illustrated FEED states only. Oxygen values, purge rates, thermal limits and pressure sign/setpoint are HOLD. The lock fills from the air side, purges with both powder gates shut, then equalizes and discharges to a sealed buffer. Initial purging does not require oxygen to already be below the acceptance limit. This is not an executable startup or safety system.'};
export function furnaceConfiguration(model,state,condition,labels){
 const s=FURNACE_UNIT.states[state];if(!s||!labels[condition])throw Error('Invalid furnace inspection configuration');
 const enabled=condition==='ready'||!s.requires.includes(condition),valves=Object.fromEntries(model.edges.filter(e=>e.barrierTag).map(e=>[e.barrierTag,'closed']));
 let open=enabled?s.open:[],drives=enabled?[...s.drives]:[],seeds=[s.seed,...s.extra||[]],protectionActive=false;
 if(!enabled&&!['isolated','drain'].includes(state)){
  protectionActive=true;open=[...PROTECT];drives=condition==='exhaust'?[]:['FN-701'];
  if(condition==='argon')open=open.filter(t=>!AR.includes(t)&&t!=='FCV-AR701-RUN');
  if(condition==='cooling')open=open.filter(t=>!CW.includes(t));
  if(condition==='analyzer')open=open.filter(t=>!t.startsWith('XV-AIT'));
  seeds=['PY-701 argon process volume'];if(condition!=='argon')seeds.push('A700 argon supply');if(condition!=='cooling')seeds.push('E702 cooling supply','E701 cooling supply');
 }
 for(const tag of open)valves[tag]='open';
 const result={unit:'furnace',state,condition,valves,enabled,protectionActive,reasons:enabled?[]:[labels[condition]],seeds,drives,heater:enabled&&!!s.heater,ultrasound:false,illustrative:true,argonMode:condition==='argon'?'unavailable':s.purge&&enabled?'initial purge':open.includes('FCV-AR701-RUN')?'regulated process protection':'isolated',oxygenStatus:condition==='oxygen'?'Acceptance unverified':condition==='analyzer'?'Analyzer / sample flow unavailable':'Illustrated verification only · no live reading',pressureStatus:'PIC-701 → FN-701 draft demand · sign / setpoint HOLD',protectiveNote:protectionActive?'Feed and heat are blocked. Available protection circuits are shown as demands; residual heat, utility failures and final valve responses require an approved cause-and-effect study.':''};
 const issues=inspectAtmosphereConfiguration(result);if(issues.length)throw Error(issues.join('; '));return result;
}
export function inspectAtmosphereConfiguration(cfg){const o=t=>cfg.valves[t]==='open',issues=[];
 if(o('XV-LK701-UP')&&o('XV-LK701-LOW'))issues.push('Both lock powder gates open');
 if(o('XV-LK701-AIR')&&(o('XV-LK701-LOW')||o('XV-LK701-EQ')||o('XV-AR701-LOCK')))issues.push('Air-side vent bypasses the inert boundary');
 if(o('XV-LK701-UP')&&(o('XV-LK701-EQ')||o('XV-AR701-LOCK')))issues.push('Open loading gate during inert connection');
 if(cfg.heater&&(!cfg.enabled||cfg.condition!=='ready'&&FURNACE_UNIT.states.process.requires.includes(cfg.condition)))issues.push('Heat enabled without required conditions');
 return issues;}
