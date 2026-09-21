import {componentEnvelope} from './access-review.js';
import {ACCESS_ZONES} from './access-layout.js';
// Select a lower distribution tier only when its paired horizontal corridor clears
// existing geometry AND reserved access/lifting spaces. Final whole-route audit is separate.
export function selectThermalHeaderLayout(h){
 const {T,parts,EQUIPMENT}=h,V=p=>new T.Vector3(...p),bounds=parts.filter(p=>!(p.reactor>=5&&p.reactor<=18)&&!['internal','fastener'].includes(p.system)).map(p=>({id:p.id,b:componentEnvelope(p,p.system==='pipe'?.06:.025)}));
 const zones=ACCESS_ZONES.filter(z=>z.kind!=='utility').map(z=>({id:z.id,b:new T.Box3(V(z.min),V(z.max))})),placed=[],decisions=[];
 function choose(name,minX,maxX,z,minimum,previous,zWidth=.16){const tried=[];for(let y=minimum;y<=Math.max(previous+2,15)+.01;y+=.4){y=Math.round(y*100)/100;const bb=new T.Box3(V([minX,y-.16,z-zWidth]),V([maxX,y+.32+.16,z+zWidth])),hits=[...bounds,...zones,...placed].filter(o=>o.b.intersectsBox(bb)||placed.includes(o)&&Math.abs((o.b.min.y+.16)-y)<.72);tried.push({heightM:y,obstructions:hits.length});if(!hits.length){placed.push({id:name,b:bb});decisions.push({name,supplyY:y,returnY:y+.32,previousSupplyY:previous,tried,qualification:'Horizontal corridor screening; full route, pipe stress and building limits require review'});return y;}}decisions.push({name,supplyY:previous,returnY:previous+.32,previousSupplyY:previous,tried,qualification:'HOLD: no clear lower corridor found; previous planning elevation retained'});return previous;}
 const primary={hw:choose('HW',-31.6,-8,3.8,7.2,9.6),cw:choose('CW',-31.6,118,3.8,7.2,10.3),chw:choose('CHW',-31.6,47,3.8,7.2,11)};
 // The secondary span includes the remote wastewater loop; use its complete planning span.
 const secondary={},owners=[[39,40,41,42],[1,2,54,55],[126],[4]];for(let i=0;i<4;i++){const xs=[EQUIPMENT[830+i].x,...owners[i].map(id=>EQUIPMENT[id].x)];secondary['secondary-'+(830+i)]=choose('Secondary '+(830+i),Math.min(...xs)-5,Math.max(...xs)+5,2.8,i===1?8.4:7.2,12.2+i*.7,.46);}
 return {primary,secondary,decisions,qualified:false};
}
