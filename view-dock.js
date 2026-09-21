// The dock opens an existing task. Playback always belongs to that task's panel.
export function mountFlowToolButtons({root=document,getJourney,getThermal,onOpenPanel}){
 const entries={
  product:{button:root.getElementById('product-flow-open'),panel:root.getElementById('product-journey'),focus:'journey-preg',get:getJourney,label:'Product flow'},
  thermal:{button:root.getElementById('thermal-loops-open'),panel:root.getElementById('thermal-tracing'),focus:'thermal-consumer',get:getThermal,label:'Thermal loops'},
 };
 for(const [kind,e] of Object.entries(entries))e.button.onclick=()=>{
  const tool=e.get();if(!tool||e.button.disabled)return;
  // Do not seek, restart or pause a running trace just to reveal its controls.
  if(!tool.active||(kind==='thermal'&&tool.getState().kind==='process'))tool.enter(false);
  onOpenPanel(kind);e.panel.scrollIntoView({block:'start',behavior:'instant'});
  root.getElementById(e.focus).focus({preventScroll:true});
 };
 return {
  setAvailable(available){for(const [kind,e] of Object.entries(entries)){e.button.disabled=!available[kind];e.button.title=available[kind]?'Open '+e.label.toLowerCase()+' controls':e.label+' is unavailable in this design';}},
  setState(kind,{active,playing}){const e=entries[kind];e.button.setAttribute('aria-pressed',String(active));e.button.setAttribute('aria-label',e.label+(active?(playing?', playing':', paused'):''));},
 };
}

// Measure the actual wrapped dock, including enlarged text and status messages.
export function reserveDockSpace(toolbar,stage){
 // Padding belongs to the dock's border box, so count it exactly once.
 const height=Math.ceil(toolbar.getBoundingClientRect().height);
 const value=height+'px';
 if(stage.style.getPropertyValue('--stage-toolbar-space')!==value)stage.style.setProperty('--stage-toolbar-space',value);
 return height;
}
