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
 ctx.onBackground?.(stageBackground(bg));
 renderer.shadowMap.needsUpdate=true;ctx.requestRender();
 return s;
}
// 'light' or 'dark': used so the title text over the 3D view stays readable on any background colour.
export function stageBackground(color){return new T.Color(color).getHSL({}).l>.55?'light':'dark';}
export function loadDisplay(storage){try{return normalizeDisplay(JSON.parse(storage.getItem(DISPLAY_KEY)||'{}'));}catch(e){return normalizeDisplay({});}}
export function saveDisplay(storage,state){try{storage.setItem(DISPLAY_KEY,JSON.stringify(normalizeDisplay(state)));}catch(e){}}

const svg=d=>`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICON={
 cube:'<path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
 mode:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5a8.5 8.5 0 0 1 0 17" fill="currentColor"/>',
 palette:'<path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-1 1.5-2.2-.6-1.3.2-2.8 1.7-2.8H17a4 4 0 0 0 4-4A9 9 0 0 0 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10.5" cy="7.5" r="1"/><circle cx="15" cy="8" r="1"/>',
 exposure:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22"/>',
 angle:'<path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4h-4"/>',
 scale:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
 shadow:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>'
};
export const hexOf=c=>'#'+new T.Color(c).getHexString();
export function panelMarkup(state){
 const s=normalizeDisplay(state),opt=(v,l,cur)=>`<option value="${v}"${v===cur?' selected':''}>${l}</option>`,
  select=(id,icon,options,label)=>`<label class="display-select${icon?' has-icon':''}">${icon?svg(ICON[icon]):''}<select id="${id}" aria-label="${label}">${options}</select></label>`,
  num=(id,icon,label,min,max,step,unit)=>`<label class="display-num" title="${label}">${svg(ICON[icon])}<input id="${id}" type="number" min="${min}" max="${max}" step="${step}" aria-label="${label}"><span>${unit}</span></label>`,
  section=(title,body,open=true)=>`<details class="display-section"${open?' open':''}><summary>${title}</summary><div class="display-body">${body}</div></details>`;
 return `<div class="display-heading"><h2 id="display-heading">Display</h2><span><button id="display-reset" type="button" aria-label="Reset display settings" title="Reset display settings">↺</button><button id="display-close" type="button" aria-label="Close display settings">×</button></span></div>
${select('display-mode','mode',DISPLAY_MODES.map(m=>opt(m.id,m.label,s.mode)).join(''),'Display mode')}<p id="display-mode-help" class="display-note"></p>
<div class="display-row2">${select('display-theme','sun',opt('system','System','')+opt('light','Light','')+opt('dark','Dark',''),'Theme')}${select('display-projection','cube',opt('engineering','Orthographic','')+opt('studio','Perspective',''),'Projection')}</div>
${section('Surfaces',select('display-colour','palette',opt('material','Physical appearance','')+opt('status','Design status','')+opt('flow','Flow routes',''),'Colour viewing mode')+'<div id="display-scheme-row" hidden>'+select('display-scheme','palette',opt('pfd','PFD categories','')+opt('detailed','Detailed services','')+opt('asme','ASME A13.1 pipe identification',''),'Pipe colour scheme')+'</div>')}
${section('Grid','<label class="display-check"><input id="display-grid" type="checkbox"> Show ground grid</label>',false)}
${section('Lighting',select('display-preset','',Object.entries(DISPLAY_PRESETS).map(([k,p])=>opt(k,p.label,'')).join('')+opt('custom','Custom',''),'Lighting preset')+'<div class="display-row2">'+num('display-exposure','exposure','Exposure',-3,3,.1,'EV')+num('display-angle','angle','Light angle',-180,180,5,'°')+num('display-intensity','scale','Light intensity',.25,2,.05,'×')+num('display-shadow','shadow','Shadow strength',0,100,5,'%')+'</div>')}
${section('Background',`<div class="display-colour-row"><input id="display-bg" type="color" value="${s.background}" aria-label="Background colour"><input id="display-bg-text" type="text" maxlength="7" spellcheck="false" placeholder="Auto" aria-label="Background colour code (empty for Auto, which follows the theme)"></div>`)}
${section('Floor',`<div class="display-colour-row"><input id="display-floor" type="color" value="${s.floor}" aria-label="Floor colour"><input id="display-floor-text" type="text" maxlength="7" spellcheck="false" placeholder="Auto" aria-label="Floor colour code (empty for Auto, which follows the theme)"></div>`+select('display-finish','',opt('matte','Matte',s.finish)+opt('satin','Satin',s.finish)+opt('gloss','Gloss',s.finish),'Floor finish'))}`;
}

export function mountDisplayPanel({doc=document,storage=localStorage,theme=window.rgoTheme,sceneCtx,getMode,setMode,gridToggle,onChange}={}){
 const views=doc.querySelector('.stage .views');if(!views)return null;
 let state=loadDisplay(storage);
 sceneCtx.onBackground=b=>{doc.documentElement.dataset.stageBg=b;};
 const open=doc.createElement('button');open.id='display-open';open.type='button';open.className='display-open';open.setAttribute('aria-haspopup','dialog');open.setAttribute('aria-controls','display-panel');open.setAttribute('aria-expanded','false');open.title='Display settings';open.innerHTML=svg(ICON.cube)+'<span>Display</span>';views.append(open);
 const panel=doc.createElement('aside');panel.id='display-panel';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-labelledby','display-heading');panel.innerHTML=panelMarkup(state);views.parentElement.append(panel);
 const $=id=>panel.querySelector('#'+id),show=v=>{panel.hidden=!v;open.setAttribute('aria-expanded',String(v));if(v)sync();};
 const apply=(next,save=true)=>{state=applyDisplay(next,sceneCtx);if(save)saveDisplay(storage,state);sync();onChange?.(state);};
 const existing=id=>doc.getElementById(id),HEX=/^#?[0-9a-fA-F]{6}$/;
 const sync=()=>{
  const set=(id,v)=>{const e=$(id);if(e&&doc.activeElement!==e)e.value=v;};
  $('display-mode').value=state.mode;$('display-mode-help').textContent=DISPLAY_MODES.find(m=>m.id===state.mode).help;$('display-preset').value=matchPreset(state);
  set('display-exposure',state.exposure.toFixed(1));set('display-angle',String(state.angle));set('display-intensity',state.intensity.toFixed(2));set('display-shadow',String(Math.round(state.shadow*100)));
  const colours=sceneCtx.themeColors();
  $('display-bg').value=state.bgAuto?hexOf(colours.bg):state.background;set('display-bg-text',state.bgAuto?'':state.background.toUpperCase());
  $('display-floor').value=state.floorAuto?hexOf(colours.ground):state.floor;set('display-floor-text',state.floorAuto?'':state.floor.toUpperCase());$('display-finish').value=state.finish;
  $('display-theme').value=theme?.get?.()||'system';$('display-projection').value=getMode?.()==='studio'?'studio':'engineering';if(gridToggle)$('display-grid').checked=gridToggle.checked;
  const mode=existing('color-mode'),scheme=existing('flow-scheme');if(mode)$('display-colour').value=mode.value;$('display-scheme-row').hidden=!(mode&&mode.value==='flow'&&scheme);if(scheme)$('display-scheme').value=scheme.value;
 };
 open.onclick=()=>show(panel.hidden);$('display-close').onclick=()=>{show(false);open.focus();};
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){show(false);open.focus();e.stopPropagation();}});
 $('display-reset').onclick=()=>{theme?.set?.('system');apply(DISPLAY_DEFAULTS);};
 $('display-mode').onchange=e=>apply({...state,mode:e.target.value});
 $('display-preset').onchange=e=>apply(applyPreset(state,e.target.value));
 for(const [id,key,scale] of [['display-exposure','exposure',1],['display-angle','angle',1],['display-intensity','intensity',1],['display-shadow','shadow',.01]]){
  $(id).oninput=e=>{if(e.target.value!==''&&Number.isFinite(+e.target.value))apply({...state,[key]:+e.target.value*scale});};
  $(id).onchange=()=>sync();
 }
 const colourField=(swatch,text,key,autoKey)=>{
  $(swatch).oninput=e=>apply({...state,[key]:e.target.value,[autoKey]:false});
  $(text).onchange=e=>{const v=e.target.value.trim();if(v===''||/^auto$/i.test(v))apply({...state,[autoKey]:true});else if(HEX.test(v))apply({...state,[key]:v.startsWith('#')?v:'#'+v,[autoKey]:false});else sync();};
 };
 colourField('display-bg','display-bg-text','background','bgAuto');colourField('display-floor','display-floor-text','floor','floorAuto');
 $('display-finish').onchange=e=>apply({...state,finish:e.target.value});
 $('display-theme').onchange=e=>{theme?.set?.(e.target.value);};
 $('display-projection').onchange=e=>setMode?.(e.target.value);
 $('display-colour').onchange=e=>{const m=existing('color-mode');if(m){m.value=e.target.value;m.dispatchEvent(new Event('change',{bubbles:true}));}sync();};
 $('display-scheme').onchange=e=>{const m=existing('flow-scheme');if(m){m.value=e.target.value;m.dispatchEvent(new Event('change',{bubbles:true}));}};
 for(const id of ['color-mode','flow-scheme'])existing(id)?.addEventListener('change',sync);
 if(gridToggle){$('display-grid').onchange=e=>{if(gridToggle.checked!==e.target.checked)gridToggle.click();};gridToggle.addEventListener('change',sync);}
 const host=doc.querySelector('#view-settings-dialog .view-settings');
 if(host){const link=doc.createElement('button');link.type='button';link.id='display-from-settings';link.className='wide';link.textContent='Display settings: lighting, background, floor';link.onclick=()=>{const dlg=doc.getElementById('view-settings-dialog');if(dlg?.open)dlg.close();show(true);};host.prepend(link);}
 doc.defaultView?.addEventListener('themechange',()=>apply(state,false));
 if(typeof MutationObserver!=='undefined')for(const id of ['engineering-mode','studio-mode']){const el=doc.getElementById(id);if(el)new MutationObserver(sync).observe(el,{attributes:true,attributeFilter:['aria-pressed']});}
 apply(state,false);
 return {get state(){return state;},apply,show,panel,open};
}
