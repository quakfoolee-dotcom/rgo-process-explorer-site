// Interface size (S / M / L). Applies before first paint; the control is added
// to View settings once the dialog exists. Preference is per browser.
(function(){
 var KEY='rgo-ui-size',SIZES=[['s','Small'],['m','Standard'],['l','Large']],root=document.documentElement;
 function read(){try{var v=localStorage.getItem(KEY);return v==='s'||v==='m'||v==='l'?v:'m';}catch(e){return 'm';}}
 function apply(v){root.setAttribute('data-ui-size',v);try{localStorage.setItem(KEY,v);}catch(e){}window.dispatchEvent(new Event('resize'));}
 root.setAttribute('data-ui-size',read());
 function mount(){
  var host=document.querySelector('#view-settings-dialog .view-settings');if(!host||document.getElementById('ui-size-control'))return;
  var box=document.createElement('div');box.id='ui-size-control';box.setAttribute('role','group');box.setAttribute('aria-labelledby','ui-size-label');
  box.innerHTML='<span id="ui-size-label" class="field-label">INTERFACE SIZE</span><div class="tool-row"></div><p class="small-note">Text and button size. Small leaves the most room for the 3D model. Touch screens keep large touch targets.</p>';
  var row=box.querySelector('.tool-row');
  SIZES.forEach(function(s){var b=document.createElement('button');b.type='button';b.textContent=s[1];b.dataset.size=s[0];b.onclick=function(){apply(s[0]);sync();};row.append(b);});
  function sync(){var cur=root.getAttribute('data-ui-size');row.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.size===cur));});}
  host.prepend(box);sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
