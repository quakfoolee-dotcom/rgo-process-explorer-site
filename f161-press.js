// F-161 membrane filter press body per FEED-PE-DAT-067 V1.1 sections 3 and 5 (indicative, vendor GA to replace, hold J9):
// 31 PP plates 1,000 x 1,000 x 60 mm (16 chamber + 15 membrane = 30 chambers), 1.86 m closed pack, 1.1 m plate-shifting
// space, 4.61 m overall. Local frame: u runs along the press from the fixed-head outer face, v across it, y above the floor
// the press stands on. The same body serves the at-grade baseline and the elevated arrangement over D-164.
export const F161_PRESS={plateSizeMm:1000,plates:31,chambers:30,plateThicknessM:.06,closedPackM:1.86,shiftingSpaceM:1.1,overallLengthM:4.61,source:'FEED-PE-DAT-067 V1.1 sections 3 and 5'};
export function buildF161Press(k,sk,{origin,along='x',pc,support='grade',onDeck=null,hpu,panel,curtainU=null,curtainV=.88}){
 const {T,b,c}=k,[ox,oy,oz]=origin,alongX=along==='x';
 const W=(u,y,v)=>alongX?[ox+u,oy+y,oz+v]:[ox-v,oy+y,oz+u],S=([su,sh,sv])=>alongX?[su,sh,sv]:[sv,sh,su],U=alongX?[1,0,0]:[0,0,1],A=alongX?[0,0,1]:[1,0,0];
 const B=(name,sys,size,[u,y,v],mat,q)=>b(name,sys,S(size),W(u,y,v),mat,q),C=(name,sys,r,len,[u,y,v],mat,axis)=>c(name,sys,r,len,W(u,y,v),mat,axis);
 const TH=.15,TP=.06,NP=31,P0=TH,P1=P0+NP*TP,F1=P1+TH,T0=3.3,T1=T0+TH,C1=4.55,PC=pc;
 for(let j=0;j<NP;j++){const u=P0+(j+.5)*TP,mem=j%2===1,m=mem?'lining':'inner';for(const y of[PC-.465,PC+.465])B('F-161 plate frame top bottom','head',[TP-.004,.07,1],[u,y,0],m);for(const v of[-.465,.465])B('F-161 plate frame side','head',[TP-.004,.86,.07],[u,PC,v],m);B(mem?'F-161 membrane diaphragm':'F-161 filter cloth','internal',[TP-.03,.86,.86],[u,PC,0],mem?'dark':'inner');for(const s of[-1,1])B('F-161 plate handle','head',[TP-.02,.08,.16],[u,PC+.295,s*.58],m);}
 // Protected frame: fixed and tail heads on legs, side beams carrying the plates, moving head and closing cylinder.
 const head=(name,ua)=>B(name,'head',[TH,1.35,1.44],[ua+TH/2,PC-.025,0]),fixedHead=head('F-161 fixed head',0),tailHead=head('F-161 tail (cylinder) head',T0);
 for(const s of[-1,1]){const beam=sk.beam(W(TH,PC+.13,s*.62),W(T0,PC+.13,s*.62),.24,'F-161 side beam',.16);sk.join(fixedHead,beam,W(TH,PC+.13,s*.62),'Filter head / side beam');sk.join(tailHead,beam,W(T0,PC+.13,s*.62),'Filter head / side beam');}
 // Legs stand on anchored baseplates at grade, or on bearing plates that the caller joins to its deck steel.
 const leg=(u,v,top,tag,w)=>{if(support==='grade'){const [x,,z]=W(u,0,v);return sk.column(x,z,top,tag,w).post;}const plate=b(tag+' deck bearing plate','frame',[.36,.03,.36],W(u,.015,v)),post=sk.beam(W(u,.03,v),W(u,top,v),w,tag+' column');sk.join(plate,post,W(u,.03,v),tag+' bearing plate / column');onDeck(plate,W(u,0,v));return post;};
 for(const [hd,u] of[[fixedHead,TH/2],[tailHead,T0+TH/2]]){sk.load(hd,'F-161 filter frame');for(const s of[-1,1]){const post=leg(u,s*.70,PC-.7,'F-161 filter frame',.12);sk.join(hd,post,W(u,PC-.7,s*.70),'Filter head / column');}}
 B('F-161 follower head','head',[TH,1.2,1.06],[P1+TH/2,PC,0]);for(const s of[-1,1])B('F-161 follower saddle','head',[TH-.02,.125,.22],[P1+TH/2,PC+.3175,s*.61]);B('F-161 ram coupling','head',[.08,.32,.32],[F1+.04,PC,0]);
 C('F-161 hydraulic ram rod','pump',.085,T0-F1-.08,[(T0+F1+.08)/2,PC,0],'bright',U);const ram=C('F-161 hydraulic ram','pump',.19,C1-T1,[(C1+T1)/2,PC,0],'blue',U);C('F-161 hydraulic cylinder end cap','pump',.16,.06,[C1+.03,PC,0],'blue',U);sk.join(tailHead,ram,W(T1,PC,0),'Tail head / cylinder');const saddle=leg(C1-.32,0,PC-.19,'F-161 cylinder saddle',.14);sk.join(ram,saddle,W(C1-.32,PC-.19,0),'Cylinder / saddle');
 // Automatic features (DAT-067 4.5): plate shifter on both beams, cloth-wash gantry parked at the fixed head, drip trays, light curtains.
 for(const s of[-1,1]){B('F-161 plate-shifter carriage','pump',[.25,.31,.125],[F1+.425,PC+.145,s*.7675],'blue');B('F-161 plate-shifter drive gearbox','pump',[.24,.22,.195],[T0-.18,PC-.08,s*.8025],'blue');C('F-161 plate-shifter drive motor','pump',.075,.28,[T0-.18,PC-.33,s*.8],'blue');}
 const gu=.62;for(const s of[-1,1]){B('F-161 cloth-wash travel carriage','head',[.36,.24,.15],[gu,PC+.27,s*.795],'bright');B('F-161 cloth-wash gantry upright','head',[.1,1.51,.1],[gu,PC+1.145,s*.82],'bright');}B('F-161 cloth-wash gantry top beam','head',[.14,.12,1.9],[gu,PC+1.92,0],'bright');B('F-161 cloth-wash lift gearmotor','pump',[.28,.2,.4],[gu,PC+2.08,0],'blue');C('F-161 cloth-wash spray header','pipe',.035,1.68,[gu-.11,PC+.68,0],'bright',A);
 const t0=P0+.02,t1=T0-.05,trays=[];for(const s of[-1,1]){trays.push(B('F-161 drip tray leaf','head',[t1-t0,.008,.6],[(t0+t1)/2,PC-.6,s*.305],'bright',new T.Quaternion().setFromAxisAngle(new T.Vector3(...U),-s*.1)));C('F-161 drip tray hinge shaft','head',.025,t1-t0+.02,[(t0+t1)/2,PC-.58,s*.61],'bright',U);}
 for(const u of curtainU||[-.21,T1+.12])for(const s of[-1,1])B('F-161 light curtain post','frame',[.06,3.17,.06],[u,1.615,s*curtainV],'red');
 // Hydraulic power unit and local PLC / operator panel; the caller sets positions clear of walkways and piping.
 const [hu,hv]=hpu;B('F-161 HPU skid base','frame',[.95,.1,.7],[hu,.05,hv]);B('F-161 hydraulic power unit oil tank','pump',[.85,.52,.6],[hu,.36,hv],'blue');C('F-161 HPU electric motor','pump',.13,.43,[hu-.2,.75,hv],'blue',U);B('F-161 HPU valve manifold','valve',[.2,.18,.3],[hu+.27,.71,hv+.1],'bright');
 const [pu,pv,face]=panel;B('F-161 local PLC / operator panel','frame',[.6,1.7,.35],[pu,1.05,pv],'dark');B('F-161 panel plinth','frame',[.6,.2,.35],[pu,.1,pv]);B('F-161 panel HMI screen','frame',[.3,.23,.006],[pu,1.6,pv+face*.178],'dial');
 return {W,S,U,A,TH,TP,P0,P1,F1,T0,T1,C1,PC,fixedHead,tailHead,trays};
}
