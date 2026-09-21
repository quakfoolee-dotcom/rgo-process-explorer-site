import * as T from './vendor/three.module.js';
import {buildAreaAllocations} from './area-allocation.js';
import {inRect,feetInches} from './floor-geometry.js';
import {placeAreaLabels,rectanglesOverlap,overlayVisibility} from './area-label-layout.js';
export function createAreaOverlay({model,viewport,getCamera,getState,hitAt,frameArea,onSelect=()=>{}}){
 const allocation=buildAreaAllocations(model);model.floorAllocation=allocation;
 const state={boundaries:true,labels:false,allDimensions:false,selected:null,hover:null};
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.id='area-overlay';svg.setAttribute('aria-hidden','true');viewport.append(svg);
 const labels=document.createElement('div');labels.id='area-floor-labels';viewport.append(labels);
 const tip=document.createElement('div');tip.id='area-hover-card';tip.hidden=true;tip.setAttribute('role','tooltip');viewport.append(tip);
 const parent=document.getElementById('process-overview'),card=document.createElement('details');card.id='area-allocation-tools';card.className='method-note a400-basis-card';card.open=false;
 card.innerHTML='<summary>Process areas · floor allocation</summary><label class="area-check"><input id="area-boundaries" type="checkbox" checked> Floor boundaries</label><label class="area-check"><input id="area-labels" type="checkbox"> Area labels</label><label class="area-check"><input id="area-all-dimensions" type="checkbox"> Show dimensions where space allows</label><label for="floor-area-select">Inspect an area</label><select id="floor-area-select"><option value="">Select an area…</option></select><div id="floor-area-detail" aria-live="polite">Select an area to see dimensions.</div><div class="tool-row"><button id="floor-area-fit">Fit area</button><button id="floor-area-clear">Clear selection</button></div><p class="small-note">Blue: floor allocation · dashed: future reservation. Markings are separate from containment curbs.</p><details><summary>Area measurement basis</summary><p>Gross area includes shared aisles and utility corridors; these are deducted from net area. Use Inspect → Access and maintenance to display reserved zones. Labels appear where space permits; every area remains available in the selector.</p></details>';
 if(allocation.areas.length)parent.prepend(card);else card.hidden=true;
 const select=card.querySelector('select'),detail=card.querySelector('#floor-area-detail');
 const areaText=m2=>`${(m2/.09290304).toFixed(2)} ft² / ${m2.toFixed(2)} m²`;
 const text=a=>`${a.id} · ${a.name}\n${a.dimensions.rectangular?'Allocation dimensions':'Overall extents'}: ${a.dimensions.imperial}\n[${a.dimensions.metric}]\nGross area: ${a.dimensions.area}`;
 const elements=new Map();
 const lastLabelPositions=new Map();let labelCamera='';
 let signature='',cameraSignature='',movingUntil=0,hoverTimer=null,candidate=null,suppressHover=null,pointerDown=false,lastEvent=null,lastHoverAt=0;
 const view=()=>({...getState(),archive:model.scope==='future'}),visibility=()=>overlayVisibility(state,view());
 const visible=a=>getState().areaScope==='all'||getState().areaScope===a.id;
 const current=()=>allocation.areas.find(a=>a.id===state.selected);
 function cancelHover(){clearTimeout(hoverTimer);hoverTimer=null;candidate=null;state.hover=null;tip.hidden=true;}
 function requestHover(id,event){
  if(!visibility().interaction||pointerDown||performance.now()<movingUntil){cancelHover();return;}
  if(suppressHover&&suppressHover!==id)suppressHover=null;
  if(!id||id===state.selected||id===suppressHover){cancelHover();return;}
  if(candidate===id)return;cancelHover();candidate=id;
  hoverTimer=setTimeout(()=>{if(candidate===id&&!pointerDown&&performance.now()>=movingUntil&&visibility().interaction){state.hover=id;draw(true);}},320);
 }
 function inspect(id){cancelHover();suppressHover=id;if(id)onSelect(id);state.selected=id||null;select.value=id||'';detail.replaceChildren();const a=current();
  if(a){for(const line of[text(a),`${a.dimensions.rectangular?'Rectangular allocation':'Irregular allocation; gross area uses the actual polygon, not the enclosing rectangle'} · ${a.status}`,`Shared-space deduction: ${areaText(a.sharedExcludedM2)}.`, `Net area after shared-space deduction: ${areaText(a.netM2)}.`,a.platformBasis,`Linked remote retention: ${a.retention.map(c=>c.tag).join(', ')||'None'}.`,...(a.satelliteCapture.length?[`Separate capture locations: ${[...new Set(a.satelliteCapture.map(c=>c.tag))].join(', ')}; excluded from this main floor allocation.`]:[]),a.basis]){const p=document.createElement('p');p.textContent=line;p.className='small-note';p.style.whiteSpace='pre-line';detail.append(p);}card.open=false;card.scrollIntoView({block:'nearest'});}else detail.textContent='Pause over a floor marking, or select an area.';
  draw(true);
 }
 for(const a of allocation.areas){select.add(new Option(a.id+' · '+a.name+(a.reserved?' · Reserved':''),a.id));const b=document.createElement('button'),span=document.createElement('span');b.type='button';b.className='area-floor-label';span.textContent=a.id;b.append(span);b.setAttribute('aria-label',text(a)+' · '+a.status);b.setAttribute('aria-describedby','area-hover-card');b.onpointerenter=e=>{lastEvent=null;requestHover(a.id,e);};b.onpointerleave=()=>{cancelHover();draw(true);};b.onfocus=()=>requestHover(a.id);b.onblur=()=>{cancelHover();draw(true);};b.onclick=()=>inspect(a.id);labels.append(b);elements.set(a.id,b);}
 select.onchange=()=>inspect(select.value);
 const toolbar=document.createElement('button');toolbar.id='area-markings-toggle';toolbar.type='button';toolbar.setAttribute('aria-controls','area-floor-labels');document.getElementById('dock-visibility').prepend(toolbar);toolbar.hidden=!allocation.areas.length;
 function toggleLabels(value){state.labels=value;card.querySelector('#area-labels').checked=value;cancelHover();draw(true);}
 card.querySelector('#area-boundaries').onchange=e=>{state.boundaries=e.target.checked;cancelHover();draw(true);};
 card.querySelector('#area-labels').onchange=e=>toggleLabels(e.target.checked);
 toolbar.onclick=()=>toggleLabels(!state.labels);
 card.querySelector('#area-all-dimensions').onchange=e=>{state.allDimensions=e.target.checked;draw(true);};
 card.querySelector('#floor-area-clear').onclick=()=>inspect(null);
 card.querySelector('#floor-area-fit').onclick=()=>{const a=current();if(a)frameArea(a);};
 const plane=new T.Plane(new T.Vector3(0,1,0),0),point=new T.Vector3();
 function at(ray){if(!visibility().interaction||!ray.intersectPlane(plane,point))return null;return allocation.areas.find(a=>visible(a)&&a.tiles.some(r=>inRect(point.x,point.z,r)))||null;}
 function pick(hit,ray){if(hit)return false;const a=at(ray);if(!a)return false;inspect(a.id);return true;}
 function navigation(){movingUntil=performance.now()+240;cancelHover();}
 const canvas=viewport.querySelector('canvas');
 canvas.addEventListener('pointerdown',()=>{pointerDown=true;navigation();});
 window.addEventListener('pointerup',()=>{pointerDown=false;});
 canvas.addEventListener('pointercancel',()=>{pointerDown=false;lastEvent=null;navigation();});
 canvas.addEventListener('wheel',navigation,{passive:true});
 function checkHover(){if(!lastEvent||pointerDown||performance.now()<movingUntil||!visibility().interaction)return;const {hit,ray}=hitAt(lastEvent);requestHover(hit?null:at(ray)?.id||null,lastEvent);}
 canvas.addEventListener('pointermove',e=>{lastEvent={clientX:e.clientX,clientY:e.clientY};if(e.buttons){navigation();return;}if(performance.now()-lastHoverAt<100)return;lastHoverAt=performance.now();checkHover();});
 canvas.addEventListener('pointerleave',()=>{lastEvent=null;cancelHover();draw(true);});
 viewport.addEventListener('keydown',e=>{if(e.key==='Escape'){suppressHover=state.hover;cancelHover();draw(true);}});
 function el(tag,attrs){const e=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))e.setAttribute(k,v);return e;}
 const textContext=document.createElement('canvas').getContext('2d');
 function draw(force=false){
  const camera=getCamera(),w=viewport.clientWidth,h=viewport.clientHeight,s=view(),now=performance.now();
  const cs=[...camera.matrixWorld.elements,...camera.projectionMatrix.elements,w,h].join();
  if(cs!==cameraSignature){if(cameraSignature)navigation();cameraSignature=cs;}
  const moving=pointerDown||now<movingUntil;
  const flags=visibility(),sig=[cs,state.boundaries,state.labels,state.selected,state.hover,state.allDimensions,s.areaScope,s.exploded,s.below,s.section,s.measuring,moving].join();
  if(!force&&sig===signature)return;const wasMoving=signature.endsWith(',true');signature=sig;
  svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${w} ${h}`);tip.hidden=true;toolbar.textContent=state.labels?'Area labels on':'Area labels off';toolbar.setAttribute('aria-pressed',String(state.labels));for(const b of elements.values())b.hidden=true;
  if(!flags.boundaries&&!flags.labels)return;
  const project=([x,z])=>{const v=new T.Vector3(x,.028,z).project(camera);return v.z>=-1&&v.z<=1?[(v.x+1)*w/2,(1-v.y)*h/2]:null;};
  function line(a,b,cls){const p=project(a),q=project(b);if(p&&q)svg.append(el('line',{x1:p[0],y1:p[1],x2:q[0],y2:q[1],class:cls}));}
  if(labelCamera!==cs){lastLabelPositions.clear();labelCamera=cs;}
  const activeId=state.hover||state.selected,items=[];
  const fontPx=parseFloat(getComputedStyle(labels).fontSize)||13;textContext.font=`500 ${fontPx}px Arial`;
  const projected=new Map();
  for(const a of allocation.areas){if(!visible(a))continue;const active=a.id===activeId;
   if(flags.boundaries){const cls='area-boundary'+(a.reserved?' reserved':'')+(active?' active':'');for(const[u,v]of a.segments)line(u,v,cls);}
   const [x,z,xx,zz]=a.bounds,corners=[[x,z],[xx,z],[xx,zz],[x,zz]].map(project),points=corners.filter(Boolean);if(points.length<4)continue;
   const regionWidth=Math.max(...points.map(p=>p[0]))-Math.min(...points.map(p=>p[0])),regionHeight=Math.max(...points.map(p=>p[1]))-Math.min(...points.map(p=>p[1]));
   const tile=[...a.tiles].sort((a,b)=>(b[2]-b[0])*(b[3]-b[1])-(a[2]-a[0])*(a[3]-a[1]))[0];if(!tile)continue;
   const positions=[[.5,.5],[.25,.25],[.75,.75],[.75,.25],[.25,.75]].map(([u,v])=>project([tile[0]+u*(tile[2]-tile[0]),tile[1]+v*(tile[3]-tile[1])])).filter(Boolean);
   const previous=lastLabelPositions.get(a.id);if(previous)positions.unshift(previous);
   const data={id:a.id,a,positions,corners,regionWidth,regionHeight,projectedArea:regionWidth*regionHeight,priority:a.id===state.selected?2:a.id===state.hover?1:0,width:Math.max(44,Math.ceil(textContext.measureText(a.id).width+14)),height:Math.max(26,Math.ceil(fontPx*1.8))};projected.set(a.id,data);items.push(data);
  }
  if(flags.boundaries)for(const r of allocation.reservations||[])if(s.areaScope==='all'||s.areaScope===r.areaId)for(const[u,v]of r.segments)line(u,v,'area-boundary reserved');
  const placed=flags.labels?placeAreaLabels(items,w,h):[];
  for(const p of placed){lastLabelPositions.set(p.id,[p.x+p.width/2,p.y+p.height/2]);const b=elements.get(p.id);b.hidden=false;Object.assign(b.style,{left:p.x+'px',top:p.y+'px',width:p.width+'px',height:p.height+'px'});b.classList.toggle('active',p.id===activeId);b.setAttribute('aria-pressed',String(p.id===state.selected));}
  // Edge dimensions require useful screen length; keep complete dimensions in the side panel at any zoom.
  const occupied=[...placed];
  function caption(at,label){const p=project(at);if(!p)return;textContext.font=`${fontPx}px Arial`;const width=textContext.measureText(label).width+12,r={x:p[0]-width/2,y:p[1]-fontPx,width,height:fontPx+8};if(r.x<8||r.x+r.width>w-8||r.y<64||r.y+r.height>h-64||occupied.some(q=>rectanglesOverlap(r,q,8)))return;occupied.push(r);const t=el('text',{x:p[0],y:p[1],class:'area-dimension'});t.textContent=label;svg.append(t);}
  if(!moving&&!s.measuring)for(const p of items){if(!(p.id===state.selected||state.allDimensions)||p.regionWidth<280||p.regionHeight<140)continue;const a=p.a,[x,z,xx,zz]=a.bounds;
   const xLength=Math.hypot(p.corners[0][0]-p.corners[1][0],p.corners[0][1]-p.corners[1][1]),zLength=Math.hypot(p.corners[1][0]-p.corners[2][0],p.corners[1][1]-p.corners[2][1]);
   if(xLength>250){line([x,z-.65],[xx,z-.65],'area-dimension-line');for(const px of[x,xx])line([px,z-.9],[px,z-.4],'area-dimension-line');caption([(x+xx)/2,z-.95],`${feetInches(xx-x)} [${Math.round((xx-x)*1000)} mm]`);}
   if(zLength>250){line([xx+.65,z],[xx+.65,zz],'area-dimension-line');for(const pz of[z,zz])line([xx+.4,pz],[xx+.9,pz],'area-dimension-line');caption([xx+1,(z+zz)/2],`${feetInches(zz-z)} [${Math.round((zz-z)*1000)} mm]`);}
   caption([(x+xx)/2,zz+.8],`Gross: ${a.dimensions.area}`);
  }
  if(state.hover&&state.hover!==state.selected&&!moving&&!s.measuring){const p=projected.get(state.hover);if(p?.positions[0]){tip.textContent=text(p.a);tip.hidden=false;const [x,y]=p.positions[0],tw=tip.offsetWidth,th=tip.offsetHeight;tip.style.left=Math.max(8,Math.min(w-tw-8,x+18))+'px';tip.style.top=Math.max(64,Math.min(h-th-64,y+24))+'px';}}
  if(wasMoving&&!moving)checkHover();
 }
 return {state,pick,draw,inspect,allocation,navigation,toggleLabels};
}
