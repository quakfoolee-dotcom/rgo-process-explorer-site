// Open pipe ends (V324). A pipe that stops at a battery-limit port or a free end has nothing routed beyond it in the FEED model. Each such vent, relief,
// dust and exhaust line is marked in the Pipe ID view with a blind cap and a tag that says where the line goes outside the FEED scope, so an open end
// reads as a documented hand-off and not as a drawing error. Ports are looked up by id in model.ports; a free end gives its own point.
// Nothing here is a design decision: the destinations are the open items listed in docs/open-vent-lines.md.
export const OPEN_END_KINDS={
 vent:{label:'VENT',color:0xf2a23a,destination:'closed vent to treatment, outside FEED scope'},
 relief:{label:'RELIEF',color:0xe5483c,destination:'relief disposal point, outside FEED scope (HAZOP)'},
 dust:{label:'DUST',color:0xc9a227,destination:'dust collection, outside FEED scope'},
 exhaust:{label:'EXHAUST',color:0x5aa9e6,destination:'permitted discharge after emissions verification'},
 admission:{label:'GAS IN',color:0x7bc96f,destination:'compatible gas admission, supplied outside FEED scope'}
};
export const OPEN_ENDS=[
 {port:'BL-TFF401-VENT',kind:'vent'},{port:'BL-VENTT1002',kind:'vent'},{port:'BL-VENTT1003',kind:'vent'},{port:'BL-VENTT1005',kind:'vent'},
 {port:'BL-PV-301',kind:'vent',destination:'dedicated peroxide vent, outside FEED scope'},{port:'BL-UV501',kind:'vent',destination:'utility vent outlet, outside FEED scope'},
 {port:'BL-VAC164',kind:'vent',destination:'vacuum pump exhaust to treatment, outside FEED scope'},
 {free:[16.05,1.2,19],id:'LINE-358',label:'TFF-401 high-point vent',kind:'vent'},{free:[50.45,8.2,-8.35],id:'LINE-1280',label:'R-1004 closed vent',kind:'vent'},
 {port:'BL-VTDR601',kind:'admission',destination:'wash gas admission; the vent leaves by the A-600 vent header to SC-601'},{port:'BL-VTF601',kind:'admission',destination:'service gas admission; the vent leaves by the A-600 vent header to SC-601'},
 {port:'BL-REL201-A',kind:'relief'},{port:'BL-REL201-B',kind:'relief'},{port:'BL-REL201-C',kind:'relief'},{port:'BL-REL201-D',kind:'relief'},
 {port:'BL-REL501',kind:'relief'},{port:'BL-RV701',kind:'relief'},{port:'BL-REL801',kind:'relief'},{port:'BL-REL6101',kind:'relief',destination:'supplier-assessed relief outlet (argon), outside FEED scope'},{port:'BL-REL6103',kind:'relief',destination:'assessed relief outlet (argon), outside FEED scope'},
 {port:'BL-PG-DUST',kind:'dust'},{port:'BL-OX-DUST',kind:'dust',destination:'oxidizer dust collection, kept separate, outside FEED scope'},{port:'BL-A900-DUST',kind:'dust'},
 {port:'BL-EX601',kind:'exhaust'}
];
// Direction a free end points in: along its last segment, away from the pipe.
function freeAxis(model,pt){let best=null,bd=.2;for(const e of model.edges){const q=e.path;if(!q||q.length<2)continue;for(const [end,prev] of [[q.at(-1),q.at(-2)],[q[0],q[1]]]){const d=Math.hypot(end[0]-pt[0],end[1]-pt[1],end[2]-pt[2]);if(d<bd){const v=end.map((x,i)=>x-prev[i]),l=Math.hypot(...v)||1;bd=d;best=v.map(x=>+(x/l).toFixed(3));}}}return best||[0,1,0];}
// Resolve against a built model; entries whose port or point cannot be found are returned with found:false so a test can fail on them.
export function resolveOpenEnds(model){
 const ports=new Map(model.ports.map(p=>[p.id,p]));
 return OPEN_ENDS.map(e=>{const k=OPEN_END_KINDS[e.kind],p=e.port?ports.get(e.port):null,point=e.free||p?.point;
  return {id:e.port||e.id,kind:e.kind,found:!!point,point:point?[...point]:null,axis:p?.axis||(point?freeAxis(model,point):[1,0,0]),radius:p?.radius||.055,
   title:e.label||'',destination:e.destination||k.destination,
   text:(e.label?e.label+' · ':'')+k.label+' · '+(e.destination||k.destination)};});
}
