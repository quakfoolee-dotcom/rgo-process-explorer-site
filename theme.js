// Colour theme (Dark / Light). Applies before first paint, like ui-size.js.
// Sets html[data-theme=dark|light]; dark is the default. theme-light.css (generated) and theme.css
// restyle the page for light; app.js listens for 'themechange' to recolour the 3D scene.
// Preference is per browser (localStorage 'rgo-theme').
(function(){
 var KEY='rgo-theme',root=document.documentElement,LABEL={dark:'Dark',light:'Light'};
 function read(){try{var v=localStorage.getItem(KEY);return v==='light'||v==='dark'?v:'dark';}catch(e){return 'dark';}}
 function apply(v,save){
  root.setAttribute('data-theme',v);
  var meta=document.querySelector('meta[name=theme-color]');if(meta)meta.setAttribute('content',v==='light'?'#dde6ee':'#111c26');
  if(save){try{localStorage.setItem(KEY,v);}catch(e){}}
  window.dispatchEvent(new Event('themechange'));sync();
 }
 function sync(){
  var cur=root.getAttribute('data-theme'),next=cur==='light'?'dark':'light';
  var btn=document.getElementById('theme-toggle');
  if(btn){btn.textContent=cur==='light'?'☀ Light':'☾ Dark';btn.setAttribute('aria-label','Switch to '+LABEL[next]+' mode');btn.title='Switch to '+LABEL[next]+' mode';}
  document.querySelectorAll('#theme-control button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.theme===cur));});
 }
 root.setAttribute('data-theme',read());
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
   box.innerHTML='<span id="theme-label" class="field-label">COLOR THEME</span><div class="tool-row"></div><p class="small-note">Dark or light interface and 3D background. Saved in this browser.</p>';
   var row=box.querySelector('.tool-row');
   ['dark','light'].forEach(function(k){var b=document.createElement('button');b.type='button';b.textContent=LABEL[k];b.dataset.theme=k;b.onclick=function(){apply(k,true);};row.append(b);});
   host.prepend(box);
  }
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
