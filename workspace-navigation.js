// Navigation changes browsing context; physical visibility and safety origins
// remain owned by their existing tools.
import {TOOL_LABELS,TOOL_WORKSPACE} from './workspace-model.js';
export {TOOL_LABELS,TOOL_WORKSPACE};
const floating=new Set(['walk','browse','forklift','measure','section']);
const panels=['process','tree','systems','product','thermal','routes','section','clashes','access','supports','containment'];
export function mountWorkspaceNavigation({root=document,onPanel,onArea,onResize=()=>{},onApply,configuration,areas,initialPanel='process'}){
 const $=id=>root.getElementById(id),tabs=[...root.querySelectorAll('[data-workspace]')],buttons=[...root.querySelectorAll('[data-tool]')];
 const remembered={process:'process',equipment:'tree',inspect:'inspect-home',safety:'safety'},scroll={};
 let current=initialPanel,workspace=TOOL_WORKSPACE[current]||'process',toolsVisible=false;
 function collapsed(value){root.body.classList.toggle('navigation-collapsed',value);$('navigation-sidebar').hidden=value;$('sidebar-expand').hidden=!value;$('sidebar-collapse').setAttribute('aria-expanded',String(!value));$('sidebar-expand').setAttribute('aria-expanded',String(!value));onResize();}
 function syncLaunches(){for(const b of buttons){const trigger=$(b.dataset.launch);if(!trigger)continue;b.disabled=trigger.disabled;b.setAttribute('aria-pressed',String(trigger.getAttribute('aria-pressed')==='true'||trigger.getAttribute('aria-expanded')==='true'));}
  if(floating.has(current)){const b=buttons.find(b=>b.dataset.tool===current),t=$(b?.dataset.launch),open=t?.getAttribute('aria-expanded')==='true';$('inspection-floating-note').textContent=open?'Controls are open beside the 3D model.':'Open the controls to continue this inspection.';$('inspection-reopen').textContent=open?'Show controls':'Open controls';}
 }
 function showPanel(name,{home=false}={}){
  scroll[current]=$('sidebar-content').scrollTop;current=name;workspace=TOOL_WORKSPACE[name]||'process';remembered[workspace]=name;toolsVisible=home||name==='inspect-home';
  for(const b of tabs){const selected=b.dataset.workspace===workspace;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1;$('workspace-'+b.dataset.workspace).hidden=!selected;}
  for(const id of panels){const panel=$('panel-'+id);if(panel)panel.hidden=id!==name||toolsVisible;}
  if(workspace==='equipment')$('equipment-tool').value=name;
  $('inspect-tool').value=workspace==='inspect'?name:remembered.inspect;
  $('inspection-tool-list').hidden=!toolsVisible;$('inspection-active').hidden=toolsVisible;
  if($('safety-home'))$('safety-home').hidden=name==='containment';if($('safety-containment-view'))$('safety-containment-view').hidden=name!=='containment';
  $('inspection-active-title').textContent=TOOL_LABELS[name]||'';
  $('inspection-floating-note').hidden=!floating.has(name);$('inspection-reopen').hidden=!floating.has(name);
  $('inspection-scope-controls').hidden=!['routes','clashes'].includes(name)||toolsVisible;
  $('nav-area-help').textContent=workspace==='safety'?'Safety routes use the work position in their panel.':'Filters browsing lists. Model visibility stays separate.';
  for(const b of buttons)b.classList.toggle('selected-tool',b.dataset.tool===name);
  const accessButton=$('access-maintenance-open');if(accessButton)accessButton.setAttribute('aria-pressed',String(name==='access'));
  $('sidebar-content').scrollTop=scroll[name]||0;syncLaunches();
 }
 function select(name){onPanel(name);showPanel(name);}
 function launch(button){
  const trigger=$(button.dataset.launch),name=button.dataset.tool;
  if(trigger){if(trigger.disabled)return;
   // Reopening an active task must not toggle it off or restart playback.
   const isOpen=trigger.getAttribute('aria-expanded')==='true';
   if(!isOpen)trigger.click();
   const panel=$(trigger.getAttribute('aria-controls'));if(panel){panel.classList.remove('panel-minimized');const minimize=panel.querySelector('.panel-minimize');if(minimize){minimize.textContent='−';minimize.setAttribute('aria-expanded','true');minimize.setAttribute('aria-label','Minimize controls');minimize.title='Minimize controls';}}
  }
  select(name);
 }
 for(const b of buttons)b.onclick=()=>launch(b);
 for(const b of tabs){b.onclick=()=>select(remembered[b.dataset.workspace]);b.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const i=tabs.indexOf(b),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[n].click();tabs[n].focus();};}
 if($('safety-home-back'))$('safety-home-back').onclick=()=>select('safety');
 $('inspection-tools-back').onclick=()=>select('inspect-home');
 $('inspection-reopen').onclick=()=>{const b=buttons.find(b=>b.dataset.tool===current);if(b)launch(b);};
 for(const a of areas){const o=root.createElement('option');o.value=a.id;o.textContent=a.label;$('nav-area').append(o);}
 $('nav-area').onchange=()=>onArea($('nav-area').value);
 $('sidebar-collapse').onclick=()=>{collapsed(true);$('sidebar-expand').focus();};$('sidebar-expand').onclick=()=>{collapsed(false);tabs.find(b=>b.dataset.workspace===workspace)?.focus();};
 function resetConfiguration(){$('a160-design').value=configuration.a160;$('argon-source').value=configuration.argonSource;$('model-setup-apply').disabled=true;}
 const dialogs=[['model-setup','model-setup-dialog'],['view-settings','view-settings-dialog'],['resources','resources-dialog']];
 for(const [prefix,id]of dialogs){const d=$(id),opener=$(prefix+'-open');opener.onclick=()=>{if(prefix==='model-setup')resetConfiguration();syncViews();d.showModal();};for(const b of d.querySelectorAll('[data-close-dialog]'))b.onclick=()=>d.close();d.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();d.close();}});d.addEventListener('close',()=>{if(prefix==='model-setup')resetConfiguration();opener.focus({preventScroll:true});});}
 for(const id of ['a160-design','argon-source'])$(id).onchange=()=>{$('model-setup-apply').disabled=$('a160-design').value===configuration.a160&&$('argon-source').value===configuration.argonSource;};
 $('model-setup-apply').onclick=()=>onApply({a160:$('a160-design').value,argonSource:$('argon-source').value});
 $('nav-model-status').textContent=configuration.label+' · draft';
 $('resources-configuration').onclick=()=>$('download-configuration').click();
 const viewLinks={'view-area-labels':'area-markings-toggle','view-equipment-labels':'equipment-label-toggle','view-supports':'show-support-structures','view-access':'show-access-structures','view-walkways':'walkways-toggle'};
 function syncViews(){for(const [id,target]of Object.entries(viewLinks)){const t=$(target);$(id).disabled=!t||t.disabled;$(id).checked=!!t&&(t.type==='checkbox'?t.checked:t.getAttribute('aria-pressed')==='true');}}
 for(const [id,target]of Object.entries(viewLinks))$(id).onchange=()=>{const t=$(target);if(!t)return;if(t.type==='checkbox'){t.checked=$(id).checked;t.dispatchEvent(new Event('change',{bubbles:true}));}else if((t.getAttribute('aria-pressed')==='true')!==$(id).checked)t.click();syncViews();};
 // Shortcuts and tool-owned controls share state; no second player or selection.
 const triggerMap={'product-flow-open':'product','thermal-loops-open':'thermal','forklift-tracing-open':'forklift','browse-plant':'browse','walk-plant':'walk','fire-safety-open':'fire','emergency-stations-open':'emergency','measure':'measure','cutaway':'section'};
 for(const [id,name]of Object.entries(triggerMap))$(id).addEventListener('click',()=>{if(!$(id).disabled){onPanel(name);showPanel(name);}});
 const observer=new MutationObserver(()=>{syncLaunches();syncViews();const safety=buttons.filter(b=>['fire','emergency','pedestrian'].includes(b.dataset.tool)&&b.getAttribute('aria-pressed')==='true');$('safety-tool-status').textContent=safety.length?safety.map(b=>TOOL_LABELS[b.dataset.tool]).join(' · ')+' controls open':'';});
 for(const id of new Set([...Object.keys(triggerMap),'walkways-settings',...Object.values(viewLinks)])){const t=$(id);if(t)observer.observe(t,{attributes:true,attributeFilter:['aria-pressed','aria-expanded','disabled']});}
 showPanel(initialPanel);syncViews();
 return {showPanel,get current(){return current;},get area(){return $('nav-area').value;},destroy:()=>observer.disconnect()};
}
