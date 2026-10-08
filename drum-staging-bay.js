import * as T from './vendor/three.module.js';
// Drum staging bay SB-1 (V321): floor marking and a spill-containment pad for one pallet of four chemical drums. A display aid for the forklift tracing,
// not yet a model equipment record: the chemical, its hazard class, segregation and the containment volume are not selected.
export const STAGING_BAY=Object.freeze({trayTop:.03,rim:.1,approachFromSouth:true});
export function createStagingBay(bay){
 const g=new T.Group();g.name='Drum staging bay '+bay.id;g.position.set(bay.x,0,bay.z);
 const mat=(color,roughness=.7,metalness=.1)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const box=(x,y,z,sx,sy,sz,m,name='')=>{const o=new T.Mesh(new T.BoxGeometry(sx,sy,sz),m);o.position.set(x,y,z);o.name=name;g.add(o);return o;};
 const yellow=mat(0xf4bd37,.6),grey=mat(0x5b6b7e,.55,.35),dark=mat(0x202a32);
 const h=bay.pad/2,m=h+.18;
 // painted outline 0.18 m outside the containment pad
 for(const s of [-1,1]){box(0,.006,s*m,2*m+.1,.012,.1,yellow,'Bay marking');box(s*m,.006,0,.1,.012,2*m+.1,yellow,'Bay marking');}
 // containment pad with a low rim on three sides; the south side is the open access ramp for the forks
 box(0,STAGING_BAY.trayTop/2,0,bay.pad,STAGING_BAY.trayTop,bay.pad,grey,'Spill containment pad');
 for(const x of [-1,1])box(x*(h-.03),STAGING_BAY.rim/2,0,.06,STAGING_BAY.rim,bay.pad,grey,'Containment rim');
 box(0,STAGING_BAY.rim/2,h-.03,bay.pad,STAGING_BAY.rim,.06,grey,'Containment rim');
 // sign post on the north rim
 box(-h-.05,.6,h+.05,.05,1.2,.05,dark,'Sign post');
 const canvas=typeof document!=='undefined'?document.createElement('canvas'):null,ctx=canvas?.getContext?.('2d');
 if(ctx){canvas.width=256;canvas.height=128;ctx.fillStyle='#f4bd37';ctx.fillRect(0,0,256,128);ctx.fillStyle='#101820';ctx.font='700 40px system-ui,sans-serif';ctx.textBaseline='middle';ctx.fillText(bay.id,16,40);ctx.font='600 22px system-ui,sans-serif';ctx.fillText('CHEMICAL DRUMS',16,86);
  const sign=new T.Mesh(new T.PlaneGeometry(.5,.25),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),side:T.DoubleSide}));sign.position.set(-h-.05,1.1,h+.05);sign.name='Bay sign';g.add(sign);}
 return g;
}
