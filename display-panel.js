// Display panel (V341): a floating panel opened from the cube button beside the Iso / Front / Side / Top views.
// It holds the "how it looks" settings: display mode, theme, projection, lighting, background and floor, saved in this browser.
// The pure parts (state, presets, applyDisplay) are exported for tests; mountDisplayPanel builds the panel on the page.
import * as T from './vendor/three.module.js';

export const DISPLAY_KEY='rgo-display';
export const DISPLAY_DEFAULTS=Object.freeze({mode:'render',exposure:0,angle:0,intensity:1,shadow:1,bgAuto:true,background:'#ffffff',floorAuto:true,floor:'#e7e7e5',finish:'matte'});
export const DISPLAY_MODES=[{id:'render',label:'Render',help:'Lit and reflective, as the model is normally drawn.'},{id:'solid',label:'Solid',help:'Plain matte colours without reflections, easier to read.'}];
export const DISPLAY_PRESETS={
 preview:{label:'Preview',values:{exposure:0,angle:0,intensity:1,shadow:1,bgAuto:true,floorAuto:true,finish:'matte'}},
 studio:{label:'Studio',values:{exposure:.3,angle:-25,intensity:1.1,shadow:.45,bgAuto:false,background:'#ffffff',floorAuto:false,floor:'#e7e7e5',finish:'matte'}},
 daylight:{label:'Daylight',values:{exposure:.5,angle:35,intensity:1.15,shadow:.8,bgAuto:true,floorAuto:true,finish:'matte'}}
};
export const FLOOR_FINISH={matte:{roughness:.7,metalness:.22},satin:{roughness:.4,metalness:.1},gloss:{roughness:.15,metalness:.05}};
const PRESET_KEYS=['exposure','angle','intensity','shadow','bgAuto','floorAuto','finish'];
const COLOR=/^#[0-9a-fA-F]{6}$/,clamp=(v,lo,hi,d)=>Number.isFinite(+v)?Math.min(hi,Math.max(lo,+v)):d;

export function normalizeDisplay(input={}){
 const d=DISPLAY_DEFAULTS,i=input&&typeof input==='object'?input:{};
 return {mode:DISPLAY_MODES.some(m=>m.id===i.mode)?i.mode:d.mode,exposure:clamp(i.exposure,-3,3,d.exposure),angle:clamp(i.angle,-180,180,d.angle),intensity:clamp(i.intensity,.25,2,d.intensity),shadow:clamp(i.shadow,0,1,d.shadow),
  bgAuto:typeof i.bgAuto==='boolean'?i.bgAuto:d.bgAuto,background:COLOR.test(i.background)?i.background.toLowerCase():d.background,floorAuto:typeof i.floorAuto==='boolean'?i.floorAuto:d.floorAuto,floor:COLOR.test(i.floor)?i.floor.toLowerCase():d.floor,finish:FLOOR_FINISH[i.finish]?i.finish:d.finish};
}
// Name of the preset the lighting, background and floor settings match, or 'custom'.
export function matchPreset(state){
 const s=normalizeDisplay(state);
 for(const [id,p] of Object.entries(DISPLAY_PRESETS)){const v=normalizeDisplay({...DISPLAY_DEFAULTS,...p.values});
  if(PRESET_KEYS.every(k=>s[k]===v[k])&&(s.bgAuto||s.background===v.background)&&(s.floorAuto||s.floor===v.floor))return id;}
 return 'custom';
}
export function applyPreset(state,id){const p=DISPLAY_PRESETS[id];return p?normalizeDisplay({...state,...p.values}):normalizeDisplay(state);}

// Remember what the scene looked like before any display setting touched it.
export function captureDisplayBase({scene,renderer,ground}){
 const lights=[];scene.traverse(o=>{if(o.isDirectionalLight)lights.push({light:o,kind:'directional',intensity:o.intensity,position:o.position.clone(),target:o.target.position.clone()});else if(o.isHemisphereLight)lights.push({light:o,kind:'hemisphere',intensity:o.intensity});});
 return {lights,exposure:renderer.toneMappingExposure,environment:scene.environmentIntensity??1,groundRoughness:ground.material.roughness,groundMetalness:ground.material.metalness};
}
const SOLID_FIELDS=['metalness','roughness','envMapIntensity','roughnessMap','bumpMap','clearcoat','clearcoatRoughness'];
function applySolid(meshes,solid,saved){
 for(const mesh of meshes){const m=mesh.material;if(!m||m.transparent&&m.opacity<1)continue;
  if(solid){if(!saved.has(m))saved.set(m,Object.fromEntries(SOLID_FIELDS.filter(k=>k in m).map(k=>[k,m[k]])));
   const before=m.roughnessMap||m.bumpMap;m.metalness=.04;m.roughness=.9;m.envMapIntensity=.55;m.roughnessMap=null;m.bumpMap=null;if('clearcoat'in m)m.clearcoat=0;if(before)m.needsUpdate=true;}
  else if(saved.has(m)){const before=saved.get(m);const changed=(before.roughnessMap||before.bumpMap)&&!(m.roughnessMap||m.bumpMap);Object.assign(m,before);if(changed)m.needsUpdate=true;saved.delete(m);}
 }
}
// Applies the state to the scene. ctx: {scene,renderer,ground,keyLight,meshes,base,themeColors,saved,requestRender}.
export function applyDisplay(raw,ctx){
 const s=normalizeDisplay(raw),{scene,renderer,ground,keyLight,base}=ctx,rad=s.angle*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad);
 renderer.toneMappingExposure=base.exposure*2**s.exposure;
 for(const e of base.lights){
  e.light.intensity=e.intensity*s.intensity;
  if(e.kind==='directional'){const x=e.position.x-e.target.x,z=e.position.z-e.target.z;e.light.position.set(e.target.x+x*cos-z*sin,e.position.y,e.target.z+x*sin+z*cos);e.light.target.position.copy(e.target);}
 }
 if('environmentIntensity'in scene)scene.environmentIntensity=base.environment*s.intensity;
 if(scene.environmentRotation)scene.environmentRotation.y=-rad;
 if(keyLight?.shadow)keyLight.shadow.intensity=s.shadow;
 const theme=ctx.themeColors();
 const bg=s.bgAuto?theme.bg:s.background;scene.background.set(bg);renderer.setClearColor(bg);
 ground.material.color.set(s.floorAuto?theme.ground:s.floor);
 const f=FLOOR_FINISH[s.finish];ground.material.roughness=s.finish==='matte'?base.groundRoughness:f.roughness;ground.material.metalness=s.finish==='matte'?base.groundMetalness:f.metalness;
 applySolid(ctx.meshes,s.mode==='solid',ctx.saved);
 renderer.shadowMap.needsUpdate=true;ctx.requestRender();
 return s;
}
export function loadDisplay(storage){try{return normalizeDisplay(JSON.parse(storage.getItem(DISPLAY_KEY)||'{}'));}catch(e){return normalizeDisplay({});}}
export function saveDisplay(storage,state){try{storage.setItem(DISPLAY_KEY,JSON.stringify(normalizeDisplay(state)));}catch(e){}}

const CUBE='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>';
export function panelMarkup(state){
 const s=normalizeDisplay(state),opt=(v,l,cur)=>`<option value="${v}"${v===cur?' selected':''}>${l}</option>`,slider=(id,label,min,max,step,val,unit)=>`<label class="display-slider" for="${id}"><span>${label}</span><output id="${id}-out">${unit(val)}</output><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${val}"></label>`;
 return `<div class="display-heading"><h2 id="display-heading">Display</h2><span><button id="display-reset" type="button" aria-label="Reset display settings" title="Reset display settings">↺</button><button id="display-close" type="button" aria-label="Close display settings">×</button></span></div>
<div class="display-block"><label class="display-field"><span>Display mode</span><select id="display-mode">${DISPLAY_MODES.map(m=>opt(m.id,m.label,s.mode)).join('')}</select></label><p id="display-mode-help" class="display-note"></p>
<div class="display-pair"><label class="display-field"><span>Theme</span><select id="display-theme">${opt('system','System','')}${opt('light','Light','')}${opt('dark','Dark','')}</select></label><label class="display-field"><span>Projection</span><select id="display-projection">${opt('engineering','Orthographic','')}${opt('studio','Perspective','')}</select></label></div></div>
<details class="display-block" id="display-grid-block"><summary>Grid</summary><label class="display-check"><input id="display-grid" type="checkbox"> Show ground grid</label></details>
<details class="display-block" open><summary>Lighting</summary><label class="display-field"><span>Preset</span><select id="display-preset">${Object.entries(DISPLAY_PRESETS).map(([k,p])=>opt(k,p.label,'')).join('')}${opt('custom','Custom','')}</select></label>
${slider('display-exposure','Exposure',-3,3,.1,s.exposure,v=>(v>0?'+':'')+(+v).toFixed(1)+' EV')}${slider('display-angle','Light angle',-180,180,5,s.angle,v=>v+'°')}${slider('display-intensity','Light intensity',.25,2,.05,s.intensity,v=>(+v).toFixed(2)+'×')}${slider('display-shadow','Shadow strength',0,1,.05,s.shadow,v=>Math.round(v*100)+'%')}</details>
<details class="display-block" open><summary>Background</summary><label class="display-check"><input id="display-bg-auto" type="checkbox"${s.bgAuto?' checked':''}> Auto (follows the theme)</label><label class="display-colour"><span>Colour</span><input id="display-bg" type="color" value="${s.background}"></label></details>
<details class="display-block" open><summary>Floor</summary><label class="display-check"><input id="display-floor-auto" type="checkbox"${s.floorAuto?' checked':''}> Auto (follows the theme)</label><label class="display-colour"><span>Colour</span><input id="display-floor" type="color" value="${s.floor}"></label><label class="display-field"><span>Finish</span><select id="display-finish">${opt('matte','Matte',s.finish)}${opt('satin','Satin',s.finish)}${opt('gloss','Gloss',s.finish)}</select></label></details>`;
}

export function mountDisplayPanel({doc=document,storage=localStorage,theme=window.rgoTheme,sceneCtx,getMode,setMode,gridToggle,onChange}={}){
 const views=doc.querySelector('.stage .views');if(!views)return null;
 let state=loadDisplay(storage);
 const open=doc.createElement('button');open.id='display-open';open.type='button';open.className='display-open';open.setAttribute('aria-haspopup','dialog');open.setAttribute('aria-controls','display-panel');open.setAttribute('aria-expanded','false');open.title='Display settings';open.setAttribute('aria-label','Display settings');open.innerHTML=CUBE;views.append(open);
 const panel=doc.createElement('aside');panel.id='display-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','display-heading');panel.innerHTML=panelMarkup(state);views.parentElement.append(panel);
 const $=id=>panel.querySelector('#'+id),show=v=>{panel.hidden=!v;open.setAttribute('aria-expanded',String(v));};
 const apply=(next,save=true)=>{state=applyDisplay(next,sceneCtx);if(save)saveDisplay(storage,state);sync();onChange?.(state);};
 const sync=()=>{
  $('display-mode').value=state.mode;$('display-mode-help').textContent=DISPLAY_MODES.find(m=>m.id===state.mode).help;
  $('display-preset').value=matchPreset(state);$('display-exposure').value=state.exposure;$('display-angle').value=state.angle;$('display-intensity').value=state.intensity;$('display-shadow').value=state.shadow;
  $('display-exposure-out').textContent=(state.exposure>0?'+':'')+state.exposure.toFixed(1)+' EV';$('display-angle-out').textContent=state.angle+'°';$('display-intensity-out').textContent=state.intensity.toFixed(2)+'×';$('display-shadow-out').textContent=Math.round(state.shadow*100)+'%';
  $('display-bg-auto').checked=state.bgAuto;$('display-bg').value=state.background;$('display-bg').disabled=state.bgAuto;$('display-floor-auto').checked=state.floorAuto;$('display-floor').value=state.floor;$('display-floor').disabled=state.floorAuto;$('display-finish').value=state.finish;
  $('display-theme').value=theme?.get?.()||'system';$('display-projection').value=getMode?.()==='studio'?'studio':'engineering';if(gridToggle)$('display-grid').checked=gridToggle.checked;
 };
 open.onclick=()=>show(panel.hidden);$('display-close').onclick=()=>{show(false);open.focus();};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){show(false);open.focus();e.stopPropagation();}});
 $('display-reset').onclick=()=>{theme?.set?.('system');apply(DISPLAY_DEFAULTS);};
 $('display-mode').onchange=e=>apply({...state,mode:e.target.value});
 $('display-preset').onchange=e=>apply(applyPreset(state,e.target.value));
 for(const [id,key] of [['display-exposure','exposure'],['display-angle','angle'],['display-intensity','intensity'],['display-shadow','shadow']])$(id).oninput=e=>apply({...state,[key]:+e.target.value});
 $('display-bg-auto').onchange=e=>apply({...state,bgAuto:e.target.checked});$('display-bg').oninput=e=>apply({...state,background:e.target.value,bgAuto:false});
 $('display-floor-auto').onchange=e=>apply({...state,floorAuto:e.target.checked});$('display-floor').oninput=e=>apply({...state,floor:e.target.value,floorAuto:false});$('display-finish').onchange=e=>apply({...state,finish:e.target.value});
 $('display-theme').onchange=e=>{theme?.set?.(e.target.value);};
 $('display-projection').onchange=e=>setMode?.(e.target.value);
 if(gridToggle){$('display-grid').onchange=e=>{if(gridToggle.checked!==e.target.checked)gridToggle.click();};gridToggle.addEventListener('change',sync);}
 doc.defaultView?.addEventListener('themechange',()=>apply(state,false));
 if(typeof MutationObserver!=='undefined')for(const id of ['engineering-mode','studio-mode']){const el=doc.getElementById(id);if(el)new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['aria-pressed']});}
 apply(state,false);
 return {get state(){return state;},apply,show,panel,open};
}
