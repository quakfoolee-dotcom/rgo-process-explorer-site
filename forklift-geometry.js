import * as T from './vendor/three.module.js';

// Wheel dimensions/track are illustration assumptions. Half-width includes hubs.
export const FORKLIFT_WHEELS=Object.freeze({rearHalfTrack:.425,rearRadius:.22,rearHalfWidth:.092,frontHalfTrack:.445,frontRadius:.3});

export function buildForkliftGeometry(){
 const root=new T.Group();root.name='Animated ECX25 reference forklift';
 const painted=color=>new T.MeshPhysicalMaterial({color,metalness:.28,roughness:.36,clearcoat:.32});
 const plain=(color,metalness=.1,roughness=.58)=>new T.MeshStandardMaterial({color,metalness,roughness});
 const yellow=painted(0xf4bd37),dark=plain(0x202a32),rubber=plain(0x151a1d,0,.88),steel=plain(0xa7b4bf,.72,.27),wood=plain(0x986b42,0,.86),blue=painted(0x247f9b),skin=plain(0xce9a77),vest=plain(0xffdf28),uniform=plain(0x245d76),silver=plain(0xdce9e8,.15),red=plain(0xac3038),glass=painted(0xa6d4e3);
 const mesh=(geometry,material,x=0,y=0,z=0,parent=root,name='')=>{const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.name=name;parent.add(m);return m;};
 const box=(x,y,z,sx,sy,sz,m,parent=root,name='')=>mesh(new T.BoxGeometry(sx,sy,sz),m,x,y,z,parent,name);
 function roundShape(w,h,r){const s=new T.Shape(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s;}
 function rounded(x,y,z,w,h,d,r,m,parent=root,name=''){
  const bevel=Math.min(.012,d/6,r/3),g=new T.ExtrudeGeometry(roundShape(w-2*bevel,h-2*bevel,Math.max(.002,r-bevel)),{depth:d-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:8,steps:1});g.translate(0,0,-d/2+bevel);return mesh(g,m,x,y,z,parent,name);
 }
 function rod(a,b,r,m,parent=root,name='') {const start=new T.Vector3(...a),end=new T.Vector3(...b),d=end.clone().sub(start),o=mesh(new T.CylinderGeometry(r,r,d.length(),12),m,...start.clone().add(end).multiplyScalar(.5).toArray(),parent,name);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.normalize());return o;}
 function profile(points,depth,m,z,name,bevel=.008){const s=new T.Shape();points.forEach((p,i)=>i?s.lineTo(...p):s.moveTo(...p));s.closePath();const g=new T.ExtrudeGeometry(s,{depth:depth-2*bevel,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,steps:1,curveSegments:8});g.translate(0,0,z-depth/2+bevel);return mesh(g,m,0,0,0,root,name);}
 // Rounded/tapered counterweight, with its underside above the rear tyre sweep.
 const rings=[{y:.50,x0:-1.97,x1:-1.11,w:.45,r:.18},{y:.69,x0:-1.985,x1:-1.10,w:.557,r:.21},{y:.98,x0:-1.93,x1:-1.11,w:.54,r:.23},{y:1.12,x0:-1.80,x1:-1.22,w:.47,r:.18}];
 const ring=(a)=>{const pts=[];for(const [x,z,start]of [[a.x1-a.r,a.w-a.r,0],[a.x0+a.r,a.w-a.r,Math.PI/2],[a.x0+a.r,-a.w+a.r,Math.PI],[a.x1-a.r,-a.w+a.r,Math.PI*1.5]])for(let j=0;j<8;j++){const t=start+j*Math.PI/16;pts.push([x+a.r*Math.cos(t),a.y,z+a.r*Math.sin(t)]);}return pts;};
 const rr=rings.map(ring),vertices=rr.flat(2),indices=[],n=rr[0].length;
 for(let k=0;k<rr.length-1;k++)for(let j=0;j<n;j++){const a=k*n+j,b=k*n+(j+1)%n,c=(k+1)*n+j,d=(k+1)*n+(j+1)%n;indices.push(a,c,b,b,c,d);}
 for(let j=1;j<n-1;j++){indices.push(0,j,j+1);const a=(rr.length-1)*n;indices.push(a,a+j+1,a+j);}
 const shell=new T.BufferGeometry();shell.setAttribute('position',new T.Float32BufferAttribute(vertices,3));shell.setIndex(indices);shell.computeVertexNormals();mesh(shell,yellow,0,0,0,root,'Curved counterweight');
 rounded(-1.947,.63,0,.065,.14,.68,.028,dark,root,'Rear bumper');
 for(const z of [-.29,.29])rounded(-1.932,.86,z,.032,.08,.14,.02,red,root,'Rear lamp');
 for(const y of [.735,.785,.835])rounded(-1.968,y,0,.018,.017,.32,.006,dark,root,'Rear cooling grille');
 // Narrow structural spine leaves space for rear steering. No solid block behind tyres.
 rounded(-.88,.185,0,2.0,.14,.44,.04,dark,root,'Chassis spine');
 rounded(-.73,.405,0,.82,.085,.82,.035,dark,root,'Recessed footwell');
 const sideProfile=[[-1.15,.29],[-.36,.29],[-.35,.42],[-.60,.46],[-.78,.68],[-.85,.87],[-1.13,.89]];
 for(const side of [-1,1]){
  profile(sideProfile,.065,yellow,side*.475,'Sculpted side panel');
  rounded(-.67,.30,side*.50,.43,.055,.105,.018,steel,root,'Access step');
  const arch=new T.Shape();arch.absarc(0,.3,.37,0,Math.PI,false);arch.absarc(0,.3,.335,Math.PI,0,true);arch.closePath();
  const g=new T.ExtrudeGeometry(arch,{depth:.07,bevelEnabled:false,curveSegments:24,steps:1});g.translate(0,0,side*.49-.035);mesh(g,yellow,0,0,0,root,'Front wheel arch');
 }
 const wheels=[],rearSteering=[];
 for(const x of [0,-1.5])for(const side of [-1,1]){
  const radius=x===0?.3:.22,width=x===0?.2:.16,track=x===0?FORKLIFT_WHEELS.frontHalfTrack:FORKLIFT_WHEELS.rearHalfTrack;
  const steering=new T.Group();steering.name=x===0?'Front wheel':'Rear steering wheel';steering.position.set(x,radius,side*track);root.add(steering);
  const spin=new T.Group();steering.add(spin);
  const contour=[[.57,-.5],[.87,-.5],[.975,-.33],[1,0],[.975,.33],[.87,.5],[.57,.5],[.57,-.5]].map(([r,w])=>new T.Vector2(radius*r,width*w));
  const tyre=mesh(new T.LatheGeometry(contour,40),rubber,0,0,0,spin,'Rounded cushion tyre');tyre.rotation.x=Math.PI/2;
  const rim=mesh(new T.CylinderGeometry(radius*.57,radius*.57,width+.008,32),yellow,0,0,0,spin,'Wheel rim');rim.rotation.x=Math.PI/2;
  const hub=mesh(new T.CylinderGeometry(radius*.22,radius*.22,width+.016,24),steel,0,0,0,spin,'Axle hub');hub.rotation.x=Math.PI/2;
  for(const z of [-width*.25,width*.25])mesh(new T.TorusGeometry(radius-.004,.003,6,40),dark,0,0,z,spin,'Tyre groove');
  for(let k=0;k<6;k++){const a=k*Math.PI/3;mesh(new T.SphereGeometry(.006,8,6),steel,Math.cos(a)*radius*.39,Math.sin(a)*radius*.39,side*(width/2+.004),spin,'Wheel bolt');}
  wheels.push({spin,radius});if(x<0)rearSteering.push(steering);
 }
 // Shaped seat, dashboard, angled column and open operator compartment.
 rounded(-.97,1.075,0,.50,.145,.54,.06,dark,root,'Seat cushion');
 const back=rounded(-1.17,1.36,0,.13,.49,.54,.06,dark,root,'Seat back');back.rotation.z=.10;
 rounded(-.36,1.05,0,.20,.17,.64,.045,dark,root,'Instrument console');
 rounded(-.42,1.145,0,.10,.018,.22,.006,glass,root,'Instrument display');
 rod([-.30,.55,0],[-.42,1.28,0],.032,dark,root,'Steering column');
 const wheel=mesh(new T.TorusGeometry(.155,.018,10,32),dark,-.43,1.31,0,root,'Steering wheel');wheel.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(-.72,.694,0).normalize());
 for(const z of [-.23,.23]){rod([-.30,1.05,z],[-.34,1.27,z],.012,steel);mesh(new T.SphereGeometry(.027,12,8),dark,-.34,1.27,z);}
 for(const side of [-1,1]){rod([-1.62,1.03,side*.46],[-1.53,2.17,side*.46],.035,dark);rod([-.29,.73,side*.46],[-.09,2.17,side*.46],.035,dark);rod([-1.56,2.185,side*.47],[-.04,2.185,side*.47],.028,dark);}
 rounded(-.82,2.205,0,1.65,.06,1.06,.022,dark,root,'Rounded overhead guard');
 for(const z of [-.33,0,.33])rod([-1.59,2.165,z],[-.06,2.165,z],.015,steel);
 // Seated operator, yellow hard hat / reflective vest and blue workwear.
 rounded(-.88,1.40,0,.28,.44,.40,.04,vest,root,'Operator safety vest');
 for(const y of [1.28,1.38])box(-.727,y,0,.015,.025,.40,silver);
 rod([-.73,1.22,-.23],[-1.05,1.61,.23],.019,dark,root,'Seat belt');
 mesh(new T.SphereGeometry(.12,20,14),skin,-.85,1.77,0);
 const helmet=mesh(new T.SphereGeometry(.147,24,12,0,Math.PI*2,0,Math.PI/2),yellow,-.85,1.85,0);helmet.scale.x=1.07;
 const brim=mesh(new T.CylinderGeometry(.16,.16,.017,24),yellow,-.85,1.85,0);brim.scale.x=1.08;
 for(const z of [-.16,.16]){
  rod([-.88,1.15,z],[-.51,.91,z],.084,uniform);rod([-.51,.91,z],[-.35,.56,z],.061,uniform);
  rounded(-.28,.50,z,.25,.10,.14,.025,dark);
  rod([-.86,1.55,z],[-.62,1.37,z],.054,uniform);rod([-.62,1.37,z],[-.44,1.32,z],.043,uniform);mesh(new T.SphereGeometry(.047,12,8),dark,-.43,1.32,z);
 }
 // Nested mast rails, visible lift cylinder, hose loop and open load backrest.
 for(const z of [-.34,.34]){box(.29,1.08,z,.12,2.04,.09,dark);box(.365,1.08,z,.035,1.92,.046,steel);}
 for(const y of [.20,1.10,2.05])box(.29,y,0,.13,.08,.77,dark);
 rod([.265,.28,0],[.265,1.15,0],.048,dark);rod([.265,1.13,0],[.265,1.98,0],.027,steel);
 const hose=new T.CatmullRomCurve3([[.20,.45,-.19],[.20,1.15,-.19],[.21,1.48,-.11],[.24,1.20,-.06]].map(p=>new T.Vector3(...p)));mesh(new T.TubeGeometry(hose,28,.016,8,false),rubber);
 for(const z of [-.46,.46])box(.408,.79,z,.065,1.06,.045,dark);
 for(const y of [.29,.74,1.31])box(.408,y,0,.065,.045,.96,dark);
 for(const z of [-.30,-.15,0,.15,.30])box(.408,.81,z,.042,1.0,.025,dark);
 for(const z of [-.34,.34])profile([[.397,.108],[1.575,.108],[1.585,.119],[1.51,.139],[.458,.139],[.449,.185],[.449,.69],[.397,.69]],.105,steel,z,'Shaped fork heel and blade',.005);
 for(const x of [.51,1,1.49])box(x,.18,0,.12,.08,1.2,wood);
 for(const z of [-.48,-.24,0,.24,.48])box(1,.24,z,1.2,.06,.18,wood);
 for(const z of [-.3,.3]){
  mesh(new T.CylinderGeometry(.27,.27,.83,40),blue,1,.685,z);
  for(const y of [.285,.48,.87,1.092])mesh(new T.TorusGeometry(.272,.008,8,40),blue,1,y,z).rotation.x=Math.PI/2;
  const lid=mesh(new T.CylinderGeometry(.262,.262,.012,40),blue,1,1.102,z);mesh(new T.CylinderGeometry(.024,.024,.014,16),steel,1.14,1.116,z);
 }
 return {group:root,wheels,rearSteering};
}
