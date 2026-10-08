// A-600 closed vent header (V324). The DR-601 wash vent and the F-601 service vent stopped at their battery-limit ports with nothing routed beyond,
// so the dryer top vent read as an open pipe. They now tee off downstream of the isolation valves (XV-VTDR601, XV-VTF601) into one DN150 header that
// runs east at y 14 and drops beside the FN-601 exhaust riser into the SC-601 gas inlet line, so the isolated-wash vent goes to the scrubber.
// Built with the catch-up equipment, after the plant-wide pipe supports, so no other rack re-flows; the header has two explicit support posts under the y 14 run, clear of the riser (a post under the riser read as one pipe to the floor, V325).
// Layout and routing for FEED review: no hydraulic, relief or emissions basis (hold U8). The BL-VTDR601 / BL-VTF601 ports stay as the gas admission points.
export const A600_VENT_HEADER={revision:'V324',radius:.075,branchRadius:.055,y:14,zHeader:13.2,xRiser:68,yTee:6.5,
 note:'Closed vent for the isolated chamber and collector wash, routed to the SC-601 gas inlet line. Layout only: vent flow, header size and scrubber duty with the added vent load are not calculated (U8).'};
export function buildA600VentHeader(k){
 const {setContext,line,beam,b}=k,{radius:R,branchRadius:RB,y:Y,zHeader:ZH,xRiser:XR,yTee:YT}=A600_VENT_HEADER;
 setContext(76,'A-600 closed vent header');
 // The FN-601 exhaust riser (x 68, z 12) has radius 0.28: the header ends on its side wall.
 const dr=line([[61.3,Y,12],[61.3,Y,ZH],[XR,Y,ZH],[XR,YT,ZH],[XR,YT,12.29]],R,'DR-601 wash vent to SC-601 header','Vent','DR-601 wash vent (downstream of XV-VTDR601)','FN-601 exhaust line to SC-601');
 const fl=line([[65.425,10,11],[65.425,Y,11],[65.425,Y,ZH-.05]],RB,'F-601 service vent to vent header','Vent','F-601 service vent (downstream of XV-VTF601)','A-600 closed vent header');
 for(const [x,z] of [[63.2,ZH],[66.6,ZH]]){beam([x,.12,z],[x,Y-.35,z],.12,'A-600 vent header post');b('A-600 vent header post foot','frame',[.3,.08,.3],[x,.06,z],'dark');}
 return {routes:[dr.id,fl.id]};
}
