// Focus mode: hides the top bar, left menu and toolbars so the 3D model fills the
// window. Toggle with the Focus button or the F key. Tools reopens the toolbar.
(function(){
 var root=document.documentElement,on=false,wasCollapsed=false;
 function resized(){window.dispatchEvent(new Event('resize'));}
 function click(id){var b=document.getElementById(id);if(b&&!b.hidden)b.click();}
 function sync(){
  ['focus-toggle','focus-exit'].forEach(function(id){var b=document.getElementById(id);if(b)b.setAttribute('aria-pressed',String(on));});
  var t=document.getElementById('focus-tools');if(t)t.setAttribute('aria-pressed',String(root.classList.contains('focus-tools')));
 }
 function set(value){
  if(value===on)return;on=value;
  if(on){wasCollapsed=document.body.classList.contains('navigation-collapsed');if(!wasCollapsed)click('sidebar-collapse');root.classList.add('focus-mode');}
  else{root.classList.remove('focus-mode','focus-tools');if(!wasCollapsed)click('sidebar-expand');}
  sync();resized();
 }
 function tools(){root.classList.toggle('focus-tools');sync();resized();}
 function mount(){
  var actions=document.querySelector('header .header-actions'),stage=document.querySelector('.stage');
  if(!actions||!stage||document.getElementById('focus-toggle'))return;
  var b=document.createElement('button');b.id='focus-toggle';b.type='button';b.textContent='Focus';b.title='Full-window model view (F)';b.setAttribute('aria-pressed','false');b.onclick=function(){set(!on);};
  actions.prepend(b);
  var bar=document.createElement('div');bar.id='focus-bar';
  bar.innerHTML='<button id="focus-exit" type="button" aria-pressed="false" title="Leave focus mode (F)">Exit focus</button><button id="focus-tools" type="button" aria-pressed="false" title="Show or hide the toolbar">Tools</button>';
  stage.append(bar);
  bar.querySelector('#focus-exit').onclick=function(){set(false);};bar.querySelector('#focus-tools').onclick=tools;
 }
 document.addEventListener('keydown',function(e){
  if(e.key!=='f'&&e.key!=='F')return;if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
  var t=e.target,tag=t&&t.tagName;if(tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA'||(t&&t.isContentEditable))return;
  if(document.querySelector('dialog[open]'))return;
  e.preventDefault();set(!on);
 });
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
