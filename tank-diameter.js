import {Vector3,Matrix4,MathUtils} from './vendor/three.module.js';
const near=(a,b)=>Math.abs(a-b)<1e-7;
export function tankDiameter(part,worldPoint){
 const no=reason=>({valid:false,reason});
 if(!part||part.system!=='shell')return no('Select the tank shell or jacket wall. Lids, nozzles and supports are excluded.');
 if(!near(Math.abs(part.scale.x),Math.abs(part.scale.z)))return no('This section is not circular after scaling. Use point-to-point measurement for its width.');
 const matrix=new Matrix4().compose(part.position,part.quaternion,part.scale),local=new Vector3(...worldPoint).applyMatrix4(matrix.clone().invert()),g=part.geometry,s=Math.abs(part.scale.x);
 let outer,inner=null,y,taper=false;
 if(part.measurementShell){const p=part.measurementShell;y=MathUtils.clamp(local.y,-p.height/2,p.height/2);outer=p.outerRadius;inner=p.innerRadius;}
 else if(g.type==='CylinderGeometry'){
  const p=g.parameters;y=MathUtils.clamp(local.y,-p.height/2,p.height/2);const t=(y+p.height/2)/p.height;outer=MathUtils.lerp(p.radiusBottom,p.radiusTop,t);taper=!near(p.radiusBottom,p.radiusTop);
 }else if(g.type==='LatheGeometry'){
  const profile=g.parameters?.points;if(!profile?.length)return no('The shell profile is unavailable.');
  const ymin=Math.min(...profile.map(p=>p.y)),ymax=Math.max(...profile.map(p=>p.y));y=MathUtils.clamp(local.y,ymin+1e-8,ymax-1e-8);const hits=[];
  for(let i=1;i<profile.length;i++){const a=profile[i-1],b=profile[i];if(near(a.y,b.y)||y<Math.min(a.y,b.y)||y>Math.max(a.y,b.y))continue;hits.push({r:MathUtils.lerp(a.x,b.x,(y-a.y)/(b.y-a.y)),slope:(b.x-a.x)/(b.y-a.y)});}
  hits.sort((a,b)=>a.r-b.r);if(!hits.length)return no('No circular shell section is defined at this position.');outer=hits.at(-1).r;taper=Math.abs(hits.at(-1).slope)>1e-7;const inside=hits.find(p=>p.r>0&&p.r<outer-1e-7);inner=inside?.r||null;
 }else return no('This shell has no supported circular profile. Use point-to-point measurement for rectangular tanks or irregular enclosures.');
 if(!(outer>0)||!Number.isFinite(outer))return no('Select a shell section away from the tip or edge.');
 const jacket=/jacket/i.test(part.name),inside=/inner shell/i.test(part.name),surface=/inner process shell|thermal jacket layer/i.test(part.name);
 const label=inside?'Inside surface diameter':surface?'Selected layer diameter':jacket?'Jacket outside diameter':taper?'Section outside diameter':'Shell outside diameter';
 const shortLabel=inside?'ID':surface?'Surface':jacket?'Jacket OD':'OD';
 const center=new Vector3(0,y,0).applyMatrix4(matrix),axis=new Vector3(0,1,0).transformDirection(matrix);
 return {valid:true,kind:taper?'Tapered shell section':jacket?'Tank jacket':'Tank shell',name:part.name,partCode:part.code,parts:new Set([part.id]),center:center.toArray(),axis:axis.toArray(),outer:2*outer*s,inner:inner?2*inner*s:null,diameterLabel:label,shortLabel,innerLabel:jacket?'Modeled jacket inside diameter':'Modeled shell inside diameter',elevation:center.y,taper,basis:'Selected modeled shell layer only. Nozzles, supports and external insulation allowances are excluded; vessel capacity and fabrication dimensions are not inferred.'};
}
