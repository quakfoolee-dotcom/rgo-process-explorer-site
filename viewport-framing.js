// Available canvas rectangle after visible side panels. Pure screen geometry;
// never changes model dimensions, routes or assessment reservations.
export function clearViewportRect(view,panels){
 let left=view.left,right=view.right;
 for(const p of panels){
  if(p.height<100||p.bottom<=view.top||p.top>=view.bottom)continue;
  if(p.left<view.left+view.width*.25)left=Math.max(left,Math.min(p.right+16,view.right));
  else if(p.right>view.right-view.width*.25)right=Math.min(right,Math.max(p.left-16,view.left));
 }
 if(right-left<view.width*.2)return {left:view.left,right:view.right,top:view.top,bottom:view.bottom,width:view.width,height:view.height};
 return {left,right,top:view.top,bottom:view.bottom,width:right-left,height:view.height};
}
export function mountPanelMinimizers(root=document){
 const ids=['walk-panel','transport-review','fire-safety-panel','emergency-station-panel','measure-panel','section-inspector','walkway-panel'];
 function attach(panel){const heading=panel?.firstElementChild;if(!heading||heading.querySelector('.panel-minimize'))return;
  const b=root.createElement('button');b.type='button';b.className='panel-minimize';b.textContent='−';b.setAttribute('aria-label','Minimize controls');b.title='Minimize controls';b.setAttribute('aria-expanded','true');
  b.onclick=()=>{const small=panel.classList.toggle('panel-minimized');b.textContent=small?'+':'−';b.setAttribute('aria-expanded',String(!small));b.setAttribute('aria-label',small?'Restore controls':'Minimize controls');b.title=small?'Restore controls':'Minimize controls';};const close=[...heading.querySelectorAll('button')].find(node=>node.textContent.trim()==='×');if(close){const actions=root.createElement('span');actions.className='panel-window-actions';close.before(actions);actions.append(b,close);}else heading.append(b);
 }
 const observer=new MutationObserver(()=>{for(const id of ids)attach(root.getElementById(id));});
 for(const id of ids){const p=root.getElementById(id);if(p){attach(p);observer.observe(p,{childList:true});}}
 return ()=>observer.disconnect();
}
