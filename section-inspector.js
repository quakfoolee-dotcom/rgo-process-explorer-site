import * as T from './vendor/three.module.js';

// Shared with the existing equipment sweep: 0% retains all, 100% removes all.
export function sectionLimits(bounds,axis){
 const pad=Math.max(.002,(bounds.max[axis]-bounds.min[axis])*1e-5);
 return {min:bounds.min[axis]-pad,max:bounds.max[axis]+pad};
}
export function sectionFraction(value,bounds,axis,flip=false){
 const {min,max}=sectionLimits(bounds,axis),t=T.MathUtils.clamp((value-min)/(max-min),0,1);
 return flip?t:1-t;
}
// Project a world axis into screen space. Looking directly along that axis uses
// a vertical gesture, so front/top views can still move the plane through depth.
export function sectionDragBasis(camera,anchor,axis,rect,span){
 camera.updateMatrixWorld();const unit=Math.max(.01,span*.1),end=anchor.clone();end[axis]+=unit;
 const a=anchor.clone().project(camera),b=end.project(camera);
 const x=(b.x-a.x)*rect.width/2,y=-(b.y-a.y)*rect.height/2,length=Math.hypot(x,y);
 if(length<2||!Number.isFinite(length))return {x:0,y:-1,unitsPerPixel:span/Math.max(100,rect.height*.7),depth:true};
 return {x:x/length,y:y/length,unitsPerPixel:unit/length,depth:false};
}

export function mountSectionInspector({scene,viewport,trigger,getState,getCamera,getControls,onChange,onCapture=null}){
 const stage=viewport.parentElement,panel=document.createElement('section');panel.id='section-inspector';panel.hidden=true;
 panel.setAttribute('aria-label','Movable section inspection');
 panel.innerHTML=`<div class="section-inspector-heading"><strong>Section inspection</strong><button id="slice-exit" aria-label="Exit section inspection">×</button></div>
 <div class="slice-fields"><label>Scope<select id="slice-scope"><option value="equipment">Selected equipment</option><option value="visible">Visible plant</option></select></label><label>Axis<select id="slice-axis"><option value="x">X · Left / right</option><option value="y">Y · Bottom / top</option><option value="z">Z · Front / back</option></select></label></div>
 <p id="slice-target" class="slice-note"></p><button id="slice-selection" hidden>Use current selection</button>
 <label for="slice-position">Move cut <output id="slice-percent"></output></label><input id="slice-position" type="range" min="0" max="1000" step="1" value="500">
 <label for="slice-value" id="slice-value-label">Plane coordinate (m)</label><div class="slice-coordinate"><button id="slice-minus" aria-label="Move section minus 0.01 metres">−</button><input id="slice-value" type="number" step="0.01"><button id="slice-plus" aria-label="Move section plus 0.01 metres">+</button></div>
 <div class="slice-actions"><button id="slice-flip" aria-pressed="false">Reverse cut</button><button id="slice-reset">Centre cut</button><button id="slice-photo" title="Download a high-resolution PNG of this section">Photo Shot</button></div><label class="slice-guide-row"><input id="slice-guide" type="checkbox" checked> Guide</label><p id="slice-photo-status" class="slice-note" role="status" aria-live="polite" hidden></p>
 <p id="slice-hint" class="slice-note">Drag the cyan handle or use the slider. Cut faces are open.</p>`;
 stage.append(panel);
 const handle=document.createElement('button');handle.id='section-drag-handle';handle.hidden=true;handle.textContent='↔';handle.title='Drag to move section';handle.setAttribute('aria-label','Move section plane. Drag, or use arrow keys.');stage.append(handle);
 trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-expanded','false');
 const $=id=>panel.querySelector('#'+id),guide=new T.LineLoop(new T.BufferGeometry().setAttribute('position',new T.Float32BufferAttribute(new Float32Array(12),3)),new T.LineBasicMaterial({color:0x73d5f2,depthTest:false,transparent:true,opacity:.8}));
 guide.name='Movable section plane guide';guide.visible=false;guide.frustumCulled=false;guide.renderOrder=25;scene.add(guide);
 let drag=null,photoBusy=false;
 function finish(){if(!drag)return;const old=drag;drag=null;old.controls.enabled=old.enabled;handle.releasePointerCapture?.(old.id);handle.classList.remove('dragging');}
 function coordinate(value){const s=getState();if(s.slice&&Number.isFinite(value))onChange({fraction:sectionFraction(value,s.slice.bounds,s.axis,s.flip)});}
 $('slice-scope').onchange=()=>onChange({scope:$('slice-scope').value});
 $('slice-selection').onclick=()=>onChange({scope:'equipment'});
 $('slice-axis').onchange=()=>{finish();onChange({axis:$('slice-axis').value});};
 $('slice-position').oninput=e=>onChange({fraction:Number(e.target.value)/1000});
 $('slice-value').oninput=e=>{if(e.target.value.trim()!=='')coordinate(Number(e.target.value));};
 $('slice-value').onblur=()=>sync();
 $('slice-minus').onclick=()=>coordinate(getState().slice.value-.01);
 $('slice-plus').onclick=()=>coordinate(getState().slice.value+.01);
 $('slice-flip').onclick=()=>onChange({flip:!getState().flip});
 $('slice-reset').onclick=()=>onChange({fraction:.5});
 $('slice-guide').onchange=()=>onChange({show:$('slice-guide').checked});
 $('slice-photo').onclick=async()=>{if(photoBusy||!onCapture)return;photoBusy=true;const status=$('slice-photo-status');status.hidden=false;status.textContent='Preparing image…';$('slice-photo').textContent='Preparing…';sync();try{const result=await onCapture();status.textContent='PNG prepared · '+result.width+' × '+result.height+' px'+(result.reduced?' · adjusted to device limits':'')+'.';}catch(e){status.textContent='Photo not saved. '+e.message;}finally{photoBusy=false;$('slice-photo').textContent='Photo Shot';sync();}};
 $('slice-exit').onclick=()=>{onChange({enabled:false});trigger.focus();};
 handle.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const s=getState();if(!s.slice||!s.enabled)return;e.preventDefault();e.stopPropagation();
  const controls=getControls(),anchor=s.slice.bounds.getCenter(new T.Vector3());anchor[s.axis]=s.slice.value;
  controls.stopMotion();const limits=sectionLimits(s.slice.bounds,s.axis);
  drag={id:e.pointerId,x:e.clientX,y:e.clientY,value:s.slice.value,basis:sectionDragBasis(getCamera(),anchor,s.axis,viewport.getBoundingClientRect(),limits.max-limits.min),controls,enabled:controls.enabled};
  controls.enabled=false;handle.setPointerCapture?.(e.pointerId);handle.classList.add('dragging');
 });
 handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();const {basis:b}=drag;coordinate(drag.value+((e.clientX-drag.x)*b.x+(e.clientY-drag.y)*b.y)*b.unitsPerPixel);});
 for(const name of ['pointerup','pointercancel','lostpointercapture'])handle.addEventListener(name,e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();e.stopPropagation();finish();});
 handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();e.stopPropagation();const s=getState();if(e.key==='Home'||e.key==='End')onChange({fraction:e.key==='Home'?0:1});else coordinate(s.slice.value+(['ArrowRight','ArrowUp'].includes(e.key)?1:-1)*(e.shiftKey?.1:.01));});
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onChange({enabled:false});trigger.focus();}});
 function sync(){
  const s=getState();panel.hidden=!s.enabled;trigger.setAttribute('aria-pressed',String(s.enabled));trigger.setAttribute('aria-expanded',String(s.enabled));
  if(!s.enabled||!s.show)finish();
  $('slice-scope').value=s.scope;$('slice-scope').options[0].disabled=!s.selectedAvailable&&s.scope!=='equipment';$('slice-axis').value=s.axis;
  $('slice-target').textContent=s.slice?s.label:'No visible geometry in this scope.';
  $('slice-selection').hidden=!s.canRetarget;$('slice-photo').disabled=photoBusy||!onCapture||!s.slice||s.captureReady===false;$('slice-photo').setAttribute('aria-busy',String(photoBusy));
  $('slice-position').value=Math.round(s.fraction*1000);$('slice-percent').textContent=Math.round(s.fraction*100)+'%';
  $('slice-flip').setAttribute('aria-pressed',String(s.flip));$('slice-guide').checked=s.show;
  for(const id of ['slice-position','slice-value','slice-minus','slice-plus','slice-flip','slice-reset'])$(id).disabled=!s.slice;
  if(s.slice){const limits=sectionLimits(s.slice.bounds,s.axis);$('slice-value').min=limits.min;$('slice-value').max=limits.max;if(document.activeElement!==$('slice-value'))$('slice-value').value=s.slice.value.toFixed(3);$('slice-value-label').textContent=s.axis.toUpperCase()+' coordinate (m)';const points=guide.geometry.attributes.position;s.slice.corners.forEach((p,i)=>points.setXYZ(i,p.x,p.y,p.z));points.needsUpdate=true;}
  draw();
 }
 function draw(){
  const s=getState();guide.visible=!!(s.enabled&&s.show&&s.slice);handle.hidden=!guide.visible;if(!guide.visible)return;
  const camera=getCamera(),anchor=s.slice.bounds.getCenter(new T.Vector3());anchor[s.axis]=s.slice.value;camera.updateMatrixWorld();const p=anchor.clone().project(camera);
  if(!Number.isFinite(p.x)||p.z < -1||p.z>1||Math.abs(p.x)>1||Math.abs(p.y)>1){handle.hidden=true;return;}
  handle.style.left=(viewport.offsetLeft+(p.x+1)*viewport.clientWidth/2)+'px';handle.style.top=(viewport.offsetTop+(1-p.y)*viewport.clientHeight/2)+'px';
  const limits=sectionLimits(s.slice.bounds,s.axis),basis=sectionDragBasis(camera,anchor,s.axis,viewport.getBoundingClientRect(),limits.max-limits.min);
  const angle=Math.atan2(basis.y,basis.x)*180/Math.PI;handle.style.setProperty('--handle-angle',angle+'deg');
  const hint=(basis.depth?'Drag the cyan handle up/down to move through depth.':'Drag the cyan handle along its arrow, or use the slider.')+' Cut faces are open.';if($('slice-hint').textContent!==hint)$('slice-hint').textContent=hint;
 }
 return {sync,draw,focus(){sync();$('slice-position').focus({preventScroll:true});},cancelDrag:finish,get dragging(){return !!drag;}};
}
