// Dims the view label (e.g. "ORTHOGRAPHIC · ISOMETRIC") a few seconds after it
// last changed, so it does not cover the model. Any change shows it again.
(function(){
 var DELAY=4000,timer=null;
 function title(){return document.querySelector('.stage-title');}
 function show(){var t=title();if(!t)return;t.classList.remove('dim');clearTimeout(timer);timer=setTimeout(function(){t.classList.add('dim');},DELAY);}
 function mount(){
  var t=title();if(!t||t.dataset.fade)return;t.dataset.fade='1';
  new MutationObserver(show).observe(t,{childList:true,characterData:true,subtree:true});
  t.addEventListener('pointerenter',function(){t.classList.remove('dim');clearTimeout(timer);});
  t.addEventListener('pointerleave',show);
  show();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
