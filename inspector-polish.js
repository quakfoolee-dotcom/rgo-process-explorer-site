// Inspector readability, phase 1: fold a long description behind "Show more". The description comes from one text field
// (the record's geometry status) and is long for a few records; the first lines stay visible, the rest on request.
(function(){
 var LIMIT=260;
 function init(){
  var p=document.getElementById('part-description');if(!p||document.getElementById('part-description-toggle'))return;
  var btn=document.createElement('button');btn.type='button';btn.id='part-description-toggle';btn.className='fold-toggle';btn.hidden=true;btn.setAttribute('aria-controls','part-description');p.after(btn);
  function label(){var open=p.classList.contains('is-open');btn.textContent=open?'Show less':'Show more';btn.setAttribute('aria-expanded',String(open));}
  function sync(){var long=p.textContent.length>LIMIT;p.classList.toggle('is-folded',long);if(!long){p.classList.remove('is-open');btn.hidden=true;return;}btn.hidden=false;label();}
  btn.onclick=function(){p.classList.toggle('is-open');label();};
  new MutationObserver(function(){p.classList.remove('is-open');sync();}).observe(p,{childList:true,characterData:true,subtree:true});
  sync();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
