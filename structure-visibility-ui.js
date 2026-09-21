export function mountStructureVisibilityControls({root=document,visibility,onChange}){
 const byId=id=>root.getElementById(id),button=byId('structure-visibility-open'),panel=byId('structure-visibility-panel'),supports=byId('show-support-structures'),access=byId('show-access-structures'),status=byId('structure-visibility-status');
 function close(){panel.hidden=true;button.setAttribute('aria-expanded','false');}
 function sync(){const state=visibility.getState();supports.checked=state.supports;access.checked=state.access;const hidden=[!state.supports?'External supports hidden':'',!state.access?'External access hidden':''].filter(Boolean);status.textContent=hidden.join(' · ');status.hidden=!hidden.length;button.dataset.filtered=String(!!hidden.length);button.textContent=hidden.length?'Structures · hidden':'Structures';button.setAttribute('aria-label','Structure visibility'+(hidden.length?': '+hidden.join(', '):': all shown'));}
 supports.onchange=()=>onChange({supports:supports.checked});
 access.onchange=()=>onChange({access:access.checked});
 button.onclick=()=>{panel.hidden=!panel.hidden;button.setAttribute('aria-expanded',String(!panel.hidden));};
 root.addEventListener('pointerdown',e=>{if(!e.target.closest('.structure-visibility-control'))close();});
 root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden){close();button.focus();e.stopImmediatePropagation();}},true);
 sync();
 return {sync,close};
}
