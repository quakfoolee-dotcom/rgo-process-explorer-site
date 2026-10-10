// Colour theme (System / Light / Dark). Applies before first paint, like ui-size.js.
// Sets html[data-theme=dark|light]; System (the default since V341) follows the operating system and changes live with it.
// theme-light.css (generated) and theme.css restyle the page for light; app.js listens for 'themechange' to recolour the 3D scene.
// Preference is per browser (localStorage 'rgo-theme': system, light or dark). window.rgoTheme.get()/set() expose it to the Display panel.
(function(){
 var KEY='rgo-theme',root=document.documentElement,LABEL={system:'System',dark:'Dark',light:'Light'},query=window.matchMedia?window.matchMedia('(prefers-color-scheme: light)'):null,pref='system';
 function read(){try{var v=localStorage.getItem(KEY);return v==='light'||v==='dark'||v==='system'?v:'system';}catch(e){return 'system';}}
 function resolve(p){return p==='system'?(query&&query.matches?'light':'dark'):p;}
 function apply(p,save){
  pref=p;var v=resolve(p);root.setAttribute('data-theme-pref',p);
  root.setAttribute('data-theme',v);
  var meta=document.querySelector('meta[name=theme-color]');if(meta)meta.setAttribute('content',v==='light'?'#dde6ee':'#111c26');
  if(save){try{localStorage.setItem(KEY,p);}catch(e){}}
  window.dispatchEvent(new Event('themechange'));sync();
 }
 function sync(){
  var cur=root.getAttribute('data-theme'),next=cur==='light'?'dark':'light';
  var btn=document.getElementById('theme-toggle');
  if(btn){btn.textContent=cur==='light'?'☀ Light':'☾ Dark';btn.setAttribute('aria-label','Switch to '+LABEL[next]+' mode');btn.title='Switch to '+LABEL[next]+' mode';}
  document.querySelectorAll('#theme-control button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.theme===pref));});
 }
 pref=read();root.setAttribute('data-theme-pref',pref);root.setAttribute('data-theme',resolve(pref));
 if(query){var follow=function(){if(pref==='system')apply('system',false);};if(query.addEventListener)query.addEventListener('change',follow);else if(query.addListener)query.addListener(follow);}
 window.rgoTheme={get:function(){return pref;},set:function(p){if(p==='system'||p==='light'||p==='dark')apply(p,true);}};
 function mount(){
  var actions=document.querySelector('.header-actions');
  if(actions&&!document.getElementById('theme-toggle')){
   var t=document.createElement('button');t.id='theme-toggle';t.type='button';
   t.onclick=function(){apply(root.getAttribute('data-theme')==='light'?'dark':'light',true);};
   actions.prepend(t);
  }
  var host=document.querySelector('#view-settings-dialog .view-settings');
  if(host&&!document.getElementById('theme-control')){
   var box=document.createElement('div');box.id='theme-control';box.setAttribute('role','group');box.setAttribute('aria-labelledby','theme-label');
   box.innerHTML='<span id="theme-label" class="field-label">COLOR THEME</span><div class="tool-row"></div><p class="small-note">System follows your computer, or choose a dark or light interface and 3D background. Saved in this browser.</p>';
   var row=box.querySelector('.tool-row');
   ['system','dark','light'].forEach(function(k){var b=document.createElement('button');b.type='button';b.textContent=LABEL[k];b.dataset.theme=k;b.onclick=function(){apply(k,true);};row.append(b);});
   host.prepend(box);
  }
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
