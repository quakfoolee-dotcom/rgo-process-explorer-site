// Equipment-side approaches, outside chemical containment. These are ground
// access destinations, not proof that every valve or elevated control is reachable.
const stop=(id,area,tag,point)=>({id,label:area+' · '+tag+' approach',area,tag,point,kind:'local-access',finalReachUnverified:true});
export const LOCAL_ACCESS_POINTS=[
 stop('LOCAL-R141A','A-140','R-141A',[-29,-11.5]),
 stop('LOCAL-R141B','A-140','R-141B',[-25,-11.5]),
 stop('LOCAL-R141C','A-140','R-141C',[-29,-23]),
 stop('LOCAL-R141D','A-140','R-141D',[-25,-23]),
 stop('LOCAL-T161','A-160','T-161',[-22.25,-15]),
 stop('LOCAL-T162','A-160','T-162',[-22.25,-20]),
 stop('LOCAL-T163','A-160','T-163 / P-165 service bay',[-23.75,-25]),
 stop('LOCAL-F161','A-160','F-161',[-10.75,-21]),
 stop('LOCAL-D164','A-160','D-164',[-12.25,-15.75]),
 stop('LOCAL-TR164','A-160','TR-164',[-12.5,-17.25]),
 stop('LOCAL-R201A','A-200','R-201A',[-2.5,3.75]),
 stop('LOCAL-R201B','A-200','R-201B',[2.5,-4]),
 stop('LOCAL-R201C','A-200','R-201C',[-2.5,-12.5]),
 stop('LOCAL-R201D','A-200','R-201D',[2.5,-12.5]),
 stop('LOCAL-DOSE201AB','A-200','A/B dosing frontage',[-2.5,-7.5]),
 stop('LOCAL-DOSE201CD','A-200','C/D dosing frontage',[-2.5,-23.5]),
 stop('LOCAL-T201','A-200','T-201',[-10.75,0]),
 stop('LOCAL-T202','A-200','T-202',[-10.5,-6.75]),
 stop('LOCAL-T301','A-300','T-301',[10.75,-6.75]),
 stop('LOCAL-T303','A-300','T-303',[10.75,0]),
 stop('LOCAL-T305','A-300','T-305',[10.75,6.75]),
 stop('LOCAL-T302','A-300','T-302',[10.75,10.5]),
 stop('LOCAL-C301','A-300','C-301',[-1.75,6.25]),
 stop('LOCAL-T304','A-300','T-304',[1,13.5])
];
// Keep each demonstration within a useful work area. All 24 approaches also
// connect to the wider graph; these short tours do not imply approved egress.
export const LOCAL_WALK_CIRCUITS=[
 {id:'preg-access',label:'A-140 · North synthesis frontage',stops:['LOCAL-R141A','LOCAL-R141B']},
 {id:'preg-washing-access',label:'A-160 · Fixing and holding access',stops:['LOCAL-T163','LOCAL-T162','LOCAL-T161']},
 {id:'oxidation-access',label:'A-200 · Reactor and dosing access',stops:['LOCAL-DOSE201CD','LOCAL-R201C','LOCAL-R201D','LOCAL-DOSE201AB','LOCAL-R201B']},
 {id:'fixing-access',label:'A-300 · Peroxide, fixing and wash access',stops:['LOCAL-T301','LOCAL-T303','LOCAL-T305']}
];
